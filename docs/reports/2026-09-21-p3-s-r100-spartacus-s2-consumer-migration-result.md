# P3-S R100 Spartacus s2 Consumer Migration Result

Role: Codex S
Status: `CANDIDATE_READY_FOR_FRESH_R`
Date: 2026-09-21

## Exact dispatch input

- Task: `P3-S-R100-SPARTACUS-S2-CONSUMER-MIGRATION`
- Exact A dispatch Base: `517d483d9ff292fe97c6c9f5d5def020dec1ac4b`
- A dispatch branch: `codex/a-p3-r100-spartacus-s2-consumer-migration-dispatch`
- S branch: `codex/s-p3-r100-spartacus-s2-consumer-migration`
- R100 FB2-48 acceptance-sync: `ff6aeba3cafa63e1be9002c549a94be9d54da2d5`
- Accepted FB2-48 runtime Candidate: `14c8688c201d4d39a85843470be6b79eec01853d`
- Canonical FB2-48 reviewer evidence: `https://github.com/binchen648/fd/pull/413#issuecomment-5754051359`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- F1/source lineage: S `80aaa029ff20448b92afc4fd115080cd3f34a60c` -> A `4961de83468716cc748f16faf9f03212c47a8713` -> accepted R `9d92b036332fc22df07ccb8f26af0bc69c066b34`.
- Formal project migration before/after this unreviewed S Candidate: **`150/944`**, remaining **`794`**.

## Migrated frozen identity

Exactly one frozen identity is added:

- canonical id: `servant.spartacus.skill.sc-spartacus-2`
- owner: `servant.spartacus`
- owner name: `斯巴达克斯`
- class: `Berserker`
- legacy id / alias: `sc_spartacus_2`
- name: `伤兽的咆哮`
- card face: type/attribute `宝具`, cost `3`, basePower `4`, canonical skill-zone mana requirement `8`.

Frozen full printed text and sole clause are exactly:

`受虐之荣光-战斗阶段：战斗后获得X点战果，X为与你交战的任意一名对手的合计威力的五分之一（向下取整）。`

- source ability id: `wounded-beast-roar-reward`
- F1 source: `src/content/authoring/cards.json / skillCards[24].abilities[0].printedClause`
- full/clause SHA-256: `cc5be3d123f96a8199e6c07bdae9161b93829c7b52cab2e838cb2a19b592996e`.

Locked Reference independently confirms owner/class/legacy id/card face/text/requirement 8 and is not used as identity-specific runtime routing.

## Authoring implementation

`data/authoring/servants/servant.spartacus.json` is a new standalone servant-skill archive containing exactly the dispatched s2 card:

- standard action / `controller_play_card_window` servant-skill envelope;
- exact `skill_zone_mana_at_least: 8`; printed cost remains 3 and basePower remains 4;
- sole residual ability uses only accepted FB2-48: `after_battle_result_determined`, `requiresSourceState: active`, exact ordered conditions `source_active` then `event_location_equals_controller`, and one `combat_opponent_power_vp_reward` compound effect;
- targets/cost/creates/ruleModifiers are empty; lifecycle is exact `duration: while_active`; responseWindow/limit/visibility are empty; execution is automatic;
- runtime selection/reward is server-owned from the frozen authoritative battle result: exactly one opponent and controller reward `floor(frozenSelectedOpponentPower / 5)`;
- no generic selector/formula vocabulary is authored, and no production runtime, identity/name routing, Chinese parsing, product registration or generated product output is changed.

## Runtime-focused evidence

`packages/rules/tests/spartacus-s2-consumer-migration.test.ts` proves the migrated whole card through current loader and runtime paths:

1. exact archive identity, accepted F1 S/A/R lineage, locked static metadata, text and SHA-256;
2. loader `report=[]`, card automatic, one ability, and `isAcceptedCombatOpponentPowerVpRewardAbility(..., "compiled") === true`;
3. skill-zone play at 7 mana fails unchanged; at 8 mana succeeds, charges exact printed cost 3 (8 -> 5), moves source to attack area and marks it active/face-up for the current round;
4. authoritative frozen root stages exact owner-only non-cancellable one-opponent choice; frozen power 14 grants +2 VP and frozen power 24 grants +4 VP;
5. trigger-time frozen power remains authoritative after later board mutation and exact root replay is idempotent;
6. inactive source, controller/root-battlefield mismatch, and malformed missing power snapshot do not stage a decision;
7. the real post-scoring `stepGameLoop` producer supplies frozen participant powers to the already-played whole card;
8. product/generated outputs remain unregistered and frozen material accounting is exactly 146/944 with target count one and no duplicate frozen ids.

