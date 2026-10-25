# P3-R FB2-14 corrected current-main materialization review

Date: 2026-10-26
Role: Independent Reviewer
Verdict: `MIGRATION_ACCEPTED`
Exact Base: `162d166f14b584c151e6820e68506ba2d9c24a83`
Reviewed Candidate: `018f15dfc99659a2c4d0c06b58c48c5ae91597ed`
Branch: `codex/a-p3-fb2-14-current-main-materialized-corrected-20261026`
Historical FB2-14 R2 Candidate: `3879203870bb05ad9619c03c60c69ed9e1941080`

## Independent decision

The corrected candidate materializes the FB2-14 typed persistent RuleOverride runtime and its focused regression test on the exact current-main base. The earlier scope drift is gone. The materialization is accepted as an FB2-14 runtime prerequisite; this verdict does not grant FM08 authoring acceptance, migration credit, or A-sync.

## Exact scope and compatibility audit

- The Exact Base to Candidate diff consists of one A-owned report, the agreed 14 runtime source files, and `packages/rules/tests/regression/fb2-game-start-rule-overrides.test.ts`. No `data/authoring`, coverage/generated artifacts, task index, governance, FM08 authoring, or unrelated test files changed.
- Compared with the historical FB2-14 parent-to-R2 runtime/test delta (`50602c93..38792038`), 13 of the 15 runtime/test blobs are byte-identical, including the full FB2-14 focused test. Only `ability/interpreter.ts` and `ability/loader.ts` need current-main adaptation.
- The current-main FB2-02 deployment family, FB2-11 `game.round_number`, FB2-12 Presence Concealment, and FB2-13 Alter Ego classifier behavior remains in the adapted files. FM05/06/07 and B23 relevant regressions pass.
- The prior unrelated Magic Resistance route/classifier, `cleanupOngoing` `o.cleanup` condition, and FB2-13 Alter Ego `uses` alteration are absent from the corrected delta. The correction commit also removed the stale A report and carries only its corrected replacement.
- The FB2-14 route stays identity-free and fail-closed: exact automatic `game_start` envelope, empty execution operations, and only the eleven whitelisted `install_rule_override` shapes. The game-start event runs before the initial Situation mana grant; typed overrides and mana ledger remain in authoritative serialized state.
- No FM08 production identity/name/text routing or migration credit was introduced.

## Verification

The Reviewer used a fresh worktree at the exact Candidate and installed locked dependencies with `npm.cmd ci --offline --ignore-scripts` (PASS, 0 reported vulnerabilities).

| Check | Independent result |
|---|---|
| `npm.cmd run typecheck` | PASS |
| FB2-14 focused | 1 file, 10/10 PASS |
| FB2-14 plus FB2-02/11/12/13 and FM05/06/07 focused set | 14 files, 88/88 PASS (the A report's dependency selection records 14 files / 87 tests) |
| B23 battle-loss state-transform | 1 file, 9/9 PASS |
| Unmodified `npm.cmd run test:ci` | 120 files, 740/740 PASS |
| `npm.cmd run content:validate` | 7 masters, 7 servants, 20 events, 0 blocking issues |
| `npm.cmd run verify:generated-content` | PASS; content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`, fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`, evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3` |
| `git diff --check` | PASS |

Two first full-CI runs had one 5-second timeout in the same long-running MatchSession test, with all other tests passing. The test passed alone under the default timeout, the full 740 passed with a longer test timeout, and the unmodified full-CI command subsequently passed 740/740. This is execution-time variability, not a functional failure or acceptance exception.

The prior A report noted unfiltered `packages/rules/tests` failures from unavailable external `chm-extract` HTML evidence paths. Those paths are outside this runtime materialization and are not treated as failures of FB2-14. The standard CI set is green.

Historical review commit `62d35551` documents the old R1 candidate `86afe513`; it is not used as evidence for this corrected candidate or R2. This review evaluates `018f15df` directly against the exact current-main base and historical R2 runtime/test delta.
