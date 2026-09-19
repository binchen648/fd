# P3-S R75 Ibaraki Consumer Migration Result

Role: Codex S
Status: `MIGRATION_COMPLETE_CANDIDATE`
Date: 2026-09-20

## Exact baseline

- Exact corrected A dispatch Base: `8b10ceb5987d40753ef127fed3f09f829a4a8fa0`
- R75 FB2-35 capability synchronization: `ef5c93db818a1f6ab3bf830a182e4f0281fec964`
- Accepted FB2-35 runtime Candidate in ancestry: `70df7d3782b553e9f4c222289ebb6c66c619e1e0`
- Canonical FB2-35 reviewer evidence: `https://github.com/binchen648/fd/pull/380#issuecomment-5744753519`
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Project formal migration state at dispatch: **137/944**, remaining **807**.
- Branch-local frozen authoring overlap at Base: **133/944**, duplicates 0.

This Candidate does not pre-credit project formal accounting. Only fresh independent R `MIGRATION_ACCEPTED` followed by A acceptance synchronization may advance formal accounting to **138/944**, remaining **806**.

## Exact migrated identity

Exactly one frozen identity is added:

- `servant.ibaraki.skill.sc-ibaraki-1`

F1 full printed text SHA-256 and sole clause SHA-256:

- `1ed4b6ca04b7bec829e082e897fa5d5a1a23d3cc7215d2a8865261218e24f14d`

Locked Reference / legacy static metadata used only as static/source-grounded evidence:

- owner: `servant.ibaraki`;
- class: `Berserker`;
- legacy ID: `sc_ibaraki_1`;
- name: `大江之鬼闹`;
- type label: `被动`;
- cost: 0;
- basePower: 0;
- legacy requirement: 0;
- attributes: `[]`.

Reference handler identity is evidence only and is not used for runtime routing.

## Accepted structural normalization reused

The standalone archive contains exactly one passive ability, `great-river-ogre-rampage`, using only the accepted FB2-35 envelope:

- conditions exactly `[{ type: "source_owned" }]`;
- one `combat_power:add` modifier;
- subject `players_at_source_battlefield`;
- metric `round_active_attack_paid_cost_sum_is_highest`;
- constant value exactly numeric 6;
- permanent modifier lifecycle;
- card-text/specific priority and `higher_priority_wins` conflict policy;
- automatic execution with no additional operations.

The corrected A dispatch explicitly does not invent `source_active` or source face-state semantics: Locked Reference carries only `source_owned`, and accepted FB2-35 supports the owned servant-skill source without requiring a source `cardState`. Qualifying attack cards still use FB2-35's active/face-up/current-round paid provenance rules.

## Real migrated-definition evidence

`packages/rules/tests/ibaraki-consumer-migration.test.ts` loads the real `data/authoring/servants/servant.ibaraki.json` archive and proves:

- exact F1 text/clause hash and static metadata;
- archive contains exactly the one frozen identity;
- real archive compiles with `loadAuthoringJson(...).report = []` and automatic mode;
- compiled ability satisfies `isAcceptedRoundActiveAttackPaidCostCombatPowerAbility(..., 'compiled')`;
- actual paid current-round active attacks drive the +6 participant combat-power adjustment before winner selection;
- the +6 can change the battle winner while individual card power remains unchanged;
- ties at the highest paid-cost sum are preserved;
- an actually paid zero-cost active attack is a real zero candidate, while a participant with no qualifying attack does not qualify by absence;
- a paid support/non-attack moved into `attack_area` is excluded from ranking;
- source ownership mismatch and source-controller battlefield mismatch fail closed;
- standalone migration remains absent from the production playtest pack and generated product library.

## Product / role isolation

Relative to exact corrected A dispatch Base, migration material is limited to:

- `data/authoring/servants/servant.ibaraki.json`;
- `packages/rules/tests/ibaraki-consumer-migration.test.ts`;
- this S result report.

There is zero diff under `packages/rules/src/**`, `data/packs/**`, `data/generated/**`, `data/phase3/**`, or `apps/**`. No runtime identity/name/text/hash/Reference-handler branch is added. No merge or retarget is performed.

## Mechanical frozen accounting

Fresh mechanical scan against the exact 944-ID F1 roster:

### Base `8b10ceb...`

- cards in JSON authoring archives: 156;
- unique card IDs: 156;
- frozen overlap: **133/944**;
- duplicates: none.

### Candidate material

- cards in JSON authoring archives: 157;
- unique card IDs: 157;
- frozen overlap: **134/944**;
- duplicates: none;
- exact frozen addition: `servant.ibaraki.skill.sc-ibaraki-1`;
- removals: none.

These are branch-local material counts only. Project formal migration remains **137/944**, remaining **807**, until fresh R accepts the exact S Candidate and A synchronizes it.

## Fresh validation

- dependencies: `npm.cmd ci --ignore-scripts --offline` PASS in this fresh S worktree;
- `npm.cmd run typecheck`: PASS;
- focused Ibaraki migration: **1 file / 5 tests PASS**;
- rules src + core + regression + focused: **83 files / 499 tests PASS**;
- official CI with `--maxWorkers=2`: **151 files / 1057 tests PASS**;
- content validation: **7 masters / 7 servants / 20 events / 0 blocking issues**;
- generated-content determinism: PASS, hashes unchanged:
  - library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence report `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`;
- Locked Reference verification: PASS at exact locked commit;
- client production build: PASS; only the existing Vite `node:crypto` browser-externalization warning;
- `git diff --check`: PASS;
- final tracked/untracked scope contains only authorized migration material/test/report.

Historical `P3-FM09-RECOVERY` remains `MIGRATION_BLOCKED`.

## Next gate

Commit and push this one-card S Candidate, open one PR against exact corrected A dispatch branch `codex/a-p3-r75-ibaraki-consumer-migration-dispatch`, then hand the exact Candidate to a fresh independent R. Required successful verdict is `MIGRATION_ACCEPTED`. S does not perform formal A synchronization itself.
