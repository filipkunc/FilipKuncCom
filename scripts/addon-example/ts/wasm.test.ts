import test from "ava";
import zlib from "node:zlib";
import * as wasmDeflate from "./wasm-loader.js";

test("wasm: compress round-trips", (t) => {
  const input = Buffer.from("hello wasm ".repeat(500));
  const packed = wasmDeflate.compress(input, 6);
  t.true(packed.length < input.length);
  t.deepEqual(wasmDeflate.decompress(packed), input);
});

test("wasm: output is standard zlib", (t) => {
  const input = Buffer.from("interop ".repeat(200));
  t.deepEqual(zlib.inflateSync(wasmDeflate.compress(input)), input);
});
