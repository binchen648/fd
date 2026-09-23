# P3 F4 B02 Source-Owned Passive / Modifier Migration Batch Result

Date: 2026-09-23
Task: `P3-F4-B02-OWNED-PASSIVE-MODIFIER-MIGRATION-BATCH`
Role: batch implementation + migration candidate
Branch: `codex/batch-p3-f4-b02-owned-passive-modifier-migrations`
Exact Base: `8e88fdb5290a6635cb4b9f8d887bb0921d5a3c1e` (R116 F4 B01 acceptance synchronization)
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Batch scope

Continue the user-authorized BATCH-FIRST F4 cadence without redoing whole-roster classification. Existing frozen F1 inventory / semantic-axis evidence was filtered only for absent, source-grounded, no-interaction/no-target passive/modifier consumers adjacent to the accepted B01 family. The two lowest-complexity compatible identities are migrated together:

1. `master.arcueid.skill.s3` — 血之渴望
2. `master.twice.skill.ascension` — 救世主

The next adjacent rows, Mozart S1 and Edison S3, are deliberately deferred because they add scheduling / movement-destination and battle-attribute-close axes and do not belong in this bounded B02 closure.

## Frozen semantics and Reference cross-check

Arcueid S3 preserves the exact F1/Reference clauses:
- basic attacks cost +1 mana and gain +2 power;
- controller cannot use the one explicitly declared skill definition;
- at round end, while the source remains owned, controller loses 2 VP.

The round-end clause is normalized onto the already accepted `round_end` authoritative trigger and `adjust_victory_points(controller,-2)` resource primitive. No new VP mutation path is introduced.

Twice Ascension preserves the exact F1/Reference clauses:
- if controller is tied for the lowest VP among non-eliminated players, controller combat power +12;
- when controller would be eliminated, remove this source card from the game instead.

Locked Reference was read directly for the relevant structured runtime behavior. `victory_points_is_lowest` compares all non-eliminated players and accepts ties. Elimination replacement consumes one source; multiple simultaneous replacement sources fail closed as an unresolved conflict. The consumed source leaves owned zones and is no longer a continuous rule source.

## Runtime implementation

`packages/rules/src/ability/batch-owned-passive-rules.ts` is an identity-free, structural, fail-closed B02 gateway. It admits only the exact four B02 envelopes:
- owned basic-attack `card_cost +1` + `card_power +2`;
- owned explicit one-definition `skill_use:forbid`;
- owned + lowest-VP `combat_power +12`;
- owned `elimination:replace` with `replacement=remove_source_card` and exact priority/conflict metadata;
- plus the exact Arcueid round-end `source_owned -> adjust_victory_points -2` trigger envelope for owned-zone liveness.

Continuous `source_owned` B02 sources follow the Reference owned-zone set represented by the current runtime: `skill`, `hand`, or `attack_area`; removed/discard/deck sources do not apply. This is deliberately B02-scoped rather than a global reinterpretation of historical `source_owned` contracts.

Integration is limited to the existing authoritative paths:
- card power calculation;
- card-play mana calculation;
- legal skill activation filtering;
- combat participant power calculation;
- military-threshold scoring/elimination resolution.

No character ID, Chinese name, printed text, hash, or Reference-handler routing is present in production runtime. No generic script parser, generic replacement engine, selector system, or new ledger was added.

## Material accounting

Fresh mechanical frozen-roster recount on this working tree:
- Base material overlap: **155/944**
- Candidate material overlap: **157/944**
- Exact additions: `master.arcueid.skill.s3`, `master.twice.skill.ascension`
- Frozen-ID duplicates: **0**
- Frozen-ID removals: **0**

Formal project accounting remains **159/944**, **785** remaining until fresh independent R accepts the exact B02 Candidate and A synchronizes it. On exact acceptance, this batch is eligible for exactly **+2** fresh formal identities => **161/944**, **783** remaining. No credit is granted by this implementation report itself.

## Validation

Focused B02 production-path suite:
- `packages/rules/tests/f4-b02-owned-passive-modifier-migrations.test.ts`: **1 file / 9 tests PASS**
- actual F1 printed text and every clause SHA-256 recomputed from the authored material and matched frozen inventory hashes.

Affected regression bundle after the B01 historical-count compatibility correction:
- **12 files / 100 tests PASS**
- includes B01 batch suites, Atalanta S2, FB2-35, FB2-54, core combat resolver, core scoring resolver, game-loop card play/actions, MatchSession regressions, and pre-scoring Presence Concealment.

Additional gates:
- `npm run typecheck`: PASS
- `npm run content:validate`: PASS (`7 masters, 7 servants, 20 events, 0 blocking issues`)
- `git diff --check`: PASS
- production scan for `arcueid|twice|血之渴望|救世主` in changed runtime files: no matches

The one affected-bundle failure seen before the final run was a stale B01 test that hard-coded the entire repository material overlap as 155. Its semantic B01 assertions all passed. The compatibility-only fix retains exact-once B01 identities and changes the global total assertion to `>=155`, allowing subsequent accepted batches to add material without weakening B01 identity checks.

## Fresh R contract

Fresh independent R must review this exact Base/Candidate and this whole two-consumer batch as one review job. Do not split it into per-skill reviews. Review must confirm source evidence, structural fail-closed gateways, owned-zone liveness, tie-lowest combat power, authoritative elimination replacement, regression compatibility, material `155 -> 157`, and zero production identity routing.

Allowed verdict:
- `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`

Do not merge or retarget. On acceptance, A synchronizes exactly +2 formal identities, then immediately continues BATCH-FIRST F4 with the next coherent adjacent capability batch.
