# P3-B19 Noble Bloom Extra-VP Runtime Result

- Date: 2026-09-14
- Owner: Codex B
- Task: `P3-B19`
- Branch: `codex/b-p3-b19-noble-bloom-extra-vp-r1`
- Base / A-owned handoff: `593f1619b372081ab969dfb767230e115acc5429`
- Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`

## Scope

B19 migrates exactly the structural semantic represented by `sc-artoria-alt-3.noble-bloom-extra-vp`:

- `optional_trigger`;
- combat phase;
- trigger/response window `after_battle_result_determined`;
- exactly two conditions: `controller_played_highest_cost_noble_phantasm_in_battle_this_round` and `highest_cost_noble_phantasm_cost_at_least(value=4)`;
- exactly one controller `adjust_victory_points(+1)` effect;
- no targets, costs, creates, rule modifiers, lifecycle state, or limit state.

Production routing remains structural and identity-free.

## Runtime implementation

`packages/rules/src/ability/interpreter.ts` promotes the pre-existing exact extra-VP structural recognizer into the typed resolution path. The accepted B18 participant guard is extended to the exact B19 shape, so production result events carrying `battleParticipantIds` cannot offer either Noble Bloom response to a controller outside that battlefield.

No `resolution-dataflow.ts` change is required. B19 uses the already accepted typed `adjust_victory_points` Resource primitive.

After exact B18 and B19 shapes route typed, malformed same-family optional post-result VP candidates reject with `resolution_failed: Unsupported optional battle-result VP semantic shape` instead of falling through to legacy effect execution.

## Independent two-response semantics

B19 preserves the source text as two distinct optional responses rather than one merged +2 operation:

```text
cost >= 4:
  base Noble Bloom response -> optional +1 VP
  extra Noble Bloom response -> optional +1 VP
  accepting both -> total +2 VP
```

The second response is absent below threshold. Accepting or declining one response does not synthesize, erase, or merge the other response's settlement.

## Gate A / B evidence

Fresh typecheck: PASS.

Fresh focused/current-lineage compatibility:

```text
9 test files / 93 tests PASS
```

The focused B19 regression proves:

- exact structural classifier remains true after ability-ID rename;
- threshold !=4, amount !=1, extra condition, and wrong trigger are not exact B19 semantics;
- cost 4 exposes base and extra responses independently and each typed accept applies exactly +1;
- accepting both produces exactly +2 total, with one typed `victory_points_adjusted` event per ability;
- declining B19 leaves the already accepted B18 +1 intact and emits no B19 VP event;
- cost 3 preserves valid B18 behavior but exposes no B19 response;
- unrelated battlefield participants expose neither response for the non-participant controller;
- malformed same-family threshold rejects atomically before legacy fallback;
- stable result replay does not reopen either settled response.

The historical complex-skills regression for the two sequential Noble Bloom responses remains green.

## Gate C evidence

A fresh Chromium group covers B19 plus B13-B18 compatibility.

The first group run had one non-reproducing Achilles UI revision wait timeout; B19 itself passed. Achilles immediately passed in isolation, and the subsequent complete group was:

```text
7 / 7 PASS
```

The B19 browser test proves:

- base response is projected first;
- after base +1 settlement, the independent extra response is projected;
- reconnect while B19 is pending preserves the response and revision;
- B19 accept changes VP by exactly +1 and records exactly one typed extra-VP event;
- settled reconnect preserves total +2 and one event per response;
- stale replay of the B19 dispatch is rejected and cannot duplicate the award.

## Full root baseline

Fresh root Vitest result:

```text
Test files: 103 PASS / 10 FAIL / 113 total
Tests:      677 PASS / 20 FAIL / 697 total
```

All 20 failures are the inherited CHM/original-image evidence absence class already present on the accepted B18 lineage. Relative to B18 (`672 PASS / 20 inherited FAIL / 692 total`), B19 contributes `+5 PASS / +0 new deterministic failures`.

## Production diff audit

Relative to the B19 handoff base:

- production runtime change: `packages/rules/src/ability/interpreter.ts` only;
- `packages/rules/src/ability/resolution-dataflow.ts`: unchanged;
- production diff search for `artoria`, `noble-bloom`, `sc-artoria`, or `servant.artoria`: no identity hits;
- `git diff --check`: PASS.

Test/evidence additions are:

- `packages/rules/tests/regression/battle-result-optional-extra-vp-trigger.test.ts`;
- `e2e/fd-artoria-alt-noble-bloom-extra-vp.spec.ts`;
- this implementation report.

## Explicit non-promotion

B19 does not promote:

- the already accepted B18 base response beyond compatibility;
- Artoria Caster Luck-on-win optional triggers;
- Gatou `seeker.battle-end-reward`;
- Tomoe `sc-tomoe-1.penalty-on-defeat`;
- Olga `trismegistus.loss-transform`;
- broad TO14 optional-trigger ordering;
- TO15 Modifier/Power;
- TO16 Special;
- A-owned coverage KPI/taxonomy.

## Handoff to P3-R13

Freeze the exact B19 candidate produced from this branch. A fresh R13 reviewer must start from that exact SHA, implement no fixes, and independently verify the two-response contract, typed Resource settlement, participant/order boundary, Chromium Gate C, and full-root baseline before A03 may move the scoped TO14 direct-consumer overlay from `6/13` to `7/13`.
