# Phase 3 Task Index

- Version: P3-TI-1.1
- Status: ACTIVE
- Scope: task-level startup index for Phase 3 agents
- Authority: subordinate to `docs/agents/PHASE3-AGENT-CONTRACT.md`

This file is the task lookup entry point for Phase 3 agents. Do not read the full `docs/plans/fd-phase-3-parallel-work-queue.md` by default. Read only the assigned task block below, then follow its explicit `Read` list.

## Flow Summary

1. Codex A owns measurement, automation, evidence packets, and taxonomy drift protection.
2. Codex B owns scoped runtime implementation, one hot-file lane at a time.
3. Codex R owns independent acceptance review and must stay read-only.
4. B runtime work may run in parallel with A documentation/tooling work only when B has exclusive ownership of its declared hot files.
5. B may not start the next runtime task until its previous implementation report exists and either R has reviewed it or the coordinator explicitly accepts the risk.

## TASK P3-A01

Owner: Codex A
Status: READY
Branch: `codex/a-p3-a01-coverage-automation`

Goal:

Phase 3 coverage and evidence automation baseline.

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
Status: READY_AFTER_P3_A01
Branch: `codex/a-p3-a02-review-packets`

Goal:

Generate reviewer packet templates and per-slice evidence checklists for current Card Action candidates.

Depends on:

- P3-A01 completed or an explicit reviewer-packet schema accepted by coordinator.
- B04 implementation report available for the first packet.

Read:

- `docs/agents/PHASE3-AGENT-CONTRACT.md`
- TASK P3-A02 only
- `docs/reports/2026-09-08-card-action-play-result.md`
- `docs/audits/fd-skill-primitive-conformance-matrix.md` relevant card-action rows only
- `docs/plans/fd-golden-card-and-flow-acceptance-plan.md` relevant Gate C evidence section only

May touch:

- `docs/reports/*checklist.md`
- `docs/reports/*review-packet.md`
- `docs/audits/*.mjs` only for packet generation

Do not touch:

- runtime files
- tests
- taxonomy KPI rules unless P3-A01 explicitly left them incomplete

Required output:

- B04 reviewer packet
- reusable packet template for B05-B09
- explicit missing-evidence list for R

Completion status allowed:

- `REVIEW_PACKET_BASELINE_CANDIDATE`

## TASK P3-A03

Owner: Codex A
Status: READY_AFTER_REVIEW
Branch: `codex/a-p3-a03-burndown-sync`

Goal:

Update coverage and legacy burn-down records after R reviews B04 or later B tasks.

Depends on:

- R review result for the relevant B task.
- A coverage command or manual baseline accepted for the task.

Read:

- `docs/agents/PHASE3-AGENT-CONTRACT.md`
- TASK P3-A03 only
- relevant R review report
- relevant B implementation report
- `docs/reports/fd-phase-3-throughput-baseline.md`

May touch:

- coverage output artifacts
- `docs/reports/fd-phase-3-throughput-baseline.md`
- relevant `docs/reports/*`

Do not touch:

- runtime files
- implementation tests
- evidence classification rules beyond recording R's result

Required output:

- updated legacy / new / dual count
- explicit accepted / rejected / pending status
- named next task dependency changes if needed

Completion status allowed:

- `COVERAGE_SYNC_CANDIDATE`

## TASK P3-R04

Owner: Codex R
Status: READY_AFTER_P3_B04
Branch: `codex/r-p3-r04-card-action-play-review`

Goal:

Independent review of `CARD_ACTION_SEMANTICS_MINIMAL_PLAY`.

Depends on:

- B04 implementation report and diff available.
- B04 test command output available.

Read:

- `docs/agents/PHASE3-AGENT-CONTRACT.md`
- TASK P3-R04 only
- `docs/rules/FD-Game-Rules-Final.md` card play semantics only
- B04 implementation report
- B04 diff
- B04 focused test output
- `docs/audits/fd-skill-mechanic-family-matrix.md` relevant `CARD_ACTION_SEMANTICS_MINIMAL_PLAY` rows only
- `docs/audits/fd-skill-primitive-conformance-matrix.md` relevant `play_selected_cards` row only

May inspect:

- runtime implementation diff
- focused tests
- evidence reports
- relevant source files touched by B04

