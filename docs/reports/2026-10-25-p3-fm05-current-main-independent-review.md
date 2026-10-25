# P3-FM05 current-main independent review

Verdict: **NEEDS_REVISION** for exact Base `d5c7f7140b84aa7efe045a3730c9eddd0d0ce296` and Candidate `29d6b91bf08912e1e2c99cb99b2091d49048b93e`.

The review used separate exact-Base and Candidate worktrees. The Candidate changes exactly ten new servant archives, one focused test, and its Builder receipt; it does not change runtime, generated content, coverage, unrelated servants, or F1 authoring. The ten card IDs exactly match the A handoff `3da1ce10502977c42ecece7c2e13e708433c11fc`. The ten printed texts independently hash to the frozen full-text SHA `295a5b531db5d1031cbbb89dc677e76737b7d3b3c7ca70af59405cc84bd98c58`; both printed clauses hash to the frozen clause SHAs. All ten match the `b2f9fa15fba07c63530bbf4612b03b8b704755f9` Reference legacy-content for text, cost 0, basePower 2, and type label 魔术, preserve class/owner, and declare the final skill-zone requirement of 8 mana. The FB2-02 deployment reward shape is present.

## Blocking dependency mismatch

The exact current-main Base is a docs-only FB2-11 synchronization commit on `1d050039`; it does **not** contain the accepted FB2-11 runtime/loader changes from Candidate `cdeb73b86486acc848c5c912976816a32a9a5704`. The FM05 Candidate likewise has no `game.round_number` occurrence in `packages/rules/src`.

Minimal reproduction with `servant.anastasia.json` (representative of all ten): `loadAuthoringJson` reports `cardFace.basePower.formula.args[1].args[1].var` as unsupported, reason `Unbound server metric or variable: game.round_number`. At round 4, direct `evaluateFormula` throws `Missing or invalid variable: game.round_number`, rather than yielding the required Power 8. Thus the accepted FB2-11 formula dependency is absent from this exact Base/Candidate. The focused FM05 test checks that the card object loads but does not assert an empty loader report or calculate Power at rounds 1/4/7/8. The A handoff's statement that current-main source exposes this metric conflicts with the exact checkout.

The proper correction is to establish and pin a new current-main Base containing the already accepted FB2-11 runtime/loader code, recompute the A handoff, and rebuild this authoring-only FM05 Candidate on it. The focused test should assert `pack.report` is empty and the actual 14/8/2/0 Power values. Adding runtime code inside FM05 would violate its authoring-only scope.

## Other independent checks

| Check | Result |
| --- | --- |
| `npm ci` and typecheck | pass in both worktrees |
| FM05 focused + FB2-02 compatibility | 4/4 + 7/7 pass, but insufficient for the missing formula dependency |
| `content:validate` | pass: 7 masters, 7 servants, 20 events, 0 blocking; this validates the playtest pack, not the ten FM05 archives |
| Generated-content determinism | pass; generated hashes unchanged |
| `git diff Base..Candidate --check` | pass |
| Standard full CI, sequential Base then Candidate | Base 700/700, Candidate 704/704; both zero failures, but no execution assertion for the new formula |
| Full unfiltered `npm test`, sequential Base then Candidate | Base 805 total / 785 pass / 20 fail; Candidate 809 / 789 / 20; failed-test identities equal |

The unchanged 20 unfiltered failures are existing external source-image/CHM path-existence checks for other archives and playtest sources. They do not explain or excuse the FM05 formula dependency mismatch. No A-sync or migration credit was performed by this Reviewer.
