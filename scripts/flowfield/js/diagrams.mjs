// Small canvas diagrams that sit next to the code excerpts in the post.
// Each one illustrates what a specific region of the Rust source does,
// drawn in the same palette as the live demo. Pure JS, no wasm: the grids
// here are a dozen cells wide and exist to be read, not benchmarked.

const FLOOR = '#10151c';
const GRID_LINE = '#222c39';
const WALL = '#566374';
const MUD = '#6e542e';
const NEAR = [255, 180, 84];
const FAR = [30, 46, 78];
const TEXT = '#9aa7b8';
const BRIGHT = '#e8eef5';
const ACCENT = '#ffb454';
const AGENT = '#6bd9ff';
const PARKED = '#ff7eb6';
const GOAL = '#ff5d5d';
const BAD = '#ff6b6b';
const OK = '#7ee787';

function setup(canvas, w, h) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.aspectRatio = `${w} / ${h}`;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  return ctx;
}

function mix(a, b, t) {
  return [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t));
}

function lerpColor(a, b, t) {
  const c = mix(a, b, t);
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

function arrow(ctx, x0, y0, x1, y1, color, width = 2, headLen = 7) {
  const a = Math.atan2(y1 - y0, x1 - x0);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - headLen * Math.cos(a - 0.45), y1 - headLen * Math.sin(a - 0.45));
  ctx.lineTo(x1 - headLen * Math.cos(a + 0.45), y1 - headLen * Math.sin(a + 0.45));
  ctx.closePath();
  ctx.fill();
}

// Shared toy map for the wavefront and LOS diagrams: a wall with one gap and
// a mud blob, goal on the right.
function toyMap() {
  const W = 22;
  const H = 12;
  const cost = new Uint8Array(W * H).fill(1);
  for (let y = 0; y < H; y++) {
    if (y < 8) cost[y * W + 13] = 255;
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const ex = (x - 17.5) / 2.6;
      const ey = (y - 2.5) / 2.2;
      if (ex * ex + ey * ey < 1) cost[y * W + x] = 8;
    }
  }
  return { W, H, cost, goal: { x: 18, y: 8 } };
}

// Plain 4-neighbor Dijkstra, the same update rule as the Rust integrator.
function integrate({ W, H, cost, goal }) {
  const dist = new Float64Array(W * H).fill(Infinity);
  dist[goal.y * W + goal.x] = 0;
  const queue = [[0, goal.x, goal.y]];
  while (queue.length) {
    queue.sort((a, b) => b[0] - a[0]);
    const [d, x, y] = queue.pop();
    if (d > dist[y * W + x]) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const c = cost[ny * W + nx];
      if (c === 255) continue;
      const nd = d + c;
      if (nd < dist[ny * W + nx]) {
        dist[ny * W + nx] = nd;
        queue.push([nd, nx, ny]);
      }
    }
  }
  return dist;
}

function bresenhamClear({ W, H, cost }, x0, y0, x1, y1) {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    if (cost[y0 * W + x0] > 1) return { clear: false, hit: { x: x0, y: y0 } };
    if (x0 === x1 && y0 === y1) return { clear: true };
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
  }
}

function drawCells(ctx, map, cell, ox, oy, fill) {
  const { W, H, cost } = map;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const c = cost[y * W + x];
      ctx.fillStyle = c === 255 ? WALL : fill(x, y, c);
      ctx.fillRect(ox + x * cell, oy + y * cell, cell, cell);
    }
  }
  ctx.strokeStyle = GRID_LINE;
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x++) {
    ctx.beginPath();
    ctx.moveTo(ox + x * cell + 0.5, oy);
    ctx.lineTo(ox + x * cell + 0.5, oy + H * cell);
    ctx.stroke();
  }
  for (let y = 0; y <= H; y++) {
    ctx.beginPath();
    ctx.moveTo(ox, oy + y * cell + 0.5);
    ctx.lineTo(ox + W * cell, oy + y * cell + 0.5);
    ctx.stroke();
  }
}

