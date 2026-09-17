# P3-B20 Artoria Caster Luck-on-Win Family Handoff

- Date: 2026-09-14
- Owner: Codex A
- Base: `e5541d0185a0e84f55d64ede5374152dc2e60730`
- Input: accepted B19 candidate `24c1ef9dba7436204ac3a334edc2483804d00cc3`, R13 acceptance `397315694eda2b106bcdfeabc6ff28d0d57d67f9`
- Status: `READY_FOR_P3_B20`

## Selected residual family

B20 selects exactly three of the six remaining TO14 direct consumers. They are structurally identical and share one unique trigger group:

```text
archive: servant.artoriac
abilities:
  sc-artoriac-4.unique-passive-luck-on-win
  sc-artoriac-5.unique-passive-luck-on-win
  sc-artoriac-6.unique-passive-luck-on-win
kind: optional_trigger
trigger: after_controller_wins_battle
runtime route before B20: LEGACY_EXECUTE_ABILITY
```

Authoring shape for all three:

```text
optional trigger after controller wins battle
controller-only post_battle_optional_trigger_window
condition: source card is in controller hand
unique group: artoriac-pilgrim-unique-on-win
conflict: only_one_effect_may_activate_per_window
cost: move source from controller hand -> removed_from_game
create: one card.luck -> controller deck
then: shuffle controller deck
```

## Why this is one family

The three consumers differ only by source card identity. Their trigger, source-zone condition, unique-group contract, cost, create operation, destination, and follow-up shuffle are identical. B20 therefore treats them as one structural family rather than three identity-specific handlers.

If accepted, this single family slice can reduce the scoped residual TO14 direct consumers from `6/13` to `3/13` while still preserving narrow semantic routing.

## Required implementation boundary

Production classification must remain identity-free and exact. The B20 route must:

- require `optional_trigger` + `after_controller_wins_battle`;
- preserve authoritative battle-winner/participant scoping when result provenance is available;
- require the source card to remain in the controller hand when resolving;
- preserve the unique group `artoriac-pilgrim-unique-on-win` and `only_one_effect_may_activate_per_window` behavior;
- expose the optional response only to the controller;
- on decline, make no state change;
- on accept, atomically move exactly the chosen source to `removed_from_game`, create exactly one `card.luck` in the controller deck, then shuffle only that deck;
- prevent duplicate creation/removal across stable replay, reconnect, or stale-command paths;
- reject malformed same-family shapes before legacy fallback;
- keep B13-B19 compatibility green.

## Explicitly out of scope

- `sc-artoriac-6.gain-vp-if-not-sole-winner`;
- Gatou `seeker.battle-end-reward`;
- Tomoe `sc-tomoe-1.penalty-on-defeat`;
- Olga `trismegistus.loss-transform`;
- broad TO14 optional-trigger migration;
- TO15 Modifier/Power;
- TO16 Special;
- A-owned coverage KPI/taxonomy;
- any representative card/character/ability identity branch.

## Required evidence

B20 must provide:

- red->green focused regression coverage for exact structural classification;
- renamed-ID positive coverage and near-miss negatives;
- three-sibling unique-group arbitration coverage;
- source-zone false/decline/accept atomicity coverage;
- winner/participant locality coverage;
- exactly-once replay/reconnect/stale behavior;
- fresh typecheck and B13-B19 current-lineage compatibility;
- fresh Chromium remote-room proof;
- fresh full-root baseline and production identity audit.

## Review dependency

After B20 freezes an exact candidate SHA, P3-R14 must start from that exact SHA in a fresh reviewer worktree and must not implement fixes. Only R14 acceptance authorizes A03 to advance the scoped TO14 direct-consumer overlay from `7/13` to `10/13`.
