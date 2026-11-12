# P3-A Arcueid + Darnic + Amakusa + Fou Source-Evidence Audit R1

- Date: 2026-09-15
- Role: Codex A
- Exact S input: `2094dadb6a68487e7298c3a5cee6f31882ff0580`
- S PR: `#102`
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
sourceEvidenceOverlayCount=90
sourceEvidenceOverlayAbilityCount=189
clauseCount=1789
sourceRefCount=1887
sourceGroundedCount=162
semanticBlockedCount=782
contractMappedCount=162
explicitBlockCount=782
capabilityCount=32
blockedPacketCoverageCount=782
runtimeRequestCount=23
```

Classification remains:

```text
READY_EXISTING_CONTRACT=0
READY_GENERIC_EXTENSION=103
SPECIAL_HANDLER_CANDIDATE=59
SOURCE_EVIDENCE_REQUIRED=782
```

## Independent source replay

A independently reread all eight development-text records from the hash-locked source file and compared them with the overlay snapshots and locked Reference inventory:

```text
records=8
source file SHA=c596af5730846ef9092375f18c4200b84f032028dc2e8f5483377d8ddcc22825
whole-file SHA mismatch=0
locator/sourceText mismatch=0
sourceText SHA mismatch=0
Reference printedText mismatch=0
Reference printedText SHA mismatch=0
```

The batch independently resolves to three `READY_GENERIC_EXTENSION` identities and five `SPECIAL_HANDLER_CANDIDATE` identities. All eight retain zero inherited acceptance contracts.

The reviewed-special identities are Arcueid materialization orchestration, Darnic terrain ownership/mutation, Amakusa linked-player contribution/reward, and Fou elimination-prevention/shared-victory semantics. Their ordinary dependencies remain exposed separately rather than hidden inside special payloads.

## Lane isolation

Relative to exact S candidate `2094dadb6a68487e7298c3a5cee6f31882ff0580`, A makes no semantic, generated data, production-runtime, capability-mapper, or S-test repair. The fresh audit regenerated the same checked-in automation report byte-for-byte, so the only A-owned change is this audit report.

## Verification

```text
npm ci                                      PASS
npm run typecheck                           PASS
fresh independent full-roster audit         EXACT_AGREEMENT / gapCount=0
A audit/decision/semantic/capability suite  4 files / 57 tests PASS
independent development-source replay       8 / 8 PASS
final npm run test:ci                        84 files / 522 tests PASS
git diff --check                            PASS before freeze
production / S-semantic lane diff           NONE
```

## Non-promotion

This audit certifies arithmetic/provenance agreement only. It does not promote F2, F3, F4, `READY_EXISTING_CONTRACT`, runtime implementation, migration acceptance, or full-roster closure. Fresh independent R review is required before `162 grounded / 782 source-evidence blocked` becomes accepted.
