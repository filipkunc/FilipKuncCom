// Mirrors hn_reader: lib/reader_view.dart (pinned via the GitHub links in the post).
// One switch over the same Block shape Rust produces.

// #region render
Widget renderBlock(
  Block block, {
  required TextStyle body,
  required ThemeData theme,
  required List<TapGestureRecognizer> recognizers,
  TexParserSettings mathSettings = const TexParserSettings(),
  void Function(String href)? onLink,
}) {
  // Links need to stay legible on both backgrounds: a brighter blue on dark.
  final linkColor = theme.brightness == Brightness.dark
      ? const Color(0xFF7AA9FF)
      : const Color(0xFF1565C0);
  switch (block) {
    case Block_Heading(:final level, :final spans):
      final style = (level <= 2
              ? theme.textTheme.titleLarge
              : theme.textTheme.titleMedium)!
          .copyWith(height: 1.3);
      return Padding(
        padding: const EdgeInsets.only(top: 22, bottom: 6),
        child: Text.rich(renderSpans(
            spans, style, recognizers, linkColor, mathSettings, onLink)),
      );
    case Block_Paragraph(:final spans):
      return Padding(
        padding: const EdgeInsets.only(bottom: 16),
        child: Text.rich(renderSpans(
            spans, body, recognizers, linkColor, mathSettings, onLink)),
      );
    // Image, Code, Quote, List follow the same shape...
  }
}
// #endregion render
