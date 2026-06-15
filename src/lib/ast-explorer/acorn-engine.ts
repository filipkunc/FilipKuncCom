// The Acorn twin: the same transforms the Rust/oxc side does — rewrite bare import
// specifiers, and strip TypeScript types — written in JS against an ESTree AST, with
// astring for codegen. This is the head-to-head. Acorn handles TS via the
// acorn-typescript plugin, and stripping types is just walking the AST and dropping
// the type nodes (Babel, swc, and Node's stripTypeScriptTypes all do exactly this).
// oxc is the faster row, with the transform built in rather than hand-written.

import { Parser } from 'acorn';
import tsPlugin from 'acorn-typescript';
import { generate } from 'astring';
import { GenMapping, addMapping, toEncodedMap } from '@jridgewell/gen-mapping';
import type { EngineResult, MapResult } from './oxc-engine';

// Acorn extended to parse TypeScript. The base parser handles the JS examples;
// this one the TS example.
const TsParser = Parser.extend(tsPlugin() as never);
function parseSource(source: string, ts: boolean, locations = false) {
  // acorn-typescript requires `locations`; for plain acorn it's only needed
  // when we want a source map.
  return (ts ? TsParser : Parser).parse(source, { ...parserOpts, locations: ts || locations });
}

// #region js-sourcemap-adapter
// astring writes a source map by calling `sourceMap.addMapping({ original,
// generated, source, name })` and reading `sourceMap.file`. @jridgewell/gen-mapping
// uses standalone functions instead of methods, so this thin shim adapts its
// GenMapping to the shape astring expects. (oxc needs no equivalent — it emits the
// map natively from Rust codegen.)
interface AstringMapping {
  original: { line: number; column: number } | null;
  generated: { line: number; column: number };
  source: string;
  name?: string;
}

class AstringGenMapping {
  readonly file: string;
  private readonly map: GenMapping;
  constructor(file: string) {
    this.file = file;
    this.map = new GenMapping({ file });
  }
  addMapping(m: AstringMapping): void {
    const { original, generated, source, name } = m;
    if (!original) return; // astring only maps nodes that carry a location
    if (name) {
      addMapping(this.map, { generated, original, source, name });
    } else {
      addMapping(this.map, { generated, original, source });
    }
  }
  toString(): string {
    return JSON.stringify(toEncodedMap(this.map));
  }
}
// #endregion js-sourcemap-adapter

interface Literal {
  type: 'Literal';
  value?: unknown;
  raw?: string;
}
interface ModuleNode {
  type: string;
  source?: Literal | null;
}
interface Program {
  type: 'Program';
  body: ModuleNode[];
}

const parserOpts = { ecmaVersion: 'latest' as const, sourceType: 'module' as const };

// #region js-rewrite
/** Mirror the Rust `is_bare`: a package name, not relative/absolute/URL/node:. */
function isBare(spec: string): boolean {
  return !(
    spec.startsWith('.') ||
    spec.startsWith('/') ||
    spec.includes('://') ||
    spec.startsWith('node:')
  );
}

// Walk the top-level module edges and rewrite each bare specifier in place.
function rewriteImports(program: Program, prefix: string): void {
  for (const node of program.body) {
    const isModuleEdge =
      node.type === 'ImportDeclaration' ||
      node.type === 'ExportNamedDeclaration' ||
      node.type === 'ExportAllDeclaration';
    if (!isModuleEdge || !node.source) continue;
    const value = node.source.value;
    if (typeof value === 'string' && isBare(value)) {
      node.source.value = prefix + value;
      delete node.source.raw; // force astring to re-quote from `value`
    }
  }
}
// #endregion js-rewrite

// #region ts-strip
// Stripping types is just walking the AST and dropping the type-only nodes and
// fields. Removable statements (interfaces, type aliases, `import type`) are
// filtered out of their arrays; type annotations and type parameters are deleted
// off the nodes that carry them; and TS-only expression wrappers (`x as T`,
// `x!`) are replaced by the expression inside. What's left is plain ESTree that
// astring can print. (This covers the *erasable* subset — enums, namespaces, and
// parameter properties need real emit, which is where a full transformer earns
// its keep.)
const TYPE_ONLY_NODE = new Set([
  'TSInterfaceDeclaration', 'TSTypeAliasDeclaration', 'TSModuleDeclaration',
  'TSDeclareFunction', 'TSImportEqualsDeclaration',
]);
const UNWRAP = new Set([
  'TSAsExpression', 'TSSatisfiesExpression', 'TSNonNullExpression',
  'TSTypeAssertion', 'TSInstantiationExpression',
]);
const TYPE_FIELDS = [
  'typeAnnotation', 'returnType', 'typeParameters', 'typeArguments',
  'accessibility', 'definite', 'readonly', 'declare', 'optional', 'override',
];

function isTypeOnly(n: { type?: string; importKind?: string; exportKind?: string; declaration?: unknown }): boolean {
  if (!n || !n.type) return false;
  if (TYPE_ONLY_NODE.has(n.type)) return true;
  if (n.type === 'ImportDeclaration' && n.importKind === 'type') return true;
  if (n.type === 'ExportNamedDeclaration' && n.exportKind === 'type' && !n.declaration) return true;
  if ((n.type === 'ImportSpecifier' || n.type === 'ExportSpecifier') && n.importKind === 'type') return true;
  return false;
}

function stripTypes<T>(node: T): T {
  if (!node || typeof node !== 'object') return node;
  const n = node as Record<string, unknown>;
  if (typeof n.type === 'string' && UNWRAP.has(n.type)) return stripTypes(n.expression) as T;
  for (const f of TYPE_FIELDS) delete n[f];
  for (const key of Object.keys(n)) {
    const v = n[key];
    if (Array.isArray(v)) {
      n[key] = v.filter((c) => !isTypeOnly(c)).map((c) => stripTypes(c));
    } else if (v && typeof v === 'object' && typeof (v as { type?: unknown }).type === 'string') {
      n[key] = stripTypes(v);
    }
  }
  return node;
}
// #endregion ts-strip

export function parse(source: string, ts = false): EngineResult {
  try {
    // Show the full AST, types and all — stripping happens on the transform side.
    const ast = parseSource(source, ts);
    return { ok: true, text: JSON.stringify(ast, null, 2) };
  } catch (e) {
    return { ok: false, text: (e as Error).message };
  }
}

export function transform(source: string, prefix = '', ts = false): EngineResult {
  try {
    const ast = parseSource(source, ts) as unknown as Program;
    if (ts) stripTypes(ast);
    if (prefix) rewriteImports(ast, prefix);
    const code = generate(ast as never);
    return { ok: true, text: code };
  } catch (e) {
    return { ok: false, text: (e as Error).message };
  }
}

// #region js-sourcemap
// astring takes each mapping's generated position from its own writer and the
// original position from node.loc.start, so parsing with `locations: true` is
// what makes the map possible. The source name comes from the generator's `file`.
export function transformMap(source: string, prefix = '', ts = false): MapResult {
  try {
    const ast = parseSource(source, ts, true) as unknown as Program;
    if (ts) stripTypes(ast);
    if (prefix) rewriteImports(ast, prefix);
    const map = new AstringGenMapping('input.js');
    const code = generate(ast as never, { sourceMap: map as never });
    return { ok: true, code, map: map.toString() };
  } catch (e) {
    return { ok: false, code: (e as Error).message, map: '' };
  }
}
// #endregion js-sourcemap
