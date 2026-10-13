# B11 Integration Closure Test Stability

Task: P3-E09-B11-INTEGRATION-CLOSURE-TEST-STABILITY. Epoch: FD-P3-2026-09-23-09.
Status: TOOLING_CANDIDATE_READY_FOR_INDEPENDENT_REVIEW_OVERALL_BLOCKED. Independent Reviewer A acceptance remains pending.

Implementation SHA: 078b79c714e0d3814dd03942ba77abd7d5c7599a. Carrier: external containing commit, never a self hash.
Artifact: artifacts/phase3-e09-b11-integration-evidence-binding.json. SHA-256: 03F7F5EAD4127117193CA9A5AEC0D99F0E0FAA6071B696511BCBF47AAA7A71F1.

## Exact Authorization And Scope

Original authorization: bd0dabe80c40cdc3bae024303b68851d11f980b2. Supplemental authorization: 4ecae8e9097d28d401df5a2cf0eec96be28ebe08. Failed carrier: cfa6a92551a939709b85a787d9044e19ec00f0ef. Only the seven exact authorized paths are writable. Preflight admits the three exact test paths only through reconstructed commit/path/hash/task/lineage binding, not a directory or arbitrary Planner commit. Missing/forged authorization and unknown actual paths remain rejected. Historical mode remains intact. Runtime, authoring, workflow, package scripts, KPI and migration credit are unchanged.

## Frozen Execution

All raw stdout/stderr, byte counts, hashes, exit codes, source SHA and before/after status are committed in the packet. Both focused executions target the same clean implementation. No claim that CI executed on the later evidence-only carrier. All prior failures and receipts remain in the immutable failed packet embedded with its exact source hash. npm ci reports 12 vulnerability advisories; no dependency repair is authorized.

| Receipt | Command | Exit | Source phase | Result |
| --- | --- | --- | --- | --- |
| stability-v1-default-ci | npm run test:ci | 1 | HISTORICAL_SUPERSEDED_IMPLEMENTATION_EXECUTION | Test Files  1 failed / 193 passed (194); Tests  1588 passed / 12 skipped (1600) |
| stability-v1-diff-check | git diff --check cfa6a925..HEAD | 0 | HISTORICAL_SUPERSEDED_IMPLEMENTATION_EXECUTION | See full raw streams |
| stability-v1-focused-1 | npx vitest run scripts/tests/phase3-e09-b11-final-binding.test.ts scripts/tests/phase3-readiness-preflight.test.ts --maxWorkers=2 | 0 | HISTORICAL_SUPERSEDED_IMPLEMENTATION_EXECUTION | Test Files  2 passed (2); Tests  76 passed (76) |
| stability-v1-focused-2 | npx vitest run scripts/tests/phase3-e09-b11-final-binding.test.ts scripts/tests/phase3-readiness-preflight.test.ts --maxWorkers=2 | 0 | HISTORICAL_SUPERSEDED_IMPLEMENTATION_EXECUTION | Test Files  2 passed (2); Tests  76 passed (76) |
| stability-v1-implementation-preflight | node --import tsx D:/fd-validation/check-e09-stability.mjs | 0 | HISTORICAL_SUPERSEDED_IMPLEMENTATION_EXECUTION | See full raw streams |
| stability-v1-npm-ci | npm ci | 0 | HISTORICAL_SUPERSEDED_IMPLEMENTATION_EXECUTION | See full raw streams |
| stability-v1-typecheck | npm run typecheck | 0 | HISTORICAL_SUPERSEDED_IMPLEMENTATION_EXECUTION | See full raw streams |
| stability-v2-default-ci | npm run test:ci | 0 | FROZEN_IMPLEMENTATION_EXECUTION | Test Files  194 passed (194); Tests  1600 passed (1600) |
| stability-v2-diff-check | git diff --check cfa6a925..HEAD | 0 | FROZEN_IMPLEMENTATION_EXECUTION | See full raw streams |
| stability-v2-focused-1 | npx vitest run scripts/tests/phase3-e09-b11-final-binding.test.ts scripts/tests/phase3-readiness-preflight.test.ts --maxWorkers=2 | 0 | FROZEN_IMPLEMENTATION_EXECUTION | Test Files  2 passed (2); Tests  76 passed (76) |
| stability-v2-focused-2 | npx vitest run scripts/tests/phase3-e09-b11-final-binding.test.ts scripts/tests/phase3-readiness-preflight.test.ts --maxWorkers=2 | 0 | FROZEN_IMPLEMENTATION_EXECUTION | Test Files  2 passed (2); Tests  76 passed (76) |
| stability-v2-implementation-preflight | node --import tsx D:/fd-validation/check-e09-stability.mjs | 0 | FROZEN_IMPLEMENTATION_EXECUTION | See full raw streams |
| stability-v2-npm-ci | npm ci | 0 | FROZEN_IMPLEMENTATION_EXECUTION | See full raw streams |
| stability-v2-parity-focused | npx vitest run scripts/tests/phase3-contract-parity.test.ts --maxWorkers=2 | 0 | FROZEN_IMPLEMENTATION_EXECUTION | Test Files  1 passed (1); Tests  12 passed (12) |
| stability-v2-typecheck | npm run typecheck | 0 | FROZEN_IMPLEMENTATION_EXECUTION | See full raw streams |

## Local Budgets And Measurements

