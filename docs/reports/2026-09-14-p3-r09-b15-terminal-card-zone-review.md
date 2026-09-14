# P3-R09 Independent Review — B15 Battle-Terminal Card Zone

## Snapshot

- Reviewer task: `P3-R09`
- Reviewer branch: `codex/r-p3-b15-terminal-card-zone-r1-review`
- Exact target: `26be105af227306e5a7154ca0d7cdccac34d72bf`
- B15 handoff/base: `7f9e98c9f85b90797c635d2e6f8aede9cc4bb4ae`
- Accepted B14 evidence-sync ancestor: `b500052`
- Representative: Ereshkigal `sc-ereshkigal-2.return-to-skill-zone`
- Review status: `GATE_A_B_CANDIDATE_ACCEPTED`
- Gate C: `PASS`

This review started from the exact frozen B15 candidate in a fresh worktree. The reviewer installed its own dependencies and verified all workspace package links resolve to the reviewer worktree. No implementation-side green result was inherited as acceptance evidence.

## Findings

No blocking R09 finding was identified.

The reviewed slice is generic and identity-free. It introduces a stable once-per-battle-phase terminal event and a typed source-card-to-skill primitive without branching on the Ereshkigal/card/ability identity.

## Gate A — primitive/compiler contract

**PASS**

Independent reviewer verification confirms:

- `move_card(target=this_card,to=skill,owner=controller)` is normalized only for the exact supported semantic;
- the typed primitive is `move_source_card`;
- success returns `movedCount=1` through the normal result-binding envelope;
- success emits typed `source_card_moved` evidence;
- wrong controller and off-board source reject atomically;
- same-family malformed destination is rejected before legacy execution;
- a semantically equivalent ability with a completely renamed ability ID still classifies;
- a destination near miss does not classify.

## Gate B — authoritative runtime ordering

**PASS**

Both authoritative battle paths use the reviewed terminal contract:

1. resolve battlefield results;
2. perform base scoring;
3. dispatch ordinary post-scoring result/first-loss work;
4. dispatch one terminal `after_battle_ended` event only after all ordinary post-battle work and pending interaction work are clear;
5. continue to cleanup.

The stable terminal event ID is:

```text
${battlePhaseResolutionId}:after_battle_ended
```

The event retains `battleIds`, `resultIds`, `scoringReceiptIds`, and stable-deduped frozen participant IDs.

### Independent adversarial probe

A temporary reviewer-only probe (deleted after execution) verified:

```json
{
  "classifierRenamedExact": true,
  "classifierNearMissRejected": true,
  "stableEventId": "battle-phase:r09:after_battle_ended",
  "participantIds": ["p1", "p2", "p3"],
  "blockers": {
    "pendingPostBattleEvents": true,
    "pendingDecision": true,
    "responseWindow": true,
    "hostRequest": true
  },
  "stableReplayDeduped": true,
  "wrongControllerAtomic": true,
  "offBoardAtomic": true
}
```

The terminal event therefore cannot flush early across any of the four required blocker classes. Once all blockers clear, it flushes once, moves the source once, and a replay of the same stable phase ID neither restages nor remutates state.

## Gate C — remote-room / browser proof

**PASS**

Fresh reviewer run:

```text
npx.cmd playwright test e2e/fd-ereshkigal-battle-terminal-card-zone.spec.ts --project=chromium
1 / 1 PASS
```

It independently reproduces:

- real remote room/server path;
- two battlefield result dispatches before terminal dispatch;
- source card `attack_area -> skill` before cleanup;
- owner projection of the resulting owner-only skill card;
- reconnect preservation;
- stale-revision rejection;
- exactly one terminal event and no duplicate move.

Before execution, the reviewer verified `@fd/rules`, `@fd/content`, `@fd/client`, and `@fd/server` all resolve into the fresh R09 worktree.

## Focused and compatibility regression

Fresh reviewer execution:

```text
npm.cmd run typecheck
PASS

8 focused/compatibility files
112 / 112 tests PASS
```

The compatibility set includes B13 battle-loss resource ordering, B14 shared-victory VP ordering, B15 terminal movement, core battle cleanup, result data-flow, complex skill regressions, MatchSession, and MatchRoom.

## Full baseline

Fresh reviewer root-suite run:

```text
npx.cmd vitest run --testTimeout=15000
Test files: 99 passed / 10 failed / 109 total
Tests:      655 passed / 20 failed / 675 total
```

This exactly reproduces the implementation-side B15 result.

Accepted B14 baseline was:

```text
648 passed / 20 failed / 668 total
```

Therefore the B15 delta is:

```text
+7 PASS / +0 FAIL
```

All 20 failures remain the inherited local CHM/original-image evidence absence class. No B15 runtime/compiler/battle/session/room/projection/reconnect/Card-Zone failure appears in the failure set.

## Production diff audit

Reviewed production diff from `7f9e98c9...` to exact target `26be105a...` touches:

- `packages/rules/src/ability/battle-terminal.ts`
- `packages/rules/src/ability/executable-card-pack.ts`
- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/src/ability/types.ts`
- `packages/rules/src/core/game-loop.ts`
- `packages/rules/src/match-session.ts`

Reviewer search found no `eresh`, `ereshkigal`, representative card ID, or representative ability ID in the production diff.

The supported semantic is routed through typed `executeResolutionEffects()`. The same-family unsupported shape is explicitly rejected with `resolution_failed` before legacy `executeEffects` can silently take it.

`git diff <handoff>..<target> --check` passes.

## Final verdict

- Gate A: **PASS**
- Gate B: **PASS**
- Gate C: **PASS**
- Baseline: **PASS with the same 20 inherited environment-only failures**
- Identity-routing audit: **PASS**
- Adversarial fail-closed / exactly-once review: **PASS**
- **Overall: `GATE_A_B_CANDIDATE_ACCEPTED`**

This acceptance is scoped to the B15 phase-terminal source-card return contract. It does not promote Gatou rewards, Tomoe unpreventable loss, Achilles reveal, Olga transformation, optional battle-result interaction, or unrelated Modifier/Power/Special behavior.
