// SVG diagrams that sit next to the code excerpts in the post. Each one
// illustrates what a specific region of the Rust source does, drawn in the
// same palette as the live demo. Pure JS + SVG, no wasm: the grids here are
// a dozen cells wide and exist to be read, not benchmarked. SVG keeps them
// crisp at any zoom, and the structural colors route through CSS custom
// properties (--ffd-*) so the figures can be themed.
//
// The animated ones (wavefront, steer, contagion) show a settled static
// frame until played, so they never fight the text around them.

const NS = 'http://www.w3.org/2000/svg';

// Structural colors, themable. Data colors (the integration gradient) are
// computed numerically per cell below.
const FLOOR = 'var(--ffd-floor, #10151c)';
const GRID_LINE = 'var(--ffd-grid, #222c39)';
const WALL = 'var(--ffd-wall, #566374)';
const MUD = 'var(--ffd-mud, #6e542e)';
const TEXT = 'var(--ffd-text, #9aa7b8)';
const BRIGHT = 'var(--ffd-bright, #e8eef5)';
const ACCENT = 'var(--ffd-accent, #ffb454)';
const AGENT = 'var(--ffd-agent, #6bd9ff)';
const PARKED = 'var(--ffd-parked, #ff7eb6)';
const STALLED = 'var(--ffd-stalled, #ffd166)';
const GOAL = 'var(--ffd-goal, #ff5d5d)';
const BAD = 'var(--ffd-bad, #ff6b6b)';
const OK = 'var(--ffd-ok, #7ee787)';
const EDGE_IDLE = 'var(--ffd-edge, #44516a)';

// Data colors are computed numerically (gradients, stall-timer blends), so
// they cannot be CSS variables; pick them by the active theme instead. The
// site resolves the theme to data-theme on <html>, with the OS preference as
// the no-JS-choice fallback (see Layout.astro).
function isLight() {
  const t = document.documentElement.dataset.theme;
  if (t) return t === 'light';
  return window.matchMedia('(prefers-color-scheme: light)').matches;
}

function dataPalette() {
  return isLight()
    ? {
        near: [217, 119, 6],
        far: [203, 213, 225],
        mudNear: [146, 114, 62],
        mudFar: [209, 196, 170],
        frontier: [51, 65, 85],
        agent: [9, 147, 211],
        stalled: [202, 138, 4],
        parked: [219, 39, 119],
      }
    : {
        near: [255, 180, 84],
        far: [30, 46, 78],
        mudNear: [110, 84, 46],
        mudFar: [40, 35, 22],
        frontier: [255, 255, 255],
        agent: [107, 217, 255],
        stalled: [255, 209, 102],
        parked: [255, 126, 182],
      };
}

function mix(a, b, t) {
  return [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t));
}

function rgb(c) {
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

// Element helpers -----------------------------------------------------------

function el(tag, attrs = {}, ...children) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  node.append(...children);
  return node;
}

function svgRoot(w, h) {
  return el('svg', { viewBox: `0 0 ${w} ${h}`, role: 'img' });
}

function text(x, y, str, opts = {}) {
  const { fill = TEXT, size = 13, anchor = 'middle', weight = '', rotate = null } = opts;
  const t = el('text', {
    x,
    y,
    fill,
    'font-size': size,
    'text-anchor': anchor,
    'dominant-baseline': 'middle',
    'font-family': 'system-ui, sans-serif',
  });
  if (weight) t.setAttribute('font-weight', weight);
  if (rotate !== null) t.setAttribute('transform', `rotate(${rotate} ${x} ${y})`);
  t.textContent = str;
  return t;
}

function line(x0, y0, x1, y1, stroke, width = 2, dash = '') {
  const l = el('line', { x1: x0, y1: y0, x2: x1, y2: y1, stroke, 'stroke-width': width });
  if (dash) l.setAttribute('stroke-dasharray', dash);
  return l;
}

function circle(cx, cy, r, attrs = {}) {
  return el('circle', { cx, cy, r, ...attrs });
}

function arrowHead(x1, y1, angle, color, len = 7) {
  const p = (a) => `${x1 - len * Math.cos(angle + a)},${y1 - len * Math.sin(angle + a)}`;
  return el('polygon', { points: `${x1},${y1} ${p(-0.45)} ${p(0.45)}`, fill: color });
}

