// Hand-placed pivots in the original transparent cutout sheets. A single body
// image is reused throughout the stride, avoiding generated-frame shape flicker.
const PARTS = [
  [64, 34, 559, 454],
  [783, 181, 184, 299],
  [1209, 149, 187, 333],
  [66, 530, 521, 438],
  [790, 695, 167, 210],
  [1234, 695, 175, 215],
];

// Diagonal pairs share a phase: near front + far hind, far front + near hind.
// The stance sweeps at constant speed. The lifted return eases into contact.
export function footPose(phase, stride, lift) {
  const t = ((phase % 1) + 1) % 1;
  if (t < 0.5) return { x: stride * (0.25 - t), y: 0 };
  const u = (t - 0.5) * 2;
  const eased = u * u * (3 - 2 * u);
  return { x: (stride * (eased - 0.5)) / 2, y: -Math.sin(u * Math.PI) * lift };
}

export function quadrupedPose(distance, kind, moving = true) {
  const stride = kind === "puppy" ? 76 : 26;
  const phase = distance / stride;
  const a = moving
    ? footPose(phase, stride, kind === "puppy" ? 9 : 4)
    : { x: 0, y: 0 };
  const b = moving
    ? footPose(phase + 0.5, stride, kind === "puppy" ? 9 : 4)
    : { x: 0, y: 0 };
  return { nearFront: a, farHind: a, nearHind: b, farFront: b };
}

export function drawQuadruped(ctx, sheet, kind, distance, moving = true) {
  const dog = kind === "puppy";
  const [body, front, hind] = PARTS.slice(dog ? 0 : 3, dog ? 3 : 6);
  const width = dog ? 90 : 59;
  const belly = dog ? 16 : 7;
  const length = dog ? 34 : 12;
  const hip = dog ? -width * 0.26 : -16;
  const shoulder = dog ? width * 0.2 : 13;
  const pose = quadrupedPose(distance, kind, moving);
  function leg(rect, jointX, foot, far) {
    const [sx, sy, sw, sh] = rect;
    // The source pivot is below the rounded cap. Keep that cap hidden inside
    // the body and aim the paw at its planted/lifted target.
    const pivot = dog ? 0.2 : 0.24;
    const dx = foot.x;
    const dy = length + foot.y - (far ? 1.5 : 0);
    const drawnLength = Math.hypot(dx, dy) / (1 - pivot);
    const drawnWidth = dog ? (rect === hind ? 19 : 15) : 9;
    ctx.save();
    ctx.translate(jointX + (far ? 3 : 0), -length);
    ctx.rotate(-Math.atan2(dx, dy));
    ctx.drawImage(
      sheet,
      sx,
      sy,
      sw,
      sh,
      -drawnWidth * 0.45,
      -drawnLength * pivot,
      drawnWidth,
      drawnLength,
    );
    ctx.restore();
  }
  leg(hind, hip, pose.farHind, true);
  leg(front, shoulder, pose.farFront, true);
  leg(hind, hip, pose.nearHind, false);
  leg(front, shoulder, pose.nearFront, false);
  const height = (width * body[3]) / body[2];
  ctx.drawImage(sheet, ...body, -width / 2, -height - belly, width, height);
}
