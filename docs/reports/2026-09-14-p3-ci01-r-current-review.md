# P3-CI01-R Independent Review — Current Main

- Document Role: INDEPENDENT_REVIEW_REPORT
- Owner: Codex R
- Task: `P3-CI01-R`
- Reviewed Current Main: `fba31b5a725e6c0b8ba54793be8b6726bfc31040`
- CI Repair Merge: `4114be738f4d61b5ad5d53932666b248350d539b`
- Pre-Repair Baseline: `9d0ca8142d8ef4313c80db115be5bf461639b313`
- Verdict: `CI_BASELINE_ACCEPTED`

## Findings

No blocking CI-baseline finding remains.

The original clean-checkout failure families are closed without weakening the normal CI suite, without committing ignored CHM/source binaries, and without modifying ability runtime or MatchSession behavior. Strict source-asset verification remains explicitly fail-closed when the source binaries are absent.

## Scope and anti-shortcut audit

The CI repair merge changes path/tooling, content-source metadata policy, generated content/evidence artifacts, and tests. A diff of `9d0ca81..4114be7` contains **no files** under:

- `packages/rules/src/ability/**`;
- `packages/rules/src/match-session.ts`;
- `packages/rules/src/core/**`.

The `test:ci` command before and after the CI repair has the same exclude list. The repair adds `test:source-assets`; it does not add a new `test:ci` exclusion. Added-line audit found no new unconditional `.skip`, `.todo`, `--exclude`, `allowNoTests`, or pass-with-no-tests shortcut.

Test diffs add substantially more assertions/coverage than they remove. No workflow change is used to mask a failing command.

## Generated-content semantic audit

R independently compared the checked-in generated content before the CI repair with the repair merge output. After removing only entity `source` metadata and `definitionHash` fields:

`CI_MERGE_SEMANTIC_EQUAL_EXCLUDING_SOURCE_AND_HASH=true`.

Hash transition:

- pre-repair: `f140e032bf241825577c0b78c6c3fa08f7a7f49bd7046feaa5deadabb13f5baa`;
- accepted deterministic hash: `5aa5a186bb201ce1f491cb6f38907a6267a4f30775113d9dd95651d58ba735d2`.

The hash/source normalization change does not alter card, ability, effect, lifecycle, target, cost, or gameplay semantics.

## Fresh local reviewer verification

Fresh external worktree from exact `fba31b5`:

- `npm ci`: PASS;
- `npm run typecheck`: PASS;
- `npm run test:ci`: **78 files / 445 tests PASS**;
- `npm run verify:generated-content`: PASS;
- `git diff --check`: PASS;
- worktree remained clean before writing this report.

Generated verifier hashes:

- library: `269fc1f0f15e532a4f077bf612f1c60b648844b8daf4dc54d86c39bee3e38ba9`;
- fixture: `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
- evidence report: `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.

### Original failure-family focused replay

R reran the path portability, sample manifest, source metadata, event evidence, golden content pipeline, and real compile-CLI tests together:

- **7 files / 40 tests PASS**.

This covers the previously failing Windows-path separator/label cases, hard-coded sample manifest path, clean-checkout missing-source handling, environment-dependent definition hash, and compile source-policy behavior.

## Strict source-asset policy

With ignored CHM/source binaries absent, `npm run test:source-assets` exits nonzero and reports **93 blocking `MISSING_IMAGE` issues**.

Result: `STRICT_FAIL_CLOSED=PASS`.

Normal clean-checkout CI may use metadata-only source validation, but strict verification does not claim binary evidence was verified when it was not available.

## Ubuntu GitHub Actions evidence

The exact CI repair merge `4114be738f4d61b5ad5d53932666b248350d539b` passed both required Ubuntu workflows:

- Build — success: https://github.com/binchen648/fd/actions/runs/34762930925
- Test — success: https://github.com/binchen648/fd/actions/runs/34762930926

The current main reviewed here, `fba31b5a725e6c0b8ba54793be8b6726bfc31040`, also passed both workflows after the later full-roster collaboration merge:

- Build — success: https://github.com/binchen648/fd/actions/runs/34762991752
- Test — success: https://github.com/binchen648/fd/actions/runs/34762991748

GitHub uses Ubuntu with Node 20 per the checked-in workflow. The independent local reviewer run used the current local Node installation; the remote Ubuntu evidence is authoritative for the cross-platform acceptance requirement.

## Nonblocking observations

Fresh `npm ci` reports dependency audit warnings and install-script approval warnings. They do not cause Build/Test failure and are outside P3-CI01 scope. No dependency version or lockfile change is made by this review.

## Verdict

All P3-CI01 acceptance conditions are met:

- original clean-checkout failures closed;
- no test-exclusion shortcut;
- no runtime/gameplay scope drift;
- generated output deterministic and semantically unchanged apart from source/hash metadata;
- strict source evidence remains fail-closed;
- Ubuntu Build and Test pass on the repair merge and current main;
- fresh independent reviewer verification passes.

**`CI_BASELINE_ACCEPTED`**

This verdict accepts the CI baseline only. It does not promote any Phase 3 mechanic Gate, full-roster migration status, or release readiness.
