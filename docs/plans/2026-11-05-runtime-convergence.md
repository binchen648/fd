# FD Runtime Convergence Implementation Plan

**Goal:** Repair RC-01 through RC-05 on current main without altering frozen prior work or merging historical PRs.
**Architecture:** Existing typed interpreter, Session and core consumers; shared pure legality and mandatory-step preflight; no second engine. B field prerequisites from b39a3c06 are selective dependency migration, not accepted coverage.
**Tech Stack:** TypeScript, Vitest, MatchSession, WebSocket server, Playwright.

1. Commit six contracts and user release/precise Root reservation before production edits (this commit).
2. Install exact lockfile dependencies. Preserve/hash original B files. Review prerequisite diff from b39a3c06 and import only required runtime, authoring and compiler support; record all file origins. Run typecheck and source/compiler checks.
3. RC-01/03: add failing real Session tests under packages/rules/tests/acceptance/runtime-convergence; port strict movement and single aggregate +2 semantics from PR690 by adapting typed effects, not replacing files. Run focused tests and commit batch report.
4. RC-02: fail on actual Square Accel pending continuation; introduce pure mandatory sequence feasibility shared by activation and projection. Test consumed targets/resources, decline boundaries and restore; commit batch report.
5. RC-04: select frozen terrain infrastructure by hash, adapt actual-value fees and temporal exemption. Tests [3,1], holes, zero VP/full terrain, source exemption, next-round lifecycle and save/restore; separate batch commit.
6. RC-05: share authoritative legality between projection/dispatch; negative changed-state/duplicate/source/controller checks; client shows server denial. Commit separate batch report.
7. Run interaction/Session suites; real seven-player server and browser scenarios covering all five contracts (Shinji replacement excluded). Preserve original reds and raw final logs outside repository at D:/fd-validation/runtime-convergence-evidence-20261105.
8. Freeze final implementation SHA. Complete full npm run test:ci naturally, client/server/build/generated checks. Independent read-only Reviewer checks implementation and evidence; fix any discovered defects with new SHA and relevant revalidation.
9. Write FD-RUNTIME-CONVERGENCE-FINAL-REPORT.md with migration ledger, files/functions, measured test outcomes, limitations, exact candidate and Reviewer decision. Mark ACCEPTED only if all scoped gates pass. Stop without merge.

Each batch uses red -> minimal implementation -> green; no changed timeout, disabled test or relaxed expected result. Reports distinguish implementation candidate from independent acceptance. No permission inferred over another worktree. A failing test outside this contract remains an explicit unresolved issue, never a skipped PASS.

## 下一轮测试调度（2026-11-05 用户更新）

下一轮采用 [FD 三级技能测试与验收规范](fd-tiered-skill-acceptance.md)：Level 1 为日常技能定向验证，Level 2 按依赖/多步骤交互执行，Level 3 在关键节点复用 A-MATCH-03 的七人 11 回合基线，不逐技能重复整局。使用逐技能验收矩阵，必须断言实际规则效果和投影。此项为后续调度更新，不追溯更改上方历史执行计划、既有失败或正式集成门禁。
