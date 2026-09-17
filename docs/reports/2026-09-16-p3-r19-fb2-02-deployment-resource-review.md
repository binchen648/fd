# P3-R19 FB2-02 Deployment Resource Reward Review

- Date: 2026-09-16
- Role: R
- Candidate: `a37831a43d9949c6e9bb6eddbe9ac645e7754f44`
- CandidateBase: `078d36b52fb066c64cdbbab98391273d2e06be8f`
- F1Evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- ReferenceCommit: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Verdict: `GATE_A_B_CANDIDATE_ACCEPTED`

## Findings

No blocking findings.

## Independent scope review

Candidate delta is limited to:

- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/tests/regression/fb2-deployment-resource-reward.test.ts`
- `docs/reports/2026-09-16-p3-fb2-02-deployment-resource-result.md`

No changes are present in MatchSession, Resolution Data-flow primitives, client/server projection, F1 inventory/catalog/source evidence, roster authoring, or A-owned KPI/taxonomy.

Production added-line identity audit found no character/card/owner identity routing, no `master.` / `servant.` checks, no `magic_workshop` hard-code, no printed-text parsing, and no definition-id equality routing.

## Semantic judgment

The accepted candidate is narrow and identity-free.

It accepts only:

- automatic `forced_trigger`;
- exact trigger `after_player_deployed_to_battlefield`;
- a non-empty data-driven `activation.eventLocationId`;
- matching trusted event controller and location provenance;
- no target, cost, create, lifecycle, modifier, pending/response window, or variable input;
- exactly one or two controller resource effects;
- effect types `adjust_mana` / `adjust_victory_points` only;
- fixed positive safe-integer amounts only.

Malformed sibling shapes are recognized and rejected before legacy fallback.

## Controller provenance and Ereshkigal compatibility

The candidate does not globally reinterpret `after_player_deployed_to_battlefield`.

The `event.playerId === source controller` constraint is applied only to the new candidate shape that has explicit `eventLocationId`. This is important because Ereshkigal's existing authored deployment trigger intentionally reacts when any player deploys to its battlefield and does not use this new sub-contract.

Independent focused tests confirm both behaviors:

- another player's deployment cannot fire the new own-deployment reward;
- Ereshkigal's existing any-player deployment reward remains functional.

Ordinary `after_controller_enters_location` movement events do not match the deployment contract.

## Typed settlement / atomicity judgment

Accepted rewards settle through the existing Resolution Data-flow transaction and emit typed mana / victory-point evidence with authoritative before/after/delta data.

The exact accepted primitive set has no valid second-step branch that can throw after an earlier valid positive adjustment; malformed second-effect shapes are rejected before execution. In addition, `processAbilityEvent` and Resolution Data-flow both operate on cloned state before commit. The independent malformed recognized-candidate test confirms no resource/event/revision mutation leaks on rejection.

Stable event ids remain exactly-once through the existing processed-event dedupe.

## Independent validation

- fresh dependency install: PASS (`npm ci --offline --ignore-scripts`)
- `npm.cmd run typecheck`: PASS
- focused FB2-02 + TO-11 + Ereshkigal/current complex + FB2-01 compatibility: `4 files / 58 tests PASS`
- all rules regression: `41 files / 247 tests PASS`
- deterministic generated-content verification: PASS
  - content library: `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`
  - fixture: `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence report: `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`
- full root CI: `108 files / 660 tests PASS`
- candidate diff check: PASS
- reviewer worktree clean before report creation

## Gate C

No new browser Gate C is required. The candidate changes no projection, pending interaction, reconnect, stale-command, or client-visible protocol surface.

## Non-promotion

This acceptance does not promote:

- all `GENERIC_RESOURCE_NUMERIC`;
- generic Trigger Gateway;
- command-seal adjustment;
- transfer/set/swap resource semantics;
- negative, zero, variable, target-dependent, or battle-derived resource effects;
- ordinary movement entry rewards;
- Cost/Payment beyond already accepted FB2-01;
- any F1 authoring migration.

A may synchronize this exact accepted sub-contract and record the six F1 identities from the FB2-02 handoff as eligible membership for a future S migration batch. No migration is performed by this review.