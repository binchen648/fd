# P3-FB2-09 current-main independent review

Verdict: **MIGRATION_ACCEPTED** for exact Base `147bc8282be573d40441df8f9aee0d5f39ba446a` and Candidate `190208a03e7663c0f0d0d16563d9cf8bfd792bb1`.

Review used separate Candidate and exact-Base worktrees. The Candidate narrows the identity-free any-enabled-location-except-workshop movement classifier with exact-key checks for activation, target, count, constraints, and effect; retains legitimate `target.scope.board = current`; adds malformed-shape regressions and corrects an unrelated Leonidas synthetic movement fixture to omit an invalid empty target `conditions` field. No A-sync or migration credit was performed.

The accepted route remains active-source `phase_action` in the controller action window, one location target of cardinality `1..1`, exactly one `any_enabled_location` and one `not_location_kind: workshop` constraint, and one controller `move_player` effect to that target. It excludes costs, conditions, forced or third-party movement, arbitrary/arrow movement, and broad Target Selection. The typed movement route revalidates enabled, locked, occupied, and current locations at settlement, then atomically updates authoritative movement state, log, event, and result evidence. Ereshkigal's current-board target remains compatible.

The prior fail-open near-match with extra `activation.eventPlayer = opponent` and `constraint.subject = all_players` now remains loader-accepted but is rejected by the semantic classifier; no activation is offered, and direct execution throws before state mutation. Extra target-count and effect keys are likewise semantic-invalid. Generic, forced, third-party, and arrow movement remain outside this accepted family. The previous Candidate's sole new full-CI failure was a Leonidas test fixture's invalid empty target `conditions`; the final Candidate removes only that synthetic field, without relaxing production validation.

Independent validation after `npm ci` in both worktrees:

| Check | Result |
| --- | --- |
| Focused movement, dataflow, complex-skills, authoring, Leonidas | 5 files, 72/72 pass |
| Rules regression | 69 files, 487/487 pass |
| Typecheck | pass |
| Generated-content determinism | pass; content `cb3470ae23dd20c8887ac4599ae3f4cd457956f89008990444d2fdde51181d64`, fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`, evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3` |
| `git diff Base..Candidate --check` | pass |
| Full root CI, sequential exact Base then final Candidate | Both 1640 total, 1518 passed, 8 failed, 114 skipped; failed-test and failed-suite identities equal |

Full CI is **not green**. The eight common failures are historical Phase-3 B11 observation, E06 recount, and readiness-preflight Git-path/blob evidence tests. No Candidate-only failure remains. Browser Gate C is not required for this scoped movement interpreter change, which does not change the interaction or projection surface.
