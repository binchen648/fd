# P3-B15 Current-main Implementation Report

Date: 2026-10-23 (Asia/Hong_Kong)
Task: `P3-B15`
Branch: `codex/b-p3-b15-current-main-20261023`
Exact A-sync Base: `e951d7cc86e031807f6dc3af7c029310bf1317c9`

## Scope

This runtime-only slice covers Ereshkigal
`sc-ereshkigal-2.return-to-skill-zone`. The identity-free semantic classifier
now requires the exact combat `after_battle_ended` forced-trigger shape with one
`this_card` move to controller skill, including canonical execution and
response metadata. It routes through the typed source-card Card Zone primitive;
the primitive validates source existence, controller ownership/control, active
face-up board zone, and skill destination atomically, then sets controller
ownership, owner-only visibility, and inactive source state.

The generic phase-terminal producer remains phase-scoped: it stages one stable
terminal event per `battlePhaseResolutionId`, after queued result/win/loss/
first-loss consumers are terminal and before cleanup. MatchSession and core
game-loop paths share the same terminal helper. The dedicated in-process E2E
fixture proves two battlefields, terminal-after-results ordering, source return
before cleanup, reconnect/stale preservation, and no duplicate terminal move.

Changed files are limited to B15 runtime/test/E2E/report scope. No coverage,
taxonomy, authoring, governance, other TO14 consumer, Candidate, or Gate
promotion data was changed. This is runtime-only and claims zero migration
credit; no Reviewer/acceptance/merge claim is made.

## Execution receipts

- `npm ci` — exit `0` (npm audit warnings reported).
- Focused semantic red/green: malformed activation/effect/destination cases are
  fail-closed; final `npm exec vitest run packages/rules/tests/regression/battle-terminal-source-card-zone.test.ts` — exit `0`, `7/7`.
- `npm run typecheck` — exit `0`.
- Compatibility command covering B15, B14 shared victory, B13 Shinji,
  Olga/B07 recertification, SOURCE_ACTIVE, and combat outcome conditions — exit
  `0`, `7` files / `47` tests.
- `npx playwright test e2e/fd-ereshkigal-battle-terminal-card-zone.spec.ts -c playwright.config.ts` — exit `0`, Chromium `1/1`.
- `git diff --check` — exit `0`.

## Disposition

`IMPLEMENTATION_COMPLETE_CANDIDATE` for the scoped B15 runtime slice only.
Independent Reviewer acceptance is pending. No migration credit, skill
acceptance, Gate promotion, or merge is claimed.
