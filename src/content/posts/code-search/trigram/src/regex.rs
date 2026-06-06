//! A deliberately small regex parser: enough syntax to show the trigram
//! translation, not a full engine. It produces an AST that `query.rs` analyzes.
//!
//! Supported: literals, `.`, `*`, `+`, `?`, `|`, grouping `( )`, character
//! classes `[abc]` and ranges `[a-z]`, and `\` escapes. A class with more than a
//! handful of members is folded to `.` because it constrains nothing useful.

#[derive(Clone, Debug)]
pub enum Ast {
    Empty,
    Literal(char),
    AnyChar,
    Class(Vec<char>),
    Concat(Vec<Ast>),
    Alternate(Vec<Ast>),
    Star(Box<Ast>),
    Plus(Box<Ast>),
    Quest(Box<Ast>),
}

const MAX_CLASS: usize = 16;

pub fn parse(pattern: &str) -> Result<Ast, String> {
    let mut p = Parser {
        chars: pattern.chars().collect(),
        pos: 0,
    };
    let ast = p.alternation()?;
    if p.pos != p.chars.len() {
        return Err(format!("unexpected `{}`", p.chars[p.pos]));
    }
    Ok(ast)
}

struct Parser {
    chars: Vec<char>,
    pos: usize,
}

impl Parser {
    fn peek(&self) -> Option<char> {
        self.chars.get(self.pos).copied()
    }
    fn next(&mut self) -> Option<char> {
        let c = self.peek();
        if c.is_some() {
            self.pos += 1;
        }
        c
    }

    // alternation := concat ('|' concat)*
    fn alternation(&mut self) -> Result<Ast, String> {
        let mut parts = vec![self.concat()?];
        while self.peek() == Some('|') {
            self.next();
            parts.push(self.concat()?);
        }
        Ok(if parts.len() == 1 {
            parts.pop().unwrap()
        } else {
            Ast::Alternate(parts)
        })
    }

    // concat := repeat*
    fn concat(&mut self) -> Result<Ast, String> {
        let mut parts = Vec::new();
        while let Some(c) = self.peek() {
            if c == '|' || c == ')' {
                break;
            }
            parts.push(self.repeat()?);
        }
        Ok(match parts.len() {
            0 => Ast::Empty,
            1 => parts.pop().unwrap(),
            _ => Ast::Concat(parts),
        })
    }

    // repeat := atom ('*' | '+' | '?')*
    fn repeat(&mut self) -> Result<Ast, String> {
        let mut atom = self.atom()?;
        while let Some(c) = self.peek() {
            atom = match c {
                '*' => Ast::Star(Box::new(atom)),
                '+' => Ast::Plus(Box::new(atom)),
                '?' => Ast::Quest(Box::new(atom)),
                _ => break,
            };
            self.next();
        }
        Ok(atom)
    }

    fn atom(&mut self) -> Result<Ast, String> {
        match self.next() {
            Some('(') => {
                let inner = self.alternation()?;
                if self.next() != Some(')') {
                    return Err("missing `)`".into());
                }
                Ok(inner)
            }
            Some('[') => self.class(),
            Some('.') => Ok(Ast::AnyChar),
            Some('\\') => match self.next() {
                Some(c) => Ok(Ast::Literal(c)),
                None => Err("trailing `\\`".into()),
            },
            Some(c) => Ok(Ast::Literal(c)),
            None => Err("unexpected end".into()),
        }
    }

    fn class(&mut self) -> Result<Ast, String> {
        let mut chars = Vec::new();
        let mut prev: Option<char> = None;
        while let Some(c) = self.next() {
            match c {
                ']' => {
                    if let Some(p) = prev {
                        chars.push(p);
                    }
                    // A wide class carries no useful trigram constraint.
                    if chars.len() > MAX_CLASS {
                        return Ok(Ast::AnyChar);
                    }
                    return Ok(Ast::Class(chars));
                }
                '-' if prev.is_some() && self.peek() != Some(']') => {
                    let lo = prev.take().unwrap();
                    let hi = self.next().ok_or("bad range")?;
                    for ch in lo..=hi {
                        chars.push(ch);
                        if chars.len() > MAX_CLASS {
                            // Skip to the closing bracket and give up on the class.
                            while let Some(x) = self.next() {
                                if x == ']' {
                                    break;
                                }
                            }
                            return Ok(Ast::AnyChar);
                        }
                    }
                }
                _ => {
                    if let Some(p) = prev.replace(c) {
                        chars.push(p);
                    }
                }
            }
        }
        Err("missing `]`".into())
    }
}
