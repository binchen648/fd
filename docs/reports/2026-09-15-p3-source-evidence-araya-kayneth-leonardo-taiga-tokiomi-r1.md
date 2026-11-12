# Phase 3 Full-Roster Source Evidence — Araya + Kayneth + Leonardo + Taiga + Tokiomi R1

- Date: 2026-09-15
- Role: Codex S
- Base accepted checkpoint: `f90c822f556a56f0778c2e4b217fef38471a62cb`
- Branch: `codex/s-p3-source-evidence-araya-kayneth-leonardo-taiga-tokiomi-r1`
- Locked Reference: `fengling20011118-dotcom/fate-domination@b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: F1 source-evidence / semantic normalization for fourteen canonical identities across Araya, Kayneth, Leonardo, Taiga, and Tokiomi; no runtime implementation or migration acceptance

## Source evidence

All fourteen identities replay exactly against `Fate_Domination-开发版/data_masters.js` and the locked Reference printed text.

```text
source file SHA-256=c596af5730846ef9092375f18c4200b84f032028dc2e8f5483377d8ddcc22825
records=14
bad=[]
```

Reference handlers were used only as behavior cross-checks. No Reference-only restriction was promoted over the development source text.

## Structured semantics

The fourteen identities add 21 source-grounded structured abilities.

- Araya: persistent terrain replacement and effective-workshop / same-location restrictions remain reviewed-special because they mutate location/terrain semantics across subsystems; ordinary trigger, condition, movement, modifier, and lifecycle dependencies stay explicit.
- Kayneth: the low-mana skill waiver and Fluid Dynamics semantics are generic capability requests. The six-card Volumen independent deck remains reviewed-special.
- Leonardo: victory-history power, event reward modification, and Final Judgment are generic capability requests.
- Taiga: initial mana and Tiger Stamp reward/status semantics are generic. Domestic Carnage remains reviewed-special because it turns Workshop into a battlefield with custom competition scoring.
- Tokiomi: Elementalist and Advanced Pyromancy are generic capability requests. The four-item shared-use subsystem remains reviewed-special.

The mapper additions are structural effect-family tokens only (`INDEPENDENT_DECK_RULE`, `ITEM_RULE`); no Araya, Kayneth, Leonardo, Taiga, or Tokiomi identity branch was added.

## Generated result

```text
totalIdentityCount=944
sourceEvidenceOverlayCount=122
sourceEvidenceOverlayAbilityCount=253
sourceGroundedCount=194
semanticBlockedCount=750
contractMappedCount=194
explicitBlockCount=750
READY_EXISTING_CONTRACT=1
READY_GENERIC_EXTENSION=124
SPECIAL_HANDLER_CANDIDATE=69
SOURCE_EVIDENCE_REQUIRED=750
structuredAbilityCount=370
zeroSilentFallback=true
capabilityCount=32
runtimeRequestCount=23
```

Delta from accepted 180 / 764:

```text
source-grounded: +14
source-evidence blocked: -14
structured abilities: 349 -> 370
existing contracts: 1 -> 1
generic extensions: 115 -> 124
special candidates: 64 -> 69
```

Batch classification is exactly nine generic extensions and five reviewed-special identities.

## Verification

```text
npm run typecheck                                                   PASS
Phase 3 full-roster/reference focused suite                         6 files / 83 tests PASS
independent full-roster automation audit                            EXACT_AGREEMENT / gapCount=0
independent development-source replay                               14 / 14 PASS
new identity-literal audit in generic normalizer/capability mapper  PASS / none added
production-runtime diff under packages/, apps/, src/                NONE
npm run test:ci                                                     84 files / 528 tests PASS
git diff --check                                                    PASS before freeze
```

## Result

This slice is ready for independent A recomputation and fresh R review as an incremental F1 source-evidence checkpoint.

It does **not** promote F2/F3/F4 or claim bulk runtime migration. `194 grounded / 750 blocked` remains candidate-only until fresh R acceptance.
