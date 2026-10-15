# Assets

- `nelinka-actions.png` and `nelinka-walk.png` were copied without modification
  from `FilipKuncCom/games/nelinka/public/assets` at website commit
  `4f50ce135bb2123d7bd65d24a76ebad19e0b72e6`. They depict the owner's custom Neli
  character. Original creation notes are in `PROVENANCE.txt`.
- `NotoSans-Regular.ttf` is Noto Sans by the Noto Project Authors, distributed
  under the SIL Open Font License in `NotoSans-LICENSE.txt`.
- `meadow-background.png`, `meadow-terrain.png`, `meadow-plants.png`, and
  `nelinka-walk-v2.png` were generated for this project using the built-in imagegen
  tool on 2026-10-13. The revised walk uses the original Nelinka sheet as its
  character-design reference. `MEADOW-PROVENANCE.txt` retains the prompts and
  visual direction. Original character files remain unmodified.
- `nelinka-walk-v3.png` revises the hind-leg stride using `nelinka-walk-v2.png`
  as the edit target. Generated with the built-in imagegen tool on 2026-10-13;
  original RGBA preserved. `WALK-V3-PROVENANCE.txt` retains the complete prompt.
- `meadow-atlas.json` records source pixel regions for the painted assets.
  The scenery code places these textures on authored surfaces; it adds no
  collision geometry.

No IronJump source or original commercial game assets were copied.

- `storybook-objects.png` is copied unchanged from
  `FilipKuncCom/games/nelinka/public/assets` at commit
  `4f50ce135bb2123d7bd65d24a76ebad19e0b72e6`. It contains the original duckling,
  mushroom and awake/sleeping hedgehog artwork. `OBJECTS-PROVENANCE.txt` preserves
  the source creation notes and prompts; no new license is assigned.

- `meadow-objects-v2.png` was generated with the built-in imagegen tool on
  2026-10-15 to bring frogs, bees, ducklings, mushrooms, platforms and props into
  the painted meadow style. `MEADOW-OBJECTS-V2-PROVENANCE.txt` retains the complete
  prompt and reference files. The PNG and alpha are unchanged;
  `meadow-objects-v2.json` contains runtime crop bounds. The original hedgehog
  source remains in `storybook-objects.png`; the painted walk sheet below is now
  used for rendering.

- `meadow-treat.png` and `meadow-home.png` were generated with the built-in
  imagegen tool on 2026-10-15, using `meadow-objects-v2.png` as a style reference.
  They replace the plain treat circles and finish flag with a painted biscuit
  and doghouse. `MEADOW-FINISH-PROVENANCE.txt` retains prompts and source outputs;
  `meadow-finish.json` records runtime source bounds. PNG pixels and alpha are
  preserved without modification.

- `meadow-hedgehog-walk.png` and `meadow-duckling-walk.png` were generated with the
  built-in imagegen tool on 2026-10-15. They contain six walking poses and two
  sleeping/resting poses per animal. `meadow-objects-v2.png` supplied the painted
  style and duckling identity; `storybook-objects.png` supplied the hedgehog
  identity. Original RGBA output is preserved. `meadow-creature-walks.json`
  registers fixed-size source windows to foot contact without resampling the
  images. Complete prompts and source outputs are retained in
  `MEADOW-CREATURE-WALKS-PROVENANCE.txt`.

- `nelinka-bark.wav` retains the original website stock bark recording and CC0 attribution in `AUDIO.txt`.
