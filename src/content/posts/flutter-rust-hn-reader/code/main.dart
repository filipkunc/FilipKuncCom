// Mirrors hn_reader: lib/main.dart (pinned via the GitHub links in the post).
// Initialize the bridge once, then construct the Rust engine synchronously.

// #region init
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await RustLib.init();
  final dir = await getApplicationDocumentsDirectory();
  final engine = ReaderEngine(dbPath: '${dir.path}/hn_cache.db');
  final settings = ReaderSettings(await SharedPreferences.getInstance());
  runApp(HnReaderApp(engine: engine, settings: settings));
}
// #endregion init
