# P3-A Tomoe Owner Readiness Capability Acceptance Synchronization

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-30

## Accepted input

- PR: `#489`
- Exact Base: `973719b7c0c29a1ff74462eaf5c2cf08e5160e5b`
- Exact accepted Candidate: `f932f3f825eb8258771808a3671054b4931b158c`
- Canonical fresh-R evidence: `https://github.com/binchen648/fd/pull/489#issuecomment-5902818985`
- Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- ReviewJobKey: `pr489:f932f3f825eb8258771808a3671054b4931b158c`
- Exact-Candidate Phase 3 Pre-Review Gate: run `36659186727` / job `109709936248` — `SUCCESS`

Reviewer-side GitHub publication returned explicit 403, so Coordinator published one bounded same-attempt relay. No duplicate exact-Candidate review is used.

## Accepted readiness scope

The accepted zero-credit readiness transaction closes the complete currently discoverable Tomoe owner readiness/capability batch for:

1. `servant.tomoe.skill.sc-tomoe-1`;
2. `servant.tomoe.skill.sc-tomoe-2`;
3. `servant.tomoe.skill.sc-tomoe-3`.

The accepted successor specifically closes the predecessor zero-VP boundary: an affected deployment at current VP 0 still opens the mandatory private `deployment_terrain_vp_choice_v1` interaction with exact candidate `['vp:0']`; deployment remains paused before location mutation until that choice resolves, then completes with zero VP paid and no positive terrain slot.

## Full-owner A-rescan

FORMAL mechanically re-read the frozen owner scope, canonical authoring history, and accepted F4 migration history after readiness acceptance.

- frozen Tomoe owner scope is exactly sc1 + sc2 + sc3;
- `data/authoring/servants/servant.tomoe.json` exists from repository initial canonical lineage commit `1dc61966f6b0bb98b0e0b44326141b7c0a7cd4ba` and that first version already contains all three exact frozen identities: `sc-tomoe-1`, `sc-tomoe-2`, and `sc-tomoe-3`;
- the exact pre-FM04 dispatch baseline `a3f7e7d56d6e4bb5af9bf5ae68d89e534ea7df96` still contains all three Tomoe identities unchanged;
- A's accepted FM04 synchronization independently recomputed frozen-F1 canonical overlap as `59/944` before FM04 and `69/944` after FM04, with net `+10` coming only from the ten newly added non-Tomoe Independent Action siblings; Tomoe remained canonical with zero diff;
- R32 independently confirmed Tomoe was the sole pre-existing member of the eleven-member Independent Action family and FM04 added exactly ten siblings, not Tomoe;
- B21/R15 separately accepted the Tomoe sc1 defeat-penalty runtime family, but did not add or newly migrate Tomoe authoring;
- therefore all three Tomoe card identities are pre-existing canonical members already contained in the strict canonical/F1 overlap before later F4 migration batches. None is newly creditable now.

Post-acceptance readiness rescan finds no additional Tomoe owner-local runtime gap beyond the accepted PR #489 family. The HELPER Epoch 24 note about generic `remove_advantage_position` not clearing explicit `terrainAssignmentSlots` is retained as a generic shared-runtime follow-up observation, but current authoring has no direct consumer and the completed fresh R found no exact Tomoe-scope blocker; it does not create Tomoe migration credit or reopen the accepted readiness transaction.

## Accounting result

Tomoe readiness remains permanently zero-credit, and Tomoe requires **no new formal owner-complete migration Candidate** because all three frozen Tomoe identities are preservation-only / already accounted canonical identities.

Strict formal accounting therefore remains **`157/944`**, remaining **`787`**. Creating a Tomoe `+3` migration transaction would double-count already canonical frozen identities and is prohibited.

## Mechanical next owner

Stable frozen first-occurrence order places `servant.tristan` immediately after `servant.tomoe`. Frozen Tristan scope is exactly:

1. `servant.tristan.skill.sc-tristan-1`;
2. `servant.tristan.skill.sc-tristan-2`;
3. `servant.tristan.skill.sc-tristan-3`.

Current capability catalog shows all three as non-canonical (`none`) at the historical catalog point, so the next FORMAL step is owner-readiness-first for `servant.tristan`; readiness remains zero-credit and must complete before any owner-complete migration accounting.

## Next task

`P3-B-TRISTAN-OWNER-READINESS-CAPABILITY`

One owner, all remaining frozen skills, one readiness Candidate/PR/fresh R/A-sync-rescan. No Tomoe migration PR is dispatched.
