# P3-B16 Battle-Loss Servant Reveal Runtime Result r1

- Date: 2026-09-14
- Owner: Codex B
- Task: `P3-B16`
- Branch: `codex/b-p3-b16-battle-loss-reveal-r1`
- A-owned handoff/base: `76a3e438945c008f027d9a5a071d4bb7a0259758`
- Representative: `servant.achilles.skill.sc-achilles-1 / sc-achilles-1.achilles-heel`
- Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`

## Implemented Scope

B16 migrates exactly one additional TO14 direct battle-result consumer through a reusable typed Visibility primitive:

```text
forced_trigger
+ after_controller_loses_battle
+ no response/condition/target/cost/create/modifier/lifecycle/limit
+ one reveal_information(scope=servant_package, subject=controller.servant)
-> typed reveal_servant_package
```

The production route is structural and identity-free. No Achilles/card/ability identity is present in production routing code.

## Typed Visibility Contract

`resolution-dataflow.ts` now owns a generic `reveal_servant_package` primitive with a typed result envelope:

```text
playerId
revealedCount
status
```

The primitive:

- reuses `abilityRuntime.revealedServants` as the single authoritative reveal state;
- validates that the ability source exists and is owned/controlled by the resolution controller;
- records the controller as revealed on the first successful reveal;
- emits typed `servant_package_revealed` evidence carrying source card, ability, stable result ID and revision;
- returns `applied / revealedCount=1` on first reveal;
- returns `no_op / revealedCount=0` with no duplicate event when already revealed;
- exposes `revealedCount` to normal typed result binding evaluation;
- rejects invalid/mismatched source-controller semantics atomically.

The normalizer accepts legacy authoring `reveal_information` only for the exact supported `servant_package / controller.servant` shape. Wrong scope or subject fails typed data-flow validation.

## Semantic Routing / Fail-Closed Boundary

The interpreter adds identity-free `isBattleLossServantRevealSemantic()` classification for the exact B16 shape.

Exact B16 semantics execute through `executeResolutionEffects()` before legacy `resolveEffect` handling.

Same-family malformed scope/subject candidates reject before legacy fallback. A semantically equivalent renamed ability still classifies, while extra condition / wrong trigger / wrong scope / wrong subject do not inherit B16 semantic acceptance.

No broad `reveal_information` migration is claimed.

## Battle Ordering

B16 does not modify battle/scoring ordering. It consumes the previously accepted B13 post-scoring event contract:

1. all supported battlefield base scoring receipts settle;
2. stable post-scoring result/loss events dispatch;
3. B16 loss reveal settles through Trigger Gateway;
4. B15 phase-terminal `after_battle_ended` remains later;
5. cleanup remains last.

The previously accepted frozen-participant rule remains intact: if base scoring eliminates the losing controller, that player still resolves its same-battle loss trigger once.

## Focused / Compatibility Evidence

Final typecheck:

```text
npm.cmd run typecheck
PASS
```

Focused/current-lineage compatibility:

```text
10 files / 91 tests PASS
```

The set covers:

- B16 battle-loss servant reveal;
- B13 battle-loss Resource;
- B14 shared-victory VP;
- B15 battle-terminal source-card Card Zone;
- Card Zone core;
- resolution data-flow infrastructure;
- Resource numeric core / room boundary;
- Trigger Resource;
- ExecutableCardPack compiler.

B16-specific regression coverage proves:

- identity-free exact-shape classification and renamed equivalent;
- wrong trigger/scope/subject/extra condition negatives;
- typed reveal with stable provenance;
- stable event replay dedupe;
- already-revealed idempotence without duplicate event;
- malformed same-family fail-closed behavior;
- mismatched source/controller atomic rejection;
- real MatchSession post-scoring loss reveal;
- no-loss negative;
- result/loss work remains before B15 terminal work;
- scoring-eliminated loser retains frozen-participant eligibility;
- same-round battle re-entry does not duplicate reveal.

## Gate C

Final Chromium run:

```text
npx.cmd playwright test \
  e2e/fd-achilles-battle-loss-reveal.spec.ts \
  e2e/fd-ereshkigal-battle-terminal-card-zone.spec.ts \
  --project=chromium

2 / 2 PASS
```

The B16 browser/server scenario proves from a real remote room:

- an opponent cannot see the Achilles servant package before the loss;
- base scoring opens the post-scoring barrier before the Shinto result dispatch;
- Achilles becomes publicly projected only after the battle-loss trigger;
- ordinary battle-result dispatch precedes B15 terminal dispatch;
- reconnect preserves the revealed servant package;
- stale revision is rejected;
- stale/reconnect does not change revision or duplicate the reveal state.

The B15 Eresh terminal Card Zone Chromium scenario remains green in the same final runtime state.

## Full Root Baseline

Final root run:

```text
npx.cmd vitest run --testTimeout=15000

Test files: 100 passed / 10 failed / 110 total
Tests:      663 passed / 20 failed / 683 total
```

All 20 failures are the pre-existing CHM/original-image local evidence absence class already present in the accepted B15 baseline.

Accepted B15 baseline:

```text
655 PASS / 20 inherited FAIL / 675 total
```

B16 delta:

```text
+8 PASS
+0 new deterministic FAIL
```

No B16 runtime, Trigger, Visibility, battle ordering, projection or reconnect failure appears in the full suite.

## Production Diff Audit

- `git diff --check`: PASS.
- production source diff contains no `achilles`, `sc-achilles`, or `servant.achilles` routing literal.
- no tracked `node_modules` or lockfile noise.
- exact supported B16 shape routes through typed resolution data-flow.
- malformed same-family scope/subject is rejected before legacy fallback.
- battle pipeline itself is unchanged by B16.

## Explicit Non-Claims

B16 does not promote or migrate:

- Gatou `seeker.battle-end-reward` / Special directive semantics;
- Tomoe `penalty-on-defeat` or its unpreventable clause;
- Olga loss transform;
- Artoria Alter optional battle-result triggers;
- Artoria Caster optional Luck-on-win triggers;
- declaration reveal triggered by `on_use_declared`;
- arbitrary `reveal_information` scopes or subjects;
- broad Hidden Information / private look behavior;
- broad Battle / Modifier / Power migration;
- TO15 Modifier/Power runtime;
- TO16 Special subsystem runtime;
- A-owned coverage KPI/classifier/taxonomy.

## Reviewer Handoff

A fresh `P3-R10` reviewer must start from the exact frozen B16 candidate SHA produced from this worktree and independently verify:

- typed Visibility atomicity/idempotence;
- identity-free classification and near-miss rejection;
- no legacy bypass for exact supported semantics;
- post-scoring loss ordering and frozen-participant eligibility;
- public projection/reconnect/stale behavior;
- Gate A/B/C;
- full root baseline.

A03 may advance the scoped TO14 direct-consumer overlay from `3/13` to `4/13` only after R10 independently accepts the exact candidate.
