# P3 F1 Source Evidence — Drake / Edison / Elizabeth / EMIYA / Enkidu / Ereshkigal / Frank R1

- Role: S source-evidence / semantic-normalization candidate
- Base accepted R: `50fa887e34466d0d4f78c1e8f3bce004049de5e4`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: 16 identities (Drake 1, Edison 1, Elizabeth 3, EMIYA 2, Enkidu 3, Ereshkigal 3, Frank 3)
- Source replay: 16/16 exact printed-text bindings

## Classification

- READY_GENERIC_EXTENSION: 4
  - `servant.drake.skill.sc-drake-1`
  - `servant.emiya.skill.sc-emiya-1`
  - `servant.enkidu.skill.sc-enkidu-3`
  - `servant.ereshkigal.skill.sc-ereshkigal-1`
- SPECIAL_HANDLER_CANDIDATE: 12
- Existing semantic families reused where possible, including Rider riding, Lancer battle-continuation movement, bound-opponent, terrain multiplier, and defeat-prevention scheduling.

## Recomputed state

- sourceGroundedCount: 673/944
- semanticBlockedCount: 271
- READY_EXISTING_CONTRACT: 2
- READY_GENERIC_EXTENSION: 235
- SPECIAL_HANDLER_CANDIDATE: 436
- SOURCE_EVIDENCE_REQUIRED: 271
- zeroSilentFallback: true
- automation audit: `EXACT_AGREEMENT`
- gapCount: 0

## Verification

- `npm.cmd run typecheck`: PASS
- Phase 3 focused suite: 6 files / 142 tests PASS
- full CI (`--maxWorkers=2`): 84 files / 587 tests PASS
- `git diff --check`: PASS
- production runtime diff vs accepted base (`packages`, `src`): none

No runtime migration or Reference-handler inference was performed in S.
