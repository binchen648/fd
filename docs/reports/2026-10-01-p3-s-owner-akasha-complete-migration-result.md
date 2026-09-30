# P3-S Akasha Owner-Complete Migration Result

Role: Codex S / FORMAL
Status: `MIGRATION_COMPLETE_CANDIDATE`
Date: 2026-10-01

## Task / lineage

- Task: `P3-S-OWNER-AKASHA-COMPLETE-MIGRATION`
- Exact Base: `e2e79392c78dadbd17d53da9e48c9af5000592a9`
- Base meaning: accepted Akasha seven-player master-pool readiness A-sync/full-owner rescan; strict accounting `173/944`, remaining `771`.
- Frozen owner: `master.akasha`.
- Frozen scope: `ascension` + `s1` + `s1a` + `s2` + `s3` + `s4` + `s5` + `s6` together.
- Locked Reference metadata commit: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.
- Accepted readiness evidence:
  - PR #503 capability successor `214e77133d9f7c006123f950ac834df693c90130`: `https://github.com/binchen648/fd/pull/503#issuecomment-5916640287`;
  - PR #504 location provisioning `ff26b046be5ea5e3ef2302e756e52fcbcd919a6c`: `https://github.com/binchen648/fd/pull/504#issuecomment-5916944435`;
  - PR #505 seven-player pool `5f1a37d53fa0e6b2c2b21a13c3df39cec03ff0ec`: `https://github.com/binchen648/fd/pull/505#issuecomment-5917276459`.

All eight frozen identities were absent from canonical `data/authoring/**` at Base. All eight are newly creditable only after exact formal `MIGRATION_ACCEPTED` plus A-sync/accounting; none is preservation-only.

## Owner materialization

One canonical owner archive is added at `data/authoring/masters/master.akasha.json`, containing the complete frozen eight-identity scope together:

1. `master.akasha.skill.s1` / 命理
   - game-start skill-zone provisioning of exact `s6` through accepted `provision_skill_cards`;
   - one temporary exact `s6` physical card at every enabled battlefield through accepted identity-free location provisioning, with authoritative `generatedBy` + `placedAtLocationId` provenance.
2. `master.akasha.skill.s1a` / 无限转生者
   - initializes the three-stage Vessel cycle and schedules reincarnation from accepted battle-loss / defeat provenance.
3. `master.akasha.skill.s2` / 转生
   - resolves the next-round reincarnation transition with accepted earned-VP accounting, repeat penalty, temporary-card retention, and final-form provisioning.
4. `master.akasha.skill.s3` / 罗亚
   - accepted current-Vessel Recon VP bonus marker.
5. `master.akasha.skill.s4` / 艾蕾西亚
   - accepted live-control Master Skill aura: +1 Power / -1 cost under the exact Vessel/definition boundary.
6. `master.akasha.skill.s5` / 远野四季
   - accepted exact `s6` skill-zone mana exception and Square base-Power doubling authority.
7. `master.akasha.skill.s6` / 过负荷
   - `initialPlacement=outside_game`;
   - static card metadata preserved: magecraft, cost 1, base Power 0, exact skill-zone mana threshold 8;
   - required additional play preserved through shared `append_only_rule`;
   - accepted low-mana +3 / normal close-and-copy / positive-terrain exact-location join lifecycle consumed without owner-specific runtime routing.
8. `master.akasha.skill.ascension` / 最终形态
   - `initialPlacement=outside_game`;
   - provisioned only after the accepted complete Vessel-cycle condition;
   - accepted once-per-Climax round battlefield placement of exact `s6`.

The archive declares the reviewed development overview image at `../../Fate_Domination-开发版/images/masters/阿卡夏之蛇.png`. The local source-asset-required supplemental check confirms Akasha is not in the missing-image set.

No Akasha/card-name/printed-text/legacy `core.akasha-*` production identity route is added by this formal Candidate.

## Pack integration

`data/packs/fd-playtest-v1/pack.json` integrates `data/authoring/masters/master.akasha.json` exactly once after the seven previously canonical playable Master archives, preserving their existing order and appending the new owner without unrelated reordering.

Akasha is a Master package and defines no servant deck. Canonical initial mana remains 4.

Generated content was regenerated deterministically after integration.

## Shared fixture alignment

Adding an eighth playable Master changes legitimate archive/pool cardinality and seeded seven-player selection. Formal tests therefore update only fixture assumptions that were coupled to the old seven-master roster:

- `packages/rules/tests/executable-card-pack.test.ts`: source-map assertions and fault injection locate `servant.artoriac` by archive id instead of hard-coded archive index 7;
- `packages/content/src/__tests__/playtest-pack-loader.test.ts`: playable Master count is derived from the manifest rather than hard-coded to 7;
- `packages/rules/src/__tests__/match-session-regressions.test.ts`: only scenarios that depended on the old Master seat ordering use mechanically searched deterministic seeds preserving their former seven-seat Master preconditions;
- `packages/rules/tests/match-session.test.ts`: durability/event-smoke fixtures use deterministic seeds that preserve their original bounded roster preconditions under the accepted >7 playable-Master selection contract.

No production MatchSession change is part of this formal Candidate; the generic seven-player pool fix is already in exact Base through accepted PR #505.

## Verification

Formal owner-complete regression:
- `packages/rules/tests/regression/p3-akasha-owner-complete-migration.test.ts`: `6/6 PASS`.

Accepted readiness regressions:
- `packages/rules/tests/regression/p3-akasha-owner-readiness-capability.test.ts`: `17/17 PASS`;
- `packages/rules/tests/regression/p3-seven-player-master-pool-readiness.test.ts`: `3/3 PASS`.

Affected neighboring/shared regressions:
- game-start skill provisioning: `7/7 PASS`;
- explicit outside-game placement: `12/12 PASS`;
- complex-skills regression: `38/38 PASS`;
- executable-card-pack: `50/50 PASS`;
- playtest pack loader: `21/21 PASS`;
- `packages/rules/tests/match-session.test.ts`: `33/33 PASS` when run in its declared isolated suite;
- `packages/rules/src/__tests__/match-session-regressions.test.ts`: `11/11 PASS` when run in its declared isolated suite.

Affected aggregate: **`198/198 PASS`**.

Static/content gates:
- `FD_TOOLCHAIN_OK`;
- `npm run typecheck` PASS;
- `npm run content:validate` PASS — `8 masters / 19 servants / 20 events / 0 blocking issues`;
- `npm run content:compile` PASS — same counts;
- `npm run verify:generated-content` PASS:
  - content-library `9bded243cd7dddf19f7896c2f1af6f79b917e9a28d76fd13071529cbdd8d316e`;
  - fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`;
  - evidence-report `fd3081d8fadf2f81a7e070feff815ac893e2188cb5d3b18efdd74cc1b8460f8c`;
- Base..working-tree production `packages/rules/src/**` runtime delta EMPTY after excluding test files;
- production identity audit for `master.akasha`, `akasha.vessel`, Akasha printed names, and `core.akasha-*`: CLEAN;
- supplemental `npm run test:source-assets`: 93 pre-existing unrelated missing assets; no Akasha source/image is in the missing set;
- `git diff --check` PASS.

## Accounting / gate

Before fresh R, strict formal accounting remains **`173/944`**, remaining **`771`**.

This Candidate claims all eight newly materialized frozen Akasha identities, but no credit is granted before exact fresh independent `MIGRATION_ACCEPTED` plus A-sync/accounting. If accepted and synchronized, the accounting transaction is exactly `+8`: `173/944 -> 181/944`, remaining `763`.