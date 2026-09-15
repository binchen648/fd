# FD Phase 3 Throughput Baseline

- Document Role: REPORT
- Status: BASELINE_CANDIDATE
- Date: 2026-09-09
- Scope: current Phase 3 throughput facts from real `data/authoring` and existing audit scripts
- Implementation Status: DOCUMENTATION_ONLY
- Acceptance Status: No runtime, card, flow, mechanic family, or release status is promoted by this report.

## Inputs

Read before this baseline:

- `docs/FD-DOCUMENT-ROADMAP.md`
- `docs/rules/FD-Game-Rules-Final.md`
- `docs/plans/fd-rules-conformance-and-acceptance.md`
- `docs/plans/fd-card-engine-stabilization-plan.md`
- `docs/plans/fd-phase-3-mechanic-family-rollout-plan.md`
- `docs/plans/fd-effect-result-binding-plan.md`
- `docs/plans/fd-golden-card-and-flow-acceptance-plan.md`
- `docs/audits/fd-skill-mechanic-family-matrix.md`
- `docs/audits/fd-skill-semantic-axis-matrix.md`
- `docs/audits/fd-skill-primitive-conformance-matrix.md`
- `docs/audits/fd-skill-rule-normalization-audit.md`
- `docs/audits/fd-rule-conformance-matrix.md`
- `docs/audits/fd-rule-interaction-matrix.md`
- `docs/audits/fd-flow-runtime-inventory.md`
- latest Phase 3 reports under `docs/reports/`

## Commands Run

```powershell
node docs/audits/fd-skill-mechanic-family-inventory.mjs
node docs/audits/fd-resource-numeric-core-direct-action-inventory.mjs
node docs/audits/fd-card-zone-core-direct-action-inventory.mjs
node docs/audits/fd-card-action-play-inventory.mjs
node docs/audits/fd-card-action-add-to-attack-inventory.mjs
node docs/audits/fd-card-action-activate-inventory.mjs
node docs/audits/fd-card-action-close-inventory.mjs
node docs/audits/fd-skill-semantic-axis-inventory.mjs
```

The semantic-axis inventory is the current source for Trigger/Lifecycle/Interaction gateway priority. Earlier temporary trigger/kind, lifecycle/kind, and interaction-template buckets are retained below only as historical invalidated taxonomy notes.

## Current Total

| Metric | Count |
|---|---:|
| Authoring archives | 14 |
| Cards | 46 |
| Abilities | 92 |

## Mechanic Family Counts

| Family | Abilities | Cards |
|---|---:|---:|
| `BATTLE_RESULT` | 39 | 28 |
| `CARD_ACTION_SEMANTICS` | 13 | 10 |
| `CARD_ZONE` | 14 | 13 |
| `COST_PAYMENT` | 9 | 9 |
| `HIDDEN_INFORMATION` | 21 | 16 |
| `HISTORY_USAGE` | 16 | 15 |
| `INTERACTION` | 48 | 34 |
| `LIFECYCLE` | 49 | 36 |
| `MODIFIER` | 24 | 17 |
| `MOVEMENT` | 21 | 18 |
| `POWER` | 18 | 16 |
| `RESOURCE_NUMERIC` | 18 | 12 |
| `RESULT_BINDING` | 2 | 2 |
| `SPECIAL_SUBSYSTEM` | 18 | 13 |
| `TARGET_SELECTION` | 11 | 11 |
| `TRIGGER` | 58 | 34 |

Multi-family membership is allowed; these counts are not additive.

## Top-Level Effect Counts

| Effect | Count |
|---|---:|
| `reveal_information` | 11 |
| `record_master_directive` | 10 |
| `adjust_command_seals` | 7 |
| `adjust_victory_points` | 7 |
| `branch` | 6 |
| `adjust_mana` | 5 |
| `move_card` | 5 |
| `create_card` | 3 |
| `move_player` | 3 |
| `create_modifier` | 2 |
| `draw_cards` | 2 |
| `move_all_remaining` | 2 |
| `play_selected_cards` | 2 |
| singletons | 25 effect names |

## Legacy Consumers And Semantic Runtime Consumers

Current implementation-candidate semantic routes:

| Batch / Contract | Eligible Migrated Candidates | Legacy Before | Legacy After | New Semantic After |
|---|---:|---:|---:|---:|
| `RESOURCE_NUMERIC_CORE_DIRECT_ACTION` | 3 | 3 | 0 | 3 |
| `CARD_ZONE_CORE_DIRECT_ACTION` | 2 | 2 | 0 | 2 |
| `CARD_ACTION_PLAY` | 1 | 1 | 0 | 1 |
| `CARD_ACTION_PLAY_SOURCE_RESPONSE` | 1 | 1 | 0 | 1 |
| `CARD_ACTION_ADD_TO_ATTACK` | 1 | 1 | 0 | 1 |
| `CARD_ACTION_ACTIVATE` | 1 | 1 | 0 | 1 |
| `CARD_ACTION_CLOSE` | 1 | 1 | 0 | 1 |
| **Total candidate semantic consumers** | **10** | **10** | **0** | **10** |

Planning baseline:

- total abilities: 92;
- semantic-routed implementation candidates: 10;
- remaining abilities requiring legacy/special/shared transitional review: approximately 82;
- independent Gate promotions: none recorded by this report.

## Card-Specific / Special Handlers

Special subsystem strict matrix count: 18 abilities / 13 cards.

Conservative text/effect estimate from fresh scan: 30 abilities have special-like markers such as directive, independent deck, replacement, bottom-deck swap, random discard, terrain/VP transfer, soul/return-silence, or similar subsystem behavior. Use 18 as the strict matrix denominator and 30 as a risk estimate, not an acceptance count.

Observed legacy/special owner areas:

- `extended-effects.ts`;
- `record_master_directive`;
- independent deck operations;
- before-resolve bottom-card swap;
- false attendant book replacement;
- return silence / soul drag;
- terrain multiplier / VP transfer;
- random discard and opponent power set;
- raw `modeState` side stores.

## Unsupported / Skipped Nodes

Existing per-batch skip counts:

| Inventory | Total In Scope | Eligible | Skipped |
|---|---:|---:|---:|
| Resource numeric direct action | 17 | 3 | 14 |
| Card zone direct action | 8 | 2 | 6 |
| Card action PLAY | 7 | 1 | 6 |
| Card action ADD_TO_ATTACK | 7 | 1 | 6 |
| Card action ACTIVATE | 7 | 1 | 6 |
| Card action CLOSE | 7 | 1 | 6 |

Common skip reasons:

- trigger-owned;
- battle-result-owned;
- hidden/private information;
- cost/payment or pending decision;
- lifecycle/cleanup/source-close;
- modifier/power;
- special subsystem;
- different card-action contract.

## Gate Status

Current rule matrix denominator: 63 candidate rule units.

| Status | Count |
|---|---:|
| `E2E_VERIFIED` | 0 |
| `SCENARIO_VERIFIED` | 2 |
| `COMPONENT_VERIFIED` | 13 |
| `IMPLEMENTED_UNVERIFIED` | 4 |
| `FAILED` | 0 |
| `BLOCKED` | 0 |
| `NOT_VERIFIED` | 44 |

This report does not change those statuses.

Current Phase 3 candidate batches have implementer evidence only. They remain `IMPLEMENTATION_COMPLETE_CANDIDATE` until independent reviewer promotion.

## Trigger Baseline

Previous trigger/kind taxonomy: `INVALID FOR PRIORITY`. It mixed ability kind, timing/window hooks, continuous passives, and requirement checks into Trigger counts.

Invalidated historical buckets:

| Bucket | Count |
|---|---:|
| `phase_action` | 34 |
| `while_active` | 10 |
| `on_use_declared` | 9 |
| `when_play_requirements_checked` | 8 |
| `on_card_played` | 6 |
| `after_controller_loses_battle` | 4 |
| `game_start` | 4 |
| `after_battle_result_determined` | 3 |
| `after_controller_wins_battle` | 3 |
| `after_battle_ended` | 2 |

Corrected strict Domain Event Trigger baseline:

| Domain Event Trigger | Count |
|---|---:|
| `on_use_declared` | 9 |
| `on_card_played` | 6 |
| `after_controller_loses_battle` | 4 |
| `game_start` | 4 |
| `after_battle_result_determined` | 3 |
| `after_controller_wins_battle` | 3 |
| `after_battle_ended` | 2 |
| `after_controller_enters_location` | 1 |
| `after_controller_first_loses_battle` | 1 |
| `after_controller_gains_victory` | 1 |
| `after_controller_loses_all_command_seals` | 1 |
| `after_player_deployed_to_battlefield` | 1 |
| `before_situation_or_event_resolves` | 1 |

Corrected coverage:

- strict Domain Event Trigger abilities: 37;
- Top 5 corrected trigger types: 26 abilities;
- Top 8 corrected trigger types: 30 abilities;
- Top 12 corrected trigger types: 36 abilities.

Separated non-trigger buckets for KPI:

| Bucket | Correct Axis |
|---|---|
| `phase_action` | Ability Kind / Flow Timing / Ability Legality |
| `while_active` | Continuous Passive / Source-Active Requirement / Modifier |
| `when_play_requirements_checked` | Requirement Check Hook |
| `when_formula_condition_met` | Continuous Formula Condition |
| `controller_combat_action_window` | Ability Window / Response Window |
| `when_power_calculation_applied` | Modifier Calculation Hook |

