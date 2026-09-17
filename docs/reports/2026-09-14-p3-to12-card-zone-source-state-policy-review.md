# P3-TO-12 Repair Dependency — Card Zone Source-State Policy Independent Review

- Date: 2026-09-14
- Review owner: Codex R
- Review mode: fresh worktree, review only
- Candidate: `0b8c6bf611447b416581694d807b9bb52badc30b`
- Base: `c1facfb7c203ed6078c61613d92386cfe81a83cc`
- Candidate branch: `codex/b-p3-to12-source-state-policy`
- Review branch: `codex/r-p3-to12-source-state-policy-review`
- Authorization source: TO12 review blocker `5c2496be9473a890b5bf8f241579ad5678269606`
- Verdict: `SOURCE_STATE_POLICY_ACCEPTED`
- Lifecycle/Gate promotion: none

## Decision

The isolated Card Zone/source-state policy is accepted as the external source-validity policy required by TO-04 for a later TO12 lifecycle repair.

```text
policyId=fd.card-zone.active-card-source.v1
owner=card_zone_source_state
candidate=0b8c6bf611447b416581694d807b9bb52badc30b
verdict=SOURCE_STATE_POLICY_ACCEPTED
blockingFindings=0
```

This acceptance applies only to source-state validity. It does not migrate SC3, install Lifecycle state, accept TO12, or promote Gate A/B/C.

## Canonical Conformance

Reviewed against `docs/rules/FD-Game-Rules-Final.md`:

- 9.4: face-up played attack cards are activated;
- 9.5: face-down played cards do not enter active state;
- 11.1: activation is face-up entry into the attack area or explicit effect activation;
- 11.3 residual semantics preserve active residual sources across rounds until close;
- 11.4 close removes the active source state and returns skill attacks to the skill area.

The policy does **not** treat `field` alone as active. `field` is accepted only when the authoritative runtime active bit is true and the source is not face-down, which corresponds to the 11.1 explicit-effect activation alternative. `attack_area` is likewise insufficient without the authoritative active bit and face-up state.

## Identity / Transfer Boundary

The accepted policy binds validity to:

- exact source card instance;
- controller identity;
- definition identity captured by the consumer at install;
- source ability still present on the current definition;
- authoritative active state;
- face-up state;
- Card Zone active board area.

Therefore:

- same-definition replacement instance does not inherit validity;
- controller transfer invalidates the old source-bound policy unless a future reviewed transfer contract says otherwise;
- transform/definition replacement invalidates it;
- removed ability invalidates it;
- skill/off-board source is not active merely because definition identity matches.

## Fail-Closed Review

Unknown policy ID returns:

```text
supported=false
valid=false
reason=unknown_policy
```

A consumer must reject/fail closed rather than recover by zone heuristics. The policy itself contains no character/card/ability identity eligibility branch and does not parse printed/translated text.

## Scope Review

Exact candidate scope is four files:

- policy contract document;
- candidate result document;
- `packages/rules/src/core/card-source-state.ts`;
- focused core policy test.

No lifecycle runtime, authoring, generated content, MatchSession, combat, coverage, taxonomy, or Gate state changed.

This Card Zone change is authorized by the new R-confirmed blocker in `5c2496be9473a890b5bf8f241579ad5678269606`, satisfying the queue rule that Card Zone changes after TO11 require an R-confirmed blocker.

## Fresh Verification

- fresh worktree pinned to exact `0b8c6bf611447b416581694d807b9bb52badc30b`;
- `npm.cmd ci --ignore-scripts`: PASS;
- `npm.cmd run typecheck`: PASS;
- focused tests:
  - `card-source-state.test.ts`
  - `game-loop-action-play.test.ts`
  - `package-exports.test.ts`
  - **3 files / 16 tests PASS**;
- `git diff --check c1facfb..0b8c6bf`: PASS;
- blocking findings: 0.

## Consumer Authorization

A subsequent TO12 lifecycle repair may reference this exact accepted policy as:

```text
kind=accepted_source_state_policy
owner=card_zone_source_state
policyId=fd.card-zone.active-card-source.v1
acceptedPolicyCandidate=0b8c6bf611447b416581694d807b9bb52badc30b
acceptedPolicyReview=<this review commit>
```

The lifecycle consumer still needs its own fresh implementation review, including the separate lifecycle-incarnation identity blocker from the first TO12 review.
