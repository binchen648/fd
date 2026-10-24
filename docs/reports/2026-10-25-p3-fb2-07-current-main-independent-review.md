# P3-FB2-07 current-main independent review

Verdict: **MIGRATION_ACCEPTED** for exact Base `b25e1c2390b44cdb924abf96ce723e82aaafd77b` and Candidate `b3d58655716a5efdda30a9b3f72279542418840a`.

This review used separate Candidate and exact-Base worktrees. Candidate adds only a 24-line current-main Builder receipt to `docs/reports/2026-09-16-p3-fb2-07-fixed-source-removal-result.md`; production, tests, authoring, generated content, and protocol code are unchanged. No implementation, A-sync, or migration credit was performed.

The existing identity-free component accepts only `move_source_card` to controller `removed_from_game` with exact effect/destination keys. The typed primitive uses the executing ability's source ID, requires the source to exist and both owner and controller to equal the ability controller, rejects an already removed source or invalid destination, moves it to public `removed_from_game`, marks it inactive, and emits a typed `source_card_moved` result/event. A later typed failure rolls back card state, visibility, active flag, and events. B15's separate `to=skill` path still requires an active face-up board source and returns it owner-only. Focused tests and source inspection confirm these boundaries.

Component matching alone does not add a parent route. Candidate introduces no generic Card Zone, return-by-definition, create, Trigger/Lifecycle/Target/Movement route, F1 authoring, or KPI change. The frozen 12 identities remain component alignment, not 12 complete migrations. The Builder receipt accurately describes this pre-existing state.

Independent checks after `npm ci` and `npm run typecheck` in both worktrees:

| Check | Result |
| --- | --- |
| FB2-07 source removal, B15 terminal source zone, B23 transform focused | 3 files, 22/22 pass |
| Rules regression | 69 files, 487/487 pass |
| Generated-content determinism | pass; canonical content/fixture/evidence hashes unchanged |
| `git diff Base..Candidate --check` | pass |
| Full root CI, sequential Base then Candidate | Both 1640 total, 1518 passed, 8 failed, 114 skipped; eight failed test identities and 12 failed-suite identities exactly equal |

The full CI is **not green**. Its eight unchanged failures are historical Phase-3 B11 observation, E06 recount, and readiness-preflight Git-path/blob evidence tests. No new failure arose from this receipt-only Candidate. Browser Gate C is not required for an unchanged runtime/projection/interaction surface.
