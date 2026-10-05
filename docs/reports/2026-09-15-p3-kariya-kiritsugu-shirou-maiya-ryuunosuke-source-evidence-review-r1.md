# Phase 3 Source Evidence Review — Kariya / Kiritsugu / Shirou / Maiya / Ryuunosuke (R R1)

- Date: 2026-09-15
- Role: Codex R
- Exact S candidate: `4db71828176f91f37bb3ad1e5370fa4680257dc6`
- S PR: #120
- Exact A audit: `e79c6ebac0aae5da9e009abf1c31da259e3d4eb8`
- A PR: #121
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Scope

Independent read-only final acceptance review of the 20-ID Kariya / Kiritsugu / Shirou Emiya / Maiya / Ryuunosuke source-evidence slice.

## Verdict

**F1_SOURCE_EVIDENCE_ACCEPTED**

## Independent recomputation

Fresh R checkout reran Reference verification, intake, semantic normalization, capability mapping, decision/runtime packet generation, and full-roster audit.

- Regenerated outputs are byte-identical to A/S: **CLEAN**.
- `sourceGroundedCount=252`.
- `semanticBlockedCount=692`.
- `contractMappedCount=252`.
- `explicitBlockCount=692`.
- Classification: **2 existing / 162 generic / 88 special / 692 source-evidence-required**.
- Overlay coverage: **180 cards / 344 structured abilities**.
- Audit: **EXACT_AGREEMENT**, `gapCount=0`.
- `zeroSilentFallback=true`.

## Batch classification

- 1 `READY_EXISTING_CONTRACT`
- 12 `READY_GENERIC_EXTENSION`
- 7 `SPECIAL_HANDLER_CANDIDATE`

The newly inherited existing contract is Kiritsugu `master.kiritsugu.skill.s2`, whose `time-alter.action` semantics exactly inherit `CARD_ACTION_SEMANTICS_MINIMAL_PLAY`.

Reviewed-special boundaries remain limited to explicit non-generic mechanics such as Kariya nemesis/collapse rules, Kiritsugu Origin Bullet scaling and deck transform review, Ryuunosuke battlefield event penalty, and Shirou first-elimination prevention.

## Source and isolation checks

- Development-text / locked-Reference replay: **20/20 PASS**.
- Added identity literals in generic mapper machinery: **none**.
- Production runtime diff from exact S candidate through R: **NONE**.

## Verification

- `npm run typecheck`: PASS.
- Phase 3 focused suite: **6 files / 89 tests PASS**.
- Full reviewer CI, single worker: **84 files / 534 tests PASS**.

## Accepted checkpoint movement

- Prior accepted: **232 grounded / 712 blocked**.
- New accepted: **252 grounded / 692 blocked**.
- Net movement: **+20 grounded / -20 blocked**.
- Accepted F1 progress: **252 / 944 = 26.69%**.

This acceptance is F1 source-evidence / semantic normalization only. It does not claim wholesale F3 runtime migration.
