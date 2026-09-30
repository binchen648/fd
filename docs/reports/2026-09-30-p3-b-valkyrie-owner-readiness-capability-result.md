# P3-B Valkyrie Owner Readiness Capability Result

Role: Codex B
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Date: 2026-09-30
Base: `d7dc60c4f51f28651494d2f39677037803287280`
Classification: complete currently discoverable Valkyrie owner-readiness/capability batch; permanently zero migration credit

## Frozen owner scope

One indivisible owner-readiness batch:

1. `servant.valkyrie.skill.sc-valkyrie-1` — 终末幻想·少女降临;
2. `servant.valkyrie.skill.sc-valkyrie-2` — 天鹅礼装;
3. `servant.valkyrie.skill.sc-valkyrie-3` — 伪·大神宣言.

Canonical rule authority is the repository's frozen source-evidence / Phase 3 contract. Locked Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9` is NON_AUTHORITATIVE for runtime semantics and was used only for static metadata and bounded behavior observation where the printed text left an interaction detail unstated.

## Mechanical preflight / accounting boundary

- strict formal accounting entering this task is `161/944`, remaining `783`;
- there is no canonical `data/authoring/servants/servant.valkyrie.json` at Base;
- all sc1/sc2/sc3 frozen identities therefore remain formal-migration pending;
- old full-roster catalog entries are readiness hints only and do not authorize legacy identity handlers;
- sc3 already has source-grounded structural authoring evidence using `card_count_at_least` plus `retrigger_card_play_effects`, but production runtime lacked both exact semantics;
- this readiness Candidate changes no `data/authoring/**` file and grants zero migration credit;
- no Valkyrie skill may receive migration credit until a later owner-complete formal Candidate receives `MIGRATION_ACCEPTED` and subsequent A-sync/accounting.

## Implemented generic Commander lifecycle capability

Production runtime contains no `valkyrie`, `sc-valkyrie`, Chinese printed name, or `core.valkyrie-*` routing. Privileged effects are structural, exact-whole-ability gated and fail closed.

### sc1 — definition-set relocation without play semantics

Accepted generic shape:

- advance/前哨 controller action window;
- owned source;
- per-game one use;
- exact declared definition-ID set;
- one owner-only destination choice per definition: `hand` or `attack_area`;
- every required physical definition must exist exactly once under the controller's owner/control authority before resolution;
- source cards may currently be in any physical zone, including `removed_from_game`;
- attack destinations become live/public/face-up with paid play mana `0`;
- hand destinations become inactive owner-private cards;
- relocation does not call the normal play route, does not increment `cardPlayCountByInstance`, and does not emit `on_card_played`;
- duplicate/omitted/forged destination authority rejects transactionally;
- generic pending-decision restore recomputes the exact candidate set and rejects forged continuation authority.

The bounded Reference observation agrees with the printed wording that the three destination choices are independent; it is not used as a semantic authority beyond resolving that otherwise-unwritten UI detail.

### sc2 — ordinary one-arrow movement

No new privileged movement runtime was added. Both action-phase and combat-phase movement clauses can consume the existing generic location target authority:

- target is one enabled location reachable along map arrows from `controller.currentLocation`;
- `maxSteps: 1`;
- existing occupancy / location-enable / movement-lock authority remains in force;
- the source must be live for these movement actions;
- the action and combat windows remain separate authored phase actions.

### sc2 — current-source-cost recall + source join

Accepted generic privileged shape:

- combat controller action window;
- exact source remains owned/controlled, face-up, inactive and physically in `skill`;
- target is exactly one current live/face-up owned-and-controlled `attack_area` card from a declared definition-ID set;
- target candidates are server-derived from the live physical state; stale/inactive/foreign/face-down candidates are excluded;
- current source play cost is computed through `effectiveCardPlayCost` before mutation;
- insufficient mana fails before either physical card moves;
- successful resolution uses the common `spendMana` authority, including its mana-spent ledger hook;
- target is returned to hand/inactive;
- exact source joins `attack_area`, face-up and active, with `paidManaOnPlay=0`;
- source join bypasses the normal card-play route, so no `on_card_played` and no play-count increment occurs;
- pending-target restore recomputes current live candidate authority and rejects stale continuation state.

### sc3 — source-grounded active definition-set on-play retrigger

The existing source-grounded `retrigger_card_play_effects` name is preserved rather than replaced by an invented synonym.

- action-phase controller action window;
- owned source with true-name reveal on use;
- exact `card_count_at_least` structural condition requires at least one active/face-up controller `attack_area` card in the declared definition-ID set;
- `retrigger_card_play_effects` re-emits an authoritative `on_card_played` event for each current live matching physical card without moving/replaying that card;
- the physical card's existing play count is not incremented;
- inactive, face-down, hand-zone, foreign-owner/control, or non-member cards are excluded;
- the three frozen Commander on-play clauses are synchronous Power effects, so this fixed definition-set does not require a new multi-decision queue subsystem.

## Loader / security boundary

`commander-card-lifecycle-capability.ts` owns exact validators for the three privileged semantics plus the source-grounded active-card-count condition.

- any widened privileged node is rejected at `commanderLifecycle.gateway` unless the entire ability matches an accepted exact shape;
- effect authorization is based on structural fields and declared definition IDs, never character/card display names;
- the runtime repeats physical owner/controller/zone/active/cost validation immediately before mutation.

## Verification

- `E:\\Codex\\FD\\binchen648_fd\\tools\\verify-toolchain.cmd`: `FD_TOOLCHAIN_OK`;
- Valkyrie readiness regression: `10/10 PASS`;
- complex skills regression: `38/38 PASS`;
- MatchSession: `33/33 PASS`;
- generic MatchSession regressions: `11/11 PASS`;
- affected aggregate: **4 files / 92 tests PASS**;
- `npm run typecheck`: PASS;
- `npm run content:validate`: PASS — `7 masters / 15 servants / 20 events / 0 blocking issues`;
- `npm run content:compile`: PASS — same counts;
- `npm run verify:generated-content`: PASS with deterministic hashes:
  - content library `87bb18eae1a76b592af37245bcc322e06de197b5e2467f8f639e7e140155663c`;
  - fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`;
  - evidence report `553670d90e02f57c9348a1baf04bd693d9ed4feea7cf6961379ede92e5b4920c`;
- `data/authoring/**` Base..working-tree delta: EMPTY;
- production identity-routing audit for Valkyrie/sc-valkyrie/printed names/legacy handler names: CLEAN;
- `git diff --check`: PASS.

## Next transaction

Create one exact readiness Candidate / one PR / one fresh independent Reviewer for all sc1 + sc2 + sc3 together. This readiness transaction is permanently zero-credit.

- ACCEPTED -> one A-sync/full-owner rescan while remaining on `servant.valkyrie`, then one owner-complete formal migration transaction for all still-unmigrated frozen identities;
- NEEDS_REVISION -> close every exact finding in one successor Candidate, run affected verification, then one fresh R;
- no per-skill review split.
