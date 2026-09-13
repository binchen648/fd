# Phase 3 Full-Roster Collaboration Contract

- Version: P3-FRC-1.0
- Status: ACTIVE
- Scope: 943 static Reference skills plus the known dynamic skill
- Target repository: `D:\fd`
- Locked Reference: `fengling20011118-dotcom/fate-domination@b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Authority: subordinate to the document roadmap, final rules, acceptance plan, and `PHASE3-AGENT-CONTRACT.md`

## Purpose

This contract lets a collaborator normalize and migrate the full Reference roster without interrupting the active Phase 3 runtime lane or introducing another production rules engine.

The Reference repository is read-only source material and a behavioral oracle. `D:\fd` is the only Phase 3 implementation target. Reference `FULL`, handler presence, and Reference tests are not current Phase 3 acceptance.

## Roles

### S: Source Normalization And Migration

S owns identity crosswalks, sources, clause preservation, semantic axes, capability membership, decision packets, accepted-contract authoring, and migration fixtures.

S must not modify runtime semantics, define primitives, infer rules from Reference behavior, copy Reference handlers, add card-ID routing, change coverage definitions, or promote Gate status.

### B2: Authorized Capability Runtime

The collaborator may act as B2 only for one task marked `READY` after its capability request, canonical semantics, baseline, file lease, and dependencies are accepted. B2 follows all Codex B restrictions.

One PR has one role. An S PR cannot contain B2 runtime changes; a B2 PR cannot contain unrelated bulk authoring or metric changes.

Codex A, Codex B, and Codex R retain the ownership defined in `PHASE3-AGENT-CONTRACT.md`.

## Non-Interference

The active sequence remains:

```text
P3-B11 -> P3-R06 -> P3-A03 -> existing gateway/boundary sequence
```

The initial full-roster sequence is analysis-only:

```text
P3-FS00 -> FS01 -> FS02 -> FS03 -> FS04 -> FS05 -> FA01 -> FR01
```

Before F1 acceptance, the full-roster lane must not modify production runtime, server, client, current Phase 3 KPI, or current task status.

## Worktree Rules

Every task uses an external worktree and a dedicated `codex/` branch. Do not implement directly in `D:\fd` or create nested worktrees below it.

At startup run:

```powershell
git status --short
git branch --show-current
git rev-parse HEAD
git worktree list
```

Unknown changes must not be removed, stashed, reset, or overwritten. Report `WORKTREE_CONTAMINATION_BLOCKED` when they conflict with assigned files.

Every task records exact `BaseCommit`, `ReferenceCommit`, `ReservedFiles`, `ForbiddenFiles`, and dependencies. “Latest” is not a valid baseline.

## Reference Isolation

Intake must verify the Reference remote, exact commit, clean status, required files, and SHA-256 input digests. It may read from a supplied `--reference-root` but must never write there.

Committed production code must not depend on `D:\fd\references\...` or any local absolute path. CI obtains a separate checkout at the locked commit.

## File Leases

`interpreter.ts`, `executable-card-pack.ts`, `resolution-dataflow.ts`, and `match-session.ts` require exclusive ownership. B and B2 must serialize work whenever their reserved files overlap.

S owns only declared authoring, intake, inventory, source, and migration-fixture files. A owns coverage and evidence automation. R remains read-only while reviewing.

## Routing

- Rule ambiguity or authoritative-source conflict: `RULE_DECISION_REQUIRED`.
- Missing trustworthy source: `SOURCE_EVIDENCE_REQUIRED`.
- Clear semantic capability missing in runtime: `RUNTIME_CAPABILITY_REQUEST` for B/B2.
- Classification or count defect: `AUTOMATION_CLASSIFICATION_GAP` for A.
- Reference behavior conflicts with canonical rules: `REFERENCE_RUNTIME_CONFLICT`.
- Highly specific clear behavior: `SPECIAL_HANDLER_CANDIDATE` for B/R review.

## Pull Requests

Every PR states:

```yaml
Role: S | A | B | B2 | R
Task: P3-F...
BaseCommit: exact_sha
ReferenceCommit: exact_sha
MechanicFamily: value_or_none
AffectedAbilities: []
ModifiedFiles: []
RuntimeBehaviorChanged: true_or_false
CoverageBefore: value_or_not_applicable
CoverageAfter: value_or_not_applicable
Tests: []
KnownBlocks: []
GateClaim: NONE | CANDIDATE
```

Do not combine roles, unrelated mechanic families, Reference runtime import, metric redefinition, and production runtime changes. Implementers cannot claim acceptance.

## Checkpoints

- F0: Reference lock and identity inventory accepted; no runtime effect.
- F1: semantic normalization and capability catalog accepted; no runtime effect.
- F2: one capability aligned with an accepted current contract.
- F3: missing B/B2 runtime capability independently accepted.
- F4: S migration accepted and A burn-down synchronized.
- F5: independent full-roster closure audit.

B2 may start only after the current exclusive runtime lane closes, A verifies membership, semantics and the relevant contract are accepted, hot files are free, an exact baseline is pinned, and the task index marks the task `READY`.

## Completion

Normalization requires 943/943 static skills and 1/1 known dynamic skill accounted for, no missing or duplicate canonical IDs, no unclassified abilities, no untracked clauses, and explicit blocks for every unresolved item.

Full-roster Phase 3 additionally requires no unexplained dual routes, no undeclared special handlers, no card-specific checks in shared runtime, no silent fallback, accepted capability contracts, appropriate Gate A/B/C evidence, reproducible A measurement, and independent R acceptance.
