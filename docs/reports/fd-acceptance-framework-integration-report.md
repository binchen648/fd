# FD Acceptance Framework Integration Report

- Date: 2026-09-07
- Project: `D:\fd`
- Role: Rules Conformance Integration Engineer
- Scope: acceptance governance integration plus the first component-level Battle Winner conformance slice.

## Files Inspected

- `docs/plans/fd-rules-conformance-and-acceptance.md`
- `docs/rules/FD-Game-Rules-Final.md`
- `docs/rules/fd-rules-conformance-and-acceptance.md`
- `docs/audits/fd-card-runtime-architecture-audit.md`
- `docs/spec/engine-capability-matrix.md`
- `docs/spec/fd-playtest-v1-content-index.md`
- `docs/product/FD本地化游戏PRD.md`
- `docs/reports/2026-09-07-effect-result-binding-design-result.md`
- `packages/rules/src/match-session.ts`
- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/src/ability/executable-card-pack.ts`
- `packages/rules/src/core/*`
- `packages/rules/src/projection/player-match-view.ts`
- `packages/rules/src/match-room.ts`
- `packages/rules/src/match-room-hub.ts`
- `apps/server/src/match-server.ts`
- representative rules/content/client/server/e2e tests

Missing expected files:

- `docs/audits/fd-flow-runtime-inventory.md`
- `docs/plans/fd-effect-result-binding-plan.md`
- historical body of `docs/plans/fd-card-engine-stabilization-plan.md`
- `README.md`
- `CONTRIBUTING.md`
- `AGENTS.md`

Git state:

- `D:\fd` is not a Git repository; `git status --short --branch` fails with `fatal: not a git repository`.

## Generated / Updated Files

- `docs/audits/fd-rule-conformance-matrix.md`
- `docs/audits/fd-rule-interaction-matrix.md`
- `docs/plans/fd-golden-card-and-flow-acceptance-plan.md`
- `docs/plans/fd-card-engine-stabilization-plan.md`
- `docs/reports/fd-acceptance-framework-integration-report.md`
- `packages/rules/src/schema/game.ts`
- `packages/rules/src/core/combat-resolver.ts`
- `packages/rules/src/core/scoring-resolver.ts`
- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/tools/replay.ts`
- `apps/client/src/types/props.ts`
- `apps/client/src/state/engine-bridge.ts`
- `apps/client/src/state/seven-authoring-smoke-fixture.ts`
- targeted rules/client tests for tied battle winners

## Executive Answers

### 1. Is the new Acceptance Baseline integrated?

Yes, as a project governance baseline. The integration now establishes:

- Canonical Rules = `docs/rules/FD-Game-Rules-Final.md`
- Acceptance Baseline = `docs/plans/fd-rules-conformance-and-acceptance.md`
- Stabilization migration reference = `docs/plans/fd-card-engine-stabilization-plan.md`
- Rule Matrix = `docs/audits/fd-rule-conformance-matrix.md`
- Rule Interaction Matrix = `docs/audits/fd-rule-interaction-matrix.md`
- Golden Card/Flow contracts = `docs/plans/fd-golden-card-and-flow-acceptance-plan.md`

The baseline is not copied into Canonical Rules. The duplicate `docs/rules/fd-rules-conformance-and-acceptance.md` is a governance conflict because `docs/rules` should contain rule truth, not proof process.

### 2. Which old completion states conflict?

Conflicting when used as final acceptance:

- `FULL`
- `DONE`
- `COMPLETE`
- `SUPPORTED`
- `AUTOMATIC`
- `automatic`
- `supported`
- report-local `PASS`
- `Production Ready`
- `exact / manual-blocking / unsupported` from older audit recommendations

Allowed only as non-final metadata:

- display metadata
- legacy content capability metadata
- runtime capability claim
- host adjudication state

Formal acceptance status is limited to:

`DEFINED`, `IMPLEMENTED_UNVERIFIED`, `COMPONENT_VERIFIED`, `SCENARIO_VERIFIED`, `E2E_VERIFIED`, `FAILED`, `BLOCKED`, `NOT_VERIFIED`.

Implementers may only declare `IMPLEMENTATION_COMPLETE_CANDIDATE`.

### 3. Current Core Rule Status Counts

Based on `docs/audits/fd-rule-conformance-matrix.md`:

- Coverage: 19 / 63
- Matrix-covered: 19
- Not yet mapped: 44

| Status | Count |
|---|---:|
| `E2E_VERIFIED` | 0 |
| `SCENARIO_VERIFIED` | 0 |
| `COMPONENT_VERIFIED` | 15 |
| `IMPLEMENTED_UNVERIFIED` | 4 |
| `FAILED` | 0 |
| `BLOCKED` | 0 |
| `NOT_VERIFIED` | 44 |

No core rule is promoted to `SCENARIO_VERIFIED` or `E2E_VERIFIED` by this integration pass. Existing scenario-style tests are mapped as evidence, but the new Rule ID Gate B contracts did not exist before this pass. `FD-BATTLE-001-CANDIDATE` moved from `FAILED` to `COMPONENT_VERIFIED` after the runtime result shape and consumers were changed to preserve `winnerPlayerIds`; it still requires Golden Flow Gate B/C evidence before higher promotion.

### 4. Largest 10 Evidence Gaps

1. Forty-four canonical candidate rule units are not yet mapped and therefore count as `NOT_VERIFIED`.
2. Battle winner and VP tied-winner semantics have Gate A/component proof only; no Golden Flow Gate B/C.
3. Multiple runtime owners remain for flow, movement, play, cleanup, projection.
4. Production abilities still use the legacy interpreter path rather than Phase 3A `executeResolution`.
5. Golden Flow 1 complete action phase has no formal contract test.
6. Reconnect during pending payment/target/response is not verified.
7. Hidden passive reveal is not verified end to end.
8. Round cleanup order is not proven with residual, temporary, once-per-game, face-down, and defeat status together.
9. Modifier lifecycle is split across `ongoingEffects`, `modeState`, and card-level `powerModifiers`.
10. Current browser tests prove UI/transport fragments, not canonical rule completion.

### 5. Which tests were previously overestimated?

| Test / Gate | Overestimated Claim | Correct Interpretation |
|---|---|---|
| `npm run verify:stabilization` | Release Ready | Regression aggregate only; no Rule ID coverage guarantee. |
| `content:validate` | Cards are playable | Content shape/source checks only. |
| `verify:playtest-v1` | No private leaks overall | Pack/fixture privacy checks only; not all runtime projections. |
| `complex-skills-regression.test.ts` | Golden Cards are complete | Gate B fragments; no real browser or reconnect proof. |
| `resolution-dataflow.test.ts` | Result Binding production-ready | Gate A synthetic infrastructure only. |
| Playwright clickflow | Flow is E2E verified | UI can click selected widgets; not full canonical flow. |
| Websocket server test | Reconnect verified | Viewer reconnect after room start only; no active pending decision restore. |
| Client component tests | Runtime projection complete | Client rendering tests; server correctness still separate. |

### 6. Multiple Runtime Owners

Rules with `MULTIPLE_RUNTIME_OWNERS`:

- Global Flow
- Player Order
- Normal Move
- Normal Play Batch
- Residual / Lifecycle
- Power Layers
- VP / Scoring
- Round Cleanup
- Hidden Information
- Projection

These are not automatically bugs, but each must have one authoritative owner and any helper/legacy path must be documented as subordinate or removed from release paths.

### 7. Secondary / Legacy Bypass

Known bypass risks:

- `core/game-loop.ts` seeded runner can execute flow separate from formal `MatchSession`.
- `core/card-play.ts` exists alongside `ability/interpreter.ts::playBatch`.
- `core/movement.ts` exists alongside ability interpreter movement helpers.
- `projection/player-match-view.ts`, `ability/interpreter.ts::projectAbilityState`, and `MatchSession.projectToClientState` are separate projection paths.
- `apps/client/src/state/playtest-fixture-loader.ts` and client fixtures can render non-production flows.
- `packages/rules/src/tools/content-bridge.ts` loads `ContentLibraryIndex` without formal ability runtime.
- `ability/extended-effects.ts` contains a large compatibility switch and ad hoc state writes.
- `ability/interpreter.ts` production path still uses void mutation resolution.
- `legacy-v0` play classifier rollback remains executable.
- `docs/rules/fd-rules-conformance-and-acceptance.md` duplicates the acceptance baseline under the rules directory.

### 8. Golden Card Candidates

Defined in `docs/plans/fd-golden-card-and-flow-acceptance-plan.md`:

- Synthetic Phase 3A chain, then first real result-binding Golden Card.
- Artoria Caster `选王剑`.
- Artoria Caster `选定之杖`.
- Tomoe `鬼种之魔` / `真言·圣观世音菩萨`.
- Achilles `勇者的不凋花`.
- Drake `骑乘` and Artoria Alter `黑化诅咒`.

### 9. Golden Flows

Defined in `docs/plans/fd-golden-card-and-flow-acceptance-plan.md`:

1. Complete Action Phase.
2. Combat + Power + Winner + VP.
3. Round End + Cleanup + Lifecycle.
4. Reconnect during active flow.
5. Optional Trigger / Interaction chain.

### 10. Next Minimal Implementation Slice

The next slice should finish Golden Flow 2 as the first complete Gate A -> Gate B -> Gate C demonstration, building on the Battle Winner component fix rather than starting a broad runtime rewrite:

1. Promote the current tied-winner component tests into a named Gate A contract.
2. Add Gate B scenario for tied winners, defeated highest-power participant exclusion, competition VP ceil split, personal reward separation, and after-win trigger dispatch.
3. Add replay/event-trace assertions for `winnerPlayerIds`, `tied`, `excludedPlayerIds`, VP sources, and scoring consumption.
4. Add one Gate C browser path that reaches combat/scoring through server-supplied actions and projection.
5. Add reconnect during the same combat/scoring flow before any `E2E_VERIFIED` promotion.

Do not start full roster migration or Phase 3 full primitive conversion until this first flow contract is green and independently reviewed.

## Verification Run

- `npm run typecheck`: passed.
- `npx vitest run packages/rules/tests/core/combat-resolver.test.ts packages/rules/tests/core/scoring-resolver.test.ts packages/rules/tests/core/game-loop-battle-cleanup.test.ts packages/rules/tests/regression/replay.test.ts packages/rules/tests/regression/complex-skills-regression.test.ts packages/rules/tests/match-session.test.ts packages/rules/src/__tests__/match-session-regressions.test.ts`: passed, 7 files / 110 tests.
- `npm run test:client`: passed, 7 files / 47 tests.
- `npm run verify:stabilization`: passed all gates; root tests 88 files / 517 tests, complex-skill regressions 37 tests, client tests 7 files / 48 tests, Playwright Chromium 4 tests.

## Final Integration Result

Status: `IMPLEMENTED_UNVERIFIED`

The framework is now connected at the documentation and evidence-mapping level. Battle Winner has component-level runtime evidence for multi-winner result shape and consumers. This is not a Release Ready claim, and no core rule has been promoted to `E2E_VERIFIED`.
