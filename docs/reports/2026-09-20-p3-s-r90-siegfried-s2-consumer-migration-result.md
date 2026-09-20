# P3-S R90 Siegfried s2 Consumer Migration Result

Role: Codex S
Status: `CANDIDATE_READY`
Date: 2026-09-20

## Dispatch binding

- Exact A dispatch Base: `04e98a696ef119b9f6f9cdd0b86f7ce471ad9c7c`
- Dispatch: `P3-A-R90-SIEGFRIED-S2-CONSUMER-MIGRATION-DISPATCH`
- Exact frozen identity: `servant.siegfried.skill.sc-siegfried-2`
- Accepted FB2-43 runtime Candidate: `19ff09ed65e34f241d332250e1cc1370071ecf75`
- F1 evidence commit: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Migration material

Added one standalone servant archive only:

- `data/authoring/servants/servant.siegfried.json`
- one card only: `servant.siegfried.skill.sc-siegfried-2` / `恶龙之血铠`
- owner `servant.siegfried`, class `Saber`, legacy id `sc_siegfried_2`
- card face: `宝具`, attributes `[宝具]`, cost `3`, basePower `9`
- explicit accepted servant skill-zone threshold `8`

Frozen F1 whole printed text and the single ability clause are identical and both hash to:

- `7203c9276b4653d632bec22e8c81567db4b26e4e1c9db2d60f4031989990eacb`

Exact frozen text:

`【真名解放】
若你的真名已经公开并处于交战状态，当一名对手移动至你所在的战场时，关闭此牌。`

The whole card is normalized only through already accepted identity-free vocabulary:

1. `forced_trigger` on authoritative `after_controller_enters_location`, with active-source gating;
2. conditions `source_active`, `controller_servant_revealed`, `at_battlefield`, accepted R70/FB2-31 `event_player_is_opponent`, and accepted R90/FB2-43 exact type-only `event_location_equals_controller`;
3. existing typed `close_source_card` effect;
4. structural true-name visibility `revealsTrueName / on_use_declared / servant_package`;
5. automatic execution.

No production runtime source, second frozen identity, product/generated registration, or client production source changed.

## Focused runtime evidence

Added `packages/rules/tests/siegfried-s2-consumer-migration.test.ts`, loading the real standalone archive and proving:

1. exact F1 text/hash and Locked Reference static metadata;
2. exact one-card archive and accepted-contract evidence;
3. loader `report=[]`, card/ability automatic mode, exact normalized trigger/condition/effect composition, and structural true-name release;
4. the real game-loop movement producer moves an opponent from `magic_workshop` to controller battlefield `miyama_town`, emits the authoritative enter-location event, and closes the source;
5. opponent movement elsewhere, self movement, unrevealed servant, non-battlefield controller, and inactive source all fail closed;
6. the migration remains outside product pack/generated outputs;
7. current frozen authoring overlap is exactly `141/944` with no duplicate frozen ids and the target present exactly once.

## Validation

Fresh worktree dependency setup:

- `npm.cmd ci --ignore-scripts --offline`: PASS, 239 packages, 0 vulnerabilities.
- The first focused invocation occurred before TypeScript workspace outputs existed and therefore stopped during test collection on missing `@fd/content/rules`; no test executed and no semantic failure occurred. Running the required `npm.cmd run typecheck` generated the normal workspace `dist` outputs, after which all test gates passed.

Final validation:

- `npm.cmd run typecheck`: PASS.
- Siegfried s2 + FB2-43 focused: **2 files / 16 tests PASS**.
- rules `src/__tests__ + core + regression + Siegfried s2 + FB2-43`: **84 files / 510 tests PASS**.
- official CI (`npm.cmd run test:ci -- --maxWorkers=2`): **166 files / 1169 tests PASS**.
- content validation: **7 masters / 7 servants / 20 events / 0 blocking issues**.
- generated-content determinism: PASS with unchanged hashes:
  - library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- exact Locked Reference verification: PASS at `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.
- client production build: PASS; only existing Vite `node:crypto` browser-externalization and chunk-size warnings.
- `git diff --check`: PASS.
- production runtime source diff: empty.
- product/generated/client production diff: empty.

## Frozen accounting

Independent recount against the authoritative `943 static + 1 dynamic = 944` frozen set, comparing the exact A dispatch worktree to this S worktree:

- exact Base HEAD: `04e98a696ef119b9f6f9cdd0b86f7ce471ad9c7c`;
- Base frozen overlap: **`140/944`**, duplicates `0`;
- Candidate material overlap: **`141/944`**, duplicates `0`;
- exact frozen addition: `servant.siegfried.skill.sc-siegfried-2` only;
- frozen removals: `0`;
- target count: Base `0` -> Candidate `1`.

This branch-local exact +1 is migration evidence only. Formal project migration remains **`145/944`**, with **`799`** remaining until a fresh independent R returns `MIGRATION_ACCEPTED` for the exact committed Candidate and A synchronizes that acceptance.

No merge or retarget is authorized.
