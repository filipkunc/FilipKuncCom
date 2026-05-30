/// <reference types="vite/client" />
/// <reference types="@webgpu/types" />

// WGSL shaders are real files, imported as strings via Vite's `?raw` suffix so
// the same text the post excerpts is the text the renderer compiles.
declare module '*.wgsl?raw' {
  const source: string;
  export default source;
}
