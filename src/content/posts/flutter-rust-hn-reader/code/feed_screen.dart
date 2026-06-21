// Mirrors hn_reader: lib/feed_screen.dart (pinned via the GitHub links in the post).
// Consuming a Rust StreamSink from Dart: it arrives as a plain Stream.

// #region prefetch
  /// Warm the article cache for stories that have a link, so taps are instant.
  void _startPrefetch(List<Story> stories) {
    final urls = [
      for (final s in stories)
        if (s.url != null) s.url!,
    ];
    if (urls.isEmpty) return;
    widget.engine.prefetch(urls: urls).listen((_) {}, onError: (_) {});
  }
// #endregion prefetch
