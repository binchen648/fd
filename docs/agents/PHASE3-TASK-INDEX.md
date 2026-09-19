# Phase 3 Task Index

- Version: P3-TI-1.39
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
6. Full-roster S work may run in parallel as a read-only intake lane under `PHASE3-FULL-ROSTER-COLLABORATION-CONTRACT.md`; it does not change current runtime task status.
7. B2 runtime work starts only from an explicit `READY` block after the active hot-file lane and all listed gates are closed.

## Full-Roster Flow

`P3-FS00 -> FS01 -> FS02 -> FS03 -> FS04 -> FS05 -> FA01 -> FR01` is analysis-only through F1. Runtime and migration work is dispatched later as `P3-FB2-*` and `P3-FM-*` against accepted contracts.

## TASK P3-CI01

Owner: Coordinator, with separate Codex A, Codex B, and Codex R stages
Status: READY

Goal: Restore a reproducible green Linux clean-checkout CI baseline without weakening tests or changing card-rule execution behavior.

Execution: `P3-CI01-A baseline/path portability -> P3-CI01-B content determinism -> P3-CI01-A integration -> P3-CI01-R acceptance`.

Read: `docs/agents/PHASE3-CI-BASELINE-REPAIR-PROMPT.md` and `docs/plans/2026-09-13-phase-3-ci-baseline-repair-plan.md`.

May run in parallel with: FS00-FS05 analysis, provided file leases do not overlap. It does not change B11/R06/A03 status.

Acceptance: GitHub Build and Test pass on Ubuntu; no new excludes, weakened assertions, runtime behavior changes, KPI changes, or Gate promotion.

## TASK P3-FS00

Owner: Codex S
Status: READY

Goal: Verify the read-only Reference repository, exact commit, clean status, required inputs, and deterministic hashes.

Read: full-roster collaboration contract; Tasks 2 only in the full-roster implementation plan.

May touch: `scripts/phase3-reference/**`, focused script tests, and `package.json` for the intake command.

Do not touch: `packages/**`, `apps/**`, coverage KPI definitions, current task statuses, or Gate judgments.

## TASK P3-FS01

Owner: Codex S
Status: READY_AFTER_FS00

Goal: Account for 943 unique static Reference skills and the known dynamic skill in a deterministic canonical identity inventory.

Depends on: P3-FS00 passes against the locked Reference commit.

Read: full-roster collaboration contract; Task 3 only in the full-roster implementation plan.

May touch: intake scripts/tests and `data/phase3/full-roster-ability-inventory.json`.

## TASK P3-FS02

Owner: Codex S
Status: WAIT_FS01

Goal: Preserve every printed rule clause with exact provenance or an explicit source block.

Read: Task 4 only in the full-roster implementation plan.

## TASK P3-FS03

Owner: Codex S
Status: WAIT_FS02

Goal: Normalize timing, trigger, condition, cost, target, effect, interaction, lifecycle, modifier, visibility, and binding axes without treating Reference handlers as authority.

Read: current semantic-axis definitions and Task 5 only in the full-roster implementation plan.

## TASK P3-FS04

Owner: Codex S
Status: WAIT_FS03

Goal: Map every ability to existing Phase 3 contracts, a generic capability request, a reviewed-special candidate, or an explicit block.

Read: current mechanic/primitive inventories and Task 6 only in the full-roster implementation plan.

## TASK P3-FS05

Owner: Codex S
Status: WAIT_FS04

Goal: Generate grouped user rule-decision packets and separate technical runtime capability requests.

Read: Task 7 only in the full-roster implementation plan.

## TASK P3-FA01

Owner: Codex A
Status: WAIT_FS05

Goal: Independently recompute Reference totals, identity coverage, clauses, categories, blocks, and capability membership without trusting S-generated totals.

Must not: repair runtime or semantic classifications while auditing.

## TASK P3-FR01

Owner: Codex R
Status: WAIT_FA01

Goal: Review all decisions and special candidates plus a stratified, reproducible sample across every mechanic wave.

Startup prompt: `docs/agents/PHASE3-FULL-ROSTER-REVIEWER-PROMPT.md` after replacing all commit and Reference-root placeholders.

Allowed result: `F0_ACCEPTED`, `F1_ACCEPTED`, or `INTAKE_NEEDS_REVISION`. No runtime Gate promotion.

## Phase 3 Objective Coverage Map

This map is the task-level bridge back to the total project goals. It does not promote any runtime, card, flow, or release status. Promotion still requires the acceptance route in `docs/FD-DOCUMENT-ROADMAP.md` and `docs/plans/fd-rules-conformance-and-acceptance.md`.

| Objective | Total Goal Reference | Implementation Path | Concrete Tasks | Current Status | Acceptance Vehicle | Remaining Gap |
|---|---|---|---|---|---|---|
| Agent ownership and read minimization | `docs/FD-DOCUMENT-ROADMAP.md` Mandatory Inputs; `docs/agents/PHASE3-AGENT-CONTRACT.md` | Agents read the contract first, then only the assigned task block and explicit dependencies. | All P3-A/P3-B/P3-R tasks | ACTIVE | Coordinator enforcement plus R review of role drift | Keep future task blocks small and explicit. |
| Automation / coverage / evidence baseline | Roadmap NEXT; throughput plan Sections 13-15 | Build reproducible coverage schema, taxonomy drift checks, legacy/new/dual counters, and reviewer packet inputs. | P3-A01 | REVIEW_ACCEPTED | Automation output plus reviewer-readable baseline candidate | Continue slice-specific classifier alignment without changing runtime semantics. |
| Reviewer packet generation | Acceptance route Gate A/B/C; Golden acceptance plan | Convert implementation claims into checklists and missing-evidence packets without changing runtime behavior. | P3-A02, P3-A04, P3-A05 | ACTIVE | R-consumable packets and machine-readable evidence | B10 alignment is a candidate; Resource Numeric packet is the next independent review input. |
| Legacy burn-down sync | Roadmap KPI: Legacy Burn-down plus Mechanic Coverage | Update metrics only after R judgment; preserve rejected/candidate/accepted separation. | P3-A03 | READY_AFTER_REVIEW | Coverage report with before/after legacy, semantic, dual, skipped, and Gate status counts | Waits for R review result and accepted measurement method. |
| Resource Numeric Core direct action | Stabilization plan Phase 3B; throughput plan first low-risk factory slice | Route command-spell style direct resource effects by executable semantic form with fail-closed validation. | P3-TO-08; A evidence support through P3-A01/A03 | IMPLEMENTATION_COMPLETE_CANDIDATE in current docs | Gate A/B/C evidence for representative direct-resource cards | Independent review and coverage sync still required before promotion. |
| Card Zone Core direct action | Stabilization plan Phase 3B; primitive conformance matrix | Route direct zone/draw movement by executable semantic form and remove ability-id pilot fallback. | P3-TO-09; R follow-up as needed | PENDING_REVIEW / candidate evidence recorded | Gate A/B/C representative card-zone evidence | Needs R judgment and burn-down sync. |
| Card Action semantic split | Roadmap Phase 3B; mechanic family and primitive matrices; `docs/plans/2026-09-12-phase-3-completion-execution-plan.md` | Keep `PLAY`, `PLAY_SOURCE_RESPONSE`, `ADD_TO_ATTACK`, `ACTIVATE`, `CLOSE`, `CREATE_AND_ACTIVATE`, and setup create-to-skill routing as separate contracts with only shared helpers underneath. | P3-B04 through P3-B10; P3-R04/P3-R05 | B10 REVIEW_ACCEPTED at `9fba6d9`; other slices retain their recorded judgments | Separate Gate A/B/C judgment per action contract | B09/B10 do not finish Phase 3; accepted slices still require A-owned coverage synchronization. |
| Result Binding | Roadmap Phase 3A; `docs/plans/fd-effect-result-binding-plan.md` | Bind multi-step effect results to subsequent costs, awards, events, rollback, and production path. | P3-B11 | REVIEW_ACCEPTED | Golden Eater plus Conversion Magic representative evidence | Accepted B11 scope remains exactly two representatives; no broader Result Binding inheritance is implied. |
| Target / Interaction Gateway | Roadmap NEXT; corrected semantic-axis matrix | Define target selection and pending interaction templates before broad runtime migration. | P3-TO-05; P3-TO-07; P3-TO-13 | SPEC_ACCEPTED / TO-07 REVIEW_ACCEPTED / TO-13 READY_RUNTIME_OWNER | 18 explicit / 11 strict pending denominator; shared stale/reconnect Gate C harness available | TO-13 may now take the exclusive runtime slot but still requires its own scoped Gate A/B/C evidence; no interaction row inherits correctness from the harness. |
| Trigger Gateway | Roadmap NEXT; corrected semantic-axis matrix | Define event payload, source ability/card identity, ordering, optional/forced handling, and projection rules. | P3-TO-03; P3-TO-11 | SPEC_ACCEPTED / TO-11 REVIEW_ACCEPTED | 37 strict trigger abilities; Shinji representative Gate A/B accepted | Scoped TO-11 migrated 1 of 2 inspected representatives; Ereshkigal remains `SOURCE_BATTLEFIELD_ANCHOR_REQUIRED`; all other Trigger rows still require scoped migration and independent review. |
| Lifecycle Gateway | Roadmap NEXT; corrected semantic-axis matrix | Define source-close, reset, persistence, cleanup, and duration ownership before broad migration. | P3-TO-04; P3-TO-12 | SPEC_ACCEPTED / TO-12 REVIEW_ACCEPTED | 11 explicit lifecycle/reset abilities; SC3 source-active representative Gate A/B/C accepted | TO-12 migrated exactly 1 scoped representative with dual=0; all other Lifecycle/reset rows still require scoped migration and independent review. |
| Modifier / Power / Battle Result Envelope | Roadmap blockers; stabilization plan current Phase 3B note | Keep high-risk battle and power behavior behind reviewed owner contracts; do not treat card-action success as battle readiness. | P3-TO-14; P3-TO-15; future B tasks | TO-14 SPEC_ACCEPTED / TO-15 SPEC_ACCEPTED | Representative modifier, power, and battle Gate A/B/C | Both owner contracts are accepted; any runtime implementation requires a fresh scoped B task and independent Gate evidence. |
| Golden Flow coverage | Roadmap release blockers; Golden acceptance plan | Prove browser/server/projection/reconnect paths for named flows, not raw card count. | Existing Golden Flow reports plus future R review | GOLDEN_FLOW_2_E2E_VERIFIED / other named flows pending | Golden Flow Gate B/C | Golden Flow 2 representative slice is independently accepted; release readiness remains blocked on the remaining required flows and global gates. |
| Release readiness | Roadmap Current Project Status and Acceptance Route | Close named Gate A/B/C gaps, eliminate conflicting runtime owners, and prove production paths. | Aggregate of A/B/R tasks | BLOCKED | Roadmap acceptance route plus independent release gate review | B09 alone cannot complete Phase 3 or release readiness. |

## TASK P3-A01

Owner: Codex A
Status: REVIEW_ACCEPTED
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
Status: READY
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
- B10 reviewer packet when B10 report is available
- reusable packet template for B05-B10
- explicit missing-evidence list for R

Completion status allowed:

- `REVIEW_PACKET_BASELINE_CANDIDATE`

## TASK P3-A03

Owner: Codex A
Status: READY
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

## TASK P3-A04

Owner: Codex A
Status: AUTOMATION_BASELINE_CANDIDATE
Branch: `codex/a-p3-a01-coverage-automation`

Goal:

Align Phase 3 coverage automation with the independently accepted P3-B10 `SETUP_CARD_CREATION_MINIMAL:CREATE_TO_SKILL` contract and reconcile the accepted B06-B08 classifier baseline.

Depends on:

- P3-B10 accepted at runtime commit `9fba6d9`.
- P3-A03 B10 reviewer packet available.

Read:

- `docs/agents/PHASE3-AGENT-CONTRACT.md`
- TASK P3-A04 only
- P3-A03 B10 reviewer packet from Codex A evidence commit `e7f7908`
- P3-B10 final implementation report at `9fba6d9`
- current `phase3-skill-coverage` output from Codex A's workspace as generated evidence only

May touch:

- `scripts/phase3-coverage.ts`
- `scripts/tests/phase3-coverage.test.ts`
- reports and machine-readable evidence artifacts

Must not touch:

- rule runtime semantics, primitive behavior, semantic routing, or `MatchSession`
- card authoring JSON
- Gate A/B/C promotion

Required output:

- semantic-shape classifier for B10 without card or ability ids
- cumulative B06-B08 classifier alignment
- positive, negative, and id-independence automation tests
- global legacy/new/dual counts and B10 synchronization report

Completion status allowed:

- `AUTOMATION_BASELINE_CANDIDATE`

## TASK P3-A05

Owner: Codex A
Status: AUTOMATION_BASELINE_CANDIDATE
Branch: `codex/a-p3-a01-coverage-automation`

Goal:

Package `RESOURCE_NUMERIC_CORE_DIRECT_ACTION` as independently reviewable evidence and reconcile its semantic consumers with the accepted coverage baseline.

Depends on:

- P3-A04 coverage alignment candidate exists.
- Resource Numeric implementation candidate and reviewer checklist exist.

Read:

- `docs/agents/PHASE3-AGENT-CONTRACT.md`
- TASK P3-A05 only
- `docs/reports/2026-09-08-resource-numeric-core-direct-action-result.md`
- `docs/reports/2026-09-08-resource-numeric-core-direct-action-review-checklist.md`
- current generated coverage and automation-audit artifacts from Codex A's workspace

May touch:

- reports and machine-readable evidence artifacts
- coverage/evidence automation tests only when an evidence-classification defect blocks the packet

Must not touch:

- runtime semantics, primitive behavior, semantic routing, `MatchSession`, or card authoring
- Gate A/B/C promotion

Required output:

- eligible/skipped inventory with reasons
- semantic-route and legacy-fallback boundary
- Gate A/B/C evidence-location checklist
- current legacy/new/dual counts
- reviewer-ready report and machine-readable packet

Completion status allowed:

- `AUTOMATION_BASELINE_CANDIDATE`

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

- P3-B05, P3-B07, P3-B08, P3-B09, P3-B10, or any runtime task touching hot files

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

## TASK P3-B10

Owner: Codex B
Status: REVIEW_ACCEPTED
Branch: `codex/b-p3-b10-setup-create-to-skill`

Goal:

Historical completed task: repair `SETUP_CREATE_TO_SKILL` semantic-form routing and duplicate-created-card provenance handling after failed independent review. The accepted runtime baseline is commit `9fba6d9`.

Depends on:

- Historical failed-review findings `CARD_SPECIFIC_SEMANTIC_EXCLUSION` and `EXISTING_CARD_PROVENANCE_ADOPTION`.
- Runtime hot-file ownership was reserved for the repair.
- The repair and focused evidence were accepted for downstream baseline use at `9fba6d9`.

Read:

- `docs/agents/PHASE3-AGENT-CONTRACT.md`
- TASK P3-B10 only
- relevant B10 failed review report or reviewer findings
- `docs/audits/fd-skill-semantic-axis-matrix.md` relevant setup/create-to-skill rows only
- relevant canonical setup/create card rule sections

May touch:

- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/executable-card-pack.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`
- focused setup/create-to-skill tests
- scoped B10 implementation report

Must not touch:

- coverage KPI or taxonomy rules
- reviewer packet classification
- unrelated card-action contracts
- trigger gateway runtime
- lifecycle gateway runtime
- broad special subsystem behavior

Hot files:

- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/executable-card-pack.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`

Concurrent conflicts:

- do not reopen the accepted B10 hot files from this historical task while B11 is active
- B10 coverage classification remains A-owned

Required repair:

- remove card-id-specific semantic exclusion such as `cardId !== 'card.luck'`
- prove routing is based on semantic axes, not definition id
- add a positive case showing an arbitrary valid card id with the same legal shape can route
- keep Artoria Caster excluded by its non-matching semantic form, not by its card id
- allow duplicate no-op only when the existing card was already generated by the same `sourceCardId`
- fail closed with `duplicate_created_card` when existing card provenance is missing or different
- prove fail-closed duplicate rejection leaves state, events, and revision unchanged

Required output:

- focused failing tests for both review blockers
- runtime repair
- focused passing test output
- B10 implementation report with before/after evidence
- explicit note that `phase3:coverage` still belongs to Codex A after R accepts the repair

Completion status allowed:

- `IMPLEMENTATION_COMPLETE_CANDIDATE`

Recorded outcome:

- Runtime baseline accepted for downstream work: `9fba6d9`.
- Coverage synchronization remains Codex A-owned and does not alter the runtime acceptance baseline.

## TASK P3-B11

Owner: Codex B
Status: READY
Branch: `codex/b-p3-b11-result-binding-production-bridge`

Goal:

Implement `RESULT_BINDING_PRODUCTION_BRIDGE` for the existing Golden Eater and Conversion Magic representatives only. Prove that validated typed results can be consumed by later nodes through the production `MatchSession` path, including staged interaction continuation and transactional rollback, without any legacy `resolveEffect` bypass.

Depends on:

- P3-B10 accepted by R05 at runtime baseline commit `9fba6d9`.
- P3-A03/A04 B10 automation sync may run in parallel and does not block B11.
- No outstanding R-required Resource Numeric or Card Zone runtime blocker.
- Codex B has exclusive ownership of the runtime hot files listed below.

Read:

- `docs/agents/PHASE3-AGENT-CONTRACT.md`
- TASK P3-B11 only
- `docs/reports/2026-09-12-p3-b11-result-binding-production-bridge-handoff.md`
- `artifacts/phase3-b11-result-binding-production-bridge-handoff.json`
- `docs/plans/fd-effect-result-binding-plan.md` only for result-envelope, rollback, and production-bridge requirements
- canonical Golden Eater and Conversion Magic authoring definitions only

May touch:

- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/executable-card-pack.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`
- focused result-binding and production-bridge tests
- `e2e/fd-golden-eater-result-binding.spec.ts`
- `e2e/support/build-golden-eater-snapshot.ts` only for the scoped Golden Eater room fixture
- `e2e/fd-conversion-magic-core-primitive.spec.ts` only for regression assertions required by this task
- scoped B11 implementation report

Must not touch:

- cards or abilities outside Golden Eater and Conversion Magic
- coverage KPI, taxonomy, classifier, or evidence-promotion rules
- broad Target/Interaction, Trigger, Lifecycle, Battle, Modifier, or Hidden Information runtime
- card- or ability-id fallback routing
- unrelated client/server behavior
- Gate A/B/C status promotion

Hot files:

- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/executable-card-pack.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`

Concurrent conflicts:

- any runtime task touching the same hot files
- any attempt by Codex A or R to edit runtime while B11 is active

Required implementation contract:

- route only a compiler-validated, fully supported result-binding graph; routing eligibility must be semantic and must not depend on Golden Eater or Conversion Magic ids
- retain Conversion Magic as the no-interaction control for `move_all_remaining -> movedCount -> adjust_mana`
- migrate Golden Eater through the same typed binding infrastructure while preserving its two server-owned target stages and optional 7-mana branch
- persist only the minimum validated continuation data needed across pending interaction stages; never accept client-supplied binding values
- use dispatch transaction boundaries: a failed first stage commits nothing; a failed second stage preserves the already committed first stage but rolls back payment, movement, VP, events, and revision from the failing dispatch
- reject compiler, binding, target-reference, and runtime invariant failures as `resolution_failed` without calling legacy `resolveEffect`
- leave unsupported result-binding or interaction shapes on their existing route and report them as skipped; do not broaden eligibility to improve counts

Required output:

- focused compiler and runtime negative tests written before implementation
- real `MatchSession.dispatchPlayerAction` proof for both representatives
- interaction continuation, reconnect/projection, stale replay, and rollback evidence appropriate to Golden Eater
- regression proof that Conversion Magic still settles mana from actual `movedCount`
- explicit legacy-bypass instrumentation or equivalent proof for eligible success and failure paths
- B11 implementation report with before/after `legacyResolveEffect`, `newRuntimeSemanticRouted`, `dualRuntime`, local eligible/migrated/skipped counts, and unchanged skipped abilities
- explicit note that global KPI/classifier synchronization belongs to Codex A after R judgment

Completion status allowed:

- `IMPLEMENTATION_COMPLETE_CANDIDATE`

## TASK P3-R05

Owner: Codex R
Status: READY_AFTER_EACH_B_TASK
Branch: `codex/r-p3-card-action-followup-review`

Goal:

Independent review for B05-B10 Card Action follow-up slices.

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

## TASK P3-R06

Owner: Codex R
Status: READY_AFTER_P3_B11
Branch: reviewer-selected read-only workspace

Goal:

Independently review P3-B11 Result Binding Production Bridge without implementing fixes or inheriting acceptance from B10, Conversion Magic, or historical Golden Eater evidence.

Depends on:

- P3-B11 implementation report and clean diff.
- Focused Gate A/B evidence and relevant Gate C production-path evidence.
- Codex A packet when available; absence of classifier support must be reported, not repaired by R.

Read:

- `docs/agents/PHASE3-AGENT-CONTRACT.md`
- TASK P3-R06 only
- TASK P3-B11
- P3-B11 handoff, implementation report, focused test output, and diff
- `docs/plans/fd-effect-result-binding-plan.md` relevant acceptance sections only
- canonical Golden Eater and Conversion Magic definitions

Must not:

- implement fixes
- broaden P3-B11 to other cards or gateway families
- accept client-authored result bindings
- infer Gate C from unit tests or historical candidate reports
- change coverage KPI or classifier behavior

Required output:

- findings ordered by severity
- semantic-routing and no-legacy-bypass judgment
- transaction/rollback and interaction-continuation judgment
- Gate A/B/C judgment per representative
- explicit residual risks and A synchronization input

Completion status allowed:

- `GATE_A_B_CANDIDATE_ACCEPTED`
- `IMPLEMENTATION_NEEDS_REVISION`
- `REJECTED`

## TASK P3-B13

Owner: Codex B
Status: READY
Branch: `codex/b-p3-b13-battle-loss-resource-r1`

Goal:

Implement the first runtime slice from the accepted P3-TO-14 Battle Result / Scoring / Resource envelope: defer ordinary battle-result trigger settlement until the phase-wide base-scoring barrier is satisfied, and migrate the exact Shinji `clown.lose-command-seal` forced loss trigger through the typed Resource runtime without legacy fallback.

Depends on:

- current-lineage A03 TO10 sync baseline `64dbd16927fc9df4a03b235d2e882534fb8b659e`;
- P3-TO-14 Battle Result / Scoring / Resource specification accepted as design only;
- P3-TO-03 Trigger Gateway accepted;
- P3-TO-08 Resource Numeric current-lineage slice accepted;
- P3-TO-10/B07 authoritative first-loss runtime accepted and must remain compatible;
- exclusive ownership of the B13 runtime hot files while this task is active.

Read:

- `docs/agents/PHASE3-AGENT-CONTRACT.md`
- TASK P3-B13 only
- `docs/reports/2026-09-14-p3-b13-battle-loss-resource-handoff.md`
- `docs/plans/2026-09-14-p3-to-14-battle-resource-envelope.md` sections 3, 6, 7, 8, 9, 10, 13, and 14 only
- `docs/audits/2026-09-14-p3-to-14-battle-integration-map.md` only for the Shinji row and direct-consumer denominator
- canonical `master.shinji.skill.clown#clown.lose-command-seal` authoring definition
- existing Shinji, battle, scoring, Trigger, Resource, and Olga first-loss tests required by the handoff

May touch:

- `packages/rules/src/match-session.ts`
- `packages/rules/src/core/combat-resolver.ts`
- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/types.ts`
- `packages/rules/src/ability/executable-card-pack.ts` only if compiler fail-closed support requires it
- `packages/rules/src/ability/resolution-dataflow.ts` only if narrow shared typed Resource integration requires it
- focused B13 unit/regression tests
- scoped B13 browser/server E2E and its dedicated fixture/support code
- scoped B13 implementation report

Must not touch:

- coverage KPI, taxonomy, classifier, or evidence-promotion rules
- authoring text or card identities to make the representative fit
- other 12 direct TO14 result/phase-terminal consumer migrations
- broad Battle/Modifier/Power/Hidden/Interaction/Movement/Lifecycle/Special migration
- no-eligible-winner game policy
- unrelated client/server behavior
- Gate A/B/C promotion
- card- or ability-ID routing/fallback

Hot files:

- `packages/rules/src/match-session.ts`
- `packages/rules/src/core/combat-resolver.ts`
- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/types.ts`
- compiler/data-flow files only if actually required by the narrow semantic route

Concurrent conflicts:

- any runtime task writing the same hot files
- any A/R attempt to edit runtime while B13 is active

Required implementation contract:

- remove the production ordering gap where per-battlefield `after_battle_result_determined` currently settles ordinary result/win/loss continuations before all battlefield base scoring completes;
- keep a phase-wide post-scoring barrier for the claimed production path and prove it with at least two resolved battlefields;
- provide stable server-authored `battlePhaseResolutionId`, `battleId`, `resultId`, and `battlefieldId` facts for battle-derived events used by this slice;
- preserve authoritative TO10/B07 first-loss history/ordinal semantics while moving production settlement behind the scoring barrier;
- route the exact semantic form `forced_trigger + after_controller_loses_battle + one controller adjust_command_seals integer effect` through typed resolution-dataflow;
- classifier eligibility must be semantic and identity-free; a synthetic same-shape ability must route, malformed near-miss shapes must fail closed or remain out of scope;
- no supported B13 path may call legacy `resolveEffect` after classification;
- reconnect, projection, stale commands, or settlement re-entry must not duplicate the command-seal loss or first-loss staging;
- do not infer migration or Gate acceptance for sibling Battle consumers.

Required output:

- focused failing tests before/with implementation for early-settlement ordering and typed Shinji routing;
- single-battle and two-battlefield production `MatchSession` proof;
- exactly-once/re-entry proof;
- no-loss negative proof;
- TO10/B07 Olga first-loss compatibility proof;
- fresh browser/server Gate C with authoritative loss, reconnect, stale rejection, and no duplicate command-seal mutation;
- accepted-current-lineage compatibility regressions listed by the handoff;
- B13 implementation report with exact candidate scope, legacy/new/dual local facts, test output, residual risks, and explicit A-owned global coverage boundary.

Completion status allowed:

- `IMPLEMENTATION_COMPLETE_CANDIDATE`

## TASK P3-R07

Owner: Codex R
Status: READY_AFTER_P3_B13
Branch: reviewer-selected fresh worktree/branch from exact B13 candidate SHA

Goal:

Independently review P3-B13 Battle Loss Resource Trigger runtime without implementing fixes or inheriting acceptance from TO14 specification, TO08 Resource, TO10/B07 first-loss, or historical battle tests.

Depends on:

- frozen P3-B13 candidate SHA, implementation report, and clean diff;
- fresh Gate A/B/C evidence from B13;
- A-owned handoff and accepted TO14 spec as scope authority.

Read:

- `docs/agents/PHASE3-AGENT-CONTRACT.md`
- TASK P3-R07 only
- TASK P3-B13
- `docs/reports/2026-09-14-p3-b13-battle-loss-resource-handoff.md`
- B13 implementation report and exact candidate diff
- P3-TO-14 sections explicitly listed by B13
- canonical Shinji Clown authoring row

Must not:

- implement fixes while reviewing
- broaden review into the other 38 Battle-integration abilities
- infer phase-wide barrier correctness from single-battle evidence
- accept legacy fallback or representative-ID routing
- infer Gate C from historical B07/Golden Flow evidence
- change coverage KPI/classifier or synchronize A03

Required independent checks:

- reproduce typecheck and focused B13 semantic/fail-closed tests;
- verify Shinji supported path is typed and has no legacy `resolveEffect` bypass;
- adversarially verify two-battlefield ordering: all base scoring is committed before loss-trigger resource settlement;
- verify stable server-owned battle identities and exactly-once behavior;
- verify reconnect/stale revision does not duplicate command-seal loss;
- verify Olga first-loss still uses authoritative history/ordinal and remains round-end delayed;
- run relevant TO08/TO09/TO10/TO11/TO12/TO13 compatibility evidence;
- run fresh B13 Gate C, not historical inherited proof;
- compare full root baseline and report only new deterministic failures as B13 blockers.

Required output:

- findings ordered by severity;
- phase-wide barrier judgment;
- semantic-routing/no-legacy-bypass judgment;
- exactly-once/reconnect/stale judgment;
- TO10/B07 compatibility judgment;
- Gate A/B/C judgment;
- explicit A03 synchronization input if accepted.

Completion status allowed:

- `GATE_A_B_CANDIDATE_ACCEPTED`
- `IMPLEMENTATION_NEEDS_REVISION`
- `REJECTED`

## TASK P3-B14

Owner: Codex B
Status: READY
Branch: `codex/b-p3-b14-shared-victory-vp-r1`

Goal:

Implement the second narrow runtime slice from the accepted P3-TO-14 Battle Result / Scoring / Resource envelope: migrate exactly Artoria Caster `sc-artoriac-6.gain-vp-if-not-sole-winner` through the post-scoring result event and typed Victory Point Resource runtime, without legacy fallback or identity routing.

Depends on:

- reviewer-accepted P3-B13 runtime `37189b32d4de0da3a8eabdca8edbf674c8852d97`;
- P3-R07 acceptance `f1fa9c12ac43ab96050468f52070fc7ea53fd09d`;
- A03 B13 synchronization `60560bc7c085dff3a7ff67e7a6b2d119150b13ad`;
- P3-TO-14 Battle Result / Scoring / Resource specification accepted as design;
- accepted Trigger Gateway, typed Resource Numeric primitives, and SOURCE_ACTIVE lifecycle policy;
- exclusive ownership of the B14 runtime hot files while this task is active.

Read:

- `docs/agents/PHASE3-AGENT-CONTRACT.md`
- TASK P3-B14 only
- `docs/reports/2026-09-14-p3-b14-shared-victory-vp-handoff.md`
- `docs/plans/2026-09-14-p3-to-14-battle-resource-envelope.md` only for result-event/scoring ordering and winner facts
- `docs/audits/2026-09-14-p3-to-14-battle-integration-map.md` only for direct-consumer denominator and this representative row
- canonical `servant.artoriac.skill.sc-artoriac-6#sc-artoriac-6.gain-vp-if-not-sole-winner` authoring definition
- B13 post-scoring barrier tests and existing Artoria Caster battle-result/resource tests required by the handoff

May touch:

- `packages/rules/src/ability/executable-card-pack.ts`
- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/resolution-dataflow.ts` only if the existing typed VP primitive needs a narrow generic correction
- `packages/rules/src/match-session.ts` only if the accepted result payload is missing a generic winner fact required by this exact shape
- focused B14 unit/regression tests
- scoped B14 browser/server E2E and dedicated fixture/support code
- scoped B14 implementation report

Must not touch:

- coverage KPI, taxonomy, classifier, or evidence-promotion rules
- authoring text/card identities to make the representative fit
- Tomoe `penalty-on-defeat` or its unpreventable-loss semantics
- optional Noble Bloom / pilgrim win triggers
- other remaining TO14 direct-consumer migrations
- TO15 Modifier/Power runtime
- Hidden Information, Movement, Special subsystem, or broad Lifecycle work
- card- or ability-ID routing/fallback
- Gate A/B/C promotion

Hot files:

- `packages/rules/src/ability/executable-card-pack.ts`
- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/resolution-dataflow.ts` only if required
- `packages/rules/src/match-session.ts` only if required by generic result facts

Required implementation contract:

- classify by semantic form, not representative identity;
- exact shape is `forced_trigger + after_battle_result_determined + combat/immediate + SOURCE_ACTIVE + controller_won_battle + not(controller_sole_winner) + one controller adjust_victory_points(+2)`;
- exact supported shape must route through typed resolution-dataflow and must not call legacy `resolveEffect` after classification;
- reward must settle only from B13's authoritative post-scoring result event;
- reward applies when the controller is one of multiple winners, and must not apply for sole win, loss, inactive source, malformed conditions, malformed amount, or unrelated result events;
- base battle scoring must be committed before the +2 VP trigger reward;
- reconnect, stale revision, result-event replay, or battle-phase re-entry must not award the +2 VP twice;
- no sibling TO14 consumer inherits migration or Gate status from this slice.

Required output:

- focused red/green tests for exact semantic classifier and near-miss shapes;
- shared-winner positive, sole-winner negative, loss negative, inactive-source negative;
- production proof that base scoring precedes the +2 trigger reward;
- exactly-once/re-entry proof;
- B13 Shinji and TO10/Trigger/Lifecycle compatibility evidence;
- fresh browser/server Gate C proving shared winner reward, reconnect, stale rejection, and no duplicate VP award;
- B14 implementation report with exact candidate scope, tests, residual risks, and A-owned coverage boundary.

Completion status allowed:

- `IMPLEMENTATION_COMPLETE_CANDIDATE`

## TASK P3-R08

Owner: Codex R
Status: READY_AFTER_P3_B14
Branch: reviewer-selected fresh worktree/branch from exact B14 candidate SHA

Goal:

Independently review P3-B14 Shared Victory VP runtime without implementing fixes or inheriting acceptance from B13, TO14 specification, direct Resource tests, or historical Artoria Caster interpreter behavior.

Depends on:

- frozen P3-B14 candidate SHA, implementation report, and clean diff;
- fresh Gate A/B/C evidence from B14;
- A-owned B14 handoff and accepted TO14 spec as scope authority.

Read:

- `docs/agents/PHASE3-AGENT-CONTRACT.md`
- TASK P3-R08 only
- TASK P3-B14
- `docs/reports/2026-09-14-p3-b14-shared-victory-vp-handoff.md`
- B14 implementation report and exact candidate diff
- canonical Artoria Caster SC6 authoring row

Must not:

- implement fixes while reviewing
- broaden review into Tomoe, optional Battle result triggers, or the remaining TO14 rows
- infer post-scoring correctness from B13 without fresh B14 evidence
- accept legacy fallback or representative-ID routing
- change coverage KPI/classifier or synchronize A03

Required independent checks:

- reproduce typecheck and focused semantic/fail-closed tests;
- verify exact supported shape uses typed `adjust_victory_points` with no legacy bypass;
- adversarially verify shared winner positive versus sole winner/loss/source-inactive negatives;
- verify base scoring is committed before trigger VP reward;
- verify stable battle identities, exactly-once, reconnect and stale rejection;
- verify B13 Shinji and accepted Trigger/Lifecycle/Card Action boundaries remain green;
- run fresh B14 Gate C;
- compare full root baseline and report only new deterministic failures as blockers.

