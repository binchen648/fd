# P3-B Stheno Divine Core Readiness Capability Result

Role: Codex B
Status: `IMPLEMENTATION_REVISION_READY_FOR_FRESH_R`
Date: 2026-09-28
Task: `P3-B-STHENO-DIVINE-CORE-READINESS-CAPABILITY`
Exact Base: `e3c61d74be6b02b186875e31191e416fc364e179`
Owner root: `servant.stheno`
Classification: bounded zero-credit owner-readiness prerequisite

## Complete owner-readiness preflight

The Stheno owner was preflighted as one complete owner before formal consumer authoring.

- sc1 has historical formal acceptance in FM06 Presence Concealment; no new capability is required and any later owner-complete consumer must preserve that accepted semantic without duplicate credit.
- sc2 is already expressible through accepted generic battle-result/resource vocabulary. The current loader/interpreter contains `after_controller_wins_battle`, `event_player_won_combat`, and `adjust_victory_points`, with existing regressions for combat-outcome conditions and VP adjustment; no new privileged shell is required.
- sc3 is the sole currently discoverable missing generic readiness family: active-source combat Luck discard -> per-engaged-opponent close/refund/draw -> optional turn-order immediate play of the exact drawn card, with temporary combat permission for that drawn card's Action ability.

No second Stheno readiness task is authorized by this preflight. ACCEPTED must A-sync/rescan and return to the same Stheno formal owner; it cannot advance owners.

## Locked source grounding

