//! A tiny backtracking matcher over the same AST, used only to confirm matches
//! in the handful of files the trigram query lets through. The index does the
//! heavy filtering; this just plays the role RE2 plays in livegrep or the real
//! regex engine plays in ripgrep, on a tiny candidate set.

use crate::regex::Ast;

/// Does `text` contain a match for `ast` anywhere?
pub fn search(ast: &Ast, text: &[u8]) -> bool {
    (0..=text.len()).any(|start| match_here(ast, text, start).is_some())
}

/// Try to match `ast` at `pos`; return the position just past the match.
fn match_here(ast: &Ast, text: &[u8], pos: usize) -> Option<usize> {
    match ast {
        Ast::Empty => Some(pos),
        Ast::Literal(c) => take(text, pos, |b| b == *c as u32),
        Ast::AnyChar => take(text, pos, |b| b != b'\n' as u32),
        Ast::Class(chars) => take(text, pos, |b| chars.iter().any(|c| *c as u32 == b)),
        Ast::Concat(parts) => match_seq(parts, text, pos),
        Ast::Alternate(parts) => parts.iter().find_map(|p| match_here(p, text, pos)),
        Ast::Quest(inner) => match_here(inner, text, pos).or(Some(pos)),
        Ast::Star(inner) => match_repeat(inner, text, pos, 0),
        Ast::Plus(inner) => match_repeat(inner, text, pos, 1),
    }
}

fn take(text: &[u8], pos: usize, ok: impl Fn(u32) -> bool) -> Option<usize> {
    match text.get(pos) {
        Some(&b) if ok(b as u32) => Some(pos + 1),
        _ => None,
    }
}

fn match_seq(parts: &[Ast], text: &[u8], pos: usize) -> Option<usize> {
    match parts.split_first() {
        None => Some(pos),
        Some((head, rest)) => {
            // Greedy with backtracking: try every way the head can match, then
            // continue with the rest from there.
            for end in match_positions(head, text, pos) {
                if let Some(p) = match_seq(rest, text, end) {
                    return Some(p);
                }
            }
            None
        }
    }
}

/// All end positions for a single `ast` matched at `pos`, longest first so the
/// outer `*`/`+` stay greedy.
fn match_positions(ast: &Ast, text: &[u8], pos: usize) -> Vec<usize> {
    match ast {
        Ast::Star(inner) => repeat_positions(inner, text, pos, 0),
        Ast::Plus(inner) => repeat_positions(inner, text, pos, 1),
        Ast::Quest(inner) => match match_here(inner, text, pos) {
            Some(end) if end != pos => vec![end, pos],
            _ => vec![pos],
        },
        other => match_here(other, text, pos).into_iter().collect(),
    }
}

fn repeat_positions(inner: &Ast, text: &[u8], pos: usize, min: usize) -> Vec<usize> {
    let mut ends = vec![pos];
    let mut cur = pos;
    while let Some(next) = match_here(inner, text, cur) {
        if next == cur {
            break; // empty match, avoid looping forever
        }
        cur = next;
        ends.push(cur);
    }
    if min > 0 {
        ends.remove(0); // drop the zero-repetition case
    }
    ends.reverse(); // greedy: try the longest run first
    ends
}

fn match_repeat(inner: &Ast, text: &[u8], pos: usize, min: usize) -> Option<usize> {
    repeat_positions(inner, text, pos, min).into_iter().next()
}
