# P3-A R76 FB2-36 Acceptance Synchronization

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-20

## Accepted capability input

- Formal verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- Canonical reviewer evidence: `https://github.com/binchen648/fd/pull/382#issuecomment-5745209825`
- Exact A dispatch Base: `d888684dabdd76504d581f29e7bca6d397514252`
- Accepted B2 Candidate: `22731b5be697825bd6bfbc09faea3c333eb629b6`
- PR: `#382`
- Task: `P3-FB2-36-SKILL-USE-FORBID-SELECTORS`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## A synchronization checks

A mechanically rechecked:

- this synchronization worktree starts at exact accepted Candidate `22731b5be697825bd6bfbc09faea3c333eb629b6`;
- PR #382 remains OPEN / MERGEABLE / non-draft with exact Base `d888684dabdd76504d581f29e7bca6d397514252` and exact Head `22731b5be697825bd6bfbc09faea3c333eb629b6`;
- canonical fresh independent R evidence `5745209825` binds that exact Base/Candidate pair and returns `IMPLEMENTATION_ACCEPTED_CANDIDATE` with no blocking findings;
- accepted runtime capability is limited to two identity-free `skill_use / forbid` structural selector families: same-location true-name skill use outside attack while the source is active, and same-location opponent face-down master/servant skill-zone use for the active round;
- loader admission remains fail-closed to those exact structural shapes instead of adding `skill_use` to a generic rule whitelist;
- runtime enforcement converges on authoritative card-play eligibility for ordinary and trusted effect plays, while generic `activate_ability` forbid routing remains out of scope;
- production routing adds no consumer identity/name/definition-ID/printed-text/F1 hash/Locked-Reference hash/Reference-handler dispatch;
- fresh reviewer validation at the exact Candidate passed typecheck, focused 7/7, rules core+regression 83 files / 501 tests, official CI 151 files / 1059 tests, content validation with 0 blockers, generated determinism, exact Locked Reference verification, client production build, diff-check, adversarial classifier probes, and production hardcode audit;
- Candidate and reviewer worktrees were clean at the exact Candidate, and Locked Reference was clean at its locked commit.

## Formal accounting after synchronization

Project formal migration accepted remains **`137/944`**, with **`807`** remaining.

FB2-36 is runtime capability infrastructure and earns **zero migration credit**. No consumer identity is credited by this synchronization. Historical `P3-FM09-RECOVERY` remains `MIGRATION_BLOCKED`.

PR #382 remains OPEN, unmerged, and unretargeted.

## Next coordinator action

Migration-closure-first requires an immediate dependency re-overlay. The read-only post-implementation readiness probe already showed the two intended consumers can normalize to `report: []` / automatic behavior on the accepted capability. Dispatch the nearest homogeneous S migration target before any unrelated B2 seam; do not batch semantically non-homogeneous consumers merely because they share this runtime capability.
