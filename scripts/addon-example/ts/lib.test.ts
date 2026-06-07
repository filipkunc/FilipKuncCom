// #region ava-test
import test from "ava";
import zlib from "node:zlib";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

// the two real addons built by this workspace
const addons: Record<string, any> = {
  cpp: require("../cpp/build/fast_deflate.node"),
  rust: require("../rust/index.js"),
};

for (const [name, m] of Object.entries(addons)) {
  test(`${name}: compress round-trips`, (t) => {
    const input = Buffer.from("hello miniz ".repeat(500));
    const packed = m.compress(input, { level: 6 });
    t.true(packed.length < input.length);
    t.deepEqual(m.decompress(packed), input);
  });

  test(`${name}: compressAsync resolves a Buffer`, async (t) => {
    const input = Buffer.from("async ".repeat(1000));
    const packed = await m.compressAsync(input);
    t.deepEqual(m.decompress(packed), input);
  });

  test(`${name}: Deflater streams chunks`, (t) => {
    const d = new m.Deflater({ level: 9 });
    const out = Buffer.concat([d.push(Buffer.from("aaaa")), d.push(Buffer.from("bbbb")), d.finish()]);
    t.deepEqual(m.decompress(out), Buffer.from("aaaabbbb"));
  });

  test(`${name}: output is standard zlib`, (t) => {
    const input = Buffer.from("interop ".repeat(200));
    t.deepEqual(zlib.inflateSync(m.compress(input)), input);  // Node's own zlib reads it
  });
}

// NaN exposes only the sync API (it is the legacy binding), so test just that.
const nan = require("../nan/build/Release/nan_deflate.node");
test("nan: compress round-trips and is standard zlib", (t) => {
  const input = Buffer.from("hello nan ".repeat(300));
  const packed = nan.compress(input, { level: 6 });
  t.deepEqual(nan.decompress(packed), input);
  t.deepEqual(zlib.inflateSync(packed), input);
});

// `using` calls the handle's [Symbol.dispose] at scope end: deterministic cleanup,
// no waiting for the GC finalizer.
test("cpp: using disposes the Deflater handle", (t) => {
  let out: Buffer;
  {
    using d = new addons.cpp.Deflater({ level: 9 });
    out = Buffer.concat([d.push(Buffer.from("aaaa")), d.finish()]);
  }
  t.deepEqual(addons.cpp.decompress(out), Buffer.from("aaaa"));
  t.is(typeof new addons.cpp.Deflater()[Symbol.dispose], "function");
});

// napi.rs binds Symbol.dispose from Rust (registerDisposer), so `using` works natively.
const newDeflater = (opts?: { level?: number }) => {
  const d = new addons.rust.Deflater(opts);
  d.registerDisposer();
  return d;
};
test("rust: using disposes via native registerDisposer", (t) => {
  let out: Buffer;
  {
    using d = newDeflater({ level: 9 });
    out = Buffer.concat([d.push(Buffer.from("bbbb")), d.finish()]);
  }
  t.deepEqual(addons.rust.decompress(out), Buffer.from("bbbb"));
  t.is(typeof newDeflater()[Symbol.dispose], "function");
});
// #endregion ava-test
