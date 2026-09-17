# P3-B13 Battle Loss Resource Trigger Runtime Handoff

- Document Role: `RUNTIME_HANDOFF`
- From: Codex A / P3-A03
- To: Codex B
- Task: `P3-B13`
- Underlying accepted current-lineage base: `64dbd16927fc9df4a03b235d2e882534fb8b659e`
- Target Branch: `codex/b-p3-b13-battle-loss-resource-r1`
- Reviewer Task: `P3-R07`
- Status: `READY`
- Allowed Completion Claim: `IMPLEMENTATION_COMPLETE_CANDIDATE`

## Why This Task Exists

P3-TO-14 Battle Result / Scoring / Resource Envelope is independently accepted as a specification, but it explicitly authorizes no runtime migration. A fresh B-owned runtime slice is therefore required.

Fresh A inspection of the accepted current lineage found a concrete `RUNTIME_SEMANTIC_GAP`:

1. `packages/rules/src/core/combat-resolver.ts::resolveBattlefield()` currently dispatches `after_battle_result_determined` immediately after each battlefield result is created.
2. `packages/rules/src/ability/interpreter.ts::processEvent()` immediately derives `after_controller_wins_battle`, `after_controller_gains_victory`, and `after_controller_loses_battle` from that event.
3. `packages/rules/src/match-session.ts::resolveBattlePhase()` applies `applyBattleScoring()` only after the battlefield loop completes.
4. Therefore ordinary post-battle result consumers can currently settle before all battlefield base scoring is complete.

That ordering violates the accepted TO14 phase-wide boundary: all supported battlefield base scoring must finish before ordinary result/win/loss/first-loss continuations settle.

## Exact Representative

Only this direct result consumer is migrated by P3-B13:

```text
archive: master.shinji
card: master.shinji.skill.clown
ability: clown.lose-command-seal
kind: forced_trigger
trigger: after_controller_loses_battle
effect: adjust_command_seals(-1)
directive: lose_command_seal_after_battle_loss
```

Why this representative is selected:

- it is a forced post-result trigger with no target, hidden information, optional response, modifier, movement, lifecycle, or power dependency;
- its effect is already expressible by the accepted typed Resource/Numeric primitive;
- the accepted Trigger Gateway already owns event discovery/idempotency semantics;
- existing baseline behavior already asserts that Shinji loses one command seal after losing a battle;
- it is the smallest direct TO14 consumer that can prove the Battle -> Trigger -> Resource bridge without broad family migration.

No other Battle consumer inherits migration or Gate status from this slice.

## Required Runtime Contract

P3-B13 must implement one generic, identity-free bridge with these properties.

### 1. Phase-wide post-scoring barrier

For a `MatchSession` battle phase with multiple enabled battlefields:

- determine/record all supported battlefield results first;
- commit base scoring for all resolved battlefields before ordinary post-battle result consumers execute;
- only after scoring succeeds may result/win/loss/first-loss events for the resolved battlefields enter Trigger Gateway settlement;
- a two-battlefield regression must prove a Shinji loss trigger cannot reduce command seals before the second battlefield's base scoring is present.

This task does not need to migrate every TO14 event family, but it must not preserve the known early-dispatch behavior for the representative path.

### 2. Stable server-owned battle identity

Every battle-derived event used by this slice must carry stable server-authored identity sufficient for deterministic replay/reconnect:

- `battlePhaseResolutionId`;
- `battleId`;
- `resultId`;
- `battlefieldId`;
- authoritative `playerId` for controller-specific events.

These values must be derived from server state/phase/battle order, never client payload or card/ability IDs.

If the implementation introduces these fields on the shared `AbilityEvent`, they must be optional for unrelated event families and required/fail-closed for the claimed battle-result route.

### 3. Existing first-loss compatibility

TO10/B07 first-loss behavior must remain correct:

- first-loss ownership is still derived from authoritative `MatchSession` battle history;
- the loss ordinal remains authoritative and exactly `1` for the first loss;
- later losses do not re-stage the delayed activation;
- Olga delayed activation still occurs at formal round end;
- first-loss event settlement for this production path must not occur before the phase-wide post-scoring barrier opens.

No Olga identity branch is permitted.

### 4. Shinji typed Resource route

The exact Shinji semantic shape must route through the typed resolution-dataflow Resource path, not legacy `resolveEffect`:

