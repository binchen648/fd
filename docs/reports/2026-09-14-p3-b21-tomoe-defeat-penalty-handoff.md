# P3-B21 Handoff — Tomoe Unpreventable Defeat Penalty

- Date: 2026-09-14
- Owner: Codex A
- Base: `2ff843563f56666e0087e0b10a019f333bd4ad05`
- B21 implementation branch: `codex/b-p3-b21-tomoe-defeat-penalty-r1`
- Reviewer task: `P3-R15`

## Why this consumer is next

After B20/R14, the TO14 scoped direct-consumer overlay is `10/13`. The remaining three are Gatou `seeker.battle-end-reward`, Tomoe `sc-tomoe-1.penalty-on-defeat`, and Olga `trismegistus.loss-transform`.

Tomoe is the narrowest remaining consumer. It reuses the accepted B13 loss-event ordering and typed VP Resource path, and adds only the authoring's explicit `this_effect` prevention exception. Gatou remains a Special directive; Olga remains a transform/lifecycle consumer.

## Exact B21 semantic

Current authoring for `sc-tomoe-1.penalty-on-defeat` is:

- `forced_trigger`;
- `after_controller_loses_battle`;
- one `adjust_victory_points(controller, -5)` effect;
- one rule modifier declaring `ignore effect_prevention` for `this_effect` at `explicit_exception` priority.

Implementation must classify this structurally. Representative identity, ability ID, modifier ID, card ID, and character ID are not valid runtime routing keys.

## Required proof

B21 must show all of the following before candidate freeze:

1. Renamed IDs still classify, while wrong trigger/player/amount or malformed prevention exception do not.
2. Only an authoritative loss for the controller/participant triggers the effect; unrelated battle results do not.
3. The loss settlement occurs after the accepted phase-wide post-scoring barrier.
4. With ordinary `preventEffects` enabled, the exact supported Tomoe-family effect still deducts VP because the effect is explicitly unpreventable.
5. Typed `victory_points_adjusted` evidence carries controller/resource/actual delta/before/after and `unpreventable=true` provenance.
6. VP floors at zero when the controller has fewer than 5 VP.
7. Stable result replay, reconnect, and stale command paths cannot deduct twice.
8. Malformed same-family shapes fail closed before legacy fallback and reject atomically.
9. B13-B20 focused/current-lineage and Chromium compatibility remain green.
10. Full-root failures are compared against the accepted B20 inherited baseline; only new deterministic failures block B21.

## Scope exclusions

B21 must not generalize all rule modifiers or TO15 Modifier/Power runtime. It must not promote Gatou, Olga loss-transform, broad TO14, TO16, or A-owned coverage/taxonomy work.

## Reviewer launch

P3-R15 must start in a fresh reviewer worktree at the exact frozen B21 candidate SHA. Reviewer is read-only with respect to implementation: findings first, no fixes in reviewer lane, and acceptance only after fresh focused, Chromium, full-root, identity, prevention-exception, fail-closed, and exactly-once checks.
