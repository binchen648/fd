# P3-B Dan Owner Readiness Complete Gap Set

Date: 2026-10-07
Task: `P3-B-DAN-OWNER-READINESS-CAPABILITY`
Branch: `codex/b-p3-dan-owner-readiness-complete-gap-set`
Exact Base: `2c3ed8ee7f7808d21e1afa062e56bdcc25393d8b`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Classification: zero-credit complete-owner readiness

## Frozen owner scope / accounting

The frozen `master.dan` scope is exactly three identities:

- `master.dan.skill.s1` — 可敬的狙击手
- `master.dan.skill.s1a` — 荣誉
- `master.dan.skill.ascension` — 五朔节骑士

Locked Reference identifies 丹·布拉克莫尔 with initial mana `4`. Canonical Dan authoring remains exactly `0/3`; this readiness transaction adds no Dan consumer authoring and no migration credit. Strict accounting therefore remains `247/944`, remaining `697`.

Reference-specific `core.dan-sniper`, `core.dan-honor`, and `core.attached-supply-append` handlers are provenance/discovery evidence only. Production authority implemented here is identity-free.

## Complete owner-local readiness gap set

### Workshop deployment -> current-round fixed terrain

Adds the exact identity-free `round_location_terrain_replacements` semantic:

- trusted trigger is `after_player_deployed_to_location`;
- only the controller's deployment to `magic_workshop` qualifies;
- for that round, the controller's terrain is fixed at `3` in `miyama_town` and `5` in `shinto`;
- the fixed value works even when the player has no ordinary deployment terrain slot at the destination;
- shared authored terrain adjustments and the ordinary active `basic.preparation` remote-operation multiplier still apply;
- state is current-round scoped and source/ability/event provenanced.

This reproduces the locked Reference behavior of 可敬的狙击手 without any Dan identity branch.

### Exact-two-opponent movement -> competition reward suppression

Adds the exact identity-free `arm_movement_competition_suppression` semantic:

- trusted trigger is `after_controller_enters_location` from an actual normal/effect move, never deployment;
- the destination must be an actual battlefield;
- the destination must contain exactly two other active opponents at movement time;
- authority freezes current round + battlefield + source/ability + movement event provenance;
- if the controller wins that battlefield, only that controller's `competition_vp` adjustment is suppressed; battle/event/location rewards are unchanged;
- the marker is ignored outside its frozen round/location and is retired by the authoritative battle-result event.

This reproduces 荣誉's movement-time condition while keeping the scoring pipeline generic.

### Ascension attached basic-card supply

Adds the exact identity-free attached-supply semantic:

- trusted initialization occurs on `after_master_ascension_unlocked`;
- exactly three physical `basic.preparation` (远隔操作) plus two physical `basic.surveil` (急行) cards are generated and bound to the ascension source;
- seeding is idempotent and source-provenanced;
- during the controller action phase, one remaining attached definition may be additionally played per round;
- the played card pays its normal printed mana cost, enters `attack_area` face up/active, emits ordinary use/play events, and does not consume the ordinary attack declaration quota;
- after a successful attached-supply play, the controller draws exactly one normal card through the shared draw/recycle authority;
- shared round-end attack-area cleanup owns the printed discard lifecycle;
- restore validation checks exact physical supply/source binding and round-use provenance.

The two legal phase actions distinguish the two supplied basic definitions; identical physical copies do not require an unnecessary private selection interaction.

## Verification

- Dan complete-owner readiness regression: `7/7 PASS`.
- Dan + affected shared terrain/scoring + authoring interpreter + MatchSession aggregate: `87/87 PASS`.
- `npm run typecheck`: PASS.
- `npm run content:validate`: PASS — `19 masters / 19 servants / 20 events / 0 blocking issues`.
- `npm run verify:generated-content`: PASS:
  - content library `90e4312ab3097f4c0e370ab4d573202c3ca3c011b9293ddc4db92b842bb87d71`
  - fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`
  - evidence report `7a6eeed4246641f832d6b7cdc84649593f8c7d2f58ecf263b38b4d5c724ea745`
- Phase-3 coverage verification: `archives=124`, `cards=275`, `abilities=477`, `compiledCards=205`, `compiledCharacters=38`, `blockingIssues=0`, `newRuntimeSemanticRouted=22`.
- Automation audit: `legacyResolveEffect=160`, `legacyExecuteAbility=3`, `notClassifiable=292`, `promotionFindings=20`.
- `data/authoring/**` delta: EMPTY.
- Production identity/text audit for `master.dan`, 丹·布拉克莫尔, 五朔节骑士, 可敬的狙击手, 荣誉, and `core.dan-`: CLEAN.
- `git diff --check`: PASS.

`npm run test:source-assets` still reproduces exactly `93` repository-pre-existing missing `chm-extract/图包` files. No Dan source path appears in that missing set; this historical repository-wide condition is not introduced by the readiness Candidate.

## Gate

This transaction is permanently zero-credit. No Dan consumer archive is materialized here.

One fresh independent exact Base/Candidate implementation review must return `IMPLEMENTATION_ACCEPTED_CANDIDATE` before FORMAL may perform the zero-credit readiness A-sync/rescan and release `P3-S-OWNER-DAN-COMPLETE-MIGRATION`.
