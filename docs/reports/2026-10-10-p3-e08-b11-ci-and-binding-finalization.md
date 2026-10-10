# B11 One-Pass CI And Binding Finalization

Task: P3-E08-B11-CI-AND-BINDING-FINALIZATION
Epoch: FD-P3-2026-09-23-08
Main anchor: 9a1689d2ec5b56b67d1483d2593b4ab809d6c15c
Base: 11c1985dc4c72151bbf16298292bf4b7fa29fcab
Frozen implementation: f4cdad92f129d26a75aac207ecedc991d40a653c
Artifact: artifacts/phase3-e08-b11-ci-and-binding-finalization.json
Artifact SHA-256: 752C8024687E55CD2EBCC2E460B9C67289FCBE920D15A37A6D9481E9F7A75B26
Status: BLOCKED_CURRENT_EVIDENCE_CONTRACT_AND_FAILED_CI_PAIR

## Implementation
Only package.json test:ci gained --maxWorkers=2. All exclusions, other scripts, dependencies, timeout limits, RPC error handling and assertions are unchanged.

## CI Pair And Setup Failure
Both sequential runs are preserved in full; each reported 119 failed / 74 passed files, 2 failed / 499 passed collected tests. 117 suites failed during collection because npm ci alone did not produce @fd/content dist exports. A omitted the workflow typecheck bootstrap before the pair.
Two evidence assertions independently reject package.json under the old exact authorization. Neither run observed an onTaskUpdate RPC error; this is not proof of RPC stability or a passing CI gate.
Existing typecheck then succeeded and restored package build outputs. Focused checks were executed afterward; no default CI run was retried or selected as a replacement.

## Exact Prior Reviews
- RA: PASS; commit fec28af32f3a14cfc174cfedcfb5ecbefd8344fd; docs/reviews/phase3/P3-E08-B11-final-blocked-packet-reviewer-a.json; SHA-256 77F973E2CF83321DF810CF4C55DCCA2FCE9A90FE27097826F2BA236B4DFB20D7; scope A_OWNED_BLOCKED_PACKET_EVIDENCE_CONSISTENCY_AND_HISTORICAL_FINAL_BINDING_ONLY. Not new candidate acceptance.
- RB: BLOCKED; commit 5a361fffaf9c151ffbc27c995ea773380692e120; docs/reviews/phase3/P3-E08-B11-final-packet-11c1985-reviewer-b.json; SHA-256 6A6B732622E7275FA2D387AAD06C6B93C6C54FCDB83B1CDF61B2F7C0523D5CF8; scope B11 scoped consumer semantics, preserved Reviewer B evidence, compiler/interpreter overlap identity, and fail-visible final acceptance boundaries. Tooling/governance acceptance remains Reviewer A/Planner owned.. Not new candidate acceptance.