## Lifecycle Baseline

Previous lifecycle/kind taxonomy: `INVALID FOR PRIORITY`. Ability kinds are not lifecycle policies.

Invalidated historical buckets:

| Bucket | Count |
|---|---:|
| `kind:phase_action` | 31 |
| `kind:passive` | 16 |
| `kind:forced_trigger` | 15 |
| `kind:declaration_reveal` | 9 |
| `kind:phase_action + lifecycle effect` | 3 |
| `unique optional trigger` | 3 |

Corrected explicit lifecycle/reset baseline:

- explicit lifecycle/reset abilities: 11;
- policy memberships: 22, because one ability can carry multiple lifecycle dimensions.

| Lifecycle / Reset Policy | Memberships |
|---|---:|
| `source_or_reset_marker` | 7 |
| `limit:this_card` | 4 |
| `duration:while_card_active` | 3 |
| `limit:unique_keyword_group` | 3 |
| `cleanup:when_card_leaves_active_area` | 2 |
| `duration:round_count` | 1 |
| `cleanup:expire_after_duration` | 1 |
| `cleanup:remain_active` | 1 |

## Interaction Template Baseline

Previous interaction-template taxonomy: `INVALID FOR PRIORITY`. Timing/event buckets are not Interaction templates unless they require player choice, confirmation, response, ordering, or amount selection.

Invalidated historical buckets:

| Template | Count |
|---|---:|
| no interaction template | 21 |
| `on_use_declared + hidden` | 9 |
| `while_active` | 9 |
| `when_play_requirements_checked` | 8 |
| `on_card_played` | 5 |
| `game_start` | 4 |
| `after_battle_result_determined` | 3 |
| `after_controller_loses_battle` | 3 |
| `after_controller_wins_battle` | 3 |
| branch | 2 |

Corrected interaction baseline:

| Interaction Shape | Count |
|---|---:|
| explicit target abilities | 11 |
| target type `card_instance` | 7 |
| target type `location` | 3 |
| target type `choice` | 1 |
| target type `player` | 1 |
| response / optional response-window abilities | 7 |
| branch / yes-no candidates | 5 |
| explicit target, response/window, or branch union | 20 |
| strict target-based PendingInteraction | 11 |

Current KPI uses the corrected union count for Interaction semantic risk and the strict target-based count for PendingInteraction runtime pressure.

## Core / Special Split

Use two numbers:

- strict matrix split: 74 non-special / 18 special subsystem abilities;
- conservative risk split: 62 core-like / 30 special-like abilities.

The strict split is better for roadmap KPIs. The conservative split is better for scheduling risk.

## Baseline Conclusion

The current Phase 3 throughput blocker is not raw primitive absence. It is the lack of reusable gateway contracts, automated evidence, and burn-down reporting around corrected Domain Event Trigger, explicit Lifecycle/Reset/Persistence, explicit Interaction/Pending semantics, Result Binding, and projection/reconnect.

Permitted final status:

`PHASE_3_THROUGHPUT_OPTIMIZATION_CANDIDATE`

## P3-A03 TO-03 Synchronization — 2026-09-14

- P3-TO-03 Trigger Gateway: `SPEC_ACCEPTED` at spec `ac70c33cb943d99d02f1f7077d80b36337014439`, R evidence `6ce17aab18ea20cec7e5fcfc6efb4fc5f6384f6e`.
- Correct denominator remains `37` strict Domain Event Trigger abilities across `13` event types.
- Fresh A raw coverage remains `new=12 / legacyExecute=3 / legacyResolve=49 / dual=0`; accepted aggregate remains `new=13 / legacyExecute=3 / legacyResolve=48 / dual=0`. TO-03 contributes no runtime delta.
- Fresh compiled evidence uses definition hash `5aa5a186bb201ce1f491cb6f38907a6267a4f30775113d9dd95651d58ba735d2` with `0` blocking compile issues after the accepted CI baseline repair.
- P3-B07 Trigger-spec dependency is satisfied and inactive existing-card activation scope is confirmed, but B07 remains `WAIT_RUNTIME_HOT_FILE_OWNERSHIP` because `fd-b11-repair1` still has uncommitted shared runtime hot-file edits.
- P3-TO-04 Lifecycle Policy Gateway is dispatched `READY_SPEC_OWNER` in the specification-only lane with corrected denominator `11`; runtime authorization remains `NONE`.
## P3-A03 TO-04 Synchronization — 2026-09-14

- P3-TO-04 Lifecycle Gateway: `SPEC_ACCEPTED` at spec `b46cfa4439c27112d14066e2239e7524f5a1e137`, R evidence `d1e13d84b31bcbb57a6326ce9ea803fa877c651c`.
- Correct denominator remains `11` explicit lifecycle/reset abilities and `22` lifecycle policy memberships.
- Fresh A raw coverage remains `new=12 / legacyExecute=3 / legacyResolve=49 / dual=0`; accepted aggregate remains `new=13 / legacyExecute=3 / legacyResolve=48 / dual=0`. TO-04 contributes no runtime delta.
- Compiled evidence remains definition hash `5aa5a186bb201ce1f491cb6f38907a6267a4f30775113d9dd95651d58ba735d2` with `0` blocking issues.
- P3-B08 Lifecycle-spec dependency is satisfied, but B08 remains `WAIT_RUNTIME_HOT_FILE_OWNERSHIP` because `fd-b11-repair1` still has uncommitted edits in shared runtime hot files.
- P3-B07 remains blocked by the same hot-file ownership conflict.
## P3-A03 TO-12 Synchronization — 2026-09-14

- P3-TO-12 Lifecycle Runtime: `REVIEW_ACCEPTED` at runtime `da563815415e5f6240a6a0b9f62f6310e2c1146e`, independent R2 evidence `26dc0b2ddcff4d0786f3c08800ef0030c0e606d2`.
- External Card Zone/source-state policy dependency is independently accepted at policy candidate `0b8c6bf611447b416581694d807b9bb52badc30b`, reviewer evidence `f7435cca3d884357c7fc2aeb829610421f8e357a`.
- Correct Lifecycle denominator remains `11` explicit lifecycle/reset abilities and `22` lifecycle policy memberships; only the SC3 source-active representative is synchronized as migrated by this review.
- Fresh A raw coverage on the accepted runtime remains `new=12 / legacyExecute=3 / legacyResolve=49 / dual=0`; no classifier rule was changed and no synthetic global legacy delta is inferred for the lifecycle row.
- Scoped R-accepted TO-12 transition: migrated `1`, dual runtime `0`, Gate A/B/C all accepted for SC3 only.
- Fresh compiled evidence uses definition hash `26167661823b52de598c77a59df4d05440a6bfced7d68cd3e04d11353d72dbaa` with `70` cards, `14` characters, and `0` blocking issues.
- Coverage artifact now records the accepted source-validity metadata (`kind=accepted_source_state_policy`, `owner=card_zone_source_state`, policy `fd.card-zone.active-card-source.v1`) while preserving the raw runtime counters above.
- P3-TO-12 releases the runtime hot-file lane. P3-TO-13 remains `WAIT_TO07`; P3-TO-07 is the next prerequisite lane.
- No other Lifecycle/reset row inherits migration or Gate acceptance from SC3.
## P3-A03 TO-07 Synchronization — 2026-09-14

- P3-TO-07 Gate C Factory: `REVIEW_ACCEPTED` at factory candidate `5515d57adaf7ed31c12bad377700498cc5051b28`, independent review `5951985194fdb60c949d6c9535d81a4215480bf4`.
- Fresh review evidence: typecheck PASS; factory reconnect/stale contract `5/5` PASS; compatibility Gate C set `4/4` PASS.
- TO-07 changes no rule runtime, compiler, content, projection implementation, taxonomy, or coverage KPI, so Phase 3 raw/accepted legacy-new-dual counters do not change in this synchronization.
- The harness requires a new post-reload projection before reconnect success and a newly received stale-revision error before stale rejection success; it cannot satisfy those assertions from old trace entries alone.
- P3-TO-13 is unblocked from `WAIT_TO07` to `READY_RUNTIME_OWNER` and may consume the accepted harness for stale/reconnect mechanics.
- TO-07 itself promotes no card or mechanic Gate state; TO-13 still requires its own scoped Gate A/B/C implementation and independent review.

## P3-A03 TO-13 Synchronization — 2026-09-14

