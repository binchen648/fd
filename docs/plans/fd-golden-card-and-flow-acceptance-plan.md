# FD Golden Card and Flow Acceptance Plan

- Date: 2026-09-07
- Acceptance baseline: `docs/plans/fd-rules-conformance-and-acceptance.md`
- Canonical rules: `docs/rules/FD-Game-Rules-Final.md`
- Rule matrix: `docs/audits/fd-rule-conformance-matrix.md`
- Interaction matrix: `docs/audits/fd-rule-interaction-matrix.md`

This plan defines candidates and contracts only. It does not promote any card or flow to `E2E_VERIFIED`.

## Golden Card Candidates

| Category | Candidate | Why It Is Suitable | Rule IDs Covered | Key Primitives / Owners | Required Evidence |
|---|---|---|---|---|---|
| A. Multi Effect + Result Binding | Synthetic Phase 3A chain now, then first real card using `remove_advantage_position -> adjust_victory_points` | Current card pool does not yet contain a production real-card binding path; synthetic infrastructure is the safe starting point. | FD-RESULT-BINDING-001, FD-ABILITY-001, FD-VP-001 | Resolution Data-flow, Executable Compiler, future Ability Interpreter integration | Gate A typed result/negative compiler tests; Gate B real Golden Card once migrated; Gate C browser command/projection. |
| B. Modifier + Lifecycle | Artoria Caster `servant.artoriac.skill.sc-artoriac-1` `选王剑` | Residual modifier lasts across current and next round, then cleanup matters. | FD-RESIDUAL-001, FD-CLOSE-001, FD-POWER-001, FD-ROUND-CLEANUP-001 | Ability Interpreter `installOngoing`, `cleanupOngoing`, Combat Resolver | Gate A lifecycle primitive; Gate B MatchSession residual/power/cleanup; Gate C browser play -> next round -> cleanup. |
| C. Multi-target / Interaction | Artoria Caster `servant.artoriac.skill.sc-artoriac-2` `选定之杖` | X cost, private look, target choice, and pending decision make it a strong interaction contract. | FD-ABILITY-001, FD-HIDDEN-001, FD-PROJECTION-001, FD-RESULT-BINDING-001 | Ability Interpreter target/payment runtime, Projection | Gate A target/payment negatives; Gate B MatchSession private choice; Gate C browser payment, target, stale/replay rejection, reconnect. |
| D. Residual + Power | Tomoe `servant.tomoe.skill.sc-tomoe-2` / `sc-tomoe-3` | Terrain doubling and opponent power reduction stress power layers and source duration. | FD-POWER-001, FD-RESIDUAL-001, FD-BATTLE-001 | Ability Interpreter, Extended Effects, Combat Resolver | Gate A power layer trace; Gate B battle scenario; Gate C browser combat settlement. |
| E. Passive + Hidden Information | Achilles `servant.achilles.skill.sc-achilles-1` | Hidden true-name state and defeat-triggered reveal interact with battle result and projection. | FD-PASSIVE-001, FD-DEFEAT-001, FD-TRUENAME-001, FD-HIDDEN-001 | Trigger Engine, Combat Resolver, Projection | Gate A trigger/reveal negatives; Gate B battle defeat scenario; Gate C browser before/after projections. |
| F. Special Play / Add-to-attack / Create-and-activate | Drake `servant.drake.skill.sc-drake-1` `骑乘` and Artoria Alter `servant.artoria-alt.skill.sc-artoria-alt-2` `黑化诅咒` | Covers effect play not consuming normal batch, low-mana play override, residual close on noble use. | FD-PLAY-001, FD-ABILITY-001, FD-RESIDUAL-001, FD-CLOSE-001 | PlayBatch Runtime, Ability Interpreter, Lifecycle | Gate A play counter tests; Gate B two-card/effect-play scenario; Gate C browser batch with negative direct command. |

## Golden Flow 1: Complete Action Phase

Initial state:

- Seven-player standard match.
- Active player is in action phase with legal action ability, legal normal move or pass move, legal two-card batch, and a post-play ability.
- At least one opponent is at a battlefield to test engaged movement denial in a negative branch.

Commands:

1. Query action ability window.
2. Use or decline one legal action ability.
3. Execute `MOVE` or `PASS_MOVE`.
4. Query action ability window again.
5. Commit normal `PLAY_BATCH`.
6. Query action ability window again.
7. End action turn.

Expected flow transitions:

- `ACTION_BEFORE_MOVE_ABILITY_WINDOW -> NORMAL_MOVE_OR_PASS -> ACTION_AFTER_MOVE_ABILITY_WINDOW -> PLAY_BATCH_DRAFT/COMMIT -> ACTION_AFTER_PLAY_ABILITY_WINDOW -> next player/phase`.

Expected events:

- ability declared/resolved or declined, movement event, play batch committed/resolved, action-turn completed.

Expected state delta:

- Movement cost paid once, player location changed or pass recorded, exactly legal cards moved to attack area, costs paid atomically, no movement after play.

Expected projections:

- Active player sees legal commands and private card choices; others see waiting/public deltas only.

Cleanup:

- No unresolved pending decision; staged batch cleared.

Negative cases:

- ability in wrong phase, second normal move, move while engaged, play before resolving pending target, one-card voluntary pass with playable cards, three-card normal batch, stale command.

## Golden Flow 2: Combat + Power + Winner + VP

