// JS wrapper: the addon returns one JSON string, so the JS-facing API
// can be a normal object without any V8 object-building in C++.
// OXC_NAN_DEBUG=1 loads the Debug build (full symbols in C++ and Rust).
const addon = process.env.OXC_NAN_DEBUG
  ? require('./build-debug/addon.node')
  : require('./build/addon.node');

function analyze(source, filename = 'input.js') {
  return JSON.parse(addon.analyzeJson(source, filename));
}

module.exports = { analyze };