- P3-TO-13 Interaction Runtime: `REVIEW_ACCEPTED` for the single Drake private/optional hand-play representative at runtime `3964556699dafc116a67d7f43af9a740d17a0a04`, independent R2 evidence `8c7349e8a36a198f0f83bf114fe94bc588bc8569`.
- The rejected predecessor `914934a3854b6128665917459438f6f1c07c0e86` was not promoted; its three P1 production-boundary findings are independently closed in R2.
- Strict target-based PendingInteraction denominator remains `11`; TO13 synchronizes exactly `1` migrated representative with scoped dual runtime `0`, and the other `10` rows inherit nothing.
- Fresh A raw coverage remains `new=12 / legacyExecute=3 / legacyResolve=49 / dual=0`; the raw reporter does not classify the accepted TO13 route, so no synthetic global legacy/new delta is inferred.
- Fresh compiled evidence remains definition hash `26167661823b52de598c77a59df4d05440a6bfced7d68cd3e04d11353d72dbaa`, `70` cards, `14` characters, and `0` blocking issues.
- The generated coverage artifact changed only timestamp/source-line metadata and is intentionally not committed; classifier/taxonomy logic remains untouched.
- TO13 releases the exclusive runtime hot-file lane.
- Exact P3-B04 PLAY candidate `628238a696d9adfdbfb3a3c404871a8405a6ff8d` remains reachable and already has an A02 reviewer packet; the next dependency is P3-R04 independent review rather than duplicate B04 implementation.
- P3-B05 remains gated on P3-R04 acceptance/clearance. TO14/TO15 spec acceptance does not by itself authorize Battle/Modifier runtime implementation.

## P3-A03 TO-08 Synchronization — 2026-09-14

- P3-TO-08 Resource Numeric Core Direct Action: `REVIEW_ACCEPTED` at current-lineage runtime `81dfe1b2d7651adc10e4bc03a13c6df15ccee3ef`, independent R2 evidence `5d8497ff255b83123525b5425cf7ec37d391f3bf`.
- The rejected current-lineage predecessor at `b63376ca0ebc3fc005405a385e6f1b438b6295c1` is not promoted for Resource Gate C; its missing-revision P1 is independently closed by the accepted r1 candidate.
- Fresh Resource direct-action inventory is `17` in-scope abilities: `3` eligible, `3` migrated, `14` skipped; scoped dual runtime remains `0`. Only Gatou command-spell gain-mana, Olga-Marie command-spell gain-mana, and Tomoe Independent Action are accepted in this slice.
- Fresh A raw coverage remains `new=12 / legacyExecute=3 / legacyResolve=49 / dual=0`; the three Resource direct consumers were already present in the raw semantic-routing count before independent promotion, so reviewer acceptance does not create a second raw delta.
- Fresh compiled evidence remains definition hash `26167661823b52de598c77a59df4d05440a6bfced7d68cd3e04d11353d72dbaa`, `70` cards, `14` characters, and `0` blocking issues.
- Gate A/B/C are accepted for the exact three-consumer Resource slice. Gate C is represented by the command-spell production browser/WS path with reconnect, missing-revision rejection, stale-revision rejection, and no duplicate resource mutation.
- Historical detached hardening `b1a1dc8eb7c90616d4bf4ecd7d02fae04a78c43e` is not used as inherited acceptance; the current accepted judgment is based on `81dfe1b2...` only.
- TO13 interaction compatibility remains green after the authoritative room dispatch-CAS repair; no Interaction row is reopened or newly promoted by TO08.
- The generated coverage artifact changed only timestamp/source-line metadata and is intentionally not committed; classifier/taxonomy logic remains untouched.
- The `14` skipped Resource rows inherit no Gate status. Trigger/Battle/Interaction/Movement/Result-Binding/Lifecycle/Modifier/Special ownership remains unchanged.
- Next low-risk dependency is P3-TO-09 Card Zone current-lineage independent review; no new Card Zone runtime edit is authorized unless that reviewer finds a concrete blocker.

## P3-A03 TO-09 Synchronization — 2026-09-14

- P3-TO-09 Card Zone Core Direct Action: `REVIEW_ACCEPTED` at current-lineage runtime `9718064d54876985b46fdefc99de4477a8b75368`, independent R2 evidence `def13dd86711ffe9dc9df2b213e621b159479bb8`.
- The rejected current-lineage predecessor `5c557cb9d0177a99c0e017768dee42cccdc6a9ff` is not promoted for Card Zone; rejecting review evidence `cb135814e120d840460262307aa31a93d28df917` identified missing typed runtime/current-lineage Gate evidence and is closed only by the repaired candidate.
- Fresh Card Zone inventory is `8` abilities: `2` eligible, `2` migrated, `6` skipped; scoped dual runtime is `0`. Only Conversion Magic and Time Alter are accepted in this slice.
- Fresh A raw coverage remains `new=12 / legacyExecute=3 / legacyResolve=49 / dual=0`; the two Card Zone representatives were already structurally counted by the raw reporter before independent promotion, so reviewer acceptance does not create a synthetic second raw delta.
- Fresh compiled evidence remains definition hash `26167661823b52de598c77a59df4d05440a6bfced7d68cd3e04d11353d72dbaa`, `70` cards, `14` characters, and `0` blocking issues.
- Gate A/B/C are accepted for the exact two-consumer TO09 slice. Fresh reviewer evidence is typecheck PASS, focused `88/88`, current-lineage compatibility `31/31`, Chromium Gate C `2/2`, and root baseline `603 PASS / 20 inherited FAIL` across `623` tests.
- The generated coverage artifact changed only timestamp/source-line metadata and is intentionally not committed; classifier/taxonomy logic remains untouched.
- The `6` skipped Card Zone rows inherit no Gate status. Hidden/private, trigger-owned, cost/payment, lifecycle, modifier, power, and broader Card Zone semantics remain outside this acceptance.
- Time Alter's paired PLAY path is accepted here only as TO09 representative evidence; it does not pre-accept P3-TO-10 Card Action.
- Next low-risk dependency is P3-TO-10 Card Action current-lineage independent review for PLAY, PLAY_SOURCE, ADD_TO_ATTACK, ACTIVATE, and CLOSE; no broad Card Action rewrite is authorized unless R finds a concrete blocker.

## P3-A03 TO-10 Synchronization — 2026-09-14

- P3-TO-10 Card Action scoped current-lineage batch: `REVIEW_ACCEPTED` at repaired runtime `2a3710fa5d2c91f601378e9b7d5979353f4b1951`, independent review evidence `9ad0d4e44028cf50c047b60390af992d94e543a0`.
- The rejecting predecessor review `62c428ac7caf039e60404ad73c39285a71c99019` is not promoted; it correctly found PLAY_SOURCE, ADD_TO_ATTACK, ACTIVATE, and CLOSE absent from exact baseline `a8682306bce4829db2436e4f8b80734834af6de4`. Only the repaired current-lineage candidate is synchronized.
- Exactly five independent contracts are accepted: PLAY / PLAY_SOURCE_CARD_WITH_COST_RESPONSE / ADD_TO_ATTACK / ACTIVATE / CLOSE. No contract inherits another contract's Gate status.
- Fresh scoped inventories remain one exact eligible representative for PLAY, ADD_TO_ATTACK, ACTIVATE, and CLOSE, with `legacy 1 -> 0`, `new 0 -> 1`, `dual 1 -> 0` for each inventory. PLAY_SOURCE remains its separate exact Volumen response-play contract.
- The `6` skipped Card Action rows inherit no migration or Gate acceptance.
- Fresh A raw coverage remains `new=12 / legacyExecute=3 / legacyResolve=49 / dual=0`; TO10 reviewer acceptance does not create a synthetic second raw delta because the exact representatives were already structurally visible to the reporter.
- Fresh compiled evidence is now definition hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`, `70` cards, `14` characters, and `0` blocking issues. The regenerated coverage artifact is committed because this compiled definition hash change is meaningful, not timestamp-only drift.
- Fresh independent Gate evidence is typecheck PASS, focused Card Action/compiler/data-flow `117/117`, current-lineage compatibility `35/35`, successful Chromium Card Action group `5/5`, and full root baseline `636 PASS / 20 inherited FAIL` across `656` tests.
- The reviewer recorded one initial non-reproducing Time Alter 10-second pending-decision wait timeout; Time Alter then passed two isolated retries and the subsequent full five-spec group passed `5/5`. No deterministic runtime/projection/reconnect failure was reproduced.
- Production-diff audit found no representative card/ability identity routing branch. Executable pack hash was independently recomputed and matched both stored identity fields.
- TO08 Resource, TO09 Card Zone, TO11 Trigger, TO12 Lifecycle, and TO13 Interaction accepted boundaries remain green under TO10 compatibility testing.
- The low-risk TO08/09/10 review chain is now synchronized. TO14 Battle/Resource and TO15 Modifier/Power remain accepted specification/design lanes only; runtime work from those lanes requires a fresh narrow B-owned task with explicit representative and exclusive runtime hot-file ownership. TO16 remains planning/special-isolation scope.

## P3-A03 B13 Synchronization — 2026-09-14

- P3-B13 Battle Loss Resource Trigger: `REVIEW_ACCEPTED` at exact runtime `37189b32d4de0da3a8eabdca8edbf674c8852d97`, independent P3-R07 evidence `f1fa9c12ac43ab96050468f52070fc7ea53fd09d`.
- Accepted scope is exactly one TO14 direct consumer: Shinji `clown.lose-command-seal`, routed by the identity-free semantic form `forced_trigger + after_controller_loses_battle + one controller adjust_command_seals integer effect` through typed resolution-dataflow.
- The accepted runtime also closes the scoped phase-wide ordering gap: all resolved battlefield base scoring is committed before ordinary result/win/loss/first-loss continuation settlement on the claimed production paths.
- TO14 scoped direct-consumer overlay is now `1 accepted / 13 direct consumers`, leaving `12` direct post-result/phase-terminal consumers without inherited migration or Gate status. The broader Battle-integration denominator remains `39 abilities / 28 cards`.
- Fresh A raw coverage remains `new=12 / legacyExecute=3 / legacyResolve=49 / dual=0`; B13 acceptance does not create a synthetic global delta because the current reporter does not separately classify this accepted Battle -> Trigger -> Resource bridge.
- Fresh compiled evidence remains definition hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`, `70` cards, `14` characters, and `0` blocking issues. Regenerated coverage differed only by timestamp/source-line metadata, so the artifact drift is not committed.
- Fresh independent evidence: typecheck PASS; B13/Olga/core `65/65 PASS`; current-lineage compatibility `16 files / 145/145 PASS`; independent two-battlefield barrier/exactly-once adversarial probe PASS; fresh Chromium Shinji + Olga `2/2 PASS`; full root baseline `644 PASS / 20 inherited FAIL` across `664` tests.
- The 20 root failures remain the existing CHM/original-image evidence absence class. Compared with accepted TO10 baseline `636 PASS / 20 inherited FAIL`, B13 contributes `+8 PASS / +0 new deterministic failures`.
- Production-diff review found no representative identity routing and confirmed exact supported B13 semantics use typed `executeResolutionEffects()` with malformed near-miss shapes fail-closed.
- The B13 runtime hot-file lane is released. The next Battle/Resource implementation requires a fresh A-owned narrow handoff selecting an explicit representative from the remaining 12 direct TO14 consumers; neither broad TO14 migration nor TO15 runtime is automatically authorized.

