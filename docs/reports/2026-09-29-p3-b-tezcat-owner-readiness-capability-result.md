# P3-B Tezcat Owner Readiness Capability Result

Date: 2026-09-29
Base: `bbf17412961e24b1cb6453e7b406bf9522dc4db6`
Branch: `codex/b-p3-tezcat-owner-readiness-capability`
Owner root: `servant.tezcat`
Classification: bounded owner-readiness/capability, permanently zero migration credit
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Strict formal accounting: `154/944`, remaining `790`

## Source-grounded owner preflight

Frozen owner scope is exactly:

1. `servant.tezcat.skill.sc-tezcat-1` — 群豹之王;
2. `servant.tezcat.skill.sc-tezcat-2` — 战士之司;
3. `servant.tezcat.skill.sc-tezcat-3` — 第一太阳纪.

Accepted F1 source-evidence closure is the final Phase 3 source-evidence chain ending at review commit `59f145434695d29bdd17e4cb3adc887e84182377`. The accepted normalized source for all three Tezcat identities is `Fate_Domination-开发版/batch_caster_assassin.js`; locked Reference handlers are static/observed metadata only and are not semantic authority.

The accepted source text requires:

- sc1: this card is additional-play-only; every other attack played in the same batch gets +1 Power and +2 mana cost, including cards played simultaneously;
- sc2: once per round in the action phase, all active players at the controller's battlefield may each, in turn order, optionally play one attack; a participating player who loses that battle loses 2 VP; if an opponent loses VP because of this effect, the controller gains 2 VP;
- sc3: true-name/per-game card play, exactly one ordinary Command Seal as a play cost, then in combat defeat all engaged opponents.

## Readiness gap set and closure

No current canonical consumer authoring exists for Tezcat. Existing generic infrastructure already covered only fragments (required-additional marker, ordinary/effect card play, command-seal resource primitives, battle defeat markers). One compatible identity-free readiness batch was required for the complete owner gap set.

This Candidate adds one exact/fail-closed generic family:

- `joint_play_other_attacks_cost_power_modifier` — exact sc1 sibling-attack +2 paid-cost / +1 Power semantics layered into authoritative `playBatch`;
- `same_battlefield_turn_order_optional_attack_with_loss_vp` — server-owned sc2 turn-order optional-attack transaction, physical paid play through `playBatch`, exact participant provenance, deferred authoritative battle-result settlement, loser -2 VP and conditional controller +2 VP;
- `card_play_command_seal_cost` — exact sc3 ordinary Command Seal card-play cost, without fabricating an ordinary Command Seal ability use;
- `defeat_all_engaged_opponents` — exact combat defeat of eligible active same-battlefield opponents, preserving generic other-player ability immunity and battle-loss immunity.

The family is structural and identity-free. Loader admission is whole-ability exact and rejects widened near matches. Live sc2 decision state is serialized with authenticated source/controller/battlefield/round/candidate provenance and is revalidated on restore and dispatch.

## Verification

Focused Tezcat readiness regression: `7/7 PASS`.

It covers:

- exact privileged-shape acceptance plus widened-near-match rejection;
- sc1 additional-play requirement, simultaneous sibling cost increase, sibling-only Power bonus, and round lifecycle;
- sc2 real paid attack play in round order, opt-out behavior, actual-participant provenance, loser VP settlement and controller reward, once-per-round gating;
- sc2 live transaction serialize/restore plus forged candidate rejection;
- sc3 exact one-Command-Seal play cost, no false ordinary Command Seal-use history, physical-card per-game play limit;
- sc3 all-eligible-opponent defeat, generic loss-immunity preservation, no same-round repeat;
- production identity audit.

Affected green set: `8 files / 114 tests PASS`:

- Tezcat readiness `7`;
- authoring interpreter `38`;
- full MatchSession `33`;
- game-loop action play `9`;
- attack play classifier `11`;
- card action play `4`;
- required-additional play `8`;
- fixed-controller Command Seal component `4`.

Static gates:

- `FD_TOOLCHAIN_OK`;
- `npm run typecheck` PASS;
- `npm run content:validate` PASS — `7 masters / 12 servants / 20 events / 0 blocking issues`;
- `npm run content:compile` PASS with the same result;
- `npm run verify:generated-content` PASS with deterministic hashes unchanged:
  - content library `b2c446488a28c5036ac36557e09b563b54b11018d5396233a53f37ffdbff6923`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence report `f4ae33de4dc2832766064bdf46e277d9559398d4d34b45d7d05a0eb76744cd14`;
- `data/authoring/**` Base..Candidate delta EMPTY;
- changed production runtime contains no Tezcat/card-name/printed-text/legacy `core.tezcat-*`/`SkillLib` identity routing;
- `git diff --check` PASS.

## Accounting and next step

This task is permanently zero-credit. Strict formal accounting remains **`154/944`**, remaining **`790`** regardless of readiness acceptance.

Predecessor exact Candidate `51a7d5735628b77403467eb0908ff451b4254205` received `IMPLEMENTATION_NEEDS_REVISION`. Reviewer GitHub publication failed with explicit 403; Coordinator published the same-attempt bounded relay at `https://github.com/binchen648/fd/pull/487#issuecomment-5890536697` before any revision work.

The two exact-scope sc2 blockers are closed together in the successor revision:

- restored `orderPlayerIds` / progress are now bound to a dedicated server-owned authority record keyed by an authenticated transaction id. Authority records freeze the activation-time order and advance progress only through canonical server transitions. MatchSession current/replay persistence carries an HMAC-sealed authority snapshot bound to the exact serialized state, persistence scope, and checkpoint;
- completed settlement `playedPlayerIds` are reconstructed/bound to server-owned participation records written only after a real physical attack successfully passes authoritative `playBatch`. The sealed authority retains the participating physical card ids and exact participant sequence until the matching settlement is consumed;
- dispatch/staging reject live transaction metadata that disagrees with server authority, and settlement rejects participant substitutions. Authority is copied across transactional state clones and retired after settlement/round lifecycle;
- restore regression now mutates a legitimate live order `[p1,p2]` to `[p1]` while leaving the current p1 decision otherwise valid and proves rejection by the battlefield attack-offer persisted-authority gate;
- restore regression also mutates a legitimate completed settlement participant set from `['p2']` to another existing player `['p3']` and proves rejection by the same dedicated authority gate.

Successor verification after both closures:

- focused Tezcat readiness `8/8 PASS`;
- affected set `8 files / 115 tests PASS`, including MatchSession `33/33`;
- `FD_TOOLCHAIN_OK`;
- `npm run typecheck` PASS;
- content validate/compile PASS: `7 masters / 12 servants / 20 events / 0 blocking issues`;
- generated-content determinism PASS with unchanged hashes;
- `data/authoring/**` Base..working successor delta remains EMPTY;
- production identity audit including the new authority module and MatchSession is CLEAN;
- `git diff --check` PASS.

This task remains permanently zero-credit. The successor exact Candidate must receive one fresh independent readiness review over the whole bounded Tezcat readiness family. If accepted, FORMAL performs one A-sync/rescan of the complete Tezcat owner. Only if that rescan finds no additional gap may the later single owner-complete formal migration author sc1 + sc2 + sc3 together in one Candidate/PR/fresh R/A-sync sequence.
