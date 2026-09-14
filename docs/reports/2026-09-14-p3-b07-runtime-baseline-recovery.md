# P3-B07 Runtime Baseline Recovery r1

- Document Role: RUNTIME_RECOVERY_IMPLEMENTATION
- Owner: Codex B recovery lane
- Task: `P3-B07`
- Branch: `codex/b-p3-b07-recovery-r1`
- BaseCommit: `bcc5d73e6064d750cc6b16e66ebb3dca00b69518`
- Prior recovered candidate: `7981f5b9cdea6cdcf59168b599576740c4ddc6e6` (`REJECTED` by independent review `bf815157ed9a6298761f6beecae3927d2ed52164`)
- Historical accepted B07 object: unavailable in the current local/remote Git object graph
- MechanicFamily: `CARD_ACTION_SEMANTICS_MINIMAL:ACTIVATE`
- Representative: Olga-Marie `astronomical-science.first-loss`
- Status: `IMPLEMENTATION_COMPLETE_CANDIDATE_R1`
- GateClaim: `NONE`

## Recovery Boundary

This r1 repairs the rejected B07 recovery candidate. It does **not** claim to be the lost historical accepted B07 object and does not inherit any prior acceptance. A fresh independent reviewer must review the exact r1 commit before it may be promoted.

The repair remains scoped to the semantic ACTIVATE route and its production trigger path. It does not introduce broad Trigger, Lifecycle, Interaction, battle-result, hidden-information, or roster migration behavior.

## r1 Findings Closed

Independent review of `7981f5b` found three blocking problems: production first-loss was not sourced from authoritative battle history, duplicate activation targets did not fail closed, and the submitted evidence did not reproduce the required production Gate C path. r1 closes those problems and hardens adjacent legality boundaries:

1. `MatchSession` now emits the first-loss trigger from authoritative resolved battle history. The event carries server-owned `battlefieldId` and `lossOrdinal = 1`; malformed or forged first-loss events fail closed.
2. `activate_card_by_id` now requires exactly one owned target definition. Zero targets, duplicate targets, wrong controller, wrong zone, and already-active state fail closed transactionally.
3. Olga's activation-only target `master.olga-marie.skill.trismegistus-grief` is no longer classified as a deferred-created card. The compiler places the unique runtime instance in `skill`, which matches the ACTIVATE contract.
4. Cards that are targets of `activate_card_by_id` cannot be normally PLAYed from skill before the trigger; normal-play legality returns `activation_only`.
5. The real browser/server Gate C path is covered by `e2e/fd-olga-activate-card-action.spec.ts`: a restored real MatchSession state resolves a battle, derives Olga's first loss from server battle history, consumes the delayed activation at formal round end, projects the activated card, survives reconnect, and rejects replay of the stale command revision.

## Runtime Contract

The executable route is selected only by semantic shape:

- `kind = forced_trigger`
- trigger `after_controller_first_loses_battle`
- no conditions, targets, costs, or creates
- exactly one `activate_card_by_id(definitionId)` effect

No card id or ability id participates in route eligibility.

On the first authoritative battle loss, runtime stages a delayed activation. The formal `round_end` hook consumes that record. The target must be unique, owned and controlled by the triggering player, remain in `skill`, and not already be active. Success moves it to `field`, makes it active and public, emits `card_activated`, and returns typed `activatedCount = 1` evidence.

`processAbilityEvent` and `advanceAbilityPhase` retain clone/commit transaction behavior, so failures do not partially commit revision, events, target movement, or delayed-activation queue mutation.

## Modified Files

- `data/generated/fd-playtest-v1.content-library.json`
- `packages/rules/src/ability/types.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/src/ability/executable-card-pack.ts`
- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/match-session.ts`
- `packages/rules/tests/regression/card-action-activate.test.ts`
- `packages/rules/tests/regression/complex-skills-regression.test.ts`
- `e2e/fd-olga-activate-card-action.spec.ts`
- this recovery report

## Focused Verification

```text
npx vitest run \
  packages/rules/tests/regression/card-action-activate.test.ts \
  packages/rules/tests/regression/complex-skills-regression.test.ts \
  packages/rules/tests/regression/resolution-dataflow.test.ts \
  packages/rules/tests/regression/card-action-add-to-attack.test.ts \
  packages/rules/tests/regression/card-zone-core-direct-action.test.ts
PASS: 5 files / 72 tests

npm run typecheck
PASS

npm run e2e:fd-remote -- e2e/fd-olga-activate-card-action.spec.ts
PASS: 1 / 1
```

The Olga Playwright test passed three times during r1 verification, including the final packaging run. Focused unit/regression coverage additionally proves authoritative event identity requirements, duplicate-definition fail-closed behavior, controller tamper rejection, activation-only normal-play rejection, formal round-end activation, transactional failure, and preservation of preceding Card Zone / Add-to-Attack slices.

## Full Rules Baseline

Current r1 checkout:

```text
npx vitest run packages/rules/tests
40 passed files / 9 failed files
340 passed tests / 19 failed tests
```

The 19 failures are inherited baseline/environment failures, not new B07 behavioral regressions:

- 18 failures require historical CHM/image evidence paths that are absent in this environment (`D:\fd\chm-extract` or local `chm-extract`).
- 1 failure is `golden-card-content-pipeline.test.ts`, where freshly compiled source presentation hashes to `4c85668f43e2470b68805bf340d5e67faf506c457734f7cf4be565105be08141` while the checked-in generated content library remains self-consistent at `f4aeaddb88f3018efed31ca74a8a0c91a614c9a61752237952285b017de4d192`.

Changing only the checked-in definition hash to the fresh-source hash was explicitly tested and rejected because it makes `assertExecutableCardPack` fail: the checked-in generated presentation has historical drift from source presentation. Broad content regeneration is therefore not performed inside B07 r1.

The generated artifact change retained in r1 is narrowly scoped to the executable ACTIVATE requirement: Olga's Trismegistus target is materialized in `skill`, with the generated artifact's own self-consistent definition hash updated accordingly.

## Review Boundary

`7981f5b` remains rejected. This r1 must receive a new independent review from a fresh reviewer worktree against the exact committed candidate. Passing implementer tests is necessary evidence but does not promote B07 by itself.

If the fresh reviewer accepts r1, the accepted reviewer commit becomes the evidence boundary for downstream recovery work. No claim about restoration of B08/B10 or later Phase 3 migration is made by this report.
