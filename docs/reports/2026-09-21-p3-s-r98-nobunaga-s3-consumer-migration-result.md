# P3-S R98 Nobunaga s3 Consumer Migration Result

Role: Codex S
Status: `CANDIDATE_READY_FOR_FRESH_R`
Date: 2026-09-21

## Exact dispatch input

- Task: `P3-S-R98-NOBUNAGA-S3-CONSUMER-MIGRATION`
- Exact A dispatch Base: `7f65395057b0559574c938ecf4e1eb5ac3896cf9`
- A dispatch branch: `codex/a-p3-r98-nobunaga-s3-consumer-migration-dispatch`
- S branch: `codex/s-p3-r98-nobunaga-s3-consumer-migration`
- R98 FB2-47 acceptance-sync: `2da84659aeebc0a4043076425dac187e9af019bf`
- Accepted FB2-47 runtime Candidate: `79e8c89202acef86b522aba4695d8b97961c71fd`
- Canonical FB2-47 reviewer evidence: `https://github.com/binchen648/fd/pull/411#issuecomment-5753617134`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Frozen F1/source-evidence lineage: `6b09b635178822aa3f1e6bd6cd1c69672b09e8de`
- Formal project migration before/after this unreviewed S Candidate: **`149/944`**, remaining **`795`**.

## Migrated frozen identity

Exactly one frozen identity is added:

- canonical id: `servant.nobunaga.skill.sc-nobunaga-3`
- owner: `servant.nobunaga`
- owner name: `织田信长`
- class: `Archer`
- legacy id / alias: `sc_nobunaga_3`
- name: `尾张的大傻瓜`
- static metadata: cost `0`, basePower `7`, typeLabel `力量`, attributes `力量`, canonical skill-zone mana requirement `8`; historical Reference requirement `0` remains evidence only.

Frozen full printed text is exactly:

`被动：当你被【败北】时，获得3点战果。\n无前之谋-若你输掉战斗，失去2点战果。若你因此效果失去了战果，所有你战斗中的胜者获得2点战果。`

Full-text SHA-256: `25ad641852b74800c2e2f77531d24e8b254b8b68d3221653488147fb38342d3c`.

Frozen clauses are preserved independently:

- `fool-defeat-reward`: `被动：当你被【败北】时，获得3点战果`, SHA-256 `6a43f81f9660f303c7bc3501dd12fb3d35140dab198f7d680ba213f28e7fa890`;
- `reckless-strategy`: `无前之谋-若你输掉战斗，失去2点战果。若你因此效果失去了战果，所有你战斗中的胜者获得2点战果`, SHA-256 `ec51cf410c7eed80b2e6a4645a18096f294fdad6ff606f569ebfe2c380b0bd02`.

F1 provenance is `src/content/authoring/cards.json / skillCards[7]` plus the accepted Nobunaga source-evidence batch. Locked Reference independently confirms owner/class/legacy id/card face/text and is not used as runtime routing.

## Authoring implementation

`data/authoring/servants/servant.nobunaga.json` is a new standalone servant-skill archive containing exactly the dispatched s3 card:

- standard action / `controller_play_card_window` servant-skill envelope;
- Final Rules 9.4 `skill_zone_mana_at_least: 8`; printed cost remains `0`;
- `fool-defeat-reward` uses only accepted FB2-47: exact `forced_trigger` / `after_controller_defeated` / `event_player_is_controller` / fixed controller `adjust_victory_points +3`;
- `reckless-strategy` uses only accepted FB2-46: exact `forced_trigger` / `after_controller_loses_battle` / `event_player_is_controller` / `battle_loss_vp_then_reward_winners(lossAmount=2,winnerRewardAmount=2)`;
- both abilities carry empty targets/cost/creates/ruleModifiers/lifecycle/responseWindow/limit/visibility payloads and automatic execution;
- FB2-47 defeat facts settle before same-controller FB2-46 loss facts, preserving the frozen whole-card sequence `+3 -> -2 -> winner +2`;
- no production runtime code, identity/name routing, skill-id routing, Chinese runtime parsing, product registration, generated product edit or coverage-definition change.

## Runtime-focused evidence

`packages/rules/tests/nobunaga-s3-consumer-migration.test.ts` proves the migrated whole card through current loader and authoritative runtime paths:

