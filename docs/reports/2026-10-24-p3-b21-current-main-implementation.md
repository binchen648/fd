# P3-B21 current-main implementation report

Disposition: `IMPLEMENTATION_COMPLETE_CANDIDATE` (not Reviewer accepted; no credit or merge claim).

Base: `c6e514a4da8c51e16f506bdef51eb981af613290` (B20 A-sync), branch `codex/b-p3-b21-current-main-20261023`.

This slice covers only Tomoe `sc-tomoe-1.penalty-on-defeat`: forced `after_controller_loses_battle`, one typed `adjust_victory_points(controller, -5)`, and one exact `effect_prevention`/`ignore` modifier scoped to `this_effect` with `explicit_exception` priority. It has no response, target, cost, create, lifecycle, or delay semantics. The collector now requires authoritative `battleParticipantIds` containing the controller and `battleResult.loserIds` containing the controller before dispatching the loss trigger. The semantic classifier rejects activation extras, response-window values outside the loader's empty-window defaults, visibility extras, wrong amount/player/trigger, weakened or extra prevention modifiers, and malformed same-family fallback.

The B21 E2E fixture is in-process so trusted server authority is preserved. It covers two battlefields, post-scoring barrier ordering, VP floor and typed unpreventable evidence, reload/reconnect persistence, and stale command rejection. The loader preserves an authoring-empty response window for this exact structural family; the runtime classifier accepts only that empty shape or its canonical loader defaults and rejects every extra/wrong response field. Existing Tomoe/complex synthetic loss fixtures were minimally aligned with authoritative participant/result provenance; no unrelated family or shared modifier implementation was changed.

Evidence:

- `npm ci`: exit 0.
- `npm run typecheck`: exit 0.
- B21 focused `battle-loss-unpreventable-vp-trigger.test.ts`: 7/7, exit 0.
- B13-B21 regression selection: 9 files, 62/62 tests, exit 0.
- Additional Tomoe/complex compatibility selection: 2 files, 44/44 tests, exit 0.
- Chromium: `npx playwright test e2e/fd-tomoe-unpreventable-defeat-penalty.spec.ts -c e2e/playwright-b21.config.ts`: 1/1, exit 0.
- Full CI comparison: the exact Base historical result was 189 passed suites, 6 failed suites, 1516 passed tests, 8 failed tests, 114 skipped. After B21 and fixture alignment, the full run produced 189 passed suites, 6 failed suites, 1517 passed tests, 8 failed tests, 114 skipped; the one additional passed test is the new B21 provenance regression. The remaining full-CI failures are the same historical Phase-3 provenance fixtures as Base.

This is implementation evidence only. It does not assert Reviewer acceptance, migration credit, merge, or a new ledger entry.
