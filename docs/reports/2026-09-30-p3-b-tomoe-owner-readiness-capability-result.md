# P3-B Tomoe Owner Readiness Capability Result

Role: Codex B
Status: `IMPLEMENTED_AWAITING_REVIEW`
Date: 2026-09-30
Base: `973719b7c0c29a1ff74462eaf5c2cf08e5160e5b`

## Classification

This is the complete currently discoverable **owner-readiness/capability** batch for `servant.tomoe`. It is permanently **zero migration credit**. No `data/authoring/**` file is changed by this task.

Frozen owner scope is kept together:

1. `servant.tomoe.skill.sc-tomoe-1`;
2. `servant.tomoe.skill.sc-tomoe-2`;
3. `servant.tomoe.skill.sc-tomoe-3`.

The accepted Tezcat A-sync made Tomoe the mechanical next owner at strict formal accounting `157/944`, remaining `787`. Tomoe is not a blank owner: its canonical archive and historical accepted runtime already exist, so this preflight first reconciles current behavior against accepted history instead of fabricating new credit.

## Mechanical preflight

Accepted/frozen authority mechanically rechecked:

- F1 independently accepted evidence is `59f145434695d29bdd17e4cb3adc887e84182377` (`944/944`, blocked `0`, unclassified `0`);
- `data/authoring/servants/servant.tomoe.json` contains all three frozen skills and the existing 12-card deck;
- B21 / R15 accepts the sc1 forced `after_controller_loses_battle` unpreventable `-5 VP` family;
- FM04 / R32 explicitly records Tomoe as the sole pre-existing canonical Independent Action representative while sibling archives were migrated around it;
- locked Reference remains `b2f9fa15fba07c63530bbf4612b03b8b704755f9` and is used only for static/observed cross-checking.

Current-lineage result:

- **sc1**: no new readiness gap. The first-half action `+3 VP` and the forced post-loss unpreventable `-5 VP` path are already executable.
- **sc2 / terrain multiplier**: no new gap in the combat terrain multiplier itself.
- **sc2 / Inferno deployment restriction**: real gap. `create_status` stored a next-round status but nothing consumed it during deployment, so opponents never received the required `0..5 VP` choice and no terrain slot was restricted by payment.
- **sc3 / declaration reveal**: no new gap.
- **sc3 / Rain of Fire**: real gap. The current implementation contained an explicit shortcut equivalent to “assume opponent has no terrain”, so an opponent who actually owned terrain still received the `-5` Power penalty.

These two gaps are compatible and owner-local, so they are closed together in this one readiness Candidate rather than split into per-skill reviews.

## Implementation

### 1. Next-round deployment terrain-payment seam

The structural status family `duration=next_round` + `scope=opponents_deploying_to_this_battlefield` now records and validates:

- source controller;
- physical source card instance;
- ability id;
- battlefield/location;
- created round.

The privileged status shape is whole-effect exact. Extra/widened keys or missing provenance fail closed.

During the following round's ordinary battlefield deployment, an affected opponent is paused **before** location/terrain mutation and receives one private mandatory decision with exact choices:

`0 .. min(5, current VP)`.

This interaction is mandatory even at `current VP = 0`: the exact candidate set is then `['vp:0']`, deployment remains paused until that choice resolves, and no positive terrain slot can be acquired from a zero payment.

After choosing:

- the exact amount is deducted from VP;
- deployment completes through the ordinary deployment event/reward path;
- only an unoccupied printed terrain slot with value `<= paid VP` may be assigned;
- if no such slot exists, the player deploys without terrain rather than stealing/rewriting an ineligible slot.

Because the ordinary `terrainAssignments[]` order cannot represent a payer deliberately skipping a high slot, the runtime now keeps generic `terrainAssignmentSlots` authority. Combat terrain math and terrain-multiplier math read that exact slot first and fall back to legacy dense order when no override exists. This allows, for example, a `1 VP` payer to take the `+1` slot while leaving a still-free `+3` slot for a later `3 VP` payer.

The exact-slot authority is cleared with the normal round terrain-assignment reset.

### 2. Restore / tamper boundary

Restore validation now rejects malformed terrain assignment authority:

- unknown/disabled location keys;
- non-array, duplicate, over-capacity, wrong-location, or inactive assigned players;
- slot mappings for players not actually assigned;
- out-of-range or duplicate explicit slots;
- slot-map locations with no corresponding assignment list.

A serialized pending deployment-payment decision must also remain consistent with the exact live round, priority player, unresolved deployment, current VP-derived choices, source status, physical source card, compiled source ability, and original status round. Stale/widened/tampered continuations fail closed.

### 3. Authoritative no-terrain Rain of Fire seam

The exact generic shape `reduce_opponents_power(amount=5, condition=opponent_has_no_terrain, scope=same_battlefield)` now consumes authoritative `modeState.terrainAssignments`:

- same-battlefield opponents that own terrain are excluded;
- same-battlefield opponents without terrain receive the round `-5` Power modifier on their active field attacks;
- ability-immunity seams remain respected;
- malformed terrain authority fails closed instead of silently treating everyone as terrain-less.

The privileged implementation is structural. Production rules contain no `Tomoe`, `sc-tomoe-*`, `inferno_fire`, card-name, or printed-text identity routing.

## Verification

Focused/affected tests:

- `packages/rules/src/__tests__/match-session-regressions.test.ts` — `10/10 PASS`;
- `packages/rules/tests/match-session.test.ts` — `33/33 PASS`;
- `packages/rules/tests/regression/complex-skills-regression.test.ts` — `38/38 PASS`;
- affected total — **`3 files / 81 tests PASS`**.

New regression coverage includes:

- a `0 VP` affected deployer remaining paused behind the mandatory `['vp:0']` interaction until resolution, then deploying with 0 VP paid and no positive terrain slot;
- a `1 VP` payer taking the `+1` terrain slot while the `+3` slot remains available;
- a later `3 VP` payer taking that still-free `+3` slot;
- exact next-round expiry (a round-1 status does not affect round 3);
- Rain of Fire leaving an opponent with authoritative terrain untouched;
- malformed terrain authority failing closed.

Repository gates:

- `tools/verify-toolchain.cmd` -> `FD_TOOLCHAIN_OK`;
- `npm run typecheck` -> PASS;
- content validate -> `7 masters / 13 servants / 20 events / 0 blocking issues`;
- content compile -> same counts, PASS;
- `npm run verify:generated-content` -> PASS;
- generated hashes remained deterministic;
- `git diff Base..Candidate -- data/authoring` -> EMPTY;
- production identity audit -> CLEAN;
- `git diff --check` -> PASS.

## Accounting / next transaction

Readiness remains zero-credit. Strict formal accounting stays **`157/944`**, remaining **`787`**.

After one fresh independent `IMPLEMENTATION_ACCEPTED_CANDIDATE`, FORMAL must perform one A-sync/full-owner rescan while staying on `servant.tomoe`. That rescan, not this capability task, determines which Tomoe identities are already historical/preservation-only and which (if any) still require a formal owner-complete migration transaction.
