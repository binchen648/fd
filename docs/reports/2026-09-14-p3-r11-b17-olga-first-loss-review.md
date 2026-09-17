# P3-R11 — B17 Olga First-Loss ACTIVATE Independent Review

- Date: 2026-09-14
- Reviewer: Codex R11
- Candidate task: `P3-B17`
- Exact candidate SHA: `ebd050a0a4e353c8f747a54dfb1d6f51e8068542`
- Reviewer branch: `codex/r-p3-b17-olga-first-loss-recert-r1-review`
- A-owned handoff: `84d6858baa6c2e6b52161589747b2049c5319e40`
- Verdict: **GATE_A_B_CANDIDATE_ACCEPTED**

## Review Boundary

This review was performed in a fresh worktree created directly from the exact frozen B17 candidate SHA. The reviewer did not modify production runtime implementation.

B17 itself is evidence-only: its candidate diff contains one focused regression file plus its implementation report and no production runtime files under `packages/**/src` or `apps/**`.

Reviewed composition:

```text
forced_trigger + after_controller_first_loses_battle
-> server-derived first-loss event after the scoring barrier
-> stage exactly one delayed activation
-> no immediate activation during battle settlement
-> formal round_end
-> typed activate_card_by_id(...)
```

No Olga loss-transform, soul-drag, broad delayed scheduler, sibling TO14 consumer, TO15, or TO16 scope is accepted by this review.

## Findings

No blocking finding was identified.

The accepted route remains structural and identity-free. Production search in the ACTIVATE classifier, resolution-dataflow path, and MatchSession battle bridge found no `olga`, `astronomical-science`, or `trismegistus` routing literal.

## Gate A — Typed ACTIVATE / Fail-Closed

**PASS**

The reviewed ACTIVATE path is the already accepted TO10 semantic route. Fresh focused execution reconfirmed:

- exact-shape classification is based on `forced_trigger + after_controller_first_loses_battle + one activate_card_by_id effect`, not card/ability identity;
- wrong trigger, extra target, and wrong effect shape are rejected by the classifier;
- activation resolves only an owned target with the requested definition;
- missing, ambiguous, wrong-controller, wrong-zone, and already-active targets fail closed through the typed transaction path;
- failure is atomic because resolution operates on the transaction working state before commit;
- successful activation moves exactly one target `skill -> field`, makes it public, marks it active, and emits typed `card_activated` / effect-result evidence.

## Gate B — First-Loss Ordering / Exactly Once

**PASS**

Fresh review of `MatchSession` and B17 regression evidence confirms:

1. resolved battlefields are scored first;
2. `queuePostScoringBattleEvents()` requires a scoring receipt for every resolved battlefield;
3. first loss is derived from authoritative battle history and loser calculation, never from a client claim;
4. the first-loss event carries stable `battlePhaseResolutionId`, `battleId`, `resultId`, `battleParticipantIds`, `battlefieldId`, `playerId`, and `lossOrdinal=1`;
5. stable event IDs plus `processedEvents` / pending-event checks prevent duplicate queueing;
6. staging is additionally deduplicated by source card + ability + round;
7. no ACTIVATE executes during post-scoring settlement;
8. B15 terminal work dispatches only after ordinary result/first-loss work;
9. only formal `round_end` consumes the staged activation;
10. a repeated same-round `round_end` cannot activate a second copy;
11. a controller eliminated by base scoring remains eligible for its same-battle first-loss trigger through the frozen participant/event path.

Fresh reviewer reproduction:

```text
npm.cmd run typecheck
npx.cmd vitest run \
  packages/rules/tests/regression/battle-first-loss-delayed-activation-recert.test.ts \
  packages/rules/tests/regression/card-action-activate.test.ts \
  packages/rules/tests/regression/battle-loss-resource-trigger.test.ts \
  packages/rules/tests/regression/battle-loss-servant-reveal.test.ts \
  packages/rules/tests/regression/battle-terminal-source-card-zone.test.ts \
  packages/rules/tests/regression/resolution-dataflow.test.ts \
  packages/rules/tests/executable-card-pack.test.ts \
  --testTimeout=15000
```

Result:

```text
typecheck: PASS
Test files: 7 passed / 7
Tests:      80 passed / 80
```

This includes the B17-specific `3/3` first-loss delayed-activation recertification cases and the existing ACTIVATE malformed/atomic/identity-free boundaries.

## Gate C — Remote Room / Projection / Reconnect

**PASS**

Fresh reviewer Chromium run:

```text
npx.cmd playwright test \
  e2e/fd-olga-activate-card-action.spec.ts \
  e2e/fd-achilles-battle-loss-reveal.spec.ts \
  e2e/fd-ereshkigal-battle-terminal-card-zone.spec.ts \
  -c playwright.config.ts --project=chromium

3 / 3 PASS
```

The Olga scenario independently proves real room battle history -> first loss -> formal round-end activation -> public projection -> reconnect persistence -> stale-revision rejection without duplicate card activation. Achilles B16 and Eresh B15 compatibility remain green in the same browser runtime.

## Full Root Baseline

Fresh reviewer root run:

```text
npx.cmd vitest run --testTimeout=15000

Test files: 101 passed / 10 failed / 111 total
Tests:      666 passed / 20 failed / 686 total
```

This exactly reproduces the B17 implementation-side baseline.

All 20 failures remain the inherited local CHM/original-image evidence absence class. No ACTIVATE, battle ordering, delayed staging, projection, reconnect, stale-revision, or other deterministic B17 failure was added.

Relative to accepted B16:

```text
B16: 663 PASS / 20 inherited FAIL / 683 total
B17: 666 PASS / 20 inherited FAIL / 686 total
Delta: +3 PASS / +0 new FAIL
```

## Static / Diff Audit

**PASS**

- `git diff 84d6858..ebd050a --check`: PASS.
- Candidate production runtime diff: empty.
- Reviewer worktree stayed clean through dependency install and all test runs before this report was added.
- Current production ACTIVATE/battle routing contains no Olga/card/ability identity literal.

## Acceptance

**P3-R11 GATE_A_B_CANDIDATE_ACCEPTED** for exact candidate:

```text
ebd050a0a4e353c8f747a54dfb1d6f51e8068542
```

A03 may consume this exact candidate plus this R11 acceptance and advance the scoped TO14 direct-consumer overlay from `4/13` to `5/13`. It must not fabricate a raw coverage KPI change if fresh A-owned coverage automation does not classify a new global route.
