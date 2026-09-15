# P3 F1 Audit — Himiko / Ibaraki / Iskandar / Ivan / Izou / Jack R1

- Role: A independent audit
- S candidate: `c8267eb17175cae44e012e9a18809401370e294f`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: 16 identities
- Classification: 2 READY_GENERIC_EXTENSION + 14 SPECIAL_HANDLER_CANDIDATE

## Independent regeneration

- sourceGroundedCount: 721/944
- semanticBlockedCount: 223
- READY_GENERIC_EXTENSION: 238
- SPECIAL_HANDLER_CANDIDATE: 481
- structuredAbilityCount: 999
- sourceEvidenceOverlayCount: 649
- sourceEvidenceOverlayAbilityCount: 882
- zeroSilentFallback: true
- `EXACT_AGREEMENT`
- gapCount: 0
- regeneration diff: clean

## Verification

- typecheck: PASS
- focused Phase 3 suite: 6 files / 148 tests PASS
- full CI (`--maxWorkers=2`): 84 files / 593 tests PASS
- `git diff --check`: PASS
- production runtime diff: none

No semantic or runtime repair was performed in A.
