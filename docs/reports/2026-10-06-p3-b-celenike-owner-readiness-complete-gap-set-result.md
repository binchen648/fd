# P3-B Celenike Owner Readiness Complete Gap Set Result

Date: 2026-10-06
Task: `P3-B-CELENIKE-OWNER-READINESS-CAPABILITY`
Role: FORMAL readiness / permanently zero-credit
Exact Base: `1b793b97f6aca6d3b8d9e1d77ff498e1aa6e2c78`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Frozen owner scope and accounting

The stable full-roster owner order places `master.celenike` immediately after accepted `master.caules`. The frozen owner scope is exactly:

- `master.celenike.skill.ascension` — 宵泣之铁桩
- `master.celenike.skill.s1` — 诅咒师
- `master.celenike.skill.s1a` — 纵欲

Canonical `data/authoring/masters/master.celenike.json` is absent at Exact Base, so canonical authoring coverage remains `0/3`. Historical FB2-03 includes `s1a` only as a fixed Resource Numeric component member; its own handoff explicitly does not authorize the parent trigger/action/condition route and grants no migration credit. Strict accounting therefore remains `220/944`, remaining `724` throughout this readiness task.

## Source / Reference recovery

The locked Reference was used as corroborating behavior/static evidence together with frozen F1 inventory/source evidence; Reference runtime code is not copied as identity routing.

`master.celenike.skill.s1` / 诅咒师:

- after the controller loses a battle, every winner of that battle receives a source-scoped Wither status;
- each Celenike source owns its own Wither provenance;
- that source's Wither clears when its controller has gained at least 4 gross VP in the same round;
- after the controller wins a battle, every Withered participant in that battle transfers up to 2 VP, bounded by the target's actual VP, to the controller.

`master.celenike.skill.ascension` / 宵泣之铁桩:

- Pain Stake is an action-phase ability;
- every active Withered player resolves a mandatory choice owned by that player;
- if the player can afford 2 mana they may pay exactly 2 mana or discard their entire hand; otherwise discard-all is the only legal choice;
- multiple affected players resolve sequentially in seat/turn order.

`master.celenike.skill.s1a` / 纵欲:

- at battle-phase end, if the controller is at Magic Workshop, gain 2 mana and lose 1 VP;
- the accepted current runtime's authoritative phase-terminal event is `after_battle_ended`, so the readiness seam binds to that event rather than introducing another scheduler.

## Implemented identity-free readiness seam

One shared `battle-wither-capability.ts` closes the complete currently reproduced owner-local gap set. It introduces four strictly shaped privileged operations and rejects malformed/widened whole-ability forms in the authoring loader:

- `battle_wither_apply_to_winners`;
- `battle_wither_steal_from_participants`;
- `wither_pain_stake_action`;
- `location_battle_end_resource_adjustment`.

The runtime stores Wither and its source provenance in structured player flags, with per-source round/gross-VP tracking. Positive VP delta reconciliation clears only the appropriate source controller's Wither at the 4-VP threshold and resets the gross counter on a new round.

Pain Stake uses a server-authored `wither_pain_stake_v1` pending interaction. The pending choice is projected only to the target player, validates live source/status/revision provenance on resolution and restore, pays through canonical `spendMana`, and discards the complete target hand to the ordinary owner-private discard zone. Forged source/status or pending-interaction state fails restore validation.

The battle-end resource branch uses canonical `grantMana`, preserving normal storage caps/suppression rules, and applies VP loss with the ordinary zero floor. No Celenike id, owner/skill name, printed-text parsing, or legacy handler id is used for production routing.

## Verification

Focused Celenike readiness regression: `7/7 PASS`.

Task-relevant affected aggregate: `225/225 PASS` across 18 files with `--maxWorkers=1`, including authoring interpreter/compiler, MatchSession, Resource Numeric, battle result/terminal consumers, current accepted owner/readiness suites, and ascension/deployment compatibility.

Repository gates:

- typecheck: PASS;
- content validation: `16 masters / 19 servants / 20 events / 0 blocking issues`;
- generated determinism: PASS;
  - content library `3a41527740651f400a18619d5b1f8993858c32a704be47fe77ae22f11f38c82f`;
  - fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`;
  - evidence report `7fb41d5b2e24e0482b818d2cfc52ef544e4638920d48687300a353fba5c7b0e5`;
- Phase-3 coverage completed: `archives=121`, `cards=248`, `abilities=442`, `compiledCards=175`, `compiledCharacters=35`, `blockingIssues=0`, `newRuntimeSemanticRouted=22`;
- automation audit completed: `legacyResolveEffect=158`, `legacyExecuteAbility=3`, `notClassifiable=259`, `promotionFindings=20`;
- verification-only coverage/audit artifacts were restored from Exact Base and are not Candidate changes;
- production Celenike identity/text audit: CLEAN;
- `data/authoring/**` delta: EMPTY;
- `git diff --check`: PASS.

## Formal disposition

This is readiness/capability work and is permanently zero-credit. It may not advance `220/944` by itself. The next legal transition is one fresh independent exact Base/Candidate review. Only an accepted readiness verdict plus FORMAL zero-credit A-sync/full-owner rescan may release one owner-complete Celenike consumer migration for all three frozen identities together.