function drawGoal(ctx, map, cell, ox, oy) {
  const gx = ox + (map.goal.x + 0.5) * cell;
  const gy = oy + (map.goal.y + 0.5) * cell;
  ctx.fillStyle = GOAL;
  ctx.beginPath();
  ctx.arc(gx, gy, cell * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = GOAL;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(gx, gy, cell * 0.45, 0, Math.PI * 2);
  ctx.stroke();
}

// The integrator as a movie: the wavefront expands from the goal, paying 8x
// to cross mud, and the cost-so-far gradient is left in its wake. Shows the
// finished field until the reader presses play, so it does not fight the
// text around it.
function wavefront(canvas, opts = {}) {
  const W = 660;
  const H = 390;
  const ctx = setup(canvas, W, H);
  const map = toyMap();
  const cell = 28;
  const ox = (W - map.W * cell) / 2;
  const oy = 12;
  const dist = integrate(map);
  let maxd = 0;
  for (const d of dist) if (d !== Infinity && d > maxd) maxd = d;

  function frame(t) {
    ctx.fillStyle = FLOOR;
    ctx.fillRect(0, 0, W, H);
    drawCells(ctx, map, cell, ox, oy, (x, y, c) => {
      const d = dist[y * map.W + x];
      if (d === Infinity || d > t) return c > 1 ? '#2a2419' : FLOOR;
      let col = lerpColor(NEAR, FAR, Math.sqrt(d / maxd));
      if (c > 1) col = lerpColor([110, 84, 46], [40, 35, 22], Math.sqrt(d / maxd) * 0.5);
      return col;
    });
    // Frontier band, only while the wave is still spreading.
    if (t < maxd) {
      for (let y = 0; y < map.H; y++) {
        for (let x = 0; x < map.W; x++) {
          const d = dist[y * map.W + x];
          if (d !== Infinity && d <= t && d > t - 1.6) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
            ctx.fillRect(ox + x * cell, oy + y * cell, cell, cell);
          }
        }
      }
    }
    drawGoal(ctx, map, cell, ox, oy);
    ctx.fillStyle = TEXT;
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(
      'integrated cost so far · the wave pays 8x to cross mud',
      W / 2,
      oy + map.H * cell + 22,
    );
  }

  frame(maxd);
  const btn = opts.button;
  const SPEED = 9; // integrated-cost units per second
  const HOLD = 1.2; // seconds to keep the finished field before stopping
  let playing = false;
  let t = 0;
  let raf = 0;
  let lastNow = 0;

  function setLabel() {
    if (!btn) return;
    btn.textContent = playing ? '❚❚ pause' : t > 0 ? '▶ resume' : '▶ play the wave';
  }
  function tick(now) {
    if (!playing) return;
    if (lastNow) t += ((now - lastNow) / 1000) * SPEED;
    lastNow = now;
    if (t >= maxd + SPEED * HOLD) {
      playing = false;
      t = 0;
      frame(maxd);
      setLabel();
      return;
    }
    frame(Math.min(t, maxd));
    raf = requestAnimationFrame(tick);
  }
  function toggle() {
    playing = !playing;
    if (playing) {
      lastNow = 0;
      raf = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(raf);
    }
    setLabel();
  }
  btn?.addEventListener('click', toggle);
  canvas.addEventListener('click', toggle);
  canvas.style.cursor = 'pointer';
  setLabel();
  return () => cancelAnimationFrame(raf);
}

// Two 3x3 neighborhoods: pick the cheapest neighbor, and the corner rule
// that refuses a diagonal squeezing past a wall.
function flowpick(canvas) {
  const W = 660;
  const H = 330;
  const ctx = setup(canvas, W, H);
  ctx.fillStyle = FLOOR;
  ctx.fillRect(0, 0, W, H);
  const cell = 76;

  function panel(ox, values, wallAt, chosen, blocked, title) {
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        const isWall = wallAt && wallAt.x === x && wallAt.y === y;
        ctx.fillStyle = isWall ? WALL : '#161d27';
        ctx.fillRect(ox + x * cell, 30 + y * cell, cell - 2, cell - 2);
        if (!isWall) {
          const v = values[y][x];
          ctx.fillStyle = x === 1 && y === 1 ? BRIGHT : TEXT;
          ctx.font = `${x === 1 && y === 1 ? 'bold ' : ''}17px system-ui, sans-serif`;
          ctx.fillText(String(v), ox + x * cell + cell / 2, 30 + y * cell + cell / 2);
        }
      }
    }
    const cx = ox + 1 * cell + cell / 2;
    const cy = 30 + 1 * cell + cell / 2;
    if (blocked) {
      const bx = ox + blocked.x * cell + cell / 2;
      const by = 30 + blocked.y * cell + cell / 2;
      arrow(ctx, cx + (bx - cx) * 0.25, cy + (by - cy) * 0.25, cx + (bx - cx) * 0.62, cy + (by - cy) * 0.62, BAD, 2);
      ctx.strokeStyle = BAD;
      ctx.lineWidth = 2.5;
      const mx = (cx + bx) / 2;
      const my = (cy + by) / 2;
      ctx.beginPath();
      ctx.moveTo(mx - 7, my - 7);
      ctx.lineTo(mx + 7, my + 7);
      ctx.moveTo(mx + 7, my - 7);
      ctx.lineTo(mx - 7, my + 7);
      ctx.stroke();
    }
    const tx = ox + chosen.x * cell + cell / 2;
    const ty = 30 + chosen.y * cell + cell / 2;
    arrow(ctx, cx + (tx - cx) * 0.2, cy + (ty - cy) * 0.2, cx + (tx - cx) * 0.72, cy + (ty - cy) * 0.72, ACCENT, 3.5, 9);
    ctx.fillStyle = TEXT;
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(title, ox + 1.5 * cell, 30 + 3 * cell + 24);
  }

  // Left: plain downhill pick, SE (11) wins over E (13).
  panel(
    72,
    [[16, 15, 12], [16, 14, 13], [15, 13, 11]],
    null,
    { x: 2, y: 2 },
    null,
    'pick the cheapest of 8 neighbors',
  );
  // Right: same numbers, but S is a wall, so the SE diagonal would cut its
  // corner. NE (12) wins instead.
  panel(
    372,
    [[16, 15, 12], [16, 14, 13], [15, null, 11]],
    { x: 1, y: 2 },
    { x: 2, y: 0 },
    { x: 2, y: 2 },
    'diagonal past a wall corner is refused',
  );
}

