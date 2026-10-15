import { ATLAS } from "./atlas.mjs";
import { mushroomPose } from "./animation.mjs";
import { drawQuadruped } from "./rig.mjs";
import { drawNelinka, nelinkaFrame, NELINKA_ACTIONS } from "./nelinka.mjs";
import {
  createGame,
  step,
  saveGame,
  nextLevel,
  replayLevel,
  LEVELS,
  VIEW,
  platforms,
} from "./engine.mjs";
import { drawWater, drawPickupStar, drawPickupKey } from "./scenery.mjs";
import { createBarkSound } from "./sound.mjs";
import { drawForestEnemy } from "./enemies.mjs";
import {
  drawLeafPlatform,
  drawFlowerBell,
  drawStoneRipples,
} from "./objects.mjs";
const barkSound = createBarkSound();
barkSound.load();
const $ = (s) => document.querySelector(s),
  canvas = $("#game"),
  ctx = canvas.getContext("2d");
const keys = new Set(),
  touch = new Set(),
  images = {},
  SAVE = "tlapkovy-adventure-v3",
  LEGACY_SAVE = "tlapkovy-adventure-v2";
let g = createGame(),
  mode = "intro",
  camera = { x: 0, y: 340 },
  last = 0,
  accumulator = 0,
  walkDistance = 0,
  enemyWalk = new WeakMap(),
  muted = false,
  audio,
  helpWasPlaying = false,
  lastNotice = "",
  noticeUntil = 0,
  ready = false;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
// Keep physics in logical coordinates, but paint directly at display resolution.
// This avoids enlarging the old 960 × 600 bitmap on Retina/HiDPI screens.
let canvasSizeChanged = true;
new ResizeObserver(() => {
  canvasSizeChanged = true;
}).observe(canvas);
let lastPixelRatio = 0;
function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  if (!canvasSizeChanged && ratio === lastPixelRatio) return;
  const bounds = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.round(bounds.width * ratio));
  const height = Math.max(1, Math.round(bounds.height * ratio));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  lastPixelRatio = ratio;
  canvasSizeChanged = false;
}
const load = () => {
  try {
    return JSON.parse(
      localStorage.getItem(SAVE) || localStorage.getItem(LEGACY_SAVE),
    );
  } catch {
    return null;
  }
};
const persist = () => {
  try {
    localStorage.setItem(SAVE, JSON.stringify(saveGame(g)));
  } catch {}
};
const erase = () => {
  try {
    localStorage.removeItem(SAVE);
    localStorage.removeItem(LEGACY_SAVE);
  } catch {}
};
const saved = load();
if (saved?.version === 2 || saved?.version === 3) {
  $("#resume").hidden = false;
  g = createGame(saved);
  camera.x = Math.max(0, g.p.x - 300);
}
function updateLevelUI() {
  $("#chapter").textContent =
    `ÚROVEŇ ${g.levelIndex + 1} / ${LEVELS.length} · ${g.level.subtitle.toLocaleUpperCase("cs")}`;
  $("#level-title").textContent = g.level.title;
  $("#treat-total").textContent = `/ ${g.level.treats.length}`;
  $("#level-progress").replaceChildren(
    ...LEVELS.map((level, i) => {
      const item = document.createElement("li");
      const number = document.createElement("b");
      const title = document.createElement("span");
      number.textContent = g.completed[i] ? "✓" : String(i + 1);
      title.textContent = level.title;
      item.append(number, title);
      if (g.completed[i]) item.classList.add("complete");
      if (i === g.levelIndex) item.setAttribute("aria-current", "step");
      item.setAttribute(
        "aria-label",
        `${i + 1}. ${level.title}${g.completed[i] ? ", splněno" : ""}`,
      );
      return item;
    }),
  );
  canvas.dataset.level = String(g.levelIndex + 1);
}
updateLevelUI();
const pending = { jump: false, bark: false };
function clearControls() {
  keys.clear();
  touch.clear();
  pending.jump = false;
  pending.bark = false;
}
function artImage(name) {
  return images[name];
}
function drawSprite(image, rect, x, y, width, flip = 1, bob = 0) {
  const [sx, sy, sw, sh] = rect,
    height = (width * sh) / sw;
  ctx.save();
  ctx.translate(x, y - bob);
  ctx.scale(flip, 1);
  ctx.drawImage(image, sx, sy, sw, sh, -width / 2, -height, width, height);
  ctx.restore();
}
function themePreview() {
  const hero = $("#hero-character"),
    c = hero.getContext("2d"),
    rect = NELINKA_ACTIONS.idle,
    [sx, sy, sw, sh] = rect;
  c.clearRect(0, 0, 400, 450);
  const width = 370,
    height = (width * sh) / sw;
  c.drawImage(
    images.actions,
    sx,
    sy,
    sw,
    sh,
    (400 - width) / 2,
    435 - height,
    width,
    height,
  );
  canvas.dataset.artStyle = "storybook";
}
async function loadAssets() {
  try {
    await Promise.all(
      Object.entries({
        forest: "storybook-forest",
        actions: "nelinka-actions",
        walk: "nelinka-walk",
        objects: "storybook-objects",
        rig: "storybook-rig",
      }).map(async ([name, file]) => {
        const image = new Image();
        image.src = `/nelinka-classic/assets/${file}.png`;
        await image.decode();
        images[name] = image;
      }),
    );
    ready = true;
    themePreview();
    const duckIcon = $("#duck-icon").getContext("2d");
    duckIcon.drawImage(images.objects, ...ATLAS.objects[0], 3, 0, 54, 64);
    $("#start").disabled = false;
    $("#resume").disabled = false;
    $("#start").textContent = "Vyrazit do lesa →";
    draw();
  } catch {
    $("#load-status").textContent =
      "Obrázky se nepodařilo načíst. Obnov prosím stránku.";
  }
}
function unlock() {
  if (muted) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume().catch(() => {});
    barkSound.prepare(audio).catch(() => {});
  } catch {}
}
function tone(freq = 660, duration = 0.12, delay = 0, type = "sine") {
  if (muted || !audio) return;
  const o = audio.createOscillator(),
    v = audio.createGain(),
    t = audio.currentTime + delay;
  o.frequency.setValueAtTime(freq, t);
  o.frequency.exponentialRampToValueAtTime(freq * 0.85, t + duration);
  o.type = type;
  v.gain.setValueAtTime(0, t);
  v.gain.linearRampToValueAtTime(0.035, t + 0.01);
  v.gain.exponentialRampToValueAtTime(0.001, t + duration);
  o.connect(v);
  v.connect(audio.destination);
  o.start(t);
  o.stop(t + duration);
}
function speak(text) {
  if (muted || !("speechSynthesis" in window)) return;
  const voice = speechSynthesis
    .getVoices()
    .find((v) => v.lang.toLowerCase().startsWith("cs"));
  if (!voice) return;
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = "cs-CZ";
  u.rate = 0.9;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}
