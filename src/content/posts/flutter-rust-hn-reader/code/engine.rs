// Mirrors hn_reader: rust/src/api/engine.rs (pinned via the GitHub links in the post).
// The long-lived Rust core, held by Dart as a single opaque handle.

// #region handle
/// One HTTP client + one SQLite cache, constructed once and reused across every call.
/// Dart holds this as an auto-opaque `Arc<RwLock<ReaderEngine>>`.
pub struct ReaderEngine {
    client: reqwest::Client,
    db: Mutex<rusqlite::Connection>,
}

impl ReaderEngine {
    /// Open the engine. Pass `":memory:"` for an ephemeral cache, or a file path
    /// (e.g. the app documents dir) for a persistent one.
    #[frb(sync)]
    pub fn new(db_path: String) -> anyhow::Result<ReaderEngine> {
// #endregion handle
        unimplemented!()
    }
}

// #region fetch
    /// Fetch a Hacker News link and return a normalized reading document,
    /// or a fallback route (PDF / video / external / failed).
    pub async fn fetch_article(&self, url: String) -> ContentKind {
        extract::fetch_and_extract(&self.client, &self.db, &url).await
    }
// #endregion fetch

// #region prefetch
    /// Warm the cache for a batch of URLs, emitting an event as each one completes.
    /// This is the background-prefetch spike: the sink keeps delivering after the
    /// call returns control to Dart.
    pub async fn prefetch(
        &self,
        urls: Vec<String>,
        sink: StreamSink<PrefetchEvent>,
    ) -> anyhow::Result<()> {
        let total = urls.len() as u32;
        for (i, url) in urls.into_iter().enumerate() {
            let kind = extract::fetch_and_extract(&self.client, &self.db, &url).await;
            let ok = matches!(kind, ContentKind::Article(_));
            let _ = sink.add(PrefetchEvent {
                index: i as u32,
                total,
                url,
                ok,
            });
        }
        Ok(())
    }
// #endregion prefetch