Required output:

- findings ordered by severity;
- semantic-routing/no-legacy-bypass judgment;
- shared-winner/sole-winner/result ordering judgment;
- exactly-once/reconnect/stale judgment;
- compatibility judgment;
- Gate A/B/C judgment;
- explicit A03 synchronization input if accepted.

Completion status allowed:

- `GATE_A_B_CANDIDATE_ACCEPTED`
- `IMPLEMENTATION_NEEDS_REVISION`
- `REJECTED`

## TASK P3-B15

Owner: Codex B
Status: READY
Branch: `codex/b-p3-b15-terminal-card-zone-r1`

Goal:

Implement the next narrow TO14 runtime slice for Ereshkigal `sc-ereshkigal-2.return-to-skill-zone`: add the generic phase-terminal `after_battle_ended` producer and an identity-free typed source-card-to-zone primitive sufficient to return the active source card to the controller skill zone.

Depends on:

- reviewer-accepted P3-B14 runtime `6ef5fa69cab1d51d1681e525410a93172ee7a714`;
- P3-R08 acceptance `32be96d5d31107c72913881be12ea4b8513c7360`;
- A03 B14 synchronization `b500052ec39cf904c7d60f23e809d77a898dfcc0`;
- accepted TO14 phase-wide post-scoring barrier and phase-terminal ordering contract;
- accepted Trigger Gateway and Card Zone ownership boundaries.

Representative:

`servant.ereshkigal.skill.sc-ereshkigal-2#sc-ereshkigal-2.return-to-skill-zone`

Required semantic form:

- `forced_trigger`;
- `activation.phase = combat`;
- `activation.trigger = after_battle_ended`;
- no conditions/targets/cost/creates/ruleModifiers/lifecycle/response/limit;
- exactly one source-card move to controller `skill`;
- classification and runtime routing are structural, never representative-ID based.

Required phase-terminal contract:

- emit exactly one server-owned `after_battle_ended` event per authoritative `battlePhaseResolutionId`;
- never emit once per battlefield;
- emit only after all queued ordinary post-battle result/win/loss/first-loss consumers are terminal;
- emit before cleanup can discard/close battle cards;
- preserve stable phase identity plus ordered battle/result/scoring-receipt references required by TO14;
- reconnect, stale command, replay, or battle-phase re-entry must not emit/settle it twice;
- MatchSession and core game-loop paths must agree.

Required Card Zone primitive contract:

- generic typed source-card move, not an Ereshkigal-specific handler;
- validate source exists, belongs/is controlled by the ability controller, and is in a supported active-board source zone for this semantic;
- moving to `skill` sets controller ownership, owner-only visibility, and inactive source state;
- malformed controller/source/zone/destination fails closed atomically;
- exact supported B15 semantic must use typed resolution-dataflow and must not fall through to legacy `resolveEffect`.

May touch:

- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/executable-card-pack.ts`
- `packages/rules/src/ability/types.ts` if stable terminal-event payload/runtime state requires it
- `packages/rules/src/match-session.ts`
- `packages/rules/src/core/game-loop.ts`
- narrowly shared battle-terminal helper if needed
- focused B15 regression/unit tests
- one scoped browser/server Gate C fixture/spec
- B15 implementation report

Must not touch:

- Gatou `seeker.battle-end-reward` directive semantics
- Tomoe unpreventable defeat penalty
- optional battle-result/win triggers
- Olga transform/Special subsystem
- TO15 Modifier/Power runtime
- coverage KPI/classifier/taxonomy
- unrelated Hidden Information, Movement, Interaction, or broad Lifecycle work
- representative card/ability identity routing

Required evidence:

- red/green semantic classifier and typed primitive tests;
- terminal event exactly-once and no-per-battlefield-duplicate proof;
- proof terminal event waits until prior post-battle queue is terminal;
- proof source returns to skill before cleanup would discard it;
- wrong controller/source zone/destination fail-closed atomicity;
- MatchSession and core game-loop consistency;
- B13/B14 and Trigger/Card Zone/Lifecycle compatibility;
- real remote-room Chromium evidence with reconnect + stale revision + no duplicate terminal move;
- full root baseline comparison and production identity/legacy-bypass audit.

Completion status allowed:

- `IMPLEMENTATION_COMPLETE_CANDIDATE`

## TASK P3-R09

Owner: Codex R
Status: READY_AFTER_P3_B15
Branch: reviewer-selected fresh worktree/branch from exact B15 candidate SHA

Goal:

Independently review P3-B15 terminal Battle -> Trigger -> typed Card Zone runtime without implementing fixes or inheriting acceptance from B13/B14/TO14 specification.

Required independent checks:

- fresh typecheck and focused/compatibility tests;
- independently verify `after_battle_ended` is produced exactly once per battle phase, never per battlefield, only after prior post-battle consumers are terminal, and before cleanup;
- independently verify stable terminal identity/re-entry/reconnect/stale behavior;
- adversarially verify source-card move controller/zone/destination checks and atomic fail-closed behavior;
- verify exact supported semantic uses typed resolution-dataflow with no identity branch or legacy bypass;
- verify MatchSession and core game-loop parity;
- run fresh Chromium Gate C;
- run full root baseline and block only on new deterministic failures.

Must not:

- implement fixes while reviewing;
- promote Gatou, Tomoe, optional result triggers, Special, TO15 or any sibling TO14 row;
- modify A-owned coverage KPI/taxonomy.

Required output:

- findings ordered by severity;
- phase-terminal ordering/exactly-once judgment;
- typed Card Zone / fail-closed judgment;
- MatchSession/core parity judgment;
- Gate A/B/C judgment;
- explicit A03 synchronization input if accepted.

Completion status allowed:

- `GATE_A_B_CANDIDATE_ACCEPTED`
- `IMPLEMENTATION_NEEDS_REVISION`
- `REJECTED`

## TASK P3-B16

Owner: Codex B
Status: READY
Branch: `codex/b-p3-b16-battle-loss-reveal-r1`
Base: exact P3-B16 handoff commit

Goal:

Migrate exactly one additional TO14 direct consumer, Achilles `sc-achilles-1.achilles-heel`, from legacy `reveal_information` to a reusable typed Visibility primitive while preserving the accepted B13/B14/B15 battle ordering.

Exact supported semantic:

- `forced_trigger`;
- trigger `after_controller_loses_battle`;
- no optional response, conditions, targets, cost, creates, modifiers, lifecycle or limit;
- exactly one `reveal_information(scope=servant_package, subject=controller.servant)` effect;
- structural classification only, never representative-ID routing.

Required runtime contract:

- reuse authoritative `abilityRuntime.revealedServants` as the single reveal truth source;
- normalize the exact supported effect to a generic typed Visibility primitive;
- first reveal mutates revealed-servant state and emits typed `servant_package_revealed` evidence with stable resolution provenance;
- repeated reveal is idempotent and emits no duplicate reveal event;
- invalid controller/scope/subject or malformed same-family shape fails closed atomically;
- exact supported semantics execute through typed resolution-dataflow before legacy fallback;
- consume the existing stable post-scoring `after_controller_loses_battle` event without altering battle ordering;
- frozen battle participant eligibility remains authoritative for a loser eliminated by base scoring.

May touch:

- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/executable-card-pack.ts`
- `packages/rules/src/ability/types.ts` only if typed reveal evidence requires a narrow shared type update
- focused B16 regression/unit tests
- one scoped remote-room/browser Gate C spec/fixture
- B16 implementation report

Must not touch:

- battle/scoring pipeline ordering except a concrete regression fix proven necessary by B16;
- Gatou directive semantics;
- Tomoe unpreventable defeat penalty;
- Olga transform/Special subsystem;
- Artoria Alter/Caster optional battle-result or Luck triggers;
- declaration-reveal `on_use_declared` abilities;
- broad Hidden/Visibility/private-look runtime;
- TO15 Modifier/Power runtime;
- TO16 Special runtime;
- coverage KPI/classifier/taxonomy;
- representative identity routing.

Required evidence:

- red/green identity-free semantic classifier tests;
- typed reveal success plus `servant_package_revealed` evidence;
- already-revealed idempotence;
- invalid controller/scope/subject and near-miss fail-closed atomicity;
- real production loss path and no-loss negative;
- stable event replay dedupe;
- loser-eliminated-by-scoring frozen-participant case;
- B13/B14/B15 compatibility;
- Chromium remote-room proof with public projection, reconnect, stale revision and no duplicate reveal;
- full root baseline comparison and production identity/legacy-bypass audit.

Completion status allowed:

- `IMPLEMENTATION_COMPLETE_CANDIDATE`

## TASK P3-R10

Owner: Codex R
Status: READY_AFTER_P3_B16
Branch: reviewer-selected fresh worktree/branch from exact B16 candidate SHA

Goal:

Independently review P3-B16 battle-loss servant-package reveal without implementing fixes or inheriting acceptance from B13/B14/B15.

Required independent checks:

- fresh typecheck and focused/compatibility tests;
- independently prove exact-shape classification is identity-free and malformed near-misses fail closed;
- verify typed reveal uses the existing revealed-servant truth source and duplicate reveal is idempotent;
- verify loss-trigger settlement occurs after base scoring and before phase-terminal B15 work;
- verify frozen-participant eligibility for a loser eliminated by same-battle scoring;
- verify no-loss and stable-event replay negatives;
- verify exact supported semantic uses typed resolution-dataflow with no identity branch or legacy bypass;
- run fresh Chromium Gate C for public projection, reconnect, stale revision and exactly-once reveal evidence;
- run full root baseline and block only on new deterministic failures.

Must not:

- implement fixes while reviewing;
- promote Gatou, Tomoe, Olga, optional result/win triggers, broad Hidden/Visibility, TO15 or TO16;
- modify A-owned coverage KPI/taxonomy.

Required output:

- findings ordered by severity;
- typed Visibility/fail-closed/idempotence judgment;
- battle ordering/frozen-participant judgment;
- projection/reconnect/stale judgment;
- Gate A/B/C judgment;
- explicit A03 synchronization input if accepted.

Completion status allowed:

- `GATE_A_B_CANDIDATE_ACCEPTED`
- `IMPLEMENTATION_NEEDS_REVISION`
- `REJECTED`

## TASK P3-B17

Owner: Codex B
Status: READY
Branch: `codex/b-p3-b17-olga-first-loss-recert-r1`
Base: exact P3-B17 A-owned handoff commit

Goal:

Recertify the already semantic-routed Olga-Marie `astronomical-science.first-loss` ACTIVATE composition as one TO14 direct result-event consumer on the current B13-B16 battle lineage. This task is evidence-first and must not create production runtime churn unless fresh testing proves a concrete blocker.

Exact composition:

- `forced_trigger` + `after_controller_first_loses_battle`;
- authoritative post-scoring first-loss event with stable battle/result identity and `lossOrdinal=1`;
- exactly one staged delayed activation;
- no immediate activation during battle-result settlement;
- formal `round_end` consumption only;
- typed `activate_card_by_id(master.olga-marie.skill.trismegistus-grief)`;
- structural routing only, never representative identity routing.

May touch by default:

- focused B17 regression tests/assertions;
- `e2e/fd-olga-activate-card-action.spec.ts` only to strengthen TO14 ordering/exactly-once assertions if needed;
- B17 implementation/recertification report.

Production runtime files may be touched only after a fresh failing test demonstrates a concrete blocker. Any such repair must be narrow and documented before modification.

Must not promote:

- `trismegistus.loss-transform`, soul-drag, or return-silence;
- broad delayed scheduling;
- Gatou/Tomoe/Artoria optional battle consumers;
- broad Card Action, TO15 Modifier/Power, or TO16 Special runtime;
- A-owned coverage KPI/classifier/taxonomy.

Required evidence:

- typecheck;
- identity-free ACTIVATE classifier and near-miss negatives;
- real MatchSession scoring -> barrier -> first-loss dispatch ordering;
- stable first-loss provenance and exactly-once staging;
- scoring-eliminated Olga same-battle eligibility;
- formal round-end activation exactly once and typed evidence;
- atomic invalid-target negatives;
- B13/B16 compatibility;
- Chromium projection/reconnect/stale/no-duplicate proof;
- full root baseline comparison.

Completion status allowed:

- `RECERTIFICATION_COMPLETE_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`

## TASK P3-R11

Owner: Codex R
Status: READY_AFTER_P3_B17
Branch: reviewer-selected fresh worktree/branch from exact B17 candidate SHA

Goal:

Independently determine whether the already accepted ACTIVATE route, composed with the current post-scoring first-loss producer, satisfies the TO14 direct-consumer contract end to end.

Required independent checks:

- fresh typecheck/focused compatibility;
- verify first-loss is server-derived after base scoring with stable provenance and ordinal;
- verify duplicate/re-entry/history paths cannot stage a second activation;
- verify no immediate activation before formal `round_end`;
- verify round-end typed ACTIVATE exactly once and invalid targets fail atomically;
- verify scoring-eliminated controller frozen-participant eligibility;
- verify production routing remains identity-free and no new legacy bypass is introduced;
- fresh remote-room Chromium projection/reconnect/stale proof;
- full root baseline with no new deterministic failures.

Must not implement fixes while reviewing or promote sibling TO14/TO15/TO16 scope.

Required output:

- findings ordered by severity;
- TO14 ordering/exactly-once judgment;
- typed ACTIVATE/fail-closed judgment;
- Gate A/B/C judgment;
- explicit A03 synchronization input if accepted.

Completion status allowed:

- `GATE_A_B_CANDIDATE_ACCEPTED`
- `IMPLEMENTATION_NEEDS_REVISION`
- `REJECTED`

## TASK P3-B18

Owner: Codex B
Status: READY
Branch: `codex/b-p3-b18-noble-bloom-r1`
Base: exact P3-B18 A-owned handoff commit

Goal:

Migrate exactly one additional TO14 direct result consumer, Artoria Alter `sc-artoria-alt-3.noble-bloom`, through the accepted post-scoring result envelope, accepted optional Interaction response window, and typed Resource resolution path without promoting its sibling `noble-bloom-extra-vp`.

Exact supported semantic:

- `optional_trigger`;
- activation phase `combat`;
- trigger `after_battle_result_determined`;
- response window `after_battle_result_determined`;
- exactly one condition `controller_played_highest_cost_noble_phantasm_in_battle_this_round`;
- no targets, cost, creates, modifiers, lifecycle, or limit;
- exactly one `adjust_victory_points(player=controller, amount=1)` effect;
- structural classification only, never representative-ID routing.

Required runtime contract:

- consume the accepted B13 post-all-battlefield-scoring result event; the optional window must not open before every required base-scoring receipt exists;
- Trigger Gateway owns discovery/idempotence and TO05 Interaction owns the optional response window;
- declining/pass leaves VP unchanged and terminally closes only that window;
- accepting resolves exactly one typed Resource `adjust_victory_points(+1)` result linked to the source/event causation;
- duplicate/replayed result identity must not open or settle a second copy;
- condition revalidation must fail closed if the qualifying highest-cost Noble Phantasm fact is absent;
- malformed same-family optional shapes must not fall through to legacy execution;
- exact supported semantics must execute through typed resolution-dataflow;
- no card/character/ability identity branch.

May touch:

- `packages/rules/src/ability/interpreter.ts`
- focused B18 regression/unit tests
- one scoped remote-room/browser Gate C spec/fixture if needed
- B18 implementation report

`packages/rules/src/ability/resolution-dataflow.ts` may be touched only if a fresh failing test proves the existing typed VP primitive cannot satisfy the exact contract. Any such change must remain generic and narrow.

Must not touch/promote:

- `sc-artoria-alt-3.noble-bloom-extra-vp`;
- Artoria Caster Luck-on-win optional triggers;
- Gatou `seeker.battle-end-reward`;
- Tomoe `penalty-on-defeat` / unpreventable semantics;
- Olga `trismegistus.loss-transform` or Special behavior;
- broad optional-trigger ordering or a second trigger queue;
- TO15 Modifier/Power runtime;
- TO16 Special runtime;
- A-owned coverage KPI/classifier/taxonomy;
- representative identity routing.

Required evidence:

- red/green identity-free semantic classifier positive plus near-miss negatives;
- real MatchSession result path proving base-scoring barrier before optional window exposure;
- accept path gives exactly +1 VP through typed result evidence;
- decline/pass path gives +0 VP;
- duplicate/replay result identity does not reopen/settle twice;
- non-qualifying highest-cost Noble Phantasm condition produces no legal response;
- malformed condition/effect/window shapes fail closed before legacy fallback;
- B13/B14/B15/B16/B17 compatibility;
- fresh Chromium remote-room proof for projection, response ownership, reconnect, stale revision, and exactly-once VP mutation;
- full root baseline comparison and production identity/legacy-bypass audit.

Completion status allowed:

- `IMPLEMENTATION_COMPLETE_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`

## TASK P3-R12

Owner: Codex R
Status: READY_AFTER_P3_B18
Branch: reviewer-selected fresh worktree/branch from exact B18 candidate SHA

Goal:

Independently review P3-B18 Artoria Alter optional post-result VP consumer without implementing fixes or inheriting acceptance from sibling optional triggers.

Required independent checks:

- fresh typecheck and focused/current-lineage compatibility;
- independently verify exact-shape classification is identity-free and malformed near-misses fail closed before legacy fallback;
- verify the optional response window appears only after the authoritative post-scoring barrier and only for the controller when the qualifying Noble Phantasm condition holds;
- verify accept resolves typed VP +1 exactly once and decline resolves no VP change;
- verify stable result identity/replay/reconnect cannot open or settle a duplicate response;
- verify source/event causation and typed effect evidence;
- verify B13-B17 ordering compatibility remains intact;
- run fresh Chromium Gate C for response ownership, reconnect, stale revision and no duplicate award;
- run full root baseline and block only on new deterministic failures.

Must not:

- implement fixes while reviewing;
- promote `noble-bloom-extra-vp`, Artoria Caster Luck triggers, Gatou, Tomoe, Olga transform, broad TO14, TO15, or TO16;
- modify A-owned coverage KPI/taxonomy.

Required output:

- findings ordered by severity;
- post-scoring optional-window ordering judgment;
- typed Resource / fail-closed / exactly-once judgment;
- projection/reconnect/stale judgment;
- Gate A/B/C judgment;
- explicit A03 synchronization input if accepted.

Completion status allowed:

- `GATE_A_B_CANDIDATE_ACCEPTED`
- `IMPLEMENTATION_NEEDS_REVISION`
- `REJECTED`

## TASK P3-B19

Owner: Codex B
Status: READY
Branch: `codex/b-p3-b19-noble-bloom-extra-vp-r1`
Base: exact P3-B19 A-owned handoff commit

Goal:

Migrate exactly one additional TO14 direct result consumer, Artoria Alter `sc-artoria-alt-3.noble-bloom-extra-vp`, through the accepted B18 post-scoring optional-response envelope and typed Resource path without merging it into base `noble-bloom` or promoting other optional triggers.

Exact supported semantic:

- `optional_trigger`;
- activation phase `combat`;
- trigger `after_battle_result_determined`;
- response window `after_battle_result_determined`;
- exactly two conditions: `controller_played_highest_cost_noble_phantasm_in_battle_this_round` plus `highest_cost_noble_phantasm_cost_at_least(value=4)`;
- no targets, cost, creates, modifiers, lifecycle, or limit;
- exactly one `adjust_victory_points(player=controller, amount=1)` effect;
- structural classification only, never representative-ID routing.

Required runtime contract:

- preserve two independent optional responses on the same result event when the highest-cost Noble Phantasm cost is at least 4: base B18 `noble-bloom` +1 and B19 extra +1;
- never collapse the two abilities into one +2 effect or make one acceptance imply acceptance of the other;
- the extra response must not exist when the tracked highest Noble Phantasm cost is below 4 or absent;
- consume the accepted B13/B18 post-all-battlefield-scoring result envelope; no B19 response before required base-scoring receipts exist;
- honor authoritative `battleParticipantIds` when present so another battlefield result cannot offer the response to a non-participant controller;
- TO05 Interaction owns the optional response window; decline/pass leaves VP unchanged for that window;
- accept resolves exactly one typed Resource `adjust_victory_points(+1)` result linked to source/event causation;
- stable result identity/replay/reconnect must not reopen or settle a duplicate B19 response;
- malformed same-family threshold/condition/effect/window shapes must fail closed before legacy fallback;
- no card/character/ability identity branch.

May touch:

- `packages/rules/src/ability/interpreter.ts`
- focused B19 regression/unit tests
- one scoped remote-room/browser Gate C spec/fixture if needed
- B19 implementation report

`packages/rules/src/ability/resolution-dataflow.ts` may be touched only if a fresh failing test proves the existing typed VP primitive cannot satisfy the exact contract. Any such change must remain generic and narrow.

Must not touch/promote:

- base `sc-artoria-alt-3.noble-bloom` beyond compatibility;
- Artoria Caster Luck-on-win optional triggers;
- Gatou `seeker.battle-end-reward`;
- Tomoe `penalty-on-defeat` / unpreventable semantics;
- Olga `trismegistus.loss-transform` or Special behavior;
- broad optional-trigger ordering or a second trigger queue;
- TO15 Modifier/Power runtime;
- TO16 Special runtime;
- A-owned coverage KPI/classifier/taxonomy;
- representative identity routing.

Required evidence:

- red/green identity-free classifier positive plus threshold/condition/effect/window near-miss negatives;
- cost 4+ event exposes both independent base and extra optional responses; resolving each yields exactly +1 for total +2;
- declining either response affects only that response and does not synthesize/erase the other response's VP semantics;
- cost <4 and no qualifying NP expose no extra response;
- unrelated battlefield result does not expose B19 for a non-participant controller;
- stable event replay/reconnect/stale revision does not duplicate the extra award;
- malformed same-family extra-VP shapes fail closed before legacy fallback;
- B13-B18 compatibility;
- fresh Chromium remote-room proof for projection, response ownership, reconnect, stale revision, independent optional resolution, and exactly-once extra VP;
- full root baseline comparison and production identity/legacy-bypass audit.

Completion status allowed:

- `IMPLEMENTATION_COMPLETE_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`

## TASK P3-R13

Owner: Codex R
Status: READY_AFTER_P3_B19
Branch: reviewer-selected fresh worktree/branch from exact B19 candidate SHA

Goal:

Independently review P3-B19 Artoria Alter extra-VP optional result consumer without implementing fixes or inheriting acceptance from B18.

Required independent checks:

- fresh typecheck and focused/current-lineage compatibility;
- verify exact two-condition threshold shape is identity-free and malformed near-misses fail closed before legacy fallback;
- verify cost 4+ produces two independent optional responses, each exactly +1, rather than one merged +2 settlement;
- verify cost <4/absent fact produces no B19 response while preserving valid B18 behavior;
- verify authoritative post-scoring barrier and participant scoping;
- verify accept/decline/replay/reconnect/stale revision independently for the extra response;
- verify typed Resource evidence and source/event causation;
- verify B13-B18 ordering/runtime compatibility remains intact;
- run fresh Chromium Gate C and full root baseline; block only on new deterministic failures.

Must not:

- implement fixes while reviewing;
- promote Artoria Caster Luck triggers, Gatou, Tomoe, Olga transform, broad TO14, TO15, or TO16;
- modify A-owned coverage KPI/taxonomy.

Required output:

- findings ordered by severity;
- independent-two-window judgment;
- post-scoring/participant judgment;
- typed Resource / fail-closed / exactly-once judgment;
- projection/reconnect/stale judgment;
- Gate A/B/C judgment;
- explicit A03 synchronization input if accepted.

Completion status allowed:

- `GATE_A_B_CANDIDATE_ACCEPTED`
- `IMPLEMENTATION_NEEDS_REVISION`
- `REJECTED`

## TASK P3-B20

Owner: Codex B
Status: READY
Branch: `codex/b-p3-b20-artoriac-luck-on-win-r1`
Base: exact P3-B20 A-owned handoff commit

Goal:

Migrate the three structurally identical Artoria Caster `unique-passive-luck-on-win` TO14 direct result consumers as one narrow family, without promoting unrelated optional triggers.

Exact supported semantic family:

- `optional_trigger`;
- trigger `after_controller_wins_battle`;
- response window `post_battle_optional_trigger_window`, controller only;
- source card must be in controller hand;
- unique limit group `artoriac-pilgrim-unique-on-win`, conflict policy `only_one_effect_may_activate_per_window`;
- cost moves source card from controller hand to `removed_from_game`;
- create exactly one `card.luck` into controller deck, then shuffle that deck;
- no direct numeric effect.

The accepted family contains exactly these three current consumers:

- `sc-artoriac-4.unique-passive-luck-on-win`;
- `sc-artoriac-5.unique-passive-luck-on-win`;
- `sc-artoriac-6.unique-passive-luck-on-win`.

Required behavior/evidence:

- structural classification only; renamed IDs must still classify;
- winner/participant/result provenance must prevent unrelated battle wins from opening the response;
- response is controller-only and remains optional;
- unique group permits at most one of the three sibling effects in the same trigger window;
- decline changes nothing;
- accept atomically removes exactly the chosen source card, creates exactly one Luck in the controller deck, and shuffles only that deck;
- stable replay/reconnect/stale-command paths cannot consume a second source or create another Luck;
- malformed same-family near misses fail closed before legacy fallback;
- B13-B19 ordering/runtime compatibility remains green;
- fresh Chromium remote-room proof and full-root baseline.

Must not:

- route by Artoria Caster/card/ability identity;
- promote `sc-artoriac-6.gain-vp-if-not-sole-winner`;
- promote Gatou, Tomoe, Olga transform, broad TO14, TO15, or TO16;
- modify A-owned coverage KPI/taxonomy.

Completion status allowed:

- `IMPLEMENTATION_COMPLETE_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`

## TASK P3-R14

Owner: Codex R
Status: READY_AFTER_P3_B20
Branch: reviewer-selected fresh worktree/branch from exact B20 candidate SHA

Goal:

Independently review the P3-B20 three-card Luck-on-win family without implementing fixes or inheriting acceptance from earlier Artoria Caster behavior.

Required independent checks:

- fresh typecheck and focused/current-lineage compatibility;
- verify classifier is identity-free and exactly scoped to the three structurally identical current consumers;
- verify unrelated battle wins do not expose the response;
- verify unique-group arbitration offers at most one sibling settlement per trigger window;
- verify accept removes exactly one chosen source and creates/shuffles exactly one Luck in the controller deck;
- verify decline, false source-zone condition, malformed near misses, replay, reconnect, and stale revision;
- verify B13-B19 compatibility, fresh Chromium Gate C, and full-root baseline;
- block only on new deterministic failures.

Must not:

- implement fixes while reviewing;
- promote Artoria Caster non-sole-winner VP, Gatou, Tomoe, Olga transform, broad TO14, TO15, or TO16;
- modify A-owned coverage KPI/taxonomy.

Required output:

- findings ordered by severity;
- family-scope / unique-group judgment;
- participant/provenance judgment;
- atomic remove-create-shuffle / fail-closed / exactly-once judgment;
- projection/reconnect/stale judgment;
- Gate A/B/C judgment;
- explicit A03 synchronization input if accepted.

Completion status allowed:

- `GATE_A_B_CANDIDATE_ACCEPTED`
- `IMPLEMENTATION_NEEDS_REVISION`
- `REJECTED`

## TASK P3-B21

Owner: Codex B
Status: READY
Branch: `codex/b-p3-b21-tomoe-defeat-penalty-r1`
Base: exact P3-B21 A-owned handoff commit

Goal:

Migrate exactly Tomoe `sc-tomoe-1.penalty-on-defeat` as the next TO14 direct consumer, preserving its explicit unpreventable VP-loss exception without promoting broad Modifier/Power semantics.

Exact supported semantic family:

- `forced_trigger`;
- trigger `after_controller_loses_battle`;
- exactly one effect `adjust_victory_points(player=controller, amount=-5)`;
- exactly one effect-prevention exception modifier with `operation=ignore`, `rule=effect_prevention`, `scope.object=this_effect`, `priority.tier=explicit_exception`;
- no optional response window, target, cost, create, lifecycle, or delayed activation.

Required behavior/evidence:

- structural classification only; renamed card/ability/modifier IDs must still classify;
- authoritative battle-result provenance must require the controller to be the losing participant; unrelated losses must not trigger;
- trigger settles only after the accepted post-scoring barrier through the ordinary loss-event lineage;
- with ordinary prevention enabled, the exact supported effect still applies because the authoring explicitly marks this effect unpreventable;
- typed `victory_points_adjusted` evidence records controller/resource/delta/before/after and marks the settlement unpreventable;
- VP floor behavior remains authoritative when the controller has fewer than 5 VP;
- stable result replay cannot deduct VP twice;
- malformed same-family near misses (wrong amount/player/trigger or weakened/extra prevention modifier shape) fail closed before legacy fallback and atomically preserve state;
- B13-B20 ordering/runtime compatibility remains green;
- fresh Chromium remote-room proof and full-root baseline.

Must not:

- route by Tomoe/card/ability/modifier identity;
- generalize all rule modifiers or TO15 Modifier/Power runtime;
- promote Gatou battle-end reward, Olga loss-transform, broad TO14, or TO16;
- modify A-owned coverage KPI/taxonomy.

Completion status allowed:

- `IMPLEMENTATION_COMPLETE_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`

## TASK P3-R15

Owner: Codex R
Status: READY_AFTER_P3_B21
Branch: reviewer-selected fresh worktree/branch from exact B21 candidate SHA

Goal:

Independently review P3-B21 Tomoe defeat penalty without implementing fixes or inheriting acceptance from generic legacy prevention behavior.

Required independent checks:

- fresh typecheck and focused/current-lineage compatibility;
- verify classifier is identity-free and exact to the forced loss -> controller VP -5 + explicit this-effect prevention exception shape;
- verify authoritative loser/participant provenance and post-scoring ordering;
- verify prevention enabled still cannot block the accepted effect, while no broad prevention bypass is introduced;
- verify typed VP evidence including unpreventable provenance, VP floor, stable replay exactly-once, and atomic malformed-shape rejection;
- verify B13-B20 compatibility, fresh Chromium Gate C, and full-root baseline;
- block only on new deterministic failures.

Must not:

- implement fixes while reviewing;
- promote Gatou, Olga transform, broad TO14, broad TO15 Modifier/Power, or TO16;
- modify A-owned coverage KPI/taxonomy.

Required output:

- findings ordered by severity;
- semantic-family / prevention-exception judgment;
- participant/post-scoring judgment;
- typed Resource / floor / fail-closed / exactly-once judgment;
- projection/reconnect/stale judgment;
- Gate A/B/C judgment;
- explicit A03 synchronization input if accepted.

Completion status allowed:

- `GATE_A_B_CANDIDATE_ACCEPTED`
- `IMPLEMENTATION_NEEDS_REVISION`
- `REJECTED`

## TASK P3-B22

Owner: Codex B
Status: READY
Branch: `codex/b-p3-b22-gatou-battle-end-reward-r1`
Base: exact P3-B22 A-owned handoff commit

Goal:

Migrate exactly Gatou `seeker.battle-end-reward` as the next TO14 direct consumer, replacing its legacy Special directive placeholder with a narrow authoritative phase-terminal settlement while preserving the existing B15 `after_battle_ended` ordering.

Exact supported semantic family:

- `forced_trigger`;
- trigger `after_battle_ended`;
- exactly one effect `record_master_directive(directive=gatou_battle_end_mobile_players_reward)`;
- no conditions, targets, cost, creates, rule modifiers, lifecycle, response window, or limit;
- the directive literal is the semantic operation key, not a character/card/ability identity key.

Required behavior/evidence:

- structural routing must not inspect Gatou/card/ability identity; renamed card/ability IDs with the exact directive semantic must still classify;
- settle only from the accepted stable phase-terminal event after all battle-result/scoring work is terminal;
- the controller must be a frozen participant of the phase-terminal battle set, including same-battle eligibility after scoring elimination;
- derive qualifying other players from authoritative current-round movement logs: current location equals controller current location, player is not controller, and that player has a successful `movement` log in the current round whose destination is that same current location; deployment/initial placement is not movement and must not qualify;
- count each qualifying player once even if multiple movement records target the same final location;
- if the controller appears in `winnerPlayerIds` for the battle resolved at the controller's current location, award +1 VP per qualifying player; otherwise award +1 mana per qualifying player;
- tied/shared winners count as winning because the authoritative winner set includes the controller;
- zero qualifying players is a deterministic no-op and must not fabricate resource gain;
- typed resource evidence records controller, resource kind, requested/actual delta, before/after, qualifying player IDs, terminal event identity, and whether the VP branch was selected;
- mana cap and VP floor/cap rules remain authoritative through the existing typed resource helpers; report actual delta, not only requested delta;
- stable terminal replay cannot reward twice;
- malformed same-family candidates fail closed before generic legacy directive fallback and preserve state atomically;
- B13-B21 ordering/runtime compatibility remains green;
- fresh Chromium remote-room proof and full-root baseline are required.

May touch:

- `packages/rules/src/ability/interpreter.ts`;
- `packages/rules/src/ability/battle-terminal.ts` only for the narrow frozen battlefield/winner snapshot required by this exact terminal consumer;
- `packages/rules/src/ability/types.ts` only if typed event metadata requires a narrow additive field;
- `packages/rules/src/match-session.ts` and `packages/rules/src/core/game-loop.ts` only if a fresh failing proof shows the terminal event lacks authoritative battle winner/location provenance required by this exact consumer;
- one focused regression test, one scoped browser fixture/spec, and one B22 result report.

Must not:

- route by Gatou/card/ability identity;
- promote `seeker.meditation`, Gatou command-spell directives, or generic `record_master_directive` semantics;
- generalize TO16 Special/directive protocol;
- promote Olga `trismegistus.loss-transform`, broad TO14, TO15 Modifier/Power, or unrelated Movement/Lifecycle behavior;
- rewrite authoring to make the representative fit;
- modify A-owned coverage KPI/taxonomy.

Completion status allowed:

- `IMPLEMENTATION_COMPLETE_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`

## TASK P3-R16

Owner: Codex R
Status: READY_AFTER_P3_B22
Branch: reviewer-selected fresh worktree/branch from exact B22 candidate SHA

Goal:

Independently review P3-B22 Gatou phase-terminal mobile-player reward without implementing fixes or inheriting acceptance from the generic legacy directive path.

Required independent checks:

