# B11 Final Combination Evidence

Task: P3-E08-B11-FINAL-EVIDENCE-RECONCILIATION
Epoch: FD-P3-2026-09-23-08
Observed main: 9a1689d2ec5b56b67d1483d2593b4ab809d6c15c
Frozen combination: e605f7c7680d6caf9301173e6e368c72f14c0db4
Final source: ae95d19fd3c13bfe5962373c51560a76c90bae04
Artifact: artifacts/phase3-e08-b11-final-combination-evidence.json
SHA-256: BC7B19BB88E59B9DB3E6A9F5E1A66246799E3742E211306BAE9926B6545BF80D

One consolidated packet; no readiness, runtime, Gate or promotion PASS granted by A.
Forty prior uncovered paths and two overlapping changes have exact provenance. Registration is not authorization/acceptance; unresolved original scopes remain fail-visible.
Historical artifacts unchanged; original deterministic failures and timeout/RPC history retained in packet. Source objects and compiler outputs remain fully checked.

## Fresh commands
- npx tsx scripts/phase3-e08-b11-coverage-sync.ts --validate: exit 0; tested SHA e605f7c7680d6caf9301173e6e368c72f14c0db4; output SHA256 05557CE89CE433C6AD48186460FA75BEDA0C523A2B37519E0C34BE3C619CBB76
- npx tsx scripts/phase3-e08-b11-coverage-sync.ts --final --validate: exit 0; tested SHA e605f7c7680d6caf9301173e6e368c72f14c0db4; output SHA256 CA683BD7B84EEC6AC3A0D09022F8700A1D1ECD2896E13372D773CC8B47D282E3
- npx vitest run scripts/tests/phase3-e08-b11-coverage-sync.test.ts scripts/tests/phase3-e06-post-merge-recount.test.ts scripts/tests/phase3-readiness-preflight.test.ts: exit 1; tested SHA e605f7c7680d6caf9301173e6e368c72f14c0db4; output SHA256 1FFC14CF4208D93B18348DD1A23F2B24341719C9BC502D39A8D6D863789F5F9A
- npm run phase3:preflight -- --manifest scripts/fixtures/phase3-b11-task-check.json --candidate ae95d19fd3c13bfe5962373c51560a76c90bae04 --base 9a1689d2ec5b56b67d1483d2593b4ab809d6c15c: exit 1; tested SHA e605f7c7680d6caf9301173e6e368c72f14c0db4; output SHA256 871305FF1312F290819FD4075D83238D8CE2A5BF8E1C4A172E045A6A0B82EF8E
- npm run phase3:contract-parity -- --contract scripts/fixtures/phase3-b11-parity-contract.json --candidate 7ec91bbc26be0f63332d5cc8421b2c7c014906c5: exit 0; tested SHA e605f7c7680d6caf9301173e6e368c72f14c0db4; output SHA256 2CBE9D3DD66BD9FF84EF9C7811E366C0D793F1EB1E0BFF77D3D229DA54B68831
- npm run test:ci: exit 1; tested SHA e605f7c7680d6caf9301173e6e368c72f14c0db4; output SHA256 68140BDB8D0044BC54875E40810036197933FC3DCDDF3F5ACC07C406804AD27F
- npm run typecheck: exit 0; tested SHA e605f7c7680d6caf9301173e6e368c72f14c0db4; output SHA256 F1E62414C2B127363B5B60DA74F1B15A3869233772922A3215FF32B73435289F
- npm run content:validate: exit 0; tested SHA e605f7c7680d6caf9301173e6e368c72f14c0db4; output SHA256 F680A89024994E019D795321D26056B37D6C2A4B74D8220113F35F841FC0092F
- npm run verify:generated-content: exit 0; tested SHA e605f7c7680d6caf9301173e6e368c72f14c0db4; output SHA256 7C7D289C5A4C7E5F4D051C10AD133210F2E316BFB4A2C4D35FA534989B615034
- npx vitest run packages/rules/tests/regression/resolution-dataflow.test.ts packages/rules/tests/regression/production-resolution-bridge.test.ts packages/rules/tests/regression/b11-conversion-classification-api.test.ts packages/rules/tests/regression/b11-conversion-binding-ownership.test.ts: exit 0; tested SHA e605f7c7680d6caf9301173e6e368c72f14c0db4; output SHA256 C1159EEC51589C597156A22F90C65228D45AE114808F28F038522F39B677A36A
- npm run test --workspace @fd/server -- src/match-server.test.ts: exit 0; tested SHA e605f7c7680d6caf9301173e6e368c72f14c0db4; output SHA256 6D7FEE17F44BDF1AA4675299A971EEF2AA5495FACBDBE178DF8053CD569400A3
- npx playwright test e2e/fd-golden-eater-result-binding.spec.ts e2e/fd-conversion-magic-core-primitive.spec.ts --repeat-each=5: exit 0; tested SHA e605f7c7680d6caf9301173e6e368c72f14c0db4; output SHA256 90845D5CAB97556BF8C66C107B9D737896738B7CECB5473586F1BCD0AF0909DB
- npm run test:source-assets: exit 1; tested SHA e605f7c7680d6caf9301173e6e368c72f14c0db4; output SHA256 3D63D85DE144005DAEDDD844F1C660B2E32B106FFFD08EC779F9E77EE84DA3E2
- git diff --check 9a1689d2ec5b56b67d1483d2593b4ab809d6c15c...HEAD: exit 0; tested SHA e605f7c7680d6caf9301173e6e368c72f14c0db4; output SHA256 01BA4719C80B6FE911B091A7C05124B64EEECE964E09C058EF8F9805DACA546B

