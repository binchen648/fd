# Phase 3 Full-Roster Source Evidence — Arcueid + Darnic + Amakusa + Fou R1

- Date: 2026-09-15
- Role: Codex S
- Base accepted checkpoint: `254104eefd7ad5451e5928ac67141b9c04213c42`
- Branch: `codex/s-p3-source-evidence-arcueid-darnic-amakusa-fou-r1`
- Locked Reference: `fengling20011118-dotcom/fate-domination@b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: source-evidence normalization for the remaining eight canonical identities across Arcueid, Darnic, Amakusa, and Fou only; no runtime implementation or migration acceptance

## Source evidence

All eight canonical identities are bound to the exact development-text snapshot in `Fate_Domination-开发版/data_masters.js`.

```text
source file SHA-256=c596af5730846ef9092375f18c4200b84f032028dc2e8f5483377d8ddcc22825
records=8
sourceText mismatch=0
sourceText SHA mismatch=0
Reference printedText mismatch=0
Reference printedText SHA mismatch=0
```

The source-first normalization does not import Reference-handler-only restrictions. Reference handlers were used only as a behavior cross-check after the printed clauses were independently structured.

## Structured semantics

The eight identities expand to 18 source-grounded structured abilities.

- `master.arcueid.skill.s2`: action-phase preparation plus the combat replacement sequence, with target selection, close, draw-until-basic, add-to-attack, result binding, and the one-repeat window explicit. The delayed/repeat orchestration remains reviewed-special.
- `master.arcueid.skill.ascension`: skill-zone setup, same-round materialization play restriction, and doubled Blood Desire impact on basic attacks.
- `master.darnic.skill.s1`: continuous ownership of unoccupied terrain advantage on the controller's battlefields; the terrain-position rule remains reviewed-special.
- `master.darnic.skill.ascension`: skill-zone setup, Scorched Earth compulsory VP-payment-or-terrain-loss branch, and Air Support terrain multiplier. The terrain mutation remains reviewed-special while cost, trigger, interaction, movement, and modifier dependencies are explicit.
- `master.amakusa.skill.s3`: non-climax entry seal cost, once-per-round cross-battlefield linked mana contribution, and same-round different-combat shared VP. The linked-player relationship mechanics remain reviewed-special while movement, cost, battle, trigger, and resource dependencies are explicit.
- `master.amakusa.skill.ascension`: immediate two-seal loss to all opponents on unlock and First Folio basic-card +4 power while active.
- `master.fou.skill.s1`: end-round selection of a returned skill after Command Seal expenditure, with permanent +1 power and -1 printed mana cost bounded at one-half printed cost.
- `master.fou.skill.ascension`: once-per-game elimination prevention, post-resolution opponent VP swap, and shared victory even if one linked player is eliminated; these lifecycle/victory semantics remain reviewed-special.

## Generated result

```text
totalIdentityCount=944
sourceEvidenceOverlayCount=90
sourceEvidenceOverlayAbilityCount=189
sourceGroundedCount=162
semanticBlockedCount=782
contractMappedCount=162
explicitBlockCount=782
READY_EXISTING_CONTRACT=0
READY_GENERIC_EXTENSION=103
SPECIAL_HANDLER_CANDIDATE=59
SOURCE_EVIDENCE_REQUIRED=782
zeroSilentFallback=true
structuredAbilityCount=306
capabilityCount=32
runtimeRequestCount=23
```

Delta from the accepted 154 / 790 checkpoint:

```text
source-grounded: +8
source-evidence blocked: -8
structured abilities: 288 -> 306
generic extensions: 100 -> 103
special candidates: 54 -> 59
```

Classification for this batch is exactly three generic extensions and five reviewed-special identities. All eight retain zero inherited runtime acceptance contracts and none is promoted to `READY_EXISTING_CONTRACT`.

## Verification

```text
npm run typecheck                                                   PASS
Phase 3 full-roster/reference focused suite                         6 files / 77 tests PASS
independent full-roster automation audit                            EXACT_AGREEMENT / gapCount=0
independent development-source replay                               8 / 8 PASS
identity-literal audit in generic normalizer/capability mapper      PASS / 0 identity literals
production-runtime diff under packages/, apps/, src/                NONE
npm run test:ci                                                     84 files / 522 tests PASS
git diff --check                                                    PASS before freeze
```

The first focused run failed only because the checked-in automation-audit report still contained the preceding Artoira checkpoint totals. Regenerating the independent audit produced the exact 90/189 overlay and 162/782 grounded/blocked totals; the focused suite then passed 77/77. No runtime or timeout threshold was changed.

## Result

This slice is ready for independent A recomputation and fresh R review as an incremental F1 source-evidence checkpoint.

It does **not** promote F2/F3/F4, runtime Gate status, migration acceptance, `READY_EXISTING_CONTRACT`, or full-roster closure. The five special identities remain reviewed-special implementation work, the three generic identities remain generic-extension work, and the remaining 782 identities remain explicitly source-evidence blocked.
