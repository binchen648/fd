# P3-B13 Current-main Implementation Report

Date: 2026-10-23 (Asia/Hong_Kong)
Task: `P3-B13`
Branch: `codex/b-p3-b13-current-main-20261023`
Exact Base: `a42b5e1c517141b90f3407773958b0d8afe63264`

## Scope

This Builder pass preserves the B13 Shinji `clown.lose-command-seal`
battle-loss Resource implementation and adds a dedicated in-process E2E
fixture. The fixture prepares the `MatchRoom` inside the same server process
that serves the browser, so deferred runtime authority remains trusted. No
server auth/runtime or shared persistence code was changed.

Builder delta:

- `e2e/support/prepare-shinji-battle-loss-room.ts`: prepares the running room
  with the two battlefield setup, Shinji skill, and deterministic state.
- `e2e/support/start-shinji-battle-loss-fixture-server.ts`: creates the match
  server and room, prepares it in-process, and emits dynamic HTTP/WebSocket
  endpoints and host credentials.
- `e2e/fd-shinji-battle-loss-resource.spec.ts`: spawns the dedicated fixture,
  uses dynamic credentials, and removes cross-process restore/snapshot logic.

The existing narrow B13 hardening remains: duplicate or cardinality-mismatched
scoring receipts are rejected before opening the post-scoring barrier, with a
focused negative proof. No coverage/classifier, inventory, generated registry,
task-index, Gate/credit, other consumer, or authoring identity was changed.
No PR was created or merged.

## Verified contract points

- The phase-wide scoring barrier requires one receipt for every resolved
  battlefield before result/first-loss events are staged.
- Server-owned battle/result facts remain stable and result events flush once.
- Shinji loss uses typed `adjust_command_seals` routing with stale/re-entry and
  Olga compatibility coverage.
- The fresh browser scenario covers both battlefields, barrier-before-result,
  command seals `3 -> 2` exactly once, reload/reconnect preservation, and
  stale-command rejection without revision/seal mutation.

## Execution receipts

1. `npm run typecheck` — exit `0`.
2. `npm exec vitest run packages/rules/tests/regression/battle-loss-resource-trigger.test.ts` — exit `0`: `1` file / `9` tests passed.
3. Compatibility command over the B13, Olga recertification, and state-transform regression files — exit `0`: `3` files / `21` tests passed.
4. Chromium was already installed by the earlier proxy-authorized
   `npx playwright install chromium` — exit `0`.
5. `npx playwright test e2e/fd-shinji-battle-loss-resource.spec.ts -c playwright.config.ts` — exit `0`: Chromium ran `1` test and passed. The prior cross-process restore `400` (`Invalid or missing deferred runtime state authority`) is resolved by this in-process fixture and is not treated as a current failure.

## Disposition

`IMPLEMENTATION_COMPLETE_CANDIDATE` for the current-main B13 implementation
scope. Independent Reviewer acceptance has not yet been received. This report
does not claim skill acceptance, migration credit, Gate-C acceptance, merge, or
release readiness; the browser receipt is implementation evidence only.