## Commands
- npm run test:ci (CI run 1): exit 1; 144344ms; testedSha f4cdad92f129d26a75aac207ecedc991d40a653c; output SHA-256 2bbf304fd54cddc1eb580e9d408804241ba89f7599afe6261259a7c9a2074b96.  Test Files  119 failed | 74 passed (193) /       Tests  2 failed | 499 passed (501)
- npm run test:ci (CI run 2): exit 1; 170569ms; testedSha f4cdad92f129d26a75aac207ecedc991d40a653c; output SHA-256 84482e8917d9e1cd6d09dc01ed1a32eef0f5a7798f42a1489e756734647a1842.  Test Files  119 failed | 74 passed (193) /       Tests  2 failed | 499 passed (501)
- npm run typecheck: exit 0; 9386ms; testedSha f4cdad92f129d26a75aac207ecedc991d40a653c; output SHA-256 f1e62414c2b127363b5b60da74f1b15a3869233772922a3215ff32b73435289f.
- npx tsx scripts/phase3-e08-b11-coverage-sync.ts --validate: exit 0; 13818ms; testedSha f4cdad92f129d26a75aac207ecedc991d40a653c; output SHA-256 05557ce89ce433c6ad48186460fa75beda0c523a2b37519e0c34be3c619cbb76.
- npx tsx scripts/phase3-e08-b11-coverage-sync.ts --final --validate: exit 1; 3056ms; testedSha f4cdad92f129d26a75aac207ecedc991d40a653c; output SHA-256 eeeb5b297ac8e557fd5bb6f1b7fe32bec2ab68a1c963dcaae319a934c3011ef4.
- npx vitest run scripts/tests/phase3-e08-b11-coverage-sync.test.ts scripts/tests/phase3-e06-post-merge-recount.test.ts scripts/tests/phase3-readiness-preflight.test.ts --maxWorkers=2: exit 1; 55757ms; testedSha f4cdad92f129d26a75aac207ecedc991d40a653c; output SHA-256 d1263c0cae2bc33a35dd3a9bafc32b8f3347b2eac32fb92573bd536192d633ea.  Test Files  2 failed | 1 passed (3) /       Tests  2 failed | 13 passed (15)
- npm run phase3:preflight -- --manifest scripts/fixtures/phase3-b11-task-check.json --candidate f4cdad92f129d26a75aac207ecedc991d40a653c --base 9a1689d2ec5b56b67d1483d2593b4ab809d6c15c: exit 1; 9793ms; testedSha f4cdad92f129d26a75aac207ecedc991d40a653c; output SHA-256 7168bd8987a85384757e5bba21acddfff6a7ae7da9b026d4c47f5d43c7227f50.
- npm run phase3:contract-parity -- --contract scripts/fixtures/phase3-b11-parity-contract.json --candidate 7ec91bbc26be0f63332d5cc8421b2c7c014906c5: exit 0; 91454ms; testedSha f4cdad92f129d26a75aac207ecedc991d40a653c; output SHA-256 2cbe9d3dd66bd9ff84ef9c7811e366c0d793f1eb1e0bff77d3d229da54b68831.
- npm run content:validate: exit 0; 2520ms; testedSha f4cdad92f129d26a75aac207ecedc991d40a653c; output SHA-256 f680a89024994e019d795321d26056b37d6c2a4b74d8220113f35f841fc0092f.
- npm run verify:generated-content: exit 0; 1711ms; testedSha f4cdad92f129d26a75aac207ecedc991d40a653c; output SHA-256 7c7d289c5a4c7e5f4d051c10ad133210f2e316bfb4a2c4d35fa534989b615034.
- npx vitest run packages/rules/tests/regression/resolution-dataflow.test.ts packages/rules/tests/regression/production-resolution-bridge.test.ts packages/rules/tests/regression/b11-conversion-classification-api.test.ts packages/rules/tests/regression/b11-conversion-binding-ownership.test.ts --maxWorkers=2: exit 0; 5085ms; testedSha f4cdad92f129d26a75aac207ecedc991d40a653c; output SHA-256 4e166a086a94a5b26137074e3225a6f345f9c02176515c4085bcdea2bfb947ce.  Test Files  4 passed (4) /       Tests  51 passed (51)
- npm run test --workspace @fd/server -- src/match-server.test.ts: exit 0; 5558ms; testedSha f4cdad92f129d26a75aac207ecedc991d40a653c; output SHA-256 e087e9853bcfdb4a0b228eea7544e766fab2c499d009cc0bb4a4a076b6a5f6d9.  Test Files  1 passed (1) /       Tests  11 passed (11)
- npx playwright test e2e/fd-golden-eater-result-binding.spec.ts e2e/fd-conversion-magic-core-primitive.spec.ts --repeat-each=5: exit 0; 39360ms; testedSha f4cdad92f129d26a75aac207ecedc991d40a653c; output SHA-256 a8f746af93dfa23d529ee879f9c2be66ccff68bfe7f47216b3d954e5e3b3990e.   10 passed (37.5s)
- npm run test:source-assets: exit 1; 1520ms; testedSha f4cdad92f129d26a75aac207ecedc991d40a653c; output SHA-256 a016785b418eb78b1c05afc9d27e94db368330be8b94401e77d3c41db99432ba.
- git diff --check 11c1985dc4c72151bbf16298292bf4b7fa29fcab...HEAD: exit 0; 124ms; testedSha f4cdad92f129d26a75aac207ecedc991d40a653c; output SHA-256 01ba4719c80b6fe911b091a7c05124b64eeece964e09c058ef8f9805daca546b.
- node --import tsx --input-type=module --eval import {buildSnapshotAtCheckout} from "./scripts/phase3-e08-b11-coverage-sync.ts";const r=await buildSnapshotAtCheckout(process.cwd(),"f4cdad92f129d26a75aac207ecedc991d40a653c");console.log(JSON.stringify({testedSha:"f4cdad92f129d26a75aac207ecedc991d40a653c",counts:r.sync.candidateLocalRouting.after,sourceFingerprint:r.coverage.sourceFingerprint,compiledDefinitions:r.coverage.compiledDefinitions,coverageSha256:r.sync.candidateCoverage.artifactSha256,scope:"READ_ONLY_RAW_COVERAGE_COMPILER_NOT_FINAL_AUTHORIZATION_VALIDATION"}));: exit 0; 3589ms; testedSha f4cdad92f129d26a75aac207ecedc991d40a653c; output SHA-256 b32ffb9d66422c0af935c7b8e59ec7a90c50048a197ea422bb9f603334fbbb9f.

