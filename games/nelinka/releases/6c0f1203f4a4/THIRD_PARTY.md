# Browser runtime

The browser build uses wgpu 29.0.4 and egui/eframe 0.34.3 (MIT/Apache-2.0),
compiled from the versions pinned in Cargo.lock. Its JavaScript glue is generated
by wasm-bindgen-cli 0.2.129, matching the Rust wasm-bindgen dependency.

Upstream projects:
- https://github.com/gfx-rs/wgpu
- https://github.com/emilk/egui
- https://github.com/wasm-bindgen/wasm-bindgen

The retired Macroquad/Miniquad loader, plugins and patched egui adapter are no
longer distributed. Browser storage uses a typed wasm-bindgen bridge, and audio
uses the browser WebAudio API. No external CDN or network service is required.

Original puppy art, fonts and sound provenance remain in the existing assets
notices; this renderer change does not relicense them.