Must not:

- implement fixes
- modify runtime
- modify tests
- redefine B04 scope
- promote based on implementer-only claims without fresh verification

Required output:

- findings ordered by severity
- rule conformance judgment
- secondary runtime path audit
- legacy fallback audit
- Gate A/B/C judgment or blocker list

Completion status allowed:

- `GATE_A_B_CANDIDATE_ACCEPTED`
- `IMPLEMENTATION_NEEDS_REVISION`
- `REJECTED`

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
- TASK P3-B04 only
- `docs/rules/FD-Game-Rules-Final.md` card play semantics only
- `docs/plans/fd-card-engine-stabilization-plan.md` Phase 3 only
- `docs/audits/fd-skill-mechanic-family-matrix.md` relevant `CARD_ACTION_SEMANTICS_MINIMAL_PLAY` rows only
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
Status: READY_AFTER_P3_R04
Branch: `codex/b-p3-b05-play-source-response`

Goal:

`CARD_ACTION_SEMANTICS_MINIMAL_PLAY_SOURCE_CARD_WITH_COST_RESPONSE`.

Depends on:

- P3-R04 accepts or clears B04 `PLAY` contract boundaries.
- Runtime hot-file ownership reserved.
- Fixed response-window source-card play representative selected.

Read:

- `docs/agents/PHASE3-AGENT-CONTRACT.md`
- TASK P3-B05 only
- `docs/rules/FD-Game-Rules-Final.md` response and card play semantics only
- `docs/reports/2026-09-08-card-action-play-source-response-result.md`
- `docs/audits/fd-skill-mechanic-family-matrix.md` relevant Volumen / play-source row only
- `docs/audits/fd-skill-primitive-conformance-matrix.md` `play_source_card` row only

May touch:

- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/src/ability/executable-card-pack.ts`
- focused response-play tests
- scoped implementation report

Must not touch:

- normal `PLAY` acceptance rules except shared helper fixes needed by B05
- `ADD_TO_ATTACK`
- `CREATE_AND_ACTIVATE`
- `ACTIVATE`
- `CLOSE`
- Trigger/Lifecycle/Interaction/Battle runtime beyond the exact response-play contract
- coverage KPI or taxonomy rules

Hot files:

- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/src/ability/executable-card-pack.ts`

Concurrent conflicts:

- any runtime task touching hot files

Required output:

- fixed cost payment proof
- source-card-in-hand revalidation proof
- response-window legality proof
- before/after legacy route count
- focused tests and implementation report

Completion status allowed:

- `IMPLEMENTATION_COMPLETE_CANDIDATE`

## TASK P3-B06

Owner: Codex B
Status: READY_AFTER_P3_R04_OR_COORDINATOR
Branch: `codex/b-p3-b06-add-to-attack`

Goal:

`CARD_ACTION_SEMANTICS_MINIMAL_ADD_TO_ATTACK`.

Depends on:

- B04 `PLAY` boundary understood, so ADD_TO_ATTACK cannot inherit normal play counters.
- Runtime hot-file ownership reserved.

Read:

- `docs/agents/PHASE3-AGENT-CONTRACT.md`
- TASK P3-B06 only
- `docs/rules/FD-Game-Rules-Final.md` attack/add/support card semantics only
- `docs/reports/2026-09-08-card-action-add-to-attack-result.md`
- `docs/audits/fd-card-action-add-to-attack-inventory.mjs`
- `docs/audits/fd-skill-mechanic-family-matrix.md` relevant ADD_TO_ATTACK row only

May touch:

- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/src/ability/executable-card-pack.ts`
- focused add-to-attack tests
- scoped implementation report

Must not touch:

- normal `PLAY` counters except tests proving ADD_TO_ATTACK does not consume them
- `PLAY_SOURCE_CARD_WITH_COST_RESPONSE`
- `CREATE_AND_ACTIVATE`
- `ACTIVATE`
- `CLOSE`
- Trigger/Lifecycle/Battle runtime beyond exact add-to-attack representative requirements
- coverage KPI or taxonomy rules

Hot files:

- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/src/ability/executable-card-pack.ts`

Concurrent conflicts:

- P3-B05, P3-B07, P3-B08, P3-B09, or any runtime task touching hot files

