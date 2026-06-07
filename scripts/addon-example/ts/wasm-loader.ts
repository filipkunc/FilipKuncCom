import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const bytes = readFileSync(fileURLToPath(new URL("../wasm/fast_deflate.wasm", import.meta.url)));
// emcc's standalone libc imports a few wasi calls we never hit at runtime; stub them.
const wasi = { fd_close: () => 0, fd_write: () => 0, fd_seek: () => 0 };
const wasm = new WebAssembly.Instance(
  new WebAssembly.Module(bytes), { wasi_snapshot_preview1: wasi },
).exports as any;

// #region wasm-marshalling
// wasm has no Buffer type: copy bytes into linear memory, pass offsets, copy out.
export function compress(input: Uint8Array, level = 6): Buffer {
  const inPtr = wasm.malloc(input.length);
  new Uint8Array(wasm.memory.buffer, inPtr, input.length).set(input);

  const lenPtr = wasm.malloc(4);
  const outPtr = wasm.compress(inPtr, input.length, level, lenPtr);
  const outLen = new Int32Array(wasm.memory.buffer, lenPtr, 1)[0];
  const out = Buffer.from(new Uint8Array(wasm.memory.buffer, outPtr, outLen)); // copies out

  wasm.free(inPtr); wasm.free(lenPtr); wasm.free(outPtr);
  return out;
}
// #endregion wasm-marshalling

export function decompress(input: Uint8Array): Buffer {
  const inPtr = wasm.malloc(input.length);
  new Uint8Array(wasm.memory.buffer, inPtr, input.length).set(input);
  const lenPtr = wasm.malloc(4);
  const outPtr = wasm.decompress(inPtr, input.length, lenPtr);
  const outLen = new Int32Array(wasm.memory.buffer, lenPtr, 1)[0];
  const out = Buffer.from(new Uint8Array(wasm.memory.buffer, outPtr, outLen));
  wasm.free(inPtr); wasm.free(lenPtr); wasm.free(outPtr);
  return out;
}
