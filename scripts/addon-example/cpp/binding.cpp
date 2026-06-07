#include <napi.h>
#include "deflate.hpp"
#include "miniz.h"

using namespace Napi;

// #region marshalling
// `info` carries the JS call: info[0] is the first argument, info.Env() the
// current environment. Pull an optional { level } from the second argument.
static int32_t read_level(const CallbackInfo &info, size_t idx) {
  int32_t level = 6;
  if (info.Length() > idx && info[idx].IsObject()) {
    Object o = info[idx].As<Object>();
    if (o.Has("level")) level = o.Get("level").As<Number>().Int32Value();
  }
  return level;
}

// compress(input: Buffer, opts?: { level?: number }): Buffer
Value Compress(const CallbackInfo &info) {
  Env env = info.Env();
  auto input = info[0].As<Buffer<uint8_t>>();
  try {
    auto out = fastdeflate::deflate(input.Data(), input.Length(), read_level(info, 1));
    return Buffer<uint8_t>::Copy(env, out.data(), out.size());
  } catch (const std::exception &e) {
    throw Error::New(env, e.what());
  }
}
// #endregion marshalling

Value Decompress(const CallbackInfo &info) {
  Env env = info.Env();
  auto input = info[0].As<Buffer<uint8_t>>();
  try {
    auto out = fastdeflate::inflate(input.Data(), input.Length());
    return Buffer<uint8_t>::Copy(env, out.data(), out.size());
  } catch (const std::exception &e) {
    throw Error::New(env, e.what());
  }
}

// #region async
// Copy the bytes out of V8, compress on a libuv worker thread, resolve on the JS thread.
class CompressWorker : public AsyncWorker {
  std::vector<uint8_t> input_, output_;
  int32_t level_;
  Promise::Deferred deferred_;

public:
  CompressWorker(Napi::Env env, std::vector<uint8_t> in, int32_t level)
      : AsyncWorker(env), input_(std::move(in)), level_(level),
        deferred_(Promise::Deferred::New(env)) {}

  Promise GetPromise() { return deferred_.Promise(); }

  void Execute() override {  // worker thread: no V8 calls allowed here
    output_ = fastdeflate::deflate(input_.data(), input_.size(), level_);
  }
  void OnOK() override {     // back on the JS thread
    deferred_.Resolve(Buffer<uint8_t>::Copy(Env(), output_.data(), output_.size()));
  }
  void OnError(const Error &e) override { deferred_.Reject(e.Value()); }
};

// compressAsync(input: Buffer, opts?): Promise<Buffer>
Value CompressAsync(const CallbackInfo &info) {
  auto input = info[0].As<Buffer<uint8_t>>();
  std::vector<uint8_t> copy(input.Data(), input.Data() + input.Length());
  auto *w = new CompressWorker(info.Env(), std::move(copy), read_level(info, 1));
  w->Queue();
  return w->GetPromise();
}
// #endregion async

// #region lifecycle
// A streaming handle that owns an mz_stream. ObjectWrap frees it in the
// destructor, which the runtime runs as a finalizer when the JS object is GC'd.
static std::vector<uint8_t> drain(Napi::Env env, mz_stream &s,
                                  const uint8_t *in, size_t len, int32_t flush) {
  std::vector<uint8_t> out;
  unsigned char buf[16384];
  s.next_in = in;
  s.avail_in = static_cast<unsigned int>(len);
  int32_t rc;
  do {
    s.next_out = buf;
    s.avail_out = sizeof(buf);
    rc = mz_deflate(&s, flush);
    if (rc != MZ_OK && rc != MZ_STREAM_END && rc != MZ_BUF_ERROR)
      throw Error::New(env, std::string("deflate failed: ") + mz_error(rc));
    out.insert(out.end(), buf, buf + (sizeof(buf) - s.avail_out));
  } while (s.avail_out == 0 || (flush == MZ_FINISH && rc != MZ_STREAM_END));
  return out;
}

class Deflater : public ObjectWrap<Deflater> {
  mz_stream strm_{};
  bool active_ = false;

public:
  static Object Init(Napi::Env env, Object exports);

  Deflater(const CallbackInfo &info) : ObjectWrap<Deflater>(info) {
    int32_t level = 6;
    if (info.Length() > 0 && info[0].IsObject()) {
      Object o = info[0].As<Object>();
      if (o.Has("level")) level = o.Get("level").As<Number>().Int32Value();
    }
    if (mz_deflateInit(&strm_, level) != MZ_OK)
      throw Error::New(info.Env(), "deflateInit failed");
    active_ = true;
  }

  ~Deflater() {  // finalizer: runs when the JS object is collected
    if (active_) mz_deflateEnd(&strm_);
  }

  Napi::Value Push(const CallbackInfo &info) {
    auto chunk = info[0].As<Buffer<uint8_t>>();
    auto out = drain(info.Env(), strm_, chunk.Data(), chunk.Length(), MZ_NO_FLUSH);
    return Buffer<uint8_t>::Copy(info.Env(), out.data(), out.size());
  }

  Napi::Value Finish(const CallbackInfo &info) {
    auto out = drain(info.Env(), strm_, nullptr, 0, MZ_FINISH);
    mz_deflateEnd(&strm_);
    active_ = false;
    return Buffer<uint8_t>::Copy(info.Env(), out.data(), out.size());
  }

  // [Symbol.dispose]: deterministic cleanup for `using`. Idempotent, so it is
  // safe whether or not finish() already ran.
  Napi::Value Dispose(const CallbackInfo &info) {
    if (active_) { mz_deflateEnd(&strm_); active_ = false; }
    return info.Env().Undefined();
  }
};

Object Deflater::Init(Napi::Env env, Object exports) {
  Function f = DefineClass(env, "Deflater", {
      InstanceMethod("push", &Deflater::Push),
      InstanceMethod("finish", &Deflater::Finish),
      InstanceMethod(Symbol::WellKnown(env, "dispose"), &Deflater::Dispose),
  });
  exports.Set("Deflater", f);
  return exports;
}
// #endregion lifecycle

Object Init(Napi::Env env, Object exports) {
  exports.Set("compress", Function::New(env, Compress));
  exports.Set("decompress", Function::New(env, Decompress));
  exports.Set("compressAsync", Function::New(env, CompressAsync));
  Deflater::Init(env, exports);
  return exports;
}

NODE_API_MODULE(fast_deflate, Init)
