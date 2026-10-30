# K03 Static Reward Compiled Envelope Guard

Task: `P3-EFP-K03-B`. Epoch: `FD-P3-2026-09-23-09`.
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE` after final recorded validation; no self-acceptance.
Base: `219d47c8dcc2b8118f2d3f6b37f51ce465e737cb`.
Tested implementation: `e239b3cc0b24dd2521468d42994cb24d5dc34750`.
Branch: `codex/b-p3-efp-k03-static-reward-guard`.
Worktree: `C:/Users/chenshang/.config/superpowers/worktrees/fd/b-p3-efp-k03-static-reward-guard`.
Final candidate is the exact evidence-containing commit reported externally, not a fabricated self-referential SHA.

## Reservation And Startup

Planner authority: `dd3cfd5cd7232a3935ba8df42b7c14359d856002`, `docs/agents/P3-EFP-I01-K03-NEXT-DISPATCH.md` and `docs/agents/manifests/reservations/P3-EFP-K03-B-STATIC-REWARD-GUARD.json`. B acknowledges the prospective `ability-loader/static-reward-predicate` reservation. It grants only the current predicate and its FB2-34 test, not global loader ownership.

Scoped inspection at 2026-10-13 19:04:25 Asia/Shanghai checked 237 accessible worktrees and found no dirty target paths; six worktrees were inaccessible. No concrete competing loader writer was known. No global mutex or cross-chat ACK is claimed. Current remote main matched the exact base at startup and during validation. Reservation awaits explicit Planner release/transfer.

Read-only selection `e86e9b19` and its RA review `f129797b` are static applicability evidence only. K02 startup preflight ran through the exported `preflight` API from reviewed tooling `36de92a0`, not a CLI invocation. Result: CHECKED, 2577.34 ms; selected FD-SHAPE-003 and FD-RESTORE-004. The latter is deferred, not included in this repair. The first external script import failed for Windows ESM URL syntax; the corrected file-URL import completed before source edits. Tooling working-tree observations describe K02's frozen checkout; current-base Git objects are separately bound.

## Dynamic Red Before Runtime Edit

Test-only commit: `4e72e2c9b78a0e8ec7f76bc7be47767faa427e92`. Loader blob remained exactly base `e3ce053f95f6b635b5c2f3fc8ae08d3d360f63e5`.

Four independent runs set one compiled field to `[{ unexpected: true }]`: activation, lifecycle, limit and visibility. Every run exited 1 with two failures: admission returned true, and authoritative battle rewards remained full `vpReward=4/baseVpPerWinner=6`, rather than ordinary `2/3`. Existing event pool 4, competition pool 2 and two tied winners were retained. These are synthetically malformed trusted compiled fixtures, not raw-loader/client/snapshot exploit claims.

First filter executions were incorrectly quoted on Windows and skipped all tests. Those exit-0 runs are retained as INVALID_FILTER_ALL_SKIPPED_NOT_RED, never credited as failure or passing gameplay evidence. The subsequent field-specific regular-expression filters executed and failed as intended, before production modification.

## Minimal Runtime Fix

Only four production lines were added inside `isAcceptedStaticCombatRewardDistributionAbility`: each optional container may be undefined or an object, but null, scalar and array inputs reject before `node` can erase them. Existing semantic validation still requires empty objects. No global node/nodes helper, combat resolver, formula, identity allowlist, authoring or migration change.

The original FB2-34 controls remain: ordinary/full tied reward pools `2/3` versus `4/6`, losing/inactive/face-down provider, sole winner, duplicate modifiers, Remote Operation and canonical loader defaults. Current Stheno controls run unchanged; no fourth consumer or old PR474/475 implementation is imported.

## Final-Test Red And Green

Initial green exposed two mistakes in the new tests: scoring consumes the battle result list, and deleting compiled activation before general trigger scanning is not a predicate-only compatibility test. Only test modeling was corrected: compare scored results against the ordinary control; test absent containers at predicate admission and validate normalized loader output separately. No extra runtime defect was repaired or silently declared accepted.

Final test blob: `7f91ec3762daec7ce7ed414985e75fbbfa4f9691`. Unchanged final tests were run against the exact unfixed loader bytes, temporarily removing only this task's guard; the receipt explicitly labels the baseline-loader overlay, not a clean execution of its checkout HEAD. Outcome: exit 1, eight negatives failed and 13 positive controls passed. The loader was restored byte-identically to the committed repaired blob before green. Outcome: exit 0, 21/21 PASS across FB2-34 and Stheno. The same test blob appears in both receipts.

Focused command: `npx vitest run packages/rules/tests/fb2-34-combat-reward-distribution.test.ts packages/rules/tests/stheno-consumer-migration.test.ts --maxWorkers=2`.
Typecheck and diff-check exit 0. Admission failure disables only the malformed reward modifier; legitimate battle progression and ordinary scoring continue. No transaction-wide rollback claim is made.

## Full CI And Window

Final default-CI result and release are recorded in the machine packet. User confirmed no other heavy-test owner and authorized the sequential window. Disk/processes were checked before starting; no competing test process was detected. The existing non-FD Vite service and one transient governance publication process are not counted as heavy-test contention. No process was killed. CI timeout/concurrency settings and the default command were unchanged.

Actual window inspection/start: 2026-10-13 19:10:27 Asia/Shanghai; final heavy command ended at 19:15:53; explicit release recorded at 19:16:39. Startup free space: C=163625500672 bytes, D=39172235264 bytes. No competing test owner was observed. The source reservation is not automatically released by test-window completion.

Default `npm run test:ci`: exit 1; 193/194 files and 1615/1616 tests passed. One failed test in `scripts/tests/phase3-e09-b11-final-binding.test.ts` rejects `Candidate source drift: packages/rules/src` against the old B11 snapshot. The B11 automation/test/classifier files were not changed; no old evidence rewritten or waiver granted. This failure blocks a full-CI/readiness claim, not the directly observed red/green truth table. A/Planner must disposition new-source evidence separately if needed. No rerun hides this result.

## Packet And Review Boundary

`artifacts/phase3-efp-k03-static-reward-guard.json` embeds exact authority/source/test objects, preflight input/result, four contract vectors, full raw stdout/stderr streams in base64, commands/exits/times/hash receipts and the source diff. It retains invalid filter executions and failed initial test modeling, rather than hiding them. Raw local originals are under `D:/fd-validation/efp-k03-b-receipts`.

Recorded timings are actual preflight/red/commit/test timestamps. Original task start and first independent review are not reconstructed; first review remains pending. No speedup, throughput comparison or complete prevention-system claim is made. First invocation setup performed npm ci (12 existing vulnerabilities reported) and typecheck; no dependency edit.

RB must independently verify the exact candidate, unchanged-test baseline failure, repaired pass and valid progression. No role PR, accepted-contract count, main credit or promotion is granted. FD-RESTORE-004, browser Gate C, authoring migration, unrelated mechanics and long-term stability remain outside scope. Ledger 111/944, credit delta 0 and 93 missing images are retained.