Required output:

- attach-to-existing-attack proof
- proof normal play counters are not consumed unless rule text says so
- target validation proof
- before/after legacy route count
- focused tests and implementation report

Completion status allowed:

- `IMPLEMENTATION_COMPLETE_CANDIDATE`

## TASK P3-B07

Owner: Codex B
Status: WAIT_TRIGGER_SPEC_OR_EXPLICIT_OVERRIDE
Branch: `codex/b-p3-b07-activate`

Goal:

`CARD_ACTION_SEMANTICS_MINIMAL_ACTIVATE`.

Depends on:

- Trigger/Event gateway spec reviewed if the activate representative depends on trigger timing.
- Runtime hot-file ownership reserved.
- Existing inactive target card activation scope confirmed.

Read:

- `docs/agents/PHASE3-AGENT-CONTRACT.md`
- TASK P3-B07 only
- `docs/reports/2026-09-08-card-action-activate-result.md`
- `docs/audits/fd-skill-mechanic-family-matrix.md` relevant ACTIVATE row only
- `docs/audits/fd-skill-semantic-axis-matrix.md` relevant activation ability rows only

May touch:

- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/src/ability/executable-card-pack.ts`
- `packages/rules/src/match-session.ts` only if the reviewed ACTIVATE contract explicitly requires scheduler or round-end ownership
- focused activate tests
- scoped implementation report

Must not touch:

- normal `PLAY`
- `ADD_TO_ATTACK`
- `CREATE_AND_ACTIVATE`
- `CLOSE`
- broad Trigger runtime
- broad Lifecycle runtime
- coverage KPI or taxonomy rules

Hot files:

- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/src/ability/executable-card-pack.ts`
- `packages/rules/src/match-session.ts` if reserved

Concurrent conflicts:

- any runtime task touching hot files

Required output:

- existing-card activation proof
- duplicate activation rejection
- trigger/scheduler dependency proof or explicit non-dependency
- before/after legacy route count
- focused tests and implementation report

Completion status allowed:

- `IMPLEMENTATION_COMPLETE_CANDIDATE`

## TASK P3-B08

Owner: Codex B
Status: WAIT_LIFECYCLE_SPEC_OR_EXPLICIT_OVERRIDE
Branch: `codex/b-p3-b08-close`

Goal:

`CARD_ACTION_SEMANTICS_MINIMAL_CLOSE`.

Depends on:

- Lifecycle/source-close cleanup boundary reviewed if close affects active source cleanup.
- Runtime hot-file ownership reserved.

Read:

- `docs/agents/PHASE3-AGENT-CONTRACT.md`
- TASK P3-B08 only
- `docs/reports/2026-09-08-card-action-close-result.md`
- `docs/audits/fd-skill-mechanic-family-matrix.md` relevant CLOSE row only
- `docs/audits/fd-skill-semantic-axis-matrix.md` relevant close/source lifecycle rows only

May touch:

- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/src/ability/executable-card-pack.ts`
- `packages/rules/src/match-session.ts` only if reviewed lifecycle cleanup requires it
- focused close tests
- scoped implementation report

Must not touch:

- targeted close
- close-then-activate
- `CREATE_AND_ACTIVATE`
- normal `PLAY`
- `ADD_TO_ATTACK`
- response-window close
- broad lifecycle cleanup matrix
- coverage KPI or taxonomy rules

Hot files:

- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/src/ability/executable-card-pack.ts`
- `packages/rules/src/match-session.ts` if reserved

Concurrent conflicts:

- any runtime task touching hot files

Required output:

- source-close proof
- destination / active-state cleanup proof
- stale duplicate rejection proof
- before/after legacy route count
- focused tests and implementation report

Completion status allowed:

- `IMPLEMENTATION_COMPLETE_CANDIDATE`

## TASK P3-B09

Owner: Codex B
Status: WAIT_INVENTORY_AND_GATEWAY_SPECS
Branch: `codex/b-p3-b09-create-and-activate`

Goal:

`CARD_ACTION_SEMANTICS_MINIMAL_CREATE_AND_ACTIVATE`.

Depends on:

