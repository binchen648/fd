# P3-B17 Olga First-Loss ACTIVATE TO14 Recertification Result

- Date: 2026-09-14
- Owner: Codex B
- Task: `P3-B17`
- Branch: `codex/b-p3-b17-olga-first-loss-recert-r1`
- A-owned handoff/base: `84d6858baa6c2e6b52161589747b2049c5319e40`
- Prerequisite lineage: accepted B13/B14/B15/B16 + accepted TO10 ACTIVATE
- Representative: `master.olga-marie.skill.astronomical-science / astronomical-science.first-loss`
- Status: `RECERTIFICATION_COMPLETE_CANDIDATE`

## Outcome

B17 found **no current-lineage runtime correctness blocker**.

Per the handoff's evidence-first rule, B17 makes **no production runtime change**. The candidate contains only:

- one B17-specific regression evidence file; and
- this result report.

The already accepted generic ACTIVATE route remains the implementation under review.

## Recertified Composition

The current B13–B16 battle lineage plus existing ACTIVATE semantics now has explicit focused proof for:

1. two authoritative battlefield results are resolved;
2. both base-scoring receipts exist before post-scoring dispatch;
3. the first-loss event is server-derived from authoritative battle history;
4. the event carries stable `battlePhaseResolutionId`, `battleId`, `resultId`, `battleParticipantIds`, `battlefieldId`, `playerId`, and `lossOrdinal=1`;
5. first loss stages exactly one delayed ACTIVATE request;
6. Trismegistus remains in `skill` and no `card_activated` event exists during post-scoring settlement;
7. ordinary result/first-loss work precedes B15 terminal work;
8. replay of the same stable first-loss event does not stage a second request;
9. only formal `round_end` consumes the request;
10. typed `activate_card_by_id` moves exactly one owned/controlled Trismegistus `skill -> field` and emits activation/effect evidence;
11. a second `round_end` cannot activate a second copy;
12. scoring elimination does not remove Olga from same-battle frozen first-loss eligibility;
13. missing activation target fails atomically after a valid stage.

Existing accepted ACTIVATE regression coverage continues to prove wrong-zone, ambiguous-target, wrong-controller, malformed-event, and identity-free classifier boundaries.

## New B17 Focused Evidence

Added:

```text
packages/rules/tests/regression/battle-first-loss-delayed-activation-recert.test.ts
```

Result:

```text
3 / 3 PASS
```

The three cases cover:

- two-battlefield post-scoring barrier + full first-loss provenance + delayed-only settlement + round-end exactly once;
- scoring-eliminated Olga frozen-participant eligibility;
- missing-target round-end atomic failure after a valid authoritative stage.

## Current-Lineage Focused Compatibility

Fresh command:

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

This recertifies ACTIVATE alongside the accepted B13 loss Resource, B16 loss Visibility, B15 terminal ordering, data-flow and compiler paths.

## Gate C

Fresh Chromium run:

```text
npx.cmd playwright test \
  e2e/fd-olga-activate-card-action.spec.ts \
  e2e/fd-achilles-battle-loss-reveal.spec.ts \
  e2e/fd-ereshkigal-battle-terminal-card-zone.spec.ts \
  -c playwright.config.ts --project=chromium

3 / 3 PASS
```

The Olga browser/server scenario independently exercises:

- real room battle history;
- first battle loss;
- formal round-end Trismegistus activation;
- server projection;
- reconnect preservation;
- stale-revision rejection;
- no duplicate activated card.

B16 Achilles and B15 Eresh remain green in the same current-lineage browser runtime.

## Full Root Baseline

Fresh root run:

```text
npx.cmd vitest run --testTimeout=15000

Test files: 101 passed / 10 failed / 111 total
Tests:      666 passed / 20 failed / 686 total
```

Accepted B16 baseline:

```text
663 PASS / 20 inherited FAIL / 683 total
```

B17 delta:

```text
+3 PASS
+0 new deterministic FAIL
```

All 20 failures remain the inherited local CHM/original-image evidence absence class. No ACTIVATE, battle-order, delayed-stage, projection, reconnect, stale-revision or deterministic compatibility failure was added.

## Production Diff Audit

B17 intentionally makes **zero production runtime changes**.

No files under the runtime implementation lanes are modified by the B17 candidate. Therefore B17 introduces no new representative identity routing, no new primitive, no battle-pipeline change, and no classifier expansion.

The implementation being recertified is the already accepted structural ACTIVATE route from TO10 combined with the accepted B13–B16 battle lineage.

## Explicit Non-Claims

B17 does not migrate or promote:

- Olga `trismegistus.loss-transform`;
- Olga soul-drag / return-silence behavior;
- broad delayed scheduling semantics;
- Gatou terminal reward;
- Tomoe defeat penalty / unpreventable semantics;
- Artoria Alter optional battle-result triggers;
- Artoria Caster optional Luck-on-win triggers;
- TO15 Modifier/Power runtime;
- TO16 Special subsystem runtime;
- any A-owned raw coverage KPI/classifier/taxonomy change.

## Reviewer Handoff

A fresh `P3-R11` reviewer must start from the exact frozen B17 candidate SHA and independently verify that this evidence-only recertification is sufficient to accept the existing ACTIVATE route as one more TO14 direct consumer on the current B13–B16 lineage.

Only R11 acceptance permits A03 to advance the scoped TO14 direct-consumer overlay from `4/13` to `5/13`.
