# Anastasia SC1 scoped Candidate report

- Date: 2026-10-22
- Role: Builder Candidate
- Strict repository: `https://github.com/binchen648/fd.git`
- Exact base: `5e2b9317238f10de7f7a838f8b57df2773687a7a`
- Owner: `servant.anastasia`
- Candidate scope: `servant.anastasia.skill.sc-anastasia-1` only
- Independent decision: `CONTRACT_ACCEPTED_FOR_SCOPED_SUBSET`
- Independent decision commit: `91773f5a5c7cfb0a1237c7c0b9a6c8df010449ce`
- Formal decision docs commit: `e38fd3f` (separate docs-only worktree; not merged into this exact-base Candidate)
- Owner credit: `0`
- Owner unlock: `false`
- Candidate status: docs-only scoped contract record; pending independent Candidate Reviewer

## Included scope

This Candidate records exactly the already accepted FM05 Territory Creation envelope for Anastasia SC1:

1. Frozen two-clause source identity, canonical/legacy IDs, exact printed text, full-text SHA-256, clause SHA-256 values, and source locators.
2. R33/FB2-11 round formula: `add(16, multiply(-2, game.round_number))` from authoritative round state.
3. R19/FB2-02 deployment reward: forced `after_player_deployed_to_battlefield` at `magic_workshop`, source-controller scope, typed `+1 mana` and `+2 VP` adjustments.
4. R34/FM05 exact ten-card Territory Creation migration membership, with Anastasia SC1 as one member. This Candidate adds no other identity.

Reference `core.territory-creation` is provenance only. Historical Reference `basePower=2` and `legacyRequirement=0` remain evidence metadata; canonical skill-zone play remains the existing final-rule 8-mana requirement.

## Explicit exclusions and preserved conflict

- SC2 and SC3 remain `SOURCE_EVIDENCE_REQUIRED` / `SEMANTIC_SOURCE_REQUIRED` / `EXPLICIT_BLOCK`.
- The owner remains blocked and `ownerCredit=0`; SC1 does not unlock the owner.
- The frozen inventory's `currentRoute=none`, empty inherited/partial contracts, `mappingStatus=EXPLICIT_BLOCK`, and `hasAuthoringCard=false` are preserved. This Candidate does not reconcile or rewrite those fields.
- No runtime, executable, playable, handler, authoring, pack, generated-content, roster, restore/replay/reconnect, or frozen-inventory mutation is included.
- No Candidate PR is created or pushed from this worktree; independent Candidate Reviewer approval is required first.

## Boundary checks

- Candidate JSON parses and reports exactly one included skill plus two excluded skills.
- SC1 full-text SHA recomputes to `295a5b531db5d1031cbbb89dc677e76737b7d3b3c7ca70af59405cc84bd98c58`.
- Candidate source/clause hashes match the frozen inventory.
- Base ancestry is exact `5e2b9317238f10de7f7a838f8b57df2773687a7a`.
- `git diff --check`: PASS.
- Runtime/content/generated suites: not rerun; this Candidate is docs-only and deliberately does not alter executable or generated surfaces. Existing FM05/R33/FB2-02/R34 evidence remains the acceptance basis.
