# P3-FB2-30 Independent Review

- Date: 2026-09-19
- Review job: `mu8cqxky-h5g9wah`
- PR: `#374`
- Task: `P3-FB2-30`
- Candidate branch: `codex/b2-p3-fb2-30-card-definition-return`
- Exact Base: `e3c49b3f80248a58d0cb7a8b1e22e946627a2b39`
- Exact Candidate: `491adc1e965b9eb7179fa7bced64371ae27542c1`
- Formal verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- Candidate modified by reviewer: no
- Merge / retarget performed: no

## Mechanical recovery

The review target and contract were reconstructed from Git/GitHub/repository artifacts rather than coordinator chat text.

- PR #374 reports Base `e3c49b3f80248a58d0cb7a8b1e22e946627a2b39` and Candidate `491adc1e965b9eb7179fa7bced64371ae27542c1` on `codex/b2-p3-fb2-30-card-definition-return`.
- `git merge-base(Base, Candidate)` is the exact Base.
- Linear ancestry is `e3c49b3 -> bba1658 -> 491adc1`.
- Candidate scope is 5 files, +326/-3:
  - `docs/reports/2026-09-19-p3-fb2-30-master-skill-definition-return-result.md`
  - `packages/rules/src/ability/executable-card-pack.ts`
  - `packages/rules/src/ability/interpreter.ts`
  - `packages/rules/src/ability/loader.ts`
  - `packages/rules/tests/fb2-30-master-skill-definition-return.test.ts`
- `git diff --check Base..Candidate`: PASS.
- Production identity-routing audit for Arcueid/Ciel/F1/Reference/structured-skill tokens in added runtime/compiler lines: PASS.

Recovered review contract:

- `docs/agents/PHASE3-AGENT-CONTRACT.md`: Codex R is read-only independent reviewer and may return `IMPLEMENTATION_NEEDS_REVISION` or candidate acceptance; it must not implement fixes or promote from implementer-only evidence.
- `docs/agents/PHASE3-TASK-INDEX.md` at Base: FB2-30 is a narrow generic identity-free controller-owned master-skill definition-return primitive, zero frozen credit, no F1 migration.
- `docs/reports/2026-09-19-p3-a-fb2-30-master-skill-definition-return-dispatch.md` at Base: exact structural/runtime fail-closed requirements, independent parent Trigger/Condition gating, identity isolation, and required evidence including focused tests, typecheck, official CI, content determinism, Reference verification, client build, diff check, and final cleanliness.

## Prior review finding closure

Two prior independent findings existed against `bba1658526e1980f1280e1baa6bce640778e9a11`.

### Invalid source context accepted

Prior evidence: PR conversation `#issuecomment-5741680313`.

Current Candidate now preflights, before target mutation:

- source owner/controller matches controller;
- source zone is `skill`;
- source definition exists and is `master_skill`;
- source definition is owned by the controller's current master definition.

Current negative tests cover wrong source definition owner, wrong source definition type, and stale source zone while asserting full state equality. This prior finding is functionally closed.

### Nested / `creates` parent-route bypass

Prior evidence: PR conversation `#issuecomment-5741727805`.

Current Candidate recursively detects `return_card_by_definition` candidates through arbitrary nested arrays/objects under both `effects` and `creates`; `canActivate` rejects such a parent route, and direct `executeAbility` rejects it as requiring independently accepted parent routing. Negative tests cover nested branch descendants and `creates` with full-state equality. This prior finding is functionally closed.

## Fresh component verification

All checks below were executed against detached exact Candidate `491adc1e965b9eb7179fa7bced64371ae27542c1` unless stated otherwise.

- `npm run typecheck`: PASS.
- `npx vitest run packages/rules/tests/fb2-30-master-skill-definition-return.test.ts`: 1 file / 8 tests PASS.
- Reviewer-only direct-import adversarial probe, created only in a temporary reviewer worktree and removed afterward: 1 file / 10 tests PASS. The two additional cases prove missing target definition and wrong target definition type both reject transactionally with full-state equality.
- `npm run content:validate`: PASS, 7 masters / 7 servants / 20 events / 0 blocking issues.
- `npm run verify:generated-content`: PASS with hashes:
  - content library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence report `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`
