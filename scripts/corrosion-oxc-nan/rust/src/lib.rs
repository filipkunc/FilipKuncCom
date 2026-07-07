//! C ABI surface over oxc: parse JS/TS, report diagnostics, print the AST back.
//!
//! The boundary is deliberately dumb: UTF-8 strings in, one JSON string out.
//! Ownership rule: every string returned by `oxc_analyze` must be released
//! with `oxc_free_string`. Nothing else crosses the boundary.

use std::ffi::{c_char, CStr, CString};
use std::panic::catch_unwind;

use oxc_allocator::Allocator;
use oxc_codegen::Codegen;
use oxc_parser::Parser;
use oxc_span::SourceType;

fn analyze(source: &str, filename: &str) -> serde_json::Value {
    // oxc allocates the whole AST in an arena; dropping it frees everything at once.
    let allocator = Allocator::default();

    // Infer .js / .ts / .tsx / .mjs handling from the file name.
    let source_type = SourceType::from_path(filename).unwrap_or_default();

    let ret = Parser::new(&allocator, source, source_type).parse();

    let errors: Vec<serde_json::Value> = ret
        .diagnostics
        .iter()
        .map(|error| {
            let span = error
                .labels
                .first()
                .map(|label| (label.offset(), label.len()));
            serde_json::json!({
                "message": error.message.to_string(),
                "offset": span.map(|(offset, _)| offset),
                "length": span.map(|(_, len)| len),
            })
        })
        .collect();

    // Even a partially-broken program parses into an AST; print it back out.
    let printed = Codegen::new().build(&ret.program).code;

    serde_json::json!({
        "filename": filename,
        "sourceType": {
            "module": source_type.is_module(),
            "typescript": source_type.is_typescript(),
            "jsx": source_type.is_jsx(),
        },
        "errorCount": errors.len(),
        "errors": errors,
        "statementCount": ret.program.body.len(),
        "commentCount": ret.program.comments.len(),
        "code": printed,
    })
}

// #region c-abi
/// Parse `source` (named `filename` for language detection and diagnostics)
/// and return a heap-allocated JSON report as a NUL-terminated C string.
///
/// # Safety
/// `source` and `filename` must be valid NUL-terminated UTF-8 strings.
/// The returned pointer must be freed with `oxc_free_string`.
#[no_mangle]
pub unsafe extern "C" fn oxc_analyze(
    source: *const c_char,
    filename: *const c_char,
) -> *mut c_char {
    // Panics must never unwind across the C ABI (undefined behavior),
    // so catch them and turn them into an error report.
    let result = catch_unwind(|| {
        let source = CStr::from_ptr(source).to_str().unwrap_or_default();
        let filename = CStr::from_ptr(filename).to_str().unwrap_or_default();
        analyze(source, filename).to_string()
    });

    let json = result.unwrap_or_else(|_| r#"{"panic":"oxc_bridge panicked"}"#.to_string());

    // Hand ownership to the caller; from_raw in oxc_free_string takes it back.
    CString::new(json)
        .unwrap_or_else(|_| CString::new("{}").unwrap())
        .into_raw()
}

/// Release a string returned by `oxc_analyze`.
///
/// # Safety
/// `ptr` must be a pointer previously returned by `oxc_analyze`, passed at most once.
#[no_mangle]
pub unsafe extern "C" fn oxc_free_string(ptr: *mut c_char) {
    if !ptr.is_null() {
        drop(CString::from_raw(ptr));
    }
}
// #endregion c-abi

// #region tests
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn typescript_parses_clean() {
        let report = analyze("const x: number = 1;", "x.ts");
        assert_eq!(report["errorCount"], 0);
        assert_eq!(report["statementCount"], 1);
        assert_eq!(report["sourceType"]["typescript"], true);
    }

    #[test]
    fn broken_source_reports_spans() {
        let report = analyze("const x = ;", "x.js");
        assert_eq!(report["errorCount"], 1);
        assert_eq!(report["errors"][0]["offset"], 10);
    }

    #[test]
    fn c_abi_round_trip_owns_its_memory() {
        // The same contract the C++ addon relies on, exercised from Rust.
        let source = CString::new("let a = 1").unwrap();
        let filename = CString::new("a.js").unwrap();
        let ptr = unsafe { oxc_analyze(source.as_ptr(), filename.as_ptr()) };
        let json = unsafe { CStr::from_ptr(ptr) }.to_str().unwrap().to_owned();
        unsafe { oxc_free_string(ptr) };
        assert!(json.contains("\"errorCount\":0"));
    }
}
// #endregion tests
