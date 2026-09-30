# P3-S Xiang Yu Owner-Complete Migration Result

Role: Codex S / FORMAL
Status: `MIGRATION_COMPLETE_CANDIDATE`
Date: 2026-10-01

## Task / lineage

- Task: `P3-S-OWNER-XIANGYU-COMPLETE-MIGRATION`
- Exact Base: `946d8dcd4c81308d062bfd19aeb4bb63936484ff`
- Base meaning: accepted Xiang Yu readiness A-sync/full-owner rescan; strict accounting `170/944`, remaining `774`.
- Frozen owner: `servant.xiangyu`
- Frozen scope: sc1 + sc2 + sc3 together.
- Accepted readiness contract: PR #501 exact Candidate `f74e824238bd96a6679648376cf8c3d6ce48125c`; canonical acceptance evidence `https://github.com/binchen648/fd/pull/501#issuecomment-5915261626`.
- Locked Reference metadata commit: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.

All three frozen identities were absent from canonical `data/authoring/**` at Base, so all three are newly creditable only after exact formal `MIGRATION_ACCEPTED` plus A-sync/accounting.

## Owner materialization

One canonical owner archive is added at `data/authoring/servants/servant.xiangyu.json` with the exact frozen scope together:

1. `servant.xiangyu.skill.sc-xiangyu-1` / 战术躯体
   - static metadata: 被动, cost 0, base Power 0;
   - action arm uses the accepted structural Reaction counter authority;
   - opponent own-action skill play, authoritative ordinary/Ruler Command Seal use, and movement into Xiang Yu's battlefield feed the armed counter through trusted event provenance;
   - battle end loses `ceil(current Reaction / 2)` exactly through the accepted generic decay effect.
2. `servant.xiangyu.skill.sc-xiangyu-2` / 霸王之武
   - static metadata: 被动, cost 0, base Power 0;
   - combat purchases are repeatable while Reaction remains: 1 backward step, 2 forward step, 4 paid deck-top effect-play, 7 free hand effect-play;
   - all movement/card-play legality and transactionality is delegated to the accepted identity-free runtime capability.
3. `servant.xiangyu.skill.sc-xiangyu-3` / 力拔山兮气盖世
   - static metadata: 迅捷/宝具, cost 6, base Power 7, canonical skill-zone threshold 8, 真名解放 metadata preserved;
   - action: exact 1 mana -> 2 Reaction transaction;
   - combat: authoritative current-round movement distance >=3 permits exact physical-source base-Power x2 while that source remains active.

No Xiang Yu/card-name/printed-text/legacy `core.xiangyu-*` production identity route is added.

## Deck / pack integration

Frozen 12-card deck is preserved exactly:

- b1 ×1
- b2 ×1
- b3 ×1
- b4 ×1
- b5 ×2
- q1 ×1
- q2 ×1
- q5 ×2
- luck ×1
- surveil ×1

`data/packs/fd-playtest-v1/pack.json` integrates `servant.xiangyu.json` exactly once immediately after `servant.voyager.json`, matching stable frozen-owner order.

Generated content was regenerated deterministically after integration.

## Verification

Formal owner-complete regression:
- `packages/rules/tests/regression/p3-xiangyu-owner-complete-migration.test.ts`: `6/6 PASS`.

Accepted readiness regression:
- `packages/rules/tests/regression/p3-xiangyu-owner-readiness-capability.test.ts`: `11/11 PASS`.

Affected neighboring/shared regressions:
- Tezcat Command-Seal readiness: `8/8 PASS`;
- complex-skills regression: `38/38 PASS`;
- `packages/rules/tests/match-session.test.ts`: `33/33 PASS`;
- `packages/rules/src/__tests__/match-session-regressions.test.ts`: `11/11 PASS`;
- base-Power / revealed-source neighboring regressions: `27/27 PASS` (`20/20` Spartacus + `7/7` Sigurd);
- playtest pack loader: `21/21 PASS`.

Affected total: **`155/155 PASS`**.

Static/content gates:
- `FD_TOOLCHAIN_OK`;
- `npm run typecheck` PASS;
- `npm run content:validate` PASS — `7 masters / 19 servants / 20 events / 0 blocking issues`;
- `npm run content:compile` PASS — same counts;
- `npm run verify:generated-content` PASS:
  - content-library `eea4a067812644adb41989b3519fceddd0b11ba5985856e3f0fd525ffb713d52`;
  - fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`;
  - evidence-report `fe7a7388fda1eaa0fcab6b80dbb08104cabc2e27ccc0285be535045267cfb6f2`;
- Base..working-tree `packages/rules/src/**` production runtime delta EMPTY;
- production identity audit for `servant.xiangyu`, `sc-xiangyu`, Xiang Yu skill names, and `core.xiangyu-*`: CLEAN;
- `git diff --check` PASS.

## Accounting / gate

Before fresh R, strict formal accounting remains **`170/944`**, remaining **`774`**.

This Candidate claims three newly materialized frozen identities, but no credit is granted before exact fresh independent `MIGRATION_ACCEPTED` plus A-sync/accounting. If accepted and synchronized, the accounting transaction is exactly `+3`: `170/944 -> 173/944`, remaining `771`.