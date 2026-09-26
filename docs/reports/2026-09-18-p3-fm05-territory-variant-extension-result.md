# P3-FM05 Territory Creation Variant Extension Result

Role: Codex S
Status: `MIGRATION_CANDIDATE`
Base: `40eaf45a64ecca0ddb6efe62a8bed35652420707`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Exact migration batch

This Candidate materializes exactly two frozen Territory Creation identities dispatched by A:

1. `servant.gilles.skill.sc-gilles-2`
2. `servant.medea.skill.sc-medea-2`

No third frozen identity is added. This is an extension of the independently accepted R34/FM05 Territory Creation family, not FM10. P3-FM09 remains `MIGRATION_BLOCKED`.

## F1 and Reference fidelity

Both cards preserve the exact frozen F1 printed text:

`X为16 - (当前回合数 × 2)\n残留：当你部署于魔术工房时，获得1点魔力和2点战果。`

Exact SHA-256 evidence:

- full text: `33c9377158b49fad67a503f1368f81efa65b97cff870c2331c8ca4ee69937446`;
- formula clause: `553fdbcf7626fff5a498ed55e850e13260030b9c3d911adcbaa43a578a39c2c5`;
- deployment clause: `2137380f5f57233a98494f45a9d12a848f3d1cf710101c60462c523ea3f1624f`.

Locked Reference gives both owners class `Caster` and the same historical skill metadata: `typeLabel=魔术`, `cost=0`, `basePower=2`, `requirement=0`. The historical requirement remains evidence only; Final Rules 9.4 provides the canonical skill-zone threshold of 8 mana.

## Accepted semantic reuse

No new runtime contract is introduced. Each card uses the already accepted Territory Creation decomposition:

- R33 / FB2-11: controlled Power AST `add(16, multiply(-2, game.round_number))`, `printedExpression=X`;
- R19 / FB2-02: forced `after_player_deployed_to_battlefield` at `magic_workshop`, controller +1 mana then +2 VP;
- R34 / FM05: canonical Territory Creation authoring precedent.

The only source-level family variation is the frozen printed typography of the formula line. Production behavior is represented by the same accepted typed structure.

## Exact Candidate scope

Base to Candidate changes exactly four files:

1. `data/authoring/servants/servant.gilles.json`;
2. `data/authoring/servants/servant.medea.json`;
3. `packages/rules/tests/fm05-territory-variant-extension.test.ts`;
4. this result report.

There is no Base-to-Candidate diff in `packages/rules/src/**`, `data/packs/**`, `data/generated/**`, `apps/**`, `scripts/**`, or `artifacts/**`.

## Frozen accounting

Mechanical `cards[].id` intersection against the exact frozen F1 944-ID inventory:

- Base: `113/944`;
- Candidate material: `115/944`;
- additions: exactly the two dispatched IDs;
- removals: `0`;
- duplicate frozen canonical IDs: `0`.

This is material presence only. Recovery-line accepted overlap remains `113/944` until fresh independent R accepts the exact committed Candidate and a later A synchronization records the credit. Integrated main remains `111/944`.

## Validation

Fresh S validation from the independent worktree:

- `npm.cmd ci --offline`: PASS, 239 packages, 0 vulnerabilities;
- typecheck: PASS;
- focused new extension + accepted FM05 regression: `2 files / 9 tests PASS`;
- content validation: `7 masters / 7 servants / 20 events / 0 blocking issues`;
- generated-content determinism: PASS, unchanged hashes:
  - content `03582e22b830c59ccfe03379159dd5e50aef19fd7bae3561469c000e56618a79`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`;
- locked Reference verification: PASS at exact `b2f9fa15fba07c63530bbf4612b03b8b704755f9`;
- client production build: PASS; existing Vite `node:crypto` browser-externalization warning only;
- official full CI: `134 files / 870 tests PASS`;
- official rules core + regression scope: `73 files / 451 tests PASS`;
- temporary phase3 coverage: `103 archives / 138 cards / 241 abilities`; raw `22 / 3 / 133 / 0 / 83 / 130`; compiled `73 cards / 14 characters / 0 blockers`;
- temporary automation audit: `legacyResolveEffect=133`, `legacyExecuteAbility=3`, `notClassifiable=83`, `promotionFindings=20`;
- frozen accounting: `113 -> 115`, exact +2 / 0 removals / 0 duplicates;
- forbidden-scope diff: zero;
- `git diff --check`: PASS.

The coverage and automation artifacts were written outside the worktree for inspection and removed after the run; no generated audit/coverage file is part of the Candidate.

## Diagnostic runs that are not Candidate failures

Two environment diagnostics were encountered and resolved/isolated without product changes:

1. Fresh-worktree focused tests initially could not resolve `@fd/content/rules` because workspace `dist` outputs had not yet been built after offline install. Root typecheck (`tsc -b`) built the workspace outputs; the same focused tests then passed `9/9`.
2. An over-broad exploratory command over all `packages/rules/tests` included historical authoring evidence tests that require local CHM extraction files under `D:/fd/chm-extract` / worktree `chm-extract`, and also produced parallel Vitest worker fetch timeouts. This is not the repository's official rules core+regression gate. The exact official core+regression scope was then run separately and passed `73 files / 451 tests`; official full CI independently passed `134 files / 870 tests`.

## Next gate

Commit and push this exact four-file Candidate and open a stacked PR against `codex/a-p3-batch-readiness-113`. Then stop for a fresh independent R review. S does not grant migration acceptance and does not update the accepted burn-down.
