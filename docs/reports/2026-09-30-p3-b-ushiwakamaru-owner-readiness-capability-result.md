# P3-B Ushiwakamaru Owner Readiness Capability Result

Role: Codex B
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Date: 2026-09-30
Base: `7624c6cecd9a0c910477737a5eeaa1035cd55a2d`
Classification: complete currently discoverable Ushiwakamaru owner-readiness/capability batch; permanently zero migration credit

## Frozen owner scope

The owner remains one indivisible readiness batch:

1. `servant.ushiwakamaru.skill.sc-ushiwakamaru-1` — 喜见城·冰柱削;
2. `servant.ushiwakamaru.skill.sc-ushiwakamaru-2` — 坛之浦·八艘跳;
3. `servant.ushiwakamaru.skill.sc-ushiwakamaru-3` — 骑乘（Rider Class）.

Frozen semantic authority is the independently accepted F1/source-evidence lineage at `59f145434695d29bdd17e4cb3adc887e84182377`. Locked Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9` is used only for static/observed metadata.

## Mechanical preflight / accounting boundary

- strict formal accounting entering this task is `159/944`, remaining `785`;
- current canonical authoring contains only `sc-ushiwakamaru-3`;
- sc3 is already accepted through FM01/R26 and is preservation-only / no duplicate credit;
- sc1 and sc2 are absent from canonical authoring and are the complete currently discoverable owner-local readiness pressure points;
- this readiness task changes no `data/authoring/**` file and is permanently zero-credit;
- no Ushiwakamaru migration credit is legal until a later formal owner-complete Candidate receives `MIGRATION_ACCEPTED` and subsequent A-sync/accounting.

## Implemented generic readiness family

Production runtime contains no Ushiwakamaru/card-name/printed-text/legacy-handler/`sc-ushiwakamaru-*` identity routing. Privileged semantics are structural, exact-shape gated and fail closed.

### sc1 — cross-phase action permission

The accepted source-bound passive shape permits the controller's ordinary action-phase abilities to be activated during combat only while the exact physical provider source remains live, active, face-up and owned/controlled by that controller.

- the bridge changes only phase legality;
- ordinary per-round/per-ability usage authority remains unchanged;
- an action ability used in action remains consumed in combat unless a separate accepted one-shot reuse grant exists;
- provider close/control loss/face-down/inactive state immediately removes the bridge;
- unrelated players and unrelated action abilities are not widened.

### sc1 — exact one-shot reuse grant

The accepted unique combat action targets a live, owned/controlled physical attack that has at least one already-used authored action/combat phase ability in the current round.

- unused/passive/trigger/foreign/inactive/face-down/stale targets fail closed;
- if exactly one eligible used ability exists, that exact ability is bound directly;
- if multiple eligible used abilities exist on the selected attack, a second owner-only exact ability choice is staged so the controller chooses one ability rather than excluding the whole attack;
- the grant binds controller, provider source instance, provider ability, target physical card, target ability and round;
- consuming the grant permits one extra execution while leaving the original usage record/count unchanged;
- the grant itself becomes consumed; a second execution without a new legal grant fails;
- provider control loss/close/inactive state invalidates an unconsumed grant;
- restore validates the outstanding grant and the second-stage ability-choice provenance/candidate set; forged/stale candidate authority fails closed.

### sc2 — authoritative Power comparison

`projectCurrentPlayerTotalPower` reuses the current authoritative combat participant breakdown without firing battle triggers or projecting not-yet-triggered battle-stage effects as new events.

- target is exactly one other active player;
- self/stale/ineligible target fails closed through the generic target/active-player authority;
- only strict controller Power `>` opponent Power proceeds;
- equal/lower performs no swap, reward or redeployment event;
- same-location strict win is a no-op and fabricates no redeployment event.

### sc2 — atomic effect redeployment swap

The shared `swapActivePlayerDeploymentPositions` seam preflights both physical destinations and the durable terrain authority before mutating either player.

- both destinations must remain enabled and legally occupiable under current rule overrides;
- terrain assignments/slot overrides must be internally consistent with live active player locations;
- both endpoint occupant/slot replacements are simulated before commit;
- if either endpoint is illegal, full dispatch rejects transactionally with zero player/location/resource/event mutation;
- on success only the selected pair changes locations;
- terrain occupant authority follows the incoming player while preserving the exact physical terrain slot at each location;
- third-player locations/authority are untouched.

After the atomic swap succeeds, ordinary effect-redeployment destination consequences are applied once per incoming player:

- Magic Workshop deployment mana uses the same printed slot schedule `[2,1,1,1]` and `grantMana(..., { source: 'deployment' })` authority as ordinary deployment;
- `after_player_deployed_to_battlefield` is emitted for battlefield destinations;
- `after_player_deployed_to_location` is emitted for every destination;
- these consequences occur only after the full two-player swap commits, so an illegal endpoint cannot leak a partial reward or trigger.

### sc3 — preservation-only

No new sc3 authoring or identity routing is introduced. Existing FM01/R26 semantics remain authoritative:

- on play with a basic attack, draw one card;
- action phase private optional selection/play of `0..3` controller-hand cards whose base Power is `<=3`;
- existing final-rule skill-zone requirement and F1 evidence remain unchanged;
- sc3 receives no duplicate credit from this task.

## Verification

- `E:\Codex\FD\binchen648_fd\tools\verify-toolchain.cmd`: `FD_TOOLCHAIN_OK`;
- `packages/rules/tests/regression/p3-ushiwakamaru-readiness-capability.test.ts`: `14/14 PASS`;
- `packages/rules/tests/regression/complex-skills-regression.test.ts`: `38/38 PASS`;
- `packages/rules/tests/match-session.test.ts`: `33/33 PASS`;
- `packages/rules/src/__tests__/match-session-regressions.test.ts`: `11/11 PASS`;
- affected aggregate: **4 files / 96 tests PASS**;
- `npm run typecheck`: PASS;
- `npm run content:validate`: PASS — `7 masters / 14 servants / 20 events / 0 blocking issues`;
- `npm run content:compile`: PASS — same counts;
- `npm run verify:generated-content`: PASS with deterministic hashes:
  - content library `4cc550ff5147c9605b28100f4aa0b7131c3284eb495e66e4dbfacb544b0e3ae6`;
  - fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`;
  - evidence report `9a35abf0bc83ba190a9f5266039f904970a6904d3cf041ca22c33280c8677fb0`;
- `data/authoring/**` Base..working-tree delta: EMPTY;
- production identity audit for `ushiwakamaru` / `sc-ushiwakamaru` / Chinese printed name / locked Reference legacy handler names: CLEAN;
- `git diff --check`: PASS.

## Next transaction

Create one exact readiness Candidate / one PR / one fresh independent Reviewer for the complete sc1 + sc2 + sc3 frozen owner scope. The transaction remains permanently zero-credit.

- ACCEPTED -> one A-sync/full-owner rescan on `servant.ushiwakamaru`; preserve sc3 and decide the exact newly creditable formal owner-complete migration set;
- NEEDS_REVISION -> close all findings in one successor Candidate, run affected verification, then one fresh R;
- no per-skill review split is permitted.
