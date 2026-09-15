# Phase 3 Full-Roster Source Evidence — Goredolf + Peperoncino R1

- Date: 2026-09-15
- Role: Codex S
- Parent accepted S checkpoint: `1c4f4552130d01361b5acf6543377bb2cdbd6939`
- Locked Reference: `fengling20011118-dotcom/fate-domination@b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: source-evidence normalization for Goredolf 3 + Peperoncino 7 identities only; no runtime implementation or Gate promotion
- Candidate status: `SOURCE_EVIDENCE_NORMALIZATION_CANDIDATE`

## Source replay

All ten identities bind exactly to `Fate_Domination-开发版/data_masters.js`:

```text
records=10
source file SHA=c596af5730846ef9092375f18c4200b84f032028dc2e8f5483377d8ddcc22825
whole-file SHA mismatch=0
locator/sourceText mismatch=0
sourceText SHA mismatch=0
Reference printedText mismatch=0
Reference printedText SHA mismatch=0
```

The slice contains:

```text
Goredolf       3 identities
Peperoncino    7 identities
total         10 identities
structured semantic abilities added: 33
```

## Semantic decomposition

Goredolf:

- `s1` keeps the printed highest-two-basic deck replacement as a reviewed special transform while exposing Card Zone, printed-power ordering, and game-start trigger dependencies.
- `s1a` exposes Outpost timing, +2 total power, battlefield deployment requirement, own-turn movement prohibition, one round-scoped loss penalty after Fool's Resolve, and Goff Iron Fist combat-play permission.
- `ascension` exposes the permanent Goff Iron Fist +6 modifier plus combat-result / Fool's Resolve / winner-gated loser VP penalty.

Peperoncino:

- `s1` remains reviewed-special Lostbelt ownership.
- `s1a` exposes opponent-discard inspection through a structural visibility axis.
- `s1b` exposes Action timing, 2-mana payment, +3 total power and required-if-possible one-step arrow movement.
- `s2` exposes expansion provenance, post-combat event cleanup and this-round expanded-event discard -> permanent India size increase.
- `s3` exposes Preparation timing, first battlefield entry per round, round-end no-expansion event choice/removal, era definitions and Judgment size thresholds/selection.
- `s4` exposes non-expansion entry handling, conditional from-hand attack bonuses, Divine Sky Boulder choices/timing, Fading Town deployment/movement semantics, both Withering Plain triggers and Ocean of Milk Action-end defeat semantics.
- `ascension` exposes opponent India-event immunity, Shunyata event selection/removal + mana/power reward, and 7-mana permanent size increase.

No Goredolf or Peperoncino identity literal was added to the generic normalizer or capability mapper.

## Generic machinery extensions

Two identity-free extensions were required:

1. `visibility.inspectZones[]` is normalized into explicit visibility axes, allowing `opponent_discard` inspection to request `GENERIC_VISIBILITY`.
2. structural `deployment_requirement` modifiers request `GENERIC_MOVEMENT`, alongside existing movement rules.

Structured transforms also now expose `GENERIC_CARD_ZONE`, and power-ordered transform selections expose `GENERIC_POWER`, while remaining blocked by `REVIEWED_SPECIAL_TRANSFORM`.

## Candidate totals

```text
totalIdentityCount=944
sourceGroundedCount=152
semanticBlockedCount=792
structuredAbilityCount=283
contractMappedCount=152
explicitBlockCount=792
READY_EXISTING_CONTRACT=0
READY_GENERIC_EXTENSION=100
SPECIAL_HANDLER_CANDIDATE=52
SOURCE_EVIDENCE_REQUIRED=792
zeroSilentFallback=true
```

This batch contributes exactly:

```text
+10 source-grounded identities
-10 source-evidence-blocked identities
+4 READY_GENERIC_EXTENSION
+6 SPECIAL_HANDLER_CANDIDATE
```

All ten identities have zero inherited runtime acceptance contracts.

## Verification

```text
FS03 / FS04 / FS05 regeneration                 PASS
npm run typecheck                               PASS
Phase 3 Reference/full-roster suite             6 files / 70 tests PASS
independent development-source replay           10 / 10 PASS
slice classification replay                     4 generic / 6 special PASS
inherited acceptance contracts                  0 / 10
normalizer/mapper identity literal audit         PASS (none)
production diff under packages/, apps/, src/    NONE
git diff --check                                PASS
```

## Non-promotion

This candidate grounds source semantics only. It does not implement Goredolf or Peperoncino runtime behavior and does not promote F2, F3, F4, `READY_EXISTING_CONTRACT`, migration acceptance, or full-roster closure. A must independently recompute the candidate and fresh R must accept it before `152 / 792` becomes the accepted F1 checkpoint.
