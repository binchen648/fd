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
- machine-readable P3-A02 packet
- reviewer-facing result report

Completion status allowed:

- `AUTOMATION_BASELINE_CANDIDATE`

Runtime defect handling:

- Record `RUNTIME_SEMANTIC_GAP` with evidence and hand to Codex B.
- Do not fix runtime behavior.

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
Then read only TASK P3-B04 from docs/agents/PHASE3-TASK-INDEX.md.
Do not read the full parallel work queue unless P3-B04 explicitly tells you to.
You own runtime implementation only for this task's declared hot files.
Do not redefine taxonomy, KPI, or evidence classification.
Do not expand scope into Trigger, Lifecycle, Interaction, Hidden, or Battle runtime.
Final status may only be IMPLEMENTATION_COMPLETE_CANDIDATE.
```
