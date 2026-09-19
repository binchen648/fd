# P3-FB2-34 Combat Reward Distribution Result

Role: Codex B2
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Date: 2026-09-20

## Exact task boundary

- Base: `44339c2ba405d2a4b798b53522e51e1fb11e4121`
- Branch: `codex/b2-p3-fb2-34-combat-reward-distribution`
- A dispatch: `docs/reports/2026-09-20-p3-a-fb2-34-combat-reward-distribution-dispatch.md`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Formal migration accounting remains `136/944`, remaining `808`.

FB2-34 is generic B2 runtime infrastructure only and earns zero migration credit. No production consumer authoring is changed.

## Implementation

### Exact loader envelope

`packages/rules/src/ability/loader.ts` adds one structural classifier for the exact static passive reward-distribution envelope dispatched by A. It accepts only:

- passive parent;
- empty/default activation, conditions, targets, cost, effects, creates, lifecycle, response, limit, visibility, markers;
- exactly one rule modifier;
- modifier `operation=replace`, `rule=combat_reward_distribution`;
- scope exactly `{ subject: "controller", whenControllerWins: true, mode: "full_reward_each" }`;
- no modifier lifecycle, installation field, or extra scope/modifier payload;
- automatic execution with no host authority.

The ordinary loader rule/operation/lifecycle allowlists remain unchanged for every non-matching shape. A malformed or extended `combat_reward_distribution` shape is explicitly reported unsupported.

### Battle scoring

`packages/rules/src/core/combat-resolver.ts` checks authoritative physical sources structurally at battle-result construction time. The modifier is active only when:

- the physical source controller is one of the authoritative battle winners;
- the physical source is in `field` or `attack_area`;
- authoritative runtime card state is active and not face-down;
- the compiled source definition contains the exact accepted static passive envelope above.

When active, only reward distribution changes:

- event battle VP pool: each winner receives the full pool;
- competition VP pool: each winner receives the full pool;
- location VP pool: each winner receives the full pool;
- existing individually assigned per-player adjustments such as Remote Operation are left unchanged;
- duplicate equivalent winning modifiers reduce to the same boolean distribution mode and do not stack;
- a sole winner is observationally unchanged;
- winner selection, participant Power, exclusions, military settlement, defeat/loss facts, and battle event production are untouched.

## Focused evidence

`packages/rules/tests/fb2-34-combat-reward-distribution.test.ts` adds 7 focused tests covering:

1. exact loader acceptance and malformed/extended parent/modifier rejection, including lifecycle/effect-installation near-matches;
2. two-winner default split versus full event/competition/location reward for each winner;
3. losing-controller, inactive-source, and face-down-source negatives;
4. sole-winner neutrality;
5. duplicate equivalent modifier idempotency plus unchanged single Remote Operation bonus;
6. runtime fail-closed behavior for a malformed shape injected outside the loader.
7. real `loadAuthoringJson(...) -> initializeAbilityRuntime(...) -> resolveBattlefield(...)` preservation of the exact semantic across loader normalization, including canonical default `responseWindow` and execution authority.

The positive scoring probe also confirms winner IDs, military adjustments, and participant breakdowns are unchanged by the modifier.

## Fresh validation on the exact B2 worktree

Dependencies were materialized in this exact worktree with `npm.cmd ci --ignore-scripts --offline`; 239 packages were installed and npm reported 0 vulnerabilities. No cross-worktree `node_modules` junction was used.

Fresh gates:

- `npm.cmd run typecheck`: PASS before focused Vitest.
- focused FB2-34: `1 file / 7 tests PASS`.
- rules core + regression + focused: `79 files / 489 tests PASS`.
- official `npm.cmd run test:ci`: `148 files / 1039 tests PASS`.
- `npm.cmd run content:validate`: PASS — `7 masters / 7 servants / 20 events / 0 blocking issues`.
- `npm.cmd run verify:generated-content`: PASS with unchanged hashes:
  - content library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence report `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`
- Locked Reference verification: PASS at exact `b2f9fa15fba07c63530bbf4612b03b8b704755f9` with clean checkout.
- client production build: PASS; only the existing Vite `node:crypto` browser-externalization warning was emitted.
- `git diff --check`: PASS.

## R revision closure

Fresh independent R review of Candidate `996e7a7c5b294f4d6208ca7ec473d0ef6adccf27` returned `IMPLEMENTATION_NEEDS_REVISION`; canonical evidence is `https://github.com/binchen648/fd/pull/378#issuecomment-5743867820`. The sole blocker was that the raw authoring classifier required an empty `responseWindow`, while `loadAuthoringJson()` canonicalizes compiled abilities with `{ order: "turn_order", passBehavior: "decline_this_window" }`, making the runtime scoring classifier miss content that the loader itself had accepted.

The revision is intentionally limited to that finding:

- raw authoring admission remains unchanged and still requires the exact empty/default parent envelope;
- the shared classifier now has explicit `authoring` and `compiled` forms rather than silently broadening one shape;
- compiled form accepts only the loader's canonical default response-window pair;
- compiled execution authority accepts only either the explicit empty list or the loader's exact full default host-operation list, and rejects arbitrary subsets/extra host authority;
- combat scoring requests the `compiled` form;
- the focused suite now constructs the exact raw archive through `loadAuthoringJson`, initializes runtime from the compiled pack, and proves tied winners receive full event/competition/location reward pools.

No lifecycle, installation, Napoleon, consumer authoring, migration accounting, winner selection, Power, defeat, or unrelated modifier scope was added by the revision.

## Locked Reference / scope audit

Fresh recursive traversal of Locked Reference `src/content/authoring/cards.json` finds exactly two `combat_reward_distribution` modifier occurrences and both share the structural core `replace + controller + whenControllerWins=true + full_reward_each`.

- the Stheno occurrence contains only `id, printedClause, operation, rule, scope` and therefore matches the dispatched static envelope;
- the Napoleon occurrence additionally carries `installation` and `lifecycle` and therefore does not match FB2-34.

Production added-line audit contains none of the F1 evidence hash, Locked Reference hash, `core.structured-skill`, Stheno identity/name token, `ownerId`, or `cardId`. One generic `definitionId` field access exists solely as `runtime.pack.cards[source.definitionId]` to resolve an authoritative physical source to its compiled definition; there is no comparison against, branch on, or embedded concrete definition ID.

## Candidate scope / accounting

Before result-report creation, tracked implementation scope was exactly:

- `packages/rules/src/ability/loader.ts`
- `packages/rules/src/core/combat-resolver.ts`
- `packages/rules/tests/fb2-34-combat-reward-distribution.test.ts`

This result report is the fourth authorized path. No production authoring, generated pack/product, `data/phase3`, taxonomy/KPI, app behavior, merge, or retarget is included.

Formal migration accounting remains **`136/944`**, with **`808`** remaining. If independently accepted and A-synchronized, the required next coordinator action is an immediate Stheno closure re-overlay and S migration dispatch if no new blocker is found; do not select an unrelated B2 seam first.
