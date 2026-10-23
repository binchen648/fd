# P3-B20 current-main implementation report

Disposition: `IMPLEMENTATION_COMPLETE_CANDIDATE` (not Reviewer accepted; no credit or merge claim).

Base: `49e4ba9d4730c9593af91a7b8a3b9b445367afcb` (B19 A-sync), branch `codex/b-p3-b20-current-main-20261023`.

This slice covers the three structurally identical Artoria Caster consumers `sc-artoriac-4/5/6.unique-passive-luck-on-win` through the existing typed create-card route. The implementation preserves the identity-free semantic family: optional post-battle response, controller-only eligibility, source card in controller hand, unique group `artoriac-pilgrim-unique-on-win` with one-effect-per-window arbitration, atomic source hand to removed-from-game move, exactly one `card.luck` creation in the controller deck followed only by that deck's shuffle, and no numeric effect.

Changes are limited to the B20 interpreter guard/provenance check, B20 focused regression coverage, the scoped B20 Chromium fixture/spec/config, B20-related synthetic fixture alignment, and this report. The collector now requires both authoritative `battleParticipantIds` and `battleResult.winners` arrays for a B20 family response, with the controller present in both; missing arrays, playerId-only events, non-participants, and non-winners fail closed before generic legacy resolution. Root result events that carry winners/losers but omit the participant array derive the scoped participant list for their server-generated child events, preserving the existing result pipeline while keeping direct incomplete win events blocked. Two existing Artoria synthetic fixtures were minimally aligned with this contract by adding `battleParticipantIds: ['p1','p2']` and matching winners/loserIds. Structural key regressions prove malformed same-family activation/response/condition/create shapes fail closed. The focused suite also proves all three canonical consumers, unique arbitration, decline/no-op, loss/unrelated/non-participant filtering, replay idempotence, and atomic malformed rejection.

Evidence:

- `npm ci` completed successfully (dependency audit reported existing vulnerabilities).
- `npm run typecheck`: exit 0.
- B20 focused `packages/rules/tests/regression/battle-win-unique-create-card-trigger.test.ts`: 6/6, exit 0.
- B13-B20 compatibility selection (8 regression files): 8 files, 55/55 tests, exit 0.
- Additional authoring/complex compatibility after fixture alignment: 10 files, 130/130 tests, exit 0.
- Chromium: `npx playwright test e2e/fd-artoria-caster-luck-on-win.spec.ts -c e2e/playwright-b20.config.ts`: 1/1, exit 0. The in-process fixture covers three choices, unique one-of-three settlement, reconnect/reload, and stale replay rejection.
- Full Base comparison: before B20 edits, the exact Base produced 187 passed suites, 8 failed suites, 1512 passed tests, 12 failed tests, 114 skipped; after strict provenance and fixture alignment, `npm run test:ci -- --reporter=dot` produced 189 passed suites, 6 failed suites, 1516 passed tests, 8 failed tests, 114 skipped. The remaining failures are the same historical Phase-3 provenance fixtures as Base; no B20-related failures remain.

This is implementation evidence only. It does not assert acceptance, migration credit, merge, or a new Candidate/ledger entry.
