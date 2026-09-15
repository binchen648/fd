# P3 F1 Source Evidence — Danzou / Darius / Diarmuid / Dioscuri / Don Quixote / Douman R1

- Role: S source-evidence / semantic-normalization candidate
- Base accepted R: `6d7994759628a39083903ebdc4baef1fadb7c733`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: 15 identities (Danzou 3, Darius 1, Diarmuid 2, Dioscuri 3, Don Quixote 3, Douman 3)
- Source replay: 15/15 exact printed-text bindings

## Classification

- READY_GENERIC_EXTENSION: 2
  - `servant.diarmuid.skill.sc-diarmuid-3`
  - `servant.donquixote.skill.sc-donquixote-3`
- SPECIAL_HANDLER_CANDIDATE: 13
- Existing semantic families reused where possible: Presence Concealment assassination, Noble Phantasm suppression, Dual Servant, Growth Counter, Reverse Effect.
- New reviewed-special tokens introduced only for genuinely distinct semantics: `HAND_DISCARD_SUM_DEFEAT_RULE`, `UNDEAD_ARMY_HALF_CLOSE_RULE`, `EVENT_PRINTED_VP_ADJUSTMENT_RULE`.

## Recomputed state

- sourceGroundedCount: 657/944
- semanticBlockedCount: 287
- READY_EXISTING_CONTRACT: 2
- READY_GENERIC_EXTENSION: 231
- SPECIAL_HANDLER_CANDIDATE: 424
- SOURCE_EVIDENCE_REQUIRED: 287
- zeroSilentFallback: true
- automation audit: `EXACT_AGREEMENT`
- gapCount: 0

## Verification

- `npm.cmd run typecheck`: PASS
- Phase 3 focused suite: 6 files / 140 tests PASS
- `npm.cmd run test:ci -- --maxWorkers=2`: 84 files / 585 tests PASS
- `git diff --check`: PASS
- production runtime diff vs accepted base (`packages`, `src`): none

No runtime migration or Reference-handler inference was performed in S.
