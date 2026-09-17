# P3-B19 Noble Bloom Extra-VP Handoff

- Date: 2026-09-14
- Owner: Codex A
- Base: `6104b5f0e141fa0edc10be28c31f073e2fe04699`
- Input: accepted B18 candidate `c86eca28dc4c915f60a30eaff7769714f8644d77`, R12 acceptance `2c26a7b87fdf9c75f8d70728fd2a5d77e89f9c7d`
- Status: `READY_FOR_P3_B19`

## Selected residual consumer

B19 selects exactly one of the 7 residual TO14 direct consumers:

```text
archive: servant.artoria-alt
card: servant.artoria-alt.skill.sc-artoria-alt-3
ability: sc-artoria-alt-3.noble-bloom-extra-vp
kind: optional_trigger
trigger: after_battle_result_determined
runtime route before B19: LEGACY_RESOLVE_EFFECT
```

Authoring shape:

```text
combat optional trigger
responseWindow = after_battle_result_determined
conditions:
  1. controller_played_highest_cost_noble_phantasm_in_battle_this_round
  2. highest_cost_noble_phantasm_cost_at_least(value=4)
effect:
  adjust_victory_points(controller,+1)
```

## Why this slice is next

B19 is the narrowest residual continuation after B18. It reuses the accepted B13/B18 battle-result ordering, TO05 optional Interaction behavior, and typed Resource `adjust_victory_points` primitive. No new primitive or subsystem is required.

The existing historical regression establishes the intended semantic separation: when the tracked highest Noble Phantasm cost is 4+, the source exposes two independent optional responses—base `noble-bloom` +1 and `noble-bloom-extra-vp` +1—and resolving both produces total +2 VP. B19 must preserve that two-window behavior rather than merging them into one +2 effect.

## Required implementation boundary

B19 may promote only the exact two-condition threshold semantic. Production classification must remain identity-free. The exact B19 route must:

- appear only after the accepted phase-wide post-scoring barrier;
- require the controller's qualifying highest-cost Noble Phantasm fact and threshold `>=4`;
- respect authoritative battle participants when present;
- preserve B18 as a separate optional response;
- settle typed controller VP +1 exactly once on accept;
- settle +0 for that response on decline;
- reject malformed same-family near-misses before legacy fallback;
- dedupe stable result replay/reconnect/stale-command paths.

## Explicitly out of scope

- changing the already accepted B18 base `noble-bloom` semantics except compatibility;
- Artoria Caster Luck-on-win optional triggers;
- Gatou battle-end reward;
- Tomoe defeat penalty/unpreventable semantics;
- Olga loss-transform/Special behavior;
- broad TO14 trigger ordering;
- TO15 Modifier/Power;
- TO16 Special;
- A-owned KPI/classifier/taxonomy;
- representative card/character/ability identity branches.

## Review dependency

After B19 freezes an exact candidate SHA, P3-R13 must start from that exact SHA in a fresh reviewer worktree and must not implement fixes. Only R13 acceptance authorizes the next A03 synchronization and a scoped TO14 direct-consumer overlay move from `6/13` to `7/13`.
