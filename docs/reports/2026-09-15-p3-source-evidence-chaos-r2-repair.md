# Phase 3 Full-Roster Source Evidence — Chaos R2 Mapping Repair

- Date: 2026-09-15
- Role: Codex S
- Parent candidate: `0ed2d4113e060c3fc41d08852a617e2e5c2eeedd`
- R1 review: `485a78ebf80d3aea02f34f8bcbbe3279ed1e21d2`
- Locked Reference: `fengling20011118-dotcom/fate-domination@b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: capability-membership repair only; no runtime implementation, Gate promotion, or new source-evidence identities
- Candidate status: `SOURCE_EVIDENCE_NORMALIZATION_CANDIDATE_R2`

## R1 findings repaired

### F1-CHAOS-001 — matching-card zone mutation

`master.chaos.skill.s16` (`The 999th`) already carried source-grounded `MOVE_MATCHING_CARDS` semantics, but FS04 did not classify that effect as a Card Zone dependency.

R2 adds `MOVE_MATCHING_CARDS` to the existing `CARD_ZONE_EFFECTS` membership set. Regeneration now gives s16 `GENERIC_CARD_ZONE` in addition to its existing condition/modifier/power/result-binding/trigger dependencies.

No card/ability ID branch is introduced; the mapping applies structurally to every ability with the same effect token.

### F1-CHAOS-002 — trigger suppression dependency

`master.chaos.skill.s3` (`The Devourer`) already preserved the source exception `suppressTrigger: chaos.the-666.mana-gain-draw`, but FS04 did not turn that explicit exception into a capability dependency.

R2 maps any non-empty structured `suppressTrigger` field to the existing `GENERIC_TRIGGER_GATEWAY` capability. Regeneration now gives s3 `GENERIC_TRIGGER_GATEWAY` without defining or changing runtime suppression behavior.

The rule remains a dependency declaration only. Any runtime implementation still requires the normal B/B2 acceptance route.

## Generated-state judgment

The source-evidence population and burn-down counts are unchanged from R1:

```text
sourceGroundedCount=89
blockedCount=855
contractMappedCount=89
explicitBlockCount=855
READY_EXISTING_CONTRACT=0
READY_GENERIC_EXTENSION=82
SPECIAL_HANDLER_CANDIDATE=7
SOURCE_EVIDENCE_REQUIRED=855
runtimeRequestCount=23
runtimeRequestAffectedIdentityCount=89
```

Only capability membership and the derived runtime-request membership/source lists change. `master.chaos.skill.s17` remains `SOURCE_EVIDENCE_REQUIRED`, and `master.chaos.skill.s8` remains a reviewed-special Defeat candidate.

## Verification

```text
npm ci                                                        PASS
npm run typecheck                                             PASS
phase3 reference/full-roster focused suite                    6 files / 50 tests PASS
git diff --check                                              PASS
production paths under packages/ or apps/                     NONE
master.chaos.skill.s3 requires GENERIC_TRIGGER_GATEWAY         YES
master.chaos.skill.s16 requires GENERIC_CARD_ZONE              YES
```

A dedicated structural regression also verifies a synthetic ability containing `move_matching_cards` plus a non-empty `suppressTrigger` receives Card Zone, Resource Numeric, and Trigger Gateway dependencies without identity routing.

## Non-promotion

R2 does not promote F2, F3, F4, `READY_EXISTING_CONTRACT`, any runtime capability, any migration, or Phase 3 closure. It only repairs the F1 capability dependency graph for the already source-grounded Chaos evidence slice.
