//! A minimal trigram-index code search, dependency-free, for the post.
//!
//!   trigram index <dir> [--out FILE]     build the index
//!   trigram explain <regex>              print the trigram query for a regex
//!   trigram search <regex> [--index FILE] [--stats]
//!
//! The point is to watch a regex become a boolean query over trigrams, see how
//! few files that query selects out of the whole tree, and run the real match
//! only on those. It is a teaching tool, not a ripgrep competitor. The index is
//! memory-mapped, so a search faults in only the pages it reads rather than
//! loading the whole file.

mod matcher;
mod mmap;
mod query;
mod regex;

use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::io::Read;
use std::path::{Path, PathBuf};
use std::process::exit;
use std::time::Instant;

use mmap::Mmap;

const MAX_FILE: u64 = 1 << 20; // skip files larger than 1 MiB
const DEFAULT_INDEX: &str = "trigram.idx";

fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let result = match args.first().map(String::as_str) {
        Some("index") => cmd_index(&args[1..]),
        Some("explain") => cmd_explain(&args[1..]),
        Some("search") => cmd_search(&args[1..]),
        _ => {
            eprintln!("usage: trigram <index|explain|search> ...");
            exit(2);
        }
    };
    if let Err(e) = result {
        eprintln!("error: {e}");
        exit(1);
    }
}

// ---- building the index ----------------------------------------------------

/// The index as we build it in memory, before serializing. Reading it back is a
/// different type (`Index`) that maps the file rather than parsing it.
struct Builder {
    root: PathBuf,
    docs: Vec<String>,                     // paths relative to root
    postings: BTreeMap<[u8; 3], Vec<u32>>, // trigram -> sorted doc ids
}

impl Builder {
    fn build(root: &Path) -> std::io::Result<Builder> {
        let mut docs = Vec::new();
        let mut postings: BTreeMap<[u8; 3], Vec<u32>> = BTreeMap::new();
        let mut files = Vec::new();
        collect(root, &mut files)?;
        files.sort();

        for path in files {
            let Ok(bytes) = read_text(&path) else { continue };
            let id = docs.len() as u32;
            let mut seen: BTreeSet<[u8; 3]> = BTreeSet::new();
            for w in bytes.windows(3) {
                seen.insert([w[0], w[1], w[2]]);
            }
            if seen.is_empty() {
                continue;
            }
            for t in seen {
                postings.entry(t).or_default().push(id);
            }
            let rel = path.strip_prefix(root).unwrap_or(&path);
            docs.push(rel.to_string_lossy().into_owned());
        }
        Ok(Builder {
            root: root.to_path_buf(),
            docs,
            postings,
        })
    }
}

// ---- reading the index (memory-mapped) -------------------------------------

struct Index {
    root: PathBuf,
    docs: Vec<String>,
    map: Mmap,
    tri: usize,   // byte offset of the sorted trigram table
    n_tri: usize, // number of 12-byte records in that table
    post: usize,  // byte offset of the postings blob
}

impl Index {
    // #region evaluate
    /// Evaluate a trigram query to the set of candidate doc ids.
    fn candidates(&self, q: &query::Query) -> Vec<u32> {
        match q {
            query::Query::All => (0..self.docs.len() as u32).collect(),
            query::Query::None => Vec::new(),
            query::Query::Trigram(t) => self.posting(t),
            query::Query::And(parts) => parts
                .iter()
                .map(|p| self.candidates(p))
                .reduce(intersect)
                .unwrap_or_default(),
            query::Query::Or(parts) => parts
                .iter()
                .map(|p| self.candidates(p))
                .reduce(union)
                .unwrap_or_default(),
        }
    }

