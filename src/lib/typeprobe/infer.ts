// Infer a TypeScript type from a parsed JSON value.
// Pure and dependency-free so it is safe to import on the server.
// The output is source text for a single `type Root = ...;` declaration
// with inline nested object types, which is what the demo edits.
//
// The interesting work is unification: when a value appears in several
// places (array elements, or the same key across objects) we merge the
// observations into one type. A key missing from some objects becomes
// optional, a value that is sometimes null becomes a `| null` union.

const VALID_IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

const INDENT = '  ';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function quoteKey(key: string): string {
  return VALID_IDENT.test(key) ? key : JSON.stringify(key);
}

// Dedupe a list of type strings, keeping first-seen order but pushing
// `null` and `undefined` to the end so unions read `string | null`.
function unionOf(parts: string[]): string {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const part of parts) {
    if (!seen.has(part)) {
      seen.add(part);
      ordered.push(part);
    }
  }
  if (ordered.length === 0) return 'unknown';
  ordered.sort((a, b) => {
    const rank = (t: string) => (t === 'undefined' ? 2 : t === 'null' ? 1 : 0);
    return rank(a) - rank(b);
  });
  return ordered.join(' | ');
}

// Describe a single observed value as a type string.
function describe(value: unknown, depth: number): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return arrayType(value, depth);
  if (isPlainObject(value)) return mergeObjects([value], depth);
  switch (typeof value) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    default:
      return 'unknown';
  }
}

function arrayType(items: unknown[], depth: number): string {
  if (items.length === 0) return 'unknown[]';
  const element = unify(items, depth);
  return element.includes('|') ? `(${element})[]` : `${element}[]`;
}

// Unify a set of observed values into one type. Object values are merged
// structurally, array values have their elements pooled and unified, and
// scalars contribute their primitive type to a union.
function unify(values: unknown[], depth: number): string {
  const objects: Record<string, unknown>[] = [];
  const arrays: unknown[][] = [];
  const scalars: string[] = [];

  for (const value of values) {
    if (Array.isArray(value)) arrays.push(value);
    else if (isPlainObject(value)) objects.push(value);
    else scalars.push(describe(value, depth));
  }

  const parts: string[] = [];

  if (arrays.length > 0) {
    const pooled = arrays.flat();
    if (pooled.length === 0) {
      parts.push('unknown[]');
    } else {
      const element = unify(pooled, depth);
      parts.push(element.includes('|') ? `(${element})[]` : `${element}[]`);
    }
  }

  if (objects.length > 0) {
    parts.push(mergeObjects(objects, depth));
  }

  parts.push(...scalars);

  return unionOf(parts);
}

// Merge one or more object observations into a single object type.
// A key absent from some observations is optional. The value type of a
// key is the unification of every value seen for it.
function mergeObjects(objects: Record<string, unknown>[], depth: number): string {
  const keyOrder: string[] = [];
  const seen = new Set<string>();
  for (const obj of objects) {
    for (const key of Object.keys(obj)) {
      if (!seen.has(key)) {
        seen.add(key);
        keyOrder.push(key);
      }
    }
  }

  if (keyOrder.length === 0) return '{}';

  const pad = INDENT.repeat(depth + 1);
  const closePad = INDENT.repeat(depth);
  const lines = keyOrder.map((key) => {
    const present = objects.filter((obj) => Object.prototype.hasOwnProperty.call(obj, key));
    const optional = present.length < objects.length;
    const valueType = unify(present.map((obj) => obj[key]), depth + 1);
    return `${pad}${quoteKey(key)}${optional ? '?' : ''}: ${valueType};`;
  });

  return `{\n${lines.join('\n')}\n${closePad}}`;
}

export function inferType(value: unknown, rootName = 'Root'): string {
  return `type ${rootName} = ${describe(value, 0)};`;
}