/** A line with an arrowhead, as one group. The head scales from the shaft
 * width, and the shaft stops short of the tip so it never pokes out of the
 * head triangle. */
function arrowEl(x0, y0, x1, y1, color, width = 2, head = null, dash = '') {
  const a = Math.atan2(y1 - y0, x1 - x0);
  const headLen = head ?? 5 + width * 2;
  const sx = x1 - Math.cos(a) * headLen * 0.8;
  const sy = y1 - Math.sin(a) * headLen * 0.8;
  return el('g', {}, line(x0, y0, sx, sy, color, width, dash), arrowHead(x1, y1, a, color, headLen));
}

function goalRing(x, y, r = 14) {
  return el(
    'g',
    {},
    circle(x, y, r, { fill: 'none', stroke: GOAL, 'stroke-width': 2 }),
    circle(x, y, r * 0.42, { fill: GOAL }),
  );
}

// Shared toy world ----------------------------------------------------------

// A wall with one gap and a mud blob, goal on the right; used by the
// wavefront and LOS diagrams.
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

function bresenhamClear({ W, cost }, x0, y0, x1, y1) {
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

/** Cell rects + grid lines; returns the per-cell rect elements for updates. */
function cellGrid(svg, map, cell, ox, oy, fillFor) {
  const rects = [];
  const cells = el('g');
  for (let y = 0; y < map.H; y++) {
    for (let x = 0; x < map.W; x++) {
      const r = el('rect', {
        x: ox + x * cell,
        y: oy + y * cell,
        width: cell,
        height: cell,
        fill: fillFor(x, y, map.cost[y * map.W + x]),
      });
      rects.push(r);
      cells.append(r);
    }
  }
  svg.append(cells);
  const lines = el('g');
  for (let x = 0; x <= map.W; x++) {
    lines.append(line(ox + x * cell, oy, ox + x * cell, oy + map.H * cell, GRID_LINE, 1));
  }
  for (let y = 0; y <= map.H; y++) {
    lines.append(line(ox, oy + y * cell, ox + map.W * cell, oy + y * cell, GRID_LINE, 1));
  }
  svg.append(lines);
  return rects;
}

// Play/pause harness shared by the animated diagrams: static until played,
// runs via requestAnimationFrame, returns to static when done.
function playable(svg, button, { onStart, onTick, label = '▶ play' }) {
  let playing = false;
  let raf = 0;
  let lastNow = 0;
  let started = false;
  const setLabel = () => {
    if (button) button.textContent = playing ? '❚❚ pause' : started ? '▶ resume' : label;
  };
  function tick(now) {
    if (!playing) return;
    const dt = lastNow ? Math.min((now - lastNow) / 1000, 1 / 30) : 1 / 60;
    lastNow = now;
    if (onTick(dt) === 'done') {
      playing = false;
      started = false;
      setLabel();
      return;
    }
    raf = requestAnimationFrame(tick);
  }
  function toggle() {
    playing = !playing;
    if (playing) {
      if (!started) {
        onStart();
        started = true;
      }
      lastNow = 0;
      raf = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(raf);
    }
    setLabel();
  }
  // onclick (not addEventListener) so a theme-change rebuild replaces the
  // handler instead of stacking a second one on the persistent button.
  if (button) button.onclick = toggle;
  svg.addEventListener('click', toggle);
  svg.style.cursor = 'pointer';
  setLabel();
  return () => cancelAnimationFrame(raf);
}

// Diagrams -------------------------------------------------------------

// The integrator as a movie: the wavefront expands from the goal, paying 8x
// to cross mud, and the cost-so-far gradient is left in its wake.
function wavefront(stage, opts = {}) {
  const W = 660;
  const H = 390;
  const P = dataPalette();
  const svg = svgRoot(W, H);
  const map = toyMap();
  const cell = 28;
  const ox = (W - map.W * cell) / 2;
  const oy = 12;
  const dist = integrate(map);
  let maxd = 0;
  for (const d of dist) if (d !== Infinity && d > maxd) maxd = d;

  svg.append(el('rect', { width: W, height: H, fill: FLOOR }));
  const rects = cellGrid(svg, map, cell, ox, oy, () => FLOOR);
  svg.append(goalRing(ox + (map.goal.x + 0.5) * cell, oy + (map.goal.y + 0.5) * cell, cell * 0.45));
  svg.append(text(W / 2, oy + map.H * cell + 22, 'integrated cost so far · the wave pays 8x to cross mud'));
  stage.replaceChildren(svg);

  function frame(t) {
    for (let y = 0; y < map.H; y++) {
      for (let x = 0; x < map.W; x++) {
        const i = y * map.W + x;
        const c = map.cost[i];
        const d = dist[i];
        let fill;
        if (c === 255) {
          fill = WALL;
        } else if (d === Infinity || d > t) {
          fill = c > 1 ? rgb(P.mudFar) : FLOOR;
        } else {
          const s = Math.sqrt(d / maxd);
          let col = c > 1 ? mix(P.mudNear, P.mudFar, s * 0.5) : mix(P.near, P.far, s);
          // Frontier band, only while the wave is still spreading.
          if (t < maxd && d > t - 1.6) col = mix(col, P.frontier, 0.55);
          fill = rgb(col);
        }
        rects[i].setAttribute('fill', fill);
      }
    }
  }

  frame(maxd);
  const SPEED = 9; // integrated-cost units per second
  let t = 0;
  return playable(svg, opts.button, {
    label: '▶ play the wave',
    onStart() {
      t = 0;
    },
    onTick(dt) {
      t += dt * SPEED;
      frame(Math.min(t, maxd));
      if (t >= maxd + SPEED * 1.2) {
        frame(maxd);
        return 'done';
      }
    },
  });
}

// Two 3x3 neighborhoods: pick the cheapest neighbor, and the corner rule
// that refuses a diagonal squeezing past a wall.
function flowpick(stage) {
  const W = 660;
  const H = 330;
  const svg = svgRoot(W, H);
  svg.append(el('rect', { width: W, height: H, fill: FLOOR }));
  const cell = 76;

  function panel(ox, values, wallAt, chosen, blocked, title) {
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        const isWall = wallAt && wallAt.x === x && wallAt.y === y;
        svg.append(
          el('rect', {
            x: ox + x * cell,
            y: 30 + y * cell,
            width: cell - 2,
            height: cell - 2,
            fill: isWall ? WALL : 'var(--ffd-panel, #161d27)',
          }),
        );
        if (!isWall && values[y][x] !== null) {
          const center = x === 1 && y === 1;
          svg.append(
            text(ox + x * cell + cell / 2, 30 + y * cell + cell / 2, String(values[y][x]), {
              fill: center ? BRIGHT : TEXT,
              size: 17,
              weight: center ? 'bold' : '',
            }),
          );
        }
      }
    }
    const cx = ox + 1.5 * cell - 1;
    const cy = 30 + 1.5 * cell - 1;
    const at = (c) => [ox + c.x * cell + cell / 2, 30 + c.y * cell + cell / 2];
    if (blocked) {
      const [bx, by] = at(blocked);
      svg.append(
        arrowEl(cx + (bx - cx) * 0.25, cy + (by - cy) * 0.25, cx + (bx - cx) * 0.62, cy + (by - cy) * 0.62, BAD, 2),
      );
      const mx = (cx + bx) / 2;
      const my = (cy + by) / 2;
      svg.append(line(mx - 7, my - 7, mx + 7, my + 7, BAD, 2.5));
      svg.append(line(mx + 7, my - 7, mx - 7, my + 7, BAD, 2.5));
    }
    const [tx, ty] = at(chosen);
    svg.append(
      arrowEl(cx + (tx - cx) * 0.2, cy + (ty - cy) * 0.2, cx + (tx - cx) * 0.72, cy + (ty - cy) * 0.72, ACCENT, 2.5, 11),
    );
    svg.append(text(ox + 1.5 * cell, 30 + 3 * cell + 24, title));
  }

  // Left: plain downhill pick, SE (11) wins. Right: S is a wall, so the SE
  // diagonal would cut its corner; NE (12) wins instead.
  panel(72, [[16, 15, 12], [16, 14, 13], [15, 13, 11]], null, { x: 2, y: 2 }, null, 'pick the cheapest of 8 neighbors');
  panel(
    372,
    [[16, 15, 12], [16, 14, 13], [15, null, 11]],
    { x: 1, y: 2 },
    { x: 2, y: 0 },
    { x: 2, y: 2 },
    'diagonal past a wall corner is refused',
  );
  stage.replaceChildren(svg);
}