- fresh typecheck and focused/current-lineage compatibility;
- verify exact semantic classifier is identity-free and limited to the one `after_battle_ended` Special directive operation;
- verify movement provenance is current-round, destination-matching, excludes controller/deployment, and dedupes qualifying players;
- verify winner branch is derived from the authoritative battle at the controller's current location and treats shared winners consistently with the winner set;
- verify phase-terminal ordering, frozen participant eligibility, zero-qualifier no-op, typed Resource actual delta/cap behavior, stable replay exactly-once, and atomic malformed-shape fail-closed behavior;
- verify no broad Special/directive protocol, Movement, Olga transform, TO15, or sibling TO14 promotion;
- verify B13-B21 compatibility, fresh Chromium Gate C, and full-root baseline;
- block only on new deterministic failures.

Must not:

- implement fixes while reviewing;
- promote Olga transform, broad TO14, broad TO15 Modifier/Power, or TO16;
- modify A-owned coverage KPI/taxonomy.

Required output:

- findings ordered by severity;
- semantic-family / directive-boundary judgment;
- movement/winner provenance judgment;
- phase-terminal / typed Resource / fail-closed / exactly-once judgment;
- projection/reconnect/stale judgment;
- Gate A/B/C judgment;
- explicit A03 synchronization input if accepted.

Completion status allowed:

- `GATE_A_B_CANDIDATE_ACCEPTED`
- `IMPLEMENTATION_NEEDS_REVISION`
- `REJECTED`

## TASK P3-B23

Owner: Codex B
Status: READY
Branch: `codex/b-p3-b23-olga-loss-transform-r1`
Base: exact P3-B23 A-owned handoff commit

Goal:

Migrate exactly Olga `trismegistus.loss-transform` as the final TO14 direct battle-event consumer, replacing the legacy player-flag-only transform with a narrow source-bound Soul Drag -> Return Silence transition while preserving the accepted B13-B22 battle lineage and B17 delayed activation contract.

Exact supported semantic family:

- `forced_trigger`;
- trigger `after_controller_loses_battle`;
- exactly one effect `transform_to_return_silence_on_loss`;
- no conditions, targets, cost, creates, rule modifiers, lifecycle, response window, or limit;
- effect type is the semantic operation key; no Olga/card/ability identity routing.

Required behavior/evidence:

- source must be face-up active in an active card zone; an inactive/skill-zone source does not transform on loss;
- authoritative loss provenance uses the accepted controller-loss participant/result lineage after scoring;
- first valid transform removes only live Soul Drag ongoing effects from that same source/controller and records source-bound Return Silence state;
- transformed state establishes the existing battlefield-only deployment constraint for that controller;
- pre-transform `return_silence_battle_start` cannot arm Return Silence from a synthetic/manual `while_active` event;
- transformed source removal invalidates/cleans any Return Silence authorization so no ghost player flag can alter later battles;
- stable event replay and later unrelated losses cannot duplicate transform evidence/state;
- typed transition evidence records controller/source/ability, triggering battle provenance when available, and `soul_drag -> return_silence` state identity;
- malformed same-family candidates fail closed before legacy extended-effect fallback and atomically preserve state;
- B13-B22 focused/current-lineage compatibility, fresh Chromium Gate C, and full-root baseline remain acceptable.

May touch:

- `packages/rules/src/ability/interpreter.ts`;
- `packages/rules/src/ability/extended-effects.ts` only for transformed-source gating of the existing Return Silence path;
- `packages/rules/src/core/combat-resolver.ts` only for source-bound Return Silence validation/cleanup;
- `packages/rules/src/ability/types.ts` only for narrow additive typed state/evidence;
- one focused B23 regression, one scoped browser fixture/spec, one B23 result report, and narrow correction of the stale premature-Return-Silence Olga regression expectation.

Must not:

- route by Olga/card/ability/master identity;
- rewrite authoring to make the representative fit;
- promote `trismegistus.soul-drag` as a broad Modifier/Power migration or fully certify `trismegistus.return-silence` as a TO16 Special row;
- generalize state transforms, passive lifecycle, battle-start hooks, or TO16 Special;
- change accepted B13-B22 event ordering or B17 delayed activation semantics;
- modify A-owned coverage KPI/taxonomy.

Completion status allowed:

- `IMPLEMENTATION_COMPLETE_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`

## TASK P3-R17

Owner: Codex R
Status: READY_AFTER_P3_B23
Branch: reviewer-selected fresh worktree/branch from exact B23 candidate SHA

Goal:

Independently review P3-B23 Olga loss-transform without implementing fixes or inheriting acceptance from the legacy Special player flag.

Required independent checks:

- fresh typecheck and focused/current-lineage compatibility;
- exact identity-free classifier limited to `forced after_controller_loses_battle -> transform_to_return_silence_on_loss`;
- inactive-source/pre-activation loss cannot transform and B17 first-loss delayed activation remains intact;
- active authoritative loss removes only same-source Soul Drag ongoing state and creates exactly one source-bound Return Silence transition;
- pre-transform Return Silence cannot arm; source removal prevents ghost Return Silence behavior;
- deployment restriction, transition evidence, stable replay exactly-once, reconnect/stale behavior, and malformed-shape atomic rejection are correct;
- no broad TO15 Modifier/Power, TO16 Special, passive-lifecycle, or sibling Olga promotion;
- B13-B22 compatibility, fresh Chromium Gate C, and full-root baseline; block only on new deterministic failures.

Must not:

- implement fixes while reviewing;
- promote broad TO14/TO15/TO16 behavior or independently certify `trismegistus.return-silence`;
- modify A-owned coverage KPI/taxonomy.

Required output:

- findings ordered by severity;
- semantic-family / active-source judgment;
- state-transition / Soul-Drag-removal judgment;
- Return-Silence gating/cleanup judgment;
- exactly-once / reconnect / stale judgment;
- Gate A/B/C judgment;
- explicit A03 synchronization input if accepted.

Completion status allowed:

- `GATE_A_B_CANDIDATE_ACCEPTED`
- `IMPLEMENTATION_NEEDS_REVISION`
- `REJECTED`

## Full-Roster Dispatch State After F1

- F1 independently accepted evidence: `59f145434695d29bdd17e4cb3adc887e84182377` (`944/944`, blocked `0`, unclassified `0`).
- Latest accepted runtime baseline: `a5f390e96ac2560226f9d48f133c9b09f5a1e140` (P3-B23 -> P3-R17 -> A03 synchronization).
- The F1 evidence branch and runtime branch are parallel. Runtime tasks base on the accepted runtime chain and consume F1 artifacts read-only.
- P3-FM01 is not dispatched yet: the only exact `READY_EXISTING_CONTRACT` F1 rows are `master.irisviel.skill.s2` and `master.kiritsugu.skill.s2`, one candidate in each separate contract, so no honest 10-40 ability migration batch exists.
- The active exclusive B runtime lane is closed through B23/R17/A03. The next runtime work is the explicitly scoped B2 task below.

## TASK P3-FB2-01

Owner: Codex B2
Status: READY
Branch: `codex/b2-p3-fb2-01-fixed-controller-mana-r1`
Base: exact P3-FB2-01 A-owned handoff commit
Runtime baseline before handoff: `a5f390e96ac2560226f9d48f133c9b09f5a1e140`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Runtime request: `runtime-capability-855dd7329e2d` / `GENERIC_COST_PAYMENT`

Goal:

Add one narrow reusable Cost/Payment component for a top-level fixed controller mana cost, using the already accepted typed `pay_mana` Resolution Data-flow primitive. This task does not migrate F1 authoring and does not make unsupported abilities routable.

Exact supported semantic:

- parent ability legality/routing must already be accepted independently;
- top-level `cost` has exactly one `pay_mana` node;
- amount is a fixed positive safe-integer literal;
- payer is the controller from authoritative execution context;
- payment follows the parent route's accepted authoritative stage boundary: non-staged routes settle payment and downstream effects atomically in one stage, while accepted staged routes may commit activation payment before opening their pending decision;
- insufficient mana fails closed before the current stage commits payment/effect/event/revision/pending mutation;
- a same-stage downstream failure rolls back that stage's payment; a rejection in a later already-committed stage does not refund an earlier accepted activation-stage payment;
- successful settlement consumes the existing typed `pay_mana` result/event envelope;
- classification/execution is identity-free and does not parse printed text.

Required implementation proof:

- exact fixed-cost positive case with typed `before/after/requestedAmount/actualAmount/status` evidence;
- renamed card/ability identity behaves identically;
- insufficient mana is atomic and fail-closed;
- same-stage downstream failure rolls back that stage's payment, while Maiya's already accepted later target-stage rejection preserves its committed activation-stage payment;
- reject zero/negative/non-integer/variable or expression amounts from this sub-capability;
- reject extra cost nodes and non-mana top-level costs from this sub-capability;
- effect-level `optionalCost` is not admitted by this component;
- current Maiya `military.attach-support-shot` and Kayneth `volumen.extra-play` focused/current-lineage behavior remains green;
- current B13-B23 compatibility and full deterministic root baseline remain green.

Read:

- `docs/agents/PHASE3-AGENT-CONTRACT.md`
- `docs/agents/PHASE3-FULL-ROSTER-COLLABORATION-CONTRACT.md`
- `docs/reports/2026-09-16-p3-fb2-01-fixed-controller-mana-handoff.md`
- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`
- focused Maiya/Kayneth regression tests before editing.

May touch:

- `packages/rules/src/ability/interpreter.ts`;
- `packages/rules/src/ability/resolution-dataflow.ts` only for a minimal additive adapter to the existing primitive, never a duplicate payment implementation;
- one new focused FB2-01 regression test;
- narrow Maiya/Kayneth compatibility assertions if required;
- `docs/reports/2026-09-16-p3-fb2-01-fixed-controller-mana-result.md`.

Must not:

- modify `packages/rules/src/match-session.ts`, server/client projection, or interaction protocols;
- migrate any F1 roster authoring or edit F1 inventory/catalog/source-evidence artifacts;
- change A-owned KPI/taxonomy;
- add card/ability/owner/character identity routing;
- parse Chinese/printed text at runtime;
- support variable/X, effect-level optional, third-party/multi-player, upkeep, replacement, command-seal, VP, discard-card, source-move, or ordinary printed play costs;
- broaden Maiya ADD_TO_ATTACK, Kayneth source-card PLAY, or any other parent semantic contract;
- merge the parallel F1 evidence branch into runtime.

Gate C:

No new Gate C is required if FB2-01 remains a server-side fixed cost component and does not change payment projection, pending interaction, reconnect, or stale-command behavior. Any such surface change is out of scope and blocks acceptance until a new task explicitly authorizes it.

Completion status allowed:

- `IMPLEMENTATION_COMPLETE_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`

## TASK P3-R18

Owner: Codex R
Status: READY_AFTER_P3_FB2_01
Branch: reviewer-selected fresh worktree/branch from exact FB2-01 candidate SHA

Goal:

Independently review the P3-FB2-01 fixed controller mana-cost component without implementing fixes or inheriting acceptance from Maiya, Kayneth, Golden Eater, or the generic legacy cost loop.

Required independent checks:

- fresh typecheck, FB2-01 focused tests, Maiya/Kayneth compatibility, and current-lineage/full-root baseline;
- exact component shape is fixed positive controller `pay_mana` only and cannot make an unsupported parent ability routable;
- classifier/adapter is identity-free and contains no printed-text parsing;
- typed payment evidence has correct actual delta and causation;
- insufficient mana and downstream failure are atomic and leak no payment/effect/event/revision mutation;
- zero/negative/non-integer/variable, additional, non-mana, and effect-level optional costs remain outside this contract;
- no MatchSession/client/projection or F1 authoring/KPI changes are present;
- no broad Cost/Payment, Resource Numeric, Interaction, or Card Action family is promoted by implication.

Must not:

- implement fixes while reviewing;
- widen the component or migrate F1 authoring;
- modify A-owned KPI/taxonomy.

Required output:

- findings ordered by severity;
- exact-shape / identity-independence judgment;
- typed-payment / atomicity / rollback judgment;
- Maiya/Kayneth compatibility judgment;
- scope/non-promotion judgment;
- explicit A synchronization input if accepted.

Completion status allowed:

- `GATE_A_B_CANDIDATE_ACCEPTED`
- `IMPLEMENTATION_NEEDS_REVISION`
- `REJECTED`

## Full-Roster Dispatch State After FB2-01

- P3-FB2-01 fixed controller mana payment is independently accepted by P3-R18 at `30c1e5365eeba102853a7f20f5bad139b3953acc` and synchronized by A at `0d4426d8565157121a3e86f4cc6e10396c9366be`.
- Post-acceptance membership audit: 30 Cost/Payment identities -> 24 MANA-axis -> 15 fixed positive literal MANA shapes -> `0` complete-skill migration-ready identities because every fixed member still has another unaccepted capability or reviewed-special dependency.
- P3-FM01 remains undispatched; no synthetic F4 burn-down is allowed.
- Dependency wave 1 continues with the narrow Resource Numeric deployment-reward task below.

## TASK P3-FB2-02

Owner: Codex B2
Status: REVIEW_ACCEPTED
Branch: `codex/b2-p3-fb2-02-deployment-resource-r1`
Base: exact P3-FB2-02 A-owned handoff commit
Runtime baseline before handoff: `0d4426d8565157121a3e86f4cc6e10396c9366be`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Runtime request: `runtime-capability-6220d123d8e1` / `GENERIC_RESOURCE_NUMERIC`

Goal:

Add one narrow reusable Resource Numeric trigger contract for fixed positive controller mana / victory-point rewards caused by the trusted controller deployment event at a specified location. This task does not migrate F1 authoring and does not promote generic Trigger Gateway.

Exact F1 sub-capability membership:

- `servant.anastasia.skill.sc-anastasia-1`
- `servant.andersen.skill.sc-andersen-1`
- `servant.avicebron.skill.sc-avicebron-3`
- `servant.davinci.skill.sc-davinci-4`
- `servant.semiramis.skill.sc-semiramis-2`
- `servant.shakespeare.skill.sc-shakespeare-1`

Exact supported semantic:

- forced/automatic trigger only;
- trigger exactly `after_player_deployed_to_battlefield`;
- non-empty `activation.eventLocationId`;
- event controller and location provenance must both match;
- no targets, cost, create, lifecycle, modifier, response/pending interaction, or variable input;
- exactly 1 or 2 effects;
- effects limited to controller `adjust_mana` / `adjust_victory_points`;
- amounts are fixed positive safe-integer literals;
- existing Resolution Data-flow provides one atomic event-stage settlement and typed result/event evidence;
- identity-free classification; no printed-text parsing and no `magic_workshop` runtime hard-code.

Required proof:

- renamed identity;
- one-resource and two-resource positive cases;
- typed before/after/delta evidence;
- wrong location rejected;
- other-player deployment rejected;
- ordinary movement into same location rejected;
- stable replay exactly-once;
- malformed/zero/negative/expression/third-effect/non-resource/command-seal shapes fail closed;
- same-stage failure rolls back all reward mutations/evidence;
- TO-11 Shinji, Ereshkigal deployment behavior, FB2-01 focused compatibility, typecheck, rules regression, deterministic generated-content verification, full root CI, and `git diff --check` remain green.

Read:

- `docs/agents/PHASE3-AGENT-CONTRACT.md`
- `docs/agents/PHASE3-FULL-ROSTER-COLLABORATION-CONTRACT.md`
- `docs/reports/2026-09-16-p3-fb2-02-deployment-resource-handoff.md`
- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/tests/regression/trigger-resource-runtime.test.ts`
- Ereshkigal deployment regression before editing.

May touch:

- `packages/rules/src/ability/interpreter.ts`
- one new focused FB2-02 regression test
- `docs/reports/2026-09-16-p3-fb2-02-deployment-resource-result.md`

Must not:

- modify `packages/rules/src/match-session.ts`;
- modify Resolution Data-flow primitives unless A explicitly re-dispatches scope;
- modify client/server projection or interaction protocols;
- migrate F1 roster authoring or edit F1 inventory/catalog/source evidence;
- change A-owned KPI/taxonomy;
- generalize arbitrary Trigger Gateway, Movement, Battle, Card Zone, Interaction, or Cost behavior;
- add card/ability/owner/character identity routing;
- parse printed text at runtime;
- admit command-seal, transfer, set, swap, negative, zero, variable, target-dependent, battle-derived, or ordinary movement resource semantics.

Gate C:

No new browser Gate C is required if FB2-02 remains server-side and does not change projection, reconnect, stale-command, or pending-interaction behavior.

Completion status allowed:

- `IMPLEMENTATION_COMPLETE_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`

## TASK P3-R19

Owner: Codex R
Status: REVIEW_ACCEPTED
Branch: reviewer-selected fresh worktree/branch from exact FB2-02 candidate SHA

Goal:

Independently review P3-FB2-02 without implementing fixes and without promoting generic Trigger Gateway or all Resource Numeric semantics.

Required independent checks:

- fresh typecheck, focused FB2-02 tests, TO-11/Ereshkigal/FB2-01 compatibility, rules regression, deterministic generated content, and full root baseline;
- exact trigger provenance requires matching trusted `playerId + locationId`;
- ordinary movement and other-player deployment cannot trigger the reward;
- exact effect surface is 1..2 fixed positive controller mana/VP adjustments only;
- multi-effect settlement is atomic and emits typed evidence;
- malformed sibling shapes fail closed before legacy fallback;
- classifier/runtime contain no card, ability, owner, character, or magic-workshop identity checks;
- no MatchSession/client/projection/F1 authoring/KPI change;
- no broad Resource Numeric, Trigger, Movement, Battle, Cost, Interaction, or Special family is promoted by implication.

Must not:

- implement fixes while reviewing;
- widen membership or migrate F1 authoring;
- modify A-owned KPI/taxonomy.

Completion status allowed:

- `GATE_A_B_CANDIDATE_ACCEPTED`
- `IMPLEMENTATION_NEEDS_REVISION`
- `REJECTED`

## Full-Roster Dispatch State After FB2-02

- P3-FB2-02 candidate `a37831a43d9949c6e9bb6eddbe9ac645e7754f44` is independently accepted by P3-R19 at `8f50df5f7acb74fc5c483a144796ca327c5aeb69`.
- Six exact F1 identities now have complete membership against this narrow accepted deployment Resource Numeric contract: Anastasia SC1, Andersen SC1, Avicebron SC3, Da Vinci SC4, Semiramis SC2, Shakespeare SC1.
- No roster authoring migration has occurred; A raw coverage remains unchanged.
- P3-FM01 remains undispatched because its implementation plan requires `10-40` exact eligible IDs under one selected accepted capability; FB2-02 currently provides `6/10` of that minimum.
- Next B2 dispatch must be selected by fresh capability membership analysis and remain in dependency order.
## TASK P3-FB2-03

Owner: Codex B2
Status: REVIEW_ACCEPTED
Branch: `codex/b2-p3-fb2-03-fixed-resource-component-r1`
Base: exact P3-FB2-03 A-owned handoff commit
Runtime baseline before handoff: `98518d02ff5e905426136ce7ae8450d646b62538`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Runtime request: `runtime-capability-6220d123d8e1` / `GENERIC_RESOURCE_NUMERIC`

Goal: add one reusable fixed-controller Mana/VP adjustment component for signed literal `adjust_mana` / `adjust_victory_points` effects. It must be reused by accepted parent routes and must not itself make unsupported parent abilities routable.

F1 component membership: `59` exact identities, frozen in `docs/reports/2026-09-16-p3-fb2-03-fixed-resource-component-handoff.md`.

Must not add a generic catch-all resource route or admit command seals, payment, set, transfer, swap, third-party, variable/expression, linked-player, target-dependent, or unrelated gateway semantics.

Required proof: positive/negative Mana and VP; implicit/explicit controller; invalid sibling rejection; authoritative cap/floor/gain-block evidence; TO-11 + FB2-02 + FB2-01 compatibility; unsupported parent remains unsupported; typecheck, regression, determinism, full CI, diff check.

Completion status allowed:

- `IMPLEMENTATION_COMPLETE_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`

## TASK P3-R20

Owner: Codex R
Status: REVIEW_ACCEPTED
Branch: reviewer-selected fresh worktree/branch from exact FB2-03 candidate SHA

Goal: independently review FB2-03 without fixes and without promoting broad Resource Numeric or any parent gateway.

Required checks: fresh validation; exact fixed controller Mana/VP effect shape; source gain/lose to signed-delta faithfulness for the 59-member subset; existing Data-flow ownership of cap/floor/blocked/actual delta; unsupported parent routes remain unsupported; no identity/text routing or forbidden-file changes; no broad later-wave promotion.

Completion status allowed:

- `GATE_A_B_CANDIDATE_ACCEPTED`
- `IMPLEMENTATION_NEEDS_REVISION`
- `REJECTED`
## Full-Roster Dispatch State After FB2-03

- FB2-03 candidate `3334598fc266c158aceea6796bcae03b6f65796e` is independently accepted by R20 `a2d2fcfedefead28897dd456aaefa8160061c53b`.
- Fixed controller Mana/VP component alignment covers `59` exact F1 identities, but only `6` have complete accepted parent routes; `53` remain later-wave blocked.
- No F1 authoring migration occurred and raw A coverage is unchanged.
- P3-FM01 remains undispatched; current complete same-route deployment membership remains `6/10` of its minimum.
- Continue wave-1 Resource Numeric / Cost closure before dependent runtime waves.

## TASK P3-FB2-04

Owner: Codex B2
Status: REVIEW_ACCEPTED
Branch: `codex/b2-p3-fb2-04-fixed-command-seal-component-r1`
Base: exact P3-FB2-04 A-owned handoff commit
Runtime baseline before handoff: `0842bd83a1d7f86ea59fe8e92e948521dba73713`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Runtime request: `runtime-capability-6220d123d8e1` / `GENERIC_RESOURCE_NUMERIC`

Goal: add one reusable fixed-controller command-seal adjustment component for literal signed `adjust_command_seals` effects. Reuse the existing typed Resolution Data-flow primitive and at least the already accepted Resource Numeric direct-action and B13 battle-loss parent routes. The component must not itself make unsupported parent abilities routable.

Frozen F1 component membership: 6 exact identities / 7 exact effects:
- `master.rin.skill.s2`
- `master.shinji.skill.s3`
- `master.shinji.skill.s4` (2 effects)
- `master.sieg.skill.ascension`
- `master.sieg.skill.s1a`
- `servant.davinci.skill.sc-davinci-8`

Accepted component shape to prove:
- effect type exactly `adjust_command_seals`;
- implicit or explicit controller only;
- non-zero safe-integer literal amount, positive or negative;
- optional non-empty string `directive` is allowed so existing accepted command-spell/B13 semantics remain compatible;
- no target, all-opponent, same-battlefield-opponent, restore-all, variable/expression, payment, transfer, set, or other resource semantics are admitted by implication.

Explicit F1 exclusions from this component:
- `master.amakusa.skill.ascension`: all-opponents loss;
- `master.bazett.skill.s4`: restore-all shape;
- `master.zouken.skill.ascension`: opponents-on-same-battlefield loss.

Required proof:
- classifier is identity-free and text-free;
- direct Resource Numeric action and B13 battle-loss route reuse the component without changing their parent-route gates;
- existing command-spell `directive: spend_command_spell` and Shinji B13 directive remain accepted;
- positive/negative literal adjustments emit typed `command_seals_adjusted` evidence;
- underflow fails atomically and does not leak state/events;
- zero, non-integer, variable/expression, third-party/targeted, restore-all, and unknown sibling shapes are rejected by the component;
- an effect that matches the component but has an unsupported parent ability remains unroutable;
- no new MatchSession/client/projection/F1 authoring/KPI changes;
- typecheck, focused compatibility, rules regression, deterministic generated content, full CI, identity audit, and diff check all pass.

Completion status allowed:
- `IMPLEMENTATION_COMPLETE_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`

## TASK P3-R21

Owner: Codex R
Status: REVIEW_ACCEPTED
Branch: reviewer-selected fresh worktree/branch from exact FB2-04 candidate SHA

Goal: independently review FB2-04 without implementing fixes and without promoting broad Resource Numeric, Cost, Trigger, Target, or Interaction semantics.

Required checks:
- exact fixed-controller command-seal component boundary above;
- existing typed primitive remains the single mutation owner;
- direct-action and B13 parent routes remain independently gated;
- underflow rollback and typed actual delta evidence;
- all-opponents / same-battlefield-opponents / restore-all / variable / payment siblings remain excluded;
- no card, owner, ability, printed-text, or location routing;
- no migration or A-owned KPI/taxonomy mutation;
- fresh typecheck, focused tests, rules regression, determinism, full CI, and diff check.

Completion status allowed:
- `GATE_A_B_CANDIDATE_ACCEPTED`
- `IMPLEMENTATION_NEEDS_REVISION`
- `REJECTED`

## Full-Roster Dispatch State Before FB2-04

- FB2-03 remains independently accepted and A-synchronized at `0842bd83a1d7f86ea59fe8e92e948521dba73713`.
- Fresh F1 scan found 10 `adjust_command_seals` effects across 9 Resource Numeric identities. Only 7 effects across 6 identities are fixed controller literal adjustments and belong to FB2-04.
- Three non-controller/non-literal sibling shapes are explicitly excluded and require later target/special semantics.
- This is component alignment only; no new roster migration readiness is claimed because parent routes remain independently required.
- P3-FM01 remains undispatched and wave-1 Resource Numeric / Cost closure continues.

## Full-Roster Dispatch State After FB2-04

- FB2-04 candidate `5e6500a72f2d82c2cb12644a163ed6b9d96f0fc7` is independently accepted by R21 `92c55fc53164ce52ad9489ef5d5067cb516ea4e3`.
- Accepted component scope is fixed non-zero controller `adjust_command_seals` with optional non-empty string directive, reusing the existing typed Resolution Data-flow primitive under independently accepted parents.
- Exact F1 component alignment is 6 identities / 7 effects; the three all-opponent / same-battlefield-opponent / restore-all siblings remain excluded.
- This component does not make unsupported parent abilities routable and does not accept command-seal payment. Even if all 6 component identities later gain parents, this slice alone cannot meet the FM01 minimum of 10 exact IDs.
- Fresh A coverage and compiled identity remain unchanged; no authoring migration occurred.
- Continue wave-1 Resource Numeric / Cost membership analysis before dispatching a dependent wave.


## TASK P3-FB2-05

Owner: Codex B2
Status: REVIEW_ACCEPTED
Branch: `codex/b2-p3-fb2-05-fixed-controller-set-mana-r1`
Base: exact P3-FB2-05 A-owned handoff commit
Runtime baseline before handoff: `8a3ce9fe318333cc9b1c0c0ea2f45d51ec588cf5`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Runtime request: `runtime-capability-6220d123d8e1` / `GENERIC_RESOURCE_NUMERIC`

Goal: add one typed fixed-controller exact `set_mana` Resolution Data-flow primitive plus an identity-free semantic component. This task must not add a Trigger Gateway or otherwise make the five F1 members executable by itself.

Frozen F1 component membership: 5 exact identities:
- `master.iliya.skill.s1` -> controller mana = 6;
- `master.shinji.skill.s4` -> controller mana = 4;
- `master.shirou-emiya.skill.s3` -> controller mana = 0;
- `master.taiga.skill.s1` -> controller mana = 3;
- `master.zouken.skill.s1` -> controller mana = 10.

Accepted primitive/component shape to prove:
- effect type exactly `set_mana`;
- implicit/explicit controller only at the authoring component boundary;
- fixed safe-integer literal target amount only, no binding/expression;
- target must be within the authoritative runtime interval `0..manaCap(controller)`; out-of-range fails closed;
- assignment is exact: `after = targetAmount`;
- this is not a gain operation, so `manaGainBlocked` does not suppress an otherwise valid exact set;
- typed result records controller, target amount, actual delta, before, and after;
- non-zero actual delta emits existing typed `mana_adjusted` evidence; same-value set is a no-op and emits no resource event;
- transaction rollback remains authoritative on later failure.

Explicit non-goals:
- no Trigger Gateway, game-start gateway, condition, target, lifecycle, modifier, or special-handler acceptance;
- no variable/expression `set_mana`;
- no third-party set;
- no Mana gain/loss/payment redefinition;
- no authoring roster migration, KPI/taxonomy change, client/server change, or Reference handler copy.

