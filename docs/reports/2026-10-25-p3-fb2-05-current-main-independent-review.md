# P3-FB2-05 current-main independent review

Verdict: **MIGRATION_ACCEPTED** for exact Base `d4d4049476033393d5aa29b000de44c7e0f19370` and Candidate `541ee70a72dbf6565b23f9ed276934c244e7347c`.

This review used separate Candidate and exact-Base worktrees. Candidate changes only the current-main receipt in `docs/reports/2026-09-16-p3-fb2-05-fixed-controller-set-mana-result.md` (24 lines); production, test, authoring, generated-content, and protocol code is byte-identical to Base. No implementation, A-sync, or migration credit was performed in this review.

The frozen component contract covers five F1 identities but does not itself route them. Existing identity-free `isFixedControllerManaSetComponent` accepts only `set_mana`, implicit/explicit controller, a nonnegative safe-integer literal, and exact keys `type`, `player`, `amount`. Existing typed Resolution Data-flow normalization rejects expression/binding and third-party nodes. Runtime `set_mana` validates `0..manaCap(controller)`, assigns the target exactly without applying the mana-gain-block rule, reports controller/target/actual delta/before/after, emits `mana_adjusted` only for a nonzero delta, and rolls the transaction back on later failure. Focused tests cover each boundary, including same-value no-op.

No Trigger Gateway or F1 parent route is added by Candidate. Current Base already contains a separate, narrowly gated game-start fixed-set parent route; this receipt leaves it unchanged and tests its compatibility. The five F1 rows are not promoted by this component-only recertification. No identity, printed-text, or location routing or unrelated hot-file/KPI change appears in the Candidate diff.

Independent checks after `npm ci` and `npm run typecheck` in both worktrees:

| Check | Result |
| --- | --- |
| Focused Resolution Data-flow, set-mana, game-start compatibility, deployment-resource | 4 files, 33/33 pass |
| Rules regression | 69 files, 487/487 pass |
| Generated-content determinism | pass; canonical content/fixture/evidence hashes unchanged |
| `git diff Base..Candidate --check` | pass |
| Full root CI, sequential Base then Candidate | Both 1640 total, 1518 passed, 8 failed, 114 skipped; eight failed test identities and 12 failed-suite identities exactly equal |

The full CI is **not green**. Its eight unchanged failures are historical Phase-3 B11 observation, E06 recount, and readiness-preflight Git-path/blob evidence tests. No new failure arose from this receipt-only Candidate. Browser Gate C is not required for an unchanged runtime/projection/interaction surface.
