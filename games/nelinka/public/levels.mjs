// Five authored routes. Coordinates are logical pixels shared by physics and drawing.
export const WORLD = { width: 4040, height: 940, ground: 780 };
export const VIEW = { width: 960, height: 600 };
export const EXIT = { x: 3840, y: 780 };
export const GATE = { x: 2180, y: 0, w: 42, h: 780 };
export const SPRING = { x: 1240, y: 780, w: 90 };
export const KEY = { x: 1500, y: 477 };
export const SECRET = { x: 1020, y: 398 };
export const FLAGS = [
  { x: 1080, y: 780 },
  { x: 2300, y: 780 },
  { x: 3070, y: 780 },
];
const solid = (x, y, w, h = 24) => ({ x, y, w, h });
export const TERRAIN = [
  { ...solid(0, 780, 2520, 160), ground: true },
  { ...solid(2980, 780, 1060, 160), ground: true },
  solid(340, 670, 180),
  solid(610, 560, 220),
  solid(925, 440, 205),
  solid(1340, 510, 265),
  solid(1695, 520, 270),
  solid(3140, 660, 155),
  solid(3360, 545, 220),
];
export const DUCKS = [
  { x: 730, y: 535 },
  { x: 1830, y: 495 },
  { x: 3480, y: 520 },
];
export const SIGNS = [
  { x: 150, y: 780, text: "← →  BĚŽ", sub: "MEZERNÍK  SKOČ" },
  { x: 580, y: 780, text: "KAMARÁD NAHOŘE ↑" },
  { x: 1150, y: 780, text: "HOUBA TĚ VYHODÍ ↑" },
  { x: 2030, y: 780, text: "E  ŠTĚKNI!", sub: "A JEŽEK SI ZDŘÍMNE" },
  { x: 2410, y: 780, text: "POČKEJ NA KLÁDU →" },
  { x: 3110, y: 780, text: "JEŠTĚ KOUSEK ↑" },
];
const treats = [];
for (const [x, y, n] of [
  [210, 739, 3],
  [370, 635, 3],
  [640, 525, 3],
  [960, 405, 3],
  [1365, 475, 3],
  [1715, 485, 4],
  [2290, 739, 4],
  [3135, 739, 2],
  [3160, 625, 2],
  [3390, 510, 3],
  [3650, 739, 4],
]) {
  for (let i = 0; i < n; i++) treats.push({ x: x + i * 43, y });
}
export const TREATS = treats;

const branch = (x, y, w = 200) => solid(x, y, w);
const duck = (x, platformY) => ({ x, y: platformY - 25 });
const flag = (x) => ({ x, y: 780 });
const spring = (x) => ({ x, y: 780, w: 90 });
const sinkingStone = (x, y = 750, w = 125) => ({
  ...branch(x, y, w),
  stone: true,
  sinking: true,
});
const lift = (x, top = 480, bottom = 768) => ({
  x,
  w: 165,
  top,
  bottom,
  period: 6.5,
});
const flowerBridge = (x, platforms) => ({
  x,
  y: 719,
  platforms: platforms.map(([x, y, w]) => ({ x, y, w })),
});
const water = (x, w) => ({ x, w, y: 806 });
const log = (x, amplitude = 50, phase = 0) => ({
  x,
  y: 786,
  w: 155,
  h: 23,
  amplitude,
  phase,
  speed: 0.9,
});
const enemy = (min, max, dir = 1, y = 780, speed = 46) => ({
  x: (min + max) / 2,
  y,
  kind: "hedgehog",
  speed,
  sleepDuration: speed > 46 ? 3 : 4,
  min,
  max,
  dir,
  asleep: 0,
});
const frog = (min, max, y = 780, dir = 1, rest = 0.75) => ({
  ...enemy(min, max, dir, y, 130),
  kind: "frog",
  sleepDuration: 2.2,
  rest,
});
const bee = (min, max, y, dir = 1, speed = 85) => ({
  ...enemy(min, max, dir, y, speed),
  kind: "bee",
  sleepDuration: 1.6,
});
function ground(width, waters) {
  let x = 0;
  const result = [];
  for (const pool of waters) {
    result.push({ ...solid(x, 780, pool.x - x, 160), ground: true });
    x = pool.x + pool.w;
  }
  result.push({ ...solid(x, 780, width - x, 160), ground: true });
  return result;
}
function trail(rows) {
  return rows.flatMap(([x, y, n, gap = 43]) =>
    Array.from({ length: n }, (_, i) => ({ x: x + i * gap, y })),
  );
}
function level(config) {
  return {
    world: { ...WORLD, width: config.width },
    exit: { x: config.width - 180, y: 780 },
    spawn: { x: 100, y: 780 },
    ...config,
    terrain: [...ground(config.width, config.waters), ...config.branches],
    treats: trail(config.trail),
    signs: config.signs.map(([x, text, sub]) => ({ x, y: 780, text, sub })),
  };
}

