# P3-R12 Independent Review — B18 Current-main Candidate

Date: 2026-10-23 (Asia/Hong_Kong)

**Verdict: MIGRATION_ACCEPTED — B18 runtime capability only.** This accepts the one Artoria Alter `sc-artoria-alt-3.noble-bloom` optional post-result VP consumer on the exact reviewed lineage. It grants no canonical identity, migration credit, sibling acceptance, merge, or full-suite green status.

## Boundary and findings

- Exact Base: `a07091cd02903f55b42b627ec386019e63c3ae95`; exact final Candidate: `4a4ee132cb8d5469b4f6e2da0698402ba1770d0d` on `codex/r-p3-b18-current-main-20261023-v6`. I read TASK P3-B18/R12, the handoff, Builder report, and the full Base-to-Candidate diff. The diff is restricted to `packages/rules/src/ability/interpreter.ts`, its B18 regression test, one B18 E2E spec, B18-only Playwright config/two fixture helpers, and the B18 report. No auth, generic server, authoring, inventory, credit, or governance file changed. The `noble-bloom-extra-vp` authored sibling was not edited or accepted by this review.
- **Moderate, inherited:** `npm run test:ci -- --reporter=dot` remains red. The independently prepared exact Base (`npm ci`, `npm run typecheck`, then CI) exited `1`: 6 failed / 189 passed files; 8 failed / 1508 passed / 114 skipped tests. The final Candidate also exited `1`: 6 failed / 189 passed files; 8 failed / 1515 passed / 114 skipped tests. The same eight B11 provenance/governance failures request absent historical Git paths/blobs; no new deterministic failure remains. Seven added passing tests account for the B18 test-count increase. The earlier overbroad-guard Candidate `1bfeebe1` had 23 failed tests, including unrelated optional triggers; this final Candidate restores those tests. Neither run establishes a green repository CI.
- **Low, report accuracy:** the Builder report's Chromium bullet still refers to a historical “focused 7/7” suite, while its current focused receipt and my independent result are 13/13. Its wording that the browser fixture dispatches a “post-scoring result” should not be read as the browser fixture itself proving the phase-wide scoring barrier: it injects a test result event into a real server process. The separate production `MatchSession` regression proves the two-receipt barrier and score-before-window ordering.

## Independent Gate A/B/C receipts

| Gate | Command / check | Result |
| --- | --- | --- |
| A | `npm ci`; `npm run typecheck`; `npm exec vitest run packages/rules/tests/regression/battle-result-optional-vp-trigger.test.ts` | exits `0`, `0`, `0`; B18 focused **13/13** |
| B | `npm exec vitest run` on B18, B13 loss-resource, B14 shared-victory VP, B15 terminal card-zone, B16 servant reveal, B17 first-loss recertification, and the existing optional extra-VP sibling regression | exit `0`, **7 files / 49 tests** |
| B, unrelated optional triggers | `npm exec vitest run packages/rules/tests/fb2-47-controller-defeated-vp-reward.test.ts packages/rules/tests/regression/fb2-alter-ego-transform.test.ts packages/rules/tests/regression/fb2-presence-concealment-pre-scoring.test.ts` | exit `0`, **3 files / 29 tests**; previously overbroad guard's regressions are gone |
| C | `npx playwright test e2e/fd-artoria-alt-noble-bloom-vp.spec.ts -c e2e/playwright-b18.config.ts` | exit `0`, **Chromium 1/1** |

The final classifier is structural, not Artoria/card/ability-ID based: optional combat trigger, `after_battle_result_determined`, matching response window, the one highest-cost Noble Phantasm condition, and one controller `adjust_victory_points(+1)` effect, with no extra targets, costs, creates, modifier, lifecycle, limit, or visibility fields. The real `MatchSession` test observes both battlefield base-scoring receipts at the B13 phase-wide barrier, no window at the barrier, then one optional response at result dispatch. Accept yields a typed Resource `victory_points_adjusted` +1 event with source/ability and before/after values; decline yields +0; duplicate result replay cannot award again. The condition-false and nonparticipant paths expose no legal response. The valid B19 extra-VP sibling remains green in its pre-existing 5-test suite but is not promoted here.

I independently reproduced adversarial same-family variants in an in-memory rules session. The exact B18 shape opened one window and changed VP 4→5 on acceptance. Wrong effect, wrong or missing condition, threshold-one or unrelated extra condition, wrong or missing response window, wrong or missing phase, and wrong or missing trigger each exposed **no** response window and left VP 4/mana 1 unchanged. This rechecks the prior wrong-effect, wrong-condition, wrong-window, wrong-trigger, and missing-phase legacy-fallback defects on this final SHA. No legacy `resolveEffect` or representative-ID route was added for the accepted semantic.

The B18-only Chromium fixture runs the real match-server HTTP/WebSocket credential and revision checks, with no production-auth change. It verifies pending-window projection at VP 2, controller response, reload/reconnect before and after settlement, VP 3 with one VP event, stale-revision rejection, and no second window or award. Gate C proves remote projection/reconnect/stale behavior; the focused production session test, not the fixture's injected event, supplies the authoritative score-before-window evidence.

## Disposition

Gate A/B/C are satisfied for this single B18 runtime capability. A03 may use this exact R12 acceptance as synchronization input for the scoped TO14 direct-consumer overlay, subject to its own governance and accounting. This report does not change that overlay, add credit, accept `noble-bloom-extra-vp` or any other consumer, or authorize merge. The inherited full-root B11 provenance failures remain a separate red-CI follow-up.
