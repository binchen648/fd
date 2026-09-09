# FD Phase 3 Throughput Optimization Plan

- Document Role: SUBPLAN
- Status: ACTIVE / THROUGHPUT_OPTIMIZATION_CANDIDATE
- Implementation Status: DOCUMENTATION_ONLY
- Acceptance Status: This document does not promote any primitive, card, flow, mechanic family, or release target.
- Parent: `docs/plans/fd-card-engine-stabilization-plan.md`
- Depends On: `docs/FD-DOCUMENT-ROADMAP.md`; `docs/rules/FD-Game-Rules-Final.md`; `docs/plans/fd-rules-conformance-and-acceptance.md`; `docs/plans/fd-phase-3-mechanic-family-rollout-plan.md`; `docs/plans/fd-effect-result-binding-plan.md`; `docs/plans/fd-golden-card-and-flow-acceptance-plan.md`; `docs/audits/fd-skill-mechanic-family-matrix.md`; `docs/audits/fd-skill-primitive-conformance-matrix.md`; `docs/audits/fd-rule-conformance-matrix.md`; `docs/audits/fd-rule-interaction-matrix.md`; `docs/audits/fd-flow-runtime-inventory.md`
- Consumed By: Phase 3 implementers, reviewers, and task coordinators
- Supersedes: purely serial card-by-card or one-contract-at-a-time Phase 3 execution as the default throughput strategy
- Last Verified: 2026-09-09

## 1. Executive Summary

Phase 3 should keep the mechanic-family acceptance model, but increase throughput by moving from a single serial queue to:

```text
Dependency DAG
-> Gateway Primitive Strategy
-> Parallel Mechanic Factory
-> Automated Evidence
-> Legacy Burn-down
```

The current real authoring pool contains 14 archives, 46 cards, and 92 abilities. Fresh inventory reports broad overlap: `TRIGGER` covers 58 abilities, `LIFECYCLE` 49, `INTERACTION` 48, `BATTLE_RESULT` 39, `MODIFIER` 24, `MOVEMENT` 21, `HIDDEN_INFORMATION` 21, `RESOURCE_NUMERIC` 18, `POWER` 18, `CARD_ZONE` 14, and `CARD_ACTION_SEMANTICS` 13.

The previous single-card and single-contract slices created useful reference evidence, but they do not scale. The next throughput gain comes from formal gateway contracts for Trigger, Lifecycle, Interaction, Target Selection, Result Binding, and Event/Projection evidence, while low-risk primitive migrations continue in smaller parallel lanes.

## 2. Current Throughput Bottlenecks

1. `packages/rules/src/ability/interpreter.ts`, `packages/rules/src/ability/resolution-dataflow.ts`, `packages/rules/src/ability/executable-card-pack.ts`, `packages/rules/src/match-session.ts`, and projection/client files are hot files touched by nearly every Phase 3 slice.
2. Most migrations still require hand-written classifier logic, hand-written fixture setup, hand-written Playwright proof, and hand-written report updates.
3. Trigger, lifecycle, and interaction semantics are cross-cutting, so cards that look like simple primitive consumers often inherit hidden dependencies.
4. Existing evidence is mostly implementer-supplied candidate evidence; independent reviewer promotion is not automated.
5. Legacy runtime paths remain active: `executeAbility` / `resolveEffect`, `extended-effects.ts`, `modeState`, old core `game-loop.ts` / `card-play.ts`, multiple projection paths, and compatibility fields.
6. Reports and matrices are manually synchronized, so throughput is limited by governance drift checks.

## 3. Ability Dependency Graph

The ability graph should be interpreted as dependency layers, not as card order:

```text
Authoring JSON
-> executable compiler semantic survival
-> routing classifier
-> primitive registry / shared authoritative hook
-> transaction and result envelope
-> event envelope
-> trigger collector
-> lifecycle owner
-> projection and reconnect
-> Gate A/B/C evidence
```

Mechanic dependencies:

