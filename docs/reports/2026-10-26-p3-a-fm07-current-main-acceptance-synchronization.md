# P3-A FM07 current-main acceptance synchronization

Role: Codex A accounting  
Status: `SYNCHRONIZED`  
Task: `P3-FM07`  
Classification: owner-complete accepted 10-ID authoring migration

## Exact evidence

- Exact current-main Base: `9fe8da9982bece78913f71129cf30c781b730684`.
- Accepted Candidate: `b161480c72444615305d7cf7f35be707277dfcb8`.
- Candidate branch: `codex/s-p3-fm07-current-main-20261025`.
- Builder branch receiving this A-sync: `codex/s-p3-fm07-current-main-20261025`.
- Independent Reviewer report: `ca5fb00ebefadee5f9350288e500cb31f6b07e7b`; verdict `MIGRATION_ACCEPTED`.

The accepted Candidate contains exactly nine Alter Ego servant archives, one Sion EX master archive, and the focused FM07 authoring test. This A-sync records the independent review and binds the accepted authoring to the current-main lineage. It does not modify the frozen Candidate branch and does not merge a PR.

## Exact 10-ID authoring set

`servant.douman.skill.sc-douman-3`, `servant.koyanskaya.skill.sc-koyanskaya-1`, `servant.mechaeli.skill.sc-mechaeli-3`, `servant.meltryllis.skill.sc-meltryllis-3`, `servant.muramasa.skill.sc-muramasa-3`, `servant.okita-alt.skill.sc-okita-alt-1`, `servant.passionlip.skill.sc-passionlip-1`, `servant.sitonai.skill.sc-sitonai-3`, `servant.taisui.skill.sc-taisui-1`, and `master.sion.skill.s12`.

The nine regular cards and Sion EX preserve the frozen F1/Reference text and metadata, accepted handler `core.alter-ego-transform`, and final skill-zone gate 8. Regular cards use the identity-free event-source transform plus source close; Sion EX retains typed controller mana payment 3 and its per-round one-card limit. Passionlip's Reference `特殊` label exception is preserved. No identity/name/text routing or unrelated runtime changes are introduced.

## Retained dependency lineage

The current-main lineage retains accepted FB2-13 Alter Ego runtime and the previously synchronized FB2-02 deployment-resource, FB2-11 round-number, FB2-12 Presence Concealment, FM05 Territory Creation, and FM06 Presence Concealment dependencies. FM07 contributes authoring and focused-test paths only; no shared runtime, coverage, generated-content, pack, taxonomy, task-index, or governance files are changed.

## Verification receipt

- FM07 authoring focused: 4/4.
- FB2-13 Alter Ego runtime: 7/7.
- FB2-02 deployment resource: 9/9.
- FB2-11 round-number formula: 7/7.
- FB2-12 Presence Concealment: 10/10.
- FM05 Territory Creation: 4/4.
- FM06 Presence Concealment: 4/4.
- B23 battle-loss state transform: 9/9.
- Combined focused: 8 files, 54/54 (two-worker focused run; the FM07-only rerun was 4/4 and the B23 file was rerun separately at 9/9).
- `npm run typecheck`: passed (as independently reproduced in the Reviewer worktree).
- `npm run content:validate`: passed; 0 blocking issues (as independently reproduced).
- `npm run verify:generated-content`: passed with unchanged hashes (as independently reproduced).
- `git diff --check`: passed.

Full CI was verified with constrained concurrency: `npm run test:ci -- --reporter=dot --maxWorkers=2`, 119 files / 730 tests passed. The default-concurrency, unmodified `npm run test:ci` command was tried twice in the independent Reviewer worktree and each run reached 118/119 files and 729/730 tests because the unchanged `packages/rules/tests/match-session.test.ts` eleven-round test hit Vitest's 5-second timeout. That test passed 26/26 when run alone; this timing limitation does not implicate the scoped FM07 diff.

## Accounting

- Before: `123 / 944 FULL`; remaining `821`.
- FM07 owner-complete migration credit: `+10`.
- After this A-sync: `133 / 944 FULL`; remaining `811`.
- New owner/skill credit this round: `+10`.

Formal accounting is now `133/944`; FM07 is not re-counted in later dependency materialization.
