//! Turning a regular expression into a trigram query.
//!
//! This follows Russ Cox's "Regular Expression Matching with a Trigram Index"
//! (https://swtch.com/~rsc/regexp/regexp4.html). The idea: every string that a
//! regex can match contains a known set of trigrams, so we can build a boolean
//! query over trigrams that *every* match must satisfy, use it to throw out
//! documents that cannot possibly match, and only run the real regex on what
//! survives.
//!
//! The one rule that keeps this correct is over-approximation: when in doubt we
//! return `All` (no constraint). The query may let through documents that do not
//! match, and the regex pass then rejects them, but it must never throw out a
//! document that *does* match.

use std::collections::BTreeSet;

use crate::regex::Ast;

// #region query
/// A boolean query over trigrams. `All` matches every document (we learned
/// nothing), `None` matches no document (the regex is unsatisfiable).
#[derive(Clone, PartialEq, Eq)]
pub enum Query {
    All,
    None,
    Trigram(String),
    And(Vec<Query>),
    Or(Vec<Query>),
}
// #endregion query

impl Query {
    /// AND with the usual identities: `All` drops out, `None` wins.
    pub fn and(self, other: Query) -> Query {
        match (self, other) {
            (Query::None, _) | (_, Query::None) => Query::None,
            (Query::All, q) | (q, Query::All) => q,
            (a, b) => {
                let mut parts = a.into_and_parts();
                parts.extend(b.into_and_parts());
                parts.sort();
                parts.dedup();
                if parts.len() == 1 {
                    parts.pop().unwrap()
                } else {
                    Query::And(parts)
                }
            }
        }
    }

    /// OR with the dual identities: `None` drops out, `All` wins.
    pub fn or(self, other: Query) -> Query {
        match (self, other) {
            (Query::All, _) | (_, Query::All) => Query::All,
            (Query::None, q) | (q, Query::None) => q,
            (a, b) => {
                let mut parts = a.into_or_parts();
                parts.extend(b.into_or_parts());
                parts.sort();
                parts.dedup();
                if parts.len() == 1 {
                    parts.pop().unwrap()
                } else {
                    Query::Or(parts)
                }
            }
        }
    }

    fn into_and_parts(self) -> Vec<Query> {
        match self {
            Query::And(v) => v,
            q => vec![q],
        }
    }

    fn into_or_parts(self) -> Vec<Query> {
        match self {
            Query::Or(v) => v,
            q => vec![q],
        }
    }

    /// Human-readable form, e.g. `Goo AND oog AND ogl AND gle`.
    pub fn explain(&self) -> String {
        match self {
            Query::All => "ALL".into(),
            Query::None => "NONE".into(),
            Query::Trigram(t) => t.clone(),
            Query::And(v) => join(v, " AND "),
            Query::Or(v) => format!("({})", join(v, " OR ")),
        }
    }
}

impl Ord for Query {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        self.explain().cmp(&other.explain())
    }
}
impl PartialOrd for Query {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        Some(self.cmp(other))
    }
}

fn join(v: &[Query], sep: &str) -> String {
    v.iter().map(Query::explain).collect::<Vec<_>>().join(sep)
}

/// Trigrams (three-byte windows) of a string. We work on bytes, exactly like a
/// real trigram index does, so non-ASCII source is handled without a decode step.
pub fn trigrams(s: &str) -> BTreeSet<String> {
    let b = s.as_bytes();
    let mut out = BTreeSet::new();
    if b.len() >= 3 {
        for w in b.windows(3) {
            out.insert(String::from_utf8_lossy(w).into_owned());
        }
    }
    out
}

/// The query that a single literal string implies: it must contain all of its
/// trigrams. Strings shorter than three bytes carry no trigram, so they
/// constrain nothing and collapse to `All`.
fn query_for_string(s: &str) -> Query {
    trigrams(s)
        .into_iter()
        .map(Query::Trigram)
        .fold(Query::All, Query::and)
}

/// The query implied by a *set* of alternative strings: a match contains the
/// trigrams of at least one of them. If any alternative is too short to carry a
/// trigram, the whole OR collapses to `All`. An empty set means "nothing to
/// require here", which is also `All`.
fn query_for_set(set: &BTreeSet<String>) -> Query {
    if set.is_empty() {
        return Query::All;
    }
    set.iter()
        .map(|s| query_for_string(s))
        .fold(Query::None, Query::or)
}

