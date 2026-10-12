# B11 Recorded Validation Receipts

Task: P3-E08-B11-RECORDED-VALIDATION
Epoch: FD-P3-2026-09-23-08
Authorization: bb41b2cb71edc52d755c14f276ca85d98fecfd84
Tested source: 9a4f4c6ee2723eb7f546341f3c18a1f0a29c3bc1
Prior carrier: c8b9786ca4d7cde7240783147c735367d59d2425

A execution status: A_EXECUTION_EVIDENCE_COMPLETE. A execution/binding scope complete: YES.
Overall readiness: BLOCKED; final RA/RB, Planner/G authority and Release disposition are separate external dependencies.
Receipt artifact: artifacts/phase3-e08-b11-environment-reverification-receipts.json
Receipt artifact SHA-256: dcc796d63eba088260440dfaf4b4c53b9e3af8a3032055336530dd8fcf47f08a
Combination artifact: artifacts/phase3-e08-b11-final-combination-evidence.json
Combination artifact SHA-256: 94889745f47b1865c62ec8d6c1633d960c02828344b3db28b0f16c7dad010854

## Actual recorded commands

- 1. npm ci: exit 0; 10017 ms; stdout 6bfba6fa7eb769bac084eb4d43f69d4a5f6e60f16284fad1be3b99bd60cfc307; stderr 67389c0b6efbe86c5fc51293d278be25159d27ace6d73ae2da626b49a0143470
- 2. node -e "console.log(require('os').tmpdir())": exit 0; 96 ms; stdout e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855; stderr e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
- 3. npm --version: exit 0; 349 ms; stdout b396e3e19de55c61b6773383a0a92ee45dd6cddcbec8a09d731a6f2caefa2c5b; stderr e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
- 4. npm run typecheck: exit 0; 611 ms; stdout fe697f3caea6aa3017ce001f09cac853c9f311a09a2c043dc56f82c15f02d1d4; stderr e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
- 5. npx vitest run scripts/tests/phase3-e08-b11-coverage-sync.test.ts scripts/tests/phase3-e06-post-merge-recount.test.ts scripts/tests/phase3-readiness-preflight.test.ts: exit 0; 54790 ms; 3 files / 40 tests; stdout c7f55cd0f7143c869d2e310340b273cbfe2212cde4d85ee4da85285fb4d9ba2d; stderr e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
- 6. npx tsx scripts/phase3-e08-b11-coverage-sync.ts --validate: exit 0; 8738 ms; stdout 4af48fe84bcc2c9adeb42c00f18017103284f61ffd9dc9c00ae934a1ffc9a470; stderr e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
- 7. npx tsx scripts/phase3-e08-b11-coverage-sync.ts --final --validate: exit 0; 6686 ms; stdout b918a05ca3347ed526b0287cfb7c105298eaf48316b33fad03ec04517ad2feb6; stderr e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
- 8. npm run phase3:preflight -- --manifest scripts/fixtures/phase3-b11-task-check.json --candidate c13add9ad5daee46c2f16bafa175abfb78beb020 --base 9a1689d2ec5b56b67d1483d2593b4ab809d6c15c: exit 1; 4330 ms; stdout 5cdb164e813a15dc38cd6998c1a6d353bc0ce7b4646c4a9f03be2bf55b36e383; stderr e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
- 9. npm run test:ci: exit 0; 141846 ms; 193 files / 1532 tests; stdout 3ef354189542b0fab02ed61ad90f28afa238befaecdde2895dd7fef654936459; stderr 3d417beed61322a6d99ac401fc555e427db0bf72546806ae66f7505b45fb1d09
- 10. npm run test:ci: exit 0; 143886 ms; 193 files / 1532 tests; stdout 34e2327ceaa40491af1a4bebac977a53e55d376630da26631511d94389cce73b; stderr e9a888e1de6a1b59923f0dd0b84169291372e08979b4a375b60ea446e4d6f0df
- 11. npm run content:validate: exit 0; 1018 ms; stdout 1e9efe9020c2dcf014d3285336f42e6e85d0f66639e126ddca0ac84254910906; stderr e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
- 12. npm run verify:generated-content: exit 0; 1076 ms; stdout 7b7c76808cebdd0b6eda5c2a4bd8ecad7321fdcb67297d5ef799c1014b8f26e0; stderr e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
- 13. npx vitest run packages/rules/tests/regression/resolution-dataflow.test.ts packages/rules/tests/regression/production-resolution-bridge.test.ts packages/rules/tests/regression/b11-conversion-classification-api.test.ts packages/rules/tests/regression/b11-conversion-binding-ownership.test.ts: exit 0; 5152 ms; 4 files / 51 tests; stdout aa76cebb7420474551c5022145c34222249cdc833cd873b982e551091cda852c; stderr e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
- 14. npm run test --workspace @fd/server -- src/match-server.test.ts: exit 0; 4349 ms; 1 files / 11 tests; stdout 71dfe0aa7b680b5d5c6fe96dfe75f59752d33d0466ba4b69616d8d814aa25d9b; stderr e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
- 15. npx playwright test e2e/fd-golden-eater-result-binding.spec.ts e2e/fd-conversion-magic-core-primitive.spec.ts --repeat-each=5: exit 0; 33648 ms; stdout dae91668152d65cbf72e2aef453346aba04e8469a6313b2e9b61517458876f4e; stderr c7ab015e8fb79886429e08dc877120807915888302394e7340061005bc81bad3
- 16. npm run test:source-assets: exit 1; 1079 ms; stdout 90e4acbbb0cc3c83053c6cfda5d8b584053e7c56f41b997957c4a0e5ff632bd0; stderr e9ca5059f29f431a7fda6bfaf96e4871b13c8f3b3a524b2d45949a9c61dfd4a4
- 17. git diff --check 9a1689d2ec5b56b67d1483d2593b4ab809d6c15c...HEAD: exit 0; 143 ms; stdout e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855; stderr e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855