## P3-A03 B14 Synchronization — 2026-09-14

- P3-B14 Shared Victory VP Trigger: `REVIEW_ACCEPTED` at exact runtime `6ef5fa69cab1d51d1681e525410a93172ee7a714`, independent P3-R08 evidence `32be96d5d31107c72913881be12ea4b8513c7360`.
- Accepted scope is exactly one additional TO14 direct consumer: Artoria Caster `sc-artoriac-6.gain-vp-if-not-sole-winner`, routed by the identity-free semantic form `forced_trigger + combat/immediate + after_battle_result_determined + SOURCE_ACTIVE + shared winner + one controller adjust_victory_points(+2)` through typed resolution-dataflow.
- B14 consumes B13's accepted post-scoring result envelope; production evidence proves both battlefield scoring receipts exist before the barrier, p1 has base `2 VP` at barrier open, and only reaches `4 VP` after the shared-result trigger dispatch.
- TO14 scoped direct-consumer overlay is now `2 accepted / 13 direct consumers`, leaving `11` direct post-result/phase-terminal consumers without inherited migration or Gate status. The broader Battle-integration denominator remains `39 abilities / 28 cards`.
- Fresh A raw coverage remains `new=12 / legacyExecute=3 / legacyResolve=49 / dual=0`; B14 acceptance does not create a synthetic global delta because the current reporter does not separately classify this accepted Battle Result -> Trigger -> typed VP Resource bridge.
- Fresh compiled evidence remains definition hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`, `70` cards, `14` characters, and `0` blocking issues. Regenerated coverage differed only by timestamp/source-line metadata, so the artifact drift is not committed.
- Fresh independent evidence: typecheck PASS; focused/current-lineage compatibility `17 files / 98/98 PASS`; normalized-pack adversarial probe PASS for identity-free rename, near-miss fail-closed, rejection atomicity and stable-event dedupe; fresh Chromium B14 `1/1 PASS`; full root baseline `648 PASS / 20 inherited FAIL` across `668` tests.
- The 20 root failures remain the existing CHM/original-image evidence absence class. Compared with accepted B13 baseline `644 PASS / 20 inherited FAIL`, B14 contributes `+4 PASS / +0 new deterministic failures`.
- Production-diff review found no representative identity routing and confirmed exact supported B14 semantics use typed `executeResolutionEffects()` while same-family malformed near-misses are rejected before legacy fallback.
- B14 does not promote Tomoe's unpreventable defeat penalty, optional battle-result triggers, `after_battle_ended` consumers, the remaining TO14 rows, broad Battle migration, or TO15 Modifier/Power runtime.
- The B14 runtime hot-file lane is released. The next Battle/Resource implementation requires a fresh A-owned narrow handoff selecting one explicit representative from the remaining 11 direct TO14 consumers and a new independent reviewer.

## P3-A03 B15 Synchronization — 2026-09-14

- P3-B15 Battle-Terminal Card Zone: `REVIEW_ACCEPTED` at exact runtime `26be105af227306e5a7154ca0d7cdccac34d72bf`, independent P3-R09 evidence `2eb04b8495f988e8d2d78d63a580658ce6b3494d`.
- Accepted scope is exactly one additional TO14 direct phase-terminal consumer: Ereshkigal `sc-ereshkigal-2.return-to-skill-zone`, routed by the identity-free semantic form `forced_trigger + after_battle_ended + SOURCE_ACTIVE + move_card(target=this_card,to=skill,owner=controller)` through typed `move_source_card` resolution-dataflow.
- B15 adds one stable `${battlePhaseResolutionId}:after_battle_ended` event per battle phase after all battlefield scoring and ordinary post-result work have settled and before cleanup; both authoritative battle paths use the same ordering boundary.
- TO14 scoped direct-consumer overlay is now `3 accepted / 13 direct consumers`, leaving `10` direct post-result/phase-terminal consumers without inherited migration or Gate status. The broader Battle-integration denominator remains `39 abilities / 28 cards`.
- Fresh A raw coverage remains `new=12 / legacyExecute=3 / legacyResolve=49 / dual=0`; B15 acceptance does not create a synthetic global delta because the reporter does not separately classify this Battle terminal -> Trigger -> typed Card Zone bridge.
- Fresh compiled evidence remains definition hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`, `70` cards, `14` characters, and `0` blocking issues. Regenerated coverage differed only by timestamp/source-line metadata, so the artifact drift is not committed.
- Fresh independent evidence: typecheck PASS; focused/current-lineage compatibility `8 files / 112/112 PASS`; adversarial probe PASS for renamed exact-shape classification, near-miss rejection, stable terminal event ID, all four terminal blockers, replay dedupe and atomic rejection; fresh Chromium B15 `1/1 PASS`; full root baseline `655 PASS / 20 inherited FAIL` across `675` tests.
- The 20 root failures remain the existing CHM/original-image evidence absence class. Compared with accepted B14 baseline `648 PASS / 20 inherited FAIL`, B15 contributes `+7 PASS / +0 new deterministic failures`.
- Production-diff review found no representative identity routing and confirmed exact supported B15 semantics use typed `executeResolutionEffects()` while malformed same-family near-misses are rejected before legacy fallback.
- B15 does not promote Gatou rewards, Tomoe's unpreventable defeat penalty, Achilles reveal behavior, Olga transformation, optional battle-result interaction, the remaining TO14 rows, broad Battle migration, or TO15 Modifier/Power runtime.
- The B15 runtime hot-file lane is released. The next Battle/Resource/Card-Zone implementation requires a fresh A-owned narrow handoff selecting one explicit representative from the remaining 10 direct TO14 consumers and a new independent reviewer.

## P3-A03 B16 Synchronization — 2026-09-14

