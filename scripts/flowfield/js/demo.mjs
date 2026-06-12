// Demo mount: wires the wasm sim (flowfield.mjs) to the WebGL2 renderer
// (render.mjs) and the toolbar. The root element must contain the structure
// rendered by src/components/FlowField.astro.

import {
  FlowField, WALL, INT_COST_MASK, INT_LOS, UNREACHABLE, FLOW_DIR_MASK, DIR_NONE, DIR_VECTORS,
} from './flowfield.mjs';
import { createRenderer } from './render.mjs';

const GRID_W = 128;
const GRID_H = 80;
const SPAWN_BATCH = 1000;

// Mud: passable but expensive ground. The flow field detours around it even
// though agents could walk straight through, which is the whole point of a
// cost field (walls are just the degenerate case of infinite cost).
const MUD_COST = 8;

// Underlay palette (RGBA), dark-theme friendly.
const COL_FLOOR = [16, 21, 28];
const COL_WALL = [86, 99, 116];
const COL_MUD = [110, 84, 46];
const COL_NEAR = [255, 180, 84]; // integration ramp, near goal
const COL_FAR = [30, 46, 78]; // integration ramp, far

function lerp3(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export async function mountFlowFieldDemo(root, { wasmUrl }) {
  const canvas = root.querySelector('canvas');
  const stats = root.querySelector('[data-ff-stats]');
  const ff = await FlowField.load(fetch(wasmUrl), GRID_W, GRID_H);
  const renderer = createRenderer(canvas, GRID_W, GRID_H);

  const state = {
    mode: 'goal', // goal | wall | erase
    view: 'integration', // cost | integration | flow
    computeMs: 0,
    fps: 0,
    raf: 0,
    disposed: false,
  };

  function compute(gx, gy) {
    const t0 = performance.now();
    const ok = ff.compute(gx, gy);
    if (ok) state.computeMs = performance.now() - t0;
    refreshField();
    return ok;
  }

  const rgba = new Uint8Array(GRID_W * GRID_H * 4);
  function refreshField() {
    const cost = ff.cost;
    const integ = ff.integration;
    let max = 1;
    if (state.view === 'integration') {
      for (let i = 0; i < integ.length; i++) {
        const c = integ[i] & INT_COST_MASK;
        if (c !== UNREACHABLE && c > max) max = c;
      }
    }
    for (let i = 0; i < cost.length; i++) {
      let c;
      if (cost[i] === WALL) {
        c = COL_WALL;
      } else if (state.view === 'integration') {
        const v = integ[i] & INT_COST_MASK;
        if (v === UNREACHABLE) {
          c = COL_FLOOR;
        } else {
          c = lerp3(COL_NEAR, COL_FAR, Math.sqrt(v / max));
          if (integ[i] & INT_LOS) c = lerp3(c, [255, 255, 255], 0.14);
        }
        // Keep expensive ground readable under the gradient.
        if (cost[i] > 1) c = lerp3(c, COL_MUD, 0.45);
      } else if (state.view === 'cost') {
        c = lerp3(COL_FLOOR, COL_MUD, Math.min(1, (cost[i] - 1) / (MUD_COST - 1)));
      } else {
        c = cost[i] > 1 ? lerp3(COL_FLOOR, COL_MUD, 0.6) : COL_FLOOR;
      }
      rgba[i * 4] = c[0];
      rgba[i * 4 + 1] = c[1];
      rgba[i * 4 + 2] = c[2];
      rgba[i * 4 + 3] = 255;
    }
    renderer.uploadField(rgba);
    if (state.view === 'flow') refreshArrows();
  }

  // Arrows sampled every other cell so each one can be large enough to read:
  // a shaft plus two arrowhead strokes. Drawn only in the flow view; rebuilt
  // on recompute.
  function refreshArrows() {
    const flow = ff.flow;
    const verts = [];
    const STRIDE = 2;
    for (let y = 0; y < GRID_H; y += STRIDE) {
      for (let x = 0; x < GRID_W; x += STRIDE) {
        const dir = flow[y * GRID_W + x] & FLOW_DIR_MASK;
        if (dir === DIR_NONE) continue;
        const [dx, dy] = DIR_VECTORS[dir];
        const cx = x + 0.5;
        const cy = y + 0.5;
        const tipX = cx + dx * 0.7;
        const tipY = cy + dy * 0.7;
        verts.push(cx - dx * 0.7, cy - dy * 0.7, tipX, tipY);
        const bx = -dx * 0.38;
        const by = -dy * 0.38;
        const px = -dy * 0.22;
        const py = dx * 0.22;
        verts.push(tipX, tipY, tipX + bx + px, tipY + by + py);
        verts.push(tipX, tipY, tipX + bx - px, tipY + by - py);
      }
    }
    renderer.uploadArrows(new Float32Array(verts));
  }

  // Starter scene: a wall with two gaps, a mud patch behind the upper gap,
  // goal on the right, agents left.
  {
    const cost = ff.cost;
    const wallX = Math.floor(GRID_W * 0.55);
    for (let y = 0; y < GRID_H; y++) {
      const f = y / GRID_H;
      if (f > 0.2 && f < 0.33) continue;
      if (f > 0.7 && f < 0.8) continue;
      cost[y * GRID_W + wallX] = WALL;
      cost[y * GRID_W + wallX + 1] = WALL;
    }
    const mud = { x: GRID_W * 0.68, y: GRID_H * 0.32, rx: GRID_W * 0.07, ry: GRID_H * 0.12 };
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        const ex = (x - mud.x) / mud.rx;
        const ey = (y - mud.y) / mud.ry;
        if (ex * ex + ey * ey < 1) cost[y * GRID_W + x] = MUD_COST;
      }
    }
    compute(Math.floor(GRID_W * 0.8), Math.floor(GRID_H * 0.5));
    ff.spawn(GRID_W * 0.18, GRID_H * 0.5, 1200, 1234);
  }

  // Interaction --------------------------------------------------------------
  function cellFromEvent(ev) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((ev.clientX - rect.left) / rect.width) * GRID_W);
    const y = Math.floor(((ev.clientY - rect.top) / rect.height) * GRID_H);
    if (x < 0 || y < 0 || x >= GRID_W || y >= GRID_H) return null;
    return { x, y };
  }

  function paint(cell, mode) {
    const value = mode === 'wall' ? WALL : mode === 'mud' ? MUD_COST : 1;
    const cost = ff.cost;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = cell.x + dx;
        const y = cell.y + dy;
        if (x < 0 || y < 0 || x >= GRID_W || y >= GRID_H) continue;
        if (ff.goal && x === ff.goal.x && y === ff.goal.y) continue;
        cost[y * GRID_W + x] = value;
      }
    }
  }

  let dragging = null; // 'goal' | 'paint'
  canvas.addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    const cell = cellFromEvent(ev);
    if (!cell) return;
    canvas.setPointerCapture(ev.pointerId);
    if (state.mode === 'goal') {
      dragging = 'goal';
      compute(cell.x, cell.y);
    } else {
      dragging = 'paint';
      paint(cell, state.mode);
      if (ff.goal) compute(ff.goal.x, ff.goal.y);
    }
  });
  canvas.addEventListener('pointermove', (ev) => {
    if (!dragging) return;
    const cell = cellFromEvent(ev);
    if (!cell) return;
    if (dragging === 'goal') {
      // Recompute only when the pointer crosses into a new cell, so the
      // crowd chases the cursor without redundant field rebuilds.
      if (!ff.goal || cell.x !== ff.goal.x || cell.y !== ff.goal.y) {
        compute(cell.x, cell.y);
      }
    } else {
      paint(cell, state.mode);
      if (ff.goal) compute(ff.goal.x, ff.goal.y);
    }
  });
  const stopDrag = () => {
    dragging = null;
  };
  canvas.addEventListener('pointerup', stopDrag);
  canvas.addEventListener('pointercancel', stopDrag);

  for (const btn of root.querySelectorAll('[data-ff-mode]')) {
    btn.addEventListener('click', () => {
      state.mode = btn.dataset.ffMode;
      for (const b of root.querySelectorAll('[data-ff-mode]')) {
        b.classList.toggle('active', b === btn);
      }
    });
  }
  for (const btn of root.querySelectorAll('[data-ff-view]')) {
    btn.addEventListener('click', () => {
      state.view = btn.dataset.ffView;
      for (const b of root.querySelectorAll('[data-ff-view]')) {
        b.classList.toggle('active', b === btn);
      }
      refreshField();
    });
  }
  root.querySelector('[data-ff-spawn]')?.addEventListener('click', () => {
    const spot = findSpawnSpot();
    ff.spawn(spot.x, spot.y, SPAWN_BATCH);
  });
  root.querySelector('[data-ff-clear]')?.addEventListener('click', () => ff.clearAgents());
  root.querySelector('[data-ff-scale]')?.addEventListener('input', (ev) => {
    ff.setScale(parseFloat(ev.target.value));
  });
  root.querySelector('[data-ff-variety]')?.addEventListener('input', (ev) => {
    ff.setVariety(parseFloat(ev.target.value));
  });
  root.querySelector('[data-ff-spacing]')?.addEventListener('input', (ev) => {
    ff.setSpacing(parseFloat(ev.target.value));
  });
  root.querySelector('[data-ff-speed]')?.addEventListener('input', (ev) => {
    ff.setSpeed(parseFloat(ev.target.value));
  });

  function findSpawnSpot() {
    // Far-ish from the goal, on open ground: try a few fixed candidates.
    const cost = ff.cost;
    const candidates = [
      [0.15, 0.5], [0.15, 0.15], [0.15, 0.85], [0.5, 0.15], [0.5, 0.85], [0.85, 0.85],
    ];
    for (const [fx, fy] of candidates) {
      const x = Math.floor(GRID_W * fx);
      const y = Math.floor(GRID_H * fy);
      if (cost[y * GRID_W + x] !== WALL) return { x, y };
    }
    return { x: GRID_W / 2, y: GRID_H / 2 };
  }

  // Main loop ------------------------------------------------------------
  // Kinds live as u8 in wasm memory; vertex attributes want floats. The
  // scratch array is rebuilt only when the agent count changes.
  let kindsF32 = new Float32Array(0);
  function kindsAsFloats() {
    const kinds = ff.kinds;
    if (kindsF32.length !== kinds.length) kindsF32 = new Float32Array(kinds.length);
    kindsF32.set(kinds);
    return kindsF32;
  }

  let last = performance.now();
  let fpsAccum = 0;
  let fpsFrames = 0;
  function tick(now) {
    if (state.disposed) return;
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    ff.step(dt);
    renderer.resize();
    renderer.frame(
      ff.positions, ff.headings, ff.radii, kindsAsFloats(),
      state.view === 'flow', ff.goal, now / 1000,
    );

    fpsAccum += dt;
    fpsFrames++;
    if (fpsAccum >= 0.5) {
      state.fps = fpsFrames / fpsAccum;
      fpsAccum = 0;
      fpsFrames = 0;
      if (stats) {
        stats.textContent =
          `${ff.agentCount} agents · field ${state.computeMs.toFixed(1)} ms · ` +
          `${Math.round(state.fps)} fps`;
      }
    }
    state.raf = requestAnimationFrame(tick);
  }
  state.raf = requestAnimationFrame(tick);

  const api = {
    ff,
    state,
    compute,
    dispose() {
      state.disposed = true;
      cancelAnimationFrame(state.raf);
      ff.dispose();
    },
  };
  // e2e hook
  window.__flowfield = api;
  return api;
}
