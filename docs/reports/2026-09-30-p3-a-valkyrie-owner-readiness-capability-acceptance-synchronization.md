# P3-A Valkyrie Owner Readiness Capability Acceptance Synchronization

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-30

## Accepted input

- PR: `#495`
- Exact Base: `d7dc60c4f51f28651494d2f39677037803287280`
- Exact accepted Candidate: `6352b1fcfca193cb2c4dfefa9481cecfd4acabcf`
- Canonical fresh-R evidence: `https://github.com/binchen648/fd/pull/495#issuecomment-5907322400`
- Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- ReviewJobKey: `pr495:6352b1fcfca193cb2c4dfefa9481cecfd4acabcf`
- Exact-Candidate Phase 3 Pre-Review Gate: run `36689318682` / job `109802495094` — `SUCCESS`

Reviewer-side GitHub publication returned explicit 403, so Coordinator published one bounded same-attempt relay. No duplicate exact-Candidate review is used.

## Accepted readiness scope

The accepted zero-credit readiness transaction closes the complete currently discoverable Valkyrie owner readiness/capability batch for:

1. `servant.valkyrie.skill.sc-valkyrie-1` — exact definition-set relocation to independently selected hand/attack destinations without ordinary card-play triggers/counters, with per-game usage and decision provenance authority;
2. `servant.valkyrie.skill.sc-valkyrie-2` — existing one-arrow movement authority in action/combat plus current-cost Steel Shield recall/source-join without normal play semantics;
3. `servant.valkyrie.skill.sc-valkyrie-3` — exact active definition-set count plus source-grounded `retrigger_card_play_effects` on current live matching physical cards without replay/play-count mutation.

The accepted Candidate keeps privileged runtime identity-free and changes no `data/authoring/**` file.

## Full-owner A-rescan

FORMAL mechanically re-read the frozen owner scope, current canonical authoring, accepted readiness Candidate and Task Index after review acceptance.

- frozen Valkyrie owner scope is exactly sc1 + sc2 + sc3;
- no canonical `data/authoring/servants/servant.valkyrie.json` exists at the accepted Candidate;
- repository-wide `data/authoring/**` search finds no `sc-valkyrie-*` identity;
- therefore sc1, sc2 and sc3 all remain absent from canonical authoring and all three are newly creditable frozen identities for the later formal owner-complete migration;
- accepted readiness covers the complete currently discoverable owner-local runtime pressure set for all three skills: independent definition-set relocation, per-game/restore authority, existing directed one-arrow movement legality, current-cost recall/source-join with no-play semantics, exact active definition-set count, and on-play retrigger without replay/play-count mutation;
- the accepted capability gateway remains structural/fail-closed and production runtime contains no Valkyrie/card-name/printed-text/legacy-handler routing;
- no additional currently discoverable Valkyrie owner-local readiness gap is discovered by this post-acceptance rescan.

Therefore the next legal FORMAL task is one owner-complete Valkyrie consumer migration that adds sc1 + sc2 + sc3 together in one owner archive / one Candidate / one PR / one fresh independent R / one A-sync-accounting transaction.

## Verification / accounting

Accepted Candidate evidence remains:

- Valkyrie readiness focused `10/10 PASS`;
- complex-skills regression `38/38 PASS`;
- MatchSession regression `33/33 PASS`;
- generic MatchSession regressions `11/11 PASS`;
- affected total `92/92 PASS`;
- `FD_TOOLCHAIN_OK`;
- typecheck PASS;
- content validate/compile PASS: `7 masters / 15 servants / 20 events / 0 blocking issues`;
- generated-content determinism PASS;
- `data/authoring/**` Base..Candidate delta EMPTY;
- production identity audit CLEAN;
- `git diff --check` PASS.

Readiness remains permanently zero-credit. Strict formal accounting remains **`161/944`**, remaining **`783`**.

## Next task

`P3-S-OWNER-VALKYRIE-COMPLETE-MIGRATION`

Formal owner scope is the exact frozen sc1 + sc2 + sc3 set. All three are newly creditable only after the exact formal Candidate receives `MIGRATION_ACCEPTED` and subsequent A-sync/accounting completes.