- P3-B16 Battle-Loss Servant Reveal: `REVIEW_ACCEPTED` at exact runtime `3f36eb39235d4e836304b2512b7f6a478287fd97`, independent P3-R10 evidence `6ef31cb039272290726d6475fd95ff2f453ada64`.
- Accepted scope is exactly one additional TO14 direct consumer: Achilles `sc-achilles-1.achilles-heel`, routed by the identity-free semantic form `forced_trigger + after_controller_loses_battle + one reveal_information(scope=servant_package,subject=controller.servant)` through typed `reveal_servant_package` resolution-dataflow.
- The primitive reuses the existing authoritative `abilityRuntime.revealedServants` state, emits one typed `servant_package_revealed` event with stable resolution provenance on first reveal, returns `no_op` without duplicate event on repeat reveal, and rejects malformed scope/subject or wrong-controller use atomically.
- B16 consumes the accepted B13 post-scoring loss-event ordering without modifying the battle pipeline. A scoring-eliminated loser retains frozen-participant eligibility for the same-battle reveal, and B15 terminal work remains later than ordinary result/loss settlement.
- TO14 scoped direct-consumer overlay is now `4 accepted / 13 direct consumers`, leaving `9` direct post-result/phase-terminal consumers without inherited migration or Gate status. The broader Battle-integration denominator remains `39 abilities / 28 cards`.
- Fresh A raw coverage remains `new=12 / legacyExecute=3 / legacyResolve=49 / dual=0`; B16 acceptance does not create a synthetic global delta because the current reporter does not separately classify this accepted Battle Result -> Trigger -> typed Visibility bridge.
- Fresh compiled evidence remains definition hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`, `70` cards, `14` characters, and `0` blocking issues.
- Unlike B15, the regenerated coverage artifact now includes substantive generic static-runtime evidence introduced by B16 (`servant_package_revealed` and `servant_package`) in addition to timestamp/source-line movement, so the artifact is retained in this synchronization even though raw KPI and compiled definition identity are unchanged.
- Fresh independent evidence: typecheck PASS; focused/current-lineage compatibility `10 files / 91/91 PASS`; reviewer-only normalized-pack adversarial probe PASS for renamed identity-free classification, malformed-scope rejection, `applied -> no_op` idempotence, and wrong-controller atomicity; fresh Chromium Achilles + Eresh `2/2 PASS`; full root baseline `663 PASS / 20 inherited FAIL` across `683` tests.
- The 20 root failures remain the existing CHM/original-image evidence absence class. Compared with accepted B15 baseline `655 PASS / 20 inherited FAIL`, B16 contributes `+8 PASS / +0 new deterministic failures`.
- Production-diff review found no representative identity routing and confirmed exact supported B16 semantics use typed `executeResolutionEffects()` while malformed same-family scope/subject is rejected before legacy fallback.
- B16 does not promote Gatou Special rewards, Tomoe's unpreventable defeat penalty, Olga loss transformation, optional battle-result triggers, declaration reveal, arbitrary Hidden Information/reveal behavior, the remaining TO14 rows, broad Battle migration, TO15 Modifier/Power runtime, or TO16 Special runtime.
- The B16 runtime hot-file lane is released. The next TO14 implementation requires a fresh A-owned narrow handoff selecting one explicit representative from the remaining 9 direct consumers and a new independent reviewer.

## P3-A03 B17 Synchronization — 2026-09-14

- P3-B17 Olga First-Loss ACTIVATE recertification: `REVIEW_ACCEPTED` at exact candidate `ebd050a0a4e353c8f747a54dfb1d6f51e8068542`, independent P3-R11 evidence `ad7d2c9514f5545c0d61736059cb58a538091eff`.
- Accepted scope is exactly one additional TO14 direct consumer: Olga-Marie `astronomical-science.first-loss`, composed as identity-free `forced_trigger + after_controller_first_loses_battle + activate_card_by_id(...)`, staged only after authoritative post-scoring first loss and consumed only on formal `round_end`.
- B17 is evidence-first and makes zero production runtime changes. It recertifies the already accepted typed ACTIVATE route on the accepted B13-B16 battle lineage rather than inventing a new primitive.
- TO14 scoped direct-consumer overlay is now `5 accepted / 13 direct consumers`, leaving `8` direct post-result/phase-terminal consumers without inherited migration or Gate status. The broader Battle-integration denominator remains `39 abilities / 28 cards`.
- Fresh A raw coverage remains `new=12 / legacyExecute=3 / legacyResolve=49 / dual=0`; B17 acceptance does not create a synthetic global delta. Fresh compiled evidence remains definition hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`, `70` cards, `14` characters, and `0` blocking issues.
- The regenerated coverage artifact differed only by `generatedAt`; source fingerprint, counters, compiled identity and static evidence were unchanged, so timestamp-only drift is intentionally not committed.
- Fresh independent evidence: typecheck PASS; focused/current-lineage compatibility `7 files / 80/80 PASS`; B17 first-loss recertification `3/3 PASS`; fresh Chromium Olga + Achilles + Eresh `3/3 PASS`; full root baseline `666 PASS / 20 inherited FAIL` across `686` tests.
- The 20 root failures remain the existing CHM/original-image evidence absence class. Compared with accepted B16 baseline `663 PASS / 20 inherited FAIL`, B17 contributes `+3 PASS / +0 new deterministic failures`.
- Independent review confirmed the server derives first loss only after the scoring-receipt barrier, keeps stable battle/result/participant provenance with `lossOrdinal=1`, stages at most one delayed activation, does not activate during result settlement, and consumes exactly once at formal round end. Missing/ambiguous/wrong-controller/wrong-zone target paths remain typed fail-closed and atomic.
- Production routing contains no Olga/card/ability identity branch. B17 does not promote Olga loss-transform/soul-drag/return-silence, Gatou Special reward, Tomoe unpreventable defeat penalty, Artoria Alter optional result triggers, Artoria Caster optional Luck-on-win, broad delayed scheduling, remaining TO14 rows, TO15, or TO16.
- The B17 evidence/review lane is released. The next TO14 implementation requires a fresh A-owned narrow handoff selecting one explicit representative from the remaining 8 direct consumers and a new independent reviewer.

## P3-A03 B18 Synchronization — 2026-09-14

- P3-B18 Noble Bloom optional post-result VP: `REVIEW_ACCEPTED` at exact candidate `c86eca28dc4c915f60a30eaff7769714f8644d77`, independent P3-R12 evidence `2c26a7b87fdf9c75f8d70728fd2a5d77e89f9c7d`.
- Accepted scope is exactly one additional TO14 direct consumer: Artoria Alter `sc-artoria-alt-3.noble-bloom`, structurally routed as `optional_trigger + combat + after_battle_result_determined + highest-cost Noble Phantasm condition + controller adjust_victory_points(+1)` through the accepted optional Interaction window and typed Resource resolution path.
- Production result events carrying `battleParticipantIds` cannot offer B18 to a controller outside that battle. The optional window remains absent at the phase-wide post-scoring barrier and opens only during later result-event dispatch.
- TO14 scoped direct-consumer overlay is now `6 accepted / 13 direct consumers`, leaving `7` direct post-result/phase-terminal consumers without inherited migration or Gate status. The broader Battle-integration denominator remains `39 abilities / 28 cards`.
- Fresh A raw coverage remains `new=12 / legacyExecute=3 / legacyResolve=49 / dual=0`; B18 acceptance does not create a synthetic raw counter delta. Fresh compiled evidence remains definition hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`, `70` cards, `14` characters, and `0` blocking issues.
- The regenerated coverage artifact changed only `generatedAt` plus static-evidence source line numbers shifted by the inserted interpreter code. Source fingerprint, counters, compiled identity, classifications, and evidence identities were unchanged, so this non-semantic generated drift is intentionally not committed.
- Fresh independent evidence: typecheck PASS; focused/current-lineage compatibility `7 files / 51/51 PASS`; Chromium B18 + B13-B17 `6/6 PASS`; full root baseline `672 PASS / 20 inherited FAIL` across `692` tests.
- Compared with accepted B17 baseline `666 PASS / 20 inherited FAIL / 686 total`, B18 contributes `+6 PASS / +0 new deterministic failures`.
- Independent review confirmed identity-free exact-shape classification, malformed same-family fail-closed behavior, controller-only optional response ownership, decline `+0`, typed accept `+1` exactly once, stable result replay/reconnect/stale-revision dedupe, and no promotion of `noble-bloom-extra-vp`.
- B18 does not promote Artoria Caster Luck triggers, Gatou battle-end reward, Tomoe defeat penalty, Olga loss-transform, broad TO14, TO15 Modifier/Power, or TO16 Special behavior.
- The B18 runtime/review lane is released. The next TO14 implementation requires a fresh A-owned handoff selecting one explicit representative from the remaining 7 direct consumers and a new independent reviewer.

## P3-A03 B19 Synchronization — 2026-09-14

- P3-B19 Noble Bloom extra-VP optional result consumer: `REVIEW_ACCEPTED` at exact candidate `24c1ef9dba7436204ac3a334edc2483804d00cc3`, independent P3-R13 evidence `397315694eda2b106bcdfeabc6ff28d0d57d67f9`.
- Accepted scope is exactly one additional TO14 direct consumer: Artoria Alter `sc-artoria-alt-3.noble-bloom-extra-vp`, structurally routed as `optional_trigger + combat + after_battle_result_determined + highest-cost Noble Phantasm + threshold >=4 + controller adjust_victory_points(+1)` through the accepted optional Interaction window and typed Resource path.
- B19 preserves B18 and B19 as two independent optional +1 settlements. At threshold, accepting both yields +2 total; the runtime does not collapse them into one synthetic +2 effect.
- TO14 scoped direct-consumer overlay is now `7 accepted / 13 direct consumers`, leaving `6` direct post-result/phase-terminal consumers without inherited migration or Gate status. The broader Battle-integration denominator remains `39 abilities / 28 cards`.
- Fresh A raw coverage remains `new=12 / legacyExecute=3 / legacyResolve=49 / dual=0`; B19 acceptance does not create a synthetic raw counter delta. Fresh compiled evidence remains definition hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`, `70` cards, `14` characters, and `0` blocking issues.
- The regenerated coverage artifact changed only `generatedAt` plus static-evidence source line numbers shifted by the interpreter insertion. Source fingerprint, counters, compiled identity, classifications, and evidence identities were unchanged, so this non-semantic generated drift is intentionally not committed.
- Fresh independent evidence: typecheck PASS; focused/current-lineage compatibility `9 files / 93/93 PASS`; Chromium B19 + B13-B18 `7/7 PASS`; full root baseline `677 PASS / 20 inherited FAIL` across `697` tests.
- Compared with accepted B18 baseline `672 PASS / 20 inherited FAIL / 692 total`, B19 contributes `+5 PASS / +0 new deterministic failures`.
- Independent review confirmed identity-free exact two-condition threshold classification, participant filtering, malformed same-family fail-closed behavior, cost<4 preserving B18 without exposing B19, independent accept/decline semantics, and replay/reconnect/stale-revision exactly-once behavior.
- B19 does not promote Artoria Caster Luck triggers, Gatou battle-end reward, Tomoe defeat penalty, Olga loss-transform, broad TO14, TO15 Modifier/Power, or TO16 Special behavior.
- The B19 runtime/review lane is released. The next TO14 implementation requires a fresh A-owned narrow handoff selecting one explicit representative or one structurally identical family from the remaining 6 direct consumers and a new independent reviewer.