Locked Reference was mechanically read at exact commit `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.

For sc3 / Divine Core, the observed source contract requires an active card during combat and does not infer a per-game limit. The exact bounded generic shell implemented here is identity-free and source-grounded:

- authoring phase `combat`, controller combat action window, active source required;
- discard exactly one owned `幸运` card;
- process engaged opponents in turn order;
- for each opponent, optionally close at most one eligible non-`per_game` attack;
- refund that opponent mana equal to the effective play cost of the closed card;
- draw exactly one card for that opponent;
- in turn order, optionally immediately play that exact drawn card;
- an immediately played drawn card receives only the source-grounded current-round permission needed for its Action ability during combat.

The privileged envelope is accepted only as one exact whole-ability shape. Widened effect fields, extra conditions, compiled-pack widening, stale/private continuation corruption, and forged combat-action permission fail closed.

## Implementation boundary

Generic production support is implemented without Stheno identity routing through:

- `packages/rules/src/ability/divine-core-capability.ts`;
- `packages/rules/src/ability/battle-close-draw-play-authority.ts` for host-secret authenticated draw/immediate-play provenance;
- exact loader gateway wiring;
- interpreter availability/transaction/settlement logic;
- typed private interaction and transaction state;
- MatchSession structural/reference/provenance validation;
- public generic export surface.

No `data/authoring/**` consumer is changed in this readiness task. Production runtime contains no `servant.stheno`, `sc-stheno`, Stheno Chinese owner/card-name routing, runtime source-text parsing, or `SkillLib` fallback.

## Focused verification

`packages/rules/tests/regression/p3-stheno-divine-core-readiness-capability.test.ts`: **15/15 PASS**.

Coverage proves:

1. exact whole-ability shell accepted and widened/near-match mutations rejected;
2. availability requires a genuinely active battlefield source, owned Luck, and at least one engaged opponent;
3. multi-Luck selection, opponent turn order, per-game exclusion, close/refund/draw, skip, exact drawn-card immediate play, and combat Action permission;
4. the sole Luck card auto-discards and every opponent may be skipped;
5. a mid-transaction private close choice round-trips MatchSession while widened host-signed interaction metadata is rejected;
6. forged combat Action permission without exact immediate-play provenance is rejected on restore;
7. completed exact immediate-play provenance round-trips while a mismatched source is rejected;
8. compiled-pack widening rejects transactionally before Luck discard or decision staging;
9. a host-signed pending transaction cannot substitute another hand card for the exact Divine Core draw even when its pending interaction/candidate metadata is forged to match;
10. a forged completed immediate-play history row plus a forged combat Action permission is rejected without the external authenticated authority;
11. an immediately played card that opens ordinary on-card-played response and nested decision work pauses Divine Core and resumes only after that work settles;
12. immediate-play provenance/permission retire on the next authoritative round, and the same physical card can be legally replayed in round two and subsequently restored;
13. draw authority is bound to an exact activation transaction, a second legal same-round activation round-trips without inheriting the first activation's draw authority, and forged removal of an unresolved transaction/decision leaves orphan draw authority that restore rejects;
14. completed immediate-play authority survives the ordinary `stepGameLoop` root replacement path and continues to round-trip through MatchSession persistence.
15. the ordinary production `round_end -> round_start` path retires prior-round immediate-play history, temporary combat Action permission, and corresponding server-only authority exactly once, then MatchSession persistence round-trips successfully in round two.

Fixture corrections made while validating restore did not broaden production semantics: the GameState battle phase is `battle` while authoring activation remains `combat`; helper definitions are installed into the trusted fixture pack before runtime initialization; UTF-8 source attributes remain exact.

## Affected verification

Current R3 affected serial: **7 files / 105 tests PASS**:

- Stheno Divine Core readiness `15`;
- authoring-interpreter `38`;
- MatchSession `33`;
- game-loop battle/cleanup `10`;
- game-loop round-start `4`;
- phase-machine `3`;
- game-loop action `2`.

The predecessor R2 evidence had already passed the broader **8 files / 204 tests** serial. For R3, the exact directly affected production/session/game-loop chain above was rerun after the ordinary new-round retirement fix.

A diagnostic `npm run test:ci` A/B comparison was also run rather than treating repository-wide failures as new regressions. Exact predecessor `54baf0b188114c2fe9f690a339a71a0a620379a1` in the clean detached Reviewer environment had 12 pre-existing failures (1153/1165 PASS). The Work run had those same baseline failures plus five failures from the local ignored `.fd-shiki-runtime-debug.test.ts`; no additional tracked-suite failure was introduced by this revision. This diagnostic is not represented as a green full-suite gate.

Static/content gates:

- `npm run typecheck`: PASS;
- `npm run content:validate`: PASS — `7 masters / 12 servants / 20 events / 0 blocking issues`;
- `npm run content:compile`: PASS — same summary;
- `npm run verify:generated-content`: PASS with unchanged hashes:
  - content `b2c446488a28c5036ac36557e09b563b54b11018d5396233a53f37ffdbff6923`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `f4ae33de4dc2832766064bdf46e277d9559398d4d34b45d7d05a0eb76744cd14`;
- `git diff --check`: PASS;
- `data/authoring/**` delta: EMPTY;
- production identity audit: `servant.stheno=0`, `sc-stheno=0`, `斯忒诺=0`, `女神的绮想=0`, `SkillLib=0`.

## R1 fresh-review closure

Predecessor Candidate `31e607db8be27d505d808d380cee22a0a92769a5` received `IMPLEMENTATION_NEEDS_REVISION`. Reviewer GitHub publication returned explicit 403; canonical bounded same-attempt Coordinator relay is `https://github.com/binchen648/fd/pull/472#issuecomment-5859558471`. No re-review of that exact Candidate was performed.

All findings were closed together in one successor work item:

- **P1 exact draw / combat-permission provenance:** new server-only authority records the exact closed-card/refund/drawn-card tuple and exact immediate-play record outside serializable GameState. Current/replay/checkpoint persistence seals this authority using the existing host secret and room scope. Restore requires the mutable transaction/history/permission state to match that authenticated authority exactly. Regressions forge `rewards[].drawnCardId` plus matching interaction metadata and forge completed history plus the permission flag; both fail closed.
- **P1 continuation safety:** the immediate-play transaction no longer stages over ordinary nested work. Its stage/resume path blocks while a pending decision, response window, or host request exists, and ordinary command settlement re-enters the Divine Core continuation only after nested work is clear. A regression immediately plays a card that opens an `on_card_played` response followed by a nested choice and proves the Divine Core transaction remains pending until that work resolves.
- **P2 round-bounded lifetime:** starting a later authoritative round retires prior-round immediate-play history, temporary combat Action permission, and external authority. A two-round regression legally replays the same physical card and proves later MatchSession restore remains valid.

The revision remains identity-free readiness only: `data/authoring/**` is unchanged and formal accounting remains `139/944`, remaining `805`.

## R2 fresh-review closure

Successor Candidate `dfa48bf26697a717fa6e8101a5a44e489b5e6552` received `IMPLEMENTATION_NEEDS_REVISION`. Reviewer GitHub publication again returned explicit 403; canonical bounded same-attempt Coordinator relay is `https://github.com/binchen648/fd/pull/472#issuecomment-5862289311`. No re-review of that exact Candidate was performed.

Both blocking findings were closed together in one successor revision:

- **P1 transaction-scoped draw authority / orphan rejection:** each Divine Core activation now receives an exact persisted `transactionId`; every close/refund/draw authority row is bound to that transaction, and draw authority is retired when that transaction fully settles. Persistence consistency requires all current-round draw authority to belong to the live transaction and rejects any draw authority when no transaction remains. This permits a second legal same-round activation without inheriting first-activation draws, while forged removal of both the unresolved transaction and its pending decision leaves authenticated orphan authority and fails restore.
- **P1 core-loop root replacement:** `stepGameLoop` now carries the server-only authority across each task-relevant GameState root replacement before `advanceAbilityPhase`. A completed Divine Core immediate play can advance through normal battle -> cleanup and still round-trip history/permission plus authenticated authority.

Historical R2 focused verification was `14/14 PASS` with the broader affected 8-file / 204-test serial green before R3.

## R3 fresh-review closure

Successor Candidate `54baf0b188114c2fe9f690a339a71a0a620379a1` received `IMPLEMENTATION_NEEDS_REVISION`. Reviewer GitHub publication returned explicit 403; the canonical bounded same-attempt Coordinator relay is `https://github.com/binchen648/fd/pull/472#issuecomment-5866671116`. No re-review of that exact Candidate was performed.

The sole blocking finding was closed in the same bounded revision:

- **P1 ordinary new-round retirement:** normal `stepGameLoop` advances the root round number before ability-phase cleanup. The revision preserves that previous/new round distinction explicitly by passing the previous root round to `advanceAbilityPhase`; `startsNewRound` therefore becomes true on the real `round_end -> round_start` transition even though the replacement state already contains the new round number. Existing retirement code then clears prior-round `battleCloseDrawImmediatePlayHistory`, temporary `actionAbilityAllowedInCombatRound`, and corresponding server-only authority exactly once. A production-path regression completes legal Divine Core immediate play, advances battle -> cleanup -> round_end -> round_start, proves history/permission retirement, and successfully MatchSession serializes/restores the round-two state.

Current verification: focused `15/15 PASS`; affected `7 files / 105 tests PASS`; typecheck, content validate/compile, generated determinism and `git diff --check` PASS; `data/authoring/**` remains unchanged. The `test:ci` A/B diagnostic is recorded above and shows no new tracked-suite failure relative to exact predecessor.

## Accounting / continuation

This readiness task is permanently zero-credit. Strict formal accounting remains **`139/944`**, remaining **`805`**.

After exact-Candidate `IMPLEMENTATION_ACCEPTED_CANDIDATE` + A-sync/rescan, return to the same Stheno owner and perform one owner-complete formal migration containing every Stheno frozen skill together, preserving historical sc1 acceptance and granting new credit only where mechanically justified by the frozen accounting/evidence line.

Allowed verdicts: `IMPLEMENTATION_ACCEPTED_CANDIDATE` / `IMPLEMENTATION_NEEDS_REVISION`.
