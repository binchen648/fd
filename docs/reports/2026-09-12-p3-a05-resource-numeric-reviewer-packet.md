# P3-A05 Resource Numeric Reviewer Packet

- Document Role: REVIEWER_PACKET
- Owner: Codex A
- Source Task: `P3-A05`
- Mechanic: `RESOURCE_NUMERIC_CORE_DIRECT_ACTION`
- Claimed Acceptance: `AUTOMATION_BASELINE_CANDIDATE`
- Promotion Verdict: `READY_FOR_INDEPENDENT_REVIEW`
- Promotion Notice: this packet does not promote Gate A/B/C, Phase 3, or Release status.

## Objective

Package the existing direct-action Resource Numeric implementation for independent review, reconcile its semantic consumers with the current burn-down baseline, and preserve the boundary between direct resource actions and trigger/battle/interaction/movement/lifecycle hybrids.

This task changes evidence only. It does not implement or repair resource runtime behavior.

## Inventory

Fresh command:

```text
node docs/audits/fd-resource-numeric-core-direct-action-inventory.mjs
```

Fresh result:

```text
sourceFiles=14
resourceNumericAbilities=17
eligible=3
migrated=3
blocked=8
special=6
skipped=14
```

Exact eligible consumers:

| Archive | Card | Ability | Primitives |
|---|---|---|---|
| `master.gatou` | `master.gatou.command-spell` | `command-spell.gain-mana` | `adjust_mana`, `adjust_command_seals` |
| `master.olga-marie` | `master.olga-marie.command-spell` | `command-spell.gain-mana` | `adjust_mana`, `adjust_command_seals` |
| `servant.tomoe` | `servant.tomoe.skill.sc-tomoe-1` | `sc-tomoe-1.independent-action` | `adjust_victory_points` |

All 14 skipped consumers retain explicit inventory reasons. They require at least one excluded contract: trigger, battle result, interaction, movement, result binding, lifecycle, or special subsystem behavior. They cannot inherit this slice's Gate C evidence.

## Burn-down

Resource Numeric direct-action local accounting:

```text
legacyResourceConsumerCount: 3 -> 0
newRuntimeSemanticRoutedCount: 0 -> 3
dualCompatibleCount.after: 0
remainingSkippedCount.after: 14
```

Current global coverage baseline:

```text
newRuntimeSemanticRouted=12
legacyResolveEffect=49
legacyExecuteAbility=3
dualRuntime=0
notClassifiable=28
```

The three Resource Numeric direct actions are included in the global 12 new-runtime consumers. No skipped Resource Numeric shape is counted as migrated.

## Gate A And B Evidence

Fresh command:

```text
npx vitest run packages/rules/tests/regression/resolution-dataflow.test.ts packages/rules/tests/regression/resource-numeric-core-direct-action.test.ts packages/rules/tests/executable-card-pack.test.ts
```

Fresh result: `PASS`, 3 files / 37 tests.

Evidence locations:

- `packages/rules/tests/regression/resolution-dataflow.test.ts`: typed resource primitives, expression validation, underflow/clamp behavior, rollback, result fields, and event envelope component evidence.
- `packages/rules/tests/regression/resource-numeric-core-direct-action.test.ts`: canonical command spell and Tomoe MatchSession dispatch, semantic-form routing, resource envelope, corrupted-definition fail-closed evidence.
- `packages/rules/tests/executable-card-pack.test.ts`: compiler fail-closed evidence for executable ability definitions.

These are implementer/component/scenario evidence for independent R review. A05 does not convert them into Gate A or Gate B promotion.

## Runtime Semantic Gap Follow-up

Code: `RUNTIME_SEMANTIC_GAP:RESOURCE_GATE_C_COMMAND_NO_STATE_MUTATION`

Codex B supplied fix candidate `c2eafe0` on `codex/b-resource-gatec-command-fix`. The root cause was an older socket close callback marking a client disconnected even when that client already owned a newer open socket. The fix only disconnects the client when no open socket remains.

Original A05 command on the A branch:

```text
npx playwright test -c playwright.config.ts fd-command-spell-resource-core --project=chromium
```

Original result: `FAIL`, 1 failed.

Observed behavior:

```text
Browser opened the restored action-phase room.
Initial projected mana=8 and commandSpells=3.
Browser clicked command-spell.gain-mana.
Expected projected mana=12.
Actual projected mana remained 8 until the 10-second poll timed out.
```

Codex A then independently reran evidence on B fix commit `c2eafe0`:

```text
npx vitest run apps/server/src/match-server.test.ts
NOT EXECUTED: root Vitest config excludes apps/server; replaced by workspace command below.

npm test --workspace apps/server
PASS: 1 file / 3 tests

npx vitest run packages/rules/tests/regression/resolution-dataflow.test.ts packages/rules/tests/regression/resource-numeric-core-direct-action.test.ts packages/rules/tests/executable-card-pack.test.ts
PASS: 3 files / 37 tests

npx playwright test -c playwright.config.ts fd-command-spell-resource-core --project=chromium --repeat-each=5
PASS: 5/5
```

The fix candidate closes the observed runtime gap under A's fresh verification. Independent R review is still required before the gap is accepted as closed or Gate C is promoted. Codex A did not merge or modify B runtime, protocol, E2E behavior, or authoring data.

## Gate C Evidence Boundary

The existing spec starts from `restoreActionPhaseCommandSpellRoom`; it does not establish browser-driven room creation, seat selection, match start, or phase progression. Even after its runtime failure is corrected, its scoped claim is:

```text
restore action-phase fixture
-> browser ability activation
-> WS command with expectedRevision
-> server revalidation and resource mutation
-> projection
-> reconnect
-> stale replay rejection
```

It must not be described as a browser create/select/start flow. The 2026-09-09 implementation report currently overstates that setup path and is not sufficient for promotion without correction and a fresh passing run.

## Reviewer Decision Input

- Gate A: implementation evidence present; independent R judgment required.
- Gate B: implementation evidence present; independent R judgment required.
- Gate C: B fix candidate has fresh A evidence (`5/5 PASS`), but remains unpromoted pending independent R review.
- Resource Numeric family: only the three exact direct-action consumers are in scope.
- Global Phase 3 and Release Gate: not claimed.

## Known Legacy Boundaries

- Fourteen Resource Numeric consumers remain skipped.
- Global `legacyResolveEffect=49` and `legacyExecuteAbility=3` remain explicit.
- Trigger, battle result, interaction, movement, result binding, lifecycle, modifier/power, pending payment, and special subsystem contracts do not inherit this evidence.

## Machine-Readable Evidence

Companion artifact:

```text
artifacts/phase3-a05-resource-numeric-reviewer-packet.json
```