function message(main, sub = "", duration = 4) {
  if (lastNotice === main && g.time < noticeUntil) return;
  lastNotice = main;
  noticeUntil = g.time + duration;
  $("#instruction").textContent = main;
  $("#subinstruction").textContent = sub;
}
function defaultMessage() {
  const count = g.rescued.filter(Boolean).length;
  const bridge = (g.level.bridges || []).find(
    (b, i) => !g.bridges[i] && Math.abs(g.p.x - b.x) < 210,
  );
  const stone = platforms(g.time, g.level, g).find(
    (p) => p.id === g.p.platform && p.sinking,
  );
  if (bridge)
    message(
      "Štěkni na velký květ: E",
      "Květiny rozkvetou a vytvoří most přes vodu.",
      1,
    );
  else if (stone)
    message("Kámen klesá — skoč na další!", "Za chvilku se zase vynoří.", 1);
  else if (g.p.platform?.startsWith("lift"))
    message(
      "List tě veze nahoru. Připrav si skok!",
      "U horní větve vyskoč a pokračuj šipkou doprava.",
      1,
    );
  else if (count === 3)
    message(
      "Všichni kamarádi jsou v bezpečí. Teď k domečku!",
      "Domeček najdeš úplně vpravo.",
      1,
    );
  else if (
    g.level.waters.some((w) => g.p.x > w.x - 130 && g.p.x < w.x + w.w + 60)
  )
    message(
      "Opatrně přes vodu. Hledej klády nebo kameny.",
      g.level.terrain.some((p) => p.sinking)
        ? "Na kameni dlouho nečekej. Pod tlapkami začne klesat."
        : "Počkej na dobrý okamžik ke skoku.",
      1,
    );
  else if (!g.key && g.p.x > g.level.key.x - 600 && g.p.x < g.level.gate.x)
    message(
      "Zlatý klíč je vysoko. Zkus se odrazit od houby.",
      "Na houbu stačí stoupnout.",
      1,
    );
  else
    message(
      `Zachráněná káčátka: ${count} ze 3. Prozkoumej i větve!`,
      g.level.description,
      1,
    );
}
function begin(resume = false) {
  if (!ready) return;
  g = createGame(resume ? load() : null);
  if (!resume) erase();
  enterLevel();
}
function enterLevel() {
  camera = { x: Math.max(0, g.p.x - 300), y: 340 };
  clearControls();
  accumulator = 0;
  walkDistance = 0;
  enemyWalk = new WeakMap();
  lastNotice = "";
  noticeUntil = 0;
  mode = "playing";
  updateLevelUI();
  $("#intro").hidden = true;
  $("#paused").hidden = true;
  $("#win").hidden = true;
  $("#hud").hidden = false;
  $("#pause").disabled = false;
  unlock();
  defaultMessage();
  updateHud();
  canvas.focus({ preventScroll: true });
  persist();
  if (g.won) finish();
  else speak(`${g.level.title}. Vyrazíme za kamarády!`);
}
function pause() {
  if (mode !== "playing") return;
  mode = "paused";
  clearControls();
  $("#paused").hidden = false;
  $("#continue").focus({ preventScroll: true });
  persist();
}
function resume() {
  if (mode !== "paused") return;
  mode = "playing";
  accumulator = 0;
  $("#paused").hidden = true;
  canvas.focus({ preventScroll: true });
}
function updateHud() {
  $("#rescued").textContent = `${g.rescued.filter(Boolean).length} / 3`;
  $("#treats").textContent = g.collected.filter(Boolean).length;
  $("#key-status").classList.toggle("found", g.key);
  $("#key-status").setAttribute(
    "aria-label",
    g.key ? "Zlatý klíč nalezen" : "Klíč zatím nenalezen",
  );
  $("#badge-status").classList.toggle("found", g.secret);
  $("#badge-status").setAttribute(
    "aria-label",
    g.secret ? "Tajná hvězda nalezena" : "Tajná hvězda zatím nenalezena",
  );
  $("#checkpoint-status").textContent = g.checkpoint
    ? `PRAPOREK ${g.checkpoint} / ${g.level.flags.length}`
    : "START";
  $("#area").textContent = `${g.levelIndex + 1} / 5 · ${g.level.title}`;
}
function processEvents() {
  const events = g.events.splice(0);
  for (const e of new Set(events)) {
    if (e === "jump") tone(300, 0.1);
    if (e === "spring") {
      tone(280, 0.25);
      tone(580, 0.15, 0.12);
      message(
        "Hop! Houba tě vynese do korun stromů.",
        "Ve vzduchu můžeš řídit šipkami.",
      );
    }
    if (e === "bark") {
      barkSound.play(audio).catch(() => {});
    }
    if (e === "sinking") {
      tone(230, 0.12);
      message(
        "Kámen klesá — skoč na další!",
        "Když spadneš, kameny se vrátí a zkusíš to znovu.",
      );
    }
    if (e === "bridge") {
      tone(660, 0.15, 0.15);
      tone(880, 0.2, 0.3);
      message(
        "Květiny se probudily!",
        "Teď přes ně můžeš přeskákat na druhý břeh.",
      );
      persist();
    }
    if (e === "stun")
      message(
        "Cesta je na chvilku volná. Rychle dál!",
        "Ježek, žába i včela se za chvíli zase probudí.",
      );
    if (e === "treat") tone(880, 0.07);
    if (e === "rescue") {
      tone(660, 0.16);
      tone(880, 0.18, 0.12);
      message(
        `Kamarád zachráněn! Už máš ${g.rescued.filter(Boolean).length} ze 3.`,
        "Káčátko se bezpečně vrátí domů.",
      );
      speak("Káčátko je v bezpečí!");
      persist();
    }
    if (e === "key") {
      tone(900, 0.2);
      message(
        "Máš zlatý klíč! Branka se ti otevře.",
        "Pokračuj doprava a hledej další káčátko.",
      );
      persist();
    }
    if (e === "gate") {
      tone(440, 0.2);
      message(
        "Branka je otevřená. Dobrodružství pokračuje!",
        "Za brankou najdeš další praporek.",
      );
      persist();
    }
    if (e === "locked")
      message(
        "Branka je zamčená. Potřebuješ zlatý klíč.",
        "Vrať se vlevo k houbě a vyskoč do koruny stromu.",
      );
    if (e === "secret") {
      tone(660, 0.2);
      tone(990, 0.3, 0.15);
      message(
        "Tajná hvězda! To byl pořádný průzkum.",
        "Na konci výpravy dostaneš zvláštní odznak.",
      );
      persist();
    }
    if (e === "checkpoint") {
      tone(550, 0.18);
      message(
        "Nový praporek! Tady je tvoje bezpečné místo.",
        "Cesta je uložená i pro příště.",
      );
      persist();
    }
    if (e === "respawn") {
      camera = { x: Math.max(0, g.p.x - 300), y: 340 };
      message(
        "Nic se neděje. Zkusíme to od praporku.",
        "Káčátka, klíč i pamlsky ti zůstaly.",
      );
      tone(260, 0.22);
    }
    if (e === "missing")
      message(
        "Ještě někdo čeká v lese. Vrať se pro káčátka.",
        "Hledej na vyvýšených větvích vlevo.",
      );
    if (e === "win") finish();
  }
  if (events.length) updateHud();
}
function finish() {
  mode = "won";
  persist();
  updateLevelUI();
  clearControls();
  $("#win").hidden = false;
  $("#pause").disabled = true;
  const final = g.levelIndex === LEVELS.length - 1;
  $("#win-eyebrow").textContent = final
    ? "DOBRODRUŽSTVÍ SPLNĚNO"
    : `ÚROVEŇ ${g.levelIndex + 1} / 5 SPLNĚNA`;
  $("#win-title").textContent = final
    ? "Hurá na lesní slavnost!"
    : `${g.level.title}: hotovo!`;
  const totalRescued = g.completed.filter(Boolean).length * 3;
  $("#win-description").textContent = final
    ? `Nelinka zachránila ${totalRescued} kamarádů. Les slaví!`
    : "Všechna tři káčátka jsou v bezpečí.";
  $("#next-level").hidden = final;
  $("#again").className = final ? "primary" : "secondary";
  $("#new-adventure").hidden = !final;
  if (!final)
    $("#next-level").textContent = `Další: ${LEVELS[g.levelIndex + 1].title} →`;
  const treats = final
    ? g.completed.reduce((n, r) => n + (r?.treats || 0), 0)
    : g.collected.filter(Boolean).length;
  const totalTreats = final
    ? LEVELS.reduce((n, l) => n + l.treats.length, 0)
    : g.level.treats.length;
  const stars = final
    ? g.completed.filter((r) => r?.secret).length
    : Number(g.secret);
  $("#results").textContent =
    `🐤 ${final ? totalRescued + " / 15" : "3 / 3"}    ✦ ${treats} / ${totalTreats}    ★ ${stars} / ${final ? 5 : 1}`;
  $("#win-note").textContent = g.secret
    ? "A našla jsi i tajnou hvězdu. Skvělá výprava!"
    : "Příště zkus objevit tajnou hvězdu v korunách stromů.";
  [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, i * 0.13));
  speak("Výprava splněna! Všechna káčátka jsou doma.");
  $(final ? "#again" : "#next-level").focus({ preventScroll: true });
  message(
    "Všichni jsou doma. Děkujeme, hrdinko!",
    "Další výprava může vést po jiné cestě.",
    999,
  );
}
function rounded(x, y, w, h, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}
function ellipse(x, y, rx, ry, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}
function line(x1, y1, x2, y2, color, width = 2) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}
function text(str, x, y, size = 15, color = "#385a3e", align = "center") {
  ctx.fillStyle = color;
  ctx.font = `700 ${size}px "Trebuchet MS",sans-serif`;
  ctx.textAlign = align;
  ctx.fillText(str, x, y);
}
function terrain(p) {
  if (p.leaf || p.flower) {
    drawLeafPlatform(ctx, p, g.time, reduced);
    return;
  }
  if (p.stone) {
    ctx.save();
    if (p.sinking) {
      ctx.beginPath();
      ctx.rect(p.x - 20, 0, p.w + 40, 806);
      ctx.clip();
    }
    const bottom = Math.max(832, p.y + 45);
    const rock = ctx.createLinearGradient(0, p.y, 0, bottom);
    rock.addColorStop(0, "#b3c2a4");
    rock.addColorStop(1, "#547c7a");
    ctx.beginPath();
    ctx.moveTo(p.x + 12, p.y);
    ctx.lineTo(p.x + p.w - 15, p.y);
    ctx.lineTo(p.x + p.w, p.y + 16);
    ctx.lineTo(p.x + p.w + 8, bottom);
    ctx.lineTo(p.x - 6, bottom);
    ctx.lineTo(p.x, p.y + 17);
    ctx.closePath();
    ctx.fillStyle = rock;
    ctx.fill();
    ctx.strokeStyle = "#557164";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    line(p.x + 13, p.y + 5, p.x + p.w - 18, p.y + 5, "#deead0", 3);
    line(p.x + p.w * 0.6, p.y + 17, p.x + p.w * 0.5, bottom - 8, "#8da998", 2);
    if (p.sinking) {
      // A pale, cracked top distinguishes sinking stones from fixed rocks.
      line(p.x + 18, p.y + 9, p.x + 29, p.y + 13, "#506a58", 2);
      line(p.x + 29, p.y + 13, p.x + 25, p.y + 23, "#506a58", 2);
      if (p.sinkPose.phase === "warning") {
        rounded(p.x + 15, p.y - 10, p.w - 30, 5, 2, "#4c644e");
        rounded(
          p.x + 15,
          p.y - 10,
          (p.w - 30) * p.sinkPose.remaining,
          5,
          2,
          "#f4d27a",
        );
      }
    }
    ctx.restore();
    if (p.sinking) drawStoneRipples(ctx, p, reduced ? 0 : g.time);
    return;
  }
  if (p.moving) {
    rounded(p.x, p.y, p.w, p.h, 9, "#927047");
    rounded(p.x + 4, p.y + 2, p.w - 8, 7, 4, "#d6b579");
    line(p.x + 12, p.y + 15, p.x + p.w - 13, p.y + 15, "#705638", 2);
    ellipse(p.x + p.w - 10, p.y + 12, 6, 8, "#b79561");
    return;
  }
  const gradient = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
  gradient.addColorStop(0, p.ground ? "#b99a66" : "#a38355");
  gradient.addColorStop(1, p.ground ? "#766b4e" : "#745d3c");
  rounded(p.x, p.y, p.w, p.h, p.ground ? 3 : 9, gradient);
  rounded(p.x - 3, p.y - 5, p.w + 6, 13, 6, "#668543");
  rounded(p.x - 2, p.y - 6, p.w + 4, 5, 3, "#a5ba65");
  if (!p.ground) {
    for (let x = p.x + 20; x < p.x + p.w - 8; x += 42)
      line(x, p.y + 12, x + 20, p.y + 17, "#c7a77a", 2);
  } else
    for (let x = p.x + 24; x < p.x + p.w; x += 69) {
      ellipse(x, p.y + 35 + Math.sin(x) * 17, 4, 2, "#d1b785");
      ellipse(x + 23, p.y + 79 + Math.cos(x) * 24, 5, 3, "#8a7952");
    }
  for (let x = p.x + 12; x < p.x + p.w - 10; x += 37) {
    line(x, p.y - 4, x - 3, p.y - 11, "#88a24d", 2);
    line(x + 3, p.y - 4, x + 7, p.y - 13, "#7f9b47", 2);
  }
  if (p.ground) {
    for (
      let x = p.x + 65;
      x < p.x + p.w - 30;
      x += g.levelIndex === 1 ? 81 : 173
    ) {
      if (x < camera.x - 30 || x > camera.x + VIEW.width + 30) continue;
      const y = p.y - 16 - Math.abs(Math.sin(x)) * 7;
      line(x, p.y - 3, x, y, "#5d7b3f", 1.5);
      for (let i = 0; i < 5; i++)
        ellipse(
          x + Math.cos(i * Math.PI * 0.4) * 3,
          y + Math.sin(i * Math.PI * 0.4) * 3,
          2.8,
          2.8,
          g.level.flowers,
        );
      ellipse(x, y, 1.7, 1.7, "#fff2b9");
    }
  }
}
function hedgehog(e) {
  const asleep = e.asleep > 0;
  if (!asleep) {
    ctx.save();
    const pixelX = canvas.width / VIEW.width;
    const pixelY = canvas.height / VIEW.height;
    ctx.translate(
      camera.x + Math.round((e.x - camera.x) * pixelX) / pixelX,
      camera.y + Math.round((e.y + 1 - camera.y) * pixelY) / pixelY,
    );
    ctx.scale(e.dir, 1);
    drawQuadruped(ctx, images.rig, "hedgehog", enemyWalk.get(e) || 0);
    ctx.restore();
    return;
  }
  drawSprite(images.objects, ATLAS.objects[3], e.x, e.y + 1, 43, e.dir);
  if (asleep) text("z z", e.x, e.y - 51, 13, "#537f88");
}
function flag(f, i) {
  line(f.x, f.y, f.x, f.y - 140, "#937e56", 6);
  ctx.fillStyle = i < g.checkpoint ? "#e2ae44" : "#95b082";
  ctx.beginPath();
  ctx.moveTo(f.x, f.y - 139);
  ctx.lineTo(f.x + 46, f.y - 125);
  ctx.lineTo(f.x, f.y - 109);
  ctx.fill();
  text("✓", f.x + 17, f.y - 120, 15, "#fff8de");
}
function duck(d, i) {
  const bob = reduced ? 0 : Math.sin(g.time * 3 + i) * 3;
  if (g.rescued[i]) {
    ellipse(d.x, d.y + 20, 14, 5, "#49623922");
    text("♥", d.x, d.y - 5, 20, "#dbab5e");
    return;
  }
  ellipse(d.x, d.y + 21, 19, 5, "#40553725");
  drawSprite(images.objects, ATLAS.objects[0], d.x, d.y + 21 + bob, 44);
  rounded(d.x - 14, d.y - 60 + bob, 28, 22, 11, "#fff9e8");
  text("♪", d.x, d.y - 44 + bob, 14, "#c99742");
}
function puppy() {
  const p = g.p;
  const name =
    g.bark > 0
      ? "bark"
      : !p.grounded
        ? p.vy < 0
          ? "jump"
          : "fall"
        : Math.abs(p.vx) > 25
          ? "run"
          : "idle";
  const pixelX = canvas.width / VIEW.width;
  const pixelY = canvas.height / VIEW.height;
  ctx.save();
  ctx.translate(
    camera.x + Math.round((p.x + p.w / 2 - camera.x) * pixelX) / pixelX,
    camera.y + Math.round((p.y + p.h + 2 - camera.y) * pixelY) / pixelY,
  );
  ctx.scale(p.facing, 1);
  if (g.invincible > 0 && Math.floor(g.time * 9) % 2) ctx.globalAlpha = 0.45;
  drawNelinka(ctx, images, name, walkDistance);
  ctx.restore();
  canvas.dataset.walkFrame =
    name === "run" ? String(nelinkaFrame(walkDistance)) : "idle";
  if (g.bark > 0) {
    ctx.strokeStyle = "#fff7c5";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(
      p.x + p.w / 2 + p.facing * 35,
      p.y + 22,
      35 + (1 - g.bark / 0.35) * 55,
      p.facing > 0 ? -0.8 : Math.PI - 0.8,
      p.facing > 0 ? 0.8 : Math.PI + 0.8,
    );
    ctx.stroke();
  }
  canvas.dataset.animation = name;
  canvas.dataset.x = Math.round(p.x);
  canvas.dataset.y = Math.round(p.y);
  canvas.dataset.grounded = String(p.grounded);
}
function draw() {
  const {
    world: WORLD,
    terrain: TERRAIN,
    ducks: DUCKS,
    key: KEY,
    secret: SECRET,
    flags: FLAGS,
    signs: SIGNS,
    treats: TREATS,
    gate: GATE,
    exit: EXIT,
  } = g.level;
  resizeCanvas();
  ctx.setTransform(
    canvas.width / VIEW.width,
    0,
    0,
    canvas.height / VIEW.height,
    0,
    0,
  );
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = "#d7e5cc";
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  if (artImage("forest"))
    ctx.drawImage(
      artImage("forest"),
      -camera.x * 0.14,
      -65 - camera.y * 0.05,
      1600,
      1067,
    );
  ctx.fillStyle = g.level.tint;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.save();
  ctx.translate(-camera.x, -camera.y);
  for (const water of g.level.waters)
    drawWater(ctx, water, reduced ? 0 : g.time, camera.x);
  // Supporting branches make the elevated platforms read as parts of trees.
  for (const p of TERRAIN.filter((p) => !p.ground && !p.stone)) {
    line(
      p.x + p.w * 0.65,
      p.y + 20,
      p.x + p.w * 0.65 + 40,
      960,
      "#776a4760",
      24,
    );
    line(
      p.x + p.w * 0.65,
      p.y + 45,
      p.x + p.w * 0.2,
      p.y + 18,
      "#8d795255",
      15,
    );
  }
  const visiblePlatforms = platforms(g.time, g.level, g);
  visiblePlatforms.forEach(terrain);
  (g.level.bridges || []).forEach((b, i) =>
    drawFlowerBell(ctx, b, g.bridges[i], reduced ? 0 : g.time),
  );
  canvas.dataset.platform = g.p.platform || "air";
  canvas.dataset.bridges = g.bridges.filter(Boolean).length;
  canvas.dataset.barkReady = String(g.barkCooldown === 0);
  canvas.dataset.sinking = visiblePlatforms
    .filter((p) => p.sinkPose && p.sinkPose.phase !== "ready")
    .map((p) => p.sinkPose.phase)
    .join(",");
  SIGNS.forEach((s) => {
    line(s.x, s.y, s.x, s.y - 64, "#8d7750", 5);
    rounded(s.x - 74, s.y - 91, 148, s.sub ? 43 : 29, 6, "#f4e6bc");
    text(s.text, s.x, s.y - 72, 10);
    if (s.sub) text(s.sub, s.x, s.y - 57, 8, "#8a805b");
  });
  FLAGS.forEach(flag);
  // Bouncy mushroom, deliberately a large and readable landing target.
  const springPose = mushroomPose(g.time - g.springAt, reduced);
  g.level.springs.forEach((spring, i) => {
    const pose = mushroomPose(g.time - g.springTimes[i], reduced);
    ctx.save();
    ctx.translate(spring.x + 45, spring.y + 2);
    ctx.scale(pose.x, pose.y);
    drawSprite(images.objects, ATLAS.objects[1], 0, 0, 92);
    ctx.restore();
  });
  canvas.dataset.springPhase = springPose.phase;
  canvas.dataset.springScale = springPose.y.toFixed(3);
  if (!g.gate) {
    for (let x = GATE.x; x < GATE.x + GATE.w; x += 13)
      rounded(x, 445, 8, 335, 4, "#8d8060");
    rounded(GATE.x - 6, 630, GATE.w + 12, 13, 4, "#b3a17a");
    rounded(GATE.x - 6, 728, GATE.w + 12, 13, 4, "#b3a17a");
    rounded(GATE.x + 6, 667, 30, 34, 6, "#e6ba4f");
    text("⚿", GATE.x + 21, 692, 25, "#735b33");
  } else {
    line(GATE.x, 780, GATE.x, 685, "#a1906b", 6);
    text("✓", GATE.x, 672, 20, "#6b9454");
  }
  if (!g.key) {
    const y = KEY.y + (reduced ? 0 : Math.sin(g.time * 3) * 4);
    drawPickupKey(ctx, KEY.x, y);
  }
  if (!g.secret) drawPickupStar(ctx, SECRET.x, SECRET.y, 22, true);
  TREATS.forEach((t, i) => {
    if (!g.collected[i]) {
      const y = t.y + (reduced ? 0 : Math.sin(g.time * 3 + i) * 2);
      drawPickupStar(ctx, t.x, y, 10);
    }
  });
  DUCKS.forEach(duck);
  g.enemies.forEach((e) => {
    if (e.kind === "hedgehog") hedgehog(e);
    else drawForestEnemy(ctx, e, reduced);
  });
  canvas.dataset.enemies = g.enemies
    .map((e) => `${e.kind}:${e.asleep > 0 ? "asleep" : e.phase}`)
    .join(",");
  // Rescue station at the end of the level.
  if (g.level.celebration) {
    line(EXIT.x - 160, 780, EXIT.x - 160, 610, "#866b4f", 5);
    line(EXIT.x + 125, 780, EXIT.x + 125, 610, "#866b4f", 5);
    ctx.beginPath();
    ctx.moveTo(EXIT.x - 160, 610);
    ctx.quadraticCurveTo(EXIT.x, 666, EXIT.x + 125, 610);
    ctx.strokeStyle = "#746443";
    ctx.lineWidth = 2;
    ctx.stroke();
    for (let i = 0; i < 10; i++) {
      const x = EXIT.x - 151 + i * 28;
      const y = 614 + Math.sin((i / 9) * Math.PI) * 25;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 22, y + 2);
      ctx.lineTo(x + 10, y + 25);
      ctx.closePath();
      ctx.fillStyle = ["#e69e69", "#df7f98", "#9bbd79", "#e4c65b"][i % 4];
      ctx.fill();
      ctx.strokeStyle = "#70563f";
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    for (let i = 0; i < 4; i++)
      drawSprite(
        images.objects,
        ATLAS.objects[0],
        EXIT.x - 100 + i * 45,
        780,
        30,
        i < 2 ? 1 : -1,
      );
  }
  rounded(EXIT.x - 44, 674, 105, 106, 8, "#dfc28e");
  ctx.fillStyle = "#8d6c4b";
  ctx.beginPath();
  ctx.moveTo(EXIT.x - 63, 683);
  ctx.lineTo(EXIT.x + 9, 619);
  ctx.lineTo(EXIT.x + 82, 683);
  ctx.closePath();
  ctx.fill();
  rounded(EXIT.x - 5, 714, 35, 66, 15, "#6b8170");
  text("♥", EXIT.x + 13, 706, 23, "#d68265");
  text("DOMŮ", EXIT.x + 9, 607, 15, "#f9f5d9");
  puppy();
  ctx.restore();
}
function frame(t) {
  const elapsed = Math.min((t - last) / 1000, 0.06) || 0;
  last = t;
  if (mode === "playing" && !$("#help-dialog").open) {
    accumulator += elapsed;
    const input = {
      left: keys.has("ArrowLeft") || keys.has("KeyA") || touch.has("left"),
      right: keys.has("ArrowRight") || keys.has("KeyD") || touch.has("right"),
      jump: keys.has("Space") || keys.has("ArrowUp") || touch.has("jump"),
      bark: keys.has("KeyE") || touch.has("bark"),
    };
    while (accumulator >= 1 / 60) {
      const enemyX = g.enemies.map((e) => e.x);
      step(
        g,
        { ...input, jumpPressed: pending.jump, barkPressed: pending.bark },
        1 / 60,
      );
      pending.jump = false;
      pending.bark = false;
      accumulator -= 1 / 60;
      processEvents();
      g.enemies.forEach((e, i) => {
        enemyWalk.set(e, (enemyWalk.get(e) || 0) + Math.abs(e.x - enemyX[i]));
      });
      if (g.p.grounded) walkDistance += Math.abs(g.p.vx) / 60;
    }
    const tx = Math.max(
        0,
        Math.min(g.level.world.width - VIEW.width, g.p.x - VIEW.width * 0.38),
      ),
      ty = Math.max(
        0,
        Math.min(g.level.world.height - VIEW.height, g.p.y - 320),
      );
    camera.x += (tx - camera.x) * (reduced ? 1 : Math.min(1, elapsed * 7));
    camera.y += (ty - camera.y) * (reduced ? 1 : Math.min(1, elapsed * 5));
    if (g.time > noticeUntil) defaultMessage();
    updateHud();
  }
  if (ready) draw();
  requestAnimationFrame(frame);
}
const codes = [
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "Space",
  "KeyA",
  "KeyD",
  "KeyE",
];
window.addEventListener("keydown", (e) => {
  if (e.code === "Escape" && !$("#help-dialog").open) {
    if (mode === "playing") pause();
    else if (mode === "paused") resume();
    return;
  }
  if (mode === "playing" && !$("#help-dialog").open && codes.includes(e.code)) {
    e.preventDefault();
    unlock();
    keys.add(e.code);
    if (!e.repeat && (e.code === "Space" || e.code === "ArrowUp"))
      pending.jump = true;
    if (!e.repeat && e.code === "KeyE") pending.bark = true;
  }
});
window.addEventListener("keyup", (e) => keys.delete(e.code));
window.addEventListener("blur", () => {
  clearControls();
  if (mode === "playing") pause();
});
window.addEventListener("pagehide", () => {
  if (mode === "playing" || mode === "paused") persist();
});
canvas.addEventListener("pointerdown", () =>
  canvas.focus({ preventScroll: true }),
);
for (const button of document.querySelectorAll("[data-control]")) {
  button.addEventListener("pointerdown", (e) => {
    if (mode !== "playing") return;
    e.preventDefault();
    unlock();
    button.setPointerCapture(e.pointerId);
    touch.add(button.dataset.control);
    if (button.dataset.control in pending)
      pending[button.dataset.control] = true;
  });
  for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
    button.addEventListener(name, () => touch.delete(button.dataset.control));
}
$("#start").addEventListener("click", () => begin());
$("#resume").addEventListener("click", () => begin(true));
$("#again").addEventListener("click", () => {
  g = replayLevel(g);
  enterLevel();
});
$("#next-level").addEventListener("click", () => {
  const next = nextLevel(g);
  if (next) {
    g = next;
    enterLevel();
  }
});
$("#new-adventure").addEventListener("click", () => begin());
$("#pause").addEventListener("click", () =>
  mode === "playing" ? pause() : resume(),
);
$("#continue").addEventListener("click", resume);
$("#checkpoint").addEventListener("click", () => {
  g = createGame(saveGame(g));
  camera = { x: Math.max(0, g.p.x - 300), y: 340 };
  resume();
});
$("#sound").addEventListener("click", () => {
  muted = !muted;
  barkSound.setMuted(muted);
  $("#sound").setAttribute("aria-pressed", String(!muted));
  $("#sound").setAttribute(
    "aria-label",
    muted ? "Zapnout zvuk" : "Vypnout zvuk",
  );
  if (muted && "speechSynthesis" in window) speechSynthesis.cancel();
  if (!muted) unlock();
});
$("#help").addEventListener("click", () => {
  helpWasPlaying = mode === "playing";
  clearControls();
  $("#help-dialog").showModal();
});
$("#close-help").addEventListener("click", () => $("#help-dialog").close());
$("#help-ok").addEventListener("click", () => $("#help-dialog").close());
$("#help-dialog").addEventListener("close", () => {
  clearControls();
  accumulator = 0;
  if (helpWasPlaying) canvas.focus({ preventScroll: true });
});
loadAssets();
requestAnimationFrame(frame);