// Bounds that keep the exact/prefix/suffix sets from blowing up on patterns like
// `[0-9]{6}`. Past these we stop tracking exact strings and keep only the trigram
// query, which is the lossy-but-sound fallback.
const MAX_SET: usize = 8;
const MAX_LEN: usize = 8;

/// What we know about the language of a sub-expression while walking the regex.
/// `exact` is `Some` only while we can still enumerate every string it matches.
/// `prefix`/`suffix` bound how a match can start and end once `exact` is gone; an
/// empty set there means "unknown", which severs trigrams across the boundary.
#[derive(Clone)]
pub struct Info {
    pub can_empty: bool,
    pub exact: Option<BTreeSet<String>>,
    pub prefix: BTreeSet<String>,
    pub suffix: BTreeSet<String>,
    pub query: Query,
}

impl Info {
    fn exact_set(set: BTreeSet<String>) -> Info {
        Info {
            can_empty: set.iter().any(|s| s.is_empty()),
            exact: Some(set),
            prefix: BTreeSet::new(),
            suffix: BTreeSet::new(),
            query: Query::All,
        }
    }

    /// "Any single character": one position, no trigram, nothing to constrain,
    /// but it does carry an (empty) prefix/suffix so neighbours can still cross
    /// trigrams through a single wildcard.
    fn any_char() -> Info {
        Info {
            can_empty: false,
            exact: None,
            prefix: once(""),
            suffix: once(""),
            query: Query::All,
        }
    }

    /// Fold an `exact` set into the trigram query and drop down to
    /// prefix/suffix tracking. Called when the set grows too large to carry, and
    /// once at the end to produce the final query.
    fn simplify(mut self, force: bool) -> Info {
        if let Some(set) = self.exact.clone() {
            let too_big = set.len() > MAX_SET || set.iter().any(|s| s.len() > MAX_LEN);
            if force || too_big {
                self.query = self.query.and(query_for_set(&set));
                self.prefix = clamp_prefix(&set);
                self.suffix = clamp_suffix(&set);
                self.exact = None;
            }
        }
        self.prefix = clamp_prefix(&self.prefix);
        self.suffix = clamp_suffix(&self.suffix);
        self
    }
}

fn once(s: &str) -> BTreeSet<String> {
    let mut set = BTreeSet::new();
    set.insert(s.to_string());
    set
}

// A shorter prefix is still a sound prefix (keep the head); a shorter suffix is
// still a sound suffix (keep the tail). Both also cap how many we track.
fn clamp_prefix(set: &BTreeSet<String>) -> BTreeSet<String> {
    set.iter()
        .take(MAX_SET)
        .map(|s| s.chars().take(MAX_LEN).collect())
        .collect()
}
fn clamp_suffix(set: &BTreeSet<String>) -> BTreeSet<String> {
    set.iter()
        .take(MAX_SET)
        .map(|s| {
            let n = s.chars().count();
            s.chars().skip(n.saturating_sub(MAX_LEN)).collect()
        })
        .collect()
}

fn cross(a: &BTreeSet<String>, b: &BTreeSet<String>) -> BTreeSet<String> {
    let mut out = BTreeSet::new();
    for x in a {
        for y in b {
            out.insert(format!("{x}{y}"));
        }
    }
    out
}

fn union(a: &BTreeSet<String>, b: &BTreeSet<String>) -> BTreeSet<String> {
    a.union(b).cloned().collect()
}

/// The heart of it: walk the regex AST and compute the trigram query.
pub fn analyze(ast: &Ast) -> Info {
    walk(ast).simplify(true)
}

