# Rules Package

This package owns deterministic rules execution for the 7-player FD prototype.

## Must-Have Structure

- `src/schema/game.ts` - game, player, turn, and status models
- `src/schema/card.ts` - card identity and runtime instance models
- `src/schema/effect.ts` - effect timing, stack items, and resolver contracts
- `src/schema/location.ts` - map, location policy, and optional topology models
- `src/schema/visibility.ts` - public/owner-only/hidden visibility types
- `src/core/phase-machine.ts` - legal phase graph and window progression
- `src/core/game-loop.ts` - round orchestration using the phase machine
- `src/core/map-engine.ts` - enabled-location and movement legality checks
- `src/core/situation-engine.ts` - remaining-player threshold and round-start situation application
- `src/core/event-engine.ts` - event visibility policy and placement helpers
- `src/core/effect-resolver.ts` - timing-window stack consumption
- `src/core/combat-resolver.ts` - battlefield resolution entry and reveal hooks
- `src/core/scoring-resolver.ts` - active-player counting and threshold checkpointing
- `tests/schema/` - schema-level encoding checks
- `tests/core/` - phase, map, and resolver tests

## Validation And Replay Structure

- `src/tools/replay.ts` - serializable replay log generation for seeded scripts
- `src/tools/simulate.ts` - deterministic seeded-scenario runner for validation and regression

Still deferred in behavior depth:

- real card-text handlers inside `effect-resolver`
- numeric battle math and attribute resolution inside `combat-resolver`
- VP and military-result settlement inside `scoring-resolver`
- deck draw/discard state inside situation and event engines

## Resolver Boundaries

- `phase-machine` knows legal sequencing and window availability only.
- `game-loop` advances rounds, asks policy subsystems for work, and records deterministic logs.
- `map-engine` decides adjacency, occupancy, and event insertion legality.
- `effect-resolver` owns timing windows, delayed effects, replacements, and generated state transitions.
- `combat-resolver` computes legality, modifiers, reveals caused by combat flow, and military result.
- `scoring-resolver` applies VP, elimination, threshold updates, and post-battle rewards.

## First Test Targets

- schema encodes a 7-player game with optional Moon Holy Grail disabled
- schema encodes a 7-player game with optional Moon Holy Grail enabled
- phase machine walks one full round without skipping required windows
- eliminated players stop receiving action windows
- location policy rejects illegal movement or occupancy
- visibility state remains deterministic across reveal triggers
- remaining-player thresholds gate climax situations deterministically
- hidden event placement stays hidden until a rule requests reveal
- seeded replay logs reproduce the same state snapshots on rerun
