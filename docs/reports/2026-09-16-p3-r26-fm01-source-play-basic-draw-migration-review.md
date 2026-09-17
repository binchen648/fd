# P3-R26 FM01 Source-Play + Basic-Attack Draw Migration Review

Date: 2026-09-16
Role: R
Status: MIGRATION_ACCEPTED
Reviewed lineage: `3b11668ba894d24dce9eef500d34ee74b1680355`
S candidate: `6203b70c5bc2a81ceecca31008dc2b71246519a9`
FB2-08 runtime acceptance: `33f0a0e1b3e9c4c62c8eb713ae45cd7117c7a0a7`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`

## Verdict

ACCEPT P3-FM01 as the first F4 migration batch for exactly the authorized 14 Riding-family identities.

The migration adds 13 minimal canonical authoring archives and reuses the pre-existing Drake canonical representative unchanged. No runtime implementation, identity routing, taxonomy definition, KPI definition, generated playtest content, or unrelated authoring is promoted by this judgment.

## Independent membership and source findings

1. Exact authorized membership is 14/14 and no additional frozen-F1 identity is migrated.
2. The 13 newly added authoring archives are exactly the 13 non-Drake batch members; each contains only its selected target skill card.
3. `servant.drake.skill.sc-drake-1` is the pre-existing 14th representative and is unchanged by the migration lineage.
4. Source/printed text preservation passes for all 14 members using the frozen full-text SHA-256 `0514b5cce67642f6c5215fe348f433ce3638806be3af558ac845d39310a3d2b1` and clause hashes `88e0daa4be5047709147c103b33305e34b428e053e34ff8c90d5065252a9bebc` / `cbdff481f797da49ce7639a279842cc6f0e9fda622b584bcc42103065bc2c5c8`.
5. All 13 new cards preserve the common printed static shape `cost=3`, `basePower=0`; the skill-zone play requirement follows final rule 9.4 at 8 mana rather than the historical Reference metadata field `requirement=3`.
6. Hephaistion remains a Pretender owner while the selected card preserves the Rider-Class Riding skill semantics; no owner-class hardcoding is introduced.

## Accepted-contract conformance

Each migrated card is the same two-part semantic composition already independently accepted before FM01:

- TO13: private optional controller-hand selection `0..3`, sole `base_power_at_most: 3` constraint, then `play_selected_cards`;
- FB2-06: fixed controller draw primitive;
- FB2-08: exact forced `on_card_played` trigger requiring active source plus another same-controller face-up basic attack in the same authoritative play batch, then draw exactly 1.

Reviewer structural comparison of the 26 newly visible abilities against Drake's two accepted representative abilities reports `STRUCTURAL_MISMATCHES=0`.

## Independent burn-down and coverage reconciliation

- Frozen F1 denominator: 944 identities.
- Canonical authoring overlap before FM01: 24.
- Canonical authoring overlap after FM01: 37.
- Net global increase: +13, exactly the 13 newly added non-Drake identities.
- Exact FM01 batch coverage: `1/14 -> 14/14`.
- Unauthorized F1 additions: 0.
- Fresh raw coverage: `archives=27`, `cards=59`, `abilities=118`.
- Raw routing counters: `new=12 / legacyExecute=3 / legacyResolve=75 / dual=0 / notClassifiable=28 / taxonomyWarnings=92`.
- Compiled definition hash remains `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`, with 70 cards, 14 characters, 0 blocking issues.
- `unclassifiedItems` is unchanged from the pre-migration baseline.
- Compiled product identity is unchanged from the pre-migration baseline.
- Reviewer-regenerated coverage is JSON-equivalent to the A-committed material artifact after removing only `generatedAt`.

The raw `legacyResolveEffect` increase from 49 to 75 is not judged a runtime fallback regression: the reporter already labels the independently accepted Drake representative abilities with the same `LEGACY_RESOLVE_EFFECT` route. The 26 newly visible abilities reproduce those accepted structural signatures exactly. This review does not change the coverage classifier or redefine any KPI.

## Independent validation

- Exact reviewed lineage pinned: `3b11668ba894d24dce9eef500d34ee74b1680355`.
- Runtime hot-file audit: 0 changed runtime hot files.
- Drake diff audit: unchanged.
- Source hashes: 14/14 PASS.
- Burn-down reconciliation: PASS (`24 -> 37`, batch `1/14 -> 14/14`).
- Typecheck: PASS.
- Focused FM01 + FB2-08 + TO13 compatibility: 3 files / 30 tests PASS.
- Content validation: 7 masters / 7 servants / 20 events / 0 blocking issues.
- All rules regressions: 47 files / 280 tests PASS.
- Full CI: 114 files / 693 tests PASS.
- Generated-content determinism: PASS with unchanged hashes:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`
- Fresh reviewer coverage matches A material coverage except `generatedAt`: PASS.
- Diff check: PASS.

## Accepted migration scope

`MIGRATION_ACCEPTED` applies only to these 14 exact Riding-family F1 identities under the already accepted TO13 + FB2-06 + FB2-08 contracts. It does not broaden Trigger, Card Zone, Card Action PLAY, Interaction, source text interpretation, or roster-wide migration acceptance.

## Not promoted

- any identity outside the exact FM01 14-ID list;
- Okita or repeat-play semantics;
- broad Trigger Gateway or generic `on_card_played`;
- broad Card Action PLAY or generic Card Zone;
- variable/third-party draw semantics;
- coverage/taxonomy classifier changes;
- client/Gate C work;
- unrelated authoring or runtime changes.
