use flate2::write::{ZlibDecoder, ZlibEncoder};
use flate2::Compression;
use napi::bindgen_prelude::*;
use napi_derive::napi;
use std::io::Write;

// Pure core (flate2, whose default backend is miniz_oxide), unit-tested below.
fn deflate(data: &[u8], level: u32) -> Vec<u8> {
  let mut e = ZlibEncoder::new(Vec::new(), Compression::new(level));
  e.write_all(data).unwrap();
  e.finish().unwrap()
}
fn inflate(data: &[u8]) -> std::io::Result<Vec<u8>> {
  let mut d = ZlibDecoder::new(Vec::new());
  d.write_all(data)?;
  d.finish()
}

#[napi(object)]
pub struct CompressOptions {
  pub level: Option<u32>,
}
fn level_of(o: Option<CompressOptions>) -> u32 {
  o.and_then(|o| o.level).unwrap_or(6)
}

// #region marshalling
#[napi]
pub fn compress(input: Buffer, opts: Option<CompressOptions>) -> Buffer {
  deflate(&input, level_of(opts)).into()
}

#[napi]
pub fn decompress(input: Buffer) -> Result<Buffer> {
  inflate(&input)
    .map(Into::into)
    .map_err(|e| Error::from_reason(e.to_string()))
}
// #endregion marshalling

// #region async
// An async fn becomes a Promise on the JS side; spawn_blocking moves the CPU
// work off the runtime onto a thread.
#[napi]
pub async fn compress_async(input: Buffer, opts: Option<CompressOptions>) -> Result<Buffer> {
  let level = level_of(opts);
  let data = input.to_vec();
  let out = tokio::task::spawn_blocking(move || deflate(&data, level))
    .await
    .map_err(|e| Error::from_reason(e.to_string()))?;
  Ok(out.into())
}
// #endregion async

// #region lifecycle
#[napi]
pub struct Deflater {
  enc: Option<ZlibEncoder<Vec<u8>>>,
}

#[napi]
impl Deflater {
  #[napi(constructor)]
  pub fn new(opts: Option<CompressOptions>) -> Self {
    Deflater { enc: Some(ZlibEncoder::new(Vec::new(), Compression::new(level_of(opts)))) }
  }

  #[napi]
  pub fn push(&mut self, chunk: Buffer) -> Result<Buffer> {
    let enc = self.enc.as_mut().ok_or_else(|| Error::from_reason("finished"))?;
    enc.write_all(&chunk).map_err(|e| Error::from_reason(e.to_string()))?;
    let produced: Vec<u8> = enc.get_mut().drain(..).collect();
    Ok(produced.into())
  }

  #[napi]
  pub fn finish(&mut self) -> Result<Buffer> {
    let enc = self.enc.take().ok_or_else(|| Error::from_reason("already finished"))?;
    Ok(enc.finish().map_err(|e| Error::from_reason(e.to_string()))?.into())
  }

  // Explicit, idempotent cleanup: drop the encoder now instead of waiting for GC.
  #[napi]
  pub fn dispose(&mut self) {
    drop(self.enc.take());
  }

  // napi.rs has no native Symbol.dispose, so bind it to dispose() from Rust.
  // Call once after construction; then `using d = ...` frees deterministically.
  #[napi]
  pub fn register_disposer(&self, env: Env, mut this: This) -> Result<()> {
    // Symbol is a function, so read it unchecked, then grab the well-known
    // Symbol.dispose value and assign this[Symbol.dispose] = this.dispose.
    let symbol: Object = env.get_global()?.get_named_property_unchecked("Symbol")?;
    let dispose_key: Unknown = symbol.get_named_property("dispose")?;
    let dispose_fn: Function = this.get_named_property("dispose")?;
    this.set_property(dispose_key, dispose_fn)?;
    Ok(())
  }
}

// GC safety net via the Drop trait. flate2's ZlibEncoder already implements Drop,
// so the encoder frees itself when the struct is collected even if nobody called
// dispose(); for a raw FFI handle this is where you would free it.
impl Drop for Deflater {
  fn drop(&mut self) {
    drop(self.enc.take());
  }
}
// #endregion lifecycle

// #region rust-test
#[cfg(test)]
mod tests {
  use super::{deflate, inflate};

  #[test]
  fn round_trips() {
    let data = b"hello miniz ".repeat(500);
    let packed = deflate(&data, 6);
    assert!(packed.len() < data.len());
    assert_eq!(inflate(&packed).unwrap(), data);
  }

  #[test]
  fn higher_level_is_not_larger() {
    let data = b"abcdefgh".repeat(2000);
    assert!(deflate(&data, 9).len() <= deflate(&data, 1).len());
  }

  #[test]
  fn inflate_rejects_garbage() {
    assert!(inflate(&[0xde, 0xad, 0xbe, 0xef]).is_err());
  }
}
// #endregion rust-test
