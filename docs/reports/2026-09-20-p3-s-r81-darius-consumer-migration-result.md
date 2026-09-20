# P3-S R81 Darius Consumer Migration Result

Role: Codex S
Status: `CANDIDATE_READY`
Date: 2026-09-20

## Dispatch binding

- Exact A dispatch Base: `35f88ed1f5dca86b9629a3addc09c749ba56b1c1`
- Dispatch: `P3-A-R81-DARIUS-CONSUMER-MIGRATION-DISPATCH`
- Exact frozen identity: `servant.darius.skill.sc-darius-1`
- F1 evidence commit: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Migration material

Created exactly one standalone servant archive:

- `data/authoring/servants/servant.darius.json`
- archive owner: `servant.darius` / Berserker
- archive contains exactly `servant.darius.skill.sc-darius-1`
- legacy id: `sc_darius_1`
- static metadata: type/attribute `力量`, cost 2, basePower 5, legacy requirement 0

Evidence is bound to:

- full printed-text SHA-256 `140fbed2b3d455403639cbd3987c20b25279fdd61a28daedaac19892a34ec9e6`
- residual clause SHA-256 `e3afc162cc4676b9e3b6ca9aad41daed4aae8e22780705a608960a8d018fc88f`

Accepted normalization only:

- action/card-play envelope `controller_play_card_window`;
- explicit `skill_zone_mana_at_least: 0` for the printed below-eight-mana permission;
- residual trigger `after_battle_ended` in combat with source-active gating;
- exact conditions `source_active` plus FB2-38 `player_flag_number_not_current_round/combatLossRound`;
- exact `close_source_card` effect;
- `while_active / immediate / remain_active` lifecycle;
- automatic execution.

No runtime production source was changed.

## Focused runtime evidence

Added `packages/rules/tests/darius-consumer-migration.test.ts`, which loads the real migrated archive and proves through production-order scoring followed by the frozen terminal event that:

1. F1 hashes, static metadata, mana threshold 0, exact FB2-38 condition, and whole-card loader compilation are preserved;
2. when the controller has no represented combat loss, the residual executes and closes the source to the skill zone with runtime active state false;
3. an actual represented loss preserves the source even when loss effects are suppressed;
4. non-participation in another battlefield is not treated as a loss;
5. stale, non-terminal, and incomplete terminal provenance fail closed without closing the source.

## Validation

Final validation on this worktree:

- `npm.cmd run typecheck`: PASS
- Darius focused: **5/5 PASS**
- FB2-38 focused: **12/12 PASS**
- combined focused: **2 files / 17 tests PASS**
- rules src/__tests__ + core + regression + focused: **84 files / 511 tests PASS**
- official CI (`--maxWorkers=2`): **157 files / 1104 tests PASS**
- content validation: **7 masters / 7 servants / 20 events / 0 blocking issues**
- generated-content determinism: PASS with unchanged hashes:
  - library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`
- exact Locked Reference verification: PASS at `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- client production build: PASS (existing Vite warnings only)
- `git diff --check`: PASS
- runtime production source diff: empty
- final migration material before this report: exactly archive + focused test

## Frozen accounting

Mechanical top-level frozen-roster recount:

- Base: `136/944`
- Candidate material: `137/944`
- exact additions: `servant.darius.skill.sc-darius-1` only
- removals: 0
- duplicates: 0

This branch-local overlap is evidence for the exact migration delta only. Project formal migration remains **`140/944`**, with **`804`** remaining until fresh independent R returns `MIGRATION_ACCEPTED` for the exact Candidate and A synchronizes that acceptance.

PR #381 / Ibaraki remains independent and receives no credit here. No merge or retarget is authorized.
