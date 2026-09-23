# P3-A FB2-54 Event Power / Uncontested Win Reward Dispatch

Role: Codex A
Status: `DISPATCHED`
Date: 2026-09-23

## Baseline

- Exact A-synchronized Base: `5dfcc092e6da09e8c822d9733cee94aeee2eedbc`
- Formal migration: `156/944`
- Remaining: `788`
- Material authoring overlap: `151/944`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- PR #432 / Helena S1 is accepted and A-synchronized but remains OPEN / unmerged / unretargeted.

FB2-54 is identity-free capability infrastructure and earns **zero migration credit**.

## Fresh migration-credit-first probe

A reran the current-baseline mechanically absent, source-grounded / contract-mapped / block-free population after R114. No remaining frozen identity is honestly `S_READY_NOW`.

The lowest apparent loader-gap card, `servant.darius.skill.sc-darius-3`, cannot be selected: it hard-depends on frozen `servant.darius.skill.sc-darius-4`, whose inventory route is `SOURCE_EVIDENCE_REQUIRED / EXPLICIT_BLOCK` with `SEMANTIC_SOURCE_REQUIRED`; Locked Reference has no authoring card for S4. A must not synthesize that missing semantic source.

`master.twice.skill.ascension` is next by raw gap count but spans three independent runtime/registration boundaries: lowest-VP predicate, a new persistent combat-power modifier, elimination replacement, plus ascension registration. It is not a narrow one-seam closure.

Fresh no-write source/runtime decomposition of the next bounded candidates shows `servant.mechaeli.skill.sc-mechaeli-2` can reuse accepted authoritative infrastructure for both clauses:

- movement uses server-owned `after_controller_enters_location`; FB2-31 `event_player_is_opponent` and FB2-43 `event_location_equals_controller` are already accepted;
- battle settlement uses server-owned `after_battle_result_determined`, which derives exact `after_controller_wins_battle` events retaining trusted `battleParticipantIds`, `battlefieldId`, battle/result identity and winner/loser facts;
- controller +4 VP can reuse the existing authoritative `adjust_victory_points` path and FB2-51 VP provenance recording;
- card power calculation already consumes source-bound `ongoingEffects` with `card.currentPower` modifiers.

Therefore the only missing runtime seam can be bounded as the exact two-clause event family below. This dispatch authorizes no Mechaeli authoring.

## First frozen consumer evidence

Future consumer only: `servant.mechaeli.skill.sc-mechaeli-2` (`钢铁天空魔女`).

Locked source clauses:

1. `每有一名对手进入你所在的战场，你的合计威力便+2。`
2. `战斗阶段：若你在未交战的情况下赢得战斗胜利，获得4点战果。`

The B2 implementation must remain independent of this identity/name/text. The consumer is only the bounded proving shape.

## Exact FB2-54 capability contract

Implement one identity-free **event power / uncontested-win reward family** with exactly two accepted whole-ability shapes.

### A. Opponent-enter source-power accumulation

Accepted normalized ability shape only:

- automatic `forced_trigger`;
- trigger exactly `after_controller_enters_location`;
- conditions, in order, exactly:
  1. `{ type: "source_active" }`;
  2. `{ type: "event_player_is_opponent" }`;
  3. `{ type: "event_location_equals_controller" }`;
- no targets, cost, creates, rule modifiers, lifecycle, response window, limit or visibility widening;
- exactly one effect: `{ type: "source_card_combat_power_bonus", amount: 2 }`.

Runtime semantics:

- only a trusted movement event for an active opponent whose authoritative destination equals the source controller's current battlefield qualifies;
- controller movement, other-location movement, inactive/face-down/invalid source and forged/malformed events do not qualify;
- each distinct trusted qualifying movement root contributes exactly +2 to the source physical card's current combat power;
- distinct qualifying events stack additively;
- duplicate event ids are idempotent through the existing processed-event boundary;
- the installed bonus is source-bound and applies only while that exact physical source remains active/face-up in an active area; closing/deactivating/face-down/removing the source immediately stops all accumulated bonus contribution;
- no round reset and no generic player flag/counter/metric API is introduced.

