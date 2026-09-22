# P3-A FB2-33 Event Combat Outcome Relation Dispatch

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-19

## Baseline

- Exact Base: `8ca5037864fb11d98fe4a17d4ca8c9089bab2609` (R71 / FB2-32 capability acceptance synchronization)
- Formal recovery accepted: `136/944`; remaining: `808`
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

FB2-33 is B2 capability work only and earns zero frozen migration credit.

## Mechanical seam selection

Fresh post-R71 overlay over source-grounded `READY_GENERIC_EXTENSION` rows does not produce an honestly complete homogeneous S family. `AT_BATTLEFIELD` already has generic runtime support and is not re-dispatched.

The next narrow missing identity-free condition family is event combat outcome relation:

- `EVENT_PLAYER_WON_COMBAT`: present across `8` READY_GENERIC_EXTENSION identities;
- `EVENT_PLAYER_LOST_COMBAT`: present across `3` READY_GENERIC_EXTENSION identities;
- Locked Reference authoring contains `13` exact occurrences total and every occurrence is structurally type-only: `{ "type": "event_player_won_combat" }` or `{ "type": "event_player_lost_combat" }`.

The current trusted `AbilityEvent` already carries `playerId` and `battleResult: { winners, loserIds }`, so this seam can be accepted without adding any trigger, effect, target, interaction, lifecycle, modifier, consumer identity, or event producer.

## Exact capability

Add two generic condition nodes, supported only inside ability conditions:

- `{ type: "event_player_won_combat" }`
- `{ type: "event_player_lost_combat" }`

Semantics:

1. Resolve only against trusted `AbilityEvent.playerId` and trusted `AbilityEvent.battleResult`.
2. `event_player_won_combat` is true iff the known event player is listed in `battleResult.winners`.
3. `event_player_lost_combat` is true iff the known event player is listed in `battleResult.loserIds`.
4. Missing/empty/unknown event player, missing/malformed battle result, unknown player ids, duplicate ids, or contradictory winner/loser overlap fail closed rather than infer an outcome.
5. Both nodes are exact type-only shapes. Extra payload fields or aliases are unsupported.
6. Evaluation is read-only: no authoritative mutation and no domain event emission.
7. Loader acceptance must be condition-route-only and must not broaden any trigger/effect/target/interaction/lifecycle/modifier path.
8. Runtime/compiler routing remains identity-free and structural.

## Authorized scope

B2 may touch only the minimum generic rules loader/interpreter/tests plus one FB2-33 result report.

No F1 authoring migration, consumer archive, production pack registration/generated product, `data/phase3`, A-owned taxonomy/KPI, app behavior, merge, or retarget.

Required evidence:

- exact-shape loader acceptance for both condition nodes under `conditions`;
- rejection/disable when either node appears under `effects` or another non-condition route;
- payload-bearing near-matches rejected/disabled;
- known event player in winners => won true / lost false;
- known event player in loserIds => lost true / won false;
- missing/unknown actor and missing/malformed/contradictory outcome fail false before mutation;
- no state mutation or emitted event from condition evaluation;
- unsupported trigger remains unsupported when paired with either condition;
- identity/hash/Reference-handler audit clean;
- focused tests, typecheck, rules regression selection, official CI, content validation, deterministic generated-content verification, Locked Reference verification, client build, `git diff --check`, final cleanliness.

Formal recovery accepted remains `136/944`; historical `P3-FM09-RECOVERY` remains `MIGRATION_BLOCKED`.
