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
