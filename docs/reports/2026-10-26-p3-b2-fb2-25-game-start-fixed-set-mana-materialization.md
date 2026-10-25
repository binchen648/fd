# P3-B2 FB2-25 game-start fixed set-mana materialization

Role: Codex B2 materialization
Task: `P3-FB2-25-GAME-START-FIXED-SET-MANA`
Exact Base: `f141d8d745c303e95ec5f4948ac5b27e084f183a`
Historical accepted reference: `101cb0d4e3fbd105cfadafda26585b3825616fe1`
Handoff: `fedade3dc270800c8bcbfd0c3078ee46d9ea8fd8`

## Materialized scope

Rebuilt the accepted identity-free parent semantic against the exact current
Base. The delta is limited to:

- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/tests/regression/fb2-game-start-fixed-set-mana.test.ts`

The runtime now classifies and dispatches only the exact forced
`game_start`/automatic/no-host-operation envelope with one fixed controller
literal `set_mana` effect, reusing the existing typed Resolution Data-flow
primitive and FB2-05 component. Discovery and direct execution fail closed for
near-match shapes. The regression suite covers literal amounts 3 and 6,
controller-only routing, trusted-event idempotency, same-value no-op,
malformed envelopes, transactional rollback, and cap behavior.

No Iliya/Taiga authoring, identity/name/text routing, new event/schema or
generic primitive, generated/product artifact, coverage/accounting/KPI,
governance, A-sync, credit, or merge change was made.

## Verification

All commands were run from the exact-Base materialization worktree:

| Check | Result |
| --- | --- |
| `npm test -- --run packages/rules/tests/regression/fb2-game-start-fixed-set-mana.test.ts` | PASS, 5/5 |
| Existing dependency compatibility set | PASS, 81/81 |
| `npm test -- --run packages/rules/tests/regression` | PASS, 358/358 |
| `npm run test:ci` | PASS, 779/779 |
| `npm run typecheck -- --pretty false` | PASS |
| `npm run content:validate` | PASS, 0 blocking issues |
| `npm run verify:generated-content` | PASS, deterministic hashes unchanged |
| `git diff --check` | PASS |

This is an implementation Candidate for fresh R review. Frozen credit remains
zero and no acceptance synchronization is performed here.
