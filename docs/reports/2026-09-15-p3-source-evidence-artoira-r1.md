# Phase 3 Full-Roster Source Evidence — Artoira Charge R1

- Date: 2026-09-15
- Role: Codex S
- Base accepted checkpoint: `788c76b2704a36a4960e45277f493550a0ce8308`
- Branch: `codex/s-p3-source-evidence-artoira-r1`
- Locked Reference: `fengling20011118-dotcom/fate-domination@b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: source-evidence normalization for `master.artoira.skill.s1` and `master.artoira.skill.ascension` only; no runtime implementation or migration acceptance

## Source evidence

Both canonical identities are bound to the exact development-text snapshot in `Fate_Domination-开发版/data_masters.js`.

```text
source file SHA-256=c596af5730846ef9092375f18c4200b84f032028dc2e8f5483377d8ddcc22825
records=2
sourceText mismatch=0
sourceText SHA mismatch=0
Reference printedText mismatch=0
Reference printedText SHA mismatch=0
```

The source-first normalization intentionally does not import Reference-handler-only restrictions. In particular, the printed text requires a face-up owned Servant skill attack, but does not say the selected card must be inactive, so no `active:false` restriction is recorded.

## Structured semantics

`master.artoira.skill.s1` is normalized as two source-grounded abilities:

1. Outpost action: select exactly one face-up skill attack belonging to the controller's Servant; require enough deck depth for printed mana cost + 1; charge it into that deck position.
2. Trigger: when that charged card leaves the controller's deck for any reason, add it to attack for free.

The bespoke charge insertion/lifecycle remains reviewed-special. Ordinary dependencies are exposed separately through target selection, pending interaction, result binding, visibility, trigger gateway, Card Zone, and Add-to-Attack capability families.

`master.artoira.skill.ascension` is normalized as three source-grounded abilities:

1. On unlock, place the source card into the skill zone.
2. Passive charge eligibility permits this source card itself to be charged.
3. During Combat, after the controller wins, if the source card entered attack from the controller's deck this round, finish the game immediately with the controller as winner.

The immediate-victory effect remains reviewed-special and exposes the ordinary Battle, Card Zone, condition, modifier, and trigger dependencies separately.

## Generated result

```text
totalIdentityCount=944
sourceEvidenceOverlayCount=82
sourceEvidenceOverlayAbilityCount=171
sourceGroundedCount=154
semanticBlockedCount=790
contractMappedCount=154
explicitBlockCount=790
READY_EXISTING_CONTRACT=0
READY_GENERIC_EXTENSION=100
SPECIAL_HANDLER_CANDIDATE=54
SOURCE_EVIDENCE_REQUIRED=790
zeroSilentFallback=true
capabilityCount=32
runtimeRequestCount=23
```

Delta from the accepted 152 / 792 checkpoint:

```text
source-grounded: +2
source-evidence blocked: -2
structured abilities: 283 -> 288
special candidates: 52 -> 54
```

Both Artoira identities are `SPECIAL_HANDLER_CANDIDATE`, both have zero inherited acceptance contracts, and neither is promoted to an existing contract.

## Verification

```text
npm run typecheck                                                   PASS
Phase 3 full-roster/reference focused suite                         6 files / 75 tests PASS
isolated phase3-full-roster-inventory rerun                         1 file / 12 tests PASS
independent source replay                                           2 / 2 PASS
independent full-roster automation audit                            EXACT_AGREEMENT / gapCount=0
final npm run test:ci                                               84 files / 520 tests PASS
generic machinery identity-literal audit                            PASS / 0 Artoira identity literals
production-runtime diff under packages/, apps/, src/                NONE
git diff --check                                                    PASS before freeze
```

One earlier all-suite run hit the inventory fixture's 5-second test timeout under parallel load. The exact failing file then passed in isolation with all 12 tests, and the final full `test:ci` passed all 84 files / 520 tests; no timeout-related code or test threshold was changed.

## Result

This slice is ready for independent A recomputation and R review as an incremental F1 source-evidence checkpoint.

It does **not** promote F2/F3/F4, runtime Gate status, migration acceptance, `READY_EXISTING_CONTRACT`, or full-roster closure. The two Artoira identities remain reviewed-special implementation work, and the remaining 790 identities remain explicitly source-evidence blocked.
