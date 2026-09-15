# P3-A FM04 Independent Action Family Reconciliation - 2026-09-16

Role: Codex A
Status: SPECIAL_FAMILY_RECONCILIATION_CANDIDATE
Base: R30 / FM03 accepted `27a112888058a3fe4dd5882bc95054e7346de4a5`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Exact family

A independently reconciles the exact eleven-card Archer Independent Action family:

- `servant.atalanta.skill.sc-atalanta-3`
- `servant.baobhan.skill.sc-baobhan-3`
- `servant.chiron.skill.sc-chiron-1`
- `servant.emiya-alt.skill.sc-emiya-alt-1`
- `servant.euryale.skill.sc-euryale-1`
- `servant.gil.skill.sc-gil-1`
- `servant.ishtar.skill.sc-ishtar-3`
- `servant.napoleon.skill.sc-napoleon-3`
- `servant.robin.skill.sc-robin-1`
- `servant.tomoe.skill.sc-tomoe-1`
- `servant.tristan.skill.sc-tristan-3`

Frozen F1 printed/source text SHA-256 for all eleven is `792fe5ed9a320b58e58103d05aaf9ae27755c5940c159bf47733f04d36da7bc5`.

Locked Reference explicitly lists all eleven in the same `independentActionSkillIds` array and maps every member to the same `core.independent-action` handler. Gilgamesh has no Reference identity-specific execution branch; its differently named F1 blocker (`gil_independent_action_rule`) does not represent different printed mechanics.

Locked static metadata is uniform for all eleven:

- `typeLabel=特殊`;
- `cost=0`;
- `basePower=6`;
- historical `requirement=0`.

Current canonical authoring contains exactly one member: Tomoe. The other ten are absent. Sion `master.sion.skill.s7` / Independent Action EX is not part of this family and is excluded.

## Canonical semantic decomposition

The existing reviewed Tomoe card is the canonical representative for the exact family text and decomposes it into exactly two executable abilities:

1. `phase_action`, action/controller window, condition `controller_seat_in_first_half`, controller `adjust_victory_points(+3)`;
2. forced `after_controller_loses_battle`, controller `adjust_victory_points(-5)`, with the exact `ignore / effect_prevention / this_effect / explicit_exception` modifier.

No third printed clause or hidden identity semantic is introduced by this reconciliation.

## Existing independent runtime acceptance

No new runtime contract is requested.

- TO08 current-lineage Resource Numeric independently accepts Tomoe `sc-tomoe-1.independent-action` on the real production path. The route is structural/identity-free and uses the common condition evaluator for `controller_seat_in_first_half` before typed VP settlement.
- B21 / R15 independently accepts the exact forced battle-loss `-5 VP` semantic with the explicit unpreventable exception, post-scoring loser provenance, typed VP evidence, floor behavior, exactly-once handling, reconnect/stale evidence, and fail-closed malformed siblings.

Fresh A recertification on the R30 lineage:

- `npm.cmd run typecheck`: PASS;
- `resource-numeric-core-direct-action.test.ts` + `battle-loss-unpreventable-vp-trigger.test.ts`: `10/10 PASS`.

## F1 special-blocker reconciliation request

The ten missing siblings remain frozen as `SPECIAL_HANDLER_CANDIDATE` because F1 predates the current accepted split runtime and records `SPECIAL_EFFECT:independent_action_rule`; Gil records `SPECIAL_EFFECT:gil_independent_action_rule` despite identical source text and the same Reference family.

A does not mutate frozen F1. Instead, R31 is asked to judge whether those historical special blockers are fully discharged for this exact eleven-member family by the independently accepted TO08 + B21 semantics represented by canonical Tomoe.

This is not broad Special Handler acceptance. It does not cover Independent Action EX, other Archer skills, generic unpreventable effects, generic battle-loss effects, or arbitrary Resource Numeric actions.

## Prospective FM04 gate

If and only if R31 accepts this exact reconciliation, A may dispatch P3-FM04 at batch size 11:

- 1 pre-existing canonical representative: Tomoe;
- 10 newly migrated exact siblings;
- no runtime edits;
- no substitution or same-owner sibling migration.

Until R31 judgment, FM04 remains undispatched.
