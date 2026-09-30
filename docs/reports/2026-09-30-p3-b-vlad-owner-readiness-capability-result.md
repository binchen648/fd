# P3-B Vlad Owner Readiness Capability Result

Role: Codex B
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Date: 2026-09-30
Base: `896911354f9833b8437f5f9a231eeba81e8d1584`
Classification: complete currently discoverable Vlad owner-readiness/capability batch; permanently zero migration credit

## Frozen owner scope

One indivisible readiness batch:

1. `servant.vlad.skill.sc-vlad-1` — 护国鬼将;
2. `servant.vlad.skill.sc-vlad-2` — 极刑王;
3. `servant.vlad.skill.sc-vlad-3` — 战斗续行.

Repository F1/source evidence is the semantic authority. Locked Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9` was used only as bounded behavior observation for runtime provenance details and legacy metadata; no legacy `core.vlad-*` identity handler was restored.

## Mechanical preflight / accounting boundary

- strict formal accounting entering readiness: `164/944`, remaining `780`;
- Base already contains canonical `servant.vlad.skill.sc-vlad-3` under `data/authoring/servants/servant.vlad.json`, with accepted F1 lineage `59f145434695d29bdd17e4cb3adc887e84182377`;
- sc3 is therefore preservation-only and must not receive duplicate migration credit;
- sc1/sc2 have accepted source evidence but no current canonical authoring/runtime consumer at Base;
- this Candidate changes no `data/authoring/**` file and grants zero migration credit.

## Generic terrain / fortification / extra-play capability

Production code contains no `servant.vlad`, `sc-vlad`, printed Chinese skill name, or `core.vlad-*` routing. Privileged mechanics are accepted only through an exact whole-ability structural gateway in `terrain-fortification-extra-play-capability.ts`.

### sc1 — action-phase terrain doubling

Accepted shape:
- ordinary action controller window;
- exact physical source remains owned/controlled, face-up, inactive, and in `skill`;
- requires current positive terrain advantage;
- pays exactly 1 mana through the shared spend authority;
- installs a round-scoped controller terrain multiplier of exactly 2;
- zero-terrain use is not exposed and cannot spend mana.

### sc1 — combat fortification

Accepted shape:
- ordinary combat controller action window;
- same inactive physical source provenance in `skill`;
- controller must currently occupy a battlefield;
- pays exactly 1 mana;
- only players with an authoritative actual `after_controller_enters_location` movement event into that exact battlefield during the current round receive total Power `-4`;
- initial deployment / merely remaining at the battlefield does not count as moving into it;
- the `-4` is represented by generic round-local player total-Power adjustment authority and is consumed by the existing combat projection;
- the exact fortification source/battlefield is armed until the authoritative `after_battle_result_determined` event for that battlefield;
- only an actual controller win arms one exact next-round forced deployment destination.

Next-round forced deployment is integrated into ordinary `MatchSession` deployment authority:
- only the exact battlefield remains legal for that player/round;
- all ordinary location legality/occupancy/deployment restrictions still apply;
- successful deployment continues through ordinary location reward, terrain assignment, `after_player_deployed_to_battlefield`, and `after_player_deployed_to_location` events;
- the forced destination authority is consumed only after successful deployment;
- restore validation authenticates source card, accepted ability, player, location, and round provenance.

### sc2 — normal first hand play + terrain-gated paid second play

Accepted shape:
- source is already live/active/face-up and owned/controlled by controller;
- action controller window;
- first target is exactly one current controller-owned hand card that can be legally effect-played face-up;
- second target is optional and becomes a live candidate only while controller has positive terrain;
- second target must be a different physical hand card and also independently legal to effect-play;
- both selected cards use the normal card play pipeline: their own card costs, on-play effects, physical play provenance, and play counts remain ordinary;
- the second selected card adds exactly 2 mana to the aggregate transaction cost;
- normal attack quota/timing is bypassed only because these plays are ability-effect plays;
- all natural card costs plus the optional extra 2 are preflighted transactionally before mutation; insufficient total mana leaves all cards/resources unchanged;
- generic pending-target restore recomputes first/second candidate authority and rejects stale or forged continuation state.

### sc3 — preservation-only

Existing canonical sc3 remains automatic and generic:
- action-phase movement;
- target any enabled location except Magic Workshop;
- existing movement/occupancy/lock authority remains in force.

No sc3 runtime change or migration credit is introduced by this readiness Candidate.

## Loader / durability boundary

- custom condition `controller_has_positive_terrain` is exact structural authority;
- custom card constraint `effect_playable_face_up` derives candidates from the existing play preflight rather than card names;
- custom effects are `double_controller_terrain_this_round`, `fortify_moved_in_battlefield_and_arm_next_round_deployment`, and `play_hand_cards_with_terrain_optional_second`;
- any widened privileged shape fails closed at `terrainFortification.gateway`;
- new movement-entry / round-Power / pending-fortification / forced-deployment authorities are serialized inside `AbilityRuntime` and explicitly checked by generic restore provenance validation.

## Verification

- Vlad readiness focused regression: `11/11 PASS`;
- complex skills regression: `38/38 PASS`;
- MatchSession: `33/33 PASS`;
- generic MatchSession regressions: `11/11 PASS`;
- affected aggregate: **`93/93 PASS`**;
- `E:\Codex\FD\binchen648_fd\tools\verify-toolchain.cmd`: `FD_TOOLCHAIN_OK`;
- `npm run typecheck`: PASS;
- `npm run content:validate`: PASS — `7 masters / 16 servants / 20 events / 0 blocking issues`;
- `npm run content:compile`: PASS — same counts;
- `npm run verify:generated-content`: PASS:
  - content library `a49e05a3827942552fb2465c2dd00218fe12651d1be40ed2e536f8a57819094a`;
  - fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`;
  - evidence report `d24806da4788edd65131a5f4783333904bacce75d65198d28bf83f4abb73e625`;
- `data/authoring/**` Base..working-tree delta: EMPTY;
- production identity-routing audit for Vlad / sc-vlad / printed names / legacy handler names: CLEAN;
- `git diff --check`: PASS.

## Next transaction

Freeze one exact readiness Candidate / one PR / one fresh independent Reviewer for sc1 + sc2 + sc3 together. This readiness transaction is permanently zero-credit.

ACCEPTED -> one A-sync/full-owner rescan while remaining on `servant.vlad`; only then may one formal owner-complete Candidate be produced for still-unmigrated frozen identities. sc3 remains preservation-only.