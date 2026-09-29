# P3-S Owner-Complete Teach Migration Result

Date: 2026-09-29
Base: `8c89f948db0edcaa8042df578410ba17a8f298b4`
Branch: `codex/s-p3-owner-teach-complete-migration`
Owner root: `servant.teach`
Classification: formal owner-complete migration
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Strict formal accounting before review/A-sync: `149/944`, remaining `795`

## Accepted prerequisite

Teach readiness PR #483 exact Candidate `964db288d809cabd9150afdcf08dc3f306b9ab4e` received fresh-R `IMPLEMENTATION_ACCEPTED_CANDIDATE`; canonical same-attempt Coordinator bounded relay is `https://github.com/binchen648/fd/pull/483#issuecomment-5883800548`. Zero-credit A-sync `8c89f948db0edcaa8042df578410ba17a8f298b4` rescanned the complete Teach owner and found no additional currently discoverable source-grounded readiness blocker.

## Formal owner archive

`data/authoring/servants/servant.teach.json` now materializes the complete frozen owner set in one archive:

1. `servant.teach.skill.sc-teach-1` — 绅士之爱 — newly creditable;
2. `servant.teach.skill.sc-teach-2` — 安妮女王之复仇 — newly creditable;
3. `servant.teach.skill.sc-teach-3` — 骑乘（Rider Class） — historical FM01 preservation-only, no duplicate credit.

Frozen F1 clause hashes and locked-Reference static metadata are recorded on the new cards. Static metadata is:

- sc1: passive, no attributes, printed cost `0`, base Power `0`, no skill-zone threshold;
- sc2: `力量/宝具`, attributes `力量/宝具`, printed cost `4`, base Power `8`, final skill-zone threshold `8`;
- sc3: historical accepted `特殊`, printed cost `3`, base Power `0`, final skill-zone threshold `8`, preserved semantically from exact Base.

The new consumer authoring uses only the accepted PR #483 generic readiness family:

- sc1 `sc-teach-1.gentleman-love`: `battle_competition_reward_plunder` with record key `servant.teach:gentleman-love`, replacement of the controller competition reward, authoritative loser selection, physical top-three reveal, one physical removal, printed-Power VP cap `5`, and arbitrary reorder of the kept cards;
- sc2 `sc-teach-2.queen-anne-revenge`: `play_recorded_removed_card` with the same record key, exact `removed_from_game` provenance, normal play cost floored to `2`, original ownership preservation, true-name reveal on use, and source removal after the canonical battle terminal.

No legacy `core.teach-gentleman-love` / `core.teach-queen-anne` identity handler is restored. No Teach/card-name/printed-text runtime parser or `SkillLib` fallback is introduced.

## Preservation proof

Mechanical comparison of the parsed `servant.teach.skill.sc-teach-3` object at exact Base `8c89f948...` versus the formal worktree returns `SC3_SEMANTIC_PRESERVED=True`; both normalized objects have the same serialized length. Formal production runtime delta under `packages/rules/src/**` is empty.

## Verification

Focused formal regression: `6/6 PASS`. It proves exact owner scope/text/static metadata and accepted ability shapes, final skill-zone gates, real sc1 competition replacement/plunder/reorder, real sc2 recorded physical replay with 2-mana floor/ownership/true-name/source-removal lifecycle, accepted loss-suppressed loser semantics, historical sc3 preservation, and production identity audit.

Directly affected green verification: `13 files / 269 tests PASS`, covering formal Teach, Teach readiness, MatchSession, authoring interpreter, executable pack, card-close, FB2-49 close interaction, Stheno full-reward readiness, Suzuka readiness, Tamamo readiness and formal migration, Taisui location-marker readiness, and complex-skills regressions.

Static gates before Candidate publication:

- `FD_TOOLCHAIN_OK`;
- `npm run typecheck` PASS;
- `npm run content:validate` PASS — `7 masters / 12 servants / 20 events / 0 blocking issues`;
- `npm run content:compile` PASS with the same result;
- `npm run verify:generated-content` PASS with deterministic hashes unchanged;
- locked Reference clean/exact at `b2f9fa15fba07c63530bbf4612b03b8b704755f9`;
- `git diff --check` PASS;
- formal `packages/rules/src/**` delta from Base is EMPTY.

## Accounting boundary

This Candidate claims no credit before fresh R and A-sync. Strict accounting remains `149/944`, remaining `795`.

If exact Candidate receives `MIGRATION_ACCEPTED`, one subsequent A-sync/accounting transaction may add exactly sc1 + sc2 and move accounting to **`151/944`**, remaining **`793`**. Historical sc3 remains `+0` and must not receive duplicate credit.
