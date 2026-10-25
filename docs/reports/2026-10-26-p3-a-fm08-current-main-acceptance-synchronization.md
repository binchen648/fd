# P3-A FM08 current-main acceptance synchronization

Role: Codex A accounting  
Status: `SYNCHRONIZED`  
Task: `P3-FM08` game-start RuleOverride authoring migration  
Classification: owner-complete accepted 10-ID authoring migration

## Exact evidence

- Exact current-main Base: `13a0ada07c50b77bc1efc178e08b4605512e8fb5`.
- Accepted Candidate: `acf837e5a30cd87e64eb1ad373d60edaa1da67ce`.
- Builder branch receiving this A-sync: `codex/s-p3-fm08-current-main-20261026`.
- Independent Reviewer report: `ff1672427f1baef946a674b9650b2e781a435b17`; verdict `MIGRATION_ACCEPTED`.

The accepted Candidate contains exactly the FM08 ten-ID authoring set and its focused migration test. This A-sync binds the independently accepted authoring to the current-main lineage. It does not modify the frozen Candidate, merge a PR, or change shared runtime logic.

## Exact ten-ID authoring set

`master.bazett.skill.s1b`, `master.caules.skill.s1a`, `master.fiore.skill.s2`, `master.fiore.skill.s3`, `master.fiore.skill.s4`, `master.irisviel.skill.s1`, `master.peperoncino.skill.s1a`, `master.sieg.skill.s1`, `master.waver.skill.s1`, and `master.zouken.skill.s5`.

All ten are canonical identity-free `game_start` forced triggers with typed controller-scoped FB2-14 RuleOverride installation. The archives preserve frozen F1 source hashes and locked Reference metadata. Fiore s4 retains its two accepted overrides. Same-handler `master.leonardo.skill.s1a` and `master.ophelia.skill.s1a` remain excluded; no dynamic identity or blocked row is included.

## Retained dependency lineage

The current-main lineage retains FB2-14 runtime and the previously accepted FM07, FM06, FM05, FB2-13, FB2-02, FB2-11, FB2-12, and B23 dependencies. FM08 contributes authoring and focused-test paths only; no shared runtime, generated-content, coverage, task-index, taxonomy, governance, or unrelated authoring changes are introduced.

## Verification receipt

- FM08 focused authoring: 5/5 PASS.
- FB2-14 runtime regression: 10/10 PASS.
- FM07 focused authoring: 4/4 PASS.
- FM06 focused authoring: 4/4 PASS.
- FM05 territory-creation regression: 4/4 PASS.
- Combined focused acceptance set: 27/27 PASS.
- Full CI: 120 files / 740 tests PASS (as recorded by the accepted Candidate and Reviewer evidence).
- `npm run typecheck`: PASS.
- `npm run content:validate`: PASS, 0 blocking issues.
- `npm run verify:generated-content`: PASS with unchanged hashes.
- `git diff --check`: PASS.

## Accounting ledger

- Before: `133 / 944 FULL`; remaining `811`.
- FM08 owner-complete migration credit: `+10`.
- After this A-sync: `143 / 944 FULL`; remaining `801`.
- New owner/skill credit this round: `+10`.

Formal accounting is now `143/944`; FM08 is not re-counted in later dependency materialization.