    /// Binary-search the sorted trigram table in the mapped file, then copy out
    /// its posting list. Nothing is parsed up front: only the few pages these
    /// reads land on are faulted in from disk.
    fn posting(&self, t: &str) -> Vec<u32> {
        let key = t.as_bytes();
        if key.len() != 3 {
            return (0..self.docs.len() as u32).collect();
        }
        let data = self.map.as_slice();
        let (mut lo, mut hi) = (0usize, self.n_tri);
        while lo < hi {
            let mid = (lo + hi) / 2;
            let rec = self.tri + mid * 12; // 3 bytes trigram, pad, u32 offset, u32 count
            match data[rec..rec + 3].cmp(key) {
                std::cmp::Ordering::Less => lo = mid + 1,
                std::cmp::Ordering::Greater => hi = mid,
                std::cmp::Ordering::Equal => {
                    let at = self.post + u32_at(data, rec + 4) as usize;
                    let n = u32_at(data, rec + 8) as usize;
                    return (0..n).map(|i| u32_at(data, at + i * 4)).collect();
                }
            }
        }
        Vec::new()
    }
    // #endregion evaluate

    fn load(path: &Path) -> std::io::Result<Index> {
        let file = fs::File::open(path)?;
        let map = Mmap::open(&file)?;
        let data = map.as_slice();
        if data.len() < 4 || &data[0..4] != b"TRG2" {
            return Err(std::io::Error::other("not a trigram index"));
        }
        let mut p = 4usize;
        let root = PathBuf::from(get_str(data, &mut p));
        let n_docs = get_u32(data, &mut p);
        let mut docs = Vec::with_capacity(n_docs as usize);
        for _ in 0..n_docs {
            docs.push(get_str(data, &mut p));
        }
        while p % 4 != 0 {
            p += 1; // align the trigram table so its u32 fields are word-aligned
        }
        let n_tri = get_u32(data, &mut p) as usize;
        let tri = p;
        let post = tri + n_tri * 12;
        Ok(Index { root, docs, map, tri, n_tri, post })
    }
}

fn u32_at(data: &[u8], at: usize) -> u32 {
    u32::from_le_bytes(data[at..at + 4].try_into().unwrap())
}

fn intersect(a: Vec<u32>, b: Vec<u32>) -> Vec<u32> {
    let (mut i, mut j, mut out) = (0, 0, Vec::new());
    while i < a.len() && j < b.len() {
        match a[i].cmp(&b[j]) {
            std::cmp::Ordering::Less => i += 1,
            std::cmp::Ordering::Greater => j += 1,
            std::cmp::Ordering::Equal => {
                out.push(a[i]);
                i += 1;
                j += 1;
            }
        }
    }
    out
}

fn union(a: Vec<u32>, b: Vec<u32>) -> Vec<u32> {
    let mut out: BTreeSet<u32> = a.into_iter().collect();
    out.extend(b);
    out.into_iter().collect()
}

// ---- walking and reading ---------------------------------------------------

fn collect(dir: &Path, out: &mut Vec<PathBuf>) -> std::io::Result<()> {
    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();
        let name = entry.file_name();
        if name == ".git" {
            continue;
        }
        if entry.file_type()?.is_dir() {
            collect(&path, out)?;
        } else if entry.file_type()?.is_file() {
            out.push(path);
        }
    }
    Ok(())
}

/// Read a file if it looks like text: under the size cap and with no NUL byte
/// in the first 8 KiB. Real indexers make the same kind of call.
fn read_text(path: &Path) -> std::io::Result<Vec<u8>> {
    let meta = fs::metadata(path)?;
    if meta.len() > MAX_FILE {
        return Err(std::io::Error::other("too large"));
    }
    let mut f = fs::File::open(path)?;
    let mut head = [0u8; 8192];
    let n = f.read(&mut head)?;
    if head[..n].contains(&0) {
        return Err(std::io::Error::other("binary"));
    }
    let mut rest = Vec::new();
    f.read_to_end(&mut rest)?;
    let mut bytes = head[..n].to_vec();
    bytes.extend_from_slice(&rest);
    Ok(bytes)
}

// ---- serialization ---------------------------------------------------------
// A flat, mmap-friendly layout: "TRG2", the root path, the doc paths, then a
// sorted table of fixed 12-byte trigram records (3 bytes + pad + u32 byte
// offset + u32 count) followed by the postings blob of u32 doc ids. Reading it
// back binary-searches the table in place; no parsing of the postings up front.