## Remaining blockers
- PATH_SCOPE_REVIEW_PENDING: artifacts/phase3-e08-b11-inventory-coverage-parity.json
- PATH_SCOPE_REVIEW_PENDING: artifacts/phase3-e08-b11-observation-gap-plan.json
- PATH_SCOPE_REVIEW_PENDING: artifacts/phase3-e08-b11-tooling-coverage.json
- PATH_SCOPE_REVIEW_PENDING: artifacts/phase3-e08-b11-tooling-handoff.json
- PATH_SCOPE_REVIEW_PENDING: artifacts/phase3-e08-b11-tooling-parity-review-fix.json
- PATH_SCOPE_REVIEW_PENDING: artifacts/phase3-e08-b11-tooling-parity.json
- PATH_SCOPE_REVIEW_PENDING: artifacts/phase3-e08-b11-tooling-preflight.json
- PATH_SCOPE_REVIEW_PENDING: artifacts/phase3-e08-b11-tooling-review-fix-handoff.json
- ORIGINAL_AUTHORIZATION_UNPROVEN: docs/agents/manifests/tasks/B11_CONVERSION_BINDING_OWNERSHIP_REPAIR.json
- ORIGINAL_AUTHORIZATION_UNPROVEN: docs/agents/manifests/tasks/B11_CONVERSION_STRUCTURAL_CLASSIFICATION_API.json
- ORIGINAL_AUTHORIZATION_UNPROVEN: docs/agents/manifests/vectors/B11_CONVERSION_BINDING_OWNERSHIP_REPAIR.json
- ORIGINAL_AUTHORIZATION_UNPROVEN: docs/agents/manifests/vectors/B11_CONVERSION_STRUCTURAL_CLASSIFICATION_API.json
- PATH_SCOPE_REVIEW_PENDING: docs/reports/2026-10-09-p3-e08-b11-inventory-coverage-observations.md
- PATH_SCOPE_REVIEW_PENDING: docs/reports/2026-10-09-p3-e08-b11-observation-gap-plan.md
- PATH_SCOPE_REVIEW_PENDING: docs/reports/2026-10-09-p3-e08-b11-observation-review-fix.md
- PATH_SCOPE_REVIEW_PENDING: docs/reports/2026-10-09-p3-e08-b11-tooling-diagnostics.md
- PATH_SCOPE_REVIEW_PENDING: docs/reports/2026-10-09-p3-e08-b11-tooling-review-fix.md
- PATH_SCOPE_REVIEW_PENDING: docs/reports/2026-10-10-p3-e08-b11-premise-review-sync.md
- PATH_SCOPE_REVIEW_PENDING: docs/reviews/phase3/P3-E08-B11-fixture-premise-be7dd6b-review.json
- PATH_SCOPE_REVIEW_PENDING: docs/reviews/phase3/P3-E08-B11-observation-repair-reviewer-a.json
- PATH_SCOPE_REVIEW_PENDING: package.json
- ORIGINAL_AUTHORIZATION_UNPROVEN: packages/rules/src/ability/card-zone-result-binding.ts
- ORIGINAL_AUTHORIZATION_UNPROVEN: packages/rules/tests/regression/b11-conversion-binding-ownership.test.ts
- ORIGINAL_AUTHORIZATION_UNPROVEN: packages/rules/tests/regression/b11-conversion-classification-api.test.ts
- PATH_SCOPE_REVIEW_PENDING: scripts/fixtures/phase3-b11-parity-contract.json
- PATH_SCOPE_REVIEW_PENDING: scripts/fixtures/phase3-b11-parity-fixtures.json
- PATH_SCOPE_REVIEW_PENDING: scripts/fixtures/phase3-b11-task-check.json
- PATH_SCOPE_REVIEW_PENDING: scripts/fixtures/phase3-b11-tooling-schema.md
- PATH_SCOPE_REVIEW_PENDING: scripts/phase3-b11-diagnostic-api.ts
- PATH_SCOPE_REVIEW_PENDING: scripts/phase3-b11-observation-gaps.ts
- PATH_SCOPE_REVIEW_PENDING: scripts/phase3-b11-tooling-inputs.ts
- PATH_SCOPE_REVIEW_PENDING: scripts/phase3-contract-parity-worker.ts
- PATH_SCOPE_REVIEW_PENDING: scripts/phase3-contract-parity.ts
- PATH_SCOPE_REVIEW_PENDING: scripts/phase3-preflight.ts
- PATH_SCOPE_REVIEW_PENDING: scripts/phase3-tooling-common.ts
- PATH_SCOPE_REVIEW_PENDING: scripts/tests/phase3-b11-diagnostic-api.test.ts
- PATH_SCOPE_REVIEW_PENDING: scripts/tests/phase3-b11-observation-gaps.test.ts
- PATH_SCOPE_REVIEW_PENDING: scripts/tests/phase3-b11-premise-review-sync.test.ts
- PATH_SCOPE_REVIEW_PENDING: scripts/tests/phase3-contract-parity.test.ts
- PATH_SCOPE_REVIEW_PENDING: scripts/tests/phase3-readiness-preflight.test.ts
- OVERLAPPING_SOURCE_REVIEW_PENDING: packages/rules/src/ability/executable-card-pack.ts
- OVERLAPPING_SOURCE_REVIEW_PENDING: packages/rules/src/ability/interpreter.ts
- FRESH_EXECUTION_BINDING_PENDING: b11-component-scenario
- FRESH_EXECUTION_BINDING_PENDING: socket-boundary
- FRESH_EXECUTION_BINDING_PENDING: browser
- FINAL_RA_RB_REVIEW_PENDING: ae95d19fd3c13bfe5962373c51560a76c90bae04

Raw diagnostic counts: 23/144/3/0/111. Formal ledger remains 111/944; all three credit deltas 0.
Source-assets output is separate from ordinary content validation; no Release waiver. Global Gate C NOT_VERIFIED.
Legacy consumers outside the scoped pair retained. A changed no runtime, socket, authoring, generated content, taxonomy, KPI, workflow or timeout.
Next: RA and RB independently review this frozen combination and its carrier in parallel. Planner disposes unproven original authorizations; I waits. No role PR or C01 dispatch.
