# P3-A Bazett Source-Evidence Audit R2

- Date: 2026-09-15
- Role: Codex A
- Exact repaired S input: `0dcc1f94297f2198f0f4152742c585032931390a`
- Parent rejected S input: `f439b3241bb5999e90fd7cf638b569081f2b148c`
- R1 rejection evidence: `834a7b47c1d821a3f032f2f74177c9f9d28187ec`
- Locked Reference: `fengling20011118-dotcom/fate-domination@b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: independent automation/evidence recomputation only; no semantic repair, runtime implementation, or Gate promotion
- Result: `EXACT_AGREEMENT`

## Independent recomputation

A reran `audit-full-roster.ts` from the exact repaired Bazett S R3 candidate against the clean locked Reference checkout.

```text
status=EXACT_AGREEMENT
gapCount=0
staticSkillCount=943
dynamicSkillCount=1
totalIdentityCount=944
programCount=943
authoringCardCount=72
authoringAbilityCount=117
sourceEvidenceOverlayCount=27
sourceEvidenceOverlayAbilityCount=38
clauseCount=1789
sourceRefCount=1887
sourceGroundedCount=99
semanticBlockedCount=845
contractMappedCount=99
explicitBlockCount=845
capabilityCount=32
blockedPacketCoverageCount=845
runtimeRequestCount=23
```

Classification is independently recomputed as:

```text
READY_EXISTING_CONTRACT=0
READY_GENERIC_EXTENSION=86
SPECIAL_HANDLER_CANDIDATE=13
SOURCE_EVIDENCE_REQUIRED=845
```

The R3 semantic repair therefore leaves the proposed 10-ID source-evidence burn-down unchanged while moving the stateful Bazett Day Cycle identities to the conservative reviewed-special route and increasing the structured overlay ability count from 37 to 38.

## R1 repair evidence observed by A

A does not make the semantic acceptance decision, but the regenerated artifacts now expose the repaired dependency graph rather than hiding it in counts:

- Day Cycle state-transition identities are no longer silently generic.
- `cycle_state_transition` contributes reviewed-special reasons.
- Fragarach remains reviewed-special for Defeat.
- no `READY_EXISTING_CONTRACT` promotion occurs.

## Verification

```text
npm ci                                           PASS
npm run typecheck                                PASS
A audit/semantic/capability/decision suites      4 files / 33 tests PASS
independent full-roster audit                    EXACT_AGREEMENT / gapCount=0
```

The A-owned diff relative to exact S R3 is limited to independent audit implementation/tests/reports. No source overlay, S-generated capability artifact, `packages/`, `apps/`, or runtime implementation is modified by A.

## Non-promotion

This audit does not promote F2, F3, F4, `READY_EXISTING_CONTRACT`, any reviewed-special runtime, migration acceptance, or full-roster closure. A fresh independent R review must decide whether the three R1 semantic findings are actually closed before `99 / 845` is accepted.
