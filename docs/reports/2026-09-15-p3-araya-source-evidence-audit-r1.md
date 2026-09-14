# P3-A Araya Souren Source-Evidence Audit R1

- Date: 2026-09-15
- Role: Codex A
- Exact S input: `8b3a91215775f89daa036430589457fc3299ccc9`
- S PR: `#81`
- Locked Reference: `fengling20011118-dotcom/fate-domination@b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: independent automation/evidence recomputation only; no S semantic repair, runtime implementation, or Gate promotion
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
sourceEvidenceOverlayCount=84
sourceEvidenceOverlayAbilityCount=175
clauseCount=1789
sourceRefCount=1887
sourceGroundedCount=156
semanticBlockedCount=788
contractMappedCount=156
explicitBlockCount=788
capabilityCount=32
blockedPacketCoverageCount=788
runtimeRequestCount=23
```

Classification:

```text
READY_EXISTING_CONTRACT=0
READY_GENERIC_EXTENSION=100
SPECIAL_HANDLER_CANDIDATE=56
SOURCE_EVIDENCE_REQUIRED=788
```

## Independent source replay

A independently reread the two newly grounded Araya records from the hash-locked development source and compared them with the overlay snapshots and locked Reference inventory.

```text
records=2
source file SHA=c596af5730846ef9092375f18c4200b84f032028dc2e8f5483377d8ddcc22825
whole-file SHA mismatch=0
locator/sourceText mismatch=0
sourceText SHA mismatch=0
Reference printedText mismatch=0
Reference printedText SHA mismatch=0
```

The full Araya group independently resolves as:

```text
master.araya.skill.s1         SOURCE_GROUNDED / SPECIAL_HANDLER_CANDIDATE
master.araya.skill.s1a        SOURCE_GROUNDED / READY_GENERIC_EXTENSION
master.araya.skill.ascension  SOURCE_GROUNDED / SPECIAL_HANDLER_CANDIDATE
```

All three retain zero inherited acceptance contracts.

## Lane isolation

A made no candidate-semantic, mapper, generated full-roster, production runtime, application, or gameplay-authoring change. Relative to exact S candidate `8b3a91215775f89daa036430589457fc3299ccc9`, the A lane contains only this independent audit report.

## Verification

```text
npm ci                                      PASS
npm run typecheck                           PASS
fresh independent full-roster audit         EXACT_AGREEMENT / gapCount=0
A audit/decision/semantic/capability suite  4 files / 58 tests PASS
independent development-source replay       2 / 2 PASS
full Araya group source-grounded probe      3 / 3 PASS
npm run test:ci                             84 files / 523 tests PASS
git diff --check                            PASS before freeze
production / S-semantic lane diff           NONE
```

## Non-promotion

This audit certifies arithmetic/provenance agreement only. It does not promote F2, F3, F4, `READY_EXISTING_CONTRACT`, runtime implementation, migration acceptance, or full-roster closure. Fresh independent R review is still required before `156 grounded / 788 source-evidence blocked` becomes accepted.
