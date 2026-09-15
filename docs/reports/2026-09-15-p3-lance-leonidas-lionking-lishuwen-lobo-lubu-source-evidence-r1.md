# P3 F1 Source Evidence — Lance / Leonidas / Lion King / Li Shuwen / Lobo / Lu Bu R1

- Role: S source evidence / semantic normalization
- Base accepted R: `1dcb481ad257bfb47990cd789005a37a334f217a`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: 16 identities
- Source-grounded candidate: 783/944
- Semantic blocked: 161
- Classification totals: 2 existing / 240 generic / 541 reviewed-special / 161 source-evidence-required
- Batch classification: 1 generic + 15 reviewed-special

## Reuse

- `servant.lishuwen.skill.sc-lishuwen-3` reuses the accepted Lancer `move_player` contract (`any_location_except_workshop`).
- `servant.lance.skill.sc-lance-3` reuses the existing reviewed-special `temporary_card_copy_rule` family.
- No runtime migration or production runtime implementation was changed.

## Verification

- development snapshot text binding: 16/16 exact
- deterministic regeneration: PASS
- `EXACT_AGREEMENT`
- gapCount: 0
- zeroSilentFallback: true
- typecheck: PASS
- focused Phase 3 suite: 6 files / 156 tests PASS
- full CI: 84 files / 601 tests PASS
- `git diff --check`: PASS
- production runtime diff from base R (`packages`, `src`): none

Runtime migration remains out of scope for F1.
