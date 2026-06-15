//! The oxc transform behind the in-browser AST explorer, plus a tiny C ABI so
//! JavaScript can drive it. Compiled to `wasm32-unknown-unknown` (no WASI), so
//! it instantiates with no imports and a plain fetch + WebAssembly.instantiate
//! is all the glue the page needs. See ../../src/lib/ast-explorer/oxc-engine.ts.

use std::path::Path;

use oxc::allocator::{Allocator, IntoIn};
use oxc::ast::ast::{Program, Statement};
use oxc::codegen::{Codegen, CodegenOptions};
use oxc::parser::Parser;
use oxc::semantic::SemanticBuilder;
use oxc::span::SourceType;
use oxc::transformer::{TransformOptions, Transformer};
use oxc_estree::{ESTree, PrettyTSSerializer};

/// Transform options shared by every pass. The one non-default is
/// `only_remove_type_imports` (TypeScript's `verbatimModuleSyntax`): strip
/// `import type`, but keep unused *value* imports instead of eliding them. That
/// keeps the rewrite honest, so `import process from 'node:process'` survives
/// even when unused, matching what a plain JS rewriter (the Acorn side) would do.
fn transform_options() -> TransformOptions {
    let mut options = TransformOptions::default();
    options.typescript.only_remove_type_imports = true;
    options
}

/// One pass: parse, optional import rewrite, strip TS types, codegen. Returns
/// the generated code or the collected diagnostics. Never panics or exits, so it
/// is safe to call from wasm.
pub fn try_transform(
    source: &str,
    source_type: SourceType,
    path: &Path,
    prefix: Option<&str>,
) -> Result<String, String> {
    let allocator = Allocator::default();

    let parser_ret = Parser::new(&allocator, source, source_type).parse();
    if !parser_ret.errors.is_empty() {
        return Err(join_errors(parser_ret.errors.iter()));
    }
    let mut program = parser_ret.program;

    if let Some(prefix) = prefix {
        rewrite_imports(&allocator, &mut program, prefix);
    }

    let scoping = SemanticBuilder::new().build(&program).semantic.into_scoping();
    let ret = Transformer::new(&allocator, path, &transform_options())
        .build_with_scoping(scoping, &mut program);
    if !ret.errors.is_empty() {
        return Err(join_errors(ret.errors.iter()));
    }

    Ok(Codegen::new().build(&program).code)
}

fn join_errors<'a>(errors: impl Iterator<Item = &'a oxc::diagnostics::OxcDiagnostic>) -> String {
    errors.map(|e| e.to_string()).collect::<Vec<_>>().join("\n")
}

/// TS-default [`try_transform`]: treat the input as TypeScript and use a fixed
/// `input.ts` path.
pub fn try_transform_ts(source: &str, prefix: Option<&str>) -> Result<String, String> {
    try_transform(source, SourceType::ts(), Path::new("input.ts"), prefix)
}

/// Like [`try_transform_ts`], but also returns a source map (v3 JSON) tying the
/// generated code back to the original source. Returns `(code, source_map_json)`.
pub fn try_transform_ts_with_map(
    source: &str,
    prefix: Option<&str>,
) -> Result<(String, String), String> {
    let allocator = Allocator::default();
    let path = Path::new("input.ts");

    let parser_ret = Parser::new(&allocator, source, SourceType::ts()).parse();
    if !parser_ret.errors.is_empty() {
        return Err(join_errors(parser_ret.errors.iter()));
    }
    let mut program = parser_ret.program;

    if let Some(prefix) = prefix {
        rewrite_imports(&allocator, &mut program, prefix);
    }

    let scoping = SemanticBuilder::new().build(&program).semantic.into_scoping();
    let ret = Transformer::new(&allocator, path, &transform_options())
        .build_with_scoping(scoping, &mut program);
    if !ret.errors.is_empty() {
        return Err(join_errors(ret.errors.iter()));
    }

    // #region rust-sourcemap
    // Setting source_map_path turns codegen's mapping on and names the source.
    // The returned value then carries both the generated code and a SourceMap you
    // serialize to the v3 JSON the browser reads.
    let codegen = Codegen::new().with_options(CodegenOptions {
        source_map_path: Some(path.to_path_buf()),
        ..CodegenOptions::default()
    });
    let out = codegen.build(&program);
    let map = out.map.map(|m| m.to_json_string()).unwrap_or_default();
    // #endregion rust-sourcemap
    Ok((out.code, map))
}

/// Parse `source` and return its AST as pretty-printed ESTree JSON, the data the
/// in-browser AST explorer renders in its tree view.
pub fn parse_to_estree_json_ts(source: &str) -> Result<String, String> {
    let allocator = Allocator::default();
    let parser_ret = Parser::new(&allocator, source, SourceType::ts()).parse();
    if !parser_ret.errors.is_empty() {
        return Err(join_errors(parser_ret.errors.iter()));
    }
    let mut serializer = PrettyTSSerializer::default();
    parser_ret.program.serialize(&mut serializer);
    Ok(serializer.into_string())
}

