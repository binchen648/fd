# P3-E06 Codex A Post-Merge Setup/Create-to-Skill Recount

Control Epoch: `FD-P3-2026-09-23-06`

Task: `P3-E06-A-POST-MERGE-SETUP-CREATE-TO-SKILL-RECOUNT`

Observed main SHA (immutable recount anchor):
`a7751c3fa51895fd3a401721b1e926b90e016862`

Moving-ref compatibility is `CONTROL_ONLY_DRIFT` and belongs to the
`PROMOTION_PREFLIGHT_POLICY`; this recount does not require `origin/main` to
remain equal to the observed SHA. CI verification uses only the bound commit
objects and ancestry in the checkout; it does not require a remote ref.

Promotion: PR #536, merge `a7751c3fa51895fd3a401721b1e926b90e016862`, promotion
head `119b8f33e9d59691996a5d03a8dc7589fc816a61`.

## Result

The exact runtime candidate `30be3b74258c817ede1cb857ace947505b62d8ed` is an
ancestor of current main. The three authorized setup consumers are therefore
recorded as `PROMOTED_ON_MAIN_RECOUNTED` for runtime lineage purposes:

- `military.has-support-shot`
- `astronomical-science.has-chaldeas`
- `useless-person.setup`

The promotion adds no canonical authoring identity. Frozen accounting remains
`111 / 944`, with `833` remaining. `mainCoverageCreditDelta=0`,
`mainDenominatorDelta=0`, and `migrationCreditDelta=0`. The runtime promotion
delta is `+3`; it must not be interpreted as migration credit.

## Coverage Recount

Fresh `npm run phase3:coverage` on current main produced:

```text
archives=127 cards=169 abilities=281
compiledCards=76 compiledCharacters=14 blockingIssues=0
newRuntimeSemanticRouted=22
legacyExecuteAbility=3
legacyResolveEffect=144
dualRuntime=0
notClassifiable=112
```

The setup route is present as
`SETUP_CARD_CREATION_MINIMAL:CREATE_TO_SKILL=3`. Global raw counters are
unchanged by this promotion.

Machine artifact: `artifacts/phase3-e06-a-post-merge-setup-create-to-skill-recount.json`

Machine artifact SHA-256:
`4446D0A0E16A0A9E3402CEEBC000E2B5CAF2A98655FD3277FC6E530BA2E003FC`

Coverage artifact: `artifacts/phase3-skill-coverage.json`

Coverage artifact SHA-256:
`1631ECF10EF600A9828F2DF7AD583E9FAD857FABBC73C69C78545606C7121D18`

## Evidence Boundary

Reviewer B, Reviewer A, and Governance evidence are bound to the exact
candidate lineage in the machine artifact. Legacy fallback remains recorded as
`CLOSED_EXACT_ARTIFACT_BOUND`. Gate C remains `NOT_VERIFIED`.

## Validation

- `npm run content:validate`: PASS, 0 blocking issues
- `npm run verify:generated-content`: PASS
- `npm run typecheck`: PASS
- setup focused suite after `npm run content:compile`: 5 files / 184 tests PASS
- `npx vitest run scripts/tests/phase3-e06-post-merge-recount.test.ts`: PASS, 1 file / 2 tests; includes depth-1 clone recovery regression
- `.github/workflows/test.yml`: `actions/checkout@v4` with `fetch-depth: 0`
- `npm run test:ci`: 184 files / 1411 tests PASS
- isolated `npx vitest run packages/rules/tests/match-session.test.ts --testTimeout=15000`: 30/30 PASS
- `npm run test:source-assets`: BLOCKED, 93 `MISSING_IMAGE` issues
- `git diff --check`: PASS

This is a post-merge evidence recount, not a new runtime implementation or a
global acceptance/promotion decision. Reviewer A should independently verify
the merge ancestry, evidence hashes, unchanged frozen accounting, and the
distinction between runtime promotion and migration credit.
