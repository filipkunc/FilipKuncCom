// Shared collaborative board, both transports in one axum binary so neither can
// be a slower server than the other (see Cargo.toml). Two boards over the same
// world:
//   /       ws.html   - WebSocket: one bidirectional socket, 30 Hz JSON
//                       snapshots down, the client interpolates them up to the
//                       display refresh rate.
//   /board  sse.html  - data-star: a server-sent-events stream patches
//                       server-rendered cursor elements into the DOM, and every
//                       cursor move is its own POST back up.
//
// The contrast is the point: SSE is one-directional, so input has nowhere to go
// but a fresh request per event, and the framework owns the DOM, so there is no
// seam to interpolate in.
mod board;

use {
    asynk_strim::{stream_fn, Yielder},
    axum::{
        extract::{
            ws::{Message, WebSocket, WebSocketUpgrade},
            State,
        },
        http::StatusCode,
        response::{sse::Event, Html, IntoResponse, Sse},
        routing::{get, post},
        Router,
    },
    board::{name_for, World, BOARD_H, BOARD_W, MIN_BOX, PALETTE},
    core::convert::Infallible,
    datastar::prelude::{ElementPatchMode, PatchElements, PatchSignals},
    datastar::axum::ReadSignals,
    futures::{SinkExt, StreamExt},
    serde::Deserialize,
    std::sync::{Arc, Mutex},
    tokio::{
        sync::broadcast,
        time::{interval, sleep, Duration},
    },
};

#[derive(Clone)]
struct App {
    world: Arc<Mutex<World>>,
    tx: broadcast::Sender<String>,
}

const WS_HTML: &str = include_str!("../ws.html");
const SSE_HTML: &str = include_str!("../sse.html");
const TICK_MS: u64 = 1000 / 30;

/// Apply a world mutation now, or after `lat` ms of simulated one-way latency.
/// Both transports route input through here, so the latency knob behaves the
/// same on each: it is the delay before the server acts on what you did, which
/// is the gap client-side prediction exists to hide.
fn schedule<F: FnOnce(&mut World) + Send + 'static>(app: &App, lat: u64, f: F) {
    let world = app.world.clone();
    if lat == 0 {
        f(&mut world.lock().unwrap());
    } else {
        tokio::spawn(async move {
            sleep(Duration::from_millis(lat.min(1000))).await;
            f(&mut world.lock().unwrap());
        });
    }
}

#[tokio::main]
async fn main() {
    let (tx, _) = broadcast::channel::<String>(64);
    let app = App { world: Arc::new(Mutex::new(World::new())), tx: tx.clone() };

    // 30 Hz snapshot broadcast for the WebSocket clients. The data-star stream
    // builds its own patches per connection (it needs per-client identity to
    // skip drawing your own cursor), so it does not ride this channel.
    {
        let app = app.clone();
        tokio::spawn(async move {
            let mut tick = interval(Duration::from_millis(TICK_MS));
            loop {
                tick.tick().await;
                let frame = app.world.lock().unwrap().state_json();
                let _ = app.tx.send(frame);
            }
        });
    }

    let router = Router::new()
        .route("/", get(|| async { Html(WS_HTML) }))
        .route("/ws", get(ws_upgrade))
        .route("/board", get(|| async { Html(SSE_HTML) }))
        .route("/sse", get(sse))
        .route("/cursor", post(post_cursor))
        .route("/grab", post(post_grab))
        .route("/release", post(post_release))
        .with_state(app);

    let addr = std::env::var("ADDR").unwrap_or_else(|_| "127.0.0.1:8091".into());
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    println!("collab-board listening on {}", listener.local_addr().unwrap());
    axum::serve(listener, router).await.unwrap();
}

// --- WebSocket board -------------------------------------------------------

async fn ws_upgrade(ws: WebSocketUpgrade, State(app): State<App>) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_ws(socket, app))
}