| Family | Depends On | Unlocks |
|---|---|---|
| `RESOURCE_NUMERIC` | numeric expressions, result envelopes, event envelope | battle rewards, payment, command seals, VP effects |
| `CARD_ZONE` | result binding, projection, zone ownership | draw/move/look/shuffle, hidden info, cleanup |
| `CARD_ACTION_SEMANTICS` | playBatch hook, activation/close hooks, event trace | play/add/activate/close normalization |
| `TRIGGER` | event taxonomy, processed-event identity, ordering | forced/optional/passive cards, battle/result hooks |
| `LIFECYCLE` | source identity, duration policy, cleanup events | residual, once-per-game, modifiers, statuses |
| `INTERACTION` | pending decisions, response windows, target/cost contracts | optional triggers, private choice, reconnect |
| `MODIFIER` | lifecycle, source close, power trace | power and rule modifications |
| `BATTLE_RESULT` | power, defeat, event envelope, trigger feed | VP rewards, win/loss abilities |
| `HIDDEN_INFORMATION` | projection, private candidate store, reveal events | true name, hidden passive, private look |
| `SPECIAL_SUBSYSTEM` | domain-specific contracts | independent deck, replacement, random, identity swap |

## 4. Gateway Capability Analysis

Gateway capabilities have low direct card count sometimes, but high unlock value:

| Gateway | Current Evidence | Missing Before Factory Use |
|---|---|---|
| Typed result envelope | Golden Eater and primitive candidates | broader result schemas and auto drift check |
| Semantic-form routing | current resource/card-zone/card-action candidates | reusable classifier DSL, no ability-id routes |
| Event envelope | resource and card-action events in slices | universal `sourceAbilityId`, source card, revision, causation id |
| Trigger registry | string trigger allowlist and `processEvent` | closed trigger contracts, order, optional/forced split |
| Lifecycle policy registry | scattered lifecycle fields and cleanup | source-close, duration, expiration, destination policies |
| Interaction templates | pending target and response windows | reusable prompt template, projection/reconnect fixtures |
| Projection/reconnect harness | several Gate C candidates | generator for viewer matrix and stale replay assertions |
| Legacy burn-down reporter | per-family scripts | one consolidated coverage command |

## 5. Top High-Leverage Primitive Ranking

Ranking uses current count, cross-family dependency value, and ability to reduce legacy owners:

1. Trigger/Event Gateway: covers 58 trigger-family abilities and feeds battle, lifecycle, hidden, and response mechanics.
2. Lifecycle Policy Gateway: covers 49 lifecycle-family abilities and blocks modifier/source-close cleanup convergence.
3. Interaction/Pending Gateway: covers 48 interaction-family abilities and controls target, optional, response, reconnect, and stale behavior.
4. Target Selection Contract: 11 explicit target abilities, but required by hidden/private and result-dependent cards.
5. Result Binding and Numeric Expression: strict count 2 today, but required whenever actual moved/drawn/paid/winner counts affect later effects.
6. Battle Result Envelope: 39 abilities depend on battle-result family semantics.
7. Modifier/Power Source Contract: 24 modifier and 18 power abilities depend on source/lifecycle trace.
8. Card Zone Primitives: 14 abilities; current direct subset is only 2 but unlocks private look/move/shuffle.
9. Resource Numeric Primitives: 18 abilities; direct subset has 3 candidate migrations and remains a foundation.
10. Card Action Split Contracts: 13 abilities; each contract must stay independent (`PLAY`, `PLAY_SOURCE`, `ADD_TO_ATTACK`, `ACTIVATE`, `CLOSE`, `CREATE_AND_ACTIVATE`).

## 6. Mechanic Dependency DAG

```text
Phase 3A result envelope
  -> resource numeric
  -> card zone
  -> card action contracts
  -> target selection
  -> interaction templates
  -> trigger gateway
  -> lifecycle gateway
  -> modifier/power
  -> battle result resource triggers
  -> special subsystems
```

Parallelizable lanes:

```text
Automation/evidence reporter
Trigger taxonomy design
Lifecycle policy design
Low-risk primitive migration
Golden Gate C fixture factory
Independent reviewer checklists
```

Non-parallel hot spot:

```text
runtime routing changes in interpreter/resolution-dataflow/match-session
```

## 7. Parallel Tracks

