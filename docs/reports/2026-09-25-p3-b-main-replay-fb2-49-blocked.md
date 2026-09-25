# P3-B Current-Main FB2-49 Semantic Replay — Blocked

Role: Codex B2
Status: `IMPLEMENTATION_BLOCKED`
Date: 2026-09-25

## Exact lineage

- current-main control base: `4b52b3166ed2ba0efaa4569ee95c6513fd26ab2f`
- A replay dispatch / implementation Base: `8842186ca3653775d35dd07eff1965606532da66`
- B branch: `codex/b2-p3-main-replay-fb2-49`
- source semantic lineage: PR #422 Base `822b5f9dfd05a64a5707fcb945b8b85eff2238e6` -> accepted Candidate `aa04a12e1647560374e09f7e2b6e62a5dccd0954`
- source fresh-R evidence: `https://github.com/binchen648/fd/pull/422#issuecomment-5775423822`
- locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Blocker

The exact accepted FB2-49 implementation inherits and actively enforces the previously accepted FB2-42 controlled-card close-forbid contract. In the accepted source Candidate, `packages/rules/src/ability/interpreter.ts` imports `isCardCloseForbidden` from `./card-close-forbid` and uses it at FB2-49 settlement before closing any frozen opponent card. The accepted FB2-49 result explicitly records that a live FB2-42 `card_close` forbid must reject the whole keep-one decision atomically with no partial close.

Current main `4b52b316...` has no `packages/rules/src/ability/card-close-forbid.ts` and no accepted FB2-42 current-main capability. This is not an incidental compile dependency: omitting it would weaken already accepted FB2-49 behavior, while importing it inside this B task would violate the A dispatch prohibition against pulling missing frontier prerequisites automatically.

Therefore the exact FB2-49 contract cannot be faithfully replayed on the current main capability baseline yet.

## Mechanical proof

- source PR #422 Base contains `packages/rules/src/ability/card-close-forbid.ts`;
- current main contains no file at that path;
- accepted #422 Candidate calls `isCardCloseForbidden` in the opponent-close settlement path;
- historical FB2-49 result names the FB2-42 compatibility case as required focused behavior;
- A dispatch explicitly requires `IMPLEMENTATION_BLOCKED` when an exact prerequisite is absent on current main.

## Scope preservation

No FB2-42 implementation was imported by this task. No source/frontier commit was cherry-picked or merged. No `data/authoring/**`, packs, generated content, client production code, consumer migration, Astolfo, Scathach, M50-03, or migration credit was introduced.

A dry semantic replay was attempted only to locate adaptation boundaries. Before stopping, all partial current-main modifications were preserved under `E:\Codex\FD\.fd-main-replay-fb2-49-blocked-preserve` and the canonical main checkout was mechanically returned byte-for-byte/index-for-index to exact A Base without `git reset`, `git checkout`, `git clean`, or deleting the preserved work.

## Accounting

- current-main formal accepted overlap: `111/944`
- current-main material overlap: `111/944`
- frozen additions: `0`
- frozen removals: `0`
- migration credit: `0`

## Required next action

Codex A must dispatch a separate zero-credit current-main semantic replay for the exact FB2-42 controlled-card close-forbid capability, using its accepted historical implementation/reviewer evidence as source evidence but adapting it to current main without frontier consumer material. After that capability receives fresh current-main R acceptance and A synchronization, re-dispatch FB2-49 on that capability lineage.

No fresh R is requested for this blocked B task because there is no implementation Candidate to review.