# P3-B23 Handoff — Olga Trismegistus Loss Transform

- Date: 2026-09-14
- Owner: Codex A
- Base: `147b1683a9fa33ee3c3e62ef207a68b5dca4fac0`
- B23 implementation branch: `codex/b-p3-b23-olga-loss-transform-r1`
- Reviewer task: `P3-R17`

## Why this consumer is next

After B22/R16 synchronization, the TO14 scoped direct-consumer overlay is `12/13`. The only remaining direct battle-event consumer is Olga `trismegistus.loss-transform`.

This row is intentionally last because it is not a plain Resource/Card-Zone mutation. It is the entry transition of the Trismegistus state chain: the active `魂离神引` state is lost on an authoritative controller battle loss and the same source enters the `归寂` state. Existing legacy code currently records only a player flag and does not by itself prove source-state gating, removal of the Soul Drag ongoing modifier, or cleanup after the transformed source leaves play.

## Exact semantic

Canonical authoring for the direct consumer is exactly:

- `forced_trigger`;
- trigger `after_controller_loses_battle`;
- exactly one effect `transform_to_return_silence_on_loss`;
- no conditions, targets, cost, creates, rule modifiers, lifecycle, response window, or limit.

Printed clause for this transition:

> 当你战败后，你失去魂离神引并获得归寂。

The implementation must consume authoritative runtime state. It must not parse Chinese text or route by Olga/card/ability identity.

## Narrow state-transition contract

B23 owns only the transition boundary necessary to make the accepted TO14 loss consumer authoritative:

1. The source must be face-up active in an active card zone when the loss event is consumed. A Trismegistus card still in `skill` before the accepted B17 delayed activation must not transform merely because its controller loses a battle.
2. The triggering loss must use the accepted B13-B22 battle-event lineage: the controller is the authoritative losing participant and the event settles after scoring according to the existing loss-event ordering.
3. On the first valid transform for a source instance, remove only the live Soul Drag ongoing effect(s) owned by that same source/controller and mark that source instance as being in the Return Silence state.
4. The transformed source must establish the narrow existing Return Silence deployment constraint (`mustDeployToBattlefield`) for its controller. The state must be derived from the transformed source, not a permanent character identity flag.
5. `return_silence_battle_start` must not arm the Return Silence behavior before the source has actually transformed. A synthetic/manual `while_active` event on an untransformed source must therefore not create Return Silence state.
6. If the transformed source later leaves its active zone or is removed by the existing Return Silence resolver, the Return Silence marker must no longer authorize future battle overrides. No permanent player-level ghost state may survive source removal.
7. Replaying the same stable loss event or receiving later unrelated loss events after the source is already transformed must not duplicate transition evidence, deployment constraints, or state mutation.
8. Emit typed transition evidence containing controller, source card, ability, triggering battle/result identity when available, and explicit `fromState=soul_drag` / `toState=return_silence` provenance.

The existing downstream `return_silence_battle_start` battle-resolution semantics are **not** promoted as a general TO16 Special subsystem by B23. B23 may only gate/clean the already existing path as required to make this exact state transition non-premature and non-persistent after source removal.

## Required proof

1. Renamed card/ability IDs with the exact structural effect still classify; wrong trigger/effect or extra semantic shape does not.
2. A loss while the source is inactive/in `skill` produces no transform and does not interfere with B17 first-loss delayed activation.
3. An authoritative loss while the source is active transforms exactly once, removes the source's Soul Drag ongoing modifier, and records typed transition evidence.
4. The transform enables the controller's battlefield-only deployment restriction through source-bound state.
5. Pre-transform `while_active` cannot arm Return Silence; post-transform state can use the existing narrow Return Silence path.
6. Removing the transformed source prevents any later Return Silence battle override from the stale player flag/state.
7. Stable loss replay and reconnect/stale-command paths cannot transform twice.
8. Malformed same-family candidates fail closed before legacy extended-effect fallback and preserve state atomically.
9. B13-B22 focused/current-lineage compatibility remains green.
10. Fresh Chromium remote-room proof and full-root comparison against the accepted B22 deterministic baseline are required; only new deterministic failures block B23.

## May touch

- `packages/rules/src/ability/interpreter.ts` for the exact identity-free semantic classifier and dedicated loss-transform route;
- `packages/rules/src/ability/extended-effects.ts` only to gate the existing `return_silence_battle_start` legacy effect on the transformed source state;
- `packages/rules/src/core/combat-resolver.ts` only for source-bound Return Silence validation/cleanup needed to prevent ghost state after source removal;
- `packages/rules/src/ability/types.ts` only if narrow additive typed transition/state metadata is required;
- one B23 focused regression test, one scoped browser fixture/spec, and one B23 result report;
- compatibility assertions in the existing Olga/complex regression only where the old premature Return Silence expectation must be corrected.

## Must not

- route by Olga, Trismegistus, card definition ID, ability ID, or master identity;
- rewrite authoring to add a representative-only condition or source-state key;
- generalize all state transforms, TO16 Special, generic passive lifecycle, or generic battle-start hooks;
- promote `trismegistus.soul-drag` power semantics or fully certify `trismegistus.return-silence` as an independent TO16 row;
- change the accepted B13-B22 battle ordering or B17 delayed activation contract;
- modify A-owned coverage KPI/taxonomy or synthesize a raw coverage delta.

## Reviewer launch

P3-R17 starts from the exact frozen B23 candidate SHA in a fresh reviewer worktree. It implements no fixes and independently verifies identity-free structural classification, active-source/loss provenance, Soul Drag removal, source-bound transform state, no premature/ghost Return Silence state, exactly-once behavior, Chromium Gate C, full-root baseline, and non-promotion of broad TO16 Special semantics.