1. exact archive identity, F1 lineage, Locked Reference metadata, full text and both clause hashes;
2. loader `report=[]`, card automatic, exactly two abilities, `isAcceptedControllerDefeatedVpRewardAbility(..., "compiled") === true` and `isAcceptedBattleLossVpWinnerRewardAbility(..., "compiled") === true`;
3. Final Rules 9.4 boundary: skill-zone play at 7 mana fails unchanged; at 8 mana succeeds, printed cost 0 charges no mana, and the source becomes active in attack area;
4. composed authoritative loss from 0 VP settles `fool-defeat-reward +3`, then `reckless-strategy -2`, then +2 to the winner, leaving p1/p2 at `1/3` from starting `0/1`;
5. a real ordinary battle loss from `resolveBattlefield` reaches the same complete route;
6. active Basic Luck authoritative loss suppression produces neither the defeated fact nor the loss transaction/winner reward;
7. a contradictory standalone defeated fact reusing an already processed root result id fails closed atomically under the accepted FB2-47 frozen-root provenance contract;
8. exact root replay is idempotent; product/generated outputs remain unregistered; frozen denominator stays 944, target is authored once, total overlap is 145, and duplicate frozen ids remain zero.

## Mechanical frozen accounting

A direct recount used the authoritative frozen inventory (`943 static + 1 dynamic = 944`) and all top-level `data/authoring/**/cards[]` ids.

Exact A dispatch Base `7f65395057b0559574c938ecf4e1eb5ac3896cf9`:

- authoring unique ids: `167`;
- frozen overlap: **`144/944`**;
- duplicate frozen ids: `0`;
- `servant.nobunaga.skill.sc-nobunaga-3` count: `0`.

S working tree:

- authoring unique ids: `168`;
- frozen overlap: **`145/944`**;
- duplicate frozen ids: `0`;
- `servant.nobunaga.skill.sc-nobunaga-3` count: `1`.

Therefore the Candidate material delta is exactly **+1 Nobunaga s3**, zero frozen removals, zero duplicate frozen ids and no second frozen identity. No stale absolute `144` compatibility snapshot was edited or added.

This material `145/944` overlap is Candidate evidence only. It does **not** change formal project migration credit before fresh independent R returns `MIGRATION_ACCEPTED` for the exact Candidate and A synchronizes that verdict.

## Validation / S recertification

`package-lock.json` is byte-identical to the already bootstrapped FB2-47 environment, so S reused the existing `node_modules` through a local junction and did not rerun `npm ci`.

Validation on the final working tree before Candidate commit:

- `npm.cmd run typecheck` — PASS.
- focused Nobunaga s3 + FB2-47 + FB2-46 + FB2-45 + Presence Concealment compatibility — PASS, **6 files / 56 tests**; Nobunaga s3 focused suite itself **8/8**.
- official `npm.cmd run test:ci -- --maxWorkers=2` — PASS, **174 files / 1251 tests**.
- `npm.cmd run content:validate` — PASS, **7 masters / 7 servants / 20 events / 0 blocking issues**.
- `npm.cmd run verify:generated-content` — PASS with unchanged hashes:
  - library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- `npm.cmd run phase3:reference:verify -- --reference-root E:\\Codex\\FD\\fd-reference --expected-commit b2f9fa15fba07c63530bbf4612b03b8b704755f9` — PASS.
- `npm.cmd run build --workspace @fd/client` — PASS; only existing Vite browser-externalization/chunk-size warnings.
- `npm.cmd run phase3:coverage` — PASS: **126 archives / 168 cards / 280 abilities / 0 blocking issues**, `newRuntimeSemanticRouted=22`, `dualRuntime=0`; generated `artifacts/phase3-skill-coverage.json` was restored byte-for-byte to exact Base/HEAD blob `ba7e18ad69e8b62e9ac0dfd2f94065ac3ce4850e` because it is validation output outside S scope.
- post-coverage recount: **145/944**, target count 1, duplicate frozen ids 0.
- production runtime/product/generated diff: empty.
- `git diff --check` — PASS.

These gates constitute S recertification for the dispatched exact Base. The exact Candidate SHA is established by the final commit and must be supplied together with this exact Base to fresh independent R.

## Candidate scope / next gate

The intended S Candidate contains exactly three paths:

- `data/authoring/servants/servant.nobunaga.json` — exactly one frozen card, Nobunaga s3;
- `packages/rules/tests/nobunaga-s3-consumer-migration.test.ts` — focused whole-card/runtime/accounting regression;
- this result report.

No production runtime, product pack, generated product output, client production code, Task Index, coverage artifact or second frozen identity belongs in the S Candidate.

Formal migration remains **`149/944`**, remaining **`795`**. This is only an S Candidate for fresh independent R; no migration acceptance or credit is claimed here.

Long-term S rule: **S 完成 recertification 并提交 Exact Base/Candidate**。
