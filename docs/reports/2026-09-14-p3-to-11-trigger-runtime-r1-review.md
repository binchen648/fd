# P3-TO-11 Trigger Runtime r1 Independent Review

- Document Role: INDEPENDENT_REVIEW
- Reviewer: Codex R
- Task: `P3-TO-11`
- TargetCommit: `3390d3bd634219beddac60832dcce2e0f0eb3a07`
- Parent Candidate: `17d96b0057b79883769f9bd266d1f0cfefddbd5d`
- Prior Review: `366e582e4286664b5e00abae6d28be488533b0dc` / `IMPLEMENTATION_NEEDS_REVISION`
- Review Branch: `codex/r-p3-to11-trigger-runtime-r1-review`
- Final Status: `GATE_A_B_CANDIDATE_ACCEPTED`

## Findings

No blocking finding remains.

The prior public-API regression is closed. The r1 repair restores the previously exported `collectTriggeredAbilities` symbol and adds durable root-package coverage. The repair does not change TO11 semantic routing or game behavior relative to the parent candidate.

## Prior Finding Closure

Relative to `17d96b0`, the runtime/test repair is exactly:

```text
packages/rules/src/ability/interpreter.ts
  - restore `export` on collectTriggeredAbilities
packages/rules/tests/regression/package-exports.test.ts
  - import/assert collectTriggeredAbilities from package root
```

Fresh static and runtime verification:

```text
collectTriggeredAbilities=function
```

The first-review result was `undefined`; therefore the compatibility blocker is directly demonstrated closed.

## Semantic Routing / No-Legacy-BYPASS Judgment

**PASS for the scoped TO11 representative.**

The accepted typed representative remains:

- `master.shinji.skill.drain-command#drain-command.enter-miyama`

Eligibility is semantic:

- forced trigger;
- `after_controller_enters_location`;
- authored fixed `eventLocationId`;
- no targets/cost/creates/modifiers/lifecycle/real response window/limit;
- exactly one integer controller `adjust_mana` effect.

Runtime routing contains no Shinji/Ereshkigal card or ability identity branch. Wrong/missing event destination is rejected by discovery. A recognized malformed location-resource candidate fails as `resolution_failed` and does not retry through legacy effect settlement.

The server-owned movement producer emits the location event only after successful movement, and event identity is allocated from authoritative runtime sequence through `processAbilitySystemEvent`.

## Trigger / Transaction / Replay Judgment

**PASS.**

Committed and independently rerun evidence covers:

- successful normal movement -> trusted location event -> typed mana adjustment;
- movement ending elsewhere does not trigger Shinji;
- wrong or missing `locationId` does not trigger;
- repeated delivery of the same trusted event ID does not mutate twice or advance revision;
- typed mana cap and mana-gain-block policy are preserved;
- malformed recognized candidate fails atomically with unchanged authoritative state;
- loader admission marks invalid event-location metadata unsupported;
- generated product pack contains `eventLocationId: "miyama_town"` and passes deterministic hash validation.

## Ereshkigal Residual Risk

`servant.ereshkigal.skill.sc-ereshkigal-2#sc-ereshkigal-2.gain-mana-on-deploy` remains intentionally **not migrated** by TO11 because the runtime has no authoritative source-card battlefield anchor.

Independent R2 probe:

```text
ereshClassifier=false
ereshManaAfter=5
ereshTypedManaEvent=false
```

Starting mana was 4. This confirms the row still uses the pre-existing generic legacy trigger/effect path rather than the TO11 typed classifier. It must remain `SOURCE_BATTLEFIELD_ANCHOR_REQUIRED` and must not be counted as migrated by Codex A. The candidate adds deployment `locationId` payload but does not claim or infer support for the missing source-battlefield relation.

## Independent Verification

```text
npm.cmd run typecheck
PASS

focused:
8 files / 95 tests PASS

root API probe:
collectTriggeredAbilities=function

golden compiled-content pipeline:
PASS

npm.cmd test:
95 files total
85 passed / 10 failed
582 tests total
562 passed / 20 failed
```

All 20 root-suite failures are the inherited local CHM/original-image asset absence class. No TO11, package-export, generated-content hash, movement, MatchSession, or Resource Numeric regression fails.

`git diff --check` on the repair delta: PASS.

## Gate Judgment

### Shinji location mana representative

- Gate A: **PASS** — semantic route is explicit, generated product content is synchronized, and the previously introduced API regression is repaired.
- Gate B: **PASS** — focused runtime, fail-closed, movement-producer, replay/idempotency, typed resource and broader regression evidence pass independently.
- Gate C: **not required for this slice** — TO11 does not change client projection, reconnect continuation, or hidden interaction state.

### Ereshkigal deployment mana

- Gate A/B: **NOT CLAIMED / NOT MIGRATED**.
- Residual blocker: `SOURCE_BATTLEFIELD_ANCHOR_REQUIRED`.

## A Synchronization Input

Codex A may synchronize only the accepted TO11 scoped transition:

```text
local inspected representatives: 2
migrated to typed TO11 route:    1  (Shinji)
skipped / still legacy:          1  (Ereshkigal)
dual runtime for migrated row:   0
```

Global Trigger denominator/KPI remains A-owned and must not infer migration for other trigger rows by family inheritance.

The runtime hot-file lane may be released to the next scheduled owner after A synchronization.

## Final Judgment

`GATE_A_B_CANDIDATE_ACCEPTED`

Accepted downstream runtime candidate:

`3390d3bd634219beddac60832dcce2e0f0eb3a07`

The reviewer report commit is evidence only; the runtime baseline remains the exact candidate above.
