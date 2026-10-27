# P3-B FB2-26 current-main materialization candidate

Role: Codex B2 runtime implementation
Task: `P3-FB2-26-NONPLAYABLE-MASTER-RULE-ARCHIVE`
Exact Base: `824afedfce8565848591b76ee42d60e666e70213` (post FB2-25 consumer A-sync)
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`

## Scope

This candidate adds the identity-free mixed-master rules-only archive channel without changing authoring records, pack manifests, generated content, interpreter behavior, or `MatchSession`:

- `PlaytestPackManifest` accepts `authoringMasterSupportFiles` and `authoringMasterRuleFiles`.
- The content loader validates explicit support/rule archive channels and includes them in the rules archive evidence stream.
- The executable compiler validates the mixed rules-only shape, rejects malformed near-matches, and keeps a rules-only master out of playable characters and generated fallback command spells while compiling its rule cards.
- Existing `authoringMasterFiles` entries and their current FM09 behavior remain untouched on this runtime-only candidate.

The required rule archive shape is a `master.*` archive with at least two `master_skill` cards owned by the same master, at least one ordinary card and at least one `outside_game` card, and no deck or playable `publicInformation`.

## Validation

- TypeScript build: PASS (`npm run typecheck`).
- Focused content/compiler tests: PASS, 53 tests (`playtest-pack-loader.test.ts`, `executable-card-pack.test.ts`).
- Content validation: PASS, 7 masters / 7 servants / 20 events / 0 blocking issues.
- CI test set: PASS, 125 files / 786 tests (`npm run test:ci`).
- `git diff --check`: PASS.

## Reviewer revision

Revision fixes the independent review findings without changing the task boundary:

- `compileLoadedPlaytestPack` now forwards the explicit rule/support channels to the rules source stream; legacy FM09 records in the normal manifest channel retain their prior behavior.
- The rules loader preserves and validates `initialPlacement: outside_game`; executable compilation treats those cards as deferred and keeps them out of the initial skill zone.
- The executable compiler keeps both explicit support and mixed rules-only archives out of playable character, deck, and fallback command-spell surfaces, with fail-closed discriminator and shape checks.
- Added production-path loader coverage for a loaded mixed rules-only archive and a regression assertion for outside-game initial placement.

Revision verification: `npm run typecheck`, `npm run test:ci` (125 files / 787 tests), focused content/compiler tests (54 tests), `npm run content:validate`, `npm run verify:generated-content`, and `git diff --check` all pass.

## Reviewer revision 2

The second review revision tightens compiler fail-closed behavior for mixed-rule near misses. Any mixed rules-only shape without the exact `master_rule_definition_archive` discriminator now fails even when deck or public presentation fields are present; the historical FM09 exact discriminator plus playable metadata remains compatible. The regression suite covers the approximate discriminator case.

The initial-placement transport was kept inside the executable compiler boundary. No changes remain in `packages/rules/src/ability/loader.ts` or `packages/rules/src/ability/types.ts`, so the revision stays within the original runtime/compiler and test scope.

## Reviewer revision 3

The normal `authoringMasterFiles` loader path now rejects every mixed ordinary/outside-game master shape unless it is the exact legacy FM09 discriminator with its established playable presentation metadata. Near-match, missing, or incorrectly registered mixed archives must use the explicit `authoringMasterRuleFiles` channel and fail before `convertAuthoringMaster` can create a playable master or overview. Added a real temporary-manifest loader regression for the near-match case.

Revision verification: `npm run typecheck`, `npm run test:ci` (125 files / 789 tests), focused content/compiler tests (56 tests), `npm run content:validate`, `npm run verify:generated-content`, and `git diff --check` all pass.

## Reviewer revision 4

The normal loader guard now rejects malformed mixed archives even when the
outside-game card is not a `master_skill` (for example, an outside-game
`command_spell`) and the archive uses an approximate discriminator. This check
runs before `convertAuthoringMaster`, so the malformed archive cannot produce a
playable master or overview. The exact legacy FM09 discriminator and playable
presentation remain compatible, while explicit `authoringMasterRuleFiles`
continues to use the strict rules-only channel.

Revision verification: `npm run typecheck`, `npm run test:ci` (125 files / 790 tests), focused content/compiler tests (57 tests), `npm run content:validate`, `npm run verify:generated-content`, and `git diff --check` all pass.

## Reviewer revision 5

The final legacy-FM09 boundary now validates card ownership at both runtime
boundaries. A normal-channel archive with the exact
`master_rule_definition_archive` discriminator and playable metadata is only
accepted when it has the established ordinary/outside-game mixed shape and
every card has `owner.type=master` with `owner.id` equal to the archive id.
Exact-discriminator archives with a foreign-owned card, malformed card mix, or
other invalid legacy shape now fail before playable conversion. The explicit
`authoringMasterRuleFiles` rules-only channel remains strict and unchanged.

Added real cross-owner regressions in both the normal content loader and the
executable compiler. This prevents a malformed archive from producing a
playable character or generated fallback command spell through either path.

Revision 5 verification: `npm run typecheck`, focused content/compiler tests
(59 tests), `npm run test:ci` (125 files / 792 tests),
`npm run content:validate`, `npm run verify:generated-content`, and
`git diff --check` all pass.

## Reviewer revision 6

The normal authoring-master loader now rejects the exact
`master_rule_definition_archive` discriminator unless the archive is the
complete compatible FM09 playable shape. An exact discriminator with missing
playable metadata, too few cards, or no ordinary/outside-game pair can no
longer pass the normal path and disappear during channel filtering. Added a
regression for the one-card, non-playable malformed shape. Valid legacy FM09
records and the explicit rules-only channel remain supported.

Revision 6 verification: `npm run typecheck`, focused content/compiler tests
(60 tests), `npm run test:ci` (125 files / 793 tests),
`npm run content:validate`, `npm run verify:generated-content`, and
`git diff --check` all pass.

## Acceptance boundary

This is a B2 Candidate only. No frozen identity or migration credit is claimed; no consumer authoring is included. A fresh GPT-6 Sol Reviewer must independently verify the exact runtime/test scope and the fail-closed archive boundaries before any A synchronization.
