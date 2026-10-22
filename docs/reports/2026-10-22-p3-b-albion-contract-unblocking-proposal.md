# Albion source-bound contract / decision proposal

- Date: 2026-10-22
- Proposal status: **UNACCEPTED — FORMAL decision required**
- Exact base: `19ac14d5c3c69e0dbbcb2da2fddb8319a7391f03`
- Owner scope: `servant.albion` (`sc-albion-1`, `sc-albion-2`, `sc-albion-3`)
- Authority boundary: proposal only; it does not alter frozen inventory or
  authorize runtime code

This proposal turns the frozen printed clauses into auditable candidate
contracts while preserving all unresolved choices. It is intentionally not a
semantic normalization or implementation. The source text and clause hashes
are recorded in the companion readiness report.

## S1 — 未能回归于星的龙

### Candidate clause A: `starfall-enter-scouting`

Source-bound candidate mapping:

- Trigger: authoritative controller `player.entered-location` event where the
  entered location is the scouting location and the source card is owned and
  active.
- Interaction: optional branch; if declined, no resource, movement, or
  scheduled-loss mutation is made.
- Branch effects: add this source card to the controller's attack; gain 4 mana;
  gain 2 victory points; choose/move to any location except scouting; schedule
  an 8-mana loss for this controller at combat-phase end.
- Binding: every effect must use the same source card instance, controller,
  event, combat/battle identity, and authoritative movement result. Client
  location or resource claims are not trusted.

FORMAL must decide before implementation:

1. whether “enter scouting” means the movement-completion event only, and
   whether entering by deployment/effect also qualifies;
2. the legal location-choice set and whether the destination is selected before
   or after adding the source card to the attack;
3. whether the source card must remain in the attack/active zone through combat
   end for the scheduled loss to resolve;
4. whether the scheduled 8-mana loss is allowed to clamp at zero or must carry
   an explicit typed insufficient-resource result;
5. whether the once-per-entry branch is replay-idempotent and how a failed
   destination or combat transition rolls back the preceding gains.

### Candidate clause B: `starfall-combat-end-mana-loss`

- Trigger: the authoritative `combat.ending` event for the same source-bound
  combat in which clause A was accepted.
- Effect: lose exactly 8 mana from the source controller, atomically and once.
- Restore/replay: persist source card identity, controller, entry event,
  battle/combat identity, scheduled-effect identity, and settlement status;
  duplicate event delivery must be a no-op and a forged identity must fail
  closed without mutating mana or ledgers.

This clause cannot be implemented from the generic `RESOURCE_NUMERIC` request
alone because the pending schedule and combat-result provenance are not an
accepted Albion contract.

## S2 — 炎之灾厄

Candidate source-bound mapping:

- Lifetime gate: the printed `<每局游戏限一次>` is a server-owned once-per-game
  activation ledger, not a per-round flag.
- Trigger: `player.moved` for the controller, after authoritative movement
  completion, only on that controller's first qualifying move in each round.
- Condition: source card remains active/owned by the controller and the
  once-per-round marker has not already been consumed.
- Effect: add the authoritative movement distance to this source attack's
  power; the printed “until game end” makes the accumulated modifier persist
  through later rounds and must not be cleared at round end.
- Binding: the modifier is source-card and controller bound, with game/round,
  movement-event, and attack identity recorded for replay and restore.

FORMAL must decide before implementation:

1. what movement forms count as “进行移动” (normal, effect, deployment, or
   only player movement through the movement gateway);
2. whether distance is the path length or a rules-normalized numeric distance;
3. whether the modifier is installed when the source card is active in an
   attack, and how a card leaving/re-entering play affects the persistent
   “until game end” state;
4. the exact once-per-game activation timing and the interaction between the
   game-wide gate and first-move-per-round marker;
5. restore validation, duplicate event handling, and power recalculation after
   battle/round transitions.

The frozen semantic matrix names `SET_PLAYER_FLAG` and
`SOURCE_CARD_POWER_BONUS`, but those axes do not themselves prove a complete
typed modifier, lifecycle, or restore contract.

## S3 — 无人知晓的无垢搏动

No semantic mapping is proposed beyond preserving the exact printed text and
the frozen clause SHA. The inventory explicitly marks this card
`SEMANTIC_SOURCE_REQUIRED`, and the current baseline has no accepted
`core.dragon-heart` contract. FORMAL must obtain a source-aligned packet and
decide at minimum:

- authoritative battle-win and post-scoring timing;
- “same attribute and higher power” comparison across all involved attacks;
- whether the condition is evaluated against one opponent or every engaged
  opponent and how multiple matches settle;
- the exact victory-point loss transaction, lower-bound behavior, and
  idempotency key;
- source/card/controller binding and serialized restore/replay cleanup.

No handler name, legacy fixture, or Reference behavior is sufficient to answer
these questions.

## Shared contract boundary

The catalog lists generic Battle Result, Condition, Modifier, Power, Resource,
Status, Trigger, Card Zone, Target, Interaction, and Visibility capabilities
that could eventually support S1/S2. They are reusable shared contracts only
after the relevant capability is independently accepted and an Albion
representative is reviewed. Nothing in the frozen inventory grants Albion
`inheritedAcceptanceContracts` or `partialAcceptanceContracts`, so this
proposal does not inherit behavior from another owner or another card.

## Proposed acceptance sequence

1. FORMAL validates source paths and hashes and accepts a source packet for all
   three canonical IDs; regenerate the frozen inventory/audits under the
   governing authority.
2. FORMAL accepts S1's entry/choice/resource/scheduling and combat-end loss
   contract, including event identity and restore boundaries.
3. FORMAL accepts S2's once-per-game, first-move-per-round, distance, and
   persistent modifier contract.
4. FORMAL defines the S3 Dragon Heart contract and its battle/scoring result
   binding.
5. Only then may B2 implement a Candidate, add focused tests and accepted
   authoring/pack registrations, and hand the exact Candidate SHA to an
   independent GPT-6 Sol Reviewer.

Until those gates close, the owner remains blocked and this proposal must not
be converted into a runtime handler or migration credit.