// #region ws-handler
async fn handle_ws(socket: WebSocket, app: App) {
    let (id, color, name) = app.world.lock().unwrap().new_client();
    let (mut sink, mut stream) = socket.split();

    let init = serde_json::json!({
        "t": "init", "id": id, "color": color, "name": name,
        "board": { "w": BOARD_W, "h": BOARD_H, "min": MIN_BOX }
    })
    .to_string();
    if sink.send(Message::Text(init.into())).await.is_err() {
        app.world.lock().unwrap().remove_client(id);
        return;
    }

    // Down: forward every 30 Hz snapshot to this socket.
    let mut rx = app.tx.subscribe();
    let send_task = tokio::spawn(async move {
        while let Ok(frame) = rx.recv().await {
            if sink.send(Message::Text(frame.into())).await.is_err() {
                break;
            }
        }
    });

    // Up: apply input, after an optional {t:"lat"} simulated latency.
    let mut cur_lat = 0u64;
    while let Some(Ok(msg)) = stream.next().await {
        if let Message::Text(text) = msg {
            let s = text.as_str();
            if let Ok(v) = serde_json::from_str::<serde_json::Value>(s) {
                if v.get("t").and_then(|t| t.as_str()) == Some("lat") {
                    cur_lat = v.get("ms").and_then(|n| n.as_u64()).unwrap_or(0);
                    continue;
                }
            }
            let (color2, name2, text2) = (color.clone(), name.clone(), s.to_string());
            schedule(&app, cur_lat, move |w| apply_world(w, id, &color2, &name2, &text2));
        }
    }

    app.world.lock().unwrap().remove_client(id);
    send_task.abort();
}
// #endregion

fn apply_world(world: &mut World, id: u32, color: &str, name: &str, text: &str) {
    let Ok(v) = serde_json::from_str::<serde_json::Value>(text) else { return };
    match v.get("t").and_then(|t| t.as_str()) {
        Some("cursor") => {
            let x = v.get("x").and_then(|n| n.as_f64()).unwrap_or(0.0);
            let y = v.get("y").and_then(|n| n.as_f64()).unwrap_or(0.0);
            world.set_cursor(id, x, y, color, name);
        }
        Some("grab") => {
            if let Some(bid) = v.get("id").and_then(|s| s.as_str()) {
                world.grab(id, bid);
            }
        }
        Some("box") => {
            if let Some(bid) = v.get("id").and_then(|s| s.as_str()) {
                let f = |k: &str| v.get(k).and_then(|n| n.as_f64()).unwrap_or(0.0);
                world.move_box(id, bid, f("x"), f("y"), f("w"), f("h"));
            }
        }
        Some("release") => {
            if let Some(bid) = v.get("id").and_then(|s| s.as_str()) {
                world.release(id, bid);
            }
        }
        _ => {}
    }
}

// --- data-star SSE board ---------------------------------------------------

// Removes a client's cursor when its SSE stream is dropped (tab closed, network
// gone). With SSE the stream future is the only signal we get that a client
// left, so cleanup hangs off its Drop rather than a socket close handler.
struct Leave {
    world: Arc<Mutex<World>>,
    id: u32,
}
impl Drop for Leave {
    fn drop(&mut self) {
        self.world.lock().unwrap().remove_client(self.id);
    }
}

