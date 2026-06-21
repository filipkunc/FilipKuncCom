// Mirrors hn_reader: rust/src/api/model.rs (pinned via the GitHub links in the post).
// The normalized document model handed across the FFI boundary.

// #region model
/// An inline span inside a block. Recursion is via `Vec`, which heap-allocates,
/// so no explicit `Box` is needed.
#[derive(Debug, Clone)]
pub enum Inline {
    Text(String),
    Bold(Vec<Inline>),
    Italic(Vec<Inline>),
    Code(String),
    Link { href: String, spans: Vec<Inline> },
}

/// One item of a list. Wrapped in a named struct so the Dart side gets a real type
/// instead of a nested `List<List<Block>>`.
#[derive(Debug, Clone)]
pub struct ListItem {
    pub blocks: Vec<Block>,
}

/// A top-level block in the normalized article.
#[derive(Debug, Clone)]
pub enum Block {
    Heading { level: u8, spans: Vec<Inline> },
    Paragraph { spans: Vec<Inline> },
    Image {
        src: String,
        alt: Option<String>,
        caption: Option<String>,
    },
    Code {
        lang: Option<String>,
        text: String,
    },
    Quote { blocks: Vec<Block> },
    List { ordered: bool, items: Vec<ListItem> },
}
// #endregion model

// #region contentkind
/// The result of routing a Hacker News link. Most links are articles; the long tail
/// (PDFs, video, SPAs, paywalls) routes to a fallback the Flutter side handles.
#[derive(Debug, Clone)]
pub enum ContentKind {
    Article(Article),
    Pdf { url: String },
    Video { url: String },
    External { url: String, reason: String },
    Failed { url: String, reason: String },
}
// #endregion contentkind
