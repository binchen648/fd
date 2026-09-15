# P3-FB2-06 Fixed Controller Draw Component / Advance Draw Handoff

Date: 2026-09-16
Role: A
Status: READY_FOR_B2

## Baselines

- Runtime/A-sync baseline: `de6e57c2610c560b81791ef931bf5bc09dab8fc7`.
- F1 final source evidence: `59f145434695d29bdd17e4cb3adc887e84182377`.
- Request: `runtime-capability-a600709be05b` / `GENERIC_CARD_ZONE`.
- Reference remains read-only at `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.

## Why FB2-06 is next

A-owned wave-1 closure found no further independent Resource Numeric / Cost primitive that can be implemented without consuming a later-wave dependency. Per the accepted dependency order, FB2-06 starts wave 2: Card Zone / Draw / Move / Return.

Resolution Data-flow already owns `draw_cards`, including controller deck/discard recycling, shuffle, typed requested/actual count result, emitted movement evidence, and transaction rollback. FB2-06 must reuse that primitive and must not create a second draw engine.

## Frozen F1 component membership (23)

The following exact F1 identities contain a fixed positive ordinary-controller-deck draw component. Parent-only qualifiers such as `when` or `operation` are not accepted by the component and remain separate parent dependencies.

- `master.goetia.skill.ascension`
- `master.kiritsugu.skill.s2`
- `master.miyu.skill.ascension`
- `master.miyu.skill.s2`
- `master.ritsuka-f.skill.s1a`
- `master.roche.skill.s1a`
- `master.roche.skill.s2`
- `master.waver.skill.s2`
- `servant.boudica.skill.sc-boudica-3`
- `servant.constantine.skill.sc-constantine-1`
- `servant.drake.skill.sc-drake-1`
- `servant.hephaistion.skill.sc-hephaistion-3`
- `servant.iskandar.skill.sc-iskandar-1`
- `servant.ivan.skill.sc-ivan-3`
- `servant.mandricardo.skill.sc-mandricardo-3`
- `servant.martha.skill.sc-martha-3`
- `servant.medb.skill.sc-medb-1`
- `servant.medusa.skill.sc-medusa-1`
- `servant.odysseus.skill.sc-odysseus-3`
- `servant.okita.skill.sc-okita-1`
- `servant.roberts.skill.sc-roberts-3`
- `servant.teach.skill.sc-teach-3`
- `servant.ushiwakamaru.skill.sc-ushiwakamaru-3`

Excluded from this component: custom Beast/owner decks, variable/binding count, draw-until semantics, third-party controller, and draws whose result identity is itself consumed by a later binding contract.

## Runtime component contract

Add/reuse one identity-free fixed-controller draw component predicate for canonical runtime effects:

- type exactly `draw_cards`;
- player absent or `controller`;
- fixed positive safe-integer count;
- ordinary controller deck semantics only;
- no custom deck, variable expression, draw-until, third-party target, or sibling semantic fields.

The component alone must not make an unsupported parent ability routable.

## Complete direct-route representative

FB2-06 also accepts one narrow complete direct action family represented by F1 `master.waver.skill.s2`:

- source timing `outpost`, canonically mapped to runtime `advance` (`advance/outpost` is the accepted timing terminology pair);
- phase action / controller action window;
- no target, condition, create, modifier, lifecycle, response, or limit;
- exactly one fixed positive controller `pay_mana` cost, amount 1, using the already accepted FB2-01 component;
- exactly one fixed controller ordinary-deck `draw_cards` effect, count 2;
- payment + draw settle atomically through typed Resolution Data-flow;
- insufficient Mana fails without drawing or leaking events;
- draw recycling/shuffle remains owned by the existing primitive.

B2 must not migrate Waver authoring in this task. S migration remains a separate F4 action after R acceptance.

## Explicit non-promotion

FB2-06 does not accept:

- generic Card Zone;
- Trigger Gateway or `on_card_played` draw;
- the 14 servant mixed draw/play skills as complete routes;
- arbitrary PLAY semantics;
- variable draw count or custom deck draw;
- Result Binding, Target Selection, PendingInteraction, Visibility, Lifecycle, Modifier/Power, Battle, or Special behavior;
- any F1 authoring migration.

## Required proof

1. fixed controller draw component is identity-free and text-free;
2. fixed positive count classifies; zero/negative/fractional/variable/custom-deck/third-party/extra-semantic siblings reject;
3. matching draw effect under unsupported parent shape remains unroutable;
4. Waver-shaped `advance` phase action with fixed 1 Mana + draw 2 routes without identity checks;
5. fixed payment and draw are atomic in one resolution transaction;
6. insufficient Mana commits no draw/state/event mutation;
7. deck-empty/discard-present draw recycles and shuffles through the existing primitive;
8. existing Card Zone, FB2-01, PLAY, Interaction, and Resource regressions remain green;
9. typecheck, focused tests, all rules regressions, deterministic generation, full CI, identity/text audit, forbidden-file audit, and `git diff --check` pass.

## Files

B2 may touch:

- `packages/rules/src/ability/interpreter.ts`;
- one focused FB2-06 regression test;
- narrow existing Card Zone assertions only if required;
- `docs/reports/2026-09-16-p3-fb2-06-fixed-controller-draw-result.md`.

Do not touch MatchSession, the `draw_cards` Resolution Data-flow primitive unless a demonstrated primitive defect requires A re-dispatch, client/server projection, F1 artifacts, roster authoring, or A-owned KPI/taxonomy.

## Completion status

- `IMPLEMENTATION_COMPLETE_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`