All commands bind exact clean 9a4f4c6; 23 source/config Git objects were verified before and after. Complete unmodified stdout/stderr bytes are embedded as base64 with their independent lengths and SHA-256; reviewers can decode and recompute them. No sanitizer is applied to command logs. Private health snapshots remain local at the paths recorded in the receipt artifact; reviewers on this host can read and hash those files.

Required fresh raw receipts: COMPLETE, 18 command receipts / 36 raw streams including the supplementary direct-argv environment confirmation. That confirmation printed D:/fd-validation/b11-9a4f4c6/temp and v24.13.1; the earlier shell invocation's empty output remains unchanged. Browser repeat: 10/10 PASS. Both CI runs bind the tested implementation, not a claim that the later evidence carrier itself ran full CI.

Window: 2026-10-12T08:11:38+08:00 to 2026-10-12T09:11:38+08:00. Planner/user formally announced start in this chat. Individual other-owner acknowledgements were not supplied to A and are not fabricated. Process observations are recorded; local wrapper descendant detection corrected once after misclassifying its own npx parent. Original stop and raw records are preserved, then only remaining commands were executed.

Node v24.13.1 / npm 11.8.0; equivalence to GitHub Node 20 is NOT_VERIFIED. TEMP/TMP, npm cache and Playwright cache were on D.
Old complete stdout/stderr and old quiet acknowledgements remain MISSING. Fresh capture does not reconstruct them.
Preflight remains exit 1; source-assets remains exit 1 with 93 MISSING_IMAGE. Seven original-authority gaps, 33 path-scope reviews, two runtime overlaps, final RA/RB and governance remain external dependencies.
Credit delta 0/0/0; ledger unchanged 111/944. Gate/Release/promotion not granted. No runtime, workflow, dependency, timeout, assertion, tooling or C01 dispatch change.

Next: RA/RB review this one evidence-only carrier in parallel; Planner/G resolves external authority gaps. No new execution per individual review sync.
