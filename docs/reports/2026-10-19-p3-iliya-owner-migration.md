# P3 Iliya owner migration

Date: 2026-10-19
Base: `2adc423fe17a3ad0310cf18ca9152b0850b4163a`
Scope: `master.iliya.skill.ascension`, `.s1`, `.s2`, `.s3`, `.s4`

## Result

The canonical archive and playtest pack now contain exactly the five frozen Iliya skill identities. Source locators preserve the development image, legacy archive paths, and generated text hashes from the Phase 3 inventory.

`master.iliya.skill.s1` is executable through the identity-free game-start fixed controller set-mana contract (`set_mana(controller, 6)`). The playtest compiler now recognizes that exact verified semantic shape, so the generated S1 card and evidence row are `FULL` with `game_start_fixed_controller_mana`, while executable rules remain `mode: automatic`. The other four skills remain `host_adjudicated`: the current host has no authoritative deck purge, Heaven's Cup all-player victory, round-start activation target, per-attack face-down history/cost modifier, or prior-round eliminated-player battlefield tracking. Their effects are audit-only `record_master_directive` markers and are not presented as complete.

## Validation

- Focused Iliya + fixed set-mana tests: **12 passed**.
- `npm run typecheck`: **PASS**.
- `npm run content:validate`: **PASS** — 31 masters, 19 servants, 20 events, 0 blocking issues.
- `npm run content:compile`: **PASS**.
- `npm run verify:generated-content`: **PASS**.
  - content library: `ac7f3e799f52a24d30a24e7e1a1c4acf4e7a49e0c9137b36746b40b603cfd8b9`
  - fixture: `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`
  - evidence report: `e1f449041573a1c558ef7843de5257aba009f732076fedcdab0a72135a5fc955`
- `git diff --check`: **PASS**.

## Existing baseline failures

The full `npm test -- --run` suite remains red at the baseline governance/product boundary: **28 files failed, 46 tests failed, 241 files passed, 1,978 tests passed**. The failures are primarily pre-existing tests that assert the seven-master/seven-servant product subset, fixed Phase 3 archive overlap counts, unavailable CHM extraction paths, and unrelated runtime regressions. The full-suite failure was recorded rather than hidden; the focused migration and required content gates pass.

No V2 source, frozen Hakuno-F/Hakuno-M/Hinako/Hisui semantics, push, PR, merge, or reviewer credit action was performed.
