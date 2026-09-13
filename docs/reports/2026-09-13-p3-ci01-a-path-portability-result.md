# P3-CI01-A Path Portability Result

- Task: P3-CI01-A
- Branch: codex/p3-ci01-a-path-portability
- BaseCommit: 9d0ca8142d8ef4313c80db115be5bf461639b313
- Baseline report commit: 2f47818
- Path portability commit: ae510d4

## A-Owned Repair

- Added `scripts/project-paths.ts` to derive repository paths from the active checkout.
- Updated `scripts/export-smoke-scenarios.ts` defaults to use repository-relative native paths.
- Updated generated scenario matrix labels so equivalent Windows and POSIX path spellings produce the same label.
- Updated sample manifest coverage tests to load the tracked `data/manifests/sample-cards.json` from the active checkout.
- Added cross-platform path helper tests.

## Verification

```text
npm ci
npm run typecheck
npx vitest run scripts/tests/project-paths.test.ts packages/pipeline/tests/runners/export-smoke-scenarios.test.ts packages/pipeline/tests/validators/sample-manifest-coverage.test.ts
git diff --check
```

Result: PASS.

Focused test count: 3 files passed, 17 tests passed.

```text
npm run test:ci
```

Result: FAIL with B-owned content compilation/source-asset failures still present.

- 78 test files executed: 75 passed, 3 failed.
- 442 tests executed: 439 passed, 3 failed.
- Remaining failures:
  - `packages/content/src/__tests__/fd-playtest-events.test.ts`: missing clean-checkout source image.
  - `packages/content/src/__tests__/playtest-pack-loader.test.ts`: 93 blocking `MISSING_IMAGE` issues.
  - `packages/rules/tests/regression/golden-card-content-pipeline.test.ts`: `definitionHash` mismatch.

```text
npm run verify:generated-content
```

Result: FAIL with 93 blocking `MISSING_IMAGE` issues.

## CONTENT_COMPILATION_DETERMINISM_GAP

Expected generated definition hash:

```text
f140e032bf241825577c0b78c6c3fa08f7a7f49bd7046feaa5deadabb13f5baa
```

Received clean-checkout definition hash:

```text
1bccc97dd813d9b48208ff6223db40f11a995ca123a513e78e7e444d9bdafe2f
```

The existence-dependent path is `packages/content/src/playtest-pack-loader.ts` `imagesForArchive(...)`:

- direct `imagePath` / `sourceImage` entries are filtered through `existsSync(resolve(workspaceRoot, path))`;
- missing HTM files fall back to `chm-extract/图包/图片1.png`;
- parsed screenshot references are also filtered through `existsSync(...)`.

This is B-owned because changing it affects source selection, generated content identity, and definition hash semantics. P3-CI01-A stops here and does not modify content compilation, generated content, or source-asset validation policy.
