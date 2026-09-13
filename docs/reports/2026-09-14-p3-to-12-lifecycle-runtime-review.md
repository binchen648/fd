# P3-TO-12 Lifecycle Runtime Independent Review

- Date: 2026-09-14
- Review owner: Codex R
- Review mode: fresh worktree, review only
- Target candidate: `8717552b704dd495ed1178f909834e6eec129064`
- Target branch: `codex/b-p3-to12-lifecycle-runtime`
- Review branch: `codex/r-p3-to12-lifecycle-review`
- Base inspected: `c1facfb7c203ed6078c61613d92386cfe81a83cc`
- Verdict: `IMPLEMENTATION_NEEDS_REVISION`
- Gate promotion: none

## Decision

The candidate has strong focused/runtime/E2E evidence, no card/ability identity routing, and the external CLOSE + lifecycle teardown path works for the first lifecycle cycle. However, two blocking acceptance defects prevent Gate A/B/C promotion.

```text
Decision: IMPLEMENTATION_NEEDS_REVISION
Target: 8717552b704dd495ed1178f909834e6eec129064
Blocking findings: 2
Gate A: NOT ACCEPTED
Gate B: NOT ACCEPTED
Gate C: NOT PROMOTED
Runtime identity routing hits: 0
Fresh reviewer typecheck: PASS
```

## [P1] External Card Zone/source-state policy is self-defined and self-admitted

TO-04's accepted contract requires every `while_card_active` runtime consumer, **before runtime admission**, to resolve `sourceValidity` to an **accepted Card Zone/source-state policy**. The accepted review describes the policy ID as a reviewed semantic source-state policy and explicitly forbids Lifecycle from defining active-area semantics itself.

The TO12 candidate introduces:

```text
fd.card-zone.active-card-source.v1
```

and in the same candidate:

- implements it in `packages/rules/src/core/card-source-state.ts`;
- hard-codes the policy's active areas as `field || attack_area`;
- labels SC3 authoring with `kind=accepted_source_state_policy`;
- teaches the loader that this exact new policy ID is admissible;
- immediately routes SC3 through it.

Fresh repository-wide search found no prior occurrence or independent acceptance record for this policy ID. The ID exists only in files introduced/modified by this candidate.

The active Phase 3 queue additionally states that Card Zone may receive runtime changes only for new R-confirmed blockers. No prior R-confirmed Card Zone source-state blocker/repair packet authorized this helper before the candidate was produced.

This is an acceptance cycle: the Lifecycle implementation creates the external dependency, marks it accepted in authoring/schema admission, and consumes it before an independent owner/reviewer has accepted that dependency.

### Required repair

Separate the external source-state dependency from Lifecycle admission:

1. record this review finding as the R-confirmed blocker authorizing a scoped Card Zone/source-state repair;
2. produce a narrowly scoped Card Zone/source-state policy candidate from canonical active/close rules;
3. independently review/accept that exact policy contract/implementation;
4. only then bind TO12 lifecycle authoring/runtime admission to the accepted exact policy baseline.

Do not solve this by renaming the policy or by letting Lifecycle own the active-zone list.

## [P1] Lifecycle transition identity aliases distinct reinstall cycles

The candidate defines the lifecycle record identity as:

```text
sourceCardInstanceId + sourceAbilityId + policyKey
```

That identity is deterministic and reused when the same source card instance is legitimately closed and later played again.

At the same time, `pushLifecycleTransition` suppresses every later `source_invalidated` transition if history already contains one with the same `lifecycleId` and kind:

```ts
if (kind === 'source_invalidated' &&
    transitions.some((entry) => entry.lifecycleId === ongoing.id && entry.kind === kind)) return;
```

Fresh reviewer probe used the same SC3 card instance across two legal lifecycle cycles, moving the second cycle to authoritative round 2 so the synthetic external close action was a distinct later legal use.

Observed:

```text
sameLifecycleId=true
installCount=2
sourceInvalidatedCount=1
```

Transition history contained:

- round 1 install;
- round 1 source_invalidated;
- round 2 install;
- **no round 2 source_invalidated**.

The second close did move/cleanup the source, but its terminal transition evidence was suppressed by the first cycle's history.

This violates the accepted Lifecycle negative requirement that a distinct later valid transition cannot be suppressed merely because policy/source values resemble an earlier transition. It also means transition identity is not sufficient to distinguish lifecycle incarnations for replay/audit/idempotency.

### Required repair

Give each lifecycle installation incarnation stable server-owned identity, or key terminal-transition idempotency to the exact install incarnation/causation rather than all historical transitions sharing the semantic lifecycle key. Prove at minimum:

- first install -> first invalidation exactly once;
- later valid reinstall -> second invalidation exactly once;
- duplicate delivery inside one incarnation does not create a second terminal transition;
- reconnect/restore preserves incarnation identity;
- a same-definition new card instance does not inherit the old lifecycle incarnation.

## Positive Findings Retained

These findings do not erase the candidate's useful work:

- runtime diff contains no `servant.artoriac`, `sc-artoriac-3`, or canonical ability-name eligibility branch;
- loader and executable compiler fail closed for malformed/unknown sourceValidity metadata;
- source definition, controller, source ability, active state, and face-down state are revalidated server-side;
- first-cycle external CLOSE + lifecycle teardown commits atomically in the existing regression/E2E evidence;
- corrupt lifecycle state is rejected rather than silently accepted;
- generated content is deterministic;
- implementation report explicitly did not self-promote Gate status and disclosed the extra dependency surface.

## Fresh Reviewer Verification

Fresh reviewer worktree:

```text
E:/Codex/FD/fd-to12-review
HEAD=8717552b704dd495ed1178f909834e6eec129064
```

Fresh checks:

- `git diff --check c1facfb..8717552`: PASS.
- `npm.cmd ci --ignore-scripts`: PASS.
- `npm.cmd run typecheck`: PASS.
- repository-wide policy search: `fd.card-zone.active-card-source.v1` has no prior accepted source; only candidate files reference it.
- runtime identity-routing diff search: zero canonical SC3 identity matches.
- adversarial two-cycle lifecycle probe: FAILS acceptance with `installCount=2`, `sourceInvalidatedCount=1`.

The implementation's previously recorded focused 98/98 and browser 5/5 evidence is consistent with first-cycle behavior, but neither suite covers the distinct reinstall-cycle transition alias found here.

## Baseline / Scope

The candidate's root suite records 20 inherited CHM/original-image asset failures; this review found no evidence that those asset failures were caused by TO12. They are not the reason for rejection.

The rejection is caused by the two P1 runtime/acceptance defects above.

## Final Status

`IMPLEMENTATION_NEEDS_REVISION`

No Gate A/B/C promotion is granted. A repair must occur in a separate implementation worktree/branch and must be reviewed fresh against a new exact target SHA.
