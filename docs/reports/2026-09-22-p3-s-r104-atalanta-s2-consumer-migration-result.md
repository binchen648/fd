# P3-S R104 Atalanta S2 Consumer Migration Result

Role: Codex S
Status: `MIGRATION_COMPLETE_CANDIDATE`
Date: 2026-09-22
Task: `P3-S-R104-ATALANTA-S2-CONSUMER-MIGRATION`
Branch: `codex/s-p3-r104-atalanta-s2-consumer-migration`
Exact Base: `ec4918bb9b5a0dcce3488b7ed3d688f3d6e538d1`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Exact scope

This S Candidate adds exactly one new frozen identity:

- `servant.atalanta.skill.sc-atalanta-2` / `诉状箭书`

The target is appended to the existing `data/authoring/servants/servant.atalanta.json`. The already accepted `servant.atalanta.skill.sc-atalanta-3` entry is byte-for-semantics unchanged.

The Candidate changes only:

1. `data/authoring/servants/servant.atalanta.json` — append Atalanta S2 only;
2. `packages/rules/tests/atalanta-s2-consumer-migration.test.ts` — focused whole-card/runtime/accounting regression;
3. `packages/rules/tests/astolfo-s1-consumer-migration.test.ts` — A-authorized removal of Astolfo's stale repository-wide absolute `147/944` snapshot while retaining denominator/duplicate/identity checks;
4. this result report.

No production runtime source, product pack, generated product content, client source, or second frozen identity changes.

## Source and static evidence

- accepted source S: `4c67f72828125bc112b23b738948f5533eaceb8c`
- source A audit: `6826dc5b085bf8efa0a53853c0e293e939b0c137`
- independent source R: `826e6f5b6a92b927800b2b50a6b15898d70befcc`
- source ability id: `appeal-letter-copy`
- source locator: `src/content/authoring/cards.json / skillCards[28].abilities[0].printedClause`
- full printed text / clause SHA-256: `93fd375fbcb6d5841a26ebf2c1512b48d94e6b6ed963fd0fcafe7d37c58f501b`
- Locked Reference confirms legacy id `sc_atalanta_2`, class `Archer`, typeLabel `迅捷/宝具`, attributes `迅捷`,`宝具`, cost `2`, basePower `4`, legacy requirement `8`.

Normalized card behavior uses only synchronized FB2-50 plus accepted generic servant-skill/visibility vocabulary:

- real skill-zone 8-mana threshold and printed cost 2;
- automatic Action phase / controller action window;
- exact `source_active` + `controller.deployment_bonus > 0` gate;
- exactly-one other controller current-round attack target;
- exact `create_selected_played_attack_temporary_copy` effect;
- structural true-name reveal on use declaration;
- one free same-definition active face-up attack copy;
- generated copy is not ordinary play accounting and is removed at round expiry.

## Frozen accounting

Mechanical exact Base-to-Candidate recount:

- frozen denominator: `944` (`943 static + 1 dynamic`);
- Base frozen overlap: `147/944`;
- Candidate frozen overlap: `148/944`;
- exact additions: `[servant.atalanta.skill.sc-atalanta-2]`;
- frozen removals: `[]`;
- duplicate frozen ids: `[]`;
- target count: `1`;
- existing Atalanta S3 entry unchanged: `true`.

Formal project migration remains `152/944` until fresh independent R returns `MIGRATION_ACCEPTED` for this exact Candidate and A synchronizes that acceptance.

## Recertification

All required S gates were run from the fixed Work environment.

- `verify-toolchain.cmd`: `FD_TOOLCHAIN_OK`;
- focused Atalanta S2 + FB2-50 + Astolfo compatibility: `3 files / 27 tests PASS`;
- `npm.cmd run typecheck`: PASS;
- official `npm.cmd run test:ci -- --maxWorkers=2`: `180 files / 1339 tests PASS`;
- `npm.cmd run content:validate`: `7 masters, 7 servants, 20 events, 0 blocking issues`;
- `npm.cmd run verify:generated-content`: PASS with deterministic hashes;
- `npm.cmd run phase3:reference:verify -- --reference-root E:\Codex\FD\fengling20011118-dotcom_fate-domination\reference`: PASS at exact locked Reference;
- `npm.cmd run build --workspace @fd/client`: PASS;
- `npm.cmd run phase3:coverage`: PASS, `128 archives / 171 cards / 283 abilities`, `blockingIssues=0`, `dualRuntime=0`;
- `npm.cmd run phase3:automation-audit`: PASS, `legacyResolveEffect=144`, `legacyExecuteAbility=3`, `notClassifiable=114`, `promotionFindings=20`; generated validation artifacts restored to Base bytes after inspection;
- final `git diff --check`: PASS.

The first Reference verify invocation omitted the required `--reference-root` argument and returned usage only; it was immediately rerun with the canonical locked Reference path and passed. No fallback Reference or alternate checkout was used.

## Runtime/product isolation

Exact S Base-to-working-tree audit shows no changes under:

- `packages/rules/src/**`
- `apps/**`
- `data/packs/**`
- `data/generated/**`

The new consumer is standalone authoring material and focused evidence only. No Atalanta identity/name/text runtime routing, generic clone API, or Chinese runtime parsing was added.

## Handoff

S 完成 recertification 并提交 Exact Base/Candidate.

Fresh independent R must review the exact Candidate produced by the commit containing this report. Allowed migration verdicts are `MIGRATION_ACCEPTED` or `MIGRATION_NEEDS_REVISION`. Do not credit `153/944` until exact-Candidate migration acceptance plus A synchronization.