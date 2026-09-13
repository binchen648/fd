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
- Direct post-result / battle-ended event consumers: **13** = **11 per-battlefield result consumers + 2 phase-terminal `after_battle_ended` consumers**.
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
2. Battle Result participation, winner-eligibility exclusion, winner/loser outcome, loss-effect policy, tie and margin ownership, with explicit no-participant skip and fail-closed no-eligible-winner admission;
3. TO-03 result-event scheduling ownership;
4. exactly-once battle-phase Recon reward plan/receipt at power-resolution start;
5. immutable base battlefield scoring plan with closed typed VP sources and exactly-once scoring receipt;
6. normative phase-wide `post_all_battlefield_scoring` barrier after every supported battlefield base scoring receipt and before ordinary personal result/win/loss trigger settlement;
7. typed Resource settlement for personal VP/mana/seals after the base receipt;
8. scoring-derived `after_controller_gains_victory` producer/trigger handoff;
9. exactly-once phase-terminal `after_battle_ended` event and cleanup handoff.

The 13 result consumers may later consume the accepted result-event envelope. The remaining 26 rows stay with their real external owner and are not made runtime-ready by this spec.

## Mechanical Checks

- 39 semantic-axis rows: PASS.
- 28 unique cards: PASS.
- 13 direct post-result/ended consumers: PASS.
- cross-axis `after_controller_gains_victory` producer dependency: PASS, covered without denominator change.
- win eligibility vs loser outcome vs loss-effect suppression: orthogonalized; true nonparticipants are neither winner nor loser.
- all-battlefields-score-before-post-battle invariant: explicit via phase-wide `post_all_battlefield_scoring`; no battlefield post-battle trigger can settle before every supported battlefield base scoring receipt exists.
- `after_battle_ended`: phase-terminal and exactly once per `battlePhaseResolutionId`, never per battlefield.
- Recon reward: separate phase-level exactly-once plan/receipt.
- base VP source union: one combined event+competition `base_pool_share` plus reviewed-location variant; no generic `reviewed_rule` or ambiguous `battle_vp` source.
- base-pool rounding: exactly one `ceil((eventVpPool + competitionVpPool) / winnerCount)` per winner, only when `winnerCount >= 1`; event/competition attribution cannot change the total.
- zero-winner boundary: empty participation skips result/scoring; non-empty participation with zero eligible winners is typed-blocked as `NO_ELIGIBLE_WINNER_POLICY_REQUIRED` with no guessed margin/scoring/military/events and no legacy fallback.
- semantic-axis vs historical BATTLE_RESULT exact set: PASS, difference 0.
- canonical schema arbitrary `unknown` payload: none.
- mutable `consumed` flag inside immutable scoring plan: none.
- fail-closed/no legacy fallback requirement: present.
- production runtime files changed: none.
- `git diff --check`: PASS before review handoff.

No Gate A/B/C promotion and no 39-row runtime migration is claimed. Independent reviewer judgment is required.
