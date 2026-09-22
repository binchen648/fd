# Phase 3 F1 Source Evidence — Sion (S, R2)

- Base accepted reviewer: `123899a6622e2897d174fc0201eb79e3b1f67cfd`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Development source: `E:\Codex\FD\Fate_Domination-开发版\data_masters.js`
- Development source SHA-256: `c596af5730846ef9092375f18c4200b84f032028dc2e8f5483377d8ddcc22825`
- Note: an old unrelated `sion-r1` branch/worktree already existed and was left untouched; this current work uses `sion-r2` from the accepted base.

## Slice

17 previously blocked Sion identities. (`master.sion.skill.s13` was already grounded before this batch and is not part of the 17-ID source-evidence slice.)

- Exact development-text gate: **17/17 PASS**
- Structured source replay: **17/17 PASS**

## Semantic result

- `sourceGroundedCount`: **403 / 944**
- `blockedCount`: **541**
- `structuredAbilityCount`: **681**
- Batch classification: **2 generic / 15 reviewed-special**
- Global classification: **2 existing / 200 generic / 201 reviewed-special / 541 source-evidence-required**
- Source-evidence overlays: **331 cards / 564 abilities**
- Audit: **EXACT_AGREEMENT**, `gapCount=0`

The generic batch identities are `master.sion.skill.s6` and `master.sion.skill.s16`. Complex training/EX, terrain-result, growth, reverse-effect, temporary command-seal, Moon Holy Grail reset, hidden draw/removal, and Luck reveal/defeat mechanics remain reviewed-special boundaries. No character identity branch was added to the generic mapper.

## Verification

- `npm.cmd run typecheck`: PASS
- focused Phase 3 suite: **6 files / 104 tests PASS**
- `npm.cmd run test:ci`: **84 files / 549 tests PASS**, exit code 0
- `git diff --check`: PASS
- production runtime diff under `packages` / `src`: **NONE**
- mapper identity-literal diff for Sion: **NONE**
