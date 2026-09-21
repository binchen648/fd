# P3-S R92 Leonidas s1 Consumer Migration Result

Role: Codex S
Task: `P3-S-R92-LEONIDAS-S1-CONSUMER-MIGRATION`
Status: `CANDIDATE_READY`
Date: 2026-09-20
Branch: `codex/s-p3-r92-leonidas-s1-consumer-migration-r2`
Exact Base: `88bd84b484dc4d7841a06b2338ef83c3492b8f33`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Scope

This migration materializes exactly one frozen identity: `servant.leonidas.skill.sc-leonidas-1` (`炎门守护者`).

Authorized production content change is only `data/authoring/servants/servant.leonidas.json`. A scope correction at exact Base `88bd84b484dc4d7841a06b2338ef83c3492b8f33` additionally authorizes only the historical compatibility-test edit in `packages/rules/tests/siegfried-s2-consumer-migration.test.ts`: remove its obsolete repository-wide `141` overlap snapshot while preserving frozen denominator `944`, zero duplicate frozen ids, and Siegfried s2 authored exactly once. No runtime source, Siegfried production semantics, product pack, generated product output, or second frozen identity is changed.

## Exact whole-card normalization

The standalone archive preserves the frozen full printed text SHA-256 `0d2672d5170981de388f5f5d9f44ed5bff196c8c84c588f0f52becb64276a2d4`, the two frozen clause hashes `6eb9eb37e4bd20374395ec9cb2023eb3e1df8177f7628feabd880044fde53c5d` / `44a5359096c7cd6908fb65eda8cf4e229f054a29a00e52e31bdda619b8bdd61f`, and exact Locked Reference static metadata.

The card is normalized only through accepted generic contracts:

- structural `declaration_reveal / on_use_declared` true-name release;
- `after_controller_enters_location` + `source_active` + `event_player_is_controller` + `close_source_card` for “when you move, close this card”;
- exact accepted FB2-44 `face_up_cards_per_round=set(1)` same-battlefield while-active static modifier;
- standard servant-skill card play with explicit skill-zone mana threshold `8`, cost `3`, basePower `1`, `特殊/宝具` metadata.

No identity-specific runtime routing, runtime Chinese parsing, new selector/trigger/condition/effect/lifecycle vocabulary, or generic arbitrary play-limit engine is introduced.

## Recertification / validation

Final tree gates on exact Base `88bd84b484dc4d7841a06b2338ef83c3492b8f33`:

- `npm run typecheck`: PASS.
- focused Leonidas + FB2-44 + historical Siegfried compatibility: **3 files / 30 tests PASS**.
- rules src/core/regression + FB2-43/44 + Leonidas/Siegfried strong subset: **86 files / 534 tests PASS**.
- official `npm run test:ci -- --maxWorkers=2`: **168 files / 1193 tests PASS**.
- `npm run content:validate`: **7 masters / 7 servants / 20 events / 0 blocking issues**.
- `npm run verify:generated-content`: PASS with unchanged hashes:
  - library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- Locked Reference verification: PASS at exact `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.
- `@fd/client` production build: PASS; only the existing `node:crypto` browser-externalization and >500 kB chunk warnings remain.
- `npm run phase3:coverage`: PASS, `124` archives / `165` cards / `275` abilities, compiled definition hash `7f5f8b8aa6f0abbe060b611189d4c104481486aa50435f4b73a8be7c7890bde1`, `76` compiled cards / `14` compiled characters / `0` blocking issues, `newRuntimeSemanticRouted=22`, `legacyExecuteAbility=3`, `legacyResolveEffect=142`, `dualRuntime=0`, `pilotAllowlist=0`, `notClassifiable=108`, `taxonomyWarnings=149`.
- coverage-generated `artifacts/phase3-skill-coverage.json` was restored byte-for-byte from Base and is not part of the Candidate.
- `git diff --check`: PASS.

The first full-CI attempt on the pre-correction Base failed only because the historical Siegfried consumer test hard-coded the repository-wide overlap snapshot `141`. A issued the exact compatibility scope correction in Base `88bd84b484dc4d7841a06b2338ef83c3492b8f33`; the final tree removes only that unstable global-count assertion while retaining frozen denominator `944`, zero duplicates, and Siegfried s2 authored exactly once. Final full CI is green.

For this dispatched S task only: **S 完成 recertification 并提交 Exact Base/Candidate**。This records a task-local requirement only and is not a standing rule for later S tasks.

## Accounting / scope audit

Mechanical final-tree accounting:

- frozen denominator: **`944`**;
- Base frozen authoring overlap: **`141/944`**;
- Candidate frozen authoring overlap: **`142/944`**;
- exact new frozen identity: `servant.leonidas.skill.sc-leonidas-1`;
- target count: `1`;
- target present in Base authoring: `false`;
- duplicate frozen ids: `0`;
- removals: `0`.

Final Candidate scope is exactly four files:

1. `data/authoring/servants/servant.leonidas.json` — sole production content addition, containing only Leonidas s1;
2. `packages/rules/tests/leonidas-s1-consumer-migration.test.ts` — current exact whole-card and `142/944` proof;
3. `packages/rules/tests/siegfried-s2-consumer-migration.test.ts` — A-authorized historical test compatibility edit only; no Siegfried production semantics change;
4. this S result report.

Production runtime, client, content runtime, product pack, generated product output, and artifacts diff are empty.

Formal project migration remains **`146/944`**, with **`798`** remaining until fresh independent R returns `MIGRATION_ACCEPTED` for the exact S Candidate and A synchronizes that acceptance.