# Phase 3 Full-Roster Source Evidence — Goetia + Magical Ruby + Irisviel R1

- Date: 2026-09-15
- Role: Codex S
- Base accepted checkpoint: `6eeab47cf635fba3a5d4f9bb0cf254c7d4f86205`
- Branch: `codex/s-p3-source-evidence-goetia-illya-irisviel-r1`
- Locked Reference: `fengling20011118-dotcom/fate-domination@b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: F1 source-evidence / semantic normalization for nine canonical identities across Goetia, Magical Ruby, and Irisviel; no runtime implementation or migration acceptance

## Source evidence

All nine identities replay exactly against `Fate_Domination-开发版/data_masters.js` and the locked Reference printed text.

```text
source file SHA-256=c596af5730846ef9092375f18c4200b84f032028dc2e8f5483377d8ddcc22825
records=9
bad=[]
```

Reference handlers were used only as behavior cross-checks. No Reference-only restriction was promoted over the development source text.

## Structured semantics

The nine identities add 26 source-grounded structured abilities.

- Goetia: shared Demon-God setup/sacrifice semantics and Forneus action-ability retrigger remain reviewed-special. Ordinary card-zone, play, close, movement, resource, trigger, lifecycle, modifier, selection and binding dependencies remain explicit. The Temple of Time ascension resolves through generic capabilities.
- Magical Ruby: Unlimited Imagination's deck-entry replacement remains reviewed-special. Kaleidostick draw/shuffle and Doppelganger upkeep/effect multiplier are generic capability requests.
- Irisviel: Proxy Master and Life Giving are generic capability requests. Conversion Magic now has enough source-grounded semantics to safely inherit the already accepted `CARD_ZONE_CORE_DIRECT_ACTION` current contract.

The mapper additions are structural effect-family tokens only (`DEMON_GOD_RULE`, `DECK_ENTRY_REPLACEMENT`); no Goetia, Magical Ruby, or Irisviel identity branch was added.

## Generated result

```text
totalIdentityCount=944
sourceEvidenceOverlayCount=108
sourceEvidenceOverlayAbilityCount=232
sourceGroundedCount=180
semanticBlockedCount=764
contractMappedCount=180
explicitBlockCount=764
READY_EXISTING_CONTRACT=1
READY_GENERIC_EXTENSION=115
SPECIAL_HANDLER_CANDIDATE=64
SOURCE_EVIDENCE_REQUIRED=764
structuredAbilityCount=349
zeroSilentFallback=true
capabilityCount=32
runtimeRequestCount=23
```

Delta from accepted 171 / 773:

```text
source-grounded: +9
source-evidence blocked: -9
structured abilities: 323 -> 349
existing contracts: 0 -> 1
generic extensions: 110 -> 115
special candidates: 61 -> 64
```

Batch classification is exactly one existing contract, five generic extensions, and three reviewed-special identities.

## Verification

```text
npm run typecheck                                                   PASS
Phase 3 full-roster/reference focused suite                         6 files / 81 tests PASS
independent full-roster automation audit                            EXACT_AGREEMENT / gapCount=0
independent development-source replay                               9 / 9 PASS
new identity-literal audit in generic normalizer/capability mapper  PASS / none added
production-runtime diff under packages/, apps/, src/                NONE
npm run test:ci                                                     84 files / 526 tests PASS
git diff --check                                                    PASS before freeze
```

## Result

This slice is ready for independent A recomputation and fresh R review as an incremental F1 source-evidence checkpoint.

It does **not** promote F2/F3/F4 or claim bulk runtime migration. `180 grounded / 764 blocked` remains candidate-only until fresh R acceptance. The first `READY_EXISTING_CONTRACT` is specifically Irisviel Conversion Magic; this recognizes an already accepted runtime contract and is not a new runtime implementation.
