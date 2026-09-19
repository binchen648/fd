# P3-FB2-30 Independent Review

- Date: 2026-09-19
- Review job: `mu8cqxky-h5g9wah`
- PR: `#374`
- Task: `P3-FB2-30`
- Candidate branch: `codex/b2-p3-fb2-30-card-definition-return`
- Exact Base: `e3c49b3f80248a58d0cb7a8b1e22e946627a2b39`
- Exact Candidate: `491adc1e965b9eb7179fa7bced64371ae27542c1`
- Formal verdict: `IMPLEMENTATION_NEEDS_REVISION`
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

## Blocking finding: current revision regresses the required official CI gate

The exact Candidate was run through the official command `npm run test:ci` twice on the same reviewer host/dependency tree.

Both runs failed only:

`packages/rules/tests/match-session.test.ts > MatchSession semi-auto runtime > runs eleven rounds or pauses with an explicit handled reason`

The test has a fixed 5000 ms timeout. The two Candidate full-suite runs timed out at approximately 5.22-5.27 seconds. Each run therefore ended at:

- 143/144 test files passing;
- 1010/1011 tests passing.

The new FB2-30 file itself passed in both full-suite runs. The timed-out 11-round smoke also passes when executed alone in the Candidate worktree (~1.998 seconds), so the failure is load-sensitive rather than a deterministic semantic assertion failure.

### Matched controls

To distinguish machine noise from a Candidate regression, the same official command was run under the same host and shared dependency tree on two detached controls.

Exact Base `e3c49b3f80248a58d0cb7a8b1e22e946627a2b39`:

- 143/143 files PASS;
- 1003/1003 tests PASS;
- the same 11-round smoke completes in 4.751 seconds.

Pre-revision Candidate `bba1658526e1980f1280e1baa6bce640778e9a11`:

- 144/144 files PASS;
- 1009/1009 tests PASS;
- the same 11-round smoke completes in 4.687 seconds.

Thus the required official CI gate is green on both matched controls and fails reproducibly only after revision `491adc1`.

Revision `491adc1` adds a recursive arbitrary-object walk of ability `effects` / `creates` and calls that scan from the global `canActivate` path. That is a plausible source of the measurable full-match cost. The formal finding does not require proving that micro-causal attribution: the exact Candidate itself reproducibly fails the dispatch-required official CI gate while exact Base and the immediately preceding Candidate pass under matched conditions.

## Required revision

Preserve the recursive fail-closed parent-route semantics that closed the previous bypass, while removing the measurable global hot-path penalty. A suitable implementation can compile, precompute, or cache whether an ability contains this component rather than recursively walking arbitrary effect graphs on every `canActivate` call.

A replacement Candidate must show:

- full official `npm run test:ci` green under the normal gate;
- the focused FB2-30 negative coverage still green;
- no reopening of source-context validation or nested/`creates` parent-route bypasses;
- no migration, capability-credit synchronization, merge, or retarget as part of this implementation review.

## Verdict

`IMPLEMENTATION_NEEDS_REVISION`

The component semantics and both prior correctness/security findings are closed, but the exact Candidate cannot be accepted while it reproducibly fails a required official CI gate relative to matched Base and pre-revision controls.

## Evidence publication fallback

The reviewer first attempted to publish this evidence as both a top-level GitHub PR comment and a PR review on #374. The GitHub integration returned HTTP 403 `Resource not accessible by integration` for both write paths. Per the review-job fallback contract, the evidence is therefore stored as this repository reviewer report on a separate review-evidence branch. The Candidate branch and Candidate SHA were not modified.
