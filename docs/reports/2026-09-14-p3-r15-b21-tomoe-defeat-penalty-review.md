# P3-R15 Independent Review — B21 Tomoe Defeat Penalty

- Date: 2026-09-14
- Reviewer task: `P3-R15`
- Candidate task: `P3-B21`
- Candidate SHA: `a160913798d943bf74e6151494384ba946fdfce9`
- Reviewer branch: `codex/r-p3-b21-tomoe-defeat-penalty-r1-review`
- Verdict: `GATE_A_B_CANDIDATE_ACCEPTED`

## Findings

No blocking findings.

Non-blocking test-infrastructure observation: the first fresh ordered Chromium run saw the inherited B15 Eresh browser case fail because the UI click did not advance the room revision. The B21 Tomoe case passed in that run. B15 then passed immediately in isolation, and a fresh complete B13-B21 Chromium rerun passed 9/9. This is consistent with an existing browser command-send race rather than a deterministic B21 semantic regression, so under the R15 rule to block only on new deterministic failures it is not a blocker.

## Independent semantic-family / prevention-exception judgment

ACCEPTED.

The production classifier is structural and identity-free. It accepts only:

- `forced_trigger`;
- `after_controller_loses_battle`;
- exactly one `adjust_victory_points` effect for `controller`, amount `-5`;
- no activation phase/window/source-state requirement, conditions, targets, cost, create, lifecycle, response window, or limit;
- exactly one rule modifier whose operation/rule/scope/priority is `ignore / effect_prevention / this_effect / explicit_exception`;
- no unexpected effect keys, scope keys, priority keys, or modifier keys beyond the allowed authoring metadata.

The production patch contains no Tomoe/card/ability/modifier identity literal. Renamed IDs are covered by the focused regression. Near misses are rejected by the exact semantic predicate and same-family candidates fail closed before legacy fallback.

The bypass is narrow: only an ability that passes this exact semantic classifier enters the direct resolution path ahead of ordinary effect prevention. It does not generalize rule modifiers or broad TO15 Modifier/Power behavior.

## Participant / post-scoring judgment

ACCEPTED.

The focused/current-lineage proof shows the trigger follows the accepted battle-loss event lineage, requires the controller to be the losing participant, ignores unrelated battle results and controller victories, and settles only after the phase-wide scoring barrier. The B21 Chromium proof independently observes both battlefield receipts/barrier before the Tomoe result settlement.

## Typed VP / floor / fail-closed / exactly-once judgment

ACCEPTED.

Focused evidence verifies:

- ordinary prevention cannot block the exact explicit exception;
- `victory_points_adjusted` is emitted with controller/resource/before/after/actual delta and `unpreventable=true` provenance;
- the VP floor remains authoritative when fewer than 5 VP are available;
- replay of a stable result does not deduct twice;
- malformed same-family prevention shape rejects atomically without legacy fallback.

No broad prevention bypass or unrelated consumer promotion was found.

## Projection / reconnect / stale judgment

ACCEPTED.

Fresh remote-room B21 proof passed and preserves the post-settlement VP value across reconnect while rejecting stale-revision replay without duplicate deduction. Fresh full B13-B21 rerun passed 9/9 Chromium cases.

## Gate evidence

- `npm ci`: PASS
- `npm run typecheck`: PASS
- focused/current-lineage compatibility: `12 files / 109 tests PASS`
- fresh Chromium B13-B21 final rerun: `9 / 9 PASS`
- full root: `106 files PASS / 10 FAIL`, `693 tests PASS / 20 FAIL`
- all 20 full-root failures are the inherited CHM/original-image evidence absence class; no new deterministic failure was identified
- `git diff --check`: PASS
- production identity audit: PASS
- reviewer worktree remained implementation-clean; no production fix was made by R15

## Gate A/B/C judgment

`GATE_A_B_CANDIDATE_ACCEPTED`.

B21 is acceptable for A-owned evidence synchronization. This review does not itself change coverage KPI, taxonomy, classifier, or A03 state.

## A03 synchronization input

A03 may synchronize B21 using:

- accepted candidate: `a160913798d943bf74e6151494384ba946fdfce9`;
- semantic family: forced `after_controller_loses_battle` -> controller VP `-5` with the exact explicit `this_effect` effect-prevention exception;
- accepted evidence: identity-free exact classifier, loser/participant provenance, post-scoring barrier, narrow prevention bypass, typed unpreventable VP event, VP floor, atomic fail-closed malformed-shape rejection, stable replay exactly-once, reconnect/stale proof;
- compatibility: B13-B20/current-lineage green;
- final Chromium: 9/9 PASS;
- full-root delta: +6 passing B21 tests relative to accepted B20 baseline, with the same 20 inherited evidence failures and no new deterministic failure.