## Authorized historical compatibility edit

A dispatch mechanically proved that `packages/rules/tests/nobunaga-s3-consumer-migration.test.ts` still contained historical repository-wide `expect(overlap).toHaveLength(145)`.

This Candidate applies only the authorized stability correction:

- removes the local computed `overlap` value and that historical absolute 145 assertion;
- preserves frozen denominator `944`;
- preserves duplicate frozen ids `[]`;
- preserves Nobunaga s3 authored exactly once;
- changes no Nobunaga production data, runtime semantics, identity, text, hash, or other regression assertion.

The Spartacus focused test now owns the current exact repository accounting assertion `146/944`.

## Mechanical frozen accounting

A direct recount used the authoritative frozen inventory (`943 static + 1 dynamic = 944`) and every top-level `data/authoring/**/cards[]` id.

Exact A dispatch Base `517d483d9ff292fe97c6c9f5d5def020dec1ac4b`:

- authoring unique ids: `168`;
- frozen overlap: **`145/944`**;
- duplicate frozen ids: `0`;
- Spartacus s2 count: `0`.

Final S working tree:

- authoring unique ids: `169`;
- frozen overlap: **`146/944`**;
- duplicate frozen ids: `0`;
- Spartacus s2 count: `1`;
- Nobunaga s3 count remains `1`.

Therefore the Candidate material delta is exactly **+1 Spartacus s2**, zero frozen removals, zero duplicate frozen ids, and no second frozen identity. Material 146/944 is Candidate evidence only and does not alter formal migration credit before fresh R `MIGRATION_ACCEPTED` plus A synchronization.

## Validation / S recertification

`package-lock.json` is Git-blob identical to the already bootstrapped FB2-48 environment, so S reused that local `node_modules` through a junction instead of rerunning `npm ci`.

Validation on the final working tree before Candidate commit:

- `npm.cmd run typecheck` — PASS.
- focused Spartacus s2 + FB2-48 + Nobunaga compatibility — PASS, **3 files / 26 tests**; Spartacus suite **8/8**.
- adjacent battle/interaction compatibility — PASS, **8 files / 76 tests**.
- official `npm.cmd run test:ci -- --maxWorkers=2` — PASS, **176 files / 1269 tests**.
- `npm.cmd run content:validate` — PASS, **7 masters / 7 servants / 20 events / 0 blocking issues**.
- `npm.cmd run verify:generated-content` — PASS with unchanged hashes:
  - library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- exact Locked Reference verification — PASS at `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.
- `npm.cmd run build --workspace @fd/client` — PASS; only existing Vite browser-externalization/chunk-size warnings.
- `npm.cmd run phase3:coverage` — PASS: **127 archives / 169 cards / 281 abilities / 0 blocking issues**, `newRuntimeSemanticRouted=22`, `dualRuntime=0`; generated coverage artifact restored byte-for-byte to HEAD blob `ba7e18ad69e8b62e9ac0dfd2f94065ac3ce4850e`.
- `npm.cmd run phase3:automation-audit` — PASS: `legacyResolveEffect=144`, `legacyExecuteAbility=3`, `notClassifiable=112`, `promotionFindings=20`; audit artifact restored byte-for-byte to HEAD blob `20e9fdc3fcd83edad255746db190e681ea1e8fd0`.
- post-validation recount: **146/944**, target count 1, Nobunaga count 1, duplicates 0.
- production runtime / product pack / generated product / client production diff — empty.
- `git diff --check` — PASS.

These gates constitute S recertification for the dispatched exact Base. The exact Candidate SHA is established by the final commit and must be supplied with the exact Base to fresh independent R.

## Candidate scope / next gate

The intended S Candidate contains exactly four A-authorized paths:

- `data/authoring/servants/servant.spartacus.json` — exactly one frozen card, Spartacus s2;
- `packages/rules/tests/spartacus-s2-consumer-migration.test.ts` — focused whole-card/runtime/accounting regression;
- `packages/rules/tests/nobunaga-s3-consumer-migration.test.ts` — compatibility-only removal of the stale global overlap snapshot;
- this result report.

No production runtime, product pack, generated product output, client production code, Task Index, validation artifact, or second frozen identity belongs in the S Candidate.

Formal migration remains **`150/944`**, remaining **`794`**. This is only an S Candidate for fresh independent R; no migration acceptance or credit is claimed here.

Task-local S requirement for this dispatched task only: **S 完成 recertification 并提交 Exact Base/Candidate**。This was not a standing S rule and must not be inherited by later S tasks unless their own current formal task explicitly requires it.
