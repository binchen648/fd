# P3-R10 — B16 Battle-Loss Servant Reveal Independent Review

- Date: 2026-09-14
- Reviewer: Codex R10
- Candidate task: `P3-B16`
- Exact candidate SHA: `3f36eb39235d4e836304b2512b7f6a478287fd97`
- Reviewer branch: `codex/r-p3-b16-battle-loss-reveal-r1-review`
- A-owned handoff: `76a3e438945c008f027d9a5a071d4bb7a0259758`
- Verdict: **ACCEPTED**

## Review Boundary

This review was performed in a fresh worktree created directly from the exact B16 candidate SHA. The reviewer did not modify B16 runtime implementation to make tests pass.

Scope reviewed:

```text
forced after_controller_loses_battle
-> reveal_information(scope=servant_package, subject=controller.servant)
-> typed reveal_servant_package
```

No broad reveal/Hidden Information migration is accepted by this review.

## Static / Identity Review

**PASS**

The production diff against the A-owned B16 handoff contains only generic semantic/compiler/data-flow changes in:

- `packages/rules/src/ability/executable-card-pack.ts`
- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`

Independent production-diff search found no `achilles`, `sc-achilles`, or `servant.achilles` routing literal.

The semantic classifier is structural. A same-shape ability with a renamed ability ID still classifies, while malformed scope/subject is rejected through the typed normalizer/route boundary.

`git diff --check` passed. The reviewer worktree remained clean after dependency setup/test execution; no lockfile or runtime implementation edits were introduced by review.

## Gate A — Typed Visibility Primitive

**PASS**

The reviewed `reveal_servant_package` primitive:

- uses `abilityRuntime.revealedServants` as the existing authoritative reveal truth source;
- requires the controller player to exist;
- requires the source card to exist and be owned/controlled by that controller;
- reveals only `controller.servant`;
- emits one typed `servant_package_revealed` event with source/ability/result provenance on first reveal;
- returns `applied` with `revealedCount=1` on first reveal;
- returns `no_op` with `revealedCount=0` and no second event once already revealed;
- exposes `revealedCount` through the normal result-binding evaluator;
- rejects malformed scope/subject and wrong-controller use atomically.

### Reviewer-only adversarial probe

A temporary reviewer-only probe was run and then deleted. It used the formal loader-normalized `AuthoringAbility` path and produced:

```json
{
  "renamedClassifies": true,
  "malformedRejected": true,
  "firstStatus": "applied",
  "firstEventCount": 1,
  "secondStatus": "no_op",
  "secondEventCount": 0,
  "wrongControllerRejectedAtomically": true
}
```

This independently confirms identity-free classification, malformed-shape rejection, reveal idempotence, and source/controller atomicity.

## Gate B — Trigger / Battle Ordering

**PASS**

B16 does not alter the accepted battle pipeline. Independent regression execution confirms the existing ordering remains:

1. battlefield results resolve;
2. base scoring receipts settle;
3. post-scoring result/loss events dispatch;
4. B16 reveal settles from the stable loss event;
5. B15 phase-terminal work dispatches later;
6. cleanup follows.

The frozen-participant rule remains effective: a losing controller eliminated by base scoring can still settle its same-battle loss reveal exactly once.

The no-loss path does not reveal, stable replay does not duplicate, and same-round battle re-entry does not produce a second reveal.

## Focused / Compatibility Reproduction

Fresh reviewer command:

```text
npx.cmd vitest run \
  packages/rules/tests/regression/battle-loss-servant-reveal.test.ts \
  packages/rules/tests/regression/battle-loss-resource-trigger.test.ts \
  packages/rules/tests/regression/battle-shared-victory-vp-trigger.test.ts \
  packages/rules/tests/regression/battle-terminal-source-card-zone.test.ts \
  packages/rules/tests/regression/card-zone-core-direct-action.test.ts \
  packages/rules/tests/regression/resolution-dataflow.test.ts \
  packages/rules/tests/regression/resource-numeric-core-direct-action.test.ts \
  packages/rules/tests/regression/resource-numeric-room-boundary.test.ts \
  packages/rules/tests/regression/trigger-resource-runtime.test.ts \
  packages/rules/tests/executable-card-pack.test.ts \
  --testTimeout=15000
```

Result:

```text
Test files: 10 passed / 10
Tests:      91 passed / 91
```

Fresh `npm.cmd run typecheck` also passed.

## Gate C — Remote Room / Projection / Reconnect

**PASS**

Fresh reviewer Chromium run:

```text
npx.cmd playwright test \
  e2e/fd-achilles-battle-loss-reveal.spec.ts \
  e2e/fd-ereshkigal-battle-terminal-card-zone.spec.ts \
  -c playwright.config.ts --project=chromium

2 / 2 PASS
```

This independently reproduces:

- servant package hidden before Achilles loses;
- scoring barrier before Shinto result/loss dispatch;
- authoritative public servant-package projection after the loss reveal;
- B15 terminal dispatch after ordinary result/loss work;
- reconnect persistence;
- stale-revision rejection;
- no second reveal caused by reconnect/stale replay.

The B15 Eresh terminal Card Zone scenario remains green in the same reviewer runtime.

## Full Root Baseline

Fresh reviewer root-suite run:

```text
npx.cmd vitest run --testTimeout=15000

Test files: 100 passed / 10 failed / 110 total
Tests:      663 passed / 20 failed / 683 total
```

This exactly reproduces the implementation-side B16 result.

All 20 failures are the inherited local CHM/original-image evidence absence class already present in the accepted B15 baseline. No B16 runtime, Visibility, Trigger, battle-order, projection, reconnect, or deterministic compatibility failure was added.

Relative to accepted B15:

```text
B15: 655 PASS / 20 inherited FAIL
B16: 663 PASS / 20 inherited FAIL
Delta: +8 PASS / +0 new FAIL
```

## Findings

No blocking finding was identified.

Non-blocking boundary note: `isBattleLossServantRevealSemantic()` is an interpreter semantic classifier over loader-normalized `AuthoringAbility`; raw authoring JSON with omitted normalized fields is not its public input contract. The production/compiler path already normalizes authoring before this classifier is used, and all accepted runtime paths exercise the normalized form.

## Acceptance

**P3-R10 ACCEPTED** for exact candidate:

```text
3f36eb39235d4e836304b2512b7f6a478287fd97
```

A03 may now perform a fresh evidence/coverage synchronization. The scoped TO14 direct-consumer accepted overlay may advance from `3/13` to `4/13` only if the A03 sync records this exact candidate plus this R10 acceptance without fabricating raw coverage KPI changes.