// #region rust-rewrite
/// Rewrite bare module specifiers (`"lodash"`) to `<prefix>lodash`, leaving
/// relative (`./x`), absolute (`/x`), and already-URL imports untouched.
pub fn rewrite_imports<'a>(allocator: &'a Allocator, program: &mut Program<'a>, prefix: &str) {
    for stmt in program.body.iter_mut() {
        let source = match stmt {
            Statement::ImportDeclaration(d) => Some(&mut d.source),
            Statement::ExportNamedDeclaration(d) => d.source.as_mut(),
            Statement::ExportAllDeclaration(d) => Some(&mut d.source),
            _ => None,
        };
        if let Some(lit) = source {
            if is_bare(lit.value.as_str()) {
                // Allocate the new string in the arena and clear `raw` so codegen
                // re-quotes from `value` rather than reprinting the original text.
                let rewritten = format!("{prefix}{}", lit.value.as_str());
                lit.value = rewritten.into_in(allocator);
                lit.raw = None;
            }
        }
    }
}

/// A bare specifier is a package name: not relative, absolute, or a URL.
pub fn is_bare(spec: &str) -> bool {
    !(spec.starts_with('.')
        || spec.starts_with('/')
        || spec.contains("://")
        || spec.starts_with("node:"))
}
// #endregion rust-rewrite

// ---- C ABI ---------------------------------------------------------------
// Memory protocol per call: JS calls `oxc_alloc(len)`, writes UTF-8 source
// there, then the entry point, which returns a packed `(out_len << 32) | out_ptr`
// pointing at a tagged result buffer (byte 0 is 1 on success / 0 on error, the
// rest is the UTF-8 payload). JS reads it and frees both buffers.

#[no_mangle]
pub extern "C" fn oxc_alloc(len: usize) -> *mut u8 {
    Box::into_raw(vec![0u8; len.max(1)].into_boxed_slice()) as *mut u8
}

/// # Safety: `ptr`/`len` must come from a prior `oxc_alloc` / packed return.
#[no_mangle]
pub unsafe extern "C" fn oxc_free(ptr: *mut u8, len: usize) {
    drop(Box::from_raw(std::slice::from_raw_parts_mut(ptr, len.max(1))));
}

/// Pack a tagged result (1-byte ok flag + payload) into `(len << 32) | ptr`.
fn pack(result: Result<String, String>) -> u64 {
    let (ok, body) = match result {
        Ok(s) => (1u8, s),
        Err(e) => (0u8, e),
    };
    let mut out = Vec::with_capacity(body.len() + 1);
    out.push(ok);
    out.extend_from_slice(body.as_bytes());
    let boxed = out.into_boxed_slice();
    let len = boxed.len() as u64;
    let ptr = Box::into_raw(boxed) as *mut u8 as u64;
    (len << 32) | ptr
}

/// # Safety: `ptr`/`len` must describe a valid UTF-8 buffer in wasm memory.
unsafe fn read(ptr: *const u8, len: usize) -> &'static str {
    std::str::from_utf8_unchecked(std::slice::from_raw_parts(ptr, len))
}

/// Parse and return the AST as ESTree JSON (tagged + packed).
/// # Safety: see [`read`].
#[no_mangle]
pub unsafe extern "C" fn oxc_parse_json(ptr: *const u8, len: usize) -> u64 {
    pack(parse_to_estree_json_ts(read(ptr, len)))
}

/// Transform (strip TS types, rewrite bare imports if `prefix` is non-empty) and
/// return the generated code (tagged + packed).
/// # Safety: both buffers must be valid UTF-8 in wasm memory.
#[no_mangle]
pub unsafe extern "C" fn oxc_transform(
    ptr: *const u8,
    len: usize,
    prefix_ptr: *const u8,
    prefix_len: usize,
) -> u64 {
    let prefix = read(prefix_ptr, prefix_len);
    let prefix = (!prefix.is_empty()).then_some(prefix);
    pack(try_transform_ts(read(ptr, len), prefix))
}

/// Transform and also produce a source map. The payload is the generated code, a
/// NUL byte, then the source-map JSON (JS code never contains a NUL).
/// # Safety: both buffers must be valid UTF-8 in wasm memory.
#[no_mangle]
pub unsafe extern "C" fn oxc_transform_map(
    ptr: *const u8,
    len: usize,
    prefix_ptr: *const u8,
    prefix_len: usize,
) -> u64 {
    let prefix = read(prefix_ptr, prefix_len);
    let prefix = (!prefix.is_empty()).then_some(prefix);
    pack(try_transform_ts_with_map(read(ptr, len), prefix).map(|(code, map)| format!("{code}\0{map}")))
}