## Check References
Component/server/browser receipts are bound by actual tested SHA, command, full output and output SHA-256. Acceptance remains pending. Existing fixture is unchanged because its immutable v2 validator does not admit new keys, changed pending states or the new authorization chain.

## Original Authority And Path Scope
Forty paths are listed individually in the packet with introducing SHA/parent, historical and current blob hashes, role and authority lookup references. All seven B final-delta authorizations remain UNPROVEN. The read-only API exposure dispatch is not authority for subsequent ownership semantic repair. Thirty-three role-scope path reviews and two runtime overlap authorizations remain unresolved.

## Remaining Blockers
- CURRENT_EVIDENCE_AUTHORIZATION_CONTRACT_GAP: Planner then A. Old producer binds only 8eb752c1 nine-path authorization. Current six-path authorization does not permit changes to these validators.
- TWO_DEFAULT_CI_RUNS_FAILED: A/Planner. Both initial runs omitted standard workflow typecheck bootstrap. Package exports point to missing dist files; two evidence tests also reject the new package delta. All initial outcomes retained. No passing CI run selected.
- WORKFLOW_EQUIVALENT_FULL_CI_NOT_VERIFIED: A after contract disposition. Existing typecheck was performed after the sequential CI pair; focused/component/server/browser then ran, but default full CI was not retried. No full CI PASS claim.
- ORIGINAL_AUTHORIZATION_UNPROVEN: Planner/G. See exact per-path packet records.
- PATH_SCOPE_REVIEW_PENDING: RA/Planner. See exact per-path packet records.
- OVERLAPPING_RUNTIME_AUTHORIZATION_UNPROVEN: Planner/RB. See exact per-path packet records.
- CURRENT_TASK_CHECK_SCHEMA_BINDING_BLOCKED: Planner then A. Receipts bound in this packet. Existing task-check remains immutable: validator requires exact legacy keys and generated pending values. Do not insert unrecognized keys or relabel pending as PASS.
- NEW_COMBINATION_RA_RB_REVIEW_PENDING: RA/RB. See exact per-path packet records.
- SOURCE_ASSETS_MISSING: Source assets owner. See exact per-path packet records.

## Minimal Required Contract Follow-Up
Planner must explicitly authorize the A-owned coverage-sync producer, preflight validator and corresponding focused automation tests to consume a SHA/hash-bound continuation of 08e2f8cb. The old historical mode, complete path coverage, malformed/tamper negatives, compiler, hash and ancestry assertions must remain. This task did not modify those files.

## Accounting And Limits
Raw candidate counts before/after: 23/144/3/0/111, delta all 0. Formal ledger 111/944, remaining 833. Coverage/migration/denominator credit delta 0; promotedOnMain=false.
93 missing-image source-assets failures remain. No runtime, workflow, authoring, generated definitions, classifier or KPI change. No role-level PR or C01 dispatch.

## Handoff
One frozen implementation plus one evidence-only carrier; exact carrier SHA supplied after commit. RA/RB may independently review the blocked packet in parallel. Integration remains blocked. No tests are relabeled as having run on the evidence carrier.
