# Nelinka — Tlapkový klub

This is the single source folder for the Czech browser game. It lives inside
FilipKuncCom so the website and its Docker build can ship it together.

- `public/`: game code, HTML, CSS, images and audio. `index.html` is the
  platformer; `calm.html` preserves the earlier click-to-rescue game.
- `test/`: deterministic physics, five playable routes, saves and object mechanics.
- `e2e/`: Playwright browser, rendering, keyboard, touch and audio checks.
- `docs/`: artwork prompts, provenance and audio licensing.
- `.openai/`: preserved metadata from the original hosting placeholder; the
  current local workflow uses the website server.

`../../public/nelinka` is a relative symlink to this folder's `public/`.
It contains no duplicate source. The Docker build includes `games/` before
building the website; only the game’s public files are shipped.

From the FilipKuncCom repository root:

```sh
npm run dev
npm run test:nelinka
npm run test:nelinka:e2e
npm run build
```

Play at http://localhost:4321/nelinka. Changes here appear immediately.
The build places the playable files in `dist/nelinka/` as generated output.
No separate game server, install or backend is needed.

## Levels and objects

1. Slunečná paseka: learn jumping, barking, mushrooms and moving logs.
2. Květinový háj: bark near the big musical flower to unfold a petal bridge.
3. Říční ostrůvky: logs followed by stones that sink underfoot.
4. Houbové stráně: ride large leaves up to the branches, with a mushroom at the key.
5. Lesní slavnost: combine sinking stones, a leaf lift and a flower bridge.

Sinking stones warn for 0.9 seconds, descend over 1.8 seconds, wait underwater,
then rise again. Falling resets them immediately at the checkpoint. Flower
bridges stay open and are included in saved progress. Leaves follow a gentle
6.5-second cycle and carry their rider in both directions.

Levels are authored in `public/levels.mjs`; physics and state live in
`public/engine.mjs`; object drawing lives in `public/objects.mjs`.
`public/sound.mjs` preloads a local bark recording and respects the sound toggle.
The recording’s source and CC0 license are documented in `docs/AUDIO.txt`.

Enemy counts increase across the five levels: 4, 6, 7, 8 and 10. Hedgehogs
patrol the ground and selected branches. Frogs crouch for 0.3 seconds before
each hop; bees fly horizontally with a gentle vertical bob. Barking calms
hedgehogs for 3–4 seconds, frogs for 2.2 seconds and bees for 1.6 seconds.
Contact returns Nelinka to her checkpoint while preserving collected items.
Enemy state, collision bounds and the original canvas frog/bee artwork live
in `public/enemies.mjs`. Patrols are authored in `public/levels.mjs`.

Existing version-2 first-level saves are migrated automatically. Version-3
saves without flower-bridge data continue to load with the bridges closed.
