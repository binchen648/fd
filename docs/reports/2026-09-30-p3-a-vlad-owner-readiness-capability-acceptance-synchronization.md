# P3-A Vlad Owner Readiness Capability Acceptance Synchronization

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-30

## Accepted input

- PR: `#497`
- Exact Base: `896911354f9833b8437f5f9a231eeba81e8d1584`
- Exact accepted Candidate: `0b93b10e62eb793a3e04aeff163a92ce7e3cc2a8`
- Canonical fresh-R evidence: `https://github.com/binchen648/fd/pull/497#issuecomment-5910603956`
- Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- ReviewJobKey: `pr497:0b93b10e62eb793a3e04aeff163a92ce7e3cc2a8`
- Exact-Candidate Phase 3 Pre-Review Gate: run `36710215605` / job `109869949685` — `SUCCESS`

The transported Reviewer terminal envelope carried the predecessor evidence URL by mistake. FORMAL mechanically rejected that stale reference, then published one bounded same-attempt correction relay for the already-completed successor review. No duplicate exact-Candidate review was performed.

## Accepted readiness scope

The accepted zero-credit readiness transaction closes the complete currently discoverable Vlad owner readiness/capability batch for frozen scope:

1. `servant.vlad.skill.sc-vlad-1` — positive-terrain action doubling plus moved-in battlefield fortification, round-local `-4` total-Power adjustment, authoritative battle-result win binding, and exact next-round forced deployment through ordinary deployment legality/reward/event authority;
2. `servant.vlad.skill.sc-vlad-2` — normal first hand effect-play plus terrain-gated optional second physical hand card, with normal play pipeline semantics and transactionally preflighted natural costs plus exact extra `2` mana;
3. `servant.vlad.skill.sc-vlad-3` — existing canonical automatic movement to any enabled location except Magic Workshop, preserved unchanged.

The accepted successor also closes the predecessor P1 by making real `MatchSession.startRound()` carry `previousRound` into `advanceAbilityPhase`, retiring stale `roundPlayerPowerAdjustments` and `pendingBattlefieldFortifications` while preserving legitimate `forcedDeploymentLocations` into the exact next round.

## Full-owner A-rescan

FORMAL mechanically re-read the frozen owner scope, current canonical authoring, accepted readiness Candidate, Task Index, and repository-wide `data/authoring/**` identities after acceptance.

- frozen Vlad owner scope is exactly sc1 + sc2 + sc3;
- canonical `data/authoring/servants/servant.vlad.json` exists and currently contains only `servant.vlad.skill.sc-vlad-3`;
- repository-wide `data/authoring/**` rescan finds no canonical `servant.vlad.skill.sc-vlad-1` or `servant.vlad.skill.sc-vlad-2` identity;
- sc3 therefore remains preservation-only and receives no duplicate migration credit;
- sc1 and sc2 remain the only newly creditable frozen Vlad identities for the later formal owner-complete migration;
- accepted readiness now covers the complete currently discoverable owner-local runtime pressure set for sc1/sc2: positive-terrain gating, round-local terrain multiplier, authoritative movement-entry tracking, total-Power adjustment, battlefield win provenance, exact next-round forced deployment, ordinary legality/reward/event preservation, two-card hand effect-play, aggregate mana preflight, and restore fail-closed boundaries;
- production runtime remains structural and identity-free; no Vlad/card-name/printed-text/legacy-handler routing is introduced;
- no additional currently discoverable Vlad owner-local readiness gap is discovered by this post-acceptance rescan.

Therefore the next legal FORMAL task remains on the same owner: one owner-complete Vlad consumer migration covering frozen sc1 + sc2 + sc3 together, with sc1/sc2 newly creditable and sc3 preservation-only.

## Verification / accounting

Accepted successor evidence remains:

- Vlad readiness focused `13/13 PASS`;
- complex-skills regression `38/38 PASS`;
- MatchSession regression `33/33 PASS`;
- generic MatchSession regressions `11/11 PASS`;
- affected total `95/95 PASS`;
- `FD_TOOLCHAIN_OK`;
- typecheck PASS;
- content validate/compile PASS: `7 masters / 16 servants / 20 events / 0 blocking issues`;
- generated-content determinism PASS;
- `data/authoring/**` Base..Candidate delta EMPTY;
- production identity audit CLEAN;
- `git diff --check` PASS.

Readiness remains permanently zero-credit. Strict formal accounting remains **`164/944`**, remaining **`780`**.

## Next task

`P3-S-OWNER-VLAD-COMPLETE-MIGRATION`

Formal owner scope is the exact frozen sc1 + sc2 + sc3 set. Only sc1 + sc2 are newly creditable after exact formal `MIGRATION_ACCEPTED` plus A-sync/accounting. sc3 remains preservation-only and contributes `+0`.