## P3-A03 B20 Synchronization — 2026-09-14

- P3-B20 unique win create/shuffle family: `REVIEW_ACCEPTED` at exact candidate `bd2a350e3fd1d006d8692e770b4ad8eb24e5aeea`, independent P3-R14 evidence `f48b6b45eab26096cfdfd2889801aad7e91bf1f0`.
- Accepted scope is exactly three structurally identical TO14 direct consumers: Artoria Caster `sc-artoriac-4/5/6.unique-passive-luck-on-win`, routed by the identity-free semantic family `optional controller-win trigger + unique-group response + source hand->removed_from_game + create one reward in controller deck + shuffle controller deck`.
- Production classification is independent of character/card/ability identity, unique-group ID value, and reward-card ID value. Malformed same-family shapes fail closed before legacy fallback; settlement emits typed `source_card_removed_from_game`, `card_created`, and `deck_shuffled` evidence.
- TO14 scoped direct-consumer overlay is now `10 accepted / 13 direct consumers`, leaving exactly `3`: Gatou `seeker.battle-end-reward`, Tomoe `sc-tomoe-1.penalty-on-defeat`, and Olga `trismegistus.loss-transform`. The broader Battle-integration denominator remains `39 abilities / 28 cards`.
- Fresh A raw coverage remains `new=12 / legacyExecute=3 / legacyResolve=49 / dual=0 / notClassifiable=28 / taxonomyWarnings=79`; B20 acceptance does not create a synthetic raw counter delta. Fresh compiled evidence remains definition hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`, `70` cards, `14` characters, and `0` blocking issues.
- The regenerated coverage artifact changed only `generatedAt` and generic static-evidence source line numbers shifted by the interpreter insertion. Source fingerprint, counters, compiled identity, classifications, and evidence identities were unchanged, so this non-semantic generated drift is intentionally not committed.
- Fresh independent evidence: typecheck PASS; focused/current-lineage compatibility `11 files / 103/103 PASS`; Chromium B13-B20 `8/8 PASS`; full root baseline `687 PASS / 20 inherited FAIL` across `707` tests.
- Compared with accepted B19 baseline `677 PASS / 20 inherited FAIL / 697 total`, B20 contributes `+10 PASS / +0 new deterministic failures`.
- Independent review confirmed unique-group arbitration, controller-only ownership, decline/no-mutation, later distinct win re-offer, unrelated-battle exclusion, stable replay/reconnect/stale-revision exactly-once behavior, typed remove/create/shuffle evidence, and atomic malformed-shape rejection.
- B20 does not promote Gatou reward, Tomoe defeat penalty, Olga loss-transform, broad TO14, TO15 Modifier/Power, TO16 Special, or A-owned taxonomy/classifier changes.
- The B20 runtime/review lane is released. The next TO14 implementation requires a fresh A-owned narrow handoff selecting one of the remaining three direct consumers and a new independent reviewer.

## P3-A03 B21 Synchronization — 2026-09-14

- P3-B21 Tomoe unpreventable defeat penalty: `REVIEW_ACCEPTED` at exact candidate `a160913798d943bf74e6151494384ba946fdfce9`, independent P3-R15 evidence `6e585bdc42223f9915501849a15a69d63f85ac39`.
- Accepted scope is exactly one additional TO14 direct consumer: Tomoe `sc-tomoe-1.penalty-on-defeat`, routed by the identity-free exact family `forced after_controller_loses_battle + controller adjust_victory_points(-5) + explicit this_effect effect-prevention exception`.
- Production classification contains no Tomoe/card/ability/modifier identity. The prevention bypass is limited to the exact supported exception shape; malformed same-family shapes fail closed before legacy fallback and do not broaden TO15 Modifier/Power runtime.
- TO14 scoped direct-consumer overlay is now `11 accepted / 13 direct consumers`, leaving exactly `2`: Gatou `seeker.battle-end-reward` and Olga `trismegistus.loss-transform`. The broader Battle-integration denominator remains `39 abilities / 28 cards`.
- Fresh A raw coverage remains `new=12 / legacyExecute=3 / legacyResolve=49 / dual=0 / notClassifiable=28 / taxonomyWarnings=79`; B21 acceptance does not create a synthetic raw counter delta. Fresh compiled evidence remains definition hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`, `70` cards, `14` characters, and `0` blocking issues.
- The regenerated coverage artifact changed only `generatedAt` and generic static-evidence source line numbers shifted by interpreter insertions. Source fingerprint, counters, compiled identity, classifications, and evidence identities were unchanged, so this non-semantic generated drift is intentionally not committed.
- Fresh independent evidence: typecheck PASS; focused/current-lineage compatibility `12 files / 109/109 PASS`; Chromium B13-B21 final rerun `9/9 PASS`; full root baseline `693 PASS / 20 inherited FAIL` across `713` tests.
- Compared with accepted B20 baseline `687 PASS / 20 inherited FAIL / 707 total`, B21 contributes `+6 PASS / +0 new deterministic failures`.
- Independent review confirmed loser/participant provenance, phase-wide post-scoring ordering, ordinary-prevention bypass only for the explicit this-effect exception, typed unpreventable VP evidence, authoritative VP floor, malformed-shape atomic rejection, and stable replay/reconnect/stale exactly-once behavior.
- One transient inherited B15 browser command-send failure appeared on the first reviewer suite run; B15 passed immediately in isolation and the complete fresh rerun passed `9/9`, so R15 identified no new deterministic blocker.
- B21 does not promote Gatou reward, Olga loss-transform, broad TO14, broad TO15 Modifier/Power, TO16 Special, or A-owned taxonomy/classifier changes.
- The B21 runtime/reviewer lane is released. The next TO14 implementation requires a fresh A-owned narrow handoff selecting one of the remaining two direct consumers and a new independent reviewer.

## P3-A03 B22 Synchronization — 2026-09-14

- P3-B22 Gatou battle-end mobile-player reward: `REVIEW_ACCEPTED` at exact candidate `134c61e3f0acd6fd5e28bcbb9557cbb45244ed93`, independent P3-R16 evidence `53177e68435f8de6866aa61d2d80b70b4e26a81a`.
- Accepted scope is exactly one additional TO14 direct consumer: Gatou `seeker.battle-end-reward`, routed by the identity-free exact phase-terminal family `forced after_battle_ended -> count unique other players currently colocated with controller who authoritatively moved into that location this round -> +1 per player, VP on controller victory otherwise mana`.
- The route uses frozen phase participant/outcome provenance and phase-wide post-scoring ordering. Normal and authored effect movement share authoritative movement provenance; deployment-only placement, stale prior-round movement, duplicate rows, controller self movement, and moved-away players do not inflate the count. Malformed same-family shapes fail closed atomically before legacy fallback.
- TO14 scoped direct-consumer overlay is now `12 accepted / 13 direct consumers`, leaving exactly `1`: Olga `trismegistus.loss-transform`. The broader Battle-integration denominator remains `39 abilities / 28 cards`.
- Fresh A raw coverage remains `new=12 / legacyExecute=3 / legacyResolve=49 / dual=0 / notClassifiable=28 / taxonomyWarnings=79`; B22 acceptance does not create a synthetic raw counter delta. Fresh compiled evidence remains definition hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`, `70` cards, `14` characters, and `0` blocking issues.
- The regenerated coverage artifact changed only `generatedAt` and generic static-evidence source line numbers shifted by B22 interpreter/session insertions. Source fingerprint, counters, compiled identity, classifications, and evidence identities were unchanged, so this non-semantic generated drift is intentionally not committed.
- Fresh independent evidence: typecheck PASS; focused/current-lineage compatibility `13 files / 117/117 PASS`; B22 focused `8/8 PASS`; Chromium B13-B22 `10/10 PASS`; deterministic candidate full-root baseline `701 PASS / 20 inherited FAIL` across `721` tests.
- R16's full-suite run observed `700 PASS / 21 FAIL` because the existing eleven-round MatchSession smoke exceeded its 5-second timeout under parallel load; that test passed reviewer isolation `3/3` at approximately `2.07-2.13s`, matching the implementation lane's separate isolated `3/3`, so no new deterministic production failure was identified.
- Compared with accepted B21 baseline `693 PASS / 20 inherited FAIL / 713 total`, B22 contributes `+8 PASS / +0 new deterministic failures`.
- Independent review additionally verified an authored `move_player` effect produces current-round `movementKind=effect` provenance and is correctly counted by Gatou, plus shared-winner VP routing, mana-cap actual delta, stable replay exactly-once behavior, reconnect preservation, and stale-revision rejection.
- B22 does not promote Olga loss-transform, broad TO14, broad TO15 Modifier/Power, TO16 Special, or A-owned taxonomy/classifier changes.
- The B22 runtime/reviewer lane is released. TO14 now has one remaining direct consumer, Olga `trismegistus.loss-transform`; it requires a fresh A-owned narrow handoff and a new independent reviewer.

## P3-A03 B23 Synchronization — 2026-09-15

- P3-B23 Olga loss-transform: `REVIEW_ACCEPTED` at exact candidate `19472d3004f4fdda108049ae9ccfea24f27c86f6`, independent P3-R17 evidence `af3252308397040a6b0c34788aff0cab9d959103`.
- Accepted scope is exactly the final TO14 direct battle-event consumer: structural `forced after_controller_loses_battle -> active-source transform_to_return_silence_on_loss -> source-bound soul_drag -> return_silence transition`.
- Production routing contains no Olga/card/ability/master identity. The active source and authoritative loser/battle provenance are mandatory; same-source Soul Drag state is removed, Return Silence state is source-bound, and malformed same-family shapes fail closed before legacy fallback.
- TO14 scoped direct-consumer overlay is now complete at `13 accepted / 13 direct consumers`, leaving `0`. The broader Battle-integration denominator remains `39 abilities / 28 cards`.
- Fresh A raw coverage remains `new=12 / legacyExecute=3 / legacyResolve=49 / dual=0 / notClassifiable=28 / taxonomyWarnings=79`; B23 acceptance does not create a synthetic raw counter delta. Fresh compiled evidence remains definition hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`, `70` cards, `14` characters, and `0` blocking issues.
- The regenerated coverage artifact changed only `generatedAt` and generic static-evidence source line numbers shifted by B23 interpreter/combat-resolver insertions. Source fingerprint, counters, compiled identity, classifications, and evidence identities were unchanged, so this non-semantic generated drift is intentionally not committed.
- Fresh independent evidence: typecheck PASS; B23 focused `9/9 PASS`; focused/current-lineage compatibility `14 files / 126/126 PASS`; Chromium B13-B23 `11/11 PASS`; reviewer full root `710 PASS / 20 inherited FAIL / 730 total`.
- Compared with accepted B22 baseline `701 PASS / 20 inherited FAIL / 721 total`, B23 contributes `+9 PASS / +0 new deterministic failures`.
- Independent review confirmed active-source gating, authoritative loser provenance, same-source Soul Drag removal, typed `soul_drag -> return_silence` transition evidence, pre-transform/post-transform state gating, stable replay exactly-once, reconnect/stale safety, source-removal cleanup, and no ghost Return Silence battle override.
- A reviewer-only runtime probe independently observed transformed state and deployment restriction before consume, source removal plus complete state cleanup after consume, and a later ordinary battle won by the higher-power opponent rather than by stale Return Silence override.
- B23 does not promote broad TO14 beyond accepted rows, TO15 Modifier/Power, TO16 Special, generic state transformations, generic passive lifecycle, Soul Drag as a general power contract, or Return Silence as an independently accepted TO16 row.
- The B23 runtime/reviewer lane is released. The scoped TO14 direct-consumer sequence is complete at `13/13`; further Phase 3 work proceeds through the separately accepted full-roster F0/F1 migration workflow and ultimately F5 closure.

