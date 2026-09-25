# P3-B Current-Main M50-01 Target Count / VP Per Target Replay

Role: Codex B2
Status: `IMPLEMENTATION_COMPLETE_SUCCESSOR_CANDIDATE`
Date: 2026-09-26

## Exact input

- Base: `ba958e78fcd6ce7a4276889aaac75d689a767409` (FB2-33 acceptance synchronization).
- Initial reviewed Candidate: `100e6f86ed19b96777ad837030d61ec1160e741f`.
- Initial fresh-R verdict: `IMPLEMENTATION_NEEDS_REVISION`.
- Canonical bounded relay: `https://github.com/binchen648/fd/pull/449#issuecomment-5837249638`.
- Historical accepted semantic source: PR #440 successor `f0e5554e3210e721ae98faa29fc5241b410c5b72`.
- Historical canonical evidence: `https://github.com/binchen648/fd/pull/440#issuecomment-5805914781`.
- Scathach decomposition: only `target_count_equals` and `gain_victory_points_per_target` are authorized from M50-01.

## Implemented capability

Replays only the identity-free Scathach-required structured seam:

- `target_count_equals` is admitted only as a direct top-level `ability.conditions[]` node, with exact `scope: same_battlefield_opponents` and nonnegative safe-integer `count`;
- `gain_victory_points_per_target` is admitted only as a direct `ability.effects[]` node, with exact `target: controller`, exact `countTarget.scope: same_battlefield_opponents`, and nonnegative safe-integer `amountPerTarget`.

The runtime distinguishes a valid battlefield with zero opponents from invalid controller/battlefield context. VP totals and balances are safe-integer checked. No historical frontier VP-tracking subsystem or unrelated M50 vocabulary is imported.

## R1 findings closed

The same-attempt fresh R on initial Candidate `100e6f86...` raised two blockers; both are closed locally in the successor:

1. **Authoritative VP mutation path.** The per-target effect no longer assigns `p.vp` or hand-writes `victory_points_adjusted`. After computing and validating the bounded amount, it delegates to current-main `executeResolutionEffects()` with a controlled `adjust_victory_points` primitive. That existing resolution-dataflow primitive performs the mutation and emits the canonical bounded resource event. The wrapper returns immediately after delegation so the same source ability does not receive a duplicate outer `effect_resolved` event.
2. **Direct/top-level condition boundary.** Loader acceptance for `target_count_equals` now requires the exact scanner path `conditions[<index>]`. Nested logical placements such as `conditions[0].conditions[0]` are reported unsupported and automation-disabled. The per-target VP effect is likewise constrained to direct `effects[<index>]` placement.

Focused regression evidence explicitly checks canonical VP event fields (`controllerId`, `sourceAbilityId`, `resultId`) and exactly one source-ability `effect_resolved`, plus a separate nested-`and` rejection regression.

## Scope

Base-to-successor production changes remain limited to loader/interpreter support for these two primitives, one focused test, and this result report. No `data/authoring/**`, Scathach consumer material, 50-card M50 batch, unrelated structured formula/choice vocabulary, triggers/event producers, generated product, packs/client production, governance edits, identity/name/printed-text/Chinese routing, SkillLib fallback, merge, or retarget.

## Verification on successor scratch snapshot

- focused M50-01 primitive suite: `1 file / 7 tests PASS`;
- affected chain: `7 files / 107 tests PASS`;
  - M50-01: `7/7`;
  - FB2-33: `9/9`;
  - FB2-32: `11/11`;
  - FB2-42: `9/9`;
  - FB2-49: `51/51`;
  - card-source-state: `5/5`;
  - resolution-dataflow: `15/15`;
- `npm run typecheck`: PASS;
- Base-to-successor `data/authoring/**` delta: EMPTY;
- identity/name/printed-text/Chinese/SkillLib routing additions: NONE;
- `git diff --check` (previous Candidate→successor and Base→successor): PASS after final report freeze.

## Accounting

Zero migration credit. Formal/material remains `112/944`, remaining `832`.