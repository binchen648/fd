# P3-FB2-03 Fixed Controller Mana/VP Adjustment Component Handoff

- Date: 2026-09-16
- Role: A
- Status: READY_FOR_B2
- RuntimeBaseline: `98518d02ff5e905426136ce7ae8450d646b62538`
- F1Evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- RuntimeRequest: `runtime-capability-6220d123d8e1` / `GENERIC_RESOURCE_NUMERIC`
- ReferenceCommit: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Why this component is next

Wave 1 remains Resource Numeric + Cost. FB2-01 accepted fixed controller mana payment; FB2-02 accepted one narrow deployment reward route. The next reusable gap is the Resource Numeric component shared by many later parent routes.

Final F1 source overlays contain `59` identities whose entire Resource Numeric contribution is composed only of fixed positive-magnitude controller operations from `gain_mana(N)`, `lose_mana(N)`, `gain_victory_points(N)`, and `lose_victory_points(N)`, where `N` is a positive safe-integer literal and target/player is absent or explicitly controller.

Canonical runtime mapping is mechanical and source-preserving:

- `gain_mana(N)` -> `adjust_mana(+N)`
- `lose_mana(N)` -> `adjust_mana(-N)`
- `gain_victory_points(N)` -> `adjust_victory_points(+N)`
- `lose_victory_points(N)` -> `adjust_victory_points(-N)`

This handoff does not authorize any parent trigger/action/condition/target route. A skill remains unroutable until its parent contract is independently accepted.

## Exact F1 component membership (59)

- `master.akasha.skill.s2`
- `master.akasha.skill.s3`
- `master.akiha.skill.s3`
- `master.bazett.skill.s1a`
- `master.bazett.skill.s1c`
- `master.bazett.skill.s3`
- `master.bazett.skill.s5`
- `master.caren.skill.ascension`
- `master.celenike.skill.s1a`
- `master.chaos.skill.s7`
- `master.fiore.skill.ascension`
- `master.fiore.skill.s1a`
- `master.fiore.skill.s6`
- `master.fujino.skill.ascension`
- `master.fujino.skill.s4`
- `master.goetia.skill.s2`
- `master.goredolf.skill.ascension`
- `master.goredolf.skill.s1a`
- `master.hakuno-f.skill.s3`
- `master.hinako.skill.s3`
- `master.iliya.skill.s3`
- `master.iliya.skill.s4`
- `master.jinako.skill.s1`
- `master.kadoc.skill.s1a`
- `master.kadoc.skill.s3`
- `master.kadoc.skill.s4`
- `master.kariya.skill.s3`
- `master.kiara.skill.ascension`
- `master.kohaku.skill.s1a`
- `master.leonardo.skill.ascension`
- `master.reines.skill.s4`
- `master.roche.skill.s1a`
- `master.sakura.skill.s3`
- `master.shinji.skill.s1`
- `master.shirou-meal.skill.s2`
- `master.tiamat.skill.s1a`
- `servant.altera.skill.sc-altera-3`
- `servant.anastasia.skill.sc-anastasia-1`
- `servant.andersen.skill.sc-andersen-1`
- `servant.arthur.skill.sc-arthur-3`
- `servant.artoria-alt.skill.sc-artoria-alt-3`
- `servant.artoriac.skill.sc-artoriac-4`
- `servant.artoriac.skill.sc-artoriac-5`
- `servant.artoriac.skill.sc-artoriac-6`
- `servant.avicebron.skill.sc-avicebron-1`
- `servant.avicebron.skill.sc-avicebron-3`
- `servant.bedivere.skill.sc-bedivere-1`
- `servant.charlemagne.skill.sc-charlemagne-3`
- `servant.davinci.skill.sc-davinci-3`
- `servant.davinci.skill.sc-davinci-4`
- `servant.gawain.skill.sc-gawain-3`
- `servant.lakshmibai.skill.sc-lakshmibai-3`
- `servant.mordred.skill.sc-mordred-3`
- `servant.musashi.skill.sc-musashi-3`
- `servant.saber.skill.sc-saber-1`
- `servant.saitou.skill.sc-saitou-1`
- `servant.semiramis.skill.sc-semiramis-2`
- `servant.shakespeare.skill.sc-shakespeare-1`
- `servant.sherlock.skill.sc-sherlock-2`

Six of the 59 already have complete parent-route eligibility through FB2-02. The other 53 remain blocked by one or more later-wave parent/gateway/special dependencies. FB2-03 is component alignment, not synthetic F4 burn-down.

## Explicit exclusions

Not admitted: `set_mana`, transfer/swap resource operations, command-seal adjustment, payment, linked/third-party resources, variable/expression source magnitude, non-controller target, ambiguous direction, or arbitrary parent-route semantics.

## Existing runtime foundation

Resolution Data-flow already owns typed `adjust_mana` and `adjust_victory_points`: authoritative controller ownership, mana cap/gain-block/zero floor, VP zero floor, typed actual-delta evidence, and cloned transaction settlement. FB2-03 must not duplicate those primitives.

## Exact runtime component contract

Add one reusable identity-free predicate/adapter for a single fixed controller Mana/VP adjustment effect:

- type `adjust_mana` or `adjust_victory_points`;
- `player` absent or `controller`;
- fixed safe-integer literal amount;
- no hidden semantic fields beyond ordinary structural fields;
- no identity or printed-text parsing.

Zero may remain a typed no-op if needed to preserve an accepted parent route; F1 membership here contains only non-zero source-grounded gain/loss magnitudes.

The component must be consumed by at least two already accepted parent routes (for example TO-11 location-entry Resource Numeric and FB2-02 deployment reward) without broadening either route. Existing direct-action Resource Numeric behavior must remain compatible.

## Required proof

1. renamed identities behave identically;
2. fixed positive/negative Mana and VP deltas classify;
3. implicit/explicit controller are equivalent;
4. variable/expression, third-party, command seals, pay/set/transfer/swap, and extra semantic fields are rejected;
5. mana cap, gain-block, floor, and VP floor retain typed actual-delta evidence;
6. TO-11 location-entry route consumes the component without trigger widening;
7. FB2-02 deployment reward consumes the component without provenance widening;
8. unsupported parent shape is not made routable merely because its effect matches;
9. FB2-01 remains green;
10. typecheck, rules regression, deterministic verification, full CI, and diff check remain green.

## Files

May touch `packages/rules/src/ability/interpreter.ts`, one focused FB2-03 regression test, narrow existing Resource Numeric assertions if needed, and `docs/reports/2026-09-16-p3-fb2-03-fixed-resource-component-result.md`.

Must not touch MatchSession, Resolution Data-flow primitives unless A re-dispatches a demonstrated primitive defect, client/server projection, F1 artifacts, roster authoring, or A-owned KPI/taxonomy.

No new browser Gate C is required if this stays an internal server-side component/refactor.

## Completion status

- `IMPLEMENTATION_COMPLETE_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`