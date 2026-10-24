# P3-FB2-02 current-main independent review

Verdict: **MIGRATION_ACCEPTED** for exact Base `287058dfbfc815346a5b665e73352122f81fa58c` and Candidate `83bd762944d5d806aebb4ceee127a3d130d7b1db`.

I reviewed in separate Reviewer worktree `E:/Codex/FD/fb2-02-current-main-reviewer`; the exact Base was tested in a separate detached worktree. No Builder implementation, A-sync, or migration credit was changed by this review.

## Contract and boundary

- The identity-free classifier accepts only forced automatic deployment trigger with non-empty event location, no extra activation/response/visibility/lifecycle/limit or other behavior nodes, and one or two fixed positive safe-integer controller `adjust_mana` / `adjust_victory_points` effects. Unknown effect keys, non-mana/non-VP effects, zero/negative/fractional/expression amounts, and third effects classify false.
- At runtime, the deployment/resource family intercepts malformed forced siblings with explicit location even when the effect is command-seal or movement; a wrong-kind resource sibling is also intercepted before legacy execution. Both new negative cases reject atomically. The controller and location checks prevent an unrelated player/location or ordinary movement event from earning the reward. Stable event-id replay is exactly once.
- The existing no-location Ereshkigal any-player deployment trigger remains on its legacy route and pays on another player's deployment. A generic missing-location resource form is structurally indistinguishable from that legitimate ability; runtime global rejection would violate this compatibility requirement. The FB2-02 classifier itself rejects missing location.
- The prior FB2-01 Kayneth/Maiya fixed-mana routes remain covered by the selected regression tests. No identity routing or authoring/content migration was introduced.

## Independent checks

| Check | Result |
| --- | --- |
| `npm run typecheck` | pass |
| Focused FB2-02, FB2-01, trigger-resource suite | 3 files, 23/23 tests pass |
| Rules regression suite | 69 files, 489/489 tests pass |
| `npm run verify:generated-content` | pass; deterministic content/fixture/evidence hashes |
| `git diff Base..Candidate --check` | pass |
| Full root `npm run test:ci`, sequential exact-Base/Candidate comparison | Base: 1640 total, 1518 passed, 8 failed, 114 skipped; Candidate: 1642 total, 1520 passed, 8 failed, 114 skipped. The eight failed test identities and 12 failed-suite identities are unchanged. |

The eight persistent failures are historical Phase-3 Git-path/blob evidence tests: five in `phase3-b11-observation-gaps`, one in `phase3-e06-post-merge-recount`, and two in `phase3-readiness-preflight`. The whole suite is **not green**; this verdict is based on exact failure-set parity and the added focused coverage. Gate C was not required for this rules-only FB2-02 scope.