// The LOS region around the goal, one clear sightline and two blocked ones
// (a wall and mud, which blocks LOS the same way).
function los(stage) {
  const W = 660;
  const H = 400;
  const P = dataPalette();
  const svg = svgRoot(W, H);
  const map = toyMap();
  const cell = 28;
  const ox = (W - map.W * cell) / 2;
  const oy = 12;
  const dist = integrate(map);
  let maxd = 0;
  for (const d of dist) if (d !== Infinity && d > maxd) maxd = d;

  svg.append(el('rect', { width: W, height: H, fill: FLOOR }));
  cellGrid(svg, map, cell, ox, oy, (x, y, c) => {
    const d = dist[y * map.W + x];
    if (c === 255) return WALL;
    if (d === Infinity) return FLOOR;
    if (c > 1) return MUD;
    let col = mix(P.near, P.far, Math.sqrt(d / maxd));
    if (bresenhamClear(map, x, y, map.goal.x, map.goal.y).clear) {
      col = mix(col, [255, 255, 255], 0.22);
    }
    return rgb(col);
  });
  svg.append(goalRing(ox + (map.goal.x + 0.5) * cell, oy + (map.goal.y + 0.5) * cell, cell * 0.45));

  const gx = ox + (map.goal.x + 0.5) * cell;
  const gy = oy + (map.goal.y + 0.5) * cell;
  function sightline(x, y, color) {
    const res = bresenhamClear(map, x, y, map.goal.x, map.goal.y);
    const sx = ox + (x + 0.5) * cell;
    const sy = oy + (y + 0.5) * cell;
    svg.append(line(sx, sy, gx, gy, color, 2, res.clear ? '' : '5 4'));
    svg.append(circle(sx, sy, 4.5, { fill: color }));
    if (!res.clear) {
      const hx = ox + (res.hit.x + 0.5) * cell;
      const hy = oy + (res.hit.y + 0.5) * cell;
      svg.append(line(hx - 6, hy - 6, hx + 6, hy + 6, color, 2.5));
      svg.append(line(hx + 6, hy - 6, hx - 6, hy + 6, color, 2.5));
    }
  }
  sightline(15, 11, OK);
  sightline(4, 4, BAD);
  sightline(21, 1, BAD);

  svg.append(
    text(
      W / 2,
      oy + map.H * cell + 22,
      'bright cells see the goal and steer straight at it · walls and mud both break the line',
    ),
  );
  stage.replaceChildren(svg);
}