Allowed production files:
- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/src/ability/interpreter.ts` only for the component predicate; no route promotion.

Required evidence:
- primitive registration, normalization/coercion, validation, result schema, typed event, and rollback tests;
- component classifier rejects negative, above-cap-at-runtime, fractional, expression, third-party, and extra-semantic sibling shapes as applicable;
- prove `manaGainBlocked` does not change exact-set semantics;
- prove no parent route is added for the five F1 members;
- typecheck, focused dataflow/component tests, all rules regression, determinism, full CI, identity audit, and diff check.

Completion status allowed:
- `IMPLEMENTATION_COMPLETE_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`

## TASK P3-R22

Owner: Codex R
Status: REVIEW_ACCEPTED
Branch: reviewer-selected fresh worktree/branch from exact FB2-05 candidate SHA

Goal: independently review the exact fixed-controller `set_mana` primitive/component without adding fixes or promoting Trigger Gateway.

Required checks:
- exact-set semantics and cap validation;
- gain-block distinction;
- typed result/event and transaction rollback;
- fixed literal/controller-only component boundary;
- no parent route promotion and no F1 migration claim;
- no identity/text/location routing;
- no unrelated hot-file/KPI changes;
- fresh typecheck, focused tests, all rules regression, determinism, full CI, and diff check.

Completion status allowed:
- `GATE_A_B_CANDIDATE_ACCEPTED`
- `IMPLEMENTATION_NEEDS_REVISION`
- `REJECTED`

## Full-Roster Dispatch State Before FB2-05

- FB2-04 is independently accepted and A-synchronized at `8a3ce9fe318333cc9b1c0c0ea2f45d51ec588cf5`.
- Fresh wave-1 scan shows all five F1 `set_mana` rows are fixed controller literal assignments (0/3/4/6/10). None requires target selection or result binding for the numeric primitive itself.
- Their remaining blockers are later parent semantics: Iliya S1 and Taiga S1 require Trigger Gateway; Shinji S4 additionally requires condition/special handling; Shirou S3 condition/lifecycle/special; Zouken S1 lifecycle/modifier.
- FB2-05 therefore closes only the independent numeric primitive/component and intentionally leaves all parent routes for their declared later waves.
- Variable Mana payment rows remain deferred because they depend on selected-card values, hand counts, or result bindings; fixed Mana payment remains covered by FB2-01.
- P3-FM01 remains undispatched.

## Full-Roster Dispatch State After FB2-05

- FB2-05 candidate `1a611635061f83f7b3aad5c5b2e3da2a33b201bf` is independently accepted by R22 `af6503692e23fb118b8956e00baa2b0f84cb2181`.
- Accepted scope is the fixed-controller exact `set_mana` typed primitive/component only; no Trigger Gateway or authoring migration is promoted.
- Exact F1 component alignment is 5 identities. All five still require later parent semantics, so complete migration readiness added by FB2-05 is `0`.
- Fresh A coverage remains `new=12 / legacyExecute=3 / legacyResolve=49 / dual=0 / notClassifiable=28 / taxonomyWarnings=79`; compiled definition hash remains `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`, with 70 cards, 14 characters, and 0 blocking issues.
- Generated coverage drift is only timestamp/static source line numbers and is intentionally not committed.
- P3-FM01 remains undispatched; wave-1 Resource Numeric / Cost closure continues, with variable/expression payments explicitly deferred to their dependent Result Binding/Target work.

## TASK P3-FB2-06

Owner: Codex B2
Status: REVIEW_ACCEPTED
Branch: `codex/b2-p3-fb2-06-fixed-controller-draw-r1`
Base: exact P3-FB2-06 A-owned handoff commit
Runtime baseline before handoff: `de6e57c2610c560b81791ef931bf5bc09dab8fc7`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Runtime request: `runtime-capability-a600709be05b` / `GENERIC_CARD_ZONE`

Goal: start wave 2 with one reusable fixed-controller ordinary-deck draw component, reusing the existing typed `draw_cards` primitive, plus one narrow complete direct route for the Waver-shaped `advance/outpost` action with fixed 1-Mana payment and draw 2. No roster migration is part of B2.

Frozen F1 component membership: 23 exact identities listed in `docs/reports/2026-09-16-p3-fb2-06-fixed-controller-draw-handoff.md`.

Required component boundary:
- `draw_cards`; controller only; fixed positive safe-integer count; ordinary controller deck only;
- reject custom deck, variable/binding count, draw-until, third-party, result-consuming, or sibling semantic shapes;
- matching component alone never grants a parent route.

Required complete direct route:
- phase action in runtime `advance` (`outpost` source timing); controller action window;
- exactly one fixed positive controller `pay_mana` cost of 1, using FB2-01;
- exactly one fixed controller draw of 2;
- no target/condition/create/modifier/lifecycle/response/limit;
- cost + draw settle atomically through typed Resolution Data-flow;
- insufficient Mana and malformed same-family shapes fail closed before legacy fallback.

Must not promote:
- generic Card Zone; broad PLAY; Trigger Gateway / `on_card_played`; the 14 mixed servant draw/play rows as complete routes; Result Binding; Target/PendingInteraction; Visibility; Lifecycle; Power/Battle/Special; F1 authoring migration.

May touch:
- `packages/rules/src/ability/interpreter.ts`;
- one focused FB2-06 regression test;
- narrow existing Card Zone assertions only if required;
- `docs/reports/2026-09-16-p3-fb2-06-fixed-controller-draw-result.md`.

Required validation: identity/text-free classifier, negative sibling coverage, Waver-shaped atomic payment+draw, discard recycle path, existing FB2-01/Card Zone/PLAY/Interaction compatibility, typecheck, all rules regressions, determinism, full CI, identity/forbidden-file audit, diff check.

Completion status allowed:
- `IMPLEMENTATION_COMPLETE_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`

## TASK P3-R23

Owner: Codex R
Status: REVIEW_ACCEPTED
Branch: reviewer-selected fresh worktree/branch from exact FB2-06 candidate SHA

Goal: independently review FB2-06 without implementing fixes and without promoting broad Card Zone, Trigger, PLAY, Interaction, or F4 migration.

Required checks:
- exact fixed-controller ordinary-deck draw component boundary;
- existing typed draw primitive remains the single mutation owner;
- Waver-shaped `advance + pay 1 + draw 2` route is structural and atomic;
- malformed/unsupported parent shapes fail closed and do not fall to legacy;
- the 14 mixed servant rows remain component-only until their `on_card_played` draw parent is independently accepted;
- no identity/text routing, no F1 migration, no KPI mutation;
- fresh typecheck, focused tests, all rules regressions, deterministic verification, full CI, and diff check.

Completion status allowed:
- `GATE_A_B_CANDIDATE_ACCEPTED`
- `IMPLEMENTATION_NEEDS_REVISION`
- `REJECTED`

## Full-Roster Dispatch State Before FB2-06

- Wave 1 independent Resource Numeric / Cost primitives are closed through FB2-01/02/03/04/05. Remaining rows are explicitly dependency-deferred to later Result Binding, Target, Trigger, Card Zone, Lifecycle, Modifier/Power, or reviewed-special owners rather than silently broadened.
- Wave 2 may begin under the accepted dependency order.
- Fresh F1 Card Zone scan found 30 draw identities; 23 contain a fixed positive ordinary-controller-deck draw core.
- A 14-identity servant family shares the same source-grounded draw-1 + optional low-power hand-play pattern, but its draw clause is still Trigger-owned. TO03 is specification-accepted only and the broad `on_card_played -> draw_cards` runtime is not accepted; therefore those 14 are not F4-ready.
- `master.waver.skill.s2` provides the first complete wave-2 direct representative: outpost/advance, fixed 1 Mana, draw 2. Source overlay cost must be preserved even though the F1 capability axis did not separately request Cost Payment.
- P3-FM01 remains undispatched.

## Full-Roster Dispatch State After FB2-06

- FB2-06 candidate `3f1080a7cb4f68e7c08af91b349680a6536cd362` is independently accepted by R23 `0dc6619eba6f2ff67c96b6ec9c3ff736cae66740`.
- Accepted component scope is fixed positive controller ordinary-deck draw; exact F1 component alignment is 23 identities. Parent-only qualifiers remain independently gated.
- Accepted complete direct route is only the structural `advance/outpost + fixed pay 1 Mana + draw 2` family. At current F1 membership this yields one complete representative (`master.waver.skill.s2`) pending separate S migration; it does not create a 10鈥?0 F4 batch.
- The 14-identity servant draw/play family remains blocked by the `on_card_played` Trigger-owned draw clause; TO13 already covers the optional low-power hand-play half, but TO03 is specification-only and broad Trigger runtime is not accepted.
- Fresh A coverage remains `new=12 / legacyExecute=3 / legacyResolve=49 / dual=0 / notClassifiable=28 / taxonomyWarnings=79`; compiled definition hash remains `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`, with 70 cards, 14 characters, and 0 blocking issues.
- Generated coverage drift is only timestamp/static source line numbers and is intentionally not committed.
- P3-FM01 remains undispatched. Wave 2 continues with the next high-yield Card Zone / Move / Return component; no wave skipping to Trigger or Power is allowed.


## TASK P3-FB2-07

Owner: Codex B2
Status: REVIEW_ACCEPTED
Branch: `codex/b2-p3-fb2-07-fixed-source-removal-r1`
Base: exact P3-FB2-07 A-owned handoff commit
Runtime baseline before handoff: `6e062bb4c5b300aba3d49aaf6076ce042e185a2f`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Runtime request: `runtime-capability-a600709be05b` / `GENERIC_CARD_ZONE`

Goal: continue wave 2 with one reusable fixed-controller source-card removal component by extending the existing typed `move_source_card` primitive to `removed_from_game`. No parent route and no roster migration are part of B2.

Frozen F1 component membership: 12 exact identities listed in `docs/reports/2026-09-16-p3-fb2-07-fixed-source-removal-handoff.md`.

Required component boundary:
- source is the executing ability source; owner/controller must equal ability controller;
- destination exactly controller `removed_from_game`;
- successful removal is public, inactive, and typed-event/result owned;
- already removed, missing source, wrong owner/controller, unsupported destination, selected/third-party movement, or extra semantic sibling shapes fail closed;
- matching component alone never grants a parent route.

Preserve existing B15 `move_source_card -> skill` semantics and active-board source-state checks exactly.

Must not promote:
- generic Card Zone; `return_card_by_definition`; Card Create; Trigger Gateway; Lifecycle; Target/Interaction; Movement; Visibility; Power/Battle/Special; arbitrary source movement; F1 migration.

May touch:
- `packages/rules/src/ability/resolution-dataflow.ts`;
- `packages/rules/src/ability/interpreter.ts` only for the component predicate;
- one focused FB2-07 regression test and narrow existing dataflow/B15 assertions if required;
- `docs/reports/2026-09-16-p3-fb2-07-fixed-source-removal-result.md`.

Required validation: typed normalization/result/event/rollback, negative source/destination/ownership cases, B15 compatibility, identity/text-free classifier, no route promotion, typecheck, all rules regressions, determinism, full CI, identity/forbidden-file audit, diff check.

Completion status allowed:
- `IMPLEMENTATION_COMPLETE_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`

## TASK P3-R24

Owner: Codex R
Status: REVIEW_ACCEPTED
Branch: reviewer-selected fresh worktree/branch from exact FB2-07 candidate SHA

Goal: independently review FB2-07 without implementing fixes and without promoting broad Card Zone or any F1 migration.

Required checks:
- exact source-card removal component boundary and authoritative `removed_from_game` state;
- existing B15 skill-return semantics are unchanged;
- no source-zone/timing parent assumption is smuggled into component acceptance;
- wrong owner/controller, already removed, invalid destination, and later-stage failure are atomic/fail-closed;
- no parent route, identity/text routing, F1 authoring migration, KPI/taxonomy mutation, or unrelated hot-file changes;
- fresh typecheck, focused tests, all rules regressions, determinism, full CI, static audits, and diff check.

Completion status allowed:
- `GATE_A_B_CANDIDATE_ACCEPTED`
- `IMPLEMENTATION_NEEDS_REVISION`
- `REJECTED`

## Full-Roster Dispatch State Before FB2-07

- FB2-06 is independently accepted at candidate `3f1080a7cb4f68e7c08af91b349680a6536cd362`, R23 `0dc6619eba6f2ff67c96b6ec9c3ff736cae66740`, and A-synchronized at `6e062bb4c5b300aba3d49aaf6076ce042e185a2f`.
- FB2-06 stacked PRs are #283/#284/#285/#286.
- Fresh Card Zone clustering covers 121 F1 request identities. The strongest exact Move component is 12 distinct identities with `move_source_card -> removed`.
- The existing B15 typed source return only supports active face-up board source -> skill and cannot be reused as proof for setup/removal parents by destination similarity alone.
- A separate Return-by-definition family has 10 exact effect rows but only 8 provable unique skill IDs in the source overlay; four non-overlay return IDs lack frozen effect shape, so A does not inflate that family to the F4 minimum.
- P3-FM01 remains undispatched. FB2-07 is component-only and adds zero complete migration-ready identities by itself.



## Full-Roster Dispatch State After FB2-07

- FB2-07 candidate `7cfa53b1dcea1f8b0769ff247924724d20d1d626` is independently accepted by R24 `e9e6112ced21ffad738fa00025132f9c3fe9976d`.
- Accepted scope is only the typed controller-owned executing-source removal component to `removed_from_game`; B15 source return to skill remains independently bounded and unchanged.
- Exact F1 component alignment is 12 identities, but every identity still has another parent/special dependency. Complete migration readiness added by FB2-07 is `0`.
- Fresh A coverage remains `new=12 / legacyExecute=3 / legacyResolve=49 / dual=0 / notClassifiable=28 / taxonomyWarnings=79`; compiled definition hash remains `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`, with 70 cards, 14 characters, and 0 blocking issues.
- Generated coverage drift is only timestamp/static source-line locations and is intentionally not committed.
- P3-FM01 remains undispatched. Wave 2 continues with the next high-yield Card Zone / Move / Return component; no Trigger/Power wave skipping is authorized.



## TASK P3-FB2-08

Owner: Codex B2
Status: REVIEW_ACCEPTED
Branch: `codex/b2-p3-fb2-08-source-play-basic-draw-r1`
Base: exact P3-FB2-08 A-owned handoff commit
Runtime baseline before handoff: `e0f1a40b1e66c64df78f32e98791018475829af3`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`

Goal: accept one narrow identity-free Trigger Runtime route for `forced on_card_played + source active + played_with_basic_attack + fixed controller draw 1`, using existing trusted play-batch provenance and typed draw dataflow.

Frozen candidate F1 membership: 14 exact servant skill identities listed in `docs/reports/2026-09-16-p3-fb2-08-source-play-basic-draw-handoff.md`.

Required boundary:
- exact forced/source-active `on_card_played` candidate envelope;
- exactly one `played_with_basic_attack` condition;
- exactly one controller fixed draw-1 effect;
- no targets/costs/creates/modifiers/lifecycle/response/limit or extra activation metadata;
- event source/player/source-card batch membership and face-up controller basic companion are trusted-provenance scoped;
- duplicate event IDs settle once;
- malformed triggered near-matches fail closed before legacy mutation.

Must not promote broad Trigger Gateway, Okita repeat-play, generic conditions, broad PLAY/TO13, CLOSE attribute triggers, client/projection, or F1 migration.

May touch only interpreter routing/classification, focused trigger tests/narrow compatibility assertions, and the FB2-08 result report.

Required validation: real batch positive/negative provenance, typed draw evidence, idempotency, malformed fail-closed, TO13/CLOSE/Trigger compatibility, typecheck, all rules regression, determinism, full CI, static audits, diff check.

Completion status allowed:
- `IMPLEMENTATION_COMPLETE_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`

## TASK P3-R25

Owner: Codex R
Status: REVIEW_ACCEPTED
Branch: reviewer-selected fresh worktree/branch from exact FB2-08 candidate SHA

Goal: independently review the exact FB2-08 trigger route without implementing fixes and without pre-authorizing F1 migration.

Required checks:
- exact trigger/condition/effect shape;
- authoritative play-batch provenance and source/controller scoping;
- separate/face-down/other-controller/wrong-source negatives;
- typed draw and discard-recycle behavior;
- replay/idempotency and atomic malformed failure;
- no identity/text routing and no regression of TO13/CLOSE/other trigger contracts;
- no F1 authoring/KPI/taxonomy changes;
- fresh typecheck, focused tests, all rules regressions, determinism, full CI, static audits, diff check.

Completion status allowed:
- `GATE_A_B_CANDIDATE_ACCEPTED`
- `IMPLEMENTATION_NEEDS_REVISION`
- `REJECTED`

## Full-Roster Dispatch State Before FB2-08

- FB2-07 is accepted and A-synchronized at `e0f1a40b1e66c64df78f32e98791018475829af3`; stacked PRs are #287/#288/#289/#290.
- Independent Wave-2 Card Zone closure is complete: among 121 `GENERIC_CARD_ZONE` identities, only Waver S2 has no other parent capability, and its exact route is already accepted by FB2-06. All residual Move/Return rows are dependency-bound or mix later owners.
- Wave-3 Card Action scan shows PLAY=46, CLOSE=19, ACTIVATE=10, ADD_TO_ATTACK=8, CREATE_AND_ACTIVATE=2; no identity depends on that Card Action capability alone. Existing TO10/TO13 typed contracts cover the reusable independent primitives, so no broad Card Action reimplementation is dispatched.
- A 14-identity same-shape servant family is the first visible 10+ composite batch candidate. TO13 covers its optional low-power hand-play half; the missing runtime Gate is the source-play/basic-attack/draw trigger half dispatched as FB2-08.
- P3-FM01 remains undispatched until R25 and a fresh A-owned exact dependency check.


## Full-Roster Dispatch State After FB2-08

- FB2-08 candidate `ea6a1522f6382ef617ae26fbca7d208e999f204f` is independently accepted by R25 `33f0a0e1b3e9c4c62c8eb713ae45cd7117c7a0a7`.
- Fresh A coverage remains `new=12 / legacyExecute=3 / legacyResolve=49 / dual=0 / notClassifiable=28 / taxonomyWarnings=79`; compiled definition hash remains `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`, 70 cards, 14 characters, 0 blocking issues.
- Frozen-F1 recheck proves 14/14 selected servant rows have `blockedBy=[]`, exact required capabilities `[CARD_ACTION_PLAY, GENERIC_CARD_ZONE]`, no additional semantic axes, and an identical source overlay.
- TO13 accepts the private optional `0..3` controller-hand/base-power-at-most-3 play half; FB2-06 accepts the typed controller draw primitive; FB2-08 accepts the missing exact source-play/basic-attack draw trigger half.
- The first 10鈥?0 F4 batch gate is therefore met at 14 exact IDs. P3-FM01 is dispatched as `READY`; Okita remains excluded.

## TASK P3-FM01

Owner: Codex S
Status: MIGRATION_ACCEPTED
Branch: `codex/s-p3-fm01-source-play-basic-draw`
Base: exact P3-FB2-08 A synchronization commit
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Read: `docs/reports/2026-09-16-p3-fm01-source-play-basic-draw-migration-handoff.md`

Goal: perform the first accepted F4 authoring migration for exactly the 14 source-play/basic-attack/draw + private optional low-power play identities frozen by A.

Exact membership:
- `servant.boudica.skill.sc-boudica-3`
- `servant.constantine.skill.sc-constantine-1`
- `servant.drake.skill.sc-drake-1`
- `servant.hephaistion.skill.sc-hephaistion-3`
- `servant.iskandar.skill.sc-iskandar-1`
- `servant.ivan.skill.sc-ivan-3`
- `servant.mandricardo.skill.sc-mandricardo-3`
- `servant.martha.skill.sc-martha-3`
- `servant.medb.skill.sc-medb-1`
- `servant.medusa.skill.sc-medusa-1`
- `servant.odysseus.skill.sc-odysseus-3`
- `servant.roberts.skill.sc-roberts-3`
- `servant.teach.skill.sc-teach-3`
- `servant.ushiwakamaru.skill.sc-ushiwakamaru-3`

Required accepted dependencies:
- TO13 private optional controller-hand `0..3`, base-power-at-most-3 `play_selected_cards` interaction;
- FB2-06 typed fixed controller ordinary-deck draw component;
- FB2-08/R25 exact forced source-play/basic-attack draw-1 trigger.

May touch only the selected `data/authoring/` records/files, exact-batch focused content/authoring tests or fixtures, and `docs/reports/2026-09-16-p3-fm01-source-play-basic-draw-migration.md`.

Must not modify runtime hot files, client/server/app code, coverage/taxonomy definitions, F1 frozen artifacts, unrelated authoring, or Okita.

Required validation: source/printed-clause preservation, exact semantic shape, compilation, focused content/authoring tests, typecheck, `content:validate`, deterministic generated-content verification, relevant runtime compatibility, runtime-file absence audit, and diff check.

Completion status allowed:
- `MIGRATION_CANDIDATE`
- `MIGRATION_NEEDS_REVISION`

## TASK P3-A-FM01-SYNC

Owner: Codex A
Status: MIGRATION_SYNC_ACCEPTED
Base: exact P3-FM01 S candidate SHA

Goal: independently recompute before/after full-roster burn-down and verify that exactly the authorized 14 identities changed migration state without taxonomy/KPI redefinition or unrelated evidence drift.

A must not repair S authoring. Record exact candidate SHA, fresh coverage, before/after legacy/new/dual where measurable, selected-membership reconciliation, generated-content identity, and any drift. Commit A evidence separately.

Completion status allowed:
- `MIGRATION_SYNC_CANDIDATE`
- `MIGRATION_SYNC_NEEDS_REVISION`

## TASK P3-R26

Owner: Codex R
Status: MIGRATION_ACCEPTED
Branch: reviewer-selected fresh worktree/branch from exact A-synchronized FM01 lineage

Goal: independently review the first F4 migration without implementing fixes.

Required checks: exact 14-ID membership, source and printed-clause preservation, accepted-contract conformance, no runtime changes or identity routing, focused/content/runtime compatibility, A before/after burn-down integrity, determinism, full required validation, and diff check.

Completion status allowed:
- `MIGRATION_ACCEPTED`
- `MIGRATION_NEEDS_REVISION`
- `REJECTED`

## Full-Roster Dispatch State After P3-A-FM01-SYNC

- S candidate `6203b70c5bc2a81ceecca31008dc2b71246519a9` migrates the exact authorized 14-ID batch as 13 new minimal authoring archives plus the unchanged pre-existing Drake representative; skipped=0 and runtime-file changes=0.
- Independent A burn-down shows frozen-F1 canonical authoring overlap `24 -> 37` (+13) globally and exact FM01 membership `1/14 -> 14/14`, with zero unauthorized F1 IDs added.
- Fresh material coverage is committed. Raw reporter counts become `new=12 / legacyExecute=3 / legacyResolve=75 / dual=0 / notClassifiable=28 / taxonomyWarnings=92` because the reporter labels the 26 newly visible abilities exactly as it already labels the independently accepted Drake representatives. Structural signature mismatch versus Drake is `0/26`.
- Compiled product identity remains unchanged at 70 cards / 14 characters / 0 blocking issues, definition hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`.
- A does not redefine taxonomy/KPI or repair the classifier during migration sync.
- R26 independently accepts the exact FM01 lineage at reviewer report `docs/reports/2026-09-16-p3-r26-fm01-source-play-basic-draw-migration-review.md`; FM01 is `MIGRATION_ACCEPTED` for exactly 14 identities, with focused 30/30, rules 280/280, full CI 693/693, deterministic content unchanged, and reviewer coverage equal to A material coverage except `generatedAt`.

## TASK P3-FB2-09

Owner: Codex B2
Status: REVIEW_ACCEPTED
Branch: `codex/b2-p3-fb2-09-any-location-except-workshop-movement-r1`
Base: exact P3-FB2-09 A-owned handoff commit
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Read: `docs/reports/2026-09-16-p3-fb2-09-any-location-except-workshop-movement-handoff.md`

Goal: implement one narrow identity-free Movement contract sufficient for the 12 frozen F1 servant skills that all say, in the action phase, move the controller to any enabled location except the Magic Workshop.

Accepted shape only:
- `phase_action`; action phase; controller action window; active source;
- exactly one location target, exactly one choice;
- location constraints exactly `any_enabled_location` + `not_location_kind: workshop`;
- exactly one effect `move_player` to that declared target;
- no conditions, cost, creates, rule modifiers, lifecycle, response window, or unrelated limits;
- controller-only movement, identity-free routing.

Implementation requirements:
- add a typed Resolution Data-flow `move_player` primitive rather than routing the new contract through legacy `resolveEffect`;
- the typed primitive must use a trusted runtime hook for authoritative movement side effects, including movement distance/battlefield counters, movement log provenance, and `after_controller_enters_location`;
- preserve existing occupancy, enabled-location, locked-battlefield, and source-active checks;
- ordinary current location and `magic_workshop` must not be legal candidates;
- recognized malformed near-matches must fail closed before generic/legacy execution;
- do not promote generic Movement, arbitrary `move_player`, multi-step/reachable movement, forced movement, third-party movement, movement modifiers, or movement with costs/conditions.

Exact frozen F1 evidence-membership list (12):
- `servant.benkei.skill.sc-benkei-1`
- `servant.bradamante.skill.sc-bradamante-1`
- `servant.brynhildr.skill.sc-brynhildr-1`
- `servant.cu.skill.sc-cu-2`
- `servant.diarmuid.skill.sc-diarmuid-3`
- `servant.donquixote.skill.sc-donquixote-3`
- `servant.enkidu.skill.sc-enkidu-3`
- `servant.jaguarman.skill.sc-jaguarman-1`
- `servant.kagetora.skill.sc-kagetora-3`
- `servant.lishuwen.skill.sc-lishuwen-3`
- `servant.romulus.skill.sc-romulus-3`
- `servant.vlad.skill.sc-vlad-3`

The 12 overlays have identical printed-text SHA-256 `5d3fd4e656083f54831c208f2e7b3c9a4ffd5977776e3a3b5214c868596ca1c0`, exact axes `ACTION + MOVE_PLAYER`, and exact overlay effect `{ type: move_player, scope: controller, destinationRule: any_location_except_workshop }`.

B2 must not migrate these 12 F1 rows. Migration remains S-owned after independent review and fresh A dependency reconciliation.

## TASK P3-R27

Owner: Codex R
Status: REVIEW_ACCEPTED
Branch: reviewer-selected fresh worktree/branch from exact FB2-09 candidate SHA

Goal: independently review the exact FB2-09 Movement sub-contract without implementing fixes and without promoting broad Movement.

Required checks include exact classifier shape, typed primitive/hook atomicity, current-location/workshop/closed/occupancy/lock negatives, same-controller source scoping, movement counters/log/event provenance, replay/state integrity where applicable, malformed fail-closed behavior, no identity routing, focused regressions, all rules, determinism, full CI, and diff check.

Permitted final status:
- `GATE_A_B_CANDIDATE_ACCEPTED`
- `REVIEW_BLOCKED`

## Full-Roster Dispatch State After P3-R26 / Before P3-FB2-09

- FM01 is independently `MIGRATION_ACCEPTED` by R26 `6d015d5bacd8cffcaf0df9827fb3e36bfa817c31`; first F4 exact batch 14 is closed.
- Frozen-F1/current-authoring scan leaves 237 block-free contract-mapped identities not yet represented by current canonical authoring.
- The largest exact single-capability block-free group is 12 `GENERIC_MOVEMENT` identities with identical `ACTION + MOVE_PLAYER` axes and identical `any_location_except_workshop` overlay semantics.
- A separate 10-identity `GENERIC_POWER + GENERIC_RESOURCE_NUMERIC` group exists but broad Power is not independently accepted, so it is not dispatched ahead of the narrower Movement slice.
- Existing runtime already owns authoritative location candidate constraints and movement side effects, but `move_player` is not yet a typed Resolution Data-flow primitive. P3-FB2-09 is therefore dispatched before any FM02 migration.
- If and only if R27 accepts FB2-09 and fresh A reconciliation confirms all 12 retain no other dependency, A may dispatch P3-FM02 at exact batch size 12.

## TASK P3-A-FB2-09-SYNC

Owner: Codex A
Status: SYNCHRONIZED
Base: R27 `698dba5a8476e3d86363f286c57c9f515746eb3f`
Read: `docs/reports/2026-09-16-p3-a-fb2-09-movement-synchronization.md`

Fresh frozen-F1 reconciliation is 12/12 exact and dependency-complete. Coverage counters remain stable; regenerated artifact drift is timestamp/static-line-only and remains uncommitted. P3-FM02 is dispatched READY at 12 identities.

## TASK P3-FM02

Owner: Codex S
Status: MIGRATION_ACCEPTED
Branch: `codex/s-p3-fm02-any-location-except-workshop-movement`
Base: exact P3-A-FB2-09 synchronization commit
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Read: `docs/reports/2026-09-16-p3-fm02-any-location-except-workshop-movement-migration-handoff.md`

Goal: migrate exactly the 12 dependency-complete Movement identities below into canonical authoring under the independently accepted FB2-09 contract. Do not modify runtime.

Exact batch:
- `servant.benkei.skill.sc-benkei-1`
- `servant.bradamante.skill.sc-bradamante-1`
- `servant.brynhildr.skill.sc-brynhildr-1`
- `servant.cu.skill.sc-cu-2`
- `servant.diarmuid.skill.sc-diarmuid-3`
- `servant.donquixote.skill.sc-donquixote-3`
- `servant.enkidu.skill.sc-enkidu-3`
- `servant.jaguarman.skill.sc-jaguarman-1`
- `servant.kagetora.skill.sc-kagetora-3`
- `servant.lishuwen.skill.sc-lishuwen-3`
- `servant.romulus.skill.sc-romulus-3`
- `servant.vlad.skill.sc-vlad-3`

Required validation and non-scope are defined in the handoff report. S must stop rather than silently broaden the batch if any identity fails exact source or contract conformance.

## TASK P3-A-FM02-SYNC

Owner: Codex A
Status: MIGRATION_SYNC_ACCEPTED
Branch: `codex/a-p3-fm02-evidence-sync`
Base: exact P3-FM02 S candidate SHA `e1d8456637648d31127d6d69daeb9d74a6d01a18`
Read: `docs/reports/2026-09-16-p3-a-fm02-synchronization.md`

Goal: independently recompute frozen-F1 before/after authoring overlap, exact 12-member batch reconciliation, fresh coverage, generated-content identity, and unrelated drift. A must not repair S authoring.

## TASK P3-R28

Owner: Codex R
Status: MIGRATION_ACCEPTED
Branch: `codex/r-p3-fm02-r28-review`

Goal: independently review FM02 without implementing fixes. Required checks: exact 12-ID membership; source/printed-text preservation; accepted FB2-09 contract conformance; static card metadata/final 8-mana skill-zone rule; no runtime changes; focused end-to-end migration representative; A burn-down integrity; determinism; full required validation; diff check.

Permitted final status: `MIGRATION_ACCEPTED` or `REVIEW_BLOCKED`.

## Full-Roster Dispatch State After P3-A-FM02-SYNC

- S candidate `e1d8456637648d31127d6d69daeb9d74a6d01a18` migrates exactly the authorized 12 Movement identities as 12 new minimal servant authoring archives plus one focused migration test and one S report; runtime hot-file changes=0.
- Independent A frozen-F1 burn-down is exact: canonical authoring overlap `37 -> 49` (+12), selected batch `0/12 -> 12/12`, unauthorized additions=0, removals=0, skipped=0.
- Fresh material coverage is committed: archives `39`, cards `71`, abilities `130`, raw `new=12 / legacyExecute=3 / legacyResolve=87 / dual=0 / notClassifiable=28 / taxonomyWarnings=104`.
- The 12 newly visible Movement abilities form one identical raw coverage signature. Their `LEGACY_RESOLVE_EFFECT` plus `phase_action_is_not_domain_trigger` reporter labels are retained without taxonomy/KPI redefinition; accepted execution is judged against the independently accepted FB2-09 contract.
- Compiled product identity remains unchanged at 70 cards / 14 characters / 0 blocking issues, definition hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`.
- A recertification: typecheck PASS, focused `27/27`, content validation 0 blocking issues, deterministic generated-content hashes unchanged, diff check PASS. S supplied rules `287/287` and full CI `700/700`.
- P3-R28 is READY from the exact A-synchronized FM02 lineage. No broader Movement, Target Selection, runtime fallback, or taxonomy acceptance is implied.

## Full-Roster Dispatch State After P3-R28

- P3-FM02 second F4 batch is `MIGRATION_ACCEPTED` for exactly 12 any-enabled-location-except-workshop Movement identities.
- S candidate: `e1d8456637648d31127d6d69daeb9d74a6d01a18`; A synchronization: `51636bfdb337839f6b57dda25d4bb86a5572e0fb`.
- Frozen 944-ID canonical-authoring overlap is now `49 / 944`, from exact `37 -> 49` (+12); exact batch `0/12 -> 12/12`; unauthorized additions, removals, and skipped members are all zero.
- Independent R28 static source/reference review is `12/12 PASS`: F1 source hash, printed clause, Reference cost/basePower/legacy requirement/type label, minimal one-card archive, and final 8-mana skill-zone rule all agree. Li Shuwen remains Assassin-owned while preserving the source-defined Lancer-class card metadata.
- Independent R28 dynamic evidence: typecheck PASS; focused `27/27`; rules `287/287`; full CI `700/700`; content validation 0 blockers; deterministic generated-content hashes unchanged; runtime lineage diff=0; diff check PASS.
- Fresh reviewer coverage equals A material coverage except `generatedAt`: archives `39`, cards `71`, abilities `130`, raw `new=12 / legacyExecute=3 / legacyResolve=87 / dual=0 / notClassifiable=28 / taxonomyWarnings=104`, source fingerprint `3e8cc78e550b61c3924f91fcfeb1b6c304c586beed9e07ee18f60403d94eb315`.
- This acceptance does not promote broad Movement, generic Target Selection, movement costs/conditions/modifiers, forced/third-party movement, reporter taxonomy changes, or any unrelated F1 identity.

## TASK P3-FB2-10

Owner: Codex B2
Status: REVIEW_ACCEPTED
Branch: `codex/b2-p3-fb2-10-saber-magic-resistance-r1`
Base: exact P3-FB2-10 A-owned handoff commit
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Read: `docs/reports/2026-09-16-p3-fb2-10-saber-magic-resistance-handoff.md`

Goal: accept exactly one identity-free TO15 Power sub-contract for the ten remaining Saber-family `瀵归瓟鍔沗 cards: combat-phase Magic Resistance sets same-battlefield engaged opponents' Magic-attribute attack-card current Power to zero for this round. Do not promote broad Power/Modifier runtime.

Exact accepted semantic shape only:
- `phase_action`; activation phase `combat`; opens `controller_combat_action_window`; `requiresSourceState=active`;
- no conditions, targets, costs, effects, creates, response window, limit, or visibility semantics;
- exactly one `ruleModifier`;
- modifier type `combat_power_modifier`; operation `set`; rule `attack.currentPower`; value exactly `0`;
- scope controller exactly `engaged_opponents_same_battlefield`; object exactly `attack_card`;
- exactly one scope constraint `has_attribute(attribute=榄旀湳)`;
- modifier lifecycle duration exactly `this_round`;
- routing/classification is structural and identity-free.

Required runtime behavior:
- exact semantic must enter a dedicated accepted route before generic/legacy fallback and install only the declared structured modifier;
- source must be active at activation; existing phase-action usage ownership preserves one activation per round;
- same-battlefield opponent Magic attacks resolve current Power to `0`;
- controller's own attacks, non-Magic opponent attacks, and Magic attacks controlled outside the controller's battlefield remain unchanged;
- modifier expires at the normal next-round boundary and must not leak into later rounds;
- malformed same-family near-matches must fail closed before generic modifier installation, atomically preserving state;
- retain existing deterministic Power trace / calculation-line provenance;
- no new Power primitive or second battle calculator unless a fresh failing test proves the existing `calculateCardPower`/ongoing infrastructure cannot satisfy this exact shape.

Already accepted sibling dependencies that B2 must preserve rather than reimplement:
- P3-B18 / R12 base Noble Bloom: optional post-result typed controller VP `+1`;
- P3-B19 / R13 Noble Bloom threshold sibling: independent optional post-result typed controller VP `+1` when highest tracked Noble Phantasm cost is at least 4;
- existing typed Resource primitive and post-scoring result envelope;
- existing phase-action once-per-round usage ownership and ongoing `this_round` cleanup.

Exact frozen F1 evidence-membership list (future FM03 candidate set, not B2 migration scope):
- `servant.altera.skill.sc-altera-3`
- `servant.arthur.skill.sc-arthur-3`
- `servant.bedivere.skill.sc-bedivere-1`
- `servant.charlemagne.skill.sc-charlemagne-3`
- `servant.gawain.skill.sc-gawain-3`
- `servant.lakshmibai.skill.sc-lakshmibai-3`
- `servant.mordred.skill.sc-mordred-3`
- `servant.musashi.skill.sc-musashi-3`
- `servant.saber.skill.sc-saber-1`
- `servant.saitou.skill.sc-saitou-1`

The ten F1 rows are block-free `READY_GENERIC_EXTENSION`, all use Reference handler `core.saber-magic-resistance`, and all normalize to the same three operations: Noble Bloom +1 VP, conditional extra +1 VP, and Magic Resistance opponent-Magic Power=0. B18/B19 already cover the two Resource siblings; FB2-10 covers only the missing Power sibling.

Required evidence:
- renamed-ID positive classifier plus near-miss negatives for phase/window/source-state/modifier type/operation/rule/scope/object/attribute/value/duration and extra semantics;
- real legal-action activation proving combat-only + active-source + once-per-round exposure;
- same-battlefield opponent Magic attack goes to exactly 0 with deterministic calculation trace;
- own/non-Magic/other-battlefield negatives;
- next-round expiry;
- malformed same-family fail-closed and mutation-free;
- B18/B19 compatibility;
- all current rules regressions, full root CI, deterministic generated-content verification, runtime identity/text audit, and diff check.

Must not touch/promote:
- broad TO15 Power/Modifier runtime;
- generic `set` or `add` modifiers beyond this exact shape;
- opponent selection/Target Selection gateways;
- card/character/ability identity routing;
- F1 authoring migration or any of the ten future FM03 archives;
- taxonomy/KPI definitions;
- Noble Bloom semantics beyond compatibility.

Completion status allowed:
- `IMPLEMENTATION_COMPLETE_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`

## TASK P3-R29

Owner: Codex R
Status: REVIEW_ACCEPTED
Branch: reviewer-selected fresh worktree/branch from exact FB2-10 candidate SHA

Goal: independently review the exact FB2-10 Magic Resistance Power sub-contract without implementing fixes or promoting broad TO15.

Required checks: exact identity-free classifier; fail-closed near-misses; active/combat/once-per-round activation; same-battlefield opponent Magic Power=0; own/non-Magic/other-battlefield negatives; this-round expiry; deterministic Power trace; no new broad Power primitive; no identity/text routing; B18/B19 compatibility; all rules, determinism, full CI, and diff check.

Permitted final status:
- `GATE_A_B_CANDIDATE_ACCEPTED`
- `REVIEW_BLOCKED`

## Full-Roster Dispatch State After P3-R28 / Before P3-FB2-10

- FM01 and FM02 are independently `MIGRATION_ACCEPTED`; frozen canonical-authoring overlap is `49 / 944`, leaving `895 / 944` F1 identities not yet represented by current canonical authoring.
- Fresh R28-lineage scan finds exactly one remaining block-free, contract-mapped, `READY_GENERIC_EXTENSION` semantic group at normal F4 minimum size >=10: ten Saber-family `GENERIC_POWER + GENERIC_RESOURCE_NUMERIC` identities.
- All ten share Reference handler `core.saber-magic-resistance` and the same normalized operation set. Printed-text/source-hash variation is wording/card-source variation, not a different operation family.
- The Noble Bloom base and threshold Resource siblings are already independently accepted by R12/B18 and R13/B19 and use typed Resource settlement. They must not be reimplemented.
- TO15 Modifier/Power remains spec-only with `Runtime authorization: none`. Existing Artoria Alter legacy/canonical content proves the intended structured modifier shape and existing ongoing/Power infrastructure can evaluate it, but that historical execution does not itself authorize broad Power.
- P3-FB2-10 therefore dispatches only the exact Magic Resistance modifier shape. It must route/fail-close structurally before generic fallback and reuse existing `this_round` ongoing + `calculateCardPower` infrastructure.
- If and only if R29 accepts FB2-10 and fresh A reconciliation confirms the same ten F1 rows retain no additional dependency, A may dispatch P3-FM03 at exact batch size 10.


## TASK P3-A-FB2-10-SYNC

Owner: Codex A
Status: SYNCHRONIZED
Base: R29 `37fcdaf6d3367a4efb9dcfaf8a1a532fb4354ae9`
Read: `docs/reports/2026-09-16-p3-a-fb2-10-saber-magic-resistance-synchronization.md`

Fresh coverage is KPI-stable and regenerated artifact drift is generatedAt/static-line-only, so the artifact remains uncommitted. Frozen-F1 reconciliation is exact 10/10 and all selected rows are dependency-complete under R12/B18 + R13/B19 + R29/FB2-10. P3-FM03 is dispatched READY at exact batch size 10.

## TASK P3-FM03

Owner: Codex S
Status: MIGRATION_ACCEPTED
Branch: `codex/s-p3-fm03-saber-magic-resistance`
Base: exact P3-A-FB2-10 synchronization commit
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Read: `docs/reports/2026-09-16-p3-fm03-saber-magic-resistance-migration-handoff.md`

Goal: migrate exactly the ten dependency-complete Saber-family Magic Resistance identities below into canonical authoring using the independently accepted B18/B19/FB2-10 contracts. Do not modify runtime.

Exact batch:
- `servant.altera.skill.sc-altera-3`
- `servant.arthur.skill.sc-arthur-3`
- `servant.bedivere.skill.sc-bedivere-1`
- `servant.charlemagne.skill.sc-charlemagne-3`
- `servant.gawain.skill.sc-gawain-3`
- `servant.lakshmibai.skill.sc-lakshmibai-3`
- `servant.mordred.skill.sc-mordred-3`
- `servant.musashi.skill.sc-musashi-3`
- `servant.saber.skill.sc-saber-1`
- `servant.saitou.skill.sc-saitou-1`

Required accepted dependencies:
- B18/R12 exact base Noble Bloom optional post-result controller VP +1;
- B19/R13 exact threshold Noble Bloom optional extra controller VP +1 when highest tracked Noble Phantasm cost is at least 4;
- FB2-10/R29 exact combat Magic Resistance modifier route;
- final skill-zone rule uses 8 mana, not historical Reference requirement=3.

May touch only selected `data/authoring/` servant archive records/files, exact-batch migration tests/fixtures, and the FM03 migration report. Must not modify runtime hot files, coverage/taxonomy definitions, F1 frozen artifacts, or unrelated authoring.

Completion status allowed:
- `MIGRATION_CANDIDATE`
- `MIGRATION_NEEDS_REVISION`

## TASK P3-A-FM03-SYNC

Owner: Codex A
Status: MIGRATION_SYNC_ACCEPTED
Branch: `codex/a-p3-fm03-evidence-sync`
Base: P3-FM03 S candidate `cac8a0065dadd190aab6666989571845e4de0f1c`

Goal: independently recompute frozen-F1 authoring burn-down, exact ten-member batch reconciliation, fresh material coverage, generated-content identity, and unrelated drift. A must not repair S authoring.

Completion status allowed:
- `MIGRATION_SYNC_CANDIDATE`
- `MIGRATION_SYNC_NEEDS_REVISION`

## TASK P3-R30

Owner: Codex R
Status: MIGRATION_ACCEPTED
Branch: reviewer-selected fresh worktree/branch from exact A-synchronized FM03 lineage

Goal: independently review FM03 without implementing fixes. Required checks: exact ten-ID membership; per-card F1 source/printed-text preservation; accepted B18/B19/FB2-10 structural conformance; locked static metadata/final 8-mana skill-zone rule; no runtime changes; representative end-to-end Power/VP behavior; A burn-down integrity; determinism; full required validation; diff check.

Permitted final status:
- `MIGRATION_ACCEPTED`
- `MIGRATION_NEEDS_REVISION`
- `REJECTED`

## Full-Roster Dispatch State After P3-A-FB2-10-SYNC

- R29 independently accepts only the exact FB2-10 Magic Resistance Power sub-contract; broad TO15 Power/Modifier remains unaccepted.
- Fresh frozen-F1 reconciliation is `10/10 PASS`: every selected identity is `CONTRACT_MAPPED`, `READY_GENERIC_EXTENSION`, `blockedBy=[]`, requires exactly `GENERIC_POWER + GENERIC_RESOURCE_NUMERIC`, uses Reference handler `core.saber-magic-resistance`, and has the same normalized two-operation source overlay.
- B18/R12 and B19/R13 independently cover the two Noble Bloom Resource siblings; R29/FB2-10 covers the only missing Magic Resistance Power sibling.
- Current frozen-F1 canonical-authoring overlap remains `49/944`; none of the ten FM03 identities currently has canonical authoring (`0/10`).
- Locked Reference metadata is uniform for all ten selected cards: `cost=3`, `basePower=3`, `typeLabel=鐗规畩`, historical `requirement=3`. Final rule 9.4 still requires 8 mana from the skill zone.
- Source/printed text is not globally identical: F1 preserves three source-hash variants (`8a6da48...`, `b2b1bc7c...`, `0cdfc3fa...`) and S must preserve the per-card text exactly rather than normalize wording.
- Fresh coverage remains archives `39`, cards `71`, abilities `130`, raw `new=12 / legacyExecute=3 / legacyResolve=87 / dual=0 / notClassifiable=28 / taxonomyWarnings=104`, compiled definition hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`, 70 compiled cards / 14 characters / 0 blocking issues. Regenerated artifact drift is only generatedAt/static source-line movement and is intentionally not committed.
- P3-FM03 is therefore READY at the normal F4 minimum batch size 10.