fn save(b: &Builder, path: &Path) -> std::io::Result<()> {
    let mut buf = Vec::new();
    buf.extend_from_slice(b"TRG2");
    put_str(&mut buf, &b.root.to_string_lossy());
    put_u32(&mut buf, b.docs.len() as u32);
    for d in &b.docs {
        put_str(&mut buf, d);
    }
    while buf.len() % 4 != 0 {
        buf.push(0);
    }
    put_u32(&mut buf, b.postings.len() as u32);

    let mut table = Vec::with_capacity(b.postings.len() * 12);
    let mut blob = Vec::new();
    for (t, list) in &b.postings {
        table.extend_from_slice(t);
        table.push(0);
        put_u32(&mut table, blob.len() as u32); // byte offset into the blob
        put_u32(&mut table, list.len() as u32);
        for id in list {
            put_u32(&mut blob, *id);
        }
    }
    buf.extend_from_slice(&table);
    buf.extend_from_slice(&blob);
    fs::write(path, &buf)
}

fn put_u32(buf: &mut Vec<u8>, v: u32) {
    buf.extend_from_slice(&v.to_le_bytes());
}
fn put_str(buf: &mut Vec<u8>, s: &str) {
    put_u32(buf, s.len() as u32);
    buf.extend_from_slice(s.as_bytes());
}
fn get_u32(data: &[u8], p: &mut usize) -> u32 {
    let v = u32::from_le_bytes(data[*p..*p + 4].try_into().unwrap());
    *p += 4;
    v
}
fn get_str(data: &[u8], p: &mut usize) -> String {
    let len = get_u32(data, p) as usize;
    let s = String::from_utf8_lossy(&data[*p..*p + len]).into_owned();
    *p += len;
    s
}

// ---- commands --------------------------------------------------------------

fn cmd_index(args: &[String]) -> Result<(), String> {
    let dir = args.first().ok_or("index: need a directory")?;
    let out = flag(args, "--out").unwrap_or_else(|| DEFAULT_INDEX.to_string());
    let started = Instant::now();
    let builder = Builder::build(Path::new(dir)).map_err(|e| e.to_string())?;
    let build = started.elapsed();
    save(&builder, Path::new(&out)).map_err(|e| e.to_string())?;
    let size = fs::metadata(&out).map(|m| m.len()).unwrap_or(0);
    println!("indexed {} files in {:.2}s", builder.docs.len(), build.as_secs_f64());
    println!("{} distinct trigrams", builder.postings.len());
    println!("index {} ({:.1} MB)", out, size as f64 / 1e6);
    Ok(())
}

fn cmd_explain(args: &[String]) -> Result<(), String> {
    let pattern = args.first().ok_or("explain: need a regex")?;
    let ast = regex::parse(pattern)?;
    let info = query::analyze(&ast);
    println!("{}", info.query.explain());
    Ok(())
}

fn cmd_search(args: &[String]) -> Result<(), String> {
    let pattern = args.first().ok_or("search: need a regex")?;
    let idx_path = flag(args, "--index").unwrap_or_else(|| DEFAULT_INDEX.to_string());
    let stats = args.iter().any(|a| a == "--stats");

    let ast = regex::parse(pattern)?;
    let q = query::analyze(&ast).query;
    let index = Index::load(Path::new(&idx_path)).map_err(|e| e.to_string())?;

    let t0 = Instant::now();
    let cands = index.candidates(&q);
    let filter = t0.elapsed();

    // Verify the candidates: open each and run the real matcher.
    let mut hits = Vec::new();
    for id in &cands {
        let path = index.root.join(&index.docs[*id as usize]);
        if let Ok(bytes) = read_text(&path) {
            if matcher::search(&ast, &bytes) {
                hits.push(index.docs[*id as usize].clone());
            }
        }
    }
    let total = t0.elapsed();

    for h in &hits {
        println!("{h}");
    }
    if stats {
        eprintln!(
            "query: {}\ncandidates: {} of {} files ({:.2}%), matches: {}\nfilter: {:.2}ms, total: {:.2}ms",
            q.explain(),
            cands.len(),
            index.docs.len(),
            100.0 * cands.len() as f64 / index.docs.len().max(1) as f64,
            hits.len(),
            filter.as_secs_f64() * 1e3,
            total.as_secs_f64() * 1e3,
        );
    }
    Ok(())
}

fn flag(args: &[String], name: &str) -> Option<String> {
    args.iter().position(|a| a == name).and_then(|i| args.get(i + 1).cloned())
}
