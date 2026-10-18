# P3 `master.illya-mahou` owner migration

- Base: `ecfd1a1e8d82b7cf39381732b8d8cf2c361165f5` (`299/944` Iliya A-sync frontier)
- Candidate: final handoff commit reported with this worktree (not pushed, no PR, no A-sync)
- Worktree: `E:\Codex\FD\binchen648_fd\illya-mahou-owner-migration`
- Scope: frozen `ascension`, `s1`, and `s1a` only

## Evidence preserved

The archive keeps the exact printed text and the accepted legacy/generated locators for all three cards. The generated text hashes are retained verbatim:

- `ascension`: `261756c8216c3d8d50f197e8d19b9f97adbe08e5aee2de9e04da1fd747a2b67e`, `63162edc6fbe753a0e8b6d0a66c0724a42695313cd28892dd49556c6b6e55abd`
- `s1`: `cd9408ccd7d5299c4c1e258a45f11a3cba07991864d28a915fdfa32237c1d8ed`
- `s1a`: `7e3ba930644cf954890adb898088c60487c2b87a430e660b2c296a675f1f89c8`, `bb4d280acff7f0f06fc2eb849bf7234a289a846d91da3a52b7653659cca54f21`

## Honest runtime boundary

All three archive cards and generated skill entries are `host_adjudicated`; no card claims `complete`. Their only effects are audit-only `record_master_directive` entries, so runtime event processing produces no automatic directive.

The current engine does not expose authoritative contracts for: ascension's end-of-round conditional payment/removal and selective situation/event doubling; S1's deck-entry replacement with the Kaleidoscope Staff exception; or S1A's arbitrary draw, hand-size-times-two dynamic cost, and discard-to-deck shuffle. The old `core.magical-ruby` reference is retained as evidence, not treated as an executable handler. Conservative card-face values are zero because the frozen evidence supplied text/locators but no authoritative printed cost/value.

## Verification evidence

- `npx vitest run packages/rules/tests/regression/p3-illya-mahou-owner-migration.test.ts` — 4 passed.
- `npm run typecheck` — passed.
- `npm run content:validate` — `32 masters, 19 servants, 20 events, 0 blocking issues`.
- `npm run content:compile` — `32 masters, 19 servants, 20 events, 0 blocking issues`.
- `npm run verify:generated-content` — passed; content-library digest `553c43ef54389eea318b5c08d4e2bf0a4e29db87e54626fa1b6fb97d643bc6c0`, evidence digest `d50c8c6982b0b35f46f809e12e8c57da3c0afe14705421c939904c6de41bf92d`.
- `git diff --check` — passed.

The first focused-test attempt before dependency bootstrap failed only because the fresh worktree had no `node_modules` (`vitest/config` unresolved); after `npm ci --ignore-scripts`, the focused suite passed. No pre-existing product/test failure was observed.