// Steering in two halves: how velocity turns toward the field, and how
// overlapping bodies separate. Play animates both at once.
function steer(stage, opts = {}) {
  const W = 660;
  const H = 320;
  const svg = svgRoot(W, H);
  svg.append(el('rect', { width: W, height: H, fill: FLOOR }));
  svg.append(line(338, 24, 338, 296, GRID_LINE, 1));
  svg.append(text(170, 286, 'follow the field, but with momentum'));
  svg.append(text(490, 286, 'separation keeps the crowd from stacking'));
  const dyn = el('g');
  svg.append(dyn);
  stage.replaceChildren(svg);

  const DEG = Math.PI / 180;
  const DESIRED = -68 * DEG;
  const START = 14 * DEG;
  const LEN = 105;

  const init = () => ({ angle: START, pos: [150, 195], trail: [], overlap: 46 });
  let s = init();

  function step(dt) {
    s.angle += (DESIRED - s.angle) * Math.min(1, 2.4 * dt);
    s.pos[0] += Math.cos(s.angle) * 46 * dt;
    s.pos[1] += Math.sin(s.angle) * 46 * dt;
    s.trail.push([...s.pos]);
    s.overlap = Math.max(0, s.overlap - s.overlap * Math.min(1, 2.2 * dt) - 1.5 * dt);
  }

  function draw(animating) {
    const parts = [];
    const [ax, ay] = s.pos;
    const ray = (a, r) => [ax + Math.cos(a) * r, ay + Math.sin(a) * r];

    if (s.trail.length > 1) {
      parts.push(
        el('polyline', {
          points: s.trail.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' '),
          fill: 'none',
          stroke: AGENT,
          opacity: 0.35,
          'stroke-width': 2,
        }),
      );
    }
    parts.push(arrowEl(ax, ay, ...ray(DESIRED, LEN), ACCENT, 2));
    parts.push(arrowEl(ax, ay, ...ray(s.angle, LEN * 0.96), AGENT, 2));
    if (!animating) {
      // Static frame: also show the next-frame blend and the turn arc.
      const next = s.angle + (DESIRED - s.angle) * 0.45;
      parts.push(arrowEl(ax, ay, ...ray(next, LEN * 0.9), BRIGHT, 2.5));
      const [a0x, a0y] = ray(s.angle - 6 * DEG, LEN + 16);
      const [a1x, a1y] = ray(DESIRED + 6 * DEG, LEN + 16);
      parts.push(
        el('path', {
          d: `M ${a0x} ${a0y} A ${LEN + 16} ${LEN + 16} 0 0 0 ${a1x} ${a1y}`,
          fill: 'none',
          stroke: TEXT,
          'stroke-width': 1.6,
          'stroke-dasharray': '4 5',
        }),
      );
      const tip = ray(DESIRED + 8 * DEG, LEN + 16);
      const tail = ray(DESIRED + 13 * DEG, LEN + 16);
      parts.push(arrowHead(tip[0], tip[1], Math.atan2(tip[1] - tail[1], tip[0] - tail[0]), TEXT, 6));
      const [nx0, ny0] = ray(next - 4 * DEG, LEN + 26);
      parts.push(text(nx0 + 8, ny0, 'next frame', { fill: BRIGHT, anchor: 'start' }));
    }
    parts.push(circle(ax, ay, 9, { fill: AGENT }));
    parts.push(text(...ray(DESIRED, LEN + 34), 'the field says go here', { fill: ACCENT }));
    parts.push(text(...ray(s.angle + 9 * DEG, LEN + 42), 'velocity right now', { fill: AGENT }));

    const by = 150;
    const r = 34;
    const half = (r * 2 - s.overlap) / 2;
    const b1 = 485 - half;
    const b2 = 485 + half;
    for (const bx of [b1, b2]) {
      parts.push(circle(bx, by, r, { fill: 'none', stroke: TEXT, 'stroke-width': 1.4, 'stroke-dasharray': '4 5' }));
      parts.push(circle(bx, by, 9, { fill: AGENT }));
    }
    if (s.overlap > 1) {
      parts.push(arrowEl(b1 - 14, by, b1 - 58 - s.overlap * 0.4, by, BAD, 2));
      parts.push(arrowEl(b2 + 14, by, b2 + 58 + s.overlap * 0.4, by, BAD, 2));
      parts.push(text(485, by - r - 18, 'bodies overlap'));
      parts.push(text(485, by + r + 28, 'half the overlap each, away from the other'));
    } else {
      parts.push(text(485, by + r + 28, 'settled: contact distance apart'));
    }
    dyn.replaceChildren(...parts);
  }

  function staticFrame() {
    s = init();
    // Just enough warmup that the blend is mid-turn, with the arrow fan
    // still wide enough to read.
    for (let i = 0; i < 8; i++) step(1 / 60);
    s.trail = [];
    draw(false);
  }
  staticFrame();

  let elapsed = 0;
  return playable(svg, opts.button, {
    onStart() {
      elapsed = 0;
      s = init();
    },
    onTick(dt) {
      elapsed += dt;
      if (elapsed >= 4.6) {
        staticFrame();
        return 'done';
      }
      step(dt);
      draw(true);
    },
  });
}

