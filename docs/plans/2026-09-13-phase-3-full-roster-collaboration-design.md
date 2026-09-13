# Phase 3 Full-Roster Collaboration Design

- Date: 2026-09-13
- Status: APPROVED DESIGN
- Scope: normalize and migrate all 943 static skills plus the one known dynamic skill without disrupting the active Phase 3 runtime lane
- Target repository: `D:\fd`
- Reference repository: `https://github.com/fengling20011118-dotcom/fate-domination.git`
- Locked reference commit: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## 1. Objective

The program converts the full Reference V2 roster into the current FD Phase 3 architecture. It does not import the Reference `StandardMatchEngine`, `SkillRegistry`, or its 941 handler routes as production owners.

Each ability must eventually have a canonical identity, source-grounded clauses, normalized semantic axes, a named mechanic capability, one current-runtime owner, an explicit migration or block status, and reproducible acceptance evidence.

Phase 3 may retain a small number of dedicated handlers only when generic reuse is not justified and the handler has typed input/output, transaction rollback, no shared-runtime card-ID routing, no silent fallback, and independent approval.

## 2. Authority And Repository Boundary

Authority order is:

1. `docs/rules/FD-Game-Rules-Final.md`;
2. user-confirmed rule clarification;
3. current canonical authoring;
4. Reference card sources and normalization;
5. Reference handler behavior as a non-authoritative oracle.

`D:\fd` is the only implementation repository. The Reference repository is read-only input for card text, IDs, evidence, structured samples, behavior discovery, and scenario design. Production code must not depend on `D:\fd\references\...` or another developer-local absolute path.

Reference intake must verify repository URL, exact HEAD, clean status, and deterministic input digests before reading. It must never write into the Reference checkout.

## 3. Roles

### Codex S: Source Normalization And Card Migration

Owns the 943-skill crosswalk, source evidence, clause decomposition, semantic axes, mechanic-family membership, capability mapping, decision packets, canonical authoring that consumes accepted contracts, and migration fixtures.

S must not define runtime behavior, modify Phase 3 hot files, infer unresolved rule semantics from Reference handlers, add card-ID routing, copy Reference handlers into production, change coverage definitions, or promote acceptance.

### Codex A: Automation, Coverage And Evidence

Owns reproducible inventory checks, taxonomy validation, missing/duplicate detection, legacy/new/dual counts, classifier drift, machine-readable evidence, and reviewer packet generation. A does not modify game behavior.

### Codex B And B2: Runtime Implementation

B remains the owner of the active Phase 3 runtime lane. B2 is a temporary role that S's collaborator may receive for one explicitly approved capability slice after its start gate is satisfied.

B/B2 own primitive contracts, compiler validation, semantic routing, resolution runtime, gateways, fail-closed behavior, and focused representative tests. They may not redefine A's metrics or promote their own Gate results.

One PR has one role. The same person may submit an S PR and later a B2 PR, but source normalization, runtime implementation, metric changes, and acceptance judgment must not be mixed in one PR.

### Codex R: Independent Acceptance

R is read-only while reviewing. R checks canonical conformance, diffs, bypasses, production reachability, and Gate A/B/C evidence. Fixes return to the owning role.

## 4. Workspace And PR Isolation

Every task uses an external worktree and a dedicated `codex/` branch. `D:\fd` remains a coordination and inspection workspace. Nested worktrees, local Reference dumps, dependencies, logs, Playwright output, and generated caches are not committed.

Every task records:

```yaml
Task: P3-F...
Role: S | A | B | B2 | R
BaseCommit: exact_sha
ReferenceCommit: b2f9fa15fba07c63530bbf4612b03b8b704755f9
ReservedFiles: []
ForbiddenFiles: []
Dependencies: []
```

`interpreter.ts`, `executable-card-pack.ts`, `resolution-dataflow.ts`, and `match-session.ts` require an exclusive lease. Only one runtime owner may modify a leased hot file at a time.

At startup, every agent checks status, branch, HEAD, and all worktrees. Unknown changes are neither removed nor stashed. A conflicting task reports `WORKTREE_CONTAMINATION_BLOCKED` and stops touching the affected files.

Every PR declares role, task, base commit, reference commit, mechanic family, affected abilities, modified files, runtime behavior change, coverage before/after, tests, blocks, and `GateClaim`. Implementers may claim only `NONE` or `CANDIDATE`.

## 5. Canonical Inventory

The machine-readable source of truth is `data/phase3/full-roster-ability-inventory.json`. Generated Markdown views must derive from it rather than maintain independent counts.

Each ability records:

```yaml
canonicalAbilityId: stable_id
canonicalCardId: stable_id
ownerId: stable_id
printedText: source_text
clauses: []
sources: []
reference:
  skillId: stable_id
  handlerId: optional
  executionRoute: structured | shared_handler | specific_handler | deterministic
semanticAxes:
  timing: []
  trigger: []
  conditions: []
  costs: []
  targets: []
  effects: []
  interactions: []
  lifecycle: []
  modifiers: []
  visibility: []
phase3:
  mechanicFamilies: []
  requiredCapabilities: []
  currentRoute: legacy | new | dual | none
  inheritedAcceptanceContracts: []
classification: status
blockedBy: []
```