## P3-A FB2-01 Synchronization — 2026-09-16

- P3-FB2-01 fixed controller mana-cost component: `REVIEW_ACCEPTED` at exact candidate `36670ca3d57331b5354fca35deadc1e34bf5a1db`, independent P3-R18 evidence `30c1e5365eeba102853a7f20f5bad139b3953acc`.
- Accepted scope is exactly one top-level fixed positive safe-integer controller `pay_mana` component, usable only when the parent semantic route is already independently accepted. Variable/expression, third-party, multi-node, non-mana, and effect-level optional-cost shapes remain outside the contract.
- The implementation reuses the existing typed Resolution Data-flow `pay_mana` primitive and introduces no second payment engine. Maiya preserves its staged activation-payment -> pending-target boundary; Kayneth preserves atomic same-stage payment + source-card PLAY rollback.
- Production identity/text audit is `0` matches. No MatchSession/client/projection/F1 authoring files changed, and no new browser Gate C was required.
- Fresh A raw coverage remains `new=12 / legacyExecute=3 / legacyResolve=49 / dual=0 / notClassifiable=28 / taxonomyWarnings=79`; compiled evidence remains definition hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`, `70` cards, `14` characters, and `0` blocking issues.
- The regenerated coverage artifact changed only `generatedAt` and generic static-evidence line numbers, so this non-semantic drift is intentionally not committed.
- Fresh independent evidence: typecheck PASS; FB2-01 + Maiya + Kayneth `22/22 PASS`; all rules regressions `240/240 PASS`; full CI `653/653 PASS`; generated-content determinism PASS.
- For this exact sub-capability, F2 alignment and F3 runtime acceptance are satisfied. Full-roster F4 is not satisfied until an S migration batch selects exact F1 identities that also have an independently accepted parent runtime route, receives independent review, and A synchronizes burn-down.
- This acceptance does not promote broad `GENERIC_COST_PAYMENT`, variable/X/optional/third-party/upkeep/replacement payment, command-seal/VP/discard/source-move costs, ordinary printed card costs, generic Resource Numeric, Interaction, or Card Action behavior.
- The FB2-01 runtime/reviewer lane is released. The next legal step is an exact F1 membership scan against both the accepted fixed-cost component and already accepted parent semantic routes; cost-shape-only matches remain blocked.

## P3-A FB2-02 Synchronization — 2026-09-16

- P3-FB2-02 deployment Resource Numeric reward: `REVIEW_ACCEPTED` at exact candidate `a37831a43d9949c6e9bb6eddbe9ac645e7754f44`, independent P3-R19 evidence `8f50df5f7acb74fc5c483a144796ca327c5aeb69`.
- Accepted scope is exactly a trusted `after_player_deployed_to_battlefield` event at a data-driven location, scoped to the deployed controller for this contract, with one or two fixed positive controller mana/VP adjustments settled through typed Resolution Data-flow.
- The controller-scope rule is candidate-specific and preserves Ereshkigal's existing any-player deployment trigger.
- Exact F1 membership newly aligned to this accepted runtime contract is 6 identities: Anastasia SC1, Andersen SC1, Avicebron SC3, Da Vinci SC4, Semiramis SC2, Shakespeare SC1. No authoring migration has occurred yet.
- P3-FM01 remains undispatched because the first migration plan requires 10-40 exact IDs under one accepted capability; current FB2-02 same-contract readiness is `6/10` minimum.
- Fresh A raw coverage remains `new=12 / legacyExecute=3 / legacyResolve=49 / dual=0 / notClassifiable=28 / taxonomyWarnings=79`; compiled evidence remains definition hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`, `70` cards, `14` characters, `0` blocking issues.
- Regenerated coverage changed only `generatedAt` and static-evidence source line numbers; source fingerprint, counters, compiled identity, classifications, and evidence identities are unchanged, so the artifact drift is intentionally not committed.
- Independent R19 evidence: typecheck PASS; focused compatibility `58/58`; rules regression `247/247`; deterministic generated-content PASS; full root CI `660/660`; identity/hot-file audit clean.
- No broad Resource Numeric, Trigger, Movement, Card Zone, Interaction, Battle, Cost, or special-handler family is promoted by implication.
## P3-A FB2-03 Synchronization — 2026-09-16

- P3-FB2-03 fixed controller Mana/VP adjustment component: `REVIEW_ACCEPTED` at candidate `3334598fc266c158aceea6796bcae03b6f65796e`, R20 `a2d2fcfedefead28897dd456aaefa8160061c53b`.
- Exact F1 component alignment is `59` identities; only `6` currently have a complete accepted parent route, while `53` still depend on later parent/gateway/special contracts. No authoring migration occurred.
- Fresh A raw coverage remains `new=12 / legacyExecute=3 / legacyResolve=49 / dual=0 / notClassifiable=28 / taxonomyWarnings=79`; compiled identity remains unchanged.
- Generated coverage drift is only timestamp/static source line numbers and is intentionally not committed.
- Independent R20 evidence: typecheck PASS; focused `26/26`; rules `252/252`; deterministic PASS; full CI `665/665`; identity/forbidden-file audits clean.
- Broad Resource Numeric and all later-wave parent gateways remain unpromoted.
## P3-A FB2-04 Synchronization — 2026-09-16

