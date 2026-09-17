# P3-A03 TO-04 Synchronization

- Document Role: REVIEW_OUTCOME_SYNC
- Owner: Codex A
- Source Task: `P3-A03`
- Specification Task: `P3-TO-04`
- Accepted Spec Commit: `b46cfa4439c27112d14066e2239e7524f5a1e137`
- Independent Review Commit: `d1e13d84b31bcbb57a6326ce9ea803fa877c651c`
- Reviewer Outcome: `SPEC_ACCEPTED`
- Status: `COVERAGE_SYNC_CANDIDATE`
- Runtime Authorization: none
- Gate Promotion: none

## Accepted Scope

P3-TO-04 now has an independently accepted Lifecycle Policy Gateway specification for the corrected lifecycle/reset denominator:

```text
explicitLifecycleAbilities=11
policyMemberships=22
```

The accepted contract covers stable source identity, per-round/per-game usage, unique trigger-window conflict claims, source validity, source-leaves-active-area cleanup, fixed-duration expiry boundary/order, cleanup destination ownership, `remain_active`, reconnect/idempotency, and atomic rollback.

The independent r1 review also verified the two earlier blockers are closed:

- `while_card_active` requires a resolved accepted Card Zone/source-state policy instead of Lifecycle-owned zone hard-coding;
- fixed duration requires a resolved authoritative scheduler expiry boundary/order policy in addition to a counting convention.

Specification acceptance does not migrate a lifecycle consumer.

## Fresh Coverage Automation

Fresh command:

```text
npm.cmd run phase3:coverage
```

Result:

```text
archives=14
cards=46
abilities=92
newRuntimeSemanticRouted=12
legacyExecuteAbility=3
legacyResolveEffect=49
dualRuntime=0
pilotAllowlist=0
notClassifiable=28
compiled definitionHash=5aa5a186bb201ce1f491cb6f38907a6267a4f30775113d9dd95651d58ba735d2
compiled blockingIssues=0
```

TO-04 is specification-only, so the previously accepted aggregate remains unchanged:

```text
newRuntimeSemanticRouted=13
legacyExecuteAbility=3
legacyResolveEffect=48
dualRuntime=0
```

TO-04 runtime delta:

```text
new=0
legacyExecute=0
legacyResolve=0
dual=0
```

## P3-B08 Dependency Reconciliation

P3-B08 `CARD_ACTION_SEMANTICS_MINIMAL_CLOSE` requires a reviewed Lifecycle/source-close cleanup boundary when close affects an active source, plus exclusive runtime hot-file ownership.

### Lifecycle/source-close boundary — SATISFIED

Satisfied by:

- P3-TO-04 final spec `b46cfa4439c27112d14066e2239e7524f5a1e137`;
- independent acceptance `d1e13d84b31bcbb57a6326ce9ea803fa877c651c`.

The accepted composition boundary is:

```text
Card Action/Card Zone owns source close/movement
Lifecycle owns dependent lifecycle teardown
mandatory close/movement + lifecycle cleanup commit or roll back together
```

This satisfies the specification dependency only. It does not accept or promote the historical CLOSE runtime candidate.

### Runtime hot-file ownership — BLOCKED

Fresh inspection still finds uncommitted edits in:

```text
E:/Codex/FD/fd-b11-repair1
```

including shared hot files:

```text
packages/rules/src/ability/interpreter.ts
packages/rules/src/ability/resolution-dataflow.ts
packages/rules/src/ability/executable-card-pack.ts
```

A03 does not alter, reset, checkout, discard, or adopt those edits.

Current B08 dependency result:

```text
WAIT_RUNTIME_HOT_FILE_OWNERSHIP
```

The same ownership conflict also continues to block P3-B07 runtime work.

## Accepted Boundaries Retained

- All 11 lifecycle rows remain subject to per-consumer external dependencies before runtime migration.
- The current `round_count=2` consumer still requires exact counting convention and scheduler expiry boundary/order evidence before runtime admission.
- `while_card_active` consumers require a resolved accepted source-state policy.
- Lifecycle spec acceptance does not promote Card Action CLOSE, Modifier/Power, Battle, Hidden, Special, or Card Zone runtime.
- No Gate A/B/C transition is attributed to TO-04.

## Ownership Boundary

This synchronization records reviewer outcome, fresh automation, and dependency state only. It does not touch rule runtime, implementation tests, card authoring, classifier rules, or Gate judgments.

## Completion Claim

`COVERAGE_SYNC_CANDIDATE`
