# P3-FB2-06 Fixed Controller Draw Result — 2026-09-16

- Role: Codex B2
- Base handoff: `8e66df97a8dedee33370327b5425d9558e185e11`
- Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`

## Implementation

Production change is limited to `packages/rules/src/ability/interpreter.ts`.

Added identity-free `isFixedControllerDrawCardsComponent` for canonical runtime effects:

- type `draw_cards`;
- implicit/explicit controller only;
- fixed positive safe-integer count;
- no sibling semantic fields.

Added one narrow structural/semantic route for the accepted wave-2 representative shape:

- `phase_action` in runtime `advance` / controller action window;
- one fixed controller `pay_mana(1)` cost using the already accepted FB2-01 component;
- one fixed controller `draw_cards(2)` effect;
- no target/condition/create/modifier/lifecycle/response/limit.

The route settles payment + draw in one typed Resolution Data-flow transaction. The existing `draw_cards` primitive remains the sole card mutation/shuffle owner; no second draw engine was added.

Malformed same-family advance/pay/draw shapes are rejected before legacy execution. Insufficient fixed Mana is rejected before ability usage mutation. The component alone does not make trigger/other-parent abilities routable.

## Focused proof

New regression: `packages/rules/tests/regression/fb2-fixed-controller-draw.test.ts`.

Proof covers:

- identity-free fixed draw component classification;
- zero/negative/fractional/variable/third-party/custom-deck/extra-semantic rejection;
- exact structural route classification independent of ability id;
- fixed component under unsupported parent does not gain a route;
- payment 1 + draw 2 settle together with typed `mana_paid` and `cards_drawn` evidence;
- insufficient Mana hides legal activation and direct execution mutates neither hand, Mana, events, nor used-ability state;
- malformed same-family shape fails closed before legacy mutation;
- controller discard is recycled/shuffled through the existing draw primitive.

Focused compatibility result:

- FB2-06 + FB2-01 + Card Zone + PLAY + Interaction: `5 files / 25 tests PASS`.

## Full validation

- `npm.cmd run typecheck`: PASS.
- all rules regressions: `45 files / 268 tests PASS`.
- deterministic generated-content verification: PASS with unchanged hashes:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`
- full CI: `112 files / 681 tests PASS`.
- production identity/text audit: `NONE`.
- forbidden-file audit: `NONE`.
- `git diff --check`: PASS.

## Scope guard

This candidate does not promote generic Card Zone, Trigger Gateway, broad PLAY, the 14 mixed servant draw/play rows as complete routes, variable/custom-deck draw, Result Binding, Target/PendingInteraction, Visibility, Lifecycle, Modifier/Power, Battle, Special, or F1 migration.

The A-owned 23-identity F1 component membership remains evidence alignment only. Waver-shaped direct route acceptance still requires independent R23 review before any migration claim.
