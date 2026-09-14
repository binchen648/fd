# P3-R05 Review — B07 ACTIVATE Runtime Recovery

- Document Role: `INDEPENDENT_REVIEW`
- Reviewer: Codex R
- Task: `P3-B07` under `P3-R05`
- TargetCommit: `7981f5b9cdea6cdcf59168b599576740c4ddc6e6`
- Recovery Base: `bcc5d73e6064d750cc6b16e66ebb3dca00b69518`
- MechanicFamily: `CARD_ACTION_SEMANTICS_MINIMAL:ACTIVATE`
- Representative: Olga-Marie `astronomical-science.first-loss`
- Review Branch: `codex/r-p3-b07-recovery-review`
- Final Status: `IMPLEMENTATION_NEEDS_REVISION`

## Findings

### [P1] The production battle chain never produces the first-loss trigger consumed by B07

The accepted Trigger Gateway contract requires `after_controller_first_loses_battle` to carry authoritative battle identity, controller, and first-loss/loss-ordinal facts supplied by the Battle runtime. B07 is allowed to consume that event, but the reviewed production tree must have a real producer before Gate B/C can be claimed.

The reviewed runtime has no production producer for `after_controller_first_loses_battle`. `combat-resolver.ts` emits `after_battle_result_determined`; the interpreter derives ordinary `after_controller_loses_battle`, but never derives the first-loss event. The only executable B07 tests create `after_controller_first_loses_battle` directly through the trusted backend hook.

Fresh reviewer production-chain probe:

```text
input: after_battle_result_determined
Olga included in loserIds
ordinary derived loss event processed = true
pendingDelayedActivations = []
```

Therefore a real Olga loss processed through the existing battle-result event chain does not stage the delayed activation at all. The canonical ability cannot naturally reach B07 from the production battle path.

**Required repair:** add or consume an accepted, server-owned first-loss producer that derives the first-loss fact from authoritative battle history and supplies the stable event identity required by the Trigger contract. Do not accept a client-supplied first-loss flag and do not hardcode Olga/card/ability identity. Add a production-path regression proving first loss stages exactly once and later losses do not restage it.

### [P1] Ambiguous duplicate activation targets are silently resolved by array order

The B07 handoff explicitly requires target lookup to fail closed for an ambiguous duplicate target. The reviewed `activateCardById` primitive uses `.find()` over controller-owned cards with the requested `definitionId` and therefore silently selects the first matching card.

Fresh reviewer adversarial probe created two controller-owned `master.olga-marie.skill.trismegistus-grief` instances in `skill`, staged the delayed activation, and advanced to formal `round_end`.

Observed result:

```text
threw = false
activatedIds = ["p3-tri-a"]
pendingDelayedActivations = 0
```

The runtime arbitrarily activated the first duplicate and consumed the pending activation instead of rejecting the ambiguous authoritative state.

**Required repair:** resolve the owned definition-id matches as a set and require exactly one legal authoritative target. Zero matches, multiple matches, wrong controller/owner, wrong zone, or already-active state must fail closed without consuming the staged activation or committing phase/revision/events.

### [P2] Claimed Gate C evidence is not reproducible from the recovery candidate

The surviving implementation report and mechanic matrix refer to `e2e/fd-olga-activate-card-action.spec.ts`, but the exact recovery candidate does not contain that file. Fresh `git log --all -- e2e/fd-olga-activate-card-action.spec.ts` also returns no committed history.

The recovery report correctly states that it does not inherit historical acceptance. Therefore an unavailable historical browser test cannot be used to restore Gate C acceptance for this replacement commit.

**Required repair/evidence:** add fresh committed Gate C evidence for the repaired exact candidate. Because the ability is event-driven, the E2E should prove the server-owned first-loss event path, pending delayed activation continuity, formal round-end activation, projection/reconnect, and no duplicate activation. Client stale-command evidence is not required for a trigger that has no client mutation command, but reconnect/projection evidence must be real and reproducible.

## Passing Evidence

The recovery is otherwise narrow and semantically routed without card/ability identity branches.

Fresh reviewer checks:

```text
npm.cmd run typecheck
PASS

node docs/audits/fd-card-action-activate-inventory.mjs
PASS
eligible=1
skipped=6
legacyActivateConsumerCount: 1 -> 0
newRuntimeSemanticRoutedActivateCount: 0 -> 1
dualCompatibleActivateCount: 1 -> 0

focused candidate suite
5 files / 68 tests PASS

runtime identity audit
NO_RUNTIME_IDENTITY_MATCHES

git diff --check bcc5d73..7981f5b
PASS
```

The green candidate tests do not cover the two adversarial failures above: they inject the first-loss event directly and do not create ambiguous duplicate activation targets.

## Gate Judgment

- Gate A: **NOT ACCEPTED** — semantic routing is identity-independent and the typed primitive exists, but authoritative target uniqueness/fail-closed behavior is incomplete.
- Gate B: **NOT ACCEPTED** — direct trusted-event tests pass, but the production battle-result chain does not generate the required first-loss event.
- Gate C: **NOT ACCEPTED** — the recovery candidate contains no reproducible committed Olga browser/reconnect E2E, and the production first-loss path is missing.

## Scope Boundary

This review does not reopen PLAY, PLAY_SOURCE_RESPONSE, ADD_TO_ATTACK, CLOSE, CREATE_AND_ACTIVATE, broad Trigger runtime, or unrelated Battle semantics. It reviews only the exact Olga delayed ACTIVATE replacement candidate.

The accepted Trigger Gateway specification remains external authority. The repair may add only the minimum production first-loss bridge necessary to satisfy that accepted event contract; it must not invent a broader trigger scheduler or identity-specific branch.

## Final Judgment

`IMPLEMENTATION_NEEDS_REVISION`

The exact recovery candidate `7981f5b9cdea6cdcf59168b599576740c4ddc6e6` is **not** accepted as the B07 migrated/Gate baseline. Historical acceptance must not be inherited.
