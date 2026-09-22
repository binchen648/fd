# P3-A FB2-29 Outer-God-Life Structural Family Dispatch

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-19

## Baseline

- Exact Base: `1c33320b468825dd7e37b5ede6645bb29e5ee333` (R61 FB2-28 acceptance sync)
- Formal accepted: `127/944`, remaining `817`
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

This is B2 capability work only. It earns zero frozen migration credit.

## Target family / unlock yield

Exactly five remaining frozen identities share the Reference family `core.outer-god-life` and the same source-owner relationship semantics:

1. `servant.abigail.skill.sc-abigail-4`
2. `servant.clytie.skill.sc-clytie-4`
3. `servant.hokusai.skill.sc-hokusai-4`
4. `servant.molay.skill.sc-molay-4`
5. `servant.voyager.skill.sc-voyager-4`

F1 printed-text hashes:

- Abigail: `c067eaf714c63dc3cb08957261a643c8107e21ebd66fc2981008ac075957e940`
- Clytie: `146c26d2ca823f92c1a758e9e23c37f6d8f88c54e3818164b153af19260d464f`
- Hokusai: `e0c05d4411c50ccc67a2354a8d856c79014a6a6e63d41f32b59d364b471326f3`
- Molay: `9aa41b08e14ff5d692af6b91a7f653b0626c3419b3a847611da5fa2a750cf97f`
- Voyager: `d0ba9965338bcd719d3631256f57144ff71363113069c44dfb4225af5296d0bd`

The five are an unlock target, not B2 migration credit. Later S migration requires fresh R acceptance and A capability synchronization first.

## Source-grounded contract

Locked Reference may be read only to corroborate semantics. Its handler implementation is evidence, not runtime routing.

Required identity-free behavior:

1. Source is an active physical servant-skill card used in the combat action window.
2. Resolve the source definition's structural servant owner from compiled authoring metadata (`ownerId`), then resolve the live player whose `servantCardId` equals that owner definition.
3. The source controller and the source-servant-owner player each gain exactly `+6` total battle power for the current round. If they are the same player, apply exactly `+6` once, never `+12`.
4. At the authoritative battle-terminal boundary, move the same physical source card to the source-servant-owner player's discard. The receiving player becomes the physical card owner/controller for that discard state. Do not return temporary derived cards through this ordinary path.
5. The current-round power adjustment must expire by round identity, not by a fragile manual cleanup flag.
6. Same terminal event replay must be idempotent.
7. Invalid/missing source owner, missing source physical card, stale source state, or invalid target relation must fail closed transactionally.

Molay is not a separate identity-special case: its printed “Foreigner” recipient is represented by the same source servant owner relationship. Do not branch on Molay or any of the five IDs.

## Structural category marker

The eventual migrated definitions need one explicit semantic marker identifying the reusable `outer_god_life` card category. B2 may introduce the narrowest authoring/compiler field needed to preserve this marker into executable definitions. The marker must be structural data, not a hard-coded list of canonical IDs.

FB2-29 does **not** implement the ten other abilities that later count/select/move Outer-God-Life cards. It only establishes the stable category predicate/data needed for future generic consumers plus the five-card self behavior above.

## Authorized B2 scope

B2 may change only the minimal rules/content-compiler/type/schema/tests/report files required for:

- structural `outer_god_life` category preservation;
- current-round per-player total-power adjustment ledger consumed by production combat resolution;
- source-servant-owner relationship resolution;
- exact five-card self-behavior structural recognizer/effects;
- battle-terminal physical source return to the source servant owner's discard;
- regression tests and result report.

No authoring migration, production pack registration, generated product changes, F1/taxonomy/KPI edits, app changes, or downstream Outer-God-Life consumer implementation.

## Required adversarial tests

At minimum independently prove in B2 tests:

- controller != source-servant-owner: both receive exactly +6;
- controller == source-servant-owner: exactly +6 once;
- unrelated player receives 0;
- multiple independent valid sources stack by source use, while one source execution cannot double-credit the same recipient;
- round power affects production combat resolution and automatically expires when round identity changes;
- battle-terminal moves the exact source physical card to source-servant-owner discard and updates ownership/controller/zone/face/active state consistently;
- same terminal event replay cannot return or mutate twice;
- missing owner relationship / stale inactive source / malformed near-match contract fail closed mutation-free;
- no canonical ID/name/printed-text/Reference-handler/F1-hash/Reference-SHA routing;
- no product diff and frozen overlap remains `127/944`.

## Accounting

FB2-29 is infrastructure and earns zero frozen migration credit. Formal accepted remains `127/944`, remaining `817`.

If a later S migration of exactly the five target identities is independently accepted and A-synchronized, formal recovery may then become `132/944`. Do not pre-credit that number.

Historical P3-FM09 remains `MIGRATION_BLOCKED`; no FM10 is started.
