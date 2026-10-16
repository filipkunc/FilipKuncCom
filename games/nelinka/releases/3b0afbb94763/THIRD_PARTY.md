# Vendored web loader

`mq_js_bundle.js` is vendored from the published Macroquad 0.4.16 crate
(upstream commit `5e9b5ca912ac65962c05c0da842a4a70eaae34b9`). Upstream:
https://github.com/not-fl3/macroquad/tree/5e9b5ca912ac65962c05c0da842a4a70eaae34b9/js

The crate's `LICENSE-MIT` and `LICENSE-APACHE` are retained alongside it.
The loader matches the Rust dependency pinned in Cargo.toml / Cargo.lock.

One local correction in the quad_net registration closure: declare the local
`register_plugin` with `var` and terminate that declaration with a semicolon
before calling `miniquad_add_plugin`. The published minified bundle otherwise
assigns an undeclared identifier under strict mode, causing a ReferenceError.
No networking plugin is used by Nelinka.

The editor uses egui 0.31.1 through egui-macroquad 0.17.3 and egui-miniquad
0.16.0 (MIT/Apache-2.0). The browser plugins `quad-url.js` and `sapp_jsutils.js`
are copied without changes from the published quad-url 0.1.3 and sapp-jsutils
0.1.7 crates. Their source repositories are https://github.com/optozorax/quad-url
and https://github.com/not-fl3/sapp-jsutils. The quad-url MIT notice is retained
in `LICENSE-quad-url-MIT`; sapp-jsutils is available under Apache-2.0, retained
in `LICENSE-APACHE`. `build.rs` permits only the used legacy extern imports
listed in `egui-imports.txt`; these plugins and the bundled quad-snd WebAudio
plugin supply them at startup. Audio uses Macroquad’s optional `audio` feature
with the quad-snd version pinned in Cargo.lock.

The egui-macroquad adapter is vendored in `vendor/egui-macroquad` with its
MIT/Apache notices and a documented modifier-event ordering fix.
