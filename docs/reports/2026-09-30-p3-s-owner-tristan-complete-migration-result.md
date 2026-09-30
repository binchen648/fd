# P3-S Owner Tristan Complete Migration Result

Role: Codex S / FORMAL
Status: `IMPLEMENTED_AWAITING_REVIEW`
Date: 2026-09-30
Base: `d577b1ebca780ec0332440901486320e7bc04e58`
Branch: `codex/s-p3-owner-tristan-complete-migration`
Classification: formal owner-complete migration for `servant.tristan`

## Accepted prerequisite

The zero-credit Tristan readiness transaction is already synchronized:

- readiness PR `#490` exact Candidate `5fb8f59539c17bc868e00d628d50ee5f05bf9812`;
- fresh independent verdict `IMPLEMENTATION_ACCEPTED_CANDIDATE`;
- canonical same-attempt evidence relay `https://github.com/binchen648/fd/pull/490#issuecomment-5903982665`;
- FORMAL readiness A-sync/rescan commit `d577b1ebca780ec0332440901486320e7bc04e58`;
- A-rescan established the frozen owner scope as exactly sc1 + sc2 + sc3, with sc1/sc2 absent and newly creditable and sc3 already counted by accepted FM04/R32.

Strict formal accounting therefore remains `157/944`, remaining `787` until this exact formal owner Candidate receives `MIGRATION_ACCEPTED` and subsequent A-sync/accounting.

## Owner-complete migration

This transaction keeps the entire Tristan owner in one formal Candidate:

1. `servant.tristan.skill.sc-tristan-1` — 痛哭幻奏 — newly creditable;
2. `servant.tristan.skill.sc-tristan-2` — 高声颂爱 — newly creditable;
3. `servant.tristan.skill.sc-tristan-3` — 单独行动（Archer Class） — preservation-only / already accounted.

`data/authoring/servants/servant.tristan.json` now contains the complete three-card frozen owner archive plus the locked-reference 12-card starting deck. Tristan is wired into `fd-playtest-v1` immediately after Tomoe, preserving the frozen first-occurrence owner order established by the accepted A-rescan.

## sc1 — 痛哭幻奏

F1/source text is preserved exactly:

- `【真名解放】`
- `悲叹共鸣-战斗阶段：关闭你战斗中除此牌外的，所有与另一张攻击具有相同基本威力的非残留攻击。若没有，更改为弃置你牌库顶的三张牌。`

Source-text SHA-256: `778a206e13d82a0be79c92273404968006c7e1a393ce88212f876160a42487e3`.

Locked Reference contributes only static card metadata: `typeLabel=迅捷/宝具`, attributes `迅捷 + 宝具`, cost `5`, base Power `7`, historical requirement `8`. Canonical servant skill-zone threshold remains `8`.

The accepted readiness capability is consumed without identity routing:

- combat phase action from a live source;
- source excluded;
- residual attacks excluded;
- duplicate groups compare authoritative base Power;
- all attacks in duplicate base-Power groups close together;
- if no duplicate group exists, discard up to the controller deck top three cards.

True-name declaration is intentionally a separate `declaration_reveal` ability. The privileged lament-resonance ability therefore retains the exact accepted empty-visibility structural shape at runtime while ordinary card play still performs `真名解放` through the canonical `on_use_declared` route.

## sc2 — 高声颂爱

F1/source text is preserved exactly:

- `打出时：将你弃牌堆内任意数量的牌洗回牌库。`
- `X为你以此效果洗回的牌的数量+2直至此牌关闭。`
- `记忆渐熄-残留：你进行战斗的战斗阶段需花费X点魔力，否则关闭此牌。`

Source-text SHA-256: `f9746f59500104bdf2fe8c0db78dc60f514629e372e92c4ed82f211578264ade`.

Locked Reference static metadata is `typeLabel=魔术`, cost `2`, printed base Power `X`, historical requirement `2`. Final-rule servant skill-zone threshold is still `8`; historical requirement `2` remains metadata only.