| File | Named test/hook | Old ms | New ms |
| --- | --- | --- | --- |
| scripts/tests/phase3-e09-b11-final-binding.test.ts | shared historical objects and transport binding | 10000 | 30000 |
| scripts/tests/phase3-e09-b11-final-binding.test.ts | frozen producer and contract binding | 10000 | 30000 |
| scripts/tests/phase3-e09-b11-final-binding.test.ts | independent exact review fixture | 10000 | 30000 |
| scripts/tests/phase3-e09-b11-final-binding.test.ts | three exact governance outputs | 10000 | 30000 |
| scripts/tests/phase3-e09-b11-final-binding.test.ts | synchronization and actual final HEAD | 10000 | 30000 |
| scripts/tests/phase3-e09-b11-final-binding.test.ts | complete new candidate RA G final proof | 10000 | 60000 |
| scripts/tests/phase3-e09-b11-final-binding.test.ts | complete real rejected historical proof | 10000 | 60000 |
| scripts/tests/phase3-e09-b11-final-binding.test.ts | rejects %s in the assembled closure | 5000 | 30000 |
| scripts/tests/phase3-e09-b11-final-binding.test.ts | rejects actual final review blob tampering even if the original source hash remains valid | 5000 | 30000 |
| scripts/tests/phase3-e09-b11-final-binding.test.ts | rejects committed final %s changes rather than accepting a reviewed ancestor | 5000 | 30000 |
| scripts/tests/phase3-e09-b11-final-binding.test.ts | restore exact transport fixture | 10000 | 30000 |
| scripts/tests/phase3-e09-b11-final-binding.test.ts | recomputes current coverage separately without rewriting the historical artifact or classifier | 5000 | 30000 |
| scripts/tests/phase3-e09-b11-final-binding.test.ts | immutable integration contract and checkout | 10000 | 30000 |
| scripts/tests/phase3-e09-b11-final-binding.test.ts | complete preserved main and technical preflight | 10000 | 60000 |
| scripts/tests/phase3-e09-b11-final-binding.test.ts | rejects a rewritten accepted Reviewer A artifact instead of inheriting its old PASS | 5000 | 30000 |
| scripts/tests/phase3-readiness-preflight.test.ts | beforeAll-1 | NEW_INDEPENDENT_CASE_OR_HOOK | 30000 |
| scripts/tests/phase3-readiness-preflight.test.ts | admits the exact authorized parity delta without granting acceptance | NEW_INDEPENDENT_CASE_OR_HOOK | 60000 |
| scripts/tests/phase3-readiness-preflight.test.ts | rejects the parity delta when exact continuation authority is absent | NEW_INDEPENDENT_CASE_OR_HOOK | 30000 |
| scripts/tests/phase3-readiness-preflight.test.ts | rejects forged or mismatched %s authorization | NEW_INDEPENDENT_CASE_OR_HOOK | 15000 |
| scripts/tests/phase3-readiness-preflight.test.ts | rejects an actual extra test file instead of admitting a tests directory | NEW_INDEPENDENT_CASE_OR_HOOK | 30000 |
| scripts/tests/phase3-readiness-preflight.test.ts | rejects output tampering even after a caller recomputes the receipt hash | 5000 | 30000 |
| scripts/tests/phase3-readiness-preflight.test.ts | fails closed for invalid current %s inputs | 5000 | 15000 |
| scripts/tests/phase3-readiness-preflight.test.ts | rejects %s independently | 30000 | 15000 |
| scripts/tests/phase3-contract-parity.test.ts | beforeAll-2 | NEW_INDEPENDENT_CASE_OR_HOOK | 30000 |
| scripts/tests/phase3-contract-parity.test.ts | rejects local drift in %s before executing candidate APIs | 15000 | 30000 |
| scripts/tests/phase3-contract-parity.test.ts | rejects an incomplete adapter closure independently | NEW_INDEPENDENT_CASE_OR_HOOK | 5000 |

Actual hook durations and individual slow-case durations are recorded verbatim under execution.timingObservations, with receipt IDs and full raw streams for independent replay. Fast cases without per-case console duration remain below the Vitest reporting threshold, not falsely measured as zero. New authorization tests have local 15s/30s/60s budgets and preserve all positive and negative assertions. No global timeout, retry, skip, workflow or concurrency change. Shared fixture bytes are independently hashed before reuse; validation still reads live dirty state and exact Git objects.

## Historical And External Boundaries

The previous focused 43/3/20 review failure, original default/isolated parity failure and all earlier authorization, CI RPC and history issues are preserved; they are not replaced by fresh success. Technical preflight retains BLOCKED for new RA, fresh G/policy and source assets. Historical RA/G do not accept the new source. Final carrier preflight is captured externally after commit to avoid a self-referential receipt; actual post-RA/post-G assembly must still run evidence plus ancestry/policy checks. No new runtime/browser tests or GitHub checks are claimed.

Credit delta=0; accounting=111/944; 93 MISSING_IMAGE and Global Gate C NOT_VERIFIED remain. Overall promotion/readiness PASS is not granted. No PR or C01 dispatch. Next: Reviewer A reviews the one frozen carrier; only after independent PASS can G rebind and I verify the real final assembly.

## Preserved First Repair Failure

Implementation 0018479cc53e54ce519927c51b6e524584f7bed4 passed both focused runs (76/76 each), but its default CI failed (193/194 files, 1588 passed / 12 skipped): the newly introduced fixture byte-hash assertion saw Git CRLF conversion instead of bound LF blob bytes. The assertion was not removed or normalized; only the isolated fixture checkout uses core.autocrlf=false so its actual bytes match the exact Git blob. All initial receipts remain historical. Fresh current results belong only to the new frozen implementation, never to the failed one.
