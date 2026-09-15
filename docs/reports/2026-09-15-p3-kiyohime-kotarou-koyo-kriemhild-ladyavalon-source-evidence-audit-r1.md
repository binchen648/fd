# P3 F1 Audit — Kiyohime / Kotarou / Koyo / Kriemhild / Lady Avalon R1

- Role: A independent audit
- S candidate: `958895d0ad4ede71cf3af4488a3b253bcb6ed48d`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: 15 identities
- Classification: 15 SPECIAL_HANDLER_CANDIDATE

## Independent regeneration

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
- regeneration diff: clean

## Verification

- typecheck: PASS
- focused Phase 3 suite: 6 files / 154 tests PASS
- full CI (`--maxWorkers=2`): 84 files / 599 tests PASS
- `git diff --check`: PASS
- production runtime diff: none

No semantic or runtime repair was performed in A.
