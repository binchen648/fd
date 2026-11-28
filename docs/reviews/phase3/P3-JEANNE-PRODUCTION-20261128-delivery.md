# Jeanne production-pool delivery

- Task: `P3-JEANNE-PRODUCTION-20261128`.
- Owner: A.
- Verified main base: `3c66f7fd37cb9200eeca2f774eaf864564564e54`.
- Branch: `codex/ab-jeanne-production-20261128`.
- Implementation and roster-test candidate: `7fceda880d304865eb5c3d95c3257624224d5329`.
- Independent review evidence commit: `e97d605cc02938a157c3f968cce2842d29aabdc4`; result `PASS`, 21/21 review cases, bound to the implementation candidate. The attestation file at that commit has SHA256 `b7dd8b8767044923ebd0d460990c5680958c28f5c90d8063e7add0bae92f4110`.
- Promotion synchronization commit: `83f267e25c563e0ed7db4df04b4fabf80aa595cb`.
- This document is included in the final promotion head; the exact final SHA is bound in the PR promotion manifest and the external receipt.

## Scope and result

The production candidate pack has eleven servants after Jeanne is added. The seven-seat session contract is preserved; deterministic coverage replaces exactly one reference servant with Jeanne. No seven-player, eleven-round E2E was run.

The Runtime changes are limited to Jeanne's already reviewed Loader/Interpreter support. The rebase and roster-projection work introduced no additional Runtime behavior. Other servants and their source data are unchanged by this package.

## Evidence

- Jeanne Runtime and production suite: 112/112 passed.
- Client asset-registry and seven-seat replacement suite: 15/15 passed.
- `npx tsc -b packages/rules`: exit 0.
- `npm run verify:playtest-v1`: exit 0; 7 masters, 11 servants, 20 events, 132 starting-deck cards, zero private-view leaks.
- `npm run verify:generated-content`: exit 0; generated content hashes were deterministic.
- Independent review: `PASS` by `/root/jeanne_production_review`; attestation in `P3-JEANNE-PRODUCTION-20261128-attestation.json`.

## Known validation limit

The current strict source-asset validation (`FD_SOURCE_ASSET_ROOT=D:\fd npm run test:source-assets`) exits 1 because two existing Euryale skill image references are absent from the local `D:\fd\chm-extract\图包` source archive: `ScreenShot_2025-11-01_160404_490.png` and `ScreenShot_2025-11-01_160409_161.png`. Both references are already present at the verified main base; this candidate did not add or alter them. The validator reported no missing Jeanne image. The raw failing log is retained in the external evidence directory and is not represented as a passing check.

Protected-main checks on the final promotion head must pass before merge. Full seven-player, eleven-round gameplay remains unverified and is outside this task's acceptance scope.
