# P3 F1 Source Evidence — Jaguarman / Jeanne / Jeanne Alter / Jekyll / Kagekiyo / Kama R1

- Role: S source evidence / semantic normalization
- Base accepted R: `9ea5b7f9a2621690fb110247a03e8ffcf57d4226`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: 15 identities
- Classification: 1 READY_GENERIC_EXTENSION + 14 SPECIAL_HANDLER_CANDIDATE

## Candidate result

- sourceGroundedCount: 736/944 (77.97%)
- semanticBlockedCount: 208
- READY_GENERIC_EXTENSION: 239
- SPECIAL_HANDLER_CANDIDATE: 495
- structuredAbilityCount: 1014
- sourceEvidenceOverlayCount: 664
- sourceEvidenceOverlayAbilityCount: 897
- zeroSilentFallback: true
- `EXACT_AGREEMENT`
- gapCount: 0

## Reuse

- Jaguarman `战斗续行（Lancer Class）`: existing `move_player` / `any_location_except_workshop` generic.
- Jekyll and Kama `气息遮断（Assassin Class）`: existing `presence_concealment_assassination_rule` reviewed-special family.
- Jeanne `红莲圣女`: existing `defeat_player` reviewed-special effect with all-combat-participants scope.

## Verification

- typecheck: PASS
- focused Phase 3 suite: 6 files / 150 tests PASS
- full CI (`--maxWorkers=2`): 84 files / 595 tests PASS
- `git diff --check`: PASS
- production runtime diff: none

Runtime migration remains out of scope for F1.
