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

## Acceptance boundary

This is a B2 Candidate only. No frozen identity or migration credit is claimed; no consumer authoring is included. A fresh GPT-6 Sol Reviewer must independently verify the exact runtime/test scope and the fail-closed archive boundaries before any A synchronization.
