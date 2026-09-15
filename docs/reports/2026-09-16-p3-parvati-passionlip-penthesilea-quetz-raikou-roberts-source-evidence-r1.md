# P3 Source Evidence S — Parvati / Passionlip / Penthesilea / Quetzalcoatl / Raikou / Roberts R1

Role: S (source evidence / semantic normalization candidate)

Base accepted R: `1beba109d1ce980824f0ed93237a2bb118ce1b40`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

Batch: Parvati 2 + Passionlip 3 + Penthesilea 3 + Quetzalcoatl 3 + Raikou 3 + Roberts 1 = 15 identities.

Classification:
- READY_GENERIC_EXTENSION: 1 (`servant.roberts.skill.sc-roberts-3`, shared Rider rule)
- SPECIAL_HANDLER_CANDIDATE: 14
- Passionlip Alter Ego class rule reuses accepted `reverse_effect_rule`.

Candidate totals:
- sourceGrounded / contractMapped: 860 / 944
- blocked / explicitBlockCount: 84
- READY_EXISTING_CONTRACT: 2
- READY_GENERIC_EXTENSION: 246
- SPECIAL_HANDLER_CANDIDATE: 612
- SOURCE_EVIDENCE_REQUIRED: 84
- zeroSilentFallback: true
- EXACT_AGREEMENT; gapCount: 0

Validation:
- typecheck PASS
- focused Phase 3 166/166 PASS
- full CI 611/611 PASS
- git diff --check PASS
- production runtime diff vs base accepted R under packages/src: none

Scope: F1 only; no runtime migration.