The forward states are `DISCOVERED`, `SOURCE_GROUNDED`, `SEMANTIC_NORMALIZED`, `CONTRACT_MAPPED`, `IMPLEMENTATION_CANDIDATE`, `REVIEW_READY`, and `ACCEPTED`.

Explicit blocks are `RULE_DECISION_REQUIRED`, `SOURCE_EVIDENCE_REQUIRED`, `RUNTIME_CAPABILITY_REQUIRED`, `PHASE_DEPENDENCY_BLOCKED`, `REFERENCE_RUNTIME_CONFLICT`, and `SPECIAL_HANDLER_REVIEW`.

Reference `FULL`, handler presence, or a passing Reference test cannot advance a current Phase 3 state.

## 6. Capability Catalog And Decisions

S reduces the roster to reusable capabilities instead of proposing 943 handlers. Every capability names its input, output, events, result binding, transaction behavior, eligibility axes, invalidating axes, representatives, eligible abilities, skipped abilities, and acceptance vehicle.

Rules questions are batched for the user. A decision packet includes affected abilities, exact text and sources, Reference behavior, ambiguity, options, recommendation, and runtime impact. Technical design and Gate judgment are not user rule decisions.

Classification routes are:

- `READY_EXISTING_CONTRACT`: S may prepare a migration against an accepted contract.
- `READY_GENERIC_EXTENSION`: create a runtime capability request.
- `SPECIAL_HANDLER_CANDIDATE`: B/R must review the exception.
- `RULE_DECISION_REQUIRED`: user rules decision.
- `SOURCE_EVIDENCE_REQUIRED`: obtain authoritative evidence.
- `PHASE_DEPENDENCY_BLOCKED`: wait for the named gateway or phase boundary.
- `REFERENCE_RUNTIME_CONFLICT`: record the discrepancy; Reference behavior does not win.

## 7. Mechanic Waves

Runtime dependencies are processed in this order:

1. Resource Numeric and Cost.
2. Card Zone, Draw, Move, and Return.
3. independent Card Actions: `PLAY`, `ADD_TO_ATTACK`, `CREATE_AND_ACTIVATE`, `ACTIVATE`, and `CLOSE`.
4. Result Binding.
5. Target Selection and `PendingInteraction`.
6. Trigger Gateway.
7. Lifecycle, Cleanup, Reset, and Persistence.
8. Modifier and Power.
9. Battle Result, Defeat, Winner, and Reward.
10. Replacement, Prevention, and Response Ordering.
11. Hidden Information, Copy, Transform, and reviewed special handlers.

S may normalize later waves early. Runtime implementation and accepted migration follow dependency order and accepted contracts.

Migration PRs normally contain 10-40 abilities under one capability. A multi-ability card is not accepted until every printed clause is accepted or explicitly blocked.

## 8. Non-Interference With Current Phase 3

The active mainline remains unchanged:

```text
P3-B11 -> P3-R06 -> A03 synchronization -> existing gateway/boundary sequence
```

The full-roster track initially runs only:

```text
P3-FS00 -> FS01 -> FS02 -> FS03 -> FS04 -> FS05 -> FA01 -> FR01
```

These tasks produce intake tools, inventories, catalogs, decision packets, and audits only. They must not edit production runtime, server, or client behavior.

B2 may start only when the active exclusive runtime lane is closed, A has verified the capability inventory, canonical semantics are confirmed, the relevant contract is accepted or explicitly scoped, hot files are unreserved, the base commit is pinned, and the task index says `READY`.

Unaccepted full-roster data cannot change current Phase 3 KPIs or task statuses.

## 9. Checkpoints

- F0: Reference lock and complete identity inventory accepted; no runtime effect.
- F1: semantic normalization and capability catalog accepted; no runtime effect.
- F2: one capability aligns with an accepted current contract; migration may be dispatched.
- F3: B/B2 runtime slice independently accepted; S may consume it.
- F4: migration accepted and A records burn-down.
- F5: full-roster closure audit.

## 10. Completion Criteria

Full-roster normalization requires all 943 static skills and the known dynamic skill accounted for, no missing or duplicate canonical IDs, no unclassified abilities, and no untracked clauses. Missing evidence and unresolved semantics must be explicit blocks.

Full-roster Phase 3 completion additionally requires all eligible abilities on accepted current-runtime routes, no unexplained dual routes, no undeclared special handlers, no card-specific checks in shared runtime, no silent fallbacks, Gate A for every capability, Gate B representatives for every migrated family, Gate C representatives for each required production pattern, reproducible A evidence, and independent R acceptance.

Gate C is inherited by matching semantic pattern, not by card count. Every ability records the acceptance contract it inherits; an invalidating semantic axis requires a new representative.
