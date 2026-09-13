# P3-TO-14 Battle/Resource Envelope Spec Result

- Date: 2026-09-14
- Task: P3-TO-14
- Status: SPEC_REVIEW_READY
- Base: `3460b0a1fc5b1bf974847c62f29a264e28329f7b`
- Scope: docs-only

## Outputs

- `docs/audits/2026-09-14-p3-to-14-battle-integration-map.md`
- `docs/plans/2026-09-14-p3-to-14-battle-resource-envelope.md`
- `docs/reports/2026-09-14-p3-to-14-reviewer-checklist.md`

## Denominator

- Current corrected semantic-axis: **39 BATTLE_INTEGRATION abilities / 28 cards**.
- Historical mechanic-family membership: **39 / 28**.
- Exact set difference: **0**.
- Direct post-result / battle-ended event consumers: **13**.
- Other broader battle integration rows: **26**.
- Cross-axis Scoring/Battle strict producer dependency outside 39: **1** `after_controller_gains_victory` consumer.

Cluster split:

- RESULT_EVENT_CONSUMER: 13
- BATTLE_STATE_OR_COMBAT_INTEGRATION: 24
- BATTLE_MODIFIER_EVENT: 1
- BATTLE_DEPLOY_EVENT: 1

Current runtime distribution is evidence only and receives no promotion in this task.

## Contract Result

The spec separates:

1. TO-15 final participant power + immutable trace input;
2. Battle Result participation, winner-eligibility exclusion, winner/loser outcome, loss-effect policy, tie and margin ownership;
3. TO-03 result-event scheduling ownership;
4. immutable battle scoring plan and exactly-once scoring receipt;
5. typed Resource settlement for VP/mana/seals;
6. scoring-derived `after_controller_gains_victory` producer/trigger handoff;
7. terminal `after_battle_ended` event and cleanup handoff.

The 13 result consumers may later consume the accepted result-event envelope. The remaining 26 rows stay with their real external owner and are not made runtime-ready by this spec.

## Mechanical Checks

- 39 semantic-axis rows: PASS.
- 28 unique cards: PASS.
- 13 direct post-result/ended consumers: PASS.
- cross-axis `after_controller_gains_victory` producer dependency: PASS, covered without denominator change.
- win eligibility vs loser outcome vs loss-effect suppression: orthogonalized; true nonparticipants are neither winner nor loser.
- semantic-axis vs historical BATTLE_RESULT exact set: PASS, difference 0.
- canonical schema arbitrary `unknown` payload: none.
- mutable `consumed` flag inside immutable scoring plan: none.
- fail-closed/no legacy fallback requirement: present.
- production runtime files changed: none.
- `git diff --check`: PASS before review handoff.

No Gate A/B/C promotion and no 39-row runtime migration is claimed. Independent reviewer judgment is required.
