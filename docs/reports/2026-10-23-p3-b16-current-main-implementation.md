# P3-B16 Current-main Implementation Report

Date: 2026-10-23 (Asia/Hong_Kong)
Task: `P3-B16`
Branch: `codex/b-p3-b16-current-main-20261023`
Exact A-sync Base: `97fd187331a6c4d2e3442d483971d4557da3a897`

## Scope

This runtime-only slice covers Achilles
`sc-achilles-1.achilles-heel`. The identity-free semantic classifier now
requires the exact forced `after_controller_loses_battle` shape with no extra
activation/conditions/targets/costs/modifiers/lifecycle/limit and exactly one
`reveal_information(scope=servant_package, subject=controller.servant)` effect,
including canonical execution/response metadata. The effect routes through the
typed Visibility primitive, using `abilityRuntime.revealedServants` as the
single truth source. First reveal emits stable `servant_package_revealed`
provenance; replay/re-entry is idempotent with no duplicate event. Invalid
controller/scope/subject and malformed near-misses fail closed atomically.

The existing post-scoring loss event and frozen battle participants are reused;
no B13/B14/B15 ordering or scoring pipeline was changed. The dedicated
in-process remote fixture proves public projection, real scored loss, terminal
ordering, reconnect preservation, stale rejection, and no duplicate reveal
effect.

Changed files are limited to B16 runtime/test/E2E/report scope. No coverage,
taxonomy, authoring, governance, or other TO14 data was changed. This is
runtime-only and claims zero migration credit; no Reviewer/acceptance/merge
claim is made.

## Execution receipts

- `npm ci` — exit `0` (npm audit warnings reported).
- Focused semantic red/green: malformed activation/effect near-misses were
  added as fail-closed assertions; final
  `npm exec vitest run packages/rules/tests/regression/battle-loss-servant-reveal.test.ts` — exit `0`, `8/8`.
- `npm run typecheck` — exit `0`.
- Compatibility command covering B16, B14 shared victory, B15 terminal Card
  Zone, B13 Shinji, Olga/B07 recertification, SOURCE_ACTIVE, and combat outcome
  conditions — exit `0`, `8` files / `55` tests.
- `npx playwright test e2e/fd-achilles-battle-loss-reveal.spec.ts -c playwright.config.ts` — initial fixture run exposed that typed reveal events are not part of the public projection log; that projection-only assertion was removed without weakening runtime coverage. Final rerun exit `0`, Chromium `1/1`.
- `git diff --check` — exit `0`.

## Disposition

`IMPLEMENTATION_COMPLETE_CANDIDATE` for the scoped B16 runtime slice only.
Independent Reviewer acceptance is pending. No migration credit, skill
acceptance, Gate promotion, or merge is claimed.
