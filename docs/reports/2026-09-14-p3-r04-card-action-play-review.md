# P3-R04 Review — CARD_ACTION_SEMANTICS_MINIMAL_PLAY

- Document Role: INDEPENDENT_REVIEW
- Reviewer: Codex R
- Task: `P3-R04`
- Target Commit: `628238a696d9adfdbfb3a3c404871a8405a6ff8d`
- Mechanic Family: `CARD_ACTION_SEMANTICS_MINIMAL_PLAY`
- Review Branch: `codex/r-p3-r04-card-action-play-review`
- Final Status: `IMPLEMENTATION_NEEDS_REVISION`

## Findings

### [P2] B04 candidate mixes Codex B runtime work with A-owned coverage/evidence state

The scoped Time Alter runtime is behaviorally conformant in fresh review, but the exact B04 candidate cannot be accepted as a clean B-task unit because the same commit modifies A-owned coverage/evidence/planning files outside the B04 runtime/test/report boundary:

- `artifacts/phase3-skill-coverage.json`
- `docs/audits/fd-rule-conformance-matrix.md`
- `docs/audits/fd-skill-mechanic-family-matrix.md`
- `docs/audits/fd-skill-primitive-conformance-matrix.md`
- `docs/plans/fd-card-engine-stabilization-plan.md`

The coverage artifact is regenerated to change semantic-route output and compiled-content metadata. The matrices and stabilization plan are updated to change current evidence status for the PLAY slice. These are A-owned coverage/evidence synchronization concerns under the Phase 3 role split, while B04 is the mechanic-runtime task.

This is a packaging/ownership blocker, not a demonstrated Time Alter semantic defect. The repair is to repack the B04 candidate so the B task contains only the scoped runtime, focused tests/E2E evidence, and scoped implementation reports. A-owned coverage/matrix/plan synchronization must remain a separate A task/PR.

## Rule Conformance Judgment

**PASS for the scoped Time Alter behavior.**

Canonical authoring says:

```text
行动阶段：暗置打出一张牌，然后抽一张牌。
```

The reviewed executable shape requires:

- `phase_action` in action phase / controller action window;
- one controller-owned hand target;
- target constrained to an attack;
- exactly one selected card;
- `play_selected_cards(..., face_down)`;
- then `draw_cards(1)`;
- no cost and no create effects.

Fresh production-path tests confirm the selected hand attack moves to `attack_area`, remains owner-only / face-down and inactive, and one deck card is drawn to hand.

## Semantic Routing Judgment

**PASS.**

Runtime source inspection found no `master.kiritsugu`, `time-alter`, card-id, or ability-id equality route in the B04 classifier. A renamed synthetic ability with the exact semantic form classifies successfully.

Negative coverage rejects wrong phase, added cost, missing draw companion, face-up play, wrong zone, non-attack target, play-source, and unrelated add-to-attack shape.

Fresh inventory:

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

Exactly Time Alter is eligible. Kayneth response play, Maiya add-to-attack/append-only, Olga activation, Artoria Alter close, and Drake non-exact hidden/private play remain outside this contract.

## Secondary Runtime Path Audit

**PASS for the scoped route.**

`play_selected_cards` executes through the shared server `playBatch` hook rather than a second card-play implementation. The shared path remains responsible for movement, face-down visibility, legality/counters, and card-play side effects.

Normal action-phase play and unrelated card-action families are not promoted by this slice.

## Legacy Fallback Audit

**PASS.**

The exact semantic route enters typed data-flow execution before the legacy effect loop. A structural PLAY near-match that fails the supported semantic contract is rejected as `resolution_failed` rather than retrying through legacy `resolveEffect`.

Fresh corrupted-graph regression confirms:

- activation returns `resolution_failed`;
- no pending decision remains;
- selected attack stays in hand;
- draw source stays in deck;
- event count is unchanged.

## Independent Verification

### Typecheck

```text
npm.cmd run typecheck
PASS
```

### Inventory

```text
node docs/audits/fd-card-action-play-inventory.mjs
PASS: eligible=1, skipped=6
```

### Focused Gate A/B tests

```text
npx.cmd vitest run \
  packages/rules/tests/regression/card-action-play.test.ts \
  packages/rules/tests/regression/attack-play-classifier-regression.test.ts \
  packages/rules/tests/executable-card-pack.test.ts \
  packages/rules/tests/regression/resolution-dataflow.test.ts

PASS: 4 files / 54 tests
```

### Gate C browser / WebSocket

```text
npx.cmd playwright test -c playwright.config.ts \
  e2e/fd-time-alter-core-primitive.spec.ts \
  --project=chromium

PASS: 1 / 1
```

Independent browser evidence proves the scoped restored-state production path:

- real projected Time Alter activation;
- activation command carries `expectedRevision`;
- server-owned pending hand-attack target;
- reconnect while the target is pending;
- target command carries the pending revision;
- selected attack projects face-down in `attack_area`;
- draw result projects to hand;
- reconnect preserves the settled state;
- stale target replay is rejected without duplicate mutation.

The restored snapshot is only deterministic setup; the ability activation and target command still execute through the production room/server/MatchSession path.

### Broader test context

```text
npm.cmd run test:ci
480 / 485 passed
5 failed
```

The five failures are outside the B04 slice:

- missing local CHM/reviewed image files;
- playtest pack reports the same missing-image set;
- generated-content definition hash mismatch;
- two historical tests require `D:\fd\data\manifests\sample-cards.json`.

No B04 focused/runtime/E2E test failed. These broad-suite failures are not used as positive acceptance evidence.

## Gate Judgment

### Gate A — Component / compiler / fail-closed

**PASS EVIDENCE.**

### Gate B — Real Time Alter MatchSession scenario

**PASS EVIDENCE.**

### Gate C — Scoped Time Alter browser/server/reconnect/stale path

**PASS EVIDENCE.**

These evidence judgments do not override the task-level packaging/ownership blocker.

## Required Repair

Create a replacement B04 candidate from the same runtime base containing only the B04-owned slice:

- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/executable-card-pack.ts`
- focused Time Alter tests (including the scoped browser E2E as mechanic evidence)
- scoped B04/Time Alter implementation reports

Do not include the A-owned coverage artifact, conformance matrices, or stabilization-plan synchronization in the replacement B04 commit.

No runtime semantic change is requested unless repacking exposes a new failure.

## Final Judgment

`IMPLEMENTATION_NEEDS_REVISION`

The Time Alter implementation itself passes independent Gate A/B/C evidence. The candidate must be repacked to restore Phase 3 role ownership before R04 can accept it as the B04 task output.
