# P3-S R93 Darnic s1a Consumer Migration Result

Role: Codex S
Task: `P3-S-R93-DARNIC-S1A-CONSUMER-MIGRATION`
Status: `CANDIDATE_READY`
Date: 2026-09-20
Branch: `codex/s-p3-r93-darnic-s1a-consumer-migration`
Exact Base: `93a3a579c9bbb2b51e21f2f9a9757ba3c8a0387a`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Scope

This migration materializes exactly one frozen identity: `master.darnic.skill.s1a` (`噬魂者`).

Authorized production content change is only `data/authoring/masters/master.darnic.json`. The only compatibility edit is the A-authorized removal of Leonidas s1's stale repository-wide absolute overlap `142` assertion while retaining frozen denominator `944`, zero duplicate frozen ids, and Leonidas s1 exactly once. No runtime source, product pack, generated product output, second frozen identity, merge, or retarget is authorized.

## Exact whole-card normalization

Frozen F1 printed text:

`当你赢得一场战斗后，你可以将你的魔力设为4点。\n回合结束时，若你的魔力小于等于2，失去2点战果。`

Evidence:

- win-set-mana clause SHA-256 `464fd9246076fc8c86029d2c63bbbbe81df7d31390196595f2e3b94c4a79a02b`;
- round-end-loss clause SHA-256 `7a159e392ad4e1dcb5ad3edf73800151c33353a2bb39da2f01eebeb92bdf64b4`;
- full printed-text SHA-256 `088a6c3e26174bb98ead15d585dc8cc408d6925acd3b0405dd4f62ab1c10653e`.

The card uses only existing generic semantics: authoritative `after_controller_wins_battle` optional response -> fixed controller `set_mana(4)`, and `round_end` + `lte(controller.availableMana, 2)` -> controller `adjust_victory_points(-2)`. No new runtime vocabulary or identity route is introduced.

## Recertification / validation

Final Candidate-tree gates on exact Base `93a3a579c9bbb2b51e21f2f9a9757ba3c8a0387a`:

- `npm run typecheck`: PASS.
- focused Darnic s1a + Leonidas compatibility + trigger/resource coverage: **4 files / 31 tests PASS**.
- rules src/core/regression + Darnic/Leonidas strong subset: **84 files / 510 tests PASS**.
- official `npm run test:ci -- --maxWorkers=2`: **169 files / 1201 tests PASS**.
- `npm run content:validate`: **7 masters / 7 servants / 20 events / 0 blocking issues**.
- `npm run verify:generated-content`: PASS with unchanged hashes:
  - library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- exact Locked Reference verification: PASS at `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.
- `@fd/client` production build: PASS; only existing `node:crypto` browser-externalization and >500 kB chunk warnings remain.
- `npm run phase3:coverage`: PASS, **125 archives / 166 cards / 277 abilities**, compiled definition hash `7f5f8b8aa6f0abbe060b611189d4c104481486aa50435f4b73a8be7c7890bde1`, **76 compiled cards / 14 compiled characters / 0 blocking issues**, `newRuntimeSemanticRouted=22`, `legacyExecuteAbility=3`, `legacyResolveEffect=143`, `dualRuntime=0`, `pilotAllowlist=0`, `notClassifiable=109`, `taxonomyWarnings=149`.
- coverage-generated `artifacts/phase3-skill-coverage.json` was restored byte-for-byte from Base and is not part of the Candidate.
- `git diff --check`: PASS.

For this dispatched S task only: **S 完成 recertification 并提交 Exact Base/Candidate**。This records a task-local requirement only and is not a standing rule for later S tasks.

## Accounting / scope audit

Mechanical final-tree accounting:

- frozen denominator: **`944`**;
- Base frozen authoring overlap: **`142/944`**;
- Candidate frozen authoring overlap: **`143/944`**;
- exact new frozen identity: `master.darnic.skill.s1a`;
- target count: `1`;
- target present in Base authoring: `false`;
- duplicate frozen ids: `0`;
- frozen removals: `0`.

Final Candidate scope is exactly four files:

1. `data/authoring/masters/master.darnic.json` — sole production content addition, containing only Darnic s1a;
2. `packages/rules/tests/darnic-s1a-consumer-migration.test.ts` — exact whole-card behavior/provenance and stable identity accounting proof;
3. `packages/rules/tests/leonidas-s1-consumer-migration.test.ts` — A-authorized historical test compatibility edit only; no Leonidas production semantics change;
4. this S result report.

Production runtime, client/server production source, content runtime, product pack, generated product output, and artifacts diff are empty.

Formal project migration remains **`147/944`**, with **`797`** remaining until fresh independent R returns `MIGRATION_ACCEPTED` for the exact S Candidate and A synchronizes that acceptance.