## Full-Roster Dispatch State After P3-A-FM03-SYNC

- P3-FM03 S candidate is `cac8a0065dadd190aab6666989571845e4de0f1c`; exact batch membership is 10/10 and runtime hot-file changes are zero.
- Frozen-F1 canonical-authoring overlap moves `49/944 -> 59/944` (+10); selected batch moves `0/10 -> 10/10`; unauthorized additions, removals, and skips are zero.
- Fresh A material coverage is archives `49`, cards `81`, abilities `160`, raw `new=12 / legacyExecute=3 / legacyResolve=107 / dual=0 / notClassifiable=38 / taxonomyWarnings=114`.
- The 20 newly visible Noble Bloom abilities retain the reporter's existing `LEGACY_RESOLVE_EFFECT` label; the 10 Magic Resistance phase actions retain the existing `NOT_CLASSIFIABLE` plus phase-action taxonomy warning. All 30 selected abilities are structurally identical, excluding identity fields, to the three independently accepted Artoria Alter representatives.
- Compiled product identity remains definition hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`, 70 cards / 14 characters / 0 blocking issues.
- A recertification passes typecheck, focused FM03 + FB2-10 + B18/B19 `21/21`, content validation, deterministic generated-content verification, and diff check. S evidence supplies rules `292/292`; standard parallel CI has only the known eleven-round 5s wall-clock timeout (`704/705`), with isolated match-session `26/26` and equivalent single-worker CI `705/705`.
- P3-R30 is READY on the exact A-synchronized lineage; FM03 is not accepted until R30 independently reviews it.


## TASK P3-A-FM04-IA-RECONCILIATION

Owner: Codex A
Status: RECONCILIATION_ACCEPTED
Branch: `codex/a-p3-fm04-planning`
Base: R30 `27a112888058a3fe4dd5882bc95054e7346de4a5`
Read: `docs/reports/2026-09-16-p3-a-fm04-independent-action-reconciliation.md`

Goal: reconcile only the exact eleven-member Archer Independent Action family against already accepted TO08 Resource direct-action and B21/R15 unpreventable battle-loss semantics. Do not modify runtime or frozen F1.

Exact prospective family: Atalanta SC3, Baobhan Sith SC3, Chiron SC1, EMIYA Alter SC1, Euryale SC1, Gilgamesh SC1, Ishtar SC3, Napoleon SC3, Robin Hood SC1, Tomoe SC1, Tristan SC3. Tomoe is the sole pre-existing canonical representative; the other ten are prospective migration additions.

Completion status allowed:
- `RECONCILIATION_CANDIDATE`
- `RECONCILIATION_NEEDS_REVISION`

## TASK P3-R31

Owner: Codex R
Status: SPECIAL_FAMILY_ACCEPTED
Branch: reviewer-selected fresh worktree/branch from exact P3-A-FM04-IA-RECONCILIATION commit

Goal: independently judge whether the frozen `SPECIAL_EFFECT:independent_action_rule` / Gil `gil_independent_action_rule` blockers are fully discharged for the exact eleven-member family by canonical Tomoe plus independently accepted TO08 and B21/R15 runtime contracts. Do not implement fixes.

Required checks:
- exact 11-ID F1/Reference family membership and identical printed/source hash;
- Gil has no identity-specific extra Reference mechanic despite blocker-label spelling;
- uniform locked static metadata;
- Tomoe is the only currently canonical family member;
- Tomoe's two authored abilities exhaust the frozen printed text;
- TO08 accepts the first-half conditioned +3 VP action structurally;
- B21/R15 accepts the exact unpreventable post-loss -5 VP sibling structurally;
- current focused tests pass independently;
- no runtime/F1/authoring mutation in the reconciliation candidate;
- no broad Special Handler promotion.

Permitted final status:
- `SPECIAL_FAMILY_ACCEPTED`
- `RECONCILIATION_BLOCKED`

If and only if R31 returns `SPECIAL_FAMILY_ACCEPTED`, A may freshly reconcile the exact lineage and dispatch P3-FM04 at exact batch size 11 (Tomoe pre-existing + ten new siblings).

## TASK P3-A-FM04-DISPATCH-SYNC

Owner: Codex A
Status: SYNCHRONIZED
Branch: `codex/a-p3-fm04-independent-action-sync`
Base: R31 `9d5498027f05ace0aa3a018da87473a1b47b7a21`
Read: `docs/reports/2026-09-16-p3-a-fm04-independent-action-dispatch.md`

Fresh lineage reconciliation confirms the exact eleven-member family remains one pre-existing canonical Tomoe plus ten missing siblings. Coverage is unchanged except `generatedAt`, so the regenerated artifact is intentionally not committed. P3-FM04 is READY at exact batch size 11.

## TASK P3-FM04

Owner: Codex S
Status: MIGRATION_ACCEPTED
Branch: `codex/s-p3-fm04-independent-action`
Base: exact P3-A-FM04-DISPATCH-SYNC commit
Candidate: `0047b30cd00fd3093f01db373f69cc9540466cd5`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Read: `docs/reports/2026-09-16-p3-fm04-independent-action-migration-handoff.md`

Goal: migrate exactly the accepted eleven-member Archer Independent Action family. Tomoe is already canonical and must remain unchanged; add only the ten missing siblings.

Completion status allowed:
- `MIGRATION_CANDIDATE`
- `MIGRATION_NEEDS_REVISION`

## TASK P3-A-FM04-MIGRATION-SYNC

Owner: Codex A
Status: MIGRATION_SYNC_ACCEPTED
Branch: `codex/a-p3-fm04-migration-sync`
Base: P3-FM04 S candidate `0047b30cd00fd3093f01db373f69cc9540466cd5`
Read: `docs/reports/2026-09-16-p3-a-fm04-migration-synchronization.md`

Goal: independently recompute frozen-F1 burn-down, exact family/batch membership, material coverage, generated-content identity, and unrelated drift. A must not repair S authoring.

Completion status allowed:
- `MIGRATION_SYNC_CANDIDATE`
- `MIGRATION_SYNC_NEEDS_REVISION`

## TASK P3-R32

Owner: Codex R
Status: MIGRATION_ACCEPTED
Branch: reviewer-selected fresh worktree/branch from exact A-synchronized FM04 lineage

Goal: independently review FM04 without implementing fixes. Required checks: exact 11-member accepted family; only ten new archives; Tomoe unchanged; frozen source text/hash preservation; uniform locked static metadata; exact Tomoe-derived two-ability decomposition; accepted TO08 + B21/R15 structural conformance; representative end-to-end +3 VP and unpreventable -5 VP behavior; A burn-down integrity; determinism; full required validation; diff check.

Permitted final status:
- `MIGRATION_ACCEPTED`
- `MIGRATION_NEEDS_REVISION`
- `REJECTED`
## Full-Roster Dispatch State After P3-A-FM04-MIGRATION-SYNC

- FM04 S candidate is `0047b30cd00fd3093f01db373f69cc9540466cd5`; exact accepted family is 11 members with Tomoe pre-existing and exactly ten new sibling archives.
- Frozen-F1 canonical-authoring overlap moves `59/944 -> 69/944` (+10); Independent Action family moves `1/11 -> 11/11`; unauthorized additions/removals/skips are zero and Tomoe has zero diff.
- Fresh A material coverage is archives `59`, cards `91`, abilities `180`, raw `new=22 / legacyExecute=3 / legacyResolve=117 / dual=0 / notClassifiable=38 / taxonomyWarnings=124`.
- The twenty new abilities split exactly into ten TO08 Resource direct actions and ten B21/R15 unpreventable battle-loss penalties under the reporter's existing legacy label.
- Compiled product identity remains definition hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`, 70 cards / 14 characters / 0 blocking issues.
- A recertification passes typecheck, focused `15/15`, content validation, deterministic generated-content verification, and diff check. S evidence supplies rules `292/292` and standard full CI `705/705`.
- P3-R32 is READY on the exact A-synchronized lineage; FM04 is not accepted until R32 independently reviews it.

## Full-Roster Dispatch State After P3-R32 / FM04

- FM04 is independently `MIGRATION_ACCEPTED` for the exact eleven-member Archer Independent Action family: Tomoe pre-existing plus ten newly canonical siblings.
- S candidate is `0047b30cd00fd3093f01db373f69cc9540466cd5`; A material synchronization is `3e816160d8051a314e8b20cf2c2d924dcd0c7e3e`.
- Frozen-F1 canonical-authoring overlap moves `59/944 -> 69/944` (+10); family moves `1/11 -> 11/11`; unauthorized additions/removals/skips are zero.
- Independent R32 evidence: static/source reconciliation 11/11; focused `15/15`; rules `292/292`; standard full CI `705/705`; content 0 blockers; determinism unchanged; runtime diff=0; Tomoe diff=0.
- Fresh reviewer coverage equals A material coverage except `generatedAt`: `59/91/180`, raw `22/3/117/0/38/124`, compiled identity unchanged.
- No broad Special Subsystem or taxonomy promotion is implied.

## TASK P3-FB2-11

Owner: Codex B2
Status: REVIEW_ACCEPTED
Branch: `codex/b2-p3-fb2-11-round-number-formula-r1`
Base: exact A-owned FB2-11 handoff commit
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Read: `docs/reports/2026-09-16-p3-fb2-11-round-number-formula-handoff.md`

Goal: add exactly one trusted read-only formula metric, `game.round_number`, returning authoritative `state.round.roundNumber`. Reuse existing controlled AST `add/multiply`; do not add subtraction or any other operator, string parsing, arbitrary state paths, identity routing, or F1 authoring.

May touch only the formula metric allowlist/evaluator, focused tests, and B2 report. Preserve FB2-02 deployment-resource behavior and existing Drake formula behavior.

Completion status allowed:
- `IMPLEMENTATION_COMPLETE_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`

## TASK P3-R33

Owner: Codex R
Status: REVIEW_ACCEPTED
Branch: reviewer-selected fresh worktree/branch from exact FB2-11 candidate SHA

Goal: independently review FB2-11 without implementing fixes. Required checks: exact read-only round metric; loader fail-closed near variables; no formula-op expansion; Territory expression round 1/4/7/8 values; deterministic trace; existing Drake compatibility; FB2-02 compatibility; no identity/text routing; typecheck, rules, determinism, full CI, diff check. R33 must also independently reconcile the prospective exact ten-card Territory Creation family: identical frozen full text/source clause hashes, same Reference handler/static metadata, F1 5+5 classification split is evidence-classification drift only, and the complete two-clause card is covered by FB2-11 + accepted FB2-02.

Permitted final status:
- `GATE_A_B_CANDIDATE_ACCEPTED`
- `REVIEW_BLOCKED`

## TASK P3-A-FB2-11-SYNC

Owner: Codex A
Status: SYNCHRONIZED
Branch: `codex/a-p3-fb2-11-round-number-formula-sync`
Base: R33 `0121d500b3abda1e9ef4de45c9a266620aa20f45`
Read: `docs/reports/2026-09-16-p3-a-fb2-11-round-number-formula-synchronization.md`
Branch: `codex/a-p3-fb2-11-round-number-formula-sync`

Goal: synchronize exact R33 facts, run fresh coverage/recertification, and if and only if R33 accepts the metric plus ten-member family reconciliation, dispatch P3-FM05 at exact batch size 10. A must not migrate authoring.

## TASK P3-FM05

Owner: Codex S
Status: MIGRATION_ACCEPTED
Branch: `codex/s-p3-fm05-territory-creation`
Base: exact P3-A-FB2-11 synchronization `fd17ba227182e5e9a14d093390bbfb3a47af1c39`
Candidate: `3e66365a03c12b4a1d683bdae5e9350acad80455`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Read: `docs/reports/2026-09-16-p3-fm05-territory-creation-migration.md`

Goal: migrate exactly the ten R33-reconciled Territory Creation identities using accepted FB2-11 round-number formula metric plus FB2-02 deployment reward. No runtime changes.

Completion status allowed:
- `MIGRATION_CANDIDATE`
- `MIGRATION_NEEDS_REVISION`

## TASK P3-A-FM05-MIGRATION-SYNC

Owner: Codex A
Status: MIGRATION_SYNC_ACCEPTED
Branch: `codex/a-p3-fm05-migration-sync`
Base: P3-FM05 S candidate `3e66365a03c12b4a1d683bdae5e9350acad80455`
Read: `docs/reports/2026-09-16-p3-a-fm05-migration-synchronization.md`

Goal: independently recompute frozen-F1 burn-down, exact ten-member batch membership, material coverage, generated-content identity, and unrelated drift. A must not repair S authoring.

Completion status allowed:
- `MIGRATION_SYNC_CANDIDATE`
- `MIGRATION_SYNC_NEEDS_REVISION`

## TASK P3-R34

Owner: Codex R
Status: MIGRATION_ACCEPTED
Branch: reviewer-selected fresh worktree/branch from exact A-synchronized FM05 lineage

Goal: independently review FM05 without implementing fixes. Required checks: exact ten-ID membership; frozen F1 full-text and two clause hashes; locked Reference owner/class/static metadata; exact controlled round formula AST; accepted FB2-11 and FB2-02 structural conformance; representative round 1/4/7/8 Power and Magic Workshop deployment reward; A burn-down/material coverage integrity; no runtime changes; determinism; full validation; diff check.

Permitted final status:
- `MIGRATION_ACCEPTED`
- `MIGRATION_NEEDS_REVISION`
- `REJECTED`

## Full-Roster Dispatch State After P3-R32 / Before P3-FB2-11

- FM01-FM04 are independently migration-accepted; frozen canonical-authoring overlap is `69 / 944`, leaving `875 / 944` absent.
- Fresh exact-text scan finds next large families: Presence Concealment 12, Territory Creation 10, Alter Ego 9. Territory Creation is selected because its Resource sibling is already accepted by FB2-02 and the only runtime gap is a read-only current-round Power formula metric.
- Exact Territory family text SHA is `295a5b531db5d1031cbbb89dc677e76737b7d3b3c7ca70af59405cc84bd98c58`; all ten share the same two clause hashes and Reference handler `core.territory-creation`.
- Current formula engine already supports controlled `add/multiply`, numeric negative constants, formula AST budgeting, finite checks, and deterministic calculation lines. It does not currently authorize any current-round variable.
- FB2-11 therefore adds only `game.round_number`; future Territory X is `16 + (-2 * game.round_number)`. Broad formula language expansion is forbidden.
- Locked Reference static metadata for all ten is uniform: Magic type, cost 0, historical requirement 0, historical static basePower 2. Frozen F1 printed formula remains semantic authority; the historical 2 is metadata only.
- F1's five Resource-only vs five scaling-only classification split cannot be used to split the migration because all ten frozen cards are text-identical. R33 must reconcile the complete family before FM05 dispatch.

## Full-Roster Dispatch State After P3-R33 / FB2-11

- R33 independently accepts exact FB2-11: only trusted read-only `game.round_number`; no formula-op expansion, string formula, arbitrary state path, identity/text routing, or authoring mutation.
- Candidate `5383c37c8362341b8a581624b8ad1d77ddce3567` passes focused `12/12`, rules `297/297`, standard full CI `710/710`, content validation 0 blockers, determinism unchanged, diff/identity audit clean.
- Exact prospective Territory Creation family is 10/10 text/source/handler/static-metadata identical and currently 0/10 canonical. Frozen F1 split is 5 block-free Resource + 5 scaling-blocked rows, independently judged classification drift only.
- Accepted FB2-02 covers the deployment reward; accepted FB2-11 covers the only missing round-number formula dependency. The complete ten-card family is dependency-complete pending fresh A synchronization.
- P3-A-FB2-11-SYNC is READY. P3-FM05 remains blocked until that synchronization dispatches it.

## Full-Roster Dispatch State After P3-A-FB2-11-SYNC

- R33 exact FB2-11 acceptance is synchronized; coverage KPI remains FM04-stable at `59/91/180`, raw `22/3/117/0/38/124`, compiled identity unchanged. Regenerated artifact drift is only timestamp plus seven static source-line +1 shifts and is intentionally uncommitted.
- Frozen canonical-authoring overlap remains `69/944`; exact Territory Creation family remains `0/10` canonical and is dependency-complete under FB2-11 + FB2-02.
- P3-FM05 is READY at exact batch size 10. S must not include Medea/Gilles or any other Reference family member outside the frozen identical-text group.
- Actual Territory Power is frozen F1 `X=16-(round*2)` expressed by controlled AST; Reference static Power 2 is evidence metadata only. Final skill-zone rule is 8 mana.

## Full-Roster Dispatch State After P3-A-FM05-MIGRATION-SYNC

- P3-FM05 S candidate is `3e66365a03c12b4a1d683bdae5e9350acad80455`; exact batch membership is 10/10 and runtime hot-file changes are zero.
- Frozen-F1 canonical-authoring overlap moves `69/944 -> 79/944` (+10); selected batch moves `0/10 -> 10/10`; unauthorized additions, removals, and skips are zero.
- Fresh A material coverage is archives `69`, cards `101`, abilities `200`, raw `new=22 / legacyExecute=3 / legacyResolve=127 / dual=0 / notClassifiable=48 / taxonomyWarnings=124`.
- The ten deployment rewards retain the reporter's current legacy-resolve label; the ten controlled continuous formulas retain the reporter's current not-classifiable label. No KPI/taxonomy redefinition is performed.
- Compiled product identity remains definition hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`, 70 cards / 14 characters / 0 blocking issues.
- A recertification passes typecheck, focused `17/17`, content validation, deterministic generated-content verification, and diff check. S evidence supplies rules `368/368` and standard full CI `710/710`.
- P3-R34 is READY on the exact A-synchronized lineage; FM05 is not accepted until R34 independently reviews it.

## Full-Roster Dispatch State After P3-R34 / FM05

- FM05 is independently `MIGRATION_ACCEPTED` for exactly ten Territory Creation identities.
- S candidate is `3e66365a03c12b4a1d683bdae5e9350acad80455`; A material synchronization is `5f3e3810e6cc16fbdb03d83c38b8b9087a6587d7`.
- Frozen-F1 canonical-authoring overlap moves `69/944 -> 79/944` (+10); exact batch moves `0/10 -> 10/10`; unauthorized additions/removals/skips are zero.
- Independent R34 evidence: source/static/structure reconciliation 10/10; focused `17/17`; rules `368/368`; standard full CI `710/710`; content 0 blockers; deterministic hashes unchanged; runtime diff=0; diff check PASS.
- Fresh reviewer coverage equals A material coverage except `generatedAt`: `69/101/200`, raw `22/3/127/0/48/124`, compiled identity unchanged.
- This acceptance does not promote broad formula language, broad Trigger/Power semantics, Special Subsystem, or taxonomy/KPI changes.

## TASK P3-FB2-12

Owner: Codex B2
Status: REVIEW_ACCEPTED
Branch: `codex/b2-p3-fb2-12-presence-concealment-r1`
Base: `f1bd75e958753ca48d8d08a9a37bb8901abbeadc`
Candidate: `4c97449de07b1e7a859d8ef43b60e34069541830`
Review: P3-R35 `ee3367b1ea17e6db9d98b1ae42d769fae6122d5e`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Read: `docs/reports/2026-09-16-p3-fb2-12-presence-concealment-handoff.md`

Goal: add exactly one identity-free post-Power/pre-scoring Presence Concealment response semantic. Use a trusted frozen battle Power snapshot, derive all highest-Power opponents when the controller is strict second in a 3+ participant battle, apply only battle-local defeat with existing defeat-ignore authority, and rebuild the same canonical battle result before scoring. Do not migrate authoring.

Completion status allowed:
- `IMPLEMENTATION_COMPLETE_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`

## TASK P3-R35

Owner: Codex R
Status: REVIEW_ACCEPTED
Branch: `codex/r-p3-fb2-12-presence-concealment-review`
Candidate: `4c97449de07b1e7a859d8ef43b60e34069541830`
Review SHA: `ee3367b1ea17e6db9d98b1ae42d769fae6122d5e`

Goal: independently review the exact FB2-12 Presence Concealment pre-scoring contract without implementing fixes or promoting broad Trigger/defeat/battle rewriting. Required checks are the handoff's exact classifier, trusted snapshot provenance, strict-second condition, tied-highest derived targets, optional decline, once-per-round ownership, defeat-ignore behavior, frozen-Power recomputation, scoring barrier, turn-order sequencing, replay idempotence, no identity/text routing, no global defeated/elimination state, all rules/determinism/full CI/diff check, plus independent reconciliation of the exact twelve-member future FM06 family.

Permitted final status:
- `GATE_A_B_CANDIDATE_ACCEPTED`
- `REVIEW_BLOCKED`

## TASK P3-FM06

Owner: Codex S
Status: MIGRATION_ACCEPTED
Branch: `codex/s-p3-fm06-presence-concealment`
Base: exact P3-FB2-12 A synchronization `35aa5ef063fe6d8c6c611f70f0696bf111a80657`
Candidate: `ebc1ca575fcef0e3894b13ec10613801e4227970`
A sync: `34f891a7739e86b835bc78e65aa58fdf5f4e955a`
Review: P3-R36 `e8bc73ede18c14d97158aa8677ae3498fa829935`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Read: `docs/reports/2026-09-16-p3-a-fb2-12-synchronization.md` and `docs/reports/2026-09-16-p3-fb2-12-presence-concealment-handoff.md`

Goal: migrate exactly the twelve frozen Presence Concealment identities authorized by P3-R35 into minimal canonical authoring archives using only the accepted FB2-12 structural response semantic. Preserve frozen F1 text/evidence and locked Reference static metadata. Do not include Sion EX, other Assassin skills, or unrelated special handlers. Do not modify runtime.

Completion status allowed:
- `MIGRATION_COMPLETE_CANDIDATE`
- `MIGRATION_BLOCKED`

## TASK P3-R36

Owner: Codex R
Status: MIGRATION_ACCEPTED
Branch: `codex/r-p3-fm06-presence-concealment-review`
Candidate S SHA: `ebc1ca575fcef0e3894b13ec10613801e4227970`
A sync SHA: `34f891a7739e86b835bc78e65aa58fdf5f4e955a`
Review SHA: `e8bc73ede18c14d97158aa8677ae3498fa829935`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Read: `docs/reports/2026-09-16-p3-a-fm06-migration-synchronization.md`, `docs/reports/2026-09-16-p3-fm06-presence-concealment-migration.md`, and `docs/reports/2026-09-16-p3-r35-fb2-12-presence-concealment-review.md`

Goal: independently review the exact twelve-member FM06 Presence Concealment migration without implementing fixes. Required checks: exact 12-ID addition and no removals/unauthorized additions; frozen full-text SHA and four clause-source SHAs; locked Reference legacy/static/owner metadata including Kiritsugu class Master; final 8-mana skill-zone gate with printed cost 3; exact FB2-12 structural conformance; Semiramis FM05 skill2 object preservation; material coverage/burn-down integrity; no runtime diff; representative real-card pre-scoring execution; focused/rules/content/determinism/full CI/diff check.

Permitted final status:
- `MIGRATION_ACCEPTED`
- `MIGRATION_NEEDS_REVISION`
- `REJECTED`

## TASK P3-FB2-13

Owner: Codex B2
Status: REVIEW_ACCEPTED
Branch: `codex/b2-p3-fb2-13-alter-ego-transform-r1`
Base: `61d9f0c92e0af7598e237b71fb90ad83c13c88c1`
Candidate: `18f2733eb0551f368e78a5f67ad9a32b96193d5b`
Review: P3-R37 `dc96afa3253dcf86a13e13ea29c8b99fb895df49`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Read: `docs/reports/2026-09-16-p3-fb2-13-alter-ego-transform-handoff.md`, `docs/reports/2026-09-16-p3-fb2-13-alter-ego-transform-result.md`, and `docs/reports/2026-09-16-p3-r37-fb2-13-alter-ego-transform-review.md`

Accepted boundary: identity-free trusted `on_card_played` target binding; physical reversed/effective-attribute instance state; regular transform + close; Sion-shaped fixed-3-mana/no-close/once-per-round EX; server-owned attribute choice; fail-closed continuation revalidation; and transform cleanup on board exit. No identity/text routing, broad Trigger/transform promotion, or authoring migration is accepted by implication.

## TASK P3-R37

Owner: Codex R
Status: REVIEW_ACCEPTED
Branch: `codex/r-p3-fb2-13-alter-ego-transform-review`
Candidate: `18f2733eb0551f368e78a5f67ad9a32b96193d5b`
Review SHA: `dc96afa3253dcf86a13e13ea29c8b99fb895df49`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Read: `docs/reports/2026-09-16-p3-r37-fb2-13-alter-ego-transform-review.md`

Verdict: `GATE_A_B_CANDIDATE_ACCEPTED`. Independent evidence: focused/high-risk `101/101`, rules `385/385`, full CI `727/727`, content 0 blockers, deterministic hashes unchanged, fresh coverage `80/113/212` with raw `22/3/127/0/60/124`, exact future FM07 family reconciled at 10/10 and current canonical 0/10.

## TASK P3-FM07

Owner: Codex S
Status: MIGRATION_ACCEPTED
Branch: `codex/s-p3-fm07-alter-ego-transform`
Base: exact P3-FB2-13 A synchronization `2fec63dbd6533f435e851c471d3bf00fa75695e2`
Candidate: `9c32957b13bc3964932b9a134702c1487069e059`
A sync: `1d04b43094a3797413069182a994426eab28f816`
Review: P3-R38 `f7666f48f7eb00baeadb63f24fb56fc39991f372`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Read: `docs/reports/2026-09-16-p3-fm07-alter-ego-transform-migration.md`

Goal: migrate exactly the ten F1 identities whose locked Reference handler is `core.alter-ego-transform`: the nine-card regular text family plus distinct `master.sion.skill.s12` EX metadata as separate structural variants. Preserve frozen text/evidence and locked Reference static/owner metadata. Use only the accepted FB2-13 structural routes. Do not combine other Alter Ego/reverse-capable cards, do not modify runtime, and do not broaden Trigger/transform semantics.

S evidence: exact 10 authoring additions, no removals/runtime diff, FM01-FM07 + FB2-13 `56/56`, rules regression/core `385/385`, full CI `727/727`, content 0 blockers, determinism unchanged, material overlap `91/944 -> 101/944`.

## TASK P3-A-FM07-MIGRATION-SYNC

Owner: Codex A
Status: MIGRATION_SYNC_ACCEPTED
Branch: `codex/a-p3-fm07-migration-sync`
Base: exact P3-FM07 S candidate `9c32957b13bc3964932b9a134702c1487069e059`
Synchronization SHA: `1d04b43094a3797413069182a994426eab28f816`
Read: `docs/reports/2026-09-16-p3-a-fm07-migration-synchronization.md`

Goal: independently recompute frozen-F1 burn-down, exact ten-member batch membership, per-card F1/Reference integrity, fresh material coverage, generated-content identity, and unrelated drift. A must not repair S authoring.

Completion status allowed:
- `MIGRATION_SYNC_CANDIDATE`
- `MIGRATION_SYNC_NEEDS_REVISION`

## TASK P3-R38

Owner: Codex R
Status: MIGRATION_ACCEPTED
Branch: reviewer-selected fresh worktree/branch from exact A-synchronized FM07 lineage
Candidate S SHA: `9c32957b13bc3964932b9a134702c1487069e059`
A sync SHA: `1d04b43094a3797413069182a994426eab28f816`
Review SHA: `f7666f48f7eb00baeadb63f24fb56fc39991f372`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Read: `docs/reports/2026-09-16-p3-a-fm07-migration-synchronization.md`, `docs/reports/2026-09-16-p3-fm07-alter-ego-transform-migration.md`, and `docs/reports/2026-09-16-p3-r37-fb2-13-alter-ego-transform-review.md`

Goal: independently review the exact ten-member FM07 Alter Ego migration without implementing fixes. Required checks: exact 10-ID addition/no removals; nine regular source-text SHA plus distinct Sion EX SHA; locked owner/class/legacy/static metadata including Passionlip's distinct `鐗规畩` metadata and Sion `Master`; final 8-mana skill-zone gate kept separate from printed card cost and Sion's triggered 3-mana payment; exact FB2-13 regular/EX structural conformance; real migrated regular and EX execution; A burn-down/material coverage integrity; no runtime diff; focused/migration/rules/content/determinism/full CI/diff check.

Permitted final status:
- `MIGRATION_ACCEPTED`
- `MIGRATION_NEEDS_REVISION`
- `REJECTED`

## Full-Roster Dispatch State After P3-R38 / FM07

- FM01-FM07 are independently migration-accepted. Accepted canonical overlap is `101/944`, leaving `843/944` identities outside independently accepted canonical authoring.
- FM07 S candidate `9c32957b13bc3964932b9a134702c1487069e059` adds exactly ten canonical identities and no removals; A synchronization `1d04b43094a3797413069182a994426eab28f816` independently confirms the exact `91/944 -> 101/944` burn-down.
- R38 review `f7666f48f7eb00baeadb63f24fb56fc39991f372` is `MIGRATION_ACCEPTED` with no blocking finding. The complete frozen denominator remains `943 static + 1 dynamic = 944`, and the exact new set is the authorized ten-member `core.alter-ego-transform` family.
- A and R38 independently rechecked all ten frozen hashes and locked static metadata; the nine servant cards keep regular SHA `b6c74ac37a50b671ded913dbc6ae6736f2057904fe4c02924d79f84971cebbdf`, while Sion EX keeps SHA `43c84de7cf6532ee6b561d8cfa35ddbdeac52850f6105684b23a82121636a892`.
- Accepted-lineage coverage is `90 archives / 123 cards / 222 abilities`, raw `22/3/127/0/70/124`; the `+10 notClassifiable` rows are exactly the new `transform_event_source_card` material rows and no taxonomy change is used to manufacture route credit.
- R38 independently revalidated typecheck, FM01-FM07 migration + FB2-13 focused `56/56`, rules regression/core `385/385`, standard full CI `727/727`, content validation with `0` blockers, generated-content determinism, coverage integrity, and `git diff --check`.
- Runtime production diff from the pre-FM07 accepted A-sync is `0` files.
- PR1 integration checkpoint stops at FM07/R38 with accepted overlap `101/944`. The FB2-14/FM08 recovery and PR2 integration sections below supersede this checkpoint for subsequent work.

## TASK P3-FB2-14

Owner: Codex B2
Status: REVIEW_ACCEPTED_RECOVERY
Branch: `codex/b2-p3-fb2-14-game-start-rule-overrides-r3-recovery`
Original A handoff base: `50602c9355794c9c0c7fe4d79b75f7936d912c17`
Blocked r2: `3879203870bb05ad9619c03c60c69ed9e1941080`
Traceable R39 blocker report: `68b173d480df7a7b0e83cdc403e73616c3216b2f`
Recovery candidate: `0831d9fea7c0ffedde634333f27564ea3c1dc65a`
Accepted R39 recovery review: `45e1cc6ff25fe6da838b8d7fca382d0504275aa7`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Read: original A handoff, `2026-09-17-p3-r39-fb2-14-r2-recovery-review.md`, `2026-09-17-p3-fb2-14-game-start-rule-overrides-r3-recovery-result.md`, and `2026-09-17-p3-r39-fb2-14-r3-recovery-review.md`.

Accepted boundary: the identity-free typed `game_start` RuleOverride contract plus the recovered raw-execution fail-closed boundary. Unknown raw execution metadata, simultaneous authority fields, malformed/nonempty authority fields, and any rejected raw shape may not normalize back into the accepted semantic classifier. No authoring migration or FM08 identity routing is accepted by this task.

The old r1 R39 acceptance and dependent #342-#345 acceptance chain are not used as provenance for this recovery.

## TASK P3-R39

Owner: Codex R
Status: GATE_A_B_CANDIDATE_ACCEPTED
Branch: `codex/r-p3-fb2-14-r3-review-r39-recovery`
Target: `0831d9fea7c0ffedde634333f27564ea3c1dc65a`
Report commit: `45e1cc6ff25fe6da838b8d7fca382d0504275aa7`
Prior blocker report: `68b173d480df7a7b0e83cdc403e73616c3216b2f`
Reviewer thread: `01a0adef-d6a7-79a3-9300-5fc381af9daa`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

Fresh recovery review independently reran typecheck, content validation, deterministic generated-content verification, focused FB2-14 + MatchSession `37/37`, rules regression/core `396/396`, standard full CI `738/738`, coverage, automation audit, lineage/scope checks, and the exact ten-member FM08 reconciliation. Verdict: `GATE_A_B_CANDIDATE_ACCEPTED`; no blocking finding remains on the exact recovery candidate.

This is process-separated local Codex reviewer evidence. It does not by itself prove a different GitHub account/human reviewer identity; that repository-governance issue remains separately visible below.

## TASK P3-FM08

Owner: Codex S
Status: MIGRATION_ACCEPTED
Branch: `codex/s-p3-fm08-game-start-rule-overrides-recovery`
Base: fresh FB2-14 recovery A synchronization `ff2742e51d46ee862071abffe4e23a61652dbdc1`
Candidate: `81ccb7e7e5d0f2cf5ad7da1eda3279c20a604c1a`
A sync: `bf496c772bda7eb9899fcfa51d825929951012b7`
Review: P3-R40-RECOVERY `8ed6b85f80f9b8a2069f523bb53fb58c7935f22d`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Read: `docs/reports/2026-09-17-p3-fm08-game-start-rule-overrides-recovery-migration-result.md`

Result: exactly the ten selected IDs are materialized on the corrected recovery lineage as eight authoring archives plus one focused regression and one S report. R40 independently accepts the exact A-synchronized recovery lineage at `111/944`, with duplicate frozen IDs `0`, removals `0`, runtime source diff `0`, and Leonardo s1a / Ophelia s1a excluded. Current-main credit is controlled by the PR2 integration gate below.

Completion status allowed:
- `MIGRATION_COMPLETE_CANDIDATE`
- `MIGRATION_BLOCKED`

## TASK P3-A-FM08-RECOVERY-SYNC

Owner: Codex A
Status: MIGRATION_SYNC_ACCEPTED
Branch: `codex/a-p3-fm08-recovery-material-sync`
Base: exact FM08 S recovery candidate `81ccb7e7e5d0f2cf5ad7da1eda3279c20a604c1a`
Synchronization SHA: `bf496c772bda7eb9899fcfa51d825929951012b7`
Read: `docs/reports/2026-09-17-p3-a-fm08-recovery-migration-synchronization.md`

Goal: independently synchronize the corrected FM08 material lineage without repairing S authoring. Recompute exact-ten membership, frozen F1/Reference integrity, material overlap, deterministic generated output, coverage/audit state, runtime diff, and unrelated drift.

A result: exact-ten reconciliation PASS; material overlap `111/944`; dynamic Tiamat identity remains absent and receives no numerator credit; fresh coverage `98/133/232`, raw `22/3/127/0/80/124`; focused `16/16`, rules/core `396/396`, full CI `738/738`, content/determinism PASS, runtime source diff `0`. R40 independently accepts this exact synchronization; current-main credit still requires the PR2 integration merge gate below.

## TASK P3-R40-RECOVERY

Owner: Codex R
Status: MIGRATION_ACCEPTED
Branch: `codex/r-p3-fm08-recovery-r40`
Target A synchronization: `bf496c772bda7eb9899fcfa51d825929951012b7`
Review report commit: `8ed6b85f80f9b8a2069f523bb53fb58c7935f22d`
Fresh Codex thread: `01a0ae49-2abe-7690-b3c7-71e6be1f8cc5`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Read: `docs/reports/2026-09-17-p3-r40-fm08-recovery-migration-review.md`

Result: fresh process-separated R40 accepts the exact ten-member FM08 recovery migration. Independent evidence is focused `16/16`, rules/core `396/396`, standard full CI `738/738`, content 0 blockers, determinism PASS, exact material overlap `111/944`, duplicate frozen IDs `0`, runtime/taxonomy/KPI drift `0`. The dynamic Tiamat identity remains absent and receives no numerator credit. Recovery-line accepted overlap advances `101/944 -> 111/944`; PR2 replays that accepted delta onto current main base `bf6b1a1589a374dd4040dad07896e9ee841f3057`, while current-main credit remains `101/944` until PR2 is merged.

Permitted final status:
- `MIGRATION_ACCEPTED`
- `MIGRATION_REVIEW_BLOCKED`

## TASK P3-A-R40-RECOVERY-SYNC

Owner: Codex A
Status: SYNCHRONIZED
Branch: `codex/a-p3-r40-fm08-recovery-acceptance-sync`
Base: fresh R40 report commit `8ed6b85f80f9b8a2069f523bb53fb58c7935f22d`
Read: `docs/reports/2026-09-17-p3-a-r40-fm08-recovery-acceptance-synchronization.md`

Result: R40 `MIGRATION_ACCEPTED` is synchronized on the corrected recovery lineage, and PR #348 has now merged the accepted `f7666f48f7eb00baeadb63f24fb56fc39991f372 -> d72814a7f01ecba1eecd62960b60137e7500ed15` delta into current main as `553779e8ffcc926ae4763ee86a2ea937e090c128`. Current-main accepted overlap is therefore `111/944` (`11.76%`), remaining `833/944`. FM09 is not yet ready: the next legal gate is FB2-15 recovery, then fresh R41 and A synchronization, then FM09 recovery. Earlier FM09/Ciel work on the invalid pre-recovery `111/944` lineage is not acceptance provenance.

## Full-Roster Dispatch State After FM08 Recovery Acceptance / PR2 Merge

- FM01-FM08 are accepted on current main at `111/944` (`11.76%`), leaving `833/944` outside accepted canonical authoring. Current `origin/main` is `553779e8ffcc926ae4763ee86a2ea937e090c128`.
- PR #348 merged the exact accepted `f7666f48f7eb00baeadb63f24fb56fc39991f372 -> d72814a7f01ecba1eecd62960b60137e7500ed15` recovery delta while preserving the PR1 client-build compatibility fix and all main full-roster/reference assets.
- The accepted FM08 recovery chain is `ff2742e -> 81ccb7e -> bf496c7 -> 8ed6b85`; the old #342-#345 acceptance chain remains superseded and is not acceptance provenance.
- Fresh R40 independently accepts exactly the authorized ten `core.game-start-rule-flags` identities, with Leonardo s1a and Ophelia s1a still excluded.
- Fresh accepted material coverage is `98/133/232`, raw `22/3/127/0/80/124`; duplicate frozen IDs `0`; dynamic `master.tiamat.card.life-sea` remains absent and receives no numerator credit.
- R40 evidence is focused `16/16`, rules/core `396/396`, full CI `738/738`, typecheck/content/determinism PASS, compiled product unchanged, runtime/taxonomy/KPI drift `0`.
- `BASELINE_REBASE_REQUIRED` is closed for current-main accounting.
- FB2-15 recovery is now the next legal task. It must be followed by fresh R41 and fresh A synchronization before FM09 recovery. Earlier FM09/Ciel work may inform reconstruction but is not acceptance provenance, and work must not jump directly to Ciel.
- R39/R40 remain the governing fresh process-separated independent review evidence for the accepted recovery lineage; PR2 adds no separate GitHub-account identity requirement.

## TASK P3-FB2-15-RECOVERY

Owner: Codex B2
Status: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
Base: integrated current-main baseline `553779e8ffcc926ae4763ee86a2ea937e090c128`
Dispatch: `8376bece0e84a510aa8324f17d98c2f2deabaa07`
Candidate: `23a666913a3050ad55d781e3f5b3a1518add4c3e`
Review: P3-R41-RECOVERY `IMPLEMENTATION_ACCEPTED_CANDIDATE`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Read: `docs/reports/2026-09-17-p3-fb2-15-recovery-game-start-skill-provisioning-handoff.md`, `docs/reports/2026-09-17-p3-fb2-15-recovery-game-start-skill-provisioning-result.md`

Result: the typed, identity-free, idempotent game-start skill-provisioning contract is rebuilt on the integrated `111/944` lineage. Compiler and runtime share one exact structural classifier; validated deferral occurs only after full source/target checks; malformed/non-game-start/invalid ownership/invalid target declarations fail closed; multi-target runtime mutation is preflighted and replay/restore safe. No authoring migration, identity/text/Reference-handler routing, taxonomy/KPI change, or broad Card Zone/Card Create/Trigger acceptance is taken.

FB2-15 takes zero migration credit. Current-main accepted overlap remains `111/944`.

## TASK P3-R41-RECOVERY

Owner: Codex R
Status: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
Target: `23a666913a3050ad55d781e3f5b3a1518add4c3e`
Reviewer checkout: fresh detached reviewer worktree at exact target, independently rechecked clean by A
Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
Blocking findings: none
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

R41 independently reviewed lineage, the shared typed classifier, compiler deferral validation, malformed/non-game-start state-loss routes, source/target authorization, production initialization, one-/multi-target atomicity, replay/restore idempotency, retained target state, deterministic creation provenance, B10 compatibility, FB2-14 isolation, exact future FM09 membership/exclusions, zero migration credit, and candidate/reviewer cleanliness. Independent evidence is focused `93/93`, rules/core+regression `403/403`, full CI `798/798`, typecheck/client build/content/determinism/Reference verification PASS, coverage `98/133/232` raw `22/3/127/0/80/124`, automation audit `127/3/80/20`, and diff check PASS.

## TASK P3-A-R41-FB2-15-RECOVERY-SYNC

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-r41-fb2-15-recovery-sync`
Base: exact accepted FB2-15 candidate `23a666913a3050ad55d781e3f5b3a1518add4c3e`
Read: `docs/reports/2026-09-17-p3-a-r41-fb2-15-recovery-synchronization.md`

