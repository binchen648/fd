# P3-A R79 FB2-37 Acceptance Synchronization

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-20

## Accepted capability input

- Formal verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- Canonical reviewer evidence: `https://github.com/binchen648/fd/pull/385#issuecomment-5745681302`
- Exact A dispatch Base: `17deda33289c1f9467cda439109f2bbaf325d772`
- Accepted B2 Candidate: `36ed05d64c5f6c18b947789d018f461283f533e3`
- PR: `#385`
- Task: `P3-FB2-37-DEPLOYMENT-DESTINATIONS`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## A synchronization checks

A mechanically rechecked:

- this synchronization worktree starts at exact accepted Candidate `36ed05d64c5f6c18b947789d018f461283f533e3`;
- PR #385 remains OPEN / MERGEABLE / non-draft with exact Base `17deda33289c1f9467cda439109f2bbaf325d772` and exact Head `36ed05d64c5f6c18b947789d018f461283f533e3`;
- canonical fresh independent R evidence `5745681302` binds that exact Base/Candidate pair and returns `IMPLEMENTATION_ACCEPTED_CANDIDATE` with no blocking findings;
- earlier Candidate `a87e05db6c7ab48163f51fb237d2cfc374b1087d` remains terminal `IMPLEMENTATION_NEEDS_REVISION` evidence only and must not trigger duplicate work;
- the accepted capability is limited to the exact identity-free `deployment_destinations / replace` ability envelope over controller deployment to a battlefield with exactly one active opponent whose VP is lower than the controller, using permanent/card-text/explicit-exception semantics;
- loader admission remains fail-closed to the accepted structural shape, and MatchSession runtime now gates on the accepted containing ability rather than only its nested modifier;
- authoritative projection and dispatch use current controller/ownership/source-zone, current VP, occupancy and enabled battlefield state; legacy generic product compatibility remains separate;
- production routing adds no consumer identity/name/printed-text/F1 hash/Locked-Reference hash/Reference-handler routing;
- fresh reviewer validation on exact Candidate passed typecheck, focused 9/9, rules core+regression 83 files / 503 tests, official CI 154 files / 1082 tests, content validation with 0 blockers, generated determinism, exact Locked Reference verification, client build and diff-check.

## Formal accounting after synchronization

Project formal migration accepted remains **`139/944`**, with **`805`** remaining.

FB2-37 is runtime capability infrastructure and earns **zero migration credit**. No consumer identity is credited by this synchronization. Historical `P3-FM09-RECOVERY` remains `MIGRATION_BLOCKED`.

PR #385 remains OPEN, unmerged, and unretargeted.

## Next coordinator action

Migration-closure-first requires immediate re-overlay of `master.kayneth.skill.s3`. If whole-card normalization compiles with zero loader issues on this accepted capability and no additional semantic blocker appears, dispatch fresh S migration immediately before any unrelated B2 seam.