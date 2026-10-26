# Six forest adventures

The campaign follows the authored documents in this order:

| Chapter | Document | Rescue objective |
| --- | --- | --- |
| První tlapky | `uvod.json` | Two ducklings |
| Za vodou | `voda.json` | Three ducklings |
| Skoky | `skoky.json` | One duckling |
| Začátek | `zacatek.json` | Three ducklings; return home to the left |
| Poslední výprava | `posledni.json` | Three ducklings |
| Pod zemí | `burrow.json` | Three ducklings; find the key and cross the underground pool |

`campaign.json` controls presentation and order. All six documents are validated
by the headless campaign tests. The authored geometry and stable object IDs are
retained; the burrow expands the former workshop example.

Campaign progress is version 4. Valid version-3 saves preserve all five existing
chapters and start the burrow fresh. Valid version-2 saves preserve progress for
`uvod` and `voda`, while the three replacement chapters start fresh. Version-1
saves validate against their original documents and migrate to fresh progress.
Browser storage uses `nelinka-campaign-v4`; native storage uses
`campaign-progress-v4.json`. Loading falls back to earlier saves, which remain
intact. Workshop storage is separate.

## Archived routes

The nine retired documents are retained unchanged in `old_levels/`.
The five original routes (`paseka`, `haj`, `reka`, `houby`, `slavnost`)
and the former `koruny`, `rokle`, `navrat` routes retain their real-input
playthrough regressions. These archived playthroughs do not establish
completion of the three new authored routes.

The original five routes were recreated from
`FilipKuncCom/games/nelinka/public/levels.mjs` at website commit
`4f50ce135bb2123d7bd65d24a76ebad19e0b72e6`, without a sibling checkout
dependency. The original puppy art and provenance remain unchanged.

## Burrow adventure / Pod zemí

Open **Level → Burrow adventure** in the workshop, or open `burrow.json` from
this folder, or select **Pod zemí** in the campaign. Descend beneath the meadow,
calm the frog with E, and climb the two tiers of rock shelves for the key and an
optional secret. Cross the waterfall pool using the shelves or moving log, rescue
the second duckling above the far bank, and unlock the gate. A third duckling
waits on a ledge along the climb home. Checkpoints before the cave challenges
and beside the gate keep retries short. Czech signs and treats guide the route.

Rock is solid by default; use its three terrain handles for sloping floors,
walls and ceilings. **Cave backdrop** is a resizable, non-colliding rear wall
that starts behind other items. Place it beneath a roof to hide the outdoor
scenery. Real tunnels need separate floors and solid roofs with an open space
between them; a backdrop does not cut holes in terrain. Use **Top only** only
for shelves that should allow jumping or dropping through.

The burrow now includes uneven hanging rock formations and three warm mine
lanterns. **Mine lamp** places a decorative hanging light at its ceiling anchor;
move or duplicate it to light another chamber. Cave walls have irregular mineral
layers, with no additional collision from their cosmetic relief.