fn walk(ast: &Ast) -> Info {
    match ast {
        Ast::Empty => Info::exact_set(once("")),
        Ast::Literal(c) => Info::exact_set(once(&c.to_string())),
        Ast::Class(chars) => {
            if !chars.is_empty() && chars.len() <= MAX_SET {
                Info::exact_set(chars.iter().map(|c| c.to_string()).collect())
            } else {
                Info::any_char()
            }
        }
        Ast::AnyChar => Info::any_char(),
        Ast::Concat(parts) => {
            // Coalesce runs of literal characters into one exact string first, so
            // "Search" is analyzed as a whole and not byte by byte.
            let mut infos: Vec<Info> = Vec::new();
            let mut run = String::new();
            for part in parts {
                if let Ast::Literal(c) = part {
                    run.push(*c);
                    continue;
                }
                if !run.is_empty() {
                    infos.push(Info::exact_set(once(&run)));
                    run.clear();
                }
                infos.push(walk(part));
            }
            if !run.is_empty() {
                infos.push(Info::exact_set(once(&run)));
            }
            infos
                .into_iter()
                .reduce(concat)
                .unwrap_or_else(|| Info::exact_set(once("")))
        }
        Ast::Alternate(parts) => parts
            .iter()
            .map(walk)
            .reduce(alternate)
            .unwrap_or_else(|| Info::exact_set(once(""))),
        Ast::Star(inner) => star(walk(inner)),
        Ast::Plus(inner) => plus(walk(inner)),
        Ast::Quest(inner) => quest(walk(inner)),
    }
}

// #region concat
fn concat(x: Info, y: Info) -> Info {
    // Both sides fully known: the concatenation is just their cross product, and
    // it stays exact (until it grows too big and `simplify` cashes it in).
    if let (Some(xe), Some(ye)) = (&x.exact, &y.exact) {
        let mut z = Info::exact_set(cross(xe, ye));
        z.query = x.query.and(y.query);
        return z.simplify(false);
    }

    let xs = x.exact.clone().unwrap_or_else(|| x.suffix.clone());
    let yp = y.exact.clone().unwrap_or_else(|| y.prefix.clone());

    let mut query = x.query.clone().and(y.query.clone());
    // A known exact side that cannot extend into its neighbour must contribute
    // its own trigrams now: this is what "closes off" Google before `.*`.
    if x.exact.is_some() {
        query = query.and(query_for_set(&xs));
    }
    if y.exact.is_some() {
        query = query.and(query_for_set(&yp));
    }
    // Strings that straddle the boundary must appear too. An empty cross (one
    // side unknown, e.g. just after `.*`) adds no constraint.
    query = query.and(query_for_set(&cross(&xs, &yp)));

    let prefix = if x.exact.is_some() {
        let mut p = clamp_prefix(&cross(&xs, &yp));
        if x.can_empty {
            p = union(&p, &y.prefix);
        }
        p
    } else {
        x.prefix.clone()
    };
    let suffix = if y.exact.is_some() {
        let mut s = clamp_suffix(&cross(&xs, &yp));
        if y.can_empty {
            s = union(&s, &x.suffix);
        }
        s
    } else {
        y.suffix.clone()
    };

    Info {
        can_empty: x.can_empty && y.can_empty,
        exact: None,
        prefix,
        suffix,
        query,
    }
    .simplify(false)
}
// #endregion concat

fn alternate(x: Info, y: Info) -> Info {
    if let (Some(xe), Some(ye)) = (&x.exact, &y.exact) {
        let mut set = xe.clone();
        set.extend(ye.iter().cloned());
        let mut z = Info::exact_set(set);
        z.query = x.query.or(y.query);
        return z.simplify(false);
    }
    let x = x.simplify(true);
    let y = y.simplify(true);
    Info {
        can_empty: x.can_empty || y.can_empty,
        exact: None,
        prefix: union(&x.prefix, &y.prefix),
        suffix: union(&x.suffix, &y.suffix),
        query: x.query.or(y.query),
    }
}

fn star(x: Info) -> Info {
    // Zero repetitions matches the empty string, so a starred expression could be
    // absent entirely: it constrains nothing and severs trigrams across it
    // (empty prefix/suffix), which is what makes `Google.*Search` clean.
    let _ = x;
    Info {
        can_empty: true,
        exact: None,
        prefix: BTreeSet::new(),
        suffix: BTreeSet::new(),
        query: Query::All,
    }
}

fn plus(x: Info) -> Info {
    // One or more: one occurrence's trigrams are still required, but the length
    // is unbounded, so we drop `exact` and keep only the query and prefix/suffix.
    let mut x = x.simplify(true);
    x.exact = None;
    x
}

fn quest(x: Info) -> Info {
    // Optional: fold in the empty string as another alternative.
    if let Some(set) = &x.exact {
        let mut set = set.clone();
        set.insert(String::new());
        return Info::exact_set(set).simplify(false);
    }
    let mut x = x.simplify(true);
    x.can_empty = true;
    x.query = Query::All; // the empty match means nothing can be required
    x.prefix.insert(String::new());
    x.suffix.insert(String::new());
    x
}
