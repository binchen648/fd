# P3 F1 Source Evidence — Hassan HF / Hassan Serenity / Helena / Hephaistion / Heracles / Hijikata R1

- Role: S source-evidence / semantic-normalization candidate
- Base accepted R: `6147f31fc4d7591c5f3b5046095fd3d1719f1fb9`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: 16 identities (Hassan HF 3, Hassan Serenity 3, Helena 1, Hephaistion 3, Heracles 3, Hijikata 3)
- Source replay: 16/16 exact printed-text bindings

## Classification

- READY_GENERIC_EXTENSION: 1
- SPECIAL_HANDLER_CANDIDATE: 15
- Hephaistion Riding reuses the reviewed Rider generic family.
- Hassan Presence Concealment entries reuse the reviewed `presence_concealment_assassination_rule` family.
- Heracles' three Twelve Labours entries share one reviewed-special rule family; Hijikata's three Law entries share one reviewed-special rule family.
- Hephaistion's Wheel of Heaven follows the latest user ruling: at least 1 Command Seal must be spent, the engaged opponent chooses, and an otherwise-unused use is allowed.

## Recomputed state

- sourceGroundedCount: 705/944
- semanticBlockedCount: 239
- READY_EXISTING_CONTRACT: 2
- READY_GENERIC_EXTENSION: 236
- SPECIAL_HANDLER_CANDIDATE: 467
- SOURCE_EVIDENCE_REQUIRED: 239
- zeroSilentFallback: true
- automation audit: `EXACT_AGREEMENT`
- gapCount: 0

## Verification

- typecheck: PASS
- focused Phase 3 suite: 6 files / 146 tests PASS
- full CI (`--maxWorkers=2`): 84 files / 591 tests PASS
- `git diff --check`: PASS
- production runtime diff: none

No runtime migration was performed in S.