- `npm run phase3:reference:verify -- --reference-root <locked-reference-worktree>`: PASS for exact Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.
- `npm run build --workspace @fd/client`: PASS. The only stderr is the already-known Vite `node:crypto` browser-externalization warning.
- Candidate `git diff --check`: PASS.
- Candidate production identity audit: PASS.
- Candidate detached verification worktree after checks: clean.

## Official CI gate investigation

The first reviewer pass observed two full-suite Candidate failures on the fixed-5000 ms test `packages/rules/tests/match-session.test.ts > MatchSession semi-auto runtime > runs eleven rounds or pauses with an explicit handled reason` (about 5.22-5.27 s), while Base and pre-revision controls happened to pass in that earlier sample. That initially looked Candidate-specific and produced an interim `IMPLEMENTATION_NEEDS_REVISION` report.

A superseding matched rerun was performed before finalizing this review, using a non-sparse detached worktree at exact Candidate `491adc1e965b9eb7179fa7bced64371ae27542c1`, materialized with `npm ci --offline` and `npm run typecheck` before the official suite.

Candidate official-CI observations in the superseding run:

- first full run: PASS, `144/144` files and `1011/1011` tests; the 11-round smoke completed in `4093 ms`;
- repeat 1: PASS, `144/144`; smoke `4249 ms`;
- repeat 2: PASS, `144/144`; smoke `4104 ms`;
- repeat 3: only the same smoke timed out, `5262 ms`, leaving `143/144` files and `1010/1011` tests.

Matched controls were then rerun on the same host:

- exact Base `e3c49b3f80248a58d0cb7a8b1e22e946627a2b39`: the same smoke timed out at `5113 ms`, leaving `142/143` files and `1002/1003` tests;
- pre-revision Candidate `bba1658526e1980f1280e1baa6bce640778e9a11`: PASS, `144/144` files; smoke `4422 ms`.

This supersedes the earlier Candidate-specific attribution. The 5000 ms smoke is demonstrably load-sensitive on exact Base as well as Candidate, while exact Candidate also has multiple fresh complete official-suite passes. Therefore the intermittent timeout is recorded as a baseline/test-host stability issue, not a defect attributable to FB2-30 and not a blocker for this implementation review.

## Additional fresh verification after the matched rerun

Against the same complete detached exact Candidate worktree:

- `npm ci --offline`: PASS, 239 packages installed, 0 vulnerabilities;
- `npm run typecheck`: PASS;
- official `npm run test:ci`: multiple full PASS runs at `144/144` files / `1011/1011` tests, with the load-sensitive timeout investigation documented above;
- `npm run content:validate`: PASS, `7 masters / 7 servants / 20 events / 0 blocking issues`;
- `npm run verify:generated-content`: PASS with hashes `866a5b...`, `fb6938...`, `b1bb89...`;
- `npm run phase3:reference:verify -- --reference-root <locked-reference-worktree>`: PASS against exact Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9`;
- `npm run build --workspace @fd/client`: PASS; only the known Vite `node:crypto` browser-externalization warning appeared;
- `git diff --check Base..Candidate`: PASS;
- final detached Candidate worktree: clean.

The earlier reviewer-only adversarial probe remains relevant: 10 additional direct-import cases passed, including transactional no-mutation rejection for missing/wrong target definitions. Together with the Candidate's 8 focused tests, the fresh focused evidence is `18/18` passing.

## Verdict

`IMPLEMENTATION_ACCEPTED_CANDIDATE`

The exact Candidate satisfies the recovered FB2-30 implementation contract: it is identity-free, keeps parent Trigger/Condition routing gated, fails closed before mutation for invalid/stale source and target contexts, preserves canonical physical-instance behavior, and introduces no consumer migration or frozen-credit change. Both prior correctness findings are closed. The intermittent 5 s smoke timeout is not treated as Candidate-specific because exact Base reproduces the same failure and Candidate has multiple complete official-suite passes.

This verdict accepts only the implementation Candidate for the narrow zero-credit FB2-30 capability. It does not merge, retarget, accept any F1 consumer migration, or change formal recovery accounting.

## Evidence publication

This reviewer evidence is stored on the separate review-evidence branch rooted directly on Candidate. The Candidate branch and Candidate SHA were not modified. A prior attempt to write a PR comment/review returned GitHub HTTP 403 `Resource not accessible by integration`; the repository reviewer-report path is therefore the durable evidence channel for this review job.
