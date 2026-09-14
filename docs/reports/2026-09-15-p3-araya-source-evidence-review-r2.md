# P3-R Araya Souren Source-Evidence Review R2

- Date: 2026-09-15
- Role: Codex R
- Exact S R2: `c8866d8f316498bd0a4e4cb201c2517dc62420b9`
- Exact A R2: `1c35d61a3173ddf510c77469e5ae96045b1d8014`
- R1 rejection: `473eb77b2bd973b96449303ebadd69c3ca0e7595`
- Locked Reference: `fengling20011118-dotcom/fate-domination@b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: fresh independent acceptance review; no candidate/runtime repair
- Verdict: `F1_SOURCE_EVIDENCE_ACCEPTED`

## R1 blocker closure

`ARAYA-001` is closed.

The repaired generic normalizer now derives face-state visibility from structured rule modifiers as well as effects:

```text
ruleModifier.face=down -> FACE_DOWN
ruleModifier.face=up   -> FACE_UP
```

Fresh reviewer recomputation confirms `master.araya.skill.ascension` now has:

```text
visibility=[FACE_DOWN]
requiredCapabilities includes GENERIC_VISIBILITY
classificationRoute=SPECIAL_HANDLER_CANDIDATE
inheritedAcceptanceContracts=[]
```

The repair is structural and contains no Araya identity literal.

## Fresh reviewer verification

```text
npm ci                                      PASS
npm run typecheck                           PASS
Phase 3 full-roster/reference suite         6 files / 79 tests PASS
fresh independent full-roster audit         EXACT_AGREEMENT / gapCount=0
independent development-source replay       2 / 2 PASS
full Araya group source-grounded probe      3 / 3 PASS
ARAYA-001 closure probe                     PASS
full reviewer CI (`npm run test:ci`)         84 files / 524 tests PASS
candidate production-runtime diff           NONE
generic identity-literal audit              PASS / 0 Araya literals
```

Recomputed full-roster state remains:

```text
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

## Semantic review

R independently confirmed the two development-text records and the already grounded third Araya identity. Death Complex remains a persistent location-bound terrain replacement capped at 5. Paradox Spiral remains controller-scoped for Magical Workshop classification, prevents opponents at Araya's location from leaving, and requires opponents' regular plays there to include a face-down attack. The face-state dependency is now represented explicitly rather than being hidden inside a play modifier.

No other blocking semantic mismatch was found.

## Acceptance

The repaired incremental F1 checkpoint is accepted:

```text
previous accepted checkpoint: 154 grounded / 790 blocked
new accepted checkpoint:      156 grounded / 788 blocked
delta:                         +2 grounded / -2 blocked
```

This is `156 / 944 = 16.53%` source-grounded readiness.

Acceptance does not promote F2/F3/F4, `READY_EXISTING_CONTRACT`, runtime implementation, migration acceptance, or full-roster closure. The two newly grounded Araya identities remain reviewed-special implementation work and 788 identities remain explicitly source-evidence blocked.
