// The C++ layer is thin on purpose: translate V8 values <-> C strings,
// enforce the ownership contract, and nothing else. All real work is in Rust.
#include <nan.h>

#include <string>

// The C ABI exported by rust/src/lib.rs. No header is generated for two
// functions; for a bigger surface, generate this block with cbindgen.
extern "C" {
char* oxc_analyze(const char* source, const char* filename);
void oxc_free_string(char* ptr);
}

// #region glue
// analyzeJson(source: string, filename?: string) -> string (JSON report)
NAN_METHOD(AnalyzeJson) {
    if (info.Length() < 1 || !info[0]->IsString()) {
        return Nan::ThrowTypeError("analyzeJson(source, filename?) expects a string source");
    }

    Nan::Utf8String source(info[0]);

    std::string filename = "input.js";
    if (info.Length() > 1 && info[1]->IsString()) {
        Nan::Utf8String name(info[1]);
        filename.assign(*name, static_cast<size_t>(name.length()));
    }

    // Rust allocates the result; we must give it back to Rust to free.
    // Never free() a Rust allocation: the allocators may not match.
    char* json = oxc_analyze(*source, filename.c_str());
    v8::Local<v8::String> result = Nan::New(json).ToLocalChecked();
    oxc_free_string(json);

    info.GetReturnValue().Set(result);
}
// #endregion glue

NAN_MODULE_INIT(Init) {
    Nan::Set(target,
             Nan::New("analyzeJson").ToLocalChecked(),
             Nan::GetFunction(Nan::New<v8::FunctionTemplate>(AnalyzeJson)).ToLocalChecked());
}

NODE_MODULE(corrosion_oxc_nan, Init)
