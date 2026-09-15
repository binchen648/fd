# P3 F1 Source Evidence — Karna / King Gil / King Hassan / Kingprotea / Kintoki / Kiritsugu R1

- Role: S source evidence / semantic normalization
- Base accepted R: `219caf7f2945962e0bc72bb2f88d20ff8fbb2695`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: 16 identities
- Classification: 16 SPECIAL_HANDLER_CANDIDATE

## Candidate result

- sourceGroundedCount: 752/944
- semanticBlockedCount: 192
- READY_GENERIC_EXTENSION: 239
- SPECIAL_HANDLER_CANDIDATE: 511
- structuredAbilityCount: 1030
- sourceEvidenceOverlayCount: 680
- sourceEvidenceOverlayAbilityCount: 913
- zeroSilentFallback: true
- `EXACT_AGREEMENT`
- gapCount: 0

## Reuse

- Kiritsugu `气息遮断（Assassin Class）` reuses the accepted presence-concealment assassination rule family.
- Caster Gil territory construction reuses the accepted territory-construction special family.
- King Hassan cards share the Azrael family; Kingprotea cards share the growth family; Kintoki Golden Spark copies share one rule family.

## Verification

- typecheck: PASS
- focused Phase 3 suite: 6 files / 152 tests PASS
- full CI (`--maxWorkers=2`): 84 files / 597 tests PASS
- `git diff --check`: PASS
- production runtime diff: none

Runtime migration remains out of scope for F1.
