# P3-B Current-Main Scalar Controller set_player_flag Replay

Date: 2026-09-26
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Task: `P3-B-MAIN-REPLAY-SET-PLAYER-FLAG-SCALAR-CONTROLLER`
Base planning lineage: `9c85995a7f254ad6781d1a71b8c93bab25428272`

## Boundary

Replays only the identity-free scalar controller flag effect needed by the exact-50 readiness fill. Accepted shape is a direct ability effect with exact fields `type`, `target`, `key`, `value`, where `type=set_player_flag`, `target=controller`, `key` is nonempty, and `value` is an explicit boolean/string/finite number.

No missing-value default, current-round AST/lifecycle, arbitrary target, clear/add-number operation, player-flag condition, broad M50 flag subsystem, consumer authoring, or migration credit is added.

Runtime state is stored only in optional `AbilityRuntime.structuredPlayerFlagsByPlayer`; MatchSession restore validates scalar content and that outer keys are real player IDs.

## Readiness motivation

The clean A exact-50 scan found `14` historical identities already current-loader-ready and `139` still blocked. `set_player_flag` appears in 19 blocked historical identities; five immediate historical consumers have only this family plus the `key` field as their current loader gap: Leonardo S1A, Ophelia S1A, Peperoncino S1, Shirou Emiya S3, and Zouken S1. This B task does not migrate them; accepted B + A sync must rescan before exact-50 membership is frozen.

## Accounting

Zero migration credit. Formal/material remains `112/944`, remaining `832`.

## Verification

- focused scalar controller flag: `1 file / 6 tests PASS`;
- affected chain (new primitive + MatchSession + game-start rule override/provisioning + fixed set-mana + M50-01 + M50-02): `7 files / 74 tests PASS`;
- `match-session.test.ts`: `30/30 PASS`;
- `npm run typecheck`: `PASS`;
- historical 153-card current-loader readiness rescan: before `14 ready / 139 blocked`, with this Candidate `22 ready / 131 blocked` (`+8` loader-ready identities);
- no `data/authoring/**` mutation is part of this B task; the rescan is evidence only.

The +8 readiness change does not itself grant migration credit or final exact-50 membership; source provenance and all non-loader semantic dependencies remain mandatory at S freeze time.