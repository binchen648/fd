# P3-A Current-Main FB2-43 Event-Location Equals Controller Acceptance Synchronization

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-26

## Accepted input

- PR: `#455`
- Exact accepted Candidate: `6c18b429172ac671f918e4ae2c9291f347d3ee6b`
- Canonical fresh-R evidence: `https://github.com/binchen648/fd/pull/455#issuecomment-5842632031`
- Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- ReviewJobKey: `pr455:6c18b429172ac671f918e4ae2c9291f347d3ee6b:blocked-retry-muhhq5mg`
- Historical authority: PR #396 Candidate `19ff09ed65e34f241d332250e1cc1370071ecf75`, evidence `https://github.com/binchen648/fd/pull/396#issuecomment-5748914327`

## Accepted capability

Only exact type-only direct `ability.conditions[i]` node `event_location_equals_controller` is synchronized. It is evaluated read-only only for authoritative `after_controller_enters_location`, requires nonempty event/controller locations, and returns true only on exact location equality. Missing, malformed, wrong-event, missing-controller, or stale context fails closed.

Player relation remains separate. Opponent movement admission is not generalized: only `after_controller_enters_location` composed with exact direct `event_player_is_opponent` is admitted; unrelated `after_controller_*` triggers remain controller-only.

Nested logical carriers, `target.conditions`, `ruleModifiers.conditions`, effects, payload-bearing near-matches, generic event-field DSL, movement producer rewrites, identity/name/printed-text/Chinese routing, and SkillLib fallback remain outside the accepted scope.

## Accounting and readiness

This is zero-credit capability infrastructure. Base-to-Candidate `data/authoring/**` is empty. Formal/material remains `112/944`, remaining `832`.

The exact Candidate result records strict historical replay-pool loader readiness changing `17 -> 18`, with newly loader-ready `servant.siegfried.skill.sc-siegfried-2`. That is planning evidence only; it is not migration credit and does not itself establish final source/provenance closure for exact-50 membership.

## Next task

Non-tail F4 remains blocked below exactly 50 dependency-complete identities. Dispatch `P3-A-F4-EXACT-50-COMPOSITION-02` to rerun the same 153-identity historical old-frontier-minus-current pool against this exact synchronized runtime, recompute the exact ready/blocked sets and recurring gap clusters, and select the next narrow zero-credit capability seam only from fresh mechanical evidence. Do not dispatch a smaller S batch.