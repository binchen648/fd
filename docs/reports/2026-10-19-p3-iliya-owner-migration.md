# P3 Iliya owner migration

Date: 2026-10-19
Base: `2adc423fe17a3ad0310cf18ca9152b0850b4163a`
Scope: `master.iliya.skill.ascension`, `.s1`, `.s2`, `.s3`, `.s4`

## Result

The canonical archive and playtest pack now contain exactly the five frozen Iliya skill identities. Source locators preserve the development image, legacy archive paths, and generated text hashes from the Phase 3 inventory.

`master.iliya.skill.s1` is executable through the identity-free game-start fixed controller set-mana contract (`set_mana(controller, 6)`). The other four skills remain `host_adjudicated`: the current host has no authoritative deck purge, Heaven's Cup all-player victory, round-start activation target, per-attack face-down history/cost modifier, or prior-round eliminated-player battlefield tracking. Their effects are audit-only `record_master_directive` markers and are not presented as complete.

## Validation

- Focused Iliya + fixed set-mana tests: **11 passed**.
- `npm run typecheck`: **PASS**.
- `npm run content:validate`: **PASS** — 31 masters, 19 servants, 20 events, 0 blocking issues.
- `npm run content:compile`: **PASS**.
- `npm run verify:generated-content`: **PASS**.
  - content library: `53e2275bc25dc7fb04f86720de760f0b2084cce2fc5b1e65815947ee3f0b5d34`
  - fixture: `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`
  - evidence report: `d479be2d5e3a0d664398742e53b2e2f708144fb75883583f753b3a795d80738d`
- `git diff --check`: **PASS**.

## Existing baseline failures

The full `npm test -- --run` suite remains red at the baseline governance/product boundary: **28 files failed, 46 tests failed, 241 files passed, 1,978 tests passed**. The failures are primarily pre-existing tests that assert the seven-master/seven-servant product subset, fixed Phase 3 archive overlap counts, unavailable CHM extraction paths, and unrelated runtime regressions. The full-suite failure was recorded rather than hidden; the focused migration and required content gates pass.

No V2 source, frozen Hakuno-F/Hakuno-M/Hinako/Hisui semantics, push, PR, merge, or reviewer credit action was performed.
