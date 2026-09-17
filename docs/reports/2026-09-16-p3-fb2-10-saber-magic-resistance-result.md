# P3-FB2-10 Saber Magic Resistance Runtime Result

- Date: 2026-09-16
- Owner: Codex B2
- Task: `P3-FB2-10`
- Base / A handoff: `829d2c60325991d26f98ce5f647d62b02a721d0e`
- Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`

## Scope

This candidate accepts only the identity-free Magic Resistance Power sub-contract frozen by the A handoff:

- `phase_action` in combat;
- `controller_combat_action_window`;
- active source required;
- exactly one `combat_power_modifier`;
- `operation=set`, `rule=attack.currentPower`, `value=0`;
- scope is exactly `engaged_opponents_same_battlefield` + `attack_card`;
- exactly one `has_attribute(魔术)` constraint;
- modifier duration exactly `this_round`;
- no conditions, targets, cost, effects, creates, response semantics, limit, visibility, or top-level lifecycle.

The implementation does not promote broad TO15 Power/Modifier runtime and does not migrate any F1 roster authoring.

## Runtime implementation

`packages/rules/src/ability/interpreter.ts` adds an identity-free candidate classifier and exact semantic classifier. Exact matches are routed before generic/legacy effect fallback and install only the declared ongoing modifier. Same-family malformed candidates fail closed before mutation.

The accepted route reuses the existing `installOngoing()` and `calculateCardPower()` infrastructure. No new Power primitive or second combat calculator is introduced.

`packages/rules/src/ability/loader.ts` adds a narrow loader exception for this exact structured modifier shape. The pre-existing loader rejected all modifier-local lifecycle declarations when top-level lifecycle was empty, which meant the canonical Magic Resistance structure was reported unsupported before runtime classification. The exception remains exact to the FB2-10 structure; malformed near-matches continue to receive an unsupported loader report.

## Generic modifier-expiry correction

Focused testing exposed an existing generic cleanup defect: a `this_round` modifier-local ongoing entry with no card cleanup directive was removed at the round boundary by also moving its source card out of the active area. Magic Resistance text expires the modifier, not the skill card.

The generic cleanup condition now moves a source card only when the ongoing entry has an explicit card cleanup directive. The ongoing modifier itself still expires through the existing `liveOngoing()` filtering. This is identity-free and preserves existing lifecycle cleanup behavior for entries that do declare cleanup.

## Behavioral evidence

Fresh typecheck: PASS.

Focused/current-lineage compatibility:

```text
4 files / 53 tests PASS
```

This includes FB2-10, B18 base Noble Bloom, B19 threshold Noble Bloom, and the complex-skills regression matrix.

FB2-10 focused coverage proves:

- identity-free exact classification survives ability-ID rename;
- wrong phase/window/source-state/modifier type/operation/rule/controller scope/object/attribute/value/duration and extra semantics do not classify;
- action exposure is combat-only, active-source-only, and once per round through existing phase-action usage ownership;
- same-battlefield opponent Magic attack Power becomes exactly 0;
- controller-owned Magic, opponent non-Magic, and remote-battlefield Magic attacks are unchanged;
- calculation trace records the modifier application deterministically;
- modifier expires next round without closing/moving the source card;
- malformed same-family direct execution fails closed and leaves state unchanged.

All rules regressions:

```text
49 files / 292 tests PASS
```

Deterministic generated-content verification: PASS, unchanged hashes:

- content: `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`
- fixture: `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
- evidence: `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`

## Full-CI timing note

Three fresh standard `npm run test:ci` runs produced the same single parallel-load timeout and no other failures:

```text
115 files PASS / 1 file with timeout
704 tests PASS / 1 timeout / 705 total
```

The only timeout each time was the pre-existing `MatchSession semi-auto runtime > runs eleven rounds or pauses with an explicit handled reason` 5000ms wall-clock limit. The complete `packages/rules/tests/match-session.test.ts` file was immediately rerun in isolation and passed:

```text
1 file / 26 tests PASS
11-round test: ~1.77s
```

No timeout/configuration/test threshold was changed or weakened. R29 should independently determine whether this load-sensitive timing issue reproduces in its fresh reviewer worktree.

## Production scope / identity audit

Relative to the A handoff before adding this report:

- production runtime: `packages/rules/src/ability/interpreter.ts` and `packages/rules/src/ability/loader.ts` only;
- no `data/authoring/` changes;
- no MatchSession/client/server/app/coverage-classifier changes;
- no frozen ten-ID, card-name, servant-name, or printed-text routing in production diff;
- the semantic attribute literal `魔术` is part of the exact structural contract, not an identity key;
- `git diff --check`: PASS.

Focused test addition:

- `packages/rules/tests/regression/fb2-saber-magic-resistance.test.ts`.

## Explicit non-promotion

This candidate does not accept or migrate:

- broad TO15 Power/Modifier;
- generic `set` / `add` Power modifiers;
- arbitrary opponent/attribute scopes;
- Target Selection or third-party selection;
- persistent / while-active Power lifecycle;
- Noble Bloom beyond B18/B19 compatibility;
- any of the ten future FM03 authoring rows;
- A-owned taxonomy/KPI definitions.

## R29 handoff

A fresh R29 reviewer must start from the exact B2 candidate SHA, make no implementation fixes, independently repeat the required static and dynamic checks, and decide whether the exact FB2-10 sub-contract may be accepted. FM03 remains blocked until R29 acceptance plus fresh A dependency reconciliation.
