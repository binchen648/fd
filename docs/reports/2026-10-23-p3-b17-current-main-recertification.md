# P3-B17 Current-main Recertification Report

Date: 2026-10-23 (Asia/Hong_Kong)
Task: `P3-B17`
Branch: `codex/b-p3-b17-current-main-20261023`
Exact A-sync Base: `0d2ca44c702bde8c7a2ad8c1d4a81f6ed16e8cb7`

## Recertification scope

This evidence-first pass recertifies the existing Olga-Marie
`astronomical-science.first-loss` composition without production runtime
changes. The focused path remains structural: forced
`after_controller_first_loses_battle`, server-owned post-scoring identity,
`lossOrdinal=1`, exactly one delayed activation, and formal `round_end` typed
`activate_card_by_id(master.olga-marie.skill.trismegistus-grief)`. No immediate
battle settlement activation occurs, and re-entry/replay cannot duplicate the
staged activation.

The Olga E2E now uses a same-process fixture server so the real MatchSession
path is exercised without cross-process restore authority issues. It proves
projection, round-end activation, reconnect stability, stale rejection, and a
single target card instance. Existing focused assertions cover scoring →
barrier → first-loss ordering, stable battle/result identity and ordinal,
scoring-eliminated Olga eligibility, invalid-target atomicity, and exact-once
round-end activation.

No production runtime file, authoring data, coverage/taxonomy, governance, or
other TO14 consumer was changed. This is recertification evidence only: no
Reviewer, migration-credit, acceptance, or merge claim is made.

## Execution receipts

- `npm ci` — exit `0` (npm audit warnings reported).
- `npm run typecheck` — exit `0`.
- B17 focused command (`battle-first-loss-delayed-activation-recert` plus
  `card-action-activate`) — exit `0`, `2` files / `11` tests.
- Compatibility command covering B17, B13, B16, B15, B14, Trigger and
  SOURCE_ACTIVE conditions — exit `0`, `7` files / `46` tests.
- `npx playwright test e2e/fd-olga-activate-card-action.spec.ts -c playwright.config.ts` — exit `0`, Chromium `1/1`, with reconnect/stale/no-duplicate target-card evidence.
- `git diff --check` — exit `0`.

## Disposition

`RECERTIFICATION_COMPLETE_CANDIDATE` for the current-main B17 evidence scope.
Independent Reviewer acceptance remains pending. No production runtime repair
was necessary because fresh focused, compatibility, and browser evidence were
green.
