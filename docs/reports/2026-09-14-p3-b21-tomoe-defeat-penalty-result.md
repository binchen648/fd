# P3-B21 Tomoe Unpreventable Defeat Penalty Result

- Date: 2026-09-14
- Owner: Codex B
- Task: `P3-B21`
- Branch: `codex/b-p3-b21-tomoe-defeat-penalty-r1`
- Base / A-owned handoff: `29f7263b76884c73697936605cd11d4846dd2509`
- Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`

## Scope

B21 migrates exactly the structural forced battle-loss VP penalty family represented by Tomoe `sc-tomoe-1.penalty-on-defeat`: `after_controller_loses_battle` -> controller VP `-5`, with exactly one explicit `ignore effect_prevention` modifier scoped to `this_effect` at `explicit_exception` priority.

Production routing is structural. It does not inspect representative character, card, ability, or modifier identity. Renamed ability and modifier IDs still classify when the semantic shape is unchanged.

## Runtime implementation

`packages/rules/src/ability/interpreter.ts` now exports `isBattleLossUnpreventableVpTriggerSemantic()` and routes only the exact supported family through a narrow path that bypasses ordinary effect prevention for this one explicitly unpreventable effect.

The route preserves the accepted ordinary battle-loss trigger lineage and post-scoring barrier, executes the typed VP adjustment, and marks the resulting `victory_points_adjusted` causation as `unpreventable=true`.

Malformed same-family candidates fail closed before legacy fallback with `Unsupported unpreventable battle-loss VP semantic shape`.

## Focused proof

Fresh focused/current-lineage run:

```text
12 test files / 109 tests PASS
```

Coverage includes B13-B20 accepted battle-result consumers, B21, complex-skill compatibility, and resolution-dataflow regressions.

B21 proves:

- renamed ability/modifier IDs classify structurally;
- wrong amount/player/priority or extra prevention modifier does not classify;
- unrelated battle results and controller victories do not trigger;
- authoritative controller loss settles only after the phase-wide post-scoring barrier;
- ordinary `preventEffects` cannot block this explicitly unpreventable effect;
- typed `victory_points_adjusted` evidence records controller/resource/actual delta/before/after plus `unpreventable=true`;
- VP floors at zero and reports the actual delta;
- stable result replay cannot deduct twice;
- malformed same-family prevention shape rejects atomically without legacy fallback.

## Gate C

Fresh Chromium B13-B21 compatibility:

```text
9 / 9 PASS
```

The B21 browser proof covers production post-scoring settlement, reconnect persistence, stale-revision rejection, and exactly-once VP loss.

The first exact-candidate compatibility run exposed an inherited B18 reconnect/click race: B18 passed alone but twice failed in the ordered suite because the post-reload click did not emit a dispatch command. B21 therefore includes a test-only B18 reconnect/send-confirmation hardening change; production semantics are unchanged. Final exact-candidate Chromium validation must be green from a clean worktree.

## Full-root baseline

Fresh root Vitest result:

```text
Test files: 106 PASS / 10 FAIL / 116 total
Tests:      693 PASS / 20 FAIL / 713 total
```

All 20 failures are the inherited CHM/original-image evidence absence class. Relative to accepted B20 (`687 PASS / 20 inherited FAIL / 707 total`), B21 adds `+6 PASS / +0 new deterministic failures`.

## Production diff audit

- production runtime change is limited to `packages/rules/src/ability/interpreter.ts`;
- no Tomoe/card/ability/modifier identity is used for routing;
- no A-owned coverage KPI/taxonomy change;
- no broad TO14, TO15 Modifier/Power, TO16, Gatou, or Olga loss-transform promotion;
- `git diff --check`: PASS before candidate freeze.

## Preserved pre-existing local change

The B21 author worktree already contained an unrelated unstaged reconnect-hardening edit in `e2e/fd-artoria-caster-luck-on-win.spec.ts`. It is intentionally preserved but excluded from the B21 candidate commit; B21 candidate validation must be rerun from the exact frozen candidate SHA in a clean worktree.

## R15 handoff

P3-R15 must start in a fresh reviewer worktree at the exact frozen B21 candidate SHA. Reviewer must not implement fixes and must independently verify structural identity independence, explicit prevention-exception scope, participant/post-scoring provenance, typed Resource/floor/fail-closed/exactly-once behavior, Chromium Gate C, and the inherited full-root baseline.
