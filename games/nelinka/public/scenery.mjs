// Canvas scenery keeps the same hand-drawn language as the character artwork.
const TAU = Math.PI * 2;
function outlinedFill(ctx, fill, width = 3) {
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#fff7dd";
  ctx.lineWidth = width + 4;
  ctx.stroke();
  ctx.fillStyle = fill;
  ctx.fill("evenodd");
  ctx.strokeStyle = "#634222";
  ctx.lineWidth = width;
  ctx.stroke();
}
export function drawPickupStar(ctx, x, y, radius = 10, secret = false) {
  ctx.save();
  if (secret) {
    const glow = ctx.createRadialGradient(x, y, 4, x, y, 35);
    glow.addColorStop(0, "#fff2b878");
    glow.addColorStop(1, "#fff2b800");
    ctx.fillStyle = glow;
    ctx.fillRect(x - 35, y - 35, 70, 70);
  }
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const r = i % 2 ? radius * 0.46 : radius;
    const px = x + Math.cos(angle) * r,
      py = y + Math.sin(angle) * r;
    if (!i) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  outlinedFill(ctx, secret ? "#ffd95c" : "#f5c553", secret ? 3 : 2.2);
  ctx.strokeStyle = "#fff2b1";
  ctx.lineWidth = secret ? 2.4 : 1.3;
  ctx.beginPath();
  ctx.moveTo(x, y - radius * 0.55);
  ctx.lineTo(x - radius * 0.15, y - radius * 0.05);
  ctx.stroke();
  ctx.restore();
}
export function drawPickupKey(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(2, -5);
  ctx.lineTo(30, -5);
  ctx.lineTo(30, 6);
  ctx.lineTo(24, 6);
  ctx.lineTo(24, 14);
  ctx.lineTo(17, 14);
  ctx.lineTo(17, 5);
  ctx.lineTo(2, 5);
  ctx.arc(-9, 0, 12, Math.atan2(5, 11), TAU - Math.atan2(5, 11));
  ctx.closePath();
  ctx.moveTo(-4, 0);
  ctx.arc(-9, 0, 5, 0, TAU);
  outlinedFill(ctx, "#ffda62", 2.7);
  ctx.restore();
}

export function drawWater(ctx, water, time, cameraX = 0) {
  const { x, y, w } = water;
  if (x + w < cameraX - 40 || x > cameraX + 1000) return;
  const bottom = 960;
  const surface = (px) =>
    y +
    Math.sin(px * 0.032 + time * 1.7) * 2.2 +
    Math.sin(px * 0.073 - time * 1.2) * 0.9;
  function edge() {
    ctx.moveTo(x, surface(x));
    for (let px = x + 5; px < x + w; px += 5) ctx.lineTo(px, surface(px));
    ctx.lineTo(x + w, surface(x + w));
  }
  ctx.save();
  ctx.beginPath();
  edge();
  ctx.lineTo(x + w, bottom);
  ctx.lineTo(x, bottom);
  ctx.closePath();
  ctx.clip();
  const depth = ctx.createLinearGradient(0, y, 0, bottom);
  depth.addColorStop(0, "#a0d9cb");
  depth.addColorStop(0.14, "#68b5bb");
  depth.addColorStop(0.65, "#37878f");
  depth.addColorStop(1, "#286373");
  ctx.fillStyle = depth;
  ctx.fillRect(x, y - 5, w, bottom - y + 5);
  // Broken vertical reflections of the foliage above the bank.
  for (let i = 0; i < 11; i++) {
    const center = x + (w * (i + 0.5)) / 11 + Math.sin(i * 2.4) * 8;
    const reflection = ctx.createLinearGradient(0, y, 0, y + 100);
    reflection.addColorStop(0, i % 2 ? "#eaf1b23b" : "#345f533d");
    reflection.addColorStop(1, "#59969000");
    ctx.fillStyle = reflection;
    ctx.beginPath();
    const edgeX = (j, side) =>
      center +
      Math.sin(j * 0.3 + time * 1.3 + i * 2) * 5 +
      Math.sin(j * 0.63 - time * 0.7 + i) * 2 +
      side * (8 + (i % 3) * 3) * (1 - j / 40);
    ctx.moveTo(edgeX(0, -1), y);
    for (let j = 0; j <= 25; j++) ctx.lineTo(edgeX(j, 1), y + j * 4);
    for (let j = 25; j >= 0; j--) ctx.lineTo(edgeX(j, -1), y + j * 4);
    ctx.closePath();
    ctx.fill();
  }
  // Submerged pebbles become muted with depth.
  for (let i = 0; i < Math.ceil(w / 38); i++) {
    const px = x + 18 + i * 38;
    const py = y + 77 + Math.sin(i * 2.3) * 25;
    ctx.fillStyle = i % 2 ? "#b5cbb32e" : "#204f622f";
    ctx.beginPath();
    ctx.ellipse(px, py, 9 + (i % 4), 4, -0.2, 0, TAU);
    ctx.fill();
  }
  // Slow curved currents and smaller, quicker glints run at different speeds.
  ctx.lineCap = "round";
  for (let row = 0; row < 7; row++) {
    for (let i = 0; i < Math.ceil(w / 90); i++) {
      const px = x + ((i * 97 + row * 31 + time * (6 + row)) % (w + 70)) - 35;
      const py = y + 14 + row * 18 + Math.sin(i + time * 0.9) * 3;
      ctx.strokeStyle = row < 3 ? "#e8fff07d" : "#a2ddd74b";
      ctx.lineWidth = row < 2 ? 1.8 : 1.2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.bezierCurveTo(px + 10, py - 3, px + 23, py + 3, px + 39, py);
      ctx.stroke();
    }
  }
  // Pale foam gathers against the river banks.
  for (const bank of [x, x + w]) {
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = "#f0fae39c";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(
        bank,
        y + 6 + i * 9,
        16 + i * 3 + Math.sin(time + i) * 2,
        3,
        0,
        0,
        TAU,
      );
      ctx.stroke();
    }
  }
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  edge();
  ctx.strokeStyle = "#3b7e86";
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.strokeStyle = "#d7f4da";
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.restore();
}
