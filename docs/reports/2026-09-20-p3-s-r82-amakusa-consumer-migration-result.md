# P3-S R82 Amakusa s1 Consumer Migration Result

Role: Codex S
Status: `CANDIDATE_READY`
Date: 2026-09-20

## Exact dispatch

- A dispatch Base: `57b953384f7b5805607055343e108b15e55a1bc9`
- Branch: `codex/s-p3-r82-amakusa-consumer-migration`
- Exact frozen identity: `master.amakusa.skill.s1`
- F1 evidence commit: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Accepted capability contract: `P3-R82/FB2-39`
- FB2-39 accepted Candidate: `3ca21ec1c20cc7d6689b3fef6c28f982bb4ff93c`

Formal project migration remains **`142/944`**, with **`802`** remaining until fresh independent R returns `MIGRATION_ACCEPTED` for this exact S Candidate and A performs acceptance synchronization.

## Materialized consumer

S created exactly one standalone master archive:

- `data/authoring/masters/master.amakusa.json`

The archive contains only canonical `master.amakusa.skill.s1` (`教则`) and preserves:

- owner `master.amakusa` / `天草四郎`;
- legacy id `s1`;
- static card metadata: `被动`, cost `0`, base power `0`, attributes `[]`, no legacy play requirement;
- exact frozen printed text SHA-256 `7eab2353f1342bcc8cf643a44d16c9bdf923f8c66ffa993059334ff37766c320`;
- exact source-grounded clause SHA-256 `0bef7042f91686e4653ddb4d8ed0bfb6dff4d37cbe32de201aeb84e5ebaa4b1f`.

The Reference `game.started` / `event_type_is` envelope is not copied as a new runtime route. The consumer normalizes entirely onto accepted FB2-39:

- `kind: forced_trigger`;
- authoritative `activation: { trigger: "game_start" }`;
- exact `[{ type: "source_owned" }]` condition;
- exact opaque status assignments:
  - controller -> `role:red-team-leader`;
  - circular next active player -> `role:god-servant`;
  - same next active player -> `history:god-servant`;
- automatic execution with exact empty `allowedOperations`;
- no cost, target-selection interaction, creates, modifiers, lifecycle, limit, or visibility widening.

No identity-specific runtime branch was added.

## Focused consumer coverage

Added:

- `packages/rules/tests/amakusa-s1-consumer-migration.test.ts`

The 5 focused consumer tests prove:

1. exact one-card archive, frozen hashes/static metadata, zero-issue automatic loader compilation, and exact FB2-39 classifier acceptance;
2. real authoritative `game_start` assigns leader status to the controller and both god-servant/history keys to the circular next active seat, independent of player-array order, without changing `PlayerState.status`;
3. seat-order wrap-around, eliminated-player skipping, and deduplication across distinct repeated game-start events;
4. non-owned source and only-self active topology fail closed atomically with no partial role assignment;
5. the standalone migration stays absent from playtest pack and generated product output.

## Validation

At the exact A dispatch Base plus the S material:

- `npm.cmd ci --ignore-scripts --offline`: PASS, 239 packages added, 0 vulnerabilities;
- `npm.cmd run typecheck`: PASS;
- focused Amakusa + FB2-39: **2 files / 13 tests PASS**;
- rules `src/__tests__ + core + regression + focused`: **84 files / 507 tests PASS**;
- official `npm.cmd run test:ci -- --maxWorkers=2`: **159 files / 1117 tests PASS**;
- content validation: **7 masters / 7 servants / 20 events / 0 blocking issues**;
- generated-content determinism: PASS with unchanged hashes:
  - library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`
- exact Locked Reference verification: PASS at `b2f9fa15fba07c63530bbf4612b03b8b704755f9`;
- client production build: PASS; only the existing Vite browser-externalization / chunk-size warnings appeared;
- `git diff --check`: PASS.

## Frozen accounting

Mechanical top-level `cards[]` overlap against all 944 frozen identities:

- Base: **`137/944`**;
- Candidate worktree: **`138/944`**;
- exact addition: `master.amakusa.skill.s1`;
- frozen removals: `0`;
- Base frozen duplicates: `0`;
- Candidate frozen duplicates: `0`;
- other frozen additions: `0`.

No production runtime source, playtest pack, generated product, content package, or client file is changed by S. No second Amakusa identity is migrated.

## Review handoff

Fresh independent R must review the exact committed Candidate against Base `57b953384f7b5805607055343e108b15e55a1bc9`. Do not reuse any prior reviewer session and do not review the same exact Candidate twice.

Only fresh R `MIGRATION_ACCEPTED` for the exact Candidate plus subsequent A acceptance synchronization may advance formal accounting from `142/944` to `143/944` and remaining from `802` to `801`. No merge or retarget is authorized.