| Track | Goal | Runtime Risk | Parallel Safety |
|---|---|---:|---|
| A. Automation and Coverage | consolidated inventory/evidence reporter | Low | Can run parallel with all design work |
| B. Gateway Specs | trigger/lifecycle/interaction contracts before coding | Low | Can run parallel with automation |
| C. Low-Risk Primitive Factory | exact semantic-form migrations with existing primitives | Medium | Serialize production hot files |
| D. Gate C Harness Factory | reusable Playwright/server fixture templates | Medium | Avoid simultaneous edits to shared E2E support |
| E. Reviewer Pipeline | checklists and promotion packets | Low | Can run parallel |
| F. Special Subsystem Isolation | inventory and quarantine criteria only | Low now, high later | Keep read-only until gateway dependencies exist |

## 8. File Ownership / Conflict Map

| File Area | Conflict Level | Rule |
|---|---:|---|
| `packages/rules/src/ability/interpreter.ts` | Very High | One implementation task at a time |
| `packages/rules/src/ability/resolution-dataflow.ts` | Very High | One primitive/routing task at a time |
| `packages/rules/src/ability/executable-card-pack.ts` | High | Serialize compiler schema changes |
| `packages/rules/src/ability/types.ts` | High | Serialize public command/result type edits |
| `packages/rules/src/match-session.ts` | Very High | Serialize flow/trigger/lifecycle/runtime bridge edits |
| `packages/rules/src/core/combat-resolver.ts` | High | Serialize power/battle changes |
| `apps/client/src/pages/MatchTable.tsx` | Medium | Coordinate UI command rendering changes |
| `apps/client/src/state/*` | Medium | Coordinate projection fixture changes |
| `e2e/support/*` | Medium | Shared fixture utilities need owner per task |
| `docs/audits/*.mjs` | Low | Safe parallel additions if script names differ |
| `docs/reports/*` | Low | Safe parallel |

## 9. Parallel Work Queue

Use `docs/plans/fd-phase-3-parallel-work-queue.md` as the dispatch document. Production runtime edits must be serialized by hot file ownership; planning, inventory, reporter, and reviewer work can proceed in parallel.

## 10. Trigger Pareto Strategy

Fresh trigger-like inventory over 92 abilities:

| Trigger / Kind | Abilities |
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

Top 5 trigger/kind buckets cover 67 ability memberships if counted by primary trigger/kind bucket. Top 10 cover 83. This should drive the first Trigger Gateway design:

1. `phase_action`
2. `while_active`
3. `on_use_declared`
4. `when_play_requirements_checked`
5. `on_card_played`

Do not immediately implement all trigger handlers. First define event payload, source identity, ordering, optional/forced behavior, duplicate-event id, and projection rules.

## 11. Lifecycle Pareto Strategy

Primary lifecycle/kind inventory:

| Policy Bucket | Abilities |
|---|---:|
| `kind:phase_action` | 31 |
| `kind:passive` | 16 |
| `kind:forced_trigger` | 15 |
| `kind:declaration_reveal` | 9 |
| `kind:phase_action + lifecycle effect` | 3 |
| `unique optional trigger` | 3 |

Top 4 policy buckets cover 71 ability memberships by primary lifecycle bucket. The first Lifecycle Gateway should normalize:

- source identity;
- active/closed source validity;
- this round / while active / round count durations;
- cleanup destination;
- once-per-card/per-game counters;
- expiration event envelope.

## 12. Interaction Template Strategy

Fresh interaction-template inventory:

| Template | Abilities |
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
| simple branch | 2 |

Top 5 non-empty templates cover 35 abilities. The first reusable template set should be:

1. mandatory target window;
2. optional target/payment window;
3. response window;
4. hidden/private look window;
5. event-triggered automatic resolution.

## 13. Automation Strategy

Add automation before more runtime expansion:

- one consolidated `phase3:coverage` script;
- one JSON output for ability family membership, eligible/skipped reason, route owner, Gate A/B/C evidence, and legacy/new/dual counts;
- drift check that docs matrices match script output;
- primitive schema/result-field drift check;
- generated reviewer checklist per mechanic batch;
- generated Gate C inheritance invalidation list;
- stale/reconnect assertion helper for Playwright specs;
- report template that rejects missing `Known legacy paths intentionally retained`.

## 14. Mechanic Coverage Reporter Design

The reporter should output:

