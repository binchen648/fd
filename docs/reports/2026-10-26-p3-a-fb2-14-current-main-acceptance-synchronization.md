# P3-A FB2-14 current-main runtime acceptance synchronization

Role: Codex A accounting
Status: `SYNCHRONIZED`
Task: `P3-FB2-14` typed persistent RuleOverride runtime dependency
Classification: accepted dependency materialization; zero migration credit

## Exact evidence

- Exact current-main Base: `162d166f14b584c151e6820e68506ba2d9c24a83`.
- Accepted Candidate: `018f15dfc99659a2c4d0c06b58c48c5ae91597ed`.
- Candidate branch: `codex/a-p3-fb2-14-current-main-materialized-corrected-20261026`.
- Independent Reviewer report: `91d20221e2cbd3c365d297f27f3f836439704b90`; verdict `MIGRATION_ACCEPTED`.
- Reviewer branch: `codex/r-p3-fb2-14-current-main-materialization-review-corrected-20261026`.

This A-sync binds only the accepted FB2-14 runtime/test materialization to the current-main lineage. It does not modify the frozen Candidate runtime/test, merge a PR, add FM08 authoring, or grant migration credit.

## Exact synchronized scope

The accepted delta is exactly the 14 FB2-14 runtime source files plus `packages/rules/tests/regression/fb2-game-start-rule-overrides.test.ts`. Current FM07/06/05, FB2-13, FB2-02/11/12, and B23 dependencies remain retained. FM08 authoring, coverage/generated artifacts, task-index, governance, unrelated runtime, and identity/name/text routing remain excluded.

## Verification receipt

- FB2-14 focused: 10/10 PASS.
- Current dependency combined focused: A report 14 files / 87 tests PASS; Reviewer independently reports 14 files / 88 tests PASS. This is a test-selection/counting difference only; both runs are green and the discrepancy is recorded explicitly.
- B23 compatibility is included in the Reviewer dependency run.
- Full CI: 120 files / 740 tests PASS.
- Typecheck: PASS.
- Content validation: PASS; 7 masters, 7 servants, 20 events, 0 blocking issues.
- Generated-content determinism: PASS with unchanged content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`, fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`, and evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3` hashes.
- `git diff --check`: PASS.

## Accounting ledger

- Before: `133 / 944 FULL`; remaining `811`.
- FB2-14 runtime dependency materialization credit: `+0`.
- After this A-sync: `133 / 944 FULL`; remaining `811`.
- New owner/skill credit this round: `0`.

Formal accounting remains `133/944`. FM08 authoring and any future migration credit require separate Candidate/Reviewer gates and are not part of this synchronization.
