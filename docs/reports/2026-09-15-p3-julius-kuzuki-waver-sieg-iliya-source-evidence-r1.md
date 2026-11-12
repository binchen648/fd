# Phase 3 Source Evidence — Julius / Kuzuki / Waver / Sieg / Illya (S R1)

- Date: 2026-09-15
- Role: Codex S
- Base accepted R: `9f784f4e32d20541f882ea5e4fac039158cc6705`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: 19 canonical master skill identities across Julius, Kuzuki, Waver, Sieg, and Illya.

## Result

- Source replay against development text / locked Reference: **19/19 PASS**.
- Source-grounded checkpoint candidate: **213 / 944**.
- Remaining `SOURCE_EVIDENCE_REQUIRED`: **731**.
- Batch classification: **13 `READY_GENERIC_EXTENSION` / 6 `SPECIAL_HANDLER_CANDIDATE`**.
- Global classification: **1 existing / 137 generic / 75 special / 731 source-evidence-required**.
- Source evidence overlays: **141 cards / 279 structured abilities**.
- Full-roster audit: **EXACT_AGREEMENT**, `gapCount=0`.
- `zeroSilentFallback=true`.

## Reviewed-special boundaries

The six reviewed-special identities are limited to mechanics that cross ordinary generic subsystem boundaries:

- Julius `s1`: deferred deployment from outpost into action phase.
- Julius ascension: modifies the deferred deployment timing/location choices.
- Kuzuki ascension: grants an additional activated ability to the named Snake card definition.
- Waver ascension: battlefield-winner prediction plus delayed phase-end mass discard.
- Sieg `s2`: grants opponents a temporary action capable of defeating Sieg.
- Illya ascension: Third Magic shared/full-game victory condition.

All remaining resource, draw, visibility, card-zone, trigger, condition, lifecycle, movement, power, and modifier semantics remain explicit generic dependencies.

## Guardrails

- No new identity literal branch in generic machinery.
- No production runtime diff from the accepted base.
- No runtime migration or F3 acceptance is claimed by this S lane.
- `CARD_ACTION_ACTIVATE` now has its first real eligible identity: `master.iliya.skill.s2` (Holy Grail Vessel activates Heavenly Dress at round 8).

## Verification

- `npm run typecheck`: PASS.
- Phase 3 focused suite: **6 files / 85 tests PASS**.
- Default parallel `npm run test:ci`: only three 5-second load-related timeouts; no assertion failures.
- Isolated reruns: inventory **12/12 PASS**, reference-lock **8/8 PASS**, match-session **26/26 PASS**.
- Same 84-file CI under single worker: **84 files / 530 tests PASS**.
- `git diff --check`: PASS.

Verdict: **S_CANDIDATE_READY_FOR_FRESH_A**.