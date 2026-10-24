# P3-FB2-04 current-main independent review

Verdict: **MIGRATION_ACCEPTED** for exact Base `771099eedb948c796b319d92cc5eca349d8a3a6f` and Candidate `f2e20d060c5166316c7a1f6b40b1fdc556af1e9a`.

This independent review used separate Candidate and exact-Base worktrees. The Candidate adds only a current-main Builder receipt to `docs/reports/2026-09-16-p3-fb2-04-fixed-command-seal-component-result.md`; production code, tests, authoring, generated content and protocol files are unchanged. No implementation, A-sync, or migration credit was performed here.

The task-index contract covers six frozen identities/seven effects through a reusable fixed-controller signed literal `adjust_command_seals` component. The existing classifier requires a non-zero safe integer, implicit/explicit controller, optional non-empty string directive, and exact effect keys. It rejects variable/zero/fractional amounts, third-party, all-opponent, same-battlefield-opponent, restore-all, payment, and unknown sibling shapes. Direct Resource Numeric action and B13 battle-loss each retain their own parent gate and reuse this component; a matching effect under an unsupported parent remains unroutable. The existing Resolution Data-flow primitive is the sole mutation/evidence owner. Focused tests cover typed positive/negative actual deltas and atomic rollback on later underflow. The Builder receipt accurately describes this pre-existing state without claiming broader semantics.

Independent checks after `npm ci` and `npm run typecheck` in both worktrees:

| Check | Result |
| --- | --- |
| FB2-04, direct Resource Numeric, B13, FB2-03 focused | 4 files, 22/22 pass |
| Rules regression | 69 files, 487/487 pass |
| Generated-content determinism | pass; canonical content/fixture/evidence hashes unchanged |
| `git diff Base..Candidate --check` | pass |
| Full root CI, sequential Base then Candidate | Both 1640 total, 1518 passed, 8 failed, 114 skipped; eight failed test identities and 12 failed-suite identities exactly equal |

The full CI is **not green**. Its eight unchanged failures are historical Phase-3 B11 observation, E06 recount, and readiness-preflight Git-path/blob evidence tests. No new failure arose from this receipt-only Candidate. Browser Gate C is not required for an unchanged runtime/projection/interaction surface.
