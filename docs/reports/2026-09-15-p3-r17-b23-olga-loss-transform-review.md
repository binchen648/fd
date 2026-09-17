# P3-R17 Independent Review — B23 Olga Loss Transform

- Date: 2026-09-15
- Reviewer task: `P3-R17`
- Candidate task: `P3-B23`
- Candidate SHA: `19472d3004f4fdda108049ae9ccfea24f27c86f6`
- Candidate base: `8762b78d6d2cb338dda7fe875609ec3cad4d74e8`
- Reviewer branch: `codex/r-p3-b23-olga-loss-transform-r1-review`
- Candidate PR: `#41`
- Verdict: `GATE_A_B_CANDIDATE_ACCEPTED`

## Findings

No blocking findings.

The reviewer found no new deterministic regression, no production identity routing, and no broad TO15/TO16 promotion. The full-root failure set is exactly the inherited 20 CHM/original-image evidence absence failures.

## Semantic-family / active-source judgment

ACCEPTED.

The dedicated classifier is structural and identity-free. It recognizes only the exact family:

- `forced_trigger`;
- `after_controller_loses_battle`;
- exactly one `transform_to_return_silence_on_loss` effect;
- no conditions, targets, costs, creates, rule modifiers, lifecycle, or limit;
- only normalized default response-window metadata is tolerated.

Renaming the ability ID does not affect classification. Wrong trigger/effect and extra semantic clauses fail the classifier. The production diff adds zero matches for Olga, Trismegistus, master/card/ability identity strings, `loss-transform`, or the removed player-flag name.

The trigger is additionally gated by authoritative source state: the source instance must still be face-up active in an active zone and must not already have transformed. An inactive skill-zone source therefore cannot transform on the same loss that precedes the accepted B17 delayed activation path.

## State-transition / Soul-Drag-removal judgment

ACCEPTED.

A valid loss event must identify the controller as the losing participant and carry stable phase/battle/result/battlefield provenance. On first valid settlement, B23:

- removes only Soul Drag ongoing effects from the same source/controller;
- records the source instance in source-bound transformed state;
- installs the existing battlefield-only deployment restriction for that controller;
- emits `battle_loss_state_transformed` with trigger event, phase/battle/result/battlefield identities and explicit `soul_drag -> return_silence` provenance;
- does not transform again on stable replay or later distinct losses while already transformed.

The accepted B13-B22 post-scoring battle-loss lineage remains intact. Fresh focused proof includes a production `MatchSession` path and verifies the post-scoring barrier precedes result dispatch and transform settlement.

## Return-Silence gating / cleanup judgment

ACCEPTED.

State gating is by structural effect type and source instance, not by representative identity:

- before transformation, `return_silence_battle_start` does not arm;
- after transformation, `soul_drag_power_bonus` cannot reinstall;
- the combat resolver recognizes only live face-up active transformed sources whose authored definition contains the Return Silence semantic effect;
- consuming Return Silence removes the exact source, clears its transformed marker, and removes the controller deployment restriction when no other live transformed source remains.

An independent reviewer-only temporary runtime probe confirmed this boundary without repository modification. The probe observed:

```text
before consume: transformed=[r17-source], mustDeploy=[p1]
transition: soul_drag -> return_silence with full battle provenance
after consume: source zone=removed_from_game, active=false, transformed=[], mustDeploy=[]
first Return Silence battle winner=[p1]
later ordinary battle winner=[p2]
```

The later ordinary battle is the decisive no-ghost-state proof: after source removal, the stale Return Silence override no longer affects combat.

## Exactly-once / reconnect / stale judgment

ACCEPTED.

Focused proof verifies stable loss-event replay leaves the transformed state unchanged and a later distinct loss does not duplicate transition evidence. Fresh B23 remote-room Chromium proof reaches the production battle-loss path, preserves authoritative post-battle state across reconnect, and rejects stale-revision replay. The complete B13-B23 ordered browser suite passed 11/11.

The internal source-bound marker is intentionally server authority rather than client projection. Its exact mutation and cleanup are therefore verified through the focused production-MatchSession path and independent reviewer runtime probe, while Gate C verifies the remote command/reconnect/stale boundary.

## Gate evidence

- exact reviewed candidate: `19472d3004f4fdda108049ae9ccfea24f27c86f6`
- `npm ci`: PASS
- `npm run typecheck`: PASS
- B23 focused: `9 / 9 PASS`
- B13-B23 current-lineage: `14 files / 126 tests PASS`
- fresh ordered Chromium B13-B23: `11 / 11 PASS`
- fresh reviewer full root: `108 test files PASS / 10 FAIL`, `710 PASS / 20 FAIL / 730 total`
- all 20 failures are the inherited CHM/original-image evidence absence class
- the eleven-round MatchSession smoke passed in the reviewer full-root run at approximately `3.8s`
- `git diff --check` against the exact handoff base: PASS
- added-production identity audit: `0` matches
- independent source-removal / ghost-state probe: PASS
- reviewer worktree remained production-clean; R17 made no implementation fixes

Relative to accepted B22 (`701 PASS / 20 inherited FAIL / 721 total`), B23 contributes `+9 PASS / +0 new deterministic failures`.

## Non-promotion judgment

ACCEPTED.

B23 accepts only the final TO14 battle-loss state-transform consumer. It does not independently certify broad state transformation, generic passive lifecycle, Soul Drag Modifier/Power semantics, the downstream Return Silence row as TO16, broad TO15, or broad TO16 Special behavior.

## Gate A/B/C judgment

`GATE_A_B_CANDIDATE_ACCEPTED`.

B23 is acceptable for A-owned evidence synchronization. R17 does not itself change the TO14 overlay, raw Phase 3 KPI, taxonomy, capability catalog, or broader Battle denominator.

## A03 synchronization input

A03 may synchronize B23 using:

- accepted candidate: `19472d3004f4fdda108049ae9ccfea24f27c86f6`;
- semantic family: forced authoritative controller battle loss -> exact active-source `transform_to_return_silence_on_loss` -> source-bound Soul Drag to Return Silence transition;
- accepted evidence: identity-free exact classifier, active-source gating, authoritative loser provenance, same-source Soul Drag removal, source-bound transition state, typed transition evidence, pre-transform Return Silence exclusion, post-transform Soul Drag exclusion, source-removal cleanup, no ghost battle override, stable replay exactly-once, reconnect preservation, stale-revision rejection, and malformed-shape fail-closed behavior;
- compatibility: B13-B22/current-lineage green;
- final Chromium: `11 / 11 PASS`;
- full-root delta: `+9 PASS / +0 new deterministic failures` relative to B22, with the same 20 inherited evidence failures.

After synchronization, the scoped TO14 accepted-direct-consumer overlay may advance from `12 / 13` to `13 / 13`, leaving `0 / 13` direct consumers unresolved. This does not promote TO15 or TO16.
