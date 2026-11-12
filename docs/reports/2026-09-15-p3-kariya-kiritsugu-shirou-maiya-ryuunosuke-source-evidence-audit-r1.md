# Phase 3 Source Evidence Audit — Kariya / Kiritsugu / Shirou / Maiya / Ryuunosuke (A R1)

- Date: 2026-09-15
- Role: Codex A
- Exact S candidate: `4db71828176f91f37bb3ad1e5370fa4680257dc6`
- S PR: #120
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Independent recomputation

Fresh A checkout independently reran Reference verification, intake, semantic normalization, capability mapping, decision/runtime packet generation, and full-roster audit.

- Regenerated outputs are byte-identical to the S candidate: **no diff**.
- `sourceGroundedCount=252`.
- `semanticBlockedCount=692`.
- Classification: **2 existing / 162 generic / 88 special / 692 source-evidence-required**.
- Overlay coverage: **180 cards / 344 structured abilities**.
- Audit: **EXACT_AGREEMENT**, `gapCount=0`.
- `zeroSilentFallback=true`.

## Source and isolation checks

- Development-text / locked-Reference replay: **20/20 PASS**.
- Added role-identity literals in generic mapper machinery: **none**.
- Production runtime diff from prior accepted R checkpoint: **NONE**.
- Fresh regenerated A worktree remained clean after recomputation.

## Tests

- `npm run typecheck`: PASS.
- Phase 3 focused suite: **6 files / 89 tests PASS**.
- Full reviewer CI, single worker: **84 files / 534 tests PASS**.

No S semantics were repaired or altered in A.

Verdict: **A_AUDIT_ACCEPTED_FOR_FRESH_R**.
