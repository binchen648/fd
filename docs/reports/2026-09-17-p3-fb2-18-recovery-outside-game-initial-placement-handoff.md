# P3-FB2-18 Recovery Outside-Game Initial Placement Handoff

Date: 2026-09-17
Role: Codex A -> Codex B2
Status: `READY_FOR_B2_RECOVERY`
Credit: zero frozen-migration credit

## Base

- Exact base: fresh P3-A-FB2-17-RECOVERY-BLOCKER-SYNC commit carrying this handoff.
- Fresh FB2-17 blocker: `310e6546fa2457b6bf11b91e547d25eb39751e99`.
- Fresh R42-accepted FB2-16 candidate: `bc45b2032ec344d2c743d8b32e3a3d05aa8b67ca`.

Historical FB2-18 material is technical evidence only. No old candidate or R43 acceptance is inherited.

## Problem

Current executable compilation gives a standalone owned `master_skill` an `initialZone: "skill"`. That is correct for ordinary initially-owned skills but cannot represent a definition that is registered for later creation/provisioning while starting outside the game.

The fresh FB2-17 probe requires exactly this distinction for a future support definition: the definition must exist in the executable pack but must not be placed in any starting zone. This task closes only that generic representation seam.

## Exact contract

Add one identity-free card-level authoring property:

`initialPlacement: "outside_game"`

For an owned `master_skill` carrying that exact value:

1. authoring loading preserves the field without identity/name/text inference;
2. executable compilation registers the definition normally;
3. executable output contains no `initialZone` for that card;
4. ordinary `master_skill` cards without the marker retain existing `initialZone: "skill"` behavior;
5. malformed/unsupported `initialPlacement` values fail closed rather than silently changing placement;
6. this field by itself does not create, move, activate, reveal, or provision any card;
7. FB2-15 source-driven provisioning deferral remains independently valid and unchanged.

No card ID, owner name, printed text, Reference handler, or allowlist may participate in the production decision.

## May touch

Only:

- `packages/rules/src/ability/types.ts`;
- `packages/rules/src/ability/loader.ts`;
- `packages/rules/src/ability/executable-card-pack.ts`;
- one focused FB2-18 regression test;
- `packages/rules/tests/executable-card-pack.test.ts` only if needed for compiler evidence;
- one FB2-18 recovery result report.

No authoring archive, pack manifest, generated product artifact, MatchSession/interpreter runtime, provisioning execution, support-only registration, taxonomy/KPI, Reference, or frozen identity may change.

## Required evidence

At minimum prove:

- exact field survives authoring loading;
- a synthetic identity-independent owned `master_skill` with `initialPlacement: "outside_game"` compiles into the executable card pack with no `initialZone`;
- the same card without the field receives ordinary `initialZone: "skill"`;
- malformed/unknown placement values fail closed;
- the field does not alter `playKind`, destination, owner, abilities, or other semantic payload;
- existing FB2-15 game-start provisioning deferral remains green;
- existing FB2-16 required-additional classification remains green;
- typecheck, focused tests, full CI, client build, content validation, generated determinism, locked Reference verify, coverage/audit, and `git diff --check` pass;
- scope contains no authoring/generated/frozen migration change.

Completion status allowed:

- `IMPLEMENTATION_COMPLETE_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`
- `IMPLEMENTATION_BLOCKED`

After a candidate, fresh process-separated P3-R43-RECOVERY review and fresh A synchronization are required before FB2-17 may be retried. Accepted frozen overlap remains `111/944`.
