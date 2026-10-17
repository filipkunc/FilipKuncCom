# Five forest adventures

The campaign now starts with the authored `uvod.json` and `voda.json`, unchanged,
then continues through three new version-5 documents inspired by their slopes,
layered branches, sheltered paths and water crossings.

| Chapter | Route | Difficulty and landmarks |
| --- | --- | --- |
| První tlapky | `uvod` | Introduction: grassy overhang, low secret path, logs and a tree climb. Two ducklings; no key. |
| Za vodou | `voda` | Branch key, flower crossing, water platforms and an elevated alternate route. |
| Šeptající koruny | `koruny` | Moderate: rolling woodland, a branch staircase, a sheltered secret, a river island and a mushroom climb. |
| Mlžná rokle | `rokle` | Hard: flower bridge, terraced rest island, timed stones, a leaf lift and a broken ridge above a waterfall. |
| Návrat za světluškami | `navrat` | Hardest and longest: layered key route, two distinct crossings, a mushroom ascent and separated upper ridges. |

Each new chapter has three ducklings, a key, an optional secret, treat trails and
checkpoints before demanding sections. The new levels deliberately mix solid
sloped terrain with one-way branches and resting places. Their difficulty comes
from route choice, elevation and combining mechanics, rather than faster enemies.
`tests/new_campaign.rs` completes all three using real walking, jumping,
drop-through and barking inputs with no teleporting or respawns. These runs
collect every duckling, the key and secret, and verify the authored snapshot
is unchanged. `tests/campaign.rs` validates all five campaign documents and
round-trips their checkpoint and collection progress.

`campaign.json` controls presentation and order; document semantics are unchanged.
Campaign progress is version 2 because chapter indices and object IDs now refer
to different routes. A valid version-1 save migrates to fresh version-2 progress;
its completion badges and pickups cannot apply to the replacement chapters.
Browser storage uses `nelinka-campaign-v2`, native storage uses
`campaign-progress-v2.json`, and both retain the original version-1 save.
Workshop storage is separate.

## Retained original routes

`paseka`, `haj`, `reka`, `houby`, and `slavnost` remain available as standalone
levels. They recreate the routes from `FilipKuncCom/games/nelinka/public/levels.mjs`
at website commit `4f50ce135bb2123d7bd65d24a76ebad19e0b72e6` without any sibling
checkout dependency. Their original movement playthrough regression remains
in `tests/campaign.rs`. The original puppy art and its provenance are unchanged.
