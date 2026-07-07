// Replay the VS Code debug session headlessly, against the real CodeLLDB
// adapter, speaking the Debug Adapter Protocol. Same configuration as
// .vscode/launch.json, so what this prints is what VS Code shows: stack
// traces on each breakpoint and the Variables panel at the Rust frame.
//
// Run with: npm run debug:dap
'use strict';
const net = require('node:net');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const root = path.join(__dirname, '..');
const PORT = 14711;

// --json <file>: also record the session (stops, stacks, variables, v8bt)
// as data, for the blog post's session-player component.
const jsonIndex = process.argv.indexOf('--json');
const jsonPath = jsonIndex >= 0 ? process.argv[jsonIndex + 1] : null;
const recording = { stops: [] };

function findAdapter() {
  const extensions = path.join(os.homedir(), '.vscode', 'extensions');
  const dir = fs
    .readdirSync(extensions)
    .filter((d) => d.startsWith('vadimcn.vscode-lldb-'))
    .sort()
    .pop();
  if (!dir) throw new Error('CodeLLDB (vadimcn.vscode-lldb) is not installed');
  return path.join(extensions, dir, 'adapter', 'codelldb');
}

// --- tiny DAP client ---------------------------------------------------------
class Dap {
  constructor(socket) {
    this.socket = socket;
    this.seq = 1;
    this.pending = new Map(); // request seq -> resolve
    this.eventWaiters = []; // {event, resolve}
    this.outputLog = [];
    this.buffer = Buffer.alloc(0);
    socket.on('data', (chunk) => this.onData(chunk));
  }
  onData(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    for (;;) {
      const headerEnd = this.buffer.indexOf('\r\n\r\n');
      if (headerEnd < 0) return;
      const length = Number(/Content-Length: (\d+)/.exec(this.buffer.subarray(0, headerEnd))[1]);
      if (this.buffer.length < headerEnd + 4 + length) return;
      const message = JSON.parse(this.buffer.subarray(headerEnd + 4, headerEnd + 4 + length));
      this.buffer = this.buffer.subarray(headerEnd + 4 + length);
      this.dispatch(message);
    }
  }
  dispatch(message) {
    if (message.type === 'response') {
      const resolve = this.pending.get(message.request_seq);
      this.pending.delete(message.request_seq);
      if (!message.success) console.error(`  (request ${message.command} failed: ${message.message})`);
      resolve(message.body);
    } else if (message.type === 'event') {
      if (message.event === 'output' && message.body.output.trim()) {
        for (const line of message.body.output.trim().split('\n')) console.log(`  [demo] ${line}`);
        this.outputLog.push(message.body.output);
      }
      const i = this.eventWaiters.findIndex((w) => w.event === message.event);
      if (i >= 0) this.eventWaiters.splice(i, 1)[0].resolve(message.body);
    }
  }
  takeOutput() {
    return this.outputLog.splice(0).join('');
  }
  request(command, args = {}) {
    return new Promise((resolve) => {
      const seq = this.seq++;
      this.pending.set(seq, resolve);
      const json = JSON.stringify({ seq, type: 'request', command, arguments: args });
      this.socket.write(`Content-Length: ${Buffer.byteLength(json)}\r\n\r\n${json}`);
    });
  }
  waitEvent(event) {
    return new Promise((resolve) => this.eventWaiters.push({ event, resolve }));
  }
}

// --- the recorded session ----------------------------------------------------
// Each recorded stop = what a person actually looks at: the top of the stack,
// the variables around, and which debugger action got them there.
async function recordStop(dap, threadId, action, title) {
  console.log(`\n=== [${action}] ${title} ===`);
  const { stackFrames } = await dap.request('stackTrace', { threadId, levels: 10 });
  const frames = stackFrames.slice(0, 8).map((f) => ({
    name: f.name,
    where: f.source ? `${path.basename(f.source.path || f.source.name)}:${f.line}` : '<V8 JIT>',
    lang: !f.source ? 'js' : f.source.path?.endsWith('.rs') ? 'rust' : 'cpp',
  }));
  for (const [i, f] of frames.entries()) console.log(`  #${i}`.padEnd(6) + `${f.name}  (${f.where})`);

  const { scopes } = await dap.request('scopes', { frameId: stackFrames[0].id });
  const locals = scopes.find((s) => s.name === 'Local' || s.name === 'Locals') ?? scopes[0];
  const { variables } = await dap.request('variables', { variablesReference: locals.variablesReference });
  const recorded = variables.map((v) => ({
    name: v.name,
    type: v.type ?? '',
    value: v.value.length > 160 ? v.value.slice(0, 160) + '…' : v.value,
  }));
  for (const v of recorded) console.log(`  ${v.name}: ${v.type} = ${v.value}`);

  recording.stops.push({ action, title, frames, variables: recorded });
  return stackFrames[0];
}

// Step (next/stepIn/stepOut) until the top frame reaches `line`, so the
// recording survives edits that shift line numbers.
async function stepUntilLine(dap, threadId, command, line, limit = 12) {
  for (let i = 0; i < limit; i++) {
    await dap.request(command, { threadId });
    await dap.waitEvent('stopped');
    const { stackFrames } = await dap.request('stackTrace', { threadId, levels: 1 });
    if (stackFrames[0].line === line) return;
  }
  throw new Error(`never reached line ${line} via ${command}`);
}

