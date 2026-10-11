const $ = (selector) => document.querySelector(selector);
const world = $("#world");
const dog = $("#puppy");
const duckEls = [...document.querySelectorAll(".duck")];
const pond = $("#pond");
const help = $("#help-dialog");
const keys = new Set();
const HOME = { x: 80, y: 55 };
const layouts = [
  [
    { x: 23, y: 38 },
    { x: 49, y: 30 },
    { x: 53, y: 74 },
  ],
  [
    { x: 28, y: 64 },
    { x: 43, y: 32 },
    { x: 64, y: 72 },
  ],
  [
    { x: 22, y: 35 },
    { x: 43, y: 69 },
    { x: 61, y: 30 },
  ],
];
let state = "intro",
  puppy,
  ducks,
  target,
  last = 0,
  idle = 0,
  round = 0,
  muted = false;
let audio,
  steps = [],
  moving = false,
  speechAvailable = false;
let stickerCount = 0;
try {
  stickerCount = Math.max(
    0,
    Number(localStorage.getItem("tlapkovy-stickers")) || 0,
  );
} catch {
  /* Play also works without storage. */
}
$("#stickers").textContent = stickerCount;
function stickerLabel() {
  $(".collection-label").textContent =
    stickerCount === 1
      ? "samolepka"
      : stickerCount >= 2 && stickerCount <= 4
        ? "samolepky"
        : "samolepek";
}
stickerLabel();

function voices() {
  speechAvailable =
    "speechSynthesis" in window &&
    speechSynthesis
      .getVoices()
      .some((v) => v.lang.toLowerCase().startsWith("cs"));
  $("#voice-note").textContent = speechAvailable
    ? "Bertík umí česky. Tlačítkem ♫ zapneš nebo vypneš zvuk."
    : "Český hlas tu není dostupný. Obrázky a krátké pokyny tě provedou celou hrou.";
}
voices();
if ("speechSynthesis" in window)
  speechSynthesis.addEventListener("voiceschanged", voices);
