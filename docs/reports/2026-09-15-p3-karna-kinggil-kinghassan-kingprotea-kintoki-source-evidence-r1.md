# P3 F1 Source Evidence — Karna / King Gil / King Hassan / Kingprotea / Kintoki R1

- Role: S source evidence / semantic normalization
- Base accepted R: `e3c37860b12d9e8f6a432547b69358cec72f87c2`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: 15 identities
- Classification: 15 SPECIAL_HANDLER_CANDIDATE

## Candidate result

- sourceGroundedCount: 751/944 (79.56%)
- semanticBlockedCount: 193
- READY_GENERIC_EXTENSION: 239
- SPECIAL_HANDLER_CANDIDATE: 510
- structuredAbilityCount: 1029
- sourceEvidenceOverlayCount: 679
- sourceEvidenceOverlayAbilityCount: 912
- zeroSilentFallback: true
- `EXACT_AGREEMENT`
- gapCount: 0

## Rule-family reuse

- Kintoki's two identical Golden Spark cards share `kintoki_golden_spark_rule`.
- King Hassan's two Death Bell variants share `kinghassan_death_bell_rule` while preserving their distinct die thresholds and power clause in the operation text.

## Verification

- typecheck: PASS
- focused Phase 3 suite: 6 files / 152 tests PASS
- full CI (`--maxWorkers=2`): 84 files / 597 tests PASS
- `git diff --check`: PASS
- production runtime diff: none

Runtime migration remains out of scope for F1.
