# P3 F1 Audit — Jaguarman / Jeanne / Jeanne Alter / Jekyll / Kagekiyo / Kama R1

- Role: A independent audit
- S candidate: `427a3a89a5ecaf804948658d4c00b6355e502bcb`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: 15 identities
- Classification: 1 READY_GENERIC_EXTENSION + 14 SPECIAL_HANDLER_CANDIDATE

## Independent regeneration

- sourceGroundedCount: 736/944
- semanticBlockedCount: 208
- READY_GENERIC_EXTENSION: 239
- SPECIAL_HANDLER_CANDIDATE: 495
- structuredAbilityCount: 1014
- sourceEvidenceOverlayCount: 664
- sourceEvidenceOverlayAbilityCount: 897
- zeroSilentFallback: true
- `EXACT_AGREEMENT`
- gapCount: 0
- regeneration diff: clean

## Verification

- typecheck: PASS
- focused Phase 3 suite: 6 files / 150 tests PASS
- full CI (`--maxWorkers=2`): 84 files / 595 tests PASS
- `git diff --check`: PASS
- production runtime diff: none

No semantic or runtime repair was performed in A.