Current slice status:

- Gate A component evidence exists for tied highest winners via `packages/rules/tests/core/combat-resolver.test.ts`.
- Gate A scoring evidence exists for multi-winner VP consumption via `packages/rules/tests/core/scoring-resolver.test.ts`.
- Gate A projection bridge evidence exists via `apps/client/src/state/engine-bridge.test.ts`.
- Gate B/C remain open; this flow is the recommended first full acceptance demonstration slice.

Initial state:

- Two battlefields with public/hidden event coverage.
- At least one tied highest case, one defeated high-power player, one solo battlefield, one recon player.

Commands:

1. Enter battle phase.
2. Resolve battle abilities.
3. Resolve all battlefield combats.
4. Apply scoring.

Expected flow transitions:

- battle ability windows finish for all eligible players, then scoring starts once per battlefield.

Expected events:

- hidden event reveal, battle resolved, power trace emitted, VP source adjustments, battle scored, after-win/after-loss triggers.

Expected state delta:

- Tied winners represented as all winners, defeated players excluded from winner set, event VP plus competition VP split with ceil, personal rewards separate, recon +2 applied once.

Expected projections:

- Public battle result and filtered calculations; no hidden hands/deck order exposed.

Cleanup:

- Battle results consumed exactly once by scoring.

Negative cases:

- duplicate battle resolution, defeated player highest power, no opponent competition reward, tie split, hidden event not revealed before battle request.

## Golden Flow 3: Round End + Cleanup + Lifecycle

Initial state:

- Active residual skill, temporary attack, non-skill active attack, used once-per-game attack, face-down attack, defeat status, round-end effect.

Commands:

1. Finish scoring.
2. Advance to round end.
3. Run cleanup/lifecycle.
4. Rotate first player or run elimination/final if applicable.

Expected flow transitions:

- scoring -> round end effects -> cleanup -> expiration -> elimination/final -> next round.

Expected events:

- attack closed, residual preserved, temporary dissolved, face-down discarded, status expired, elimination/final checked.

Expected state delta:

- Skill cards return to skill zone; non-skill cards discard or removed-from-game by limit; residual remains if legal; defeat expires after battle-end/round-end effects.

Expected projections:

- Owners see private discard/skill zones; opponents see only public state changes.

Cleanup:

- No ad hoc modifier survives without a lifecycle owner.

Negative cases:

- source-closed modifier still applying, temporary card entering discard, defeat expiring before battle-after triggers, once-per-game residual wrong destination.

## Golden Flow 4: Reconnect During Active Flow

Initial state:

- Remote room running with two browser clients.
- Active player has a pending payment or target decision; another player is waiting.

Commands:

1. Open pending decision.
2. Disconnect active player.
3. Reconnect with valid token.
4. Submit selected decision.
5. Try stale/duplicate command from old revision.

Expected flow transitions:

- Pending decision remains unchanged across reconnect; valid command resumes; stale command rejected.

Expected events:

- client disconnected, client reconnected, projection emitted, command accepted/rejected.

Expected state delta:

- No duplicate cost/payment; no skipped decision; revision increments only on accepted command.

Expected projections:

- Reconnected player receives private pending candidates; others do not.

Cleanup:

- Socket and room state remain consistent after command.

Negative cases:

- invalid reconnect token, wrong client command, stale revision, unauthorized replay restore.

## Golden Flow 5: Optional Trigger / Interaction Chain

Initial state:

- Multiple optional triggers are eligible in turn order; at least one `唯一` group and one forced trigger are also eligible.

Commands:

1. Resolve forced trigger.
2. Offer optional response windows.
3. Decline one window.
4. Accept another window.
5. Resolve nested event if produced.

Expected flow transitions:

- Forced triggers do not wait for player opt-in; optional windows pause and resume deterministically.

Expected events:

- trigger collected, response window opened, declined/accepted, ability resolved, nested event queued.

Expected state delta:

- Declining one window does not consume future eligibility unless rule says so; unique group creates only one effective choice.

Expected projections:

- Eligible player sees choices; non-eligible players see public wait reason only.

Cleanup:

- Response windows clear after resolution and do not replay.

Negative cases:

- wrong responder, duplicate response, response after window closed, optional trigger with hidden source leaking to non-owner.

## Effect Result Binding Mapping

`docs/plans/fd-effect-result-binding-plan.md` is not present in this workspace. Based on `docs/reports/2026-09-07-effect-result-binding-design-result.md`, map future Phase 3A acceptance as follows:

| Phase 3A Item | New Acceptance Gate |
|---|---|
| Typed `EffectResultEnvelope` | Gate A |
| Binding positive/negative compiler tests | Gate A |
| Synthetic chained-effect scenario | Gate B only when scenario asserts state delta and rollback, not just direct validator behavior |
| First real Golden Card using bound result | Gate B |
| Browser-complete Result Binding card with projection/reconnect where relevant | Gate C |

Design documents and reports are not verification evidence by themselves.

## Next Minimal Implementation Slice

The next slice should be a Golden Flow 1 contract test suite plus Rule Owner cleanup for normal action flow:

1. Define one authoritative action-flow state machine for ability window -> move/pass -> ability window -> play batch -> ability window.
2. Add direct negative dispatch tests for forbidden commands in every step.
3. Add one browser test using server-supplied actions for the same flow.
4. Record projection and stale-command evidence without changing unrelated card runtime.
