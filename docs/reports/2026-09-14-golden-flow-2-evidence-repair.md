# Golden Flow 2 Evidence Repair

- Date: 2026-09-14
- Scope: recover reproducible named Gate B / Gate C evidence for Golden Flow 2 only
- Base: `1f9e1e536ae251b61ec806359289256f8c44c977`
- Prior independent review: `5cb7eaffc5fcfbf28926765aac5ab58db32871eb`
- Status: `EVIDENCE_REPAIR_COMPLETE_CANDIDATE`
- Runtime production changes: none

## Why this repair exists

The historical Golden Flow 2 result report named three evidence files that were not present in the current tree and were not reachable in repository history:

- `packages/rules/tests/regression/golden-flow-2-combat-power-winner-vp.test.ts`
- `e2e/fd-golden-flow-2-combat-power-winner-vp.spec.ts`
- `e2e/support/build-golden-flow-2-snapshot.ts`

The first independent review therefore correctly refused promotion based on missing reproducible evidence.

That first review also reported server/typecheck failures. Follow-up diagnosis showed those failures were caused by a reviewer-local `node_modules` junction resolving `@fd/rules` to a different worktree. With local workspace links installed by `npm ci --ignore-scripts`, the unchanged production tree passes typecheck and the current server tests. This repair does not change server/protocol/hub production code.

## Added evidence

### Gate B named regression

`packages/rules/tests/regression/golden-flow-2-combat-power-winner-vp.test.ts`

The fixture starts from an authoritative MatchRoom action-phase pre-battle state and drives the real room end-turn path. It does not inject a settled battle result.

Deterministic battlefield facts:

- p1 and p2 are at `miyama_town`.
- p1 contributes a public power-5 basic attack.
- p2 contributes a public power-4 basic attack.
- two public Miyama events contribute 3 VP and 2 VP.
- non-participating players are moved off the battlefield; p6/p7 are marked non-active to avoid unrelated later-seat combat response mechanics.
- p5 is the final active human priority seat.

Expected settlement:

- p1 effective power = 5.
- p2 effective power = 4.
- p1 is sole winner, margin 1.
- event VP pool = 5.
- competition VP pool = 2.
- p1 final VP = 7.
- p1 military result +1, p2 military result -1 in authoritative state.
- serialize/restore preserves the settled result and does not duplicate scoring.

### Gate C snapshot builder

`e2e/support/build-golden-flow-2-snapshot.ts`

Builds the same deterministic pre-battle room and serializes it before battle settlement. No `battleResults` or post-settlement VP are injected.

### Gate C browser test

`e2e/fd-golden-flow-2-combat-power-winner-vp.spec.ts`

Covers:

- restore of the pre-battle room only;
- real browser `结束行动` click;
- `client:end_turn` with the projected `expectedRevision`;
- server revalidation and MatchRoom/MatchSession battle settlement;
- projected winner / power / VP breakdown;
- page reload and reconnect preserving the settled projection;
- stale replay of the original `client:end_turn` rejected with `Stale command revision`;
- no duplicate VP after stale replay.

## Verification

All commands were run from `E:\Codex\FD\fd-gf2-repair` with local workspace links resolving `@fd/rules` to this worktree.

- `npx vitest run packages/rules/tests/regression/golden-flow-2-combat-power-winner-vp.test.ts packages/rules/tests/regression/battle-winner-conformance.test.ts packages/rules/tests/core/combat-resolver.test.ts packages/rules/tests/core/scoring-resolver.test.ts packages/rules/tests/match-session.test.ts`
  - PASS: 5 files / 44 tests.
- `npm run typecheck`
  - PASS.
- `apps/server: npx vitest --config vitest.config.ts --run src/match-server.test.ts`
  - PASS: 1 file / 2 tests.
- `apps/client: npx vitest --config vitest.config.ts --run src/state/engine-bridge.test.ts`
  - PASS: 1 file / 5 tests.
- `npx playwright test e2e/fd-golden-flow-2-combat-power-winner-vp.spec.ts --project=chromium`
  - PASS: 1/1.
- `npx playwright test e2e/fd-golden-flow-2-combat-power-winner-vp.spec.ts e2e/fd-remote-sync.spec.ts --project=chromium --repeat-each=5`
  - PASS: 10/10.
- `git diff --check`
  - PASS.

## Scope boundary

This candidate adds test/evidence only. It does not modify:

- `packages/rules/src/**`
- `apps/server/src/**` production code
- `apps/client/src/**` production code
- B11 ability hot files

Independent review is still required before Golden Flow 2 may be promoted to `E2E_VERIFIED` or consumed as the accepted prerequisite for P3-TO-14.
