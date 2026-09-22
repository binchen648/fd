# P3-A R90 FB2-43 Acceptance Synchronization

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-20

## Accepted capability input

- Formal verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- Canonical reviewer evidence: `https://github.com/binchen648/fd/pull/396#issuecomment-5748914327`
- Exact A dispatch Base: `c9a59bbec0d637d3a23682777faa4f05b6d7c1ed`
- Accepted B2 Candidate: `19ff09ed65e34f241d332250e1cc1370071ecf75`
- PR: `#396`
- Task: `P3-FB2-43-EVENT-LOCATION-EQUALS-CONTROLLER`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Frozen F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`

## A synchronization checks

A mechanically rechecked:

- this synchronization worktree starts at exact accepted Candidate `19ff09ed65e34f241d332250e1cc1370071ecf75`;
- the Candidate is the direct child of exact dispatch Base `c9a59bbec0d637d3a23682777faa4f05b6d7c1ed`;
- PR #396 remains OPEN / CLEAN / non-draft, unmerged, with exact dispatch Base branch `codex/a-p3-fb2-43-event-location-equals-controller-dispatch` and exact Head Candidate `19ff09ed65e34f241d332250e1cc1370071ecf75`;
- canonical fresh independent R evidence `5748914327` binds exact Base `c9a59bbec0d637d3a23682777faa4f05b6d7c1ed` and exact Candidate `19ff09ed65e34f241d332250e1cc1370071ecf75`, returning `IMPLEMENTATION_ACCEPTED_CANDIDATE` with no blocking or revision finding;
- exact Base-to-Candidate delta is limited to the B2 result report, the new `event-location-equals-controller.ts`, `interpreter.ts`, `loader.ts`, `index.ts`, and the focused FB2-43 test;
- loader acceptance remains exact type-only `{ "type": "event_location_equals_controller" }`, with widened shapes rejected;
- runtime evaluation remains read-only and fail-closed, valid only for authoritative `after_controller_enters_location`, requiring a non-empty event location, an existing controller with a non-empty current location, and exact equality at evaluation time;
- player relationship and battlefield semantics remain separate conditions, while opponent movement admission is narrowly limited to `after_controller_enters_location` composed with accepted exact `event_player_is_opponent`;
- no Siegfried/card identity routing, generic event-field DSL, movement-emission rewrite, consumer authoring, generated/product mutation, merge, or retarget is introduced;
- fresh R validation on exact Candidate passed typecheck; focused FB2-43 `1 file / 10 tests`; rules src/core/regression/focused `83 files / 504 tests`; official CI `165 files / 1163 tests`; content validation; generated determinism; exact Locked Reference verification; client production build; `phase3:coverage` with `blockingIssues=0`; `git diff --check`; and production identity/hardcode audit;
- Candidate and Locked Reference worktrees were clean at their exact reviewed SHAs.

## Formal accounting after synchronization

Project formal migration accepted remains **`145/944`**, with **`799`** remaining.

FB2-43 is identity-free runtime capability infrastructure and earns **zero migration credit**. No consumer identity is credited by this synchronization. Historical `P3-FM09-RECOVERY` remains `MIGRATION_BLOCKED` absent new formal evidence.

PR #396 remains OPEN, unmerged, and unretargeted.

## Next coordinator action

Migration-credit-first requires immediate whole-card re-overlay of `servant.siegfried.skill.sc-siegfried-2` (`恶龙之血铠`) against the accepted runtime. Before FB2-43, `event_location_equals_controller` was the sole known normalized whole-card gap. Dispatch exactly one singleton S only if the refreshed whole-card probe is mechanically zero-gap: loader `report=[]`, automatic execution, accepted trigger/condition composition and close-source lifecycle are complete, and frozen accounting can be exact +1 with zero removals/duplicates. Otherwise record the remaining exact blocker and do not credit the identity.
