# P3-B Voyager Owner Readiness Capability Result

Role: Codex B
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Date: 2026-09-30
Base: `b4dbc40e4ecd48da82f6304b427811b24c00f68c`
Classification: complete currently discoverable Voyager owner-readiness/capability batch; permanently zero migration credit

## Frozen owner scope

One indivisible readiness batch:

1. `servant.voyager.skill.sc-voyager-1` — 讯息：希望;
2. `servant.voyager.skill.sc-voyager-2` — 讯息：和平;
3. `servant.voyager.skill.sc-voyager-3` — 遥远的蓝色星球啊;
4. `servant.voyager.skill.sc-voyager-4` — 领域外生命.

Strict formal accounting remains `166/944`, remaining `778`. This readiness Candidate changes no `data/authoring/**` file and grants zero migration credit.

Repository frozen/source evidence is semantic authority. Locked Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9` was used only as bounded behavioral corroboration for exact runtime seams; no `servant.voyager`, `sc-voyager`, printed-name, or `core.voyager-*` identity routing is added to production rules runtime.

## Complete owner-local readiness gap set

### sc1 — matching-definition provisioning + optional global reveal/reward

Generic structural capability now supports:
- an authoritative `after_controller_enters_location` event at the exact declared location creating exactly two outside-game copies of a declared definition in the entering player's hand, with source-card provenance;
- an action-window global optional reveal sequence over live players, each player exposing only their own matching hand candidates and receiving exactly +2 VP only after revealing one live matching card;
- pending-decision restore validation recomputes player order and live hand candidates and rejects forged/stale/root-changed state.

### sc2 — matching hand extra-play + combat global hand reveal suppression

Generic structural capability now supports:
- action-window selection of up to two exact matching hand cards for normal face-up effect-play plus up to two other legal hand cards for face-down effect-play;
- ordinary play semantics remain authoritative, including normal card costs/on-play behavior/play counts while the ability supplies the extra play permission;
- combat-window reveal of every live player's hand and round-local Power set-to-zero for active attacks controlled by players whose revealed hand contains the declared matching definition.

### sc3 — reveal one opponent discard / optional free play-all / VP transfer

Generic structural capability now supports:
- selecting one active opponent and revealing the current discard snapshot;
- exact matching cards are recomputed and bound into a restore-valid pending decision;
- `play_all` preflights the complete matching set transactionally through normal effect-play semantics from discard at zero cost;
- if at least one is played, up to exactly 2 VP transfers from the selected opponent to controller; stale discard/root/controller state fails closed.

### sc4 — generated-card linked round Power + exact post-battle return

Generic structural capability now supports:
- an active face-up generated attack card authenticating its exact `generatedBy` source;
- controller and generator-owner each receive exactly +6 round Power, with same-player dedupe so one player never receives +12 from the same generated card;
- exact generated-card/source/owner/ability provenance is serialized and restore-validated;
- after battle, only a live exact linked marker returns the card to the generator owner's discard; forged/stale provenance fails closed and round transition retires stale markers.

## Fail-closed / durability boundary

- privileged custom node shapes are accepted only by exact whole-ability structural gateways in `matching-definition-card-capability.ts`;
- widened node shapes are loader-disabled;
- pending global reveal and discard-play decisions are restore-revalidated from live candidates rather than trusting serialized candidate arrays;
- generated-card Power/return provenance is validated together with generic deferred runtime provenance;
- Base..working-tree `data/authoring/**` delta is EMPTY;
- production identity audit in `packages/rules/src/**` for Voyager IDs/names/legacy handlers is CLEAN.

## Verification

- Voyager readiness focused regression: `8/8 PASS`;
- complex skills regression + MatchSession + Voyager focused affected aggregate: **`79/79 PASS`**;
- `E:\Codex\FD\binchen648_fd\tools\verify-toolchain.cmd`: `FD_TOOLCHAIN_OK`;
- `npm run typecheck`: PASS;
- `npm run content:validate`: PASS — `7 masters / 17 servants / 20 events / 0 blocking issues`;
- `npm run content:compile`: PASS — same counts;
- `npm run verify:generated-content`: PASS:
  - content library `611cfdc5735708fb37e7e9b014d779ae1e8dc90843ce1f4d387fc881985900d4`;
  - fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`;
  - evidence report `9b06437e4dafbf23aab3dd08f7e2a87821055693820e4ddee95b5405b0026669`;
- `git diff --check`: PASS.

## Next transaction

Freeze one exact readiness Candidate / one PR / one fresh independent Reviewer for sc1 + sc2 + sc3 + sc4 together. This readiness transaction is permanently zero-credit.

ACCEPTED -> one A-sync/full-owner rescan while remaining on `servant.voyager`; only then may one formal owner-complete Candidate be produced for still-unmigrated frozen identities.

## Review revision closure — successor after exact Candidate `30748e6fed5276c4cb8c6161ce3869d0fb2d39c5`

Fresh independent Reviewer verdict on the predecessor exact Candidate was `IMPLEMENTATION_NEEDS_REVISION`; canonical Coordinator bounded same-attempt relay after explicit Reviewer GitHub-write 403: `https://github.com/binchen648/fd/pull/499#issuecomment-5913302549`.

Both P1 findings are closed in one successor revision:

1. Generated-card +6 restore provenance now seals the exact generated-card controller as `generatedControllerPlayerId`, requires the live physical card controller to remain identical, recomputes the exact deduplicated recipient set from that sealed controller plus the exact generator owner, and requires both the marker recipients and the corresponding +6 adjustment recipients to match exactly without extras or omissions. Battle-end return now retires the consumed marker and its matching +6 round adjustments. Regression forges the physical controller, marker recipient, and +6 adjustment together and requires restore validation to fail.
2. `global_definition_reveal_reward_v1` and `discard_definition_play_all_v1` pending continuations now bind the physical source to the initiating/controller player and require the source to remain an active, face-up live source both during restore validation and again at dispatch. Regressions cover disabled, face-down, and moved-out-of-play reveal sources plus an inactive discard-play source; restore and dispatch both fail closed with no VP mutation.

Successor verification:
- Voyager readiness focused regression: `10/10 PASS`;
- complex-skills-regression: `38/38 PASS`;
- MatchSession: `33/33 PASS`;
- MatchSession regressions: `11/11 PASS`;
- affected aggregate: **`92/92 PASS`**;
- `npm run typecheck`: PASS;
- `npm run content:validate`: PASS — `7 masters / 17 servants / 20 events / 0 blocking issues`;
- `npm run content:compile`: PASS — same counts;
- `npm run verify:generated-content`: PASS:
  - content library `611cfdc5735708fb37e7e9b014d779ae1e8dc90843ce1f4d387fc881985900d4`;
  - fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`;
  - evidence report `9b06437e4dafbf23aab3dd08f7e2a87821055693820e4ddee95b5405b0026669`;
- `data/authoring/**` predecessor-Candidate..working-tree delta: EMPTY;
- `git diff --check`: PASS.

This revision remains readiness-only and permanently zero-credit. No Voyager consumer migration is included.
