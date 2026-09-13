# P3-CI01 Current-Baseline Integration Verification

- Document Role: CI_INTEGRATION_VERIFICATION
- Owner: Codex A integration stage
- Task: `P3-CI01`
- Current Runtime Base: `f619df5479ed733b76c096410f7ccdc700abd661`
- A Baseline Commit Replayed: `2f47818`
- A Path-Portability Commit Replayed: `ae510d4`
- A Handoff Commit Replayed: `5e6089a`
- B Content-Determinism Commits Replayed: `dd9d9b9`, `e723e03`, `1867bf8`
- Status: `CI_INTEGRATION_CANDIDATE`

## Integration method

The historical CI01 A/B branches were based on old commit `9d0ca81`. They were **not merged as branches**, because doing so would delete later Phase 3 documents and runtime work. Their exact role-owned commits were replayed onto the current accepted runtime base.

Generated artifacts from the old B branch were not allowed to overwrite current generated content during conflict resolution. Instead the current authoring pack was compiled twice with the integrated deterministic loader and then regenerated from the current tree.

A merge-conflict residue, obsolete helper `sourceImageExists`, was removed because the integrated explicit `SourceAssetValidation` policy supersedes it; leaving it would fail current TypeScript `noUnusedLocals`. No game-rule runtime file was modified by this integration.

## Generated-content determinism

Two consecutive `npm run content:compile` runs produced byte-identical artifacts:

- content library SHA-256: `269fc1f0f15e532a4f077bf612f1c60b648844b8daf4dc54d86c39bee3e38ba9`;
- evidence report SHA-256: `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.

The regenerated content library changed source path normalization/selection plus `definitionHash` from `2c6b15a98d25e80770da2517d7413fe24fdc695cd238f1247b3c24d8d691f3ed` to `5aa5a186bb201ce1f491cb6f38907a6267a4f30775113d9dd95651d58ba735d2`.

A structural comparison removing only entity `source` metadata and `definitionHash` fields returned:

`SEMANTIC_EQUAL_EXCLUDING_SOURCE_AND_HASH=true`.

No card, ability, effect, lifecycle, target, cost, or rule semantic drift was introduced by regeneration.

## Local clean-checkout contract

Fresh `npm ci --ignore-scripts`: PASS.

Final verification after current regeneration:

- `npm run typecheck`: PASS;
- `npm run test:ci`: **84 files / 502 tests PASS**;
- `npm run verify:generated-content`: PASS;
- `git diff --check`: PASS.

Generated verifier hashes:

- `fd-playtest-v1.content-library.json`: `269fc1f0f15e532a4f077bf612f1c60b648844b8daf4dc54d86c39bee3e38ba9`;
- `fd-playtest-v1.fixture.json`: `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
- `fd-playtest-v1.evidence-report.json`: `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.

This closes the prior clean-checkout failures for hard-coded Windows paths, missing optional CHM assets in normal CI, and environment-dependent generated identity.

## Strict source evidence remains fail-closed

`npm run test:source-assets` was run in this worktree without the ignored CHM/source binaries. It exited nonzero and explicitly emitted `MISSING_IMAGE` entries.

Result: `STRICT_FAIL_CLOSED=PASS`.

Normal clean-checkout CI therefore records unverified source binaries as metadata-only evidence, while explicit strict verification continues to reject unavailable source assets.

## Scope audit

P3-CI01 does not modify ability runtime, MatchSession behavior, card-action routing, Phase 3 KPI definitions, or Gate judgments. The current runtime base remains P3-B06 accepted candidate `f619df5`.

## Remote acceptance still required

This report records the local integration candidate only. P3-CI01 is not `CI_BASELINE_ACCEPTED` until GitHub Build and Test pass on Ubuntu for the pushed integration candidate and a fresh P3-CI01-R review accepts it.
