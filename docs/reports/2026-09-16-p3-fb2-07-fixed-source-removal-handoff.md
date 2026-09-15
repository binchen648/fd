# P3-FB2-07 Fixed Controller Source-Card Removal Handoff

Date: 2026-09-16
Role: A
Status: READY_FOR_B2

## Baselines

- Runtime/A-sync baseline: `6e062bb4c5b300aba3d49aaf6076ce042e185a2f`.
- F1 final source evidence: `59f145434695d29bdd17e4cb3adc887e84182377`.
- Request: `runtime-capability-a600709be05b` / `GENERIC_CARD_ZONE`.
- Reference remains read-only at `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.

## Why FB2-07 is next

Wave-2 clustering found 29 F1 identities with `move_source_card`; the strongest exact reusable sub-shape is twelve distinct identities whose source-grounded overlay contains a fixed source-card removal component: `move_source_card -> removed` with no target identity encoded in the component.

The current typed Resolution Data-flow already owns `move_source_card`, but only for the B15 board-source return-to-skill contract. Separately, authoritative runtime already represents the removed zone as `removed_from_game`, makes removed cards public, and marks cards inactive when they leave board zones. FB2-07 must extend the existing typed primitive rather than add a second source-move engine.

This task is component-only. The twelve F1 parents have different Trigger/Battle/Movement/Target/Special dependencies and remain unroutable until those parents are independently accepted.

## Frozen F1 component membership (12)

- `master.hakuno-f.skill.s4`
- `master.hakuno-f.skill.s5`
- `master.kohaku.skill.s3`
- `master.rin.skill.ascension`
- `servant.davinci.skill.sc-davinci-5`
- `servant.davinci.skill.sc-davinci-6`
- `servant.davinci.skill.sc-davinci-10`
- `servant.davinci.skill.sc-davinci-11`
- `servant.davinci.skill.sc-davinci-12`
- `servant.davinci.skill.sc-davinci-14`
- `servant.davinci.skill.sc-davinci-15`
- `servant.davinci.skill.sc-davinci-16`

Every identity above has at least one other parent dependency or reviewed-special requirement. Complete migration-ready count added by this component is therefore `0`.

## Runtime component contract

Extend the existing typed `move_source_card` Resolution Data-flow primitive with one additional destination:

- canonical destination exactly controller `removed_from_game`;
- source instance is the executing ability source, not a selected/third-party card;
- source must exist and be owned and controlled by the ability controller;
- already-removed source fails closed rather than producing duplicate movement evidence;
- moving to `removed_from_game` uses the existing authoritative zone mutation semantics: public visibility and inactive source state;
- emit the existing typed source-card movement result/event envelope with `fromZone`, `toZone`, `movedCount=1`;
- transaction rollback remains authoritative if a later typed node fails.

Keep the existing B15 `to=skill` behavior unchanged: it still requires an active face-up board source. The new removal destination must not weaken that source-state gate.

Add one identity-free component predicate for canonical runtime effects. It must accept only source-card removal to controller `removed_from_game` and reject skill return, selected-card movement, third-party owner, malformed destination, extra semantic fields, and already broader parent semantics.

Matching the component must never make an unsupported parent ability routable.

## Existing semantics that must not be conflated

- B15 `move_source_card -> skill` is an accepted battle-terminal active-board source return and remains separate.
- B20 unique-win source removal is a complete parent contract with hand/source/create semantics; its existence is not broad Card Zone acceptance.
- `return_card_by_definition` is not part of FB2-07. Its common F1 shape includes `createIfMissing`, which mixes Card Zone Return with Card Create semantics and needs its own scoped task.
- `move_matching_cards`, `move_selected_cards`, arbitrary source-to-deck/discard/attack moves, and F1 authoring migration are out of scope.

## Required proof

1. typed `move_source_card` normalizes both the old `skill` destination and the new `removed_from_game` destination without broadening other zones;
2. removal succeeds from a controller-owned source without assuming a particular parent timing/route;
3. wrong owner/controller, missing source, already removed, unsupported destination, and malformed component siblings fail closed atomically;
4. successful removal makes the source public and inactive and emits one typed movement event/result;
5. later-node failure rolls back the removal and event evidence;
6. existing B15 skill-return source-state requirements remain unchanged;
7. component classification is identity/text free and does not grant a parent route;
8. typecheck, focused tests, all rules regressions, deterministic generation, full CI, identity/forbidden-file audit, and `git diff --check` pass.

## Files

B2 may touch:

- `packages/rules/src/ability/resolution-dataflow.ts`;
- `packages/rules/src/ability/interpreter.ts` only for the component predicate;
- one focused FB2-07 regression test;
- narrow existing B15/dataflow assertions only if required;
- `docs/reports/2026-09-16-p3-fb2-07-fixed-source-removal-result.md`.

Do not touch MatchSession, F1 artifacts, roster authoring, Card Create/Return-by-definition, Trigger/Lifecycle/Target/Movement/Power/Special owners, client/server projection, or A-owned coverage/taxonomy.

## Completion status

- `IMPLEMENTATION_COMPLETE_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`
