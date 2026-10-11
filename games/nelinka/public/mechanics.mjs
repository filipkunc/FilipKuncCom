// Generous warning, then a slow descent; every stone returns for another try.
export const SINK = {
  warning: 0.9,
  descent: 1.8,
  submerged: 1.5,
  rise: 1.2,
  depth: 150,
};
export const SINK_CYCLE =
  SINK.warning + SINK.descent + SINK.submerged + SINK.rise;
const clamp = (v) => Math.max(0, Math.min(1, v));
export function sinkingPose(time, started = -Infinity) {
  const age = time - started;
  if (!Number.isFinite(age) || age >= SINK_CYCLE)
    return { offset: 0, phase: "ready", remaining: 1 };
  if (age < SINK.warning)
    return { offset: 0, phase: "warning", remaining: 1 - age / SINK.warning };
  if (age < SINK.warning + SINK.descent)
    return {
      offset: SINK.depth * clamp((age - SINK.warning) / SINK.descent),
      phase: "sinking",
      remaining: 0,
    };
  if (age < SINK_CYCLE - SINK.rise)
    return { offset: SINK.depth, phase: "submerged", remaining: 0 };
  return {
    offset: SINK.depth * clamp((SINK_CYCLE - age) / SINK.rise),
    phase: "rising",
    remaining: 0,
  };
}
export function liftY(lift, time) {
  // A cosine eases to a stop at both ends, giving small players time to board.
  const t =
    (1 - Math.cos((time * Math.PI * 2) / lift.period + (lift.phase || 0))) / 2;
  return lift.bottom + (lift.top - lift.bottom) * t;
}
