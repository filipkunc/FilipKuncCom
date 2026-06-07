{
  "targets": [{
    "target_name": "nan_deflate",
    "sources": [ "nan_binding.cpp", "../cpp/deflate.cpp", "../vendor/miniz.c" ],
    "include_dirs": [
      "<!(node -p \"require('path').dirname(require.resolve('nan/nan.h'))\")",
      "../cpp", "../vendor"
    ],
    "defines": [ "MINIZ_NO_ZLIB_COMPATIBLE_NAMES" ],
    "cflags_cc": [ "-fexceptions" ],
    "cflags_cc!": [ "-fno-exceptions" ]
  }]
}
