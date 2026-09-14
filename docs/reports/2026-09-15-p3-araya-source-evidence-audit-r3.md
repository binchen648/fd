# P3-A Araya Source-Evidence Audit R3

- Date: 2026-09-15
- Role: Codex A
- Exact S R3 input: `d6d07804055f8a849959f2382655039d11525c88`
- S R3 PR: `#91`
- Locked Reference: `fengling20011118-dotcom/fate-domination@b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: independent audit/recomputation only; no S semantic repair, runtime implementation, or Gate promotion
- Result: `EXACT_AGREEMENT`

## Independent recomputation

```text
status=EXACT_AGREEMENT
gapCount=0
totalIdentityCount=944
sourceEvidenceOverlayCount=84
sourceEvidenceOverlayAbilityCount=175
sourceGroundedCount=156
semanticBlockedCount=788
contractMappedCount=156
explicitBlockCount=788
capabilityCount=32
runtimeRequestCount=23
READY_EXISTING_CONTRACT=0
READY_GENERIC_EXTENSION=100
SPECIAL_HANDLER_CANDIDATE=56
SOURCE_EVIDENCE_REQUIRED=788
```

## Araya R3 dependency checks

A independently confirmed:

- `master.araya.skill.s1` is `SPECIAL_HANDLER_CANDIDATE`, retains zero inherited contracts, and now explicitly requires `GENERIC_MOVEMENT` in addition to trigger/condition/lifecycle/special dependencies.
- `master.araya.skill.ascension` remains `SPECIAL_HANDLER_CANDIDATE`, zero inherited contracts, and explicitly requires `GENERIC_VISIBILITY`, `GENERIC_MOVEMENT`, `CARD_ACTION_PLAY`, modifier/condition, and reviewed-special handling.
- `master.araya.skill.s1a` remains `READY_GENERIC_EXTENSION` with zero inherited contracts.
- Full Araya group is source-grounded 3 / 3.

## Independent source replay

```text
records=2
source file SHA=c596af5730846ef9092375f18c4200b84f032028dc2e8f5483377d8ddcc22825
whole-file SHA mismatch=0
locator/sourceText mismatch=0
sourceText SHA mismatch=0
Reference printedText mismatch=0
Reference printedText SHA mismatch=0
```

## Verification

```text
npm ci                                      PASS
npm run typecheck                           PASS
fresh independent full-roster audit         EXACT_AGREEMENT / gapCount=0
A audit/decision/semantic/capability suite  4 files / 60 tests PASS
independent development-source replay       2 / 2 PASS
full npm run test:ci                        84 files / 525 tests PASS
git diff --check                            PASS
production / S-semantic lane diff           NONE
```

The only initial A-suite failure was the expected stale A-owned snapshot assertion from the previous 82/171/154/790 checkpoint. Updating it to the independently recomputed 84/175/156/788 values restored the suite without changing any S semantic artifact.

## Non-promotion

This audit confirms arithmetic, provenance, and dependency-graph agreement only. It does not promote F2, F3, F4, runtime implementation, migration acceptance, or `READY_EXISTING_CONTRACT`. Fresh independent R3 review is required before 156 / 788 becomes the accepted checkpoint.
