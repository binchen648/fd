# Phase 3 Full-Roster Source Evidence Audit — Araya + Kayneth + Leonardo + Taiga + Tokiomi R1

- Date: 2026-09-15
- Role: Codex A
- Exact S candidate: `869465444893a958dc937c649c9b2da7d50c81d0`
- S PR: #111
- Branch: `codex/a-p3-source-evidence-araya-kayneth-leonardo-taiga-tokiomi-r1`
- Locked Reference: `fengling20011118-dotcom/fate-domination@b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: independent F1 recomputation only; no semantic/runtime repair

## Independent recomputation

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
status=EXACT_AGREEMENT
gapCount=0
```

All generated semantic/data artifacts reproduced byte-identically against S after independent verify/intake/normalize/map/packet/audit execution.

## Verification

```text
npm run typecheck                                                    PASS
Phase 3 full-roster/reference focused suite                          6 files / 83 tests PASS
independent development-source replay                                14 / 14 PASS
production-runtime diff from exact S under packages/, apps/, src/    NONE
semantic/data diff after independent recomputation                    NONE
default parallel npm run test:ci                                     527 / 528 PASS; one 5s timeout only
isolated packages/rules/tests/match-session.test.ts                   26 / 26 PASS
same 84-file CI set with --maxWorkers=1 --minWorkers=1                84 files / 528 tests PASS
git diff --check                                                     PASS before freeze
```

## Audit conclusion

No F1 blocker found. The S classification of this 14-ID batch as nine generic extensions and five reviewed-special identities is internally consistent and source-grounded. The existing-contract count remains one and is unchanged from the prior accepted checkpoint.

This A result does **not** promote F2/F3/F4 or runtime migration. `194 grounded / 750 blocked` remains candidate-only until fresh R acceptance.
