# P3-A R81 Darius Consumer Migration Dispatch

Role: Codex A
Status: `DISPATCHED`
Date: 2026-09-20

## Formal baseline

- Exact A acceptance-sync Base: `1a57ee8443611e6c32fab4fee9ed8afd7e98c3d1`
- Formal migration accepted: `140/944`
- Formal remaining: `804`
- Branch-local frozen overlap: `136/944`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- F1 evidence commit: `59f145434695d29bdd17e4cb3adc887e84182377`

PR #381 / Ibaraki remains independently pending and receives no credit or dependency authority in this lineage.

## Exact migration identity

Migrate exactly one frozen consumer:

- `servant.darius.skill.sc-darius-1`
- owner: `servant.darius`
- owner class: `Berserker`
- legacy id: `sc_darius_1`
- static card metadata: cost `2`, basePower `5`, typeLabel/attribute `力量`, legacy requirement `0`

F1 evidence:

- full printed-text SHA-256: `140fbed2b3d455403639cbd3987c20b25279fdd61a28daedaac19892a34ec9e6`
- source-grounded residual clause SHA-256: `e3afc162cc4676b9e3b6ca9aad41daed4aae8e22780705a608960a8d018fc88f`
- semantic axes: trigger `combat.ending`; conditions `SOURCE_ACTIVE` + `PLAYER_FLAG_NUMBER_NOT_CURRENT_ROUND`; effect `CLOSE_SOURCE_CARD`; lifecycle `while_active / immediate / remain_active`; battle `COMBAT_EVENT`.

Locked Reference whole card confirms one residual ability only. Reference handler identity is evidence only and must not be used for production routing.

## Accepted structural normalization

Author exactly one standalone Darius servant-skill archive using only accepted structures:

1. Standard servant skill play envelope: `playTiming={ phase: action, window: controller_play_card_window }`.
2. Printed below-eight-mana permission normalizes to the already accepted explicit authoring requirement `{ type: skill_zone_mana_at_least, value: 0 }`; do not add a new play-permission runtime seam.
3. Residual activation normalizes Reference `combat.ending` to accepted `after_battle_ended`, with `phase: combat` and source-active gating.
4. Conditions are exactly `{ type: source_active }` plus accepted FB2-38 `{ type: player_flag_number_not_current_round, key: combatLossRound }`.
5. Effect is exactly `{ type: close_source_card }`.
6. Lifecycle remains `{ duration: while_active, starts: immediate, cleanup: remain_active }`.
7. Execution remains automatic; no interaction, target, rule modifier, generic player-flag ledger, or identity-specific runtime branch is authorized.

A read-only whole-card probe against exact accepted FB2-38 runtime returned `report=[]` and `mode=automatic`.

## S scope

Fresh S must:

- create exactly one Darius archive under `data/authoring/servants/` containing only `servant.darius.skill.sc-darius-1`;
- add focused consumer-migration tests that load the real archive and exercise the real post-scoring/current-battle terminal trigger path;
- prove no-loss closes the active source, any represented loss preserves it, non-participation is not loss, and malformed/non-terminal contexts fail closed through accepted FB2-38;
- preserve the zero-mana skill-zone requirement and static metadata/evidence hashes;
- add an S result report only.

Forbidden: runtime production edits, second consumer identity, pack/generated/product registration, merge/retarget, identity routing, or migration credit before fresh R acceptance plus A sync.

## Required accounting and gates

- Base frozen overlap must remain `136/944`.
- Candidate must be exactly `137/944`: exact +1 Darius, zero removals, zero duplicates.
- Focused Darius migration tests, FB2-38 focused tests, typecheck, rules core+regression, official CI, content validation, generated determinism, exact Locked Reference verification, client build, diff-check, and final cleanliness must pass.
- Runtime production source diff must be empty.

Formal project migration remains **`140/944`**, with **`804`** remaining until fresh independent R returns `MIGRATION_ACCEPTED` for the exact S Candidate and A performs acceptance synchronization.
