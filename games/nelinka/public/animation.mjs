// Impact deformation around the mushroom's fixed base, in simulation seconds.
const SPRING_POSES = [
  [0, 0.72],
  [0.055, 0.68],
  [0.18, 1.14],
  [0.3, 0.96],
  [0.44, 1.02],
  [0.6, 1],
];

export function mushroomPose(age, reducedMotion = false) {
  if (!Number.isFinite(age) || age < 0 || age >= 0.6)
    return { x: 1, y: 1, phase: "rest" };
  let y = SPRING_POSES[0][1];
  for (let i = 1; i < SPRING_POSES.length; i++) {
    const [end, to] = SPRING_POSES[i];
    if (age <= end) {
      const [start, from] = SPRING_POSES[i - 1];
      const t = (age - start) / (end - start);
      y = from + (to - from) * t * t * (3 - 2 * t);
      break;
    }
  }
  if (reducedMotion) y = 1 + (Math.min(y, 1) - 1) * 0.35;
  return { x: 1 + (1 - y) * 0.55, y, phase: y < 0.99 ? "squash" : "rebound" };
}
