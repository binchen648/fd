# P3-FB2-18 Recovery Outside-Game Initial Placement Handoff

Date: 2026-09-17
Role: Codex A -> Codex B2
Status: `READY_FOR_B2_RECOVERY`
Credit: zero frozen-migration credit

## Base

- Base: exact P3-A-FB2-17-RECOVERY-BLOCKER-SYNC commit carrying this handoff.
- Fresh FB2-17 blocker: `310e6546fa2457b6bf11b91e547d25eb39751e99`.
- Fresh R42-accepted FB2-16 candidate: `bc45b2032ec344d2c743d8b32e3a3d05aa8b67ca`.
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`.
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.

## Goal

Add one identity-free authoring representation field for an owned card definition:

`initialPlacement: "outside_game"`

For an owned `master_skill` carrying that exact value, normal authoring loading must preserve the field and executable compilation must register the definition without assigning `initialZone`.

This is representation only. It does not create, move, provision, activate, or otherwise mutate cards at runtime. FB2-15 remains the only accepted game-start provisioning execution boundary.

## Exact contract

- The field is optional and exact. If absent, existing behavior is unchanged.
- The only accepted value in this task is `outside_game`; malformed/unknown values must fail closed during loading/validation rather than being silently normalized.
- An ordinary owned `master_skill` without this field must continue receiving the existing default `initialZone: "skill"` behavior.
- An owned `master_skill` with `initialPlacement: "outside_game"` must remain registered in the executable pack with owner/card semantics intact, but must not receive any `initialZone`.
- Compiler logic must be identity-free: no card ID, owner, printed text, Reference handler, Shirou name, or target-specific routing.
- Do not change FB2-15 source-driven provisioning deferral, FB2-16 required-additional semantics, MatchSession initialization, or runtime movement logic.

## May touch only

- `packages/rules/src/ability/types.ts`
- `packages/rules/src/ability/loader.ts`
- `packages/rules/src/ability/executable-card-pack.ts`
- one focused FB2-18 regression test
- `packages/rules/tests/executable-card-pack.test.ts` only if needed
- `docs/reports/2026-09-17-p3-fb2-18-recovery-outside-game-initial-placement-result.md`

No authoring, pack manifest, generated product, interpreter, MatchSession, support-only registration, taxonomy/KPI, frozen migration, or Reference files may change.

## Required verification

At minimum:

- exact base/clean worktree proof;
- typecheck;
- focused loader/compiler tests proving valid preservation and invalid-value rejection;
- executable compiler proof that explicit outside-game master skills are registered with no `initialZone`;
- proof that default master skills still compile to `initialZone: "skill"`;
- FB2-15 and FB2-16 compatibility tests;
- full CI, client build, content validation, generated determinism, locked Reference verify;
- coverage/audit must remain zero-credit;
- `git diff --check` and exact scope audit;
- final clean candidate worktree.

Completion status allowed:

- `IMPLEMENTATION_COMPLETE_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`
- `IMPLEMENTATION_BLOCKED`

After a candidate, fresh R43 is required before A may synchronize this seam. Do not retry FB2-17, FM09, or Ciel from the implementation task itself.
