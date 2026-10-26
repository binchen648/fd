# P3-R FB2-26 current-main revision review

Role: independent Codex R (GPT-6 Sol)
Verdict: `IMPLEMENTATION_NEEDS_REVISION`
Base: `824afedfce8565848591b76ee42d60e666e70213`
Rejected original Candidate: `643253bf5fcbbff32aa594e3367eeb9ec6dc144b`
Reviewed revision Candidate: `5953f19197e90e57b0699c1bd4551712a4f5bd06`
Independent checkout: `E:\Codex\FD\fb2-26-revision-independent-review-clean`

## Findings

1. **Blocking — a mixed master archive with a near-match discriminator can enter the playable path.** The authoritative `P3-FB2-26-NONPLAYABLE-MASTER-RULE-ARCHIVE` contract requires the compiler to fail closed for a structural mixed shape with a missing or near-match discriminator. `assertMasterRuleArchive` only rejects a wrong discriminator when the archive has neither `deck` nor `publicInformation`. In a direct compiler reproduction, a two-card mixed archive carrying `archiveType: "master_rule_definition_archiv"` and the normal master presentation fields compiled successfully. It emitted `characters["master.synthetic-near"]`, a fallback command spell, and an ordinary skill in the initial skill zone. Expected: rejection before the playable path. The explicit manifest loader rejects a near-match in its new channel, but the executable compiler independently accepts it, contrary to the stated two-boundary contract. The focused suite tests a wrong discriminator only after deleting `deck` and `publicInformation`, so it misses this case.
2. **Scope requires a new A-owned authorization or a narrower design.** The revision modifies `packages/rules/src/ability/loader.ts` and `packages/rules/src/ability/types.ts`. These files are not in the historical FB2-26 dispatch's exact May-touch list. Their changes preserve `initialPlacement` through compilation and appear necessary for the desired outside-game behavior; this review does not remove them. A current-main task amendment should explicitly authorize them before acceptance.

## Prior blockers and independent verification

The previous review's routing defect is structurally corrected: `compileLoadedPlaytestPack` now includes `authoringMasterRuleArchives` in `rules.archives`. The production manifest has no entry in this new channel yet; its six older FM09 archives are in `authoringMasterFiles` and were excluded by the exact Base as well, so their absence from compiled playable rules is not a new regression. The revision also carries `initialPlacement: outside_game` into executable definitions and defers those cards from initial skill placement. The focused outside-game assertion passes. Base-to-revision `git diff --check` passes.

Checks in an independent checkout with a fresh local `npm ci --ignore-scripts --prefer-offline` installation:

| Check | Result |
| --- | --- |
| `npm.cmd run typecheck` | PASS |
| Content loader + executable compiler focused tests | 54/54 PASS |
| `npm.cmd run test:ci` | 125 files, 787/787 PASS |
| `npm.cmd run content:validate` | 7 masters, 7 servants, 20 events, 0 blocking issues |
| `npm.cmd run verify:generated-content` | PASS; generated hashes unchanged |
| Base-to-Candidate `git diff --check` | PASS |
| Client production build | Fails at three unused-symbol diagnostics that are also present in Base source: `isCardZoneCoreDirectActionSemantic`, `buildBattleResult`, `RuleOverrideState`. This does not prove a new FB2-26 defect. |
| Candidate and independent checkout status | Clean; no production authoring, pack, generated, interpreter, MatchSession, F1, or accounting changes |

The additional near-match reproduction used the real current content library as compiler input, cloned an existing master archive, retained its playable presentation fields, added an ordinary and an `outside_game` master skill with a matching synthetic owner, and changed only its discriminator to `master_rule_definition_archiv`. `compileExecutableCardPack` returned `accepted=true`, `character=true`, `fallback="master.synthetic-near.command-spell"`, and `ordinaryZone="skill"`. This is a compiler acceptance failure, not a test-run refusal.

FB2-26 remains zero-credit infrastructure. No A-sync, consumer migration, frozen credit, PR merge, or Candidate modification is justified by this review. The current formal ledger remains `151/944` until a corrected Candidate receives a fresh independent acceptance and later A synchronization.
