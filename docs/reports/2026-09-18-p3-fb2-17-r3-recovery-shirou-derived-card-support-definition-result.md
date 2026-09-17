# P3-FB2-17-R3 Recovery Shirou Derived-Card Support Definition Result

Date: 2026-09-18
Role: Codex S
Status: **SUPPORT_DEFINITION_COMPLETE_CANDIDATE**
Credit: zero frozen-migration credit

## Exact base and authority

- Exact A blocker-synchronization base: `1ef5262abb7d6c55edef8d98e2bc127b631f5d0b`.
- Fresh R2 blocker: `d020adc97f53b16371109b5aaa1ecd77bab6be0b`.
- Accepted FB2-18 candidate: `cb81559033db6b96b1f26cf7d9bd15686db5d4fb`.
- Accepted FB2-19 revised candidate: `211ba4994acaf063834c28bef9525366b88ae463`, accepted by fresh R44-R2.
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`.
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.
- Target: `card.derived.master.shirou-emiya.ganjiang-moye`.

Historical FB2-17-R3 work is technical evidence only. This candidate was rebuilt and fully validated on the current integrated recovery lineage.

## Product result

Exactly one non-frozen support-only archive is added and registered only through `authoringMasterSupportFiles`:

- archive id `master.shirou-emiya`;
- exact discriminator `master_support_definition_archive`;
- no `publicInformation`;
- no deck;
- exactly one card, `card.derived.master.shirou-emiya.ganjiang-moye`.

The card preserves the source-grounded static contract:

- `cardType: master_skill`;
- exact `initialPlacement: outside_game`;
- owner `master.shirou-emiya`;
- cost/basePower `1/5`;
- attributes Strength + Noble Phantasm;
- exact `skill_zone_mana_at_least = 8` requirement;
- ordinary controller action timing;
- exact FB2-16 required-additional marker: passive, exact `while_active`, effect exactly `append_only_rule`, automatic execution, no extra marker fields.

The R2 blocker was only a stale aggregate product-count assertion. R3 changes that single authorized test baseline from `70` to `71`; no structural assertion is weakened and no loader/compiler/runtime implementation changes.

## Product-boundary evidence

Fresh generated-product probe proves:

- playable masters: `7`;
- servants: `7`;
- executable cards: `71`;
- executable characters: `14`;
- target registered exactly once;
- target owner: `master.shirou-emiya`;
- target `initialPlacement: outside_game` with no `initialZone`;
- target is classified as `attack / attack_area` by accepted FB2-16 semantics;
- no `master.shirou-emiya` executable character;
- no Shirou fallback mapping or generated command-spell card;
- no Shirou deck;
- existing playable roster and fixture remain unchanged.

The generated diff is limited to `data/generated/fd-playtest-v1.content-library.json`. The fixture and evidence-report hashes remain unchanged. Existing normal archives retain their ordering; the support archive is appended through the dedicated support channel.

All eleven frozen FM09 provisioning targets remain absent from canonical authoring (`0/11`):

- `master.bazett.skill.s2`
- `master.caules-yggdmillennia.skill.s2`
- `master.caules-yggdmillennia.skill.s3`
- `master.ciel.skill.s2`
- `master.fujino.skill.s3`
- `master.shiki-nanaya.skill.s2`
- `master.shiki-ryougi.skill.s2`
- `master.shiki-ryougi.skill.s3`
- `master.shiki-tohno.skill.s2`
- `master.zouken.skill.s3`
- `master.zouken.skill.s4`

The derived target is outside the frozen 944 denominator and therefore adds no frozen migration credit.

## Fresh validation

- `npm ci --offline`: PASS, 239 packages, 0 vulnerabilities.
- `npm run typecheck`: PASS.
- `npm run content:validate`: **7 masters / 7 servants / 20 events / 0 blocking issues**.
- Official `npm run content:compile`: PASS.
- `npm run verify:generated-content`: PASS:
  - content library `c9841d4bad3d43a525895372fabd3b49ea07e79075652a5cbd18fad3405e2e1e`;
  - fixture unchanged `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence report unchanged `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- Focused loader/compiler + FB2-15/16/18: **5 files / 94 tests PASS**.
- Official full `test:ci`: **129 files / 835 tests PASS**.
- Rules core + regression: **69 files / 420 tests PASS**.
- Client production build: PASS; only the existing Vite `node:crypto` browser-externalization warning remains.
- Locked Reference verification at `b2f9fa15fba07c63530bbf4612b03b8b704755f9`: PASS.
- Phase 3 material coverage after registering this non-frozen support definition:
  - archives `99`, cards `134`, abilities `233`;
  - compiled cards `71`, compiled characters `14`, blockers `0`;
  - runtime buckets `22/3/128/0/80/126`;
  - compiled definition hash `15ab276d8333a7c9a9a60fec2ba1474396343733c08b41d1ab6693371764ef4a`.
- Automation audit: `legacyResolveEffect=128`, `legacyExecuteAbility=3`, `notClassifiable=80`, `promotionFindings=20`.
- `git diff --check`: PASS.

The coverage/audit material counters increase because this task intentionally registers one non-frozen archive/card/ability. Those counters are not the frozen denominator. Accepted frozen overlap remains **111/944 = 11.76%**, leaving **833/944**.

Coverage/audit command-generated artifact rewrites were restored after recording their outputs; they are not candidate files.

## Exact scope

Candidate scope is exactly:

1. `data/authoring/masters/master.shirou-emiya.json`;
2. `data/packs/fd-playtest-v1/pack.json`;
3. `data/generated/fd-playtest-v1.content-library.json`;
4. `packages/rules/tests/executable-card-pack.test.ts` — only aggregate count `70 -> 71`;
5. this result report.

No production `packages/` implementation, runtime/compiler behavior, scripts, taxonomy/KPI, Reference, fixture, evidence-report, frozen skill, UI/server, or unrelated generated output changes.

## Next gate

This is a support-definition candidate, not accepted dependency evidence. The next legal steps are fresh A material synchronization followed by fresh independent P3-R45-RECOVERY review. Do not resume FM09 or dispatch another target dependency before those gates complete.