// The LOS region around the goal, one clear sightline and two blocked ones
// (a wall and mud, which blocks LOS the same way).
function los(canvas) {
  const W = 660;
  const H = 400;
  const ctx = setup(canvas, W, H);
  const map = toyMap();
  const cell = 28;
  const ox = (W - map.W * cell) / 2;
  const oy = 12;
  const dist = integrate(map);
  let maxd = 0;
  for (const d of dist) if (d !== Infinity && d > maxd) maxd = d;

  ctx.fillStyle = FLOOR;
  ctx.fillRect(0, 0, W, H);
  drawCells(ctx, map, cell, ox, oy, (x, y, c) => {
    const d = dist[y * map.W + x];
    if (d === Infinity) return FLOOR;
    if (c > 1) return MUD;
    let col = mix(NEAR, FAR, Math.sqrt(d / maxd));
    if (bresenhamClear(map, x, y, map.goal.x, map.goal.y).clear) {
      col = mix(col, [255, 255, 255], 0.22);
    }
    return `rgb(${col[0]}, ${col[1]}, ${col[2]})`;
  });
  drawGoal(ctx, map, cell, ox, oy);

  const gx = ox + (map.goal.x + 0.5) * cell;
  const gy = oy + (map.goal.y + 0.5) * cell;
  function sightline(x, y, color) {
    const res = bresenhamClear(map, x, y, map.goal.x, map.goal.y);
    const sx = ox + (x + 0.5) * cell;
    const sy = oy + (y + 0.5) * cell;
    ctx.setLineDash(res.clear ? [] : [5, 4]);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(gx, gy);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(sx, sy, 4.5, 0, Math.PI * 2);
    ctx.fill();
    if (!res.clear) {
      const hx = ox + (res.hit.x + 0.5) * cell;
      const hy = oy + (res.hit.y + 0.5) * cell;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(hx - 6, hy - 6);
      ctx.lineTo(hx + 6, hy + 6);
      ctx.moveTo(hx + 6, hy - 6);
      ctx.lineTo(hx - 6, hy + 6);
      ctx.stroke();
    }
  }
  sightline(15, 11, OK);
  sightline(4, 4, BAD);
  sightline(21, 1, BAD);

  ctx.fillStyle = TEXT;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(
    'bright cells see the goal and steer straight at it · walls and mud both break the line',
    W / 2,
    oy + map.H * cell + 22,
  );
}

