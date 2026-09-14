# P3-B23 Olga Loss-Transform Result

- Date: 2026-09-15
- Owner: Codex B
- Task: `P3-B23`
- Branch: `codex/b-p3-b23-olga-loss-transform-r1`
- Base / exact A-owned B23 handoff: `8762b78d6d2cb338dda7fe875609ec3cad4d74e8`
- Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`

## Scope

B23 migrates exactly the final TO14 direct battle-event consumer family represented by Olga `trismegistus.loss-transform`: one forced `after_controller_loses_battle` trigger with exactly one `transform_to_return_silence_on_loss` effect.

Production routing does not inspect Olga, Trismegistus, master/card/ability identity, or display text. The effect type and trigger shape are the semantic operation keys. Renamed ability IDs still classify when the exact structural shape is preserved; wrong trigger/effect and same-family shapes with extra conditions fail the dedicated classifier.

## Source-bound state transition

The previous legacy path stored Return Silence as a permanent player-level flag. B23 replaces that boundary with source-bound runtime state:

- the loss-transform trigger is eligible only while the source instance is face-up active in `field`/`attack_area`;
- a skill-zone/inactive Trismegistus cannot transform on the same loss that precedes the accepted B17 delayed activation;
- the authoritative loss event must identify the controller as the losing frozen battle participant and carry battle phase / battle / result / battlefield provenance;
- first valid transform removes only live Soul Drag ongoing effects owned by that same source/controller;
- the exact source instance is recorded in `transformedReturnSilenceSourceCardIds`;
- typed `battle_loss_state_transformed` evidence records controller, source, ability, trigger event, battle phase, battle/result/battlefield identities, and `soul_drag -> return_silence` state provenance;
- the transformed source installs the existing battlefield-only deployment restriction for the controller;
- pre-transform `while_active` cannot arm Return Silence;
- post-transform `while_active` cannot reinstall Soul Drag;
- source removal invalidates the transform marker and removes the deployment restriction when no other live transformed source remains;
- the existing Return Silence combat override now requires a live transformed source instead of a permanent player flag, and removes/cleans that source when consumed;
- stable loss replay and later distinct losses after transformation do not duplicate transition evidence/state.

The downstream Return Silence battle override remains a narrow existing Special path. B23 does not promote it as a general TO16 subsystem.

## Focused proof

Fresh B23 focused proof:

```text
9 / 9 PASS
```

The matrix covers exact identity-free classification, inactive-source exclusion, pre-transform Soul Drag without premature Return Silence, authoritative exactly-once transition evidence, Soul Drag removal, post-transform state gating, unrelated-player loss exclusion, production MatchSession post-scoring lineage, source removal/ghost-state cleanup, and malformed same-family atomic rejection.

Fresh B13-B23 current-lineage compatibility:

```text
14 test files / 126 tests PASS
```

## Gate C

Fresh B23 Chromium remote-room proof:

```text
1 / 1 PASS
```

Fresh full B13-B23 ordered Chromium compatibility:

```text
11 / 11 PASS
```

The B23 browser path restores a real remote room with the source face-up active, submits the authoritative end-turn command through a WebSocket that waits for `open`, observes Olga as the losing participant after the post-scoring barrier/result dispatch, preserves the post-battle state across reconnect, and rejects stale-revision replay without duplicating the battle state.

The exact source-bound transform itself is asserted by the focused production-MatchSession test because internal transform state is intentionally not exposed as public client authority.

## Full-root baseline

Fresh root Vitest result:

```text
Test files: 108 PASS / 10 FAIL / 118 total
Tests:      710 PASS / 20 FAIL / 730 total
```

All 20 failures are the inherited CHM/original-image evidence absence class. The previous B22 deterministic baseline was `701 PASS / 20 inherited FAIL / 721 total`; B23 therefore adds `+9 PASS / +0 new deterministic failures`.

The previously observed load-sensitive MatchSession eleven-round timeout did not reproduce in this run; that test passed in approximately 3.8 seconds.

## Production diff audit

- `npm run typecheck`: PASS
- B23 focused: `9 / 9 PASS`
- B13-B23 lineage: `14 files / 126 tests PASS`
- B13-B23 Chromium: `11 / 11 PASS`
- full root: `710 PASS / 20 inherited FAIL / 730 total`
- `git diff --check`: PASS
- added-production identity audit for `Olga|olga|trismegistus|master.olga|loss-transform|returnSilencePlayers`: `0` matches
- legacy `returnSilencePlayers` matches in the raw diff are deletions only
- no A-owned coverage KPI/taxonomy change
- no authoring rewrite to make the representative fit
- no generic state-transform, passive-lifecycle, TO15 Modifier/Power, or TO16 Special promotion

## R17 handoff

Freeze the exact candidate commit from this branch. P3-R17 must start in a fresh reviewer worktree at that exact SHA, implement no fixes, and independently verify the exact identity-free semantic classifier, active-source and authoritative loser provenance, Soul Drag removal, source-bound Return Silence state, pre-transform gating, post-removal ghost-state cleanup, exactly-once behavior, fresh Chromium Gate C, full-root inherited-failure baseline, and non-promotion of broad TO15/TO16 behavior.

Only R17 acceptance may allow A03 to advance the scoped TO14 direct-consumer overlay from `12/13` to `13/13`.
