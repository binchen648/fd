# P3-B18 Artoria Alter Noble Bloom Runtime Result

- Date: 2026-09-14
- Owner: Codex B
- Task: `P3-B18`
- Branch: `codex/b-p3-b18-noble-bloom-r1`
- Base / A-owned handoff: `30abd25f0cfb6067638ca3b07b0a50c3cbcdea7a`
- Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`

## Scope

B18 migrates exactly the structural semantic represented by Artoria Alter `sc-artoria-alt-3.noble-bloom`:

- `optional_trigger`;
- combat phase;
- trigger and response window `after_battle_result_determined`;
- exactly one `controller_played_highest_cost_noble_phantasm_in_battle_this_round` condition;
- exactly one controller `adjust_victory_points(+1)` effect;
- no targets, costs, creates, rule modifiers, lifecycle state, or limit state.

Production routing is structural and identity-free. The sibling `sc-artoria-alt-3.noble-bloom-extra-vp` is deliberately not classified as B18 and retains its prior route; B18 does not promote it.

## Runtime implementation

`packages/rules/src/ability/interpreter.ts` adds the narrow B18 semantic classifier and routes exact matches through the existing typed `executeResolutionEffects()` Resource path. No `resolution-dataflow.ts` change was required.

The accepted response window uses the normalized authoring shape (`opens`, optional normalized `order=turn_order`, optional normalized `passBehavior=decline_this_window`). Same-family malformed shapes are rejected at resolution with `resolution_failed: Unsupported optional battle-result VP semantic shape` rather than silently falling through to the legacy effect path.

The authoritative result-event participant list is also respected: when a production `after_battle_result_determined` event carries `battleParticipantIds`, B18 cannot open for a controller who did not participate in that battlefield. Trusted historical synthetic events that omit the optional participant list remain backward compatible.

## Red -> green evidence

Initial B18 regression work exposed two missing behaviors:

1. the exact B18 semantic had no dedicated classifier/typed VP route, so the legacy path mutated VP without typed `victory_points_adjusted` evidence;
2. an adversarial two-battlefield probe showed a qualifying controller could incorrectly receive the optional response on another battlefield's result.

The final implementation closes both gaps without card/ability identity routing.

## Gate A / B evidence

Fresh B18 regression coverage proves:

- exact semantic classification remains true after renaming the ability ID;
- wrong trigger/window/phase/resource target/amount and the extra-VP sibling shape are not classified as B18;
- controller-only optional response ownership;
- no VP mutation while a response is pending;
- accept emits typed `victory_points_adjusted` evidence and applies exactly `+1`;
- decline applies `+0`;
- false qualification exposes no response;
- duplicate stable result-event replay does not reopen or re-award;
- unrelated battlefield result participants do not trigger B18;
- malformed same-family amount rejects atomically before legacy fallback;
- a production two-battlefield MatchSession reaches the post-scoring barrier only after both scoring receipts exist, with zero B18 windows at the barrier and the response opening later during result-event dispatch.

Fresh current-lineage compatibility run:

```text
7 test files / 51 tests PASS
```

Included B18 plus B13-B17 battle compatibility and typed resolution-dataflow coverage.

`npm run typecheck`: PASS.

## Gate C evidence

Fresh Chromium production-room compatibility group:

```text
6 / 6 PASS
```

The B18 browser test proves controller projection, pending-response reconnect, typed +1 settlement, settled reconnect, stale revision rejection, and no duplicate award. The same run keeps the accepted B13-B17 browser paths green.

## Full root baseline

Fresh root Vitest result:

```text
Test files: 102 PASS / 10 FAIL / 112 total
Tests:      672 PASS / 20 FAIL / 692 total
```

All 20 failures are the inherited CHM/original-image evidence absence class already present on the accepted B17 lineage. Relative to B17 (`666 PASS / 20 inherited FAIL / 686 total`), B18 contributes `+6 PASS / +0 new deterministic failures`.

## Production diff audit

Relative to the B18 handoff base:

- production runtime change: `packages/rules/src/ability/interpreter.ts` only;
- `packages/rules/src/ability/resolution-dataflow.ts`: unchanged;
- production diff search for `artoria`, `noble-bloom`, `sc-artoria`, or `servant.artoria`: no identity hits;
- `git diff --check`: PASS.

Test/evidence additions are:

- `packages/rules/tests/regression/battle-result-optional-vp-trigger.test.ts`;
- `e2e/fd-artoria-alt-noble-bloom-vp.spec.ts`;
- this implementation report.

## Explicit non-promotion

B18 does not promote or migrate:

- `sc-artoria-alt-3.noble-bloom-extra-vp`;
- Artoria Caster Luck-on-win optional triggers;
- Gatou `seeker.battle-end-reward`;
- Tomoe `sc-tomoe-1.penalty-on-defeat` or unpreventable semantics;
- Olga `trismegistus.loss-transform` or other Special behavior;
- broad optional-trigger ordering;
- TO15 Modifier/Power runtime;
- TO16 Special runtime;
- A-owned coverage KPI/classifier/taxonomy.

## Handoff to P3-R12

Freeze the exact B18 candidate commit produced from this branch. A fresh R12 reviewer must start from that exact SHA, make no implementation fixes, and independently re-run the required Gate A/B/C and full-root checks before A03 may advance the TO14 direct-consumer overlay from `5/13` to `6/13`.
