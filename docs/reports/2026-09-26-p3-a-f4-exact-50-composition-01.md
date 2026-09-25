# P3-A F4 Exact-50 Composition 01

Date: 2026-09-26
Status: `EXACT_50_BATCH_BLOCKED`
Base: `bf1e3ed5ece561b7ac2b9a49064783bbead9f85f`

## Mechanical accounting

- frozen denominator: `944 = 943 static + 1 dynamic`;
- current materialized frozen overlap: `112`;
- absent: `832`;
- duplicate frozen IDs: `0`;
- historical accepted PR #441 materialized overlap: `265`;
- historical old-frontier-minus-current replay pool: `153`.

The 153 historical material identities were each filtered to a one-card archive and re-run through the current-main `loadAuthoringJson` boundary. Readiness requires an empty adapter report and every ability in `execution.mode=automatic`.

Result: `14 ready / 139 blocked`. This is insufficient for the user-mandated exact-50 non-tail F4 batch; at least 36 more dependency-complete identities are required before S may be dispatched.

## Immediate current-loader-ready replay pool

1. `master.ciel.skill.s1a`
2. `master.darnic.skill.s1a`
3. `master.fiore.skill.s1`
4. `master.iliya.skill.s1`
5. `master.shiki-ryougi.skill.s1a`
6. `master.shirou-emiya.skill.s1`
7. `master.shirou-emiya.skill.s2`
8. `master.taiga.skill.s1`
9. `servant.darius.skill.sc-darius-2`
10. `servant.gilles.skill.sc-gilles-2`
11. `servant.medea.skill.sc-medea-2`
12. `servant.mhx.skill.sc-mhx-3`
13. `servant.muramasa.skill.sc-muramasa-1`
14. `servant.sigurd.skill.sc-sigurd-3`

This list is readiness input, not a migration dispatch. Each final exact-50 member still needs source/provenance classification in the frozen manifest.

## Gap clustering

Largest recurring unmapped types in the 139 blocked historical identities include `choose_cards` (19), `set_player_flag` (19), `event_player_is_controller` (18), `metric` (13), `phase_is` (13), and `event_definition_is_self` (12).

The narrowest high-value next replay is scalar controller `set_player_flag`. Five historical consumers have only this family plus the missing `key` mechanic field as their current loader blocker:

- `master.leonardo.skill.s1a`
- `master.ophelia.skill.s1a`
- `master.peperoncino.skill.s1`
- `master.shirou-emiya.skill.s3`
- `master.zouken.skill.s1`

Their historical accepted shapes are game-start controller effects with explicit scalar values (number, string, or boolean). No broad player-flag condition/lifecycle subsystem is necessary to unlock this subgroup.

## Dispatch

Dispatch zero-credit B task `P3-B-MAIN-REPLAY-SET-PLAYER-FLAG-SCALAR-CONTROLLER` with the exact narrow boundary recorded in the Task Index. After accepted B + A synchronization, rerun the same 153-card current-loader readiness scan and recompute the exact-50 deficit.

Formal/material accounting remains `112/944`, remaining `832`.
