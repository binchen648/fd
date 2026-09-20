# Phase 3 Promotion Lane Governance

Phase 3 candidate work may be promoted to `main` only through a Promotion PR that carries structured evidence, repeatable CI, and independent review. This lane is governance infrastructure only; it does not change game rules, runtime behavior, card data, migration counts, or existing acceptance conclusions.

## GitHub Checks

- `Build / build`: existing workspace typecheck and client build.
- `Test / test`: existing typecheck plus `npm run test:ci`.
- `Phase 3 Promotion Lane / policy`: structured Phase 3 manifest policy and focused governance tests.

The Phase 3 gate runs on all pull requests so stacked Phase 3 PRs get a stable policy check even when their base is another `codex/...` branch. Ordinary non-Phase 3 PRs are skipped by policy detection. A push to `main` runs the focused tests under the same check name, establishing its status context before it is made required. The gate uses `pull_request`, not `pull_request_target`, has `contents: read`, uses no secrets, and cancels stale runs for the same PR.

## Manifest Policy

Phase 3 PRs must include a fenced `json phase3-task-manifest` block in the PR body. The manifest records role, task ID, base/head refs and SHAs, dependency PRs, affected ability IDs, runtime behavior flag, rules source, Reference commit, R review evidence, A synchronization evidence, migration counts, tests, uncovered scenarios, blockers, zero-migration credit, and upstream revalidation acknowledgement.

Roles are `A`, `B`, `R`, `S`, `I`, and `G`. Promotion PRs targeting `main` must use role `I`; governance-only PRs use role `G`; stacked Phase 3 implementation/review/migration PRs use `prType: "stacked"`.

## External Repository Settings

Branch protection and rulesets are repository settings, not source files. Required checks should be configured only after the checks have run on `main` and GitHub has produced stable status contexts.
