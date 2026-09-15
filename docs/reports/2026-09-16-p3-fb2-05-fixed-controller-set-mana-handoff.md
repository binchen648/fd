# P3-FB2-05 Fixed Controller Set-Mana Handoff

Date: 2026-09-16
Role: A
Status: READY

## Baselines

- Runtime/A-sync baseline: `8a3ce9fe318333cc9b1c0c0ea2f45d51ec588cf5`.
- F1 final source evidence: `59f145434695d29bdd17e4cb3adc887e84182377`.
- Request: `runtime-capability-6220d123d8e1` / `GENERIC_RESOURCE_NUMERIC`.
- Reference remains read-only at `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.

## Fresh membership finding

F1 final has exactly five `set_mana` effects under Resource Numeric, and every one is a fixed controller literal assignment:

| F1 identity | Source ability | Exact target | Remaining non-Resource blockers |
| --- | --- | ---: | --- |
| `master.iliya.skill.s1` | `iliya.homunculus.initial-mana` | 6 | Trigger Gateway |
| `master.shinji.skill.s4` | `shinji.book.replacement-master` | 4 | Condition + Trigger + reviewed special handler |
| `master.shirou-emiya.skill.s3` | `shirou.ideal-land.first-elimination` | 0 | Condition + Lifecycle + Trigger + reviewed special handler |
| `master.taiga.skill.s1` | `taiga.helper.initial-mana` | 3 | Trigger Gateway |
| `master.zouken.skill.s1` | `zouken.cavern-dead.starting-mana` | 10 | Lifecycle + Modifier + Trigger |

This makes the numeric primitive independently confirmable while all execution parents correctly remain deferred to later mechanic waves.

## Runtime contract

Add a typed `set_mana` Resolution Data-flow primitive and an identity-free fixed-controller component. The authoring component accepts only a fixed safe-integer literal amount for controller. The primitive performs exact assignment when the requested target is between zero and the controller's authoritative mana cap inclusive. Invalid targets fail closed rather than clamp, because clamping would violate `set` semantics.

The primitive reuses the existing `mana_adjusted` event for a non-zero actual delta and records before/after plus target and actual delta in its result envelope. Setting to the current value is a typed no-op with no resource event. `manaGainBlocked` applies to gain semantics, not exact assignment, and therefore does not suppress this primitive.

## Dependency boundary

No F1 member gains a runtime parent route in FB2-05. In particular, B2 must not add game-start, deployment, elimination, condition, replacement, lifecycle, modifier, or generic Trigger routing. Acceptance of the primitive/component is not migration acceptance.

## Required validation

1. Registry/normalizer/data-flow result schema recognizes `set_mana`.
2. Fixed 0 and positive values work; negative, above-cap, fractional, expression, third-party/extra semantics fail closed at the appropriate boundary.
3. Gain-block does not change exact set.
4. Same-value set is no-op; non-zero set emits typed `mana_adjusted`.
5. Later failure rolls the entire transaction back.
6. Existing Mana adjust/payment behaviors remain unchanged.
7. No parent route promotion, identity routing, F1 migration, or KPI change.
