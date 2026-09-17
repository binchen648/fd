# P3-B20 Unique Win Create/Shuffle Runtime Result

- Date: 2026-09-14
- Owner: Codex B
- Task: `P3-B20`
- Branch: `codex/b-p3-b20-artoriac-luck-on-win-r1`
- Base / A-owned handoff: `80d3299af4ac51a350a32d64524691a822e92177`
- Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`

## Scope

B20 migrates the three accepted TO14 direct consumers currently represented by Artoria Caster's `unique-passive-luck-on-win` abilities, but the production runtime is deliberately classified as the generic structural family `unique win -> exile source -> create one reward in controller deck -> shuffle`.

The structural classifier does not depend on:

- character, card, or ability identity;
- unique-group ID value;
- created reward card ID value.

It requires the exact semantic shape: optional controller-win trigger, controller-only post-battle response, unique trigger-group arbitration, source-in-controller-hand condition, source hand -> removed-from-game cost, one created card into controller deck, and one controller-deck shuffle continuation.

## Runtime implementation

`packages/rules/src/ability/interpreter.ts` now exports `isUniqueWinCreateCardTriggerSemantic()` and routes exact matches through a narrow specialized atomic path rather than the broad legacy executor.

The route emits typed evidence:

- `source_card_removed_from_game`;
- `card_created`;
- `deck_shuffled`.

No generic `effect_resolved` event is emitted for the migrated settlement.

Malformed same-family candidates fail closed with `resolution_failed: Unsupported unique win create-card semantic shape` before legacy fallback. Source-zone validity is rechecked at resolution.

## Red -> green evidence

The initial red state exposed the intended migration gaps:

- no structural family classifier;
- malformed same-family create shapes could still fall through to legacy execution;
- the old executor emitted only generic `effect_resolved` evidence.

An independently present B20 adversarial test additionally required the family to remain independent of group ID and reward-card identity and to emit typed remove/create/shuffle events. The final implementation satisfies both focused B20 suites rather than discarding or weakening either one.

## Gate A / B evidence

Fresh typecheck: PASS.

Fresh current-lineage focused run:

```text
11 test files / 103 tests PASS
```

Coverage includes both B20 focused suites, complex-skill compatibility, B13-B19 battle-result paths, and resolution-dataflow regressions.

B20 proves:

- renamed ability/group/reward IDs still classify when structure is unchanged;
- wrong trigger/source zone/removal destination/shuffle/policy do not classify;
- one unique response window exposes the three sibling choices only to the controller;
- exactly one selected source is removed and exactly one reward is created/shuffled;
- typed remove/create/shuffle events are emitted with the selected ability causation;
- decline makes no card-state mutation and a later distinct win can offer again;
- unrelated/losing battle results do not expose the response;
- stable replay of the same result cannot create or remove a second card;
- malformed same-family shape rejects atomically.

## Gate C evidence

Fresh Chromium current-lineage compatibility:

```text
8 / 8 PASS
```

The B20 browser case proves pending-window reconnect, unique-response settlement, settled reconnect, and stale revision rejection. The same run keeps B13-B19 accepted browser paths green.

## Full root baseline

Fresh root Vitest result:

```text
Test files: 105 PASS / 10 FAIL / 115 total
Tests:      687 PASS / 20 FAIL / 707 total
```

All 20 failures are the inherited CHM/original-image evidence absence class. Relative to accepted B19 (`677 PASS / 20 inherited FAIL / 697 total`), the combined B20 evidence adds `+10 PASS / +0 new deterministic failures`.

## Production diff audit

Relative to the B20 handoff base:

- production runtime change: `packages/rules/src/ability/interpreter.ts` only;
- no authoring/content identity mutation;
- no `resolution-dataflow.ts` change;
- no `artoria`, `artoriac`, `sc-artoria`, `servant.artoria`, or `card.luck` literal appears in the production diff;
- the compatibility export name `isUniqueLuckOnBattleWinSemantic` is an alias only; classification/routing does not inspect that term or any representative identity;
- `git diff --check`: PASS.

Test/evidence additions:

- `packages/rules/tests/regression/battle-win-unique-create-card-trigger.test.ts`;
- `packages/rules/tests/regression/battle-win-unique-luck-trigger.test.ts`;
- `e2e/fd-artoria-caster-luck-on-win.spec.ts`;
- this report.

## Explicit non-promotion

B20 does not promote:

- Artoria Caster `gain-vp-if-not-sole-winner`;
- Gatou battle-end reward;
- Tomoe defeat penalty;
- Olga loss-transform;
- broad TO14 optional-trigger behavior;
- TO15 Modifier/Power;
- TO16 Special;
- A-owned coverage classifier/KPI/taxonomy.

## R14 handoff

Freeze the exact candidate commit from this branch. P3-R14 must begin in a fresh reviewer worktree at that exact SHA, make no implementation fixes, independently verify both B20 focused suites, structural identity independence, typed remove/create/shuffle evidence, unique-group/exactly-once behavior, Chromium Gate C, and the full-root inherited-failure baseline before A03 may count the three current direct consumers as accepted.
