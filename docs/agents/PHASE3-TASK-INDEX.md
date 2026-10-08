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
- Accepted complete direct route is only the structural `advance/outpost + fixed pay 1 Mana + draw 2` family. At current F1 membership this yields one complete representative (`master.waver.skill.s2`) pending separate S migration; it does not create a 10闁?0 F4 batch.
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
- The first 10闁?0 F4 batch gate is therefore met at 14 exact IDs. P3-FM01 is dispatched as `READY`; Okita remains excluded.

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

Goal: accept exactly one identity-free TO15 Power sub-contract for the ten remaining Saber-family `閻庨潧缍婇悺鐔煎礉濞?cards: combat-phase Magic Resistance sets same-battlefield engaged opponents' Magic-attribute attack-card current Power to zero for this round. Do not promote broad Power/Modifier runtime.

Exact accepted semantic shape only:
- `phase_action`; activation phase `combat`; opens `controller_combat_action_window`; `requiresSourceState=active`;
- no conditions, targets, costs, effects, creates, response window, limit, or visibility semantics;
- exactly one `ruleModifier`;
- modifier type `combat_power_modifier`; operation `set`; rule `attack.currentPower`; value exactly `0`;
- scope controller exactly `engaged_opponents_same_battlefield`; object exactly `attack_card`;
- exactly one scope constraint `has_attribute(attribute=濮掑嫭姊瑰﹢?`;
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
- Locked Reference metadata is uniform for all ten selected cards: `cost=3`, `basePower=3`, `typeLabel=闁绘顫夐悾銉? historical `requirement=3`. Final rule 9.4 still requires 8 mana from the skill zone.
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

Goal: independently review the exact ten-member FM07 Alter Ego migration without implementing fixes. Required checks: exact 10-ID addition/no removals; nine regular source-text SHA plus distinct Sion EX SHA; locked owner/class/legacy/static metadata including Passionlip's distinct `闁绘顫夐悾銉?metadata and Sion `Master`; final 8-mana skill-zone gate kept separate from printed card cost and Sion's triggered 3-mana payment; exact FB2-13 regular/EX structural conformance; real migrated regular and EX execution; A burn-down/material coverage integrity; no runtime diff; focused/migration/rules/content/determinism/full CI/diff check.

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
Status: `READY`
Base: exact P3-A-R45-FB2-17-R3-RECOVERY-SYNC commit carrying this task block

Goal: freshly classify the remaining eleven frozen FM09 provisioning target definitions against F1/Reference provenance and current accepted runtime/representation seams, then dispatch only the narrowest next dependency. Historical downstream target work is planning evidence only.

## Full-Roster Dispatch State After Fresh R45 Acceptance Synchronization

- FB2-17-R3 / R45 closes the non-frozen Shirou derived target dependency.
- Material coverage is `99/134/233`, compiled `71/14/0`; frozen accepted overlap remains `111/944` because the Shirou derived card is outside the frozen denominator.
- Eleven frozen FM09 provisioning targets remain absent and unresolved.
- P3-A-FM09-TARGET-DEPENDENCY-PLANNING is READY; it must freshly select the next narrow dependency rather than inherit historical ordering.
- P3-FM09 remains `MIGRATION_BLOCKED`; no FM10 or broad Ciel task is dispatched.
## TASK P3-A-MAIN-REPLAY-FB2-49-DISPATCH

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-main-replay-fb2-49-dispatch`
Base: exact current main `4b52b3166ed2ba0efaa4569ee95c6513fd26ab2f`
Read: `docs/reports/2026-09-25-p3-a-main-replay-fb2-49-dispatch.md`

Result: integration-recovery reconciliation authorizes exactly one current-main semantic replay: the identity-free FB2-49 opponent-close-to-one runtime/restore authority contract proven by PR #422 exact Base `822b5f9dfd05a64a5707fcb945b8b85eff2238e6` -> accepted Candidate `aa04a12e1647560374e09f7e2b6e62a5dccd0954`. This A dispatch grants zero migration credit and does not accept any frontier authoring identity on main. PR #424 is evidence-only for this replay and must not be used as a wholesale promotion source because its main-relative tree adds 35 frozen authoring identities (`111/944 -> 146/944` material) while declaring zero migration credit.

Current-main formal accepted overlap remains `111/944`. Historical frontier formal/material ledgers remain evidence only until replayed through current-main A/B/R/A/I gates.

## TASK P3-B-MAIN-REPLAY-FB2-49

Owner: Codex B2
Status: `IMPLEMENTATION_BLOCKED`
Base: exact A dispatch `8842186ca3653775d35dd07eff1965606532da66`
Blocker report: `docs/reports/2026-09-25-p3-b-main-replay-fb2-49-blocked.md`
Result: current main lacks the accepted FB2-42 `card_close` forbid prerequisite that the exact #422 FB2-49 accepted runtime checks before any close mutation. The replay therefore stops fail-closed without importing FB2-42 or any frontier consumer material. Next A action is a separate zero-credit current-main semantic replay of FB2-42, then re-dispatch FB2-49 from that synchronized capability lineage.
Source semantic diff: PR #422 exact Base `822b5f9dfd05a64a5707fcb945b8b85eff2238e6` -> accepted Candidate `aa04a12e1647560374e09f7e2b6e62a5dccd0954`
Accepted source reviewer evidence: `https://github.com/binchen648/fd/pull/422#issuecomment-5775423822`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Read: `docs/reports/2026-09-25-p3-a-main-replay-fb2-49-dispatch.md`, `docs/governance/phase3-promotion-lane.md`

Goal: re-implement on current main only the identity-free FB2-49 opponent-close-to-one compound interaction and its authenticated lifecycle/restore/replay authority. Treat #422 Base->Candidate as semantic evidence, not as a commit-history transplant. Do not cherry-pick or merge frontier commits. Preserve current-main behavior outside the exact FB2-49 envelope.

May touch only as required by the exact replay:
- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/loader.ts`
- `packages/rules/src/ability/opponent-close-to-one.ts`
- `packages/rules/src/ability/opponent-close-to-one-authority.ts`
- `packages/rules/src/ability/portable-sha256.ts`
- `packages/rules/src/ability/types.ts`
- `packages/rules/src/index.ts`
- `packages/rules/src/match-session.ts`
- `packages/rules/src/match-room.ts`
- `packages/rules/src/match-room-hub.ts`
- `apps/server/src/match-server.ts`
- focused tests for the exact files above, including FB2-49 / MatchSession / MatchRoomHub / server restore / portable SHA as needed
- one B result report for this task

Must not touch:
- `data/authoring/**`
- `data/packs/**`
- `data/generated/**`
- `apps/client/**`
- unrelated Phase 3 consumer/migration files
- M50-03 frozen work
- promotion/governance policy files

Hard replay constraints:
- no character/card/ability identity routing;
- no printed-text or Chinese-text runtime routing;
- no SkillLib fallback;
- no import of the 35 frozen identities currently present in PR #424 but absent from main;
- no Astolfo or Scathach migration/credit; they remain later consumers requiring current-main parity after this capability is accepted;
- zero migration credit; formal main remains `111/944` through B/R/A capability synchronization;
- if an exact prerequisite is missing on current main, return `IMPLEMENTATION_BLOCKED` with the missing structural dependency. Do not pull that prerequisite from frontier automatically;
- if the exact #422 semantic diff cannot be reproduced without unrelated frontier runtime, stop as `IMPLEMENTATION_BLOCKED` rather than widening scope.

Required validation before fresh R: exact focused FB2-49 tests and adversarial restore/replay/lifecycle tests; affected MatchSession/MatchRoomHub/server tests; `npm.cmd run typecheck`; `npm.cmd run test:ci -- --maxWorkers=2`; `npm.cmd run content:validate`; generated-content determinism; `git diff --check`; exact current-main material rescan proving `111/944`, zero frozen additions/removals/duplicates.

Allowed final status:
- `IMPLEMENTATION_COMPLETE_CANDIDATE`
- `IMPLEMENTATION_BLOCKED`

After `IMPLEMENTATION_COMPLETE_CANDIDATE`: commit/push one exact Candidate, open one stacked PR against the exact A dispatch branch, then request one fresh independent R. Do not merge or retarget.
## TASK P3-A-MAIN-REPLAY-FB2-42-DISPATCH

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-main-replay-fb2-42-dispatch`
Base: exact blocked FB2-49 evidence Candidate `855ae96f509f9a9dccb243b3d276f4ccf1d67288`
Read: `docs/reports/2026-09-25-p3-a-main-replay-fb2-42-dispatch.md`

Result: current-main reconciliation reorders the prerequisite chain after `P3-B-MAIN-REPLAY-FB2-49` mechanically returned `IMPLEMENTATION_BLOCKED`. Dispatch exactly one zero-credit current-main replay of the accepted FB2-42 controlled-card close-forbid capability. Historical source authority is PR #394 exact Base `ec39baa2d99c1e9f2359e832ca7bd61118c44558` -> accepted Candidate `d082a90e194ee4cf1f528086f1ba01150a9ead41`, canonical reviewer evidence `https://github.com/binchen648/fd/pull/394#issuecomment-5748132070`. No consumer material or migration credit is authorized.

Current-main formal/material accounting remains `111/944`.

## TASK P3-B-MAIN-REPLAY-FB2-42

Owner: Codex B2
Status: `ACCEPTED`
Base: exact `P3-A-MAIN-REPLAY-FB2-42-DISPATCH` commit carrying this task block
Source implementation Base: `ec39baa2d99c1e9f2359e832ca7bd61118c44558`
Source accepted Candidate: `d082a90e194ee4cf1f528086f1ba01150a9ead41`
Source fresh-R evidence: `https://github.com/binchen648/fd/pull/394#issuecomment-5748132070`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Read: `docs/reports/2026-09-25-p3-a-main-replay-fb2-42-dispatch.md`

Goal: adapt only the accepted identity-free FB2-42 controlled-card close-forbid capability to the current-main runtime. Do not cherry-pick or merge frontier ancestry. The admitted seam is exact `operation=forbid`, `rule=card_close`, `scope.controller=self`, one nonempty structural `has_card_id` selector, modifier lifecycle `this_round`, automatic parent, ordinary source-bound liveness. Both server-owned `close_source_card` routes must reject before mutation/event while the matching live modifier is active; dead protection source, expired round, different controller/definition and widened near-matches must not protect.

Authorized production/test scope only:
- `packages/rules/src/ability/card-close-forbid.ts`
- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/loader.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/src/core/card-source-state.ts`
- `packages/rules/src/index.ts`
- `packages/rules/tests/fb2-42-controlled-card-close-forbid.test.ts`
- one current-main B replay result report

Must not touch `data/authoring/**`, packs, generated content, client production, consumer identities, M50-03, FB2-49 implementation files, or governance policy. No character/card identity routing, printed-text routing, Chinese-text parsing or SkillLib fallback. Zero migration credit; current-main formal/material remains `111/944`.

Required validation: exact focused FB2-42 + current-main card close/source-liveness/resolution-dataflow coverage; typecheck; affected rules suites; official `test:ci -- --maxWorkers=2`; content validation; generated-content determinism; `git diff --check`; current-main frozen rescan proving `111/944`, zero additions/removals/duplicates. If the exact accepted capability requires another prerequisite absent from current main, return `IMPLEMENTATION_BLOCKED` instead of widening scope.

Allowed final status:
- `IMPLEMENTATION_COMPLETE_CANDIDATE`
- `IMPLEMENTATION_BLOCKED`

On `IMPLEMENTATION_COMPLETE_CANDIDATE`, commit/push one exact B Candidate, open one stacked PR against this exact A dispatch branch, and request one fresh independent R. Do not merge or retarget.

## TASK P3-A-MAIN-REPLAY-FB2-42-ACCEPTANCE-SYNCHRONIZATION

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-main-replay-fb2-42-acceptance-sync`
Implementation Base: `c6c5786cb48f6abc563aa8359e335fbd26c14c4f`
Accepted Candidate: `c820161a427de6b0e55c209b7e14e3f6fba36033`
Canonical fresh-R evidence: `https://github.com/binchen648/fd/pull/444#issuecomment-5830650148`
Read: `docs/reports/2026-09-25-p3-a-main-replay-fb2-42-acceptance-synchronization.md`

Result: fresh independent retry1 accepted the exact current-main FB2-42 replay Candidate after the prior environment-only `MIGRATION_BLOCKED` attempt was repaired without changing Candidate. A synchronizes the accepted identity-free `card_close` forbid capability only. This synchronization is zero-credit infrastructure and does not import any frontier consumer material.

Current-main formal/material accounting remains `111/944`, with `833` remaining. No authoring addition/removal is granted by FB2-42.

## TASK P3-B-MAIN-REPLAY-FB2-49-R2

Owner: Codex B2
Status: `READY`
Base: exact `P3-A-MAIN-REPLAY-FB2-42-ACCEPTANCE-SYNCHRONIZATION` commit carrying this task block
Source semantic diff: PR #422 exact Base `822b5f9dfd05a64a5707fcb945b8b85eff2238e6` -> accepted Candidate `aa04a12e1647560374e09f7e2b6e62a5dccd0954`
Source reviewer evidence: `https://github.com/binchen648/fd/pull/422#issuecomment-5775423822`
Prerequisite accepted on current main: FB2-42 Candidate `c820161a427de6b0e55c209b7e14e3f6fba36033`, evidence `https://github.com/binchen648/fd/pull/444#issuecomment-5830650148`
Read: `docs/reports/2026-09-25-p3-a-main-replay-fb2-49-dispatch.md`, `docs/reports/2026-09-25-p3-b-main-replay-fb2-49-blocked.md`, `docs/reports/2026-09-25-p3-a-main-replay-fb2-42-acceptance-synchronization.md`

Goal: resume the previously blocked current-main semantic replay of FB2-49 now that the exact FB2-42 close-forbid prerequisite is synchronized. Treat PR #422 / #424 / divergent frontier only as semantic/evidence sources. Do not cherry-pick, merge, wholesale-copy, retarget, or import their ancestry.

Authorized production scope remains the existing narrow FB2-49 hot-set only: `packages/rules/src/ability/interpreter.ts`, `loader.ts`, `opponent-close-to-one.ts`, `opponent-close-to-one-authority.ts`, `portable-sha256.ts`, `types.ts`, `packages/rules/src/index.ts`, `packages/rules/src/match-session.ts`, `match-room.ts`, `match-room-hub.ts`, `apps/server/src/match-server.ts`, exact focused/restore/replay/server tests, and one B result report.

Hard constraints remain unchanged: no `data/authoring/**`, packs/generated/client production, M50-03, governance-policy edits, identity/name/printed-text/Chinese runtime routing, SkillLib fallback, Astolfo/Scathach consumer migration, or migration credit. Current-main formal/material must remain `111/944` throughout B/R/A capability synchronization.

Required validation before fresh R: exact focused FB2-49 plus adversarial restore/replay/lifecycle coverage, affected MatchSession/MatchRoom/Hub/server tests, typecheck, official `test:ci -- --maxWorkers=2`, content validation, generated determinism, `git diff --check`, and frozen rescan proving `111/944`, zero additions/removals/duplicates.

Allowed final status:
- `IMPLEMENTATION_COMPLETE_CANDIDATE`
- `IMPLEMENTATION_BLOCKED`

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
## TASK P3-A-MAIN-REPLAY-FB2-49-ACCEPTANCE-SYNCHRONIZATION

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-main-replay-fb2-49-acceptance-sync`
Implementation Base: `5c8e21c853ac95a1b0ee42e28108ae40692491cf`
Accepted Candidate: `658849d1602bd4b705a924f6aa649e973d9d65ca`
Canonical fresh-R evidence: `https://github.com/binchen648/fd/pull/445#issuecomment-5832739229`
Read: `docs/reports/2026-09-25-p3-a-main-replay-fb2-49-acceptance-synchronization.md`

Result: fresh independent R accepted the exact current-main FB2-49 semantic replay Candidate. A synchronizes only the identity-free opponent-close-to-one transaction/lifecycle/restore/replay authority capability on the current-main reconciliation lineage. This is zero-credit infrastructure and does not import any frontier consumer authoring, generated material, Astolfo/Scathach migration, or divergent ancestry.

Current-main formal/material accounting remains `111/944`, with `833` remaining. No frozen identity is added or removed by FB2-49 capability acceptance synchronization.

PR #422, PR #424, PR #423, PR #441 and R123 remain semantic/evidence sources only; they are not ancestry sources and must not be cherry-picked/merged/retargeted wholesale.

## TASK P3-S-MAIN-REPLAY-ASTOLFO-S1-CONSUMER

Owner: Codex S
Status: `READY`
Base: exact `P3-A-MAIN-REPLAY-FB2-49-ACCEPTANCE-SYNCHRONIZATION` commit carrying this task block
Identity: `servant.astolfo.skill.sc-astolfo-1`
Historical source migration: PR #423 exact Base `2909898608d0d986fbc77b5936bdfbfdcf0ed953` -> accepted Candidate `110257b76a957a5bba39ea1822f7861cecf288a9`
Historical reviewer evidence: `https://github.com/binchen648/fd/pull/423#issuecomment-5775187822`
Current-main FB2-49 prerequisite: Candidate `658849d1602bd4b705a924f6aa649e973d9d65ca`, evidence `https://github.com/binchen648/fd/pull/445#issuecomment-5832739229`
Reconciliation source: PR #442 / `artifacts/phase3-frontier-reconciliation.json`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

Goal: replay exactly one frozen consumer identity, `servant.astolfo.skill.sc-astolfo-1`, onto the synchronized current-main FB2-49 runtime. Treat historical PR #423 as source/semantic/test evidence only; do not transplant its ancestry. Reconstruct the complete card against current-main and preserve the accepted `opponent_close_non_residual_to_one` whole-ability envelope, final skill-zone play threshold/cost behavior, source ownership/battlefield conditions, combat timing, true-name reveal, private per-opponent keep-one settlement, authenticated persistence/replay boundaries, and malformed/stale fail-closed behavior.

Authorized scope:
- `data/authoring/servants/servant.astolfo.json` 閳?exactly the one dispatched frozen card;
- `packages/rules/tests/astolfo-s1-consumer-migration.test.ts` 閳?current-main focused whole-card/runtime/persistence/accounting evidence;
- one S result report for this task;
- a pre-existing test may receive only the minimum accounting-baseline compatibility edit if current-main absolute-count coupling mechanically requires it; do not port historical compatibility edits speculatively.

Forbidden scope:
- no production runtime changes;
- no second frozen identity;
- no Scathach S2 / M50-02 decomposition in this task;
- no `data/generated/**`, packs, client production, promotion/governance policy, or frontier ancestry import;
- no character/card canonical-ID routing, printed-text/Chinese-text runtime routing, or SkillLib fallback.

Accounting contract:
- exact Base material/formal overlap: `111/944`, duplicate frozen IDs `0`;
- Candidate material must be exactly `112/944`: exact +1 Astolfo S1, zero frozen removals, zero duplicates, no second frozen identity;
- formal migration remains `111/944` until fresh independent R returns `MIGRATION_ACCEPTED` for the exact Candidate and A performs acceptance synchronization;
- after that A synchronization only, formal/material may become `112/944`, remaining `832`.

Required validation before fresh R: complete-card source/printed-clause provenance recheck; loader admission with zero report for the exact authoring; 7/8-mana play boundary and printed cost 4; combat timing/true-name/source ownership/battlefield positives and negatives; exact FB2-49 settlement + forged/stale/replay/persistence negatives; focused Astolfo + FB2-49 + FB2-42 coverage; `npm.cmd run typecheck`; official `npm.cmd run test:ci -- --maxWorkers=2`; `npm.cmd run content:validate`; generated-content determinism; `git diff --check`; frozen rescan proving Base `111/944` -> Candidate `112/944`, exact +1, zero removals/duplicates.

Long-term S rule: **S 鐎瑰本鍨?recertification 楠炶埖褰佹禍?Exact Base/Candidate**閵?
Allowed final status:
- `MIGRATION_COMPLETE_CANDIDATE`
- `MIGRATION_BLOCKED`

On `MIGRATION_COMPLETE_CANDIDATE`, commit/push one exact Candidate, open one stacked PR against this exact A synchronization branch, and request one fresh independent R. Do not merge or retarget.
## TASK P3-A-MAIN-REPLAY-ASTOLFO-S1-ACCEPTANCE-SYNCHRONIZATION

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-main-replay-astolfo-s1-acceptance-sync-r2`
Implementation Base: `7c2ee773a8ca36fde7cc2812c86e9cb20cdb83e2`
Accepted Candidate: `509a027a3b5487259b2c3f6d3c7722710031c046`
Canonical fresh-R evidence: `https://github.com/binchen648/fd/pull/446#issuecomment-5833210179`
Read: `docs/reports/2026-09-25-p3-a-main-replay-astolfo-s1-acceptance-synchronization.md`

Result: fresh independent R returned `MIGRATION_ACCEPTED` for the exact current-main Astolfo S1 replay Candidate. A synchronizes exactly one frozen identity, `servant.astolfo.skill.sc-astolfo-1`, on top of the already synchronized FB2-49 runtime. No second identity, production runtime, generated product, pack registration, client production, frontier ancestry, merge, or retarget is included.

Current-main formal/material accounting is now `112/944`, with `832` remaining. This synchronization grants exactly +1 formal migration credit for Astolfo S1 and zero other frozen identities.

## TASK P3-A-MAIN-REPLAY-SCATHACH-S2-CONTRACT-DECOMPOSITION

Owner: Codex A
Status: `DECOMPOSITION_COMPLETE`
Base: exact `P3-A-MAIN-REPLAY-ASTOLFO-S1-ACCEPTANCE-SYNCHRONIZATION` commit carrying this task block
Identity under analysis: `servant.scathach.skill.sc-scathach-2`
Historical material source: PR #441 Candidate `fc6d2f52f2d2cebbedc60e9e5d106744b347c8ff`
Historical reviewer evidence: `https://github.com/binchen648/fd/pull/441#issuecomment-5825842148`
Reconciliation source: PR #442 / `artifacts/phase3-frontier-reconciliation.json`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

Goal: decompose Scathach S2 before any current-main migration. The historical M50-02 card has two structured abilities: combat `opponent_close_one_non_residual` under `target_count_equals(same_battlefield_opponents, 1)`, and passive `death-omen` using `gain_victory_points_per_target` after battle result. Determine, against the exact current-main lineage, which normalized contracts/capabilities already exist, which require current-main semantic replay, and which are identity-local authoring only.

Hard constraints:
- do not copy/replay the 50-skill M50-02 batch wholesale;
- do not add Scathach authoring or migration credit in this decomposition task;
- do not change production runtime unless a later B task is explicitly dispatched for a proven missing generic capability;
- do not treat Astolfo/FB2-49 whole-opponent-close semantics as proof of the distinct single-opponent-close contract;
- preserve current-main formal/material accounting at `112/944` throughout decomposition;
- no character/card canonical-ID routing, printed-text/Chinese-text runtime routing, SkillLib fallback, merge, or retarget.

Required output: one current-main A decomposition/dispatch report that names each Scathach S2 ability, its exact historical source evidence, current-main capability status, required focused/adversarial tests, and the smallest next B/S task(s). If a generic runtime prerequisite is missing, dispatch that zero-credit B replay first; only after all required capabilities are accepted/synchronized may A dispatch the one-card S migration.

Allowed final status:
- `DECOMPOSITION_COMPLETE`
- `DECOMPOSITION_BLOCKED`
## TASK P3-B-MAIN-REPLAY-FB2-32-SOURCE-STATE-CONDITIONS

Owner: Codex B2
Status: `READY`
Base: exact `P3-A-MAIN-REPLAY-SCATHACH-S2-CONTRACT-DECOMPOSITION` commit carrying this task block
Historical accepted capability: FB2-32 source-state condition seam
Historical accepted Candidate: `ae80ed7fb759a35964bcf5d9f581dc4e52d49d49`
Historical reviewer evidence commit: `f1da3b4d0976cd80dbe4a3569bb9a216cf7dc441`
Historical acceptance report: `docs/reports/2026-09-19-p3-a-r71-fb2-32-acceptance-synchronization.md`
Initial rejected Candidate: `c89eac0357b2427aa9682a95f644f3e1442281bc` / PR #376 comment `https://github.com/binchen648/fd/pull/376#issuecomment-5742601244`

Goal: replay the exact accepted identity-free FB2-32 condition capability onto current main: exact type-only `{type:"source_active"}` and `{type:"source_owned"}` condition nodes over authoritative physical source/current controller state. Preserve the accepted revision fixes: condition-only route admission, malformed/widened shapes rejected, and nonphysical/missing source contexts fail closed without raw runtime exceptions. Do not broaden activation/effect/target/interaction/lifecycle/modifier vocabulary.

Authorized scope: only the minimum current-main loader/interpreter helpers required for the two source-state conditions, one focused FB2-32 replay test, and one B result report. Reuse existing current-main physical card/source-state helpers where compatible. No consumer authoring, Scathach material, M50 runtime, generated products, packs, client production, governance edits, character/card identity routing, printed-text/Chinese runtime parsing, or SkillLib fallback.

Accounting: zero migration credit. Formal/material remains `112/944`, remaining `832` throughout B/R/A capability synchronization.

Required validation: focused source-active/source-owned positives; wrong owner/inactive/dead/missing/nonphysical source negatives; condition-as-effect/target/etc rejection; widened-shape rejection; typecheck; affected rules regressions; full CI; content validate; generated determinism; `git diff --check`; frozen rescan proving no authoring delta and `112/944` unchanged.

Allowed final status:
- `IMPLEMENTATION_COMPLETE_CANDIDATE`
- `IMPLEMENTATION_BLOCKED`


## TASK P3-A-MAIN-REPLAY-FB2-32-ACCEPTANCE-SYNCHRONIZATION

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-main-replay-fb2-32-acceptance-sync`
Implementation Base: `63666879bc004c724d7ceef0b43d8a9bbd910fdf`
Accepted Candidate: `ac9ed4ac5b696402e9621992a9a4a9bfaba5ed04`
Canonical fresh-R evidence: `https://github.com/binchen648/fd/pull/447#issuecomment-5836400011`
Read: `docs/reports/2026-09-26-p3-a-main-replay-fb2-32-acceptance-synchronization.md`

Result: fresh independent R returned `IMPLEMENTATION_ACCEPTED_CANDIDATE` for the exact current-main FB2-32 R3 Candidate. A synchronizes only the identity-free source-state condition capability: exact type-only `source_active` / `source_owned` beneath top-level `ability.conditions`, with widened shapes rejected, non-condition runtime carriers rejected, and missing/nonphysical source contexts failing closed. The accepted R3 closes both prior loader-boundary findings for choice `target.conditions` and `ruleModifiers[].conditions`.

Current-main formal/material accounting remains `112/944`, with `832` remaining. FB2-32 is zero-credit infrastructure and adds/removes no frozen identity. PR #447 remains unmerged and unretargeted.

## TASK P3-B-MAIN-REPLAY-FB2-33-COMBAT-OUTCOME-CONDITIONS

Owner: Codex B2
Status: `READY`
Base: exact `P3-A-MAIN-REPLAY-FB2-32-ACCEPTANCE-SYNCHRONIZATION` commit carrying this task block
Historical accepted capability: FB2-33 event-player combat-outcome condition seam
Historical accepted Candidate: `5ccef0d682ce0673926e349eda1732419fc0792c`
Canonical historical reviewer evidence: `https://github.com/binchen648/fd/pull/377#issuecomment-5743426456`
Historical dispatch: `docs/reports/2026-09-19-p3-a-fb2-33-event-combat-outcome-dispatch.md`
Historical result: `docs/reports/2026-09-19-p3-fb2-33-event-combat-outcome-result.md`
Scathach decomposition source: `docs/reports/2026-09-25-p3-a-main-replay-scathach-s2-contract-decomposition.md`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

Goal: replay the exact accepted identity-free FB2-33 capability onto current main: exact type-only `event_player_won_combat` and `event_player_lost_combat` conditions evaluated only from trusted `AbilityEvent.playerId` plus trusted `battleResult`. Preserve accepted fail-closed semantics for missing/unknown actor, missing/malformed outcome, unknown ids, duplicate ids, and winner/loser contradiction. No event producer, trigger, effect, target, interaction, lifecycle, modifier, consumer identity, or authoring migration is authorized.

Authorized scope: only the minimum current-main loader/interpreter helpers required for these two conditions, one focused FB2-33 replay test, and one B result report. Reuse existing trusted event/battle-result structures. No Scathach authoring, M50 primitives, generated products, packs, client production, governance edits, character/card identity routing, printed-text/Chinese runtime parsing, SkillLib fallback, merge, or retarget.

Required validation: exact-shape loader acceptance under top-level ability conditions; rejection/disable under effects/targets/modifier conditions and other non-condition runtime carriers; payload-bearing near-match rejection; winner/loss positives and opposites; missing/unknown/malformed/duplicate/contradictory event context fail false; evaluation read-only/no emitted event; unsupported trigger remains unsupported; typecheck; affected focused regressions; `git diff --check`; frozen/material rescan proving no authoring delta and `112/944` unchanged. Full CI/content/generated gates only if current exact task/repo contract requires them for this zero-credit replay.

Accounting: zero migration credit. Formal/material remains `112/944`, remaining `832` throughout B/R/A capability synchronization.

Allowed final status:
- `IMPLEMENTATION_COMPLETE_CANDIDATE`
- `IMPLEMENTATION_BLOCKED`

## TASK P3-A-MAIN-REPLAY-FB2-33-ACCEPTANCE-SYNCHRONIZATION

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-main-replay-fb2-33-acceptance-sync`
Implementation Base: `471392953e58ab60726cf3a6746481a04ce072ad`
Accepted Candidate: `f0d753f49f0b7541d14ca9a5446644cbdc751199`
Canonical fresh-R evidence: `https://github.com/binchen648/fd/pull/448#issuecomment-5836766768`
Read: `docs/reports/2026-09-26-p3-a-main-replay-fb2-33-acceptance-synchronization.md`

Result: fresh independent R returned `IMPLEMENTATION_ACCEPTED_CANDIDATE` for the exact current-main FB2-33 replay Candidate. A synchronizes only the identity-free exact type-only `event_player_won_combat` / `event_player_lost_combat` condition capability over trusted `AbilityEvent.playerId` and trusted `battleResult`, with malformed/unknown/duplicate/contradictory outcome state failing closed and all non-condition carriers remaining unsupported.

Current-main formal/material accounting remains `112/944`, with `832` remaining. FB2-33 is zero-credit infrastructure and adds/removes no frozen identity. PR #448 remains unmerged and unretargeted.

## TASK P3-B-MAIN-REPLAY-M50-01-TARGET-COUNT-VP-PER-TARGET

Owner: Codex B2
Status: `READY`
Base: exact `P3-A-MAIN-REPLAY-FB2-33-ACCEPTANCE-SYNCHRONIZATION` commit carrying this task block
Historical accepted source: PR #440 exact Base `b4589eebbd09409458cf7b49d7fb7d9af6469f07` -> accepted successor `f0e5554e3210e721ae98faa29fc5241b410c5b72`
Historical reviewer evidence: `https://github.com/binchen648/fd/pull/440#issuecomment-5805914781`
Historical rejected predecessor: `12efa4d292a04a5b592b965b44dde67d1ad6b9da`
Scathach decomposition source: `docs/reports/2026-09-25-p3-a-main-replay-scathach-s2-contract-decomposition.md`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

Goal: replay only the two identity-free generic primitives required by Scathach S2: `target_count_equals` and `gain_victory_points_per_target`. Preserve historical accepted structural semantics and fail-closed validation, but do not transplant the M50-01 50-skill batch or any unrelated M50 vocabulary/runtime.

Authorized semantics:
- `target_count_equals`: compare an exact nonnegative safe-integer `count` against the authoritative number of players selected by the declared structural count target;
- `gain_victory_points_per_target`: compute `amountPerTarget * authoritative counted target count`, then grant that exact safe-integer amount to each authoritative recipient; invalid amount/overflow/no authoritative recipient fail closed;
- for the Scathach-required seam, `same_battlefield_opponents` is the required count scope and remains structural/identity-free.

Authorized scope: only the minimum current-main loader/interpreter helper(s) for these two primitives, focused tests for both positive and adversarial semantics, and one B result report. Reuse existing current-main player/location/battlefield and authoritative VP mutation helpers.

Forbidden: no M50-01 authoring archives, no Scathach consumer authoring, no 50-card batch import, no unrelated structured target/formula/choice vocabulary, no new trigger/event producer, no generated products/packs/client production/governance edits, no identity/name/printed-text/Chinese runtime routing, no SkillLib fallback, no merge/retarget.

Required validation: exact supported shapes and malformed/widened rejection; same-battlefield-opponent count positives/zero/multi-target; non-battlefield/controller and stale/missing target context fail closed; per-target VP gain positive, zero-count, malformed amount, overflow/no-recipient negatives; read-only condition evaluation and authoritative VP event behavior; non-authorized routes remain unsupported; typecheck; affected focused regressions; `git diff --check`; Base-to-Candidate `data/authoring/**` delta empty and accounting unchanged at `112/944`.

Accounting: zero migration credit. Formal/material remains `112/944`, remaining `832` throughout B/R/A capability synchronization.

Allowed final status:
- `IMPLEMENTATION_COMPLETE_CANDIDATE`
- `IMPLEMENTATION_BLOCKED`

## TASK P3-A-MAIN-REPLAY-M50-01-PRIMITIVES-ACCEPTANCE-SYNCHRONIZATION

Owner: Codex A
Status: `SYNCHRONIZED`
Branch: `codex/a-p3-main-replay-m50-01-primitives-acceptance-sync`
Implementation Base: `ba958e78fcd6ce7a4276889aaac75d689a767409`
Accepted Candidate: `9a2a273d67b59872f4589d2ec10cbf32b2e1cef5`
Canonical fresh-R evidence: `https://github.com/binchen648/fd/pull/449#issuecomment-5837438369`
Read: `docs/reports/2026-09-26-p3-a-main-replay-m50-01-primitives-acceptance-synchronization.md`

Result: fresh independent R returned `IMPLEMENTATION_ACCEPTED_CANDIDATE` for the exact revised current-main M50-01 primitive Candidate. A synchronizes only the identity-free `target_count_equals` and `gain_victory_points_per_target` seam required by Scathach S2. The accepted successor closes the authoritative VP-path and direct/top-level loader-boundary findings by delegating VP gain through current-main resolution-dataflow `adjust_victory_points` and rejecting nested logical/non-direct placements.

Current-main formal/material accounting remains `112/944`, with `832` remaining. This capability replay is zero-credit and adds/removes no frozen identity. PR #449 remains unmerged and unretargeted.

## TASK P3-B-MAIN-REPLAY-M50-02-OPPONENT-CLOSE-ONE-NON-RESIDUAL

Owner: Codex B2
Status: `READY`
Base: exact `P3-A-MAIN-REPLAY-M50-01-PRIMITIVES-ACCEPTANCE-SYNCHRONIZATION` commit carrying this task block
Historical accepted source: PR #441 exact Candidate `fc6d2f52f2d2cebbedc60e9e5d106744b347c8ff`
Canonical historical reviewer evidence: `https://github.com/binchen648/fd/pull/441#issuecomment-5825842148`
Scathach decomposition source: `docs/reports/2026-09-25-p3-a-main-replay-scathach-s2-contract-decomposition.md`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

Goal: replay only the identity-free M50-02 generic `opponent_close_one_non_residual` contract required by Scathach S2. Preserve the historical exact single-opponent interaction semantics and adversarial fail-closed behavior. This contract is distinct from current-main FB2-49 `opponent_close_non_residual_to_one`: FB2-49 closes multiple non-residual attacks until one remains, while this task lets the unique same-battlefield opponent choose exactly one of their own eligible non-residual attacks to close.

Authorized scope: minimum current-main loader/interpreter/interaction helpers required for this one primitive, focused tests for exact positive/negative interaction semantics, and one B result report. Reuse current-main close-forbid/card-source/interaction persistence seams where applicable. No M50-02 50-card batch import, no Scathach consumer authoring, no unrelated M50 vocabulary, no generated/client/pack/governance changes, no identity/name/printed-text/Chinese runtime routing, no SkillLib fallback, no merge/retarget.

Required semantics/validation: exact supported effect shape; exactly one active same-battlefield opponent; that opponent is the decision player; candidates are only that opponent's active non-residual attacks; exactly one candidate must be selected/closed when legal; residual/protected/inactive/wrong-owner/off-battlefield/stale/tampered selections fail closed; zero legal cards does not fabricate a decision; persistence/replay/restore metadata stays bounded and rejects corruption; non-authorized routes remain unsupported; typecheck; affected focused regressions; `git diff --check`; Base-to-Candidate `data/authoring/**` delta empty and accounting unchanged at `112/944`.

Accounting: zero migration credit. Formal/material remains `112/944`, remaining `832` throughout B/R/A capability synchronization.

Allowed final status:
- `IMPLEMENTATION_COMPLETE_CANDIDATE`
- `IMPLEMENTATION_BLOCKED`

## TASK P3-A-MAIN-REPLAY-M50-02-ACCEPTANCE-SYNCHRONIZATION

Owner: Codex A
Status: `SYNCHRONIZED`
Accepted Candidate: `8e3570d753a42683d3d69751a51900f5daeaefee`
Canonical fresh-R evidence: `https://github.com/binchen648/fd/pull/450#issuecomment-5838514469`
Read: `docs/reports/2026-09-26-p3-a-main-replay-m50-02-acceptance-synchronization.md`

Result: fresh independent R returned `IMPLEMENTATION_ACCEPTED_CANDIDATE` for the exact revised current-main M50-02 Candidate. A synchronizes only the identity-free `opponent_close_one_non_residual` selected-one interaction. The accepted successor closes the prior answer-time source-zone stale-state finding by revalidating the physical source through canonical current-main `isActiveCardSource(state, sourceId)` before consuming the pending opponent choice.

Accounting remains zero-credit at `112/944`, remaining `832`. No authoring identity is added or removed by this capability synchronization. PR #450 remains unmerged and unretargeted.

Latest user ruling supersedes the historical 10-40 / one-card dispatch cadence for subsequent F4 work: every non-tail F4 migration batch must freeze exactly 50 identities. A single compatible capability family smaller than 50 must be combined with other mechanically isolated, dependency-complete subgroups until exact membership is 50. Do not dispatch a 1/2/5/10/20-card non-tail batch.

Next action: A must mechanically derive and freeze the next exact-50 current-main F4 batch membership from accepted/synchronized capabilities and source-grounded identities. This synchronization does not itself authorize blindly copying either historical M50 50-card authoring batch; each selected identity still requires exact source/dependency proof on the current-main lineage.

Allowed next A status:
- `EXACT_50_BATCH_READY`
- `EXACT_50_BATCH_BLOCKED`
## TASK P3-A-F4-EXACT-50-COMPOSITION-01

Owner: Codex A
Status: `EXACT_50_BATCH_BLOCKED`
Base: `bf1e3ed5ece561b7ac2b9a49064783bbead9f85f`
Read: `docs/reports/2026-09-26-p3-a-f4-exact-50-composition-01.md`

Mechanical scan at the accepted M50-02 production tree proves frozen denominator `944`, current materialized overlap `112`, absent `832`, duplicate frozen IDs `0`. Historical accepted PR #441 materialized `265`; its old-frontier-minus-current replay pool is `153` identities.

Each of those 153 historical identities was re-run individually through the current-main `loadAuthoringJson` boundary. Only `14` currently load with zero adapter report and all abilities `execution.mode=automatic`; `139` still hit explicit unsupported runtime/loader gaps. Therefore an exact-50 S batch is not yet dependency-complete and must not be dispatched. At least `36` additional identities must be unlocked by zero-credit B capability work before exact-50 membership can be frozen.

Immediate current-loader-ready historical identities are recorded in the planning report. The next capability chosen by mechanical gap clustering is the narrow scalar controller `set_player_flag` effect: it appears in the gap pool 19 times and has five immediate consumers whose only current loader gap is this effect/key family.

Next task: `P3-B-MAIN-REPLAY-SET-PLAYER-FLAG-SCALAR-CONTROLLER`.

Hard boundary for B:
- identity-free zero-credit runtime only;
- accept only a direct ability effect with exact shape `{type:"set_player_flag", target:"controller", key:<nonempty string>, value:<boolean|string|finite number>}`;
- no missing-value default, no current-round AST/lifecycle, no arbitrary player targets, no clear/add-number/flag conditions, no broad M50 flag subsystem;
- persist only the scalar flag map in AbilityRuntime with bounded MatchSession restore/reference validation;
- add focused runtime/loader/persistence/near-match tests;
- affected focused tests + typecheck + `git diff --check`;
- no `data/authoring/**`, no migration credit, no merge/retarget.

Allowed B verdicts:
- `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`
- `MIGRATION_BLOCKED`
## P3-A-MAIN-REPLAY-SET-PLAYER-FLAG-SCALAR-CONTROLLER-ACCEPTANCE-SYNC

- Exact accepted B Candidate: `a0f58e40bb82dd33740e9aec395e884cc40b2ab2` (PR #452).
- Canonical fresh-R evidence: `https://github.com/binchen648/fd/pull/452#issuecomment-5838947759`.
- Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`; relay is the same already-completed review attempt after reviewer GitHub write 403.
- Capability remains zero-credit: formal/material `112/944`, remaining `832`.
- Accepted scope is only direct controller `set_player_flag` with explicit scalar boolean/string/finite-number value plus bounded runtime/restore state.
- No consumer authoring, merge, retarget, broad player-flag conditions, current-round lifecycle, clear/add-number mutation, or other M50 subsystem is accepted by this synchronization.
- Exact-50 readiness rescan on the accepted runtime is `22 ready / 131 blocked` within the historical 153-identity replay pool. Readiness is not migration credit and is not itself S eligibility.
- Non-tail F4 remains `EXACT_50_BATCH_BLOCKED`: fewer than 50 identities are currently loader-ready before provenance/semantic recertification.
- Next formal task: `P3-B-MAIN-REPLAY-M50-PLAYER-FLAG-ROUND-STATE-CORE-R2`, replaying only the bounded player-flag condition/current-round/clear/add-number delta not already accepted by #452; historical #440/#441 material may be used as semantic provenance, while PR #451 is implementation reference only and not formal lineage.

## P3-A-MAIN-REPLAY-M50-PLAYER-FLAG-ROUND-STATE-CORE-R2-ACCEPTANCE-SYNC

- Exact accepted B Candidate: `31bf148c173d04fd0332ad3d8e0442fbcb85984a` (PR #453).
- Canonical fresh-R evidence: `https://github.com/binchen648/fd/pull/453#issuecomment-5839633506`.
- Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`; relay is the same already-completed review attempt after reviewer GitHub write 403.
- R1 predecessor-test blocker is closed; predecessor #452 regression is now `7/7 PASS`, R2 focused `6/6 PASS`, combined affected chain `11 files / 157 tests PASS`.
- Capability remains zero-credit: formal/material `112/944`, remaining `832`; `data/authoring/**` remains unchanged.
- Accepted scope is the bounded player-flag condition/current-round/clear/add-number delta beyond #452, with locally bounded `key`/`lifecycle`/`offset`, finite scalar compatibility, safe-integer arithmetic/round semantics, and bounded MatchSession restore.
- No consumer authoring, migration credit, merge, retarget, arbitrary target widening, identity/name/printed-text/Chinese routing, or SkillLib fallback is accepted by this synchronization.
- Non-tail F4 exact-50 remains blocked pending a fresh readiness/provenance rescan on this accepted runtime. A must continue zero-credit capability work until exactly 50 identities are mechanically dependency-complete; do not shrink to a smaller S batch.

## P3-A-MAIN-REPLAY-FB2-31-EVENT-PLAYER-RELATION-ACCEPTANCE-SYNC

- Exact accepted B Candidate: `5d120f6a667ba1809e4c63a60018da781780ebda` (PR #454).
- Canonical fresh-R evidence: `https://github.com/binchen648/fd/pull/454#issuecomment-5839932242`.
- Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`; the comment is the Coordinator bounded relay of the same already-completed fresh review attempt after reviewer GitHub write 403.
- Accepted capability is only exact type-only direct ability conditions `event_player_is_controller` / `event_player_is_opponent` over trusted `AbilityEvent.playerId`; missing/unknown actor fails closed, evaluation is read-only, and no trigger/carrier widening is accepted.
- Base-to-Candidate `data/authoring/**` is empty. Capability remains zero-credit: formal/material `112/944`, remaining `832`.
- Exact-50 readiness remains blocked; acceptance of this condition seam alone does not make a consumer migration-ready.
- Next formal task: `P3-B-MAIN-REPLAY-FB2-43-EVENT-LOCATION-EQUALS-CONTROLLER`, replaying only the historically accepted exact type-only location relation condition from PR #396 / accepted Candidate `19ff09ed65e34f241d332250e1cc1370071ecf75` and canonical evidence `https://github.com/binchen648/fd/pull/396#issuecomment-5748914327`.
- No merge, retarget, consumer authoring, or migration credit is authorized by this synchronization.
## P3-A-MAIN-REPLAY-FB2-43-EVENT-LOCATION-EQUALS-CONTROLLER-ACCEPTANCE-SYNC

- Exact accepted B Candidate: `6c18b429172ac671f918e4ae2c9291f347d3ee6b` (PR #455).
- Canonical fresh-R evidence: `https://github.com/binchen648/fd/pull/455#issuecomment-5842632031`.
- Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`; this comment is the Coordinator bounded relay of the same already-completed blocked-retry fresh review attempt after reviewer GitHub write 403.
- Accepted capability is only exact type-only direct `ability.conditions[i]` node `event_location_equals_controller` over authoritative `after_controller_enters_location`; nonempty event/controller locations are required, equality is exact, and wrong/missing/stale context fails closed.
- Player relation remains a separate accepted condition seam. The sole opponent-event opt-in remains `after_controller_enters_location` plus exact direct `event_player_is_opponent`; unrelated `after_controller_*` triggers are not widened.
- Base-to-Candidate `data/authoring/**` is empty. Capability remains zero-credit: formal/material `112/944`, remaining `832`.
- Exact Candidate readiness evidence changes the strict historical replay-pool loader-ready count `17 -> 18`, newly adding `servant.siegfried.skill.sc-siegfried-2`. Readiness is planning evidence only and grants no migration credit.
- Non-tail F4 remains `EXACT_50_BATCH_BLOCKED`: fewer than 50 identities are mechanically dependency-complete under the current exact line.
- Next formal task: `P3-A-F4-EXACT-50-COMPOSITION-02`, a fresh mechanical rescan of the same 153 historical old-frontier-minus-current identities against this exact synchronized runtime before choosing the next zero-credit capability seam.
- No merge, retarget, consumer authoring, or migration credit is authorized by this synchronization.

## TASK P3-A-F4-EXACT-50-COMPOSITION-02

Owner: Codex A
Status: `EXACT_50_BATCH_BLOCKED`
Base: exact `P3-A-MAIN-REPLAY-FB2-43-EVENT-LOCATION-EQUALS-CONTROLLER-ACCEPTANCE-SYNC` commit carrying this task block
Read: `docs/reports/2026-09-26-p3-a-f4-exact-50-composition-02.md`

Goal: mechanically recompute the next exact-50 F4 composition state after accepted/synchronized PR #455. Re-run the same historical accepted PR #441 old-frontier-minus-current replay pool (`153` identities) individually through the current exact `loadAuthoringJson` boundary, then classify the exact loader-ready set, blocked set, recurring unsupported mechanic/type clusters, and source/provenance closure required for final S membership.

Hard requirements:
- frozen denominator remains `944 = 943 static + 1 dynamic`;
- current formal/material remains `112/944` during this A planning task;
- use the exact synchronized runtime lineage only; historical #440/#441/frontier material is source/planning evidence, not current acceptance lineage;
- no runtime production edits and no `data/authoring/**` edits;
- readiness requires empty adapter report and every ability `execution.mode=automatic`, then separate source/provenance and semantic dependency proof before final S freeze;
- non-tail S may be dispatched only when exactly `50` unique frozen identities are dependency-complete; if fewer than 50 are ready, return `EXACT_50_BATCH_BLOCKED` and name the next narrow zero-credit capability seam with exact historical authority/evidence;
- do not shrink to 1/2/5/10/20-card formal migration batches;
- no merge, retarget, or migration credit.

Allowed final status:
- `EXACT_50_BATCH_READY`
- `EXACT_50_BATCH_BLOCKED`
### Composition-02 result 閳?2026-09-26

Mechanical exact-line rescan completed on accepted/synchronized PR #455 runtime. Historical accepted PR #441 authoring contains `288` frozen material identities; current exact line contains `135`; old-frontier-minus-current replay pool remains exactly `153`. Each replay identity was reduced to a one-card archive and re-run through current `loadAuthoringJson`; readiness requires an empty adapter report and every ability `execution.mode=automatic`.

Result: `24 ready / 129 blocked`. This is the same 153-card loader-readiness measure used by Composition-01 and the post-#452 A synchronization. It is intentionally different from PR #455's stricter reconciliation/evidence subset metric (`17 -> 18`), so those numbers must not be conflated.

Current loader-ready replay identities:

1. `master.ciel.skill.s1`
2. `master.ciel.skill.s1a`
3. `master.darnic.skill.s1a`
4. `master.fiore.skill.s1`
5. `master.iliya.skill.s1`
6. `master.leonardo.skill.s1a`
7. `master.ophelia.skill.s1a`
8. `master.peperoncino.skill.s1`
9. `master.shiki-ryougi.skill.s1a`
10. `master.shirou-emiya.skill.s1`
11. `master.shirou-emiya.skill.s2`
12. `master.shirou-emiya.skill.s3`
13. `master.taiga.skill.s1`
14. `master.zouken.skill.s1`
15. `servant.darius.skill.sc-darius-1`
16. `servant.darius.skill.sc-darius-2`
17. `servant.donquixote.skill.sc-donquixote-2`
18. `servant.gilles.skill.sc-gilles-2`
19. `servant.lance.skill.sc-lance-2`
20. `servant.medea.skill.sc-medea-2`
21. `servant.mhx.skill.sc-mhx-3`
22. `servant.muramasa.skill.sc-muramasa-1`
23. `servant.siegfried.skill.sc-siegfried-2`
24. `servant.sigurd.skill.sc-sigurd-3`

Exact-50 remains blocked: at least `26` additional dependency-complete identities are still required before a non-tail S batch may freeze. Readiness alone is not S eligibility; final members still require source/provenance and semantic dependency closure.

Fresh blocker clustering finds three historical identities with one common current blocker only: `servant.mash.skill.sc-mash-4`, `servant.sherlock.skill.sc-sherlock-4`, and `servant.sherlock.skill.sc-sherlock-5` are blocked only because current FB2-18 outside-game placement accepts an owned `master_skill` but not an owner-matching `servant_skill`. Historical accepted PR #441 Candidate `fc6d2f52f2d2cebbedc60e9e5d106744b347c8ff` independently accepted the identity-free extension and its owner-mismatch fail-closed regression; canonical same-attempt evidence is `https://github.com/binchen648/fd/pull/441#issuecomment-5825842148`.

Next zero-credit B task: `P3-B-MAIN-REPLAY-OUTSIDE-GAME-OWNED-SERVANT-SKILL`.

## TASK P3-B-MAIN-REPLAY-OUTSIDE-GAME-OWNED-SERVANT-SKILL

Owner: Codex B
Status: `READY`
Base: exact Composition-02 A commit carrying this task block
Historical accepted authority: PR #441 Candidate `fc6d2f52f2d2cebbedc60e9e5d106744b347c8ff`
Canonical historical evidence: `https://github.com/binchen648/fd/pull/441#issuecomment-5825842148`
Branch: `codex/b-p3-main-replay-outside-game-owned-servant-skill`

Replay only the narrow identity-free outside-game representation extension that PR #441 added on top of accepted FB2-18:

- retain exact `initialPlacement: "outside_game"` literal;
- retain the existing exact owned `master_skill` behavior unchanged;
- additionally admit only `cardType: "servant_skill"` when archive id starts `servant.`, authored owner is exactly `{type:"servant", id:<same archive id>}`, and ownership matches the archive root;
- preserve the card in the compiled pack but assign no executable `initialZone`;
- owner mismatch, non-servant archive, unsupported card type, malformed placement, and near-match forms fail closed;
- loader and executable compiler must enforce the same bounded contract;
- no Sherlock/Mash/card-id/name/printed-text routing, no deduction-record consumer behavior, no product registration, no `data/authoring/**`, no migration credit;
- do not import unrelated M50-02 primitives from PR #441.

Required verification:
- focused FB2-18 outside-game regression, including owner-matching servant positive case and owner-mismatch/card-type near negatives;
- executable-pack affected tests;
- affected current loader/compiler tests;
- typecheck and `git diff --check`;
- production identity-routing audit and exact scope;
- verify fixed Work is clean and exact-line compatible before any implementation. If it is dirty/incompatible, stop and report; do not reset/checkout/discard and do not create a fallback worktree.

Expected planning effect after ACCEPTED + A-sync: the same 153-card loader scan should gain the three identified historical identities if no other exact blocker appears. This is readiness evidence only and remains zero-credit.

Allowed B verdicts:
- `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`
- `MIGRATION_BLOCKED`

## P3-A-MAIN-REPLAY-OUTSIDE-GAME-OWNED-SERVANT-SKILL-ACCEPTANCE-SYNC

- Exact accepted successor Candidate: `83cac6ef2a1334b823e37c873d0a1a2c8e819cb9` (PR #456), direct revision parent `10a22583f5e911ae4f812e82417b866006d6eaab`, formal Base `3b2d78ae931a0ded23f98ec1e513768dea9c78de`.
- Canonical fresh-R evidence: `https://github.com/binchen648/fd/pull/456#issuecomment-5844312272`.
- Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`.
- Accepted capability: exact two-key owner-matching `servant_skill` may preserve exact `initialPlacement: "outside_game"`; extra/malformed/mismatched owner shapes fail closed; existing owned-master behavior is unchanged.
- Base-to-Candidate `data/authoring/**` is empty. This remains zero-credit: formal/material `112/944`, remaining `832`.
- Post-acceptance mechanical replay of the same `153` historical-diff identities is `27 ready / 126 blocked`; newly ready are exactly `servant.mash.skill.sc-mash-4`, `servant.sherlock.skill.sc-sherlock-4`, and `servant.sherlock.skill.sc-sherlock-5`.

### Workflow supersession: owner-complete F4

User's latest ruling supersedes the earlier fixed-50 cadence for future formal consumer migrations. From this synchronization forward:

- formal F4 unit = one character/owner and **all of that owner's remaining frozen skills**;
- owner batch size is whatever that owner actually has remaining; there is no fixed `50` requirement;
- one owner-complete Base/Candidate -> one PR -> one fresh independent R -> one A-sync/accounting transaction;
- only after the current owner is accepted and synchronized/accounted does execution move to the next owner;
- bounded capability/readiness PRs may still be used to unblock the current owner, remain zero-credit, and return to the same owner after acceptance;
- historical `EXACT_50_*` sections are retained as history/evidence but their fixed-50 future-dispatch requirement is superseded by this latest user ruling.

## TASK P3-S-OWNER-MASH-COMPLETE-MIGRATION

Owner: Codex S
Status: `READY`
Base: exact acceptance-sync commit carrying this task block
Owner root: `servant.mash`
Formal owner scope: all four remaining frozen skills

Frozen skills:
- `servant.mash.skill.sc-mash-1`
- `servant.mash.skill.sc-mash-2`
- `servant.mash.skill.sc-mash-3`
- `servant.mash.skill.sc-mash-4`

Source/provenance:
- frozen inventory marks all four `FULL`, `hasConfirmedOverride=true`, `hasAuthoringCard=false`;
- locked confirmed overrides are source-grounded by the frozen inventory;
- shared source refs: CHM `娴犲氦鈧?閻╂儳鍙?閼昏鲸鏋冮悧?閻滄稐鎱ㄨ矾閸╁搫鍨懢杈╁.htm` plus the development-image source;
- `sc-mash-4` additionally has accepted outside-game capability authority from PR #456 / Candidate `83cac6ef2a1334b823e37c873d0a1a2c8e819cb9`.

Implementation requirements:
- migrate all four Mash frozen skills in this owner batch; do not finish only a subset and move to another owner;
- preserve source semantics of the FULL confirmed overrides while mapping them to current clean-line generic authoring/runtime capabilities;
- no `servant.mash` / card-name / printed-text / Chinese-text identity routing in production runtime;
- no SkillLib fallback and no runtime parsing of source text;
- `sc-mash-4` remains exact owner-matching `outside_game`, no executable `initialZone`;
- handler-style historical overrides for `sc-mash-1/2/3` are evidence, not authorization to reintroduce identity-keyed handler routing; any new runtime primitive must be generic, data-driven, fail closed, and covered by focused tests;
- owner batch should include all necessary authoring for these four skills plus only the generic runtime primitives required by their semantics;
- no merge, retarget, reset/discard, force push, or worktree proliferation.

Verification:
- exact frozen owner scope = all 4 Mash skills and no omitted remaining Mash skill;
- focused semantic tests for all four skills, including negative/fail-closed paths for any new generic capability;
- affected loader/interpreter/executable/combat/session tests required by the actual diff;
- typecheck + `git diff --check`;
- production identity-routing audit (`servant.mash`, names, printed text, Chinese routing, SkillLib fallback) must be clean;
- exact Base/Candidate lineage, clean fixed Work, and formal credit evidence must be frozen before fresh R.

Allowed verdicts:
- `MIGRATION_ACCEPTED`
- `MIGRATION_NEEDS_REVISION`
- `MIGRATION_BLOCKED`

## P3-A-OWNER-MASH-ACCEPTANCE-SYNC

- PR #457 exact Candidate `f52f458a192f363ffa0e6430e6639abc657e91e8` received `MIGRATION_ACCEPTED` from fresh independent R.
- Canonical same-attempt Coordinator relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/457#issuecomment-5845523544`.
- Accepted formal owner scope is exactly all four remaining Mash frozen identities: `servant.mash.skill.sc-mash-1` through `servant.mash.skill.sc-mash-4`.
- `card.x-guard` and shared runtime/content capability surfaces remain zero-credit support.
- Current-main strict formal accounting moves `112/944 -> 116/944`; remaining `828`.
- Historical frontier formal/material (`219/944` / `265/944`) remains separate accepted evidence/replay history; current-main accounting does not erase it.
- Owner-complete workflow remains authoritative: no fixed-50 requirement, no per-skill R split; only after an owner is ACCEPTED + A-synced/accounted may execution move to the next owner.
- Detailed sync: `docs/reports/2026-09-26-p3-a-owner-mash-acceptance-synchronization.md`.

## TASK P3-S-OWNER-SHERLOCK-COMPLETE-MIGRATION

Owner: Codex S
Status: `READY`
Base: exact Mash acceptance-sync commit carrying this task block
Owner root: `servant.sherlock`
Formal owner scope: all seven remaining frozen Sherlock skills

Frozen skills:
- `servant.sherlock.skill.sc-sherlock-1` 閳?鏉╂瑦妲哥敮姝岀槕閿涘本鍨滄禍鑼煃閻ㄥ嫭婀呴崣瀣櫓
- `servant.sherlock.skill.sc-sherlock-2` 閳?缁屽搫鐪块崢鍡涙珦
- `servant.sherlock.skill.sc-sherlock-3` 閳?闁棙甯瑰▔?- `servant.sherlock.skill.sc-sherlock-4` 閳?闁棙甯瑰▔鏇窗閸旀盯鍣?
- `servant.sherlock.skill.sc-sherlock-5` 閳?闁棙甯瑰▔鏇窗鏉╁懏宓?
- `servant.sherlock.skill.sc-sherlock-6` 閳?闁棙甯瑰▔鏇窗姒勬梹婀?
- `servant.sherlock.skill.sc-sherlock-7` 閳?闁棙甯瑰▔鏇窗閻楄鐣?

Source/provenance:
- frozen inventory mechanically reports all seven with `hasConfirmedOverride=true`, `hasAuthoringCard=false`;
- all seven share source grounding in `FD閸忋劌宕遍崶楣冨V2.0.chm`, locator `娴犲氦鈧?鐟佷礁鐣鹃懓?閼昏鲸鏋冮悧?婢跺繑绀囬崗瀣勯顩寸亸鏃€鎳囬弬?htm`, plus the development image source;
- historical specific-handler evidence exists for `sc-sherlock-1/2/3`; `sc-sherlock-4/5/6/7` are historical shared rule-marker identities;
- old-frontier accepted material plus current accepted PR #456 outside-game capability may be used as evidence for exact outside-game representation where applicable, but not as current formal acceptance of Sherlock consumers.

Implementation requirements:
- migrate all seven Sherlock frozen skills in one owner-complete formal batch; do not finish a subset and move owners;
- recertify source semantics mechanically from frozen inventory/contracts and historical accepted evidence before encoding each consumer;
- no `servant.sherlock` / card-id / card-name / printed-text / Chinese-text identity routing in production runtime;
- no SkillLib fallback and no runtime source-text parsing;
- any new runtime primitive must be generic, data-driven, fail closed, bounded to exact source semantics, and covered by focused positive/negative tests;
- reuse accepted generic capabilities when exact semantics match; do not copy historical identity-keyed handlers into current production runtime;
- no merge, retarget, reset/discard, force push, or worktree proliferation.

Verification:
- exact frozen owner scope = all 7 Sherlock skills and no omitted remaining Sherlock skill;
- focused semantic tests covering all seven consumers plus fail-closed paths for each newly introduced generic capability;
- affected loader/interpreter/executable/combat/session/content tests dictated by the actual diff;
- typecheck + `git diff --check` + production identity-routing audit;
- freeze exact Base/Candidate, clean fixed Work, PR, policy gate, and one fresh independent R for the whole owner batch.

Accounting boundary:
- Base strict formal accounting is `116/944` after Mash synchronization;
- no Sherlock credit before exact-Candidate `MIGRATION_ACCEPTED` + subsequent A-sync/accounting;
- if all seven are accepted and synchronized, the next strict accounting target is `123/944`.

Allowed verdicts:
- `MIGRATION_ACCEPTED`
- `MIGRATION_NEEDS_REVISION`
- `MIGRATION_BLOCKED`


## P3-A-OWNER-SHERLOCK-ACCEPTANCE-SYNC

- PR #458 exact successor Candidate `cf8b8cc019c014cf0c1e187b6cbd2212c6e3a030` received `MIGRATION_ACCEPTED` from fresh independent R.
- Canonical same-attempt Coordinator relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/458#issuecomment-5846254073`.
- Accepted formal owner scope is exactly all seven remaining Sherlock frozen identities: `servant.sherlock.skill.sc-sherlock-1` through `servant.sherlock.skill.sc-sherlock-7`.
- Shared generic runtime/content capability surfaces remain support only and add no extra frozen identity.
- Current-main strict formal accounting moves `116/944 -> 123/944`; remaining `821`.
- Historical frontier formal/material (`219/944` / `265/944`) remains separate accepted evidence/replay history.
- Owner-complete workflow remains authoritative: no fixed-50 requirement, no per-skill R split; only after an owner is ACCEPTED + A-synced/accounted may execution move to the next owner.
- Detailed sync: `docs/reports/2026-09-26-p3-a-owner-sherlock-acceptance-synchronization.md`.

## TASK P3-S-OWNER-SHUTEN-COMPLETE-MIGRATION

Owner: Codex S
Status: `READY`
Base: exact Sherlock acceptance-sync commit carrying this task block
Owner root: `servant.shuten`
Formal owner scope: all three remaining frozen Shuten skills

Frozen skills:
- `servant.shuten.skill.sc-shuten-1` 閳?閺€鎹愬幢娑斿顔?
- `servant.shuten.skill.sc-shuten-2` 閳?缁佺偘绌舵鍏肩槰闁?- `servant.shuten.skill.sc-shuten-3` 閳?閻ф崘濮崇紓顓濊础璺幋鎴犲煃娴?
Source/provenance:
- frozen inventory mechanically reports all three with `hasConfirmedOverride=true`, `hasAuthoringCard=false`;
- all three share CHM grounding in `FD閸忋劌宕遍崶楣冨V2.0.chm`, locator `娴犲氦鈧?閺嗘灏堕懓?閼昏鲸鏋冮悧?闁版帒鎮剁粩銉ョ摍1.htm`, plus the development image `Fate_Domination-瀵偓閸欐垹澧?images/servants/闁版帒鎮剁粩銉ョ摍.png`;
- historical specific-handler evidence is `core.shuten-debaucherous-banquet`, `core.shuten-noxious-sake`, and `core.shuten-bone-collector`; those handler names are evidence, not authorization for identity-keyed production routing.

Implementation requirements:
- migrate all three Shuten frozen skills in one owner-complete formal batch; do not finish a subset and move owners;
- recertify exact source semantics mechanically from the frozen inventory/contracts and historical accepted evidence before encoding each consumer;
- preserve the complete frozen text semantics, including timing, costs, location scope, lifecycle, additional-play requirements, once-per-game behavior, deck removal, true-name reveal, and defeat consequences where the source text requires them;
- no `servant.shuten` / card-id / card-name / printed-text / Chinese-text identity routing in production runtime;
- no SkillLib fallback and no runtime source-text parsing;
- any new runtime primitive must be generic, data-driven, fail closed, narrowly source-grounded, and covered by focused positive/negative tests;
- reuse accepted generic capabilities when exact semantics match; do not copy historical identity-keyed handlers into current production runtime;
- if a bounded zero-credit capability/readiness seam is required, complete and independently review that capability, A-sync/rescan, then return to this same Shuten owner before moving on;
- no merge, retarget, reset/discard, force push, or worktree proliferation.

Verification:
- exact frozen owner scope = all 3 Shuten skills and no omitted remaining Shuten skill;
- focused semantic tests covering all three consumers plus fail-closed paths for every newly introduced generic capability;
- affected loader/interpreter/executable/combat/session/content tests dictated by the actual diff;
- typecheck + `git diff --check` + production identity-routing audit;
- freeze exact Base/Candidate, clean fixed Work, PR, policy gate, and one fresh independent R for the whole owner batch.

Accounting boundary:
- Base strict formal accounting is `123/944` after Sherlock synchronization;
- no Shuten credit before exact-Candidate `MIGRATION_ACCEPTED` + subsequent A-sync/accounting;
- if all three are accepted and synchronized, the next strict accounting target is `126/944`.

Allowed verdicts:
- `MIGRATION_ACCEPTED`
- `MIGRATION_NEEDS_REVISION`
- `MIGRATION_BLOCKED`

## P3-A-OWNER-SHUTEN-ACCEPTANCE-SYNC

- PR #459 exact successor Candidate `da831ab2dd399de974c881bc9ea6aa4336d5b093` received `MIGRATION_ACCEPTED` from fresh independent R.
- Canonical same-attempt Coordinator relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/459#issuecomment-5847236503`.
- Accepted formal owner scope is exactly all three remaining Shuten frozen identities: `servant.shuten.skill.sc-shuten-1` through `servant.shuten.skill.sc-shuten-3`.
- Predecessor findings are closed: eliminated-owner Banquet round-end cleanup/aura lifetime, non-retroactive dynamically granted OPG with authenticated grant baseline, and fail-closed malformed coverage for every new Shuten battlefield-source primitive.
- Exact-Candidate Phase 3 Pre-Review Gate run `36249215831` succeeded.
- Current-main strict formal accounting moves `123/944 -> 126/944`; remaining `818`.
- Historical frontier formal/material (`219/944` / `265/944`) remains separate accepted evidence/replay history.
- Owner-complete workflow remains authoritative: no fixed-50 requirement, no per-skill R split; only after an owner is ACCEPTED + A-synced/accounted may execution move to the next owner.
- Detailed sync: `docs/reports/2026-09-26-p3-a-owner-shuten-acceptance-synchronization.md`.

## TASK P3-S-OWNER-SIEGFRIED-COMPLETE-MIGRATION

Owner: Codex S
Status: `READY`
Base: exact Shuten acceptance-sync commit carrying this task block
Owner root: `servant.siegfried`
Formal owner scope: all three current-main remaining frozen Siegfried skills

Frozen skills:
- `servant.siegfried.skill.sc-siegfried-1` 閳?闂呮劘闊╃悰?- `servant.siegfried.skill.sc-siegfried-2` 閳?閹爼绶虫稊瀣攨闁?- `servant.siegfried.skill.sc-siegfried-3` 閳?楠炵粯鍏傛径褍澧よ矾婢垛晠鐡熸径鍗炴浆

Source/provenance:
- frozen inventory records locked confirmed overrides for all three;
- source grounding is `FD閸忋劌宕遍崶楣冨V2.0.chm` -> `娴犲氦鈧?閸撴垵锛?閼昏鲸鏋冮悧?姒绘劖鐗告?htm` plus development-image `Fate_Domination-瀵偓閸欐垹澧?images/servants/姒绘劖鐗告?png`;
- current current-main authoring/pack line contains no executable `servant.siegfried` archive/consumer;
- historical `sc-siegfried-2` contract-mapped/loader-ready evidence is reusable evidence only and is not current-main consumer acceptance or standalone credit;
- historical handlers `core.siegfried-invisibility-cloak`, `core.structured-skill`, and `core.reveal-hand-power-bonus` are evidence only, not authorization for identity-keyed production routing.

Implementation requirements:
- migrate all three current-main remaining Siegfried frozen skills in one owner-complete formal batch; do not finish a subset and move owners;
- recertify exact source semantics mechanically from frozen inventory/contracts and historical accepted evidence before encoding each consumer;
- preserve complete frozen semantics, including sc-siegfried-1 escalating VP loss on play plus end-of-round true-name concealment and same-location opponent-ability immunity, sc-siegfried-2 true-name-release/engaged movement-triggered close lifecycle, and sc-siegfried-3 hand reveal plus capped qualifying-card power bonus;
- no `servant.siegfried` / card-id / card-name / printed-text / Chinese-text identity routing in production runtime;
- no SkillLib fallback and no runtime source-text parsing;
- any new runtime primitive must be generic, data-driven, fail closed, narrowly source-grounded, and covered by focused positive/negative tests;
- reuse accepted generic capabilities when exact semantics match; do not copy historical identity-keyed handlers into current production runtime;
- if a bounded zero-credit capability/readiness seam is required, complete and independently review that capability, A-sync/rescan, then return to this same Siegfried owner before moving on;
- no merge, retarget, reset/discard, force push, or worktree proliferation.

Verification:
- exact frozen owner scope = all 3 Siegfried skills and no omitted current-main remaining Siegfried skill;
- focused semantic tests covering all three consumers plus fail-closed paths for every newly introduced generic capability;
- affected loader/interpreter/executable/combat/session/content tests based on diff;
- typecheck + content validate/compile + generated determinism + `git diff --check`;
- production identity-routing audit clean;
- freeze exact Base/Candidate, clean fixed Work, PR, policy gate, and one fresh independent R for the whole owner batch.

Accounting boundary:
- Base strict formal accounting is `126/944` after Shuten synchronization;
- no Siegfried credit before exact-Candidate `MIGRATION_ACCEPTED` + subsequent A-sync/accounting;
- if all three are accepted and synchronized, the next strict accounting target is `129/944`.

Allowed verdicts:
- `MIGRATION_ACCEPTED`
- `MIGRATION_NEEDS_REVISION`
- `MIGRATION_BLOCKED`

## P3-A-OWNER-SIEGFRIED-ACCEPTANCE-SYNC

- PR #460 exact successor Candidate `e912ad973314cb032adb0e4eb1e0b9141cc322d9` received `MIGRATION_ACCEPTED` from fresh independent R.
- Canonical same-attempt Coordinator relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/460#issuecomment-5848118019`.
- Accepted formal owner scope is exactly all three current-main remaining Siegfried frozen identities: `servant.siegfried.skill.sc-siegfried-1` through `servant.siegfried.skill.sc-siegfried-3`.
- Final review closure includes the shared typed `reveal_servant_package`/battle-loss path respecting temporary concealment through round end.
- Exact-Candidate Phase 3 Pre-Review Gate run `36256716229` succeeded.
- Current-main strict formal accounting moves `126/944 -> 129/944`; remaining `815`.
- Historical frontier formal/material (`219/944` / `265/944`) remains separate accepted evidence/replay history.
- Owner-complete workflow remains authoritative: no fixed-50 requirement, no per-skill R split; only after an owner is ACCEPTED + A-synced/accounted may execution move to the next owner.
- Detailed sync: `docs/reports/2026-09-27-p3-a-owner-siegfried-acceptance-synchronization.md`.

## TASK P3-S-OWNER-SIGURD-COMPLETE-MIGRATION

Owner: Codex S
Status: `MIGRATION_CANDIDATE_READY_FOR_FRESH_R`
Base: `8f2c8141c33da0ac30a3468a068c9ab1715e15ce` 閳?accepted Sigurd capability A-sync; zero-credit; current owner unchanged
Owner root: `servant.sigurd`
Formal owner scope: all three current-main remaining frozen Sigurd skills

Frozen skills:
- `servant.sigurd.skill.sc-sigurd-1` 閳?閻浼冩稊瀣矤閺?- `servant.sigurd.skill.sc-sigurd-2` 閳?閸у繐濮稊瀣亯鏉?- `servant.sigurd.skill.sc-sigurd-3` 閳?闁插矁寮€鐏忔枀鐤絾閽€婵婃嫃

Source/provenance:
- frozen inventory records `hasConfirmedOverride=true`, `hasAuthoringCard=false` for all three;
- shared source grounding: `FD閸忋劌宕遍崶楣冨V2.0.chm` -> `娴犲氦鈧?閸撴垵锛?閼昏鲸鏋冮悧?Sigurd.htm`, plus development image `Fate_Domination-瀵偓閸欐垹澧?images/servants/姒绘劖鐗告ご浣哥棄.png`;
- frozen phase3 classification is `SOURCE_EVIDENCE_REQUIRED` / `EXPLICIT_BLOCK`; S must mechanically recertify the locked source semantics before encoding the consumers;
- historical handlers `core.sigurd-gram-ii`, `core.sigurd-bolverk-gram`, and `core.structured-skill` are evidence only, not authorization for identity-keyed production routing.

Frozen semantic requirements to recertify and preserve:
- sc-sigurd-1: true-name release; once revealed, lose 1 VP at each round start; residual after battle grants mana equal to the mana cost of one attack played this round by an opponent who fought Sigurd;
- sc-sigurd-2: once revealed, lose 1 VP at each round start; all controller basic cards gain an action ability costing 2 mana that doubles that card's base power and removes it from the game after battle phase ends;
- sc-sigurd-3: must be played as an additional play; gains swift attribute when sc-sigurd-2 is revealed and magic attribute when sc-sigurd-1 is revealed.

Implementation requirements:
- migrate all three Sigurd frozen skills in one owner-complete formal batch; do not finish a subset and move owners;
- recertify exact semantics against locked source/confirmed override evidence before implementation;
- no `servant.sigurd` / card-id / card-name / printed-text / Chinese-text identity routing in production runtime;
- no SkillLib fallback and no runtime source-text parsing;
- new runtime capability must be generic, data-driven, fail closed, narrowly source-grounded, and covered by focused positive/negative tests;
- if a bounded zero-credit capability/readiness seam is required, complete/review/A-sync it and return to this same Sigurd owner before moving on;
- no merge, retarget, reset/discard, force push, or worktree proliferation.

Verification:
- exact frozen owner scope = all 3 Sigurd skills;
- focused semantic coverage for all three plus fail-closed paths for each new generic capability;
- affected loader/interpreter/executable/combat/session/content tests dictated by the actual diff;
- typecheck + content validate/compile + generated determinism + `git diff --check`;
- production identity-routing audit clean;
- freeze exact Base/Candidate, clean fixed Work, PR, policy gate, and one fresh independent R for the whole owner batch.

Accounting boundary:
- Base strict formal accounting is `129/944` after Siegfried synchronization;
- no Sigurd credit before exact-Candidate `MIGRATION_ACCEPTED` + subsequent A-sync/accounting;
- if all three are accepted and synchronized, next strict accounting target is `132/944`.

Allowed verdicts:
- `MIGRATION_ACCEPTED`
- `MIGRATION_NEEDS_REVISION`
- `MIGRATION_BLOCKED`

## TASK P3-B-SIGURD-REVEALED-SOURCE-CAPABILITY

Owner: Codex B
Status: `IMPLEMENTATION_REVISION_READY_FOR_FRESH_R`
Base: `fe37f27e17007af77573ab99e02b40870d62d532`
Classification: bounded zero-credit capability/readiness prerequisite for current owner `servant.sigurd`

Bounded scope:
- generic physical-card revealed state, distinct from merely active state;
- exact source-revealed round-start condition/trigger support;
- exact generic revealed-source grant of a controller-basic card-local 2-mana / double-base / after-battle-remove Action;
- exact generic conditional attribute grant keyed by another controller-owned physical definition being revealed;
- exact generic after-battle selection/refund seam for one current-round opponent attack from the controller's fight, using trusted paid play cost;
- bounded authenticated restore state for the granted physical-card transform/removal marker.

Hard scope boundary:
- zero consumer authoring and zero migration credit in this task;
- no Sigurd/card-id/card-name/printed-text/Chinese-text identity routing in production runtime;
- exact-shape fail-closed loader/runtime validation plus focused positive/negative tests;
- shared-module regressions are in scope only where touched by this bounded seam;
- ACCEPTED must A-sync/rescan and return to `P3-S-OWNER-SIGURD-COMPLETE-MIGRATION`; it cannot advance to the next owner.

Evidence: `docs/reports/2026-09-27-p3-b-sigurd-revealed-source-capability-result.md`.

R2 revision closure: derived revealed-source marker families now require strict accepted passive whole-ability semantics in both loader and runtime; wrong-kind/trigger and false-condition enclosing abilities fail closed. Focused capability `7/7 PASS`; affected serial chain `7 files / 161 tests PASS`.

Formal accounting remains `129/944`; this task is permanently zero-credit.

R1 predecessor `986b04be707911b8f741ffc4f7bf33da8f59fe50` -> `IMPLEMENTATION_NEEDS_REVISION`; canonical relay: `https://github.com/binchen648/fd/pull/461#issuecomment-5848501887`. Successor revision closes disabled/unsupported-derived capability leakage and requires canonical battle-terminal provenance for after-battle removal; fresh R is required on the successor exact Candidate.

## P3-A-SIGURD-REVEALED-SOURCE-CAPABILITY-ACCEPTANCE-SYNC

- PR #461 exact successor Candidate `20f7c6d3262b00ca072554fc07be5fc2ba89e7ab` received `IMPLEMENTATION_ACCEPTED_CANDIDATE` from fresh independent R.
- Canonical same-attempt Coordinator relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/461#issuecomment-5851169420`.
- Accepted scope is the bounded revealed-source generic capability only; Sigurd consumer authoring delta remains empty and this synchronization grants zero migration credit.
- Final review closure requires strict accepted passive whole-ability gateways for derived revealed-source markers, canonical battle-terminal provenance for physical-card removal, and fail-closed wrong-kind/trigger/false-condition/unsupported/disabled/widened enclosing semantics.
- Exact-Candidate Phase 3 Pre-Review Gate run `36261977400` succeeded.
- Current-main strict formal accounting remains `129/944`; remaining `815`.
- Current owner remains `servant.sigurd`; execution returns to `P3-S-OWNER-SIGURD-COMPLETE-MIGRATION` for all three frozen Sigurd consumers together. Do not advance owners.
- Detailed sync: `docs/reports/2026-09-27-p3-a-sigurd-revealed-source-capability-acceptance-synchronization.md`.


## P3-A-OWNER-SIGURD-ACCEPTANCE-SYNC

- PR #462 exact Candidate `0af5064fc9894e3db3896a631db8c9beb8fb1485` received `MIGRATION_ACCEPTED` from fresh independent R.
- Canonical same-attempt Coordinator relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/462#issuecomment-5851381115`.
- Accepted formal owner scope is exactly all three current-main remaining Sigurd frozen identities: `servant.sigurd.skill.sc-sigurd-1` through `servant.sigurd.skill.sc-sigurd-3`.
- Accepted prerequisite #461 remains zero-credit; no capability identity is added to migration accounting.
- Exact-Candidate Phase 3 Pre-Review Gate run `36283064856` succeeded.
- Current-main strict formal accounting moves `129/944 -> 132/944`; remaining `812`.
- Owner-complete workflow remains authoritative: no fixed-50 requirement and no per-skill R split; only after an owner is ACCEPTED + A-synced/accounted may execution move to the next owner.
- Mechanical frozen-inventory continuity selects `servant.sitonai` next. Its already accepted FM07/R38 `sc-sitonai-3` is not double-counted; only the two remaining frozen consumers are in the new formal scope.
- Detailed sync: `docs/reports/2026-09-27-p3-a-owner-sigurd-acceptance-synchronization.md`.

## TASK P3-S-OWNER-SITONAI-COMPLETE-MIGRATION

Owner: Codex S
Status: `MIGRATION_CANDIDATE_READY_FOR_FRESH_R`
Base: `3748e7341ecdfd26ccd56bbde75fbd6502e1f233`
Owner root: `servant.sitonai`
Formal owner scope: exactly the two current-main remaining frozen Sitonai skills; the already accepted FM07/R38 sc-sitonai-3 receives no duplicate credit

Remaining frozen skills:
- `servant.sitonai.skill.sc-sitonai-1` 閳?鏉╃偞鎯￠幍鎾冲毊
- `servant.sitonai.skill.sc-sitonai-2` 閳?閸愯崵绮ㄩ崥褝绱濇径鈺€绗傞惃鍕嚟閸?
Already accepted owner identity outside this batch:
- `servant.sitonai.skill.sc-sitonai-3` 閳?娴犳牔姹夐弽纭风礄Alter Ego Class閿?閳?independently migration-accepted in FM07/R38; preserve it and do not re-credit it.

Source/provenance:
- frozen inventory/reference records `hasConfirmedOverride=true`, `hasAuthoringCard=false` for sc-sitonai-1 and sc-sitonai-2;
- shared source grounding: `FD閸忋劌宕遍崶楣冨V2.0.chm -> 娴犲氦鈧?娴犳牔姹夐弽?閼昏鲸鏋冮悧?韫囨瀹抽崘?htm`, plus development image `Fate_Domination-瀵偓閸欐垹澧?images/servants/韫囨瀹抽崘?png`;
- frozen phase3 classification for both remaining identities is `SOURCE_EVIDENCE_REQUIRED / EXPLICIT_BLOCK`; S must mechanically recertify locked source semantics before encoding consumers;
- historical handlers `core.sitonai-combination-attack` and `core.sitonai-pohjola-fimbul` are evidence only, not authorization for identity-keyed production routing.

Frozen semantic requirements to recertify and preserve:
- sc-sitonai-1: reversal grants 4 VP if the controller wins the fight; passive/Action join allows paying 3 mana to add this card to the controller's attack exactly when the active attacks contain one Strength and one Magic attribute attack.
- sc-sitonai-2: true-name release; Action effect while source active prevents all players from drawing cards through the end of the next round; reversed branch blocks all non-eliminated players from gaining mana through the end of the next round.
- sc-sitonai-3 existing accepted Alter Ego transform authoring/runtime contract remains unchanged and must continue to work with the completed owner archive.

Implementation requirements:
- migrate both remaining Sitonai frozen skills together in one owner-complete formal batch; do not split the two remaining identities or re-credit sc-sitonai-3;
- preserve the already accepted sc-sitonai-3 FM07/R38 authoring and semantics;
- no `servant.sitonai` / card-id / card-name / printed-text / Chinese-text identity routing in production runtime;
- no SkillLib fallback and no runtime source-text parsing;
- any new runtime capability must be generic, data-driven, fail closed, narrowly source-grounded, and focused-tested;
- if a bounded zero-credit capability/readiness seam is required, complete/review/A-sync it and return to this same Sitonai owner before moving on;
- no merge, retarget, reset/discard, force push, or worktree proliferation.

Verification:
- exact remaining frozen owner scope = sc-sitonai-1 + sc-sitonai-2; sc-sitonai-3 preserved and not double-counted;
- focused semantic coverage for both remaining skills plus regression coverage preserving accepted sc-sitonai-3;
- fail-closed paths for each new generic capability;
- affected loader/interpreter/executable/combat/session/content tests dictated by actual diff;
- typecheck + content validate/compile + generated determinism + `git diff --check`;
- production identity-routing audit clean;
- freeze exact Base/Candidate, clean fixed Work, PR, policy gate, and one fresh independent R for the whole remaining owner batch.

Accounting boundary:
- Base strict formal accounting is `132/944` after Sigurd synchronization;
- no Sitonai credit before exact-Candidate `MIGRATION_ACCEPTED` + subsequent A-sync/accounting;
- because sc-sitonai-3 is already accepted, this batch can add exactly two identities; if accepted and synchronized, next strict accounting target is `134/944`.

Allowed verdicts:
- `MIGRATION_ACCEPTED`
- `MIGRATION_NEEDS_REVISION`
- `MIGRATION_BLOCKED`

Current implementation evidence:
- canonical Sitonai authoring now contains sc-sitonai-1 + sc-sitonai-2 together while preserving the previously accepted sc-sitonai-3 object unchanged;
- locked Reference recertified at `b2f9fa15fba07c63530bbf4612b03b8b704755f9`;
- focused owner semantics `6/6 PASS`; owner/prerequisite/sc3 chain `4 files / 24 tests PASS`; affected serial chain `8 files / 160 tests PASS`;
- typecheck/content validate/content compile/generated determinism/diff-check PASS; production `packages/rules/src` diff EMPTY and Sitonai/SkillLib identity audit clean;
- strict formal accounting remains `132/944` pending exact-Candidate fresh independent R and subsequent A-sync/accounting; an accepted synchronized batch adds exactly two identities;
- detailed result: `docs/reports/2026-09-27-p3-s-owner-sitonai-complete-migration-result.md`.


## TASK P3-B-SITONAI-COMBINATION-FIMBUL-CAPABILITY

Owner: Codex B
Status: `IMPLEMENTATION_CANDIDATE_READY_FOR_FRESH_R`
Base: `508050bb701d2dd2fe425dc323eca2a970ec95c1`
Classification: bounded zero-credit capability/readiness prerequisite for current owner `servant.sitonai`

Bounded scope:
- exact generic controller active-attack attribute-pair predicate: exactly one carrier of each requested attribute, two distinct physical active attack cards;
- exact generic all-active-player timed resource suppression through the end of the next round for either ordinary card draw or positive mana gain;
- exact source-reversal branch compatibility without character identity routing;
- authenticated restore validation for timed suppression maps and player-key ownership;
- shared ordinary draw boundaries and unified positive mana-grant boundary consume the timed state.

Hard scope boundary:
- zero Sitonai consumer authoring and zero migration credit in this task;
- no `servant.sitonai` / skill-id / card-name / printed-text / Chinese-text identity routing in production runtime;
- no SkillLib fallback or runtime source-text parsing;
- exact-shape fail-closed loader/runtime validation and whole-ability gateway for timed global suppression;
- ACCEPTED must A-sync/rescan and return to `P3-S-OWNER-SITONAI-COMPLETE-MIGRATION`; it cannot advance owners.

Source-grounded requirement:
- locked Reference combination join requires exactly one Strength carrier and one Magic carrier among controller active attacks and distinct physical cards;
- locked Reference Fimbul applies through next round: unreversed blocks ordinary draws for all non-eliminated players, reversed blocks positive mana gains for all non-eliminated players.

Evidence: `docs/reports/2026-09-27-p3-b-sitonai-combination-fimbul-capability-result.md`.

Focused capability `7/7 PASS`; affected serial chain `8 files / 162 tests PASS`; typecheck/content validate/content compile/generated determinism/diff-check PASS; production identity audit clean; `data/authoring/**` delta empty.

Formal accounting remains `132/944`; remaining `812`. This task is permanently zero-credit.

## P3-A-SITONAI-COMBINATION-FIMBUL-CAPABILITY-ACCEPTANCE-SYNC

- PR #463 exact successor Candidate `8789fcad58867b999a9d713b83342f602fa3f775` received `IMPLEMENTATION_ACCEPTED_CANDIDATE` from fresh independent R.
- Canonical same-attempt Coordinator relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/463#issuecomment-5852281710`.
- Accepted scope is the bounded Sitonai combination/Fimbul generic capability only; Sitonai consumer authoring delta remains empty and this synchronization grants zero migration credit.
- Final review closure confirms recursive nested timed-suppression whole-ability gating and validates draw-card counts before suppression; malformed nested wrappers and negative draw counts fail closed.
- Exact-Candidate Phase 3 Pre-Review Gate run `36286037213` succeeded.
- Current-main strict formal accounting remains `132/944`; remaining `812`.
- Current owner remains `servant.sitonai`; execution returns to `P3-S-OWNER-SITONAI-COMPLETE-MIGRATION` for `sc-sitonai-1 + sc-sitonai-2` together. Already accepted FM07/R38 `sc-sitonai-3` remains preserved and must not be re-credited. Do not advance owners.
- Detailed sync: `docs/reports/2026-09-27-p3-a-sitonai-combination-fimbul-capability-acceptance-synchronization.md`.

## TASK P3-B-SITONAI-SOURCE-SKILL-ATTACK-JOIN-CAPABILITY

Owner: Codex B
Status: `IMPLEMENTATION_REVISION_READY_FOR_FRESH_R`
Base: `e92cb3a08392619b0e8f47504f8e1c751b7b504d`
Classification: bounded zero-credit capability/readiness prerequisite discovered while resuming current owner `servant.sitonai`

Bounded scope:
- generic source-owned skill-zone card join to controller attack as a face-up active physical attack;
- fixed positive authored mana ability cost, exact data-driven active-attack attribute-pair predicate, and exact phase-action whole-ability gateway;
- joining is not a card play: no `on_use_declared` / `on_card_played`, no ordinary play-count increment, and trusted `paidManaOnPlay=0`;
- source ownership/controller/zone/state and available mana are checked server-side before the join;
- nested/widened privileged join primitives fail closed in both loader and runtime.

Why the seam is required:
- locked Reference `joinOwnedCardToAttack` for Sitonai's combination skill explicitly moves the owned skill-zone physical card to attack, makes it face-up/active, charges the ability mana cost, records zero paid play cost, and does not fire ordinary card-play triggers;
- current generic `move_source_card` moves only the zone and does not activate the card;
- current generic `play_source_card` is hand-only and intentionally emits ordinary play events, so composing either existing primitive would change source-grounded rules.

Hard scope boundary:
- zero Sitonai consumer authoring and zero migration credit in this task;
- no `servant.sitonai` / skill-id / card-name / printed-text / Chinese-text identity routing in production runtime;
- no SkillLib fallback or runtime source-text parsing;
- ACCEPTED must A-sync/rescan and return to `P3-S-OWNER-SITONAI-COMPLETE-MIGRATION`; it cannot advance owners.

Evidence: `docs/reports/2026-09-27-p3-b-sitonai-source-skill-attack-join-capability-result.md`.

Formal accounting remains `132/944`; remaining `812`. This task is permanently zero-credit.

R1 closure:
- fresh Reviewer retry on exact predecessor Candidate `a79cff1d2e91515d5a638a2e063415cb340f3d08` returned `IMPLEMENTATION_NEEDS_REVISION`; canonical evidence `https://github.com/binchen648/fd/pull/464#issuecomment-5853233206`;
- sole blocking finding was forged current-round `playedRound` provenance on attack join, which could incorrectly satisfy existing `played_this_round` consumers such as Sigurd's refund selector;
- revision preserves any genuine prior `playedRound`, initializes a previously untracked skill-zone source with a non-current round, and never stamps current `playedRound` merely because the card joined an attack;
- focused closure proves join cost/state/visibility/zero paid play cost/no ordinary play accounting while preserving non-play provenance; Sigurd-style regression proves a joined-but-not-played servant-skill attack is excluded from `played_this_round` candidates;
- affected serial closure: `7 files / 155 tests PASS`; typecheck/content validate/content compile/generated determinism/diff-check PASS; `data/authoring/**` delta empty; production Sitonai/SkillLib identity-routing audit clean.

## P3-A-SITONAI-SOURCE-SKILL-ATTACK-JOIN-CAPABILITY-ACCEPTANCE-SYNC

- PR #464 exact successor Candidate `c68bfe1246c06a2a0f67728d5539a3710a355933` received `IMPLEMENTATION_ACCEPTED_CANDIDATE` from fresh independent R.
- Canonical same-attempt Coordinator relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/464#issuecomment-5853397996`.
- Accepted scope is the bounded generic source-skill attack-join capability only; Sitonai consumer authoring delta remains empty and this synchronization grants zero migration credit.
- Final review closure confirms join does not forge current-round `playedRound`; genuine prior play provenance is preserved and joined-but-not-played attacks remain excluded from existing `played_this_round` consumers.
- Exact-Candidate Phase 3 Pre-Review Gate run `36299648124` succeeded.
- Mechanical A rescan confirms frozen sc-sitonai-1/sc-sitonai-2 still have `hasConfirmedOverride=true`, `hasAuthoringCard=false`, while canonical Sitonai authoring still contains only already accepted sc-sitonai-3.
- Current-main strict formal accounting remains `132/944`; remaining `812`.
- Current owner remains `servant.sitonai`; execution returns immediately to `P3-S-OWNER-SITONAI-COMPLETE-MIGRATION` for sc-sitonai-1 + sc-sitonai-2 together. sc-sitonai-3 remains preserved and must not be re-credited. Do not advance owners.
- Detailed sync: `docs/reports/2026-09-27-p3-a-sitonai-source-skill-attack-join-capability-acceptance-synchronization.md`.

## P3-A-OWNER-SITONAI-ACCEPTANCE-SYNC

- PR #465 exact Candidate `0e39b88803fd6091f85d13cfe9c959683ce2fe92` received `MIGRATION_ACCEPTED` from fresh independent R.
- Canonical same-attempt Coordinator relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/465#issuecomment-5853798231`.
- Accepted formal owner scope is exactly `servant.sitonai.skill.sc-sitonai-1` + `servant.sitonai.skill.sc-sitonai-2`; previously accepted FM07/R38 `sc-sitonai-3` remains preservation-only and receives no duplicate credit.
- Accepted prerequisite PR #463 and PR #464 remain permanently zero-credit capability/readiness seams.
- Exact-Candidate Phase 3 Pre-Review Gate run `36301898126` succeeded.
- Independent exact-Candidate closure: focused owner `6/6 PASS`; affected serial `8 files / 160 tests PASS`; typecheck/content validate/content compile/generated determinism/diff-check PASS; production `packages/rules/src` diff EMPTY; Sitonai/SkillLib identity-routing audit clean.
- Current-main strict formal accounting moves `132/944 -> 134/944`; remaining `810`.
- Owner-complete workflow remains authoritative: no fixed-50 requirement and no per-skill R split; only after an owner is ACCEPTED + A-synced/accounted may execution move to the next owner.
- Mechanical frozen-inventory continuity selects `servant.skadi` next. Current canonical Skadi authoring is absent and targeted historical report search found no prior formal Skadi migration acceptance, so all three frozen Skadi identities are the next owner-complete scope.
- Detailed sync: `docs/reports/2026-09-27-p3-a-owner-sitonai-acceptance-synchronization.md`.

## P3-A-SKADI-RUNE-CASTLE-READINESS-CAPABILITY-ACCEPTANCE-SYNC

- PR #466 exact successor Candidate `f807936f26d3e61dc2454a59f918de073fcfeb4f` received `IMPLEMENTATION_ACCEPTED_CANDIDATE` from fresh independent R.
- Canonical same-attempt Coordinator relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/466#issuecomment-5854715176`.
- Accepted scope is the bounded Skadi rune/castle generic capability only; `data/authoring/**` remains unchanged and this synchronization grants zero migration credit.
- Final review closure confirms exact pay-1 legality: authoritative pre-payment affordability remains, the post-payment path does not demand a second mana, nonempty-deck execution revalidation remains fail closed, and exactly 1 starting mana reaches the private continuation at 0 mana.
- Exact-Candidate Phase 3 Pre-Review Gate run `36309515122` succeeded.
- Mechanical A rescan confirms all three frozen Skadi identities still have `hasConfirmedOverride=true`, `hasAuthoringCard=false`, canonical `servant.skadi.json` is still absent, and no prior formal Skadi migration acceptance exists.
- Current-main strict formal accounting remains `134/944`; remaining `810`.
- Current owner remains `servant.skadi`; execution returns immediately to `P3-S-OWNER-SKADI-COMPLETE-MIGRATION` for all three skills together. Do not advance owners.
- Detailed sync: `docs/reports/2026-09-27-p3-a-skadi-rune-castle-readiness-capability-acceptance-synchronization.md`.

## TASK P3-B-SKADI-RAIDO-MOVEMENT-READINESS-CAPABILITY

Owner: Codex B
Status: `IMPLEMENTATION_REVISION_READY_FOR_FRESH_R`
Base: `abda8c845133bd12bce47f624808a3ead9d95510`
Classification: bounded zero-credit capability/readiness prerequisite discovered while completing current owner `servant.skadi`

Bounded scope:
- add one identity-free exact whole-ability contract for Action-phase `鏉╁懏宓?鏉╁懏宓巂 current-round basic-attack pair + fixed pay-3 + one `any_enabled_location` target + controller `move_player`;
- preserve the existing FB2-09 free active-source `any_enabled_location + not workshop` movement contract;
- make loader/runtime agree by routing Action any-enabled-location movement candidates through a shared fail-closed gateway that accepts only one of those exact contracts;
- preserve existing target authority for current-location exclusion, disabled locations, movement locks, occupancy, movement history, and normal movement events.

Hard scope boundary:
- zero Skadi consumer authoring and zero migration credit;
- `data/authoring/**` delta must remain empty;
- no `servant.skadi` / skill-id / card-name / printed-text / Chinese-text identity routing in production runtime;
- no SkillLib fallback and no runtime source-text parsing;
- no new movement effect primitive and no broadening of ordinary arrow movement;
- widened cost/condition/target/effect/rune-pair near matches must fail closed at loader and runtime boundaries;
- ACCEPTED must A-sync/rescan and return to the same Skadi owner formal task; it cannot advance owners.

Formal consumer preservation:
- pre-capability owner work is preserved as local-only WIP commit `1c3546bb01d4d20820282f671e5045050d4b879e` on `codex/s-p3-owner-skadi-complete-migration-r2`;
- that WIP is not pushed, not a Candidate, not reviewed, and grants no credit;
- after capability ACCEPTED + A-sync, formal work must resume from the new exact A-sync Base and carry forward the preserved consumer content rather than reviewing the WIP lineage.

Evidence: `docs/reports/2026-09-27-p3-b-skadi-raido-movement-readiness-capability-result.md`.

Verification:
- focused generic capability `4/4 PASS`;
- affected serial chain `8 files / 170 tests PASS`, including FB2-09 legacy movement `7/7` and accepted #466 Skadi readiness `12/12`;
- typecheck/content validate/content compile/generated determinism/diff-check PASS;
- `data/authoring/**` delta EMPTY;
- production Skadi/SkillLib identity audit clean;
- strict formal accounting remains `134/944`, remaining `810`; task permanently zero-credit.

R1 closure:
- predecessor Candidate `eb06cac542e6bd1cb54eacaaa0cc4ec6a18c444a` received `IMPLEMENTATION_NEEDS_REVISION`; canonical same-attempt evidence `https://github.com/binchen648/fd/pull/467#issuecomment-5855009517`;
- P1 closed: the loader movement candidate detector now also catches the identity-free Raido rune-pair + mana-cost movement signature when `any_enabled_location` is removed or replaced, while exact acceptance still requires the original selector;
- loader/runtime fail closed are both covered for selector removal/replacement; runtime corruption cannot spend mana, move, or leave a pending decision;
- focused closure remains `4/4 PASS`; affected serial closure remains `8 files / 170 tests PASS`.

Allowed verdicts:
- `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`

Fresh-R predecessor / successor closure:
- predecessor exact Candidate `51a7d5735628b77403467eb0908ff451b4254205` received `IMPLEMENTATION_NEEDS_REVISION`;
- canonical Coordinator bounded same-attempt relay: `https://github.com/binchen648/fd/pull/487#issuecomment-5890536697`;
- [P1] restored sc2 transaction order/progress was not authenticated; [P1] completed settlement participants were not authenticated;
- successor introduces a dedicated HMAC-sealed server-owned battlefield attack-offer authority snapshot, transaction ids, frozen activation order/progress, and physical-card participation provenance;
- MatchSession current/replay restore requires the authority seal and exact consistency; malformed order/progress or settlement participant substitutions fail closed;
- new regressions cover `[p1,p2] -> [p1]` restored-order truncation and completed settlement `['p2'] -> ['p3']` participant substitution;
- successor verification: Tezcat `8/8 PASS`, affected `8 files / 115 tests PASS`, MatchSession `33/33`, toolchain/typecheck/content/determinism/identity/diff gates PASS;
- readiness remains zero-credit and strict accounting stays `154/944`, remaining `790` until later formal owner migration acceptance + A-sync.

## P3-A-SKADI-RAIDO-MOVEMENT-READINESS-CAPABILITY-ACCEPTANCE-SYNC

- PR #467 exact successor Candidate `b94a44ee9bf32f3fbd542df47d3a6b42d0e04876` received `IMPLEMENTATION_ACCEPTED_CANDIDATE` from fresh independent R.
- Canonical same-attempt Coordinator relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/467#issuecomment-5855166720`.
- Accepted scope is the bounded Raido movement generic capability only; `data/authoring/**` remains unchanged and this synchronization grants zero migration credit.
- R1 closure confirms selector removal/replacement can no longer bypass the loader gateway; exact acceptance still requires the original single `any_enabled_location` target and runtime compiled-pack corruption remains fail closed.
- Exact-Candidate Phase 3 Pre-Review Gate run `36312899164` succeeded.
- Mechanical A rescan confirms all three Skadi identities remain the formal owner-complete scope, canonical `servant.skadi.json` is still absent, and no prior formal Skadi migration acceptance exists.
- Current-main strict formal accounting remains `134/944`; remaining `810`.
- Current owner remains `servant.skadi`; execution returns immediately to `P3-S-OWNER-SKADI-COMPLETE-MIGRATION` for all three skills together. Do not advance owners.
- Detailed sync: `docs/reports/2026-09-27-p3-a-skadi-raido-movement-readiness-capability-acceptance-synchronization.md`.

## TASK P3-S-OWNER-SKADI-COMPLETE-MIGRATION

Owner: Codex S
Status: `MIGRATION_REVISION_READY_FOR_FRESH_R`
Base: `bc4304ebbde331af6e2d00c4d33a1fedde6fbf79`
Owner root: `servant.skadi`
Formal owner scope: all three current-main remaining frozen Skadi skills together

Remaining frozen skills:
- `servant.skadi.skill.sc-skadi-1` 閳?婢堆咁殻閻ㄥ嫮婢橀弲?- `servant.skadi.skill.sc-skadi-2` 閳?閸樼喎鍨垫稊瀣床閹?- `servant.skadi.skill.sc-skadi-3` 閳?闁艾绶氬璁抽濠娾剝瀛╅惃鍕摕婢у啩绠ｉ梻?
Source/provenance:
- frozen inventory/reference records `hasConfirmedOverride=true`, `hasAuthoringCard=false` for all three Skadi identities;
- all three are currently `SOURCE_EVIDENCE_REQUIRED / EXPLICIT_BLOCK`;
- shared source grounding: `FD閸忋劌宕遍崶楣冨V2.0.chm -> 娴犲氦鈧?姒勬梹婀崇敮?閼昏鲸鏋冮悧?閺傤垰宕遍崫鍩攱鏌夐崡陇鎷?htm`, plus development image `Fate_Domination-瀵偓閸欐垹澧?images/servants/閺傤垰宕遍崫鍩攱鏌夐崡陇鎷?png`;
- canonical `data/authoring/servants/servant.skadi.json` is absent at this Base;
- targeted historical report search excluding aggregate indexes found no prior formal `servant.skadi` migration-acceptance evidence;
- historical handlers are evidence only and never authorize identity-keyed production routing.

Locked Reference observations to mechanically recertify before encoding:
- exact Reference commit `b2f9fa15fba07c63530bbf4612b03b8b704755f9`, class `Caster`;
- exact 12-card deck: `card.cardq1`, `card.cardq2`, `card.cardq2`, `card.cardq4`, `card.carda2`, `card.carda2`, `card.carda3`, `card.carda4`, `card.carda4`, `card.cardluck`, `card.cardluck`, `card.cardpreparation`;
- sc-skadi-1 static metadata: `鐞氼偄濮ー, printed cost `0`, legacy requirement `0`, base power `0`; observed outpost branch pays 1 mana, draws one, then returns/shuffles exactly two hand cards; observed Action branch pays 3 mana and resolves a rune combination derived from two current-round basic attacks;
- source-defined rune combinations observed in Reference cover movement, playing a hand attack, arming a same-round combat defeat effect, same-location mana loss, terrain/deployment multiplication, and +4 VP; S must source-recertify exact pair-to-effect mapping and legality before authoring;
- sc-skadi-2 static metadata: `鐞氼偄濮ー, printed cost `0`, legacy requirement `0`, base power `0`; observed combat branch consumes the armed same-round rune state and applies defeat when its source-defined battle/opponent condition is satisfied;
- sc-skadi-3 static metadata: `姒勬梹婀?鐎规繂鍙縛, printed cost `10`, legacy requirement `10`, base power `0`, true-name release on play; observed residual branch blocks mana gain for opponents at the active source location, and its outpost branch chooses an attribute and doubles matching basic-attack base power for the round in the source-defined battle scope.

Implementation requirements:
- migrate all three remaining Skadi frozen skills together in one owner-complete formal batch; do not split the owner across independent migration PRs;
- recertify source semantics against the locked source hierarchy before encoding; Reference runtime is observation/evidence, not canonical authority by itself;
- no `servant.skadi` / card-id / card-name / printed-text / Chinese-text identity routing in production runtime;
- no SkillLib fallback and no runtime source-text parsing;
- any missing runtime capability must be generic, data-driven, fail closed, narrowly source-grounded, and focused-tested;
- if bounded zero-credit capability/readiness work is required, complete/review/A-sync it and return to this same Skadi owner before moving on;
- preserve exact Base/Candidate lineage; no merge, retarget, reset/discard, force push, or worktree proliferation.

Verification:
- exact frozen owner scope = all three Skadi identities;
- source/static metadata/deck recertification against locked Reference and source hierarchy;
- focused semantic coverage for every branch/rune effect that is encoded;
- fail-closed coverage for every new privileged/generic capability shell;
- affected loader/interpreter/executable/combat/session/content tests dictated by actual diff;
- typecheck + content validate/compile + generated determinism + `git diff --check`;
- production identity-routing audit clean;
- freeze exact Base/Candidate, clean fixed Work, PR, policy gate, and one fresh independent R for the whole owner batch.

Accounting boundary:
- Base strict formal accounting is `134/944` after Sitonai synchronization;
- no Skadi credit before exact-Candidate `MIGRATION_ACCEPTED` + subsequent A-sync/accounting;
- because there is no prior Skadi formal migration credit, an accepted synchronized full owner batch can add exactly three identities and move the next strict target to `137/944`.

Current implementation evidence:
- exact formal Base is Raido capability A-sync `bc4304ebbde331af6e2d00c4d33a1fedde6fbf79`;
- canonical `servant.skadi.json` contains exactly sc-skadi-1 / sc-skadi-2 / sc-skadi-3 plus the recertified 12-card deck;
- source semantics were mechanically recertified against locked Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9` and frozen CHM/development evidence;
- formal consumer code consumes accepted zero-credit prerequisites PR #466 (`f807936f...`) and PR #467 (`b94a44ee...`) without re-credit;
- predecessor Candidate `929c3b824a32b57c015131f2ae8fe90cf81b2e5e` received `MIGRATION_NEEDS_REVISION`; canonical same-attempt evidence `https://github.com/binchen648/fd/pull/468#issuecomment-5855360486`;
- R1 P1 closed: all six Allfather wisdom-action rune outcomes share one current-round use flag; after any rune fully resolves the entire rune family is unavailable for the rest of that round and becomes available again next round with new current-round basics;
- R1 P1 closed: generic authored terrain multipliers now carry creation round and `duration=this_round` is authoritatively filtered by round in both terrain-advantage and combat readers; Peorth x3 expires at next-round start;
- historical PR #467 unguarded exact Raido contract remains accepted while an additional exact guarded variant supports the shared-use boundary without identity routing;
- focused owner regression `11/11 PASS`; Raido readiness regression `6/6 PASS`; affected serial `12 files / 238 tests PASS` including terrain/combat readers;
- R2 predecessor Candidate `d92611690e22c6bdc1e402cd76213e1356ca6511` received `MIGRATION_NEEDS_REVISION`; canonical same-attempt evidence `https://github.com/binchen648/fd/pull/468#issuecomment-5855674407`;
- R2 P2 closed as coverage-only: the guarded Raido whole-ability contract now has independent loader/runtime corruption regressions for mismatched guard/effect keys, extra condition/effect, and malformed current-round flag effects; all reject before mana spend, movement, pending decision, or shared-use flag mutation, while the original unguarded PR #467 contract remains accepted;
- no production runtime change was required for R2; the existing guarded validator/execution boundary already failed all four corruption classes closed;
- typecheck/content validate/content compile/generated determinism/diff-check PASS;
- successor production runtime diff is generic-only and Skadi/card-name/SkillLib identity audit remains clean;
- strict formal accounting remains `134/944`, remaining `810`, pending exact-Candidate fresh independent R and subsequent A-sync/accounting;
- detailed result: `docs/reports/2026-09-27-p3-s-owner-skadi-complete-migration-result.md`.

Allowed verdicts:
- `MIGRATION_ACCEPTED`
- `MIGRATION_NEEDS_REVISION`
- `MIGRATION_BLOCKED`

## P3-A-OWNER-SKADI-ACCEPTANCE-SYNC

- PR #468 exact successor Candidate `7a0e4c4087a01f1c37f4676dc1e62e69d8423e15` received `MIGRATION_ACCEPTED` from fresh independent R.
- Canonical same-attempt Coordinator relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/468#issuecomment-5855787772`.
- Accepted formal owner scope is exactly all three current-main remaining Skadi identities: `servant.skadi.skill.sc-skadi-1` through `servant.skadi.skill.sc-skadi-3`.
- Accepted prerequisite PR #466 and PR #467 remain permanently zero-credit capability/readiness seams.
- Final review closure confirms shared Allfather wisdom-action once-per-round gating, Peorth `this_round` terrain expiry, guarded-Raido loader/runtime fail-closed coverage, and preservation of the historical unguarded PR #467 Raido contract.
- Exact-Candidate Phase 3 Pre-Review Gate run `36318276531` succeeded.
- Independent exact-Candidate closure: owner focused `11/11 PASS`; Raido readiness `6/6 PASS`; affected serial `12 files / 238 tests PASS`; typecheck/content validate/content compile/generated determinism/diff-check PASS; production Skadi/card-name/SkillLib identity-routing audit clean.
- Current-main strict formal accounting moves `134/944 -> 137/944`; remaining `807`.
- Owner-complete workflow remains authoritative: only after an owner is ACCEPTED + A-synced/accounted may execution move to the next owner.
- Mechanical frozen-inventory continuity selects `servant.spartacus` next (`servant.skadi` first-occurrence owner index 235, `servant.spartacus` index 236 of 251 owners).
- Full Git-history/remote-branch recovery found prior formal `MIGRATION_ACCEPTED` for `servant.spartacus.skill.sc-spartacus-2`: PR #414, exact accepted Candidate `58fffb751e25a9ccc2f28470a48255a07ba11493`, canonical Reviewer evidence `https://github.com/binchen648/fd/pull/414#issuecomment-5754190524`, and acceptance-sync commit `b208ac5571c29f28b623f6462438649d9b151b54`.
- The historical Spartacus S2 line is not an ancestor of the current line. Owner-complete replay must preserve its exact accepted semantics in the canonical Spartacus archive but must not grant duplicate credit. Newly creditable remaining identities are only sc-spartacus-1 and sc-spartacus-3.
- Detailed sync: `docs/reports/2026-09-27-p3-a-owner-skadi-acceptance-synchronization.md`.

## TASK P3-S-OWNER-SPARTACUS-COMPLETE-MIGRATION

Owner: Codex S
Status: `SYNCHRONIZED`
Base: `20a59b9dd3fad4d4e0f49c22176d42941bd8daab` (exact accepted Spartacus seal-power readiness A-sync)
Owner root: `servant.spartacus`
Canonical owner-complete consumer scope: all three Spartacus skills together

Newly creditable remaining frozen skills:
- `servant.spartacus.skill.sc-spartacus-1` 閳?閸欏秴褰?
- `servant.spartacus.skill.sc-spartacus-3` 閳?娑撳秴鐪婚惃鍕壈韫?
Previously accepted preservation/replay identity:
- `servant.spartacus.skill.sc-spartacus-2` 閳?娴笺倕鍚旈惃鍕嫗閸?閳?PR #414 / Candidate `58fffb751e25a9ccc2f28470a48255a07ba11493`; no duplicate credit.

Source/provenance:
- frozen inventory/reference records `hasConfirmedOverride=true` for all three Spartacus identities;
- inventory records sc-spartacus-1/sc-spartacus-3 with `hasAuthoringCard=false` and sc-spartacus-2 with historical `hasAuthoringCard=true`;
- canonical `data/authoring/servants/servant.spartacus.json` is absent and current `data/authoring/**` contains no sc-spartacus-2 entry;
- historical accepted S2 provenance: PR #414, Candidate `58fffb751e25a9ccc2f28470a48255a07ba11493`, canonical Reviewer evidence `https://github.com/binchen648/fd/pull/414#issuecomment-5754190524`, acceptance-sync `b208ac5571c29f28b623f6462438649d9b151b54`;
- historical accepted S2 prerequisite is FB2-48 frozen combat-opponent-power VP reward / commit `14c8688c`; replay the accepted seam and do not re-credit it;
- shared source grounding: `FD閸忋劌宕遍崶楣冨V2.0.chm -> 娴犲氦鈧?閻欏倹鍨竟?閼昏鲸鏋冮悧?閺傤垰鍙嶆潏鎯у帬閺?htm`, plus development image `Fate_Domination-瀵偓閸欐垹澧?images/servants/閺傤垰鍙嶆潏鎯у帬閺?png`;
- historical handlers are evidence only and never authorize identity-keyed production routing.

Locked Reference observations to mechanically recertify before encoding:
- exact Reference commit `b2f9fa15fba07c63530bbf4612b03b8b704755f9`, class `Berserker`;
- exact 12-card deck: `card.cardb1`, `card.cardb2`, `card.cardb4`, `card.cardb4`, `card.cardb4`, `card.cardb5`, `card.cardb5`, `card.cardb6`, `card.cardq1`, `card.cardq1`, `card.cardq2`, `card.cardluck`;
- sc-spartacus-1 static metadata: `閸旀盯鍣篳, printed cost `4`, legacy requirement `4`, base power `6`, true-name release on play; observed combat formula counts engaged opponents who used normal/Ruler command seals this round and applies the source-defined `6 - 2X` power formula where X is Spartacus's remaining normal command-seal count;
- sc-spartacus-2 static metadata: `鐎规繂鍙縛, printed cost `3`, legacy requirement `8`, base power `4`; source text grants post-battle VP equal to one engaged opponent's aggregate power divided by five, rounded down; S must recertify exact target/timing selection before encoding;
- sc-spartacus-3 static metadata: `鐞氼偄濮ー, printed cost `0`, legacy requirement `0`, base power `0`; observed Reference replaces normal/Ruler command-seal effects with `+4 aggregate power`, supports authoritative selection among multiple controlled Ruler seals, and applies an Action-stage power rule based on unused normal/Ruler seals held by engaged opponents.

Implementation requirements:
- produce one canonical Spartacus owner archive containing sc1 + accepted-preservation sc2 + sc3; do not split the owner across independent migration PRs;
- preserve/replay the exact accepted sc2 whole-card semantics from PR #414 and do not re-review or re-credit sc2 as a new migration identity;
- recertify source semantics against the locked source hierarchy before encoding; Reference runtime is observation/evidence, not canonical authority by itself;
- treat sc-spartacus-2 as historical formal accepted preservation because exact PR/Candidate/Reviewer/A-sync evidence now exists; do not infer any other credit from inventory labels alone;
- no `servant.spartacus` / card-id / card-name / printed-text / Chinese-text identity routing in production runtime;
- no SkillLib fallback and no runtime source-text parsing;
- any missing runtime capability must be generic, data-driven, fail closed, narrowly source-grounded, and focused-tested;
- if bounded zero-credit capability/readiness work is required, complete/review/A-sync it and return to this same Spartacus owner before moving on;
- preserve exact Base/Candidate lineage; no merge, retarget, reset/discard, force push, or worktree proliferation.

Verification:
- exact canonical owner scope = sc1 + sc2 + sc3, with new-credit set exactly sc1 + sc3 and sc2 preservation-only;
- source/static metadata/deck recertification against locked Reference and source hierarchy;
- focused semantic coverage for every encoded branch, including command-seal/Ruler-seal ownership and round-lifecycle boundaries;
- fail-closed coverage for every new privileged/generic capability shell;
- affected loader/interpreter/combat/session/content tests dictated by actual diff;
- typecheck + content validate/compile + generated determinism + `git diff --check`;
- production identity-routing audit clean;
- freeze exact Base/Candidate, clean fixed Work, PR, policy gate, and one fresh independent R for the whole owner batch.

Formal Candidate preparation evidence:
- accepted readiness input: PR #470 final Candidate `c5c418a0c1227924abdac5de6707ebeacbe074a0`, canonical acceptance `https://github.com/binchen648/fd/pull/470#issuecomment-5858470246`, zero-credit A-sync/Base `20a59b9dd3fad4d4e0f49c22176d42941bd8daab`;
- canonical owner archive adds all three frozen Spartacus cards together; sc2 card object is structurally identical to historical accepted PR #414 Candidate `58fffb751e25a9ccc2f28470a48255a07ba11493` and remains preservation-only;
- frozen material overlap mechanically changes `137 -> 140`, with sc1/sc2/sc3 each exactly once and duplicate frozen count `0`; candidate migration credit remains exactly `2` because sc2 was already formally credited;
- focused owner-complete regression `8/8 PASS`;
- affected serial chain `12 files / 245 tests PASS`, including final readiness `20/20`, FB2-48 `10/10`, FB2-27 Ruler `13/13`, MatchSession `33/33`, executable pack `50/50`, authoring interpreter `38/38`, combat resolver `10/10`, resolution-dataflow `15/15`, MatchSession regressions `7/7`, complex-skills `37/37`, fixed-controller command-seal `4/4`;
- typecheck PASS; content validate/compile PASS (`7 masters / 12 servants / 20 events / 0 blocking issues`); generated determinism PASS with unchanged hashes;
- official `npm run test:ci -- --maxWorkers=2` probe produced `1141 PASS / 15 FAIL`; exact Base independently reproduces all `10` tracked failures in five unchanged historical test files, while the additional five failures come from ignored/untracked `packages/rules/tests/.fd-shiki-runtime-debug.test.ts` (`DEBUG_TRACKED=false`). No Spartacus focused/affected test fails;
- complementary full-suite-minus-mechanically-reproduced-Base-debt run: `152 files / 1127 tests PASS`;
- exact Base Astolfo stale material assertion already fails at `137` against hard-coded `112`; formal material correctly advances the observed overlap to `140` by adding all three owner cards, without duplicates;
- `packages/rules/src` production runtime delta is EMPTY; no new identity routing, SkillLib fallback, or source-text parsing is introduced;
- detailed result: `docs/reports/2026-09-28-p3-s-owner-spartacus-complete-migration-result.md`.

Accounting boundary:
- Base strict formal accounting is `137/944` after Skadi synchronization; remaining `807`;
- no new Spartacus credit before exact-Candidate `MIGRATION_ACCEPTED` + subsequent A-sync/accounting;
- historical sc-spartacus-2 is already formal credit and receives no duplicate credit on this line;
- an accepted synchronized owner batch can therefore add exactly two new identities (sc1 + sc3) and move the next strict target from `137/944` to `139/944`, remaining `805`.

Allowed verdicts:
- `MIGRATION_ACCEPTED`
- `MIGRATION_NEEDS_REVISION`
- `MIGRATION_BLOCKED`

Acceptance synchronization:
- PR #471 exact Candidate `ab009a6074f2c71b7eaf1204880d71fffd670bea` received `MIGRATION_ACCEPTED` from fresh independent R.
- Canonical same-attempt Coordinator relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/471#issuecomment-5858838041`.
- Exact-Candidate Phase 3 Pre-Review Gate `36342038836` succeeded.
- Accepted owner-complete scope is exactly sc1 + sc2 + sc3; sc1/sc3 are newly creditable and sc2 remains historical accepted preservation/replay only.
- Formal accounting moves `137/944 -> 139/944`; remaining `805`; sc2 receives no duplicate credit.
- Acceptance synchronization report: `docs/reports/2026-09-28-p3-a-owner-spartacus-acceptance-synchronization.md`.
- Mechanical first-occurrence owner ordering selects `servant.stheno` next: Spartacus index `236`, Stheno index `237` of `251` owners.
- Owner-readiness-first remains mandatory: complete one full Stheno preflight before any Stheno formal consumer migration.
## TASK P3-B-SPARTACUS-SEAL-POWER-READINESS-CAPABILITY

Owner: Codex B
Status: `SYNCHRONIZED`
Base: `7f0dc16fec89bcbbd78681e7cfc3036616a5c68b`
Classification: bounded zero-credit owner-readiness prerequisite for current owner `servant.spartacus`

Owner-readiness-first gap set:
- current-round distinct engaged-opponent usage tracking across normal Command Seals and issuer-owned Ruler Seals;
- exact combat formula shell for source-defined `engaged user count * (6 - 2 * controller remaining normal seals)`;
- repeatable normal Command Seal replacement: consume one remaining normal seal and grant +4 current-round combat total power;
- issuer-owned/distributed Ruler Seal replacement: auto-consume one seal or select the exact seal when multiple remain, then grant +4 current-round combat total power;
- Action-stage live +1 current-round combat total power per unused normal / issuer-owned Ruler seal held by each engaged opponent;
- original normal/Ruler actions remain unchanged with no replacement provider and are suppressed only while an exact controlled replacement provider exists;
- authenticated restore/fail-closed validation for the private multi-Ruler continuation and widened compiled/persisted corruption.

Hard scope boundary:
- this one batch closes all currently discoverable sc1/sc3 generic seal-power gaps found by the complete Spartacus owner preflight; sc2 already has accepted FB2-48 support and is not reimplemented here;
- zero Spartacus consumer authoring and zero migration credit;
- `data/authoring/**` delta must remain empty;
- no `servant.spartacus`, skill-id, card-name, printed-text, or Chinese-text identity routing in production runtime;
- no SkillLib fallback and no runtime source-text parsing;
- ACCEPTED must A-sync/rescan and return to `P3-S-OWNER-SPARTACUS-COMPLETE-MIGRATION`; it cannot advance owners.

Verification evidence:
- R1 predecessor Candidate `f114f650516802e19e38cd882c341e83469d8021` received `IMPLEMENTATION_NEEDS_REVISION`; canonical same-attempt Coordinator relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/470#issuecomment-5857767819`;
- R1 P1 closure: restored `rulerSealBindings` require unique resource ids, coherent issuer/bound/granted/spent facts, exact source-controller ownership, the exact named source ability must satisfy the accepted identity-free Ruler-seal grant semantic, and persisted `rulerSealBindingHistory` must exactly match the restored physical binding multiset;
- R1 P1 closure: restored `player.commandSpells`, when present, must be a safe integer in the physical `0..3` domain; widened string/numeric/fractional values fail closed before MatchSession construction;
- R2 predecessor Candidate `7fd3e7b1ef942a569a36e4b36ff656751f8ca6bd` received `IMPLEMENTATION_NEEDS_REVISION`; canonical same-attempt Coordinator relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/470#issuecomment-5858026355`;
- R2 P1 closure: restored physical Ruler bindings are grouped by exact grant source/ability and must equal exactly two bindings per authenticated per-game grant use, with usage constrained to `1..3`; impossible seventh-seal snapshots fail closed;
- R2 P1 closure: persisted normal/Ruler use-round markers require underlying use provenance 閳?normal uses carry authenticated source/ability/before/after records cross-bound to dedicated `abilityUsage` execution counters, while Ruler markers must equal the latest authenticated physical binding `spentRound`; marker-only forgeries fail closed;
- R3 predecessor Candidate `2a057640c066ef47b82e90fa66df6bb31e89969a` received `IMPLEMENTATION_NEEDS_REVISION`; canonical same-attempt Coordinator relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/470#issuecomment-5858346066`;
- R3 P1 closure: normal and Ruler persisted use-round marker reconciliation is bidirectional 閳?every marker must equal the latest authenticated provenance round and every provenance-backed player/issuer must have that exact marker; deleting only the marker from a real authenticated use now fails closed before sc1 eligibility can undercount;
- final accepted Candidate `c5c418a0c1227924abdac5de6707ebeacbe074a0` received `IMPLEMENTATION_ACCEPTED_CANDIDATE`; canonical same-attempt Coordinator relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/470#issuecomment-5858470246`;
- exact-Candidate Phase 3 Pre-Review Gate run `36339293812` succeeded;
- acceptance synchronization: `docs/reports/2026-09-28-p3-a-spartacus-seal-power-readiness-capability-acceptance-synchronization.md`;
- A-rescan confirms this batch closed the complete currently discoverable Spartacus sc1/sc3 generic seal-power gap set; sc2 remains covered by accepted FB2-48 and no additional owner-readiness blocker is present before formal consumer authoring;
- dedicated Spartacus seal-power readiness focused suite `20/20 PASS`;
- affected serial `10 files / 227 tests PASS`;
- typecheck PASS;
- content validate/compile PASS 閳?`7 masters / 12 servants / 20 events / 0 blocking issues`;
- generated determinism PASS with unchanged hashes;
- R3-predecessor-to-worktree `git diff --check` PASS;
- `data/authoring/**` delta EMPTY;
- production identity audit clean for Spartacus ids/names/card strings and `SkillLib`;
- detailed result: `docs/reports/2026-09-28-p3-b-spartacus-seal-power-readiness-capability-result.md`.

Accounting:
- strict formal accounting remains `137/944`, remaining `807`;
- historical Spartacus S2 remains preservation-only and is not re-counted;
- this readiness task is permanently zero-credit.

Allowed verdicts:
- `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`

## P3-A-SPARTACUS-SEAL-POWER-READINESS-CAPABILITY-ACCEPTANCE-SYNC

- PR #470 exact successor Candidate `c5c418a0c1227924abdac5de6707ebeacbe074a0` received `IMPLEMENTATION_ACCEPTED_CANDIDATE` from fresh independent R.
- Canonical same-attempt Coordinator relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/470#issuecomment-5858470246`.
- Accepted scope is the complete bounded zero-credit Spartacus sc1/sc3 seal-power readiness family only; `data/authoring/**` remains unchanged and no migration credit is added.
- R1/R2/R3 closure collectively authenticates physical normal/Ruler seal resources, grant/use provenance, exact marker reconciliation, replacement behavior, live aura, formula power, round lifecycle, and persisted corruption fail-closed boundaries.
- Exact-Candidate Phase 3 Pre-Review Gate run `36339293812` succeeded.
- Mechanical A-rescan finds no additional currently discoverable readiness gap for the three-skill Spartacus owner batch: sc1/sc3 now have accepted generic seal-power support and sc2 retains accepted FB2-48 support.
- Strict formal accounting remains `137/944`, remaining `807`; this readiness transaction is permanently zero-credit.
- Current owner remains `servant.spartacus`; execution returns immediately to `P3-S-OWNER-SPARTACUS-COMPLETE-MIGRATION` for sc1 + preservation-only sc2 + sc3 together. Do not advance owners.
- Detailed sync: `docs/reports/2026-09-28-p3-a-spartacus-seal-power-readiness-capability-acceptance-synchronization.md`.
## TASK P3-B-SPARTACUS-ACCEPTED-SEAM-RECOVERY

Owner: Codex B
Status: `SYNCHRONIZED`
Base: `128089a18341b41b663244f6b8b23088d237f6d8`
Classification: bounded zero-credit recovery/readiness prerequisite for current owner `servant.spartacus`

Recovery scope:
- restore the historically accepted FB2-27 identity-free Ruler seal subsystem from accepted Revision Candidate `e30e7efef3cf9fc111236599441e5a869f4bc81a` / acceptance sync `1ef03961`;
- restore the historically accepted FB2-48 identity-free combat-opponent frozen-power VP reward from accepted Candidate `14c8688c201d4d39a85843470be6b79eec01853d` / canonical reviewer evidence `https://github.com/binchen648/fd/pull/413#issuecomment-5754051359` / acceptance sync `ff6aeba3`;
- adapt only the generic integration wiring required by the evolved current runtime; do not redefine either accepted dedicated semantic envelope;
- keep `data/authoring/**` unchanged and grant zero migration credit;
- no Spartacus identity/name/printed-text routing, no runtime Chinese parsing, and no SkillLib fallback;
- after fresh R acceptance, A-sync/rescan and return to `P3-S-OWNER-SPARTACUS-COMPLETE-MIGRATION`; do not advance owners.

Verification evidence:
- Ruler seal focused `13/13 PASS`;
- FB2-48 focused `10/10 PASS`;
- affected serial `8 files / 176 tests PASS`;
- R1 predecessor Candidate `4a07140a75600f2128dab17cce264f78beae3ea4` received `IMPLEMENTATION_NEEDS_REVISION`; canonical same-attempt evidence `https://github.com/binchen648/fd/pull/469#issuecomment-5857074164`;
- R1 P1 closed: least-bound discovery and final ordered settlement now consume one shared immunity-filtered active-opponent domain; historical default helper behavior remains unchanged when no explicit domain is provided;
- focused immunity regression reproduces `p2=0,p3=1,p4=1` with immune p2, excludes p2 from the pending decision, exposes p3/p4, and successfully settles `[p3,p4]`;
- R2 predecessor Candidate `49d940a2536de55a7ed87fc26045557fc0c51358` received `IMPLEMENTATION_NEEDS_REVISION`; canonical same-attempt evidence `https://github.com/binchen648/fd/pull/469#issuecomment-5857199684`;
- R2 P1 closed: stale byte-equivalence provenance is removed; `e30e7efe` remains the accepted semantic baseline, while the current successor truthfully records the bounded optional eligibility-domain extension added by R1 and preserves zero-credit/no-consumer scope;
- final accepted successor Candidate `d12596998bc4d3a45494e84b107e2577d8e445c4` received `IMPLEMENTATION_ACCEPTED_CANDIDATE`; canonical same-attempt evidence `https://github.com/binchen648/fd/pull/469#issuecomment-5857358441`;
- acceptance synchronization: `docs/reports/2026-09-27-p3-a-spartacus-accepted-seam-recovery-acceptance-synchronization.md`;
- typecheck PASS;
- content validate/compile PASS 閳?`7 masters / 12 servants / 20 events / 0 blocking issues`;
- generated determinism PASS with unchanged hashes;
- Base-to-worktree `git diff --check` PASS;
- `data/authoring/**` delta EMPTY;
- production identity audit clean for `servant.spartacus`, `sc-spartacus`, Chinese owner/card names, and `SkillLib`;
- detailed result: `docs/reports/2026-09-27-p3-b-spartacus-accepted-seam-recovery-result.md`.

Accounting:
- strict formal accounting remains `137/944`, remaining `807`;
- historical Spartacus S2 credit remains preservation-only and is not re-counted;
- this recovery task is permanently zero-credit.

Allowed verdicts:
- `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`

## TASK P3-B-SKADI-RUNE-CASTLE-READINESS-CAPABILITY

Owner: Codex B
Status: `IMPLEMENTATION_REVISION_READY_FOR_FRESH_R`
Base: `44bf45f39c6adc2b419527f96d4257aea4080bb8`
Classification: bounded zero-credit capability/readiness prerequisite for current owner `servant.skadi`

Bounded scope:
- exact generic current-round two-distinct-basic-attack attribute-pair predicate for the rune attributes 鏉╁懏宓?/ 姒勬梹婀?/ 閻楄鐣?
- exact private outpost continuation: fixed 1-mana cost, draw one, then choose exactly two controller hand cards and shuffle them into deck;
- exact fixed-3-mana same-location other-active-player mana-loss shell with once-this-round structured-flag gating;
- exact armed same-round combat shell that defeats the unique active opponent at the controller battlefield and consumes the structured arm flag;
- exact residual active-source location aura that forbids positive mana gain for other active players at that live source location;
- exact active-source outpost attribute choice that applies a source-bound current-round x2 base-power multiplier to matching basic attacks at the live source location;
- authenticated restore/settlement validation for the private continuation and source-bound multiplier state.

Hard scope boundary:
- zero Skadi consumer authoring and zero migration credit in this task;
- `data/authoring/**` delta must remain empty;
- no `servant.skadi` / skill-id / card-name / printed-text / Chinese-text identity routing in production runtime;
- no SkillLib fallback and no runtime source-text parsing;
- widened/nested privileged primitives and compiled-pack corruption fail closed via exact whole-ability loader/runtime gates;
- ACCEPTED must A-sync/rescan and return to `P3-S-OWNER-SKADI-COMPLETE-MIGRATION` for all three Skadi identities together; it cannot advance owners.

Source-grounded requirement:
- frozen CHM-derived source text and locked Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9` were mechanically re-read;
- sc-skadi-1 outpost is pay 1 mana -> draw one -> shuffle exactly two hand cards into deck;
- sc-skadi-1 Action rune selection derives combinations from two distinct current-round basic attacks and pays 3 mana;
- missing generic seams are limited to same-location -2 mana, same-round armed unique-opponent defeat, active-source same-location mana-gain forbid, and source-location selected-attribute basic base-power x2; movement, hand attack play, terrain/deployment multiplication, and +4 VP remain outside this capability because existing generic primitives can express them.

Evidence: `docs/reports/2026-09-27-p3-b-skadi-rune-castle-readiness-capability-result.md`.

R1 closure:
- predecessor Candidate `ae5647871bedf3c2fcc143975bbcd7854d8ff5aa` received `IMPLEMENTATION_NEEDS_REVISION`; canonical same-attempt evidence `https://github.com/binchen648/fd/pull/466#issuecomment-5854462673`;
- P1 closed: post-draw shuffle now requires a nonempty controller deck before activation and rechecks that source-grounded legality before draw/continuation staging, so generic discard reshuffle cannot substitute for the locked Reference nonempty-deck prerequisite;
- P2 closed: authoritative `getLegalActions` now preflights the exact fixed mana cost for both pay-1 post-draw shuffle and pay-3 same-location mana-loss rune shells; unaffordable direct dispatch remains rejected;
- R2 predecessor Candidate `102193c0fbf7aaa80772676e1fe2828e32e3ee0e` received one additional `IMPLEMENTATION_NEEDS_REVISION`; canonical same-attempt evidence `https://github.com/binchen648/fd/pull/466#issuecomment-5854627654`;
- R2 P1 closed: fixed-cost affordability remains pre-payment authority only; the post-draw execution path no longer asks for a second remaining mana after cost consumption, while nonempty-deck execution revalidation stays fail closed. Exactly 1 starting mana is now legal, executes to the private continuation, and ends at 0 mana;
- focused closure `12/12 PASS`; affected serial closure `10 files / 182 tests PASS`.

Typecheck/content validate/content compile/generated determinism/diff-check PASS; `data/authoring/**` delta empty; production Skadi/SkillLib identity audit clean.

Formal accounting remains `134/944`; remaining `810`. This task is permanently zero-credit.
## TASK P3-B-STHENO-DIVINE-CORE-READINESS-CAPABILITY

Owner: Codex B
Status: `SYNCHRONIZED`
Base: `e3c61d74be6b02b186875e31191e416fc364e179`
Classification: bounded zero-credit owner-readiness prerequisite for current owner `servant.stheno`

Complete owner-readiness preflight:
- sc1 has historical formal FM06 Presence Concealment acceptance and requires no new readiness capability;
- sc2 has generic support for its separate `after_controller_wins_battle` / `event_player_won_combat` / `adjust_victory_points` +1 VP branch, but locked Reference also requires authoritative winner reward replacement (`operation=replace`, `rule=combat_reward_distribution`, `mode=full_reward_each`);
- sc3 Divine Core is accepted by this identity-free battle Luck-close/refund/draw/immediate-play readiness family;
- mandatory post-acceptance A-rescan supersedes the earlier assumption above: exact accepted Candidate `5d7ec79524b577dcd729ae7bc93d905343bd3e1f` still lacks an accepted `combat_reward_distribution/full_reward_each` settlement seam, so formal Stheno migration remains blocked on one final bounded sc2 readiness capability.

Bounded scope:
- exact active-source combat whole-ability gateway;
- one owned Luck discard, deterministic engaged-opponent turn order, at most one eligible non-per-game attack close per opponent;
- refund each affected opponent the closed card effective cost and draw exactly one;
- optional turn-order immediate play of the exact drawn card plus bounded current-round combat permission for that card's Action ability;
- private transaction/continuation serialization, restore authentication, exact completed-play provenance, corruption fail-closed, and compiled-pack fail-closed;
- no Stheno consumer authoring and zero migration credit.

Hard boundary:
- `data/authoring/**` delta EMPTY;
- no `servant.stheno`, `sc-stheno`, card-name/printed-text/Chinese identity routing in production runtime;
- no runtime source-text parsing and no `SkillLib` fallback;
- ACCEPTED must A-sync/rescan and return to the same Stheno formal owner; do not advance owners.

Verification evidence:
- focused Divine Core readiness `15/15 PASS`;
- current R3 affected serial `7 files / 105 tests PASS`;
- typecheck PASS;
- content validate/compile PASS 閳?`7 masters / 12 servants / 20 events / 0 blocking issues`;
- generated determinism PASS with unchanged hashes;
- `git diff --check` PASS;
- `data/authoring/**` delta EMPTY;
- production identity audit clean for Stheno ids/names and `SkillLib`;
- predecessor Candidate `31e607db8be27d505d808d380cee22a0a92769a5` received `IMPLEMENTATION_NEEDS_REVISION`; canonical same-attempt Coordinator relay after Reviewer 403: `https://github.com/binchen648/fd/pull/472#issuecomment-5859558471`;
- P1 restore-provenance closure: Divine Core draw/immediate-play authority is now host-secret HMAC sealed outside mutable GameState, pending rewards/history/combat permission must exactly match that authority on current/replay/checkpoint restore, and forged pending-draw substitution plus forged completed-history/permission regressions fail closed;
- P1 continuation closure: immediately played cards may open ordinary on-card-played response/nested decision work; Divine Core pauses while pending decisions/response windows/host requests exist and resumes only after ordinary work settles;
- P2 lifetime closure: immediate-play history, combat Action permission, and corresponding authority retire at the next authoritative round; a two-round replay of the same physical card restores successfully after ordinary legal replay;
- successor Candidate `dfa48bf26697a717fa6e8101a5a44e489b5e6552` received `IMPLEMENTATION_NEEDS_REVISION`; canonical same-attempt Coordinator relay after Reviewer 403: `https://github.com/binchen648/fd/pull/472#issuecomment-5862289311`;
- R2 P1 transaction closure: draw authority now carries exact per-activation transaction identity, retires at settlement, permits a second legal same-round activation, and rejects authenticated orphan draw authority if unresolved transaction/decision state is forged away;
- R2 P1 root-replacement closure: `stepGameLoop` carries the server-only authority across task-relevant GameState root replacements; completed Divine Core history/permission survives battle -> cleanup and MatchSession round-trip;
- successor Candidate `54baf0b188114c2fe9f690a339a71a0a620379a1` received `IMPLEMENTATION_NEEDS_REVISION`; canonical same-attempt Coordinator relay after Reviewer 403: `https://github.com/binchen648/fd/pull/472#issuecomment-5866671116`;
- R3 P1 ordinary-new-round closure: `stepGameLoop` now passes the previous root round into `advanceAbilityPhase`, so normal `round_end -> round_start` retires prior-round Divine Core immediate-play history, temporary combat Action permission, and server-only authority exactly once before persistence validation; the production-path regression advances legal Divine Core state through battle -> cleanup -> round_end -> round_start and restores successfully;
- R3 verification: focused `15/15 PASS`; affected `7 files / 105 tests PASS`; typecheck/content validate/content compile/generated determinism/diff-check PASS; `data/authoring/**` delta EMPTY.
- final accepted Candidate `5d7ec79524b577dcd729ae7bc93d905343bd3e1f` received `IMPLEMENTATION_ACCEPTED_CANDIDATE`; canonical bounded same-attempt evidence-reference correction: `https://github.com/binchen648/fd/pull/472#issuecomment-5867235240`;
- exact-Candidate Phase 3 Pre-Review Gate run `36402342635` succeeded;
- acceptance synchronization: `docs/reports/2026-09-28-p3-a-stheno-divine-core-readiness-capability-acceptance-synchronization.md`;
- A-rescan mechanically confirms sc2 `combat_reward_distribution/full_reward_each` remains a real owner-local readiness gap on the accepted runtime; formal consumer authoring is not yet authorized.
- detailed result: `docs/reports/2026-09-28-p3-b-stheno-divine-core-readiness-capability-result.md`.

Accounting:
- strict formal accounting remains `139/944`, remaining `805`;
- this readiness task is permanently zero-credit.

Allowed verdicts:
- `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`

## P3-A-STHENO-DIVINE-CORE-READINESS-CAPABILITY-ACCEPTANCE-SYNC

- PR #472 exact successor Candidate `5d7ec79524b577dcd729ae7bc93d905343bd3e1f` received `IMPLEMENTATION_ACCEPTED_CANDIDATE` from the already-completed fresh independent R.
- Canonical same-attempt evidence-reference correction: `https://github.com/binchen648/fd/pull/472#issuecomment-5867235240`; the Reviewer-returned URL `#issuecomment-5866671116` mechanically resolves to predecessor `54baf0b...` `IMPLEMENTATION_NEEDS_REVISION` and is not used as accepted-Candidate evidence.
- Accepted scope is only the bounded zero-credit Stheno sc3 Divine Core readiness family; `data/authoring/**` remains unchanged and no migration credit is added.
- Exact-Candidate Phase 3 Pre-Review Gate run `36402342635` succeeded.
- Helper prework `.fd-helper-reports/latest.md` was read as non-authoritative planning material and mechanically revalidated against locked Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9` plus the accepted runtime.
- Mechanical A-rescan confirms sc1 remains historical FM06 accepted; sc3 is now readiness-accepted; sc2's separate +1 VP branch is already expressible, but its source-grounded winner reward replacement is not.
- Locked Reference sc2 uses exact `operation=replace`, `rule=combat_reward_distribution`, `scope.whenControllerWins=true`, `scope.mode=full_reward_each`; Reference combat settlement applies that semantic before reward splitting.
- Accepted current runtime has no `combat_reward_distribution` / `full_reward_each` seam: loader ruleModifier operation allowlist excludes `replace`, rule allowlist excludes `combat_reward_distribution`, and current combat resolver splits event/competition/location reward pools per winner before post-result ability events.
- Therefore direct Stheno owner-complete consumer authoring remains blocked. The remaining complete owner-local readiness gap set contains exactly one bounded sc2 reward-distribution family.
- Strict formal accounting remains `139/944`, remaining `805`; this readiness synchronization is permanently zero-credit.
- Current owner remains `servant.stheno`; do not advance owners. Next task is `P3-B-STHENO-FULL-REWARD-EACH-READINESS-CAPABILITY`. After that capability is ACCEPTED + A-sync/rescan, return to one formal Stheno owner-complete migration containing sc1 + sc2 + sc3 together.
- Detailed sync: `docs/reports/2026-09-28-p3-a-stheno-divine-core-readiness-capability-acceptance-synchronization.md`.

## TASK P3-B-STHENO-FULL-REWARD-EACH-READINESS-CAPABILITY

Owner: Codex B
Status: `SYNCHRONIZED`
Base: `f2029ede09c7dbe61119836c4c349fce3753d8fb`
Classification: bounded zero-credit owner-readiness prerequisite for current owner `servant.stheno`

Complete remaining owner-local gap:
- add one identity-free exact reward-distribution replacement seam matching locked Reference sc2 semantics: when an eligible controller is among battle winners, all winners receive the full corresponding battle reward instead of splitting it;
- preserve the separate already-supported Stheno +1 VP win branch outside this capability;
- integrate at authoritative combat reward calculation before per-winner split so event, competition, and location reward components match source-grounded full-reward-each semantics;
- reductions/forbids that legally apply after reward calculation must remain effective; do not implement this as a fixed post-scoring VP bonus;
- exact whole-shape loader/runtime validation must fail closed for wrong operation/rule/mode/controller-win scope or widened near-match shapes.

Hard boundary:
- identity-free generic runtime only; no Stheno consumer authoring and zero migration credit;
- `data/authoring/**` delta must remain empty;
- no `servant.stheno`, `sc-stheno`, card-name, printed-text, or Chinese identity routing in production runtime;
- no runtime source-text parsing and no `SkillLib` fallback;
- this is the sole remaining gap discovered by the complete accepted-runtime A-rescan; do not split it into smaller review loops;
- ACCEPTED must A-sync/rescan and return to the same Stheno formal owner; do not advance owners.

Required verification:
- exact Reference-shaped loader acceptance and widened/near-match rejection;
- multi-winner battle proves every winner receives the unsplit reward while default battles continue to split normally;
- provider/controller must actually satisfy the source-grounded winner/source eligibility boundary;
- event/competition/location reward components are covered, including interaction with existing reward adjustments/reductions where applicable;
- affected focused tests, typecheck, content validate/compile, generated determinism, production identity audit, and `git diff --check`;
- exact Candidate Phase 3 gate and fresh independent R.

Verification evidence:
- locked Reference HEAD mechanically confirmed `b2f9fa15fba07c63530bbf4612b03b8b704755f9` and exact sc2 `replace / combat_reward_distribution / controller+winner / full_reward_each` source shape re-read;
- focused full-reward-each readiness `7/7 PASS`;
- directly affected serial `5 files / 138 tests PASS` with one worker: focused `7`, combat-resolver `10`, authoring-interpreter `38`, executable-card-pack `50`, MatchSession `33`;
- typecheck PASS;
- content validate/compile PASS 閳?`7 masters / 12 servants / 20 events / 0 blocking issues`;
- generated determinism PASS with unchanged hashes;
- `FD_TOOLCHAIN_OK`;
- `git diff --check` PASS;
- `data/authoring/**` delta EMPTY;
- production identity audit CLEAN for `servant.stheno`, `sc-stheno`, Stheno/printed-name routing, and `SkillLib` in changed runtime files;
- exact Reference-minimal raw passive shape loads, while wrong operation/rule/mode/controller-win scope, missing modifier identity, widened scope/execution, extra conditions/effects, non-passive kind, and nonempty host operations fail closed;
- authoritative multi-winner settlement proves full event + competition + location pools for every winner; absent/losing/face-down/inactive providers preserve ordinary split behavior;
- downstream negative `vpAdjustments` still apply after full-reward replacement, preserving the existing reduction/adjustment path instead of bypassing it;
- detailed result: `docs/reports/2026-09-28-p3-b-stheno-full-reward-each-readiness-capability-result.md`.

Accounting:
- strict formal accounting remains `139/944`, remaining `805`;
- this readiness task is permanently zero-credit.
Allowed verdicts:
- `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`

## P3-A-STHENO-FULL-REWARD-EACH-READINESS-CAPABILITY-ACCEPTANCE-SYNC

- PR #474 exact Candidate `4dd8eca5746d63d72c7906716cb7118e2569872a` received `IMPLEMENTATION_ACCEPTED_CANDIDATE` from fresh independent R.
- Canonical same-attempt Coordinator relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/474#issuecomment-5871992188`.
- Accepted scope is only the bounded zero-credit `combat_reward_distribution/full_reward_each` readiness seam; `data/authoring/**` remains unchanged and no migration credit is added.
- Exact-Candidate Phase 3 Pre-Review Gate run `36420973246` succeeded.
- Mechanical A-rescan closes the complete currently discoverable Stheno readiness gap set: sc1 remains historical FM06 accepted; sc2 now has accepted generic win/+1 plus accepted full-reward-each settlement support; sc3 has accepted Divine Core readiness from PR #472.
- Helper PRE-R material is auxiliary only and grants no verdict/credit; fresh R accepted the exact PR #474 Candidate with no exact-scope blocker.
- Strict formal accounting remains `139/944`, remaining `805`; this readiness transaction is permanently zero-credit.
- Current owner remains `servant.stheno`; execution returns immediately to `P3-S-OWNER-STHENO-COMPLETE-MIGRATION` for sc1 + sc2 + sc3 together. sc1 is preservation-only; sc2/sc3 are the only newly creditable identities. Do not advance owners.
- Detailed sync: `docs/reports/2026-09-28-p3-a-stheno-full-reward-each-readiness-capability-acceptance-synchronization.md`.

## TASK P3-S-OWNER-STHENO-COMPLETE-MIGRATION

Owner: Codex S
Status: `SYNCHRONIZED`
Base: `9fd9036c6d74427f88b3b268f9ef2916cf3f3beb`
Classification: formal owner-complete migration for current owner `servant.stheno`

Formal owner scope:
- `servant.stheno.skill.sc-stheno-1` 閳?historical FM06 accepted preservation only; no duplicate credit;
- `servant.stheno.skill.sc-stheno-2` 閳?newly creditable;
- `servant.stheno.skill.sc-stheno-3` 閳?newly creditable;
- one owner archive, one formal Candidate, one PR, one fresh R, then one A-sync/accounting transaction.

Accepted prerequisites:
- sc1 historical FM06 S Candidate `ebc1ca575fcef0e3894b13ec10613801e4227970`, independently accepted by R36 on A-synchronized lineage `34f891a7739e86b835bc78e65aa58fdf5f4e955a`;
- sc2 full-reward-each readiness PR #474 exact accepted Candidate `4dd8eca5746d63d72c7906716cb7118e2569872a`, canonical relay `https://github.com/binchen648/fd/pull/474#issuecomment-5871992188`;
- sc3 Divine Core readiness PR #472 final accepted Candidate `5d7ec79524b577dcd729ae7bc93d905343bd3e1f`, canonical accepted-candidate evidence correction `https://github.com/binchen648/fd/pull/472#issuecomment-5867235240`;
- exact formal Base `9fd9036c6d74427f88b3b268f9ef2916cf3f3beb` is the post-#474 zero-credit A-sync/rescan and closes the complete discoverable Stheno readiness gap set.

Implementation/evidence:
- canonical `data/authoring/servants/servant.stheno.json` contains exactly sc1 + sc2 + sc3;
- sc1 card object is exact JSON-object-equal to Base; SHA-256 `201bbac3a5181d19d4d162936bcc0b5bc422a0aef341657bb2ac028a2aa97229`;
- material overlap `140 -> 142`, exact additions sc2 + sc3, removals `0`, duplicate frozen identities `0`;
- formal credit claim remains exactly `+2` (sc2 + sc3) because sc1 is historical accepted preservation and material overlap is not the formal ledger;
- focused/affected serial `8 files / 147 tests PASS`;
- typecheck PASS; content validate/compile PASS (`7 masters / 12 servants / 20 events / 0 blocking issues`); generated determinism PASS; `git diff --check` PASS;
- `packages/rules/src/**` production runtime delta EMPTY; no identity routing, runtime source-text parsing, or `SkillLib` fallback added;
- official full probe: Candidate worktree `1166 PASS / 17 FAIL`; exact Base independently reproduces the `12` tracked failures, while the additional five failures are from ignored/untracked `.fd-shiki-runtime-debug.test.ts` and are not Candidate content;
- complementary run excluding only the seven mechanically reproduced Base-debt files plus the ignored debug file: `153 files / 1084 tests PASS`;
- detailed result: `docs/reports/2026-09-29-p3-s-owner-stheno-complete-migration-result.md`.

Accounting boundary:
- strict formal accounting is still `139/944`, remaining `805` before fresh R and A-sync;
- no credit before exact-Candidate `MIGRATION_ACCEPTED` plus subsequent A-sync/accounting;
- accepted synchronized outcome may add exactly sc2 + sc3 and move strict formal accounting to `141/944`, remaining `803`;
- do not advance owners before this owner batch is reviewed and synchronized.

Allowed verdicts:
- `MIGRATION_ACCEPTED`
- `MIGRATION_NEEDS_REVISION`
- `MIGRATION_BLOCKED`

Acceptance synchronization:
- PR #475 exact Candidate `fe4653d1013110555881585db3a447880dd463d3` received `MIGRATION_ACCEPTED` from fresh independent R.
- Canonical same-attempt Coordinator relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/475#issuecomment-5875080153`.
- Exact-Candidate Phase 3 Pre-Review Gate `36452063768` succeeded.
- Accepted owner-complete scope is exactly sc1 + sc2 + sc3; sc1 remains historical FM06 preservation-only and sc2/sc3 are the only newly creditable identities.
- Formal accounting moves `139/944 -> 141/944`; remaining `803`; sc1 receives no duplicate credit.
- Acceptance synchronization report: `docs/reports/2026-09-29-p3-a-owner-stheno-acceptance-synchronization.md`.
- Mechanical first-occurrence owner ordering selects `servant.suzuka` next: Stheno index `237`, Suzuka index `238` of `251` owners.
- Owner-readiness-first remains mandatory: complete one full Suzuka preflight before any Suzuka formal consumer migration.

## TASK P3-B-SUZUKA-OWNER-READINESS-CAPABILITY

Owner: Codex B
Status: `SYNCHRONIZED`
Base: `f47b3354e9dfe5c9b4777d2fbd40dd9e06f2a1a3`
Classification: bounded zero-credit owner-readiness capability for current owner `servant.suzuka`

Full-owner preflight:
- frozen F1 owner set is exactly sc1 + sc2 + sc3;
- at Base all three are `currentRoute=none` with no inherited/partial accepted current contract and no canonical authoring consumer;
- the locked Reference identity handler `core.suzuka-package` is evidence only and must not be restored into production;
- one complete compatible readiness gap set is closed together, not one skill/one PR.

Readiness scope:
- exact automatic recycle/keep-up-to-three + named-counter gain semantic;
- exact spend-one-counter/current-round battle-loss-ignore semantic;
- exact X=0..2 discard-basic replay/pay-normal-cost/physical-card battle-return semantic;
- exact physical-card permanent replay-cost growth + top-three printed-Power-4/current-cost round-Power semantic;
- exact loader fail-closed gateways, interaction persistence/provenance, battle settlement integration, and identity audit;
- no `data/authoring/**` consumer migration in this task.

Verification:
- focused `8/8 PASS`;
- directly affected `7 files / 169 tests PASS`;
- `FD_TOOLCHAIN_OK`;
- typecheck PASS;
- content validate/compile PASS (`7 masters / 12 servants / 20 events / 0 blocking issues`);
- generated determinism PASS with unchanged hashes;
- `data/authoring/**` delta EMPTY;
- production identity audit CLEAN;
- `git diff --check` PASS;
- detailed result: `docs/reports/2026-09-29-p3-b-suzuka-owner-readiness-capability-result.md`.

Accounting:
- strict formal accounting remains `141/944`, remaining `803`;
- this task is permanently zero-credit;
- accepted readiness must A-sync/rescan and return immediately to `servant.suzuka` for one owner-complete formal sc1+sc2+sc3 Candidate.

Allowed verdicts:
- `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`
Acceptance synchronization:
- exact accepted Candidate: `104fcf4e5b2a2e19ca1222b0fe89b0ed78b309b5`;
- canonical fresh-R evidence: `https://github.com/binchen648/fd/pull/476#issuecomment-5876614417`;
- verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`;
- exact Base -> Candidate lineage and Phase 3 Gate remain accepted;
- full-owner readiness rescan closes the complete currently discoverable Suzuka gap set across sc1 + sc2 + sc3;
- no additional bounded readiness PR is authorized unless owner-complete formal mechanically exposes a genuinely new source-grounded blocker;
- formal accounting remains `141/944`, remaining `803` because readiness is zero-credit;
- next task is `P3-S-OWNER-SUZUKA-COMPLETE-MIGRATION` with sc1 + sc2 + sc3 together in one formal Candidate/PR/fresh R/A-sync sequence;
- acceptance synchronization report: `docs/reports/2026-09-29-p3-a-suzuka-owner-readiness-capability-acceptance-synchronization.md`.
## TASK P3-S-OWNER-SUZUKA-COMPLETE-MIGRATION

Owner: Codex S
Status: `SYNCHRONIZED`
Base: `d5bd1da1f812f6def3b243a91d09f418067157bc`
Classification: formal owner-complete migration for current owner `servant.suzuka`

Formal owner scope:
- `servant.suzuka.skill.sc-suzuka-1` 閳?newly creditable;
- `servant.suzuka.skill.sc-suzuka-2` 閳?newly creditable;
- `servant.suzuka.skill.sc-suzuka-3` 閳?newly creditable;
- one owner archive, one formal Candidate, one PR, one fresh R, then one A-sync/accounting transaction.

Accepted prerequisite:
- readiness PR #476 exact Candidate `104fcf4e5b2a2e19ca1222b0fe89b0ed78b309b5`;
- fresh-R verdict `IMPLEMENTATION_ACCEPTED_CANDIDATE`;
- canonical same-attempt terminal evidence `https://github.com/binchen648/fd/pull/476#issuecomment-5876614417`;
- exact zero-credit A-sync/formal Base `d5bd1da1f812f6def3b243a91d09f418067157bc` closes the complete currently discoverable Suzuka readiness gap set.

Implementation/evidence:
- canonical `data/authoring/servants/servant.suzuka.json` contains exactly sc1 + sc2 + sc3;
- frozen material overlap `142 -> 145`, exact additions sc1 + sc2 + sc3, removals `0`, duplicate frozen identities `0`;
- formal credit claim is exactly `+3` only after fresh R + A-sync;
- focused owner-complete `6/6 PASS`;
- directly affected serial `7 files / 160 tests PASS`;
- typecheck PASS; content validate/compile PASS (`7 masters / 12 servants / 20 events / 0 blocking issues`); generated determinism PASS; `git diff --check` PASS;
- `packages/rules/src/**` production runtime delta EMPTY; no identity routing, runtime source-text parsing, legacy `core.suzuka-package`, or `SkillLib` fallback added;
- exact Base A/B reproduces the stable project-wide tracked debt; Candidate-only timeout probes pass standalone (`complex-skills 37/37`, affected MatchSession `33/33`);
- detailed result: `docs/reports/2026-09-29-p3-s-owner-suzuka-complete-migration-result.md`.

Accounting boundary:
- strict formal accounting remains `141/944`, remaining `803` before fresh R and A-sync;
- no credit before exact-Candidate `MIGRATION_ACCEPTED` plus subsequent A-sync/accounting;
- accepted synchronized outcome may add exactly sc1 + sc2 + sc3 and move strict formal accounting to `144/944`, remaining `800`;
- do not advance owners before this owner batch is reviewed and synchronized.

Allowed verdicts:
- `MIGRATION_ACCEPTED`
- `MIGRATION_NEEDS_REVISION`
- `MIGRATION_BLOCKED`
Acceptance synchronization:
- PR #477 exact Candidate `86a5e01dfe685405800ca43dc3c8e29e1b1ea8dd` received `MIGRATION_ACCEPTED` from fresh independent R.
- Canonical same-attempt Coordinator bounded relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/477#issuecomment-5877443591`.
- Exact-Candidate Phase 3 Pre-Review Gate `36475123257` succeeded.
- Accepted owner-complete scope is exactly Suzuka sc1 + sc2 + sc3; all three are newly creditable.
- Formal accounting moves `141/944 -> 144/944`; remaining `800`.
- Acceptance synchronization report: `docs/reports/2026-09-29-p3-a-owner-suzuka-acceptance-synchronization.md`.
- Mechanical first-occurrence owner ordering selects `servant.taisui` next: Suzuka index `238`, Taisui index `239` of `251` owners.
- Owner-readiness-first remains mandatory: complete one full Taisui preflight before any Taisui formal consumer migration.

## TASK P3-B-TAISUI-OWNER-READINESS-CAPABILITY

Owner: Codex B
Status: `SYNCHRONIZED`
Base: `9eed6f832fbc7ec00368e688b43d0020b04f804d`
Classification: bounded zero-credit owner-readiness capability for current owner `servant.taisui`

Full-owner preflight:
- frozen owner set is exactly sc1 + sc2 + sc3;
- sc1 is historical accepted FM07 material and preservation-only;
- sc2 + sc3 have no canonical consumer at Base;
- one compatible location-marker readiness family blocks sc2 + sc3 and must be closed together before formal migration.

Readiness scope:
- authoritative persisted per-controller/source location marker keyed by validated semantic marker key;
- opponent-departure marker follow with exact previous-location provenance and live owned source;
- normal +3 marker-bound terrain branch and reversed per-player 1 VP transfer branch;
- normal Outpost marker placement;
- reversed Action graph-distance-2 unique-midpoint convergence, true-name reveal and ordinary defeatable Defeat;
- exact restore/provenance/revision validation, stale/repeat fail-closed behavior, root-state persistence and identity-free loader gateway;
- no Taisui consumer authoring, no card/character IDs or printed-text parsing in production runtime.

Verification:
- focused `10/10 PASS`;
- directly affected `10 files / 171 tests PASS`;
- `FD_TOOLCHAIN_OK`;
- typecheck PASS;
- content validate/compile PASS (`7 masters / 12 servants / 20 events / 0 blocking issues`);
- generated determinism PASS;
- `data/authoring/**` delta EMPTY;
- production identity audit CLEAN;
- `git diff --check` PASS;
- detailed result: `docs/reports/2026-09-29-p3-b-taisui-owner-readiness-capability-result.md`.

Accounting:
- strict formal accounting remains `144/944`, remaining `800`;
- this task is permanently zero-credit;
- ACCEPTED must A-sync/rescan and return to the same Taisui owner for one owner-complete formal batch containing preserved sc1 + new sc2 + sc3.

Allowed verdicts:
- `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`
Acceptance synchronization:
- PR #478 exact Candidate `3f6bc546406aa7efc7d5229cd3255109db218026` received `IMPLEMENTATION_ACCEPTED_CANDIDATE` from fresh independent R.
- Canonical same-attempt Coordinator bounded relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/478#issuecomment-5878360467`.
- Exact-Candidate Phase 3 Pre-Review Gate `36481379018` succeeded.
- Accepted readiness remains permanently zero-credit; strict formal accounting stays `144/944`, remaining `800`.
- Full-owner A-rescan confirms no additional currently discoverable Taisui readiness gap remains beyond the accepted location-marker family.
- sc1 remains historical accepted preservation-only; sc2 + sc3 are the only newly creditable identities in the upcoming formal owner batch.
- Next task is `P3-S-OWNER-TAISUI-COMPLETE-MIGRATION`, containing preserved sc1 + new sc2 + sc3 together in one formal Candidate/PR/fresh R/A-sync sequence.
- Acceptance synchronization report: `docs/reports/2026-09-29-p3-a-taisui-owner-readiness-capability-acceptance-synchronization.md`.
## TASK P3-S-OWNER-TAISUI-COMPLETE-MIGRATION

Owner: Codex S
Status: `SYNCHRONIZED`
Base: `75df6b701feb5d614184ba235517b67eea283260`
Classification: formal owner-complete migration for current owner `servant.taisui`

Formal owner scope:
- `servant.taisui.skill.sc-taisui-1` 閳?historical FM07 preservation-only, no new credit;
- `servant.taisui.skill.sc-taisui-2` 閳?newly creditable;
- `servant.taisui.skill.sc-taisui-3` 閳?newly creditable;
- one owner archive, one formal Candidate, one PR, one fresh R, then one A-sync/accounting transaction.

Accepted prerequisite:
- readiness PR #478 exact Candidate `3f6bc546406aa7efc7d5229cd3255109db218026`;
- fresh-R verdict `IMPLEMENTATION_ACCEPTED_CANDIDATE`;
- canonical same-attempt bounded relay `https://github.com/binchen648/fd/pull/478#issuecomment-5878360467`;
- exact zero-credit A-sync/formal Base `75df6b701feb5d614184ba235517b67eea283260` closes the complete currently discoverable Taisui readiness gap set.

Implementation/evidence:
- canonical `data/authoring/servants/servant.taisui.json` contains preserved sc1 plus new sc2 + sc3;
- sc1 JSON object is byte-semantically preserved from Base;
- frozen material overlap `145 -> 147`, exact additions sc2 + sc3, removals `0`, duplicate frozen identities `0`;
- formal credit claim is exactly `+2` only after fresh R + A-sync;
- focused owner-complete `6/6 PASS`;
- directly affected serial `10 files / 171 tests PASS`;
- timeout probes `match-session 33/33` + `complex-skills 37/37` PASS standalone;
- typecheck PASS; content validate/compile PASS (`7 masters / 12 servants / 20 events / 0 blocking issues`); generated determinism PASS; `git diff --check` PASS;
- `packages/rules/src/**` production runtime delta EMPTY; no identity routing, runtime source-text parsing, legacy Taisui handler, or `SkillLib` fallback added;
- exact Base A/B reproduces all stable full-suite failures; Candidate-only extra failures are from local ignored `.fd-shiki-runtime-debug.test.ts`, not Candidate content;
- detailed result: `docs/reports/2026-09-29-p3-s-owner-taisui-complete-migration-result.md`.

Accounting boundary:
- strict formal accounting remains `144/944`, remaining `800` before fresh R and A-sync;
- no credit before exact-Candidate `MIGRATION_ACCEPTED` plus subsequent A-sync/accounting;
- accepted synchronized outcome may add exactly sc2 + sc3 and move strict formal accounting to `146/944`, remaining `798`;
- do not advance owners before this owner batch is reviewed and synchronized.

Allowed verdicts:
- `MIGRATION_ACCEPTED`
- `MIGRATION_NEEDS_REVISION`
- `MIGRATION_BLOCKED`
Acceptance synchronization:
- PR #479 exact Candidate `8a61b92476ee588f8b5c051a57a7f34988a78e5b` received `MIGRATION_ACCEPTED` from fresh independent R.
- Canonical same-attempt Coordinator bounded relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/479#issuecomment-5881546976`.
- Exact-Candidate Phase 3 Pre-Review Gate `36484122047` succeeded.
- Accepted owner-complete scope is exactly Taisui sc1 + sc2 + sc3; sc1 remains historical FM07 preservation-only and sc2/sc3 are the only newly creditable identities.
- Formal accounting moves `144/944 -> 146/944`; remaining `798`; sc1 receives no duplicate credit.
- Acceptance synchronization report: `docs/reports/2026-09-29-p3-a-owner-taisui-acceptance-synchronization.md`.
- Mechanical first-occurrence owner ordering selects `servant.tamamo` next: Taisui index `239`, Tamamo index `240` of `251` owners.
- Owner-readiness-first remains mandatory: complete one full Tamamo preflight before any Tamamo formal consumer migration.

## TASK P3-B-TAMAMO-OWNER-READINESS-CAPABILITY

Owner: Codex B
Status: `SYNCHRONIZED`
Base: `93b5536c8a4a02d79fe9b525e450e2883056cdad`
Classification: bounded zero-credit owner-readiness capability for current owner `servant.tamamo`

Full-owner preflight:
- frozen owner set is exactly sc1 + sc2 + sc3; all three are currently `currentRoute=none` with no canonical authoring consumer at Base;
- F1 source text and clause hashes define one compatible sealed-card/Magic readiness family spanning all three skills;
- locked Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9` is evidence only: legacy `core.tamamo-cascade`, `core.tamamo-witchcraft`, and `core.tamamo-transcendence` identity handlers must not be restored;
- this task closes only the generic capability gap required before one Tamamo owner-complete formal consumer batch; no skill receives formal credit here.

Readiness scope:
- current-round definition-attribute replacement for an exact authored definition set, used to replace the affected basic definitions with Magic for the current round only;
- while-source-present protection for effective Magic attacks against other-player deactivation/close and power reduction, without protecting self-originating effects;
- combat arming followed by after-battle selection of exactly one qualifying same-location active face-up basic Magic/Luck/Remote-operation physical attack and persistent seal provenance under an authored host;
- Action replay of every sealed physical card at normal aggregate cost, atomically failing if total cost is unaffordable, preserving borrowed-card provenance while played;
- post-battle disposition with per-card 1-mana reseal choice and discard transfer for the remainder, including borrowed physical-card ownership transfer into the controller discard;
- exact restore/provenance/revision validation for pending seal/disposition decisions, sealed bindings, armed actions and replay state; malformed/widened metadata fails closed;
- identity-free loader/runtime gateway only; no Tamamo/card-name/printed-text parsing, no legacy identity-handler routing, no `SkillLib` fallback.

Verification:
- focused Tamamo readiness `9/9 PASS`;
- directly affected green set `10 files / 256 tests PASS` (Tamamo readiness, authoring interpreter, executable pack, MatchSession, card-close, FB2-49 close interaction, Steno Divine Core readiness, Suzuka readiness, Taisui location-marker readiness, complex-skills production regressions);
- historical `m50-02-opponent-close-one-non-residual` remains the already-known current-main debt (`6` failures) and is outside this task; this task does not modify that test or the opponent-close capability family;
- `FD_TOOLCHAIN_OK`;
- typecheck PASS;
- content validate/compile PASS (`7 masters / 12 servants / 20 events / 0 blocking issues`);
- generated determinism PASS with unchanged hashes;
- `data/authoring/**` delta EMPTY;
- production identity audit CLEAN for Tamamo/name/legacy-handler routes;
- locked Reference clean/exact;
- `git diff --check` PASS;
- detailed result: `docs/reports/2026-09-29-p3-b-tamamo-owner-readiness-capability-result.md`.

Revision history:
- predecessor Candidate `6c91b25e2b6a0d7c5af2f5964584ddd5e7171c18` received `IMPLEMENTATION_NEEDS_REVISION` from fresh R;
- canonical same-attempt Coordinator bounded relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/481#issuecomment-5882423372`;
- sole P1 closure preserves authoritative `controllerId` plus concrete source-card provenance for production `set_opponent_power_to_zero` / `reduce_opponents_power`, and `calculateCardPower` now consumes that provenance; self-originating reduction remains unprotected;
- added regression coverage executes both production extended-effect reducer handlers; no additional blocker was reported in that review attempt.

Accounting:
- strict formal accounting remains `146/944`, remaining `798`;
- this readiness task is permanently zero-credit;
- ACCEPTED must A-sync/rescan and return immediately to the same `servant.tamamo` owner for one owner-complete formal batch containing sc1 + sc2 + sc3 together.

Allowed verdicts:
- `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`
Acceptance synchronization:
- PR #481 successor exact Candidate `472d7d7cb6ed16a0d526ff91a68de0e1fe12d3da` received `IMPLEMENTATION_ACCEPTED_CANDIDATE` from fresh independent R.
- Predecessor Candidate `6c91b25e2b6a0d7c5af2f5964584ddd5e7171c18` had one P1 and is superseded.
- Canonical same-attempt Coordinator bounded relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/481#issuecomment-5882572670`.
- Exact successor Phase 3 Pre-Review Gate `36512899227` succeeded.
- Accepted readiness remains permanently zero-credit; strict formal accounting stays `146/944`, remaining `798`.
- Full-owner A-rescan confirms no additional currently discoverable Tamamo readiness gap remains beyond the accepted sealed-card/Magic family.
- sc1 + sc2 + sc3 are all newly creditable only in the upcoming formal owner-complete consumer migration.
- Next task is `P3-S-OWNER-TAMAMO-COMPLETE-MIGRATION`, containing sc1 + sc2 + sc3 together in one formal Candidate/PR/fresh R/A-sync sequence.
- Acceptance synchronization report: `docs/reports/2026-09-29-p3-a-tamamo-owner-readiness-capability-acceptance-synchronization.md`.
## TASK P3-S-OWNER-TAMAMO-COMPLETE-MIGRATION

Owner: Codex S
Status: `IMPLEMENTED_AWAITING_CANDIDATE_REVIEW`
Base: `9b138e98ecc10492d93cc3bebbe0066484ee0c37`
Classification: formal owner-complete migration for current owner `servant.tamamo`

Formal owner scope:
- `servant.tamamo.skill.sc-tamamo-1` 閳?newly creditable;
- `servant.tamamo.skill.sc-tamamo-2` 閳?newly creditable;
- `servant.tamamo.skill.sc-tamamo-3` 閳?newly creditable;
- one owner archive, one formal Candidate, one PR, one fresh R, then one A-sync/accounting transaction.

Accepted prerequisite:
- readiness PR #481 exact successor Candidate `472d7d7cb6ed16a0d526ff91a68de0e1fe12d3da`;
- fresh-R verdict `IMPLEMENTATION_ACCEPTED_CANDIDATE`;
- canonical same-attempt bounded relay `https://github.com/binchen648/fd/pull/481#issuecomment-5882572670`;
- exact zero-credit A-sync/formal Base `9b138e98ecc10492d93cc3bebbe0066484ee0c37` closes the complete currently discoverable Tamamo readiness gap set.

Implementation/evidence:
- canonical `data/authoring/servants/servant.tamamo.json` contains sc1 + sc2 + sc3 together;
- exact F1 text/static metadata for all three frozen identities is preserved;
- sc1 Cascade uses accepted sealed replay/reseal/discard semantic; sc2 uses accepted round attribute replacement plus other-player Magic close/Power protection; sc3 uses accepted after-battle physical seal semantic;
- sc1/sc3 use final Rule 9.4 8-mana skill-zone gate; sc2 retains its authoritative zero requirement;
- formal credit claim is exactly `+3` only after fresh R + A-sync;
- focused owner-complete `6/6 PASS`;
- directly affected serial `11 files / 262 tests PASS`;
- `FD_TOOLCHAIN_OK`; typecheck PASS; content validate/compile PASS (`7 masters / 12 servants / 20 events / 0 blocking issues`); generated determinism PASS; `git diff --check` PASS;
- `packages/rules/src/**` formal delta EMPTY; no Tamamo/card-name/printed-text runtime parsing, legacy Tamamo handler routing, or `SkillLib` fallback added;
- detailed result: `docs/reports/2026-09-29-p3-s-owner-tamamo-complete-migration-result.md`.

Accounting boundary:
- strict formal accounting remains `146/944`, remaining `798` before fresh R and A-sync;
- no credit before exact-Candidate `MIGRATION_ACCEPTED` plus subsequent A-sync/accounting;
- accepted synchronized outcome may add exactly sc1 + sc2 + sc3 and move strict formal accounting to `149/944`, remaining `795`;
- do not advance owners before this owner batch is reviewed and synchronized.

Allowed verdicts:
- `MIGRATION_ACCEPTED`
- `MIGRATION_NEEDS_REVISION`
- `MIGRATION_BLOCKED`

Acceptance synchronization:
- PR #482 exact Candidate `dafdcba73248a9f5d4cd13065e32e813c7f91346` received `MIGRATION_ACCEPTED` from fresh independent R.
- Canonical same-attempt Coordinator bounded relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/482#issuecomment-5882815287`.
- Exact-Candidate Phase 3 Pre-Review Gate `36514612258` succeeded.
- Accepted owner-complete scope is exactly Tamamo sc1 + sc2 + sc3; all three are newly creditable.
- Formal accounting moves `146/944 -> 149/944`; remaining `795`; readiness credit remains `0`.
- Acceptance synchronization report: `docs/reports/2026-09-29-p3-a-owner-tamamo-acceptance-synchronization.md`.
- Mechanical first-occurrence owner ordering selects `servant.teach` next: Tamamo index `240`, Teach index `241` of `251` owners.
- Owner-readiness-first remains mandatory: complete one full Teach preflight before any Teach formal consumer migration.

## TASK P3-B-TEACH-OWNER-READINESS-CAPABILITY

Owner: Codex B
Status: `SYNCHRONIZED`
Base: `1987bfe9e23037c2e682fba15bc83fbff8cf33c0`
Classification: bounded zero-credit owner-readiness capability for current owner `servant.teach`

Full-owner preflight:
- frozen owner set is exactly sc1 + sc2 + sc3;
- `servant.teach.skill.sc-teach-3` is historical accepted FM01 authoring (`6203b70c5bc2a81ceecca31008dc2b71246519a9`) and is preservation-only with no duplicate credit;
- sc1 + sc2 have no canonical authoring consumer at Base and are the only newly creditable Teach identities after later formal acceptance;
- frozen source evidence was grounded by `80aaa029ff20448b92afc4fd115080cd3f34a60c`, independently audited by `4961de83468716cc748f16faf9f03212c47a8713`, accepted by `9d92b036332fc22df07ccb8f26af0bc69c066b34`, with final F1 evidence closure `59f145434695d29bdd17e4cb3adc887e84182377`;
- locked Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9` is evidence only; legacy `core.teach-gentleman-love` / `core.teach-queen-anne` identity handlers must not be restored;
- complete currently discoverable missing Teach scope reduces to one compatible identity-free battle-plunder/recorded-replay capability family; sc3 reuses its historical accepted FM01 seams.

Readiness scope:
- authoritative contested-win competition-VP replacement for the accepted provider controller only when an authoritative loser exists, preserving all unrelated event/location/other-winner reward branches and leaving all-winner contested ties on ordinary competition scoring;
- choose one authoritative loser, expose physical top three deck cards (recycling discard only when required), remove exactly one, gain printed base Power capped at 5, and arbitrarily order the remaining exposed top cards;
- persist exact physical removed-card authority bound to controller/source/ability/original-owner/trusted battle result/winning trigger/record key/revision plus server-created top-three removal evidence;
- Action replay of exactly one recorded removed physical card with normal play semantics and a 2-mana minimum paid cost, borrowed-card original ownership preserved while controller changes for play;
- remove the active replay-source skill after the battle terminal;
- exact pending-decision and persisted-authority restore/provenance validation; malformed/widened/stale/forged metadata fails closed;
- identity-free loader/runtime gateway only; no Teach/card-name/printed-text parsing, legacy identity-handler routing, or `SkillLib` fallback.

Verification:
- focused Teach readiness `9/9 PASS`;
- focused Teach + combat resolver `2 files / 19 tests PASS`;
- shared Teach + Suzuka readiness + MatchSession `3 files / 50 tests PASS`;
- directly affected green set `12 files / 263 tests PASS`;
- `FD_TOOLCHAIN_OK`;
- typecheck PASS;
- content validate/compile PASS (`7 masters / 12 servants / 20 events / 0 blocking issues`);
- generated determinism PASS with unchanged hashes;
- `data/authoring/**` delta EMPTY;
- production identity audit CLEAN for Teach/name/legacy-handler routes;
- locked Reference clean/exact;
- `git diff --check` PASS;
- detailed result: `docs/reports/2026-09-29-p3-b-teach-owner-readiness-capability-result.md`.

Revision closure:
- predecessor Candidate `f8a10e61fef647a129f6c8bdc0309099b281d3b4` received `IMPLEMENTATION_NEEDS_REVISION` from fresh independent R;
- canonical same-attempt Coordinator bounded relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/483#issuecomment-5883235407`;
- P1 all-winner tie closure gates reward replacement on an authoritative loser and adds a no-loser contested-tie regression;
- P1 persisted-authority closure binds every replayable removed card to exact server-created removal evidence and rejects an exact-looking substitution of another loser-owned removed physical card even when the forged state is independently sealed for restore.
- successor Candidate `bf33b3d76c6241592987cc0204c7be056f4d203d` then received `IMPLEMENTATION_NEEDS_REVISION` with one remaining loser-semantics P1; canonical same-attempt Coordinator bounded relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/483#issuecomment-5883633664`;
- that P1 is closed by deriving competition-VP replacement eligibility from the same authoritative post-scoring loser relation used by GameLoop/MatchSession: all battle participant non-winners minus `lossEffectSuppressedPlayerIds`, instead of `eligible.some(nonwinner)`;
- focused regression proves a sole loss-suppressed non-winner keeps ordinary competition VP and opens no plunder; a reverse regression proves an excluded-from-winning but unsuppressed participant remains an authoritative loser and still enables replacement/plunder.

Accounting:
- strict formal accounting remains `149/944`, remaining `795`;
- this readiness task is permanently zero-credit;
- ACCEPTED must A-sync/rescan and return immediately to the same `servant.teach` owner for one owner-complete formal batch containing preserved sc3 + new sc1 + sc2 together;
- only sc1 + sc2 may receive new formal credit; synchronized accepted formal target is `151/944`, remaining `793`.

Allowed verdicts:
- `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`
Acceptance synchronization:
- PR #483 exact Candidate `964db288d809cabd9150afdcf08dc3f306b9ab4e` received `IMPLEMENTATION_ACCEPTED_CANDIDATE` from fresh independent R.
- Canonical same-attempt Coordinator bounded relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/483#issuecomment-5883800548`.
- Exact-Candidate Phase 3 Pre-Review Gate `36522217489` succeeded.
- Accepted readiness remains permanently zero-credit; strict formal accounting stays `149/944`, remaining `795`.
- Full-owner A-rescan confirms no additional currently discoverable Teach readiness gap remains beyond the accepted battle-plunder/recorded-replay family.
- sc3 remains historical FM01 preservation-only; sc1 + sc2 are the only newly creditable identities in the upcoming formal owner batch.
- Next task is `P3-S-OWNER-TEACH-COMPLETE-MIGRATION`, containing preserved sc3 + new sc1 + sc2 together in one formal Candidate/PR/fresh R/A-sync sequence.
- Acceptance synchronization report: `docs/reports/2026-09-29-p3-a-teach-owner-readiness-capability-acceptance-synchronization.md`.

## TASK P3-S-OWNER-TEACH-COMPLETE-MIGRATION

Owner: Codex S
Status: `SYNCHRONIZED`
Base: `8c89f948db0edcaa8042df578410ba17a8f298b4`
Classification: formal owner-complete migration for current owner `servant.teach`

Formal owner scope:
- `servant.teach.skill.sc-teach-1` 閳?newly creditable;
- `servant.teach.skill.sc-teach-2` 閳?newly creditable;
- `servant.teach.skill.sc-teach-3` 閳?historical FM01 preservation-only, no duplicate credit;
- one owner archive, one formal Candidate, one PR, one fresh R, then one A-sync/accounting transaction.

Accepted prerequisite:
- readiness PR #483 exact Candidate `964db288d809cabd9150afdcf08dc3f306b9ab4e`;
- fresh-R verdict `IMPLEMENTATION_ACCEPTED_CANDIDATE`;
- canonical same-attempt bounded relay `https://github.com/binchen648/fd/pull/483#issuecomment-5883800548`;
- exact zero-credit A-sync/formal Base `8c89f948db0edcaa8042df578410ba17a8f298b4` closes the complete currently discoverable Teach readiness gap set.

Implementation/evidence:
- canonical `data/authoring/servants/servant.teach.json` contains new sc1 + sc2 plus preserved sc3;
- sc1 uses only accepted `battle_competition_reward_plunder` with exact authoritative-loser/top-three/remove/reorder/printed-Power-cap semantics;
- sc2 uses only accepted `play_recorded_removed_card` with exact recorded physical-card provenance, normal cost floored to 2, ownership preservation, true-name reveal, and post-battle source removal;
- sc3 parsed object is semantically unchanged from exact Base (`SC3_SEMANTIC_PRESERVED=True`);
- formal credit claim is exactly `+2` only after fresh R + A-sync;
- focused owner-complete `6/6 PASS`;
- directly affected green set `13 files / 269 tests PASS`;
- `FD_TOOLCHAIN_OK`; typecheck PASS; content validate/compile PASS (`7 masters / 12 servants / 20 events / 0 blocking issues`); generated determinism PASS; `git diff --check` PASS;
- formal `packages/rules/src/**` production runtime delta EMPTY; no Teach identity routing, runtime source-text parsing, legacy `core.teach-*` handler, or `SkillLib` fallback added;
- detailed result: `docs/reports/2026-09-29-p3-s-owner-teach-complete-migration-result.md`.

Accounting boundary:
- strict formal accounting remains `149/944`, remaining `795` before fresh R and A-sync;
- no credit before exact-Candidate `MIGRATION_ACCEPTED` plus subsequent A-sync/accounting;
- accepted synchronized outcome may add exactly sc1 + sc2 and move strict formal accounting to `151/944`, remaining `793`;
- sc3 remains preservation-only `+0`; do not advance owners before this owner batch is reviewed and synchronized.

Allowed verdicts:
- `MIGRATION_ACCEPTED`
- `MIGRATION_NEEDS_REVISION`
- `MIGRATION_BLOCKED`
Acceptance synchronization:
- PR #484 exact Candidate `59049a2edb41ba2aeb34dd0ddfc42d230823b338` received `MIGRATION_ACCEPTED` from fresh independent R.
- Canonical same-attempt Coordinator bounded relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/484#issuecomment-5884435718`.
- Exact-Candidate Phase 3 Pre-Review Gate `36524389340` succeeded.
- Accepted owner-complete scope is exactly Teach sc1 + sc2 + sc3; sc1 + sc2 are newly creditable and historical FM01 sc3 remains preservation-only `+0`.
- Formal accounting moves `149/944 -> 151/944`; remaining `793`; readiness remains permanently zero-credit and sc3 receives no duplicate credit.
- Acceptance synchronization report: `docs/reports/2026-09-29-p3-a-owner-teach-acceptance-synchronization.md`.
- Mechanical first-occurrence owner ordering selects `servant.tesla` next: Teach index `241`, Tesla index `242` of `251` owners.
- Owner-readiness-first remains mandatory: complete one full Tesla preflight across sc1 + sc2 + sc3 before any Tesla formal consumer migration.

## TASK P3-B-TESLA-OWNER-READINESS-CAPABILITY

Owner: Codex B
Status: `SYNCHRONIZED`
Base: `7131b216d78dc04f21390e63b9d0ce0f28139a82`
Classification: bounded zero-credit owner-readiness capability for current owner `servant.tesla`

Full-owner preflight:
- frozen owner scope is exactly `servant.tesla.skill.sc-tesla-1`, `servant.tesla.skill.sc-tesla-2`, `servant.tesla.skill.sc-tesla-3`;
- no current `data/authoring/servants/servant.tesla.json` exists and Git history contains no prior formal Tesla authoring migration, so no preservation-only Tesla identity is currently discovered;
- F1 source evidence is globally closed at `944/944`, blocked `0`, unclassified `0`; locked Reference remains static/non-authoritative evidence only;
- preflight found one complete currently discoverable generic readiness family spanning authoritative mana spend, storage-cap overflow, round total-Power growth, post-battle source close, opponent overflow defeat, lose-all-mana Power conversion, and mandatory same-location opponent mana grants;
- `data/authoring/**` remains unchanged in this readiness Candidate.

Implementation/evidence:
- added identity-free exact whole-ability `mana-transaction-capability` gateway for the complete discovered Tesla family;
- paid-mana observation covers accepted interpreter costs, resolution-dataflow mana payment, batch/legacy card play and normal movement; movement spend resolves at the authoritative origin location;
- storage-cap overflow is mechanically separated from existing public requested-minus-actual `overflowAmount`, so round/situation gain caps and mana suppression do not spuriously trigger Tesla overflow semantics;
- self overflow adds stackable current-round `player.combatTotalPower +5`, arms a source-bound canonical battle-terminal close marker, and restore validates exact accepted source/current round/live provenance;
- opponent overflow defeat reuses generic other-player ability immunity and battle-loss immunity seams;
- lose-all-mana conversion is resource loss, not paid-mana spend, and adds exactly the lost amount to current-round total Power;
- same-location opponent grants flow through normal `grantMana`, so real storage overflow composes with the generic overflow reaction family;
- no Tesla/card-name/printed-text runtime parser, legacy `core.tesla-*` route, or `SkillLib` fallback is introduced.

Verification:
- focused Tesla readiness `12/12 PASS`;
- Tesla + core movement `15/15 PASS`;
- affected interpreter/session/resource/play set `9 files / 83 tests PASS`, including full MatchSession `33/33 PASS`;
- resource-numeric direct-action relevant subset `3/3 PASS`; its unrelated Tomoe pairing test is a mechanically reproduced pre-existing predecessor failure and is not Candidate-caused;
- `FD_TOOLCHAIN_OK`;
- typecheck PASS;
- content validate/compile PASS (`7 masters / 12 servants / 20 events / 0 blocking issues`);
- generated determinism PASS with unchanged hashes;
- production identity audit CLEAN;
- locked Reference clean/exact;
- `data/authoring/**` delta EMPTY;
- `git diff --check` PASS;
- detailed result: `docs/reports/2026-09-29-p3-b-tesla-owner-readiness-capability-result.md`.

Successor revision state:
- predecessor exact Candidate `4961a7c432bece612758b7a344981a0ddf1347f6` received `IMPLEMENTATION_NEEDS_REVISION`; Reviewer GitHub write failed 403 and canonical same-attempt relay is `https://github.com/binchen648/fd/pull/485#issuecomment-5885532817`;
- the preserved relay lacks the textual blocking-findings section, so no missing Reviewer finding is reconstructed or invented;
- FORMAL independently reproduced a Candidate-introduced pure-reducer mutation leak in both normal movement and legacy pair-play paid-mana observation and recorded the reproduction at `https://github.com/binchen648/fd/pull/485#issuecomment-5887455935`;
- revision detaches all player objects plus `abilityRuntime` before external spend observers run, preserving next-state reward semantics without mutating the input state;
- revision coverage at that predecessor step: Tesla + movement `14/14 PASS`; an exploratory broader run contained one historical FM01 lineage assertion mechanically pre-existing on exact Base and is not represented as an all-green gate; resource-numeric relevant subset `3/3 PASS`; typecheck + diff-check PASS;
- successor must receive one fresh independent R over the whole bounded Tesla readiness scope; this independent closure is not represented as recovered predecessor Reviewer prose.

Current P1 revision state:
- exact Candidate `b3ff56a6e15bf97c01b10d8b9a76ad9f4f3ca34b` received `IMPLEMENTATION_NEEDS_REVISION`; Reviewer GitHub write failed 403 and canonical same-attempt bounded relay is `https://github.com/binchen648/fd/pull/485#issuecomment-5887827682`;
- the sole exact-scope blocker is Tesla sc3's frozen mandatory combat grant: ordinary phase-action choice + unrestricted battle pass could previously omit the required same-location opponent +2 mana grant;
- authoritative `controller_combat_action_window` processing now automatically executes only the exact accepted mandatory grant shape, while existing `canActivate` / `usedAbilities` preserves once-per-round behavior;
- MatchSession decision progression additionally resolves any still-live current-priority mandatory combat grant before advancing, covering direct/manual/restored battle-decision pass paths;
- all non-matching phase actions remain optional; grants still flow through normal `grantMana` and compose with genuine storage overflow reactions;
- new coverage proves canonical phase entry cannot omit or duplicate the grant and `passPriority` cannot bypass a live mandatory grant;
- current verification: Tesla `12/12`, movement `3/3`, affected interpreter/session/resource/play set `9 files / 83 tests`, resource-numeric relevant subset `3/3`, toolchain/typecheck/content/determinism/identity/diff gates PASS;
- one successor Candidate is required, followed by one fresh independent R over the whole bounded Tesla readiness scope.

Accounting:
- strict formal accounting remains `151/944`, remaining `793`;
- this readiness task is permanently zero-credit;
- ACCEPTED must A-sync/rescan and stay on `servant.tesla`;
- if rescan finds no additional readiness gap, the later single owner-complete formal batch contains sc1 + sc2 + sc3 together; only a later `MIGRATION_ACCEPTED` plus A-sync may add the three Tesla identities and move `151/944 -> 154/944`, remaining `790`.

Allowed verdicts:
- `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`
Acceptance synchronization:
- PR #485 exact Candidate `e55c6727889f2c96c9ece71a1490b4edae58788d` received `IMPLEMENTATION_ACCEPTED_CANDIDATE` from fresh independent R.
- Canonical same-attempt Coordinator bounded relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/485#issuecomment-5888328096`.
- Exact-Candidate Phase 3 Pre-Review Gate `36553298350` succeeded.
- Accepted readiness remains permanently zero-credit; strict formal accounting stays `151/944`, remaining `793`.
- Full-owner A-rescan confirms no additional currently discoverable Tesla readiness gap remains beyond the accepted mana-transaction family.
- sc1 + sc2 + sc3 are all newly creditable only in the upcoming formal owner-complete consumer migration; none has current or historical canonical Tesla authoring.
- Next task is `P3-S-OWNER-TESLA-COMPLETE-MIGRATION`, containing sc1 + sc2 + sc3 together in one formal Candidate/PR/fresh R/A-sync sequence.
- Acceptance synchronization report: `docs/reports/2026-09-29-p3-a-tesla-owner-readiness-capability-acceptance-synchronization.md`.

## TASK P3-S-OWNER-TESLA-COMPLETE-MIGRATION

Owner: Codex S
Status: `SYNCHRONIZED`
Base: `f2aaf28bc1f967c6b1197424b9647321e85d7703`
Classification: formal owner-complete migration for current owner `servant.tesla`

Formal owner scope:
- `servant.tesla.skill.sc-tesla-1` 閳?newly creditable;
- `servant.tesla.skill.sc-tesla-2` 閳?newly creditable;
- `servant.tesla.skill.sc-tesla-3` 閳?newly creditable;
- one owner archive, one formal Candidate, one PR, one fresh R, then one A-sync/accounting transaction.

Accepted prerequisite:
- readiness PR #485 exact Candidate `e55c6727889f2c96c9ece71a1490b4edae58788d`;
- fresh-R verdict `IMPLEMENTATION_ACCEPTED_CANDIDATE`;
- canonical same-attempt bounded relay `https://github.com/binchen648/fd/pull/485#issuecomment-5888328096`;
- exact zero-credit A-sync/formal Base `f2aaf28bc1f967c6b1197424b9647321e85d7703` closes the complete currently discoverable Tesla readiness gap set.

Implementation/evidence:
- canonical `data/authoring/servants/servant.tesla.json` contains the complete frozen sc1 + sc2 + sc3 owner set;
- sc1 consumes only accepted same-location spend reward plus true storage-overflow Power/terminal-close semantics;
- sc2 consumes only accepted same-battlefield overflow defeat plus lose-all-mana current-round Power conversion semantics;
- sc3 consumes only accepted same-location normal mana grants on play and mandatory combat scheduling with once-per-round protection;
- sc2/sc3 true-name release uses separate canonical `declaration_reveal` abilities so privileged mana-transaction shapes remain exact/fail-closed;
- all three final skill-zone thresholds are `8`; sc1 legacy requirement `6` is retained only as locked-Reference static metadata;
- focused owner-complete `7/7 PASS`;
- directly affected green set `8 files / 156 tests PASS`;
- `FD_TOOLCHAIN_OK`; typecheck PASS; content validate/compile PASS (`7 masters / 12 servants / 20 events / 0 blocking issues`); generated determinism PASS; `git diff --check` PASS;
- formal `packages/rules/src/**` production runtime delta from Base is EMPTY; no Tesla identity routing, runtime source-text parsing, legacy `core.tesla-*` handler, or `SkillLib` fallback is added;
- detailed result: `docs/reports/2026-09-29-p3-s-owner-tesla-complete-migration-result.md`.

Accounting boundary:
- strict formal accounting remains `151/944`, remaining `793` before fresh R and A-sync;
- no credit before exact-Candidate `MIGRATION_ACCEPTED` plus subsequent A-sync/accounting;
- accepted synchronized outcome may add exactly sc1 + sc2 + sc3 and move strict formal accounting to `154/944`, remaining `790`;
- do not advance owners before this owner batch is reviewed and synchronized.

Allowed verdicts:
- `MIGRATION_ACCEPTED`
- `MIGRATION_NEEDS_REVISION`
- `MIGRATION_BLOCKED`

Acceptance synchronization:
- PR #486 exact Candidate `75eb419d8dbcf55db07967d3c3e5235eaf3fcde2` received `MIGRATION_ACCEPTED` from fresh independent R.
- Canonical same-attempt Coordinator bounded relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/486#issuecomment-5888744133`.
- Exact-Candidate Phase 3 Pre-Review Gate `36557082116` succeeded.
- Accepted owner-complete scope is exactly Tesla sc1 + sc2 + sc3; all three are newly creditable.
- Formal accounting moves `151/944 -> 154/944`; remaining `790`; readiness remains permanently zero-credit.
- Mechanical next owner is `servant.tezcat`; frozen scope is sc1 + sc2 + sc3.
- Owner-readiness-first remains mandatory before any Tezcat formal consumer migration.
- Acceptance synchronization report: `docs/reports/2026-09-29-p3-a-owner-tesla-acceptance-synchronization.md`.

## TASK P3-B-TEZCAT-OWNER-READINESS-CAPABILITY

Owner: Codex B
Status: `SYNCHRONIZED`
Base: `bbf17412961e24b1cb6453e7b406bf9522dc4db6`
Classification: complete currently discoverable Tezcat owner-readiness/capability batch, permanently zero migration credit

Frozen owner scope:
- `servant.tezcat.skill.sc-tezcat-1`;
- `servant.tezcat.skill.sc-tezcat-2`;
- `servant.tezcat.skill.sc-tezcat-3`.

Source authority:
- accepted F1/source-evidence closure ends at independent review `59f145434695d29bdd17e4cb3adc887e84182377`;
- all three Tezcat identities are source-grounded from `Fate_Domination-瀵偓閸欐垹澧?batch_caster_assassin.js`;
- locked Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9` remains static/observed metadata only and is not semantic authority.

Readiness gap set closed in one compatible identity-free family:
- sc1: exact required-additional sibling-attack modifier: every other jointly played attack gets +2 paid mana cost and +1 current-round Power;
- sc2: exact once-per-round same-battlefield turn-order optional paid attack transaction with authenticated decision/restore state, actual-participant battle settlement, loser -2 VP, and conditional controller +2 VP;
- sc3: exact one ordinary Command Seal card-play cost plus exact combat defeat of all eligible active same-battlefield opponents;
- all privileged nodes are whole-ability exact/fail-closed and carry no Tezcat/card-name/printed-text/legacy handler identity routing.

Verification:
- focused Tezcat readiness `7/7 PASS`;
- affected green set `8 files / 114 tests PASS` including full MatchSession `33/33`, authoring interpreter `38/38`, required-additional play `8/8`, attack-play classifier `11/11`, card-action play `4/4`, game-loop action play `9/9`, and fixed-controller Command Seal component `4/4`;
- `FD_TOOLCHAIN_OK`;
- typecheck PASS;
- content validate/compile PASS: `7 masters / 12 servants / 20 events / 0 blocking issues`;
- generated-content determinism PASS;
- `data/authoring/**` Base..Candidate delta EMPTY;
- production identity audit CLEAN;
- `git diff --check` PASS;
- detailed result: `docs/reports/2026-09-29-p3-b-tezcat-owner-readiness-capability-result.md`.

Accounting / next step:
- strict formal accounting remains `154/944`, remaining `790`;
- readiness is permanently zero-credit;
- exact Candidate requires one fresh independent R;
- ACCEPTED -> one A-sync/full-owner rescan, remain on `servant.tezcat`; only then, if no new gap exists, create one formal owner-complete sc1 + sc2 + sc3 migration Candidate;
- NEEDS_REVISION -> close all exact findings in one successor Candidate, then one fresh R.

Allowed verdicts:
- `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`

Acceptance synchronization:
- PR #487 exact Candidate `69c03692ad62e6f2e002b3601ea31992c535d2c9` received `IMPLEMENTATION_ACCEPTED_CANDIDATE` from fresh independent R.
- Canonical same-attempt Coordinator bounded relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/487#issuecomment-5891046194`.
- Exact-Candidate Phase 3 Pre-Review Gate `36571827932` succeeded.
- Accepted readiness remains permanently zero-credit; strict formal accounting stays `154/944`, remaining `790`.
- Full-owner A-rescan confirms no additional currently discoverable Tezcat readiness gap remains beyond the accepted joint/battlefield-attack family.
- No Tezcat canonical consumer authoring exists yet; sc1 + sc2 + sc3 are all newly creditable only in the upcoming formal owner-complete migration.
- Acceptance synchronization report: `docs/reports/2026-09-29-p3-a-tezcat-owner-readiness-capability-acceptance-synchronization.md`.

## TASK P3-S-OWNER-TEZCAT-COMPLETE-MIGRATION

Owner: Codex S
Status: `SYNCHRONIZED`
Base: `424aea116baf4ca1afddffbcaecf77e13f69de65`
Classification: formal owner-complete migration for current owner `servant.tezcat`

Formal owner scope:
- `servant.tezcat.skill.sc-tezcat-1` 閳?newly creditable;
- `servant.tezcat.skill.sc-tezcat-2` 閳?newly creditable;
- `servant.tezcat.skill.sc-tezcat-3` 閳?newly creditable;
- one owner archive, one formal Candidate, one PR, one fresh independent R, then one A-sync/accounting transaction.

Accepted prerequisite:
- readiness PR #487 exact Candidate `69c03692ad62e6f2e002b3601ea31992c535d2c9`;
- fresh-R verdict `IMPLEMENTATION_ACCEPTED_CANDIDATE`;
- canonical same-attempt bounded relay `https://github.com/binchen648/fd/pull/487#issuecomment-5891046194`;
- accepted zero-credit A-sync `424aea116baf4ca1afddffbcaecf77e13f69de65` / rescan confirms the complete currently discoverable Tezcat readiness gap set is closed.

Implementation / evidence:
- canonical `data/authoring/servants/servant.tezcat.json` contains the complete frozen sc1 + sc2 + sc3 owner set;
- sc1 consumes only the accepted additional-play sibling cost/Power modifier;
- sc2 consumes only the accepted authenticated same-battlefield turn-order paid-attack / participant settlement family;
- sc3 consumes only the accepted ordinary Command Seal card-play cost and engaged-opponent defeat family, with separate canonical true-name declaration reveal;
- focused owner-complete regression `5/5 PASS`; accepted readiness regression `8/8 PASS`;
- successor directly affected green set `10 files / 141 tests PASS`, including full MatchSession `33/33`, authoring interpreter `38/38`, and canonical playtest-pack loader `21/21`; targeted pack-roster and twelve-card-deck assertions also PASS;
- `FD_TOOLCHAIN_OK`; typecheck PASS; content validate/compile PASS (`7 masters / 13 servants / 20 events / 0 blocking issues`); generated determinism PASS; `git diff --check` PASS;
- formal `packages/rules/src/**` production runtime delta from Base is EMPTY and production Tezcat/card-name/legacy-handler/`SkillLib` identity audit is CLEAN;
- detailed result: `docs/reports/2026-09-29-p3-s-owner-tezcat-complete-migration-result.md`.

First fresh-R revision closure:
- exact Candidate `224e4dcd6b3a51acdd089242d4d0b6eb5a269dd4` received `MIGRATION_NEEDS_REVISION`;
- canonical same-attempt relay: `https://github.com/binchen648/fd/pull/488#issuecomment-5891839711`;
- [P1] canonical pack omitted `servant.tezcat.json`, so shipped/normal content never loaded sc1/sc2/sc3;
- [P1] the archive omitted the required twelve-card starting deck;
- successor revision adds the archive to `data/packs/fd-playtest-v1/pack.json`, records the exact Reference static twelve-card deck, refreshes canonical generated content, and adds loader/compiled-library assertions for owner + all three skill IDs;
- direct formal/readiness semantics remain unchanged; no additional sc1/sc2/sc3 semantic blocker was reported in the first review.

Accounting boundary:
- strict formal accounting remains `154/944`, remaining `790` before fresh R and A-sync;
- no credit before exact-Candidate `MIGRATION_ACCEPTED` plus subsequent A-sync/accounting;
- accepted synchronized outcome may add exactly sc1 + sc2 + sc3 and move strict formal accounting to `157/944`, remaining `787`;
- do not advance owners before this owner batch is reviewed and synchronized.

Allowed verdicts:
- `MIGRATION_ACCEPTED`
- `MIGRATION_NEEDS_REVISION`
- `MIGRATION_BLOCKED`
Acceptance synchronization:
- PR #488 exact successor Candidate `27e297e1e75a0b89b01948a2298c812c224feb87` received `MIGRATION_ACCEPTED` from fresh independent R.
- Canonical same-attempt Coordinator bounded relay after Work-chat rollover interrupted normal result delivery: `https://github.com/binchen648/fd/pull/488#issuecomment-5893825709`.
- Exact-Candidate Phase 3 Pre-Review Gate `36586224266` succeeded.
- Accepted owner-complete scope is exactly Tezcat sc1 + sc2 + sc3; all three are newly creditable.
- Formal accounting moves `154/944 -> 157/944`; remaining `787`; readiness remains permanently zero-credit.
- Mechanical next owner is `servant.tomoe`; frozen inventory immediately after Tezcat contains sc-tomoe-1 + sc-tomoe-2 + sc-tomoe-3.
- Tomoe has historical accepted/canonical material, so owner-readiness-first must perform a full current-lineage/history rescan before deciding preservation-only versus newly creditable identities; no Tomoe credit is claimed by this A-sync.
- Acceptance synchronization report: `docs/reports/2026-09-29-p3-a-owner-tezcat-acceptance-synchronization.md`.

## TASK P3-B-TOMOE-OWNER-READINESS-CAPABILITY

Owner: Codex B
Status: `SYNCHRONIZED`
Base: `973719b7c0c29a1ff74462eaf5c2cf08e5160e5b`
Classification: complete currently discoverable Tomoe owner-readiness/capability batch, permanently zero migration credit

Frozen owner scope:
- `servant.tomoe.skill.sc-tomoe-1`;
- `servant.tomoe.skill.sc-tomoe-2`;
- `servant.tomoe.skill.sc-tomoe-3`.

Source / accepted-lineage authority:
- frozen F1 evidence remains independently accepted at `59f145434695d29bdd17e4cb3adc887e84182377` (`944/944`, blocked `0`, unclassified `0`);
- canonical `data/authoring/servants/servant.tomoe.json` already exists and is the current owner archive; this readiness task does not edit authoring or claim migration credit;
- P3-B21 / R15 already accepts the exact Tomoe sc1 post-loss unpreventable `-5 VP` family, and FM04/R32 explicitly treats Tomoe Independent Action as the pre-existing canonical representative while adding only sibling archives;
- locked Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9` remains static/observed metadata only and is not semantic authority.

Full-owner preflight result:
- sc1 current seams are already usable: first-half action `+3 VP` and forced post-loss unpreventable `-5 VP` need no new readiness runtime;
- sc2 terrain doubling is already executable, but its `next_round` battlefield deployment status had no consumer at all, so the printed `0..5 VP` terrain-slot restriction was inert;
- sc3 true-name declaration/reveal is already executable, but Rain of Fire had regressed to an explicit `assume opponent has no terrain` shortcut and did not respect authoritative terrain ownership;
- these are the complete currently discoverable owner-local gaps; they are closed together in one zero-credit readiness Candidate and must not be split into per-skill review units.

Implemented generic readiness family:
- exact `next_round` / `opponents_deploying_to_this_battlefield` status shapes now carry source-card, ability, source-controller, location, and created-round provenance; malformed/widened shapes fail closed;
- when an opponent deploys to that battlefield in exactly the following round, deployment pauses before terrain assignment and opens one owner-only mandatory choice `0..min(5,current VP)`; this remains a real single-option `['vp:0']` interaction at `current VP = 0`; the chosen amount is paid as VP and only free terrain slots whose printed terrain value is `<= paid VP` remain eligible;
- explicit `terrainAssignmentSlots` authority preserves non-dense choices (for example paying `1` may take the `+1` slot while leaving `+3` free for a later payer) and is consumed by combat/terrain multiplier math; round rollover clears the mapping;
- restore validates terrain assignment + exact-slot consistency and the pending deployment-payment interaction against live player/round/priority/status/source facts; malformed or stale state fails closed;
- exact `reduce_opponents_power(amount=5, condition=opponent_has_no_terrain, scope=same_battlefield)` now reads authoritative terrain assignments; opponents with terrain are excluded, opponents without terrain receive the round `-5`, and malformed terrain authority fails closed;
- production runtime contains no Tomoe/card-name/printed-text/`sc-tomoe-*`/`inferno_fire` identity routing.

Verification:
- Tomoe/MatchSession focused green set: `3 files / 81 tests PASS` (`match-session-regressions 10/10`, full MatchSession `33/33`, complex skills `38/38`);
- `FD_TOOLCHAIN_OK`;
- typecheck PASS;
- content validate/compile PASS: `7 masters / 13 servants / 20 events / 0 blocking issues`;
- generated-content determinism PASS;
- `data/authoring/**` Base..working-tree delta EMPTY;
- production identity audit CLEAN;
- `git diff --check` PASS;
- detailed result: `docs/reports/2026-09-30-p3-b-tomoe-owner-readiness-capability-result.md`.

Acceptance synchronization:
- PR #489 successor Candidate `f932f3f825eb8258771808a3671054b4931b158c` received `IMPLEMENTATION_ACCEPTED_CANDIDATE` from one fresh independent R.
- Canonical same-attempt Coordinator bounded relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/489#issuecomment-5902818985`.
- Exact-Candidate Phase 3 Pre-Review Gate run `36659186727` / job `109709936248` succeeded.
- Readiness remains permanently zero-credit; strict formal accounting stays `157/944`, remaining `787`.
- Full-owner A-rescan mechanically confirms Tomoe sc1 + sc2 + sc3 all existed in the repository initial canonical lineage and in the exact pre-FM04 `59/944` canonical overlap; FM04 added only ten non-Tomoe siblings and Tomoe had zero diff.
- Therefore all three frozen Tomoe identities are preservation-only / already accounted; no Tomoe formal migration Candidate is legal and no Tomoe credit is added now.
- Mechanical next owner is `servant.tristan`, exact frozen scope sc1 + sc2 + sc3.
- Acceptance synchronization report: `docs/reports/2026-09-30-p3-a-tomoe-owner-readiness-capability-acceptance-synchronization.md`.

## TASK P3-B-TRISTAN-OWNER-READINESS-CAPABILITY

Owner: Codex B
Status: `SYNCHRONIZED`
Base: `f067d70514a702327d24b94d9bc1327eb3ae7881`
Classification: complete currently discoverable Tristan owner-readiness/capability batch, permanently zero migration credit

Frozen owner scope:
- `servant.tristan.skill.sc-tristan-1`;
- `servant.tristan.skill.sc-tristan-2`;
- `servant.tristan.skill.sc-tristan-3`.

Current-lineage reconciliation:
- canonical authoring currently contains only sc3; sc3 is the accepted FM04 Independent Action member and is preservation-only/no duplicate credit;
- sc1 and sc2 are absent from canonical authoring and are the current owner-local readiness pressure points;
- readiness implementation remains identity-free and changes no `data/authoring/**` file.

Implemented generic readiness family:
- sc1 exact combat action snapshots same-battlefield non-residual attacks by authoritative base-Power axis, excludes its source, closes every member of duplicate-Power groups, and only when no qualifying group exists discards up to the top three controller deck cards;
- sc1 grouping deliberately ignores modified combat total; accepted physical source-X binding is recognized only as that physical card's authoritative base Power;
- sc2 exact live-source on-play residual opens one private owner-only `0..N` current-discard choice, authenticates frozen physical candidates at resolution, moves selected discard cards into deck, deterministically shuffles when nonempty, and binds physical-source `X = selected count + 2` including zero-selection `X=2`;
- sc2 source X is also the live source's base Power; authoritative battle participation is location-based, so an active controller located at the battlefield participates even with zero active attacks, pays X exactly once for that round, and insufficient mana closes that physical source with no negative mana;
- source close clears X/upkeep state; restore validation covers interaction shape, frozen discard candidates, source/controller/accepted-ability provenance, live source-X structure, and non-future upkeep round;
- malformed/widened privileged semantics fail closed at the loader gateway;
- production runtime contains no Tristan/card-name/`sc-tristan-*` identity routing.

Verification before Candidate creation:
- Tristan readiness focused `11/11 PASS`;
- complex-skills regression `38/38 PASS`;
- MatchSession regression `33/33 PASS`;
- affected total `3 files / 82 tests PASS`;
- typecheck PASS;
- detailed report: `docs/reports/2026-09-30-p3-b-tristan-owner-readiness-capability-result.md`.

Accounting / next step:
- strict formal accounting remains `157/944`, remaining `787`;
- readiness is permanently zero-credit;
- exact Candidate requires one fresh independent R after final gates;
- ACCEPTED -> one A-sync/full-owner rescan while staying on `servant.tristan`; that rescan preserves sc3 and decides the exact newly creditable owner-complete migration set;
- NEEDS_REVISION -> close all exact findings in one successor Candidate, then one fresh R;
- no per-skill review split.

Allowed verdicts:
- `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`

Acceptance synchronization:
- PR #490 exact Candidate `5fb8f59539c17bc868e00d628d50ee5f05bf9812` received `IMPLEMENTATION_ACCEPTED_CANDIDATE` from fresh independent R after one transport-only BLOCKED attempt on the same unchanged Candidate.
- Canonical successful same-attempt Coordinator bounded relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/490#issuecomment-5903982665`.
- Prior transport-only BLOCKED relay: `https://github.com/binchen648/fd/pull/490#issuecomment-5903923637`; it created no code finding and no successor Candidate.
- Exact-Candidate Phase 3 Pre-Review Gate run `36666587166` / job `109732446443` succeeded.
- Readiness remains permanently zero-credit; strict formal accounting stays `157/944`, remaining `787`.
- Full-owner A-rescan confirms current canonical Tristan authoring contains only previously accepted FM04 `sc-tristan-3`; `sc-tristan-1` and `sc-tristan-2` remain absent and are the only newly creditable frozen identities.
- No additional currently discoverable Tristan readiness gap remains beyond the accepted readiness family.
- Acceptance synchronization report: `docs/reports/2026-09-30-p3-a-tristan-owner-readiness-capability-acceptance-synchronization.md`.

## TASK P3-S-OWNER-TRISTAN-COMPLETE-MIGRATION

Owner: Codex S
Status: `SYNCHRONIZED`
Base: `d577b1ebca780ec0332440901486320e7bc04e58`
Classification: formal owner-complete migration for current owner `servant.tristan`

Formal owner scope:
- `servant.tristan.skill.sc-tristan-1` 閳?newly creditable;
- `servant.tristan.skill.sc-tristan-2` 閳?newly creditable;
- `servant.tristan.skill.sc-tristan-3` 閳?preservation-only / already accounted by accepted FM04 migration;
- one existing owner archive, one formal Candidate, one PR, one fresh independent R, then one A-sync/accounting transaction.

Accepted prerequisite:
- readiness PR #490 exact Candidate `5fb8f59539c17bc868e00d628d50ee5f05bf9812`;
- fresh-R verdict `IMPLEMENTATION_ACCEPTED_CANDIDATE`;
- canonical same-attempt bounded relay `https://github.com/binchen648/fd/pull/490#issuecomment-5903982665`;
- accepted zero-credit A-sync/rescan confirms sc1 + sc2 are the complete newly creditable Tristan set and sc3 must be preserved without duplicate credit.

Accounting boundary:
- strict formal accounting remains `157/944`, remaining `787` before formal fresh R and A-sync/accounting;
- no credit before exact formal Candidate receives `MIGRATION_ACCEPTED` plus subsequent A-sync/accounting;
- accepted synchronized outcome may add exactly sc1 + sc2 and move strict formal accounting to `159/944`, remaining `785`;
- sc3 must not be counted again;
- do not advance owners before this Tristan owner batch is reviewed and synchronized.

Allowed verdicts:
- `MIGRATION_ACCEPTED`
- `MIGRATION_NEEDS_REVISION`
- `MIGRATION_BLOCKED`

Implementation:
- completes existing `servant.tristan` authoring archive with newly creditable sc1 + sc2 while preserving already-accounted sc3;
- adds locked-reference 12-card Tristan starting deck and explicit source-image declaration;
- wires Tristan into canonical `fd-playtest-v1` immediately after Tomoe to preserve frozen first-occurrence owner order;
- sc1 consumes accepted duplicate-base-Power close / top-three discard capability and separates canonical true-name declaration from the privileged exact effect shape;
- sc2 consumes accepted private discard-shuffle / physical source-X / location-based battle-upkeep capability; printed Power `X` remains evidence metadata while live `sourceBoundX` is authoritative;
- canonical roster expansion exposed stale eliminated terrain occupants in durable MatchSession authority; generic post-scoring reconciliation now removes non-active/non-present terrain assignments and their stale slots without identity routing;
- no Tristan/card-name/printed-text legacy handler routing is introduced.

Verification:
- Tristan formal `5/5 PASS`;
- Tristan readiness `11/11 PASS`;
- complex skills `38/38 PASS`;
- MatchSession `33/33 PASS`;
- generic MatchSession regressions `11/11 PASS`;
- playtest pack loader `21/21 PASS`;
- affected aggregate `119/119 PASS`;
- `FD_TOOLCHAIN_OK`, typecheck PASS, content validate/compile PASS (`7 masters / 14 servants / 20 events / 0 blocking issues`), generated-content determinism PASS, production identity audit CLEAN, `git diff --check` PASS.
- result report: `docs/reports/2026-09-30-p3-s-owner-tristan-complete-migration-result.md`.

Current disposition:
- implementation is ready for one exact-Candidate Phase 3 gate and one fresh independent formal migration review;
- accounting remains `157/944`, remaining `787` until `MIGRATION_ACCEPTED` plus A-sync/accounting;
- only sc1 + sc2 may receive new credit; sc3 remains preservation-only.
Acceptance synchronization:
- PR #492 exact Candidate `aad7adad30aa30e3a8545733dca1d04b69ed867c` received `MIGRATION_ACCEPTED` from fresh independent R.
- Canonical same-attempt Coordinator bounded relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/492#issuecomment-5904895847`.
- Exact-Candidate Phase 3 Pre-Review Gate run `36672454283` succeeded.
- Accepted owner-complete scope is exactly Tristan sc1 + sc2 + sc3; only sc1 + sc2 are newly creditable and sc3 remains preservation-only / already accounted.
- Formal accounting moves `157/944 -> 159/944`; remaining `785`; readiness and the generic MatchSession durability closure remain zero-credit.
- Mechanical next owner is `servant.ushiwakamaru`; frozen scope is sc1 + sc2 + sc3.
- Owner-readiness-first remains mandatory before any Ushiwakamaru formal consumer migration.
- Acceptance synchronization report: `docs/reports/2026-09-30-p3-a-owner-tristan-acceptance-synchronization.md`.

## TASK P3-B-USHIWAKAMARU-OWNER-READINESS-CAPABILITY

Owner: Codex B
Status: `SYNCHRONIZED`
Base: `7624c6cecd9a0c910477737a5eeaa1035cd55a2d`
Classification: complete currently discoverable Ushiwakamaru owner-readiness/capability batch; permanently zero migration credit

Frozen owner scope:
- `servant.ushiwakamaru.skill.sc-ushiwakamaru-1`;
- `servant.ushiwakamaru.skill.sc-ushiwakamaru-2`;
- `servant.ushiwakamaru.skill.sc-ushiwakamaru-3`.

Current-lineage reconciliation:
- strict formal accounting entering readiness is `159/944`, remaining `785`;
- canonical authoring currently contains only accepted FM01/R26 `sc-ushiwakamaru-3`, which is preservation-only / no duplicate credit;
- sc1 + sc2 are absent from canonical authoring and form the complete currently discoverable owner-local readiness gap set;
- readiness changes no `data/authoring/**` file and grants zero migration credit.

Implemented generic readiness family:
- sc1 source-bound cross-phase bridge permits ordinary action abilities during combat only while the exact live provider remains active/owned/controlled, without resetting ordinary usage authority;
- sc1 unique combat reuse binds one exact already-used action/combat ability on a live owned/controlled attack to one physical provider source; multiple eligible abilities on one attack open a second exact owner-only ability choice instead of excluding the attack; consuming the grant leaves the original usage counter unchanged and consumes only the grant; provider/target/provenance/restore validation fails closed;
- sc2 compares current authoritative player total Power through the existing combat breakdown projection without firing battle triggers and proceeds only on strict `>`;
- sc2 atomically preflights both destinations plus durable terrain occupant/slot authority, swaps only the chosen pair, preserves physical terrain slots, and rejects illegal endpoints with zero partial mutation;
- successful sc2 effect redeployment applies ordinary destination consequences once to each incoming player, including Magic Workshop deployment mana and the existing deployment location/battlefield event hooks; same-location is a no-op;
- sc3 remains untouched preservation-only under accepted FM01/R26.

Verification before Candidate creation:
- Ushiwakamaru readiness `14/14 PASS`;
- complex skills `38/38 PASS`;
- full MatchSession `33/33 PASS`;
- generic MatchSession regressions `11/11 PASS`;
- affected aggregate `96/96 PASS`;
- `FD_TOOLCHAIN_OK`; typecheck PASS;
- content validate/compile PASS (`7 masters / 14 servants / 20 events / 0 blocking issues`);
- generated-content determinism PASS;
- `data/authoring/**` delta EMPTY; production identity audit CLEAN; `git diff --check` PASS;
- detailed report: `docs/reports/2026-09-30-p3-b-ushiwakamaru-owner-readiness-capability-result.md`.

Accounting / next step:
- strict formal accounting remains `159/944`, remaining `785`;
- readiness is permanently zero-credit;
- exact Candidate requires one fresh independent R;
- ACCEPTED -> one A-sync/full-owner rescan while remaining on `servant.ushiwakamaru`; that rescan decides the exact newly creditable owner-complete migration set while preserving sc3;
- NEEDS_REVISION -> close all exact findings in one successor Candidate, then one fresh R;
- no per-skill review split.

Allowed verdicts:
- `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`

Acceptance synchronization:
- PR #493 exact Candidate `2cc5fe6a13d6519f564076c5e1b7897b062f513d` received `IMPLEMENTATION_ACCEPTED_CANDIDATE` from fresh independent R.
- Canonical same-attempt Coordinator bounded relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/493#issuecomment-5906025243`.
- Exact-Candidate Phase 3 Pre-Review Gate run `36681315366` / job `109777161286` succeeded.
- Readiness remains permanently zero-credit; strict formal accounting stays `159/944`, remaining `785`.
- Full-owner A-rescan confirms current canonical Ushiwakamaru authoring contains only accepted FM01/R26 `sc-ushiwakamaru-3`; `sc-ushiwakamaru-1` and `sc-ushiwakamaru-2` remain absent and are the only newly creditable frozen identities.
- No additional currently discoverable Ushiwakamaru readiness gap remains beyond the accepted readiness family.
- Acceptance synchronization report: `docs/reports/2026-09-30-p3-a-ushiwakamaru-owner-readiness-capability-acceptance-synchronization.md`.

## TASK P3-S-OWNER-USHIWAKAMARU-COMPLETE-MIGRATION

Owner: Codex S
Status: `SYNCHRONIZED`
Base: `3b3a57cc7c9e766f66d9349453c6f1703b3b8815`
Classification: formal owner-complete migration for current owner `servant.ushiwakamaru`

Formal owner scope:
- `servant.ushiwakamaru.skill.sc-ushiwakamaru-1` 閳?newly creditable;
- `servant.ushiwakamaru.skill.sc-ushiwakamaru-2` 閳?newly creditable;
- `servant.ushiwakamaru.skill.sc-ushiwakamaru-3` 閳?preservation-only / already accounted by accepted FM01/R26 migration;
- one existing owner archive, one formal Candidate, one PR, one fresh independent R, then one A-sync/accounting transaction.

Accepted prerequisite:
- readiness PR #493 exact Candidate `2cc5fe6a13d6519f564076c5e1b7897b062f513d`;
- fresh-R verdict `IMPLEMENTATION_ACCEPTED_CANDIDATE`;
- canonical same-attempt bounded relay `https://github.com/binchen648/fd/pull/493#issuecomment-5906025243`;
- accepted zero-credit A-sync/rescan confirms sc1 + sc2 are the complete newly creditable Ushiwakamaru set and sc3 must be preserved without duplicate credit.

Accounting boundary:
- strict formal accounting remains `159/944`, remaining `785` before formal fresh R and A-sync/accounting;
- no credit before exact formal Candidate receives `MIGRATION_ACCEPTED` plus subsequent A-sync/accounting;
- accepted synchronized outcome may add exactly sc1 + sc2 and move strict formal accounting to `161/944`, remaining `783`;
- sc3 must not be counted again;
- do not advance owners before this Ushiwakamaru owner batch is reviewed and synchronized.

Allowed verdicts:
- `MIGRATION_ACCEPTED`
- `MIGRATION_NEEDS_REVISION`
- `MIGRATION_BLOCKED`

Implementation / evidence:
- completed canonical Ushiwakamaru archive with sc1 + sc2 while preserving accepted sc3;
- materialized locked-development 12-card starting deck and canonical pack integration;
- sc1 consumes accepted PR #493 cross-phase + one-shot reuse capability with separate true-name declaration;
- sc2 consumes accepted PR #493 strict current-Power + atomic redeployment capability with separate true-name declaration;
- formal 5/5, readiness 14/14, complex 38/38, MatchSession 33/33, generic MatchSession 11/11 => focused aggregate 101/101 PASS;
- canonical pack compile CLI 4/4 PASS; FD_TOOLCHAIN_OK; typecheck PASS; content validate/compile PASS (7 masters / 15 servants / 20 events / 0 blocking issues); generated determinism PASS;
- Base..Candidate packages/rules/src runtime delta EMPTY; production identity audit CLEAN; git diff --check PASS;
- result report: docs/reports/2026-09-30-p3-s-owner-ushiwakamaru-complete-migration-result.md.

Current disposition:
- ready for one exact-Candidate Phase 3 gate and one fresh independent formal migration review;
- accounting is synchronized at 161/944, remaining 783 after exact MIGRATION_ACCEPTED + A-sync/accounting;
- sc1 + sc2 received exactly +2 new credit; sc3 remains preservation-only / +0.
- canonical accepted evidence: https://github.com/binchen648/fd/pull/494#issuecomment-5906305747.
- mechanical next owner is servant.valkyrie; frozen scope is sc-valkyrie-1 + sc-valkyrie-2 + sc-valkyrie-3; owner-readiness-first is mandatory.


## TASK P3-B-VALKYRIE-OWNER-READINESS-CAPABILITY

Owner: Codex B
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Base: `d7dc60c4f51f28651494d2f39677037803287280`
Classification: complete currently discoverable Valkyrie owner-readiness/capability batch; permanently zero migration credit

Frozen owner scope:
- `servant.valkyrie.skill.sc-valkyrie-1`;
- `servant.valkyrie.skill.sc-valkyrie-2`;
- `servant.valkyrie.skill.sc-valkyrie-3`.

Mechanical accounting / preflight:
- strict formal accounting remains `161/944`, remaining `783`;
- no canonical Valkyrie owner archive exists at Base, so all three identities remain formal-migration pending;
- readiness changes no `data/authoring/**` file and grants zero migration credit;
- locked Reference is NON_AUTHORITATIVE for rules semantics.

Implemented generic readiness family:
- sc1 exact definition-set relocation from any current physical zone to independently chosen hand/attack destinations, without normal card-play triggers or counters; per-game usage and decision provenance remain authoritative;
- sc2 action/combat one-arrow movement reuses existing map-arrow/location legality rather than adding a special handler;
- sc2 Steel Shield shape pays current source cost, returns one current live definition-set attack card to hand, then joins the exact resting source to attack without a play event; physical state and mana are preflighted before mutation;
- sc3 preserves the source-grounded `retrigger_card_play_effects` effect name, adds exact active definition-set count authority, and retriggers each current live matching physical card's `on_card_played` event without replay/play-count mutation;
- whole-ability loader gateway is structural/fail-closed and production runtime contains no Valkyrie/name/legacy-handler routing.

Verification before Candidate creation:
- Valkyrie readiness `10/10 PASS`;
- complex skills `38/38 PASS`;
- MatchSession `33/33 PASS`;
- generic MatchSession regressions `11/11 PASS`;
- affected aggregate `92/92 PASS`;
- `FD_TOOLCHAIN_OK`; typecheck PASS;
- content validate/compile PASS (`7 masters / 15 servants / 20 events / 0 blocking issues`);
- generated-content determinism PASS;
- `data/authoring/**` delta EMPTY; production identity audit CLEAN; `git diff --check` PASS;
- detailed report: `docs/reports/2026-09-30-p3-b-valkyrie-owner-readiness-capability-result.md`.

Accounting / next step:
- strict formal accounting remains `161/944`, remaining `783`;
- readiness is permanently zero-credit;
- exact Candidate requires one fresh independent R;
- ACCEPTED -> one A-sync/full-owner rescan while remaining on `servant.valkyrie`;
- NEEDS_REVISION -> close all exact findings in one successor Candidate, then one fresh R;
- no per-skill review split.

Allowed verdicts:
- `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`

Acceptance synchronization:
- PR #495 exact Candidate `6352b1fcfca193cb2c4dfefa9481cecfd4acabcf` received `IMPLEMENTATION_ACCEPTED_CANDIDATE` from fresh independent R.
- Canonical same-attempt Coordinator bounded relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/495#issuecomment-5907322400`.
- Exact-Candidate Phase 3 Pre-Review Gate run `36689318682` / job `109802495094` succeeded.
- Readiness remains permanently zero-credit; strict formal accounting stays `161/944`, remaining `783`.
- Full-owner A-rescan confirms no canonical `data/authoring/servants/servant.valkyrie.json` exists and repository-wide `data/authoring/**` contains no `sc-valkyrie-*` identity.
- All three frozen Valkyrie identities sc1 + sc2 + sc3 therefore remain newly creditable for one later formal owner-complete migration.
- No additional currently discoverable Valkyrie readiness gap remains beyond the accepted readiness family.
- Acceptance synchronization report: `docs/reports/2026-09-30-p3-a-valkyrie-owner-readiness-capability-acceptance-synchronization.md`.

## TASK P3-S-OWNER-VALKYRIE-COMPLETE-MIGRATION

Owner: Codex S
Status: `READY`
Classification: formal owner-complete migration for current owner `servant.valkyrie`

Formal owner scope:
- `servant.valkyrie.skill.sc-valkyrie-1` 鈥?newly creditable;
- `servant.valkyrie.skill.sc-valkyrie-2` 鈥?newly creditable;
- `servant.valkyrie.skill.sc-valkyrie-3` 鈥?newly creditable;
- one owner archive, one formal Candidate, one PR, one fresh independent R, then one A-sync/accounting transaction.

Accepted prerequisite:
- readiness PR #495 exact Candidate `6352b1fcfca193cb2c4dfefa9481cecfd4acabcf`;
- fresh-R verdict `IMPLEMENTATION_ACCEPTED_CANDIDATE`;
- canonical same-attempt bounded relay `https://github.com/binchen648/fd/pull/495#issuecomment-5907322400`;
- accepted zero-credit A-sync/rescan confirms sc1 + sc2 + sc3 are the complete newly creditable Valkyrie set.

Accounting boundary:
- strict formal accounting remains `161/944`, remaining `783` before formal fresh R and A-sync/accounting;
- no credit before exact formal Candidate receives `MIGRATION_ACCEPTED` plus subsequent A-sync/accounting;
- accepted synchronized outcome may add exactly sc1 + sc2 + sc3 and move strict formal accounting to `164/944`, remaining `780`;
- do not advance owners before this Valkyrie owner batch is reviewed and synchronized.

Allowed verdicts:
- `MIGRATION_ACCEPTED`
- `MIGRATION_NEEDS_REVISION`
- `MIGRATION_BLOCKED`

Implementation / evidence:
- canonical `servant.valkyrie` owner archive adds newly creditable sc1 + sc2 + sc3 together;
- canonical frozen 12-card starting deck is integrated immediately after Ushiwakamaru in `fd-playtest-v1`;
- three Commander named deck definitions are zero-credit bounded dependencies so the owner deck and sc1/sc2/sc3 definition references are physical/canonical;
- Commander dependency automation is bounded to explicit on-play Power +2/+3/+6 behavior consumed by sc3 and uses existing generic round Power modifiers; no claim is made for their other printed clauses;
- sc1 consumes accepted PR #495 definition-set relocation/no-play/per-game/restore authority;
- sc2 movement reuses existing one-arrow map authority and Steel Shield consumes accepted current-cost recall/source-join/no-play authority;
- sc3 consumes source-grounded `retrigger_card_play_effects` and real Commander on-play Power effects;
- Base..Candidate `packages/rules/src/**` runtime delta must remain EMPTY and production Valkyrie identity audit CLEAN.

Verification before Candidate freeze:
- formal `5/5 PASS`;
- readiness `10/10 PASS`;
- complex skills `38/38 PASS`;
- MatchSession `33/33 PASS`;
- generic MatchSession `11/11 PASS`;
- playtest pack loader `21/21 PASS`;
- affected aggregate `118/118 PASS`;
- `FD_TOOLCHAIN_OK`; typecheck PASS;
- content validate/compile PASS (`7 masters / 16 servants / 20 events / 0 blocking issues`);
- generated-content determinism PASS;
- Base..working-tree rules-runtime delta EMPTY; production identity audit CLEAN; `git diff --check` PASS;
- detailed report: `docs/reports/2026-09-30-p3-s-owner-valkyrie-complete-migration-result.md`.

Current disposition:
- implementation is ready to freeze one exact formal Candidate / one PR / one fresh independent migration review;
- strict formal accounting remains `161/944`, remaining `783` until `MIGRATION_ACCEPTED` plus A-sync/accounting;
- only sc1 + sc2 + sc3 receive potential new credit (+3); Commander dependencies are zero-credit.
Revision round 1 closure for PR #496:
- predecessor Candidate `0470d2b098b641f616990312857378644ce8745d` received `MIGRATION_NEEDS_REVISION`;
- canonical same-attempt Coordinator relay: `https://github.com/binchen648/fd/pull/496#issuecomment-5907846507`;
- sole P1 finding: adding Valkyrie changed production servant-pool seed selection, causing two Artoria Caster continuation regressions to miss `servant.artoriac` (`31/33` on predecessor vs `33/33` on exact Base);
- closure is bounded to `packages/rules/tests/match-session.test.ts`: both tests now use existing deterministic `createSessionIncludingServant('servant.artoriac')` fixture authority;
- no production runtime or Valkyrie semantic/content change in the revision;
- post-fix MatchSession `33/33 PASS`; exact affected aggregate `118/118 PASS`;
- produce exactly one successor Candidate and request one fresh R; do not re-review predecessor `0470d2b0...`;
- strict formal accounting remains `161/944`, remaining `783` until successor `MIGRATION_ACCEPTED` plus A-sync/accounting.
Acceptance synchronization after successor review:
- PR #496 successor Candidate `aa0a717e4d76001b169c346b5438bfaee7f117ae` received `MIGRATION_ACCEPTED` from fresh independent R.
- Canonical same-attempt Coordinator bounded relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/496#issuecomment-5908085086`.
- Predecessor P1 is closed; successor MatchSession is `33/33 PASS` and affected aggregate is `118/118 PASS`.
- Exact successor Phase 3 Pre-Review Gate run `36694005188` / job `109817532695` succeeded.
- Accepted formal accounting adds exactly Valkyrie sc1 + sc2 + sc3 (`+3`); Commander dependencies remain zero-credit.
- Strict formal accounting moves `161/944 -> 164/944`; remaining `783 -> 780`.
- Acceptance synchronization report: `docs/reports/2026-09-30-p3-a-owner-valkyrie-acceptance-synchronization.md`.
- Mechanical frozen-roster next owner is `servant.vlad` with frozen scope sc1 + sc2 + sc3.

## TASK P3-B-VLAD-OWNER-READINESS-CAPABILITY

Owner: Codex S
Status: `READY`
Classification: zero-credit owner-readiness/capability batch for current owner `servant.vlad`

Frozen owner scope:
- `servant.vlad.skill.sc-vlad-1`
- `servant.vlad.skill.sc-vlad-2`
- `servant.vlad.skill.sc-vlad-3`

Accounting boundary:
- strict formal accounting is `164/944`, remaining `780`;
- readiness is permanently zero-credit;
- one owner / all currently discoverable readiness gaps / one Candidate / one PR / one fresh R / one A-sync-rescan;
- do not split per skill and do not advance owner until Vlad readiness plus subsequent owner-complete migration close.
Implementation evidence for `P3-B-VLAD-OWNER-READINESS-CAPABILITY`:
- Base: `896911354f9833b8437f5f9a231eeba81e8d1584` (accepted Valkyrie owner A-sync/accounting; strict `164/944`, remaining `780`).
- Frozen scope remains sc1 + sc2 + sc3 together; readiness is permanently zero-credit.
- Current-lineage rescan: sc3 already has canonical F1 authoring and is preservation-only; sc1/sc2 remain formal-migration pending.
- Generic structural capability closes terrain doubling, moved-in battlefield fortification + exact next-round deployment, and normal first / terrain-gated paid second hand effect-play.
- No `data/authoring/**` delta and no Vlad/card-name/legacy-handler production routing.
- Focused `13/13 PASS`; complex `38/38`; MatchSession `33/33`; generic MatchSession `11/11`; affected aggregate `95/95 PASS`.
- `FD_TOOLCHAIN_OK`; typecheck PASS; content validate/compile PASS (`7 masters / 16 servants / 20 events / 0 blocking issues`); generated determinism PASS; identity audit CLEAN; diff-check PASS.
- Detailed report: `docs/reports/2026-09-30-p3-b-vlad-owner-readiness-capability-result.md`.
- Current disposition: `IMPLEMENTATION_COMPLETE_CANDIDATE`; freeze one Candidate / one PR / one fresh R. No migration credit before later formal owner acceptance + A-sync/accounting.
- Fresh R on predecessor Candidate `d008527ebee8c638baed9b711c0aaa3ea0480968` returned `IMPLEMENTATION_NEEDS_REVISION`; canonical same-attempt relay: `https://github.com/binchen648/fd/pull/497#issuecomment-5910358128`.
- Sole P1 closure: production `MatchSession.startRound()` now preserves the previous round when entering `advanceAbilityPhase`, generic new-round cleanup retires stale `roundPlayerPowerAdjustments` + `pendingBattlefieldFortifications`, and valid `forcedDeploymentLocations` remain intact for the exact next round.
- Added real MatchSession regressions for (a) fortification -> authoritative win -> next round -> checkpoint/restore with forced-deployment authority preserved, and (b) unconsumed pending fortification -> next round -> stale authority retired before restore.
- Successor verification is `13/13 + 38/38 + 33/33 + 11/11 = 95/95 PASS`; toolchain/typecheck/content/generated/diff/identity gates remain green; readiness remains zero-credit.

### Vlad readiness acceptance synchronization

- Accepted successor Candidate: `0b93b10e62eb793a3e04aeff163a92ce7e3cc2a8`.
- Canonical same-attempt acceptance evidence: `https://github.com/binchen648/fd/pull/497#issuecomment-5910603956`.
- Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`; exact gate run `36710215605` / job `109869949685` `SUCCESS`.
- Readiness A-sync/full-owner rescan finds canonical sc3 only; sc1/sc2 remain absent from `data/authoring/**` and are the only newly creditable Vlad identities.
- sc3 remains preservation-only / zero duplicate credit.
- No additional currently discoverable Vlad owner-local readiness gap remains after the accepted successor closure.
- Readiness remains zero-credit; strict accounting stays `164/944`, remaining `780`.
- Next legal FORMAL task: `P3-S-OWNER-VLAD-COMPLETE-MIGRATION`, frozen sc1 + sc2 + sc3 together, with only sc1/sc2 creditable after formal acceptance + A-sync/accounting.
- Detailed A-sync report: `docs/reports/2026-09-30-p3-a-vlad-owner-readiness-capability-acceptance-synchronization.md`.

## TASK P3-S-OWNER-VLAD-COMPLETE-MIGRATION

Owner: Codex S / FORMAL
Status: `MIGRATION_COMPLETE_CANDIDATE`
Base: `a41cc21459db8067d48344f4ae10aa8b1390264e`
Scope: exact frozen owner `servant.vlad`, sc1 + sc2 + sc3 together.
Accounting: current `164/944`, remaining `780`; only sc1 + sc2 are newly creditable (+2 after `MIGRATION_ACCEPTED` + A-sync/accounting); sc3 preservation-only +0.
Accepted readiness: PR #497 successor `0b93b10e62eb793a3e04aeff163a92ce7e3cc2a8`, canonical evidence `https://github.com/binchen648/fd/pull/497#issuecomment-5910603956`, readiness A-sync `a41cc21459db8067d48344f4ae10aa8b1390264e`.
Formal materialization: extend existing Vlad owner archive with sc1/sc2, preserve sc3, add frozen 12-card deck, integrate Vlad exactly once after Valkyrie, consume accepted identity-free readiness runtime with no new runtime source changes.
Detailed report: `docs/reports/2026-09-30-p3-s-owner-vlad-complete-migration-result.md`.
Fresh R required before any migration credit.

Formal pre-review verification for `P3-S-OWNER-VLAD-COMPLETE-MIGRATION`: `5/5 + 13/13 + 38/38 + 33/33 + 11/11 + 21/21 = 121/121 PASS`; `FD_TOOLCHAIN_OK`; typecheck/content validate/content compile/generated determinism/diff-check PASS; content count `7 masters / 17 servants / 20 events / 0 blocking issues`; Base..Candidate runtime-source delta EMPTY; production Vlad identity audit CLEAN.

Acceptance synchronization after formal review:
- PR #498 exact Candidate `6c6dacebac12166b301206fb6cfd977c66035089` received `MIGRATION_ACCEPTED` from fresh independent R.
- Canonical same-attempt Coordinator bounded relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/498#issuecomment-5911849272`.
- Exact Phase 3 Pre-Review Gate run `36713752437` / job `109882214761` succeeded.
- Accepted formal accounting adds exactly Vlad sc1 + sc2 (`+2`); sc3 remains preservation-only / zero duplicate credit.
- Strict formal accounting moves `164/944 -> 166/944`; remaining `780 -> 778`.
- Acceptance synchronization report: `docs/reports/2026-09-30-p3-a-owner-vlad-acceptance-synchronization.md`.
- Mechanical frozen-roster next owner is `servant.voyager` with frozen scope sc1 + sc2 + sc3 + sc4.

## TASK P3-B-VOYAGER-OWNER-READINESS-CAPABILITY

Owner: Codex S
Status: `READY`
Classification: zero-credit owner-readiness/capability batch for current owner `servant.voyager`

Frozen owner scope:
- `servant.voyager.skill.sc-voyager-1`
- `servant.voyager.skill.sc-voyager-2`
- `servant.voyager.skill.sc-voyager-3`
- `servant.voyager.skill.sc-voyager-4`

Accounting boundary:
- strict formal accounting is `166/944`, remaining `778`;
- readiness is permanently zero-credit;
- one owner / all currently discoverable readiness gaps / one Candidate / one PR / one fresh R / one A-sync-rescan;
- do not split per skill and do not advance owner until Voyager readiness plus subsequent owner-complete migration close.
Implementation evidence for `P3-B-VOYAGER-OWNER-READINESS-CAPABILITY`:
- Base: `b4dbc40e4ecd48da82f6304b427811b24c00f68c` (accepted Vlad owner A-sync/accounting; strict `166/944`, remaining `778`).
- Frozen scope remains sc1 + sc2 + sc3 + sc4 together; readiness is permanently zero-credit.
- Complete current owner-local gap set is covered by one identity-free matching-definition capability family: exact event-player definition provisioning, global optional reveal/+2 VP, matching hand extra-play, global reveal/attack-zero, opponent discard reveal/free play-all/+2 VP transfer, and generated-card +6/link/return provenance.
- No `data/authoring/**` delta and no Voyager/card-name/legacy-handler production routing.
- Focused `8/8 PASS`; affected Voyager + complex + MatchSession aggregate `79/79 PASS`.
- `FD_TOOLCHAIN_OK`; typecheck PASS; content validate/compile PASS (`7 masters / 17 servants / 20 events / 0 blocking issues`); generated determinism PASS; identity audit CLEAN; diff-check PASS.
- Detailed report: `docs/reports/2026-09-30-p3-b-voyager-owner-readiness-capability-result.md`.
- Current disposition: `IMPLEMENTATION_COMPLETE_CANDIDATE`; freeze one Candidate / one PR / one fresh R. No migration credit before later formal owner acceptance + A-sync/accounting.

### Voyager readiness review revision closure
- Predecessor exact Candidate `30748e6fed5276c4cb8c6161ce3869d0fb2d39c5`: `IMPLEMENTATION_NEEDS_REVISION`.
- Canonical same-attempt bounded evidence relay: `https://github.com/binchen648/fd/pull/499#issuecomment-5913302549`.
- P1 closure 1: generated-card controller is now sealed in provenance; marker and +6 adjustment recipients must exactly match sealed controller + generator owner; forged controller/recipient/adjustment snapshots fail restore; consumed battle-end marker/+6 authority is retired.
- P1 closure 2: matching-definition reveal/discard pending interactions revalidate exact controller binding plus live active face-up source both at restore and dispatch; disabled/face-down/moved source continuations fail closed without reward/play mutation.
- Successor verification: `10/10 + 38/38 + 33/33 + 11/11 = 92/92 PASS`; typecheck/content validate/content compile/generated determinism/diff-check PASS; `data/authoring/**` delta EMPTY.
- Readiness remains permanently zero-credit; strict formal accounting stays `166/944`, remaining `778`.
- Freeze exactly one successor Candidate on PR #499 and request one fresh independent R; do not re-review predecessor Candidate.

### Voyager readiness acceptance synchronization

- Accepted successor Candidate: `c0e0fb4f506145a2a93a3ce330fdd9cef3fd6aa8`.
- Canonical same-attempt acceptance evidence: `https://github.com/binchen648/fd/pull/499#issuecomment-5913743850`.
- Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`; exact gate run `36730891403` / job `109939873769` `SUCCESS`.
- Readiness A-sync/full-owner rescan finds no canonical Voyager servant authoring; sc1 + sc2 + sc3 + sc4 are all absent from `data/authoring/**` and all four remain newly creditable.
- No preservation-only duplicate Voyager skill exists in the current canonical authoring lineage.
- No additional currently discoverable Voyager owner-local readiness gap remains after the accepted successor closure.
- Readiness remains zero-credit; strict accounting stays `166/944`, remaining `778`.
- Next legal FORMAL task: `P3-S-OWNER-VOYAGER-COMPLETE-MIGRATION`, frozen sc1 + sc2 + sc3 + sc4 together; all four are creditable only after formal acceptance + A-sync/accounting.
- Detailed A-sync report: `docs/reports/2026-09-30-p3-a-voyager-owner-readiness-capability-acceptance-synchronization.md`.

## TASK P3-S-OWNER-VOYAGER-COMPLETE-MIGRATION

Owner: Codex S / FORMAL
Status: `READY`
Classification: formal owner-complete migration for `servant.voyager`

Frozen owner scope:
- `servant.voyager.skill.sc-voyager-1`
- `servant.voyager.skill.sc-voyager-2`
- `servant.voyager.skill.sc-voyager-3`
- `servant.voyager.skill.sc-voyager-4`

Accounting boundary:
- strict formal accounting remains `166/944`, remaining `778` before formal acceptance;
- all four frozen identities are absent from canonical `data/authoring/**` and are newly creditable;
- successful exact formal `MIGRATION_ACCEPTED` plus A-sync/accounting may add exactly `+4` (`166 -> 170`), leaving `774`;
- one owner / all four remaining frozen skills / one formal Candidate / one PR / one fresh R / one A-sync-accounting;
- consume the accepted identity-free readiness runtime; do not add Voyager/card-name/printed-text/legacy identity routing to production runtime.

Formal materialization requirements:
- create one canonical `data/authoring/servants/servant.voyager.json` owner archive containing sc1 + sc2 + sc3 + sc4 together;
- preserve the frozen 12-card Voyager deck declared by the owner source evidence;
- integrate Voyager exactly once in `fd-playtest-v1` after Vlad in stable owner order;
- add focused owner-complete migration regression proving authoring/pack presence and accepted generic runtime shapes;
- Base for this formal task is the Voyager readiness acceptance-sync commit produced by this transaction.

Implementation evidence for `P3-S-OWNER-VOYAGER-COMPLETE-MIGRATION`:
- Exact Base: `8cbfbf25c958eb9f9647163c077f85224f02827e` (accepted Voyager readiness A-sync/rescan; strict `166/944`, remaining `778`).
- Canonical owner archive `data/authoring/servants/servant.voyager.json` materializes frozen sc1 + sc2 + sc3 + sc4 together; all four were absent at Base and are newly creditable only after formal acceptance + A-sync/accounting.
- sc4 is explicitly `initialPlacement: outside_game`, preserving exactly three in-game skill cards while serving as the generated matching-definition card consumed by sc1/sc2/sc3 and its own accepted generic +6/return contract.
- Frozen 12-card deck is q1, q2x2, q3x3, a2x2, a3, luck, surveilx2.
- `fd-playtest-v1` integrates Voyager exactly once immediately after Vlad in stable owner order.
- Formal regression `6/6 PASS`; readiness `10/10 PASS`; complex `38/38 PASS`; MatchSession `33/33 PASS`; MatchSession regressions `11/11 PASS`; pack loader `21/21 PASS`; affected total `119/119 PASS`.
- Roster expansion changed deterministic sampling for two legacy MatchSession fixtures only; their seeds were minimally rebound while preserving assertions. No production runtime implementation behavior is changed by this formal Candidate.
- `FD_TOOLCHAIN_OK`; typecheck PASS; content validate/compile PASS (`7 masters / 18 servants / 20 events / 0 blocking issues`); generated determinism PASS; production identity audit CLEAN; diff-check PASS.
- Generated hashes: content-library `b001533b86c695069982a85ffa35ec4de3a30b623b41554f4f6441972d65f50e`; fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`; evidence-report `8346639085dad774da89824712814cf56ffd58b91bf407155871aefd255060e6`.
- Detailed result: `docs/reports/2026-09-30-p3-s-owner-voyager-complete-migration-result.md`.
- Current disposition: `MIGRATION_COMPLETE_CANDIDATE`; freeze one exact Candidate / one PR / one fresh R. Accounting remains `166/944`, remaining `778` until `MIGRATION_ACCEPTED` + A-sync/accounting; accepted credit would be exactly `+4` -> `170/944`, remaining `774`.

Acceptance synchronization after formal review:
- PR #500 exact Candidate `712f9e86ba09da723ebbaa7d2f91f3dd8462dc20` received `MIGRATION_ACCEPTED` from fresh independent R.
- Canonical same-attempt Coordinator bounded relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/500#issuecomment-5914373925`.
- Exact Phase 3 Pre-Review Gate run `36734879053` / job `109953848402` succeeded.
- Accepted formal accounting adds exactly Voyager sc1 + sc2 + sc3 + sc4 (`+4`); no preservation-only duplicate exists.
- Strict formal accounting moves `166/944 -> 170/944`; remaining `778 -> 774`.
- Acceptance synchronization report: `docs/reports/2026-09-30-p3-a-owner-voyager-acceptance-synchronization.md`.
- Mechanical frozen-roster next owner is `servant.xiangyu` with frozen scope sc1 + sc2 + sc3.

## TASK P3-B-XIANGYU-OWNER-READINESS-CAPABILITY

Owner: Codex S
Status: `READY`
Classification: zero-credit owner-readiness/capability batch for current owner `servant.xiangyu`

Frozen owner scope:
- `servant.xiangyu.skill.sc-xiangyu-1`
- `servant.xiangyu.skill.sc-xiangyu-2`
- `servant.xiangyu.skill.sc-xiangyu-3`

Accounting boundary:
- strict formal accounting is `170/944`, remaining `774`;
- readiness is permanently zero-credit;
- one owner / all currently discoverable readiness gaps / one Candidate / one PR / one fresh R / one A-sync-rescan;
- do not split per skill and do not advance beyond Xiang Yu until readiness plus subsequent owner-complete migration close.
Implementation evidence for `P3-B-XIANGYU-OWNER-READINESS-CAPABILITY`:
- Exact Base: `f79cab7c4d3580f838bf117a22f7d92bd30eed92` (accepted Voyager owner A-sync/accounting; strict `170/944`, remaining `774`).
- Frozen scope remains sc1 + sc2 + sc3 together; readiness is permanently zero-credit.
- Complete current owner-local gap set is covered by one identity-free reaction-counter capability family: exact round arm/provenance, opponent own-action skill/Seal/move observation, battle-end ceil-half decay, repeatable 1/2/4/7 reaction purchases, 1-mana -> 2-reaction conversion, and movement-distance-gated physical-source base-Power doubling.
- Card-play Seal costs are explicitly excluded from Seal-use observation; skill batch events use exact physical event source identity to prevent double counting.
- No `data/authoring/**` delta and no Xiang Yu/card-name/legacy-handler production routing.
- Focused `11/11 PASS`; neighboring/complex/MatchSession/base-Power affected aggregate **`128/128 PASS`**.
- `FD_TOOLCHAIN_OK`; typecheck PASS; content validate/compile PASS (`7 masters / 18 servants / 20 events / 0 blocking issues`); generated determinism PASS; identity audit CLEAN; diff-check PASS.
- Detailed report: `docs/reports/2026-09-30-p3-b-xiangyu-owner-readiness-capability-result.md`.
- Current disposition: `IMPLEMENTATION_COMPLETE_CANDIDATE`; freeze one Candidate / one PR / one fresh R. Accounting remains `170/944`, remaining `774`.

### Xiang Yu readiness acceptance synchronization

- Accepted Candidate: `f74e824238bd96a6679648376cf8c3d6ce48125c`.
- Canonical same-attempt bounded acceptance evidence: `https://github.com/binchen648/fd/pull/501#issuecomment-5915261626`.
- Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`; exact gate run `36740790785` / job `109974331534` `SUCCESS`.
- Readiness A-sync/full-owner rescan finds no canonical Xiang Yu servant authoring; sc1 + sc2 + sc3 are all absent from data/authoring/** and all three remain newly creditable.
- No preservation-only duplicate Xiang Yu skill exists in current canonical authoring lineage.
- No additional currently discoverable Xiang Yu owner-local readiness gap remains after accepted readiness closure.
- Readiness remains zero-credit; strict accounting stays 170/944, remaining 774.
- Next legal FORMAL task: P3-S-OWNER-XIANGYU-COMPLETE-MIGRATION, frozen sc1 + sc2 + sc3 together; all three are creditable only after formal acceptance + A-sync/accounting.
- Detailed A-sync report: `docs/reports/2026-09-30-p3-a-xiangyu-owner-readiness-capability-acceptance-synchronization.md`.

## TASK P3-S-OWNER-XIANGYU-COMPLETE-MIGRATION

Owner: Codex S / FORMAL
Status: READY
Classification: formal owner-complete migration for servant.xiangyu

Frozen owner scope:
- servant.xiangyu.skill.sc-xiangyu-1
- servant.xiangyu.skill.sc-xiangyu-2
- servant.xiangyu.skill.sc-xiangyu-3

Accounting boundary:
- strict formal accounting remains 170/944, remaining 774 before formal acceptance;
- all three frozen identities are absent from canonical data/authoring/** and are newly creditable;
- successful exact formal MIGRATION_ACCEPTED plus A-sync/accounting may add exactly +3 (170 -> 173), leaving 771;
- one owner / all three remaining frozen skills / one formal Candidate / one PR / one fresh R / one A-sync-accounting;
- consume the accepted identity-free Reaction readiness runtime; do not add Xiang Yu/card-name/printed-text/legacy identity routing to production runtime.

Formal materialization requirements:
- create one canonical data/authoring/servants/servant.xiangyu.json owner archive containing sc1 + sc2 + sc3 together;
- preserve the frozen 12-card Xiang Yu deck from locked source evidence: b1, b2, b3, b4, b5x2, q1, q2, q5x2, luck, surveil;
- integrate Xiang Yu exactly once after Voyager in stable owner order;
- add focused owner-complete migration regression proving authoring/pack presence and accepted generic runtime shapes;
- Base for this formal task is this Xiang Yu readiness acceptance-sync commit.

Implementation evidence for `P3-S-OWNER-XIANGYU-COMPLETE-MIGRATION`:
- Exact Base: `946d8dcd4c81308d062bfd19aeb4bb63936484ff` (accepted Xiang Yu readiness A-sync/rescan; strict `170/944`, remaining `774`).
- Canonical owner archive `data/authoring/servants/servant.xiangyu.json` materializes frozen sc1 + sc2 + sc3 together; all three were absent at Base and remain newly creditable only after formal acceptance + A-sync/accounting.
- Static metadata: sc1 鎴樻湳韬綋 = 琚姩 / 0 / 0; sc2 闇哥帇涔嬫 = 琚姩 / 0 / 0; sc3 鍔涙嫈灞卞叜姘旂洊涓?= 杩呮嵎/瀹濆叿 / cost 6 / base Power 7 / 鐪熷悕瑙ｆ斁.
- Frozen 12-card deck is b1, b2, b3, b4, b5x2, q1, q2, q5x2, luck, surveil.
- `fd-playtest-v1` integrates Xiang Yu exactly once immediately after Voyager in stable frozen-owner order.
- Formal regression `6/6 PASS`; accepted readiness `11/11 PASS`; Tezcat Command-Seal neighboring `8/8`; complex `38/38`; MatchSession `33/33`; MatchSession regressions `11/11`; base-Power/revealed-source neighboring `27/27`; pack loader `21/21`; affected total `155/155 PASS`.
- `FD_TOOLCHAIN_OK`; typecheck PASS; content validate/compile PASS (`7 masters / 19 servants / 20 events / 0 blocking issues`); generated determinism PASS; Base..working-tree production runtime delta EMPTY; Xiang Yu production identity audit CLEAN; diff-check PASS.
- Generated hashes: content-library `eea4a067812644adb41989b3519fceddd0b11ba5985856e3f0fd525ffb713d52`; fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`; evidence-report `fe7a7388fda1eaa0fcab6b80dbb08104cabc2e27ccc0285be535045267cfb6f2`.
- Detailed result: `docs/reports/2026-10-01-p3-s-owner-xiangyu-complete-migration-result.md`.
- Current disposition: `MIGRATION_COMPLETE_CANDIDATE`; freeze one exact Candidate / one PR / one fresh R. Accounting remains `170/944`, remaining `774` until `MIGRATION_ACCEPTED` + A-sync/accounting; accepted credit would be exactly `+3` -> `173/944`, remaining `771`.

Acceptance synchronization after formal review:
- PR #502 exact Candidate `acde60a437d27f963fa061c81836e65d86b1f3ba` received `MIGRATION_ACCEPTED` from fresh independent R.
- Canonical same-attempt Coordinator bounded relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/502#issuecomment-5915589848`.
- Exact Phase 3 Pre-Review Gate run `36744941005` / job `109988630721` succeeded.
- Accepted formal accounting adds exactly Xiang Yu sc1 + sc2 + sc3 (`+3`); no preservation-only duplicate exists.
- Strict formal accounting moves `170/944 -> 173/944`; remaining `774 -> 771`.
- Acceptance synchronization report: `docs/reports/2026-10-01-p3-a-owner-xiangyu-acceptance-synchronization.md`.
- Xiang Yu is the final owner in stable first-occurrence frozen-owner ordering. Mechanical wrap-around to the first globally incomplete owner selects `master.akasha`.
- Material presence and strict accepted accounting remain distinct: canonical frozen material currently contains `179/944`, while strict independently accepted accounting after this transaction is `173/944`; no unreviewed material is credited.

## TASK P3-B-AKASHA-OWNER-READINESS-CAPABILITY

Owner: Codex S / FORMAL
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Classification: zero-credit owner-readiness/capability batch for current owner `master.akasha`

Frozen owner scope:
- `master.akasha.skill.ascension`
- `master.akasha.skill.s1`
- `master.akasha.skill.s1a`
- `master.akasha.skill.s2`
- `master.akasha.skill.s3`
- `master.akasha.skill.s4`
- `master.akasha.skill.s5`
- `master.akasha.skill.s6`

Accounting boundary:
- strict formal accounting is `173/944`, remaining `771`;
- readiness is permanently zero-credit;
- current canonical `data/authoring/**` contains `0/8` frozen Akasha identities;
- one owner / all currently discoverable readiness gaps / one Candidate / one PR / one fresh R / one A-sync-rescan;
- do not split per skill and do not grant migration credit from readiness work.

Mechanical preflight facts:
- stable frozen inventory contains 251 owners; `servant.xiangyu` is owner 251/251 and `master.akasha` is the first globally incomplete owner on wrap-around;
- frozen Akasha scope is exactly 8 identities;
- `master.akasha.skill.s1` is currently `CONTRACT_MAPPED`; the other seven inventory entries are currently `EXPLICIT_BLOCK` / source-evidence-required and must be mechanically reconciled against current repo evidence before implementation;
- production identity-specific Reference handlers are evidence only and must not be copied into new owner-specific runtime routing without a current generic capability contract.

Implementation evidence for `P3-B-AKASHA-OWNER-READINESS-CAPABILITY`:
- Exact Base: `3b82108ac397d8fb9010a5691f28fd3e24008e12` (accepted Xiang Yu owner A-sync/accounting; strict `173/944`, remaining `771`).
- The seven source-evidence-blocked Akasha rows were mechanically recertified against frozen source text; locked Reference identity handlers are corroboration only.
- One identity-free `vessel-cycle-capability` family closes the currently discoverable owner-local gaps: three-stage Vessel lifecycle, authoritative earned-VP accounting, battle-loss/defeat scheduling, next-round reincarnation, Roa Recon bonus, Elesia conditional skill aura, Shiki play exception/Square, Overload close/copy/terrain join lifecycle, final-form provisioning, and once-per-Climax placement.
- Restore rejects forged Vessel/provider/card-round provenance. Low-mana +3, terrain-join +2, and Square x2 are exact round/source/ability/definition-bound and expire next round.
- No `data/authoring/**` delta and no Akasha/card-name/legacy-handler production identity routing.
- Focused `15/15 PASS`; directly affected `133/133 PASS`; complex `38/38`; MatchSession `33/33`; MatchSession restore regressions `11/11`; affected aggregate **`230/230 PASS`**.
- `FD_TOOLCHAIN_OK`; typecheck PASS; content validate/compile PASS (`7 masters / 19 servants / 20 events / 0 blocking issues`); generated determinism PASS; identity audit CLEAN; diff-check PASS.
- Detailed report: `docs/reports/2026-10-01-p3-b-akasha-owner-readiness-capability-result.md`.
- Current disposition: `IMPLEMENTATION_COMPLETE_CANDIDATE`; freeze one Candidate / one PR / one fresh R. Accounting remains `173/944`, remaining `771`.

Revision evidence for `P3-B-AKASHA-OWNER-READINESS-CAPABILITY` after predecessor review:
- predecessor Candidate `b480e516e6e990f3a64abef151e92ce903a4cf60` -> `IMPLEMENTATION_NEEDS_REVISION`;
- canonical bounded same-attempt evidence: `https://github.com/binchen648/fd/pull/503#issuecomment-5916399748`;
- both P1 findings closed in one successor revision: real play requirement-gate wiring for exact Vessel-cycle threshold exception, plus pre-payment low-mana provenance sealed through real play state construction;
- real `playAbilityCardBatch()` regressions cover non-final-Vessel 7-mana rejection, exact final-Vessel 7-mana low-mana success, and 8-mana normal-play non-misclassification;
- successor verification: focused `15/15`, neighboring `80/80`, authoring/content/complex `131/131`, MatchSession/restore `44/44`, aggregate **`255/255 PASS`**; typecheck/content/generated/diff-check PASS; `data/authoring/**` EMPTY; production identity audit CLEAN;
- readiness remains zero-credit at `173/944`, remaining `771`; one successor Candidate / one fresh R required.

### Akasha readiness acceptance synchronization

- Accepted successor Candidate: `214e77133d9f7c006123f950ac834df693c90130`.
- Canonical same-attempt bounded acceptance evidence: `https://github.com/binchen648/fd/pull/503#issuecomment-5916640287`.
- Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`; exact successor gate run `36753465480` / job `110017671338` `SUCCESS`.
- The user-visible Reviewer relay prose was truncated after the accounting line; the canonical Coordinator relay intentionally preserves only the exact terminal facts that were visibly supported.
- Readiness A-sync/full-owner rescan finds no canonical Akasha authoring; all 8 frozen identities remain absent from `data/authoring/**` and all eight remain newly creditable.
- No preservation-only duplicate Akasha identity exists in the current canonical authoring lineage.
- No additional currently discoverable Akasha owner-local readiness gap remains after accepted successor closure.
- Readiness remains zero-credit; strict accounting stays `173/944`, remaining `771`.
- Next legal FORMAL task: `P3-S-OWNER-AKASHA-COMPLETE-MIGRATION`, all 8 frozen identities together; all eight are creditable only after formal acceptance + A-sync/accounting.
- Detailed A-sync report: `docs/reports/2026-10-01-p3-a-akasha-owner-readiness-capability-acceptance-synchronization.md`.

## TASK P3-S-OWNER-AKASHA-COMPLETE-MIGRATION

Owner: Codex S / FORMAL
Status: `MIGRATION_ACCEPTED`
Classification: formal owner-complete migration for `master.akasha`

Frozen owner scope:
- `master.akasha.skill.ascension`
- `master.akasha.skill.s1`
- `master.akasha.skill.s1a`
- `master.akasha.skill.s2`
- `master.akasha.skill.s3`
- `master.akasha.skill.s4`
- `master.akasha.skill.s5`
- `master.akasha.skill.s6`

Accounting boundary:
- strict formal accounting remains `173/944`, remaining `771` before formal acceptance;
- all eight frozen identities are absent from canonical `data/authoring/**` and are newly creditable;
- successful exact formal `MIGRATION_ACCEPTED` plus A-sync/accounting may add exactly `+8` (`173 -> 181`), leaving `763`;
- one owner / all eight frozen identities / one formal Candidate / one PR / one fresh R / one A-sync-accounting;
- consume the accepted identity-free Vessel-cycle readiness runtime; do not add Akasha/card-name/printed-text/legacy identity routing to production runtime.

Formal materialization requirements:
- create one canonical Akasha master owner archive containing the complete 8-identity frozen scope together;
- preserve frozen source/static metadata and the accepted Vessel-cycle semantic contract;
- integrate Akasha exactly once in the stable master content order;
- add focused owner-complete migration regression proving canonical authoring/pack presence plus accepted generic runtime shapes;
- Base for this formal task is the Akasha readiness acceptance-sync commit produced by this transaction.

### Akasha formal-preflight readiness correction

- Formal materialization preflight after readiness A-sync `d57ceeb3b1796db1a2069e446b7841b5763ae367` exposed one additional generic gap in frozen `s1銆愬懡鐞嗐€慲: each enabled battlefield needs a temporary `s6銆愯繃璐熻嵎銆慲 physical copy carrying authoritative `placedAtLocationId` provenance.
- Existing generic `create_card` can create a zone card but cannot bind a generated card to a battlefield location; the later accepted `銆愭哺鑵俱€慲 exact-location join therefore cannot consume such a card safely.
- Formal Akasha consumer migration is paused before any `data/authoring/**` write; no formal Candidate was created.
- New bounded zero-credit follow-up task: `P3-B-AKASHA-OWNER-READINESS-LOCATION-PROVISIONING`.

## TASK P3-B-AKASHA-OWNER-READINESS-LOCATION-PROVISIONING

Owner: Codex B / FORMAL readiness follow-up
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Classification: bounded zero-credit generic location-provisioning closure for the complete current `master.akasha` owner preflight

Scope boundary:
- add one identity-free exact `vessel_cycle_game_start_battlefield_provision` shape;
- target exact authoring-supplied definition at every enabled battlefield with physical `generatedBy` + `placedAtLocationId` provenance;
- repeated game-start delivery is idempotent; duplicate matching source/location state fails closed;
- reuse existing `provision_skill_cards` for the separate skill-zone copy;
- no `data/authoring/**` delta, no Akasha identity routing, permanently zero credit.

Accounting boundary:
- strict formal accounting remains `173/944`, remaining `771`;
- Akasha 8-identity formal owner-complete task remains blocked until exact follow-up acceptance + A-sync/rescan.

Verification:
- Akasha focused `17/17 PASS`;
- provisioning/outside-game/executable-pack group included in `86/86 PASS`;
- authoring/content/complex `131/131 PASS`;
- MatchSession + restore `44/44 PASS`;
- affected aggregate **`261/261 PASS`**;
- toolchain/typecheck/content/generated/identity-audit/diff-check all PASS;
- `data/authoring/**` delta EMPTY.

Detailed report: `docs/reports/2026-10-01-p3-b-akasha-owner-readiness-location-provisioning-result.md`.

### Akasha location-provisioning readiness acceptance synchronization

- Accepted Candidate: `ff26b046be5ea5e3ef2302e756e52fcbcd919a6c`.
- Canonical same-attempt bounded acceptance evidence: `https://github.com/binchen648/fd/pull/504#issuecomment-5916944435`.
- Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`; exact gate run `36755548497` / job `110024740882` `SUCCESS`.
- Full-owner rescan confirms canonical `data/authoring/**` still contains `0/8` frozen Akasha identities; all eight remain newly creditable and none is preservation-only.
- The follow-up closes the last currently discoverable `s1` generic gap: one temporary target-definition physical card at each enabled battlefield with exact `generatedBy` + authoritative `placedAtLocationId` provenance, while the separate skill-zone copy continues to use accepted `provision_skill_cards`.
- No additional currently discoverable Akasha owner-local readiness gap remains after exact #504 acceptance.
- Readiness remains zero-credit; strict accounting stays `173/944`, remaining `771`.
- `P3-S-OWNER-AKASHA-COMPLETE-MIGRATION` is unblocked and `READY`; all 8 frozen identities must migrate together in one formal Candidate / one PR / one fresh R / one A-sync-accounting.
- Detailed A-sync report: `docs/reports/2026-10-01-p3-a-akasha-owner-readiness-location-provisioning-acceptance-synchronization.md`.
### Akasha formal-preflight seven-player master-pool correction

- Formal materialization from exact A-sync Base `b2b224f17c1fb6cd835654d7b80ce54bd6d0b05c` successfully loaded the 8-identity Akasha consumer and content pipeline, then exposed one additional identity-free runtime gap: `MatchSession.buildInitialState()` mapped the complete playable Master pool to player IDs while the session creates exactly seven active seats.
- The pre-existing seven-master pack masked this coupling. Adding Akasha as the eighth playable Master caused an eighth pairing (`p8`) to target no active player and fail before normal session startup.
- The partially materialized formal consumer was preserved locally at `4e35b7d4cf35f76e8e71caff47b648e3c7c10e50`; it was not pushed, no PR was created, and it is not a formal Candidate.
- Formal Akasha migration is paused again before Candidate publication; no migration credit was granted.
- New bounded zero-credit follow-up task: `P3-B-AKASHA-OWNER-READINESS-SEVEN-PLAYER-MASTER-POOL`.

## TASK P3-B-AKASHA-OWNER-READINESS-SEVEN-PLAYER-MASTER-POOL

Owner: Codex B / FORMAL readiness follow-up
Status: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
Classification: bounded zero-credit generic seven-player playable-character pool closure discovered by Akasha formal preflight

Exact Base:
- `b2b224f17c1fb6cd835654d7b80ce54bd6d0b05c` (accepted Akasha location-provisioning readiness A-sync; strict accounting `173/944`, remaining `771`).

Scope boundary:
- keep the product/session player boundary exactly seven seats (`p1..p7`);
- when playable Master/Servant pools contain more than seven definitions, deterministically seeded-shuffle and select exactly seven of each;
- fail closed when either playable pool contains fewer than seven definitions;
- do not mutate the caller pools;
- do not introduce owner/card-name/printed-text routing;
- no `data/authoring/**` delta, no Akasha consumer materialization in this readiness Candidate, permanently zero migration credit.

Verification:
- seven-player pool focused regression `3/3 PASS`;
- MatchSession `33/33 PASS`;
- MatchSession restore regressions `11/11 PASS`;
- complex shared regressions `38/38 PASS`;
- executable-card-pack `50/50 PASS`;
- playtest-pack-loader `21/21 PASS`;
- affected aggregate **`156/156 PASS`**;
- `FD_TOOLCHAIN_OK`; typecheck PASS;
- content validate/compile PASS (`7 masters / 19 servants / 20 events / 0 blocking issues`);
- generated determinism PASS with unchanged hashes;
- `data/authoring/**` delta EMPTY; production Akasha identity audit CLEAN; `git diff --check` PASS.

Accounting boundary:
- readiness remains permanently zero-credit;
- strict formal accounting remains `173/944`, remaining `771`;
- `P3-S-OWNER-AKASHA-COMPLETE-MIGRATION` remains blocked until exact follow-up acceptance + FORMAL A-sync/full-owner rescan.

Detailed report: `docs/reports/2026-10-01-p3-b-akasha-owner-readiness-seven-player-master-pool-result.md`.
### Akasha seven-player master-pool readiness acceptance synchronization

- Accepted Candidate: `5f1a37d53fa0e6b2c2b21a13c3df39cec03ff0ec`.
- Canonical same-attempt bounded acceptance evidence: `https://github.com/binchen648/fd/pull/505#issuecomment-5917276459`.
- Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`; exact gate run `36758262351` / job `110033947596` `SUCCESS`.
- Full-owner rescan confirms canonical `data/authoring/**` still contains `0/8` frozen Akasha identities; all eight remain newly creditable and none is preservation-only.
- The accepted follow-up closes the shared seven-player pool-size gap: MatchSession now selects exactly seven deterministic Master/Servant pairings from larger playable pools, fails closed below seven, and never creates `p8` authority.
- No additional currently discoverable Akasha owner-local readiness gap remains after exact #505 acceptance.
- Readiness remains zero-credit; strict accounting stays `173/944`, remaining `771`.
- `P3-S-OWNER-AKASHA-COMPLETE-MIGRATION` is unblocked and `READY`; all 8 frozen identities must migrate together in one formal Candidate / one PR / one fresh R / one A-sync-accounting.
- Detailed A-sync report: `docs/reports/2026-10-01-p3-a-akasha-owner-readiness-seven-player-master-pool-acceptance-synchronization.md`.

### Akasha formal owner-complete implementation evidence

- Exact formal Base: `e2e79392c78dadbd17d53da9e48c9af5000592a9` (accepted seven-player readiness A-sync; strict `173/944`, remaining `771`).
- One canonical `master.akasha` archive materializes all 8 frozen identities together; all eight were absent at Base and remain newly creditable only after exact formal acceptance + A-sync/accounting.
- The consumer uses accepted #503/#504/#505 identity-free capability contracts; Base..Candidate production runtime delta is EMPTY and production Akasha identity audit is CLEAN.
- Akasha is integrated exactly once as the eighth canonical playable Master; existing seven Master order is preserved.
- Shared fixture updates remove hard-coded seven-master/archive-index assumptions and mechanically realign only the deterministic MatchSession scenarios affected by the accepted >7 pool selection contract.
- Verification: formal `6/6`, readiness `17/17`, seven-player `3/3`, provisioning `7/7`, outside-game `12/12`, complex `38/38`, executable pack `50/50`, pack loader `21/21`, MatchSession `33/33`, restore `11/11`; affected aggregate **`198/198 PASS`**.
- `FD_TOOLCHAIN_OK`; typecheck PASS; content validate/compile PASS (`8 masters / 19 servants / 20 events / 0 blocking issues`); generated determinism PASS; diff-check PASS.
- Supplemental source-assets-required check still reports 93 pre-existing unrelated missing assets; Akasha is not in the missing set.
- Generated hashes: content-library `9bded243cd7dddf19f7896c2f1af6f79b917e9a28d76fd13071529cbdd8d316e`; fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`; evidence-report `fd3081d8fadf2f81a7e070feff815ac893e2188cb5d3b18efdd74cc1b8460f8c`.
- Detailed report: `docs/reports/2026-10-01-p3-s-owner-akasha-complete-migration-result.md`.
- Current disposition: `MIGRATION_COMPLETE_CANDIDATE`; freeze one exact formal Candidate / one PR / one fresh independent R. No credit before `MIGRATION_ACCEPTED` + A-sync/accounting.

### Akasha formal owner acceptance synchronization

- PR #506 exact Candidate: `baa4418719cbca0e98cb393791eecb580113316f`.
- Exact Base: `e2e79392c78dadbd17d53da9e48c9af5000592a9`.
- Canonical same-attempt bounded acceptance evidence: `https://github.com/binchen648/fd/pull/506#issuecomment-5917599345`.
- Verdict: `MIGRATION_ACCEPTED`; exact fresh edited Phase 3 gate run `36760689494` / job `110042171521` = `SUCCESS`.
- All eight frozen Akasha identities were absent from canonical authoring at Base and are newly creditable; preservation-only count is zero.
- Formal accounting moves exactly `+8`: `173/944 -> 181/944`, remaining `771 -> 763`.
- No duplicate readiness credit is added. #503/#504/#505 remain zero-credit readiness lineage only.
- Mechanical stable owner ordering wraps from the prior end-of-roster servant sequence to the first globally incomplete owner. After Akasha closes, the next globally incomplete owner is `master.akiha`.
- Canonical `data/authoring/**` contains `0/5` frozen Akiha identities and Task Index contains no prior Akiha migration/readiness credit.
- Inventory classifies all five Akiha identities as `SOURCE_EVIDENCE_REQUIRED / EXPLICIT_BLOCK` with current route `none`; therefore the next legal FORMAL transaction is owner-readiness-first.
- Detailed A-sync report: `docs/reports/2026-10-01-p3-a-owner-akasha-acceptance-synchronization.md`.

## TASK P3-B-AKIHA-OWNER-READINESS-CAPABILITY

Owner: Codex B / FORMAL readiness
Status: `IMPLEMENTATION_COMPLETE_SUCCESSOR_CANDIDATE`
Classification: bounded zero-credit owner-readiness/capability batch for the complete current `master.akiha` frozen scope

Frozen owner scope:
- `master.akiha.skill.ascension`
- `master.akiha.skill.s1`
- `master.akiha.skill.s1a`
- `master.akiha.skill.s2`
- `master.akiha.skill.s3`

Accounting boundary:
- strict formal accounting after Akasha synchronization: `181/944`, remaining `763`;
- readiness is permanently zero migration credit;
- canonical `data/authoring/**` currently contains `0/5` frozen Akiha identities;
- all five inventory rows are `SOURCE_EVIDENCE_REQUIRED / EXPLICIT_BLOCK`, current route `none`;
- locked Reference handler `core.akiha-bloodlust` is corroboration only and must not be copied as owner/card-name identity routing.

Required disposition:
- recertify all five frozen printed/source semantics together;
- scan the complete owner for currently discoverable generic capability gaps before any consumer migration;
- close all discovered readiness gaps in one bounded owner-readiness batch where compatible;
- fresh independent R, then A-sync/full-owner rescan;
- only after readiness closure may `P3-S-OWNER-AKIHA-COMPLETE-MIGRATION` be created;
- do not split per skill and do not grant credit from readiness.

### Akiha owner-readiness implementation evidence

- Exact Base: `d55f1bd56cfb156819c2d64c55259b75ab23d4c6` (accepted Akasha formal A-sync; strict `181/944`, remaining `763`).
- All five frozen source semantics were mechanically recertified together; locked Reference `core.akiha-bloodlust` is corroboration only.
- New identity-free Bloodlust family closes structured resource tracking, explicit same-battlefield mana contribution, deterministic battle-end decay, threshold 5/10/15 rules, transform resource/mana/VP/seal semantics and ascension cost/Power/plunder provenance.
- Card and ordinary ability positive mana transactions consume explicit server-validated contributor choices atomically; physical card plays seal exact contributor provenance for restore and ascension plunder.
- Restore re-resolves provider/transform authority, exact 15 lock, VP baseline, contribution players and the source-bound current-round +2 Power authority; forged state fails closed.
- The neighboring Maiya test fixture was corrected from a stale hard-coded `p2` target to the actual legal pending target after the accepted eight-Master pool changed deterministic seats; production fixed-cost behavior remains unchanged.
- Verification: Akiha focused `11/11`; neighboring/shared affected aggregate **`232/232 PASS`**; `FD_TOOLCHAIN_OK`; typecheck/content/generated/identity-audit/diff-check all PASS.
- `data/authoring/**` delta EMPTY; readiness remains permanently zero-credit; strict accounting stays `181/944`, remaining `763`.
- Detailed report: `docs/reports/2026-10-01-p3-b-akiha-owner-readiness-capability-result.md`.
- Predecessor Candidate `2e2288a51ed8a71831fd7f0633b9b7150f2d786d` -> `IMPLEMENTATION_NEEDS_REVISION`; canonical relay `https://github.com/binchen648/fd/pull/507#issuecomment-5920958682`.
- Successor closes all three P1s together: same-transaction VP half-floor at both authoritative VP mutation routes; all-prefix Bloodlust restore-family validation; server-owned physical mana-contribution seal required for restore and ascension plunder.
- Successor verification: direct closure `16/16 PASS`; broad affected `250/251` with one parallel-only 5s MatchSession timeout, exact isolated rerun `11/11 PASS`; toolchain/typecheck/content/generated/identity/diff-check green.
- Current disposition: freeze one exact successor Candidate on PR #507 and request one fresh independent R. No Akiha formal consumer migration before successor acceptance + FORMAL A-sync/full-owner rescan.
- Successor a1f7f60f65b614a7d9f23db78f926776e4bb4e02 -> IMPLEMENTATION_NEEDS_REVISION; canonical relay https://github.com/binchen648/fd/pull/507#issuecomment-5921120983.
- Remaining P1 closed by replacing serialized playManaContributionSeal with hidden WeakMap server authority plus secret-backed HMAC persistence/restore; visible contribution fields alone no longer authorize plunder.
- Second-successor verification: Akiha focused 12/12, shared non-MatchSession 189/189, MatchSession 33/33, restore 11/11; unique affected 233/233 PASS; static/content/generated/identity/diff gates green.
- Current disposition: freeze one new exact successor Candidate on PR #507 and request one fresh independent R; readiness remains zero-credit.

### Akiha owner-readiness capability acceptance synchronization

- PR #507 exact accepted readiness Candidate: `4761a2f88fe9fccae4f5d972174f45b9bfb9dd48`.
- Exact Base: `d55f1bd56cfb156819c2d64c55259b75ab23d4c6`.
- Canonical Coordinator bounded same-attempt acceptance evidence: `https://github.com/binchen648/fd/pull/507#issuecomment-5922028179`.
- Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`; exact fresh gate run `36789102737` / job `110137479988` = `SUCCESS`.
- Full-owner rescan confirms canonical `data/authoring/**` still contains `0/5` frozen Akiha identities; all five remain newly creditable and none is preservation-only.
- Accepted readiness closes the complete current Akiha generic Bloodlust capability family, including server-owned hidden contribution authority and authenticated persistence/restore; no additional currently discoverable Akiha owner-local readiness gap remains.
- Readiness remains permanently zero-credit; strict accounting stays `181/944`, remaining `763`.
- `P3-S-OWNER-AKIHA-COMPLETE-MIGRATION` is now unblocked and `READY`; all 5 frozen identities must migrate together in one formal Candidate / one PR / one fresh R / one A-sync-accounting.
- Detailed A-sync report: `docs/reports/2026-10-01-p3-a-akiha-owner-readiness-capability-acceptance-synchronization.md`.

## TASK P3-S-OWNER-AKIHA-COMPLETE-MIGRATION

Owner: FORMAL
Status: `MIGRATION_ACCEPTED`
Classification: formal owner-complete migration for the complete current `master.akiha` frozen scope

Frozen owner scope:
- `master.akiha.skill.ascension`
- `master.akiha.skill.s1`
- `master.akiha.skill.s1a`
- `master.akiha.skill.s2`
- `master.akiha.skill.s3`

Accounting boundary:
- strict formal accounting before Akiha formal migration remains `181/944`, remaining `763`;
- all five frozen identities are absent from canonical `data/authoring/**` at readiness A-sync and are provisionally newly creditable;
- no credit is granted until the exact formal owner Candidate receives `MIGRATION_ACCEPTED` and FORMAL completes A-sync/accounting;
- expected maximum owner-complete increment is `+5` only if the formal acceptance rescan confirms all five remain newly creditable.

Required disposition:
- materialize all five frozen Akiha identities together in one canonical owner archive;
- consume only accepted identity-free readiness capabilities and introduce no Akiha/card-name/printed-text/legacy identity routing in production runtime;
- run the owner formal/focused suite plus affected shared regressions, toolchain/typecheck/content/generated/identity/diff gates;
- freeze one exact formal Candidate, one PR, one fresh independent R, then one A-sync/accounting.

### Akiha formal owner-complete implementation evidence

- Exact formal Base: `5bdd8032cb41989be495406a9489b373f09a2324` (accepted #508 readiness A-sync; strict `181/944`, remaining `763`).
- One canonical `master.akiha` archive materializes all five frozen identities together; all five were absent at Base and remain only provisionally newly creditable until exact formal acceptance + A-sync/accounting.
- Consumer uses accepted #507 identity-free Bloodlust contracts plus accepted #508 generic Master-ascension unlock authority; production runtime delta under `packages/rules/src/**` excluding `__tests__` is EMPTY and production identity audit is CLEAN.
- `璀璨空想` is `outside_game`, with frozen static metadata 魔术 / cost 3 / requirement 3 / Power 6; explicit development-image source evidence is declared.
- Akiha is integrated exactly once immediately after Akasha in canonical playable Master order.
- Formal runtime regression uses the real Akiha consumer definitions for Bloodlust init/action, 5+/10+ thresholds, 15+ transform, transformed ascension cost/Power, mana doubling, and actual contributed-play Plunder provenance.
- Verification: formal `9/9`, readiness `12/12`, ascension-unlock `5/5`, executable pack `50/50`, pack loader `21/21`, provisioning `7/7`, complex `38/38`, MatchSession `33/33`, restore `11/11`; unique affected aggregate **`186/186 PASS`**.
- `FD_TOOLCHAIN_OK`; typecheck PASS; content validate/compile PASS (`9 masters / 19 servants / 20 events / 0 blocking issues`); generated determinism PASS; identity audit CLEAN; diff-check PASS.
- Generated hashes: content-library `7d3972f7df836b16af8ab37dbe373eaa3a6e4ecde5bcb238cee53a7b852db53d`; fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`; evidence-report `e05fd6874e44104611a6900d1723d59d6275f9b9305b4f9464825fdba69ef902`.
- Detailed report: `docs/reports/2026-10-01-p3-s-owner-akiha-complete-migration-result.md`.
- Final disposition: `MIGRATION_ACCEPTED`; exact successor `3457e786960eb4eb5380f311c3278c583dd5ea74` passed fresh R and acceptance rescan. Formal accounting is now `186/944`, remaining `758`; all five Akiha identities are newly credited and preservation-only count is `0`.
### PR #509 NEEDS_REVISION closure

- Reviewed Candidate: `0a1e1994781ea97ccf9433aa291fbfad11c39e76`.
- Fresh R verdict: `MIGRATION_NEEDS_REVISION`; canonical bounded same-attempt evidence: `https://github.com/binchen648/fd/pull/509#issuecomment-5922572014`.
- Blocking reproduction was exactly 5 shared MatchSession failures: four caused by newly legal Akasha Overload response windows entering old deterministic deployment fixtures, plus one default-5s durability timeout after the Master pool grew.
- Revision changes no production runtime and does not change the formal Akiha consumer. It preserves original seeds and behavior assertions, legally declines unrelated response windows in terrain fixtures, and raises only the two bounded long-running test timeouts to `10_000ms`.
- Exact Reviewer commands now pass: `match-session-regressions.test.ts` `11/11`; `match-session.test.ts` `33/33`.
- Full affected aggregate rerun: `186/186 PASS`; toolchain/typecheck/content/generated/identity/diff gates green; generated hashes unchanged.
- Produce exactly one successor Candidate on the same PR, update the Phase 3 manifest to that SHA, require a fresh successful Gate and one fresh independent R. Accounting remains `181/944`, remaining `763`.

### Akiha formal acceptance synchronization

- Accepted exact successor Candidate: `3457e786960eb4eb5380f311c3278c583dd5ea74`.
- Fresh independent verdict: `MIGRATION_ACCEPTED`.
- Canonical Coordinator bounded same-attempt relay: `https://github.com/binchen648/fd/pull/509#issuecomment-5922703846`.
- Acceptance rescan confirms all five frozen Akiha identities were absent at exact formal Base `5bdd8032cb41989be495406a9489b373f09a2324` and are present exactly once in the accepted owner archive.
- Newly creditable: `5`; preservation-only: `0`.
- Strict formal accounting advances `181/944 -> 186/944`; remaining `763 -> 758`.
- #507 and #508 readiness work remains permanently zero-credit.
- Detailed acceptance synchronization: `docs/reports/2026-10-01-p3-a-owner-akiha-acceptance-synchronization.md`.
## TASK P3-B-AKIHA-OWNER-READINESS-MASTER-ASCENSION-UNLOCK

Owner: Codex B / FORMAL readiness follow-up
Status: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
Classification: bounded zero-credit generic Master-ascension unlock capability discovered during Akiha formal materialization preflight

Exact Base: `d7f49dacd751b73264088c9b6fd0566b4ae7c9d5`
Accounting: strict `181/944`, remaining `763`; permanently zero migration credit.

Discovery:
- Akiha frozen ascension `master.akiha.skill.ascension` / 【璀璨空想】 is an outside-game Master Skill.
- Development source proves Master ascension unlock is owned by Shakespeare's frozen `servant.shakespeare.skill.sc-shakespeare-2` clause 【角色颠倒】: if Shakespeare is your servant, unlock your Master ascension.
- Current canonical Shakespeare archive contains only sc1; current production has no generic servant-to-current-Master ascension-unlock authority.
- Akiha formal therefore remains blocked; this follow-up must not migrate Shakespeare sc2 or any Akiha consumer.

Accepted implementation boundary:
- new identity-free privileged effect `unlock_controller_master_ascension`;
- source must be an exact controller-owned skill-zone `servant_skill` whose definition owner equals the controller's current `servantCardId`;
- target is derived only from the controller's current `masterCardId`: exact canonical `<masterCardId>.skill.ascension`, `master_skill`, owner-matching, `initialPlacement=outside_game`, automatic definition;
- forced `round_start` and exact Action phase activation shapes are accepted; widened shapes fail loader admission;
- target provisioning is idempotent, owner/controller-bound and never resurrects or duplicates an already-existing physical ascension card;
- implementation contains no Akiha/Shakespeare/printed-name identity routing.

Verification:
- focused real round/action regression `5/5 PASS`;
- first affected group `105/105 PASS`;
- provisioning/Shakespeare-neighboring/complex/MatchSession group `96/96 PASS`;
- unique affected aggregate `201/201 PASS`;
- `FD_TOOLCHAIN_OK`; typecheck PASS; content validate/compile PASS (`8 masters / 19 servants / 20 events / 0 blocking issues`); generated determinism PASS with unchanged hashes;
- `data/authoring/**` delta EMPTY; production identity audit CLEAN; `git diff --check` PASS.

Detailed report: `docs/reports/2026-10-01-p3-b-akiha-owner-readiness-master-ascension-unlock-result.md`.

Required disposition: one zero-credit Candidate / PR / fresh R; after acceptance FORMAL must A-sync/full-owner rescan before resuming `P3-S-OWNER-AKIHA-COMPLETE-MIGRATION`.
### Akiha Master-ascension unlock readiness acceptance synchronization

- PR #508 exact accepted Candidate: `9f66ae72ea54aa15a30e6a417f943a49800ab6a8`.
- Exact Base: `d7f49dacd751b73264088c9b6fd0566b4ae7c9d5`.
- Canonical Coordinator bounded same-attempt acceptance evidence: `https://github.com/binchen648/fd/pull/508#issuecomment-5922283932`.
- Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`; fresh Phase 3 gate run `36796296601` / job `110160398441` = `SUCCESS`.
- Accepted seam is generic `unlock_controller_master_ascension`; it adds no Akiha consumer, no Shakespeare sc2 consumer, and no `data/authoring/**` delta.
- Full-owner rescan confirms canonical `data/authoring/**` still contains `0/5` frozen Akiha identities; all five remain provisionally newly creditable and none is preservation-only.
- The shared Master-ascension unlock blocker discovered during formal preflight is closed; no additional currently discoverable Akiha owner-local readiness gap remains.
- Readiness remains permanently zero-credit; strict accounting stays `181/944`, remaining `763`.
- `P3-S-OWNER-AKIHA-COMPLETE-MIGRATION` is restored to `READY`; all 5 frozen identities must migrate together in one formal Candidate / one PR / one fresh R / one A-sync-accounting.
- Detailed A-sync report: `docs/reports/2026-10-01-p3-a-akiha-owner-readiness-master-ascension-unlock-acceptance-synchronization.md`.

## TASK P3-B-ALICE-OWNER-READINESS-CAPABILITY

Owner: FORMAL readiness
Status: `SYNCHRONIZED`
Classification: parent zero-credit owner-readiness closure for the complete current `master.alice` frozen scope

Frozen owner scope:
- `master.alice.skill.ascension`
- `master.alice.skill.s1`
- `master.alice.skill.s2`

Accounting boundary:
- strict formal accounting after accepted Akiha A-sync is `186/944`, remaining `758`;
- Alice readiness and all readiness subtasks are permanently zero migration credit;
- canonical `data/authoring/**` contains `0/3` Alice frozen identities;
- no Alice formal consumer migration may start until every currently discoverable readiness subtask is ACCEPTED and FORMAL completes one full-owner A-sync/rescan.

Source recertification discovered two separable generic layers:
1. `P3-B-ALICE-OWNER-READINESS-MULTI-PRESENCE-CORE`: extra-presence deployment/state/combat/terrain/mirror/tax/sacrifice/restore foundation.
2. `P3-B-ALICE-OWNER-READINESS-PRESENCE-CONTEXT`: explicit location/battle effect-location choice for separated presences plus authoritative extra-presence movement so movement of either physical presence can trigger the same mirror rule.

The locked Reference `core.alice-phantom-player` is corroboration only. Reference exposes a location-options helper but has no production caller for that source-authored clause, so helper existence alone is not readiness closure.

## TASK P3-B-ALICE-OWNER-READINESS-MULTI-PRESENCE-CORE

Owner: FORMAL readiness
Status: `ACCEPTED`
Classification: bounded zero-credit generic multi-presence core foundation for current Alice owner-readiness

Exact Base: `0ad0e05d79a738aa55f43ea9c87ef5db5ef2acb9`
Accepted Candidate: `29cece96ef155c76899a1e14673923405b1a870b`
Canonical evidence: `https://github.com/binchen648/fd/pull/510#issuecomment-5923495992`
Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
Accounting: strict `186/944`, remaining `758`; permanently zero migration credit.

Accepted Candidate scope must remain identity-free and cover only the generic core:
- server-owned extra physical presence state with source/ability/round provenance;
- preparation deployment with previous-round battle-loss gate;
- one logical player/opponent identity across primary + extra presence for presence discovery and combat participant discovery;
- shared active-card/passive logical-player authority without duplicate player identity;
- independent per-location combat participation / terrain projection;
- primary movement -> extra-presence same-direction/equal-distance mirror when legal and unengaged;
- post-card-batch mana loss from actual paid card mana, ceil(1/2);
- terrain sharing across presences;
- sacrifice removes the extra presence first, then defeats eligible players remaining at its old location;
- restore rejects forged extra-presence/source provenance;
- no Alice/card-name/Reference-handler production identity routing.

Verification:
- focused synthetic multi-presence regression `8/8 PASS`;
- directly affected/shared aggregate `218/218 PASS`;
- core combat no-AbilityRuntime compatibility preserved;
- `FD_TOOLCHAIN_OK`; typecheck PASS;
- content validate/compile PASS: `9 masters / 19 servants / 20 events / 0 blocking issues`;
- generated determinism PASS with unchanged hashes;
- `data/authoring/**` delta EMPTY; production identity audit CLEAN; `git diff --check` PASS.

Known non-Candidate baseline evidence:
- `golden-flow-2-combat-power-winner-vp.test.ts` restore currently fails on exact Base `0ad0e05d...` with the same stale `placedAtLocationId` restore invariant; byte-for-byte temporary HEAD replay reproduced the failure before Alice WIP, so it is not counted as an Alice regression or Alice closure item.

This core Candidate does NOT close the parent Alice owner-readiness task. After exact core ACCEPTED + A-sync, the presence-context follow-up below remains mandatory.

Detailed report: `docs/reports/2026-10-01-p3-b-alice-owner-readiness-multi-presence-core-result.md`.

## TASK P3-B-ALICE-OWNER-READINESS-PRESENCE-CONTEXT

Owner: FORMAL readiness follow-up
Status: `ACCEPTED`
Classification: bounded zero-credit generic presence-context interaction/movement closure required by frozen Alice source

Exact Base: `165cbb738c03eb1df382ca8eaabcda64656c5c9b`
Accounting: strict `186/944`, remaining `758`; permanently zero migration credit.

Required source-authored closure:
- when one logical player has separated presences and one of its abilities is structurally location/battle-related, the controller chooses exactly one presence location for that ability transaction;
- the choice is server-owned, transaction-bound, restore-safe, and cannot cause the ability to trigger twice;
- generic location/battle consumers must read the selected presence context rather than silently defaulting to primary `PlayerState.locationId`;
- movement of either physical presence, including an externally moved extra presence, can invoke the same legal same-direction/equal-distance mirror rule;
- engagement, occupancy and movement legality remain enforced;
- fail closed without broad global rewriting or Alice identity checks.

No formal Alice consumer and no migration credit until this follow-up is accepted and the parent full-owner readiness A-sync/rescan is complete.

### Alice readiness acceptance synchronization

- Accepted successor Candidate: `49e2afa5554a380b644adc7fbfe035ba8278525d`.
- PR #511 fresh independent verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`.
- Canonical same-attempt Coordinator bounded relay: `https://github.com/binchen648/fd/pull/511#issuecomment-5923961799`.
- Predecessor `bba1e169e36093ecc6b9f1c0886b5130c6475d09` P1 is superseded; successor binds staged candidates and restore/live validation to the same eligible physical-presence contexts used by activation preflight.
- Core prerequisite PR #510 remains accepted at Candidate `29cece96ef155c76899a1e14673923405b1a870b`, canonical evidence `https://github.com/binchen648/fd/pull/510#issuecomment-5923495992`.
- Full-owner readiness rescan: canonical `data/authoring/**` still contains `0/3` Alice frozen identities and no additional currently discoverable readiness gap remains beyond the two accepted subtasks.
- Readiness remains permanently zero-credit; strict accounting stays `186/944`, remaining `758`.
- Parent Alice readiness is synchronized. Next legal task is one owner-complete formal Candidate for all three frozen identities together.
- Acceptance synchronization report: `docs/reports/2026-10-01-p3-a-alice-owner-readiness-capability-acceptance-synchronization.md`.

## TASK P3-S-OWNER-ALICE-COMPLETE-MIGRATION

Owner: FORMAL
Status: `MIGRATION_ACCEPTED`
Classification: formal owner-complete migration for the complete current `master.alice` frozen scope

Frozen owner scope:
- `master.alice.skill.ascension`
- `master.alice.skill.s1`
- `master.alice.skill.s2`

Accounting boundary:
- strict accounting before Alice formal migration remains `186/944`, remaining `758`;
- all three frozen Alice identities are absent from canonical authoring at readiness A-sync and are provisionally newly creditable;
- no credit is granted until exact formal Candidate receives `MIGRATION_ACCEPTED` and FORMAL completes A-sync/accounting;
- maximum possible increment is `+3` -> `189/944`, remaining `755`, only if final acceptance rescan confirms all three remain newly creditable.

Accepted prerequisites:
- #510 multi-presence core Candidate `29cece96ef155c76899a1e14673923405b1a870b`;
- #511 presence-context successor Candidate `49e2afa5554a380b644adc7fbfe035ba8278525d`;
- both readiness layers are identity-free and permanently zero-credit.

Required disposition:
- materialize all three Alice frozen identities together in one canonical owner archive;
- consume only accepted generic readiness capabilities;
- introduce no Alice/card-name/Reference identity routing in production runtime;
- one formal Candidate / one PR / one fresh R / one A-sync-accounting transaction.

### Alice formal owner-complete implementation evidence

- Exact formal Base: `d27b48301ea11f8743e62e7222b5006169b88e31`; strict accounting `186/944`, remaining `758`.
- One canonical `master.alice` archive materializes all three frozen identities together; all three were absent at Base and remain provisional until exact formal acceptance + A-sync/accounting.
- Consumer uses only accepted #510/#511 identity-free multi-presence contracts; production runtime delta under `packages/rules/src/**` is EMPTY and production identity audit is CLEAN.
- `Queenside Castle` is `outside_game`, frozen static metadata 魔术 / cost 5 / requirement 5 / Power 1; explicit development-image source evidence is declared.
- Alice is integrated exactly once immediately after Akiha in canonical playable Master order.
- Real canonical regression exercises Cyber Ghost deployment, Phantom Alice one-logical-player presence semantics, Queenside terrain sharing and sacrifice through accepted runtime.
- Verification: Alice formal `7/7 PASS`; Alice readiness `10/10 PASS`; directly affected/shared aggregate `210/210 PASS`.
- `FD_TOOLCHAIN_OK`; typecheck PASS; content validate/compile PASS (`10 masters / 19 servants / 20 events / 0 blocking issues`); generated determinism PASS; production identity audit CLEAN; diff-check PASS.
- Generated hashes: content-library `cde732266c8ca18995ddacb54a4fd1f273379c4ea2497fdf672218949edd0e3b`; fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`; evidence-report `d49a5ca87cf614cbba8140b1890225a51548c11479551577033f37615407c7a2`.
- Detailed report: `docs/reports/2026-10-01-p3-s-owner-alice-complete-migration-result.md`.
- No credit before exact `MIGRATION_ACCEPTED` + FORMAL A-sync/accounting.


### Alice formal acceptance synchronization

- Accepted exact Candidate: `88ce8ecf32c6aaef077938cd9677143d2a0872a5`.
- Fresh independent verdict: `MIGRATION_ACCEPTED`.
- Canonical Coordinator bounded relay: `https://github.com/binchen648/fd/pull/512#issuecomment-5924134571`.
- Exact Base: `d27b48301ea11f8743e62e7222b5006169b88e31`; Base rescan confirms all three Alice frozen identities were absent.
- Candidate rescan confirms `ascension + s1 + s2` each exist exactly once in canonical authoring.
- Newly creditable: `3`; preservation-only: `0`.
- Strict formal accounting advances `186/944 -> 189/944`; remaining `758 -> 755`.
- Next mechanical owner is `master.amakusa`, frozen scope ascension + s1 + s1a + s2 + s3.
- Acceptance synchronization report: `docs/reports/2026-10-01-p3-a-owner-alice-acceptance-synchronization.md`.

## TASK P3-B-AMAKUSA-OWNER-READINESS-CAPABILITY

Owner: FORMAL readiness
Status: `SYNCHRONIZED`
Classification: parent zero-credit owner-readiness closure for complete current `master.amakusa` frozen scope

Frozen owner scope:
- `master.amakusa.skill.ascension`
- `master.amakusa.skill.s1`
- `master.amakusa.skill.s1a`
- `master.amakusa.skill.s2`
- `master.amakusa.skill.s3`

Accounting boundary:
- strict formal accounting after accepted Alice A-sync is `189/944`, remaining `755`;
- Amakusa readiness and every readiness subtask are permanently zero migration credit;
- canonical `data/authoring/**` contains `0/5` Amakusa frozen identities;
- no Amakusa formal consumer migration may start until every currently discoverable readiness subtask is ACCEPTED and FORMAL completes one full-owner A-sync/rescan.

Frozen source recertification separates three generic readiness families:
1. `P3-B-AMAKUSA-OWNER-READINESS-LINKED-ROLE-CORE`: s1/s2/s3 leader-member lifecycle, dynamic Command-Seal recruitment/entry, linked mana contribution and cross-battle reward authority.
2. `P3-B-AMAKUSA-OWNER-READINESS-MEMBER-SKILL-COPY`: s1a revealed servant-skill temporary copy, original-skill round lock, and member-status removal after copied use.
3. `P3-B-AMAKUSA-OWNER-READINESS-ASCENSION-EVENT-POWER`: ascension unlock terminal opponent Command-Seal loss plus exact named-event basic-card +4 Power authority.

Locked Reference identity handlers remain corroboration only and must not be restored into production routing.

## TASK P3-B-AMAKUSA-OWNER-READINESS-LINKED-ROLE-CORE

Owner: FORMAL readiness
Status: `ACCEPTED`
Classification: bounded zero-credit identity-free linked-role core foundation for current Amakusa owner-readiness

Exact Base: `e00f0d6b7b9d7c9db987bb7e1e510a6bc1d8d930`.
Accounting: strict `189/944`, remaining `755`; permanently zero migration credit.

Bounded source closure:
- s1 / 教则: game start establishes one leader and the next-seat active player as initial member with permanent ever-member history;
- s2 / 红队领袖: Action recruitment costs X Command Seals where X=1+current active member count, target must never have been a member and must have fewer Command Seals before spend, membership applies next round start;
- s3 / 神仆: pre-climax ordinary entry into leader battlefield costs one Command Seal; once per round while member and leader occupy different battlefields, member may use exactly 1 leader mana toward a positive payment; if leader and member win different battlefields in one authoritative battle terminal, both gain 1 VP.

Generic implementation remains identity-free and provides exact whole-ability privileged gateways, runtime provenance, restore validation, movement/deployment entry hooks, linked contribution payment authority and authoritative battle-terminal reward binding.

Verification:
- linked-role focused `10/10 PASS`;
- directly affected/shared aggregate `169/169 PASS`;
- `FD_TOOLCHAIN_OK`; typecheck PASS;
- content validate PASS: `10 masters / 19 servants / 20 events / 0 blocking issues`;
- generated determinism PASS with unchanged hashes;
- `data/authoring/**` delta EMPTY; production Amakusa identity audit CLEAN; `git diff --check` PASS.

Detailed report: `docs/reports/2026-10-01-p3-b-amakusa-owner-readiness-linked-role-core-result.md`.

This Candidate does NOT close s1a or ascension and does NOT close the parent owner-readiness task.

## TASK P3-B-AMAKUSA-OWNER-READINESS-MEMBER-SKILL-COPY

Owner: FORMAL readiness follow-up
Status: `ACCEPTED`
Classification: bounded zero-credit generic temporary revealed servant-skill copy / original-use lock / linked-member removal closure for Amakusa s1a

Required frozen source closure:
- choose one currently linked member's revealed servant skill;
- create a temporary controller-owned copy in the leader skill zone until round end;
- original member cannot use the copied original skill for the remainder of that round once leader uses the copy;
- the copied skill use removes that player from active linked-member status while preserving ever-member history;
- hidden/revealed information, copied physical/definition provenance, use-lock and restore state must fail closed without Amakusa identity routing.

No migration credit; do not start before linked-role core exact acceptance + FORMAL A-sync.

Detailed report: `docs/reports/2026-10-01-p3-b-amakusa-owner-readiness-member-skill-copy-result.md`.

This Candidate does NOT close ascension readiness and does NOT close the parent owner-readiness task.

## TASK P3-B-AMAKUSA-OWNER-READINESS-ASCENSION-EVENT-POWER

Owner: FORMAL readiness follow-up
Status: `ACCEPTED`
Classification: bounded zero-credit generic ascension-unlock terminal + named-event basic-card Power authority for Amakusa ascension

Required frozen source closure:
- when the outside-game ascension is authoritatively unlocked, every opponent immediately loses exactly 2 ordinary Command Seals without going below zero;
- when the exact authored named event clause is activated, the controller's basic cards gain +4 Power under a source-bound event/result authority;
- no card-name/Master identity routing in production; restore and replay provenance must fail closed.

No migration credit; do not start before linked-role core exact acceptance + FORMAL A-sync.

Detailed report: `docs/reports/2026-10-01-p3-b-amakusa-owner-readiness-ascension-event-power-result.md`.

This Candidate does NOT close the parent owner-readiness task. Fresh R acceptance must be followed by one FORMAL full-owner readiness A-sync/rescan before consumer migration.
### Amakusa full-owner readiness acceptance synchronization

- Linked-role core accepted Candidate `a0555d2790d583a115d9ebc66c4aa41878b9c7bc`; canonical relay: `https://github.com/binchen648/fd/pull/513#issuecomment-5924736106`.
- Member-skill-copy accepted successor Candidate `01a00558d299bf1f88368bee118b6ea9c7b9d5c9`; canonical relay: `https://github.com/binchen648/fd/pull/514#issuecomment-5925040814`.
- Ascension/event-power accepted Candidate `6503ce83f3b621110f60b6623da1144340a49499`; canonical relay: `https://github.com/binchen648/fd/pull/515#issuecomment-5925285924`.
- Exact #515 Phase 3 Pre-Review Gate after PR-manifest repair: run `36819672494` / job `110232319420` = `SUCCESS`; Candidate SHA unchanged.
- Full-owner rescan confirms canonical `data/authoring/**` still contains `0/5` frozen Amakusa identities; all five remain newly creditable and none is preservation-only.
- All three currently discoverable readiness families are accepted; no additional current owner-local readiness blocker is exposed by this rescan.
- Readiness remains permanently zero-credit; strict accounting stays `189/944`, remaining `755`.
- `P3-S-OWNER-AMAKUSA-COMPLETE-MIGRATION` is now unblocked and `READY`; ascension + s1 + s1a + s2 + s3 must migrate together in one formal Candidate / one PR / one fresh R / one A-sync-accounting.
- Detailed A-sync report: `docs/reports/2026-10-01-p3-a-amakusa-owner-readiness-acceptance-synchronization.md`.

## TASK P3-S-OWNER-AMAKUSA-COMPLETE-MIGRATION

Owner: FORMAL
Status: `ACCEPTED`
Classification: formal owner-complete migration for the complete current `master.amakusa` frozen scope

Frozen owner scope:
- `master.amakusa.skill.ascension`
- `master.amakusa.skill.s1`
- `master.amakusa.skill.s1a`
- `master.amakusa.skill.s2`
- `master.amakusa.skill.s3`

Accounting boundary:
- strict formal accounting before Amakusa formal migration remains `189/944`, remaining `755`;
- all five frozen identities are absent from canonical `data/authoring/**` at readiness A-sync and are provisionally newly creditable;
- no migration credit is granted until exact formal `MIGRATION_ACCEPTED` plus FORMAL A-sync/accounting;
- expected maximum owner-complete increment is `+5` only if formal acceptance rescan confirms all five remain newly creditable.

Required disposition:
- materialize all five frozen Amakusa identities together in one canonical owner archive;
- consume only the accepted identity-free linked-role, member-skill-copy, Master-ascension-unlock and ascension/event-power capabilities;
- introduce no Amakusa/card-name/printed-text/locked-Reference identity routing in production runtime;
- run owner formal/focused tests plus affected shared regressions, toolchain/typecheck/content/generated/identity/diff gates;
- freeze one exact formal Candidate, one PR, one fresh independent R, then one A-sync/accounting.

### Amakusa formal-preflight source-definition correction

- Formal materialization preflight from readiness A-sync `670366deb02bf265d4daf867ace4120bc0d84ec4` resolved the frozen ascension clause name `【开演之时已至，此处应有雷鸣般的喝彩】` against locked source evidence.
- The referenced object is not an event card. It is the servant skill definition `servant.shakespeare.skill.sc-shakespeare-3` (`魔术/宝具`, cost 6, requirement 8, base Power 1).
- Accepted #515 readiness intentionally exposed an exact `event_activated + eventDefinitionId` authority. That authority cannot be consumed by the real Shakespeare servant-skill play path without inventing a false event definition, so formal Amakusa consumer materialization is paused before any `data/authoring/**` write.
- Existing authoritative card-play events already expose the played physical `sourceCardId`; runtime can mechanically recover its exact definition from the executable pack. The missing seam is therefore a bounded identity-free exact source-definition play authority, not a Shakespeare migration.
- New zero-credit follow-up: `P3-B-AMAKUSA-OWNER-READINESS-SOURCE-DEFINITION-POWER`.
- Strict accounting remains `189/944`, remaining `755`; all five Amakusa identities remain absent from canonical authoring and no formal Candidate exists.

## TASK P3-B-AMAKUSA-OWNER-READINESS-SOURCE-DEFINITION-POWER

Owner: FORMAL readiness follow-up
Status: `ACCEPTED`
Classification: bounded zero-credit exact source-definition play -> basic-card Power authority discovered by Amakusa formal preflight

Scope boundary:
- preserve the already accepted #515 event-placement authority unchanged;
- add one identity-free whole-ability shape that watches an authoring-supplied `sourceDefinitionId` on authoritative `on_card_played`;
- the triggering physical card must be face-up, controlled by the same controller, have exactly the authored definition, and remain an active attack/field source according to its normal play lifecycle;
- while that exact physical source remains active, the controller's owned/controlled `basic_attack` cards receive exactly +4 Power;
- source close/removal, round cleanup, replay/restore drift, controller drift, definition substitution, or stale provider provenance must fail closed / retire authority;
- no Shakespeare/Amakusa/card-name/printed-text identity routing in production; no Shakespeare canonical consumer materialization; no `data/authoring/**` delta; zero migration credit.

Formal dependency:
- `P3-S-OWNER-AMAKUSA-COMPLETE-MIGRATION` stays `WAIT_READINESS_FOLLOWUP` until this exact follow-up is fresh-R accepted plus FORMAL A-sync/rescan.

Detailed report: docs/reports/2026-10-01-p3-b-amakusa-owner-readiness-source-definition-power-result.md.
### Amakusa source-definition Power readiness acceptance synchronization

- Accepted follow-up Candidate `4251da171eacdca6059ffd347510fefcebe10f24` on PR #516.
- Canonical Coordinator bounded same-attempt evidence: `https://github.com/binchen648/fd/pull/516#issuecomment-5925559800`.
- Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`; readiness credit remains permanently `+0`.
- Exact #516 Phase 3 Pre-Review Gate: run `36821029132` / job `110236428111` = `SUCCESS` on Candidate `4251da171eacdca6059ffd347510fefcebe10f24`.
- Full-owner rescan confirms all five frozen `master.amakusa` identities remain absent from canonical `data/authoring/**` (`0/5`), so all remain provisionally newly creditable and none is preservation-only.
- Discoverable Amakusa readiness set is now fully accepted: linked-role core, member-skill-copy, ascension/event-power, and source-definition Power follow-up.
- No additional current owner-local readiness blocker is exposed by this rescan.
- `P3-S-OWNER-AMAKUSA-COMPLETE-MIGRATION` returns to `READY`; ascension + s1 + s1a + s2 + s3 must materialize together in one formal Candidate / one PR / one fresh R / one A-sync-accounting.
- Strict formal accounting remains `189/944`, remaining `755`; this synchronization grants no migration credit.
- Detailed report: `docs/reports/2026-10-01-p3-a-amakusa-source-definition-power-acceptance-synchronization.md`.
### Amakusa formal owner-complete implementation Candidate

- Exact formal Base: `ceffceb3df7a9739726cf0eb52f97c31761af8e5`.
- Materializes all five frozen identities together in `data/authoring/masters/master.amakusa.json` and integrates the owner exactly once after Alice.
- Consumes only accepted identity-free linked-role, member-skill-copy, ascension unlock/seal-loss, and source-definition Power capabilities; production runtime delta is empty in this formal Candidate.
- Canonical `data/authoring/**` moves from `0/5` to `5/5` Amakusa frozen identities inside this Candidate; all five remain only provisionally newly creditable until exact `MIGRATION_ACCEPTED` plus FORMAL A-sync/accounting.
- Amakusa formal + readiness focused `38/38 PASS`; directly affected shared `121/121 PASS`; explicit aggregate `159/159 PASS`.
- content validate/compile: `11 masters / 19 servants / 20 events / 0 blocking issues`; generated determinism, typecheck, toolchain, identity audit and diff-check PASS.
- Strict formal accounting remains `189/944`, remaining `755` before acceptance; maximum post-acceptance A-sync increment is `+5`.
- Detailed report: `docs/reports/2026-10-01-p3-s-owner-amakusa-complete-migration-result.md`.
### Amakusa formal replay-checkpoint revision closure

- PR #517 predecessor Candidate `e2fa9d4298e204362367ae74684b86dedf3e40fc` received `MIGRATION_NEEDS_REVISION`; canonical relay evidence: `https://github.com/binchen648/fd/pull/517#issuecomment-5925732349`.
- The sole P1 is shared replay-lineage behavior exposed by the larger Amakusa production action/checkpoint count: restore succeeded but retained future checkpoints, so the restored checkpoint could fall outside the last-40 client projection.
- Successor revision rewinds replay + replaySnapshots to the restored checkpoint and prunes future replay trust; the regression is strengthened rather than weakened.
- No Amakusa authoring/rule semantic was changed by this revision; accounting remains `189/944`, remaining `755` pending fresh exact successor review.
### Amakusa formal acceptance synchronization

- Accepted exact Candidate: `1d26eec6e1830ae46ef8a6f40b2cde744d433a83`.
- Fresh independent verdict: `MIGRATION_ACCEPTED`.
- Canonical Coordinator bounded relay: `https://github.com/binchen648/fd/pull/517#issuecomment-5925865140`.
- Exact Base: `ceffceb3df7a9739726cf0eb52f97c31761af8e5`; Base rescan confirms all five Amakusa frozen identities were absent from canonical authoring.
- Candidate rescan confirms `ascension + s1 + s1a + s2 + s3` each exist exactly once in canonical authoring.
- Newly creditable: `5`; preservation-only: `0`.
- Strict formal accounting advances `189/944 -> 194/944`; remaining `755 -> 750`.
- Next mechanical owner is `master.araya` (荒耶宗莲), frozen scope ascension + s1 + s1a (`3` identities).
- Acceptance synchronization report: `docs/reports/2026-10-01-p3-a-owner-amakusa-acceptance-synchronization.md`.

## TASK P3-B-ARAYA-OWNER-READINESS-CAPABILITY

Owner: FORMAL readiness
Status: `SYNCHRONIZED`
Classification: parent zero-credit owner-readiness preflight for complete current `master.araya` frozen scope

Frozen owner scope:
- `master.araya.skill.ascension`
- `master.araya.skill.s1`
- `master.araya.skill.s1a`

Accounting boundary:
- strict formal accounting after accepted Amakusa A-sync is `194/944`, remaining `750`;
- Araya readiness and every readiness subtask are permanently zero migration credit;
- FORMAL must mechanically rescan canonical `data/authoring/**` and frozen source, identify all currently discoverable generic capability gaps, close/accept them, then complete one full-owner A-sync/rescan before any Araya consumer migration;
- no Araya formal migration credit is granted by readiness work.
### Araya owner-readiness preflight

- Canonical `data/authoring/**` rescan: `0/3` frozen Araya identities.
- `master.araya.skill.s1a` is already source-grounded and routed through shared structured semantics; no new identity-specific runtime seam is required for that clause.
- `master.araya.skill.s1` and `master.araya.skill.ascension` remain frozen as legacy specific-handler semantics and require generic readiness closure before formal owner migration.
- Readiness is split into two bounded zero-credit families: persistent terrain replacement/layers first, then effective-workshop + same-location restrictions dependent on that accepted terrain authority.

## TASK P3-B-ARAYA-OWNER-READINESS-PERSISTENT-TERRAIN

Owner: FORMAL readiness
Status: `ACCEPTED`
Classification: bounded zero-credit identity-free persistent per-location terrain-replacement authority

Required frozen closure:
- authoritative deployment into a battlefield terrain slot replaces the printed terrain gain with a persistent +1 layer for that player/location/source;
- layers are per-location, permanent for the game, capped at 5, and become active only while that player is physically at that location;
- leaving and later returning reactivates the accumulated layer value;
- deployment after all terrain slots are already occupied does not add a layer;
- restore/replay/source provenance must fail closed;
- no Araya identity/card-name/printed-text routing and no migration credit.

Implementation evidence:
- focused persistent-terrain readiness regression: 7/7 PASS;
- directly affected shared regression aggregate: 132/132 PASS;
- explicit focused + shared aggregate: 139/139 PASS;
- FD_TOOLCHAIN_OK; typecheck/content/generated/diff gates PASS; data/authoring/** delta EMPTY; production Araya identity audit CLEAN.
- Detailed report: docs/reports/2026-10-01-p3-b-araya-owner-readiness-persistent-terrain-result.md.
- This Candidate remains permanently zero migration credit; dependent effective-workshop restrictions remain WAIT_CORE_ACCEPTANCE.

## TASK P3-B-ARAYA-OWNER-READINESS-EFFECTIVE-WORKSHOP-RESTRICTIONS

Owner: FORMAL readiness
Status: `ACCEPTED`
Classification: bounded zero-credit identity-free effective-location and same-location restriction authority

Dependency: accepted `P3-B-ARAYA-OWNER-READINESS-PERSISTENT-TERRAIN`.

Required frozen closure:
- when an authored source is active and its bound persistent-terrain authority reaches at least 5 at the controller's actual location, only that controller is additionally treated as being at the authored effective location `workshop`;
- opponents at the same actual location do not inherit the virtual workshop identity;
- while active, same-location opponents cannot leave through ordinary/effect movement routes covered by the authoritative movement layer;
- affected opponents' standard attack commitment must include at least one face-down attack;
- source removal/invalidity immediately disables both effective-location and restriction authority;
- restore/replay/source/controller/location provenance must fail closed;
- no Araya identity/card-name/printed-text routing and no migration credit.

Implementation evidence:
- focused persistent-terrain readiness regression: 7/7 PASS;
- directly affected shared regression aggregate: 132/132 PASS;
- explicit focused + shared aggregate: 139/139 PASS;
- FD_TOOLCHAIN_OK; typecheck/content/generated/diff gates PASS; data/authoring/** delta EMPTY; production Araya identity audit CLEAN.
- Detailed report: docs/reports/2026-10-01-p3-b-araya-owner-readiness-persistent-terrain-result.md.
- This Candidate remains permanently zero migration credit; dependent effective-workshop restrictions remain WAIT_CORE_ACCEPTANCE.
### Araya persistent-terrain acceptance synchronization

- Accepted exact Candidate: `07de26c74c2b7e585a981c77327e30920ca560a4`.
- Fresh independent verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`.
- Canonical Coordinator bounded relay: `https://github.com/binchen648/fd/pull/518#issuecomment-5926159494`.
- Exact Base: `c71b67e6ea78c891bc0e494600cc2c7ef7ca6529`; Base..Candidate `data/authoring/**` delta is EMPTY.
- This readiness remains permanently zero-credit; strict accounting stays `194/944`, remaining `750`.
- `P3-B-ARAYA-OWNER-READINESS-EFFECTIVE-WORKSHOP-RESTRICTIONS` is now unblocked and `READY`.
- Parent `P3-B-ARAYA-OWNER-READINESS-CAPABILITY` remains `WAIT_READINESS_SUBTASKS`; no Araya consumer migration is allowed yet.
- Acceptance synchronization report: `docs/reports/2026-10-01-p3-a-araya-persistent-terrain-acceptance-synchronization.md`.
Implementation evidence:
- effective-workshop/restrictions focused regression: `8/8 PASS`;
- Araya readiness focused aggregate including accepted persistent-terrain predecessor: `15/15 PASS`;
- directly affected shared aggregate: `132/132 PASS`;
- explicit focused + shared aggregate: `147/147 PASS`;
- `FD_TOOLCHAIN_OK`; typecheck/content/generated/diff gates PASS; `data/authoring/**` delta EMPTY.
- Detailed report: `docs/reports/2026-10-01-p3-b-araya-owner-readiness-effective-workshop-restrictions-result.md`.
- This Candidate is permanently zero migration credit; parent readiness remains open until fresh-R acceptance + FORMAL full-owner A-sync/rescan.
### Araya full-owner readiness synchronization

- Persistent-terrain readiness accepted: PR #518 / 07de26c74c2b7e585a981c77327e30920ca560a4.
- Effective-workshop/restrictions readiness accepted: PR #519 / 1a34da223fe3f18c0cd7c7fcf1964713f8eb1e8d.
- Canonical Araya authoring rescan remains 0/3 for ascension + s1 + s1a.
- s1a remains source-grounded by existing shared structured effects; no additional readiness family is discovered.
- Parent readiness is now SYNCHRONIZED; strict accounting remains 194/944, remaining 750.
- Formal owner-complete migration is now READY and must materialize all three frozen identities in one Candidate.
- Acceptance synchronization report: docs/reports/2026-10-01-p3-a-araya-full-owner-readiness-synchronization.md.

## TASK P3-S-OWNER-ARAYA-COMPLETE-MIGRATION

Owner: FORMAL
Status: `ACCEPTED`
Classification: formal owner-complete migration for current owner `master.araya`

Frozen owner scope:
- `master.araya.skill.ascension`
- `master.araya.skill.s1`
- `master.araya.skill.s1a`

Formal rule: materialize all three identities in one Candidate/one PR/one fresh independent R; no partial credit.

Implementation evidence:
- exact frozen owner scope materialized together: `master.araya.skill.ascension`, `master.araya.skill.s1`, `master.araya.skill.s1a`;
- canonical authoring Base `fd13c70c8df32d8ce64d4f6b32282a1f2f16cf66`: `0/3`; Candidate worktree: `3/3`;
- formal canonical regression: `6/6 PASS`; full Araya readiness predecessors: `21/21 PASS`; combined Araya focused: `27/27 PASS`;
- directly affected shared aggregate: `132/132 PASS`; explicit focused + shared aggregate: `159/159 PASS`;
- `FD_TOOLCHAIN_OK`; typecheck/content/generated/diff gates PASS; Phase 3 coverage + automation audit commands PASS;
- predecessor `b93f73422a0be273a8c8fdae6c743c5b9313e34b` received `MIGRATION_NEEDS_REVISION` for two Candidate-induced shared MatchSession regressions; successor keeps Araya authoring unchanged and limits shared runtime delta to identity-free linked-role restore provenance repair plus seed-stable MatchSession fixture coverage; no `core.araya-*` identity handler routing is introduced;
- strict migration accounting remains `194/944`, remaining `750` until fresh-R `MIGRATION_ACCEPTED` + FORMAL A-sync/accounting.
- Detailed report: `docs/reports/2026-10-01-p3-s-owner-araya-complete-migration-result.md`.
- Successor follow-up after exact Candidate `618d1d57e2b04da33d303a1cbd3f4049f37ac2ef`: the user-visible Reviewer relay was truncated after predecessor-finding closure, so no omitted Reviewer wording is invented. Coordinator full-suite reproduction mechanically isolated an additional Candidate-induced fixed-seed fixture regression in `card-action-play.test.ts`: Base roster seed `20260909` contains `master.kiritsugu`, while the 12-master Candidate roster does not. The fixture now deterministically searches a bounded seed containing Kiritsugu without weakening any Time Alter behavior assertion.
- Successor-2 closure evidence: Time Alter `4/4 PASS`; Araya formal+readiness `27/27 PASS`; MatchSession `33/33 PASS`; Amakusa linked-role restore `11/11 PASS`; directly affected shared `132/132 PASS`; typecheck and `git diff --check` PASS.
- Successor-3 Reviewer timeout closure: exact Candidate `b17aa62c671134acd3d9d758e497d333b043f5f5` received `MIGRATION_NEEDS_REVISION`; canonical relay `https://github.com/binchen648/fd/pull/521#issuecomment-5982023213`. The deferred-runtime authentication fixture now uses a direct real MatchSession battle resolution instead of an unrelated full AI round; authority assertions are unchanged, the former timeout regression passes repeatedly under 1s, and the affected 163-test aggregate is 163/163 PASS. No production runtime or Araya authoring semantics changed.
- Predecessor canonical reviewer evidence: `https://github.com/binchen648/fd/pull/521#issuecomment-5927224944`.
- Predecessor P1 closure: Kayneth deployment test now derives a deterministic seed that actually contains `master.kayneth`; legitimate linked-role game-start initializer provenance remains restorable after that source physical later moves from skill to field; untampered durable session restore is asserted before external-field tamper rejection.
- Successor verification: reviewer reproductions 2/2 PASS; MatchSession 33/33 PASS; Araya focused 27/27 PASS; linked-role restore regression 11/11 PASS; directly affected shared 132/132 PASS; typecheck + git diff --check PASS.

## TASK P3-B-ARAYA-OWNER-READINESS-ORIGIN-STILLNESS-PRINTED-COST

Owner: FORMAL readiness
Status: `ACCEPTED`
Classification: bounded zero-credit identity-free battle-end active-basic recycle + printed-cost mana authority

Formal preflight correction:
- frozen `master.araya.skill.s1a` requires selecting one controller-owned active basic attack after battle ends, shuffling that exact physical card into deck, then gaining mana equal to twice its printed mana cost;
- existing `gain_mana_equal_selected_card_paid_cost` uses actual paid-mana provenance and is not semantically equivalent to printed cost x2;
- no Araya consumer materialization is allowed until this exact gap is accepted + FORMAL A-sync/rescan.
- permanently zero migration credit; strict accounting remains 194/944, remaining 750.

Implementation evidence for Origin Stillness printed-cost readiness:
- focused regression: 6/6 PASS;
- full Araya readiness aggregate: 21/21 PASS;
- directly affected shared aggregate: 132/132 PASS;
- explicit aggregate: 153/153 PASS;
- FD_TOOLCHAIN_OK; typecheck/content/generated/diff gates PASS; data/authoring/** delta EMPTY; production Araya identity audit CLEAN.
- Detailed report: docs/reports/2026-10-01-p3-b-araya-owner-readiness-origin-stillness-printed-cost-result.md.
- This Candidate is permanently zero migration credit; formal owner remains WAIT_READINESS_FOLLOWUP pending fresh R + FORMAL A-sync.

### Araya Origin Stillness acceptance synchronization

- Accepted exact Candidate: `54c89d6172b0cb39fdae82c89027428963f41d65`.
- Fresh independent verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`.
- Canonical Coordinator bounded relay: `https://github.com/binchen648/fd/pull/520#issuecomment-5926544463`.
- Exact Base: `41900e8cc1de77c6f52c22ec5c5b491396445b10`; Base..Candidate `data/authoring/**` delta is EMPTY.
- Full-owner rescan remains `0/3` canonical Araya identities; no additional owner-local readiness gap is discoverable after accepted persistent-terrain, effective-workshop/restrictions, and Origin Stillness printed-cost closures.
- Formal `P3-S-OWNER-ARAYA-COMPLETE-MIGRATION` is restored to `READY`; all three frozen identities must be materialized in one Candidate.
- This readiness remains permanently zero-credit; strict accounting stays `194/944`, remaining `750`.

### Araya formal acceptance synchronization

- Accepted exact Candidate: `c4e3aeea56d670747aaeb37e83f2e2f41458e5a9`.
- Fresh independent verdict: `MIGRATION_ACCEPTED`.
- Canonical Coordinator bounded relay: `https://github.com/binchen648/fd/pull/521#issuecomment-5982236310`.
- Exact Base: `fd13c70c8df32d8ce64d4f6b32282a1f2f16cf66`; Base canonical authoring contains `0/3` frozen Araya identities.
- Accepted Candidate contains `master.araya.skill.ascension + master.araya.skill.s1 + master.araya.skill.s1a` exactly once each (`3/3`).
- Newly creditable: `3`; preservation-only: `0`.
- Strict formal accounting advances `194/944 -> 197/944`; remaining `750 -> 747`.
- Next mechanical owner is `master.bazett`, frozen scope `10` identities. Historical accepted FM08 already credited `master.bazett.skill.s1b`, so Bazett begins with `1` preservation-only identity and `9` remaining uncredited frozen identities.
- Acceptance synchronization report: `docs/reports/2026-10-05-p3-a-owner-araya-acceptance-synchronization.md`.

## TASK P3-B-BAZETT-OWNER-READINESS-CAPABILITY

Owner: FORMAL readiness
Status: `ACCEPTED`
Classification: parent zero-credit owner-readiness preflight for complete current `master.bazett` frozen scope

Frozen owner scope:
- `master.bazett.skill.ascension`
- `master.bazett.skill.s1`
- `master.bazett.skill.s1a`
- `master.bazett.skill.s1b`
- `master.bazett.skill.s1c`
- `master.bazett.skill.s1d`
- `master.bazett.skill.s2`
- `master.bazett.skill.s3`
- `master.bazett.skill.s4`
- `master.bazett.skill.s5`

Accounting boundary:
- strict formal accounting after accepted Araya A-sync is `197/944`, remaining `747`;
- `master.bazett.skill.s1b` is preservation-only because it was already accepted and credited in FM08; it must not be counted again;
- the other nine Bazett frozen identities remain uncredited pending owner-complete readiness + formal migration;
- Bazett readiness and every readiness subtask are permanently zero migration credit;
- FORMAL must mechanically rescan all ten frozen identities against locked source/reference and currently accepted generic runtime seams, produce one complete owner-local gap set, close/accept compatible readiness, then migrate all remaining uncredited identities in one owner-complete Candidate/PR/fresh R.

Implementation evidence:
- complete owner-local preflight reused accepted Bazett F1 source normalization (`0dcc1f94297f2198f0f4152742c585032931390a` / `ec37b2a0`) and rechecked all ten frozen identities against current runtime + locked Reference;
- one complete identity-free readiness gap set closes logical-day progression/reset/Awake, exact definition-scoped play+persistence overrides, next-opponent attribute-use defeat, Awake seal/definition settlement, and Day-3 zero-cost source-skill attack join;
- existing generic seams remain reused for game-start provisioning (`s1`), preservation-only Day-1 modifier (`s1b`), and ordinary trigger/resource arithmetic; no per-skill readiness split is intentionally deferred;
- focused Bazett readiness regression: `13/13 PASS`;
- affected shared aggregate: `165/165 PASS` (MatchSession 33, authoring-interpreter 38, executable-card-pack 50, Akasha 17, Alice 10, card-action-play 4, Bazett readiness 13);
- `FD_TOOLCHAIN_OK`; typecheck/content/generated/diff gates PASS; Phase-3 coverage/audit commands PASS via scratch `--out`; `data/authoring/**` delta EMPTY;
- production capability module is identity-free and exact-shape fail-closed; forged provider/armed provenance is rejected by restore validation;
- Detailed report: `docs/reports/2026-10-05-p3-b-bazett-owner-readiness-complete-gap-set-result.md`;
- predecessor Candidate `f4234d18baf7235375f3634808a118abf97f912b` received `IMPLEMENTATION_NEEDS_REVISION`; canonical bounded relay `https://github.com/binchen648/fd/pull/522#issuecomment-5982661723`. P1 closure restages the same Day-3 physical from discard on the second Lost-in-Time cycle, preserves exact generator provenance, rejects live-zone/forged alternatives, and adds the explicit second-cycle regression plus fail-closed negatives.
- permanently zero migration credit; strict accounting remains `197/944`, remaining `747` pending fresh independent readiness acceptance + FORMAL A-sync/rescan.


### Bazett readiness acceptance synchronization

- Accepted exact Candidate: `566c086f168b23883a1c064ec35f598404fed8df`.
- Fresh independent verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`.
- Canonical bounded relay: https://github.com/binchen648/fd/pull/522#issuecomment-5982765629.
- Canonical authoring rescan is `1/10`: only `master.bazett.skill.s1b` exists and it is preservation-only from accepted FM08; nine frozen identities remain uncredited.
- No additional readiness gap remains after the accepted complete gap set; `P3-S-OWNER-BAZETT-COMPLETE-MIGRATION` is `READY`.
- Readiness remains zero-credit; strict accounting stays `197/944`, remaining `747`.
- Acceptance synchronization report: `docs/reports/2026-10-05-p3-a-bazett-owner-readiness-acceptance-synchronization.md`.

## TASK P3-S-OWNER-BAZETT-COMPLETE-MIGRATION

Owner: FORMAL
Status: `ACCEPTED`
Classification: formal owner-complete migration for current owner `master.bazett`

Frozen owner scope: all ten Bazett identities listed by the accepted parent readiness task.

Formal rule: preserve historical accepted `master.bazett.skill.s1b`; materialize the other nine frozen identities in one Candidate / one PR / one fresh independent R. No partial credit. Strict accounting remains `197/944` until `MIGRATION_ACCEPTED` + FORMAL A-sync; then newly creditable is exactly 9.

Bazett owner-complete implementation evidence:
- exact Base `84e2fab939de6ce1b1cc307488b749b80ce8cc92`: canonical authoring `1/10`, only historical credited `s1b`; worktree `10/10`, newly materialized exactly 9, `s1bPreserved=true`;
- original Candidate `9a457a38aa9118cecee410f6b4c133a1d10fac5c` historically received `MIGRATION_ACCEPTED` with bounded relay `https://github.com/binchen648/fd/pull/523#issuecomment-5982980953`, but before promotion FORMAL independently reproduced HELPER Epoch 47's Day-3 play-provenance contradiction; that Candidate is not re-reviewed and its premature A-sync was superseded before credit;
- successor preserves existing/genuine `playedRound` on Day-3 restage/join and initializes absent non-play provenance as `max(0,currentRound-1)`; restage clears stale `paidManaOnPlay`; no Bazett identity branch added;
- formal consumer regression `10/10 PASS`; accepted readiness `15/15 PASS`; accepted generic source-skill join `5/5 PASS`; Sigurd `played_this_round` consumer `7/7 PASS`; Kayneth source-response `6/6 PASS`; affected shared aggregate `195/195 PASS`;
- real Bazett authoring cross-consumer regression proves `master.bazett.skill.s5` after Day-3 stage/join is excluded from generic `played_this_round`, while a current-round control remains eligible; bug-control proves forged-current provenance would expose Day3 to the consumer;
- content pack remains `13` masters and includes Bazett exactly once; generated content remains deterministic;
- roster-growth-only MatchSession fixture stabilization preserves original Irisviel/Kiritsugu/one-round behavior assertions;
- FD_TOOLCHAIN_OK; typecheck/content/generated/coverage/audit/identity/diff gates PASS; production Bazett identity routing CLEAN;
- report: `docs/reports/2026-10-05-p3-s-owner-bazett-complete-migration-result.md`;
- strict accounting remains `197/944`, remaining `747` until the successor receives fresh-R `MIGRATION_ACCEPTED` + lawful A-sync; then newly creditable is exactly 9 -> `206/944`, remaining `738`.

### Bazett formal acceptance synchronization

- Accepted exact Candidate: `e0240d85eaf07840bac7823ee1ff92c4374de3a9`.
- Fresh independent verdict: `MIGRATION_ACCEPTED`.
- Canonical Coordinator bounded relay: `https://github.com/binchen648/fd/pull/523#issuecomment-5988955647`.
- Exact Base: `84e2fab939de6ce1b1cc307488b749b80ce8cc92`; Base canonical authoring contains only historical credited `master.bazett.skill.s1b` (`1/10`).
- Accepted Candidate contains all ten frozen Bazett identities exactly once (`10/10`); exact `s1b` authoring object is preserved.
- Newly creditable: `9`; preservation-only: `1` (`master.bazett.skill.s1b`).
- Strict formal accounting advances `197/944 -> 206/944`; remaining `747 -> 738`.
- The predecessor `9a457a38aa9118cecee410f6b4c133a1d10fac5c` historical acceptance and the `89e6bfd649e7c4d04990d96b31ac4c2496dd4cb1` revision verdict award no separate credit; only this exact accepted successor is synchronized.
- Next mechanical owner is `master.caren`, frozen scope `5` identities; current canonical Caren authoring is absent and no preservation-only owner credit is established by current repo evidence.
- Acceptance synchronization report: `docs/reports/2026-10-05-p3-a-owner-bazett-acceptance-synchronization.md`.

## TASK P3-B-CAREN-OWNER-READINESS-CAPABILITY

Owner: FORMAL readiness
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Classification: parent zero-credit owner-readiness preflight for complete current `master.caren` frozen scope

Frozen owner scope:
- `master.caren.skill.ascension`
- `master.caren.skill.s1`
- `master.caren.skill.s1a`
- `master.caren.skill.s2`
- `master.caren.skill.s3`

Accounting boundary:
- strict formal accounting after accepted Bazett A-sync is `206/944`, remaining `738`;
- current canonical `data/authoring/masters/master.caren.json` is absent;
- no Caren owner-complete acceptance report/commit or preservation-only migration credit is established by current repo evidence;
- Caren readiness and every readiness subtask are permanently zero migration credit;
- FORMAL must mechanically rescan all five frozen identities against existing F1 source evidence, locked Reference, and currently accepted generic runtime seams, produce one complete owner-local gap set, close/accept compatible readiness, then migrate all remaining uncredited identities in one owner-complete Candidate/PR/fresh R.

Implementation evidence:
- exact Base is Bazett acceptance synchronization `19d710705ccaee472a86e07c464ed755c33d9745`; canonical Caren authoring remains `0/5`, so this readiness Candidate has zero migration credit and `data/authoring/**` delta is EMPTY;
- authoritative Caren F1 source evidence is exact S Candidate `d74bd590ff589b3b8dcaf35192adef6429bfaa5d`, independently accepted in source-evidence review chain ending at `9b3fc778245c90d23cc9927d7674411141750699`; locked Reference remains `b2f9fa15fba07c63530bbf4612b03b8b704755f9`;
- one complete identity-free readiness gap set covers definition-bound skill provisioning/removal, first true-name-reveal provisioning, structured opponent VP-gain correction/mana conversion, engaged-opponent round binding with 1..5 power penalty + normal-movement block + loss-triggered source removal, and ascension unlock/opponent-winner reward;
- privileged shapes are exact whole-ability fail-closed; malformed/widened shapes, malformed resource provenance, wrong-location/non-qualifying VP sources, face-down providers, forged bound-state restore, stale round authority, and duplicate first-trigger provisioning are covered negatively;
- bound movement/power effects remain for their stated round even after the Shroud source is removed on target loss, matching the independently frozen semantics; authority expires at next-round cleanup;
- predecessor Candidate `0132a76e79f2bfedbd5741d3d2400adbae3ae423` received `IMPLEMENTATION_NEEDS_REVISION`; canonical Coordinator bounded same-attempt relay after Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/524#issuecomment-5989922121`;
- R1 P1 closure makes the first `>1 -> <=1` mana crossing cause-independent: definition-resource settlement consumes every coherent typed `resource=mana` decrease instead of two event names, direct non-payment mutations publish through one shared notifier, and the Vessel-cycle direct cost joins the existing paid-mana observer path;
- new regressions cover a specialized typed mana-loss transaction plus legacy direct `set_mana`; existing crossing guards and one-time removal history remain fail closed;
- Caren focused readiness regression: `12/12 PASS`;
- affected scoped aggregate: `199/199 PASS` across 14 task-relevant files, including authoring-interpreter, executable pack, MatchSession restore, movement, resource/runtime, master-ascension, Bazett shared seams, and card-action routes;
- R1 supplemental affected routes: `30/30 PASS` across core effect-resolver, fixed-controller set-mana, and Akasha Vessel readiness; Reviewer-parity Shuten owner regression `8/8 PASS`;
- roster-sensitive `resource-numeric-room-boundary` fixture was stabilized by deriving a current-roster seed that places `master.gatou` at the asserted seat; gameplay assertions are unchanged;
- typecheck PASS; content validation PASS (`13 masters / 19 servants / 20 events / 0 blocking issues`); generated determinism PASS; Phase-3 coverage/audit commands complete; production Caren identity/text routing audit CLEAN; `git diff --check` PASS;
- broader package sweep exposes inherited fixed-seed/raw-archive fixtures before the new Caren capability executes; historical Akasha owner-complete also retains a pack-order assertion that expects Akasha last while the accepted current pack ends in Bazett. This Candidate changes neither that assertion nor the pack authoring list and changes no `data/authoring/**`; those unrelated baseline hazards remain F5 convergence work rather than widening this zero-credit task;
- detailed report: `docs/reports/2026-10-05-p3-b-caren-owner-readiness-complete-gap-set-result.md`;
- permanently zero migration credit; strict accounting remains `206/944`, remaining `738` pending fresh independent readiness acceptance + FORMAL A-sync/rescan.

### Caren readiness acceptance synchronization

- Accepted exact Candidate: `c64d3f1d389efd40a16005e9d02cd22780a5d79c`.
- Fresh independent verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`.
- Canonical bounded relay: https://github.com/binchen648/fd/pull/524#issuecomment-5990302105.
- Exact-Candidate latest Phase 3 Pre-Review Gate run `37278493631` is `SUCCESS`.
- Canonical authoring rescan is `0/5`: all five frozen Caren identities remain absent and uncredited.
- HELPER Epoch 51 is predecessor-only preparation evidence; its official P1 route map is closed by the accepted successor. HELPER-only independent risks remain formal-review watch items and do not supersede the exact accepted verdict.
- No additional owner-local readiness gap remains; `P3-S-OWNER-CAREN-COMPLETE-MIGRATION` is `READY`.
- Readiness remains zero-credit; strict accounting stays `206/944`, remaining `738`.
- Acceptance synchronization report: `docs/reports/2026-10-05-p3-a-caren-owner-readiness-acceptance-synchronization.md`.

## TASK P3-S-OWNER-CAREN-COMPLETE-MIGRATION

Owner: FORMAL
Status: `ACCEPTED`
Classification: formal owner-complete migration for current owner `master.caren`

Frozen owner scope: all five Caren identities listed by the accepted parent readiness task.

Implementation evidence:
- exact Base is Caren readiness acceptance synchronization `d665f45a0dc503fbaf9611bc3c05522f94255b11`;
- canonical authoring moves from `0/5` to `5/5` in one owner-complete Candidate: ascension + s1 + s1a + s2 + s3;
- canonical archive `data/authoring/masters/master.caren.json` is added once and integrated once after Bazett in `fd-playtest-v1`; generated content/evidence artifacts are regenerated;
- runtime implementation remains identity-free and consumes the accepted definition/resource/bound-opponent capability from readiness Candidate `c64d3f1d389efd40a16005e9d02cd22780a5d79c`;
- formal Caren owner regression: `9/9 PASS`;
- task-relevant affected aggregate: `186/186 PASS` across 13 files;
- `FD_TOOLCHAIN_OK`; typecheck PASS; content validation PASS (`14 masters / 19 servants / 20 events / 0 blocking issues`); generated determinism PASS;
- Phase-3 coverage PASS: `compiledCards=163`, `compiledCharacters=33`, `blockingIssues=0`; automation audit completed;
- production Caren identity/text routing audit CLEAN; `git diff --check` PASS;
- broad `test:ci` convergence sweep is `1504 PASS / 58 inherited F5-wide baseline FAIL`; none is in the Caren focused/affected aggregate, so unrelated convergence debt is not widened into this owner Candidate;
- detailed report: `docs/reports/2026-10-05-p3-s-owner-caren-complete-migration-result.md`.

Formal rule: all five frozen identities are one Candidate / one PR / one fresh independent R. No partial credit. This exact Candidate received `MIGRATION_ACCEPTED`; lawful FORMAL A-sync/accounting below advances exactly 5 identities to `211/944`, remaining `733`.

### Caren formal acceptance synchronization

- Accepted exact Candidate: `20392bb26f5d73a33f076fb01aa0148f56f4271f`.
- Fresh independent verdict: `MIGRATION_ACCEPTED`.
- Canonical Coordinator bounded relay: `https://github.com/binchen648/fd/pull/525#issuecomment-5990747465`.
- Exact Base: `d665f45a0dc503fbaf9611bc3c05522f94255b11`; Base canonical Caren authoring is `0/5`.
- Accepted Candidate contains all five frozen Caren identities exactly once (`5/5`); there is no preservation-only Caren identity.
- Newly creditable: `5`; preservation-only: `0`.
- Strict formal accounting advances `206/944 -> 211/944`; remaining `738 -> 733`.
- Readiness PR #524 is permanently zero-credit and is not counted again.
- Exact-Candidate Phase 3 Pre-Review Gate run `37281820598` is PASS.
- Next mechanical owner is `master.caules-yggdmillennia`, frozen scope `5` identities; current canonical authoring is absent and no owner migration credit is established by current repo/GitHub evidence.
- Acceptance synchronization report: `docs/reports/2026-10-05-p3-a-owner-caren-acceptance-synchronization.md`.

## TASK P3-B-CAULES-YGGDMILLENNIA-OWNER-READINESS-CAPABILITY

Owner: FORMAL readiness
Status: `SYNCHRONIZED`
Classification: parent zero-credit owner-readiness preflight for complete current `master.caules-yggdmillennia` frozen scope

Frozen owner scope:
- `master.caules-yggdmillennia.skill.ascension`
- `master.caules-yggdmillennia.skill.s1`
- `master.caules-yggdmillennia.skill.s1a`
- `master.caules-yggdmillennia.skill.s2`
- `master.caules-yggdmillennia.skill.s3`

Accounting boundary:
- strict formal accounting after accepted Caren A-sync is `211/944`, remaining `733`;
- current canonical `data/authoring/masters/master.caules-yggdmillennia.json` is absent (`0/5`);
- no Caules Yggdmillennia owner-complete migration/acceptance-synchronization or preservation-only migration credit is established by current repo/GitHub evidence;
- historical PR #126 is source-evidence input only and grants no migration credit;
- this readiness transaction and any bounded readiness subtasks are permanently zero migration credit;
- FORMAL must mechanically rescan all five frozen identities against F1/source evidence, locked Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9`, and currently accepted generic runtime seams, close the complete owner-local gap set, then migrate all remaining uncredited identities in one owner-complete Candidate / one PR / one fresh independent R.

Implementation evidence:
- exact Base is accepted Caren owner A-sync `7949b477c3518e9a20214f1408f579b462519158`; canonical Caules Yggdmillennia authoring stays `0/5` and `data/authoring/**` delta is EMPTY;
- frozen source evidence is PR #126 exact head `9d59040a5a7fa9ba356dfc12c1ef8950fce05e78`, F1 inventory/rule evidence, and locked Reference corroboration;
- one complete identity-free capability closes definition-bound activation/deactivation, workshop deployment `+1 mana` vs paid current-round battle-loss-ignore choice, active required-additional declaration play, game-long declaration history, same-battlefield matching-basic Power-zero authority, ascension secret/repeat declaration rewrite, combat reveal, and exact next-round 12-card deck rebuild;
- exact privileged semantic shapes fail closed at loader + interpreter boundaries; malformed/widened shapes and forged restore provenance are rejected;
- predecessor Candidate `e8f2362c4df24222655c3719723a434b63da4672` returned `IMPLEMENTATION_NEEDS_REVISION`; canonical same-attempt 403 relay evidence is `https://github.com/binchen648/fd/pull/526#issuecomment-5991657853`;
- successor revision closes both deck-rebuild P1s together: shared deterministic runtime shuffle after exact rebuild, and replacement scope restricted to owned `hand + deck + discard` while preserving `field + attack_area + skill`;
- successor Candidate `62f1bcbea3e700a5f7d831997602b52631c354db` then returned `IMPLEMENTATION_NEEDS_REVISION`; canonical same-attempt 403 relay evidence is `https://github.com/binchen648/fd/pull/526#issuecomment-5992037707`;
- current successor revision closes the shared secret-declaration telemetry P1 centrally: secret events omit raw attribute, shared MatchSession telemetry strips `declaredAttribute` across human/AI records, and client log projection defensively redacts restored/legacy payloads while owner-only card projection/reveal semantics remain intact;
- focused readiness regression: `11/11 PASS`; MatchSession: `34/34 PASS`;
- task-relevant affected aggregate: `193/193 PASS` across 13 files;
- typecheck PASS; content validation PASS (`14 masters / 19 servants / 20 events / 0 blocking issues`); generated determinism PASS;
- Phase-3 coverage PASS (`compiledCards=163`, `compiledCharacters=33`, `blockingIssues=0`, `newRuntimeSemanticRouted=22`); automation audit command completed;
- coverage/audit tracked-output verification side effects were restored byte-for-byte from Exact Base/HEAD and are not Candidate changes;
- production Caules identity/text routing audit CLEAN; `git diff --check` PASS;
- detailed report: `docs/reports/2026-10-05-p3-b-caules-yggdmillennia-owner-readiness-complete-gap-set-result.md`;
- accepted successor Candidate `baeb8610c409f2e0bffecf1735be5b8286696757` received `IMPLEMENTATION_ACCEPTED_CANDIDATE`; canonical Coordinator bounded same-attempt evidence is `https://github.com/binchen648/fd/pull/526#issuecomment-5992238581`;
- permanently zero migration credit; strict accounting remains `211/944`, remaining `733` after FORMAL A-sync/rescan.

### Caules Yggdmillennia readiness acceptance synchronization

- Accepted readiness Candidate: `baeb8610c409f2e0bffecf1735be5b8286696757` on PR #526.
- Canonical Coordinator bounded same-attempt evidence: `https://github.com/binchen648/fd/pull/526#issuecomment-5992238581`.
- Exact Candidate Phase 3 Pre-Review Gate run `37293120563` = `SUCCESS`.
- Full-owner rescan confirms canonical `data/authoring/**` still contains `0/5` frozen Caules Yggdmillennia identities; all five remain provisionally newly creditable and none is preservation-only.
- Locked Reference remains exactly `b2f9fa15fba07c63530bbf4612b03b8b704755f9`; PR #126 exact head remains source-evidence only.
- HELPER Epoch 56 was read only as PRE-R guidance and was not used as credit authority.
- Rescan mechanically confirms one additional privacy gap: `stage_attack_card` can store raw `declaredAttribute` in `modeState.stagedAttacks`, while `projectAbilityState(...)` can clone another player's staged entries verbatim once that player has a qualifying public `attack_area` card. A secret ascension declaration can therefore leak before authoritative combat reveal through `AbilityPlayerView.stagedAttacks` even though shared MatchSession telemetry is now redacted.
- Readiness remains permanently zero-credit; strict accounting stays `211/944`, remaining `733`.
- The staged-declaration privacy follow-up is now fresh-R accepted and second A-synced; `P3-S-OWNER-CAULES-YGGDMILLENNIA-COMPLETE-MIGRATION` is released for formal owner-complete materialization.
- Detailed A-sync report: `docs/reports/2026-10-05-p3-a-caules-yggdmillennia-owner-readiness-acceptance-synchronization.md`.

## TASK P3-S-OWNER-CAULES-YGGDMILLENNIA-COMPLETE-MIGRATION

Owner: FORMAL
Status: `ACCEPTED`
Classification: formal owner-complete migration for the complete current `master.caules-yggdmillennia` frozen scope

Frozen owner scope:
- `master.caules-yggdmillennia.skill.ascension`
- `master.caules-yggdmillennia.skill.s1`
- `master.caules-yggdmillennia.skill.s1a`
- `master.caules-yggdmillennia.skill.s2`
- `master.caules-yggdmillennia.skill.s3`

Accounting boundary:
- strict formal accounting before Caules Yggdmillennia formal migration remains `211/944`, remaining `733`;
- all five frozen identities remain absent from canonical `data/authoring/**` and are provisionally newly creditable;
- no migration credit is granted until exact formal `MIGRATION_ACCEPTED` plus FORMAL A-sync/accounting;
- expected maximum owner-complete increment is `+5` only if formal acceptance rescan confirms all five remain newly creditable.

Formal dependency:
- SATISFIED: parent readiness PR #526 and staged-declaration privacy follow-up PR #527 are independently accepted and both required zero-credit A-sync/rescans are complete;
- materialize all five frozen identities together in one canonical owner archive, consume only accepted identity-free runtime seams, and use one formal Candidate / one PR / one fresh R / one A-sync-accounting.

Implementation evidence:
- Exact Base: `c9627d0c2575b91e48472d118db36b0c7f3bfb34` (second zero-credit readiness acceptance-sync/rescan);
- canonical authoring materializes exactly `5/5` frozen identities in `data/authoring/masters/master.caules-yggdmillennia.json` and appends that archive exactly once after Caren in the playtest master sequence;
- static source metadata preserves initial mana `4`, Thunder cost/requirement/Power `5/5/6`, frozen names/printed text, outside-game placement for `s2`, `s3`, and ascension, and the exact 12-card ascension rebuild definition;
- runtime behavior consumes only the independently accepted identity-free declaration/deck/projection seams; production runtime identity audit is CLEAN;
- formal owner regression: `10/10 PASS`;
- task-relevant affected aggregate: `204/204 PASS` across 14 files, including parent/follow-up readiness, MatchSession, Caren predecessor order, executable authoring, ascension, deployment, resource, and Suzuka shared seams;
- canonical master-pool growth exposed four deterministic fixture assumptions (three MatchSession seeds and Caren's tail-of-list assertion); fixtures were bounded to equivalent stable scenarios/adjoining-order assertions without runtime semantic changes;
- toolchain PASS; typecheck PASS; content validation PASS (`15 masters / 19 servants / 20 events / 0 blocking issues`); generated determinism PASS;
- generated hashes: content library `c69f9df2ae06627e4e2daddf3b5f0078dde9e7294b88d3973c35961fbfd0e6a0`, fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`, evidence report `9bcf081cc00a45806d55a379cfc6af68618d9258e92df9f8d96351955adda50e`;
- Phase-3 coverage PASS: `archives=121`, `cards=244`, `abilities=436`, `compiledCards=169`, `compiledCharacters=34`, `blockingIssues=0`, `newRuntimeSemanticRouted=22`;
- automation audit completed: `legacyResolveEffect=158`, `legacyExecuteAbility=3`, `notClassifiable=253`, `promotionFindings=20`; verification-only audit/coverage artifacts restored byte-for-byte from Base and are not Candidate changes;
- `git diff --check` PASS;
- detailed result: `docs/reports/2026-10-06-p3-s-owner-caules-yggdmillennia-complete-migration-result.md`;
- exact fresh independent review returned `MIGRATION_ACCEPTED` for Candidate `d655fd0d869855bd49221d533193a3dd2cdd6f79` on PR #528;
- canonical Coordinator bounded same-attempt evidence: `https://github.com/binchen648/fd/pull/528#issuecomment-5998630054`;
- acceptance rescan reconfirms Base authoring `0/5` and Candidate authoring exactly `5/5`, so all five identities are newly creditable with no preservation-only overlap;
- lawful FORMAL A-sync/accounting advances strict accounting `211/944 -> 216/944`; remaining `733 -> 728`;
- acceptance synchronization report: `docs/reports/2026-10-06-p3-a-owner-caules-yggdmillennia-acceptance-synchronization.md`;
- next mechanical owner is `master.caules`, frozen scope `5`; accepted FM08 already credited `master.caules.skill.s1a`, so current canonical coverage is `1/5` preservation-only and exactly `4` frozen identities remain uncredited.

## TASK P3-B-CAULES-YGGDMILLENNIA-OWNER-READINESS-STAGED-DECLARATION-PRIVACY

Owner: FORMAL readiness follow-up
Status: `SYNCHRONIZED`
Classification: bounded zero-credit shared client-projection privacy seam discovered by full-owner A-sync/rescan

Scope boundary:
- keep ascension-secret `declaredAttribute` owner-private before the authoritative `controller_combat_action_window` reveal;
- redact or omit the secret attribute from non-owner `stagedAttacks` projection while preserving the staged card/action shape needed by clients;
- preserve owner staged projection and normal post-reveal/public declaration behavior;
- cover both `play_card`/`stage_attack_card` declaration semantics without introducing Caules/card-name/printed-text identity routing;
- keep accepted MatchSession telemetry redaction and secret-event behavior unchanged;
- keep `data/authoring/**` delta empty and grant zero migration credit;
- add focused pre-reveal owner/opponent staged-projection regression, post-reveal/public regression, and affected shared projection tests, then fresh independent exact review.

Detailed preflight/A-sync evidence: `docs/reports/2026-10-05-p3-a-caules-yggdmillennia-owner-readiness-acceptance-synchronization.md`.

Implementation evidence:
- Exact Base is zero-credit readiness A-sync `4a0270b19db4bd60049bbaddd08f65bf120ba05d`;
- `projectAbilityState(...)` now strips only `declaredAttribute` from non-owner staged entries while preserving the staged action/card shape and the owner's full staged choice;
- focused regression uses the real `dispatchAbilityCommand(...)` staging path and reproduces the previously exposed non-owner staged projection boundary;
- focused Caules readiness regression: `12/12 PASS`; MatchSession: `34/34 PASS`; authoring interpreter: `38/38 PASS`;
- task-relevant affected aggregate: `194/194 PASS` across 13 files;
- typecheck PASS; content validation PASS (`14 masters / 19 servants / 20 events / 0 blocking issues`); generated determinism PASS;
- `data/authoring/**` delta EMPTY; production runtime diff contains no Caules/Yggdmillennia identity routing; `git diff --check` PASS;
- detailed result: `docs/reports/2026-10-05-p3-b-caules-yggdmillennia-owner-readiness-staged-declaration-privacy-result.md`;
- fresh independent blocked-retry attempt `pr527:98dada24df0630eb28bed2c33a512102697e9435:blocked-retry-cloudflare-1` returned `IMPLEMENTATION_ACCEPTED_CANDIDATE` for exact Candidate `98dada24df0630eb28bed2c33a512102697e9435`;
- canonical Coordinator bounded same-attempt evidence: `https://github.com/binchen648/fd/pull/527#issuecomment-5998140814`;
- independent verification: Caules `12/12`, MatchSession `34/34`, authoring interpreter `38/38`, combined `84/84`, typecheck/content/generated/diff-check PASS, exact-Candidate Gate run `37294887721` SUCCESS;
- second FORMAL full-owner rescan confirms canonical authoring remains `0/5`, all five frozen identities remain newly creditable, and no remaining owner-local readiness blocker is mechanically reproduced;
- permanently zero migration credit; strict accounting remains `211/944`, remaining `733`;
- owner-complete task `P3-S-OWNER-CAULES-YGGDMILLENNIA-COMPLETE-MIGRATION` is released to `READY`.

## TASK P3-B-CAULES-OWNER-READINESS-CAPABILITY

Owner: FORMAL readiness
Status: `SYNCHRONIZED`
Classification: zero-credit owner-readiness preflight for the complete remaining `master.caules` frozen scope

Frozen owner scope:
- `master.caules.skill.ascension`
- `master.caules.skill.s1`
- `master.caules.skill.s1a`
- `master.caules.skill.s2`
- `master.caules.skill.s3`

Accounting boundary:
- strict formal accounting after accepted Caules Yggdmillennia A-sync is `216/944`, remaining `728`;
- canonical `data/authoring/masters/master.caules.json` currently contains exactly `1/5`: `master.caules.skill.s1a`;
- `master.caules.skill.s1a` is preservation-only because it was already accepted and credited in FM08; it must not be counted again;
- exactly four frozen identities remain uncredited: ascension + s1 + s2 + s3;
- readiness/capability work is permanently zero-credit and must scan the complete five-identity owner contract once before any formal consumer Candidate.

Formal gate:
- use F1 frozen evidence, accepted FM08 preservation lineage, current repo runtime contracts, and locked Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9` as inputs;
- produce one complete owner-local preflight/gap set; bundle compatible identity-free readiness seams rather than splitting per skill;
- only after all required readiness is independently accepted plus FORMAL A-sync/rescan may one owner-complete migration materialize the four remaining identities while preserving `s1a` without duplicate credit.

Implementation evidence:
- Exact Base: `80c6e55f6d8f3bbaa3c8305b205c6c765cf45e86` (accepted Caules Yggdmillennia A-sync/accounting);
- one identity-free definition-variant/Battery capability closes the mechanically reproduced complete current owner-local gap set for `s1 + s2 + s3 + ascension`, while `s1a` remains untouched preservation-only FM08 authoring;
- Battery access is bound to the live provider plus `magic_workshop`; recharge spends chosen VP and grants `2X+1` mana, overhaul pays exactly `2` mana for current-round defeat-ignore, and overload shares the same once-per-round Battery use group;
- overload creates one chosen not-yet-created Thunder variant face-down/private in the skill zone; exact variants are Strength/Agility/Magic/Special/Typeless, each once per game;
- active Thunder variants block matching-attribute phase/response ability activation for same-location players, with the frozen Luck exclusion for Special and Command-Spell exclusion for Typeless;
- ascension stocks/reveals all five variants, removes overload eligibility through live ascension-provider authority, and successful Battery use grants `+2` to controller Magic attack Power for the current round;
- trusted restore provenance validates generated variants and temporary round-Power records fail-closed;
- production runtime routing is identity/text-free; `data/authoring/**` delta is EMPTY;
- focused Caules readiness regression `10/10 PASS`; task-relevant affected aggregate `206/206 PASS` across 14 files;
- `FD_TOOLCHAIN_OK`; typecheck PASS; content validation PASS (`15 masters / 19 servants / 20 events / 0 blocking issues`); generated determinism PASS;
- generated hashes remain content library `c69f9df2ae06627e4e2daddf3b5f0078dde9e7294b88d3973c35961fbfd0e6a0`, fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`, evidence report `9bcf081cc00a45806d55a379cfc6af68618d9258e92df9f8d96351955adda50e`;
- Phase-3 coverage PASS (`archives=121`, `cards=244`, `abilities=436`, `compiledCards=169`, `compiledCharacters=34`, `blockingIssues=0`); automation audit completed (`legacyResolveEffect=158`, `legacyExecuteAbility=3`, `notClassifiable=253`, `promotionFindings=20`); verification-only artifacts restored from Base;
- `git diff --check` PASS;
- detailed result: `docs/reports/2026-10-06-p3-b-caules-owner-readiness-complete-gap-set-result.md`;
- fresh independent exact review `pr529:6932fec00c9e3a3e3a09521c24875eef98a7e10d` returned `IMPLEMENTATION_ACCEPTED_CANDIDATE` for exact Candidate `6932fec00c9e3a3e3a09521c24875eef98a7e10d`;
- canonical Coordinator bounded same-attempt evidence: `https://github.com/binchen648/fd/pull/529#issuecomment-5999415406`;
- lawful zero-credit FORMAL acceptance rescan reconfirms canonical authoring exactly `1/5` with only already-credited `master.caules.skill.s1a`; exactly four identities remain uncredited: ascension + s1 + s2 + s3;
- acceptance synchronization report: `docs/reports/2026-10-06-p3-a-caules-owner-readiness-acceptance-synchronization.md`;
- permanently zero migration credit; strict accounting remains `216/944`, remaining `728`;
- owner-complete task `P3-S-OWNER-CAULES-COMPLETE-MIGRATION` is released to `READY`.

## TASK P3-S-OWNER-CAULES-COMPLETE-MIGRATION

Owner: FORMAL migration
Status: `ACCEPTED`
Classification: owner-complete migration for the complete remaining `master.caules` frozen scope

Frozen owner scope:
- `master.caules.skill.ascension`
- `master.caules.skill.s1`
- `master.caules.skill.s1a`
- `master.caules.skill.s2`
- `master.caules.skill.s3`

Accounting boundary:
- strict formal accounting before this migration is `216/944`, remaining `728`;
- accepted FM08 already credited `master.caules.skill.s1a`, so it is preservation-only and must not be counted again;
- exact maximum lawful migration increment is `+4`: ascension + s1 + s2 + s3;
- one owner-complete Candidate must preserve `s1a` while materializing all four remaining identities together; no per-skill review split.

Formal gate:
- use accepted readiness Candidate `6932fec00c9e3a3e3a09521c24875eef98a7e10d`, canonical evidence `https://github.com/binchen648/fd/pull/529#issuecomment-5999415406`, F1 frozen evidence, FM08 preservation lineage, and locked Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9`;
- consumer authoring must route only through accepted identity-free readiness seams and preserve the already-accepted `s1a` contract;
- before review run focused/affected tests, typecheck, content validation, generated determinism, identity audit, authoring delta audit, and `git diff --check`;
- after Candidate freeze require one fresh independent exact Base/Candidate review; only `MIGRATION_ACCEPTED` permits `+4` accounting.

Implementation evidence:
- Exact Base: `b2aeca6afb18b64762fb49635390f7fc2273e9d9` (accepted zero-credit Caules readiness A-sync);
- canonical `master.caules` authoring expands mechanically from Base `1/5` to Candidate `5/5`; `master.caules.skill.s1a` is byte-equivalent as a parsed JSON object to its Base FM08 preservation record, while exactly four identities are newly materialized: ascension + s1 + s2 + s3;
- one canonical archive now consumes only the accepted identity-free definition-variant/Battery readiness family for Bio-Electromancer, Recharge/Overhaul/Overload, five Crafted Tree variants, activation locks, and ascension stock/current-round Magic +2;
- the archive is integrated exactly once immediately after `master.caules-yggdmillennia` in `fd-playtest-v1` and checked-in generated content/evidence artifacts are regenerated;
- owner-complete regression `9/9 PASS`; accepted readiness regression `10/10 PASS`; FM08 preservation regression `5/5 PASS`;
- task-relevant affected aggregate `220/220 PASS` across 16 files with `--maxWorkers=1` to avoid unrelated MatchSession timeout variance under local parallel CPU contention;
- 16-master pool expansion shifted two generic MatchSession deterministic smoke fixtures; bounded test-only seeds converge from `3 -> 4` for the one-round smoke and `3 -> 5` for the three-round event smoke, preserving the original assertions with no production runtime change;
- owner consumer regression explicitly proves Special preserves the `basic.luck` exception and Typeless preserves the `command_spell` exception through the canonical activation-lock path;
- `FD_TOOLCHAIN_OK`; typecheck PASS; content validation PASS (`16 masters / 19 servants / 20 events / 0 blocking issues`);
- generated determinism PASS with content-library hash `3a41527740651f400a18619d5b1f8993858c32a704be47fe77ae22f11f38c82f`, fixture hash `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`, evidence-report hash `7fb41d5b2e24e0482b818d2cfc52ef544e4638920d48687300a353fba5c7b0e5`;
- Phase-3 coverage run completed with `archives=121`, `cards=248`, `abilities=442`, `compiledCards=175`, `compiledCharacters=35`, `blockingIssues=0`, `newRuntimeSemanticRouted=22`; automation audit completed with `legacyResolveEffect=158`, `legacyExecuteAbility=3`, `notClassifiable=259`, `promotionFindings=20`; verification-only coverage/audit artifacts were restored from Exact Base and are not Candidate changes;
- production runtime delta identity/text audit for `master.caules`, owner/skill names, and legacy handler id is CLEAN; `git diff --check` PASS;
- detailed result: `docs/reports/2026-10-06-p3-s-owner-caules-complete-migration-result.md`;
- exact fresh independent review returned `MIGRATION_ACCEPTED` for Candidate `0d6a5e9426a2ee437b981f85fcba811bc37dd360` on PR #530;
- canonical GitHub evidence: `https://github.com/binchen648/fd/pull/530#issuecomment-6000020804`;
- predecessor ReviewJob for `537f628aed3c2cb2736222c088ef25751da94aec` was `MIGRATION_BLOCKED` only because PR HEAD advanced to the accepted successor; it introduced no code finding and is retained as transport/lineage evidence at `https://github.com/binchen648/fd/pull/530#issuecomment-5999987403`;
- acceptance rescan reconfirms Base authoring exactly `1/5` (`s1a` only) and accepted Candidate authoring exactly `5/5`; parsed `s1a` is unchanged, so exactly four identities are newly creditable: ascension + s1 + s2 + s3;
- lawful FORMAL A-sync/accounting advances strict accounting `216/944 -> 220/944`; remaining `728 -> 724`;
- acceptance synchronization report: `docs/reports/2026-10-06-p3-a-owner-caules-acceptance-synchronization.md`;
- next mechanical owner is `master.celenike`, frozen scope exactly `3`; canonical authoring is currently `0/3`. Historical FB2-03 membership of `master.celenike.skill.s1a` is reusable component evidence only and grants no parent-route or migration credit.

## TASK P3-B-CELENIKE-OWNER-READINESS-CAPABILITY

Owner: FORMAL readiness
Status: `SYNCHRONIZED`
Classification: zero-credit complete-owner readiness/preflight for `master.celenike`

Frozen owner scope:
- `master.celenike.skill.ascension`
- `master.celenike.skill.s1`
- `master.celenike.skill.s1a`

Accounting boundary:
- strict formal accounting after accepted Caules A-sync is `220/944`, remaining `724`;
- stable first-occurrence owner order in `data/phase3/full-roster-ability-inventory.json` places `master.celenike` immediately after `master.caules`;
- canonical `data/authoring/masters/master.celenike.json` is absent, so current canonical owner coverage is `0/3`;
- no prior formal migration credit for these three identities is established by current task/accounting evidence;
- `master.celenike.skill.s1a` appears in the accepted FB2-03 fixed Resource Numeric component membership, but that handoff explicitly does not authorize its parent trigger/action/condition route and must not be counted as migration credit.

Formal gate:
- inventory route is currently `SOURCE_EVIDENCE_REQUIRED / EXPLICIT_BLOCK` for all three frozen identities; use F1 frozen evidence, current repo contracts, and locked Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9` as inputs rather than restarting whole-roster classification;
- scan the complete three-identity owner once and close the complete owner-local source/readiness gap set before any consumer migration Candidate;
- preserve identity-free runtime authority; bundle compatible readiness seams instead of per-skill review splits;
- readiness/capability work is permanently zero-credit; only a later owner-complete migration fresh R plus FORMAL A-sync/accounting may grant credit.

Implementation evidence:
- Exact Base: `1b793b97f6aca6d3b8d9e1d77ff498e1aa6e2c78` (accepted Caules owner A-sync/accounting, strict accounting `220/944`, remaining `724`);
- complete owner scan closes the currently reproduced `ascension + s1 + s1a` source/readiness gap set through one identity-free battle-wither capability instead of per-skill runtime branches;
- `s1` uses authoritative battle result events: controller loss applies status-keyed, source-scoped Wither to every winner; a later controller win transfers the actual up-to-2 VP only from participants carrying that exact accepted `statusKey`; source-scoped Wither clears only after that source controller has gained at least 4 gross VP in the same round and the tracker resets at the round boundary;
- ascension Pain Stake is a server-authored sequential owner-only interaction: each active Withered player chooses to pay exactly 2 mana when affordable or discard their entire hand, with the target player owning the choice and restore provenance failing closed on forged interaction/state;
- `s1a` consumes the authoritative `after_battle_ended` terminal event and, only at `magic_workshop`, grants 2 mana through canonical `grantMana` and loses up to 1 VP with the normal VP floor; historical FB2-03 Resource Numeric membership remains component evidence only and grants no migration credit;
- privileged loader/interpreter routing is whole-ability structural and production runtime contains no `master.celenike`, owner/skill text, or `core.celenike-*` identity routing;
- initial Candidate focused Celenike readiness regression `7/7 PASS`; initial affected aggregate `225/225 PASS` across 18 files with `--maxWorkers=1`;
- exact initial Candidate `581e45116a5b1faed06354237790fade9c1ce106` received `IMPLEMENTATION_NEEDS_REVISION`; canonical Coordinator bounded same-attempt evidence is `https://github.com/binchen648/fd/pull/531#issuecomment-6001025236`;
- the P1 cross-status isolation finding is closed by requiring the active `statusKey` for VP-steal and Pain Stake eligibility/staging/live validation/ordering while preserving multiple source-player provenance within the same status family;
- successor-focused Celenike readiness regression `8/8 PASS`, including two distinct accepted `statusKey` families proving A cannot consume/target B-only Wither and that two independent A-family sources remain compatible; fresh affected shared rerun `186/186 PASS` across 18 targeted files with `--maxWorkers=1`;
- typecheck PASS; content validation PASS (`16 masters / 19 servants / 20 events / 0 blocking issues`); generated determinism PASS with content-library hash `3a41527740651f400a18619d5b1f8993858c32a704be47fe77ae22f11f38c82f`, fixture hash `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`, evidence-report hash `7fb41d5b2e24e0482b818d2cfc52ef544e4638920d48687300a353fba5c7b0e5`;
- Phase-3 coverage completed with `archives=121`, `cards=248`, `abilities=442`, `compiledCards=175`, `compiledCharacters=35`, `blockingIssues=0`, `newRuntimeSemanticRouted=22`; automation audit completed with `legacyResolveEffect=158`, `legacyExecuteAbility=3`, `notClassifiable=259`, `promotionFindings=20`; verification-only artifacts were restored from Exact Base;
- `data/authoring/**` remains unchanged and readiness is permanently zero-credit, so strict accounting stays `220/944`, remaining `724` pending a later owner-complete migration acceptance+A-sync;
- `git diff --check` PASS; detailed result: `docs/reports/2026-10-06-p3-b-celenike-owner-readiness-complete-gap-set-result.md`;
- fresh independent exact successor review returned `IMPLEMENTATION_ACCEPTED_CANDIDATE` for `f428cd81ebbbf2b27f4a2d3d75e079a55fa9b85d`; canonical Coordinator bounded same-attempt evidence is `https://github.com/binchen648/fd/pull/531#issuecomment-6001207017`;
- lawful FORMAL zero-credit acceptance rescan reconfirms canonical Celenike authoring remains `0/3`, all three frozen identities remain uncredited, and strict accounting stays `220/944`, remaining `724`;
- acceptance synchronization report: `docs/reports/2026-10-06-p3-a-celenike-owner-readiness-acceptance-synchronization.md`;
- owner-complete task `P3-S-OWNER-CELENIKE-COMPLETE-MIGRATION` is released to `READY`.

## TASK P3-S-OWNER-CELENIKE-COMPLETE-MIGRATION

Owner: FORMAL migration
Status: `SYNCHRONIZED`
Classification: owner-complete migration for the complete frozen `master.celenike` scope

Frozen owner scope:
- `master.celenike.skill.ascension`
- `master.celenike.skill.s1`
- `master.celenike.skill.s1a`

Accounting boundary:
- strict formal accounting before this migration is `220/944`, remaining `724`;
- canonical authoring is exactly `0/3` at the synchronized readiness boundary;
- all three identities are currently uncredited, so the exact maximum lawful future increment is `+3`;
- historical FB2-03 `s1a` component membership is reusable evidence only and must not be treated as prior migration credit.

Formal gate:
- use accepted readiness successor `f428cd81ebbbf2b27f4a2d3d75e079a55fa9b85d`, canonical evidence `https://github.com/binchen648/fd/pull/531#issuecomment-6001207017`, frozen F1 evidence, and locked Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9`;
- materialize ascension + s1 + s1a together in one canonical `master.celenike` archive consuming only accepted identity-free battle-wither seams; no per-skill review split;
- before Candidate freeze run focused/affected tests, typecheck, content validation, generated determinism, identity audit, authoring delta audit, and `git diff --check`;
- require one fresh independent exact Base/Candidate review; only `MIGRATION_ACCEPTED` permits `+3` accounting.

Implementation evidence:
- Exact Base: `6e4041bc3aaade024edbc2e347127d5769d195cd` (accepted zero-credit Celenike readiness A-sync; strict accounting `220/944`, remaining `724`);
- canonical `data/authoring/masters/master.celenike.json` expands mechanically from Base `0/3` to Candidate `3/3`, materializing exactly ascension + s1 + s1a with no preservation-only member;
- locked Reference static metadata is preserved: initial mana `4`; s1/s1a passive cost/base Power `0`; ascension `魔术`, cost `6`, requirement `6`, base Power `9`, outside-game initial placement;
- all three cards consume only the accepted PR #531 exact-status battle-wither readiness family: s1 applies source-scoped Wither on controller loss and steals actual up-to-2 VP from matching-status battle participants on controller win; ascension Pain Stake resolves sequential target-owned mandatory pay-2-mana/discard-all choices; s1a applies Magic-Workshop battle-end `+2 mana / -1 VP`;
- archive is integrated exactly once immediately after `master.caules` in `fd-playtest-v1`; generated content library/evidence artifacts are rebuilt for the 17-master pack;
- owner-complete regression `7/7 PASS`; accepted readiness regression `8/8 PASS`; task-relevant affected aggregate `193/193 PASS` across 19 files with `--maxWorkers=1`;
- expanding the canonical master pool to 17 shifted one deterministic MatchSession Luck fixture; bounded test-only seed changes `1 -> 2` preserve the original battle assertions with no production runtime semantic change;
- `npm run typecheck` PASS; content validation PASS (`17 masters / 19 servants / 20 events / 0 blocking issues`); generated determinism PASS with content-library hash `071a195543ddf1b5ebddfc0fe6e48e8d29e7cf41d8873ea20284ab8839c14c2b`, fixture hash `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`, evidence-report hash `607542ffb2e1b165665c7df9a5c2be2e82312854e0a91cd2260ae8c7ccd2c219`;
- Phase-3 coverage run completed with `archives=122`, `cards=251`, `abilities=446`, `compiledCards=179`, `compiledCharacters=36`, `blockingIssues=0`, `newRuntimeSemanticRouted=22`; automation audit completed with `legacyResolveEffect=158`, `legacyExecuteAbility=3`, `notClassifiable=263`, `promotionFindings=20`; verification-only coverage/audit artifacts were restored byte-for-byte from Exact Base;
- production runtime identity/text/legacy-handler audit for Celenike is CLEAN; authoring delta is exactly one canonical owner archive containing the three frozen identities; `git diff --check` PASS;
- detailed result: `docs/reports/2026-10-06-p3-s-owner-celenike-complete-migration-result.md`;
- fresh independent exact Base/Candidate review returned `MIGRATION_ACCEPTED` for Candidate `a1dbdb1eb43302569aca4695853858adf7b3cba2` on PR #532;
- canonical GitHub evidence: `https://github.com/binchen648/fd/pull/532#issuecomment-6001515458` (Coordinator bounded relay / same already-completed review attempt after Reviewer HTTP 403);
- lawful FORMAL acceptance rescan reconfirms Exact Base authoring `0/3` and accepted Candidate authoring `3/3`, with all three frozen identities newly creditable and no prior migration-credit overlap;
- lawful FORMAL A-sync/accounting advances strict accounting `220/944 -> 223/944`; remaining `724 -> 721`;
- acceptance synchronization report: `docs/reports/2026-10-06-p3-a-owner-celenike-acceptance-synchronization.md`;
- next mechanical owner in stable full-roster first-occurrence order is `master.chaos`, frozen scope `18`; canonical `data/authoring/masters/master.chaos.json` is absent. Historical FB2-03 membership of `master.chaos.skill.s7` is reusable Resource Numeric component evidence only and grants no parent-route or migration credit.

## TASK P3-B-CHAOS-OWNER-READINESS-CAPABILITY

Owner: FORMAL readiness
Status: `SYNCHRONIZED`
Classification: zero-credit complete-owner readiness/preflight for `master.chaos`

Frozen owner scope: exactly `18` identities (`ascension`, `s1`, `s2` through `s17`).

Accounting boundary:
- strict formal accounting after accepted Celenike A-sync is `223/944`, remaining `721`;
- canonical `data/authoring/masters/master.chaos.json` is absent, so current canonical owner coverage is `0/18`;
- historical FB2-03 membership of `master.chaos.skill.s7` is component evidence only and must not be counted as migration credit;
- readiness/capability work is permanently zero-credit; no Chaos migration credit may be granted before one later owner-complete migration fresh R plus FORMAL A-sync/accounting.

Formal gate:
- mechanically scan all 18 frozen Chaos identities once against F1 frozen evidence, current repo contracts, accepted reusable components, and locked Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9`; do not restart whole-roster classification;
- close the complete owner-local readiness gap set in compatible identity-free capability families before any consumer migration Candidate;
- no per-skill review split; one complete owner readiness transaction, then one owner-complete consumer migration for all remaining frozen identities;
- HELPER remains read-only and may prepare the complete gap set but may not implement, publish formal PRs, or count credit.

Implementation evidence:
- Exact Base: `87a0a9d15e5799742d8c41c6a11cbd7e64ffa3c9` (accepted Celenike migration A-sync/accounting; strict accounting `223/944`, remaining `721`);
- complete 18-identity Chaos scan is closed through one identity-free definition-side-deck capability family rather than owner-name or per-skill runtime branches;
- the runtime family covers one isolated 15-definition Beast deck/hand/discard, mana-gain draw coupling, Beast-only printed-cost payments, delayed draw/discard, battle loss/win consumers, entering-opponent round Power penalty, terrain doubling reuse, virtual Command Seal conversion/closure, arrow movement + source Power, exact event-VP discard, Noble-Phantasm Power bonus, no-seal-spend/use opponent penalty, discard-all source Power, once-per-game four-way replacement, ascension unlimited Beast play, and pay-4 draw;
- exact trusted battle provenance is required for loss/win consumers, and accepted side-deck loss semantics are isolated from the legacy command-seal battle-loss resource gate;
- side-deck physical cards remain owner-only in deck/hand/discard projections and public only after actual Beast play; restore provenance validates exact deck membership, zones, provider source, pending decision, event cursor, virtual seal source, and spent/use markers;
- focused complete-owner readiness regression `14/14 PASS`, including private projection, forged restore rejection, delayed lifecycle, s2-s17 behavior, once-per-game exclusivity, adjacent movement, and win reward;
- stable task-relevant affected aggregate `137/137 PASS` across 10 files, including MatchSession `34/34`, authoring interpreter `38/38`, Spartacus seal-power readiness `20/20`, movement, terrain, ascension, Resource Numeric and fixed command-seal/resource components;
- broader exploratory historical-fixture sweep found only pre-existing/stale fixed-pool/seed assumptions and legacy simulation/restore fixtures outside this zero-authoring readiness delta; no such unrelated test is modified or claimed green by this Candidate;
- `npm run typecheck` PASS; content validation PASS (`17 masters / 19 servants / 20 events / 0 blocking issues`); generated determinism PASS with content-library hash `071a195543ddf1b5ebddfc0fe6e48e8d29e7cf41d8873ea20284ab8839c14c2b`, fixture hash `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`, evidence-report hash `607542ffb2e1b165665c7df9a5c2be2e82312854e0a91cd2260ae8c7ccd2c219`;
- Phase-3 coverage completed with `archives=122`, `cards=251`, `abilities=446`, `compiledCards=179`, `compiledCharacters=36`, `blockingIssues=0`, `newRuntimeSemanticRouted=22`; automation audit completed with `legacyResolveEffect=158`, `legacyExecuteAbility=3`, `notClassifiable=263`, `promotionFindings=20`; verification-only artifacts were restored byte-for-byte from Exact Base;
- `data/authoring/**` delta remains EMPTY, production runtime Chaos identity/text/legacy-handler audit is CLEAN, and `git diff --check` PASS; readiness remains permanently zero-credit, so accounting stays `223/944`, remaining `721`;
- detailed result: `docs/reports/2026-10-06-p3-b-chaos-owner-readiness-complete-gap-set-result.md`;
- fresh independent exact Base/Candidate review returned `IMPLEMENTATION_ACCEPTED_CANDIDATE` for Candidate `41f6851ee598e38196c53d2b42660c90c12db19c` on PR #533;
- canonical GitHub evidence: `https://github.com/binchen648/fd/pull/533#issuecomment-6009446778`;
- lawful FORMAL zero-credit acceptance rescan reconfirms canonical Chaos authoring remains `0/18`, all 18 frozen identities remain uncredited, and strict accounting stays `223/944`, remaining `721`;
- acceptance synchronization report: `docs/reports/2026-10-06-p3-a-chaos-owner-readiness-acceptance-synchronization.md`;
- owner-complete task `P3-S-OWNER-CHAOS-COMPLETE-MIGRATION` is released to `READY`.

## TASK P3-S-OWNER-CHAOS-COMPLETE-MIGRATION

Owner: FORMAL migration
Status: `SYNCHRONIZED`
Classification: owner-complete migration for the complete frozen `master.chaos` scope

Frozen owner scope: exactly `18` identities (`ascension`, `s1`, `s2` through `s17`).

Accounting boundary:
- strict formal accounting before this migration is `223/944`, remaining `721`;
- canonical authoring remains exactly `0/18` at the synchronized readiness boundary;
- all 18 identities are currently uncredited, so the exact maximum lawful future increment is `+18`;
- historical FB2-03 membership of `master.chaos.skill.s7` is reusable component evidence only and grants no parent-route or migration credit.

Formal gate:
- materialize the complete frozen 18-identity Chaos owner archive in one Candidate; do not split per skill;
- consume only accepted identity-free readiness shapes from PR #533 and previously accepted reusable components;
- preserve locked Reference metadata and behavior for every frozen identity;
- run owner-complete focused regressions plus affected shared regressions, typecheck, content validation, generated determinism, Phase-3 coverage/audit, production identity/text audit, and `git diff --check`;
- one fresh independent exact Base/Candidate migration review is required before any `+18` accounting.

Implementation evidence:
- Exact Base: `90d28a93dd703b5457d13834f8c3a2aaaa6cee96` (accepted zero-credit Chaos readiness A-sync; strict accounting `223/944`, remaining `721`);
- canonical `data/authoring/masters/master.chaos.json` expands mechanically from Base `0/18` to Candidate `18/18`, materializing exactly ascension plus `s1` through `s17`;
- locked Reference static metadata is preserved: owner initial mana `4`; all 18 names, printed text, type labels, printed costs and base Power values are sourced from Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9`;
- all runtime semantics route through the accepted PR #533 identity-free definition-side-deck family plus a bounded identity-free terrain-doubling variant; production runtime contains no Chaos owner id, printed-name or `core.chaos-*` branch;
- `s1` owns the isolated 15-definition Beast side deck; `s2` through `s16` are those 15 physical Beast definitions and remain outside the ordinary starting skill zone; `s17` is the game-long Scrambled Seal option source; ascension remains outside-game until unlocked;
- canonical basic-card bindings are `basic.preparation` for 【远隔操作】 and `basic.luck` for 【幸运】; `s14` binds the canonical `宝具` attribute;
- owner-complete migration regression `5/5 PASS`; accepted Chaos readiness regression `14/14 PASS`; MatchSession `34/34 PASS`; authoring interpreter `38/38 PASS`;
- predecessor Candidate `147f67df1f17ea62276447dea1c6b9600c3de822` received `MIGRATION_NEEDS_REVISION` on PR #534 because s10 incorrectly paid one additional mana when activating terrain doubling; canonical review evidence: `https://github.com/binchen648/fd/pull/534#issuecomment-6009572809`;
- successor closes that finding by preserving the printed Beast cost only in the existing Beast-play discard-payment path, authoring s10 activation with zero additional mana, and splitting the terrain capability preflight into two exact lifecycle variants: paid inactive `skill` source for Vlad remains unchanged, while zero-cost terrain doubling is permitted only from an already-active `field/attack_area` source;
- successor regression executes s10 after Beast play, proves terrain doubles from positive terrain and controller mana does not decrease; Vlad readiness + owner-complete regression remains `18/18 PASS`;
- `npm run typecheck` PASS; content validation PASS (`18 masters / 19 servants / 20 events / 0 blocking issues`); generated determinism PASS with content-library hash `2f48b6017d0df5ab1aac303a1a84067875b8cfe45cd7f971cf45e4844b56c81e`, fixture hash `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`, evidence-report hash `faa416e9cd4ccc9795a660beb2c241591d601140fdc8ed6accead1b56aa6ddae`;
- Phase-3 coverage completed with `archives=123`, `cards=269`, `abilities=467`, `compiledCards=198`, `compiledCharacters=37`, `blockingIssues=0`, `newRuntimeSemanticRouted=22`; automation audit completed with `legacyResolveEffect=158`, `legacyExecuteAbility=3`, `notClassifiable=284`, `promotionFindings=20`; verification-only artifacts were restored byte-for-byte from Exact Base;
- repository-wide `test:source-assets` remains blocked by 93 pre-existing missing `chm-extract/图包` assets; the reported missing set contains no Chaos source path, and normal source-evidence/content validation for Chaos is green;
- authoring delta is exactly one complete Chaos owner archive plus one pack registration and regenerated canonical content/evidence artifacts; `git diff --check` PASS;
- detailed result: `docs/reports/2026-10-06-p3-s-owner-chaos-complete-migration-result.md`;
- successor Candidate `b1dba061da28fea587989223311a943e5d71eee6` received `MIGRATION_ACCEPTED` on PR #534;
- canonical GitHub evidence: `https://github.com/binchen648/fd/pull/534#issuecomment-6009694427`;
- exact-head Phase 3 Pre-Review Gate run `37416444529` = `SUCCESS`;
- lawful FORMAL migration acceptance synchronization credits exactly the complete frozen `18/18` Chaos owner scope: `223/944 + 18 = 241/944`, remaining `703`;
- acceptance synchronization report: `docs/reports/2026-10-06-p3-a-owner-chaos-acceptance-synchronization.md`;
- stable first-occurrence owner order in `data/phase3/full-roster-ability-inventory.json` places `master.ciel` immediately after `master.chaos`; Ciel frozen scope is exactly `6` identities and canonical `data/authoring/masters/master.ciel.json` is absent (`0/6`);
- historical Ciel component/recovery branches and loader-ready evidence do not grant parent migration credit; the next legal formal transaction is zero-credit complete-owner readiness `P3-B-CIEL-OWNER-READINESS-CAPABILITY`.

## TASK P3-B-CIEL-OWNER-READINESS-CAPABILITY

Owner: FORMAL readiness
Status: `SYNCHRONIZED`
Classification: zero-credit complete-owner readiness/preflight for `master.ciel`

Frozen owner scope: exactly `6` identities in stable full-roster inventory order.

Accounting boundary:
- strict formal accounting after Chaos acceptance is `241/944`, remaining `703`;
- canonical Ciel authoring is exactly `0/6`;
- readiness/capability work is permanently zero-credit;
- historical Ciel FB2/recovery/component evidence may be reused only as mechanically reverified component evidence and grants no parent-route migration credit.

Formal gate:
- mechanically recover all six frozen Ciel identities, locked Reference metadata/printed behavior, current runtime support, and exact readiness gaps before writing consumer authoring;
- close the complete owner-local readiness gap set in one zero-credit Candidate, not per-skill migration fragments;
- keep runtime capability shapes identity-free and bounded;
- run focused readiness regressions, affected shared regressions, typecheck, content validation, generated determinism, Phase-3 coverage/audit, production identity/text audit, and `git diff --check`;
- one fresh independent exact Base/Candidate implementation review is required before FORMAL zero-credit A-sync/rescan may release Ciel owner-complete migration.

Implementation evidence:
- Exact Base: `e1afb8772b76c4ca4e522ab9fda84824df2a6b5d`; strict accounting remains `241/944`, remaining `703`;
- locked Reference mechanically confirms the complete six-identity owner scope: `s1`, `s1a`, `s1b`, `s2`, `s3`, ascension;
- no `data/authoring/**` consumer delta is present in this readiness Candidate; canonical Ciel authoring remains `0/6`;
- `s1`: adds one exact identity-free regular-movement engagement-waiver seam that ignores only the provider/controller engagement edge and preserves unrelated same-location engagers;
- `s1a`: no new runtime is required; existing accepted game-start skill provisioning is sufficient for adding 【火葬式典】 to the skill zone;
- `s1b`: mechanically replays the previously accepted generic definition-return + authoritative per-round opponent VP-gain threshold components, now with exact trusted VP transition provenance connected to current scoring paths;
- `s2`: mechanically replays the accepted generic current deployment-bonus metric; existing controller-alone battlefield, VP adjustment, location-kind and mana adjustment primitives complete the printed behavior;
- `s3`: mechanically replays the accepted exact next-round situation-benefit suppression seam for same-battlefield opponents without active 【幸运】, limited to situation mana/power bonuses;
- ascension: adds one exact identity-free `+4` Strength-attack provider and one exact conditional additional-play provider (`>=8` current mana, named definition only, `+2` mana, one ordinary attack anchor required); the same accepted suppression seam is reusable for its inherited 【粉碎灵魂】 clause;
- production runtime identity/text audit for `master.ciel`, 希耶尔, 第七圣典, 火葬式典 and `core.ciel-*` is CLEAN;
- Ciel readiness focused + mechanically replayed historical generic component regressions: `38/38 PASS`;
- MatchSession `34/34 PASS`; authoring interpreter `38/38 PASS`; `npm run typecheck` PASS;
- content validation PASS: `18 masters / 19 servants / 20 events / 0 blocking issues`;
- generated determinism PASS: content `2f48b6017d0df5ab1aac303a1a84067875b8cfe45cd7f971cf45e4844b56c81e`; fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`; evidence `faa416e9cd4ccc9795a660beb2c241591d601140fdc8ed6accead1b56aa6ddae`;
- Phase-3 coverage completed with `archives=123`, `cards=269`, `abilities=467`, `compiledCards=198`, `compiledCharacters=37`, `blockingIssues=0`, `newRuntimeSemanticRouted=22`; automation audit completed with `legacyResolveEffect=158`, `legacyExecuteAbility=3`, `notClassifiable=284`, `promotionFindings=20`; verification-only artifacts were restored byte-for-byte from Exact Base;
- repository-wide source-asset validation remains blocked by the same `93` pre-existing missing `chm-extract/图包` files; the emitted missing set contains no Ciel source path;
- `git diff --check` PASS;
- detailed result: `docs/reports/2026-10-06-p3-b-ciel-owner-readiness-complete-gap-set-result.md`;
- Candidate `68bf95286d53cf0d12ebe8951d40d7478870bf94` received `IMPLEMENTATION_ACCEPTED_CANDIDATE` on PR #535;
- canonical evidence: `https://github.com/binchen648/fd/pull/535#issuecomment-6011244993`;
- latest exact-head Phase 3 Pre-Review Gate run `37427504778` = `SUCCESS`;
- zero-credit FORMAL acceptance synchronization/rescan keeps accounting exactly `241/944`, remaining `703`;
- acceptance synchronization report: `docs/reports/2026-10-06-p3-a-ciel-owner-readiness-acceptance-synchronization.md`;
- complete readiness rescan finds no remaining undiscovered owner-local runtime gap; the lawful next transaction is full six-identity owner consumer migration `P3-S-OWNER-CIEL-COMPLETE-MIGRATION`.

## TASK P3-S-OWNER-CIEL-COMPLETE-MIGRATION

Owner: FORMAL migration
Status: `SYNCHRONIZED`
Classification: formal owner-complete migration for `master.ciel`

Frozen scope: exactly `6` identities — `s1`, `s1a`, `s1b`, `s2`, `s3`, ascension.

Accounting boundary:
- Exact Base after readiness A-sync remains `241/944`, remaining `703`;
- canonical Ciel authoring is `0/6` before this migration transaction;
- maximum lawful increment is exactly `+6`, and only after fresh exact `MIGRATION_ACCEPTED` + FORMAL A-sync/accounting;
- historical Ciel component/recovery branches and readiness implementation remain zero-credit provenance only.

Formal gate:
- materialize all six frozen Ciel identities in one canonical `data/authoring/masters/master.ciel.json` archive;
- preserve locked Reference names, printed text, type labels, printed costs/base Power, initial mana and owner semantics;
- consume only accepted generic seams from synchronized readiness; do not add Ciel identity branches;
- register the archive exactly once in the canonical playtest pack;
- run owner-complete focused regression + readiness regressions + affected shared regressions, typecheck, content validation, generated determinism, Phase-3 coverage/audit, production identity/text audit, and `git diff --check`;
- one fresh independent exact Base/Candidate migration review is required before any `+6` accounting.

Implementation evidence:
- Exact Base: `1492fe5b18607db55e2a538c14202b1eeb4b0f6d`; strict accounting remains `241/944`, remaining `703`;
- canonical `data/authoring/masters/master.ciel.json` now materializes exactly the frozen six identities once, with initial mana `4`, locked Reference names/text/static metadata, and no parent credit yet;
- archive registration occurs exactly once immediately after `master.chaos`;
- `s1`, `s1b`, `s3`, and ascension consume only synchronized/accepted identity-free readiness seams; `s1a` uses accepted game-start provisioning; `s2` uses accepted generic deployment-bonus/resource primitives;
- Ciel owner-complete regression `6/6 PASS`; combined Ciel readiness + affected provisioning/deployment focused run `25/25 PASS`;
- MatchSession `34/34 PASS`; authoring interpreter `38/38 PASS`; shared full-match smoke seed recertified from `20260904` to `1` because the former deterministic path still completed normally but exceeded its explicit 10s test budget after the production pack expanded to 19 masters;
- `npm run typecheck` PASS; content validation/compile PASS at `19 masters / 19 servants / 20 events / 0 blocking issues`;
- generated determinism PASS: content `90e4312ab3097f4c0e370ab4d573202c3ca3c011b9293ddc4db92b842bb87d71`, fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`, evidence `7a6eeed4246641f832d6b7cdc84649593f8c7d2f58ecf263b38b4d5c724ea745`;
- Phase-3 coverage: `archives=124`, `cards=275`, `abilities=477`, `compiledCards=205`, `compiledCharacters=38`, `blockingIssues=0`, `newRuntimeSemanticRouted=22`; automation audit: `legacyResolveEffect=160`, `legacyExecuteAbility=3`, `notClassifiable=292`, `promotionFindings=20`; verification-only artifacts restored byte-for-byte from Exact Base;
- production identity/text audit for `master.ciel`, 希耶尔, 第七圣典, 火葬式典, and `core.ciel-` is CLEAN;
- repository-wide source-asset validation remains blocked by exactly `93` pre-existing missing `chm-extract/图包` files; emitted missing set contains no Ciel source path;
- `git diff --check` PASS;
- detailed result: `docs/reports/2026-10-07-p3-s-owner-ciel-complete-migration-result.md`;
- accepted Candidate `bab5010563f3045d24943d14bfc95c6b58ba408b` received `MIGRATION_ACCEPTED` on PR #537;
- canonical GitHub evidence: `https://github.com/binchen648/fd/pull/537#issuecomment-6020685082`;
- exact-head Phase 3 Pre-Review Gate run `37495106107` = `SUCCESS`;
- lawful FORMAL migration acceptance synchronization credits exactly the complete frozen `6/6` Ciel owner scope: `241/944 + 6 = 247/944`, remaining `697`;
- acceptance synchronization report: `docs/reports/2026-10-07-p3-a-owner-ciel-acceptance-synchronization.md`;
- stable first-occurrence owner order in `data/phase3/full-roster-ability-inventory.json` places `master.dan` immediately after `master.ciel`; Dan frozen scope is exactly `3` identities and canonical `data/authoring/masters/master.dan.json` is absent (`0/3`);
- the next legal formal transaction is zero-credit complete-owner readiness `P3-B-DAN-OWNER-READINESS-CAPABILITY`.

## TASK P3-B-DAN-OWNER-READINESS-CAPABILITY

Owner: FORMAL readiness
Status: `SYNCHRONIZED`
Classification: zero-credit complete-owner readiness/preflight for `master.dan`

Frozen owner scope: exactly `3` identities — `ascension`, `s1`, `s1a`.

Accounting boundary:
- strict formal accounting after Ciel acceptance is `247/944`, remaining `697`;
- canonical Dan authoring is exactly `0/3`;
- readiness/capability work is permanently zero-credit;
- Reference-specific handler evidence is discovery/provenance only and grants no parent migration credit.

Mechanical owner evidence:
- stable full-roster first-occurrence order places `master.dan` immediately after `master.ciel`;
- locked Reference identifies 丹·布拉克莫尔 with initial mana `4`;
- frozen identities are exactly `master.dan.skill.ascension` (五朔节骑士), `master.dan.skill.s1` (可敬的狙击手), and `master.dan.skill.s1a` (荣誉);
- current inventory classifies the Dan routes behind Reference-specific/source-evidence-required boundaries, so complete owner-local readiness must be mechanically recovered before consumer authoring.

Formal gate:
- mechanically recover all three frozen Dan identities, locked Reference metadata/printed behavior, current generic runtime support, historical accepted components if any, and the complete owner-local readiness gap set before writing consumer authoring;
- close the complete readiness gap set in one bounded zero-credit Candidate rather than per-skill migration fragments;
- keep new runtime capability shapes identity-free and exact;
- run focused readiness regressions, affected shared regressions, typecheck, content validation, generated determinism, Phase-3 coverage/audit, production identity/text audit, and `git diff --check`;
- one fresh independent exact Base/Candidate implementation review is required before zero-credit A-sync/rescan may release Dan owner-complete migration.

Implementation evidence:
- Exact Base: `2c3ed8ee7f7808d21e1afa062e56bdcc25393d8b`; strict accounting remains `247/944`, remaining `697`, and `data/authoring/**` delta is EMPTY;
- complete identity-free readiness seam added for workshop deployment -> current-round fixed `miyama_town=3` / `shinto=5` terrain, preserving shared authored terrain adjustments and ordinary 远隔操作 doubling;
- complete identity-free Honor seam added for actual movement into an actual battlefield with exactly two active opponents, suppressing only the frozen battle's `competition_vp` reward on a controller win;
- complete identity-free ascension supply seam added: unlock seeds exactly `3 x basic.preparation` + `2 x basic.surveil`, one attached definition may be additionally played per round at printed mana cost, draw 1, without consuming ordinary attack declaration quota;
- source/ability/event/physical-card provenance is server-owned and restore-validated; no Dan identity/name/legacy-handler branch exists in production runtime;
- Dan readiness regression `9/9 PASS`; affected terrain/scoring + authoring interpreter + MatchSession aggregate `89/89 PASS`;
- typecheck PASS; content validation PASS at `19 masters / 19 servants / 20 events / 0 blocking issues`; generated determinism PASS with unchanged content `90e4312ab3097f4c0e370ab4d573202c3ca3c011b9293ddc4db92b842bb87d71`, fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`, evidence `7a6eeed4246641f832d6b7cdc84649593f8c7d2f58ecf263b38b4d5c724ea745`;
- Phase-3 coverage verification: `archives=124`, `cards=275`, `abilities=477`, `compiledCards=205`, `compiledCharacters=38`, `blockingIssues=0`, `newRuntimeSemanticRouted=22`; automation audit: `legacyResolveEffect=160`, `legacyExecuteAbility=3`, `notClassifiable=292`, `promotionFindings=20`;
- production identity/text audit for `master.dan`, 丹·布拉克莫尔, 五朔节骑士, 可敬的狙击手, 荣誉, and `core.dan-` is CLEAN;
- repository-wide source-assets check reproduces exactly `93` pre-existing missing `chm-extract/图包` files and no Dan path; `git diff --check` PASS;
- detailed result: `docs/reports/2026-10-07-p3-b-dan-owner-readiness-complete-gap-set.md`;
- first fresh review of Candidate `59a0d7ec512f06b7882acf47a0a20840c5988180` returned `IMPLEMENTATION_NEEDS_REVISION`; canonical relayed evidence is `https://github.com/binchen648/fd/pull/538#issuecomment-6024573458`;
- bundled revision closes both findings at the authoritative `round_end`: stale `roundLocationTerrainReplacements` and stale armed-but-unconsumed `movementCompetitionSuppressions` are retired before the next round; regressions prove restore validity across two terrain transitions and an unconsumed Honor transition;
- readiness remains permanently zero-credit; successor Candidate requires fresh exact implementation review before A-sync/rescan.
- successor Candidate `348fa5b1d04b9cfba65ebd0ebee2f198cc0f471e` received fresh `IMPLEMENTATION_ACCEPTED_CANDIDATE` on blocked retry `pr538:348fa5b1d04b9cfba65ebd0ebee2f198cc0f471e:blocked-retry-1`;
- canonical accepted evidence: `https://github.com/binchen648/fd/pull/538#issuecomment-6025287030`;
- zero-credit readiness A-sync/rescan: `docs/reports/2026-10-07-p3-a-dan-owner-readiness-acceptance-synchronization.md`;
- accounting remains `247/944`, remaining `697`; canonical Dan remains `0/3`;
- complete-owner rescan found no remaining Dan-local runtime gap; release `P3-S-OWNER-DAN-COMPLETE-MIGRATION`.

## TASK P3-S-OWNER-DAN-COMPLETE-MIGRATION

Owner: FORMAL migration
Status: `SYNCHRONIZED`
Classification: owner-complete migration for `master.dan`

Frozen owner scope: exactly `3` identities — `master.dan.skill.s1`, `master.dan.skill.s1a`, `master.dan.skill.ascension`.

Accounting boundary:
- exact migration Base is the Dan readiness acceptance synchronization commit produced from accepted Candidate `348fa5b1d04b9cfba65ebd0ebee2f198cc0f471e`;
- strict accounting before this migration remains `247/944`, remaining `697`;
- canonical Dan authoring is `0/3`;
- maximum lawful increment is exactly `+3`, only after a fresh exact `MIGRATION_ACCEPTED` verdict and formal A-sync/accounting;
- readiness evidence grants no migration credit and must be preserved, not recounted.

Required implementation:
- materialize one canonical `data/authoring/masters/master.dan.json` archive containing all three frozen identities and exact locked-Reference metadata/printed behavior;
- register the archive once in the canonical playtest master sequence after Ciel according to stable owner order;
- consumer authoring must route only through accepted identity-free readiness seams and existing generic basic-card/round lifecycle primitives;
- preserve Dan initial mana `4`, names/text/types, ascension outside-game lifecycle, and exact `3 x basic.preparation + 2 x basic.surveil` attached-supply contract;
- add one owner-complete regression covering exact 3/3 materialization, metadata, pack registration, gateway routing and representative runtime behavior;
- run focused/affected tests, typecheck, content validation, generated determinism, Phase-3 coverage/audit, production identity/text audit, source-assets classification, and `git diff --check`;
- freeze exactly one Candidate / one PR and request one fresh independent exact migration review;
- no accounting increment before fresh `MIGRATION_ACCEPTED`.

Implementation evidence:
- Exact Base: `56ccbbe9adda915a0a2a2d31a8595dee30f15d82`; strict accounting remains `247/944`, remaining `697` pending review;
- canonical `data/authoring/masters/master.dan.json` now materializes exactly all three frozen identities, with Dan initial mana `4`, locked names/types/printed text, and ascension `outside_game`;
- pack registration is exactly once and immediately after `master.ciel` in stable owner order;
- all consumer abilities are accepted by the identity-free `round-location-supply` readiness gateway; no Dan identity/name branch exists in production runtime;
- Dan owner-complete regression `6/6 PASS`; combined migration/readiness + shared terrain/scoring + authoring interpreter + MatchSession `95/95 PASS` across 6 files;
- typecheck PASS; content validation PASS at `20 masters / 19 servants / 20 events / 0 blocking issues`;
- generated determinism PASS: content `9420505094583be3e088947ec62a2aa158bc0a06e0839f4401ff8005c88bdf12`, fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`, evidence `7e0a0758d26d733e7c99db979daa81afe8c7fe16a707b7a633a4af6f0af5e395`;
- Phase-3 coverage: `archives=125`, `cards=278`, `abilities=482`, `compiledCards=209`, `compiledCharacters=39`, `blockingIssues=0`, `newRuntimeSemanticRouted=22`, `dualRuntime=0`;
- automation audit: `legacyResolveEffect=160`, `legacyExecuteAbility=3`, `notClassifiable=297`, `promotionFindings=20`;
- production identity/text audit CLEAN; development Dan image exists;
- source-assets classification reproduces exactly `93` pre-existing missing `chm-extract/图包` assets and `danHits=0`; `git diff --check` PASS;
- detailed result: `docs/reports/2026-10-07-p3-s-owner-dan-complete-migration-result.md`;
- Candidate remains uncredited until one fresh exact `MIGRATION_ACCEPTED` review and subsequent FORMAL A-sync/accounting.
- exact Candidate `fab3e0b367491225492e9edae707ec50f8a35b4b` received fresh `MIGRATION_ACCEPTED` on ReviewJobKey `pr539:fab3e0b367491225492e9edae707ec50f8a35b4b`;
- canonical accepted evidence: `https://github.com/binchen648/fd/pull/539#issuecomment-6025571234`;
- fresh Reviewer independently reran the six-file focused/affected set at `100/100 PASS`; the Candidate's `95/95` prose count was explicitly classified as stale understatement, not a blocker;
- lawful FORMAL accounting credits exactly the frozen Dan `3/3`: `247/944 + 3 = 250/944`, remaining `694`;
- acceptance synchronization report: `docs/reports/2026-10-07-p3-a-owner-dan-acceptance-synchronization.md`;
- stable first-occurrence owner order places `master.darnic` next, with exactly `3` frozen identities and no canonical `master.darnic.json`; next-owner readiness selection requires helper-report read + exact-Base rescan before any Darnic implementation.

## TASK P3-B-DARNIC-OWNER-READINESS-CAPABILITY

Owner: FORMAL readiness
Status: `SYNCHRONIZED`
Classification: zero-credit complete-owner readiness/preflight for `master.darnic`

Frozen owner scope: exactly `3` identities — `master.darnic.skill.ascension`, `master.darnic.skill.s1`, `master.darnic.skill.s1a`.

Accounting boundary:
- exact readiness Base is Dan owner migration acceptance-sync `765e88d8390ef6671faa4f9511b10853df8fd99e`;
- strict accounting after Dan acceptance is `250/944`, remaining `694`;
- canonical `data/authoring/masters/master.darnic.json` is absent (`0/3`);
- readiness/capability is permanently zero-credit.

Mechanical owner-local gap set:
- `s1` / 领地: locked Reference `core.unoccupied-terrain-advantage` grants the controller all currently unoccupied printed terrain slots at battlefields; current production runtime has no identity-free unoccupied-terrain ownership seam;
- ascension / 老相识 / 焦土作战: locked Reference requires an opponent sharing the controller's battlefield to pay `2 VP` at the start of that opponent's action turn to retain assigned terrain, otherwise that opponent loses the terrain assignment; current runtime has no identity-free action-turn terrain-upkeep seam;
- ascension / 空中支援: existing accepted `double_controller_terrain_this_round` effect family is reused; readiness also closes its missing zero-cost owned-Master-skill skill-zone activation surface without adding any owner-specific route;
- `s1a` / 噬魂者: current generic response/resource primitives appear sufficient for optional post-win `set_mana=4` and round-end mana<=2 `-2 VP`; readiness must mechanically prove the exact authoring shape, response behavior, and round-end behavior before consumer migration.

Formal gate:
- close the complete Darnic owner-local readiness gap set in one bounded zero-credit Candidate;
- runtime additions must be identity-free, restore-safe, and preserve terrain slot authority when terrain is revoked;
- no `data/authoring/masters/master.darnic.json` may be created in readiness;
- run Darnic focused regressions, affected terrain/MatchSession/authoring regressions, typecheck, content validation, generated determinism, Phase-3 coverage/audit, production identity/text audit, source-assets classification, and `git diff --check`;
- one fresh independent exact Base/Candidate implementation review is required before zero-credit A-sync/rescan may release Darnic owner-complete migration.

Implementation evidence:
- Exact Base: `765e88d8390ef6671faa4f9511b10853df8fd99e`; strict accounting remains `250/944`, remaining `694`;
- complete identity-free readiness added for current-location unclaimed printed battlefield terrain and same-battlefield opponent action-turn terrain upkeep at exact `2 VP`;
- terrain revocation preserves retained explicit terrain slots; settlement is player/round idempotent and the marker survives structured-clone/restore-style persistence;
- the existing generic `double_controller_terrain_this_round` effect is reused, with zero-cost source-owned Master skill activation now accepted from the skill zone as required by 老相识 / 空中支援;
- 噬魂者 requires no new effect family: existing optional response, `set_mana`, negated mana-threshold, and VP-adjustment primitives are mechanically proven;
- Darnic readiness regression `8/8 PASS`; final affected run `134/134 PASS` across 9 files with explicit `--testTimeout=20000`;
- typecheck PASS; content validation PASS at `20 masters / 19 servants / 20 events / 0 blocking issues`; generated determinism PASS with unchanged consumer hashes;
- Phase-3 coverage remains `archives=125`, `cards=278`, `abilities=482`, `compiledCards=209`, `compiledCharacters=39`, `blockingIssues=0`, `newRuntimeSemanticRouted=22`, `dualRuntime=0`;
- automation audit remains `legacyResolveEffect=160`, `legacyExecuteAbility=3`, `notClassifiable=297`, `promotionFindings=20`;
- `data/authoring/**` delta EMPTY; production Darnic identity/text audit CLEAN; development Darnic image PRESENT;
- source-assets classification reproduces exactly `93` historical missing `chm-extract/图包` assets and `darnicHits=0`; `git diff --check` PASS;
- detailed result: `docs/reports/2026-10-07-p3-b-darnic-owner-readiness-complete-gap-set.md`;
- readiness remains permanently zero-credit and requires one fresh exact `IMPLEMENTATION_ACCEPTED_CANDIDATE` before A-sync/rescan.

Acceptance synchronization:
- exact Candidate `1b006a2ecd1142ad9503ae3546fb9d475b5e7c9e` received fresh `IMPLEMENTATION_ACCEPTED_CANDIDATE` on ReviewJobKey `pr540:1b006a2ecd1142ad9503ae3546fb9d475b5e7c9e`;
- canonical evidence: `https://github.com/binchen648/fd/pull/540#issuecomment-6026259334`;
- readiness remains zero-credit: accounting stays `250/944`, remaining `694`;
- exact-Base rescan confirms no undiscovered Darnic owner-local runtime gap remains and canonical Darnic authoring is still `0/3`;
- acceptance synchronization report: `docs/reports/2026-10-07-p3-a-darnic-owner-readiness-acceptance-synchronization.md`;
- next legal FORMAL transaction is `P3-S-OWNER-DARNIC-COMPLETE-MIGRATION` for exactly the three frozen identities, with no credit until fresh `MIGRATION_ACCEPTED`.

## TASK P3-S-OWNER-DARNIC-COMPLETE-MIGRATION

Owner: FORMAL migration
Status: `SYNCHRONIZED`
Classification: owner-complete migration for `master.darnic`

Frozen owner scope: exactly `3` identities — `master.darnic.skill.ascension`, `master.darnic.skill.s1`, `master.darnic.skill.s1a`.

Release Base:
- Darnic readiness acceptance-sync branch: `codex/a-p3-darnic-owner-readiness-acceptance-sync`;
- readiness Candidate `1b006a2ecd1142ad9503ae3546fb9d475b5e7c9e` is accepted and zero-credit;
- strict accounting before Darnic migration remains `250/944`, remaining `694`;
- canonical Darnic authoring remains absent (`0/3`).

Formal gate:
- materialize all three frozen Darnic identities in one canonical `data/authoring/masters/master.darnic.json` consumer archive and register it exactly once in the active pack;
- preserve locked Reference initial mana, names, printed text, cost/requirement/base power, initial placement, and all accepted readiness semantics without owner-specific production runtime routing;
- run focused owner-complete behavior plus affected shared regressions, typecheck, content validation, generated determinism, Phase-3 coverage/audit, production identity/text audit, source-assets classification, and `git diff --check`;
- one fresh independent exact Base/Candidate `MIGRATION_ACCEPTED` is required before any lawful `+3` accounting.

Implementation evidence:
- Exact Base: `f6376feb3e3b615db4264fc51349ca0d4efc06ba`;
- canonical `data/authoring/masters/master.darnic.json` now materializes exactly the frozen `3/3` scope with locked Reference identity, initial mana `4`, exact printed text, and exact ascension `力量 / cost 8 / requirement 8 / power 9 / outside_game` metadata;
- consumer routes use only the accepted identity-free readiness authority from PR #540: unclaimed battlefield terrain, optional post-win `set_mana=4`, mana<=2 round-end `-2 VP`, exact `2 VP` same-battlefield terrain upkeep, and accepted current-round terrain doubling;
- pack registration is exactly once and immediately after `master.dan`;
- Darnic owner migration regression `6/6 PASS`; final affected suite `140/140 PASS` across 10 files with explicit `--testTimeout=20000`;
- adding the 21st master changed the deterministic production pairing surface, so the one-round MatchSession smoke seed was mechanically recertified from `4` to `1`; seed `1` preserves the exact original smoke contract (`match_complete`, round 1, `round_end`, dispatch log and battle breakdown);
- typecheck PASS; content validation PASS at `21 masters / 19 servants / 20 events / 0 blocking issues`;
- generated determinism PASS: content `b2fc1c24e3c9ad9d2e05dd9dfbaadfda9c4900a0992afee02c8fd8f9f3a94756`, fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`, evidence `2c238ac983a3f9f9131acf16703a4a3d54c68af241deba93164139484f512823`;
- Phase-3 coverage: `archives=126`, `cards=281`, `abilities=487`, `compiledCards=213`, `compiledCharacters=40`, `blockingIssues=0`, `newRuntimeSemanticRouted=22`, `legacyExecuteAbility=3`, `legacyResolveEffect=161`, `dualRuntime=0`, `notClassifiable=301`;
- automation audit: `legacyResolveEffect=161`, `legacyExecuteAbility=3`, `notClassifiable=301`, `promotionFindings=20`;
- production Darnic identity/text audit CLEAN; source-assets reproduces exactly `93` historical missing images with `darnicHits=0`; `git diff --check` PASS;
- detailed result: `docs/reports/2026-10-07-p3-s-owner-darnic-complete-migration-result.md`;
- Candidate remains uncredited until one fresh exact `MIGRATION_ACCEPTED` review and subsequent FORMAL A-sync/accounting.

Acceptance synchronization:
- exact Candidate `d40eb77b1480fa334688f0a5c1377ca0531c7704` received fresh `MIGRATION_ACCEPTED` on blocked retry `pr541:d40eb77b1480fa334688f0a5c1377ca0531c7704:blocked-retry-1`;
- canonical accepted evidence: `https://github.com/binchen648/fd/pull/541#issuecomment-6031672772`;
- blocked predecessor attempt was environment-only; external-output coverage/audit on the same exact Candidate closed `REVIEWER_WORKSPACE_DIRTY_AFTER_OFFICIAL_AUDIT_GENERATION` without Candidate mutation;
- lawful FORMAL accounting credits exactly the frozen Darnic `3/3`: `250/944 + 3 = 253/944`, remaining `691`;
- acceptance synchronization report: `docs/reports/2026-10-07-p3-a-owner-darnic-acceptance-synchronization.md`;
- no readiness credit is recounted; owner change requires fixed HELPER report read plus exact acceptance-sync Base rescan before selecting the next owner.

## TASK P3-B-FIORE-OWNER-READINESS-CAPABILITY

Owner: FORMAL readiness
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Classification: zero-credit complete-owner readiness/preflight for `master.fiore`

Exact readiness Base: `b7bb64a0b3079927177c7ad131f9a482d29540d8` (accepted Darnic migration A-sync/accounting).

Frozen owner scope: exactly `9` identities:
- `master.fiore.skill.ascension`
- `master.fiore.skill.s1`
- `master.fiore.skill.s1a`
- `master.fiore.skill.s2`
- `master.fiore.skill.s3`
- `master.fiore.skill.s4`
- `master.fiore.skill.s5`
- `master.fiore.skill.s6`
- `master.fiore.skill.s7`

Current canonical material / preservation boundary:
- current `data/authoring/masters/master.fiore.json` contains exactly `3/9`: `s2 + s3 + s4`;
- those three identities were already migrated and credited by accepted FM08 recovery (`P3-FM08`, Candidate `81ccb7e7e5d0f2cf5ad7da1eda3279c20a604c1a`, R40 accepted) and are preservation-only for this owner-complete replay;
- exactly six frozen identities remain uncredited: `ascension + s1 + s1a + s5 + s6 + s7`;
- the preserved `s2/s3/s4` objects must not receive duplicate credit or semantic drift.

Accounting boundary:
- strict accounting after Darnic acceptance is `253/944`, remaining `691`;
- readiness/capability is permanently zero-credit;
- maximum later lawful Fiore migration increment is exactly `+6`, only after one owner-complete Candidate preserves the accepted `3/9`, materializes all six remaining identities, receives fresh `MIGRATION_ACCEPTED`, and FORMAL A-sync/accounting completes.

Formal readiness gate:
- scan the complete nine-identity owner contract in one pass; do not stop after the first runtime gap;
- mechanically preserve accepted FM08 `s2/s3/s4` semantics and authoring while deriving all generic readiness seams required by the six remaining identities from frozen inventory + locked Reference;
- any new runtime primitive must be identity-free, data-driven, restore-safe, fail closed, and covered by focused negative paths;
- readiness must not materialize the six missing Fiore consumers or award migration credit;
- run focused/affected tests, typecheck, content validation, generated determinism, Phase-3 coverage/audit using external `--out` paths where supported, production identity/text audit, source-assets classification, and `git diff --check`;
- freeze exactly one readiness Candidate / one PR and require one fresh independent exact `IMPLEMENTATION_ACCEPTED_CANDIDATE` before zero-credit A-sync/rescan may release Fiore owner-complete migration.

Implementation evidence:
- implementation start commit after exact accepted Darnic A-sync: `e46a6e05c42e1b13ebf4381ab710c5ad1522ae13`;
- existing accepted FM08 `master.fiore.json` is byte-preserved at blob `79ce0ef8c7403c849c64abe4fc41e812dc4fa6d9`; `data/authoring/**` delta is EMPTY;
- complete identity-free round-profile readiness covers all six uncredited Fiore identities while preserving accepted `s2/s3/s4`: Transcend pair switching/suppression, action `-4 mana`, Neuromechanics move/+2 terrain, Determination higher-VP target/+2 VP, Clever Mind cumulative skill +1, and Full Recovery loss-only `-2 VP`;
- Full Recovery loss authority survives a prior win/non-loss, remains restore-valid, charges exactly once on later loss, and does not double-charge on replay;
- Fiore readiness regression `10/10 PASS`, including closed-world `__fd_rsp:` restore tamper rejection; shared terrain metric `7/7 PASS`; game-start provisioning `7/7 PASS`; authoring interpreter `38/38 PASS`; MatchSession `34/34 PASS`;
- selected affected batch is `105/107`; both remaining failures reproduce identically on a plain archive of exact task-start commit `e46a6e05c42e1b13ebf4381ab710c5ad1522ae13` and are recorded as pre-existing shared-test debt, not Candidate green;
- typecheck PASS; content validation PASS at `21 masters / 19 servants / 20 events / 0 blocking issues`; generated determinism PASS with unchanged consumer hashes;
- Phase-3 coverage/audit were written outside all Git workspaces using explicit `--out`: coverage `archives=126 cards=281 abilities=487 compiledCards=213 compiledCharacters=40 blockingIssues=0 newRuntimeSemanticRouted=22 dualRuntime=0`; audit `legacyResolveEffect=161 legacyExecuteAbility=3 notClassifiable=301 promotionFindings=20`;
- production Fiore identity/text audit CLEAN; development Fiore image PRESENT; source-assets reproduces exactly `93` historical missing images with `fioreHits=0`; `git diff --check` PASS;
- detailed result: `docs/reports/2026-10-07-p3-b-fiore-owner-readiness-complete-gap-set.md`;
- prior Candidate `d1809a4eade396242e267e74a9eff1dd1a0bb4a6` received `IMPLEMENTATION_NEEDS_REVISION`; canonical same-attempt relay: `https://github.com/binchen648/fd/pull/544#issuecomment-6032667992`;
- the sole blocking finding is closed by a fail-closed/closed-world `__fd_rsp:` restore contract: every prefixed flag/round marker is paired and current-round, profile-owned fields are anchored to exact accepted switch/provider/enhanced-definition provenance, terrain/skill-power authority records and validates exact source-card/ability provenance, and unknown/orphaned authority is rejected;
- revision verification: Fiore focused regression `10/10 PASS`, typecheck PASS, `git diff --check` PASS;
- successor Candidate `c56c25f2d607397ddf1cfbce7ac193752f4e3737` then received `IMPLEMENTATION_NEEDS_REVISION` for value tampering inside an otherwise valid provenance envelope; canonical same-attempt relay: `https://github.com/binchen648/fd/pull/544#issuecomment-6032994485`;
- second revision removes live `__fd_rsp:` gameplay authority and replaces it with dedicated restore-validated profile / paid skill-power activation / terrain activation records plus exact event receipts and round-scoped usage-count cross-checks; forged target, target snapshot, skill-power ordinal/count, terrain location, legacy prefixed flags, and unmatched receipts fail closed;
- second-revision verification: Fiore `10/10 PASS`; MatchSession `34/34 PASS`; terrain metric `7/7 PASS`; outside-game/game-start `12/12 PASS`; authoring interpreter `38/38 PASS`; typecheck/content validate/generated determinism/`git diff --check` PASS;
- Candidate `b9cd0eeffb26f7f0993e4d1ff933552a1177bbed` received `IMPLEMENTATION_NEEDS_REVISION` for widening Clever Mind beyond the locked Reference's once-per-round contract; canonical evidence: `https://github.com/binchen648/fd/pull/544#issuecomment-6038848506`;
- third revision mechanically matches the locked Reference by requiring the standard `per_round / uses=1 / this_card` declarative limit, independently guarding duplicate same-round skill-power activation, rejecting multiple same-round activation records on restore, and replacing the positive second-activation regression with a negative no-second-action/no-extra-mana/no-extra-receipt/no-extra-usage regression;
- third-revision verification: combined affected focused set `108/108 PASS`; Fiore `10/10`; terrain `7/7`; game-start `7/7`; outside-game `12/12`; authoring `38/38`; MatchSession `34/34`; typecheck/content validate/generated determinism/`git diff --check` PASS; `data/authoring/**` delta EMPTY;
- readiness remains permanently zero-credit; strict accounting stays `253/944`, remaining `691`, and future maximum Fiore increment remains `+6` only after fresh accepted owner-complete migration plus A-sync/accounting.

### Fiore readiness acceptance synchronization

- Accepted exact Candidate: `e4b2759776dc4e33dbcb27dbf5155b615c0ae7ee`.
- Fresh independent verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`.
- Canonical same-attempt bounded relay: `https://github.com/binchen648/fd/pull/544#issuecomment-6040241078`.
- Reviewer exact-Candidate affected suite: required `108/108 PASS`; supplemental FM08 authoring `5/5 PASS`; combined `113/113 PASS`; typecheck/content/generated/diff and external-output Phase-3 coverage/audit PASS.
- Canonical authoring rescan remains exactly `3/9`: preserved/previously credited `s2+s3+s4`; `ascension+s1+s1a+s5+s6+s7` remain absent and are the only newly creditable Fiore identities.
- `master.fiore.json` remains blob `79ce0ef8c7403c849c64abe4fc41e812dc4fa6d9`; Base..accepted Candidate `data/authoring/**` delta is EMPTY.
- No additional currently discoverable Fiore owner-local readiness gap remains.
- Readiness acceptance is exactly `+0`; strict accounting remains `253/944`, remaining `691`.
- `P3-S-OWNER-FIORE-COMPLETE-MIGRATION` is released to `READY`; maximum lawful later increment is `+6` only after fresh `MIGRATION_ACCEPTED` plus FORMAL A-sync/accounting.
- Acceptance synchronization report: `docs/reports/2026-10-07-p3-a-fiore-owner-readiness-acceptance-synchronization.md`.

## TASK P3-S-OWNER-FIORE-COMPLETE-MIGRATION

Owner: FORMAL
Status: `SYNCHRONIZED`
Classification: formal owner-complete migration for current owner `master.fiore`

Exact Base: `98f4bbef8ebd859df358f04b8d5d7d1841909aba` (Fiore readiness acceptance synchronization).

Frozen owner scope remains exactly all nine Fiore identities. Preservation boundary:
- preserve accepted FM08 `s2+s3+s4` byte/semantic identity and award them no duplicate credit;
- materialize together exactly the six missing identities `ascension+s1+s1a+s5+s6+s7`;
- one owner / all remaining frozen identities / one formal Candidate / one PR / one fresh independent migration review.

Formal implementation must consume only accepted identity-free readiness authority from PR #544 and locked Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9`; do not reintroduce name/ID routing, legacy handlers, duplicate persistent rules, or divergent ancestry.

Accounting boundary:
- strict accounting starts `253/944`, remaining `691`;
- no credit before fresh exact `MIGRATION_ACCEPTED` plus FORMAL A-sync/accounting;
- if accepted, credit exactly six identities: `253/944 -> 259/944`, remaining `685`.

Implementation evidence:
- canonical `master.fiore.json` now materializes exact `9/9`; newly materialized identities are exactly `ascension+s1+s1a+s5+s6+s7`;
- accepted FM08 `s2+s3+s4` remain preservation-only and their JSON-object SHA-256 values remain exact;
- consumer routes use only accepted identity-free readiness authority from PR #544; no Fiore/name-specific production runtime route was introduced;
- Fiore is registered exactly once in the canonical pack; canonical compilation is `22 masters / 19 servants / 20 events / 0 blocking issues`;
- generated library contains `master.fiore` plus all nine frozen skill identities;
- Fiore owner migration regression `5/5 PASS`; Fiore readiness `10/10 PASS`; final affected suite `118/118 PASS` across 8 files;
- adding the 22nd canonical Master changed one deterministic MatchSession Luck fixture; bounded rescan recertified only that test seed from `2 -> 1`, preserving the exact original battle contract without runtime logic change;
- typecheck/content compile/content validate/generated determinism PASS;
- generated hashes: content `a91b4903929ac9c06febcaed8b4998217b29f7b2ad58b74a6e6f1e6e0d410fc4`, fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`, evidence `0c176fcbcdbf5f46207adda92670459939891afd530416524973f64e5e8af5a0`;
- external-output Phase-3 coverage: `archives=126`, `cards=287`, `abilities=503`, `compiledCards=223`, `compiledCharacters=41`, `blockingIssues=0`, `newRuntimeSemanticRouted=22`, `legacyExecuteAbility=3`, `legacyResolveEffect=164`, `dualRuntime=0`, `notClassifiable=314`;
- external-output automation audit: `legacyResolveEffect=164`, `legacyExecuteAbility=3`, `notClassifiable=314`, `promotionFindings=20`;
- source-assets reproduces exactly `93` historical missing images with no Fiore source in the missing list; `git diff --check` PASS;
- detailed result: `docs/reports/2026-10-07-p3-s-owner-fiore-complete-migration-result.md`;
- Candidate remains uncredited until one fresh exact `MIGRATION_ACCEPTED` review and subsequent FORMAL A-sync/accounting.

Acceptance synchronization:
- exact Candidate `d49cd45d377319976f525823f6df330bd69f6ac4` received fresh `MIGRATION_ACCEPTED` on ReviewJobKey `pr546:d49cd45d377319976f525823f6df330bd69f6ac4`;
- canonical same-attempt accepted evidence: `https://github.com/binchen648/fd/pull/546#issuecomment-6041250189`;
- FORMAL exact-Candidate rescan confirms canonical Fiore authoring is exactly `9/9`, pack registration is exactly once, and the only newly materialized identities are `ascension+s1+s1a+s5+s6+s7`;
- preserved FM08 `s2+s3+s4` objects remain exact and receive no duplicate credit;
- lawful FORMAL accounting credits exactly six newly materialized identities: `253/944 + 6 = 259/944`, remaining `685`;
- acceptance synchronization report: `docs/reports/2026-10-07-p3-a-owner-fiore-acceptance-synchronization.md`;
- owner change requires fixed HELPER report read plus exact acceptance-sync Base rescan before selecting the next owner.

## TASK P3-B-FOU-OWNER-READINESS-CAPABILITY

Owner: FORMAL readiness
Status: `SYNCHRONIZED`
Classification: zero-credit complete-owner readiness/preflight for `master.fou`

Exact readiness Base: `17eebe767897e73c17eb3749c8986797d06b2097` (accepted Fiore owner-migration A-sync/accounting).

Frozen owner scope: exactly `2` identities:
- `master.fou.skill.s1` — 兽之印记
- `master.fou.skill.ascension` — 苍天之力

Current canonical Fou materialization is `0/2`; readiness must not create `data/authoring/masters/master.fou.json`, must not register Fou in the active pack, and grants zero migration credit.

Readiness must close the complete owner-local capability gap set from Helper Epoch 6 while remaining identity-free:
- real Command-Seal expenditure provenance plus exact physical skill-return provenance;
- permanent physical skill `+1 Power / -1 effective mana cost` marks with half-printed-cost floor, stacking, game duration, and restore validation;
- bounded imminent-elimination rescue choice, once-per-game physical source consumption, exact opponent-target post-settlement VP swap, and persistent shared-victory link;
- minimal integration into authoritative elimination/final-victory paths only, with stale/forged/duplicate state failing closed;
- production runtime must remain free of `master.fou`, 芙芙, 兽之印记, 苍天之力, and `core.fou-` routing.

Formal gate:
- preserve the existing dirty readiness implementation already present on `codex/b-p3-fou-owner-readiness-complete-gap-set`; do not reset/discard/recreate it;
- complete one bounded zero-credit readiness Candidate and PR from exact Base `17eebe767897e73c17eb3749c8986797d06b2097`;
- require one fresh independent exact Base/Candidate `IMPLEMENTATION_ACCEPTED_CANDIDATE` before readiness A-sync/rescan and before any Fou consumer migration;
- strict accounting remains `259/944`, remaining `685`.

Implementation evidence:
- Helper Epoch 6 complete-owner preflight was mechanically revalidated against exact Base `17eebe767897e73c17eb3749c8986797d06b2097`.
- Fou consumer materialization remains exactly `0/2`: no `master.fou.json` and canonical pack registration count `0`.
- G1 closes authoritative real Command-Seal spend provenance and current-round physical skill return provenance across existing generic resource/card-return paths.
- G2 adds an identity-free restore-safe permanent physical skill tuning contract: stackable `+1 Power / -1 effective cost`, game duration, exact physical source/target provenance, and `ceil(printed*0.5)` floor.
- G3/G4/G5 add identity-free rounds `8/9/10` imminent-elimination rescue, exact post-scoring opponent VP swap, self-rescue no-swap behavior, persistent shared-victory links, final-ranking expansion, and fail-closed restore validation.
- Exact completed battle results are frozen across a pending rescue decision; runtimes with no available rescue provider use a no-preview fast path.
- Production Fou identity/text audit remains free of `master.fou`, 芙芙, 兽之印记, 苍天之力 and `core.fou-` routing.
- Affected validation passes `121/121` across 7 files: Fou `6/6`, scoring `6/6`, fixed Command-Seal `4/4`, Ruler Seal `13/13`, Spartacus seal power `20/20`, authoring interpreter `38/38`, MatchSession `34/34` under declared/default timeouts.
- typecheck/content validate/generated determinism/`git diff --check` PASS; canonical content remains `22 masters / 19 servants / 20 events / 0 blocking issues`.
- External-output Phase-3 coverage remains `archives=126 cards=287 abilities=503 compiledCards=223 compiledCharacters=41 blockingIssues=0 newRuntimeSemanticRouted=22 dualRuntime=0 notClassifiable=314`.
- External-output automation audit remains `legacyResolveEffect=164 legacyExecuteAbility=3 notClassifiable=314 promotionFindings=20`.
- Repository-wide source-assets command was blocked by the tool safety layer before execution; no source-assets green result is claimed, and this readiness has no authoring/generated/source-path delta.
- Detailed result: `docs/reports/2026-10-08-p3-b-fou-owner-readiness-complete-gap-set.md`.
- Readiness remains exactly zero-credit; strict accounting stays `259/944`, remaining `685`, pending one fresh exact `IMPLEMENTATION_ACCEPTED_CANDIDATE`.

Reviewer revision:
- first Candidate `14878d98c0e86f5c58a79b96498bfaa1488ffc15` -> `IMPLEMENTATION_NEEDS_REVISION`;
- canonical same-attempt evidence: `https://github.com/binchen648/fd/pull/547#issuecomment-6043161307`;
- blocker 1 closed by exact authoritative elimination-projection recomputation plus a pending-decision projection fingerprint; no-longer-threatened and changed-ledger/same-threat restore/commit attempts both fail closed;
- blocker 2 closed without changing the existing 5000 ms test timeout: the three-round MatchSession smoke passed three consecutive isolated default-timeout runs at about `4.83-4.85 s`, then the full MatchSession file passed `34/34` with the smoke at `4.411 s`;
- performance closure is identity-free: pack-level capability-presence caches/gates plus no-provider/no-record fast paths eliminate Fou-readiness overhead from the current production pack while preserving the fixture/provider path;
- blocker 3 metadata closure is `dependsOnPrs: [546]`, matching the actual previous-owner migration dependency;
- successor affected validation is `121/121 PASS`; typecheck/content/generated/external coverage+audit/`git diff --check` all PASS; no authoring/pack/generated consumer delta;
- readiness remains zero-credit; accounting remains `259/944`, remaining `685`; freeze exactly one successor Candidate then fresh R.

Second Reviewer revision:
- second Candidate `f4acbc8dc83f78d12da11b4efbbeeda9475146d0` -> `IMPLEMENTATION_NEEDS_REVISION`; ReviewJobKey `pr547:f4acbc8dc83f78d12da11b4efbbeeda9475146d0`;
- canonical same-attempt evidence: `https://github.com/binchen648/fd/pull/547#issuecomment-6044206943`;
- Reviewer independently confirmed stale-rescue blocker CLOSED and governance blocker CLOSED; only cold/default-timeout MatchSession instability remained, with one isolated cold smoke at `5321 ms`;
- successor profiling found replay checkpoint hashing/serialization as the dominant path: the 3-round auto-run previously produced `50` complete snapshots for `215` logs and `3` battles;
- Node uses native synchronous SHA-256/HMAC via guarded `process.getBuiltinModule('node:crypto')`; browser/non-Node keeps the original pure-JS fallback. SHA tests `7/7 PASS`, and forced fallback standard vectors match exactly;
- `runFullMatch` auto-run replay capture is compacted to complete game/round boundaries plus forced early-pause checkpoints; normal interactive dispatch checkpoint behavior is unchanged. The exact 3-round seed now keeps `215` logs / `3` battles with `8` complete replay snapshots instead of `50`;
- final exact isolated smoke is about `2.769 s`; full `match-session.test.ts` passed `34/34` three consecutive times with the target smoke about `2.666 / 2.307 / 2.452 s`, unchanged default `5000 ms` timeout;
- `match-session-regressions.test.ts` `11/11 PASS`; focused complex-skills 3-round MatchSession regression PASS; replay restore PASS;
- affected validation remains `121/121 PASS`; portable SHA additionally `7/7 PASS`; typecheck/content/generated/external coverage+audit/`git diff --check` PASS; no authoring/pack/generated consumer delta;
- readiness remains zero-credit; accounting stays `259/944`, remaining `685`; freeze one successor Candidate then fresh R.

Acceptance synchronization:
- exact Candidate `76489aaed00dcd76d092bf18098511e3c7ff0fc1` received fresh `IMPLEMENTATION_ACCEPTED_CANDIDATE` on ReviewJobKey `pr547:76489aaed00dcd76d092bf18098511e3c7ff0fc1`;
- canonical same-attempt accepted evidence: `https://github.com/binchen648/fd/pull/547#issuecomment-6044972979`;
- FORMAL acceptance rescan confirms Fou consumer materialization remains exactly `0/2`: `master.fou.json` absent and canonical pack registration count `0`;
- readiness remains permanently zero-credit; strict accounting stays `259/944`, remaining `685`;
- all two frozen Fou identities remain absent and the maximum later lawful owner-migration increment is exactly `+2`;
- acceptance synchronization report: `docs/reports/2026-10-08-p3-a-fou-owner-readiness-acceptance-synchronization.md`;
- no additional Fou readiness task remains; release `P3-S-OWNER-FOU-COMPLETE-MIGRATION` to `READY`.

## TASK P3-S-OWNER-FOU-COMPLETE-MIGRATION

Owner: FORMAL
Status: `SYNCHRONIZED`
Classification: formal owner-complete consumer migration for `master.fou`

Frozen owner scope: exactly `2` identities:
- `master.fou.skill.s1` — 兽之印记
- `master.fou.skill.ascension` — 苍天之力

Formal gate:
- implementation Base is the exact readiness acceptance-sync HEAD, mechanically pinned before any consumer edit;
- materialize both frozen identities together in one canonical `master.fou.json`;
- register `master.fou` exactly once in the active pack;
- consume only accepted identity-free readiness authority; no `master.fou` / 芙芙 / 兽之印记 / 苍天之力 / `core.fou-` production runtime routing;
- one formal Candidate, one PR, one fresh independent exact Base/Candidate migration review;
- strict accounting starts `259/944`, remaining `685`; no credit before fresh `MIGRATION_ACCEPTED` plus FORMAL A-sync/accounting;
- if accepted, credit exactly both newly materialized identities: `259/944 -> 261/944`, remaining `683`.

Implementation evidence:
- exact formal Base is `058dc4dfc436b8f222da073ff2d8bd9db91481c3` (accepted Fou readiness A-sync);
- canonical `master.fou.json` materializes exact `2/2` and active pack registration count is exactly `1`;
- generated content contains `master.fou`, `master.fou.skill.s1`, and `master.fou.skill.ascension`;
- canonical content validates at `23 masters / 19 servants / 20 events / 0 blocking issues`;
- `s1` is proven through real `round_end -> interpreter -> pending target -> choose_target -> permanent tuning` execution; consumer materialization exposed and closed the generic accepted-capability continuation gap;
- `ascension` remains `outside_game` and consumes the generic master-ascension unlock authority; focused unlock regression `5/5 PASS`;
- materializing the 23rd Master exposed a generic `runFullMatch` human-response auto-run gap, closed without Fou/name routing;
- deterministic fixture recertification changes only two shared seeds after the canonical Master roster expanded: terrain/restore `20207105 -> 1`; generic Command-Spell `20260906 -> 2`; `match-session-regressions.test.ts` is `11/11 PASS`;
- Fou owner `4/4`, Fou readiness `6/6`, shared affected + SHA plus MatchSession total `132/132 PASS`; focused complex three-round MatchSession regression PASS;
- typecheck/content/generated determinism/`git diff --check` PASS;
- generated hashes: content `fdd2cc458e12a3dd3346c8253362a081a18b67652d19cd1f3c78a60b6aa09be6`, fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`, evidence `75cc147b8816004e26640cae5234b38282dd5a5eff011035cab7ff821b11cd2b`;
- external coverage: `archives=127 cards=289 abilities=505 compiledCards=226 compiledCharacters=42 blockingIssues=0 newRuntimeSemanticRouted=22 dualRuntime=0 notClassifiable=316 taxonomyWarnings=328`;
- external audit: `legacyResolveEffect=164 legacyExecuteAbility=3 notClassifiable=316 promotionFindings=20`;
- source-assets reproduces exactly `93` pre-existing historical missing-image blockers; no Fou source path is missing and the declared development image exists;
- detailed result: `docs/reports/2026-10-08-p3-s-owner-fou-complete-migration-result.md`;
- Candidate `10a646189047466f794b74d75234f7621bbaa7f0` received fresh exact `MIGRATION_ACCEPTED` on ReviewJobKey `pr548:10a646189047466f794b74d75234f7621bbaa7f0`.

Acceptance synchronization:
- canonical same-attempt accepted evidence: `https://github.com/binchen648/fd/pull/548#issuecomment-6046496976`;
- FORMAL read back the published comment and mechanically reconfirmed PR #548 Base `058dc4dfc436b8f222da073ff2d8bd9db91481c3` / Candidate `10a646189047466f794b74d75234f7621bbaa7f0`;
- exact Base has no canonical `master.fou.json` consumer materialization; exact Candidate contains precisely `master.fou.skill.s1` + `master.fou.skill.ascension`, registers `master.fou.json` exactly once, and generated content contains both accepted identities;
- no preservation/recount credit applies for Fou because Base consumer materialization was exactly `0/2`;
- lawful FORMAL accounting credits exactly two newly materialized identities: `259/944 + 2 = 261/944`, remaining `683`;
- acceptance synchronization report: `docs/reports/2026-10-08-p3-a-owner-fou-acceptance-synchronization.md`;
- Fou is formally closed; under `fd.owner-complete@1.1.0`, FORMAL now derives the next owner and its complete readiness/capability gap set mechanically from this acceptance-sync Base and the frozen roster, with no Helper dependency.

## TASK P3-B-FUJINO-OWNER-READINESS-CAPABILITY

Owner: FORMAL
Status: `SYNCHRONIZED`
Classification: zero-credit complete-owner readiness/capability closure for `master.fujino`

Frozen owner scope: exactly `6` identities:
- `master.fujino.skill.ascension` — 痛觉残留
- `master.fujino.skill.s1` — 浅神之嗣
- `master.fujino.skill.s1a` — 无痛症
- `master.fujino.skill.s2` — 扭曲空间
- `master.fujino.skill.s3` — 歪曲之魔眼
- `master.fujino.skill.s4` — 创伤

Formal boundary:
- exact Base is Fou owner migration acceptance-sync `ab166083772921c598fba53670b4a9ef04455ac6`;
- locked Reference is `b2f9fa15fba07c63530bbf4612b03b8b704755f9`;
- exact Base canonical Fujino authoring is `0/6`, with no active-pack Fujino registration;
- `s1` reuses the accepted identity-free FB2-15 game-start skill-provisioning boundary (accepted Candidate `23a666913a3050ad55d781e3f5b3a1518add4c3e`, fresh R41 accepted + A synchronization);
- the complete remaining owner-local readiness gap is one bounded identity-free Injury/Warp subsystem covering ascension + s1a + s2 + s3 + s4 semantics;
- no `data/authoring/**`, `data/packs/**`, or `data/phase3/**` consumer delta is allowed in readiness;
- readiness is permanently zero-credit; strict accounting stays `261/944`, remaining `683`;
- one Candidate, one stacked PR, one fresh independent exact Base/Candidate review are required before readiness A-sync/rescan.

Implementation evidence:
- private injury draw/choice has exact source/ability/revision/candidate provenance and fail-closed restore validation;
- generic injury consequences cover immediate/recurring discard, Basic Attack `-1 Power`, `+2/+3` terrain deployment exclusion, `1 VP` per authoritative Command-Seal decrement, and `1 mana` own-turn movement penalty;
- spinal conversion activates the linked distortion skill, clears injury deck/state into Pain, applies `-1` Master-skill cost per remaining Pain, and battle-terminal resolution clears exactly one Pain;
- generic ascension-copy authority creates at most one extra linked skill copy and the post-spinal/post-ascension zero-Pain reward is exactly `+4 VP` once;
- the warped directed topology is consumed consistently by core movement, interpreter arrow traversal, definition-side-deck adjacency/forward traversal, and multi-presence mirrored-path traversal; no split base-map route remains on those affected consumers;
- MatchSession deployment legality and terrain-slot assignment consume the same stomach-injury terrain restriction;
- production source contains no Fujino identity/name/printed-skill routing;
- focused Fujino readiness `7/7 PASS`;
- selected distinct affected runtime set `103/103 PASS`; complex-skills `38/38 PASS`; combined selected behavioral evidence `141/141 PASS`;
- typecheck PASS; content validation PASS at `23 masters / 19 servants / 20 events / 0 blocking issues`; generated determinism PASS;
- external coverage: `archives=127 cards=289 abilities=505 compiledCards=226 compiledCharacters=42 blockingIssues=0 newRuntimeSemanticRouted=22 dualRuntime=0 notClassifiable=316 taxonomyWarnings=328`;
- external audit: `legacyResolveEffect=164 legacyExecuteAbility=3 notClassifiable=316 promotionFindings=20`;
- `git diff --check` PASS;
- supplemental historical Alice owner-complete suite is `6/7` because its unchanged pack-tail assertion expects Akiha/Alice to remain the final two Masters; exact Base already ends Fiore/Fou and this Candidate has no pack/test delta, so that pre-existing stale assertion is not counted green and is not attributed to Fujino;
- detailed result: `docs/reports/2026-10-08-p3-b-fujino-owner-readiness-complete-gap-set.md`.

Review gate:
- freeze one Candidate from exact Base `ab166083772921c598fba53670b4a9ef04455ac6`;
- fresh independent exact review must return `IMPLEMENTATION_ACCEPTED_CANDIDATE`;
- only accepted evidence plus FORMAL zero-credit A-sync/full-owner rescan may release `P3-S-OWNER-FUJINO-COMPLETE-MIGRATION`;
- no migration credit before that later owner-complete migration receives `MIGRATION_ACCEPTED` plus FORMAL A-sync/accounting.

## Reviewer revision — PR #549 first Candidate

First Candidate `1beb51c5101e630c16e7bb3543930c41142829bd` received `IMPLEMENTATION_NEEDS_REVISION` on ReviewJobKey `pr549:1beb51c5101e630c16e7bb3543930c41142829bd`.

- canonical bounded same-attempt evidence relay, read back after the integration 403: `https://github.com/binchen648/fd/pull/549#issuecomment-6047557896`;
- no rerun or additional finding was introduced by the relay;
- blocker 1 closed as one generic capability correction: topology activation stays Action-only, while exact Repair accepts canonical preparation / advance / action / combat phase-window pairs, matches the live phase at execution, and is the only phase activation allowed to bypass ordinary priority and field/attack-area active-source routing; exact movementOverride/link/cardState authority remains mandatory;
- real `getLegalActions -> dispatchAbilityCommand` regression proves Repair in all four interactive phases with another player holding priority;
- blocker 2 closed by bounding durable post-spinal `painCount` to the exact six Injury keys; real maximum Pain `6` restores, forged Pain `999` fails closed;
- successor focused Fujino readiness: `8/8 PASS`;
- selected affected + Reviewer-added MatchSession regression set: `153/153 PASS` across `12` files;
- typecheck/content/generated determinism PASS; content remains `23 masters / 19 servants / 20 events / 0 blocking issues`;
- external coverage remains `archives=127 cards=289 abilities=505 compiledCards=226 compiledCharacters=42 blockingIssues=0 newRuntimeSemanticRouted=22 dualRuntime=0 pilotAllowlist=0 notClassifiable=316 taxonomyWarnings=328`;
- external audit remains `legacyResolveEffect=164 legacyExecuteAbility=3 notClassifiable=316 promotionFindings=20`;
- external successor scratch: `E:\Codex\FD\.fd-runner-review-evidence\formal-pr549-revision-from-1beb51c5101e630c16e7bb3543930c41142829bd-nonce112e95c077f815ee099968484eaeba3f`;
- no authoring/pack/phase3 consumer delta; readiness remains zero-credit at `261/944`, remaining `683`;
- form one bundled successor Candidate on the same PR and request one fresh exact Base/Candidate REVIEW. No readiness A-sync/accounting occurs before acceptance.

Acceptance synchronization:
- exact Candidate `7d764784b48cfb6bdfc175f5e7be529daa827a77` received fresh `IMPLEMENTATION_ACCEPTED_CANDIDATE` on ReviewJobKey `pr549:7d764784b48cfb6bdfc175f5e7be529daa827a77:blocked-retry-3`;
- canonical same-attempt accepted evidence: `https://github.com/binchen648/fd/pull/549#issuecomment-6048017517`;
- FORMAL acceptance rescan confirms Fujino consumer materialization remains exactly `0/6`: `master.fujino.json` absent and canonical active-pack registration count `0`;
- readiness remains permanently zero-credit; strict accounting stays `261/944`, remaining `683`;
- all six frozen Fujino identities remain absent and the maximum later lawful owner-migration increment is exactly `+6`;
- acceptance synchronization report: `docs/reports/2026-10-08-p3-a-fujino-owner-readiness-acceptance-synchronization.md`;
- no additional Fujino readiness task remains; release `P3-S-OWNER-FUJINO-COMPLETE-MIGRATION` to `READY`.

## TASK P3-S-OWNER-FUJINO-COMPLETE-MIGRATION

Owner: FORMAL
Status: `SYNCHRONIZED`
Classification: formal owner-complete consumer migration for `master.fujino`

Frozen owner scope: exactly `6` identities:
- `master.fujino.skill.ascension` — 痛觉残留
- `master.fujino.skill.s1` — 浅神之嗣
- `master.fujino.skill.s1a` — 无痛症
- `master.fujino.skill.s2` — 扭曲空间
- `master.fujino.skill.s3` — 歪曲之魔眼
- `master.fujino.skill.s4` — 创伤

Formal gate:
- implementation Base is the exact readiness acceptance-sync HEAD, mechanically pinned before any consumer edit;
- materialize all six frozen identities together in one canonical `master.fujino.json`;
- register `master.fujino` exactly once in the active pack;
- consume only accepted identity-free readiness authority plus the previously accepted generic game-start skill-provisioning authority for `s1`;
- no `master.fujino` / 浅上藤乃 / 痛觉残留 / 浅神之嗣 / 无痛症 / 扭曲空间 / 歪曲之魔眼 / 创伤 / `core.fujino-` production runtime routing;
- one formal Candidate, one PR, one fresh independent exact Base/Candidate migration review;
- strict accounting starts `261/944`, remaining `683`; no credit before fresh `MIGRATION_ACCEPTED` plus FORMAL A-sync/accounting;
- if accepted, credit exactly all six newly materialized identities: `261/944 -> 267/944`, remaining `677`.

Implementation evidence:
- exact implementation Base: `0fb1d2f41fdec4d49ee1e037db2002304ba2d351`;
- canonical `data/authoring/masters/master.fujino.json` materializes all six frozen identities together and the active pack registers `master.fujino` exactly once;
- no production runtime source is changed; consumer definitions use only accepted identity-free Injury/Warp, FB2-15 provisioning, append-only, outside-game, and ascension authority;
- owner-complete regression `4/4 PASS`; selected affected validation `127/127 PASS` across nine files;
- typecheck PASS; content validation PASS at `24 masters / 19 servants / 20 events / 0 blocking issues`;
- generated determinism PASS: content `a2fae3521b495f0e577a0cef558ef3f4c6c134156c13013e627db76f518f07e9`, fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`, evidence `a6f47f6b2ed85aa82a7322dcecefcb890db86a2b265854aff5ae379cf03cda88`;
- external coverage: `archives=128 cards=295 abilities=517 compiledCards=233 compiledCharacters=43 blockingIssues=0 newRuntimeSemanticRouted=22 legacyExecuteAbility=3 legacyResolveEffect=165 dualRuntime=0 pilotAllowlist=0 notClassifiable=327 taxonomyWarnings=338`;
- external audit: `legacyResolveEffect=165 legacyExecuteAbility=3 notClassifiable=327 promotionFindings=20`;
- declared Fujino development image exists; repository-wide source-assets still has exactly `93` historical `chm-extract/图包` missing-image blockers and is not claimed green;
- detailed result: `docs/reports/2026-10-08-p3-s-owner-fujino-complete-migration-result.md`.

Review gate:
- exact Candidate `a5bc48810d589c05285dd7341b13c9c8204bc395` received fresh exact `MIGRATION_ACCEPTED` on ReviewJobKey `pr550:a5bc48810d589c05285dd7341b13c9c8204bc395:blocked-retry-5`;
- canonical same-attempt accepted evidence: `https://github.com/binchen648/fd/pull/550#issuecomment-6048928892`;
- exact-head Phase 3 Pre-Review Gate run `37697099904` = `SUCCESS`;
- FORMAL read back the published comment and mechanically reconfirmed PR #550 Base `0fb1d2f41fdec4d49ee1e037db2002304ba2d351` / Candidate `a5bc48810d589c05285dd7341b13c9c8204bc395`;
- exact Base has no canonical `master.fujino.json`; exact Candidate contains precisely the six frozen IDs, registers `master.fujino.json` exactly once, and generated content contains all six accepted identities;
- no preservation/recount credit applies because Base consumer materialization was exactly `0/6`;
- lawful FORMAL accounting credits exactly six newly materialized identities: `261/944 + 6 = 267/944`, remaining `677`;
- acceptance synchronization report: `docs/reports/2026-10-08-p3-a-owner-fujino-acceptance-synchronization.md`;
- Fujino is formally closed; under `fd.owner-complete@1.1.0`, FORMAL now derives the next owner and its complete readiness/capability gap set mechanically from this acceptance-sync Base and the frozen roster, with no Helper dependency.

## TASK P3-B-GOETIA-OWNER-READINESS-CAPABILITY

Owner: FORMAL
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Classification: zero-credit owner-local readiness / capability closure for `master.goetia`

Exact Base:
- `d93845a5b4bb8be08a540d96759bdb754756765b` — accepted Fujino owner-migration synchronization.

Frozen owner scope: exactly `3` identities:
- `master.goetia.skill.ascension` — 冠位时间神殿
- `master.goetia.skill.s1` — 集体意识
- `master.goetia.skill.s2` — 魔神柱

Mechanical Base state:
- no canonical Goetia authoring consumer materialization;
- no Goetia active-pack registration;
- current canonical consumer materialization remains exactly `0/3`;
- strict formal accounting starts and remains `267/944`, remaining `677`;
- readiness grants exactly `+0` migration credit.

Complete owner-local readiness gap set closed in one bounded transaction:
- exact identity-free linked physical auxiliary-suite setup and authenticated state;
- seven physical linked members, zero ordinary Command Seals, round-end upkeep/removal/elimination;
- append-only/same-batch cost authority and immutable printed Power;
- Phenex remove-other-for-6-mana;
- Forneus combat close/shuffle/play/action-grant flow;
- Flauros preparation/outpost round Power;
- Zepar battle-loss reward/upkeep skip;
- Raum battle-end recon return and Action discard/move;
- Barbatos 4-mana Command-Seal substitution plus **Action-phase** round play exceptions;
- ascension activation, member +4 play Power, and preparation/outpost 1-mana redraw;
- fail-closed pending-decision, round-Power, combat-action-grant, and ascension restore provenance;
- loader/interpreter/runtime integration remains owner-name/Goetia-name independent.

Implementation findings closed before Candidate freeze:
- fixed `round_play_exceptions` from incorrect preparation binding to exact Action-phase binding while preserving Flauros/ascension preparation windows;
- fixed response-window gateway so exact `opens` is allowed for Zepar/Raum responses without broadening their exact trigger/open pairs;
- fixed loader scanner so accepted `linked_auxiliary_suite` internal `op` values are not misclassified as generic formula operators, while whole-ability gateway validation remains mandatory;
- added only the explicitly required linked-suite mechanic fields to the generic scanner allowlist.

Verification:
- Goetia readiness focused regression: `4/4 PASS`;
- selected affected regressions: `113/113 PASS` across seven files;
- typecheck PASS;
- content validation PASS: `24 masters / 19 servants / 20 events / 0 blocking issues`;
- generated determinism PASS:
  - content `a2fae3521b495f0e577a0cef558ef3f4c6c134156c13013e627db76f518f07e9`
  - fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`
  - evidence `a6f47f6b2ed85aa82a7322dcecefcb890db86a2b265854aff5ae379cf03cda88`
- `git diff --check` PASS;
- external coverage: `archives=128 cards=295 abilities=517 compiledCards=233 compiledCharacters=43 blockingIssues=0 newRuntimeSemanticRouted=22 legacyExecuteAbility=3 legacyResolveEffect=165 dualRuntime=0 pilotAllowlist=0 notClassifiable=327 taxonomyWarnings=338`;
- external audit: `legacyResolveEffect=165 legacyExecuteAbility=3 notClassifiable=327 promotionFindings=20`;
- no `data/authoring/**`, `data/packs/**`, or `data/phase3/**` delta;
- detailed report: `docs/reports/2026-10-08-p3-b-goetia-owner-readiness-complete-gap-set.md`.

Review gate:
- freeze one zero-credit Candidate from exact Base `d93845a5b4bb8be08a540d96759bdb754756765b`;
- one PR and one fresh independent exact Base/Candidate readiness review;
- no A-sync/accounting credit before accepted readiness evidence;
- accepted readiness remains `267/944`, remaining `677`, then releases `P3-S-OWNER-GOETIA-COMPLETE-MIGRATION`;
- only later fresh `MIGRATION_ACCEPTED` plus FORMAL A-sync may credit exact `+3`: `267/944 -> 270/944`, remaining `674`.

Readiness acceptance closure:
- exact Candidate `babefa422e023d8fb70a79ed8d0cf5811e140011` received fresh exact `IMPLEMENTATION_ACCEPTED_CANDIDATE` on ReviewJobKey `pr551:babefa422e023d8fb70a79ed8d0cf5811e140011:blocked-retry-2`;
- canonical same-attempt accepted evidence: `https://github.com/binchen648/fd/pull/551#issuecomment-6049735142`;
- Reviewer independently reproduced focused Goetia `4/4 PASS`, selected affected `102/102 PASS` across six files, typecheck/content/generated/coverage/audit PASS, and final exact clean HEAD;
- FORMAL mechanical rescan at accepted Candidate confirms `data/authoring/masters/master.goetia.json` absent, active-pack registration count `0`, generated occurrences for all three frozen IDs `0`, and canonical materialization exactly `0/3`;
- readiness acceptance grants exactly `+0`; strict accounting remains `267/944`, remaining `677`;
- acceptance synchronization report: `docs/reports/2026-10-08-p3-a-goetia-owner-readiness-acceptance-synchronization.md`.

## TASK P3-S-OWNER-GOETIA-COMPLETE-MIGRATION

Owner: FORMAL
Status: `READY`
Classification: formal owner-complete migration for `master.goetia`

Frozen owner scope: exactly `3` identities:
- `master.goetia.skill.ascension` — 冠位时间神殿
- `master.goetia.skill.s1` — 集体意识
- `master.goetia.skill.s2` — 魔神柱

Formal implementation rules:
- exact Base is the HEAD of the Goetia readiness acceptance-sync transaction;
- materialize all three frozen identities together in one canonical Goetia authoring consumer;
- register Goetia exactly once in the canonical active pack;
- consume only the accepted identity-free readiness authority from PR #551 and existing accepted shared runtime;
- no Goetia/name-specific production routing outside canonical authoring consumer data;
- one owner Candidate, one PR, one fresh exact Base/Candidate REVIEW;
- no migration credit before fresh `MIGRATION_ACCEPTED` evidence plus FORMAL A-sync/accounting;
- maximum lawful increment is exactly `+3`: `267/944 -> 270/944`, remaining `674`.
