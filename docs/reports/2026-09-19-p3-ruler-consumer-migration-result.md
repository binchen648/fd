# P3 Ruler Family Consumer Migration Result

Role: Codex S
Status: `MIGRATION_COMPLETE_CANDIDATE`
Date: 2026-09-19

## Exact lineage

- A dispatch Base: `18c39c838fe84e26b4739a75efcd3f3efb8bb499`
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Accepted runtime dependency: R58 / FB2-27 Revision `e30e7efef3cf9fc111236599441e5a869f4bc81a`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Formal accepted at Base: `121/944`; this S Candidate alone does not change formal accepted accounting.

## Exact migrated identities

Exactly six frozen identities are added:

1. `servant.amakusa.skill.sc-amakusa-3`
2. `servant.amor.skill.sc-amor-1`
3. `servant.jeanne.skill.sc-jeanne-1`
4. `servant.morgan.skill.sc-morgan-3`
5. `servant.oberon.skill.sc-oberon-3`
6. `servant.oberon.skill.sc-oberon-4`

No seventh frozen identity is added.

The first five `裁决者` definitions use the exact frozen F1 printed text with SHA-256:

`8340a2b1e14bdf601bebf9f0a5a1dbb67c326c0bafbc596d689110ea3cc51137`

Oberon s4 `裁决者令咒` uses exact frozen F1 full printed text SHA-256:

`125082e75869375ea276d98ddfe24549144efbc1525a5e7a54acac179e1beb3c`

and preserves the four frozen clause hashes recorded in the A dispatch.

## Authoring representation

Production authoring adds five standalone `servant_skill_card_archive` files:

- `data/authoring/servants/servant.amakusa.json`
- `data/authoring/servants/servant.amor.json`
- `data/authoring/servants/servant.jeanne.json`
- `data/authoring/servants/servant.morgan.json`
- `data/authoring/servants/servant.oberon.json`

Oberon contains exactly s3 and s4; the other four archives contain exactly one dispatched card each.

Frozen F1 is authoritative for canonical IDs and printed text. Locked Reference supplies only static owner/name/class/card-face metadata. Each archive records the F1 and Reference commits plus accepted `P3-R58/FB2-27` contract provenance.

The first five cards encode only the accepted exact FB2-27 binding structure:

- action phase / `controller_action_window`;
- no source-active requirement;
- exact two-player target with `not_controller` then `least_ruler_binding_count`;
- `grant_ruler_seals` plus exact `ruler_copy_steal_guard / forbid_source_and_effects`;
- exact per-game three-use parent-card limit;
- automatic execution with no host operations.

Oberon s4 encodes only the accepted exact seal-use structure:

- action phase / `controller_action_window`;
- no source-active requirement;
- no generic card-level usage limit;
- exact option order `move`, `lock_movement`, `free_play_reward`;
- exact `bound_by_controller_ruler_seal` target;
- exact destinations `miyama_town`, `shinto` and reward `2 VP`;
- physical seal consumption remains the once-only resource.

No Reference handler implementation is copied and no identity/name/text handler routing is added.

## Runtime evidence using actual migrated definitions

`packages/rules/tests/ruler-consumer-migration.test.ts` loads the real five new archives and independently checks:

- exact six identity set and frozen text hashes;
- all five parent cards satisfy `isRulerSealBindingSemantic`;
- Oberon s4 satisfies `isRulerSealUseSemantic`;
- real migrated Oberon s3 preserves ordered least-bound semantics: with p2=0, p3=1, p4=1, reverse `p3 -> p2` rejects `illegal_target` mutation-free while `p2 -> p3` succeeds;
- the real migrated seal definition executes the move branch;
- the real migrated seal definition applies the round movement lock and core movement rejects while locked;
- the real migrated seal definition allows the bound player to free-play a cost-7 helper card at 0 mana and awards the issuer exactly +2 VP on the bound player's win, with event replay not duplicating VP;
- none of the six standalone migration identities is registered into the production playtest pack or generated product library.

Focused migration validation: `1 file / 5 tests PASS`.

## Product and role isolation

The five new archives are intentionally standalone and are not added to `data/packs/fd-playtest-v1/pack.json`.

There is zero Base-to-Candidate diff under:

- `packages/rules/src/**`
- `data/packs/**`
- `data/generated/**`
- `apps/**`
- `scripts/**`
- `artifacts/**`
- `data/phase3/**`

Therefore this S task does not change runtime code, compiler code, playable servant characters/decks, fixture seats, generated product material, F1, taxonomy, KPI, or Reference.

Production content remains exactly:

- 7 masters
- 7 servants
- 20 events
- 0 blocking issues
- compiled cards 76
- compiled characters 14

Generated hashes are unchanged from the R58 baseline:

- library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`
- fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
- evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`

## Mechanical frozen accounting

Mechanical comparison against authoritative F1 and the exact A dispatch Base gives:

- denominator: `944`
- Base authoring cards: `144`
- Base frozen overlap: `121/944`
- Candidate authoring cards: `150`
- Candidate frozen overlap: `127/944`
- exact additions: the six dispatched Ruler identities above
- removals: `0`
- duplicate frozen canonical IDs: `0`
- Candidate remaining: `817`

Thus Candidate material is exactly `127/944`. Formal recovery accepted remains `121/944` until fresh independent R returns `MIGRATION_ACCEPTED` and a later A synchronization records it.

## Validation

Fresh S validation on the final implementation:

- `npm ci --offline`: 239 packages added, 0 vulnerabilities;
- typecheck: PASS;
- focused real migrated-definition test: `1 file / 5 tests PASS`;
- rules `src + core + regression + migration`: `81 files / 487 tests PASS`;
- official full CI: `140 files / 947 tests PASS`;
- eleven-round MatchSession case in full CI: approximately `2624 ms`, below unchanged 5000ms timeout;
- content validate/compile: `7 masters / 7 servants / 20 events / 0 blocking issues`;
- generated determinism: PASS with hashes above unchanged;
- locked Reference verification: PASS at exact locked SHA;
- client production build: PASS (existing Vite `node:crypto` browser-externalization warning only);
- Phase 3 coverage: `111 archives / 150 cards / 255 abilities`, compiled `76 / 14 / 0`, routing `22/3/135/0/95/137`;
- automation audit: `135/3/95/20`;
- `git diff --check`: PASS.

Coverage/audit artifacts were restored before commit.

Historical P3-FM09 remains `MIGRATION_BLOCKED`. No FM10 is started or unblocked by this Candidate. No existing PR is merged or retargeted.