Result: fresh R41 acceptance is synchronized without changing runtime or taking migration credit. Fresh exact-ID scanning finds FM09 source presence `0/10`, explicit exclusion presence `0/3`, and provisioning target registration `0/12` in current canonical authoring. Accepted overlap remains `111/944`, leaving `833/944`.

## TASK P3-FM09-RECOVERY

Owner: Codex S
Status: `MIGRATION_BLOCKED`
Base: exact P3-A-R41-FB2-15-RECOVERY-SYNC `fa89d867977056968ec98019129487f80ed839df`
Blocker: `9c6e38b33de1f1d6f090e9c644d0ab66dbbee4e7`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Read: `docs/reports/2026-09-17-p3-fb2-15-recovery-game-start-skill-provisioning-handoff.md`, `docs/reports/2026-09-17-p3-a-r41-fb2-15-recovery-synchronization.md`, `docs/reports/2026-09-17-p3-fm09-recovery-game-start-skill-provisioning-blocked.md`, `docs/reports/2026-09-17-p3-a-fm09-recovery-blocker-synchronization.md`

Result: fresh S reconstructed the exact ten source proposal in memory and independently verified F1/Reference/hash provenance `10/10`, loader validity `10/10`, and accepted game-start provisioning semantics `10/10`. Product executable compilation then correctly failed closed because required target `master.bazett.skill.s2` is not registered. Current canonical target registration remains `0/12`; eleven targets are separate frozen static identities and one is a derived Shirou card.

S committed no FM09 source authoring and changed no runtime/taxonomy/KPI/Reference/generated material. The exact-ten source family and three exclusions remain unchanged. Placeholder targets, compiler weakening, target-family scope expansion, and denominator corruption remain prohibited.

Completion status allowed on a future retry:
- `MIGRATION_COMPLETE_CANDIDATE`
- `MIGRATION_BLOCKED`

## TASK P3-A-FM09-RECOVERY-BLOCKER-SYNC

Owner: Codex A
Status: `BLOCKER_SYNCHRONIZED`
Branch: `codex/a-p3-fm09-recovery-blocker-sync`
Base: fresh S blocker `9c6e38b33de1f1d6f090e9c644d0ab66dbbee4e7`
Read: `docs/reports/2026-09-17-p3-a-fm09-recovery-blocker-synchronization.md`

Result: FM09 remains dependency-blocked. Fresh A classifies the eleven frozen targets across at least nine distinct handler boundaries, so they are not one homogeneous support-definition batch and may not be silently folded into FM09. No P3-FM10, broad FB2-16 implementation, or direct Ciel task is dispatched by this synchronization. Historical downstream work is planning evidence only, not acceptance provenance.

Current-main accepted overlap remains `111/944` (`11.76%`), leaving `833/944`. Next coordinator work is explicit dependency / reviewed-special-handler planning before any implementation dispatch.

## TASK P3-FB2-16-RECOVERY

Owner: Codex B2
Status: `REVIEW_ACCEPTED`
Base: exact dependency-planning commit `ff0c9cb853d9b72273736d41ca85d8d1f08614fa`, descended from P3-A-FM09-RECOVERY-BLOCKER-SYNC `5b50f1ad0b6054c84dd1bb2d65ddfba7fbfd81ea`
Candidate: `bc45b2032ec344d2c743d8b32e3a3d05aa8b67ca`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Read: `docs/reports/2026-09-17-p3-fb2-16-recovery-required-additional-play-handoff.md`

Goal: implement only the identity-free **required additional-play marker** needed for cards whose own rule requires them to accompany a regular-play batch. Compiler and runtime must share one exact structural predicate. A required-additional card remains illegal standalone, is classified for regular attack/attack-area play even when stored as `master_skill`, may join an otherwise legal regular batch, pays in the same atomic batch, and does not consume the normal regular attack allowance.

Explicitly preserve separation from foreign `append_only_rule` shapes, effect-play routes, optional/conditional additional-play permissions, explicit extra-regular-play allowances such as Sieg, and card-specific special handlers. No authoring migration, support-definition materialization, FM09 retry, taxonomy/KPI promotion, or identity/text/Reference-handler routing.

May touch:
- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/executable-card-pack.ts` only for exact required-marker play classification
- one small shared required-additional-play structural helper under `packages/rules/src/ability/`
- one focused FB2-16 regression test and the executable-pack regression only if needed
- `data/generated/fd-playtest-v1.content-library.json` only if deterministically changed by the allowed executable classification
- FB2-16 recovery result report

Completion status allowed:
- `IMPLEMENTATION_COMPLETE_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`

FB2-16 takes zero migration credit. Accepted overlap remains `111/944`.

## TASK P3-R42-RECOVERY

Owner: Codex R
Status: `REVIEW_ACCEPTED`
Base: `ff0c9cb853d9b72273736d41ca85d8d1f08614fa`
Candidate: `bc45b2032ec344d2c743d8b32e3a3d05aa8b67ca`
Read: `docs/reports/2026-09-17-p3-fb2-16-recovery-required-additional-play-handoff.md`, `docs/reports/2026-09-17-p3-fb2-16-recovery-required-additional-play-result.md`
Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
Blocking findings: none.

Fresh process-separated R42 independently rechecked exact structural marker isolation, compiler/runtime shared predicate, standalone rejection, regular-batch-only eligibility, attack quota/counter separation, aggregate payment/rollback, staged flow, event evidence, foreign-marker/effect-play isolation, compatibility with normal play/Maiya/Sieg/FB2-14/FB2-15, identity-free production routing, generated determinism, exact lineage, zero-credit status, and final cleanliness. Reviewer evidence includes typecheck PASS, focused `65/65`, full CI `807/807`, rules core+regression `411/411`, client build/content/determinism/Reference verification PASS, unchanged coverage/audit, and `git diff --check` PASS.

## TASK P3-A-R42-FB2-16-RECOVERY-SYNC

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-r42-fb2-16-recovery-sync`
Base: exact fresh R42-accepted candidate `bc45b2032ec344d2c743d8b32e3a3d05aa8b67ca`
Read: `docs/reports/2026-09-17-p3-a-r42-fb2-16-recovery-synchronization.md`

Result: fresh R42 acceptance is synchronized without runtime changes or frozen migration credit. Fresh exact-ID scanning confirms all twelve FM09 provisioning targets remain absent; eleven are frozen static identities and the Shirou derived target is outside the 944 denominator.

## TASK P3-FB2-17-RECOVERY

Owner: Codex S
Status: `SUPPORT_DEFINITION_BLOCKED`
Base: exact P3-A-R42-FB2-16-RECOVERY-SYNC `b934ea69390b159176ad295116ccc8d9fe0506c7`
Candidate/blocker commit: `310e6546fa2457b6bf11b91e547d25eb39751e99`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Read: `docs/reports/2026-09-17-p3-fb2-17-recovery-shirou-derived-card-support-definition-handoff.md`, `docs/reports/2026-09-17-p3-fb2-17-recovery-shirou-derived-card-support-definition-result.md`

Fresh S proves the exact derived support proposal is source-grounded and compatible with FB2-16, but current representation cannot accept it within scope. A standalone owned `master_skill` compiles with `initialZone: skill` instead of remaining outside game; ordinary `authoringMasterFiles` registration also widens the playable roster and synthesizes a fallback command spell; official deterministic generation additionally changes the evidence report outside the original May-touch list. No canonical product change is accepted by this blocker.

## TASK P3-A-FB2-17-RECOVERY-BLOCKER-SYNC

Owner: Codex A
Status: `BLOCKER_SYNCHRONIZED`
Branch: `codex/a-p3-fb2-17-recovery-blocker-sync-current`
Base: fresh S blocker `310e6546fa2457b6bf11b91e547d25eb39751e99`
Read: `docs/reports/2026-09-17-p3-a-fb2-17-recovery-blocker-synchronization.md`

Result: synchronize the fresh FB2-17 blocker and dispatch only the narrowest prerequisite first. FB2-18 recovery owns an identity-free card-level outside-game initial-placement representation seam. Support-only registration and generated-output scope remain later independent dependencies; they are not folded into FB2-18.

## TASK P3-FB2-18-RECOVERY

Owner: Codex B2
Status: `REVIEW_ACCEPTED`
Base: exact P3-A-FB2-17-RECOVERY-BLOCKER-SYNC `d87e74007f2cf723b2436f27f284ebd09145a48f`
Candidate: `cb81559033db6b96b1f26cf7d9bd15686db5d4fb`
Read: `docs/reports/2026-09-17-p3-fb2-18-recovery-outside-game-initial-placement-handoff.md`, `docs/reports/2026-09-17-p3-fb2-18-recovery-outside-game-initial-placement-result.md`

Result: exact identity-free `initialPlacement: "outside_game"` representation/compiler seam implemented and freshly accepted. It preserves owned `master_skill` registration while suppressing `initialZone`, leaves ordinary master-skill placement unchanged, and adds no runtime create/move/provision behavior. Zero migration credit.

## TASK P3-R43-RECOVERY

Owner: Codex R
Status: `REVIEW_ACCEPTED`
Base: `d87e74007f2cf723b2436f27f284ebd09145a48f`
Candidate: `cb81559033db6b96b1f26cf7d9bd15686db5d4fb`
Read: `docs/reports/2026-09-17-p3-fb2-18-recovery-outside-game-initial-placement-handoff.md`, `docs/reports/2026-09-17-p3-fb2-18-recovery-outside-game-initial-placement-result.md`
Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
Blocking findings: none.

Fresh process-separated R43 independently rechecked exact field validation, loader preservation, executable no-`initialZone` behavior, unchanged default master-skill placement, identity-free routing, absence of runtime movement semantics, FB2-15/FB2-16 compatibility, full validation, exact scope, zero-credit accounting, and final cleanliness. Reviewer evidence includes `npm ci --offline` PASS, focused `63/63`, core+regression `420/420`, full CI `816/816`, client build/content/determinism/Reference verification PASS, unchanged coverage/audit, and `git diff --check` PASS.

## TASK P3-A-R43-FB2-18-RECOVERY-SYNC

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-r43-fb2-18-recovery-sync-current`
Base: exact fresh R43-accepted candidate `cb81559033db6b96b1f26cf7d9bd15686db5d4fb`
Read: `docs/reports/2026-09-18-p3-a-r43-fb2-18-recovery-synchronization.md`

Result: fresh R43 acceptance is synchronized without product-code changes or frozen migration credit. The outside-game placement blocker is closed. The support-only registration blocker remains to be re-proven by a fresh support-definition retry.

## TASK P3-FB2-17-R1-RECOVERY

Owner: Codex S
Status: `SUPPORT_DEFINITION_BLOCKED`
Base: exact P3-A-R43-FB2-18-RECOVERY-SYNC `79c4f65ba8d3d9f50785ce290f9f755a19794c26`
Blocker commit: `7e0356146766486180bcd959ee4e90dcfe193be5`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Accepted dependency: FB2-18 candidate `cb81559033db6b96b1f26cf7d9bd15686db5d4fb`, freshly accepted by R43
Read: `docs/reports/2026-09-18-p3-fb2-17-r1-recovery-shirou-derived-card-support-definition-handoff.md`, `docs/reports/2026-09-18-p3-fb2-17-r1-recovery-shirou-derived-card-support-definition-result.md`

Result: outside-game placement now works, but ordinary `authoringMasterFiles` registration still promotes the support-only Shirou archive into an eighth playable master, creates executable character/presentation surface, synthesizes fallback command spell, and shifts the stable archive boundary. No product change is accepted by this blocker.

## TASK P3-A-FB2-17-R1-RECOVERY-BLOCKER-SYNC

Owner: Codex A
Status: `BLOCKER_SYNCHRONIZED`
Branch: `codex/a-p3-fb2-17-r1-recovery-blocker-sync-current`
Base: fresh S blocker `7e0356146766486180bcd959ee4e90dcfe193be5`
Read: `docs/reports/2026-09-18-p3-a-fb2-17-r1-recovery-blocker-synchronization.md`

Result: synchronize only the fresh support-only registration blocker and dispatch the narrowest generic dependency. No support definition, frozen identity, runtime behavior, or migration credit is accepted by this A task.

## TASK P3-FB2-19-RECOVERY

Owner: Codex B2
Status: `REVIEW_ACCEPTED`
Base: exact P3-A-FB2-17-R1-RECOVERY-BLOCKER-SYNC `6e288560ea5419db5aa896ad940b5b556e29b8bd`
Initial candidate: `94f1c3554d627df608666e5477d4554b0725ccad`
Revised candidate: `211ba4994acaf063834c28bef9525366b88ae463`
Read: `docs/reports/2026-09-18-p3-fb2-19-recovery-master-support-only-authoring-registration-handoff.md`, `docs/reports/2026-09-18-p3-fb2-19-recovery-master-support-only-authoring-registration-result.md`

Result: identity-free master support-only / rules-only authoring registration is implemented and freshly accepted after one R44 revision. Exact support archives enter rules/executable card definitions without playable master character/fallback/deck surface. Malformed support-shaped archives with missing, normal-master, or near-match discriminator now fail closed at the compiler boundary. Zero migration credit.
## TASK P3-R44-RECOVERY

Owner: Codex R
Status: `REVIEW_ACCEPTED`
Implementation Base: `6e288560ea5419db5aa896ad940b5b556e29b8bd`
Initial Candidate: `94f1c3554d627df608666e5477d4554b0725ccad`
Revised Candidate: `211ba4994acaf063834c28bef9525366b88ae463`
Read: `docs/reports/2026-09-18-p3-fb2-19-recovery-master-support-only-authoring-registration-handoff.md`, `docs/reports/2026-09-18-p3-fb2-19-recovery-master-support-only-authoring-registration-result.md`
Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
Blocking findings: none after R44-R2.

R44-R1 returned `IMPLEMENTATION_NEEDS_REVISION` for one compiler fail-closed discriminator gap. B2 revised the candidate at `211ba4994acaf063834c28bef9525366b88ae463`. Fresh R44-R2 independently re-ran the adversarial discriminator probes and full validation and accepted the revised candidate. Evidence includes focused `94/94`, full CI `835/835`, core+regression `420/420`, client/content/determinism/Reference PASS, unchanged coverage/audit, and clean reviewer/candidate worktrees.

## TASK P3-A-R44-FB2-19-RECOVERY-SYNC

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-r44-fb2-19-acceptance-sync-recovery`
Base: exact fresh R44-R2 accepted candidate `211ba4994acaf063834c28bef9525366b88ae463`
Read: `docs/reports/2026-09-18-p3-a-r44-fb2-19-recovery-acceptance-synchronization.md`

Result: synchronize R44-R2 acceptance without product/runtime changes or frozen migration credit and dispatch only fresh FB2-17-R2 support-definition retry.

## TASK P3-FB2-17-R2-RECOVERY

Owner: Codex S
Status: `SUPPORT_DEFINITION_BLOCKED`
Base: `2756ffe13d4bc181b4a00032afd1d9475064fc00`
Blocker commit: `d020adc97f53b16371109b5aaa1ecd77bab6be0b`
Read: `docs/reports/2026-09-18-p3-fb2-17-r2-recovery-shirou-derived-card-support-definition-result.md`

Result: support-only product semantics pass, but the focused gate is `93 PASS / 1 FAIL` because the aggregate executable-card test still hard-codes 70 while the one authorized support card correctly makes 71. No experimental product change is committed.

## TASK P3-A-FB2-17-R2-RECOVERY-BLOCKER-SYNC

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-fb2-17-r2-blocker-sync-recovery`
Base: exact R2 blocker `d020adc97f53b16371109b5aaa1ecd77bab6be0b`
Read: `docs/reports/2026-09-18-p3-a-fb2-17-r2-recovery-blocker-synchronization.md`

Result: classify the sole failure as a stale aggregate test baseline and dispatch a fresh R3 retry with only the exact 70 -> 71 assertion update newly authorized.

## TASK P3-FB2-17-R3-RECOVERY

Owner: Codex S
Status: `REVIEW_ACCEPTED`
Branch: `codex/s-p3-fb2-17-r3-recovery-current`
Base: `1ef5262abb7d6c55edef8d98e2bc127b631f5d0b`
Candidate: `1c3149ba5f33ad3092a57da4a12d7bbe96f43823`
PR: `#354`
Read: `docs/reports/2026-09-18-p3-fb2-17-r3-recovery-shirou-derived-card-support-definition-handoff.md`, `docs/reports/2026-09-18-p3-fb2-17-r3-recovery-shirou-derived-card-support-definition-result.md`

Result: exactly one non-frozen Shirou derived support definition is materialized through the accepted support-only channel. Fresh R45 independently accepts the Candidate with no blocking finding. Zero frozen migration credit.

## TASK P3-A-FB2-17-R3-RECOVERY-SYNC

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-fb2-17-r3-material-sync-recovery`
Base: exact S candidate `1c3149ba5f33ad3092a57da4a12d7bbe96f43823`
Read: `docs/reports/2026-09-18-p3-a-fb2-17-r3-recovery-material-synchronization.md`

Result: independent mechanical material synchronization only; no semantic acceptance or migration credit.

## TASK P3-R45-RECOVERY

Owner: Codex R
Status: `REVIEW_ACCEPTED`
Implementation Base: `1ef5262abb7d6c55edef8d98e2bc127b631f5d0b`
Candidate S SHA: `1c3149ba5f33ad3092a57da4a12d7bbe96f43823`
A synchronization: `7fc8df7210f2d64b21820171faeaa3d4dcac33cc`
Read: `docs/reports/2026-09-18-p3-r45-fb2-17-r3-recovery-shirou-derived-card-support-definition-review.md`
Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
Blocking findings: none.

Fresh R45 independently verifies provenance, exact one-card support-only registration, outside-game/no-initialZone behavior, exact required-additional/8-mana semantics, seven-master roster isolation, deterministic generated scope, exact `70 -> 71` baseline-only test change, all eleven remaining frozen targets absent, full validation, zero-credit accounting, and final reviewer/Candidate cleanliness.

## TASK P3-A-R45-FB2-17-R3-RECOVERY-SYNC

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-r45-fb2-17-r3-acceptance-sync-recovery`
Base: exact A material synchronization `7fc8df7210f2d64b21820171faeaa3d4dcac33cc`
Read: `docs/reports/2026-09-18-p3-a-r45-fb2-17-r3-recovery-acceptance-synchronization.md`

Result: synchronize fresh R45 acceptance without product changes or frozen migration credit. The Shirou derived provisioning target dependency is closed; eleven frozen targets remain.

## TASK P3-A-FM09-TARGET-DEPENDENCY-PLANNING

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-fm09-target-dependency-planning`
Base: exact post-R45 acceptance synchronization `575650f7be3dc9a3a61d5191d0a44829b6daf8ba`
Read: `docs/reports/2026-09-18-p3-a-fm09-remaining-target-dependency-planning.md`

Result: fresh classification selects a shared identity-free terrain/deployment-bonus metric as the narrowest next prerequisite. No frozen target is migrated by planning.

## TASK P3-FB2-21-RECOVERY

Owner: Codex B2
Status: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
Base: `98ce9b0c3967c598f9fb7d2736f418e15dcc5d30`
Candidate: `92f2aa1b084b9ac9c2ee8f2f353cdfa13611f04a`
PR: `#355` stacked on exact Base
Read: `docs/reports/2026-09-18-p3-fb2-21-recovery-terrain-deployment-bonus-metric-result.md`

Result: accepted zero-credit identity-free shared terrain/deployment-bonus metric infrastructure. Combat and exact controlled variable `controller.deployment_bonus` consume the same terrain truth. No authoring/generated/Ciel/frozen migration scope.

## TASK P3-R46-RECOVERY

Owner: Codex R
Status: `REVIEW_ACCEPTED`
Implementation Base: `98ce9b0c3967c598f9fb7d2736f418e15dcc5d30`
Candidate B2 SHA: `92f2aa1b084b9ac9c2ee8f2f353cdfa13611f04a`
Read: `docs/reports/2026-09-18-p3-r46-fb2-21-recovery-terrain-deployment-bonus-metric-review.md`
Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
Blocking findings: none.

Fresh R46 independently verifies shared-helper single-source-of-truth behavior, exact controller metric routing, multiplier/Preparation/suppression semantics, explicit combat slot compatibility, non-battlefield/missing/invalid zero behavior, no mutation, identity-free scope, generated/accounting stability, official gates, performance evidence, and final cleanliness.

## TASK P3-A-R46-FB2-21-RECOVERY-SYNC

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-r46-fb2-21-acceptance-sync-recovery`
Base: exact FB2-21 Candidate `92f2aa1b084b9ac9c2ee8f2f353cdfa13611f04a`
Read: `docs/reports/2026-09-18-p3-a-r46-fb2-21-recovery-acceptance-synchronization.md`

Result: synchronize fresh R46 acceptance without product changes or frozen migration credit. The shared terrain/deployment-bonus metric prerequisite is closed; Ciel s2 is eligible only for a fresh single-target feasibility/source-grounding pass after this synchronization.

## Full-Roster Dispatch State After R46 Acceptance Synchronization

- Shirou derived support dependency remains accepted and zero-credit.
- FB2-21 shared terrain/deployment-bonus metric infrastructure is accepted and zero-credit.
- Eleven frozen FM09 target definitions remain absent; accepted overlap remains `111/944`.
- The isolated generic metric prerequisite previously identified for Ciel s2 is closed. This A synchronization does not migrate Ciel and does not yet dispatch an implementation candidate.
- Next coordinator work is fresh current-lineage Ciel s2 feasibility/source grounding, including exact F1 provenance, locked-Reference static metadata, and revalidation that all non-metric semantics already map to accepted generic routes.
- P3-FM09 remains `MIGRATION_BLOCKED`; no FM10 is dispatched.
## TASK P3-FB2-22-RECOVERY

Owner: Codex S
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Base: `52ea97e9371f5a2353b58ad948b232434c68abd8`
Candidate: `35a2a59fd4bf77bdbbfac37031556617af94c47f`
PR: `#356` stacked on exact Base
Target: exactly `master.ciel.skill.s2`
Read: `docs/reports/2026-09-18-p3-fb2-22-recovery-ciel-s2-support-definition-handoff.md`, `docs/reports/2026-09-18-p3-fb2-22-recovery-ciel-s2-support-definition-result.md`
Fresh feasibility: `docs/reports/2026-09-18-p3-a-ciel-s2-recovery-feasibility.md`

