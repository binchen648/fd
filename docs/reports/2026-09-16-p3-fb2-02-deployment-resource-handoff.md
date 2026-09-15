# P3-FB2-02 Deployment Resource Reward Handoff

- Date: 2026-09-16
- Role: A
- Status: READY_FOR_B2
- RuntimeBaseline: `0d4426d8565157121a3e86f4cc6e10396c9366be`
- AcceptedFB2_01Candidate: `36670ca3d57331b5354fca35deadc1e34bf5a1db`
- AcceptedFB2_01Review: `30c1e5365eeba102853a7f20f5bad139b3953acc`
- F1Evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- RuntimeRequest: `runtime-capability-6220d123d8e1` / `GENERIC_RESOURCE_NUMERIC`
- ReferenceCommit: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Post-FB2-01 membership audit

The accepted fixed-controller mana payment component does not yet create an honest P3-FM01 batch.

- F1 remains accepted at `944/944` identities.
- `GENERIC_COST_PAYMENT` request membership: `30` F1 identities.
- MANA-axis members: `24`.
- Exact fixed positive integer mana members provable from final source overlays: `15`.
- Non-literal / unresolved / non-fixed MANA members: `9`.
- Every one of the `15` fixed-literal members still has at least one additional capability or reviewed-special dependency.
- Their F1 `currentAcceptanceContracts`, `inheritedAcceptanceContracts`, and `partialAcceptanceContracts` do not provide an independently accepted complete parent route for migration.
- Therefore post-FB2-01 full-skill migration-ready intersection is `0`.

P3-FM01 must remain undispatched. FB2-01 acceptance is real runtime progress, but it must not be converted into synthetic F4 burn-down.

## Why Resource Numeric is next

The collaboration design orders dependency wave 1 as Resource Numeric and Cost before Card Zone / Movement / Card Action / Interaction waves.

The final F1 catalog has seven identities where `GENERIC_RESOURCE_NUMERIC` is the only capability request remaining. Six of those share one clean source-grounded rule family: a fixed resource reward when the controller is deployed to the magic workshop.

Exact F1 membership for this sub-capability:

1. `servant.anastasia.skill.sc-anastasia-1` — deployment reward `+1 mana, +2 VP`
2. `servant.andersen.skill.sc-andersen-1` — deployment reward `+1 mana, +2 VP`
3. `servant.avicebron.skill.sc-avicebron-3` — deployment reward `+1 mana, +2 VP`
4. `servant.davinci.skill.sc-davinci-4` — deployment reward `+1 mana`
5. `servant.semiramis.skill.sc-semiramis-2` — deployment reward `+1 mana, +2 VP`
6. `servant.shakespeare.skill.sc-shakespeare-1` — deployment reward `+1 mana, +2 VP`

Explicitly not in this sub-capability:

- `servant.davinci.skill.sc-davinci-8` — immediate command-seal recovery, not a deployment-location reward.
- any variable amount, negative adjustment, transfer, set, swap, command-seal adjustment, cost payment, battle-derived reward, or target-dependent resource effect.

## Existing runtime foundation

The current runtime already has:

- typed `adjust_mana` / `adjust_victory_points` Resolution Data-flow primitives;
- atomic cloned resolution execution;
- a trusted MatchSession deployment producer emitting `after_player_deployed_to_battlefield` with `playerId + locationId` after legal deployment;
- loader support for `activation.eventLocationId` on `after_player_deployed_to_battlefield`;
- stable event replay dedupe;
- an accepted narrow location-entry Resource Numeric trigger for a single mana adjustment.

The runtime does **not** yet have the exact deployment reward contract required here. In particular, `after_player_deployed_to_battlefield` is not covered by the existing `after_controller_*` controller-scope shortcut, so FB2-02 must prove that another player's deployment cannot fire this controller's reward.

## Exact FB2-02 semantic contract

A candidate is eligible only when all of the following are true:

- trigger kind is the runtime's forced/automatic trigger form;
- trigger is exactly `after_player_deployed_to_battlefield`;
- `activation.eventLocationId` is a non-empty trusted location id;
- no phase action window, manual response window, target, cost, create, lifecycle, rule modifier, variable, or pending interaction is present;
- effect count is exactly `1` or `2`;
- every effect is `adjust_mana` or `adjust_victory_points`;
- every effect targets the controller (explicitly or by accepted default);
- every amount is a fixed positive safe integer literal;
- event `playerId` must equal the source card controller;
- event `locationId` must equal `activation.eventLocationId`;
- all effects execute through the existing typed Resolution Data-flow transaction;
- any same-event execution failure rolls back the whole reward stage;
- replay of the same trusted event id is exactly-once.

The classifier and executor must be identity-free. `magic_workshop` is migration data, not a runtime hard-coded identity.

## Required proof

B2 must prove at minimum:

1. renamed card/ability identities classify and execute identically;
2. one-effect fixed mana deployment reward succeeds with typed `mana_adjusted` evidence;
3. two-effect fixed mana + VP deployment reward succeeds atomically with typed evidence for both resources;
4. wrong deployment location does not trigger;
5. another player's deployment does not trigger;
6. ordinary movement into the same location does not trigger;
7. duplicate trusted event id does not pay twice;
8. malformed amount / zero / negative / expression / third effect / non-resource effect / command-seal effect fail closed and cannot fall through legacy mutation;
9. a forced same-stage failure after the first resource primitive leaves both resources and event evidence unchanged;
10. existing TO-11 Shinji location-entry trigger, Ereshkigal deployment behavior, FB2-01 cost tests, and current root baseline remain green.

## Files

B2 may touch:

- `packages/rules/src/ability/interpreter.ts`
- one focused regression file for FB2-02
- `docs/reports/2026-09-16-p3-fb2-02-deployment-resource-result.md`

B2 must not touch:

- `packages/rules/src/match-session.ts`
- `packages/rules/src/ability/resolution-dataflow.ts` unless an independently justified defect is found and A re-dispatches scope
- client/server projection or interaction protocol
- F1 inventory/catalog/source evidence
- A-owned KPI/taxonomy
- roster authoring / migration files

No new browser Gate C is required if the task stays server-side and does not change projection, reconnect, stale-command, or pending-interaction surfaces.

## Completion status

- `IMPLEMENTATION_COMPLETE_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`