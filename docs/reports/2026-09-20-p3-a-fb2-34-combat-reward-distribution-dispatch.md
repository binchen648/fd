# P3-A FB2-34 Combat Reward Distribution Dispatch

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-20

## Baseline

- Exact Base: `c6f9cede9423c29725daf93a59dcbf79d6bf1a08` (R72 / FB2-33 capability acceptance synchronization)
- Formal recovery accepted: `136/944`; remaining: `808`
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

FB2-34 is B2 capability work only and earns zero frozen migration credit.

## Migration-closure-first selection

A fresh post-R72 dependency overlay was recomputed over the remaining source-grounded `READY_GENERIC_EXTENSION` population. The raw inventory has `66` block-free READY_GENERIC_EXTENSION rows; `3` already have current canonical authoring (`master.ciel.skill.s2`, `servant.drake.skill.sc-drake-2`, `servant.drake.skill.sc-drake-3`), leaving the known `63` true remaining rows.

The closure search intentionally prioritizes the smallest number of missing formal seams, not global occurrence count. Lifecycle-bearing Helena/Nursery `skill_use` restrictions were rejected as the next closure target because their parent envelopes still depend on lifecycle shapes that are not broadly accepted by the scoped TO-12 evidence.

The nearest honest closure target is `servant.stheno.skill.sc-stheno-2`:

- FB2-33 now provides the exact type-only `event_player_won_combat` condition;
- the existing accepted battle-result / trigger / typed VP resource substrate covers its win-reward clause without a new target, interaction, binding, or lifecycle family;
- its semantic normalization has no lifecycle, target, cost, interaction, binding, or visibility axis;
- the sole remaining capability gap is `rule:combat_reward_distribution:replace`.

Locked Reference authoring contains exactly `2` `combat_reward_distribution` modifiers total. Both use the same structural core `replace + controller + whenControllerWins=true + full_reward_each`. Only Stheno is the static no-lifecycle form. The other occurrence belongs to Napoleon and carries effect installation plus `this_round` lifecycle and other battle modifiers; FB2-34 must not promote that parent route or consumer.

If FB2-34 is independently accepted and A-synchronized, A must immediately recompute the one-card Stheno closure and dispatch S if no new blocker is found. Do not select another unrelated B2 seam first.

## Exact capability

Add one identity-free battle-scoring modifier semantic, accepted only for the exact static passive envelope needed by this closure:

```text
kind: passive
activation: empty/default
conditions: []
targets: []
cost: []
effects: []
creates: []
ruleModifiers: exactly one
  operation: replace
  rule: combat_reward_distribution
  scope:
    subject: controller
    whenControllerWins: true
    mode: full_reward_each
  no modifier-local lifecycle
ability lifecycle: empty/default
responseWindow: empty/default
limit: empty/default
execution.mode: automatic
```

The modifier applies only while its authoritative physical source card is active and face-up. Runtime routing must discover the exact structural modifier from active authoritative card definitions; it must not route by card ID, owner ID, ability ID, name, printed text, F1 hash, Reference hash, or Reference handler.

### Scoring semantics

When at least one battle winner controls an active source carrying this exact modifier:

1. winner selection, exclusions, defeat/loss semantics, military-result settlement, and battle Power are unchanged;
2. the battle/event VP pool that would normally be divided among winners is not divided: each winner receives the full event battle VP amount;
3. an applicable competition VP pool is likewise not divided: each winner receives the full competition amount;
4. an applicable location VP pool is likewise not divided: each winner receives the full location amount;
5. per-player bonuses that are already individually assigned (for example Remote Operation) are not multiplied or rewritten;
6. the rule is idempotent if multiple winning controllers carry an equivalent exact modifier: distribution switches to `full_reward_each` once, never stacks multiplicatively;
7. the modifier does nothing if its controller is not one of the authoritative winners, if the source is inactive/face-down/unavailable, or if the shape is malformed;
8. scoring evidence remains deterministic and continues to flow through the existing `BattleResult` / `vpReward` / `vpAdjustments` settlement path.

For a single winner, the modifier is observationally neutral because there is no split to replace.

## Fail-closed boundary

FB2-34 must reject/disable near-matches rather than silently generalize. At minimum:

- wrong operation or rule;
- `subject` other than `controller`;
- `whenControllerWins` missing or not exactly `true`;
- `mode` other than `full_reward_each`;
- extra scope payload;
- modifier-local lifecycle / installation metadata;
- additional rule modifiers on the same accepted parent;
- non-passive parent, non-empty activation, conditions, targets, costs, effects, creates, lifecycle, response, or limit;
- host-adjudicated execution;
- inactive, face-down, stale, missing, or non-authoritative source card.

This task must not accept Napoleon's effect-installed/lifecycle-bearing modifier envelope.

## Authorized scope

B2 may touch only the minimum generic loader / battle-scoring runtime / focused tests plus one FB2-34 result report. A narrow exported structural helper may be added only if needed for unit testing or clean reuse.

No production consumer authoring, generated product/pack registration, `data/phase3`, taxonomy/KPI, unrelated lifecycle, trigger, condition, target, interaction, modifier family, app behavior, merge, or retarget.

Required evidence:

- exact loader acceptance of the static passive modifier envelope;
- malformed/extended parent or modifier shapes rejected/disabled;
- multi-winner default split versus `full_reward_each` behavior for event, competition, and location reward pools;
- losing controller does not alter distribution;
- inactive/face-down source does not alter distribution;
- one-winner neutrality;
- duplicate equivalent modifiers are idempotent;
- Remote Operation or other already-individual per-player adjustment is not duplicated;
- winner/military/defeat facts are unchanged;
- no mutation outside ordinary battle-result construction/scoring settlement;
- production identity/hash/Reference-handler audit clean;
- focused tests, typecheck, rules regression selection, official CI, content validation, deterministic generated-content verification, Locked Reference verification, client build, `git diff --check`, final cleanliness.

Formal recovery accepted remains `136/944`; historical `P3-FM09-RECOVERY` remains `MIGRATION_BLOCKED`.