```json
{
  "totalAbilities": 92,
  "families": {
    "TRIGGER": { "abilities": 58, "cards": 34 },
    "LIFECYCLE": { "abilities": 49, "cards": 36 }
  },
  "routes": {
    "legacy": 82,
    "semanticCandidate": 10,
    "dualCompatible": 0
  },
  "gates": {
    "implementationCandidate": 10,
    "componentVerified": 0,
    "scenarioVerified": 0,
    "e2eVerified": 0
  },
  "skips": [
    { "abilityId": "...", "reason": "trigger_or_hidden_dependency" }
  ]
}
```

Counts above are baseline planning estimates unless produced by the future command. Independent review must decide final Gate status.

## 15. Legacy Burn-down Metrics

Every batch must report:

| Metric | Meaning |
|---|---|
| total ability count | fixed denominator from `data/authoring` |
| eligible count | exact semantic-form route candidates |
| skipped count with reason | explicit non-inheritance proof |
| legacy consumer before/after | consumers still executing through legacy branch |
| semantic-route before/after | consumers entering Phase 3 route by shape |
| dual-compatible before/after | consumers accepted by both routes |
| card-specific handler count | remaining hardcoded or card-shaped runtime owners |
| Gate C inheritance invalidations | reasons why representative proof cannot be reused |

Current baseline: approximately 10 semantic-routed implementation candidates and about 82 abilities still requiring legacy/special/shared transitional runtime review.

## 16. Gate C Pattern Catalog

Gate C must be pattern-based, not card-count-based:

| Pattern | Representative Candidate | Reusable For | Invalidated By |
|---|---|---|---|
| direct visible resource action | command spell | mana/seal/VP direct actions | trigger, battle, hidden, cost window, movement |
| target -> play -> draw | Time Alter | exact `play_selected_cards + draw_cards` | hidden/private/power/lifecycle variants |
| move all -> bind count -> resource | Conversion Magic | exact all-hand discard/mana binding | private look, optional target, cost |
| source response play | Volumen | exact response source-card play | recursive triggers, variable costs |
| add to attack | Maiya support shot | exact support attachment | normal play counter, suppression/power |
| delayed activate | Olga | exact first-loss pending then round-end activation | general scheduler or create-and-activate |
| source close on visible card play | Artoria Alter | exact visible noble source-close | hidden proof, targeted close, cleanup matrix |
| full action phase | Golden Flow 1 | strict action substep path | non-strict/default flow |
| battle winner/VP | Golden Flow 2 | tied winners and VP split | full power layer or trigger chain |
| result-binding staged target | Golden Eater | typed staged binding | arbitrary full roster result binding |

## 17. Test Factory Strategy

Build reusable fixture factories before writing many more E2E specs:

- `buildRemoteRoomSnapshot({ archetype })`;
- `expectWsStaleRejected(frame)`;
- `expectProjectionFor(viewer, assertions)`;
- `expectNoDuplicateMutation(before, after, invariant)`;
- `expectPendingDecisionRestored(viewer, decisionType)`;
- `expectEventEnvelope(log, fields)`.

Unit/regression test factories should generate:

- semantic classifier positive/negative cases;
- compiler fail-closed cases;
- runtime corrupted-state fail-closed cases;
- legacy fallback rejection once classified;
- event envelope minimum fields.

## 18. Scenario Runner Strategy

Create a rule-scenario runner that drives `MatchSession` without browser overhead:

```text
setup canonical cards
-> assert legal actions
-> dispatch command
-> assert state delta
-> assert event envelope
-> assert projection snapshots
-> assert stale or duplicate command rejection where applicable
```

This gives Gate B throughput. Gate C then verifies only representative browser/server paths for each accepted pattern.

## 19. Special Subsystem Isolation

`SPECIAL_SUBSYSTEM` currently covers 18 abilities / 13 cards. These should not be mixed into core primitive factories until isolated:

- independent deck creation/draw;
- match deck bottom look/swap;
- replacement effects;
- identity replacement;
- deterministic random discard;
- command spell directives;
- return silence / soul drag;
- terrain multiplier / VP transfer.

Each subsystem needs a separate owner, event envelope, projection contract, and deletion criteria for legacy handlers.

## 20. Core Coverage Target

Baseline split:

- strict matrix special subsystem: 18 abilities;
- non-special core-prioritizable: 74 abilities;
- conservative text/effect special estimate from fresh script: 30 special-like abilities and 62 core-like abilities.