// Speed multiplier vs cost: 1/sqrt(cost), with plain ground and mud marked.
function terrain(stage) {
  const W = 660;
  const H = 260;
  const svg = svgRoot(W, H);
  svg.append(el('rect', { width: W, height: H, fill: FLOOR }));
  const x0 = 70;
  const y0 = 200;
  const xw = 520;
  const yh = 150;
  const X = (c) => x0 + ((c - 1) / 11) * xw;
  const Y = (m) => y0 - m * yh;

  for (const m of [0.25, 0.5, 0.75, 1]) {
    svg.append(line(x0, Y(m), x0 + xw, Y(m), GRID_LINE, 1));
    svg.append(text(x0 - 10, Y(m), `${m * 100}%`, { size: 12, anchor: 'end' }));
  }
  const pts = [];
  for (let c = 1; c <= 12; c += 0.1) {
    pts.push(`${X(c).toFixed(1)},${Y(1 / Math.sqrt(c)).toFixed(1)}`);
  }
  svg.append(
    el('polyline', { points: pts.join(' '), fill: 'none', stroke: ACCENT, 'stroke-width': 2.5 }),
  );

  function mark(c, name, color, dx, dy) {
    const x = X(c);
    const y = Y(1 / Math.sqrt(c));
    svg.append(circle(x, y, 5, { fill: color }));
    svg.append(text(x + dx, y + dy, name, { anchor: dx > 0 ? 'start' : 'middle' }));
    svg.append(text(x, y0 + 20, `cost ${c}`));
  }
  mark(1, 'plain ground · 100%', BRIGHT, 14, 4);
  mark(8, 'mud · 35%', 'var(--ffd-mud-bright, #c9a36a)', 0, -20);
  svg.append(text(W / 2 + 30, 28, 'speed multiplier = 1 / √cost, sampled from the cell under the agent'));
  stage.replaceChildren(svg);
}

