// Generate a standalone runtime validator from a TypeScript type, using the
// real TypeScript compiler. This is the meta-programming core of the demo:
// we do not pattern-match the source text, we ask the type checker for the
// resolved structure of `Root` and walk it.
//
// typescript and @typescript/vfs are big, so this module is only ever loaded
// through a dynamic import when the reader clicks "Generate validator".

import type {
  Type,
  TypeChecker,
  SourceFile,
  default as TSModule,
} from 'typescript';

type TS = typeof TSModule;

// #region minimal-lib
// A tiny standard library. The inferred types are self-contained (objects,
// arrays, primitives, unions), so the checker only needs the global types it
// insists exist under noLib, plus Array so that `T[]` has meaning. This keeps
// us off the network and out of multi-megabyte real lib files.
const MINIMAL_LIB = `
interface Array<T> { length: number; [index: number]: T; }
interface ReadonlyArray<T> { readonly length: number; readonly [index: number]: T; }
interface Boolean {}
interface Number {}
interface String { readonly length: number; }
interface Object {}
interface Function {}
interface CallableFunction extends Function {}
interface NewableFunction extends Function {}
interface IArguments {}
interface RegExp {}
`;
// #endregion minimal-lib

export interface GenerateResult {
  code: string;
  error?: string;
  // A runnable version of the validator, so the reader can test it in the
  // browser instead of trusting the generated source.
  validate?: (value: unknown) => boolean;
}

function isValidIdent(name: string): boolean {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name);
}

function access(expr: string, key: string): string {
  return isValidIdent(key) ? `${expr}.${key}` : `${expr}[${JSON.stringify(key)}]`;
}

// #region check
// Build the boolean expression that is true exactly when `expr` matches `type`.
// Returns 'true' for anything we cannot or need not check (any, unknown), so
// callers can drop those terms from an && chain. `indent` is the current
// nesting level (in 2-space units) for formatting object groups, and `depth`
// names the `.every` element variable so nested arrays do not shadow.
function checkType(
  ts: TS,
  checker: TypeChecker,
  type: Type,
  expr: string,
  indent = 1,
  depth = 0,
): string {
  const flags = type.flags;
  const F = ts.TypeFlags;

  if (flags & (F.Any | F.Unknown)) return 'true';
  if (flags & F.String) return `typeof ${expr} === "string"`;
  if (flags & F.Number) return `typeof ${expr} === "number"`;
  if (flags & (F.Boolean | F.BooleanLiteral)) {
    // A boolean literal (`true`/`false`) narrows to an exact value.
    if (flags & F.BooleanLiteral) {
      const name = (type as { intrinsicName?: string }).intrinsicName;
      if (name === 'true' || name === 'false') return `${expr} === ${name}`;
    }
    return `typeof ${expr} === "boolean"`;
  }
  if (flags & F.Null) return `${expr} === null`;
  if (flags & F.Undefined) return `${expr} === undefined`;
  if (flags & F.StringLiteral) {
    return `${expr} === ${JSON.stringify((type as unknown as { value: string }).value)}`;
  }
  if (flags & F.NumberLiteral) {
    return `${expr} === ${(type as unknown as { value: number }).value}`;
  }

  if (type.isUnion()) {
    const terms = type.types
      // JSON never carries `undefined`; optional members are handled by the
      // missing-property branch in the object walker.
      .filter((member) => (member.flags & F.Undefined) === 0)
      .map((member) => checkType(ts, checker, member, expr, indent, depth))
      .filter((term) => term !== 'true');
    if (terms.length === 0) return 'true';
    if (terms.length === 1) return terms[0];
    return `(${terms.join(' || ')})`;
  }

  if (checker.isArrayType(type)) {
    const element = checker.getTypeArguments(type as never)[0];
    const itemVar = depth === 0 ? 'item' : `item${depth + 1}`;
    const elementCheck = element
      ? checkType(ts, checker, element, itemVar, indent, depth + 1)
      : 'true';
    if (elementCheck === 'true') return `Array.isArray(${expr})`;
    return `Array.isArray(${expr}) && ${expr}.every((${itemVar}: any) => ${elementCheck})`;
  }

  if (flags & F.Object) {
    const props = checker.getPropertiesOfType(type);
    const terms: string[] = [
      `typeof ${expr} === "object"`,
      `${expr} !== null`,
      `!Array.isArray(${expr})`,
    ];
    for (const prop of props) {
      const decl = prop.valueDeclaration;
      const propType = checker.getTypeOfSymbolAtLocation(prop, decl ?? (type.symbol?.valueDeclaration as never));
      const member = access(expr, prop.name);
      const optional = (prop.flags & ts.SymbolFlags.Optional) !== 0;

      let propCheck = checkType(ts, checker, propType, member, indent + 1, depth);
      // An optional member may be missing entirely; otherwise it must match.
      if (optional) {
        propCheck = propCheck === 'true' ? 'true' : `(${member} === undefined || ${propCheck})`;
      }
      if (propCheck !== 'true') terms.push(propCheck);
    }
    const pad = '  '.repeat(indent + 1);
    const closePad = '  '.repeat(indent);
    return `(\n${pad}${terms.join(` &&\n${pad}`)}\n${closePad})`;
  }

  // Anything else (functions, symbols, tuples) is not expected from JSON.
  return 'true';
}
// #endregion check

