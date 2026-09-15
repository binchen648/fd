# P3-A Integration Audit — Servant Common after Rin/Shinji R1

- Date: 2026-09-15
- Role: Codex A
- Exact S input: `697e7bc1fc5df0f8980c6fbab8888339f8d22865`
- S PR: `#100`
- Accepted parent checkpoint: `8aab3db51b11ffda1eddd53b5b96b2e89d66d72a`
- Locked Reference: `fengling20011118-dotcom/fate-domination@b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: independent recomputation and provenance verification only; no S semantic repair or runtime implementation
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
sourceEvidenceOverlayCount=105
sourceEvidenceOverlayAbilityCount=215
clauseCount=1789
sourceRefCount=1887
sourceGroundedCount=177
semanticBlockedCount=767
contractMappedCount=177
explicitBlockCount=767
capabilityCount=32
blockedPacketCoverageCount=767
runtimeRequestCount=23
```

Classification independently agrees with the S candidate:

```text
READY_EXISTING_CONTRACT=0
READY_GENERIC_EXTENSION=118
SPECIAL_HANDLER_CANDIDATE=59
SOURCE_EVIDENCE_REQUIRED=767
```

## Independent servant-source replay

A independently reread the ten development-text records from `Fate_Domination-开发版/data_servants.js` and compared each record with both the overlay and locked Reference inventory.

```text
records=10
source file SHA=6da31ebdf36561c550dfe9725963a71496705050e90a8b5a87464f501ee43ae3
whole-file SHA mismatch=0
locator/sourceText mismatch=0
sourceText SHA mismatch=0
Reference printedText mismatch=0
Reference printedText SHA mismatch=0
routes=9 READY_GENERIC_EXTENSION / 1 SPECIAL_HANDLER_CANDIDATE
inherited acceptance contracts=0 / 10
```

The reviewed-special record is `servant.hassan.skill.sc-hassan-1`, blocked only by the source-grounded Defeat primitive. The remaining nine identities are generic-extension candidates without inherited runtime acceptance.

## Verification

```text
npm ci                                      PASS
npm run typecheck                           PASS
fresh independent full-roster audit         EXACT_AGREEMENT / gapCount=0
Reference/full-roster regression suite      6 files / 85 tests PASS
independent development-source replay       10 / 10 PASS
full npm run test:ci                        84 files / 530 tests PASS
```

## Lane isolation

A did not modify `data/phase3`, S-owned semantic/capability tests, generic normalizers/mappers, or any production path. Relative to exact S input, the A change is this independent audit report only.

## Non-promotion

This audit verifies provenance, arithmetic, and generated-state agreement only. It does **not** promote F2, F3, F4, `READY_EXISTING_CONTRACT`, runtime implementation, migration acceptance, or full-roster closure. Fresh independent R review is required before `177 grounded / 767 blocked` becomes the formal accepted checkpoint.