// Arrival as it actually is in the code: a per-agent state machine. The left
// side runs a real mini-simulation (move toward the goal, collide, stall,
// park); the right side is the state graph with live agent counts, and every
// transition an agent takes flashes its edge.
function contagion(stage, opts = {}) {
  const W = 660;
  const H = 360;
  const svg = svgRoot(W, H);
  const SPEED = 52;
  const R = 7;
  const GX = 385;
  const GY = 186;
  // A narrow two-lane corridor forces a deep queue: when the front parks,
  // the whole line behind it jams (stalled, yellow) and the parked state
  // eats it from the front, one stall-timer tick per rank. That keeps the
  // stalled population visible for seconds instead of flickering once.
  const CORRIDOR = { top: 168, bottom: 204, left: 16, right: 412 };
  const STATE_COLOR = { moving: AGENT, stalled: STALLED, parked: PARKED };

  function makeAgents() {
    const agents = [];
    for (let col = 0; col < 16; col++) {
      for (let row = 0; row < 2; row++) {
        agents.push({
          x: 20 + col * 15,
          y: CORRIDOR.top + 9 + row * 18,
          stall: 0,
          state: 'moving',
        });
      }
    }
    return agents;
  }
  const goalDist = (a) => Math.hypot(GX - a.x, GY - a.y);
  const clampY = (a) => {
    a.y = Math.min(CORRIDOR.bottom - R - 1, Math.max(CORRIDOR.top + R + 1, a.y));
  };

  function simStep(agents, dt, flashes) {
    for (const a of agents) {
      a.px = a.x;
      a.py = a.y;
      if (a.state === 'parked') continue;
      const d = goalDist(a);
      a.x += ((GX - a.x) / d) * SPEED * dt;
      a.y += ((GY - a.y) / d) * SPEED * dt;
      clampY(a);
    }
    for (let iter = 0; iter < 2; iter++) {
      for (let i = 0; i < agents.length; i++) {
        for (let j = i + 1; j < agents.length; j++) {
          const A = agents[i];
          const B = agents[j];
          const dx = A.x - B.x;
          const dy = A.y - B.y;
          const d = Math.hypot(dx, dy);
          if (d >= 2 * R || d < 1e-6) continue;
          const push = 2 * R - d;
          const movableA = A.state !== 'parked';
          const movableB = B.state !== 'parked';
          if (!movableA && !movableB) continue;
          const share = movableA && movableB ? 0.5 : 1;
          if (movableA) {
            A.x += (dx / d) * push * share;
            A.y += (dy / d) * push * share;
            clampY(A);
          }
          if (movableB) {
            B.x -= (dx / d) * push * share;
            B.y -= (dy / d) * push * share;
            clampY(B);
          }
        }
      }
    }
    for (const a of agents) {
      if (a.state === 'parked') continue;
      const moved = Math.hypot(a.x - a.px, a.y - a.py) / dt;
      if (moved < SPEED * 0.45) a.stall += dt;
      else a.stall = 0;

      // Stalled after 0.35 s of getting nowhere; absorbed into the pile
      // after a longer hold, so the stalled state has visible dwell time
      // in this toy (in the live demo both gates share one threshold).
      let next = a.stall >= 0.35 ? 'stalled' : 'moving';
      if (goalDist(a) < 18) {
        next = 'parked';
      } else if (next === 'stalled' && a.stall >= 0.9) {
        for (const b of agents) {
          if (b.state !== 'parked') continue;
          if (Math.hypot(a.x - b.x, a.y - b.y) < 2 * R + 1.5 && goalDist(b) < goalDist(a)) {
            next = 'parked';
            break;
          }
        }
      }
      if (next !== a.state) {
        flashes[`${a.state}>${next}`] = 0.5;
        a.state = next;
      }
    }
  }

  // Static chrome: the corridor walls and the goal at its end.
  svg.append(el('rect', { width: W, height: H, fill: FLOOR }));
  svg.append(line(428, 24, 428, 336, GRID_LINE, 1));
  for (const y of [CORRIDOR.top - 10, CORRIDOR.bottom]) {
    svg.append(
      el('rect', {
        x: CORRIDOR.left,
        y,
        width: CORRIDOR.right - CORRIDOR.left,
        height: 10,
        fill: WALL,
        rx: 2,
      }),
    );
  }
  svg.append(goalRing(GX, GY, 15));
  svg.append(text(218, 348, 'a column queues through a corridor toward the goal', { size: 12.5 }));

  // The state graph: nodes with live counts, edges that flash on transitions.
  const NODES = {
    moving: { x: 545, y: 80 },
    stalled: { x: 545, y: 190 },
    parked: { x: 545, y: 300 },
  };
  const NODE_R = 26;
  const EDGES = [
    { key: 'moving>stalled', from: 'moving', to: 'stalled', side: -1, label: 'blocked 0.35 s' },
    { key: 'stalled>moving', from: 'stalled', to: 'moving', side: 1, label: 'free again' },
    { key: 'stalled>parked', from: 'stalled', to: 'parked', side: -1, label: 'touching the pile' },
    { key: 'moving>parked', from: 'moving', to: 'parked', side: 1, label: 'reach the goal', bow: 64 },
  ];
  const edgeEls = {};
  for (const e of EDGES) {
    const a = NODES[e.from];
    const b = NODES[e.to];
    const g = el('g');
    if (e.bow) {
      const mx = a.x + e.bow;
      const my = (a.y + b.y) / 2;
      g.append(
        el('path', {
          d: `M ${a.x + NODE_R - 4} ${a.y + 8} Q ${mx} ${my} ${b.x + NODE_R - 4} ${b.y - 8}`,
          fill: 'none',
          stroke: EDGE_IDLE,
          'stroke-width': 1.5,
        }),
      );
      const ang = Math.atan2(b.y - 8 - my, b.x + NODE_R - 4 - mx);
      g.append(arrowHead(b.x + NODE_R - 4, b.y - 8, ang, EDGE_IDLE, 6));
      g.append(text(mx + 6, my, e.label, { size: 11.5, rotate: 90 }));
    } else {
      const xoff = e.side * 10;
      const y0 = a.y + (b.y > a.y ? NODE_R : -NODE_R);
      const y1 = b.y + (b.y > a.y ? -NODE_R - 4 : NODE_R + 4);
      const shaftEnd = y1 - Math.sign(y1 - y0) * 5;
      g.append(line(a.x + xoff, y0, b.x + xoff, shaftEnd, EDGE_IDLE, 1.5));
      g.append(arrowHead(b.x + xoff, y1, Math.atan2(y1 - y0, 0), EDGE_IDLE, 6));
      g.append(
        text(a.x + xoff + e.side * 8, (a.y + b.y) / 2, e.label, {
          size: 11.5,
          anchor: e.side < 0 ? 'end' : 'start',
        }),
      );
    }
    svg.append(g);
    edgeEls[e.key] = g;
  }
  // The reset transition exists in the real sim too: a new goal un-parks
  // everyone. A dashed hint with a horizontal footnote, so no rotated label
  // collides with the edge labels.
  svg.append(
    el('path', {
      d: `M ${NODES.parked.x - NODE_R} ${NODES.parked.y - 6} Q 448 190 ${NODES.moving.x - NODE_R} ${NODES.moving.y + 6}`,
      fill: 'none',
      stroke: EDGE_IDLE,
      'stroke-width': 1.2,
      'stroke-dasharray': '3 4',
    }),
  );
  svg.append(text(545, 344, 'dashed: new goal → all back to moving', { size: 11 }));

  const countEls = {};
  for (const [name, n] of Object.entries(NODES)) {
    svg.append(circle(n.x, n.y, NODE_R, { fill: FLOOR, stroke: STATE_COLOR[name], 'stroke-width': 2 }));
    const count = text(n.x, n.y - 4, '0', { fill: STATE_COLOR[name], size: 15, weight: 'bold' });
    svg.append(count);
    svg.append(text(n.x, n.y + 12, name, { fill: STATE_COLOR[name], size: 11 }));
    countEls[name] = count;
  }

  // Agent dots, updated in place each frame.
  let agents = makeAgents();
  const dots = agents.map(() => circle(0, 0, R, { fill: AGENT }));
  const dotsGroup = el('g', {}, ...dots);
  svg.append(dotsGroup);
  stage.replaceChildren(svg);

  // Dot colors are numeric so the stall timer can be shown filling up:
  // a blocked agent blends from cyan toward yellow as stall approaches
  // the 0.35 s threshold.
  const P = dataPalette();
  function dotColor(a) {
    if (a.state === 'parked') return rgb(P.parked);
    return rgb(mix(P.agent, P.stalled, Math.min(1, a.stall / 0.35)));
  }

  function draw(flashes) {
    for (let i = 0; i < agents.length; i++) {
      dots[i].setAttribute('cx', agents[i].x.toFixed(1));
      dots[i].setAttribute('cy', agents[i].y.toFixed(1));
      dots[i].setAttribute('fill', dotColor(agents[i]));
    }
    const counts = { moving: 0, stalled: 0, parked: 0 };
    for (const a of agents) counts[a.state]++;
    for (const [name, elc] of Object.entries(countEls)) elc.textContent = String(counts[name]);
    for (const e of EDGES) {
      const hot = (flashes[e.key] ?? 0) > 0;
      for (const child of edgeEls[e.key].children) {
        if (child.tagName === 'line' || child.tagName === 'path') {
          child.setAttribute('stroke', hot ? ACCENT : EDGE_IDLE);
          child.setAttribute('stroke-width', hot ? 2.5 : 1.5);
        } else if (child.tagName === 'polygon') {
          child.setAttribute('fill', hot ? ACCENT : EDGE_IDLE);
        } else if (child.tagName === 'text') {
          child.setAttribute('fill', hot ? ACCENT : TEXT);
        }
      }
    }
  }

  // Static default: the settled end state.
  {
    const f = {};
    for (let i = 0; i < 1400; i++) simStep(agents, 1 / 60, f);
  }
  draw({});

  let flashes = {};
  let hold = 0;
  let elapsed = 0;
  return playable(svg, opts.button, {
    onStart() {
      agents = makeAgents();
      flashes = {};
      hold = 0;
      elapsed = 0;
    },
    onTick(dt) {
      elapsed += dt;
      if (elapsed > 30) return 'done';
      simStep(agents, dt, flashes);
      for (const k of Object.keys(flashes)) {
        flashes[k] -= dt;
        if (flashes[k] <= 0) delete flashes[k];
      }
      draw(flashes);
      if (agents.every((a) => a.state === 'parked')) {
        hold += dt;
        if (hold > 1.6) return 'done';
      }
    },
  });
}

const DIAGRAMS = { wavefront, flowpick, los, steer, terrain, contagion };

/**
 * Build one diagram into a stage element (the SVG replaces its children).
 * opts.button: a play/pause button for the animated diagrams.
 * Structural colors follow the theme live via CSS variables; the numeric
 * data colors require a rebuild, so the diagram re-renders (back to its
 * static frame) when the theme toggles. Returns a dispose function.
 */
export function mountDiagram(stage, kind, opts = {}) {
  const build = DIAGRAMS[kind];
  if (!build) throw new Error(`unknown diagram: ${kind}`);
  let dispose = build(stage, opts) ?? (() => {});
  const rebuild = () => {
    dispose();
    dispose = build(stage, opts) ?? (() => {});
  };
  const mq = window.matchMedia('(prefers-color-scheme: light)');
  mq.addEventListener('change', rebuild);
  const observer = new MutationObserver(rebuild);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => {
    mq.removeEventListener('change', rebuild);
    observer.disconnect();
    dispose();
  };
}
