# P3-B Current-Main M50-01 Target Count / VP Per Target Replay

Role: Codex B2
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Date: 2026-09-26

## Exact input

- Base: `ba958e78fcd6ce7a4276889aaac75d689a767409` (FB2-33 acceptance synchronization).
- Historical accepted semantic source: PR #440 successor `f0e5554e3210e721ae98faa29fc5241b410c5b72`.
- Historical canonical evidence: `https://github.com/binchen648/fd/pull/440#issuecomment-5805914781`.
- Scathach decomposition: only `target_count_equals` and `gain_victory_points_per_target` are authorized from M50-01.

## Implemented capability

Replays only the identity-free Scathach-required structured seam:

- `target_count_equals` under top-level ability conditions, with exact `scope: same_battlefield_opponents` and nonnegative safe-integer `count`;
- `gain_victory_points_per_target` under effects, with exact `target: controller`, exact `countTarget.scope: same_battlefield_opponents`, and nonnegative safe-integer `amountPerTarget`.

The runtime distinguishes a valid battlefield with zero opponents from invalid controller/battlefield context. VP totals and balances are safe-integer checked. The effect records the current-main bounded `victory_points_adjusted` runtime event and then the normal `effect_resolved` event. No historical frontier VP-tracking subsystem or unrelated M50 vocabulary is imported.

## Scope

Production changes are limited to loader/interpreter support for these two primitives, one focused test, and this result report. No `data/authoring/**`, Scathach consumer material, 50-card M50 batch, unrelated structured formula/choice vocabulary, triggers/event producers, generated product, packs/client production, governance edits, identity/name/printed-text/Chinese routing, SkillLib fallback, merge, or retarget.

## Verification

Pending final exact-snapshot validation: focused primitive tests, FB2-33/32/42/49 + source-state/dataflow regressions, typecheck, Base-to-Candidate authoring delta, identity-routing audit, and `git diff --check`.

## Accounting

Zero migration credit. Formal/material remains `112/944`, remaining `832`.
