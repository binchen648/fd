# P3-B15 Battle-Terminal Card Zone Runtime

## Snapshot

- Task: `P3-B15`
- Branch: `codex/b-p3-b15-terminal-card-zone-r1`
- Handoff/base commit: `7f9e98c` (`docs: dispatch phase3 b15 terminal card zone`)
- Accepted B14 evidence-sync ancestor: `b500052`
- Representative: Ereshkigal `sc-ereshkigal-2.return-to-skill-zone`
- Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
- Independent review required: `P3-R09`

This slice implements a reusable battle-phase terminal event and a reusable typed source-card move to controller skill. Production routing is semantic/structural; it does not branch on Ereshkigal, card definition ID, or ability ID.

## Runtime contract implemented

### Phase-terminal producer

Both authoritative battle paths now use the same terminal contract:

1. resolve all battlefields;
2. apply base scoring;
3. dispatch all ordinary post-scoring battle-result / first-loss work;
4. only after that work and all pending decision/response/host work are clear, dispatch one `after_battle_ended` terminal event;
5. enter cleanup afterward.

The terminal event uses stable identity:

```text
${battlePhaseResolutionId}:after_battle_ended
```

and retains:

- `battlePhaseResolutionId`;
- ordered `battleIds`;
- ordered `resultIds`;
- stable `scoringReceiptIds`;
- aggregate frozen `battleParticipantIds`.

`AbilityRuntime.pendingBattleTerminalEvent` stages the terminal event until the ordinary post-battle queue is settled. `processedEvents` provides re-entry/exactly-once protection.

The same helper is called by both `MatchSession` and the core `stepGameLoop` path. A battle phase with no resolved battlefield still gets one terminal semantic before cleanup.

### Typed source-card move

`move_card(target=this_card,to=skill,owner=controller)` is normalized to the new typed `move_source_card` primitive for the exact supported semantic.

The primitive requires:

- source card exists;
- source is owned and controlled by the ability controller;
- source is in supported active board state (`field` or `attack_area`, active and face-up);
- destination is exactly controller `skill`.

On success it:

- moves the source to `skill`;
- restores controller to the owner/controller;
- makes visibility owner-only;
- marks source inactive;
- emits typed `source_card_moved` evidence;
- returns `movedCount=1` through the normal result/binding envelope.

Wrong controller, off-board source, malformed destination, or other same-family near misses fail closed atomically instead of falling through to legacy execution.

### Trigger source eligibility

The terminal event is global. To avoid collecting inactive copies of the same semantic in unrelated sessions, an identity-free source gate admits the exact battle-end source-return family only when the source is currently on an active, face-up board zone. This is a structural source-state rule, not a representative identity branch.

## Regression evidence

### Typecheck

```text
npm.cmd run typecheck
PASS
```

### Focused + cross-mechanism compatibility

The final compatibility set covers B13, B14, B15, core battle cleanup, data-flow schemas, complex skills, MatchSession, and MatchRoom:

```text
8 files
112 / 112 tests PASS
```

The dedicated B15 regression contains 7 checks covering:

- identity-free classifier and renamed positive case;
- wrong trigger/destination/extra-condition near misses;
- typed source-card move + typed event + binding result;
- off-board primitive rejection with caller state preserved;
- wrong-controller rejection with caller state preserved;
- malformed same-family destination fail-closed before legacy;
- core game-loop terminal-before-cleanup behavior;
- MatchSession two-battlefield ordering, stable terminal identity, exactly-once re-entry, and source return before cleanup.

B07 ACTIVATE compatibility was also rechecked after adding participant aggregation; the legacy synthetic fixture without `participantBreakdowns` remains supported without weakening production participant data.

### Gate C: real remote room / Chromium

```text
npx.cmd playwright test e2e/fd-ereshkigal-battle-terminal-card-zone.spec.ts --project=chromium
1 / 1 PASS
```

The scenario verifies:

- real remote room and real battle-phase progression;
- two battlefield result dispatches precede terminal dispatch;
- Eresh source moves `attack_area -> skill` at the terminal and before cleanup;
- owner projection sees the resulting owner-only skill card;
- reconnect preserves the settled zone/revision;
- stale revision is rejected;
- no duplicate terminal event or second card move occurs.

Before the browser run, all `@fd/rules`, `@fd/content`, `@fd/client`, and `@fd/server` workspace links were verified to resolve to the B15 worktree itself.

## Full baseline

Canonical root-suite comparison uses the same command as accepted B14:

```text
npx.cmd vitest run --testTimeout=15000
```

B14 accepted baseline:

```text
648 PASS / 20 inherited FAIL / 668 total
```

B15 candidate:

```text
655 PASS / 20 inherited FAIL / 675 total
```

Delta:

```text
+7 PASS / +0 FAIL
```

All 20 failures remain the pre-existing local CHM/original-image evidence absence class. No deterministic B15 runtime, compiler, battle, session, room, projection, reconnect, Card Zone, Trigger, or data-flow failure was introduced.

For the narrower `packages/rules/tests` subset, the final run was `417 PASS / 18 inherited FAIL`; the difference in counts is only suite scope. The root-suite result above is the canonical comparison with B14.

## Scope audit

`git diff --check` passes.

Production diff scanning found no literal Ereshkigal/card/ability identity routing. The B15 production changes are limited to reusable battle-terminal staging/dispatch, data-flow primitive/schema support, semantic source eligibility, and the two authoritative battle entry paths.

Out of scope and unchanged by this slice:

- Gatou battle rewards;
- Tomoe unpreventable VP loss;
- Achilles reveal behavior;
- Olga transformation behavior;
- optional battle-result interaction;
- Modifier/Power/Special subsystem migration.

## Promotion status

B15 is implementation-complete but **not promoted by this report**. `P3-R09` must start from the exact frozen B15 candidate SHA and independently reproduce Gate A/B/C, adversarial fail-closed behavior, exactly-once terminal ordering, baseline, and production identity audit before acceptance.
