export function createEnemy(config) {
  return {
    kind: "hedgehog",
    speed: 46,
    sleepDuration: 4,
    ...config,
    baseY: config.y,
    asleep: 0,
    vy: 0,
    phase: "wait",
    timer: config.delay ?? 0.8,
    clock: config.offset || 0,
  };
}
export function enemyBounds(e) {
  const w = e.kind === "frog" ? 44 : e.kind === "bee" ? 36 : 44;
  const h = e.kind === "bee" ? 28 : 29;
  return { x: e.x - w / 2, y: e.y - h, w, h };
}
export function updateEnemy(e, dt) {
  e.asleep = Math.max(0, e.asleep - dt);
  // A frog settles onto its own branch when barked at in mid-hop.
  if (e.asleep > 0) {
    if (e.kind === "frog" && e.y < e.baseY) {
      e.vy += 900 * dt;
      e.y = Math.min(e.baseY, e.y + e.vy * dt);
    }
    return;
  }
  e.clock += dt;
  if (e.kind === "frog") {
    e.timer -= dt;
    if (e.phase === "wait" && e.timer <= 0) {
      e.phase = "crouch";
      e.timer = 0.3;
    } else if (e.phase === "crouch" && e.timer <= 0) {
      e.phase = "hop";
      e.vy = -300;
    }
    if (e.phase === "hop") {
      e.vy += 900 * dt;
      e.y += e.vy * dt;
      e.x += e.dir * e.speed * dt;
      if (e.y >= e.baseY) {
        e.y = e.baseY;
        e.vy = 0;
        e.phase = "wait";
        e.timer = e.rest ?? 0.75;
      }
    }
  } else {
    e.x += e.dir * e.speed * dt;
    if (e.kind === "bee") e.y = e.baseY + Math.sin(e.clock * 3) * 18;
  }
  if (e.x < e.min || e.x > e.max) {
    e.dir *= -1;
    e.x = Math.max(e.min, Math.min(e.max, e.x));
  }
}
export function calmEnemy(e) {
  const newlyAsleep = e.asleep <= 0;
  e.asleep = e.sleepDuration;
  if (e.kind === "frog") {
    e.phase = "wait";
    e.timer = 0.65;
  }
  return newlyAsleep;
}

// Bold, hand-drawn shapes match the outlined forest objects. Feet tuck/extend
// during each hop; the bee's paired wings flap independently of its flight path.
export function drawForestEnemy(ctx, e, reduced = false) {
  const TAU = Math.PI * 2;
  const asleep = e.asleep > 0;
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.scale(e.dir, 1);
  ctx.lineWidth = 2.2;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const oval = (x, y, rx, ry, color, angle = 0) => {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, angle, 0, TAU);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = "#43543c";
    ctx.stroke();
  };
  const stroke = (points, color = "#43543c", width = 2) => {
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for (const p of points.slice(1)) ctx.lineTo(...p);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.lineWidth = 2.2;
  };
  if (e.kind === "frog") {
    const hop = e.phase === "hop" && !asleep;
    const crouch = e.phase === "crouch" && !asleep;
    if (crouch) ctx.scale(1.12, 0.76);
    if (hop && e.vy < 0) {
      stroke(
        [
          [-14, -10],
          [-24, 2],
          [-32, 5],
        ],
        "#526d38",
        5,
      );
      stroke(
        [
          [6, -9],
          [18, 1],
          [28, 3],
        ],
        "#526d38",
        4,
      );
    } else {
      oval(-17, -7, 10, 7, "#70a64f");
      oval(15, -4, 9, 4, "#a8c96b");
    }
    oval(-2, -15, 22, 15, "#83b858");
    oval(5, -12, 13, 9, "#d7df91");
    oval(-6, -29, 8, 9, "#a7ca6c");
    oval(13, -29, 8, 9, "#a7ca6c");
    for (const x of [-5, 14]) {
      if (asleep)
        stroke([
          [x - 3, -29],
          [x + 3, -29],
        ]);
      else {
        oval(x, -29, 4.4, 5, "#fff9dc");
        ctx.fillStyle = "#263e31";
        ctx.beginPath();
        ctx.ellipse(x + 1, -29, 2, 3, 0, 0, TAU);
        ctx.fill();
      }
    }
    stroke([
      [7, -18],
      [13, -16],
      [18, -19],
    ]);
    ctx.fillStyle = "#537e3d";
    for (const [x, y] of [
      [-16, -18],
      [-10, -12],
      [-11, -23],
    ]) {
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, TAU);
      ctx.fill();
    }
  } else {
    const flap = asleep || reduced ? 0 : Math.sin(e.clock * 42);
    oval(-9, -29, 8, 17, "#e5f4e9", -0.55 - flap * 0.35);
    oval(6, -30, 8, 18, "#eef7ec", 0.5 + flap * 0.35);
    oval(-2, -14, 23, 15, "#edc450");
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(-2, -14, 23, 15, 0, 0, TAU);
    ctx.clip();
    ctx.fillStyle = "#6d5939";
    ctx.fillRect(-17, -31, 7, 34);
    ctx.fillRect(-3, -31, 7, 34);
    ctx.restore();
    oval(17, -16, 10, 12, "#f5d674");
    if (asleep)
      stroke([
        [17, -18],
        [22, -18],
      ]);
    else {
      ctx.fillStyle = "#384633";
      ctx.beginPath();
      ctx.arc(21, -19, 2.6, 0, TAU);
      ctx.fill();
    }
    stroke([
      [14, -27],
      [12, -35],
      [16, -38],
    ]);
    stroke([
      [22, -27],
      [23, -34],
      [27, -36],
    ]);
    for (const x of [-14, -3, 8])
      stroke(
        [
          [x, -1],
          [x - 3, 5],
          [x + 2, 6],
        ],
        "#655439",
        1.8,
      );
  }
  ctx.restore();
  if (asleep) {
    ctx.save();
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff8dd";
    ctx.strokeStyle = "#52777b";
    ctx.lineWidth = 3;
    ctx.strokeText("z z", e.x, e.y - 52);
    ctx.fillText("z z", e.x, e.y - 52);
    ctx.restore();
  }
}
