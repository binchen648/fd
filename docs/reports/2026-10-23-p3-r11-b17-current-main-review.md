# P3-R11 Independent Review — B17 Current-main Recertification

Date: 2026-10-23 (Asia/Hong_Kong)
Reviewer verdict: **MIGRATION_ACCEPTED — scoped B17 recertification only**

## Exact review boundary

- Candidate: `41088a383b343a04cc9f2c51f17b057db43d5367` on `codex/r-p3-b17-current-main-20261023`.
- Exact parent/Base: `0d2ca44c702bde8c7a2ad8c1d4a81f6ed16e8cb7` (also checked in the separate, clean `E:\Codex\FD\b16-current-main-a-sync` worktree).
- Reviewed `TASK P3-B17`, `TASK P3-R11`, the B17 handoff and Builder recertification report, and the complete Base-to-Candidate diff.
- The diff is limited to the B17 report, `e2e/fd-olga-activate-card-action.spec.ts`, and two B17 E2E support fixtures. There is no production runtime, card authoring, inventory, coverage, governance, or credit diff. This is recertification of the existing direct consumer, not a new canonical identity.

## Findings, ordered by severity

1. **Moderate — full root CI remains red, with no Candidate-only failure count.** After `npm ci` and `npm run typecheck` in each worktree, `npm run test:ci -- --reporter=dot` exited `1` on both exact Base and Candidate: **6 failed / 189 passed files; 8 failed / 1508 passed / 114 skipped tests (1630 total)**. Existing failures include governance/provenance checks such as `phase3-e06-post-merge-recount` and `phase3-readiness-preflight`; they are not B17 focused failures. Identical totals and the absence of production or unit-test changes provide no evidence of a new deterministic B17 regression, but do **not** make the repository CI green or independently prove every failure has identical causation. The earlier historical handoff's `663 PASS / 20 inherited FAIL` is not a current-tree baseline and was not substituted for this comparison.
2. **Low — Base collection required normal build preparation.** An initial Base `npm run test:ci` before Base typecheck/build exited `1` with collection errors and 123 failed / 72 passed files, 8 failed / 497 passed / 114 skipped tests. A repeated pre-build attempt had the same collection anomaly. After Base `npm run typecheck` exited `0`, its full test result became the comparable 6/189 and 8/1508/114 result above. This setup anomaly is disclosed, not presented as a Candidate failure or as a passing baseline. The Base worktree was not modified in tracked files.
3. **No blocking B17 finding.** Focused, compatibility, and browser evidence below pass on the exact Candidate. No production implementation change was made or needed for this recertification.

## Independent evidence and contract judgment

| Gate | Independent check | Result |
| --- | --- | --- |
| A — semantic route and typed action | `npm ci`; `npm run typecheck`; `npm exec vitest run packages/rules/tests/regression/battle-first-loss-delayed-activation-recert.test.ts packages/rules/tests/regression/card-action-activate.test.ts` | exit `0`; exit `0`; **2 files / 11 tests passed** |
| B — battle composition and compatibility | `npm exec vitest run packages/rules/tests/regression/battle-first-loss-delayed-activation-recert.test.ts packages/rules/tests/regression/battle-loss-resource-trigger.test.ts packages/rules/tests/regression/battle-loss-servant-reveal.test.ts packages/rules/tests/regression/battle-terminal-source-card-zone.test.ts packages/rules/tests/regression/battle-shared-victory-vp-trigger.test.ts packages/rules/tests/regression/lifecycle-source-active-runtime.test.ts packages/rules/tests/fb2-33-event-combat-outcome.test.ts` | exit `0`; **7 files / 46 tests passed** |
| C — real remote-room browser path | `npx playwright test e2e/fd-olga-activate-card-action.spec.ts -c playwright.config.ts` | exit `0`; **Chromium 1/1 passed** |

The existing `isActivateCardByIdTrigger` classifier is structural, not keyed to Olga's card/ability ID: `forced_trigger + after_controller_first_loses_battle` with one `activate_card_by_id` effect and a nonempty definition target. The Card Action regression covers an identity-renamed positive and near-miss wrong trigger, target, and effect negatives. There is no new legacy `resolveEffect` or representative-ID bypass in the Candidate diff.

The real `MatchSession` regression exercises two battlefield scoring receipts before the phase barrier emits the server-derived first-loss event. It asserts stable `battlePhaseResolutionId`, `battleId`, `resultId`, `battlefieldId`, participant provenance and `lossOrdinal=1`; one queued delayed activation despite duplicate/re-entry pressure; no immediate activation in battle-result settlement; and one typed activation only on formal `round_end`. Frozen participation permits scoring-eliminated Olga to stage her same-battle first-loss trigger. Forged restore provenance and a missing target are rejected, with the latter leaving the round-end action atomic. The pre-existing typed action checks owned/controlled skill-zone target cardinality and validity before moving the exact Trismegistus instance.

The same-process E2E fixture is confined to B17 test/support files. It drives the real server HTTP/WebSocket and `MatchSession` path, not a production authentication relaxation. The fresh Chromium run observes battle-to-round-end activation, one projected target instance, stable reload/reconnect state, and stale-revision rejection without duplicate activation. B13/B14/B15/B16, Trigger, Lifecycle, and Card Action focused compatibility is represented by the commands above; this review does not inherit their separate migration acceptances.

## Disposition and A03 synchronization input

**MIGRATION_ACCEPTED** for the already semantic-routed Olga `astronomical-science.first-loss` TO14 direct-consumer composition on this exact B13–B16 lineage, under the scoped Gate A/B/C evidence above. This is R11 recertification acceptance only. A03 may use it as the B17 synchronization input for the scoped TO14 direct-consumer overlay, subject to A03's own reconciliation; this report does not edit that overlay, grant migration credit, accept sibling consumers, claim full-suite green, or authorize merge. The full root CI red state remains a separate governance/CI follow-up.
