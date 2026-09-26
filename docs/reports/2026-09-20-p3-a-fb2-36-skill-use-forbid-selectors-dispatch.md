# P3-A / FB2-36 Skill-Use Forbid Selectors Dispatch

Role: Codex A
Status: `DISPATCHED`
Date: 2026-09-20

## Exact baseline

- A dispatch Base: `ef5c93db818a1f6ab3bf830a182e4f0281fec964`
- Baseline role: R75 FB2-35 capability acceptance synchronization
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Formal migration accounting at dispatch: **`137/944`**, **`807` remaining**
- PR #381 / Ibaraki Candidate is pending fresh migration review and is intentionally **not** part of this Base.

## Dispatch rationale

Closure-first re-overlay over the remaining `READY_GENERIC_EXTENSION` roster found no two remaining cards with an identical full semantic-axis signature. The highest repeated missing modifier seam is `rule:skill_use:forbid`. Two consumers are close enough that one narrow identity-free runtime seam can make them S-ready without broad modifier work:

- same-location skill-use prohibition filtered by `notInAttack + trueNameRelease`;
- same-location opponent skill-use prohibition filtered by skill-zone + face-down state.

Reference identities, names, printed text, hashes, and handler IDs are evidence only and must not appear in runtime routing.

## Exact B2 scope

Implement only an identity-free `skill_use / forbid` play-permission seam for these two structural selector variants:

1. `scope.subject = players_at_source_location`
   - `scope.skillCard.notInAttack = true`
   - `scope.skillCard.trueNameRelease = true`
   - source-bound `while_active` lifecycle

2. `scope.subject = opponents_at_source_location`
   - `scope.skillCard.zones` is exactly the master/servant skill-zone pair
   - `scope.skillCard.face = down`
   - `this_round` lifecycle

The semantic enforcement point is ordinary/effect `play_card` eligibility (`playFailure` or an equivalent single authoritative helper). This dispatch does **not** require a generic `activate_ability` prohibition layer.

## Required fail-closed behavior

B2 must prove:

- only `operation = forbid` and `rule = skill_use` are accepted by this seam;
- only the two exact structural selector families above are accepted;
- malformed subject, filter keys, zone set, face value, booleans, operation, rule, or lifecycle are rejected/unsupported;
- same-location relation is checked from current authoritative player/source state at use time;
- opponent-only selector never blocks the source controller;
- face-down selector does not block face-up skills;
- true-name selector does not block skill cards lacking the structural true-name-release marker;
- `notInAttack` is checked from current physical card zone;
- source-bound `while_active` stops applying once its accepted source lifecycle is no longer live;
- `this_round` expires through existing lifecycle cleanup;
- ordinary play and trusted effect play use the same authoritative play eligibility path;
- no identity/name/text/hash/Reference-handler branches are added.

## Explicit non-scope

Do not implement or broaden:

- arbitrary `skill_use` subjects or filter languages;
- `skillDefinitionIds` or selected-card-derived skill-definition forbids;
- card cost/base-power modifiers;
- deployment-destination modifiers;
- copy/transform/status mechanics;
- generic `activate_ability` forbids;
- any consumer authoring for Nursery, Helena, Arcueid, Atalanta, Amakusa, Kayneth, or any other frozen identity;
- pack/generated product changes unless a generic runtime test fixture mechanically requires none (expected: none);
- migration accounting changes.

## Expected implementation surface

Prefer the smallest generic surface, expected to be limited to:

- loader structural acceptance/classification;
- interpreter/play-eligibility structural evaluation;
- focused FB2-36 tests;
- one B2 result report.

No consumer identity may appear in production runtime code. Tests may use synthetic fixture IDs only.

## Validation

Require at minimum:

- `npm.cmd run typecheck`;
- focused FB2-36 tests;
- rules core + regression + focused selection;
- official `npm.cmd run test:ci`;
- content validation;
- generated determinism;
- Locked Reference verification;
- client production build;
- `git diff --check`;
- production hardcode audit;
- final clean worktree.

FB2-36 earns **zero frozen migration credit**. After fresh R `IMPLEMENTATION_ACCEPTED_CANDIDATE` plus A capability synchronization, immediately re-overlay and dispatch S for the consumers unlocked by this seam before any unrelated B2 work.
