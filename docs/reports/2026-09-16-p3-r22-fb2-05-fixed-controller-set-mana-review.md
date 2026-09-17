# P3-R22 FB2-05 Fixed Controller Set-Mana Review

Date: 2026-09-16
Role: R
Reviewed candidate: `1a611635061f83f7b3aad5c5b2e3da2a33b201bf`
A handoff baseline: `40444c1c6354f302712d87cc4f774c825b1ae099`
Verdict: `GATE_A_B_CANDIDATE_ACCEPTED`

## Findings

No blocking findings.

The candidate adds a typed fixed-controller `set_mana` Resolution Data-flow primitive plus an identity-free component classifier. It does not add a runtime parent route for any F1 member and does not promote Trigger Gateway, game-start routing, condition evaluation, lifecycle, modifier, or special-handler semantics.

## Accepted scope

R22 accepts only:

- primitive type `set_mana`;
- controller-only typed node;
- fixed safe-integer literal target at the authoring/component boundary, with no binding/expression amount;
- exact assignment when `0 <= targetAmount <= manaCap(controller)`;
- invalid/over-cap target fails closed rather than clamps;
- `manaGainBlocked` does not suppress exact set because this is assignment, not gain;
- typed `SetManaResult` exposes `targetAmount`, `actualDelta`, `before`, and `after`;
- non-zero delta emits existing `mana_adjusted`; same-value set is a no-op with no resource event;
- result fields are available to the existing typed binding evaluator;
- transaction rollback restores state and prevents event leakage on a later failure;
- `isFixedControllerManaSetComponent` is component recognition only and grants no parent route.

## Explicit non-acceptance

This review does not accept:

- Trigger Gateway or game-start execution;
- condition, lifecycle, modifier, replacement, or special-handler parent semantics;
- variable/expression or selected-result `set_mana`;
- third-party/target-selected set;
- redefinition of Mana gain/loss/payment;
- F1 migration or migration readiness for the five component members;
- broad Resource Numeric closure by implication.

## Independent verification

- Fresh reviewer worktree from exact candidate SHA.
- Changed-file audit matches declared candidate files only.
- Forbidden-file audit: PASS; no MatchSession, client/server, `data/phase3`, or `data/authoring` changes.
- Production identity/text audit: PASS.
- `git diff --check`: PASS.
- `npm.cmd run typecheck`: PASS.
- Focused typed/component compatibility: 5 files / 35 tests PASS.
- All rules regressions: 44 files / 262 tests PASS.
- Generated-content determinism: PASS with unchanged hashes:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`
- Full root CI: 111 files / 675 tests PASS.

## Gate judgment

`GATE_A_B_CANDIDATE_ACCEPTED`

No new Gate C is required because this candidate introduces no room/projection/pending-interaction/reconnect behavior and no production parent route.
