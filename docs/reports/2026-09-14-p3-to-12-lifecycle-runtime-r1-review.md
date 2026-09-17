# P3-TO-12 Lifecycle Runtime r1 Independent Review

- Document Role: INDEPENDENT_REVIEW
- Reviewer: Codex R
- Task: `P3-TO-12`
- TargetCommit: `da563815415e5f6240a6a0b9f62f6310e2c1146e`
- Accepted Source-State Policy Candidate: `0b8c6bf611447b416581694d807b9bb52badc30b`
- Accepted Source-State Policy Review: `f7435cca3d884357c7fc2aeb829610421f8e357a`
- Prior Review: `5c2496be9473a890b5bf8f241579ad5678269606` / `IMPLEMENTATION_NEEDS_REVISION`
- Review Branch: `codex/r-p3-to12-lifecycle-r1-review`
- Final Status: `GATE_A_B_CANDIDATE_ACCEPTED`

## Findings

No blocking finding remains.

The two P1 findings from the first independent review are closed:

1. TO12 no longer self-defines and self-accepts its source-state dependency. The Card Zone/source-state policy is an independently reviewed ancestor dependency (`0b8c6bf` accepted by `f7435cc`).
2. Lifecycle identity now separates semantic duplicate detection from per-installation incarnation identity. A later valid reinstall of the same source card/ability obtains a fresh server-owned lifecycle ID and cannot have its termination suppressed by an older lifecycle history entry.

No new runtime, compiler, projection, reconnect, or scope blocker was found.

## Prior Finding Closure

### P1 — source-state policy acceptance boundary

**CLOSED.**

Fresh ancestry verification:

```text
f7435cca3d884357c7fc2aeb829610421f8e357a is an ancestor of da563815415e5f6240a6a0b9f62f6310e2c1146e
```

The accepted policy helper has **zero delta** between the independent policy review and the TO12 r1 target:

```text
git diff f7435cc..da56381 -- packages/rules/src/core/card-source-state.ts
# empty
```

Therefore TO12 consumes, but does not redefine, the independently accepted source-state policy.

### P1 — lifecycle identity reused across later valid installations

**CLOSED.**

The runtime now uses:

- semantic duplicate detection: `sourceCardId + abilityId + policyKey` over live `ongoingEffects`;
- incarnation identity: server-owned `nextId(s, 'lifecycle')` for each successful installation;
- termination dedupe: exact `lifecycleId + transition kind`, so dedupe is limited to one incarnation.

Independent two-round adversarial probe on the same source-card instance:

```text
round 1 lifecycleId = lifecycle-3
  install = 1
  source_invalidated = 1

round 2 lifecycleId = lifecycle-9
  install = 1
  source_invalidated = 1

distinct lifecycle IDs = true
```

This directly closes the TO04 negative-case requirement that a distinct later valid use must not be suppressed by a similar historical transition.

## Semantic Routing / Scope Judgment

**PASS for the scoped TO12 representative.**

Accepted representative:

- `servant.artoriac.skill.sc-artoriac-3`
- lifecycle ability `sc-artoriac-3.discard-public-and-power-formula`
- semantic contract: `while_card_active` + `when_card_leaves_active_area` + accepted Card Zone/source-state policy

Runtime routing contains no Artoria C / SC3 card or ability identity branch. Fresh static audit returned:

```text
NO_RUNTIME_IDENTITY_MATCHES
```

Loader/compiler admission rejects unknown or malformed source-validity policy metadata rather than guessing active zones or falling back to legacy behavior.

The accepted source-state policy is server-owned and checks source instance identity, controller, definition-at-install, authoritative active bit, face-down state, and allowed active-area zone. `field` alone is not sufficient; it must also be authoritatively active and face up.

No broader Lifecycle-family inheritance is accepted by this review.

## Lifecycle / Projection / Reconnect Judgment

**PASS.**

Independent evidence covers:

- source-active lifecycle installation after successful source play;
- persistence across authoritative round changes while the source remains valid;
- external Card Zone CLOSE invalidating the source and tearing down lifecycle state in the same dispatch;
- discard-zone public projection while SC3 remains active;
- immediate restoration of discard privacy after source invalidation;
- serialize/restore and browser reconnect preserving the lifecycle before close;
- reconnect after close not resurrecting lifecycle/public visibility;
- stale revision replay rejection;
- corrupt source-state policy failing closed without authoritative state commit;
- restored lifecycle state with missing install transition failing closed;
- renamed semantic ability remaining eligible without identity routing;
- next-round reinstall of the same source producing a fresh lifecycle incarnation and independent termination history.

## Independent Verification

```text
npm.cmd run typecheck
PASS

focused:
8 files / 104 tests PASS

independent lifecycle incarnation probe:
PASS
- lifecycle-3: 1 install / 1 source_invalidated
- lifecycle-9: 1 install / 1 source_invalidated
- distinct=true

Playwright lifecycle reconnect / projection / external-close E2E:
5/5 PASS

npm.cmd test:
97 files total
87 passed / 10 failed
596 tests total
576 passed / 20 failed
```

All 20 root-suite failures are the inherited local CHM/original-image asset absence class. No TO12 lifecycle, source-state policy, compiler, generated-content hash, MatchSession, projection, reconnect, or E2E regression fails.

`git diff --check` on the reviewed target: PASS.

## Gate Judgment

### SC3 source-active lifecycle representative

- Gate A: **PASS** — accepted external source-state dependency is fixed in ancestry, loader/compiler admission is fail-closed, generated content is synchronized, semantic routing is identity-independent, and runtime ownership is explicit.
- Gate B: **PASS** — lifecycle installation, persistence, invalidation, cleanup, corruption handling, replay identity, later-valid-reinstall identity, and broader focused regressions pass independently.
- Gate C: **PASS** — real browser/server/WebSocket evidence proves projection, reconnect, external close, privacy restoration, and stale-revision rejection; 5/5 repeated Chromium runs pass.

## Residual Scope

This review does **not** claim:

- migration of all 11 Lifecycle/reset rows;
- acceptance of other source-bound policies, `remain_active`, reset policies, or modifier lifetimes;
- Gate inheritance for other Lifecycle abilities;
- global KPI or denominator changes beyond A-owned synchronization.

Only the reviewed SC3 source-active duration/cleanup representative is accepted here.

## A Synchronization Input

Codex A may synchronize the following reviewed facts:

```text
P3-TO-12 status: REVIEW_ACCEPTED
accepted runtime candidate: da563815415e5f6240a6a0b9f62f6310e2c1146e
accepted source-state dependency: f7435cca3d884357c7fc2aeb829610421f8e357a
scoped lifecycle representative migrated: 1
scoped dual runtime: 0
Gate A: PASS
Gate B: PASS
Gate C: PASS
```

The global Lifecycle denominator remains the existing 11 explicit lifecycle/reset abilities. No other row may be counted migrated by family inheritance.

After A synchronization, TO12 releases the exclusive runtime hot-file lane. The next queue dependency may be updated according to the accepted task index; TO13 still requires its own prerequisite state and independent runtime review.

## Final Judgment

`GATE_A_B_CANDIDATE_ACCEPTED`

Accepted downstream runtime candidate:

`da563815415e5f6240a6a0b9f62f6310e2c1146e`

The reviewer report commit is evidence only; the runtime baseline remains the exact candidate above.
