# P3-S R88 Darius s2 Consumer Migration Result

Role: Codex S
Status: `CANDIDATE_READY`
Date: 2026-09-20

## Dispatch binding

- Exact A dispatch Base: `239682d7d91413efcdd818cbcdd0346720c02d45`
- Dispatch: `P3-A-R88-DARIUS-S2-CONSUMER-MIGRATION-DISPATCH`
- Exact frozen identity: `servant.darius.skill.sc-darius-2`
- F1 evidence commit: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Migration material

Extended the existing Darius servant archive with exactly one additional frozen card:

- `data/authoring/servants/servant.darius.json`
- preserved accepted `servant.darius.skill.sc-darius-1` unchanged;
- added only `servant.darius.skill.sc-darius-2` / `巴比伦之门`;
- legacy id `sc_darius_2`;
- static metadata: `特殊/宝具`, attributes `特殊` + `宝具`, cost 4, basePower 0, skill-zone threshold 8.

Frozen F1 whole printed text and clause are identical and both hash to:

- `9306d30ca4244bde6326a78944a19e633f1dd3735f5cf4d2b33c4215ac794c01`

Exact clause:

`【真名解放】打开冥府之门-行动阶段：你控制的【不死兵】获得+1威力且于本回合不会被关闭。`

The Locked Reference definition-id list is normalized without a new list-selector runtime into three exact structural `has_card_id` selectors:

- `servant.darius.skill.sc-darius-4`
- `card.skill.servant.darius.skill.sc-darius-4`
- `card.x-immortal`

For each id, the card installs exactly two `this_round` modifiers under the one automatic `open-underworld-gate` phase action:

- `add / card.currentPower / +1`;
- `forbid / card_close` through accepted FB2-42.

Both modifier families use `scope.controller=self` plus exactly one structural `has_card_id` constraint. The ability has source-active gating, action / `controller_action_window`, parent `this_round` lifecycle, and structural true-name release `revealsTrueName / on_use_declared / servant_package`.

No production runtime source, generated/product pack, or client production file was changed.

## Focused runtime evidence

Added `packages/rules/tests/darius-s2-consumer-migration.test.ts`, loading the real migrated Darius archive and proving:

1. exact F1 text/hash, Reference static metadata, threshold 8, and presence beside the already accepted s1;
2. loader `report=[]`, card/ability automatic mode, exact six normalized modifiers, and structural visibility;
3. all three controller-owned matching undead definitions move from power 2 to 3 and are close-protected;
4. an unrelated controller-owned definition and an opponent-controlled matching definition remain power 2 and are not close-protected;
5. a matching typed close rejects atomically while protection is live;
6. next round both power and close protection expire, and typed close succeeds;
7. closing/deactivating the Gate source makes both modifier families immediately non-live.

The existing R81 Darius s1 test had one archive-card-count assertion that intentionally assumed the owner archive contained only s1. It was minimally generalized to locate and validate the exact s1 card by id; all existing s1 semantic/hash/runtime assertions remain unchanged. This was required so adding the independently migrated s2 does not invalidate the prior consumer test for a non-semantic reason.

## Validation

Fresh worktree dependency setup followed the Windows environment protocol:

- `npm.cmd ci --ignore-scripts --offline`: PASS, 239 packages, 0 vulnerabilities.

Final validation after the minimal prior-test compatibility adjustment:

- `npm.cmd run typecheck`: PASS.
- Darius s1 + Darius s2 + FB2-42 focused: **3 files / 19 tests PASS**.
- rules `src/__tests__ + core + regression + Darius s1/s2 + FB2-42`: **85 files / 513 tests PASS**.
- official CI (`npm.cmd run test:ci -- --maxWorkers=2`): **164 files / 1153 tests PASS**.
- content validation: **7 masters / 7 servants / 20 events / 0 blocking issues**.
- generated-content determinism: PASS with unchanged hashes:
  - library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- exact Locked Reference verification: PASS at `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.
- client production build: PASS; only existing Vite browser externalization/chunk-size warnings.
- `git diff --check`: PASS.
- production runtime source diff: empty.

An earlier official-CI run before the compatibility adjustment correctly failed only the old R81 assertion that the Darius archive ids equal `[s1]`; no runtime behavior failed. After changing that assertion to locate exact s1 by id, the final official CI is fully green as recorded above.

## Frozen accounting

Mechanical frozen-roster recount:

- Base: **`139/944`**, duplicates `0`;
- Candidate material: **`140/944`**, duplicates `0`;
- exact added frozen identity: `servant.darius.skill.sc-darius-2` only;
- removals: `0`.

This branch-local exact +1 is migration evidence only. Formal project migration remains **`144/944`**, with **`800`** remaining until a fresh independent R returns `MIGRATION_ACCEPTED` for the exact Candidate and A synchronizes that acceptance.

No merge or retarget is authorized.
