# FM05 current-main dependency materialization

Status: `A-OWNED DEPENDENCY MATERIALIZATION` only. This branch is not FM05 acceptance, credit, merge, or Reviewer approval.

## Lineage

- Starting current-main A-sync: `d5c7f7140b84aa7efe045a3730c9eddd0d0ce296`.
- Branch: `codex/a-p3-fm05-dependency-materialization-20261025`.
- The FM05 authoring Candidate `29d6b91bf08912e1e2c99cb99b2091d49048b93e` remains paused and is not copied here.

## Materialized accepted dependencies

Only the accepted production/test deltas were reapplied from their independently reviewed Candidates:

- FB2-02 Candidate `83bd762944d5d806aebb4ceee127a3d130d7b1db`, accepted against its recorded Base and Reviewer report `f774f333859bf0a58884ca5e9f7eea34096326e3`: `packages/rules/src/ability/interpreter.ts` and `packages/rules/tests/regression/fb2-deployment-resource-reward.test.ts`.
- FB2-11 Candidate `cdeb73b86486acc848c5c912976816a32a9a5704`, accepted against its recorded Base and Reviewer report `c79591f9`: `packages/rules/src/ability/interpreter.ts`, `packages/rules/src/ability/loader.ts`, and `packages/rules/tests/regression/fb2-round-number-formula.test.ts`.

Historical reports, acceptance-sync documents, FM03/FM04 drift, generated artifacts, coverage, taxonomy, and unrelated files were excluded. The overlapping interpreter patches were applied with three-way context only; no old branch was merged wholesale.

## Verification

- `npm run typecheck`: passed.
- FB2-02 + FB2-11 focused tests: 2 files / 16 tests passed.
- `npm run verify:generated-content`: passed with unchanged hashes `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`, `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`, `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- The materialized dependency branch is the prerequisite base for rebuilding FM05; it does not itself rebind or accept the paused FM05 Candidate.
