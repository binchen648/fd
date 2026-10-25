# P3-A FB2-12 current-main runtime materialization — revised scope

Role: Codex A dependency materialization
Status: `MATERIALIZED_DEPENDENCY_CANDIDATE_REVISED`

## Lineage

- Exact current-main Base: `a1e3c970893446d39ec8a1d9e991008d69683f52`.
- Historical accepted semantic source: FB2-12 Candidate `4c97449de07b1e7a859d8ef43b60e34069541830`, Reviewer `ee3367b1ea17e6db9d98b1ae42d769fae6122d5e`.
- The applied patch is the exact single-commit delta `f1bd75e958753ca48d8d08a9a37bb8901abbeadc..4c97449de07b1e7a859d8ef43b60e34069541830`, three-way reconciled onto current FB2-02/FB2-11 code.
- This revision supersedes materialization `175c3476c89a113c604460dd48f6b97f22b90646`, which was found to include unrelated FB2-10 Magic Resistance route drift.

## Scope correction

Retained only the accepted FB2-12 runtime/test paths: `interpreter.ts`, `loader.ts`, `types.ts`, `combat-resolver.ts`, `schema/game.ts`, and the FB2-12 focused regression. The FB2-10 Magic Resistance helper/route and execution guards are absent. The current FB2-11 standalone `game.round_number` loader/evaluator guards remain intact; no redundant interpreter `name === game.round_number` bypass was added. FM03/FM04/FM06 authoring, coverage, generated artifacts, and task-index changes remain excluded.

The semantic classifier now requires the typed numeric literal `limit.uses === 1`; the focused regression covers the malformed string `'1'` near-miss and rejects it independently of loader diagnostics.

## Verification

- `npm run typecheck`: passed.
- FB2-02 focused: 9/9.
- FB2-11 focused: 7/7.
- FB2-12 focused: 10/10.
- Combined: 26/26.
- `npm run verify:generated-content`: passed; generated hashes unchanged.
- `git diff --check`: passed.

This remains an A-owned dependency materialization candidate, not a new FB2-12 review and not FM06 acceptance. The next FM06 Builder must start from this revised materialized SHA after it is pushed and independently reviewed.
