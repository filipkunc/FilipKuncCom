// Whole-character poses based on Neli's custom fheroes2 artwork.
// Source PNGs stay untouched; all crops and placement are done at render time.
export const NELINKA_ACTIONS = {
  idle: [41, 208, 583, 317],
  jump: [661, 168, 553, 372],
  fall: [22, 779, 602, 272],
  bark: [658, 731, 574, 344],
};
export const NELINKA_WALK = [
  [28, 227, 365, 195],
  [397, 224, 368, 197],
  [768, 220, 346, 210],
  [1132, 214, 389, 167],
  [24, 615, 369, 185],
  [406, 627, 355, 178],
  [771, 618, 364, 187],
  [1151, 617, 371, 192],
];
// Shoulder registration and floor line are separate from the trim bounds.
// In particular, airborne poses must keep their lift rather than be dragged
// down to the floor just because their feet have a different bounding box.
const WALK_ANCHORS = [
  [249, 422],
  [616, 421],
  [977, 430],
  [1379, 420],
  [245, 810],
  [620, 805],
  [995, 805],
  [1376, 809],
];

export function nelinkaFrame(distance) {
  // Eight drawings per stride, driven by distance so stopping stops the feet.
  return Math.floor(Math.abs(distance) / 15) % NELINKA_WALK.length;
}

export function drawNelinka(ctx, images, animation, distance = 0) {
  const running = animation === "run";
  const rect = running
    ? NELINKA_WALK[nelinkaFrame(distance)]
    : NELINKA_ACTIONS[animation];
  const scale = running ? 0.3 : 0.194;
  const width = rect[2] * scale;
  const height = rect[3] * scale;
  const anchor = running ? WALK_ANCHORS[nelinkaFrame(distance)] : null;
  const x = anchor ? 20 - (anchor[0] - rect[0]) * scale : -width / 2;
  const y = anchor ? -(anchor[1] - rect[1]) * scale : -height;
  ctx.drawImage(
    running ? images.walk : images.actions,
    ...rect,
    x,
    y,
    width,
    height,
  );
}