// Steering in two uncluttered halves: how velocity turns toward the field,
// and how neighbors keep their distance.
function steer(canvas) {
  const W = 660;
  const H = 320;
  const ctx = setup(canvas, W, H);
  ctx.fillStyle = FLOOR;
  ctx.fillRect(0, 0, W, H);
  const title = (x, text) => {
    ctx.fillStyle = TEXT;
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(text, x, 286);
  };
  ctx.strokeStyle = GRID_LINE;
  ctx.beginPath();
  ctx.moveTo(338, 24);
  ctx.lineTo(338, 296);
  ctx.stroke();

  // Left: one agent, three arrows fanned well apart, and a dashed arc that
  // says "the cyan arrow turns into the white one, toward the orange one".
  const ax = 150;
  const ay = 165;
  const len = 105;
  const dirAt = (deg) => [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180)];
  const ray = (deg, r) => [ax + dirAt(deg)[0] * r, ay + dirAt(deg)[1] * r];
  const label = (x, y, text, color, align = 'center') => {
    ctx.fillStyle = color;
    ctx.font = '13px system-ui, sans-serif';
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
    ctx.textAlign = 'center';
  };

  const DESIRED = -68;
  const NEXT = -34;
  const CURRENT = 14;
  arrow(ctx, ax, ay, ...ray(DESIRED, len), ACCENT, 3);
  arrow(ctx, ax, ay, ...ray(NEXT, len * 0.96), BRIGHT, 3.5);
  arrow(ctx, ax, ay, ...ray(CURRENT, len), AGENT, 3);
  // The turn arc, between the current and desired directions.
  ctx.setLineDash([4, 5]);
  ctx.strokeStyle = TEXT;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(ax, ay, len + 16, (CURRENT - 6) * (Math.PI / 180), (DESIRED + 6) * (Math.PI / 180), true);
  ctx.stroke();
  ctx.setLineDash([]);
  const [hx, hy] = ray(DESIRED + 8, len + 16);
  arrow(ctx, ...ray(DESIRED + 13, len + 16), hx, hy, TEXT, 1.6, 6);

  ctx.fillStyle = AGENT;
  ctx.beginPath();
  ctx.arc(ax, ay, 9, 0, Math.PI * 2);
  ctx.fill();

  label(...ray(DESIRED, len + 34), 'the field says go here', ACCENT);
  label(...ray(CURRENT + 9, len + 42), 'velocity right now', AGENT);
  const [nx0, ny0] = ray(NEXT - 4, len + 26);
  label(nx0 + 8, ny0, 'next frame', BRIGHT, 'left');
  title(170, 'follow the field, but with momentum');

  // Right: two bodies closer than their radii allow, pushed apart
  // symmetrically.
  const by = 150;
  const b1 = 440;
  const b2 = 530;
  const r = 34;
  ctx.setLineDash([4, 5]);
  ctx.strokeStyle = TEXT;
  ctx.lineWidth = 1.4;
  for (const [bx, col] of [[b1, AGENT], [b2, AGENT]]) {
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(bx, by, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.setLineDash([]);
  arrow(ctx, b1 - 14, by, b1 - 78, by, BAD, 3);
  arrow(ctx, b2 + 14, by, b2 + 78, by, BAD, 3);
  ctx.fillStyle = TEXT;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('bodies overlap', (b1 + b2) / 2, by - r - 18);
  ctx.fillText('half the overlap each, away from the other', (b1 + b2) / 2, by + r + 28);
  title(490, 'separation keeps the crowd from stacking');
}

// Speed multiplier vs cost: 1/sqrt(cost), with grass and mud marked.
function terrain(canvas) {
  const W = 660;
  const H = 260;
  const ctx = setup(canvas, W, H);
  ctx.fillStyle = FLOOR;
  ctx.fillRect(0, 0, W, H);
  const x0 = 70;
  const y0 = 200;
  const xw = 520;
  const yh = 150;
  const X = (c) => x0 + ((c - 1) / 11) * xw;
  const Y = (m) => y0 - m * yh;

  ctx.strokeStyle = GRID_LINE;
  ctx.lineWidth = 1;
  for (const m of [0.25, 0.5, 0.75, 1]) {
    ctx.beginPath();
    ctx.moveTo(x0, Y(m));
    ctx.lineTo(x0 + xw, Y(m));
    ctx.stroke();
    ctx.fillStyle = TEXT;
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${m * 100}%`, x0 - 10, Y(m));
  }
  ctx.textAlign = 'center';
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let c = 1; c <= 12; c += 0.1) {
    const x = X(c);
    const y = Y(1 / Math.sqrt(c));
    if (c === 1) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  function mark(c, name, color, dx, dy) {
    const x = X(c);
    const y = Y(1 / Math.sqrt(c));
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = TEXT;
    ctx.font = '13px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(name, x + dx, y + dy);
    ctx.textAlign = 'center';
    ctx.fillText(`cost ${c}`, x, y0 + 20);
  }
  mark(1, 'plain ground · 100%', BRIGHT, 14, 4);
  mark(8, 'mud · 35%', '#c9a36a', 0, -20);
  ctx.fillStyle = TEXT;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('speed multiplier = 1 / √cost, sampled from the cell under the agent', W / 2 + 30, 28);
}

// Three frames of arrival contagion: park at the goal, park when stalled
// against the parked, keep flowing around while there is room to move.
// A legend up top carries the color code so the frames stay clean.
function contagion(canvas) {
  const W = 660;
  const H = 300;
  const ctx = setup(canvas, W, H);
  ctx.fillStyle = FLOOR;
  ctx.fillRect(0, 0, W, H);
  const pw = 210;
  const r = 8;
  const STALLED = '#ffd166';

  function dot(x, y, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  function goalRing(x, y) {
    ctx.strokeStyle = GOAL;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.stroke();
  }
  // One long arrow for a whole moving group reads better than a tick on
  // every dot.
  function moveArrow(x0, y0, x1, y1) {
    arrow(ctx, x0, y0, x1, y1, AGENT, 2.5, 7);
  }
  function caption(ox, text) {
    ctx.fillStyle = TEXT;
    ctx.font = '12.5px system-ui, sans-serif';
    ctx.fillText(text, ox + pw / 2, 262);
  }

  // Legend.
  {
    const items = [
      ['moving', AGENT],
      ['stalled', STALLED],
      ['parked', PARKED],
    ];
    let x = W / 2 - 150;
    ctx.font = '12.5px system-ui, sans-serif';
    for (const [name, color] of items) {
      dot(x, 26, color);
      ctx.fillStyle = TEXT;
      ctx.textAlign = 'left';
      ctx.fillText(name, x + 14, 26);
      x += 30 + ctx.measureText(name).width + 30;
    }
    goalRing(x + 2, 26);
    ctx.fillStyle = TEXT;
    ctx.fillText('goal', x + 22, 26);
    ctx.textAlign = 'center';
  }

  ctx.strokeStyle = GRID_LINE;
  [225, 440].forEach((x) => {
    ctx.beginPath();
    ctx.moveTo(x, 56);
    ctx.lineTo(x, 272);
    ctx.stroke();
  });

  const gy = 155;

  // Frame 1: a column marches at the goal, the first body got there.
  let ox = 8;
  goalRing(ox + 165, gy);
  dot(ox + 165, gy, PARKED);
  for (let i = 0; i < 3; i++) dot(ox + 116 - i * 22, gy, AGENT);
  moveArrow(ox + 30, gy - 26, ox + 120, gy - 26);
  caption(ox, 'reach the goal → park');

  // Frame 2: the column pressed in, the front body has been stuck for
  // 0.35 s against parked bodies, so it parks too.
  ox = 228;
  goalRing(ox + 165, gy);
  dot(ox + 165, gy, PARKED);
  dot(ox + 147, gy - 11, PARKED);
  dot(ox + 147, gy + 11, PARKED);
  dot(ox + 129, gy, STALLED);
  ctx.strokeStyle = STALLED;
  ctx.lineWidth = 1.6;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.arc(ox + 129, gy, r + 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = STALLED;
  ctx.font = '11.5px system-ui, sans-serif';
  ctx.fillText('stuck 0.35 s → parks', ox + 110, gy - 32);
  for (let i = 0; i < 2; i++) dot(ox + 95 - i * 22, gy + 1, AGENT);
  caption(ox, 'stalled against the parked → park');

  // Frame 3: bodies with room to move curve around the pile instead of
  // freezing nose-to-tail.
  ox = 448;
  goalRing(ox + 145, gy);
  dot(ox + 145, gy, PARKED);
  dot(ox + 127, gy - 11, PARKED);
  dot(ox + 127, gy + 11, PARKED);
  dot(ox + 109, gy, PARKED);
  for (const side of [-1, 1]) {
    dot(ox + 52, gy + side * 14, AGENT);
    // Curved path around the pile.
    ctx.strokeStyle = AGENT;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(ox + 64, gy + side * 16);
    ctx.quadraticCurveTo(ox + 110, gy + side * 52, ox + 158, gy + side * 32);
    ctx.stroke();
    ctx.setLineDash([]);
    arrow(ctx, ox + 150, gy + side * 36.5, ox + 160, gy + side * 31, AGENT, 2.5, 7);
  }
  caption(ox, 'still moving → flow around');
}

const DIAGRAMS = { wavefront, flowpick, los, steer, terrain, contagion };

/**
 * Mount one diagram into a canvas; returns a dispose function.
 * opts.button: a play/pause button for the animated diagrams.
 */
export function mountDiagram(canvas, kind, opts = {}) {
  const draw = DIAGRAMS[kind];
  if (!draw) throw new Error(`unknown diagram: ${kind}`);
  return draw(canvas, opts) ?? (() => {});
}
