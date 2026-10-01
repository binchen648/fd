# P3-B Alice Owner Readiness — Multi-Presence Core Result

## Boundary

- Parent task: `P3-B-ALICE-OWNER-READINESS-CAPABILITY`.
- Exact bounded subtask: `P3-B-ALICE-OWNER-READINESS-MULTI-PRESENCE-CORE`.
- Exact Base: `0ad0e05d79a738aa55f43ea9c87ef5db5ef2acb9` (accepted Akiha owner A-sync/accounting).
- Strict accounting: `186/944`, remaining `758`.
- This task is permanently zero migration credit.
- `data/authoring/**` Alice consumer delta: EMPTY.

## Frozen source recertification

Complete current Alice frozen owner scope was recertified together:

1. `master.alice.skill.s1` — 赛博幽灵
   - preparation: if the controller did not lose a battle in the previous round, deploy 幻影爱丽丝 to one battlefield;
   - when one physical Alice moves or is moved, the other follows the same direction and distance when movement is legal and the other is not engaged;
   - after playing cards, lose mana equal to ceil(one half of the total mana cost actually paid for that play batch).
2. `master.alice.skill.s2` — 幻影爱丽丝
   - both physical presences are one player / one opponent / one “you” and do not double-trigger abilities;
   - they share active cards/passives/card text/global total-Power and on-play card-Power adjustments, while combat Power is evaluated separately at each presence location;
   - when separated, the controller must choose which presence location is used by location/battle-related effects.
3. `master.alice.skill.ascension` — Queenside Castle
   - static source metadata: 魔术 / cost 5 / requirement 5 / base Power 1 / outside-game Master ascension;
   - terrain owned at one Alice location contributes to all Alice locations;
   - Action: remove the phantom from the board, then defeat every player remaining at that old location.

Locked Reference handler `core.alice-phantom-player` is corroboration only. Its generic presence helpers support the core model, but its location-effect options helper has no Reference production caller; frozen source remains authoritative.

## Implemented identity-free core

New generic `multi-presence-player-capability` plus bounded interpreter/combat/restore wiring provides:

- exact whole-ability loader/interpreter gating for seven privileged multi-presence effect forms;
- server runtime extra-presence records carrying player/presence/location/deployment terrain/source ability/round/revision provenance;
- preparation target selection through the normal pending-target transaction, with privileged continuation revalidated against the server-owned compiled source ability;
- previous-round battle-loss gating;
- presence-aware player discovery and battle participant derivation with one logical player ID, including safe fallback for core GameState values with no AbilityRuntime;
- primary movement event provenance (previous location + effect movement kind) and legal same-distance directed mirror movement of the live extra-presence record;
- post-play batch event and actual-paid-mana ceil-half loss;
- multi-location terrain sharing;
- phantom-first sacrifice then eligible old-location defeat;
- restore validation of player/location/source/ability/round/revision provenance and forged-state rejection.

Production implementation contains no `master.alice`, Alice printed names, fixture IDs, or `core.alice-*` routing.

## Explicit remaining readiness gap

This Candidate intentionally does **not** claim the whole Alice owner is ready.

Two source clauses require one separate bounded generic presence-context seam:

- explicit choice of which separated presence location drives a location/battle-related ability transaction, exactly once;
- authoritative movement of an extra presence (including external movement) so movement of either physical presence can trigger the same mirror rule.

A repo-wide mechanical scan found roughly 198 location/battle accesses in the interpreter, including independent target, condition and transaction families. Blindly replacing every `controller.locationId` in this core Candidate would be an unauditable behavior expansion. Therefore the follow-up `P3-B-ALICE-OWNER-READINESS-PRESENCE-CONTEXT` is mandatory after core acceptance.

## Verification

- Alice synthetic focused: **8/8 PASS**.
- Broad affected/shared set: **218/218 PASS** across executable pack, pack loader, complex skills, MatchSession, MatchSession regressions, provisioning, Akiha neighboring readiness, combat resolver, map engine, event/combat outcome, combat opponent reward, and default-map coverage.
- `FD_TOOLCHAIN_OK`.
- typecheck PASS.
- content validate/compile PASS: `9 masters / 19 servants / 20 events / 0 blocking issues`.
- generated determinism PASS; hashes unchanged:
  - content-library `7d3972f7df836b16af8ab37dbe373eaa3a6e4ecde5bcb238cee53a7b852db53d`
  - fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`
  - evidence-report `e05fd6874e44104611a6900d1723d59d6275f9b9305b4f9464825fdba69ef902`
- `data/authoring/**` delta EMPTY.
- production identity audit CLEAN.
- `git diff --check` PASS.

Pre-existing baseline note: Golden Flow 2's restore fixture currently violates the existing placed-at-location restore invariant on exact Base `0ad0e05d...`; a temporary byte-exact HEAD replay reproduced the same failure with all Alice WIP tracked files removed. It is therefore neither counted as an Alice regression nor modified by this Candidate.

## Disposition

`IMPLEMENTATION_COMPLETE_CANDIDATE` for the bounded multi-presence core foundation only. One PR / one fresh independent R. Even if accepted, accounting remains `186/944`, remaining `758`, and parent Alice readiness remains blocked on `P3-B-ALICE-OWNER-READINESS-PRESENCE-CONTEXT`.
