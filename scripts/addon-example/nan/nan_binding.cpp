#include <nan.h>
#include "deflate.hpp"

// #region nan-marshalling
NAN_METHOD(Compress) {
  uint8_t *data = (uint8_t *) node::Buffer::Data(info[0]);
  size_t len = node::Buffer::Length(info[0]);
  int32_t level = 6;
  if (info.Length() > 1 && info[1]->IsObject()) {
    auto opts = Nan::To<v8::Object>(info[1]).ToLocalChecked();
    auto key = Nan::New("level").ToLocalChecked();
    if (Nan::Has(opts, key).FromJust())
      level = Nan::To<int32_t>(Nan::Get(opts, key).ToLocalChecked()).FromJust();
  }
  try {
    auto out = fastdeflate::deflate(data, len, level);
    info.GetReturnValue().Set(Nan::CopyBuffer((char *) out.data(), out.size()).ToLocalChecked());
  } catch (const std::exception &e) {
    Nan::ThrowError(e.what());
  }
}
// #endregion nan-marshalling

NAN_METHOD(Decompress) {
  uint8_t *data = (uint8_t *) node::Buffer::Data(info[0]);
  size_t len = node::Buffer::Length(info[0]);
  try {
    auto out = fastdeflate::inflate(data, len);
    info.GetReturnValue().Set(Nan::CopyBuffer((char *) out.data(), out.size()).ToLocalChecked());
  } catch (const std::exception &e) {
    Nan::ThrowError(e.what());
  }
}

NAN_MODULE_INIT(Init) {
  Nan::Set(target, Nan::New("compress").ToLocalChecked(),
    Nan::GetFunction(Nan::New<v8::FunctionTemplate>(Compress)).ToLocalChecked());
  Nan::Set(target, Nan::New("decompress").ToLocalChecked(),
    Nan::GetFunction(Nan::New<v8::FunctionTemplate>(Decompress)).ToLocalChecked());
}
NODE_MODULE(nan_deflate, Init)
