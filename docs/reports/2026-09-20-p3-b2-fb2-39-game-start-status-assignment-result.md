# P3-FB2-39 Game-Start Player-Status Assignment Result

Role: Codex B2
Status: `IMPLEMENTED_CANDIDATE`
Date: 2026-09-20

## Dispatch binding

- Exact A dispatch Base: `9a0968f064565556818c043c12b38d4cfa69d837`
- Branch: `codex/b2-p3-fb2-39-game-start-status-assignment`
- Formal project migration at dispatch: `142/944`, `802` remaining
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Frozen F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`

FB2-39 is identity-free runtime capability infrastructure only and earns **zero migration credit**.

## Implemented structural seam

The Candidate adds one narrow game-start player-status assignment contract:

- exact automatic `game_start` ability envelope;
- exactly one exact `{ "type": "source_owned" }` condition;
- one or more exact `add_status` effects;
- each status is a non-empty, non-whitespace opaque string;
- effect target is either literal `controller` or exact `{ "scope": "turn_order_next_player" }`;
- no top-level targets, cost, creates, rule modifiers, lifecycle, limit, or visibility widening;
- response window is empty or the exact normalized default `{ order: "turn_order", passBehavior: "decline_this_window" }`;
- execution remains automatic with an exact empty operation authority.

`turn_order_next_player` is resolved from authoritative player seats, starting after the controller and wrapping once. The resolver skips eliminated/inactive players, never selects the controller, and fails closed on missing controller, only-self topology, duplicate player ids, non-integer seats, or duplicate seats.

Player status keys are stored in server-owned `AbilityRuntime.playerStatusKeysByPlayer`, deduplicated per player, and exposed through read-only generic helpers. This store is deliberately distinct from `PlayerState.status`; assigning an opaque status never mutates `active` / `eliminated` state.

Production paths changed:

- `packages/rules/src/ability/game-start-player-status-assignment.ts`
- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/loader.ts`
- `packages/rules/src/ability/types.ts`
- `packages/rules/src/index.ts`

Focused test:

- `packages/rules/tests/fb2-39-game-start-player-status-assignment.test.ts`

No consumer authoring, generated/product pack, content package, app/client, frozen accounting, merge, or retarget is included.

## Fail-closed coverage

Focused coverage proves rejection of near matches including:

- wrong trigger;
- missing or widened `source_owned` condition;
- empty, whitespace-only, or non-string status;
- unsupported target values;
- extra target fields;
- extra effect fields;
- unrelated mixed effects;
- nested or misplaced `add_status`;
- partial response-window shapes.

Runtime coverage proves:

- controller assignment;
- circular seat-order next-player assignment independent of backing array order;
- eliminated-player skipping;
- wrap-around;
- atomic failure when no valid other player exists or seat topology is ambiguous;
- multiple status keys and idempotent duplicate assignment;
- `PlayerState.status` remains unchanged;
- pre-existing game-start fixed-mana behavior continues to execute alongside the new route.

## Validation

At the final Candidate worktree:

- `npm.cmd ci --ignore-scripts --offline`: PASS, dependency tree installed without lifecycle scripts;
- `npm.cmd run typecheck`: PASS;
- focused FB2-39 + existing game-start regressions: **4 files / 31 tests PASS**;
- rules core + regression: **78 files / 482 tests PASS**;
- official `npm.cmd run test:ci -- --maxWorkers=2`: **158 files / 1112 tests PASS**;
- content validation: **7 masters / 7 servants / 20 events / 0 blocking issues**;
- generated determinism: PASS with unchanged hashes:
  - library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`
- exact Locked Reference verifier against `E:\Codex\FD\fd-reference`: PASS at `b2f9fa15fba07c63530bbf4612b03b8b704755f9`;
- client production build: PASS; only existing Vite browser-externalization / chunk-size warnings;
- production hardcode audit: CLEAN for `master.amakusa`, printed card name, intended consumer status literals, F1 hash, and Locked Reference hash;
- forbidden-scope diff audit: CLEAN for `data/authoring`, generated/product pack data, `packages/content`, and `apps/client`;
- `git diff --check`: PASS.

An additional client unit-suite run produced **47/48 PASS** with one checkout-level pre-existing archive-inventory expectation failure in `apps/client/src/state/fd-asset-registry.test.ts` (`resolves every card in the approved authoring archives`): the test expects the small approved archive set while this checkout contains the full authoring archive set. FB2-39 changes no client or authoring data, the official CI gate is green, and the client production build is green; no out-of-scope client change was made.

## Formal accounting

Formal migration remains **`142/944`**, with **`802`** remaining. FB2-39 earns **zero migration credit**.

The Candidate must now receive a **fresh independent R** review against exact Base/Candidate. R must remain read-only and return only `IMPLEMENTATION_ACCEPTED_CANDIDATE` or `IMPLEMENTATION_NEEDS_REVISION` for this B2 Candidate. On acceptance, A synchronizes the zero-credit seam and immediately re-overlays `master.amakusa.skill.s1`; if its whole card is zero-gap, the next action is singleton S migration before any unrelated B2 work.
