# P3-A FB2-13 Synchronization and FM07 Dispatch

Date: 2026-09-16
Role: Codex A
Status: `SYNCHRONIZED`
R37: `dc96afa3253dcf86a13e13ea29c8b99fb895df49`
FB2-13 candidate: `18f2733eb0551f368e78a5f67ad9a32b96193d5b`
A handoff: `61d9f0c92e0af7598e237b71fb90ad83c13c88c1`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Fresh A recertification

- `npm.cmd run typecheck`: PASS.
- FB2-13 focused regression: `7/7 PASS`.
- `npm.cmd run content:validate`: `7 masters / 7 servants / 20 events / 0 blocking issues`.
- deterministic generated-content hashes remain unchanged:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- fresh coverage remains archives `80`, cards `113`, abilities `212`.
- raw routing remains `new=22 / legacyExecute=3 / legacyResolve=127 / dual=0 / notClassifiable=60 / taxonomyWarnings=124`.
- compiled definition hash remains `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333` with `70` cards / `14` characters / `0` blocking issues.

The regenerated coverage artifact differs only by `generatedAt` and static runtime source-line offsets caused by the accepted FB2-13 implementation. It is intentionally not committed.

## Accepted runtime boundary

R37 independently accepted the exact identity-free FB2-13 contract:

- authoritative target is the controller's just-played, face-up, active attack-area card bound to the trusted current `on_card_played` event;
- reverse-capable targets use physical instance `reversed` state; non-reversal targets replace their effective mutable attribute subset from `力量 / 迅捷 / 魔术`, including the empty subset;
- effective attributes are observable by later attribute constraints/event checks and authored combat tags without mutating printed card definitions;
- regular variant transforms then reuses typed close-source settlement;
- EX variant reuses fixed controller mana for exactly 3, keeps source active, and is once per round;
- attribute selection is server-owned and payment/use is deferred until final revalidated settlement;
- transient transform state clears on all audited board-exit paths.

This does not accept broad Trigger, broad transform, a generic client transform target, identity/name/printed-text routing, or any authoring migration by implication.

## Frozen-F1 / Reference reconciliation

Accepted canonical overlap remains `91/944`; FB2-13 runtime acceptance adds no migration credit.

R37 independently reconciled exactly ten currently absent F1 identities to locked Reference handler `core.alter-ego-transform`:

1. `servant.douman.skill.sc-douman-3`
2. `servant.koyanskaya.skill.sc-koyanskaya-1`
3. `servant.mechaeli.skill.sc-mechaeli-3`
4. `servant.meltryllis.skill.sc-meltryllis-3`
5. `servant.muramasa.skill.sc-muramasa-3`
6. `servant.okita-alt.skill.sc-okita-alt-1`
7. `servant.passionlip.skill.sc-passionlip-1`
8. `servant.sitonai.skill.sc-sitonai-3`
9. `servant.taisui.skill.sc-taisui-1`
10. `master.sion.skill.s12`

The first nine share frozen source-text SHA:

`b6c74ac37a50b671ded913dbc6ae6736f2057904fe4c02924d79f84971cebbdf`

Sion EX has distinct frozen source-text SHA:

`43c84de7cf6532ee6b561d8cfa35ddbdeac52850f6105684b23a82121636a892`

Locked Reference separates the same core handler into two structural variants: nine regular identities close the source after a successful transform; Sion EX has fixed ability cost 3, `alterEgoCloseSource: false`, keeps the source active, and is once per round. Frozen F1 presence is `10/10`; current canonical authoring presence is `0/10`; there is no eleventh still-absent F1 identity in this Reference handler family.

## FM07 dispatch

P3-FM07 is READY at exact batch size 10.

S must materialize only the ten identities above in minimal canonical authoring archives, preserving frozen text/evidence and locked Reference metadata. The nine regular cards and Sion EX must remain separate structural variants under the same accepted FB2-13 runtime core. Runtime files, taxonomy/KPI logic, unrelated Alter Ego cards, and unrelated reverse-capable cards are out of scope.

Material overlap may become `101/944` after the ten canonical archives are added. Accepted overlap remains `91/944` until the S candidate is synchronized and independently migration-accepted.
