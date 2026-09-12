# Phase 3 Completion Execution Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Drive FD Phase 3 from current candidate evidence to reviewed mechanic coverage, explicit runtime ownership, and measurable legacy burn-down without confusing candidate work with accepted release readiness.

**Architecture:** Phase 3 is executed as three coordinated lanes: Codex A owns measurement/evidence, Codex B owns one runtime hot-file lane at a time, and Codex R owns independent acceptance. Runtime migration is allowed only for scoped low-risk or repaired slices; Trigger, Lifecycle, Interaction, Modifier, Power, and Battle work starts with contracts unless a reviewed gate explicitly unlocks implementation.

**Tech Stack:** Markdown governance docs, TypeScript rules runtime, Vitest focused regression tests, Playwright Gate C tests, machine-readable coverage artifacts.

---

## Source Of Truth

Read these first, in order:

1. `docs/FD-DOCUMENT-ROADMAP.md`
2. `docs/agents/PHASE3-AGENT-CONTRACT.md`
3. the assigned task block in `docs/agents/PHASE3-TASK-INDEX.md`
4. `docs/plans/fd-rules-conformance-and-acceptance.md`
5. only the plan/audit/report files explicitly named by the assigned task

Do not use this plan to promote acceptance. It is a dispatcher plan only. Gate promotion remains owned by Codex R using the acceptance baseline.

## Execution Rules

Codex A and Codex B may work in parallel only when B has exclusive ownership of runtime hot files and A is limited to docs, audit scripts, report generation, and machine-readable evidence artifacts.

Codex B must not edit coverage KPI, taxonomy rules, or evidence classification to improve its own status. Codex A must not edit runtime semantics, primitive behavior, semantic routing, `MatchSession` behavior, or card-specific runtime behavior.

Codex R must stay read-only while reviewing. If R finds a defect, it returns findings and a Gate judgment; it does not implement fixes.

## Phase 3 Critical Path

1. Stabilize measurement before broad status claims.
2. Repair failed runtime slices before KPI sync.
3. Review-promote or reject existing low-risk direct-action candidates.
4. Lock gateway contracts before high-risk runtime migration.
5. Use A03 after each R judgment, not as a final-only cleanup pass.

Current immediate priority:

1. P3-B10 repair, if B has runtime hot-file ownership.
2. P3-A01 coverage/evidence schema in parallel with B10, if A stays out of runtime files.
3. P3-R05 review of B10 after the repair report exists.
4. P3-A03 sync for B10 only after R accepts the repair.
5. Resource Numeric and Card Zone review packets / A03 sync.
6. Trigger, Lifecycle, and Interaction contract specs.
7. Modifier / Power / Battle Result dependency boundary.

## Current Dispatch Assignments

| Agent | Start Now | Parallel Safety | Stop Condition |
|---|---|---|---|
| Codex A | P3-A01 coverage schema and drift guard; P3-A02 packet template if schema is accepted or explicitly bypassed | May run beside B10 only if it stays in docs/audit/report/package-script scope and avoids runtime files | Stop before A03 for any slice without an R judgment |
| Codex B | P3-B10 failed-review repair if hot-file ownership is reserved | Must be the only writer to `interpreter.ts`, `executable-card-pack.ts`, and `resolution-dataflow.ts` | Stop after implementation report; do not update KPI or acceptance status |
| Codex R | Review B10 after B report exists; review Resource Numeric/Card Zone packets when A prepares them | Read-only only | Return findings and Gate judgment; do not fix |

## Lane A: Automation / Coverage / Evidence

### Task A1: Coverage Schema And Drift Guard

**Files:**
- Modify: `docs/audits/*.mjs`
- Modify: `docs/reports/*`
- Modify: `package.json` only if script registration ownership is reserved
- Do not modify runtime files

**Steps:**

1. Read `docs/agents/PHASE3-TASK-INDEX.md` task P3-A01 only.
2. Define the coverage JSON shape: total abilities, routed, legacy, dual, skipped, Gate status, and source evidence paths.
3. Encode taxonomy drift rules so broad `TRIGGER/LIFECYCLE/INTERACTION` buckets cannot replace corrected semantic-axis counts.
4. Add or document the command that produces the baseline.
5. Record output as `AUTOMATION_BASELINE_CANDIDATE`.

**Acceptance:** A output is reproducible and does not make runtime acceptance claims.

### Task A2: Reviewer Packets

**Files:**
- Create/modify: `docs/reports/*review-packet.md`
- Create/modify: `docs/reports/*checklist.md`
- Do not modify runtime files or tests

**Steps:**

1. Read P3-A02 only.
2. Generate packet templates for Resource Numeric, Card Zone, B10, and B04-B10 follow-up review.
3. For each packet, separate implementer evidence from R acceptance.
4. Include missing evidence, commands, reports, relevant Golden path, and legacy fallback checks.
5. Record output as `REVIEW_PACKET_BASELINE_CANDIDATE`.

**Acceptance:** R can review without rereading unrelated Phase 3 documents.

### Task A3: A03 Burn-Down Sync Loop

