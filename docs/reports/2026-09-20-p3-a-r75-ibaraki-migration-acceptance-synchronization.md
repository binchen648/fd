# P3-A R75 Ibaraki Migration Acceptance Synchronization

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-20

## Accepted migration input

- Formal verdict: `MIGRATION_ACCEPTED`
- Canonical reviewer evidence: `https://github.com/binchen648/fd/pull/381#issuecomment-5747179411`
- Exact A dispatch Base: `8b10ceb5987d40753ef127fed3f09f829a4a8fa0`
- Accepted S Candidate: `78ab99ce3136f654e53ec922466c26d4751b1917`
- PR: `#381`
- Frozen identity: `servant.ibaraki.skill.sc-ibaraki-1`
- F1 evidence commit: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## A synchronization checks

A mechanically rechecked:

- this synchronization worktree starts at exact accepted Candidate `78ab99ce3136f654e53ec922466c26d4751b1917`, matching the established acceptance-sync convention; no Candidate merge or PR retarget is performed;
- PR #381 remains OPEN, non-draft, MERGEABLE / CLEAN with exact Base `8b10ceb5987d40753ef127fed3f09f829a4a8fa0` and exact Head `78ab99ce3136f654e53ec922466c26d4751b1917`;
- canonical fresh independent R evidence `5747179411` binds that exact Base/Candidate pair and returns `MIGRATION_ACCEPTED` with no blocking finding;
- Base-to-Candidate contains exactly `data/authoring/servants/servant.ibaraki.json`, `packages/rules/tests/ibaraki-consumer-migration.test.ts`, and the S result report;
- fresh independent frozen-roster accounting is exactly Base `133/944` to Candidate `134/944`, with one frozen addition `servant.ibaraki.skill.sc-ibaraki-1`, zero removals, and zero duplicates;
- fresh reviewer validation passed typecheck; focused Ibaraki 1 file / 5 tests; rules src/core/regression/focused 83 files / 499 tests; official CI 151 files / 1057 tests; content validation; generated-content determinism; exact Locked Reference verification; client production build; and `git diff --check`;
- the accepted archive preserves the exact `source_owned` passive shape with one `combat_power:add(+6)` modifier over `players_at_source_battlefield` filtered by `round_active_attack_paid_cost_sum_is_highest`, permanent lifecycle, `card_text / specific` priority, `higher_priority_wins`, and automatic execution;
- the accepted real-definition behavior distinguishes no qualifying attack from a genuine paid-zero active attack, excludes support/non-attack cards, awards tied highest participants, fails closed on source/controller battlefield mismatches, and leaves individual card power unchanged;
- no production runtime source, second consumer identity, pack/generated registration, merge, or retarget is introduced by this migration.

## Current formal-accounting reconciliation

PR #381 is a historical pending Candidate whose own branch/result report predates several later accepted migrations. Its historical `137/944` project-formal statement is therefore not reused as the current baseline.

The latest already-synchronized project baseline before this backlog credit is mechanically recovered from A synchronization commit `e523e10dd795c032a6b0e70627b7276213784604`, report `docs/reports/2026-09-20-p3-a-r81-darius-migration-acceptance-synchronization.md`: formal **`141/944`**, remaining **`803`**. That Darius synchronization explicitly left PR #381 / Ibaraki pending with no credit.

This Ibaraki synchronization grants exactly that previously-uncredited identity once. It does not replay or duplicate any historical accounting step.

## Formal accounting after synchronization

Project formal migration accepted advances exactly one identity from **`141/944`** to **`142/944`**.

Project formal remaining becomes **`802`**.

No other identity is credited. Historical `P3-FM09-RECOVERY` remains `MIGRATION_BLOCKED` absent new formal evidence.

PR #381 remains OPEN, unmerged, and unretargeted.

## Next coordinator action

Continue the frozen migration-credit-first pipeline from formal `142/944`. Do not open unrelated FB2/runtime work while any migration-ready Candidate or `S_READY_NOW` exists. Mechanically select the next available migration credit opportunity; accepted migrations receive immediate A synchronization. Histogram-first, batch-first, large-group-first, and pre-runtime scheduling remain `SUPERSEDED`.