const lineOf = (file, needle) => fs.readFileSync(file, 'utf8').split('\n').findIndex((l) => l.includes(needle)) + 1;

async function main() {
  const adapter = spawn(findAdapter(), ['--port', String(PORT)], { stdio: 'ignore' });
  const socket = await new Promise((resolve, reject) => {
    let attempts = 0;
    const tryConnect = () => {
      const s = net.connect(PORT, '127.0.0.1');
      s.once('connect', () => resolve(s));
      s.once('error', () => (++attempts > 50 ? reject(new Error('adapter never listened')) : setTimeout(tryConnect, 100)));
    };
    setTimeout(tryConnect, 200);
  });
  const dap = new Dap(socket);

  await dap.request('initialize', { adapterID: 'lldb', pathFormat: 'path', linesStartAt1: true, columnsStartAt1: true });

  // The same knobs as "Native: lldb on node demo.js" in .vscode/launch.json.
  const launched = dap.request('launch', {
    program: process.execPath,
    args: ['demo.js'],
    cwd: root,
    env: { OXC_NAN_DEBUG: '1' },
    sourceLanguages: ['cpp', 'rust'], // <- the Rust visualization fix this records
    initCommands: [
      // V8 debug helpers compiled into node; see the README's "Seeing into V8".
      "command regex v8obj 's/(.+)/expr -- (void)_v8_internal_Print_Object((void*)*(unsigned long*)((%1).location_))/'",
      'command alias v8bt expr -- (void)_v8_internal_Print_StackTrace()',
      `command script import ${path.join(root, 'debug', 'v8_formatters.py')}`,
    ],
    terminal: 'console',
  });

  // #region session
  await dap.waitEvent('initialized');
  // Two breakpoints, like a person would set: the C++ entry point and the
  // line where the result handle exists. The Rust function gets its own so
  // "continue" crosses the language boundary instead of a fragile step-into.
  const addonCpp = path.join(root, 'src', 'addon.cpp');
  const libRs = path.join(root, 'rust', 'src', 'lib.rs');
  await dap.request('setFunctionBreakpoints', {
    breakpoints: [{ name: 'AnalyzeJson' }, { name: 'oxc_bridge::analyze' }],
  });
  await dap.request('setBreakpoints', {
    source: { path: addonCpp },
    breakpoints: [{ line: lineOf(addonCpp, 'oxc_free_string(json)') }],
  });
  await dap.request('configurationDone');
  await launched;

  // Stop 1: the JS→C++ crossing.
  const stop1 = await dap.waitEvent('stopped');
  const tid = stop1.threadId;
  const frame1 = await recordStop(dap, tid, '▶ run', 'Breakpoint: AnalyzeJson — a JS call lands in C++');
  dap.takeOutput(); // drop demo output so far; capture only what v8bt prints
  await dap.request('evaluate', { expression: 'v8bt', context: 'repl', frameId: frame1.id });
  await new Promise((resolve) => setTimeout(resolve, 500)); // let stdout flush
  // Keep the compact trace; V8 appends a huge "Details" section we don't need.
  recording.stops.at(-1).v8bt = dap.takeOutput().split('==== Details')[0].trim();

  // Step over the argument unpacking, stop on the FFI call line.
  await stepUntilLine(dap, tid, 'next', lineOf(addonCpp, 'char* json = oxc_analyze'));
  await recordStop(dap, tid, '⇢ step over', 'Arguments unpacked from V8, about to call Rust');

  // Continue: the next breakpoint is inside the Rust crate.
  await dap.request('continue', { threadId: tid });
  await dap.waitEvent('stopped');
  await recordStop(dap, tid, '▶ continue', 'Breakpoint: oxc_bridge::analyze — same stack, now in Rust');

  // Step over the parse, stop before codegen: oxc's results in the locals.
  await stepUntilLine(dap, tid, 'next', lineOf(libRs, 'let printed'));
  await recordStop(dap, tid, '⇢ step over', 'After the parse: diagnostics collected, AST in the arena');

  // Continue: back in C++ where the result handle exists.
  await dap.request('continue', { threadId: tid });
  await dap.waitEvent('stopped');
  await recordStop(dap, tid, '▶ continue', 'Back in C++: json returned from Rust, result built for V8');

  // One more step: the free runs, the char* dangles, the Local keeps its copy.
  await stepUntilLine(dap, tid, 'next', lineOf(addonCpp, 'GetReturnValue'));
  await recordStop(dap, tid, '⇢ step over', 'oxc_free_string ran: json dangles, result owns a copy');

  await dap.request('setFunctionBreakpoints', { breakpoints: [] }); // let the demo finish
  await dap.request('setBreakpoints', { source: { path: addonCpp }, breakpoints: [] });
  await dap.request('continue', { threadId: tid });
  // #endregion session
  await dap.waitEvent('terminated');
  await dap.request('disconnect', {});
  adapter.kill();
  if (jsonPath) {
    fs.writeFileSync(jsonPath, JSON.stringify(recording, null, 1) + '\n');
    console.log(`\nrecording written to ${jsonPath}`);
  }
  console.log('\n=== session complete ===');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
