// oxc, compiled to wasm (wasm32-unknown-unknown), driving the AST explorer.
//
// The .wasm is built from the in-repo Rust crate at scripts/ast-explorer (see
// scripts/ast-explorer/build-oxc-wasm.sh) and committed under its dist/. It
// instantiates with no imports (no WASI), so a plain fetch + WebAssembly.instantiate
// is all the glue needed. Memory protocol per call: alloc a buffer, write UTF-8 in,
// call the entry point, which returns a packed (len << 32n | ptr) pointing at a
// tagged result buffer (byte 0 = 1 ok / 0 error, rest is UTF-8). Free both.
//
// `warmup()` resolves the module once; after that every call is synchronous, so
// the timing harness can run the full round trip in a tight loop.

import wasmUrl from '../../../scripts/ast-explorer/dist/oxc_wasm_web.wasm?url';

interface Exports {
  memory: WebAssembly.Memory;
  oxc_alloc(len: number): number;
  oxc_free(ptr: number, len: number): void;
  oxc_parse_json(ptr: number, len: number): bigint;
  oxc_transform(ptr: number, len: number, prefixPtr: number, prefixLen: number): bigint;
  oxc_transform_map(ptr: number, len: number, prefixPtr: number, prefixLen: number): bigint;
}

export interface EngineResult {
  ok: boolean;
  /** ESTree JSON (parse) or generated code (transform), or the diagnostic text. */
  text: string;
}

export interface MapResult {
  ok: boolean;
  /** Generated code, or the diagnostic text when `ok` is false. */
  code: string;
  /** Source map JSON (v3), empty on error. */
  map: string;
}

let exportsPromise: Promise<Exports> | null = null;
let ex: Exports | null = null;

/** Fetch + compile the wasm. Resolves once; after that the sync calls work. */
export function warmup(): Promise<Exports> {
  if (!exportsPromise) {
    exportsPromise = fetch(wasmUrl)
      .then((r) => r.arrayBuffer())
      .then((bytes) => WebAssembly.instantiate(bytes, {}))
      .then(({ instance }) => (ex = instance.exports as unknown as Exports));
  }
  return exportsPromise;
}

export function isReady(): boolean {
  return ex !== null;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Re-read on every call: the buffer detaches when wasm memory grows.
function mem(): Uint8Array {
  return new Uint8Array(ex!.memory.buffer);
}

function writeStr(s: string): [number, number] {
  const buf = encoder.encode(s);
  const ptr = ex!.oxc_alloc(buf.length);
  mem().set(buf, ptr);
  return [ptr, buf.length];
}

function readResult(packed: bigint): EngineResult {
  const ptr = Number(packed & 0xffffffffn);
  const len = Number(packed >> 32n);
  const slice = mem().slice(ptr, ptr + len);
  ex!.oxc_free(ptr, len);
  return { ok: slice[0] === 1, text: decoder.decode(slice.subarray(1)) };
}

/** Parse to ESTree JSON. Requires a prior `warmup()`. */
export function parseSync(source: string): EngineResult {
  const [p, l] = writeStr(source);
  const out = readResult(ex!.oxc_parse_json(p, l));
  ex!.oxc_free(p, l);
  return out;
}

/** Strip types + rewrite bare imports (if prefix). Requires a prior `warmup()`. */
export function transformSync(source: string, prefix = ''): EngineResult {
  const [p, l] = writeStr(source);
  const [pp, pl] = writeStr(prefix);
  const out = readResult(ex!.oxc_transform(p, l, pp, pl));
  ex!.oxc_free(p, l);
  ex!.oxc_free(pp, pl);
  return out;
}

/** Transform and also return a source map. Requires a prior `warmup()`. The wasm
 * packs `code\0mapJson`; split on the first NUL (generated JS has none). */
export function transformMapSync(source: string, prefix = ''): MapResult {
  const [p, l] = writeStr(source);
  const [pp, pl] = writeStr(prefix);
  const { ok, text } = readResult(ex!.oxc_transform_map(p, l, pp, pl));
  ex!.oxc_free(p, l);
  ex!.oxc_free(pp, pl);
  if (!ok) return { ok: false, code: text, map: '' };
  const nul = text.indexOf('\0');
  return { ok: true, code: text.slice(0, nul), map: text.slice(nul + 1) };
}

export async function parse(source: string): Promise<EngineResult> {
  await warmup();
  return parseSync(source);
}

export async function transform(source: string, prefix = ''): Promise<EngineResult> {
  await warmup();
  return transformSync(source, prefix);
}
