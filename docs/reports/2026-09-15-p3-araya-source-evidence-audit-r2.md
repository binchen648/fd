# P3-A Araya Souren Source-Evidence Audit R2

- Date: 2026-09-15
- Role: Codex A
- Exact S R2 input: `c8866d8f316498bd0a4e4cb201c2517dc62420b9`
- S R2 PR: `#84`
- R1 rejection: `473eb77b2bd973b96449303ebadd69c3ca0e7595`
- Locked Reference: `fengling20011118-dotcom/fate-domination@b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: independent recomputation only; no S semantic/runtime repair
- Result: `EXACT_AGREEMENT`

## Independent recomputation

```text
status=EXACT_AGREEMENT
gapCount=0
sourceEvidenceOverlayCount=84
sourceEvidenceOverlayAbilityCount=175
sourceGroundedCount=156
semanticBlockedCount=788
contractMappedCount=156
explicitBlockCount=788
READY_EXISTING_CONTRACT=0
READY_GENERIC_EXTENSION=100
SPECIAL_HANDLER_CANDIDATE=56
SOURCE_EVIDENCE_REQUIRED=788
runtimeRequestCount=23
```

## R1 blocker recomputation

A independently confirms the repaired Araya ascension now carries:

```text
semanticNormalization.axes.visibility=[FACE_DOWN]
requiredCapabilities includes GENERIC_VISIBILITY
classificationRoute=SPECIAL_HANDLER_CANDIDATE
inheritedAcceptanceContracts=[]
```

The generic structural regression covers both `ruleModifier.face=down -> FACE_DOWN` and `face=up -> FACE_UP`; no Araya identity branch is present.

## Verification

```text
npm ci                                      PASS
npm run typecheck                           PASS
fresh independent full-roster audit         EXACT_AGREEMENT / gapCount=0
A audit/decision/semantic/capability suite  4 files / 59 tests PASS
independent development-source replay       2 / 2 PASS
ARAYA-001 closure probe                     PASS
full npm run test:ci                        84 files / 524 tests PASS
git diff --check                            PASS before freeze
```

## Non-promotion

A certifies only the repaired F1 dependency graph and provenance arithmetic. No F2/F3/F4, runtime implementation, `READY_EXISTING_CONTRACT`, migration acceptance, or full-roster closure is promoted. Fresh R2 review is still required before `156 grounded / 788 blocked` becomes accepted.