// #region make-checker
// Stand up an in-memory TypeScript program over a tiny lib plus the edited type
// text, and hand back the program and the parsed source file. There is no disk
// in the browser, so @typescript/vfs gives the compiler a Map of files instead.
function makeChecker(ts: TS, vfs: typeof import('@typescript/vfs'), typeText: string) {
  const fsMap = new Map<string, string>();
  fsMap.set('/lib.d.ts', MINIMAL_LIB);
  fsMap.set('/index.ts', `${typeText}\n`);

  const system = vfs.createSystem(fsMap);
  const env = vfs.createVirtualTypeScriptEnvironment(
    system,
    ['/lib.d.ts', '/index.ts'],
    ts,
    { target: ts.ScriptTarget.ES2020, strict: true, noLib: true },
  );

  const program = env.languageService.getProgram();
  if (!program) throw new Error('Could not start the TypeScript program.');
  const source = program.getSourceFile('/index.ts');
  if (!source) throw new Error('Could not read the type source.');
  return { program, source };
}
// #endregion make-checker

// #region find-root
// Find the `Root` declaration and ask the checker what it resolved to. This is
// the step that pays for the whole compiler: `string[]` already means an array
// of strings and `A | B` is already a flattened union, with no syntax to parse.
function findRoot(ts: TS, checker: TypeChecker, source: SourceFile): Type | undefined {
  for (const statement of source.statements) {
    if (
      (ts.isTypeAliasDeclaration(statement) || ts.isInterfaceDeclaration(statement)) &&
      statement.name.text === 'Root'
    ) {
      const symbol = checker.getSymbolAtLocation(statement.name);
      if (symbol) return checker.getDeclaredTypeOfSymbol(symbol);
    }
  }
  return undefined;
}
// #endregion find-root

export async function generateValidator(typeText: string): Promise<GenerateResult> {
  let ts: TS;
  let vfs: typeof import('@typescript/vfs');
  try {
    ts = (await import('typescript')).default ?? (await import('typescript'));
    vfs = await import('@typescript/vfs');
  } catch (err) {
    return { code: '', error: `Failed to load the compiler: ${String(err)}` };
  }

  try {
    const { program, source } = makeChecker(ts, vfs, typeText);

    // Surface real type errors (e.g. the edited type references something
    // undefined) instead of emitting a broken validator.
    const diagnostics = [
      ...program.getSyntacticDiagnostics(source),
      ...program.getSemanticDiagnostics(source),
    ];
    if (diagnostics.length > 0) {
      const first = diagnostics[0];
      const message = ts.flattenDiagnosticMessageText(first.messageText, '\n');
      const where =
        typeof first.start === 'number'
          ? source.getLineAndCharacterOfPosition(first.start)
          : undefined;
      const at = where ? ` (line ${where.line + 1})` : '';
      return { code: '', error: `Type does not compile${at}: ${message}` };
    }

    const checker = program.getTypeChecker();
    const rootType = findRoot(ts, checker, source);
    if (!rootType) {
      return { code: '', error: 'No `type Root` or `interface Root` found to validate against.' };
    }

    // #region assemble
    // Walk Root into one big boolean expression, then wrap it in a type guard.
    const body = checkType(ts, checker, rootType, 'v');
    const code = [
      'function validate(value: unknown): value is Root {',
      '  const v = value as any;',
      `  return ${body};`,
      '}',
    ].join('\n');
    // #endregion assemble

    // Strip the types with the compiler itself (no fragile regex) to get a
    // function we can actually call.
    let validate: ((value: unknown) => boolean) | undefined;
    try {
      // #region transpile
      const js = ts.transpile(code, { target: ts.ScriptTarget.ES2020 });
      validate = new Function(`${js}\nreturn validate;`)() as (value: unknown) => boolean;
      // #endregion transpile
    } catch {
      validate = undefined;
    }

    return { code, validate };
  } catch (err) {
    return { code: '', error: `Generation failed: ${String(err)}` };
  }
}
