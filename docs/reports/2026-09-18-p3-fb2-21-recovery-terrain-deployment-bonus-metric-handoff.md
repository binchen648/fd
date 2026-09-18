# P3-FB2-21 Recovery — Shared Terrain / Deployment-Bonus Metric Handoff

Date: 2026-09-18
Role: Codex A -> Codex B2
Status: `READY_FOR_B2_RECOVERY`
Credit: zero frozen-migration credit

## Base and purpose

Base is the exact A dependency-planning commit carrying this handoff.

Goal: expose one identity-free, server-owned numeric value for the controller's **effective current terrain/deployment bonus**, so future source-grounded abilities can use the same terrain truth as combat resolution instead of duplicating terrain logic.

The future motivating target is `master.ciel.skill.s2`, but FB2-21 must contain **no Ciel identity, text, card, pack entry, generated content, or frozen migration**.

## Exact semantic contract

Introduce a shared pure helper for the terrain/deployment bonus currently embedded in combat resolution. For a player at a battlefield, the helper must preserve current product semantics exactly:

- use the player's assigned terrain slot from server-owned terrain assignments;
- read the authored `terrainBonuses` value for the current battlefield/slot;
- apply authored terrain multipliers already stored by current runtime;
- apply the accepted remote-operation doubling rule exactly as combat currently does;
- return zero when there is no valid assigned terrain slot/value;
- return zero when current authored terrain suppression excludes that player's terrain contribution;
- perform no mutation and create no events.

Combat resolution must consume this same shared helper so there is one source of truth rather than a copied formula.

Expose exactly one controlled numeric variable to ability evaluation:

`controller.deployment_bonus`

The loader may recognize only this exact variable form. The interpreter must resolve it through the shared helper for the ability controller. Near-match/unrecognized variables remain fail-closed.

## Required isolation

FB2-21 must remain identity-free. It must not route by:

- Ciel or any other owner/card ID;
- name or printed text;
- locked Reference handler IDs;
- target allowlists.

It must not add or modify authoring archives, pack manifests, generated content, MatchSession deployment semantics, taxonomy/KPI data, frozen inventory/evidence, or migration accounting.

Do not change how terrain is assigned. Do not add a new terrain formula. Do not reinterpret map data. The task is extraction/reuse of current combat truth plus controlled numeric access only.

## May touch only

- `packages/rules/src/core/terrain-advantage.ts` (new shared helper; filename may be equivalent but keep one focused module),
- `packages/rules/src/core/combat-resolver.ts`,
- `packages/rules/src/ability/loader.ts`,
- `packages/rules/src/ability/interpreter.ts`,
- `packages/rules/tests/core/combat-resolver.test.ts`,
- one focused regression test under `packages/rules/tests/regression/` for the metric seam,
- `docs/reports/2026-09-18-p3-fb2-21-recovery-terrain-deployment-bonus-metric-result.md`.

No other production/test/data/docs file is authorized without returning `IMPLEMENTATION_BLOCKED` for A rescoping.

## Required adversarial verification

At minimum prove:

1. shared helper and combat resolution return the same base authored terrain bonus;
2. authored terrain multiplier is reflected once, not double-applied;
3. remote-operation doubling is reflected once, not double-applied;
4. authored terrain suppression returns zero and combat remains unchanged;
5. no assignment / invalid slot / non-battlefield yields zero;
6. exact `controller.deployment_bonus` loads and evaluates;
7. near-match variables fail loader validation;
8. metric evaluation is identity-independent across at least two controllers/locations;
9. no state mutation/event/counter drift from reading the metric;
10. existing combat regressions remain green.

Run at least: offline install if needed, typecheck, focused metric+combat tests, full `test:ci`, rules core+regression, client production build, content validation/compile/determinism, locked Reference verification, `git diff --check`, exact scope and final cleanliness.

Completion status allowed:

- `IMPLEMENTATION_COMPLETE_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`
- `IMPLEMENTATION_BLOCKED`

A fresh independent R review is mandatory before this seam may be treated as accepted infrastructure. FB2-21 takes zero frozen migration credit; accepted overlap remains `111/944`.