// How the built addon is loaded and called from TypeScript.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

declare const bigText: Buffer, chunkA: Buffer, chunkB: Buffer;

// #region usage
// C/C++ (Node-API or NaN): require the built .node
const { compressAsync, Deflater } = require("./build/fast_deflate.node");

// one-shot, runs off the event loop
const packed: Buffer = await compressAsync(bigText, { level: 6 });

// streaming handle. `using` calls its [Symbol.dispose] at the end of this scope,
// freeing the native state deterministically instead of waiting for the GC.
using d = new Deflater({ level: 9 });
const out: Buffer = Buffer.concat([d.push(chunkA), d.push(chunkB), d.finish()]);
// #endregion usage

// #region usage-rust
// napi.rs generates index.js with full TypeScript types from the Rust signatures.
import { Deflater as RsDeflater, compressAsync as rsCompress } from "fast-deflate";
const rsPacked: Buffer = await rsCompress(bigText, { level: 6 });

// napi.rs binds Symbol.dispose from Rust; call registerDisposer() once, then `using`.
function newDeflater(opts?: { level?: number }) {
  const d = new RsDeflater(opts);
  d.registerDisposer();
  return d;
}
using rd = newDeflater({ level: 9 });
rd.push(chunkA);
// #endregion usage-rust
