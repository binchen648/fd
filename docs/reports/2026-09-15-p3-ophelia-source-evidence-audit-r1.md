# P3-A Ophelia Source-Evidence Audit R1

- Date: 2026-09-15
- Role: Codex A
- Exact S input: `84d4182e73cd31d330e35bac695bf4aa2e684e68`
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
sourceEvidenceOverlayCount=48
sourceEvidenceOverlayAbilityCount=74
sourceGroundedCount=120
semanticBlockedCount=824
contractMappedCount=120
explicitBlockCount=824
capabilityCount=32
blockedPacketCoverageCount=824
runtimeRequestCount=23
```

Classification recomputes to:

```text
READY_EXISTING_CONTRACT=0
READY_GENERIC_EXTENSION=89
SPECIAL_HANDLER_CANDIDATE=31
SOURCE_EVIDENCE_REQUIRED=824
```

## Development-text recheck

A directly reread `E:\Codex\FD\Fate_Domination-开发版\data_masters.js` at SHA-256 `c596af5730846ef9092375f18c4200b84f032028dc2e8f5483377d8ddcc22825`.

All ten Ophelia records resolve to their declared locators and exact source snapshots:

```text
records=10
whole-file SHA mismatch=0
locator/sourceText mismatch=0
sourceText SHA mismatch=0
```

## Candidate observation

A records but does not semantically accept the S classification:

```text
Ophelia source-grounded identities=10
READY_GENERIC_EXTENSION=3
SPECIAL_HANDLER_CANDIDATE=7
inherited current acceptance contracts=0
```

The generated dependency graph includes the Nordic Lostbelt/Event Deck dependencies, combat-power dependencies, Card Zone dependency for the source-card setup instruction, and result binding for Ragnarok's removed-event count.

## Verification

```text
npm ci                                         PASS
npm run typecheck                              PASS
independent full-roster audit                  EXACT_AGREEMENT / gapCount=0
A audit/semantic/capability/decision suites    4 files / 41 tests PASS
independent development-file comparison        10 / 10 PASS
production paths under packages/ or apps/      NONE
```

## Non-promotion

This audit does not promote F2, F3, F4, `READY_EXISTING_CONTRACT`, runtime implementation, migration acceptance, or full-roster closure. Fresh independent R review remains required before `120 grounded / 824 source-evidence blocked` is accepted.
