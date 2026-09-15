# Phase 3 Task Index

- Version: P3-TI-1.34
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
- Accepted complete direct route is only the structural `advance/outpost + fixed pay 1 Mana + draw 2` family. At current F1 membership this yields one complete representative (`master.waver.skill.s2`) pending separate S migration; it does not create a 10–40 F4 batch.
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
- The first 10–40 F4 batch gate is therefore met at 14 exact IDs. P3-FM01 is dispatched as `READY`; Okita remains excluded.

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

Goal: accept exactly one identity-free TO15 Power sub-contract for the ten remaining Saber-family `对魔力` cards: combat-phase Magic Resistance sets same-battlefield engaged opponents' Magic-attribute attack-card current Power to zero for this round. Do not promote broad Power/Modifier runtime.

Exact accepted semantic shape only:
- `phase_action`; activation phase `combat`; opens `controller_combat_action_window`; `requiresSourceState=active`;
- no conditions, targets, costs, effects, creates, response window, limit, or visibility semantics;
- exactly one `ruleModifier`;
- modifier type `combat_power_modifier`; operation `set`; rule `attack.currentPower`; value exactly `0`;
- scope controller exactly `engaged_opponents_same_battlefield`; object exactly `attack_card`;
- exactly one scope constraint `has_attribute(attribute=魔术)`;
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
- Locked Reference metadata is uniform for all ten selected cards: `cost=3`, `basePower=3`, `typeLabel=特殊`, historical `requirement=3`. Final rule 9.4 still requires 8 mana from the skill zone.
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
Status: READY
Branch: `codex/s-p3-fm06-presence-concealment`
Base: exact P3-FB2-12 A synchronization commit
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Read: `docs/reports/2026-09-16-p3-a-fb2-12-synchronization.md` and `docs/reports/2026-09-16-p3-fb2-12-presence-concealment-handoff.md`

Goal: migrate exactly the twelve frozen Presence Concealment identities authorized by P3-R35 into minimal canonical authoring archives using only the accepted FB2-12 structural response semantic. Preserve frozen F1 text/evidence and locked Reference static metadata. Do not include Sion EX, other Assassin skills, or unrelated special handlers. Do not modify runtime.

Completion status allowed:
- `MIGRATION_COMPLETE_CANDIDATE`
- `MIGRATION_BLOCKED`

## Full-Roster Dispatch State After P3-R35 / Before P3-FM06

- FM01-FM05 remain independently migration-accepted; canonical-authoring overlap is still `79/944`, leaving `865/944` absent until FM06 itself is accepted.
- FB2-12 is independently accepted by R35 at `ee3367b1ea17e6db9d98b1ae42d769fae6122d5e`; its B2 candidate is `4c97449de07b1e7a859d8ef43b60e34069541830`.
- Exact Presence Concealment migration family is `12/12`, currently `0/12` canonical, full-text SHA `29b3f6c71d8bc5eb6f004d930e5b753f44ee766fb2e47ea6b9f0d89f5fa9643f`, Reference handler `core.presence-concealment`.
- Inventory top-level rows are `CONTRACT_MAPPED` with `blockedBy=[]`; the Phase-3 runtime route's `SPECIAL_EFFECT:presence_concealment_assassination_rule` gap is now closed only by the narrow accepted FB2-12 contract.
- The frozen F1 inventory preserves four common clause-source SHAs: `ee2d737d979d2141319a55ff72d275847a90be89e5173c3f5030e2083d4dc4cb`, `1e518f04fe63700d7a456ca83de546eb681dd9993f483be7598e5bdac7830b25`, `0484d7c0b9f4cef66623fdfe67831240d883b04f3203f2acc7e2d6151c2a8217`, `1f105508aace520b9a8b6703d50633c174f754856c10c4040b05570cfca0b871`.
- Locked Reference card metadata is common across all twelve selected skill cards: Swift type, cost `3`, historical requirement `3`, base Power `4`; owner class remains source-defined and Kiritsugu remains `Master`. Final canonical skill-zone play still uses the established 8-mana rule.
- Accepted runtime semantics are optional post-Power/pre-scoring response, active face-up source, 3+ participants, strict-second eligibility, all tied highest opponents derived from the frozen trusted snapshot, once per round on use, turn-order sequencing, Basic Luck defeat-ignore, same BattleResult/scoring pipeline, and battle-local cleanup.
- A fresh recertification at R35 lineage keeps coverage materially unchanged at `69 archives / 101 cards / 200 abilities`, raw `22/3/127/0/48/124`, compiled identity unchanged, focused `10/10`, typecheck/content/determinism green.
- P3-FM06 is therefore READY at exact batch size `12`; no canonical-overlap credit is taken until S migration, A material sync, and independent migration review complete.

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