```text
forced_trigger
+ after_controller_loses_battle
+ no conditions / targets / cost / creates / modifiers / lifecycle / response window
+ exactly one adjust_command_seals effect
+ controller resource target
+ integer amount
```

Eligibility must be semantic. A synthetic ability with the same legal shape and a different ID must classify the same way.

Malformed near-miss shapes must fail closed or remain outside the claimed route; they must not fall back after being classified as B13-supported.

### 5. Exactly-once / replay safety

A successful loss-trigger resource mutation must happen exactly once per stable battle result event.

Reconnect, projection, stale command replay, or re-entry into battle-phase settlement must not:

- generate a second battle result identity;
- run Shinji's command-seal loss twice;
- re-stage Olga first-loss;
- increment resource state merely because a client reconnects/projects.

### 6. Scope boundary

P3-B13 does **not** migrate:

- the other 12 direct TO14 post-result/phase-terminal consumers;
- optional win/result triggers;
- `after_battle_ended` phase-terminal consumers;
- `after_controller_gains_victory` producer semantics beyond what is required to avoid early settlement regression;
- Battle Power / Modifier logic;
- no-eligible-winner policy;
- broad scoring-envelope rewrite;
- Hidden Information, Interaction, Movement, Lifecycle, Special, or unrelated Card Action semantics.

If a generic change is required to move existing result events behind the scoring barrier, it must be minimal and covered by compatibility tests; it does not grant migration status to sibling rows.

## Exact Evidence Required

### Gate A

- typecheck PASS;
- compiler/runtime classifier positive synthetic same-shape case;
- malformed near-miss negative cases;
- proof that supported Shinji path does not invoke legacy `resolveEffect`.

### Gate B

At minimum:

1. one real single-battle Shinji loss through `MatchSession` showing command seals `3 -> 2` after base scoring;
2. one two-battlefield scenario proving all battlefield base scoring logs/state are present before the Shinji loss-trigger mutation/event settlement;
3. one no-loss scenario proving no command-seal mutation;
4. one repeat/re-entry/idempotency scenario proving exactly-once settlement;
5. TO10 Olga first-loss regression remains green.

### Gate C

A fresh real browser/server scenario must cover:

- a session containing the Shinji Clown representative;
- authoritative battle loss -> command seal mutation;
- reconnect after settlement preserving the same command-seal value and battle identities;
- stale revision rejection with no duplicate command-seal loss;
- two-battlefield ordering evidence, either in the same browser scenario or a dedicated browser/server fixture that exposes the ordering trace.

Historical Golden Flow 2 or B07 browser evidence may be used only as infrastructure reference; it cannot substitute for fresh B13 Gate C.

## Compatibility Gates

B13 must rerun at least:

- TO10 Card Action focused contracts;
- TO09 Card Zone representative tests;
- TO08 Resource tests;
- TO11 Trigger representative tests;
- TO12 Lifecycle representative tests;
- TO13 Interaction boundary tests;
- existing battle/combat/scoring regressions;
- existing Olga ACTIVATE regression/E2E where practical.

Any deterministic regression in an accepted current-lineage boundary blocks the candidate.

## Allowed Runtime Files

B owns only the files actually needed for this slice. Expected hot files are:

- `packages/rules/src/match-session.ts`
- `packages/rules/src/core/combat-resolver.ts`
- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/types.ts`
- `packages/rules/src/ability/executable-card-pack.ts` only if compiler fail-closed support requires it
- `packages/rules/src/ability/resolution-dataflow.ts` only if shared typed Resource integration requires a narrow change
- focused B13 tests and scoped B13 E2E/support fixture
- scoped B13 implementation report

Do not edit coverage KPI/taxonomy/classifier artifacts as part of B13. Global coverage synchronization remains Codex A-owned after R07 judgment.

## Reviewer Boundary

Codex B stops at `IMPLEMENTATION_COMPLETE_CANDIDATE`.

A fresh P3-R07 reviewer must start from the exact frozen B13 candidate SHA and independently judge:

- TO14 ordering compliance;
- identity-free semantic routing;
- no legacy bypass;
- two-battlefield post-scoring barrier evidence;
- exactly-once/reconnect/stale behavior;
- TO10/B07 first-loss compatibility;
- Gate A/B/C.

Only after R07 acceptance may A03 synchronize B13 coverage/evidence.