Implementation may represent each accepted +2 as a narrow source-bound ongoing `card.currentPower` modifier or an equivalent serialized source-card ledger, but it must fail closed on malformed persisted state and must not affect other cards/controllers.

### B. Uncontested controller-win +4 VP

Accepted normalized ability shape only:

- automatic `forced_trigger`;
- trigger exactly `after_controller_wins_battle`;
- conditions, in order, exactly:
  1. `{ type: "source_active" }`;
  2. `{ type: "event_location_equals_controller" }`;
  3. `{ type: "event_battle_opponent_count_equals", count: 0 }`;
- no targets, cost, creates, rule modifiers, lifecycle, response window, limit or visibility widening;
- exactly one effect: `{ type: "adjust_victory_points", player: "controller", amount: 4 }`.

The new condition is accepted only in this whole-family envelope and must read the authoritative frozen battle root retained on the derived controller-win event:

- exact server battle/result identity must be present and correspond to a trusted `trustedBattleResultSnapshots` entry;
- controller must be the derived event player and a winner/participant of that same trusted battle;
- `battleParticipantIds` must be unique, known players and exact-match the trusted root;
- count is literal `0` only and means no participant other than controller in that battle; current mutable player locations must not substitute for frozen participants;
- a contested battle, malformed/forged/stale provenance, unknown participant, mismatched battlefield/result id, or non-controller derived event fails closed / does not qualify without VP mutation;
- successful reward uses the existing authoritative VP mutation/provenance path so the +4 is observable by downstream VP-change consumers exactly once.

## Loader / compiler fail-closed requirements

- Reserve `source_card_combat_power_bonus` and `event_battle_opponent_count_equals` only for the exact FB2-54 whole-family positions above.
- Wrong amount, wrong count, wrong trigger, wrong condition order, extra fields, extra effects, extra modifier/lifecycle, or either reserved vocabulary outside the exact family must make loader/compiled execution unsupported.
- Near-match generic movement, generic combat reward, generic card-power, arbitrary opponent-count and arbitrary VP effects must not become accepted by this task.
- Do not route by Mechaeli/card id/name/printed text/hash or Reference handler identity.

## Production scope

B2 may touch only the minimum rules/runtime/schema/test surfaces required for this capability, expected around:

- one new bounded classifier/helper under `packages/rules/src/ability/**`;
- loader/interpreter/index wiring;
- `AbilityRuntime` schema only if a narrow serialized ledger is actually needed;
- authoritative event validation only as necessary to consume already-produced movement/battle facts;
- focused FB2-54 tests.

Forbidden:

- `data/authoring/**` consumer material;
- product/generated/pack/client changes;
- broad generic counter/metric/flag/rule engines;
- Darius S3/S4, Twice, Gorgon, Atalanta or any other consumer authoring;
- merge/retarget;
- migration credit.

## Required B2 evidence

At minimum prove:

- authoring and compiled exact-family classifiers accept only both exact shapes;
- malformed/widened/wrong-position reserved vocabulary fails closed;
- opponent movement into controller battlefield installs +2 only on the exact active source, repeated distinct trusted events stack, duplicate id does not;
- controller/other-location/unknown/forged movement does not add power;
- source deactivation/face-down/zone invalidation stops accumulated bonus contribution without mutating other cards;
- controller wins an authoritative battle alone -> exactly +4 VP through normal authoritative provenance;
- any opponent participant -> no reward; shared/other winner, stale/mismatched/malformed battle provenance -> no mutation/fail closed as appropriate;
- existing FB2-31, FB2-33, FB2-43 and FB2-51 compatibility remains green;
- affected focused tests + typecheck + repo-required gates for touched production surfaces + `git diff --check`;
- Base/Candidate exact lineage and clean work/reviewer handoff.

## Accounting / next step

FB2-54 remains **zero-credit**. Formal migration stays **`156/944`**, `788` remaining; material overlap stays **`151/944`**.

After exact fresh independent R `IMPLEMENTATION_ACCEPTED_CANDIDATE` plus A synchronization, A must freshly reconstruct the whole `servant.mechaeli.skill.sc-mechaeli-2`. Dispatch singleton S only if the complete frozen card is then zero-gap; otherwise dispatch only the minimum residual seam.