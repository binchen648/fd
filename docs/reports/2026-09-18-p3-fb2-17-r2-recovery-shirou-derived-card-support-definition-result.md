# P3-FB2-17-R2 Recovery Shirou Derived-Card Support Definition Retry Result

Date: 2026-09-18
Role: Codex S
Status: **SUPPORT_DEFINITION_BLOCKED**
Credit: zero frozen-migration credit

## Exact base and authority

- Exact post-R44-R2 A acceptance-sync base: `2756ffe13d4bc181b4a00032afd1d9475064fc00`.
- Accepted FB2-18 candidate: `cb81559033db6b96b1f26cf7d9bd15686db5d4fb`.
- Accepted FB2-19 revised candidate: `211ba4994acaf063834c28bef9525366b88ae463`.
- Fresh R44-R2 verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`.
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`.
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.
- Target: `card.derived.master.shirou-emiya.ganjiang-moye`.

Historical FB2-17-R2/R3 outcomes were not inherited. This retry was rebuilt and executed from the current recovery lineage.

## Result

The accepted FB2-18 and revised FB2-19 seams now represent the exact support definition correctly. Official content validation, compilation, and deterministic generation succeed. The required focused gate nevertheless exposes one stale production test baseline outside this task's May-touch scope:

```text
packages/rules/tests/executable-card-pack.test.ts:51
expected executable card count 70, received 71
```

The authorized support definition adds exactly one executable card, so `70 -> 71` is the expected product delta. R2 may not edit `packages/`, and therefore may not normalize this hard-coded count assertion. The task stops as `SUPPORT_DEFINITION_BLOCKED` rather than widening scope.

## Experimental support-definition evidence

The preserved uncommitted experiment changes only:

- `data/authoring/masters/master.shirou-emiya.json` (new support-only archive);
- `data/packs/fd-playtest-v1/pack.json` (registration under `authoringMasterSupportFiles` only);
- `data/generated/fd-playtest-v1.content-library.json` (official deterministic output).

The evidence report and fixture remain byte-for-byte at their checked-in hashes; no other generated output changes.

The support archive uses exact `archiveType: "master_support_definition_archive"`, id `master.shirou-emiya`, no `publicInformation`, no `deck`, and exactly one card. The card preserves the source-grounded static contract: `master_skill`, exact `initialPlacement: "outside_game"`, cost/basePower `1/5`, attributes `力量` + `宝具`, exact 8-mana play requirement, ordinary action/controller timing, and the exact FB2-16 bare `append_only_rule` automatic marker.

Fresh generated-product probe proves:

- playable masters: `7`;
- servants: `7`;
- executable cards: `71` (`70 + 1`);
- executable characters: `14`;
- target exists exactly once with owner `master.shirou-emiya`;
- `initialPlacement = outside_game` and `initialZone` absent;
- `playKind = attack`, `destinationZone = attack_area` through accepted FB2-16 classification;
- no `master.shirou-emiya` executable character;
- no Shirou fallback-command mapping or generated command-spell card;
- no Shirou deck.

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

The derived target is present exactly once in the experiment and remains outside the frozen 944 denominator.

## Fresh verification

- Fresh starting HEAD/status: PASS at exact base `2756ffe13d4bc181b4a00032afd1d9475064fc00`, initially clean.
- `npm ci --offline`: PASS, 239 packages, 0 vulnerabilities.
- `npm run typecheck`: PASS.
- `npm run content:validate`: **7 masters / 7 servants / 20 events / 0 blocking issues**.
- Official `npm run content:compile`: PASS.
- `npm run verify:generated-content`: PASS.
  - content library: `c9841d4bad3d43a525895372fabd3b49ea07e79075652a5cbd18fad3405e2e1e`;
  - fixture unchanged: `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence report unchanged: `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- Required focused run: **5 files / 93 PASS / 1 FAIL**.
  - content loader: `21/21 PASS`;
  - FB2-18 outside-game placement: `9/9 PASS`;
  - FB2-15 provisioning: `7/7 PASS`;
  - FB2-16 required-additional: `8/8 PASS`;
  - executable-card-pack: `48 PASS / 1 FAIL`;
  - sole failure: hard-coded expected card count `70`, actual `71`.
- The FB2-19 support-only compiler test and all three R44-R1 discriminator regressions pass in this product proposal.
- Full `test:ci` was not run because the required focused gate did not pass and the handoff requires full CI only after focused/content gates pass.
- `git diff --check`: PASS before blocker reporting.

## Scope and accounting

No `packages/`, runtime/compiler, scripts, taxonomy/KPI, Reference, UI/server, other authoring archive, or frozen skill is modified by the experiment. R2 does not repair the scope-external count assertion.

The three authorized experimental product changes remain uncommitted evidence and are not accepted product authority. Only this blocker report is committed on the S branch.

This task adds zero frozen identity. Accepted overlap remains **111/944 = 11.76%**, leaving **833/944**. P3-FM09 remains `MIGRATION_BLOCKED`.

## Required follow-up

A must synchronize this blocker and authorize a separate, narrow production-count baseline repair before another support-definition retry. That repair must not absorb the Shirou definition, change runtime/compiler semantics, or take migration credit.