Result: exactly one frozen Ciel s2 support definition is materialized through the accepted outside-game + support-only channel, reusing only accepted generic semantics including R46-accepted `controller.deployment_bonus`. Candidate material overlap is `112/944`; accepted overlap remains `111/944` pending fresh R47. No rules/runtime/compiler source changes are present.

## Full-Roster Dispatch State After Ciel S2 Feasibility

- R46-accepted FB2-21 closes the last generic prerequisite found for Ciel s2.
- `master.ciel.skill.s2` is now READY as an exact one-target recovery migration from Base `abc57f2...`.
- Ten other frozen FM09 provisioning target definitions remain absent and are outside this dispatch.
- Accepted overlap remains `111/944` at dispatch. A one-target Candidate may prove material `112/944`, but only fresh R47 may grant that additional accepted identity.
- P3-FM09 remains `MIGRATION_BLOCKED`; no FM10 is dispatched and no stacked PR is merged by this task.

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

## TASK P3-A-FB2-22-RECOVERY-MATERIAL-SYNC

Owner: Codex A
Status: `MATERIAL_SYNCHRONIZED`
Branch: `codex/a-p3-fb2-22-ciel-s2-material-sync-current`
Base: exact Candidate `35a2a59fd4bf77bdbbfac37031556617af94c47f`
Read: `docs/reports/2026-09-18-p3-a-fb2-22-ciel-s2-material-synchronization.md`

Result: independent mechanical synchronization reproduces exact six-file scope, the single frozen addition, `111/944 -> 112/944` material overlap, clean support-only product surface, deterministic generated output, and all official gates. A grants no semantic acceptance and no accepted overlap credit.

## TASK P3-R47-RECOVERY

Owner: Codex R
Status: `MIGRATION_ACCEPTED`
Implementation Base: `52ea97e9371f5a2353b58ad948b232434c68abd8`
Candidate S SHA: `35a2a59fd4bf77bdbbfac37031556617af94c47f`
A material synchronization: `cc0d86ffb15dafd4847448f572025c9054616083`
PR: `#356`
Read: `docs/reports/2026-09-18-p3-fb2-22-recovery-ciel-s2-support-definition-handoff.md`, `docs/reports/2026-09-18-p3-fb2-22-recovery-ciel-s2-support-definition-result.md`, `docs/reports/2026-09-18-p3-a-fb2-22-ciel-s2-material-synchronization.md`
Verdict: `MIGRATION_ACCEPTED`
Blocking findings: none.

Fresh R47 independently accepts exactly frozen identity `master.ciel.skill.s2`, reproducing exact provenance, behavior, six-file scope, `111/944 -> 112/944` material accounting, deterministic outputs, full official validation, and final reviewer/Candidate cleanliness. R47 itself does not mutate acceptance documents; the following A synchronization records the accepted credit.

## Full-Roster Dispatch State After FB2-22 Material Synchronization

- Ciel s2 Candidate material is exactly `112/944`, adding only `master.ciel.skill.s2`; accepted overlap remains `111/944`.
- Ten other frozen FM09 provisioning target definitions remain absent.
- P3-R47-RECOVERY is the only next gate.
- PR #356 remains stacked and must not be merged during review.
- P3-FM09 remains `MIGRATION_BLOCKED`; no FM10 is dispatched.
## TASK P3-A-R47-FB2-22-RECOVERY-SYNC

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-r47-fb2-22-ciel-s2-acceptance-sync-recovery`
Base: exact A material synchronization `cc0d86ffb15dafd4847448f572025c9054616083`
Read: `docs/reports/2026-09-18-p3-a-r47-fb2-22-ciel-s2-recovery-acceptance-synchronization.md`

Result: record fresh R47 `MIGRATION_ACCEPTED` for exactly `master.ciel.skill.s2`. Recovery-line accepted overlap is now `112/944` (`11.86%`), leaving `832/944`. Integrated `origin/main` remains at `553779e...` and therefore is not yet credited with this stacked migration.

## Full-Roster Dispatch State After R47 Acceptance Synchronization

- `master.ciel.skill.s2` is independently migration-accepted on the recovery lineage.
- Recovery-line accepted overlap is `112/944` (`11.86%`), leaving `832/944`.
- Integrated main remains `553779e8ffcc926ae4763ee86a2ea937e090c128`; its currently integrated accepted overlap remains `111/944` until coordinated integration.
- Ten other FM09 provisioning target definitions remain absent and unresolved.
- Next coordinator work is fresh current-lineage dependency/feasibility planning across those ten identities; historical ordering is not authority.
- P3-FM09 remains `MIGRATION_BLOCKED`; no FM10 is dispatched and no stacked PR is merged by this task.
## TASK P3-A-FM09-REMAINING10-DEPENDENCY-PLANNING

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-fm09-remaining10-planning`
Base: exact post-R47 acceptance synchronization `ee0c4a6d7bd771d7ca54c3ffc662225499c86c61`
Read: `docs/reports/2026-09-18-p3-a-fm09-remaining10-dependency-planning.md`

Result: fresh current-lineage comparison of all ten unresolved FM09 provisioning targets selects the same-battlefield private hand inspection / optional return-one interaction required by `master.shiki-ryougi.skill.s3` as the narrowest isolated generic prerequisite. Planning adds no frozen material; recovery-line accepted overlap stays `112/944`.

## TASK P3-FB2-23-RECOVERY

Owner: Codex B2
Status: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
Base: exact P3-A-FM09-REMAINING10-DEPENDENCY-PLANNING commit
Read: `docs/reports/2026-09-18-p3-fb2-23-recovery-same-battlefield-private-hand-return-interaction-handoff.md`

Goal: add only the identity-free same-battlefield player → controller-private selected-player hand snapshot → optional `0..1` return-to-owner-deck-and-shuffle interaction seam. No production identity/content, MatchSession source, frozen migration, or Ryougi-specific routing is authorized. Zero migration credit.

## TASK P3-R48-RECOVERY

Owner: Codex R
Status: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
Implementation Base: `077dac0d8f9ca7956554e3cb45511f8edf659156`
Rejected R48-R1 Candidate: `92d72e6fc2faa820febb507da1d622d36c45134e`
Accepted revised Candidate: `1cfd6000f5627a282e2549d23e5a176ba983384f`
PR: `#358`
Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
Blocking findings: none.

Fresh R48-R2 independently verified closure of the R48-R1 exact-envelope fail-open blocker, all original privacy/settlement/stale-state semantics, exact six-file scope, zero-credit accounting, deterministic product outputs, official full validation, and final reviewer/Candidate cleanliness.

## TASK P3-A-R48-FB2-23-RECOVERY-SYNC

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-r48-fb2-23-acceptance-sync-recovery`
Base: exact accepted revised Candidate `1cfd6000f5627a282e2549d23e5a176ba983384f`
Read: `docs/reports/2026-09-18-p3-a-r48-fb2-23-recovery-acceptance-synchronization.md`

Result: record fresh R48-R2 acceptance of FB2-23 as generic zero-credit infrastructure. Recovery-line accepted frozen overlap remains `112/944` (`11.86%`), leaving `832/944`; integrated main remains `111/944`. The next eligible coordinator action is a fresh single-target Ryougi s3 feasibility/migration dispatch using the accepted interaction seam.

## Full-Roster Dispatch State After R48 Acceptance Synchronization

- FB2-23 is independently accepted generic infrastructure on the recovery lineage and earns zero frozen credit.
- Recovery-line accepted overlap remains `112/944` (`11.86%`), leaving `832/944`; integrated main remains `111/944`.
- Ten FM09 provisioning frozen targets remain absent.
- `master.shiki-ryougi.skill.s3` is now eligible for a fresh single-target feasibility/migration pass; it is not yet accepted or materialized by this synchronization.
- P3-FM09 remains `MIGRATION_BLOCKED`; no FM10 is dispatched and no stacked PR is merged/retargeted.

## TASK P3-A-RYOUGI-S3-RECOVERY-FEASIBILITY

Owner: Codex A
Status: `SYNCHRONIZED`
Base: exact post-R48 acceptance synchronization `e8c312986d9d01c9e28e3e70309c925f6f6a5f4b`
Read: `docs/reports/2026-09-18-p3-a-ryougi-s3-recovery-feasibility.md`

Result: fresh F1-grounded feasibility found no remaining runtime prerequisite for exactly `master.shiki-ryougi.skill.s3`. A temporary probe compiles and executes using accepted append-only, support-only/outside-game and FB2-23 interaction semantics; only aggregate executable count `72 -> 73` changes. Probe material is exactly `113/944`; accepted overlap remains `112/944`.

## TASK P3-FB2-24-RECOVERY

Owner: Codex S
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Base: `7e2925ed37f89b60dac2c2b13c68081af6e33fbe`
Candidate: `8ff45c944ba810edfbfa93d17462d4c3cb6a4e16`
PR: `#359` stacked on exact Base
Target: exactly `master.shiki-ryougi.skill.s3`
Read: `docs/reports/2026-09-18-p3-fb2-24-recovery-ryougi-s3-support-definition-handoff.md`, `docs/reports/2026-09-18-p3-fb2-24-recovery-ryougi-s3-support-definition-result.md`

Result: corrected pre-R49 Candidate materializes exactly one frozen Ryougi s3 support definition with the Final Rules 9.4 skill-zone threshold `8`, accepted FB2-16 append-only semantics, and accepted FB2-23 private-hand interaction. Candidate material overlap is `113/944`; no `packages/rules/src/**` change is present.

## TASK P3-R49-RECOVERY

Owner: Codex R
Status: `MIGRATION_ACCEPTED`
Implementation Base: `7e2925ed37f89b60dac2c2b13c68081af6e33fbe`
Candidate S SHA: `8ff45c944ba810edfbfa93d17462d4c3cb6a4e16`
PR: `#359`
Verdict: `MIGRATION_ACCEPTED`
Blocking findings: none.

Fresh R49 independently accepts exactly frozen identity `master.shiki-ryougi.skill.s3`, including the Final Rules 9.4 8-mana skill-zone gate, exact F1 provenance, support-only/outside-game shape, FB2-16/FB2-23 behavior, privacy/stale/replay boundaries, exact six-file scope, `112/944 -> 113/944` material accounting, deterministic outputs, full official validation, and final reviewer/Candidate cleanliness.

## TASK P3-A-R49-FB2-24-RECOVERY-SYNC

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-r49-fb2-24-acceptance-sync-recovery`
Base: exact accepted Candidate `8ff45c944ba810edfbfa93d17462d4c3cb6a4e16`
Read: `docs/reports/2026-09-18-p3-a-r49-fb2-24-ryougi-s3-recovery-acceptance-synchronization.md`

Result: record fresh R49 `MIGRATION_ACCEPTED` for exactly `master.shiki-ryougi.skill.s3`. Recovery-line accepted overlap is now `113/944` (`11.97%`), leaving `831/944`. Integrated `origin/main` remains at `553779e...` and therefore remains `111/944` until later coordinated integration.

## Full-Roster Dispatch State After R49 Acceptance Synchronization

- Recovery-line accepted overlap is `113/944`; the exact newly accepted identity is only `master.shiki-ryougi.skill.s3`.
- Nine FM09 provisioning frozen targets remain absent.
- Integrated main remains `553779e8ffcc926ae4763ee86a2ea937e090c128` / accepted `111/944`; PR #359 remains stacked and unmerged.
- P3-FM09 remains `MIGRATION_BLOCKED`; no FM10 is dispatched by this synchronization.

## TASK P3-A-R49-PROCESS-HYGIENE

Owner: Codex A
Status: `SYNCHRONIZED`
Base: exact post-R49 acceptance synchronization `ffe5afdcaa07cacdfac061010a542f0b4fb43ae8`
Read: `docs/reports/2026-09-18-p3-a-r49-process-hygiene.md`

Result: correct historical role metadata for the pure S migrations FB2-22 and FB2-24, normalize recovery PR contract metadata, mark superseded/rejected PRs as historical only, and correct PR #359 to its final R49-reviewed Candidate. No product/runtime change or frozen accounting change; recovery-line accepted remains `113/944` and integrated main remains `111/944`.

## TASK P3-A-FM05-TERRITORY-VARIANT-EXTENSION-DISPATCH

Owner: Codex A
Status: `SYNCHRONIZED`
Base: exact post-R49 process-hygiene `3b2d6bc6ac2eb6bfc7058a238d140995d0711e77`
Read: `docs/reports/2026-09-18-p3-a-fm05-territory-variant-extension-dispatch.md`

Result: full-944 semantic-signature delta refresh finds exactly one accepted/missing mixed signature: the R34-accepted Territory Creation semantic with two missing typography variants, `servant.gilles.skill.sc-gilles-2` and `servant.medea.skill.sc-medea-2`. Dispatch exactly these two to Codex S as an FM05 family extension with no runtime changes. Dispatch takes zero credit; accepted overlap remains `113/944`.

## TASK P3-FM05-TERRITORY-VARIANT-EXTENSION-RECOVERY

Owner: Codex S
Status: `MIGRATION_COMPLETE_CANDIDATE`
Base: exact A dispatch `40eaf45a64ecca0ddb6efe62a8bed35652420707`
Candidate: `7f83a0cfba2cd7f781ab0c0491c9ed2607db02d6`
PR: `#361` stacked on exact Base
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Targets: exactly `servant.gilles.skill.sc-gilles-2`, `servant.medea.skill.sc-medea-2`
Read: `docs/agents/PHASE3-FULL-ROSTER-STARTUP-PROMPT.md`, `docs/agents/PHASE3-FULL-ROSTER-COLLABORATION-CONTRACT.md`, `docs/reports/2026-09-18-p3-a-fm05-territory-variant-extension-dispatch.md`, `docs/reports/2026-09-18-p3-fm05-territory-variant-extension-result.md`

Result: Candidate materializes exactly the two missing Territory Creation typography variants using only accepted R33/R19/R34 semantics, with zero runtime/compiler/product hot-file diff. Candidate material overlap is exactly `115/944`; accepted overlap remains `113/944` until fresh R50 and post-review A synchronization.

## TASK P3-R50-FM05-TERRITORY-VARIANT-EXTENSION

Owner: Codex R
Status: `MIGRATION_ACCEPTED`
Implementation Base: `40eaf45a64ecca0ddb6efe62a8bed35652420707`
Candidate S SHA: `7f83a0cfba2cd7f781ab0c0491c9ed2607db02d6`
PR: `#361`
Verdict: `MIGRATION_ACCEPTED`
Blocking findings: none.

Fresh R50 independently reconstructs the two frozen Territory Creation variants from F1/Reference, verifies exact four-file scope and zero runtime/product diff, probes both formula and deployment behavior, reproduces `113/944 -> 115/944` material accounting, and passes the official gates. The initial single fixed-5s full-CI timeout is investigated with unchanged Base/Candidate timing controls; Candidate subsequently passes unchanged full CI `134 files / 870 tests` and R50 finds no Candidate-specific performance regression.

## TASK P3-A-R50-FM05-TERRITORY-VARIANT-EXTENSION-SYNC

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-r50-fm05-variant-acceptance-sync`
Base: exact accepted Candidate `7f83a0cfba2cd7f781ab0c0491c9ed2607db02d6`
Read: `docs/reports/2026-09-18-p3-a-r50-fm05-territory-variant-extension-acceptance-synchronization.md`

Result: record fresh R50 `MIGRATION_ACCEPTED` for exactly `servant.gilles.skill.sc-gilles-2` and `servant.medea.skill.sc-medea-2`. Recovery-line accepted overlap is now `115/944` (`12.18%`), leaving `829/944`. Integrated `origin/main` remains `553779e...` / accepted `111/944`.

## Full-Roster Dispatch State After R50 Acceptance Synchronization

- Recovery-line accepted overlap is `115/944`; the exact newly accepted identities are Gilles s2 and Medea s2 Territory Creation variants.
- Integrated main remains `553779e8ffcc926ae4763ee86a2ea937e090c128` / accepted `111/944`; PR #361 remains stacked and unmerged.
- P3-FM09 remains `MIGRATION_BLOCKED` with the same nine provisioning targets; this FM05 extension is not FM10.
- Next coordinator work is a fresh full-roster readiness refresh over the remaining `829` frozen identities against the accepted `115/944` recovery baseline; no further credit is pre-authorized.

## TASK P3-FB2-25-GAME-START-FIXED-SET-MANA

Owner: Codex B2
Status: `READY`
Base: exact post-R50 acceptance synchronization `fa27e9b132990a6fde164b8806443c533383375f` plus this A dispatch commit
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Read: `docs/reports/2026-09-18-p3-a-fb2-25-game-start-fixed-set-mana-dispatch.md`, FB2-05/R22 acceptance, FB2-14/R39 and FB2-15/R41 game-start acceptance evidence.

Goal: add only the identity-free fail-closed `game_start + fixed controller literal set_mana` parent semantic. Exact future F1 consumers are Iliya s1 and Taiga s1; B2 must not add either identity or any authoring migration. Zero frozen credit; recovery accepted remains `115/944`.


## TASK P3-R51-FB2-25-GAME-START-FIXED-SET-MANA

Owner: Codex R
Status: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
Implementation Base: `c04e42ea8d002e974f8965218f915d642fe26ea5`
Candidate B2 SHA: `101cb0d4e3fbd105cfadafda26585b3825616fe1`
PR: `#362`
Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
Blocking findings: none.

Fresh R51 independently accepts the identity-free exact `game_start + fixed-controller literal set_mana` parent semantic, verifies adversarial fail-closed behavior, runtime assignment/idempotency/rollback, identity-free production routing, exact three-file scope, and full gates. Frozen material remains `115/944`; no migration credit is granted.

## TASK P3-A-R51-FB2-25-ACCEPTANCE-SYNC

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-r51-fb2-25-acceptance-sync`
Base: exact accepted B2 Candidate `101cb0d4e3fbd105cfadafda26585b3825616fe1`
Read: `docs/reports/2026-09-18-p3-a-r51-fb2-25-acceptance-synchronization.md`

Result: accept FB2-25 as zero-credit runtime infrastructure. Recovery-line accepted overlap remains `115/944` (`12.18%`), leaving `829/944`; integrated main remains `111/944`. Exact future F1 consumers within the accepted envelope are Iliya s1 and Taiga s1, but both still require a fresh S feasibility/source-grounding dispatch before migration.


## TASK P3-FB2-25-INITIAL-MANA-CONSUMER-MIGRATION

Owner: Codex S
Status: `READY`
Base: exact post-R51 A synchronization plus this dispatch commit
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Accepted runtime: FB2-25 / R51 Candidate `101cb0d4e3fbd105cfadafda26585b3825616fe1`
Targets: exactly `master.iliya.skill.s1`, `master.taiga.skill.s1`
Read: `docs/agents/PHASE3-FULL-ROSTER-STARTUP-PROMPT.md`, `docs/agents/PHASE3-FULL-ROSTER-COLLABORATION-CONTRACT.md`, `docs/reports/2026-09-18-p3-a-fb2-25-consumer-migration-dispatch.md`.

Goal: materialize exactly the two block-free initial-Mana skills as standalone `master_skill_card_archive` authoring, reusing only accepted FB2-05 + FB2-25/R51 semantics. Do not modify runtime, pack/generated product, or add other master skills. Candidate material may be `117/944`; accepted overlap remains `115/944` pending fresh R.

## TASK P3-R52-FB2-25-INITIAL-MANA-CONSUMER-MIGRATION

Owner: Codex R
Status: `MIGRATION_ACCEPTED`
Implementation Base: `bfa9087ab77223e40525fe36214509b1f2cdf9ff`
Candidate S SHA: `0de67e5b5c4f403f04fa54868c6db09b980c90f8`
PR: `#363`
Verdict: `MIGRATION_ACCEPTED`
Blocking findings: none.

Fresh R52 independently reconstructs exactly `master.iliya.skill.s1` and `master.taiga.skill.s1` from F1/Reference, verifies exact four-file scope and zero runtime/product hot-file diff, proves trusted `game_start` controller Mana assignment `4 -> 6/3`, fail-closed near-match behavior, product isolation, and exact `115/944 -> 117/944` material accounting. All official gates pass and reviewer/Candidate/Reference finish clean.

## TASK P3-A-R52-INITIAL-MANA-ACCEPTANCE-SYNC

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-r52-initial-mana-acceptance-sync`
Base: exact accepted Candidate `0de67e5b5c4f403f04fa54868c6db09b980c90f8`
Read: `docs/reports/2026-09-18-p3-a-r52-initial-mana-acceptance-synchronization.md`

Result: record fresh R52 `MIGRATION_ACCEPTED` for exactly `master.iliya.skill.s1` and `master.taiga.skill.s1`. A independently reproduces Base `115/944` and Candidate `117/944`, exact two additions, zero removals, and zero duplicate frozen canonical IDs. Recovery-line accepted overlap is now `117/944` (`12.39%`), leaving `827/944`; integrated `origin/main` remains `111/944`.

## Full-Roster Dispatch State After R52 Acceptance Synchronization

- Recovery-line accepted overlap is `117/944` (`12.39%`); exact R52 additions are Iliya s1 and Taiga s1.
- Integrated main remains `553779e8ffcc926ae4763ee86a2ea937e090c128` / accepted `111/944`; PR #363 remains OPEN and unmerged.
- P3-FM09 remains `MIGRATION_BLOCKED` with the same nine provisioning targets; this initial-Mana batch is not FM10.
- Next coordinator work is a fresh readiness overlay over the remaining `827` identities against accepted `117/944`; no further frozen credit is pre-authorized.

## TASK P3-FM03-MHX-EXTENSION-RECOVERY

Owner: Codex S
Status: `READY`
Base: exact post-R52 acceptance synchronization plus this dispatch commit
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Accepted contracts: P3-R12/B18 + P3-R13/B19 + P3-R29/FB2-10 + P3-R30/FM03
Target: exactly `servant.mhx.skill.sc-mhx-3`
Read: `docs/reports/2026-09-18-p3-a-mhx-fm03-extension-dispatch.md` plus the full-roster startup prompt and collaboration contract.

Result: fresh `117/944` readiness overlay finds zero mixed exact F1 classification-signature groups but one source-complete accepted-family extension. MHX s3 has byte-identical printed text and all three clause hashes to accepted FM03 members, the same locked `core.saber-magic-resistance` family/static card shape, and an A in-memory production-loader/runtime probe proves exact accepted three-ability behavior with no runtime change. Dispatch takes zero credit; accepted remains `117/944`. Candidate material may be `118/944` pending fresh R.

## TASK P3-R53-FM03-MHX-EXTENSION-REVIEW

Owner: Codex R
Status: `MIGRATION_ACCEPTED`
Implementation Base: `362c799c9c3b92a1e2af3f1e4597d5cfcba532ac`
Candidate S SHA: `edfe2ee2e21b484d2b01824f6117d364d1af835b`
PR: `#364`
Verdict: `MIGRATION_ACCEPTED`
Blocking findings: none.

Fresh R53 independently proves the MHX s3 F1 special label is classification drift rather than semantic divergence, verifies exact three-file scope and zero runtime/product drift, exercises all three accepted FM03 abilities through production runtime, confirms product isolation and deterministic hashes, and mechanically reproduces `117/944 -> 118/944` material accounting with one exact addition, zero removals, and zero duplicates.

## TASK P3-A-R53-MHX-ACCEPTANCE-SYNC

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-r53-mhx-acceptance-sync`
Base: exact accepted Candidate `edfe2ee2e21b484d2b01824f6117d364d1af835b`
Read: `docs/reports/2026-09-18-p3-a-r53-mhx-acceptance-synchronization.md`

Result: record fresh R53 `MIGRATION_ACCEPTED` for exactly `servant.mhx.skill.sc-mhx-3`. A independently reproduces Base `117/944` and Candidate `118/944`, exact one addition, zero removals, and zero duplicate frozen canonical IDs. Recovery-line accepted overlap is now `118/944` (`12.50%`), leaving `826/944`; integrated `origin/main` remains `111/944`.

## Full-Roster Dispatch State After R53 Acceptance Synchronization

- Recovery-line accepted overlap is `118/944` (`12.50%`); exact R53 addition is `servant.mhx.skill.sc-mhx-3`.
- Integrated main remains `553779e8ffcc926ae4763ee86a2ea937e090c128` / accepted `111/944`; PR #364 remains OPEN and unmerged.
- P3-FM09 remains `MIGRATION_BLOCKED` with the same nine provisioning targets; this FM03 extension is not FM10.
- Next coordinator work is a throughput-oriented readiness overlay over the remaining `826` identities, prioritizing evidence-backed larger homogeneous batches rather than singleton cleanup; no further frozen credit is pre-authorized.

## TASK P3-A-FB2-26-NONPLAYABLE-MASTER-RULE-ARCHIVE-DISPATCH

Owner: Codex A
Status: `SYNCHRONIZED`
Base: exact post-R53 acceptance synchronization `cb6f1312d505ff8e3c9cca84bd8840866df0fa8d`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Read: `docs/reports/2026-09-18-p3-a-fb2-26-nonplayable-master-rule-archive-dispatch.md`

Result: throughput-oriented readiness analysis finds exactly three FB2-15 provisioning source identities whose targets are already independently accepted: `master.ciel.skill.s1a`, `master.shiki-ryougi.skill.s1a`, and `master.shirou-emiya.skill.s2`. Their execution semantic is already accepted; the remaining blocker is representation because the same owner archives are exact FB2-19 support-only archives whose cards must all be `outside_game`. Dispatch one zero-credit generic rules-only mixed-master archive seam rather than creating duplicate owner archives, widening the support-only contract, or promoting these owners into the playable product roster. Accepted overlap remains `118/944`.

## TASK P3-FB2-26-NONPLAYABLE-MASTER-RULE-ARCHIVE

Owner: Codex B2
Status: `READY`
Base: exact A dispatch commit descended directly from `cb6f1312d505ff8e3c9cca84bd8840866df0fa8d`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Accepted dependencies: P3-R41/FB2-15, P3-R43/FB2-18, P3-R44-R2/FB2-19
Read: `docs/reports/2026-09-18-p3-a-fb2-26-nonplayable-master-rule-archive-dispatch.md` plus the full-roster startup prompt and collaboration contract.

Goal: add only the identity-free `authoringMasterRuleFiles` / `master_rule_definition_archive` channel for a non-playable master owner whose rules-only archive contains both an ordinary non-deferred `master_skill` and an exact `outside_game` `master_skill`. The archive must compile source/target rules with the same owner while emitting no playable master character, overview/presentation card, fallback command spell, deck, or fixture seat. Preserve the exact existing support-only and ordinary playable-master channels; malformed mixed shapes must fail closed. No production authoring/pack/generated change and no interpreter/MatchSession change is authorized.

Completion status allowed:
- `IMPLEMENTATION_COMPLETE_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`
- `IMPLEMENTATION_BLOCKED`

FB2-26 earns zero frozen migration credit and requires a fresh independent R review plus later A capability synchronization before any consumer migration.

## Full-Roster Dispatch State After FB2-26 Dispatch

- Recovery-line accepted overlap remains `118/944` (`12.50%`), leaving `826/944`; integrated main remains `111/944`.
- No frozen identity is credited by FB2-26.
- If FB2-26 is freshly accepted and synchronized, a separate S task may attempt exactly three ready FB2-15 consumers: `master.ciel.skill.s1a`, `master.shiki-ryougi.skill.s1a`, and `master.shirou-emiya.skill.s2`. Mechanical Candidate material would be `121/944`; formal accepted remains `118/944` until fresh migration review and A acceptance synchronization.
- The historical P3-FM09 exact-ten recovery attempt remains blocked; nine unresolved provisioning target identities remain unchanged, and the other source identities receive no credit.
- No FM10 is dispatched, and no existing stacked PR is merged or retargeted by this A task.

## TASK P3-A-R55-FB2-26-ACCEPTANCE-SYNC

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-r55-fb2-26-acceptance-sync`
Base: exact R55-accepted Revision Candidate `e4c703bf3755a5a9e865ca05f0ad93118b70f0e2`
Prior rejected Candidate: `206cf5b96497bf9709cc230a3da66b8bfff2f6c6` / R54 `IMPLEMENTATION_NEEDS_REVISION`
Read: `docs/reports/2026-09-19-p3-a-r55-fb2-26-acceptance-synchronization.md`

Result: record fresh R55 `IMPLEMENTATION_ACCEPTED_CANDIDATE` for the corrected FB2-26 mixed rules-only master archive representation. A independently reproduces Base and Revision at `118/944`, with 141 authoring cards on both sides, zero frozen additions/removals, zero duplicate frozen canonical IDs, and zero `data/authoring/**` / `data/phase3/**` diff. FB2-26 is accepted as zero-credit capability infrastructure only.

## Full-Roster Dispatch State After R55 / FB2-26 Acceptance Synchronization

- Recovery-line accepted overlap remains `118/944` (`12.50%`), leaving `826/944`.
- R54 rejected `206cf5b...`; R55 independently accepted corrected Revision `e4c703b...`.
- PR #365 remains OPEN, unmerged, and unretargeted.
- Integrated main remains `553779e8ffcc926ae4763ee86a2ea937e090c128` / accepted `111/944`.
- FB2-26 now permits a fresh separate S dispatch attempt for exactly `master.ciel.skill.s1a`, `master.shiki-ryougi.skill.s1a`, and `master.shirou-emiya.skill.s2`; no migration credit is granted until fresh S/R/A completion.
- Historical P3-FM09 remains `MIGRATION_BLOCKED`; no FM10 is dispatched by this synchronization.


## TASK P3-FB2-26-CONSUMER-MIGRATION

Owner: Codex S
Status: `READY`
Base: exact post-R55 A synchronization plus this dispatch commit
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Accepted dependencies: P3-R41/FB2-15, P3-R43/FB2-18, P3-R44-R2/FB2-19, P3-R45, P3-R47, P3-R49, P3-R55/FB2-26
Targets: exactly `master.ciel.skill.s1a`, `master.shiki-ryougi.skill.s1a`, `master.shirou-emiya.skill.s2`
Read: `docs/reports/2026-09-19-p3-a-fb2-26-consumer-migration-dispatch.md` plus startup prompt and collaboration contract.

Goal: migrate exactly the three source-grounded `core.game-start-add-skill` source identities by converting their existing support-only owner archives into the accepted mixed rules-only archive representation, preserving already accepted outside-game targets, and moving exactly those owner files from `authoringMasterSupportFiles` to `authoringMasterRuleFiles`. Reuse FB2-15 unchanged; no runtime modification or unrelated migration is authorized. Candidate material may be `121/944`; formal accepted remains `118/944` pending fresh R migration review and later A synchronization.

## TASK P3-R56-FB2-26-CONSUMER-MIGRATION-REVIEW

Owner: Codex R
Status: `MIGRATION_ACCEPTED`
Implementation Base: `ddbbf36726d44eedcc808f5f6b4ab7d5e48d8e6e`
Candidate S SHA: `beb472cd2c8e02d8d06bca5a6159865d16391aa5`
PR: `#366`
Verdict: `MIGRATION_ACCEPTED`
Blocking findings: none.

Fresh R56 independently verifies exact ten-file authorized scope, F1 text/hashes and source-to-target mappings, unchanged accepted targets, real FB2-15 production runtime plus replay idempotency, R55/FB2-26 mixed rules-only product isolation, deterministic generated-content changes, and exact mechanical `118/944 -> 121/944` accounting with only `master.ciel.skill.s1a`, `master.shiki-ryougi.skill.s1a`, and `master.shirou-emiya.skill.s2` added, zero removals, and zero duplicates. All official gates pass and reviewer/Candidate/Reference finish clean.

## TASK P3-A-R56-FB2-26-CONSUMER-ACCEPTANCE-SYNC

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-r56-fb2-26-consumer-acceptance-sync`
Base: exact accepted Candidate `beb472cd2c8e02d8d06bca5a6159865d16391aa5`
Read: `docs/reports/2026-09-19-p3-a-r56-fb2-26-consumer-acceptance-synchronization.md`

Result: record fresh R56 `MIGRATION_ACCEPTED` for exactly `master.ciel.skill.s1a`, `master.shiki-ryougi.skill.s1a`, and `master.shirou-emiya.skill.s2`. A independently reproduces Base `118/944` and Candidate `121/944`, exact three additions, zero removals, and zero duplicate frozen canonical IDs. Recovery-line accepted overlap is now `121/944` (`12.82%`), leaving `823/944`; integrated `origin/main` remains `111/944`.

## Full-Roster Dispatch State After R56 Acceptance Synchronization

- Recovery-line accepted overlap is `121/944` (`12.82%`); exact R56 additions are Ciel s1a, Ryougi s1a, and Shirou s2.
- Integrated main remains `553779e8ffcc926ae4763ee86a2ea937e090c128` / mechanically accepted `111/944`; PR #366 remains OPEN, unmerged, and unretargeted.
- Historical P3-FM09 remains `MIGRATION_BLOCKED`; this three-source migration does not retroactively accept or unblock the historical exact-ten attempt, and no FM10 is dispatched.
- Next coordinator work is a throughput-oriented readiness overlay over the remaining `823` frozen identities, prioritizing the largest honest homogeneous READY family; no further frozen credit is pre-authorized.

## TASK P3-A-FB2-27-RULER-SEAL-SUBSYSTEM-DISPATCH

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-fb2-27-ruler-seal-dispatch`
Base: exact post-R56 acceptance synchronization `2772ac9904c2e99c19cb73f7b60147a329fb27a4`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Read: `docs/reports/2026-09-19-p3-a-fb2-27-ruler-seal-subsystem-dispatch.md`

Result: fresh throughput overlay over the remaining `823` identities finds no honest direct `10+` homogeneous READY migration batch. The selected next prerequisite is the identity-free Ruler seal relationship subsystem: a narrower special subsystem than the larger Wodime/Wallachia families, intended to close one coherent runtime boundary and unlock exactly six frozen Ruler-family consumers. Dispatch grants zero frozen credit; accepted remains `121/944`.

## TASK P3-FB2-27-RULER-SEAL-SUBSYSTEM

Owner: Codex B2
Status: `READY`
Base: exact A dispatch commit descended directly from `2772ac9904c2e99c19cb73f7b60147a329fb27a4`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Affected future consumers: exactly `servant.amakusa.skill.sc-amakusa-3`, `servant.amor.skill.sc-amor-1`, `servant.jeanne.skill.sc-jeanne-1`, `servant.morgan.skill.sc-morgan-3`, `servant.oberon.skill.sc-oberon-3`, `servant.oberon.skill.sc-oberon-4`
Read: `docs/reports/2026-09-19-p3-a-fb2-27-ruler-seal-subsystem-dispatch.md` plus startup prompt and collaboration contract.

