// Shared board state, driven identically by both transports. The WebSocket
// handler and the data-star SSE handler both mutate one `World` behind a mutex,
// so the only thing that differs between the two demos is how bytes reach the
// browser, never the model. The server is a trusting relay with a per-box
// holder lock, not a simulation: last write wins.
use serde::Serialize;
use std::collections::HashMap;

pub const BOARD_W: f64 = 680.0;
pub const BOARD_H: f64 = 420.0;
pub const MIN_BOX: f64 = 48.0;

pub const PALETTE: [&str; 6] = ["#ffd23f", "#ff6f91", "#7c5cff", "#2ec4b6", "#ff924c", "#9bf6ff"];
const ADJS: [&str; 8] = ["swift", "calm", "bold", "keen", "wry", "bright", "lucky", "brave"];
const NOUNS: [&str; 8] = ["otter", "finch", "koi", "lynx", "moth", "wren", "fox", "newt"];

pub fn name_for(n: u32) -> String {
    let n = n as usize;
    format!("{}-{}", ADJS[n % ADJS.len()], NOUNS[(n / ADJS.len()) % NOUNS.len()])
}

fn clamp(v: f64, lo: f64, hi: f64) -> f64 {
    v.max(lo).min(hi)
}

#[derive(Clone, Serialize)]
pub struct Cursor {
    pub id: u32,
    pub x: f64,
    pub y: f64,
    pub color: String,
    pub name: String,
}

#[derive(Clone, Serialize)]
pub struct Box {
    pub id: String,
    pub x: f64,
    pub y: f64,
    pub w: f64,
    pub h: f64,
    pub color: String,
    #[serde(rename = "heldBy")]
    pub held_by: Option<String>,
}

#[derive(Serialize)]
pub struct StateFrame<'a> {
    pub t: &'a str,
    pub cursors: Vec<Cursor>,
    pub boxes: &'a [Box],
}

// What a data-star client is holding. The WebSocket client computes box
// geometry itself and sends it whole; the data-star client can only POST its
// pointer, so the server remembers the grab and does the geometry. Same end
// state, the work just moves to whichever side has the information.
pub struct Hold {
    pub box_id: String,
    pub resize: bool,
    pub grab_x: f64,
    pub grab_y: f64,
}

pub struct World {
    pub cursors: HashMap<u32, Cursor>,
    pub boxes: Vec<Box>,
    pub holds: HashMap<u32, Hold>,
    next_id: u32,
}

impl World {
    pub fn new() -> Self {
        let boxes = vec![
            Box { id: "a".into(), x: 70.0, y: 70.0, w: 150.0, h: 100.0, color: "#e0563f".into(), held_by: None },
            Box { id: "b".into(), x: 300.0, y: 180.0, w: 170.0, h: 120.0, color: "#3f8ee0".into(), held_by: None },
            Box { id: "c".into(), x: 510.0, y: 90.0, w: 120.0, h: 120.0, color: "#46b06a".into(), held_by: None },
        ];
        Self { cursors: HashMap::new(), boxes, holds: HashMap::new(), next_id: 1 }
    }

    /// Reserve an identity for a new client. The cursor itself appears only once
    /// the client sends its first position, so a connected-but-idle user isn't
    /// drawn at (0,0).
    pub fn new_client(&mut self) -> (u32, String, String) {
        let id = self.next_id;
        self.next_id += 1;
        let color = PALETTE[((id - 1) as usize) % PALETTE.len()].to_string();
        (id, color, name_for(id - 1))
    }

    pub fn remove_client(&mut self, id: u32) {
        self.cursors.remove(&id);
        self.holds.remove(&id);
        for b in &mut self.boxes {
            if b.held_by.as_deref() == Some(&id.to_string()) {
                b.held_by = None;
            }
        }
    }

    pub fn set_cursor(&mut self, id: u32, x: f64, y: f64, color: &str, name: &str) {
        let c = self.cursors.entry(id).or_insert_with(|| Cursor {
            id,
            x,
            y,
            color: color.to_string(),
            name: name.to_string(),
        });
        c.x = clamp(x, 0.0, BOARD_W);
        c.y = clamp(y, 0.0, BOARD_H);
    }

    pub fn grab(&mut self, id: u32, box_id: &str) {
        if let Some(b) = self.boxes.iter_mut().find(|b| b.id == box_id) {
            if b.held_by.is_none() {
                b.held_by = Some(id.to_string());
            }
        }
    }

    /// Move or resize a box. Only the holder may, so two grabbers don't fight.
    pub fn move_box(&mut self, id: u32, box_id: &str, x: f64, y: f64, w: f64, h: f64) {
        if let Some(b) = self.boxes.iter_mut().find(|b| b.id == box_id) {
            if b.held_by.as_deref() == Some(&id.to_string()) {
                b.x = clamp(x, 0.0, BOARD_W - MIN_BOX);
                b.y = clamp(y, 0.0, BOARD_H - MIN_BOX);
                b.w = clamp(w, MIN_BOX, BOARD_W - b.x);
                b.h = clamp(h, MIN_BOX, BOARD_H - b.y);
            }
        }
    }

    pub fn release(&mut self, id: u32, box_id: &str) {
        if let Some(b) = self.boxes.iter_mut().find(|b| b.id == box_id) {
            if b.held_by.as_deref() == Some(&id.to_string()) {
                b.held_by = None;
            }
        }
    }

    // --- data-star drag: the server holds the grab and does the geometry -----

    /// Start a data-star drag. `grab_x/grab_y` are the pointer offset inside the
    /// box at grab time (move), unused for a resize.
    pub fn grab_ds(&mut self, id: u32, box_id: &str, resize: bool, grab_x: f64, grab_y: f64) {
        self.grab(id, box_id);
        if self.boxes.iter().any(|b| b.id == box_id && b.held_by.as_deref() == Some(&id.to_string())) {
            self.holds.insert(id, Hold { box_id: box_id.to_string(), resize, grab_x, grab_y });
        }
    }

    /// Apply a pointer position to whatever this client is holding. The pointer
    /// is in board space; the server turns it into a move or a resize.
    pub fn drag_ds(&mut self, id: u32, px: f64, py: f64) {
        let Some(hold) = self.holds.get(&id) else { return };
        let Some(b) = self.boxes.iter().find(|b| b.id == hold.box_id) else { return };
        let (x, y, w, h) = if hold.resize {
            (b.x, b.y, px - b.x, py - b.y)
        } else {
            (px - hold.grab_x, py - hold.grab_y, b.w, b.h)
        };
        let box_id = hold.box_id.clone();
        self.move_box(id, &box_id, x, y, w, h);
    }

    pub fn release_ds(&mut self, id: u32) {
        if let Some(hold) = self.holds.remove(&id) {
            self.release(id, &hold.box_id);
        }
    }

    pub fn state_json(&self) -> String {
        let mut cursors: Vec<Cursor> = self.cursors.values().cloned().collect();
        cursors.sort_by_key(|c| c.id);
        serde_json::to_string(&StateFrame { t: "state", cursors, boxes: &self.boxes }).unwrap()
    }
}