// #region ds-stream
async fn sse(State(app): State<App>) -> impl IntoResponse {
    let (id, color, name) = app.world.lock().unwrap().new_client();
    let world = app.world.clone();
    Sse::new(stream_fn(move |mut y: Yielder<Result<Event, Infallible>>| async move {
        let _leave = Leave { world: world.clone(), id };

        // First event: who you are.
        let ident = format!(r#"{{"me":{id},"color":"{color}","name":"{name}"}}"#);
        y.yield_item(Ok(PatchSignals::new(ident).write_as_axum_sse_event())).await;

        // Then 30 Hz of server-rendered cursors and boxes, morphed into the DOM.
        let mut tick = interval(Duration::from_millis(TICK_MS));
        loop {
            tick.tick().await;
            let (cursors_html, boxes_html) = {
                let w = world.lock().unwrap();
                (render_cursors(&w, id), render_boxes(&w, id))
            };
            let p1 = PatchElements::new(cursors_html).selector("#cursors").mode(ElementPatchMode::Inner);
            y.yield_item(Ok(p1.write_as_axum_sse_event())).await;
            let p2 = PatchElements::new(boxes_html).selector("#boxes").mode(ElementPatchMode::Inner);
            y.yield_item(Ok(p2.write_as_axum_sse_event())).await;
        }
    }))
}
// #endregion

fn render_cursors(world: &World, own: u32) -> String {
    // A hidden anchor keeps #cursors non-empty when you are alone, so the inner
    // patch is always a valid, stable morph target.
    let mut s = String::from(r#"<i id="cur-anchor" style="display:none"></i>"#);
    let mut cursors: Vec<_> = world.cursors.values().filter(|c| c.id != own).collect();
    cursors.sort_by_key(|c| c.id);
    for c in cursors {
        s.push_str(&format!(
            r##"<div class="cursor" id="cur-{id}" style="transform:translate({x:.1}px,{y:.1}px)"><svg width="22" height="22" viewBox="0 0 22 22"><path d="M2 2 L2 17 L6.5 12.5 L9.5 19 L12 18 L9 11.5 L15 11.5 Z" fill="{color}" stroke="#0d1018" stroke-width="1"/></svg><span style="background:{color}">{name}</span></div>"##,
            id = c.id, x = c.x, y = c.y, color = c.color, name = c.name
        ));
    }
    s
}

// #region ds-render
fn render_boxes(world: &World, viewer: u32) -> String {
    let viewer_s = viewer.to_string();
    let mut s = String::from(r#"<i id="box-anchor" style="display:none"></i>"#);
    for b in &world.boxes {
        // Outline + name only when someone else is holding it.
        let held_other = match &b.held_by {
            Some(h) if *h != viewer_s => Some(h.as_str()),
            _ => None,
        };
        let outline = if held_other.is_some() { ";outline:2px solid #fff;outline-offset:1px" } else { "" };
        let label = held_other
            .and_then(|h| world.cursors.values().find(|c| c.id.to_string() == h))
            .map(|c| c.name.as_str())
            .unwrap_or("");
        s.push_str(&format!(
            r##"<div class="box" id="box-{id}"
                 style="transform:translate({x:.1}px,{y:.1}px);width:{w:.1}px;height:{h:.1}px;background:{color}{outline}"
                 data-on:pointerdown="$dragId='{id}', $resize=false, $grabx=evt.offsetX, $graby=evt.offsetY, @post('/grab')">
              <div class="handle" data-on:pointerdown__stop="$dragId='{id}', $resize=true, @post('/grab')"></div>
              <div class="held">{label}</div>
            </div>"##,
            id = b.id, x = b.x, y = b.y, w = b.w, h = b.h, color = b.color
        ));
    }
    s
}
// #endregion

#[derive(Deserialize)]
struct CursorIn {
    me: u32,
    mx: f64,
    my: f64,
    lat: u64,
}

// Every cursor move is its own POST. data-star cancels any in-flight request to
// the same URL when a new one starts, so under latency a fast drag drops most
// of these, which is exactly the wall this demo is here to show. The same post
// also drags whatever box this client is holding, so dragging needs no separate
// request: the server already knows the grab.
async fn post_cursor(State(app): State<App>, ReadSignals(s): ReadSignals<CursorIn>) -> StatusCode {
    if s.me >= 1 {
        let (me, mx, my) = (s.me, s.mx, s.my);
        schedule(&app, s.lat, move |w| {
            let color = PALETTE[((me - 1) as usize) % PALETTE.len()];
            w.set_cursor(me, mx, my, color, &name_for(me - 1));
            w.drag_ds(me, mx, my); // no-op unless this client is holding a box
        });
    }
    StatusCode::NO_CONTENT
}

#[derive(Deserialize)]
struct GrabIn {
    me: u32,
    #[serde(rename = "dragId")]
    drag_id: String,
    resize: bool,
    grabx: f64,
    graby: f64,
    lat: u64,
}

async fn post_grab(State(app): State<App>, ReadSignals(s): ReadSignals<GrabIn>) -> StatusCode {
    if s.me >= 1 && !s.drag_id.is_empty() {
        let (me, id, resize, gx, gy) = (s.me, s.drag_id, s.resize, s.grabx, s.graby);
        schedule(&app, s.lat, move |w| w.grab_ds(me, &id, resize, gx, gy));
    }
    StatusCode::NO_CONTENT
}

#[derive(Deserialize)]
struct MeIn {
    me: u32,
    lat: u64,
}

async fn post_release(State(app): State<App>, ReadSignals(s): ReadSignals<MeIn>) -> StatusCode {
    if s.me >= 1 {
        let me = s.me;
        schedule(&app, s.lat, move |w| w.release_ds(me));
    }
    StatusCode::NO_CONTENT
}
