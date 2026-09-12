# Phase 3 Task Index

- Version: P3-TI-1.1
- Status: ACTIVE
- Scope: task-level startup index for Phase 3 agents
- Authority: subordinate to `docs/agents/PHASE3-AGENT-CONTRACT.md`

This file is the task lookup entry point for Phase 3 agents. Do not read the full `docs/plans/fd-phase-3-parallel-work-queue.md` by default. Read only the assigned task block below, then follow its explicit `Read` list.

## TASK P3-A01

Owner: Codex A
Status: REVIEW_ACCEPTED
Branch: `codex/a-p3-a01-coverage-automation`

Goal:

Phase 3 coverage and evidence automation.

Depends on:

- Phase 3 taxonomy remediation candidate reviewed or explicitly accepted for automation baseline.

Read:

- `docs/agents/PHASE3-AGENT-CONTRACT.md`
- `docs/plans/fd-phase-3-throughput-optimization-plan.md` Sections 13-15
- `docs/reports/fd-phase-3-throughput-baseline.md`
- `docs/audits/fd-skill-semantic-axis-matrix.md`

May touch:

- `docs/audits/*.mjs`
- `docs/reports/*`
- machine-readable evidence artifacts
- `package.json` only for script registration, if script ownership is reserved

Do not touch:

- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/src/match-session.ts`
- runtime semantics
- primitive behavior
- semantic routing
- card-specific runtime behavior

Required output:

- coverage command or command design
- machine-readable schema
- taxonomy drift rule
- legacy / new / dual counter definition
- reviewer packet format

Completion status allowed:

- `AUTOMATION_BASELINE_CANDIDATE`

Runtime defect handling:

- Record `RUNTIME_SEMANTIC_GAP` with evidence and hand to Codex B.
- Do not fix runtime behavior.

## TASK P3-A02

Owner: Codex A
Status: READY
Branch: `codex/a-p3-a01-coverage-automation`

Goal:

Legacy owner and promotion evidence automation for Phase 3 throughput.

Depends on:

- P3-A01 reviewed and accepted as the automation baseline.
- Codex B P3-B04 handoff packet prepared from the accepted baseline.

Read:

- `docs/agents/PHASE3-AGENT-CONTRACT.md`
- `TASK P3-A02` from this file
- `docs/plans/fd-phase-3-throughput-optimization-plan.md` Sections 13-15
- `docs/reports/fd-phase-3-throughput-baseline.md`
- `docs/reports/2026-09-09-p3-b04-runtime-handoff.md`

May touch:

- `docs/agents/PHASE3-TASK-INDEX.md`
- `scripts/phase3-*.ts`
- `scripts/tests/phase3-*.test.ts`
- `docs/reports/*`
- machine-readable evidence artifacts
- `package.json` only for script registration

Do not touch:

- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/src/ability/executable-card-pack.ts`
- `packages/rules/src/match-session.ts`
- runtime semantics
- primitive behavior
- semantic routing
- card-specific runtime behavior
- Gate A/B/C status promotion

Required output:

- legacy owner report grouped by static owner / primitive / unclassified reason
- mechanism coverage trend baseline for future B before/after checks
- promotion evidence audit that detects report/spec inconsistencies
- reusable B-slice evidence checklist/template for P3-B05 through P3-B09
- machine-readable P3-A02 packet
- reviewer-facing result report

Completion status allowed:

- `AUTOMATION_BASELINE_CANDIDATE`

Runtime defect handling:

- Record `RUNTIME_SEMANTIC_GAP` with evidence and hand to Codex B.
- Do not fix runtime behavior.

## TASK P3-A03

Owner: Codex A
Status: READY
Branch: `codex/a-p3-a01-coverage-automation`

Goal:

Synchronize reviewer outcomes into Phase 3 automation evidence without changing runtime behavior or independently promoting Gate A/B/C status.

Depends on:

- P3-A01 accepted as the automation baseline.
- P3-A02 automation audit and reusable evidence checklist available.
- Codex R or user-provided review decision for a completed Codex B slice.

Read:

- `docs/agents/PHASE3-AGENT-CONTRACT.md`
- `TASK P3-A03` from this file
- the relevant B handoff packet
- the relevant B implementation report or reviewer summary
- `artifacts/phase3-skill-coverage.json` only as generated evidence, not as authority over runtime correctness

May touch:

- `docs/agents/PHASE3-TASK-INDEX.md`
- `docs/reports/*`
- machine-readable evidence artifacts

Do not touch:

- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/src/ability/executable-card-pack.ts`
- `packages/rules/src/match-session.ts`
- runtime semantics
- primitive behavior
- semantic routing
- card-specific runtime behavior
- Gate A/B/C status promotion

Required output:

- reviewer outcome sync report
- machine-readable sync artifact
- explicit before/after coverage numbers reported by the reviewed B slice
- explicit remaining legacy / secondary runtime boundaries
- next B-slice handoff or reviewer packet only when the reviewed slice is accepted as a candidate

Completion status allowed:

- `AUTOMATION_BASELINE_CANDIDATE`

Runtime defect handling:

- Record `RUNTIME_SEMANTIC_GAP` with evidence and hand to Codex B.
- Do not fix runtime behavior.

## TASK P3-A04

Owner: Codex A
Status: AUTOMATION_BASELINE_CANDIDATE
Branch: `codex/a-p3-a01-coverage-automation`

Goal:

Align Phase 3 coverage automation with the independently accepted P3-B10 exact `SETUP_CARD_CREATION_MINIMAL:CREATE_TO_SKILL` runtime contract, while reconciling the accepted B06-B08 classifier baseline required for accurate global burn-down.

Depends on:

- P3-B10 review fix accepted at runtime commit `9fba6d9`.
- P3-A03 B10 reviewer packet available.

Read:

- `docs/agents/PHASE3-AGENT-CONTRACT.md`
- `TASK P3-A04` from this file
- `docs/reports/2026-09-12-p3-a03-b10-reviewer-packet.md`
- P3-B10 final implementation report at reviewed commit `9fba6d9`
- `artifacts/phase3-skill-coverage.json` only as generated evidence

May touch:

- `scripts/phase3-coverage.ts`
- `scripts/tests/phase3-coverage.test.ts`
- `docs/agents/PHASE3-TASK-INDEX.md`
- `docs/reports/*`
- machine-readable evidence artifacts

Do not touch:

- rule runtime semantics
- primitive behavior
- semantic routing in `packages/rules`
- `MatchSession` game behavior
- card authoring JSON
- Gate A/B/C status promotion

Required output:

- exact coverage classifier matching the accepted B10 semantic shape without card or ability ids
- cumulative classifier alignment for accepted B06 `ADD_TO_ATTACK`, B07 `ACTIVATE`, and B08 `CLOSE` contracts
- positive, negative, and card-id-independence automation regressions
- actual global legacy/new/dual burn-down numbers
- B10 review-outcome and coverage-alignment report
- machine-readable sync artifact

Completion status allowed:

- `AUTOMATION_BASELINE_CANDIDATE`

## TASK P3-B04

Owner: Codex B
Status: READY_RUNTIME_OWNER
Branch: `codex/b-p3-b04-card-action-play`

Goal:

`CARD_ACTION_SEMANTICS_MINIMAL_PLAY`.

Depends on:

- `CARD_ZONE` review accepted.
- Runtime hot-file ownership reserved.
- Relevant taxonomy baseline consumed as read-only input.

Read:

- `docs/agents/PHASE3-AGENT-CONTRACT.md`
- `docs/rules/FD-Game-Rules-Final.md` card play semantics only
- `docs/plans/fd-card-engine-stabilization-plan.md` Phase 3 only
- `docs/audits/fd-skill-mechanic-family-matrix.md` relevant `CARD_ACTION_SEMANTICS` rows only
- `docs/audits/fd-skill-semantic-axis-matrix.md` relevant ability rows only

May touch:

- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/src/ability/executable-card-pack.ts`
- `packages/rules/src/ability/types.ts` only if the primitive contract requires it
- focused mechanic tests
- scoped implementation report

Must not touch:

- coverage KPI
- taxonomy classifier rules
- evidence classification
- unrelated card-action contracts
- Trigger runtime
- Lifecycle runtime
- Interaction runtime
- Hidden projection runtime
- Battle runtime

Hot files:

- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/src/ability/executable-card-pack.ts`

Concurrent conflicts:

- any other runtime task touching hot files

Required output:

- before/after legacy route count
- semantic routing proof
- fail-closed proof
- focused tests
- implementation report

Completion status allowed:

- `IMPLEMENTATION_COMPLETE_CANDIDATE`

Evidence rule:

- Codex B may produce implementer evidence only.
- Codex R must independently judge Gate A/B/C promotion.

## TASK P3-B05

Owner: Codex B
Status: READY_RUNTIME_OWNER
Branch: `codex/b-p3-b05-play-source-response`

Goal:

`CARD_ACTION_SEMANTICS_PLAY_SOURCE_RESPONSE`.

Depends on:

- P3-B04 scoped `PLAY` accepted by Codex R or explicitly accepted as the runtime baseline.
- Runtime hot-file ownership reserved.
- Relevant taxonomy baseline and P3-B05 handoff consumed as read-only input.

Read:

- `docs/agents/PHASE3-AGENT-CONTRACT.md`
- `TASK P3-B05` from this file
- `docs/reports/2026-09-10-p3-b05-play-source-response-handoff.md`
- `artifacts/phase3-b05-play-source-response-handoff.json`
- `docs/rules/FD-Game-Rules-Final.md` response timing, cost payment, and card play semantics only
- `docs/plans/fd-card-engine-stabilization-plan.md` Phase 3 only
- `docs/audits/fd-skill-mechanic-family-matrix.md` relevant `PLAY_SOURCE_CARD_WITH_COST_RESPONSE` rows only
- `docs/audits/fd-skill-semantic-axis-matrix.md` relevant Volumen / response rows only

May touch:

- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/src/ability/executable-card-pack.ts`
- `packages/rules/src/ability/types.ts` only if the primitive contract requires it
- focused mechanic tests
- scoped implementation report
- one scoped browser/server spec if required by Gate C candidate evidence

Must not touch:

- coverage KPI
- taxonomy classifier rules
- evidence classification
- scoped normal `PLAY` contract
- unrelated card-action contracts
- Trigger runtime beyond the existing response-window hook needed to open the Volumen prompt
- Lifecycle runtime
- Hidden projection runtime
- Battle result runtime

Hot files:

- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/src/ability/executable-card-pack.ts`

Concurrent conflicts:

- any other runtime task touching hot files

Required output:

- before/after legacy route count against the accepted A/B04 baseline
- exact `play_source_card(face_up)` semantic routing proof
- fixed `pay_mana(2)` fail-closed proof
- source-card identity and source-still-in-hand revalidation proof
- focused tests
- implementation report

Completion status allowed:

- `IMPLEMENTATION_COMPLETE_CANDIDATE`

Evidence rule:

- Codex B may produce implementer evidence only.
- Codex R must independently judge Gate A/B/C promotion.

## TASK P3-B06

Owner: Codex B
Status: READY_RUNTIME_OWNER
Branch: `codex/b-p3-b06-add-to-attack`

Goal:

`CARD_ACTION_SEMANTICS_ADD_TO_ATTACK`.

Depends on:

- P3-B05 scoped `PLAY_SOURCE_RESPONSE` accepted by Codex R or explicitly accepted as the runtime baseline.
- Runtime hot-file ownership reserved.
- Relevant taxonomy baseline and P3-B06 handoff consumed as read-only input.

Read:

- `docs/agents/PHASE3-AGENT-CONTRACT.md`
- `TASK P3-B06` from this file
- `docs/reports/2026-09-10-p3-b06-add-to-attack-handoff.md`
- `artifacts/phase3-b06-add-to-attack-handoff.json`
- `docs/rules/FD-Game-Rules-Final.md` support/append-to-attack, cost payment, and battle winner exclusion semantics only
- `docs/plans/fd-card-engine-stabilization-plan.md` Phase 3 only
- `docs/audits/fd-skill-mechanic-family-matrix.md` relevant `ADD_TO_ATTACK` rows only
- `docs/audits/fd-skill-semantic-axis-matrix.md` relevant Maiya / support-shot rows only

May touch:

- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/src/ability/executable-card-pack.ts`
- `packages/rules/src/ability/types.ts` only if the primitive contract requires it
- focused mechanic tests
- scoped implementation report
- one scoped browser/server spec if required by Gate C candidate evidence

Must not touch:

- coverage KPI
- taxonomy classifier rules
- evidence classification
- scoped normal `PLAY` contract
- scoped `PLAY_SOURCE_RESPONSE` contract
- unrelated card-action contracts
- Trigger runtime
- Lifecycle runtime beyond the exact round-end return marker already present on the `attach_card_to_player_attack` contract
- Hidden projection runtime
- Battle result runtime beyond the exact cannot-win status required by this contract

Hot files:

- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/src/ability/executable-card-pack.ts`

Concurrent conflicts:

- any other runtime task touching hot files

Required output:

- before/after legacy route count against the accepted post-P3-B05 baseline
- exact `attach_card_to_player_attack` semantic routing proof
- fixed `pay_mana(2)` fail-closed proof
- support-shot identity and skill-zone availability revalidation proof
- non-controller target revalidation proof
- controller-not-at-battlefield canonical condition negative proof
- focused tests
- implementation report

Completion status allowed:

- `IMPLEMENTATION_COMPLETE_CANDIDATE`

Evidence rule:

- Codex B may produce implementer evidence only.
- Codex R must independently judge Gate A/B/C promotion.

## TASK P3-B07

Owner: Codex B
Status: READY_RUNTIME_OWNER
Branch: `codex/b-p3-b07-activate`

Goal:

`CARD_ACTION_SEMANTICS_ACTIVATE`.

Depends on:

- P3-B06 scoped `ADD_TO_ATTACK` accepted by Codex R or explicitly accepted as the runtime baseline.
- Runtime hot-file ownership reserved.
- Relevant taxonomy baseline and P3-B07 handoff consumed as read-only input.

Read:

- `docs/agents/PHASE3-AGENT-CONTRACT.md`
- `TASK P3-B07` from this file
- `docs/reports/2026-09-10-p3-b07-activate-handoff.md`
- `artifacts/phase3-b07-activate-handoff.json`
- `docs/rules/FD-Game-Rules-Final.md` battle loss, round-end timing, and existing-card activation semantics only
- `docs/plans/fd-card-engine-stabilization-plan.md` Phase 3 only
- `docs/audits/fd-skill-mechanic-family-matrix.md` relevant `ACTIVATE` rows only
- `docs/audits/fd-skill-semantic-axis-matrix.md` relevant Olga / Trismegistus rows only

May touch:

- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/src/ability/executable-card-pack.ts`
- `packages/rules/src/ability/types.ts` only if the primitive contract requires it
- focused mechanic tests
- scoped implementation report
- one scoped browser/server spec if required by Gate C candidate evidence

Must not touch:

- coverage KPI
- taxonomy classifier rules
- evidence classification
- scoped normal `PLAY` contract
- scoped `PLAY_SOURCE_RESPONSE` contract
- scoped `ADD_TO_ATTACK` contract
- unrelated card-action contracts
- broad Trigger runtime beyond the exact Olga first-loss pending marker and round-end consumption
- Lifecycle runtime beyond this exact delayed activation consumption
- Hidden projection runtime
- Battle result runtime beyond consuming the existing first-loss event
- roster-wide JSON

Hot files:

- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/src/ability/executable-card-pack.ts`

Concurrent conflicts:

- any other runtime task touching hot files

Required output:

- before/after legacy route count against the accepted post-P3-B06 baseline
- exact `activate_card_by_id` semantic routing proof
- explicit proof that first battle loss only records a pending delayed activation
- explicit proof that formal `round_end` consumes the pending activation and only then runs `activate_card_by_id`
- target card identity and allowed source-zone revalidation proof
- no immediate activation, duplicate pending, wrong-zone, missing-target, already-active, and stale/duplicate round-end negative proof
- focused tests
- implementation report

Completion status allowed:

- `IMPLEMENTATION_COMPLETE_CANDIDATE`

Evidence rule:

- Codex B may produce implementer evidence only.
- Codex R must independently judge Gate A/B/C promotion.

## TASK P3-B08

Owner: Codex B
Status: READY_RUNTIME_OWNER
Branch: `codex/b-p3-b08-close`

Goal:

`CARD_ACTION_SEMANTICS_CLOSE`.

Depends on:

- P3-B07 scoped `ACTIVATE` accepted by Codex R or explicitly accepted as the runtime baseline.
- Runtime hot-file ownership reserved.
- Relevant taxonomy baseline and P3-B08 handoff consumed as read-only input.

Read:

- `docs/agents/PHASE3-AGENT-CONTRACT.md`
- `TASK P3-B08` from this file
- `docs/reports/2026-09-10-p3-b08-close-handoff.md`
- `artifacts/phase3-b08-close-handoff.json`
- `docs/rules/FD-Game-Rules-Final.md` residual source close, card-play trigger, and active-card close semantics only
- `docs/plans/fd-card-engine-stabilization-plan.md` Phase 3 only
- `docs/audits/fd-skill-mechanic-family-matrix.md` relevant `CLOSE` rows only
- `docs/audits/fd-skill-semantic-axis-matrix.md` relevant Artoria Alter source-close rows only

May touch:

- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/src/ability/executable-card-pack.ts`
- `packages/rules/src/ability/types.ts` only if the primitive contract requires it
- focused mechanic tests
- scoped implementation report
- one scoped browser/server spec if required by Gate C candidate evidence

Must not touch:

- coverage KPI
- taxonomy classifier rules
- evidence classification
- scoped normal `PLAY` contract
- scoped `PLAY_SOURCE_RESPONSE` contract
- scoped `ADD_TO_ATTACK` contract
- scoped `ACTIVATE` contract
- unrelated card-action contracts
- broad Trigger runtime beyond exact residual `on_card_played` source-close dispatch
- broad Lifecycle runtime beyond validating active face-up source close for this exact contract
- Hidden projection runtime
- Battle result runtime
- roster-wide JSON

Hot files:

- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/src/ability/executable-card-pack.ts`

Concurrent conflicts:

- any other runtime task touching hot files

Required output:

- before/after legacy route count against the accepted post-P3-B07 baseline
- exact `close_source_card` semantic routing proof
- explicit proof that only Artoria Alter `sc-artoria-alt-2.angra-mainyu-embrace` exact residual source-close shape is migrated
- source-card identity, active-zone, face-up, controller, and compiled-definition revalidation proof
- triggering played-card visibility and `宝具` attribute revalidation proof
- wrong-kind, wrong-trigger, targeted, costed, creates, extra-effect, missing-source-zone condition, missing-played-card-attribute condition, off-board, inactive, face-down, wrong-controller, and stale replay negative proof
- focused tests
- implementation report

Completion status allowed:

- `IMPLEMENTATION_COMPLETE_CANDIDATE`

Evidence rule:

- Codex B may produce implementer evidence only.
- Codex R must independently judge Gate A/B/C promotion.

## TASK P3-B09

Owner: Codex B
Status: REVIEW_ACCEPTED_NO_ELIGIBLE_REPRESENTATIVE
Branch: `codex/b-p3-b09-create-and-activate`

Goal:

`CARD_ACTION_SEMANTICS_CREATE_AND_ACTIVATE`.

Depends on:

- P3-B08 scoped `CLOSE` accepted by Codex R or explicitly accepted as the runtime baseline.
- Runtime hot-file ownership reserved.
- Relevant taxonomy baseline and P3-B09 handoff consumed as read-only input.

Read:

- `docs/agents/PHASE3-AGENT-CONTRACT.md`
- `TASK P3-B09` from this file
- `docs/reports/2026-09-10-p3-b09-create-and-activate-handoff.md`
- `artifacts/phase3-b09-create-and-activate-handoff.json`
- `docs/rules/FD-Game-Rules-Final.md` card creation, activation, source identity, and cleanup semantics only
- `docs/plans/fd-card-engine-stabilization-plan.md` Phase 3 only
- `docs/audits/fd-skill-mechanic-family-matrix.md` relevant `CREATE_AND_ACTIVATE` and remaining `CARD_ACTION_SEMANTICS` rows only
- `docs/audits/fd-skill-semantic-axis-matrix.md` relevant Drake and `create_card` rows only

May touch:

- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/src/ability/executable-card-pack.ts`
- `packages/rules/src/ability/types.ts` only if the primitive contract requires it
- focused mechanic tests
- scoped implementation report
- one scoped browser/server spec if required by Gate C candidate evidence

Must not touch:

- coverage KPI
- taxonomy classifier rules
- evidence classification
- scoped normal `PLAY` contract
- scoped `PLAY_SOURCE_RESPONSE` contract
- scoped `ADD_TO_ATTACK` contract
- scoped `ACTIVATE` contract
- scoped `CLOSE` contract
- unrelated card-action contracts
- broad Trigger runtime
- broad Lifecycle runtime
- Hidden projection runtime except source/created-card identity redaction required by the exact contract
- Battle result runtime
- roster-wide JSON

Hot files:

- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/src/ability/executable-card-pack.ts`

Concurrent conflicts:

- any other runtime task touching hot files

Required output:

- source-authoring inventory proving whether an exact `CREATE_AND_ACTIVATE` representative exists
- explicit handling of the current A finding that authoring has no `create_and_activate_card` or `activate_card` primitive and Drake `sc-drake-1.mount-summon` is `play_selected_cards`, not create-and-activate
- if no exact representative exists, record `RUNTIME_SEMANTIC_GAP` or `NO_ELIGIBLE_REPRESENTATIVE` and stop without runtime migration
- if an exact representative is proven, before/after legacy route count against the accepted post-P3-B08 baseline
- exact semantic routing proof
- create identity, ownership, source, activation zone, visibility, duplicate activation, and cleanup proof
- focused tests
- implementation report

Completion status allowed:

- `IMPLEMENTATION_COMPLETE_CANDIDATE`

Evidence rule:

- Codex B may produce implementer evidence only.
- Codex R must independently judge Gate A/B/C promotion.

## TASK P3-B10

Owner: Codex B
Status: READY_RUNTIME_OWNER
Branch: `codex/b-p3-b10-setup-create-to-skill`

Goal:

`SETUP_CARD_CREATION_MINIMAL:CREATE_TO_SKILL`.

Depends on:

- P3-B09 `NO_ELIGIBLE_REPRESENTATIVE` outcome accepted by independent review.
- Runtime hot-file ownership reserved.
- P3-B10 handoff consumed as read-only input.

Read:

- `docs/agents/PHASE3-AGENT-CONTRACT.md`
- `TASK P3-B10` from this file
- `docs/reports/2026-09-11-p3-b10-setup-create-to-skill-handoff.md`
- `artifacts/phase3-b10-setup-create-to-skill-handoff.json`
- `docs/rules/FD-Game-Rules-Final.md` Section 5.4 game-start ability ordering only
- `docs/plans/fd-card-engine-stabilization-plan.md` Phase 3 only
- `docs/audits/fd-skill-mechanic-family-matrix.md` `create_card` and `game_start` rows only
- canonical authoring for Maiya, Olga-Marie, Shinji, and Artoria Caster `create_card` abilities only

May touch:

- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/src/ability/executable-card-pack.ts`
- `packages/rules/src/ability/types.ts` only if the typed result contract requires it
- focused setup/create tests
- scoped implementation report
- one scoped browser/server spec if Gate C candidate evidence is attempted

Must not touch:

- coverage KPI
- taxonomy classifier rules
- evidence classification
- `CREATE_AND_ACTIVATE`
- optional post-battle creation
- source-card removal from hand
- deck insertion or shuffle semantics
- hidden choice or response windows
- battle-result runtime
- broad Trigger or Lifecycle runtime
- roster JSON
- unrelated card-action contracts

Hot files:

- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/src/ability/executable-card-pack.ts`

Concurrent conflicts:

- any other runtime task touching the hot files

Required output:

- inventory of all six canonical `create_card` abilities with eligible/skipped reason
- exact semantic route for `forced_trigger + game_start + one create_card -> skill + automatic`
- typed creation result containing created instance identity and count
- compiler fail-closed and runtime rollback evidence
- real MatchSession game-start evidence for the three exact eligible abilities
- explicit proof that the three Artoria Caster post-battle Luck abilities remain skipped
- before/after legacy/new/dual counts against the accepted post-P3-B08 runtime baseline
- implementation report

Completion status allowed:

- `IMPLEMENTATION_COMPLETE_CANDIDATE`

Evidence rule:

- Codex B may produce implementer evidence only.
- Codex R must independently judge Gate A/B/C promotion.

## Prompt Templates

Codex A startup prompt:

```text
You are Codex A for FD Phase 3.

Read docs/agents/PHASE3-AGENT-CONTRACT.md first.
Then read only the assigned TASK from docs/agents/PHASE3-TASK-INDEX.md.
Do not read the full parallel work queue unless the assigned task explicitly tells you to.
Do not modify files outside the assigned task's May touch list.
If you find a runtime semantic defect, record RUNTIME_SEMANTIC_GAP and stop; do not fix it.
Final status may only be AUTOMATION_BASELINE_CANDIDATE.
```

Codex B startup prompt:

```text
You are Codex B for FD Phase 3.

Read docs/agents/PHASE3-AGENT-CONTRACT.md first.
Then read only the assigned TASK from docs/agents/PHASE3-TASK-INDEX.md.
Do not read the full parallel work queue unless the assigned task explicitly tells you to.
You own runtime implementation only for this task's declared hot files.
Do not redefine taxonomy, KPI, or evidence classification.
Do not expand scope into Trigger, Lifecycle, Interaction, Hidden, or Battle runtime.
Final status may only be IMPLEMENTATION_COMPLETE_CANDIDATE.
```
