# P3 F1 Audit — Karna / King Gil / King Hassan / Kingprotea / Kintoki R1

- Role: A independent audit
- S candidate: `55593f0`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: 15 identities
- Classification: 15 SPECIAL_HANDLER_CANDIDATE

## Independent regeneration

- sourceGroundedCount: 751/944
- semanticBlockedCount: 193
- READY_GENERIC_EXTENSION: 239
- SPECIAL_HANDLER_CANDIDATE: 510
- structuredAbilityCount: 1029
- sourceEvidenceOverlayCount: 679
- sourceEvidenceOverlayAbilityCount: 912
- zeroSilentFallback: true
- `EXACT_AGREEMENT`
- gapCount: 0
- regeneration diff: clean

## Verification

- typecheck: PASS
- focused Phase 3 suite: 6 files / 152 tests PASS
- full CI (`--maxWorkers=2`): 84 files / 597 tests PASS
- `git diff --check`: PASS
- production runtime diff: none

No semantic or runtime repair was performed in A.
