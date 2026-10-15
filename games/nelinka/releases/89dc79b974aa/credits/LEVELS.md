# Five forest adventures

`paseka`, `haj`, `reka`, `houby`, and `slavnost` recreate the five routes from
`FilipKuncCom/games/nelinka/public/levels.mjs` at website commit
`4f50ce135bb2123d7bd65d24a76ebad19e0b72e6`. The Czech names, route order,
three ducklings per chapter, keys, secrets, checkpoints, and obstacle sequences
are retained. These are standalone version-4 Nelinka documents; no sibling
checkout is used at build or run time.

Horizontal spacing is 80% and vertical spacing 65% of the original, adapted to
the Rust puppy's collision size and jump arc. Mushroom caps stand above the
ground, flower bridges use the current three-petal implementation, and the
river and finale include cosmetic waterfalls. Shore ground extends outside
the route to fill wide viewports. Logs and lifts use the Rust simulation's
periodic motion. Signs use words in place of unsupported arrow glyphs.

`tests/campaign.rs` completes every route using real movement, jumps, barks,
platform rides and flower bridges, without teleporting or respawning. Each run
rescues all three ducklings, collects the key and secret, and reaches home.
Stable object IDs also identify saved checkpoint and collection progress.

`campaign.json` contains presentation metadata; it does not change the document
schema. Browser campaign progress uses `nelinka-campaign-v1`, separate from the
workshop and the previous website game's storage. The previous site's progress
remains available in its classic game; its save format is not silently converted.
