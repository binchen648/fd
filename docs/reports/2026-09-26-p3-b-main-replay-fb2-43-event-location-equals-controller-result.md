# P3-B Current-Main FB2-43 Event-Location Equals Controller Replay

Role: Codex B2
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Date: 2026-09-26

## Exact input

- Formal Base: `830934876e0805b4bf21c45dd73e7ac57e2be065` (`P3-A-MAIN-REPLAY-FB2-31-EVENT-PLAYER-RELATION-ACCEPTANCE-SYNC`).
- Historical dispatch Base: `c9a59bbec0d637d3a23682777faa4f05b6d7c1ed`.
- Historical accepted Candidate: `19ff09ed65e34f241d332250e1cc1370071ecf75` (PR #396).
- Canonical historical reviewer evidence: `https://github.com/binchen648/fd/pull/396#issuecomment-5748914327`.
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.

## Replayed capability

Only the identity-free exact type-only direct ability condition `{ type: "event_location_equals_controller" }` is replayed.

Runtime semantics preserve the accepted historical seam: the condition is meaningful only for authoritative `after_controller_enters_location`, requires a non-empty event location and existing controller with non-empty current location, and returns true exactly when those locations match at evaluation time. Wrong event type, missing/malformed location, missing controller, or missing controller location fail closed without mutation.

Player relationship remains separate. The only opponent-event admission is the historically accepted narrow opt-in: `after_controller_enters_location` plus an exact direct `event_player_is_opponent` condition. Other `after_controller_*` events retain controller-only scoping.

Current-main strengthens the loader boundary relative to the historical implementation: the node is admitted only at direct `ability.conditions[i]`. Nested logical, `target.conditions`, `ruleModifiers.conditions`, effects, and malformed payload-bearing near-matches remain unsupported.

No consumer authoring, generic event-field DSL, arbitrary location selector, movement producer rewrite, identity/name/printed-text/Chinese routing, SkillLib fallback, merge, or retarget is introduced.

## Validation

- focused FB2-43 current-main: `1 file / 11 tests PASS`;
- affected chain including accepted FB2-31, player-flag predecessor/R2, M50-01/02, FB2-32/33/42/49, source-state, resolution-dataflow, and MatchSession: `13 files / 175 tests PASS`;
- `match-session.test.ts`: `30/30 PASS`;
- `npm run typecheck`: `PASS`;
- `npm run phase3:coverage`: `PASS`, `blockingIssues=0`;
- strict historical reconciliation/evidence loader-ready count changes `17 -> 18`, with newly loader-ready `servant.siegfried.skill.sc-siegfried-2`; readiness is planning evidence only and grants no migration credit;
- Base-to-Candidate `data/authoring/**`: `EMPTY` by construction;
- migration credit: `0`; formal/material remains `112/944`, remaining `832`.

## Freeze requirement

Final Candidate must contain only helper/classifier, loader, interpreter, public export, focused current-main test, and this report. `git diff --check`, exact Base/Candidate scope, identity-routing audit, and authoring-empty checks must pass before fresh R.