**Files:**
- Modify: `docs/reports/*`
- Modify: machine-readable coverage artifacts
- Do not modify runtime files

**Steps:**

1. Wait for an R judgment on a specific slice.
2. Read P3-A03 only plus the relevant B report and R report.
3. Update that slice's status as accepted, rejected, or needs revision.
4. Update before/after legacy, semantic, dual, skipped, and Gate status counts.
5. If R rejected the slice, keep it out of accepted burn-down.

**Acceptance:** A03 runs repeatedly after each R judgment. It does not wait for B09/B10 or all seven domains to complete.

## Lane B: Runtime Implementation

### Task B1: P3-B10 Failed-Review Repair

**Files:**
- Modify: `packages/rules/src/ability/interpreter.ts`
- Modify: `packages/rules/src/ability/executable-card-pack.ts`
- Modify: `packages/rules/src/ability/resolution-dataflow.ts`
- Test: focused setup/create-to-skill tests
- Create/modify: scoped B10 implementation report

**Steps:**

1. Read P3-B10 only.
2. Write failing tests for `CARD_SPECIFIC_SEMANTIC_EXCLUSION`.
3. Remove card-id-specific routing exclusions such as `cardId !== 'card.luck'`.
4. Prove routing accepts arbitrary valid card ids with matching semantic form.
5. Prove Artoria Caster remains excluded by non-matching semantic axes.
6. Write failing tests for `EXISTING_CARD_PROVENANCE_ADOPTION`.
7. Allow duplicate no-op only when the existing card has `generatedBy === sourceCardId`.
8. Fail closed with `duplicate_created_card` when provenance is missing or different.
9. Prove failed duplicate rejection leaves state, events, and revision unchanged.
10. Run focused tests and write the B10 implementation report.

**Acceptance:** B10 returns to `IMPLEMENTATION_COMPLETE_CANDIDATE`; it is not accepted until R reviews it.

### Task B2: Existing Direct-Action Candidate Fixes

**Files:**
- Runtime files only if R review requires fixes
- Focused tests
- Scoped implementation reports

**Steps:**

1. Do not start while B10 owns the same hot files.
2. For Resource Numeric and Card Zone, fix only R-confirmed blockers.
3. Preserve semantic-form routing and fail-closed behavior.
4. Produce focused test output and before/after route evidence.

**Acceptance:** Each slice returns to R as a separate candidate.

### Task B3: Gateway-Backed Runtime Slices

**Files:**
- Runtime hot files declared by the accepted gateway contract
- Focused tests
- Gate C only when server/client/projection/reconnect behavior changes

**Steps:**

1. Wait for accepted Target/Interaction, Trigger, or Lifecycle contract.
2. Reserve runtime hot-file ownership.
3. Implement one representative mechanic only.
4. Add fail-closed negatives and no-legacy-fallback proof.
5. Write implementation report and stop for R.

**Acceptance:** One reviewed runtime slice at a time. No broad migration without A/R evidence.

## Seven Domain Plan

| Domain | Owner Start | B Runtime Allowed Now | A Work Allowed Now | R Gate |
|---|---|---:|---:|---|
| Resource Numeric Core | R/A | Only R-required fixes | Yes | Review candidate, then A03 burn-down |
| Card Zone Core | R/A | Only R-required fixes | Yes | Review candidate, then A03 burn-down |
| Result Binding | R/B later | No broad runtime until production-reuse gap is scoped | Yes, packet/gap tracking | Production reuse review |
| Target / Interaction | A/R spec, B later | No | Yes | Contract review before runtime |
| Trigger Gateway | A/R spec, B later | No | Yes | Contract review before runtime |
| Lifecycle Gateway | A/R spec, B later | No | Yes | Contract review before runtime |
| Modifier / Power / Battle Result Envelope | A/R boundary, B later | No | Yes | Boundary review before Phase 4 runtime |

## B10 Relationship To The Seven Domains

B10 is not an eighth domain. It is a failed-review repair inside the Card Zone / setup create-to-skill area and a blocker for any accepted coverage sync of that slice.

B10 may run before the seven-domain review cycle resumes because it repairs a concrete semantic-routing violation. A can work in parallel on P3-A01/A02, but A03 must not sync B10 until R accepts the repair.

## Done Criteria For Phase 3

Phase 3 is not done when B09 or B10 completes. Phase 3 is done only when:

1. A coverage command or accepted equivalent reports corrected semantic-axis coverage.
2. Resource Numeric and Card Zone candidates are independently accepted or explicitly rejected with next repairs.
3. B10 is repaired, reviewed, and either accepted or returned with a new blocker.
4. Result Binding has a production-reuse decision, not only Golden Eater candidate evidence.
5. Target/Interaction, Trigger, and Lifecycle gateway contracts are reviewed.
6. Modifier/Power/Battle dependency boundaries are fixed for Phase 4 / Golden Flow.
7. A03 has synced accepted/rejected status and burn-down after each R judgment.
8. Roadmap release readiness blockers are updated without claiming release readiness early.
