# P3-A Kadoc + Hinako Source-Evidence Audit R2

- Date: 2026-09-15
- Role: Codex A
- Exact S R2 input: `1c4f4552130d01361b5acf6543377bb2cdbd6939`
- Parent R rejection: `6697dbef9ff3694637233ebe26aa90e7986abb4e`
- Locked Reference: `fengling20011118-dotcom/fate-domination@b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: independent automation/evidence recomputation only; no semantic repair, runtime implementation, or Gate promotion
- Result: `EXACT_AGREEMENT`

## Independent recomputation

```text
status=EXACT_AGREEMENT
gapCount=0
staticSkillCount=943
dynamicSkillCount=1
totalIdentityCount=944
programCount=943
authoringCardCount=72
authoringAbilityCount=117
sourceEvidenceOverlayCount=70
sourceEvidenceOverlayAbilityCount=133
sourceGroundedCount=142
semanticBlockedCount=802
contractMappedCount=142
explicitBlockCount=802
capabilityCount=32
blockedPacketCoverageCount=802
runtimeRequestCount=23
```

Classification remains:

```text
READY_EXISTING_CONTRACT=0
READY_GENERIC_EXTENSION=96
SPECIAL_HANDLER_CANDIDATE=46
SOURCE_EVIDENCE_REQUIRED=802
```

R2 therefore changes semantic/dependency shape without changing candidate population counts.

## Structural recomputation relevant to R findings

A independently observes the regenerated artifacts now carry:

- no lifecycle limit on `master.hinako.skill.s3` from the removed candidate-only once-per-round assumption;
- the three China conditional player predicates in `master.hinako.skill.s4` semantic condition axes;
- `CARD_ACTION_PLAY` in s4 required capabilities for `card_play_permission` restrictions;
- exactly-one Rapid Expansion target selection with explicit required-if-eligible / fallback-if-no-eligible semantics;
- zero inherited acceptance contracts across the Kadoc/Hinako slice.

These observations establish artifact consistency only; final semantic acceptance remains R-owned.

## Independent source replay

```text
records=13
source file SHA=c596af5730846ef9092375f18c4200b84f032028dc2e8f5483377d8ddcc22825
whole-file SHA mismatch=0
locator/sourceText mismatch=0
sourceText SHA mismatch=0
Reference printedText mismatch=0
Reference printedText SHA mismatch=0
```

## Verification

```text
npm ci                                         PASS
npm run typecheck                              PASS
independent full-roster audit                  EXACT_AGREEMENT / gapCount=0
A audit/decision/semantic/capability suites    4 files / 47 tests PASS
independent development-source replay          13 / 13 PASS
git diff --check                               PASS
production paths under packages/, apps/, src/  NONE
```

## Non-promotion

This audit does not promote F2, F3, F4, `READY_EXISTING_CONTRACT`, runtime implementation, migration acceptance, or full-roster closure. Fresh independent R review is required before `142 grounded / 802 source-evidence blocked` becomes accepted.
