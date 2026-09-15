# P3 F1 Source Evidence — Kiyohime / Kotarou / Koyo / Kriemhild / Lady Avalon R1

- Role: S source evidence / semantic normalization
- Base accepted R: `d65729d87240868ea078f7e73f6a2e8bafd860a6`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: 15 identities
- Classification: 15 SPECIAL_HANDLER_CANDIDATE
- Shared rule reuse: Kotarou Presence Concealment assassination; Lady Avalon Caster territory construction scaling

## Candidate result

- sourceGroundedCount: 767/944
- semanticBlockedCount: 177
- READY_GENERIC_EXTENSION: 239
- SPECIAL_HANDLER_CANDIDATE: 526
- structuredAbilityCount: 1045
- sourceEvidenceOverlayCount: 695
- sourceEvidenceOverlayAbilityCount: 928
- zeroSilentFallback: true
- `EXACT_AGREEMENT`
- gapCount: 0

## Verification

- typecheck: PASS
- focused Phase 3 suite: 6 files / 154 tests PASS
- full CI (`--maxWorkers=2`): 84 files / 599 tests PASS
- `git diff --check`: PASS
- production runtime diff: none

Runtime migration remains out of scope for F1.
