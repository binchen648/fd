# P3-A Goetia + Magical Ruby + Irisviel Source-Evidence Audit R1

- Date: 2026-09-15
- Role: Codex A
- Exact S input: `e209afb87e64700eb6853f039d54844344750ab6`
- S PR: `#108`
- Locked Reference: `fengling20011118-dotcom/fate-domination@b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: independent automation/evidence recomputation only; no S semantic repair, runtime implementation, or Gate promotion
- Result: `EXACT_AGREEMENT`

## Independent recomputation

```text
status=EXACT_AGREEMENT
gapCount=0
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
runtimeRequestCount=23
```

A independently confirms the nine-ID batch as one `READY_EXISTING_CONTRACT`, five `READY_GENERIC_EXTENSION`, and three `SPECIAL_HANDLER_CANDIDATE` identities. The existing contract is `master.irisviel.skill.s2` inheriting `CARD_ZONE_CORE_DIRECT_ACTION`; the inheritance follows the already accepted current authoring route plus now-source-grounded non-invalidating semantic axes.

## Independent source replay

```text
records=9
source file SHA=c596af5730846ef9092375f18c4200b84f032028dc2e8f5483377d8ddcc22825
bad=[]
```

## Lane isolation

Relative to exact S candidate `e209afb87e64700eb6853f039d54844344750ab6`, fresh A made no semantic, generated-data, runtime, capability-mapper, or test repair. This report is the only A-owned change.

## Verification

```text
npm ci                                      PASS
npm run typecheck                           PASS
fresh independent full-roster audit         EXACT_AGREEMENT / gapCount=0
A audit/decision/semantic/capability suite  4 files / 61 tests PASS
independent development-source replay       9 / 9 PASS
final npm run test:ci                        84 files / 526 tests PASS
git diff --check                            PASS before freeze
production / S-semantic lane diff           NONE
```

## Non-promotion

This audit does not promote F2/F3/F4, new runtime implementation, migration acceptance, or full-roster closure. Fresh independent R review is required before `180 grounded / 764 source-evidence blocked` becomes accepted.
