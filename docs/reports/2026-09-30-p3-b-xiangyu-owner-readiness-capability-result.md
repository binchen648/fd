# P3-B Xiang Yu Owner Readiness Capability Result

Role: Codex B / FORMAL readiness
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Date: 2026-09-30
Base: `f79cab7c4d3580f838bf117a22f7d92bd30eed92`
Classification: complete currently discoverable Xiang Yu owner-readiness/capability batch; permanently zero migration credit

## Frozen owner scope

One indivisible readiness batch:

1. `servant.xiangyu.skill.sc-xiangyu-1` — 战术躯体;
2. `servant.xiangyu.skill.sc-xiangyu-2` — 霸王之武;
3. `servant.xiangyu.skill.sc-xiangyu-3` — 力拔山兮气盖世.

Strict formal accounting remains `170/944`, remaining `774`. This readiness Candidate changes no `data/authoring/**` file and grants zero migration credit.

Repository frozen/source evidence is semantic authority. Locked Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9` was used only as bounded behavioral corroboration. No `servant.xiangyu`, `sc-xiangyu`, printed-name, or `core.xiangyu-*` identity routing is added to production rules runtime.

## Complete owner-local readiness gap set

### sc1 — round reaction counter observation and battle-end decay

The new identity-free reaction-counter capability family supports:
- arming one exact source/ability/counter key for the authoritative current round;
- during an opponent's own action turn, one reaction per exact face-up skill-card play event, using the event's physical `sourceCardId` rather than trusting the aggregate batch array;
- one reaction per authoritative ordinary Command Seal ability use and one per authoritative Ruler Seal ability use; a Command Seal merely paid as a card-play cost remains excluded;
- one reaction when that opponent moves into the armed controller's exact battlefield, at most once per opponent per round;
- no credit for the controller themself, another player's turn, an unrelated location, stale round state, or forged provider controller/source provenance;
- authoritative `after_battle_ended` decay loses `ceil(current / 2)` reaction, leaving floor half.

The capability stores reaction and arm provenance through existing structured player/round flag authority; no owner-specific runtime field is added.

### sc2 — repeatable reaction purchases

The same structural family supports repeatable combat-window purchases while reaction remains:
- 1 reaction: one step backward on the current canonical four-location gameplay route;
- 2 reaction: one step forward on that route;
- 4 reaction: play the physical deck-top card through normal effect-play semantics and pay its normal mana cost;
- 7 reaction: choose one currently legal face-up hand card and effect-play it for free.

Generic phase-action once-per-round bookkeeping is deliberately bypassed only for an exact accepted reaction-counter whole-ability shape. Movement still respects enabled locations, occupancy and persistent/Ruler movement locks. Both paid/free card branches use normal `playBatch` authority so ordinary on-play/play-count/visibility semantics remain authoritative.

### sc3 — mana conversion and movement-gated physical-source base Power

The capability supports:
- action window: pay exactly 1 mana to gain exactly 2 reaction, repeatable while payment remains legal;
- combat window: only after authoritative current-round movement distance is at least 3, set the exact active physical source's base-Power multiplier to exactly 2;
- the multiplier applies only while that physical source remains active, so closing/deactivating the source immediately removes the effective multiplier without a separate identity handler.

The movement threshold reuses existing serialized `movementDistanceThisRound` authority rather than introducing a second movement counter.

## Structural/fail-closed boundary

- privileged reaction nodes are accepted only by exact whole-ability validators in `reaction-counter-capability.ts`;
- widened effect values/keys are loader-disabled;
- the free-hand target uses the existing exact `effect_playable_face_up` candidate constraint, so unplayable hand cards are never privileged candidates;
- arm provenance re-resolves the exact physical source/controller/ability/counter key before event credit;
- action-turn attribution uses current authoritative round phase + priority seat;
- ordinary/Ruler Seal credit is attached to existing trusted seal-use markers, not card-play seal costs;
- all card plays remain transactional through existing play authority;
- Base..working-tree `data/authoring/**` delta is EMPTY;
- production identity audit under `packages/rules/src/**` for Xiang Yu IDs/names/legacy handlers is CLEAN.

## Verification

- Xiang Yu readiness focused regression: `11/11 PASS`;
- Tezcat Command-Seal/card-play neighboring capability regression: `8/8 PASS`;
- complex skills regression: `38/38 PASS`;
- MatchSession: `33/33 PASS`;
- generic MatchSession regressions: `11/11 PASS`;
- existing direct base-Power multiplier/revealed-source neighboring regressions: `27/27 PASS`;
- affected aggregate: **`128/128 PASS`**;
- `E:\Codex\FD\binchen648_fd\tools\verify-toolchain.cmd`: `FD_TOOLCHAIN_OK`;
- `npm run typecheck`: PASS;
- `npm run content:validate`: PASS — `7 masters / 18 servants / 20 events / 0 blocking issues`;
- `npm run content:compile`: PASS — same counts;
- `npm run verify:generated-content`: PASS:
  - content library `b001533b86c695069982a85ffa35ec4de3a30b623b41554f4f6441972d65f50e`;
  - fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`;
  - evidence report `8346639085dad774da89824712814cf56ffd58b91bf407155871aefd255060e6`;
- `git diff --check`: PASS.

## Next transaction

Freeze one exact readiness Candidate / one PR / one fresh independent Reviewer for sc1 + sc2 + sc3 together. This transaction is permanently zero-credit.

ACCEPTED -> one FORMAL-only A-sync/full-owner rescan while remaining on `servant.xiangyu`; only that rescan may determine which Xiang Yu frozen identities remain newly creditable for one later owner-complete formal migration Candidate.
