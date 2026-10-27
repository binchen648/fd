# FB2-26 independent review — 2026-10-28

## Identity and scope

- Base: `824afedfce8565848591b76ee42d60e666e70213`
- Candidate: `9c6eef1efaa89c9090268828f5926139e40986d9`
- PR branch: `codex/b2-p3-fb2-26-current-main-20261026`
- Independent detached checkout: `E:\Codex\FD\fb2-26-final-review-oct28b`
- Reviewed the Phase 3 agent contract, full-roster collaboration contract, and authoritative FB2-26 task block in `origin/main:docs/agents/PHASE3-TASK-INDEX.md`.
- Base-to-Candidate diff has five files: loader, compiler, their two test files, and one Candidate report. No production authoring, pack, generated content, interpreter, MatchSession, or credit changes.

## Verdict: IMPLEMENTATION_NEEDS_REVISION

The exact-discriminator legacy bypass accepts a malformed mixed master archive and materializes it as a playable master. This violates the FB2-26 fail-closed requirement. No migration acceptance, A-sync, or credit is granted.

### Reproduced blocking finding

In `packages/rules/src/ability/executable-card-pack.ts`, `assertMasterRuleArchive` returns immediately for any `archiveType === 'master_rule_definition_archive'` that has `deck` **or** `publicInformation` (lines 100–104). It does not verify the actual legacy card shape or ownership. The subsequent `isRulesOnlyMasterArchive` test is false for a record with playable presentation, so the compiler creates a character and fallback command spell.

I loaded the actual playtest pack, cloned the `master.kayneth` archive, and appended a synthetic archive with the exact discriminator, ordinary `master_skill`, and `outside_game` `master_skill`. The outside-game card deliberately had `owner.id = master.other`, which does not match its archive `master.synthetic-invalid-owner`; the archive retained playable `publicInformation`. I called `compileExecutableCardPack` directly. Actual result:

```json
{"accepted":true,"character":true,"fallback":"master.synthetic-invalid-owner.command-spell"}
```

The compiler should reject this invalid mixed rule archive. `packages/content/src/playtest-pack-loader.ts` also permits the same exact-discriminator + presentation shape through `assertNormalMasterArchive` if `hasMasterRuleArchiveShape` matches (lines 234–248), without validating owner IDs before `convertAuthoringMaster`. Thus the loader and compiler both need a narrow legacy guard that recognizes **valid** historical FM09 records only. Preserve valid FM09 behavior, but reject an invalid owner or other malformed mixed shape before playable conversion or executable compilation. Add regression tests for the exact discriminator with invalid ownership, including the normal authoring-master manifest path.

### Checks completed in the independent checkout

| Check | Result |
| --- | --- |
| `npm ci --ignore-scripts` | passed |
| `npm run typecheck` | passed |
| Focused loader/compiler Vitest files | 57/57 passed |
| `npm run test:ci -- --reporter=dot` | 790/790 passed; 125 files |
| `npm run content:validate` | passed; 7 masters, 7 servants, 20 events, 0 blocking issues |
| `npm run verify:generated-content` | passed; three generated hashes verified |
| `git diff --check Base Candidate` | passed |

Existing tests cover near-match discriminator rejection, explicit rules-only compilation, and ordinary production content. They do not cover the exact-discriminator malformed legacy-looking input above. The focused rules-only case compiles an injected archive; the loader test injects into the loaded object rather than reading an explicit `authoringMasterRuleFiles` manifest entry. That gap is secondary to the reproduced blocker.

Candidate was not edited. This review branch contains only this report and does not merge or alter the PR branch. Formal progress remains 151/944 and FB2-26 earns 0 credit pending a new Candidate and independent re-review.