Goal: implement only the identity-free Ruler seal issuer→bound-player relationship subsystem, its game-long least-bound selection history, single-use seal ownership, structural move / round movement-lock / free-play+delayed-reward branches, replay idempotency, and explicit no-copy/no-steal structural marker. No production authoring, pack/generated product, unrelated special subsystem, identity/text/Reference-handler routing, or migration credit is authorized.

Completion status allowed:
- `IMPLEMENTATION_COMPLETE_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`
- `IMPLEMENTATION_BLOCKED`

FB2-27 earns zero frozen migration credit and requires fresh independent R review plus later A capability synchronization before any Ruler authoring migration.

## Full-Roster Dispatch State After FB2-27 Dispatch

- Recovery-line accepted overlap remains `121/944` (`12.82%`), leaving `823/944`.
- FB2-27 is zero-credit runtime capability work.
- If accepted and synchronized, a later S task may attempt exactly six Ruler-family identities; no migration credit is pre-authorized.
- Historical P3-FM09 remains `MIGRATION_BLOCKED`; no FM10 is dispatched.
- Existing stacked PRs remain unmerged and unretargeted.


## TASK P3-A-R58-FB2-27-ACCEPTANCE-SYNC

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-r58-fb2-27-acceptance-sync`
Base: exact R58-accepted Revision Candidate `e30e7efef3cf9fc111236599441e5a869f4bc81a`
Prior rejected Candidate: `f315f2e412399f3aca7971adf7ccd1812437e63f` / R57 `IMPLEMENTATION_NEEDS_REVISION`
Read: `docs/reports/2026-09-19-p3-a-r58-fb2-27-acceptance-synchronization.md`

Result: record fresh R58 `IMPLEMENTATION_ACCEPTED_CANDIDATE` for corrected FB2-27. The R57 unordered-pair blocker is closed: ordered Reference least-bound semantics accept p2->p3/p4 and reject p3->p2 mutation-free. A independently reproduces `121/944` from 144 unique authoring cards with zero duplicate frozen IDs. FB2-27 remains zero-credit runtime capability infrastructure.

## Full-Roster Dispatch State After R58 / FB2-27 Acceptance Synchronization

- Recovery-line accepted overlap remains `121/944` (`12.82%`), leaving `823/944`.
- R57 rejected `f315f2e...`; R58 independently accepted corrected Revision `e30e7efe...`.
- PR #367 remains OPEN, unmerged, and unretargeted; integrated main remains `553779e8ffcc926ae4763ee86a2ea937e090c128` / mechanically `111/944`.
- Exactly six Ruler-family consumers are now eligible for a fresh separate S dispatch: Amakusa s3, Amor s1, Jeanne s1, Morgan s3, Oberon s3, Oberon s4. No migration credit is granted until fresh S/R/A completion.
- Historical P3-FM09 remains `MIGRATION_BLOCKED`; no FM10 is dispatched.


## TASK P3-RULER-CONSUMER-MIGRATION

Owner: Codex S
Status: `READY`
Base: exact post-R58 A acceptance synchronization plus this dispatch commit
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Accepted dependency: R58 / FB2-27 Revision `e30e7efef3cf9fc111236599441e5a869f4bc81a`
Targets: exactly Amakusa s3, Amor s1, Jeanne s1, Morgan s3, Oberon s3 and Oberon s4
Read: `docs/reports/2026-09-19-p3-a-ruler-consumer-migration-dispatch.md` plus startup prompt and collaboration contract.

Goal: migrate exactly six frozen Ruler-family definitions using the accepted FB2-27 identity-free structural contracts. Expected production authoring is five standalone servant-skill archives, with Oberon s3+s4 in one archive; no pack registration, generated product change, runtime change, unrelated Ruler card, FM09/FM10 state change, merge, or retarget is authorized. Candidate material may reach `127/944`; formal accepted remains `121/944` pending fresh R and later A synchronization.

## TASK P3-R59-RULER-CONSUMER-MIGRATION-REVIEW

Owner: Codex R
Status: `MIGRATION_ACCEPTED`
Implementation Base: `18c39c838fe84e26b4739a75efcd3f3efb8bb499`
Candidate S SHA: `d4c0fce05255b1bf1956f1fd8079763bad05d602`
PR: `#368`
Verdict: `MIGRATION_ACCEPTED`
Blocking findings: none.

Fresh R59 independently verifies the exact six-card Ruler migration, authoritative F1 text/hashes, exact R58/FB2-27 structural reuse, ordered least-bound semantics, issuer-scoped seal behavior, movement/free-play/reward branches, standalone archive/product isolation, and mechanical `121/944 -> 127/944` accounting with zero removals and zero duplicates. Official gates and final cleanliness pass.

## TASK P3-A-R59-RULER-CONSUMER-ACCEPTANCE-SYNC

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-r59-ruler-consumer-acceptance-sync`
Base: exact accepted Candidate `d4c0fce05255b1bf1956f1fd8079763bad05d602`
Read: `docs/reports/2026-09-19-p3-a-r59-ruler-consumer-acceptance-synchronization.md`

Result: record fresh R59 `MIGRATION_ACCEPTED` for exactly Amakusa s3, Amor s1, Jeanne s1, Morgan s3, Oberon s3, and Oberon s4. A independently reproduces exact Base `121/944` and Candidate `127/944`, six additions, zero removals, and zero duplicate frozen canonical IDs.

## Full-Roster Dispatch State After R59 Acceptance Synchronization

- Formal recovery-line accepted overlap is now **`127/944` (`13.45%`)**, leaving **`817`** frozen identities.
- PR #368 remains OPEN, unmerged, and unretargeted; integrated `origin/main` remains mechanically `111/944`.
- Historical P3-FM09 remains `MIGRATION_BLOCKED`; no FM10 is dispatched.
- Next coordinator action is a read-only A readiness partition of all remaining `817` identities into direct READY, one-capability-away, and heavy multi-mechanic groups before any new dispatch.
## TASK P3-A-FB2-28-EVENT-RULE-BRIDGE-DISPATCH

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-fb2-28-event-rule-bridge-dispatch`
Base: exact post-R59 acceptance synchronization `f80da896018f6d3cf1c2e4667d95f9c6f1ff4b14`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Read: `docs/reports/2026-09-19-p3-a-fb2-28-event-rule-executable-bridge-dispatch.md`

Result: private read-only feasibility over the remaining `817` identities finds exactly `12` single-gap rows whose sole frozen blocker is `SPECIAL_EFFECT:event_card_rule`. Current runtime already owns event deck/discard/placement/visibility/VP/static-modifier lifecycle but lacks a rules-only executable event-definition/source bridge. Dispatch FB2-28 to implement only this identity-free event-card lifecycle and executable-rule boundary. The `12` is an unlock-yield upper bound, not one mixed migration batch and not migration credit.

## TASK P3-FB2-28-EVENT-RULE-EXECUTABLE-BRIDGE

Owner: Codex B2
Status: `READY`
Base: exact A dispatch commit descended directly from `f80da896018f6d3cf1c2e4667d95f9c6f1ff4b14`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Affected future consumers: exactly Hisui Detective s1, Kadoc ascension/s3/s4/s5, Kiara s4, Ophelia ascension/s4/s5/s6/s7, and Wodime s6 as enumerated in the dispatch report.

Goal: add only a rules-only event-definition representation, generic event-card zone/lifecycle operations, and an authoritative event-placement executable source context sufficient to close `event_card_rule` without identity/name/text/Reference-handler routing. Do not implement Lostbelt expansion, Wodime state, prophecy, deduction, defeat-player, foreign-life, production consumer authoring, or migration credit.

FB2-28 earns zero frozen migration credit. Formal recovery accepted remains `127/944` and historical P3-FM09 remains `MIGRATION_BLOCKED`.
## TASK P3-A-R61-FB2-28-ACCEPTANCE-SYNC

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-r61-fb2-28-acceptance-sync`
Base: exact accepted Revision Candidate `69f2fb09ca951957148f965df459bb3063323800`
Read: `docs/reports/2026-09-19-p3-a-r61-fb2-28-acceptance-synchronization.md`

Result: record fresh R61 `IMPLEMENTATION_ACCEPTED_CANDIDATE` for FB2-28. R60's battlefield-location round-trip blocker is closed; A independently reproduces `111 archives / 150 cards / 150 unique / 127/944 overlap / 0 duplicates`. FB2-28 is zero-credit infrastructure, so formal recovery accepted remains `127/944` with `817` remaining.

Next coordinator action is private read-only dependency recomputation for the twelve `event_card_rule` single-gap rows. No downstream migration is credited or dispatched by this synchronization. Historical P3-FM09 remains `MIGRATION_BLOCKED`.

## TASK P3-A-FB2-29-OUTER-GOD-LIFE-DISPATCH

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-fb2-29-outer-god-life-dispatch`
Base: exact R61 FB2-28 acceptance sync `1c33320b468825dd7e37b5ede6645bb29e5ee333`
Read: `docs/reports/2026-09-19-p3-a-fb2-29-outer-god-life-dispatch.md`

Result: dispatch one narrow B2 structural family for the five homogeneous `core.outer-god-life` identities. Required behavior is source-owner relational, identity-free, current-round +6 total-power sharing with dedupe, battle-terminal return of the same physical source to the source servant owner's discard, and a structural reusable `outer_god_life` category marker. No downstream migration credit is taken.

Formal accepted remains `127/944`, `817` remaining. Historical P3-FM09 remains `MIGRATION_BLOCKED`.

## TASK P3-A-FB2-30-MASTER-SKILL-DEFINITION-RETURN-DISPATCH

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-fb2-30-card-definition-return-dispatch`
Base: exact R68 acceptance synchronization `6718244a7e939afb57687dc8a1ac99ab03302c04`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Read: `docs/reports/2026-09-19-p3-a-fb2-30-master-skill-definition-return-dispatch.md`

Result: after excluding the exact formal `136/944` union, `63` block-free `READY_GENERIC_EXTENSION` identities remain. Dispatch one narrow identity-free Card Zone component for controller-owned master-skill definition return/materialization. Arcueid s1 and Ciel s1b are the immediate source-grounded upper-bound consumers, but their different parent triggers/conditions are not accepted or migrated by FB2-30. B2 earns zero frozen credit.

## TASK P3-FB2-30-MASTER-SKILL-DEFINITION-RETURN

Owner: Codex B2
Status: `READY`
Base: exact A FB2-30 dispatch commit
Read: `docs/reports/2026-09-19-p3-a-fb2-30-master-skill-definition-return-dispatch.md`

Goal: implement only the exact structural `return_card_by_definition` component for a controller-owned `master_skill`, returning one existing physical instance to runtime `skill` or creating exactly one when missing. Fail closed on malformed shape, wrong owner/type, missing definition, or duplicate physical targets. Do not add parent trigger/condition routes, migrate F1 authoring, change KPI/taxonomy, merge, or retarget.

Completion status allowed:
- `IMPLEMENTATION_COMPLETE_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`
- `IMPLEMENTATION_BLOCKED`

Formal recovery accepted remains `136/944`; FB2-30 is zero-credit infrastructure and requires fresh independent R review plus later A capability synchronization.

## TASK P3-A-FB2-31-EVENT-PLAYER-RELATION-DISPATCH

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-fb2-31-event-player-relation-dispatch`
Base: exact R69 / FB2-30 acceptance synchronization `75123154585aac49f4c1571a3ac23ac4f9279dca`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Read: `docs/reports/2026-09-19-p3-a-fb2-31-event-player-relation-dispatch.md`

Result: dispatch one identity-free generic condition seam for trusted event actor relation: exact `event_player_is_controller` and `event_player_is_opponent` nodes. The remaining source-grounded inventory has 12 / 6 corresponding ability occurrences respectively. This task does not accept any parent trigger/effect route or consumer migration and earns zero frozen credit.

## TASK P3-FB2-31-EVENT-PLAYER-RELATION

Owner: Codex B2
Status: `READY`
Base: exact A FB2-31 dispatch commit
Read: `docs/reports/2026-09-19-p3-a-fb2-31-event-player-relation-dispatch.md`

Goal: implement only exact-shape, identity-free event-player controller/opponent condition evaluation over trusted `AbilityEvent.playerId`; fail closed on missing/unknown actor; do not broaden activation triggers, migrate consumers, change taxonomy/KPI, merge, or retarget.

Completion status allowed:
- `IMPLEMENTATION_COMPLETE_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`
- `IMPLEMENTATION_BLOCKED`

Formal recovery accepted remains `136/944`; FB2-31 is zero-credit infrastructure and requires fresh independent R review plus later A capability synchronization.

## TASK P3-A-R70-FB2-31-ACCEPTANCE-SYNC

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-r70-fb2-31-acceptance-sync`
Base: exact accepted Candidate `8d68f64aff1b37e4739ebc922ea4d7192714864c`
Read: `docs/reports/2026-09-19-p3-a-r70-fb2-31-acceptance-synchronization.md`

Result: record fresh R70 `IMPLEMENTATION_ACCEPTED_CANDIDATE` for FB2-31 from canonical PR #375 evidence `https://github.com/binchen648/fd/pull/375#issuecomment-5742361142`. A independently reproduces exact Base `26042ddf24284d2ecbe053ee70cb447c28f03cc2`, exact Candidate `8d68f64aff1b37e4739ebc922ea4d7192714864c`, one-commit ancestry, four-path authorized diff, clean Locked Reference, and zero frozen migration delta.

Accepted capability is limited to the exact type-only identity-free conditions `event_player_is_controller` and `event_player_is_opponent`, with trusted known-player lookup, fail-closed missing/unknown actor behavior, read-only evaluation, and no trigger widening.

Formal recovery accepted remains **`136/944`**, with **`808`** remaining. FB2-31 earns zero migration credit. PR #375 remains OPEN, unmerged, and unretargeted. Historical P3-FM09 remains `MIGRATION_BLOCKED`.

Next coordinator action is a fresh dependency overlay over the remaining source-grounded generic-extension rows; dispatch only an honestly complete homogeneous S family, otherwise select the next narrow B2 seam.

## TASK P3-A-FB2-32-SOURCE-STATE-CONDITIONS-DISPATCH

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-fb2-32-source-state-conditions-dispatch`
Base: exact R70 FB2-31 acceptance synchronization `189d221cb7f11693edec8985e1b69af775896bf4`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Read: `docs/reports/2026-09-19-p3-a-fb2-32-source-state-conditions-dispatch.md`

Result: fresh readiness overlay finds no homogeneous consumer family made fully S-ready solely by FB2-31. Dispatch the next narrow identity-free condition seam: exact type-only `source_active` and `source_owned`. They appear across 30 and 28 READY_GENERIC_EXTENSION identities respectively, while Locked Reference authoring shows only type-only structural occurrences. FB2-32 earns zero migration credit.

## TASK P3-FB2-32-SOURCE-STATE-CONDITIONS

Owner: Codex B2
Status: `READY`
Base: exact A FB2-32 dispatch commit
Read: `docs/reports/2026-09-19-p3-a-fb2-32-source-state-conditions-dispatch.md`

Goal: implement only identity-free exact-shape source-state conditions over the authoritative physical source card and current controller. `source_active` uses existing shared runtime active-state semantics; `source_owned` checks physical source owner == controller. Fail closed on malformed/stale source context. Do not broaden triggers/effects, migrate consumers, change KPI/taxonomy, merge, or retarget.

Formal recovery accepted remains `136/944`; FB2-32 is zero-credit infrastructure and requires fresh independent R review plus later A capability synchronization.


## TASK P3-A-R71-FB2-32-ACCEPTANCE-SYNC

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-r71-fb2-32-acceptance-sync`
Base: exact accepted Candidate `ae80ed7fb759a35964bcf5d9f581dc4e52d49d49`
Read: `docs/reports/2026-09-19-p3-a-r71-fb2-32-acceptance-synchronization.md`

Result: record formal Reviewer transport verdict `IMPLEMENTATION_ACCEPTED_CANDIDATE` for exact PR #376 Candidate `ae80ed7fb759a35964bcf5d9f581dc4e52d49d49`, backed by independent reviewer evidence commit `f1da3b4d0976cd80dbe4a3569bb9a216cf7dc441`. The persisted reviewer report uses the older accepted label `GATE_A_B_CANDIDATE_ACCEPTED`; transport normalization maps that same PR/Candidate/evidenceRef to the workflow token without re-review. Both prior blockers are independently re-probed closed: source-state nodes are condition-route-only, and nonphysical source context benignly fails false instead of throwing.

Accepted capability remains only exact type-only `source_active` and `source_owned` generic conditions. FB2-32 earns zero migration credit; formal accepted remains **`136/944`**, with **`808`** remaining. PR #376 remains OPEN, unmerged, and unretargeted. Historical P3-FM09 remains `MIGRATION_BLOCKED`.

Next coordinator action is a fresh dependency overlay over remaining source-grounded generic-extension rows; dispatch S only for a fully complete homogeneous family, otherwise choose the next narrow B2 seam.


## TASK P3-A-FB2-33-EVENT-COMBAT-OUTCOME-DISPATCH

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-fb2-33-event-combat-outcome-dispatch`
Base: exact R71 FB2-32 acceptance synchronization `8ca5037864fb11d98fe4a17d4ca8c9089bab2609`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Read: `docs/reports/2026-09-19-p3-a-fb2-33-event-combat-outcome-dispatch.md`

Result: fresh post-R71 overlay yields no complete homogeneous S family. Dispatch one narrow identity-free condition seam for exact type-only `event_player_won_combat` and `event_player_lost_combat`, grounded only in trusted `AbilityEvent.playerId` plus `battleResult.winners/loserIds`. Locked Reference has 13 type-only occurrences across the pair. FB2-33 earns zero migration credit.

## TASK P3-FB2-33-EVENT-COMBAT-OUTCOME

Owner: Codex B2
Status: `READY`
Base: exact A FB2-33 dispatch commit
Read: `docs/reports/2026-09-19-p3-a-fb2-33-event-combat-outcome-dispatch.md`

Goal: implement only condition-route, exact-shape, identity-free event-player combat outcome evaluation over trusted `AbilityEvent.playerId` and `battleResult`. Missing/unknown/malformed/contradictory context fails closed. Do not broaden activation triggers/effects, migrate consumers, change taxonomy/KPI, merge, or retarget.

Formal recovery accepted remains `136/944`; FB2-33 is zero-credit infrastructure and requires fresh independent R review plus later A capability synchronization.

## TASK P3-A-R72-FB2-33-ACCEPTANCE-SYNC

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-r72-fb2-33-acceptance-sync`
Base: exact accepted Candidate `5ccef0d682ce0673926e349eda1732419fc0792c`
Read: `docs/reports/2026-09-20-p3-a-r72-fb2-33-acceptance-synchronization.md`

Result: record formal Reviewer verdict `IMPLEMENTATION_ACCEPTED_CANDIDATE` for exact PR #377 Candidate `5ccef0d682ce0673926e349eda1732419fc0792c`, with canonical evidence `https://github.com/binchen648/fd/pull/377#issuecomment-5743426456`. Additional repeated reviews of the same PR/Candidate are redundant evidence only and do not create new acceptance events.

Accepted capability remains only exact type-only identity-free `event_player_won_combat` and `event_player_lost_combat` generic conditions over trusted `AbilityEvent.playerId` plus `battleResult`. FB2-33 earns zero migration credit; formal accepted remains **`136/944`**, with **`808`** remaining. PR #377 remains OPEN, unmerged, and unretargeted. Historical P3-FM09 remains `MIGRATION_BLOCKED`.

Next coordinator action is a fresh dependency overlay over remaining source-grounded generic-extension rows; dispatch S only for a fully complete homogeneous family, otherwise choose the next narrow B2 seam.

## TASK P3-A-FB2-34-COMBAT-REWARD-DISTRIBUTION-DISPATCH

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-fb2-34-combat-reward-distribution-dispatch`
Base: exact R72 FB2-33 acceptance synchronization `c6f9cede9423c29725daf93a59dcbf79d6bf1a08`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Read: `docs/reports/2026-09-20-p3-a-fb2-34-combat-reward-distribution-dispatch.md`

Result: migration-closure-first overlay identifies `servant.stheno.skill.sc-stheno-2` as the nearest honest closure target after FB2-33. Its only remaining formal capability gap is the exact static passive `combat_reward_distribution` replacement (`subject=controller`, `whenControllerWins=true`, `mode=full_reward_each`). Locked Reference has two occurrences of this modifier core, but the Napoleon occurrence is lifecycle/effect-installed and remains out of scope. FB2-34 earns zero migration credit.

## TASK P3-FB2-34-COMBAT-REWARD-DISTRIBUTION

Owner: Codex B2
Status: `READY`
Base: exact A FB2-34 dispatch commit
Read: `docs/reports/2026-09-20-p3-a-fb2-34-combat-reward-distribution-dispatch.md`

Goal: implement only the exact identity-free static passive `combat_reward_distribution: replace/full_reward_each` battle-scoring modifier over authoritative active source cards. Full-reward mode changes only split distribution of event/competition/location VP pools when a modifier controller is a winner; it must not change winner selection, battle Power, defeat/military settlement, individually assigned bonuses, lifecycle, or other modifier families. Near-matches fail closed. Do not migrate Stheno in B2.

Formal recovery accepted remains `136/944`; FB2-34 is zero-credit infrastructure and requires fresh independent R review plus later A capability synchronization. On acceptance, A must immediately re-overlay and prefer Stheno S migration over another unrelated B2 seam.

## TASK P3-A-R73-FB2-34-ACCEPTANCE-SYNC

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-r73-fb2-34-acceptance-sync`
Base: exact accepted Candidate `99032d4458352ecdee26dd8964b46ce4e094c0f3`
Read: `docs/reports/2026-09-20-p3-a-r73-fb2-34-acceptance-synchronization.md`

Result: record formal Reviewer verdict `IMPLEMENTATION_ACCEPTED_CANDIDATE` for exact PR #378 Candidate `99032d4458352ecdee26dd8964b46ce4e094c0f3`, with canonical evidence `https://github.com/binchen648/fd/pull/378#issuecomment-5744013376`. Later accepted comment `5744094298` is redundant evidence only and creates no additional acceptance event or credit. The prior Candidate `996e7a7c5b294f4d6208ca7ec473d0ef6adccf27` remains terminal `IMPLEMENTATION_NEEDS_REVISION` and is not re-reviewed.

Accepted capability is limited to the exact identity-free static passive `combat_reward_distribution: replace/full_reward_each` envelope, including the corrected loader-to-compiled-runtime semantic preservation. FB2-34 earns zero migration credit; formal accepted remains **`136/944`**, with **`808`** remaining. PR #378 remains OPEN, unmerged, and unretargeted.

Next coordinator action is mandatory migration-closure-first re-overlay for `servant.stheno.skill.sc-stheno-2`; if no new blocker is found, dispatch S immediately before any unrelated B2 seam.

## TASK P3-S-R73-STHENO-CONSUMER-MIGRATION

Owner: Codex S
Status: `READY`
Base: exact A R73 Stheno migration dispatch commit
Read: `docs/reports/2026-09-20-p3-a-r73-stheno-consumer-migration-dispatch.md`

Goal: migrate exactly `servant.stheno.skill.sc-stheno-2` as one standalone servant-skill archive using only already accepted structural semantics: true-name marker metadata, FB2-34 static `combat_reward_distribution: replace/full_reward_each`, and `forced_trigger + after_controller_wins_battle + adjust_victory_points(controller,+1)`. No runtime-source widening, no additional consumer, no pack/generated registration.

Project formal migration accounting remains `136/944` until fresh independent R returns `MIGRATION_ACCEPTED` for the exact S Candidate and A performs acceptance synchronization. This lineage material should move only `132 -> 133`.

## TASK P3-A-R74-STHENO-MIGRATION-ACCEPTANCE-SYNC

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-r74-stheno-migration-acceptance-sync`
Base: exact accepted S Candidate `6b2a5860ebaac9adea0b6f945a611f01f21a7eeb`
Read: `docs/reports/2026-09-20-p3-a-r74-stheno-migration-acceptance-synchronization.md`

Result: record formal fresh R `MIGRATION_ACCEPTED` for PR #379 exact Candidate `6b2a5860ebaac9adea0b6f945a611f01f21a7eeb`, backed by canonical evidence `https://github.com/binchen648/fd/pull/379#issuecomment-5744243085`. The accepted migration adds exactly one frozen consumer, `servant.stheno.skill.sc-stheno-2`, preserves existing `sc-stheno-1`, changes no runtime source or product registration, and has zero removals / zero duplicates.

Formal project migration accounting advances from **`136/944`** to **`137/944`**, with **`807`** remaining. PR #379 remains OPEN, unmerged, and unretargeted. Historical P3-FM09 remains `MIGRATION_BLOCKED`.

Next coordinator action is a fresh migration-closure-first dependency overlay from `137/944`; prefer a fully S-ready homogeneous family, otherwise close only the nearest 1-2 narrow B2 blockers and immediately return to S migration.

## TASK P3-A-FB2-35-ROUND-ACTIVE-ATTACK-PAID-COST-COMBAT-POWER-DISPATCH

Owner: Codex A
Status: `READY`
Branch: `codex/a-p3-fb2-35-round-active-attack-paid-cost-combat-power-dispatch`
Base: exact R74 Stheno migration acceptance sync `e93c3b03d82a3a579473a4da67124319ba9975ec`
Read: `docs/reports/2026-09-20-p3-a-fb2-35-round-active-attack-paid-cost-combat-power-dispatch.md`

Result: migration-closure-first overlay selects `servant.ibaraki.skill.sc-ibaraki-1` as the nearest closure target. Dispatch one narrow identity-free B2 seam for the exact permanent passive `combat_power:add(+6)` shape over `players_at_source_battlefield` whose current-round active-attack **actual paid mana** sum is tied highest. Add generic per-card authoritative paid-on-play provenance only as needed for that metric; do not substitute printed cost, do not support the different Twice shape, and do not migrate Ibaraki in B2.

Formal migration remains **`137/944`**, remaining **`807`**. FB2-35 is zero-credit infrastructure. On fresh R acceptance plus A capability synchronization, immediately re-overlay and prefer Ibaraki S migration over any unrelated B2 seam.

## TASK P3-A-R75-FB2-35-ACCEPTANCE-SYNC

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-r75-fb2-35-acceptance-sync`
Base: exact accepted Candidate `70df7d3782b553e9f4c222289ebb6c66c619e1e0`
Read: `docs/reports/2026-09-20-p3-a-r75-fb2-35-acceptance-synchronization.md`

Result: record formal fresh R `IMPLEMENTATION_ACCEPTED_CANDIDATE` for PR #380 exact Candidate `70df7d3782b553e9f4c222289ebb6c66c619e1e0`, backed by canonical evidence `https://github.com/binchen648/fd/pull/380#issuecomment-5744753519`. Earlier revision verdicts for historical Candidates are terminal evidence only and do not trigger rework or duplicate review.

Accepted capability is limited to identity-free authoritative actual-paid-on-play provenance plus the exact permanent `source_owned` / current-round active authored-attack paid-cost-highest participant `combat_power:add(+6)` envelope. FB2-35 earns zero migration credit; formal accepted remains **`137/944`**, with **`807`** remaining. PR #380 remains OPEN, unmerged, and unretargeted.

Next coordinator action is mandatory immediate re-overlay for `servant.ibaraki.skill.sc-ibaraki-1`; if no new blocker is found, dispatch S before any unrelated B2 seam.

## TASK P3-A-FB2-36-SKILL-USE-FORBID-SELECTORS-DISPATCH

Owner: Codex A
Status: `DISPATCHED`
Branch: `codex/a-p3-fb2-36-skill-use-forbid-selectors-dispatch`
Base: `ef5c93db818a1f6ab3bf830a182e4f0281fec964`
Read: `docs/reports/2026-09-20-p3-a-fb2-36-skill-use-forbid-selectors-dispatch.md`

Result: dispatch one narrow identity-free B2 seam for exact `skill_use / forbid` play-permission selectors: (a) same-location players filtered by `notInAttack + trueNameRelease` under source-bound `while_active`, and (b) same-location opponents filtered by master/servant skill-zone + face-down state for `this_round`. Do not add generic `activate_ability` forbids, definition-ID selectors, consumer identities, or migration credit.

Formal migration remains **`137/944`**, remaining **`807`**. PR #381 / Ibaraki remains pending migration review and is not part of this exact Base. After fresh B2 acceptance + A capability sync, immediately re-overlay and prefer newly S-ready consumers over unrelated infrastructure.

## TASK P3-A-R76-FB2-36-ACCEPTANCE-SYNC

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-r76-fb2-36-acceptance-sync`
Base: exact accepted Candidate `22731b5be697825bd6bfbc09faea3c333eb629b6`
Read: `docs/reports/2026-09-20-p3-a-r76-fb2-36-acceptance-synchronization.md`

Result: synchronize formal fresh R `IMPLEMENTATION_ACCEPTED_CANDIDATE` for PR #382 exact Candidate `22731b5be697825bd6bfbc09faea3c333eb629b6`, backed by canonical evidence `https://github.com/binchen648/fd/pull/382#issuecomment-5745209825`. Accepted capability is limited to the two exact identity-free structural `skill_use / forbid` selectors and authoritative play-eligibility enforcement described by FB2-36.

FB2-36 earns zero migration credit; formal migration remains **`137/944`**, with **`807`** remaining. PR #382 remains OPEN, unmerged, and unretargeted. Next action is immediate migration-closure-first re-overlay and S dispatch of the nearest homogeneous consumer target before unrelated runtime work.

## TASK P3-A-R76-NURSERY-CONSUMER-MIGRATION-DISPATCH

Owner: Codex A
Status: `READY`
Branch: `codex/a-p3-r76-nursery-consumer-migration-dispatch`
Base: `7bec7b8bf24150602f3c0b04edf53130de19c72e`
Read: `docs/reports/2026-09-20-p3-a-r76-nursery-consumer-migration-dispatch.md`

Result: migration-closure-first overlay dispatches exactly one homogeneous frozen identity, `servant.nursery.skill.sc-nursery-2`, now S-ready on formally accepted FB2-36. Author exactly one new standalone Nursery archive card plus focused migration evidence; no runtime production source change and no second consumer identity.

Formal migration remains **`137/944`**, remaining **`807`** until fresh R returns `MIGRATION_ACCEPTED` for the exact S Candidate and A synchronizes it. PR #381 / Ibaraki remains pending independently and is not part of this Base.

## TASK P3-A-R77-NURSERY-MIGRATION-ACCEPTANCE-SYNC

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-r77-nursery-migration-acceptance-sync`
Base: exact accepted Candidate `ad3633676a2daca846d1982490253ca1e0ba8a05`
Read: `docs/reports/2026-09-20-p3-a-r77-nursery-migration-acceptance-synchronization.md`

Result: synchronize formal fresh R `MIGRATION_ACCEPTED` for PR #383 exact Candidate `ad3633676a2daca846d1982490253ca1e0ba8a05`, backed by canonical evidence `https://github.com/binchen648/fd/pull/383#issuecomment-5745315752`. Exact frozen addition is `servant.nursery.skill.sc-nursery-2`; independent Base→Candidate frozen overlap is `133/944 → 134/944`, with zero removals and zero duplicates.

Formal project migration advances exactly one identity to **`138/944`**, with **`806`** remaining. PR #383 remains OPEN, unmerged, and unretargeted. PR #381 / Ibaraki remains pending independent migration review and receives no credit here. Next action is immediate closure-first re-overlay of the next S-ready consumer unlocked by accepted FB2-36.

## TASK P3-A-R77-HELENA-CONSUMER-MIGRATION-DISPATCH

Owner: Codex A
Status: `READY`
Branch: `codex/a-p3-r77-helena-consumer-migration-dispatch`
Base: `c0f864e5bbd6a1077d4641a78c5783832eded9c2`
Read: `docs/reports/2026-09-20-p3-a-r77-helena-consumer-migration-dispatch.md`

Result: migration-closure-first dispatches exactly one frozen identity, `servant.helena.skill.sc-helena-3`, S-ready on formally accepted FB2-36. Author exactly one standalone Helena archive card plus focused migration evidence; no runtime production source change and no second consumer identity.

Formal migration remains **`138/944`**, remaining **`806`** until fresh R returns `MIGRATION_ACCEPTED` for the exact S Candidate and A synchronizes it. PR #381 / Ibaraki remains pending independently and is not part of this Base.
## TASK P3-A-R78-HELENA-MIGRATION-ACCEPTANCE-SYNC

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-r78-helena-migration-acceptance-sync`
Base: exact accepted Candidate `ca8a4de1815c360ecc242f0563bf30e5e80eea5d`
Read: `docs/reports/2026-09-20-p3-a-r78-helena-migration-acceptance-synchronization.md`

Result: synchronize formal fresh R `MIGRATION_ACCEPTED` for PR #384 exact Candidate `ca8a4de1815c360ecc242f0563bf30e5e80eea5d`, backed by canonical evidence `https://github.com/binchen648/fd/pull/384#issuecomment-5745483145`. Exact frozen addition is `servant.helena.skill.sc-helena-3`; independent Base-to-Candidate frozen overlap is `134/944` to `135/944`, with zero removals and zero duplicates.

Formal project migration advances exactly one identity to **`139/944`**, with **`805`** remaining. PR #384 remains OPEN, unmerged, and unretargeted. PR #381 / Ibaraki remains pending independent migration review and receives no credit here. Next action is immediate migration-closure-first re-overlay from the synchronized formal baseline.
## TASK P3-A-FB2-37-DEPLOYMENT-DESTINATIONS-DISPATCH

Owner: Codex A
Status: `DISPATCHED`
Branch: `codex/a-p3-fb2-37-deployment-destinations-dispatch`
Base: exact R78 Helena migration acceptance sync `cebd96a34845c109b87ddb0d6563628cd906305d`
Read: `docs/reports/2026-09-20-p3-a-fb2-37-deployment-destinations-dispatch.md`

Result: closure-first overlay selects `master.kayneth.skill.s3` as the nearest one-seam target. Dispatch one narrow identity-free exact `deployment_destinations / replace` structural modifier over controller deployment to a lower-VP opponent who is the sole active occupant of an otherwise legal battlefield. Preserve the existing generic legacy product effect route only for compatibility; remove identity-bearing production helper naming and do not migrate any consumer in B2.

FB2-37 earns zero migration credit. Formal migration remains **`139/944`**, with **`805`** remaining. On fresh R acceptance plus A synchronization, immediately dispatch Kayneth s3 S migration before unrelated runtime work.
