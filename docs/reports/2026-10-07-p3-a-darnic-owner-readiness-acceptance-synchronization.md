# P3-A Darnic Owner Readiness Acceptance Synchronization

Date: 2026-10-07
Task: `P3-B-DARNIC-OWNER-READINESS-CAPABILITY`
Classification: zero-credit readiness acceptance synchronization/rescan

## Exact accepted review

- PR: `#540`
- Base: `765e88d8390ef6671faa4f9511b10853df8fd99e`
- Accepted Candidate: `1b006a2ecd1142ad9503ae3546fb9d475b5e7c9e`
- Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- ReviewJobKey: `pr540:1b006a2ecd1142ad9503ae3546fb9d475b5e7c9e`
- Canonical evidence: `https://github.com/binchen648/fd/pull/540#issuecomment-6026259334`
- Exact-head Phase 3 Pre-Review Gate: run `37536469649` = `SUCCESS`.
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.

## Mechanical rescan

The accepted Candidate changes no `data/authoring/**` consumer file and remains permanently zero-credit. Canonical Darnic stays `0/3`.

All three frozen identities now have accepted identity-free runtime routes:

- `s1` 领地: current-location unclaimed printed battlefield terrain contributes through the shared terrain/deployment/combat authority while respecting explicit terrain slots and accepted multi-presence reservations;
- `s1a` 噬魂者: existing generic optional post-win response can set controller mana exactly to `4`, while round end with mana <=2 applies the exact `-2 VP` forced branch;
- `ascension` 老相识: 焦土作战 has accepted same-battlefield opponent action-turn upkeep at exact `2 VP` or terrain release, and 空中支援 reuses the accepted `double_controller_terrain_this_round` primitive including the required zero-cost owned Master-skill activation surface.

Fresh review independently confirmed exact Base/Candidate lineage, locked Reference behavior, identity-free runtime authority, preserved explicit terrain-slot ownership on revocation, restore-compatible player/round idempotence, and the affected shared regressions.

Independent exact-Candidate verification passed Darnic `8/8`, affected `134/134`, typecheck, content validation, generated determinism, `git diff --check`, and the exact-head GitHub pre-review gate. Source-assets still reproduces exactly `93` pre-existing missing image issues with no Darnic hit.

No new undiscovered owner-local runtime gap remains after the complete-owner rescan. Production runtime remains free of Darnic identity/name routing.

Accounting remains exactly `250/944`, remaining `694`.

## Release

The next legal FORMAL transaction is `P3-S-OWNER-DARNIC-COMPLETE-MIGRATION`, materializing exactly all three frozen Darnic identities in one Candidate. No migration credit is authorized until that exact Candidate receives fresh `MIGRATION_ACCEPTED`.
