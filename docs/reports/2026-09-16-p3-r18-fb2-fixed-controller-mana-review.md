# P3-R18 Independent Review — FB2-01 Fixed Controller Mana Cost

- Date: 2026-09-16
- Reviewer task: `P3-R18`
- Candidate task: `P3-FB2-01`
- Candidate SHA: `36670ca3d57331b5354fca35deadc1e34bf5a1db`
- Candidate implementation base: `f33f8e4f63c98fc0851596ea06da5cf01b895f7c`
- Accepted runtime lineage before handoff: `a5f390e96ac2560226f9d48f133c9b09f5a1e140`
- Reviewer branch: `codex/r-p3-fb2-01-fixed-controller-mana-r1-review`
- Verdict: `GATE_A_B_CANDIDATE_ACCEPTED`

## Findings

No blocking findings.

The candidate is narrowly scoped, reuses the existing typed Resolution Data-flow mana primitive, introduces no production identity routing or printed-text parsing, changes no MatchSession/client/projection protocol, and produces no deterministic or compatibility regression in the reviewer runs.

## Exact-shape / identity-independence judgment

ACCEPTED.

The added component classifier accepts only the exact scoped shape:

- one top-level `pay_mana` cost node;
- positive safe-integer literal amount;
- payer absent/default-controller or explicitly `controller`;
- no effect-level `optionalCost` anywhere in the authored effect/create tree.

It rejects the reviewer-covered negative shapes:

- zero, negative, and fractional values;
- variable and expression amounts;
- explicit third-party payer;
- multiple top-level cost nodes;
- non-mana top-level cost;
- effect-level optional payment.

Renaming the ability ID leaves classification unchanged. The production diff from the exact implementation handoff contains zero added matches for Maiya, Kayneth, `master.`, `servant.`, Military, Volumen, printed-clause/text parsing, or direct definition-ID equality routing.

The component does not make an unsupported ability routable. Runtime use remains gated by the two previously accepted structural parent routes: fixed-cost source-card PLAY response and fixed-cost ADD_TO_ATTACK. Those parent classifiers remain structural rather than representative-identity checks.

## Typed payment / atomicity / rollback judgment

ACCEPTED.

FB2-01 does not add a second mana mutation implementation. It feeds accepted fixed cost nodes into the existing Resolution Data-flow `pay_mana` primitive.

Reviewer proof confirms:

- successful payment emits typed `mana_paid` evidence with controller/source/ability causation plus resource delta and before/after values;
- insufficient mana rejects without committed mana, source-zone, or event mutation;
- Kayneth's non-staged response resolves payment plus source-card PLAY inside one Resolution Data-flow transaction, so a same-stage downstream source-play failure discards the payment with the failed transaction;
- no direct fixed-cost `p.mana -= ...` path remains for the accepted component users.

The candidate does not claim atomicity across separate authoritative dispatch stages.

## Maiya staged-boundary judgment

ACCEPTED.

Maiya's already accepted two-stage behavior is preserved rather than accidentally converted into one deferred transaction:

1. activation stage commits typed fixed mana payment and opens the existing pending target decision;
2. a later target stage settles or rejects independently.

The focused reviewer run proves that if the selected target becomes illegal before the second dispatch, the second stage rejects with no new event while the previously committed activation-stage mana payment remains committed. This matches the corrected A handoff and avoids a false refund.

## Kayneth compatibility judgment

ACCEPTED.

Kayneth `volumen.extra-play` remains on the previously accepted source-card PLAY response route. On success the reviewer observes both typed mana payment and source-card play with the expected mana/card state. On forced same-stage source-zone failure, the original state retains its mana and no payment/event leak appears.

No broader PLAY contract is promoted by this review.

## Scope / forbidden-surface judgment

ACCEPTED.

The implementation delta contains only:

- `packages/rules/src/ability/interpreter.ts`;
- `packages/rules/tests/regression/fb2-fixed-controller-mana-cost.test.ts`;
- the B2 result report.

It does not change:

- `packages/rules/src/match-session.ts`;
- `packages/rules/src/ability/resolution-dataflow.ts`;
- F1 inventory/catalog/source-evidence artifacts;
- A-owned KPI/taxonomy;
- roster authoring content;
- client/server projection or interaction protocols.

Therefore a fresh browser Gate C is not required for this task. The full CI still exercises room/session/reconnect compatibility and remained green.

## Independent gate evidence

- exact reviewed candidate: `36670ca3d57331b5354fca35deadc1e34bf5a1db`
- reviewer dependency reconstruction: `npm.cmd ci --offline --ignore-scripts` — PASS, no tracked change
- `npm.cmd run typecheck` — PASS
- FB2-01 + Maiya + Kayneth focused: `3 files / 22 tests PASS`
- all rules regressions: `40 files / 240 tests PASS`
- reviewer full `npm.cmd run test:ci`: `107 files / 653 tests PASS`
- `npm.cmd run verify:generated-content`: PASS
  - content library: `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`
  - fixture: `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence report: `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`
- `git diff --check` for implementation handoff -> candidate: PASS
- production identity/text audit: `0` matches
- forbidden-file delta audit: `0` matches
- reviewer worktree was clean before this review report; R18 made no implementation fixes

Relative to the accepted runtime lineage, the candidate adds five focused FB2 tests and introduces `+0` new full-root failures.

## Non-promotion judgment

ACCEPTED.

R18 accepts only the fixed positive controller top-level mana component under an already accepted parent route. This review does not accept or promote the rest of `GENERIC_COST_PAYMENT`, including:

- variable/X payment;
- effect-level optional payment;
- third-party or multi-player payment;
- upkeep/maintenance payment;
- replacement payment;
- command-seal, victory-point, discard-card, or source-card-movement costs;
- ordinary printed card play costs.

It also does not authorize any F1 roster migration by itself.

## Gate A/B/C judgment

`GATE_A_B_CANDIDATE_ACCEPTED`.

FB2-01 is acceptable for A-owned evidence/task synchronization. No browser Gate C is required because no browser/transport/projection/interactivity surface changed.

## A synchronization input

A may synchronize FB2-01 using:

- accepted candidate: `36670ca3d57331b5354fca35deadc1e34bf5a1db`;
- capability: identity-free top-level fixed positive controller `pay_mana` component;
- accepted adoption boundary: only abilities already admitted by an independently accepted parent semantic route;
- accepted transaction semantics: stage-local atomicity, with Maiya activation payment committed before its existing pending-target stage and Kayneth payment/play atomic inside one non-staged resolution;
- accepted evidence: typed `mana_paid`, insufficient-mana fail-closed behavior, same-stage rollback, staged non-refund behavior, identity rename invariance, negative-shape rejection, Maiya/Kayneth compatibility, full-root green, deterministic generated-content green;
- non-promotion: no broad Cost/Payment acceptance and no F1 migration.

The next coordinator action should mark P3-FB2-01/P3-R18 accepted, pin this accepted runtime candidate for subsequent capability/migration scheduling, and separately decide which exact F1 identities qualify for a future migration batch. R18 does not itself alter F1 classification or KPI artifacts.
