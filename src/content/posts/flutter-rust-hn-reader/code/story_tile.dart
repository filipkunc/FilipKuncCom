// Mirrors hn_reader: lib/story_tile.dart (pinned via the GitHub links in the post).
// Calling an async Rust method from Dart: await it like any Future.

// #region open
Future<void> openStory(
    BuildContext context, ReaderEngine engine, Story s) async {
  showDialog(
    context: context,
    barrierDismissible: false,
    builder: (_) => const Center(child: CircularProgressIndicator()),
  );
  final ContentKind kind =
      s.url != null ? await engine.fetchArticle(url: s.url!) : _localKind(engine, s);
  if (!context.mounted) return;
  Navigator.of(context).pop(); // dismiss loader
// #endregion open
}