- dedicated create-and-activate inventory proves one exact representative and skip reasons.
- Card Zone create contract reviewed.
- ACTIVATE boundary reviewed.
- Lifecycle/source identity boundary reviewed.
- Runtime hot-file ownership reserved.

Read:

- `docs/agents/PHASE3-AGENT-CONTRACT.md`
- TASK P3-B09 only
- relevant future create-and-activate inventory
- `docs/audits/fd-skill-mechanic-family-matrix.md` relevant CREATE_AND_ACTIVATE rows only
- `docs/audits/fd-skill-semantic-axis-matrix.md` relevant create/activate/lifecycle rows only

May touch:

- runtime hot files only after all dependencies are cleared
- focused create-and-activate tests
- scoped implementation report

Must not touch:

- broad create-card semantics
- broad activate semantics
- normal `PLAY`
- `ADD_TO_ATTACK`
- `CLOSE`
- hidden/private create flows
- special subsystem create flows
- coverage KPI or taxonomy rules

Hot files:

- to be declared by the future inventory before implementation starts

Concurrent conflicts:

- any runtime task touching declared hot files

Required output:

- inventory with exact representative and skip reasons
- create identity proof
- immediate activation proof
- lifecycle/source ownership proof
- before/after legacy route count
- focused tests and implementation report

Completion status allowed:

- `IMPLEMENTATION_COMPLETE_CANDIDATE`

## TASK P3-R05

Owner: Codex R
Status: READY_AFTER_EACH_B_TASK
Branch: `codex/r-p3-card-action-followup-review`

Goal:

Independent review for B05-B09 Card Action follow-up slices.

Depends on:

- corresponding B implementation report and diff.
- corresponding A reviewer packet when available.

Read:

- `docs/agents/PHASE3-AGENT-CONTRACT.md`
- TASK P3-R05 only
- relevant B task block
- relevant B implementation report
- relevant focused test output
- relevant canonical rule sections listed by the B task
- relevant mechanic matrix rows listed by the B task

May inspect:

- implementation diff
- focused tests
- generated evidence packet
- secondary runtime paths named by the task

Must not:

- implement fixes
- rewrite task scope
- merge independent card-action contracts
- accept inheritance across `PLAY`, `PLAY_SOURCE`, `ADD_TO_ATTACK`, `ACTIVATE`, `CLOSE`, and `CREATE_AND_ACTIVATE`

Required output:

- findings ordered by severity
- accepted evidence
- rejected evidence
- missing tests or residual risk
- Gate A/B/C judgment

Completion status allowed:

- `GATE_A_B_CANDIDATE_ACCEPTED`
- `IMPLEMENTATION_NEEDS_REVISION`
- `REJECTED`

## Prompt Templates

Codex A startup prompt:

```text
You are Codex A for FD Phase 3.

Read docs/agents/PHASE3-AGENT-CONTRACT.md first.
Then read only your assigned TASK block from docs/agents/PHASE3-TASK-INDEX.md.
Do not read the full parallel work queue unless your TASK block explicitly tells you to.
Do not modify files outside your TASK block's May touch list.
If you find a runtime semantic defect, record RUNTIME_SEMANTIC_GAP and stop; do not fix it.
Final status must be one of the statuses allowed by your TASK block.
```

Codex B startup prompt:

```text
You are Codex B for FD Phase 3.

Read docs/agents/PHASE3-AGENT-CONTRACT.md first.
Then read only your assigned TASK block from docs/agents/PHASE3-TASK-INDEX.md.
Do not read the full parallel work queue unless your TASK block explicitly tells you to.
You own runtime implementation only for this task's declared hot files.
Do not redefine taxonomy, KPI, or evidence classification.
Do not expand scope into Trigger, Lifecycle, Interaction, Hidden, or Battle runtime unless your TASK block explicitly permits that exact dependency.
Final status must be one of the statuses allowed by your TASK block.
```

Codex R startup prompt:

```text
You are Codex R for FD Phase 3.

Read docs/agents/PHASE3-AGENT-CONTRACT.md first.
Then read only your assigned TASK block from docs/agents/PHASE3-TASK-INDEX.md.
Default to READ ONLY.
Do not implement fixes while reviewing.
Do not merge independent card-action contracts for acceptance.
Return findings first, then Gate judgment.
Final status must be one of the statuses allowed by your TASK block.
```