export const LEVELS = [
  {
    id: "paseka",
    title: "Slunečná paseka",
    subtitle: "Za šuměním listí",
    description: "První kamarádi čekají na větvích. Houba tě vynese ke klíči.",
    world: WORLD,
    spawn: { x: 100, y: 780 },
    terrain: TERRAIN,
    ducks: DUCKS,
    treats: TREATS,
    flags: FLAGS,
    signs: SIGNS,
    springs: [SPRING],
    key: KEY,
    secret: SECRET,
    gate: GATE,
    exit: EXIT,
    waters: [water(2520, 460)],
    logs: [{ ...log(2590, 70), w: 150 }, log(2780, 75, 1.2)],
    enemies: [
      enemy(880, 1030),
      enemy(2000, 2130, -1),
      enemy(3120, 3300),
      enemy(1740, 1900, -1, 520, 40),
    ],
    tint: "#f6f5cf16",
    flowers: "#eab856",
  },
  level({
    id: "haj",
    title: "Květinový háj",
    subtitle: "Po stopách motýlů",
    width: 3600,
    description:
      "Květiny slyší Nelinku! U velkého květu štěkni klávesou E a otevři si cestu.",
    waters: [water(2450, 330)],
    logs: [],
    bridges: [
      flowerBridge(2350, [
        [2500, 750, 110],
        [2670, 720, 115],
      ]),
    ],
    branches: [
      branch(270, 680, 200),
      branch(530, 570, 220),
      branch(810, 460, 200),
      branch(1380, 510, 270),
      branch(1710, 510, 240),
      branch(2850, 675, 190),
      branch(3080, 560, 210),
    ],
    ducks: [duck(645, 570), duck(1830, 510), duck(3190, 560)],
    springs: [spring(1270)],
    key: { x: 1510, y: 475 },
    secret: { x: 900, y: 423 },
    gate: { x: 2130, y: 0, w: 42, h: 780 },
    flags: [flag(1130), flag(2330), flag(2820)],
    enemies: [
      enemy(870, 1010),
      enemy(2010, 2080, -1),
      frog(760, 990),
      frog(1760, 1910, 510, -1),
      bee(560, 720, 520),
      enemy(2910, 3020, 1, 780, 60),
    ],
    trail: [
      [180, 739, 2],
      [305, 645, 3],
      [555, 535, 4],
      [835, 425, 3],
      [1395, 475, 5],
      [1735, 475, 4],
      [2280, 739, 3],
      [2520, 715, 2],
      [2690, 685, 2],
      [2870, 640, 3],
      [3100, 525, 4],
      [3350, 739, 3],
    ],
    signs: [
      [150, "NAHORU PO VĚTVÍCH ↑"],
      [750, "ŽÁBA SE CHYSTÁ SKOČIT", "PŘESKOČ JI NEBO ŠTĚKNI: E"],
      [1170, "HOP KE KLÍČI →"],
      [2250, "E: PROBUĎ KVĚTINY", "ROZKVETOU V MOST PŘES VODU"],
      [2820, "POSLEDNÍ KAMARÁD ↑"],
    ],
    tint: "#eed3ed22",
    flowers: "#d886aa",
  }),
  level({
    id: "reka",
    title: "Říční ostrůvky",
    subtitle: "Za třpytem vody",
    width: 4000,
    description:
      "Kameny pod tlapkami pomalu klesají. Skoč dál, než zmizí ve vodě!",
    waters: [water(680, 460), water(2580, 460)],
    logs: [log(750, 45), log(930, 50, 1.2)],
    branches: [
      branch(290, 670, 220),
      branch(1240, 660, 200),
      branch(1490, 540, 235),
      branch(1930, 500, 270),
      branch(2280, 510, 190),
      sinkingStone(2630),
      sinkingStone(2800, 740),
      sinkingStone(2960, 750, 105),
      branch(3200, 670, 180),
      branch(3440, 550, 220),
    ],
    ducks: [duck(415, 670), duck(1600, 540), duck(3550, 550)],
    springs: [spring(1820)],
    key: { x: 2060, y: 465 },
    secret: { x: 2370, y: 475 },
    gate: { x: 2490, y: 0, w: 42, h: 780 },
    flags: [flag(590), flag(1200), flag(2540), flag(3120)],
    enemies: [
      enemy(1300, 1400, 1, 780, 60),
      enemy(3240, 3350, -1, 780, 60),
      frog(1640, 1760),
      frog(3490, 3610, 550),
      bee(1280, 1410, 608),
      bee(2020, 2160, 450, -1),
      enemy(3620, 3720, -1, 780, 65),
    ],
    trail: [
      [190, 739, 2],
      [310, 635, 4],
      [550, 739, 2],
      [1200, 739, 2],
      [1260, 625, 3],
      [1510, 505, 4],
      [1950, 465, 5],
      [2300, 475, 3],
      [3140, 739, 2],
      [3220, 635, 3],
      [3460, 515, 4],
      [3780, 739, 2],
    ],
    signs: [
      [550, "POČKEJ NA KLÁDU →"],
      [1180, "OSTRŮVEK K ODPOČINKU"],
      [1770, "HOUBA TĚ VYNESE ↑"],
      [2490, "KAMENY KLESAJÍ!", "NEČEKEJ DLOUHO — SKOČ DÁL"],
      [3130, "KAMARÁD NA VĚTVI ↑"],
    ],
    tint: "#b6e5f123",
    flowers: "#e5deaf",
  }),
  level({
    id: "houby",
    title: "Houbové stráně",
    subtitle: "Hop až do korun",
    width: 3800,
    description:
      "Nasedni na velký list, nech se vyvézt nahoru a přeskoč na větev.",
    waters: [water(2240, 260)],
    logs: [],
    lifts: [lift(355), lift(2640)],
    branches: [
      branch(480, 510, 275),
      branch(810, 400, 200),
      branch(1400, 500, 260),
      branch(1730, 500, 235),
      { ...branch(2300, 730, 115), stone: true },
      branch(2770, 510, 260),
      branch(3130, 510, 235),
    ],
    ducks: [duck(615, 510), duck(1850, 500), duck(3250, 510)],
    springs: [spring(1290)],
    key: { x: 1530, y: 465 },
    secret: { x: 915, y: 365 },
    gate: { x: 2070, y: 0, w: 42, h: 780 },
    flags: [flag(1110), flag(2180), flag(2560), flag(3490)],
    enemies: [
      enemy(950, 1010, 1, 780, 65),
      enemy(1980, 2040, -1, 780, 65),
      enemy(3360, 3390, -1, 780, 65),
      frog(540, 710, 510),
      frog(1780, 1910, 500, -1, 0.6),
      frog(2820, 2970, 510),
      bee(840, 970, 350),
      bee(3170, 3310, 458, -1, 95),
    ],
    trail: [
      [210, 739, 3],
      [500, 475, 5],
      [830, 365, 4],
      [1150, 739, 3],
      [1420, 465, 5],
      [1750, 465, 4],
      [2320, 695, 2],
      [2530, 739, 3],
      [2790, 475, 5],
      [3150, 475, 4],
      [3520, 739, 2],
    ],
    signs: [
      [240, "LIST TĚ VYVEZE ↑", "NASTUP A POČKEJ NAHOŘE"],
      [1140, "DALŠÍ HOUBA ČEKÁ →"],
      [1620, "POZOR I NA VĚTVÍCH!", "E: NA CHVÍLI JE ZKLIDNÍŠ"],
      [2140, "PŘES KÁMEN →"],
      [2550, "DALŠÍ LISTOVÝ VÝTAH ↑"],
    ],
    tint: "#eec29b25",
    flowers: "#e19170",
  }),
  level({
    id: "slavnost",
    title: "Lesní slavnost",
    subtitle: "Všichni spolu doma",
    width: 4300,
    description:
      "Klesající kameny, listový výtah a květinový most. Všechno už znáš!",
    waters: [water(1120, 460), water(3190, 280)],
    logs: [],
    lifts: [lift(2650, 610)],
    bridges: [
      flowerBridge(3110, [
        [3240, 735, 110],
        [3400, 715, 115],
      ]),
    ],
    branches: [
      branch(300, 670, 190),
      branch(570, 560, 220),
      branch(850, 445, 185),
      sinkingStone(1170),
      sinkingStone(1340, 740),
      sinkingStone(1500, 750, 105),
      branch(1890, 510, 260),
      branch(2210, 500, 235),
      branch(2930, 550, 220),
      branch(3570, 670, 190),
      branch(3820, 560, 210),
    ],
    ducks: [duck(685, 560), duck(2330, 500), duck(3930, 560)],
    springs: [spring(1780)],
    key: { x: 2020, y: 475 },
    secret: { x: 945, y: 410 },
    gate: { x: 2500, y: 0, w: 42, h: 780 },
    flags: [flag(1070), flag(1660), flag(2590), flag(3510)],
    enemies: [
      enemy(430, 520, 1, 780, 70),
      frog(610, 750, 560, -1, 0.55),
      bee(880, 990, 395, -1, 100),
      frog(1860, 2020, 780, 1, 0.55),
      enemy(1930, 2090, -1, 510, 70),
      bee(2260, 2400, 450, 1, 100),
      frog(2980, 3100, 550, -1, 0.55),
      enemy(3670, 3790, -1, 780, 75),
      bee(3870, 3990, 510, -1, 100),
      frog(3960, 4040, 780, -1, 0.55),
    ],
    trail: [
      [190, 739, 2],
      [320, 635, 3],
      [590, 525, 4],
      [875, 410, 3],
      [1640, 739, 3],
      [1910, 475, 5],
      [2230, 465, 4],
      [2690, 625, 4],
      [2950, 515, 4],
      [3260, 700, 2],
      [3420, 680, 2],
      [3590, 635, 3],
      [3840, 525, 4],
      [4110, 739, 2],
    ],
    signs: [
      [160, "POSLEDNÍ VÝPRAVA!"],
      [1040, "PO KAMENECH SVIŽNĚ →"],
      [1680, "KLÍČ JE NAD HOUBOU ↑"],
      [2570, "LIST TĚ VYVEZE ↑"],
      [3040, "E: KVĚTINOVÝ MOST →"],
      [3530, "SLAVNOST JE ZA ROHEM ♥"],
    ],
    tint: "#f6bf6f30",
    flowers: "#e5aa62",
    celebration: true,
  }),
];
