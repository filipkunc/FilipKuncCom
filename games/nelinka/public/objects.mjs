const TAU = Math.PI * 2;
export function drawLeafPlatform(ctx, p) {
  ctx.save();
  const middle = p.x + p.w / 2;
  const base = p.flower ? 854 : p.bottom + 27;
  ctx.strokeStyle = "#5d8150";
  ctx.lineWidth = p.flower ? 5 : 7;
  ctx.beginPath();
  ctx.moveTo(middle, base);
  ctx.bezierCurveTo(
    middle - 38,
    base - 70,
    middle + 30,
    p.y + 60,
    middle,
    p.y + 14,
  );
  ctx.stroke();
  if (!p.flower) {
    ctx.strokeStyle = "#bdcf85";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.translate(middle, p.y);
  if (p.flower) ctx.scale(p.bloom ?? 1, p.bloom ?? 1);
  ctx.beginPath();
  ctx.moveTo(-p.w / 2, 3);
  ctx.bezierCurveTo(-p.w / 4, -3, p.w / 4, -3, p.w / 2, 3);
  ctx.bezierCurveTo(p.w / 3, 38, -p.w / 4, 37, -p.w / 2, 3);
  const fill = ctx.createLinearGradient(0, 0, 0, 35);
  fill.addColorStop(0, p.flower ? "#f9c7da" : "#c5dc83");
  fill.addColorStop(1, p.flower ? "#cd6e9c" : "#639555");
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = p.flower ? "#7c4865" : "#426b41";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-p.w / 2 + 9, 8);
  ctx.quadraticCurveTo(0, 13, p.w / 2 - 10, 7);
  for (let i = -2; i <= 2; i++) {
    ctx.moveTo((i * p.w) / 7, 10);
    ctx.lineTo((i * p.w) / 6 + 8, 24);
  }
  ctx.strokeStyle = p.flower ? "#a6537e" : "#72944a";
  ctx.lineWidth = 1.7;
  ctx.stroke();
  if (!p.flower) {
    ctx.fillStyle = "#426b41";
    ctx.font = "bold 17px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("↑", 0, 25);
  }
  ctx.restore();
}
export function drawFlowerBell(ctx, bell, open, time) {
  ctx.save();
  ctx.strokeStyle = "#517c45";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(bell.x, 780);
  ctx.quadraticCurveTo(bell.x - 15, 754, bell.x, bell.y);
  ctx.stroke();
  for (let i = 0; i < 6; i++) {
    const angle = (i * TAU) / 6;
    ctx.beginPath();
    ctx.ellipse(
      bell.x + Math.cos(angle) * 20,
      bell.y + Math.sin(angle) * 20,
      17,
      11,
      angle,
      0,
      TAU,
    );
    ctx.fillStyle = open ? "#f8bdd2" : "#e9a5c7";
    ctx.fill();
    ctx.strokeStyle = "#844e71";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(bell.x, bell.y, 15, 0, TAU);
  ctx.fillStyle = "#ffdb75";
  ctx.fill();
  ctx.strokeStyle = "#866135";
  ctx.stroke();
  ctx.font = "bold 18px sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#635432";
  ctx.fillText(open ? "✓" : "♪", bell.x, bell.y + 6);
  if (!open) {
    const labelY = bell.y - 65 + Math.sin(time * 2) * 2;
    ctx.fillStyle = "#fff8df";
    ctx.beginPath();
    ctx.roundRect(bell.x - 42, labelY - 15, 84, 25, 9);
    ctx.fill();
    ctx.strokeStyle = "#735b40";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = "#375a42";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("E · HAF!", bell.x, labelY + 2);
    for (const p of bell.platforms) {
      // Closed buds preview exactly where a bark will create safe footholds.
      const x = p.x + p.w / 2;
      ctx.beginPath();
      ctx.moveTo(x, 846);
      ctx.quadraticCurveTo(x - 15, 805, x, p.y + 28);
      ctx.strokeStyle = "#527b50";
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(x, p.y + 20, 11, 22, 0.2, 0, TAU);
      ctx.fillStyle = "#c583a5";
      ctx.fill();
      ctx.strokeStyle = "#774e65";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  ctx.restore();
}
export function drawStoneRipples(ctx, p, time) {
  if (p.sinkPose.phase === "ready") return;
  ctx.save();
  ctx.strokeStyle = "#e2f7dfaa";
  ctx.lineWidth = 1.8;
  const phase = (time * 0.7) % 1;
  for (let i = 0; i < 3; i++) {
    ctx.globalAlpha = 0.8 - i * 0.18;
    ctx.beginPath();
    ctx.ellipse(
      p.x + p.w / 2,
      809 + i * 5,
      p.w / 2 + (i + phase) * 10,
      4 + i * 2,
      0,
      0,
      TAU,
    );
    ctx.stroke();
  }
  ctx.restore();
}
