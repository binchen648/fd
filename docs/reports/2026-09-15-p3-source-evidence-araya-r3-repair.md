# Phase 3 Full-Roster Source Evidence — Araya R3 Repair

- Date: 2026-09-15
- Role: Codex S
- Parent S R2: `c8866d8f316498bd0a4e4cb201c2517dc62420b9`
- Accepted parent checkpoint before Araya: `254104eefd7ad5451e5928ac67141b9c04213c42`
- Locked Reference: `fengling20011118-dotcom/fate-domination@b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: capability-membership repair only; no runtime implementation, migration, or new source-evidence identities
- Candidate status: `SOURCE_EVIDENCE_NORMALIZATION_CANDIDATE_R3`

## R3 repair

R2 already repaired the face-down attack requirement so `card_play_requirement` contributes `GENERIC_VISIBILITY` in addition to Card Action Play.

R3 repairs the remaining structural dependency on `master.araya.skill.s1`: the printed rule triggers when the controller **deploys** at a terrain location, so its capability graph must declare the Movement/deployment domain rather than exposing deployment only as trigger/condition tokens.

The generic capability mapper now treats deployment semantics found in either normalized trigger or condition axes as requiring `GENERIC_MOVEMENT`. This is structural and identity-free; no Araya/card/ability literal is introduced into generic machinery.

The generated Araya Death Complex dependency set is now:

```text
GENERIC_CONDITION_EVALUATION
GENERIC_LIFECYCLE_POLICY
GENERIC_MOVEMENT
GENERIC_TRIGGER_GATEWAY
REVIEWED_SPECIAL_HANDLER
```

The effect remains reviewed-special through `SPECIAL_EFFECT:terrain_position_adjustment` and retains zero inherited acceptance contracts.

## Generated state

Population and classification counts are unchanged from R1/R2:

```text
totalIdentityCount=944
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
capabilityCount=32
runtimeRequestCount=23
```

The full Araya group remains source-grounded 3 / 3:

```text
master.araya.skill.s1         SPECIAL_HANDLER_CANDIDATE
master.araya.skill.s1a        READY_GENERIC_EXTENSION
master.araya.skill.ascension  SPECIAL_HANDLER_CANDIDATE
```

All three retain zero inherited acceptance contracts.

## Verification

```text
npm ci                                                        PASS
npm run typecheck                                             PASS
focused capability suite                                      1 file / 26 tests PASS
Phase 3 full-roster/reference suite                           6 files / 80 tests PASS
independent development-source replay                         2 / 2 PASS
full Araya group source-grounded probe                        3 / 3 PASS
independent full-roster automation audit                      EXACT_AGREEMENT / gapCount=0
final npm run test:ci                                         84 files / 525 tests PASS
generic machinery Araya identity-literal audit                PASS / 0 matches
production-runtime diff under packages/, apps/, src/          NONE
git diff --check                                              PASS before freeze
```

## Non-promotion

R3 does not promote F2, F3, F4, `READY_EXISTING_CONTRACT`, runtime capability acceptance, migration acceptance, or full-roster closure. It only repairs the F1 dependency graph for the already source-grounded Araya slice.
