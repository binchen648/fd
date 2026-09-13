# P3-R04 Review r1 — CARD_ACTION_SEMANTICS_MINIMAL_PLAY

- Document Role: INDEPENDENT_REVIEW
- Reviewer: Codex R
- Task: `P3-R04`
- Target Commit: `56376bea590eda20d3c7d9ad359df1cabf4371d1`
- Runtime Base: `e92285586dadc3c692ff9c5d59ab535e67be8b81`
- Original Candidate: `628238a696d9adfdbfb3a3c404871a8405a6ff8d`
- Prior Review: `98aa785` / `IMPLEMENTATION_NEEDS_REVISION`
- Mechanic Family: `CARD_ACTION_SEMANTICS_MINIMAL_PLAY`
- Review Branch: `codex/r-p3-r04-card-action-play-r1-review`
- Final Status: `GATE_A_B_CANDIDATE_ACCEPTED`

## Findings

No blocking finding remains.

The prior P2 role-boundary finding is closed. The repaired B04 candidate is a clean repack from the same runtime base and contains only scoped runtime files, focused mechanic tests/E2E, and B04 implementation reports. The A-owned coverage artifact, conformance matrices, and stabilization-plan synchronization are absent from the candidate diff.

No runtime semantic change was introduced by the repair: the retained B04 implementation/test/E2E files are byte-identical to the independently reviewed original candidate content.

## Diff Boundary

Exact diff from runtime base `e922855...` to accepted candidate `56376be...`:

- `packages/rules/src/ability/executable-card-pack.ts`
- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/tests/regression/card-action-play.test.ts`
- `e2e/fd-time-alter-core-primitive.spec.ts`
- scoped B04 / Time Alter reports only.

No coverage KPI artifact, taxonomy/conformance matrix, evidence-classification rule, or broad Phase 3 plan is modified.

## Rule / Semantic Routing Judgment

**PASS.**

Time Alter is routed by executable semantic form only:

- action-phase `phase_action`;
- controller action window;
- one controller-owned hand target constrained to attacks;
- exact `play_selected_cards(face_down)` followed by `draw_cards(1)`;
- no cost and no create effects.

There is no Kiritsugu/card-id/ability-id equality route. A renamed synthetic same-shape ability classifies; wrong phase, cost, missing draw, face-up play, wrong zone, non-attack, play-source, and add-to-attack variants do not inherit the route.

Fresh inventory remains:

```text
cardActionSemanticAbilities=7
eligible=1
skipped=6
legacyPlayConsumerCount.before=1
legacyPlayConsumerCount.after=0
newRuntimeSemanticRoutedPlayCount.before=0
newRuntimeSemanticRoutedPlayCount.after=1
dualCompatiblePlayCount.before=1
dualCompatiblePlayCount.after=0
remainingSkippedCardActionCount.after=6
```

## Secondary Runtime / Legacy Fallback Judgment

**PASS.**

`play_selected_cards` uses the shared server `playBatch` hook for actual card-play legality, movement, visibility, counters, and side effects. The B04 route does not create a second card-play runtime owner.

Once the supported semantic route is selected, malformed typed execution fails as `resolution_failed`; it does not retry through legacy `resolveEffect`.

## Independent Verification

```text
npm.cmd run typecheck
PASS

node docs/audits/fd-card-action-play-inventory.mjs
PASS: eligible=1 / skipped=6

npx.cmd vitest run \
  packages/rules/tests/regression/card-action-play.test.ts \
  packages/rules/tests/regression/attack-play-classifier-regression.test.ts \
  packages/rules/tests/executable-card-pack.test.ts \
  packages/rules/tests/regression/resolution-dataflow.test.ts
PASS: 4 files / 54 tests

npx.cmd playwright test -c playwright.config.ts \
  e2e/fd-time-alter-core-primitive.spec.ts \
  --project=chromium
PASS: 1 / 1

git diff --check e922855..56376be
PASS
```

The browser path independently verifies projected activation, WebSocket revision, pending-target reconnect, server target selection, face-down attack projection, draw projection, post-resolution reconnect, and stale replay rejection.

## Gate Judgment

### Gate A

**PASS.** Compiler/semantic routing, negative shape checks, typed runtime, and fail-closed behavior are sufficient for this scoped PLAY contract.

### Gate B

**PASS.** Canonical Time Alter executes through real `MatchSession.dispatchPlayerAction`, plays one legal controller hand attack face-down through shared `playBatch`, then draws one card.

### Gate C

**PASS production evidence for the scoped Time Alter PLAY representative.** The browser/server/reconnect/stale path was independently rerun. This does not promote any other play shape or broader Phase 3 status.

## A Synchronization Input

Accepted B04-scoped transition:

```text
legacyPlayConsumerCount:             1 -> 0
newRuntimeSemanticRoutedPlayCount:   0 -> 1
dualCompatiblePlayCount:             1 -> 0
eligible / migrated / skipped:       1 / 1 / 6
```

Global coverage/KPI synchronization remains Codex A-owned.

## Residual Risks

- Kayneth response play, Maiya add-to-attack/append-only, Olga activation, Artoria Alter close, and Drake private/hidden play do not inherit B04 acceptance.
- Restored snapshot is deterministic Gate C setup only; acceptance is limited to the production activation/target/server path exercised after restore.
- Repository-wide CHM/image, generated-content hash, and historical absolute-path test failures remain separate baseline issues and are not part of this scoped acceptance.

## Final Judgment

`GATE_A_B_CANDIDATE_ACCEPTED`

Accepted B04 runtime/evidence candidate:

`56376bea590eda20d3c7d9ad359df1cabf4371d1`

The reviewer report commit is evidence only and must not be used as the runtime baseline. Codex A may consume this judgment for the authorized B04 burn-down synchronization.
