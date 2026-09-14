# Phase 3 Full-Roster Independent Review — Chaos Source-Evidence R1

- Date: 2026-09-15
- Role: Codex R
- Scope: post-F1 source-evidence normalization review only; no runtime implementation and no repair
- Locked Reference: `fengling20011118-dotcom/fate-domination@b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- S candidate: `0ed2d4113e060c3fc41d08852a617e2e5c2eeedd`
- A audit: `1a6c44172cfa38974c6fe0e724f694f064054451`
- S PR: `#42`
- A PR: `#43`
- Overall verdict: `INTAKE_NEEDS_REVISION`

## Baseline judgment

The locked Reference checkout is clean at the exact required commit. The S candidate is an ancestor of the A audit. The candidate changes no files under `packages/` or `apps/`; no production runtime route or Gate is promoted.

Fresh reviewer verification before semantic inspection:

```text
npm ci                              PASS
npm run typecheck                   PASS
phase3 full-roster/reference tests  6 files / 50 tests PASS
Reference commit                    b2f9fa15fba07c63530bbf4612b03b8b704755f9
Reference worktree                  CLEAN
candidate production diff           NONE
```

The checked-in A audit reports `EXACT_AGREEMENT`, `gapCount=0`, `sourceGroundedCount=89`, `semanticBlockedCount=855`, and `contractMappedCount=89`. Those count checks are internally consistent, but they do not catch the capability-membership defects below.

The Fate/Domination Wiki source used by the candidate is the allowed page `https://fatedomination.fandom.com/wiki/Nrvnqsr_Chaos`. The page supports the candidate's two critical source corrections: The Breaker chooses X only from 1 through 3, and separate mana-gain events do not combine for The 666. The candidate also correctly keeps `master.chaos.skill.s17` blocked because the page does not enumerate the complete Scrambled Seals action-card options.

## Blocking findings

### F1-CHAOS-001 — `MOVE_MATCHING_CARDS` is not mapped to Card Zone

- Severity: blocking F1 capability-membership defect
- Ability: `master.chaos.skill.s16` (`The 999th`)
- Source-evidence record: `data/phase3/full-roster-source-evidence-overlays.json`, effect `move_matching_cards` around line 686
- Mapper: `scripts/phase3-reference/map-phase3-capabilities.ts`, `CARD_ZONE_EFFECTS` around lines 149-162 and membership test around line 460
- Generated record: `data/phase3/full-roster-ability-inventory.json` -> `master.chaos.skill.s16.phase3.requiredCapabilities`

The source-grounded effect explicitly moves every matching Beast from `beast_hand` to `beast_discard`, producing `discardedCount`. The semantic axes correctly contain `MOVE_MATCHING_CARDS`, but `CARD_ZONE_EFFECTS` omits that token. As a result, the generated capability list for s16 includes condition/modifier/power/result-binding/trigger dependencies but omits `GENERIC_CARD_ZONE`.

Impact: a later B/B2 capability request or migration can be dispatched without declaring the authoritative card-zone mutation needed to discard the Beast hand. That violates F1's requirement that capability membership follow semantic form and remain complete enough for dependency routing.

Minimum repair: include the source-grounded `MOVE_MATCHING_CARDS` semantic in Card Zone capability membership, add a focused mapping regression, regenerate FS04/FS05 artifacts, and have A recompute the burn-down/audit.

### F1-CHAOS-002 — explicit trigger suppression is dropped from capability membership

- Severity: blocking F1 capability-membership defect
- Ability: `master.chaos.skill.s3` (`The Devourer`)
- Source-evidence record: `data/phase3/full-roster-source-evidence-overlays.json`, `gain_mana.suppressTrigger` around line 198
- Mapper: `scripts/phase3-reference/map-phase3-capabilities.ts`; there is no handling for `suppressTrigger`
- Generated record: `data/phase3/full-roster-ability-inventory.json` -> `master.chaos.skill.s3.phase3.requiredCapabilities`

The source says the mana gained by The Devourer must not cause The 666 Beast draw. The overlay preserves that rule structurally as `suppressTrigger: "chaos.the-666.mana-gain-draw"`, but FS04 ignores the field. s3 therefore requests Resource/Card Zone/Interaction/Binding/Target capabilities but no Trigger Gateway dependency.

Impact: the source exception survives in the overlay JSON but is not represented in the capability dependency graph that controls later runtime work. A generic numeric-resource implementation could be selected without any accepted mechanism for suppressing this specific resulting trigger, silently losing printed behavior.

Minimum repair: classify an explicit `suppressTrigger` dependency under the existing `GENERIC_TRIGGER_GATEWAY` capability (or another already-authorized canonical family if A/S can prove it is the correct existing family), add a focused regression, regenerate FS04/FS05, and rerun A audit. Do not invent a new runtime primitive in the S repair.

## Non-blocking verified properties

- 17 overlay records use the allowed Fate/Domination Wiki domain.
- Every overlay record is bound to the exact locked Reference identity text by SHA-256.
- External evidence cannot shadow an existing locked Reference structured authoring card.
- `master.chaos.skill.s8` remains `SPECIAL_HANDLER_CANDIDATE` for the explicit Defeat effect.
- `master.chaos.skill.s17` remains `SOURCE_EVIDENCE_REQUIRED`.
- The source-evidence burn-down arithmetic `72 -> 89` grounded and `872 -> 855` blocked is count-consistent.
- No `READY_EXISTING_CONTRACT` promotion occurs.
- No runtime files are modified.

## Checkpoint result

- F0: inherited accepted identity/provenance baseline remains intact.
- Existing mainline F1 acceptance is not revoked by this rejected candidate.
- This Chaos source-evidence refresh: `INTAKE_NEEDS_REVISION`.
- Do not merge the S/A candidate stack or use its 17 newly grounded records as migration/runtime dispatch input until both F1 findings are repaired and independently re-reviewed.