Throughput target should be:

```text
first target: 50 core-like abilities with clear routed/skipped reasons
second target: all 74 non-special abilities either semantic-routed or blocked by named gateway
third target: special subsystem contracts
```

Do not use raw card count as the KPI.

## 21. RESOURCE_NUMERIC_CORE Re-evaluation

`RESOURCE_NUMERIC_CORE_DIRECT_ACTION` remains a valid foundation, but it should no longer monopolize Phase 3 sequencing. Current facts:

- resource family: 18 abilities / 12 cards;
- eligible direct actions: 3;
- skipped: 15;
- direct legacy consumers: 3 -> 0;
- semantic-routed direct consumers: 0 -> 3.

Recommendation:

- keep it as a completed implementation-candidate baseline;
- do not expand resource next unless it is trigger-owned, battle-owned, or interaction-owned through the corresponding gateway;
- prioritize Trigger/Lifecycle/Interaction gateway specs plus automation before another resource-only slice.

## 22. 10-Day Throughput Plan

| Day | Work |
|---:|---|
| 1 | Land coverage reporter design and legacy burn-down JSON contract. |
| 2 | Implement read-only `phase3:coverage` reporter and drift checks. |
| 3 | Define Trigger Gateway contracts for top 5 buckets; no production migration. |
| 4 | Define Lifecycle Policy contracts for top 4 policy buckets; no production migration. |
| 5 | Define Interaction Template contracts and reusable pending/reconnect fixture helpers. |
| 6 | Review and promote or reject existing implementation candidates using generated checklists. |
| 7 | Implement first gateway-backed low-risk trigger slice: deployment/location trigger resource or draw, one exact representative. |
| 8 | Implement first lifecycle-backed modifier/source-close cleanup slice, one exact representative. |
| 9 | Implement one hidden/private interaction representative only after template proof. |
| 10 | Burn-down review: update coverage counts, identify next 10 eligible consumers, freeze hot-file queue. |

## 23. Reviewer Pipeline Optimization

Reviewer packets should be generated with:

- canonical rule/card text;
- runtime owner and call path;
- exact semantic form;
- positive evidence;
- negative evidence;
- Gate C inheritance invalidations;
- legacy route before/after counts;
- secondary path scan commands;
- stale/reconnect evidence if relevant;
- explicit non-claims.

No task may request promotion without this packet.

## 24. Parallel Safety Rules

1. Never run two runtime implementation tasks that both edit `interpreter.ts`, `resolution-dataflow.ts`, or `match-session.ts`.
2. Automation, inventory, and reviewer docs may run in parallel with one runtime task.
3. Every implementation task must declare hot files before starting.
4. Every Gate C task must reserve its E2E support files.
5. Never widen a semantic classifier to absorb a skipped card without recording why the prior skip reason is now solved.
6. Never merge `PLAY`, `ADD_TO_ATTACK`, `CREATE_AND_ACTIVATE`, `ACTIVATE`, and `CLOSE` acceptance.
7. Never use Time Alter as family-wide acceptance; it is a reference pattern only.
8. Never claim bulk migration from generated JSON success or green tests alone.

## 25. Risks

- Parallel runtime edits can create silent dual paths.
- Over-generic primitives can merge different canonical semantics.
- Trigger gateway work can accidentally become a generic response stack, which the rules do not allow.
- Lifecycle cleanup can regress hidden information or source-close semantics.
- Browser Gate C can be overused and slow throughput if every card gets its own E2E.
- Underuse of Gate C can hide projection/reconnect failures.
- Existing dirty worktree means file ownership must be explicit before any implementation tasks.

## 26. Exit Criteria

This throughput plan exits when:

- `phase3:coverage` exists and reports total, routed, legacy, dual, skipped, and Gate status counts;
- top Trigger, Lifecycle, and Interaction gateway contracts are written and reviewed;
- at least one gateway-backed batch uses generated evidence packets;
- legacy consumer count decreases without ability-id routing;
- no selected batch introduces unauthorized fallback after classification;
- roadmap and plans report KPI as Legacy Burn-down + Mechanic Coverage, not raw card count;
- independent reviewer can reproduce the current baseline from commands.

Final permitted status for this document:

`PHASE_3_THROUGHPUT_OPTIMIZATION_CANDIDATE`
