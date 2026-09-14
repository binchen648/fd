# P3-B14 Shared Victory VP Runtime Result

- Date: 2026-09-14
- Task: `P3-B14`
- Owner: Codex B
- Branch: `codex/b-p3-b14-shared-victory-vp-r1`
- A-owned dispatch/handoff: `939781c23b04d48075d4f2a28ebd801f4aebc7fa`
- Accepted prerequisite B13 runtime: `37189b32d4de0da3a8eabdca8edbf674c8852d97`
- Accepted prerequisite R07: `f1fa9c12ac43ab96050468f52070fc7ea53fd09d`
- Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
- Fresh reviewer required: `P3-R08`

## Exact Scope

B14 migrates exactly one additional TO14 direct battle-result consumer:

```text
archive: servant.artoriac
card: servant.artoriac.skill.sc-artoriac-6
ability: sc-artoriac-6.gain-vp-if-not-sole-winner
kind: forced_trigger
trigger: after_battle_result_determined
conditions:
  - controller_won_battle
  - not(controller_sole_winner)
source state: active
effect: adjust_victory_points(controller, +2)
```

The production route is structural and identity-free. Production source diff inspection found no Artoria Caster, SC6, representative card ID, or representative ability ID routing branch.

No sibling TO14 consumer inherits migration or Gate status from B14.

## Initial Red Evidence

The focused B14 regression was added before the runtime route. The first business-level run failed for the intended reasons:

- `isSharedVictoryVpTriggerSemantic` did not exist;
- the existing legacy path could change VP but emitted only the generic legacy `effect_resolved` event rather than typed `victory_points_adjusted` evidence.

The sole-winner, loss and inactive-source negatives already behaved as no-ops, so the implementation gap was specifically semantic routing/evidence rather than broad battle-result correctness.

## Runtime Changes

### Identity-free exact classifier

`packages/rules/src/ability/interpreter.ts` now recognizes exactly:

```text
forced_trigger
+ combat / immediate
+ after_battle_result_determined
+ requiresSourceState = active
+ controller_won_battle
+ not(controller_sole_winner)
+ no targets/costs/creates/rule modifiers/lifecycle/response limit
+ one controller adjust_victory_points(+2) effect
```

A renamed synthetic same-shape ability classifies. Missing shared-winner condition, wrong amount and wrong source-state policy do not classify.

A broader same-family candidate that fails the exact semantic check is rejected with `resolution_failed` before legacy effect execution. The supported path routes through `executeResolutionEffects()`.

### Compiler/data-flow validation

`packages/rules/src/ability/executable-card-pack.ts` now includes the narrow shared-victory VP candidate in resolution-data-flow validation so malformed resource primitive parameters cannot bypass compiler validation merely because the ability is trigger-shaped.

### No battle/scoring rewrite

B14 does not modify Combat Resolver, Scoring Resolver or MatchSession production logic. It consumes B13's already accepted post-scoring result envelope and stable battle identities.

The production MatchSession test proves two battlefield scoring receipts are committed before the shared-result trigger award:

```text
scoring receipts at barrier: 2
p1 VP at barrier open:       2
p1 VP at shared result:      4
final p1 VP:                 4
```

Thus the +2 trigger reward is additive to, and strictly after, base scoring.

## Focused / Compatibility Evidence

- `npm.cmd run typecheck`: PASS.
- B14 semantic + production regression: `4/4 PASS`.
- B14 + existing Battle Winner conformance during initial green pass: `4/4 B14 + 1/1 conformance` across the exercised runs.
- Current-lineage compatibility set covering B13, Resource, Card Zone, Card Action, Trigger, Lifecycle, Interaction, resolution data-flow and Golden Flow 2: `17 files / 98/98 PASS`.
- `git diff --check`: PASS.
- Production source diff identity scan: no representative identity routing.

The B14 regression covers:

- exact identity-free classifier;
- renamed synthetic positive;
- missing shared-winner condition negative;
- wrong amount negative;
- wrong source-state policy negative;
- typed `victory_points_adjusted` event with `before / after / delta`;
- shared-winner positive;
- sole-winner negative;
- loss negative;
- inactive-source negative;
- stable result-event deduplication;
- two-battlefield post-scoring ordering;
- battle-phase re-entry without duplicate +2 VP.

## Gate C Candidate Evidence

Fresh Chromium run:

```text
e2e/fd-artoria-caster-shared-victory-vp.spec.ts
1/1 PASS
```

The real remote room/server scenario proves:

- p1 is Artoria Caster with active SC6 source;
- Shinto resolves with p1 and p2 as shared winners;
- a second battlefield also resolves in the same phase;
- final p1 VP is `4` = base scoring `2` + typed shared-winner reward `2`;
- barrier log precedes the Shinto result dispatch;
- server-authored battle/result identity is present;
- reconnect preserves settled revision and VP=4;
- stale pre-settlement revision is rejected;
- reconnect/stale activity does not duplicate the +2 reward.

## Full Root Baseline

Latest implementation-side run:

```text
Test files: 98 passed / 10 failed / 108 total
Tests:      648 passed / 20 failed / 668 total
```

All 20 failures are the inherited local CHM/original-image evidence absence class. No B14 runtime/compiler/session/room/projection failure was introduced.

Accepted B13 baseline was `644 PASS / 20 inherited FAIL`, so B14 contributes:

```text
+4 PASS
+0 new deterministic failures
```

## Explicitly Out Of Scope

B14 does not migrate or promote:

- Tomoe `sc-tomoe-1.penalty-on-defeat` or its unpreventable-loss clause;
- Artoria Alter Noble Bloom optional result triggers;
- Artoria Caster optional pilgrim luck-on-win triggers;
- `after_battle_ended` phase-terminal consumers;
- Olga special/transform chains;
- remaining TO14 direct consumers;
- TO15 Modifier/Power runtime;
- any global coverage/KPI change.

Global coverage synchronization remains A-owned and is allowed only after fresh R08 acceptance of the exact frozen B14 candidate SHA.
