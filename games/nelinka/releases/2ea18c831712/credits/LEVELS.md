# Five forest adventures

The campaign follows the authored documents in this order:

| Chapter | Document | Rescue objective |
| --- | --- | --- |
| První tlapky | `uvod.json` | Two ducklings |
| Za vodou | `voda.json` | Three ducklings |
| Skoky | `skoky.json` | One duckling |
| Začátek | `zacatek.json` | Three ducklings; return home to the left |
| Poslední výprava | `posledni.json` | Three ducklings |

`campaign.json` controls presentation and order. All five documents are validated
by the headless campaign tests. The authored geometry and stable object IDs are
retained unchanged.

Campaign progress is version 3. Valid version-2 saves preserve progress for
`uvod` and `voda`, while the three replacement chapters start fresh. Version-1
saves validate against their original documents and migrate to fresh progress.
Browser storage uses `nelinka-campaign-v3`; native storage uses
`campaign-progress-v3.json`. Loading falls back to earlier saves, which remain
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