function say(text) {
  if (muted || !speechAvailable) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = speechSynthesis
    .getVoices()
    .find((v) => v.lang.toLowerCase().startsWith("cs"));
  utterance.lang = "cs-CZ";
  utterance.rate = 0.88;
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}
function unlockAudio() {
  if (muted) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume().catch(() => {});
  } catch {
    /* Audio is optional. */
  }
}
function chime(win = false) {
  if (muted || !audio) return;
  const notes = win ? [523, 659, 784, 1047] : [659, 880];
  notes.forEach((frequency, i) => {
    const oscillator = audio.createOscillator(),
      gain = audio.createGain(),
      t = audio.currentTime + i * 0.13;
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.055, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(t);
    oscillator.stop(t + 0.36);
  });
}
function position(el, p) {
  el.style.left = `${p.x}%`;
  el.style.top = `${p.y}%`;
  if (el.classList.contains("sprite"))
    el.style.zIndex = String(Math.round(p.y));
}
function message(main, sub) {
  $("#instruction").textContent = main;
  $("#subinstruction").textContent = sub;
}
function reset() {
  puppy = { x: 17, y: 76 };
  ducks = layouts[round % layouts.length].map((p) => ({ ...p, found: false }));
  target = null;
  steps = [];
  keys.clear();
  idle = 0;
  moving = false;
  $("#marker").hidden = true;
  pond.classList.remove("ready");
  duckEls.forEach((el, i) => {
    el.classList.remove("found", "hint");
    el.disabled = false;
    el.removeAttribute("aria-hidden");
    position(el, ducks[i]);
    el.querySelector("img").style.transform = "";
  });
  dog.querySelector("img").style.transform = "";
  position(dog, puppy);
  updateProgress();
}
function updateProgress() {
  const count = ducks.filter((d) => d.found).length;
  $("#progress").setAttribute("aria-label", `Nalezená káčátka: ${count} ze 3`);
  [...$("#progress").children].forEach((el, i) => {
    el.classList.toggle("complete", i < count);
    el.textContent = i < count ? "✓" : i + 1;
  });
}
function start() {
  reset();
  state = "playing";
  $("#intro").hidden = true;
  $("#win").hidden = true;
  world.inert = false;
  message(
    "Klikni na káčátko. Bertík mu pomůže!",
    "Nebo k němu dojdi pomocí šipek.",
  );
  unlockAudio();
  say("Ahoj! Najdeme tři káčátka. Klikni na káčátko a já k němu dojdu.");
  world.focus({ preventScroll: true });
}
function choose(x, y) {
  if (state !== "playing" || help.open) return;
  target = {
    x: Math.max(9, Math.min(91, x)),
    y: Math.max(24, Math.min(85, y)),
  };
  position($("#marker"), target);
  $("#marker").hidden = false;
  idle = 0;
  duckEls.forEach((el) => el.classList.remove("hint"));
}
function collect(i) {
  const duck = ducks[i];
  if (duck.found) return;
  duck.found = true;
  duckEls[i].classList.add("found");
  duckEls[i].classList.remove("hint");
  duckEls[i].disabled = true;
  duckEls[i].setAttribute("aria-hidden", "true");
  updateProgress();
  chime();
  idle = 0;
  const count = ducks.filter((d) => d.found).length;
  if (count === 3) {
    pond.classList.add("ready");
    message("Všechna tři! Teď hurá k rybníku.", "Klikni na srdíčko u vody.");
    say("Výborně! Máme všechna tři káčátka. Teď je dovedeme k rybníku.");
  } else {
    message(
      count === 1
        ? "První kamarád jde za tebou!"
        : "Už jsou dvě! Ještě jedno káčátko.",
      "Klikni na další káčátko.",
    );
    say(
      count === 1
        ? "První káčátko jde za námi! Najdeme další."
        : "Už jsou dvě! Najdeme ještě jedno.",
    );
  }
}
function win() {
  state = "won";
  target = null;
  keys.clear();
  $("#marker").hidden = true;
  world.inert = true;
  ducks.forEach((d, i) => {
    d.x = 78 + i * 6;
    d.y = 48 + (i % 2) * 8;
    position(duckEls[i], d);
  });
  stickerCount++;
  try {
    localStorage.setItem("tlapkovy-stickers", String(stickerCount));
  } catch {}
  $("#stickers").textContent = stickerCount;
  stickerLabel();
  $("#win").hidden = false;
  message("Děkujeme! Káčátka jsou doma.", "Za pomoc získáváš samolepku.");
  chime(true);
  say("Hurá! Káčátka jsou doma. Děkujeme za pomoc!");
  $("#again").focus({ preventScroll: true });
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    for (let i = 0; i < 22; i++) {
      const el = document.createElement("span");
      el.className = "confetti";
      el.textContent = ["★", "●", "♥"][i % 3];
      el.style.left = `${Math.random() * 100}%`;
      el.style.color = ["#f0bd50", "#78a982", "#e3997d"][i % 3];
      el.style.animationDelay = `${Math.random() * 0.7}s`;
      $("#board").append(el);
      setTimeout(() => el.remove(), 4500);
    }
  }
}
function distance(a, b) {
  return Math.hypot(a.x - b.x, (a.y - b.y) * 0.67);
}
function advance(t) {
  const dt = Math.min((t - last) / 1000, 0.04) || 0;
  last = t;
  if (state === "playing" && !help.open && !document.hidden) {
    let dx = 0,
      dy = 0;
    const before = { ...puppy };
    if (keys.size) {
      dx = (keys.has("ArrowRight") ? 1 : 0) - (keys.has("ArrowLeft") ? 1 : 0);
      dy = (keys.has("ArrowDown") ? 1 : 0) - (keys.has("ArrowUp") ? 1 : 0);
      target = null;
      $("#marker").hidden = true;
    } else if (target) {
      dx = target.x - puppy.x;
      dy = (target.y - puppy.y) * 0.67;
      if (Math.hypot(dx, dy) < 0.7) {
        target = null;
        dx = dy = 0;
        $("#marker").hidden = true;
      }
    }
    const length = Math.hypot(dx, dy);
    if (length) {
      const step = Math.min(22 * dt, keys.size ? Infinity : length);
      puppy.x = Math.max(9, Math.min(91, puppy.x + (dx / length) * step));
      puppy.y = Math.max(
        24,
        Math.min(85, puppy.y + ((dy / length) * step) / 0.67),
      );
    }
    moving = distance(before, puppy) > 0.01;
    if (moving) {
      steps.unshift({ ...puppy });
      if (steps.length > 300) steps.pop();
      idle = 0;
    } else idle += dt;
    const flip = dx < 0 ? -1 : dx > 0 ? 1 : null;
    if (flip) dog.dataset.facing = flip;
    const bounce =
      moving && !matchMedia("(prefers-reduced-motion: reduce)").matches
        ? Math.abs(Math.sin(t / 90)) * 4
        : 0;
    dog.querySelector("img").style.transform =
      `scaleX(${dog.dataset.facing || 1}) translateY(${-bounce}px)`;
    position(dog, puppy);
    ducks.forEach((d, i) => {
      if (!d.found && distance(puppy, d) < 6) collect(i);
    });
    let followIndex = 0;
    ducks.forEach((d, i) => {
      if (!d.found) return;
      followIndex++;
      // Follow the walked path at spatial intervals, independent of frame rate.
      let trailDistance = 0,
        previous = puppy,
        dest = steps.at(-1) || puppy;
      for (const p of steps) {
        trailDistance += distance(previous, p);
        previous = p;
        if (trailDistance >= followIndex * 6) {
          dest = p;
          break;
        }
      }
      const vx = dest.x - d.x,
        vy = dest.y - d.y,
        dist = distance(dest, d),
        fraction = dist > 0.2 ? Math.min(1, (26 * dt) / dist) : 0;
      d.x += vx * fraction;
      d.y += vy * fraction;
      position(duckEls[i], d);
      if (Math.abs(vx) > 0.1)
        duckEls[i].querySelector("img").style.transform =
          `scaleX(${vx < 0 ? -1 : 1})`;
    });
    if (ducks.every((d) => d.found) && distance(puppy, HOME) < 7) win();
    if (idle > 7) {
      const i = ducks.findIndex((d) => !d.found);
      if (i >= 0) duckEls[i].classList.add("hint");
      else pond.classList.add("ready");
    }
  }
  requestAnimationFrame(advance);
}
world.addEventListener("pointerdown", (e) => {
  if (e.target.closest("button")) return;
  const rect = world.getBoundingClientRect();
  choose(
    ((e.clientX - rect.left) / rect.width) * 100,
    ((e.clientY - rect.top) / rect.height) * 100,
  );
  world.focus({ preventScroll: true });
});
duckEls.forEach((el, i) =>
  el.addEventListener("click", () => {
    choose(ducks[i].x, ducks[i].y);
    world.focus({ preventScroll: true });
  }),
);
pond.addEventListener("click", () => {
  choose(HOME.x, HOME.y);
  if (!ducks.every((d) => d.found)) {
    message("Ještě najdeme ostatní káčátka.", "Klikni na káčátko na louce.");
    say("Nejdřív najdeme všechna tři káčátka.");
  }
  world.focus({ preventScroll: true });
});
document.addEventListener("keydown", (e) => {
  if (
    state !== "playing" ||
    help.open ||
    !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
  )
    return;
  e.preventDefault();
  keys.add(e.key);
  idle = 0;
});
document.addEventListener("keyup", (e) => keys.delete(e.key));
window.addEventListener("blur", () => keys.clear());
document.addEventListener("visibilitychange", () => {
  keys.clear();
  if (document.hidden && "speechSynthesis" in window) speechSynthesis.cancel();
});
$("#start").addEventListener("click", start);
$("#again").addEventListener("click", () => {
  round++;
  start();
});
$("#sound").addEventListener("click", () => {
  muted = !muted;
  $("#sound").setAttribute("aria-pressed", String(!muted));
  $("#sound").setAttribute(
    "aria-label",
    muted ? "Zapnout zvuk" : "Vypnout zvuk",
  );
  if (muted && "speechSynthesis" in window) speechSynthesis.cancel();
  if (muted && audio) audio.suspend().catch(() => {});
  if (!muted) {
    unlockAudio();
    say("Zvuk je zapnutý.");
  }
});
$("#help").addEventListener("click", () => {
  keys.clear();
  help.showModal();
  say(
    "Klikni na káčátko, nebo k němu dojdi pomocí šipek. Až najdeme všechna tři, půjdeme k rybníku.",
  );
});
$("#close-help").addEventListener("click", () => help.close());
$("#help-ok").addEventListener("click", () => help.close());
help.addEventListener("close", () => {
  keys.clear();
  if (state === "playing") world.focus({ preventScroll: true });
});
reset();
world.inert = true;
requestAnimationFrame(advance);