The authoring schema requires numeric base Power, so the archive stores seed `0` while explicitly retaining printed `X` in phase3 evidence. The already-accepted physical `sourceBoundX` contract is authoritative for live base Power before combat use:

- owner-private current discard choice `0..N`;
- selected cards return to deck and shuffle deterministically;
- physical source X = selected count + 2, including X=2 for zero selection;
- X overrides the live source's base Power;
- an active controller located at a battlefield participates even with zero active attacks and pays X exactly once for that battle round;
- insufficient mana closes that exact physical source without negative mana;
- source close clears X/upkeep state.

## sc3 preservation

`servant.tristan.skill.sc-tristan-3` is preserved as the previously accepted FM04 Independent Action member:

- first-half action +3 VP;
- post-loss -5 VP;
- unpreventable loss exception;
- no duplicate migration credit.

## Canonical pack integration

The former FM04 archive was intentionally minimal and was not a complete playable owner package. Owner-complete migration adds the missing integration boundary:

- locked-reference 12-card starting deck;
- explicit development-image source declaration;
- Tristan archive entry in `data/packs/fd-playtest-v1/pack.json`;
- regenerated executable content library / fixture / evidence report;
- canonical production pack now compiles with `7 masters / 14 servants / 20 events / 0 blocking issues`.

The pack order is `... Tomoe -> Tristan -> Kintoki ...`, matching frozen first-occurrence owner order rather than appending Tristan arbitrarily.

## Generic MatchSession integration closure

Canonical roster expansion exposed an unrelated identity-free durability gap in the real MatchSession path: battle scoring could eliminate a player after terrain assignment, while `modeState.terrainAssignments` / `terrainAssignmentSlots` still retained that eliminated player. The restore contract correctly rejects terrain authority for non-active players, making an otherwise untouched serialized session non-restorable.

The formal Candidate closes only that generic integration seam:

- after battle scoring, terrain authority is reconciled to players that are still active and still located at that battlefield;
- stale slot overrides are removed with the corresponding stale assignment;
- surviving explicit terrain slots are not renumbered or rewritten;
- no Tristan/card-name/printed-text routing is introduced.

A generic MatchSession regression now proves a scored round drops eliminated terrain occupants and the unmodified durable snapshot restores successfully. The existing long-match smoke also recognizes `human_input`, already part of the exported `MatchPauseReason` contract, as an explicit handled pause reason when roster expansion changes the deterministic fixed-seed interaction path.

This generic durability closure creates no additional migration identity or credit beyond sc1 + sc2.

## Verification

Focused / affected verification is green:

- Tristan formal owner migration: `5/5 PASS`;
- Tristan accepted readiness regression: `11/11 PASS`;
- complex skills regression: `38/38 PASS`;
- MatchSession suite: `33/33 PASS`;
- generic MatchSession regressions: `11/11 PASS`;
- playtest pack loader: `21/21 PASS`;
- focused/affected aggregate: `119/119 PASS`;
- `FD_TOOLCHAIN_OK`;
- `npm run typecheck` PASS;
- content validate/compile PASS: `7 masters / 14 servants / 20 events / 0 blocking issues`;
- generated-content determinism PASS;
- production identity audit for `servant.tristan` / `sc-tristan` / printed names / legacy handlers CLEAN;
- `git diff --check` PASS.

Generated determinism hashes:

- `fd-playtest-v1.content-library.json`: `4cc550ff5147c9605b28100f4aa0b7131c3284eb495e66e4dbfacb544b0e3ae6`;
- `fd-playtest-v1.fixture.json`: `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`;
- `fd-playtest-v1.evidence-report.json`: `9a35abf0bc83ba190a9f5266039f904970a6904d3cf041ca22c33280c8677fb0`.

## Accounting boundary

No credit is claimed before formal fresh R and A-sync/accounting.

If this exact owner-complete Candidate receives `MIGRATION_ACCEPTED`, subsequent A-sync/accounting may add exactly:

- `servant.tristan.skill.sc-tristan-1`;
- `servant.tristan.skill.sc-tristan-2`.

That would move strict formal accounting `157/944 -> 159/944`, remaining `787 -> 785`. sc3 must not be counted again.
