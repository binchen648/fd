# P3-A Tristan Owner Readiness Capability Acceptance Synchronization

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-30

## Accepted input

- PR: `#490`
- Exact Base: `f067d70514a702327d24b94d9bc1327eb3ae7881`
- Exact accepted Candidate: `5fb8f59539c17bc868e00d628d50ee5f05bf9812`
- Canonical fresh-R evidence: `https://github.com/binchen648/fd/pull/490#issuecomment-5903982665`
- Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- ReviewJobKey: `pr490:5fb8f59539c17bc868e00d628d50ee5f05bf9812:blocked-retry-munld2gi`
- Exact-Candidate Phase 3 Pre-Review Gate: run `36666587166` / job `109732446443` — `SUCCESS`

The first attempt on the same exact Candidate returned transport-only `MIGRATION_BLOCKED` because the fixed Reviewer could not fetch the Candidate through direct GitHub transport. Coordinator published the same-attempt blocker relay at `https://github.com/binchen648/fd/pull/490#issuecomment-5903923637`, repaired only the fixed Reviewer repo-local proxy, fetched the unchanged Candidate, and requested one new fresh Reviewer attempt with the required blocked-retry key. The successful review remained on the same exact Candidate; no successor Candidate was manufactured for the transport failure.

Reviewer-side GitHub publication for the successful attempt returned explicit 403, so Coordinator published one bounded same-attempt relay. No duplicate exact-Candidate review is used.

## Accepted readiness scope

The accepted zero-credit readiness transaction closes the complete currently discoverable Tristan owner readiness/capability batch for:

1. `servant.tristan.skill.sc-tristan-1` — exact combat duplicate-base-Power close family with top-three deck discard fallback;
2. `servant.tristan.skill.sc-tristan-2` — authenticated discard-to-deck selection, deterministic shuffle, physical-source X/base-Power binding and location-based battle upkeep;
3. `servant.tristan.skill.sc-tristan-3` — preservation-only accepted FM04 Independent Action member; no duplicate migration credit.

The accepted successor specifically closes the final predecessor documentation drift: canonical battle participation is location-based, so an active controller at the battlefield participates and pays sc2 upkeep even with zero active attacks. Runtime and tests already implemented that contract; the successor aligned the exact-task report and Task Index without changing runtime or authoring.

## Full-owner A-rescan

FORMAL mechanically re-read the frozen owner scope, current canonical authoring, and accepted migration history after readiness acceptance.

- frozen Tristan owner scope is exactly sc1 + sc2 + sc3;
- current `data/authoring/servants/servant.tristan.json` contains exactly the already-migrated `servant.tristan.skill.sc-tristan-3` identity from FM04;
- `servant.tristan.skill.sc-tristan-1` and `servant.tristan.skill.sc-tristan-2` remain absent from canonical authoring;
- accepted FM04/R32 migration history explicitly added Tristan sc3 as one of the ten non-Tomoe Independent Action siblings and counted that family migration already;
- therefore sc3 is preservation-only / already accounted and must not be credited again;
- sc1 and sc2 are the only newly creditable frozen Tristan identities remaining;
- the accepted readiness family covers every currently discoverable runtime seam required by sc1 and sc2, while sc3 continues to use its previously accepted Independent Action / battle-loss VP semantics;
- no additional Tristan owner-local readiness gap is discovered by the post-acceptance rescan.

Therefore the next legal FORMAL task is one owner-complete Tristan consumer migration that preserves sc3 and adds sc1 + sc2 together in the existing owner archive.

## Verification / accounting

Accepted Candidate evidence remains:

- Tristan readiness focused `11/11 PASS`;
- complex-skills regression `38/38 PASS`;
- MatchSession regression `33/33 PASS`;
- affected total `3 files / 82 tests PASS`;
- `FD_TOOLCHAIN_OK`;
- typecheck PASS;
- content validate/compile PASS: `7 masters / 13 servants / 20 events / 0 blocking issues`;
- generated-content determinism PASS;
- `data/authoring/**` Base..Candidate delta EMPTY;
- production identity audit CLEAN;
- `git diff --check` PASS.

Readiness remains permanently zero-credit. Strict formal accounting remains **`157/944`**, remaining **`787`**.

## Next task

`P3-S-OWNER-TRISTAN-COMPLETE-MIGRATION`

Formal owner scope remains the exact frozen sc1 + sc2 + sc3 set in one Candidate / one PR / one fresh independent R / one A-sync-accounting transaction, but only sc1 + sc2 are newly creditable. sc3 is preservation-only and may not be double-counted.
