// Deterministic simulation. Level data is shared by rendering and collision.
import { LEVELS } from "./levels.mjs";
import { sinkingPose, liftY, SINK_CYCLE } from "./mechanics.mjs";
import {
  createEnemy,
  updateEnemy,
  enemyBounds,
  calmEnemy,
} from "./enemies.mjs";
export {
  LEVELS,
  WORLD,
  VIEW,
  TERRAIN,
  DUCKS,
  KEY,
  SECRET,
  SPRING,
  FLAGS,
  SIGNS,
  TREATS,
  GATE,
  EXIT,
} from "./levels.mjs";
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const integer = (v, max) => (Number.isInteger(v) ? clamp(v, 0, max) : 0);
export function overlaps(a, b) {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}
export function platforms(time, level = LEVELS[0], state = {}) {
  return [
    ...level.terrain.map((p, i) => {
      const pose = p.sinking ? sinkingPose(time, state.sinking?.[i]) : null;
      const y = p.y + (pose?.offset || 0);
      return {
        ...p,
        y,
        baseY: p.y,
        id: `ground-${i}`,
        sinkIndex: i,
        sinkPose: pose,
        solid: !p.sinking || y < 802,
      };
    }),
    ...level.logs.map((p, i) => ({
      ...p,
      x: p.x + Math.sin(time * p.speed + p.phase) * p.amplitude,
      id: `raft-${i}`,
      moving: true,
    })),
    ...(level.lifts || []).map((p, i) => ({
      ...p,
      y: liftY(p, time),
      h: 18,
      id: `lift-${i}`,
      leaf: true,
    })),
    ...(level.bridges || []).flatMap((b, i) =>
      state.bridges?.[i]
        ? b.platforms.map((p, j) => ({
            ...p,
            h: 18,
            id: `bridge-${i}-${j}`,
            flower: true,
            bloom: clamp(
              (time - (state.bridgeTimes?.[i] ?? -Infinity)) / 0.6,
              0.08,
              1,
            ),
            solid: time - (state.bridgeTimes?.[i] ?? -Infinity) >= 0.6,
          }))
        : [],
    ),
  ];
}
function placeAtCheckpoint(g) {
  const f = g.level.flags[g.checkpoint - 1] || g.level.spawn;
  const floor = platforms(0, g.level).find(
    (p) => p.ground && f.x >= p.x && f.x < p.x + p.w,
  );
  Object.assign(g.p, {
    x: f.x,
    y: f.y - g.p.h,
    vx: 0,
    vy: 0,
    grounded: true,
    platform: floor?.id || null,
  });
}
export function createGame(saved = null) {
  const valid = saved && (saved.version === 2 || saved.version === 3);
  const levelIndex =
    valid && saved.version === 3 ? integer(saved.level, LEVELS.length - 1) : 0;
  const level = LEVELS[levelIndex];
  const game = {
    levelIndex,
    level,
    completed: LEVELS.map((l, i) => {
      const result = valid && saved.version === 3 && saved.completed?.[i];
      return result && result.rescued === 3
        ? {
            rescued: 3,
            treats: integer(result.treats, l.treats.length),
            secret: result.secret === true,
          }
        : null;
    }),
    time: 0,
    p: {
      x: level.spawn.x,
      y: level.spawn.y - 56,
      w: 43,
      h: 56,
      vx: 0,
      vy: 0,
      facing: 1,
      grounded: true,
      platform: "ground-0",
    },
    checkpoint: 0,
    rescued: [false, false, false],
    collected: level.treats.map(() => false),
    key: false,
    gate: false,
    secret: false,
    won: false,
    bark: 0,
    barkCooldown: 0,
    springAt: -Infinity,
    springTimes: level.springs.map(() => -Infinity),
    sinking: level.terrain.map(() => -Infinity),
    bridges: (level.bridges || []).map(
      (_, i) => valid && saved.bridges?.[i] === true,
    ),
    bridgeTimes: (level.bridges || []).map(() => -Infinity),
    invincible: 0,
    coyote: 0.12,
    jumpBuffer: 0,
    wasJump: false,
    wasBark: false,
    enemies: level.enemies.map(createEnemy),
    events: [],
    respawns: 0,
  };
  if (valid) {
    game.checkpoint = integer(Number(saved.checkpoint), level.flags.length);
    if (Array.isArray(saved.rescued))
      game.rescued = level.ducks.map((_, i) => saved.rescued[i] === true);
    if (Array.isArray(saved.collected))
      game.collected = level.treats.map((_, i) => saved.collected[i] === true);
    game.key = saved.key === true;
    game.gate = saved.gate === true && game.key;
    game.secret = saved.secret === true;
    placeAtCheckpoint(game);
    game.won =
      saved.version === 3 &&
      saved.won === true &&
      game.rescued.every(Boolean) &&
      game.key &&
      game.gate;
  }

  return game;
}
export function saveGame(g) {
  return {
    version: 3,
    level: g.levelIndex,
    completed: g.completed.map((r) => r && { ...r }),
    won: g.won,
    checkpoint: g.checkpoint,
    bridges: [...g.bridges],
    rescued: [...g.rescued],
    collected: [...g.collected],
    key: g.key,
    gate: g.gate,
    secret: g.secret,
  };
}
function event(g, type) {
  g.events.push(type);
}
function respawn(g) {
  g.sinking.fill(-Infinity);
  placeAtCheckpoint(g);
  g.invincible = 2;
  g.coyote = 0.12;
  g.jumpBuffer = 0;
  g.respawns++;
  event(g, "respawn");
}
export function step(g, input, dt = 1 / 60) {
  if (g.won) return;
  dt = clamp(dt, 0, 1 / 30);
  const {
    world: WORLD,
    ducks: DUCKS,
    treats: TREATS,
    flags: FLAGS,
    key: KEY,
    secret: SECRET,
    gate: GATE,
    exit: EXIT,
  } = g.level;
  const p = g.p,
    oldTime = g.time;
  g.time += dt;
  g.bark = Math.max(0, g.bark - dt);
  g.barkCooldown = Math.max(0, g.barkCooldown - dt);
  g.invincible = Math.max(0, g.invincible - dt);
  const jump = !!input.jump,
    bark = !!input.bark;
  if ((jump && !g.wasJump) || input.jumpPressed) g.jumpBuffer = 0.16;
  else g.jumpBuffer = Math.max(0, g.jumpBuffer - dt);
  if (!jump && g.wasJump && p.vy < -250) p.vy *= 0.5;
  g.wasJump = jump;
  if (((bark && !g.wasBark) || input.barkPressed) && g.barkCooldown === 0) {
    g.bark = 0.35;
    g.barkCooldown = 0.6;
    event(g, "bark");
  }
  g.wasBark = bark;
  const direction = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const desired = direction * 260,
    acceleration = p.grounded ? 2100 : 1450;
  p.vx += clamp(desired - p.vx, -acceleration * dt, acceleration * dt);
  if (direction) p.facing = direction;
  const now = platforms(g.time, g.level, g),
    before = platforms(oldTime, g.level, g);
  if (p.grounded && p.platform) {
    const a = before.find((a) => a.id === p.platform),
      b = now.find((a) => a.id === p.platform);
    if (a && b && b.solid !== false) {
      p.x += b.x - a.x;
      p.y += b.y - a.y;
    }
  }
  g.coyote = p.grounded ? 0.13 : Math.max(0, g.coyote - dt);
  if (g.jumpBuffer > 0 && g.coyote > 0) {
    p.vy = -690;
    p.grounded = false;
    p.platform = null;
    g.coyote = 0;
    g.jumpBuffer = 0;
    event(g, "jump");
  }
  const previousX = p.x,
    previousBottom = p.y + p.h;
  p.x = clamp(p.x + p.vx * dt, 0, WORLD.width - p.w);
  if (!g.gate && overlaps(p, GATE)) {
    if (g.key) {
      g.gate = true;
      event(g, "gate");
    } else {
      p.x = previousX < GATE.x ? GATE.x - p.w : GATE.x + GATE.w;
      p.vx = 0;
      if (g.events.at(-1) !== "locked") event(g, "locked");
    }
  }
  p.vy = Math.min(1050, p.vy + 1550 * dt);
  p.y += p.vy * dt;
  p.grounded = false;
  p.platform = null;
  if (p.vy >= 0) {
    for (const platform of now) {
      if (
        platform.solid !== false &&
        p.x + p.w > platform.x + 3 &&
        p.x < platform.x + platform.w - 3 &&
        previousBottom <= platform.y + 3 &&
        p.y + p.h >= platform.y
      ) {
        p.y = platform.y - p.h;
        p.vy = 0;
        p.grounded = true;
        p.platform = platform.id;
        if (
          platform.sinking &&
          g.time - g.sinking[platform.sinkIndex] >= SINK_CYCLE
        ) {
          g.sinking[platform.sinkIndex] = g.time;
          event(g, "sinking");
        }
        break;
      }
    }
  }
  for (const [i, spring] of g.level.springs.entries()) {
    if (
      p.grounded &&
      p.x + p.w > spring.x + 10 &&
      p.x < spring.x + spring.w - 10 &&
      Math.abs(p.y + p.h - spring.y) < 6
    ) {
      p.vy = -1030;
      p.grounded = false;
      g.coyote = 0;
      g.springAt = g.time;
      g.springTimes[i] = g.time;
      event(g, "spring");
      break;
    }
  }
  const center = { x: p.x + p.w / 2, y: p.y + p.h / 2 };
  const near = (item, r = 48) =>
    Math.hypot(center.x - item.x, center.y - item.y) < r;
  (g.level.bridges || []).forEach((bridge, i) => {
    if (!g.bridges[i] && g.bark > 0 && near(bridge, 145)) {
      g.bridges[i] = true;
      g.bridgeTimes[i] = g.time;
      event(g, "bridge");
    }
  });
  if (!g.key && near(KEY, 48)) {
    g.key = true;
    event(g, "key");
  }
  if (!g.secret && near(SECRET, 45)) {
    g.secret = true;
    event(g, "secret");
  }
  DUCKS.forEach((d, i) => {
    if (!g.rescued[i] && near(d, 53)) {
      g.rescued[i] = true;
      event(g, "rescue");
    }
  });
  TREATS.forEach((t, i) => {
    if (!g.collected[i] && near(t, 38)) {
      g.collected[i] = true;
      event(g, "treat");
    }
  });
  FLAGS.forEach((f, i) => {
    if (
      i + 1 > g.checkpoint &&
      Math.abs(center.x - f.x) < 45 &&
      p.grounded &&
      p.y + p.h > 750
    ) {
      g.checkpoint = i + 1;
      event(g, "checkpoint");
    }
  });
  for (const e of g.enemies) {
    updateEnemy(e, dt);
    if (
      g.bark > 0 &&
      Math.abs(center.x - e.x) < 155 &&
      Math.abs(center.y - (e.y - 20)) < 90
    ) {
      if (calmEnemy(e)) event(g, "stun");
    }
    if (!e.asleep) {
      if (g.invincible === 0 && overlaps(p, enemyBounds(e))) respawn(g);
    }
  }
  if (p.y > WORLD.height + 40) respawn(g);
  if (p.x > EXIT.x - 45 && p.grounded) {
    if (g.rescued.every(Boolean)) {
      g.won = true;
      const previous = g.completed[g.levelIndex];
      g.completed[g.levelIndex] = {
        rescued: 3,
        treats: Math.max(
          previous?.treats || 0,
          g.collected.filter(Boolean).length,
        ),
        secret: g.secret || previous?.secret === true,
      };
      event(g, "win");
    } else if (g.events.at(-1) !== "missing") event(g, "missing");
  }
  // Avoid accumulating notifications in callers that don't consume events each tick.
  if (g.events.length > 80) g.events.splice(0, g.events.length - 80);
}

// Moving on always starts a fresh level, while preserving the adventure record.
export function nextLevel(g) {
  if (!g.won || g.levelIndex >= LEVELS.length - 1) return null;
  return createGame({
    version: 3,
    level: g.levelIndex + 1,
    completed: g.completed,
  });
}
export function replayLevel(g) {
  return createGame({
    version: 3,
    level: g.levelIndex,
    completed: g.completed,
  });
}
