# P3-B Akiha owner-readiness follow-up — generic Master ascension unlock

Date: 2026-10-01
Task: `P3-B-AKIHA-OWNER-READINESS-MASTER-ASCENSION-UNLOCK`
Classification: zero-credit generic capability follow-up
Exact Base: `d7f49dacd751b73264088c9b6fd0566b4ae7c9d5`
Strict accounting: `181/944`, remaining `763`

## Why formal stopped

During materialization of Akiha's five-identity formal owner archive, the frozen ascension 【璀璨空想】 was confirmed as an outside-game Master Skill (Magic, cost 3, requirement 3, Power 6). The development source's shared `checkAscensionUnlock()` establishes that ordinary Master ascension unlock is not an Akiha-local effect: Shakespeare's frozen sc2 【魔力附加】 / 【角色颠倒】 unlocks the current controller's Master ascension.

The current canonical Shakespeare archive contains only sc1 and current production had no identity-free authority for this cross-owner unlock. Writing Akiha's outside-game ascension without the shared authority would create a card that cannot be unlocked through the frozen Shakespeare rule. Formal migration therefore paused before any Akiha consumer delta.

## Generic closure

The Candidate adds `master-ascension-unlock-capability.ts` with privileged effect `unlock_controller_master_ascension`. It never references Akiha, Shakespeare, Chinese names or legacy handler IDs.

Authority is structural:
- source physical card is controller-owned, in the skill zone, is a `servant_skill`, and its definition owner equals the controller's live `servantCardId`;
- target is the exact canonical `<masterCardId>.skill.ascension` definition for the live current Master;
- target must be `master_skill`, owner-matching, `initialPlacement=outside_game`, automatic;
- zero target is a safe no-op so the future Shakespeare consumer does not break owners whose ascension has not yet been materialized;
- an existing matching physical target prevents duplicate/re-provision; wrong ownership or duplicates fail closed;
- a newly unlocked target is created owner-only in the controller skill zone with exact `generatedBy` provenance.

Whole-ability admission accepts only exact forced `round_start` or exact controller Action phase activation shells. Privileged widening is rejected by the loader gateway.

No Shakespeare sc2 consumer and no Akiha consumer are introduced in this readiness transaction.

## Verification

- new focused synthetic regression: `5/5 PASS`; uses `servant.fixture-poet` / `master.fixture-owner` and real `round_start` + `dispatchAbilityCommand` paths;
- executable pack + pack loader + accepted Akiha/Akasha neighboring: `105/105 PASS`;
- existing game-start provisioning + deployment Resource reward (Shakespeare-sc1 neighboring) + complex + MatchSession + restore: `96/96 PASS`;
- unique affected aggregate: **`201/201 PASS`**;
- `FD_TOOLCHAIN_OK`;
- typecheck PASS;
- content validate/compile PASS: `8 masters / 19 servants / 20 events / 0 blocking issues`;
- generated determinism PASS, unchanged hashes:
  - content-library `9bded243cd7dddf19f7896c2f1af6f79b917e9a28d76fd13071529cbdd8d316e`;
  - fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`;
  - evidence-report `fd3081d8fadf2f81a7e070feff815ac893e2188cb5d3b18efdd74cc1b8460f8c`;
- Base..working-tree `data/authoring/**` delta EMPTY;
- production identity audit CLEAN;
- `git diff --check` PASS.

## Accounting / next boundary

This is permanently zero-credit. Strict accounting remains `181/944`, remaining `763`. Akiha formal remains blocked until exact acceptance plus FORMAL A-sync/full-owner rescan. Shakespeare sc2 itself remains a future Shakespeare-owner consumer migration; this follow-up authorizes only the shared identity-free runtime seam.
