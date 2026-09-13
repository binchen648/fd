# P3-TO-12 Lifecycle Runtime r1 Repair

- Date: 2026-09-14
- Owner: Codex B runtime repair
- Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
- Branch: `codex/b-p3-to12-lifecycle-runtime-r1`
- Accepted source-state baseline: policy candidate `0b8c6bf611447b416581694d807b9bb52badc30b`, independent acceptance `f7435cca3d884357c7fc2aeb829610421f8e357a`
- Prior rejected TO12 candidate: `8717552b704dd495ed1178f909834e6eec129064`
- Prior TO12 review: `5c2496be9473a890b5bf8f241579ad5678269606`, `IMPLEMENTATION_NEEDS_REVISION`

## Repair Summary

The first TO12 review reported two P1 blockers. r1 closes both without broadening the migrated lifecycle denominator.

### P1-1 — external source-state self-acceptance

Closed by separating Card Zone/source-state policy work from Lifecycle:

1. reviewer `5c2496b...` recorded the R-confirmed external-policy blocker;
2. isolated Card Zone policy candidate `0b8c6bf...` implemented only `fd.card-zone.active-card-source.v1` plus its contract/tests;
3. fresh independent review `f7435cc...` returned `SOURCE_STATE_POLICY_ACCEPTED`;
4. this TO12 r1 branches from that exact accepted-policy review baseline and only then binds SC3 lifecycle authoring/runtime admission to `kind=accepted_source_state_policy`.

TO12 no longer defines and consumes its own unreviewed external policy in one candidate.

### P1-2 — lifecycle transition identity aliases reinstall cycles

Closed by separating semantic duplicate identity from lifecycle incarnation identity.

Before:

```text
ongoing.id = sourceCardId + abilityId + policyKey
```

A later valid reinstall of the same source reused the lifecycle ID, causing historical `source_invalidated` dedupe to suppress a later terminal transition.

Now:

```text
semantic-active duplicate check = sourceCardId + abilityId + policyKey
ongoing.id / lifecycleId = server nextId('lifecycle') per installation incarnation
```

Consequences:

- duplicate installation while the same incarnation is live remains idempotent;
- a legitimate later reinstall receives a fresh lifecycle ID;
- terminal idempotency is scoped to one lifecycle incarnation;
- transition history can distinguish multiple valid cycles of the same source instance;
- reconnect/restore preserves the incarnation ID already stored server-side.

A new regression proves the same SC3 card instance can be closed in round 1, replayed in round 2, and closed again with:

```text
first lifecycle:  1 install + 1 source_invalidated
second lifecycle: 1 install + 1 source_invalidated
firstLifecycleId != secondLifecycleId
```

## Migrated Scope

Still exactly one lifecycle representative:

- `servant.artoriac.skill.sc-artoriac-3`
- semantic ability shape currently authored as `sc-artoriac-3.discard-public-and-power-formula`
- `while_card_active`
- `when_card_leaves_active_area`
- accepted source validity policy `fd.card-zone.active-card-source.v1`

No Artoria Alter, Ereshkigal, fixed-duration, usage-limit, or unique-window lifecycle row inherits this candidate.

Runtime eligibility still contains no canonical character/card/ability ID branch. The renamed-ability regression remains passing.

## Product / Compiler Path

SC3 authoring carries the independently accepted sourceValidity reference. Loader/executable compiler fail closed for unknown or malformed policy metadata. Formal content compile succeeds with 0 blocking issues.

Generated definition hash:

```text
26167661823b52de598c77a59df4d05440a6bfced7d68cd3e04d11353d72dbaa
```

## Verification

- `npm.cmd run typecheck`: PASS.
- `npm.cmd run content:compile`: PASS; `7 masters, 7 servants, 20 events, 0 blocking issues`.
- core repair set:
  - source-state policy tests: 5/5 PASS;
  - source-active lifecycle tests: 8/8 PASS;
  - executable compiler tests: 21/21 PASS;
  - combined: 3 files / 34 tests PASS.
- final focused suite:
  - `card-source-state.test.ts`
  - `lifecycle-source-active-runtime.test.ts`
  - `executable-card-pack.test.ts`
  - `golden-card-content-pipeline.test.ts`
  - `complex-skills-regression.test.ts`
  - `ability-interaction-projection.test.ts`
  - `package-exports.test.ts`
  - `match-session.test.ts`
  - **8 files / 104 tests PASS**.
- browser lifecycle Gate-C candidate:
  - real MatchRoom / two clients / WebSocket expectedRevision / observer projection / reload+reconnect / external CLOSE / stale replay;
  - `--repeat-each=5`: **5/5 PASS**.
- root Vitest:
  - 97 files total;
  - **87 passed / 10 failed**;
  - 596 tests total;
  - **576 passed / 20 failed**;
  - all 20 failures are the inherited CHM/original-image asset absence class; no TO12/source-state functional failure is in the set.
- runtime canonical SC3 identity routing audit: 0 matches.
- `git diff --check`: PASS.

## Review Boundary

This r1 remains an implementation candidate. It does not self-promote Gate A/B/C.

Fresh R2 must independently verify at minimum:

1. accepted source-state dependency is genuinely prior/reachable (`0b8c6bf` + `f7435cc`);
2. Lifecycle consumes that policy and does not re-own active-area semantics;
3. lifecycle incarnation IDs are fresh per valid reinstall while semantic duplicate install remains idempotent;
4. each lifecycle incarnation emits at most one terminal invalidation, and distinct later incarnations are not suppressed;
5. CLOSE + mandatory lifecycle teardown remains atomic;
6. corrupt/unknown policy and missing install transition fail closed;
7. renamed semantic ability still routes without identity matching;
8. browser reconnect/projection/stale replay remains valid;
9. the 20 root failures remain inherited asset failures only.
