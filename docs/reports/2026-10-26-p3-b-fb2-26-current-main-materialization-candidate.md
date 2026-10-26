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

## Acceptance boundary

This is a B2 Candidate only. No frozen identity or migration credit is claimed; no consumer authoring is included. A fresh GPT-6 Sol Reviewer must independently verify the exact runtime/test scope and the fail-closed archive boundaries before any A synchronization.
