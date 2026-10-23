# P3-B18 current-main implementation

Date: 2026-10-23
Base: `a07091cd02903f55b42b627ec386019e63c3ae95`
Branch: `codex/b-p3-b18-current-main-20261023`

## Scope

This slice is limited to Artoria Alter `sc-artoria-alt-3.noble-bloom`. The existing
identity-free semantic path remains the only route: an `optional_trigger` in combat
after `after_battle_result_determined`, with the single structural condition
`controller_played_highest_cost_noble_phantasm_in_battle_this_round` and one typed
`adjust_victory_points(controller, +1)` effect. The classifier was tightened to reject
extra activation/condition/effect fields and non-empty visibility metadata; no
legacy `resolveEffect` or ability-ID route was added.

The B18 E2E fixture now prepares and seals the room in the server process, dispatches
the post-scoring result there, and exposes dynamic room credentials. A B18-only
Playwright config drives Chromium directly against that fixture WebSocket, avoiding
the repository-wide client web-server JSON-module startup defect while keeping the
real browser, reconnect, and stale-command path. This preserves
the same optional response window through reload/reconnect and rejects stale replay
without a second VP event. No server authority check, shared persistence, coverage,
inventory, governance, or sibling skill was changed.

## Verification receipts

- `npm ci`: exit 0 (baseline dependency install; audit warnings were reported by npm).
- `npm run typecheck`: exit 0.
- `npm exec vitest run packages/rules/tests/regression/battle-result-optional-vp-trigger.test.ts`: 1 file, 9/9 tests, exit 0, including wrong-effect, unapproved-condition, and wrong-window same-family fail-closed coverage.
- B13-B17 compatibility focused run (7 files): 45/45 tests, exit 0. Included B14 shared-victory, B15 terminal source-card, B16 reveal, B17 first-loss, and B13 loss-resource suites.
- In-process B18 fixture smoke start: emitted dynamic `httpBase`, `wsBase`, room, client, and reconnect credential successfully.
- `npx playwright test e2e/fd-artoria-alt-noble-bloom-vp.spec.ts -c playwright.config.ts`: historical exit 1 before test collection. The repository web-server startup failed with Node JSON-module errors (`starter-pack.json` requires an import attribute), followed by `No tests found`.
- `npx playwright test e2e/fd-artoria-alt-noble-bloom-vp.spec.ts -c e2e/playwright-b18.config.ts`: exit 0, Chromium 1/1. The real browser fixture covered response-window accept (+1 VP), reload/reconnect before and after resolution, stale replay, and exactly one VP event. Decline, shared-result participation/condition negatives, and duplicate/re-entry behavior are covered by the focused 7/7 regression suite; no duplicate VP event was observed in the browser replay path. This is the B18 Gate C receipt.
- `git diff --check`: clean.

The focused 9/9 and compatibility 45/45 receipts cover accept, decline, wrong-effect,
wrong-window and
malformed-shape fail-closed behavior, duplicate/replay,
condition-negative, shared scoring barrier, and B13-B17 compatibility behavior.
The first Chromium attempt is retained as an environment failure; the B18-specific
configuration then supplied a passing Gate C receipt without changing production
auth/runtime or relaxing authority checks.

## Disposition

`IMPLEMENTATION_COMPLETE_CANDIDATE` only. This report does not claim Reviewer
acceptance, migration credit, or merge. The canonical authoring identity was not
added by this runtime/test-only slice, so migration credit is zero pending the
project's separate accounting process.