- P3-FB2-04 fixed controller command-seal adjustment component: `REVIEW_ACCEPTED` at candidate `5e6500a72f2d82c2cb12644a163ed6b9d96f0fc7`, independent R21 `92c55fc53164ce52ad9489ef5d5067cb516ea4e3`.
- Exact F1 component alignment is `6 identities / 7 effects`; all-opponent, same-battlefield-opponent, restore-all, payment, variable, and third-party siblings remain outside the contract.
- Parent routes remain independently gated. No authoring migration occurred, and this six-identity slice cannot alone satisfy FM01's 10-ID minimum.
- Fresh A raw coverage remains `new=12 / legacyExecute=3 / legacyResolve=49 / dual=0 / notClassifiable=28 / taxonomyWarnings=79`; compiled identity remains definition hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`, 70 cards, 14 characters, 0 blocking issues.
- Generated coverage drift remains timestamp/static source line numbers only and is intentionally not committed.
- Independent R21 evidence: typecheck PASS; focused `33/33`; rules `256/256`; deterministic PASS; full CI `669/669`; identity/forbidden-file audits clean.
- Broad Resource Numeric, Cost Payment, Target Selection, Trigger Gateway, and later-wave semantics remain unpromoted.
## P3-A FB2-05 Synchronization — 2026-09-16

- P3-FB2-05 fixed-controller exact `set_mana`: `REVIEW_ACCEPTED` at candidate `1a611635061f83f7b3aad5c5b2e3da2a33b201bf`, independent R22 `af6503692e23fb118b8956e00baa2b0f84cb2181`.
- Exact F1 component alignment is 5 identities; complete migration readiness added by this primitive alone is 0 because parent Trigger/Lifecycle/Condition/Special routes remain independently gated.
- Fresh A raw coverage remains `new=12 / legacyExecute=3 / legacyResolve=49 / dual=0 / notClassifiable=28 / taxonomyWarnings=79`; compiled definition hash remains `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`, 70 cards, 14 characters, 0 blocking issues.
- Generated coverage drift is timestamp/static-line-only and is intentionally not committed.
- Independent R22 evidence: typecheck PASS; focused `35/35`; rules `262/262`; deterministic generated-content PASS; full CI `675/675`; identity/forbidden-file audits clean.
- Broad Resource Numeric, Trigger Gateway, variable/expression payment, Result Binding, Target Selection, and F4 migration are not promoted by implication.

## P3-A FB2-06 Synchronization — 2026-09-16

- FB2-06 fixed controller draw component / advance-pay-draw route: `REVIEW_ACCEPTED` at candidate `3f1080a7cb4f68e7c08af91b349680a6536cd362`, independent R23 `0dc6619eba6f2ff67c96b6ec9c3ff736cae66740`.
- Exact F1 draw-component alignment is 23 identities; complete direct-route readiness from this contract is only the Waver-shaped `advance + pay 1 + draw 2` representative. No F1 authoring migration occurred.
- Fresh A raw coverage remains `new=12 / legacyExecute=3 / legacyResolve=49 / dual=0 / notClassifiable=28 / taxonomyWarnings=79`; compiled identity remains unchanged at 70 cards / 14 characters / 0 blocking issues.
- Generated coverage drift is timestamp/static-line-only and is intentionally not committed.
- Independent R23 evidence: typecheck PASS; focused `25/25`; rules `268/268`; deterministic PASS; full CI `681/681`; identity/forbidden-file audits clean.
- The 14 mixed servant draw/play identities remain blocked by Trigger-owned draw semantics and are not counted as F4-ready.

## P3-A FB2-07 Synchronization — 2026-09-16

- FB2-07 fixed controller source-card removal component: `REVIEW_ACCEPTED` at candidate `7cfa53b1dcea1f8b0769ff247924724d20d1d626`, independent R24 `e9e6112ced21ffad738fa00025132f9c3fe9976d`.
- Exact F1 component alignment is 12 identities; complete migration readiness added is 0 because every aligned identity retains another parent/special dependency. No F1 authoring migration occurred.
- Existing B15 `move_source_card -> skill` semantics remain unchanged; FB2-07 adds only the typed `removed_from_game` destination for the executing controller-owned/controller-controlled source.
- Fresh A raw coverage remains `new=12 / legacyExecute=3 / legacyResolve=49 / dual=0 / notClassifiable=28 / taxonomyWarnings=79`; compiled identity remains definition hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`, 70 cards, 14 characters, 0 blocking issues.
- Generated coverage drift remains timestamp/static-line-only and is intentionally not committed.
- Independent R24 evidence: typecheck PASS; focused `34/34`; rules `274/274`; deterministic PASS; full CI `687/687`; identity/forbidden-file audits clean; corrected quoted-range diff check PASS.
- Broad Card Zone, Return-by-definition/Card Create, Trigger/Lifecycle/Target/Movement/Power/Special, and F4 migration remain unpromoted.

## P3-A FB2-08 Synchronization — 2026-09-16

- FB2-08 exact source-play/basic-attack controller draw-1 trigger: `REVIEW_ACCEPTED` at candidate `ea6a1522f6382ef617ae26fbca7d208e999f204f`, independent R25 `33f0a0e1b3e9c4c62c8eb713ae45cd7117c7a0a7`.
- Independent evidence: typecheck PASS; focused `78/78`; Drake Riding `5/5`; all rules `280/280`; deterministic hashes unchanged; second clean full CI `693/693`. One first-run unrelated executable-pack test timeout was isolated twice at 65ms/59ms PASS.
- Fresh A raw coverage remains `new=12 / legacyExecute=3 / legacyResolve=49 / dual=0 / notClassifiable=28 / taxonomyWarnings=79`; compiled identity remains 70 cards / 14 characters / 0 blocking issues with definition hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`.
- Regenerated coverage drift is timestamp/static-line-only and is intentionally not committed.
- Frozen F1 recheck confirms 14/14 selected servant skills have `blockedBy=[]`, required capabilities exactly `[CARD_ACTION_PLAY, GENERIC_CARD_ZONE]`, no extra semantic axes, and the identical two-clause source overlay.
- TO13 + FB2-06 + FB2-08 now close the full composite dependency for those 14 identities. This is the first honest 10–40 F4 migration batch, so P3-FM01 is dispatched READY at 14 exact IDs.

## P3-A FM01 Migration Synchronization — 2026-09-16

- First F4 batch S candidate: `6203b70c5bc2a81ceecca31008dc2b71246519a9`; exact selected membership 14, newly canonical 13, pre-existing canonical Drake 1, skipped 0, runtime hot-file changes 0.
- Frozen 944-ID canonical-authoring overlap moves `24 -> 37` (+13); selected-batch authoring presence moves `1/14 -> 14/14`; no non-selected F1 ID is added.
- A fresh material coverage: archives `27`, cards `59`, abilities `118`, raw `new=12 / legacyExecute=3 / legacyResolve=75 / dual=0 / notClassifiable=28 / taxonomyWarnings=92`.
- All 26 newly visible abilities are structurally identical, identity fields aside, to the two pre-FM01 Drake Riding representatives (`STRUCTURAL_MISMATCHES=0`). Those accepted Drake representatives were already labeled `LEGACY_RESOLVE_EFFECT`, so raw reporter growth records its existing TO13/FB2-08 classification gap rather than a new legacy runtime implementation.
- Compiled product definition remains unchanged at hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`, 70 cards, 14 characters, 0 blocking issues; unclassified items and dual-runtime count are unchanged.
- Independent A checks: typecheck PASS, focused `30/30`, content validation PASS, deterministic generated content unchanged, lineage diff check PASS. S supplied full CI `693/693` and rules `280/280`.
- R26 is READY; F4 is not accepted until independent review.

## P3-R26 / FM01 First F4 Migration Acceptance — 2026-09-16

- P3-FM01 first F4 batch: `MIGRATION_ACCEPTED` for exactly 14 Riding-family identities.
- S candidate: `6203b70c5bc2a81ceecca31008dc2b71246519a9`; A synchronization: `3b11668ba894d24dce9eef500d34ee74b1680355`.
- Canonical frozen-F1 authoring overlap moves `24 -> 37` (+13); exact batch moves `1/14 -> 14/14`; unauthorized F1 additions=0.
- Independent R26 evidence: source hashes 14/14; focused 30/30; rules 280/280; full CI 693/693; content validation 0 blocking; deterministic generated-content unchanged; runtime hot-file changes=0.
- Fresh reviewer coverage reproduces the A artifact except `generatedAt`; 26 newly visible abilities have zero structural-signature mismatches against the already accepted Drake representatives.
- Raw reporter `legacyResolveEffect=75` is retained without KPI/classifier redefinition because Drake's accepted representative abilities are already labeled the same way. No broader runtime or taxonomy acceptance is implied.

## P3-R27 / FB2-09 Movement Acceptance — 2026-09-16

- FB2-09 narrow any-location-except-workshop controller Movement contract: `REVIEW_ACCEPTED` at candidate `8c3667fc725520f3aed024a15afdd39cfbda2a0a`.
- Independent R27 evidence: focused 22/22; rules 287/287; full CI 700/700; deterministic generated content unchanged; frozen-identity runtime hits=0; authoring diff=0.
- The accepted route is identity-free, typed through Resolution Data-flow, revalidates the authoritative legal destination set, and preserves movement counters/log/enter-location event provenance.
- Broad Movement, forced/third-party/arrow movement, movement costs/conditions/modifiers, generic Target Selection, and FM02 migration are not promoted by implication.
- A must freshly reconcile the exact frozen 12-member F1 family before FM02.

## P3-A FB2-09 Synchronization / FM02 Dispatch — 2026-09-16

- R27 accepts FB2-09 at `698dba5a8476e3d86363f286c57c9f515746eb3f`; fresh A F1 reconciliation is exact 12/12.
- All 12 have only `GENERIC_MOVEMENT`, exact `ACTION + MOVE_PLAYER` axes, identical source hash `5d3fd4e656083f54831c208f2e7b3c9a4ffd5977776e3a3b5214c868596ca1c0`, and no current canonical authoring.
- Fresh raw coverage remains `new=12 / legacyExecute=3 / legacyResolve=75 / dual=0 / notClassifiable=28 / taxonomyWarnings=92`; compiled identity remains unchanged.
- Coverage artifact drift is generatedAt/static source-line-only and is intentionally not committed.
- FM02 is the second honest F4 migration batch and is dispatched READY at exact size 12.
