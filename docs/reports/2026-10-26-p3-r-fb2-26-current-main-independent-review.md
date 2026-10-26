# P3-R FB2-26 current-main independent review

Role: Codex R (GPT-6 Sol)
Verdict: `IMPLEMENTATION_NEEDS_REVISION`
Base: `824afedfce8565848591b76ee42d60e666e70213`
Candidate: `643253bf5fcbbff32aa594e3367eeb9ec6dc144b`
Reviewer branch: `codex/r-p3-fb2-26-review-refresh-20261026`
Task: `P3-FB2-26-NONPLAYABLE-MASTER-RULE-ARCHIVE`

## Blocking findings

1. **The new archive channel does not reach executable rules.** The Candidate adds `authoringMasterRuleFiles` to `loadPlaytestContentPack` and appends those archives to `pack.authoringArchives`, but `compileLoadedPlaytestPack` still removes every archive with `archiveType === 'master_rule_definition_archive'` before assigning `library.rules.archives` (`packages/content/src/playtest-pack-loader.ts:806-820`). A read-only production-path probe found six rule archives in the loaded pack and zero in compiled `library.rules.archives`. Any new archive registered through the new manifest field is removed by the same predicate. The new compiler test manually pushes an archive into `input.rules.archives`, bypassing this path. This contradicts the task's required `authoringMasterRuleFiles -> rules.archives -> executable` boundary.

2. **An outside-game definition can start in the skill zone.** In `compileExecutableCardPack`, `deferredCardIds` does not include a card merely because its `initialPlacement` is `outside_game`; the final loop gives every undeferred master skill `initialZone = 'skill'` (`packages/rules/src/ability/executable-card-pack.ts:542-562, 644-647`). An independent synthetic mixed archive with one ordinary and one `outside_game` master skill compiled both with `initialZone: 'skill'`. The task requires the outside-game definition to have no `initialZone`. The new positive test checks that both card IDs exist, not their initial zones.

3. **The committed diff fails whitespace validation.** `git diff --check Base Candidate` reports trailing whitespace at lines 3–5 of `docs/reports/2026-10-26-p3-b-fb2-26-current-main-materialization-candidate.md`. The Candidate report's `git diff --check: PASS` does not hold for the committed Base-to-Candidate diff.

These findings block acceptance even though the existing test suite passes. No runtime or authoring fix was made by the Reviewer.

## Scope and independently executed checks

Candidate changes are limited to `packages/content/src/playtest-pack-loader.ts`, `packages/rules/src/ability/executable-card-pack.ts`, `packages/rules/tests/executable-card-pack.test.ts`, and its Candidate report. No production authoring, pack manifest, generated product, interpreter, MatchSession, frozen identity, or accounting file is changed.

| Check | Result |
| --- | --- |
| Clean dedicated Reviewer worktree at Candidate | PASS |
| `npm ci --ignore-scripts --prefer-offline --no-audit --no-fund` | PASS |
| `npm run typecheck` | PASS |
| Focused content loader and executable compiler tests | 53/53 PASS |
| `npm run content:validate` | 7 masters, 7 servants, 20 events, 0 blocking issues |
| `npm run test:ci` | 125 files, 786/786 PASS |
| `npm run verify:generated-content` | PASS, unchanged generated hashes |
| `git diff --check Base Candidate` | FAIL, Candidate report lines 3–5 |

The focused and CI results verify current tests, but the new tests do not exercise an archive through the manifest, loader, compiled library, and executable compiler as one path. They also do not assert the outside-game target's initial zone.

## Required revision and acceptance boundary

The Builder should make the exact new manifest channel survive into `library.rules.archives` without changing the existing FM09 rules-only exclusion, prove the mixed archive's source and outside-game target zones through the real load/compile path, cover malformed channel and archive variants at loader and compiler boundaries, and make the committed diff pass `git diff --check`. A fresh independent review of the revised Candidate is required. FB2-26 remains zero-credit capability work; current accepted accounting stays `151/944`.
