# P3-S Voyager Owner-Complete Migration Result

Role: Codex S / FORMAL
Status: `MIGRATION_COMPLETE_CANDIDATE`
Date: 2026-09-30

## Task / lineage

- Task: `P3-S-OWNER-VOYAGER-COMPLETE-MIGRATION`
- Exact Base: `8cbfbf25c958eb9f9647163c077f85224f02827e`
- Base meaning: accepted Voyager readiness A-sync/full-owner rescan; strict accounting `166/944`, remaining `778`.
- Frozen owner: `servant.voyager`
- Frozen scope: sc1 + sc2 + sc3 + sc4 together.
- Accepted readiness contract: PR #499 exact Candidate `c0e0fb4f506145a2a93a3ce330fdd9cef3fd6aa8`; canonical acceptance evidence `https://github.com/binchen648/fd/pull/499#issuecomment-5913743850`.
- Locked Reference metadata commit: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.

All four frozen identities were absent from canonical `data/authoring/**` at Base, so all four are newly creditable only after exact formal `MIGRATION_ACCEPTED` plus A-sync/accounting.

## Owner materialization

One canonical owner archive is added at `data/authoring/servants/servant.voyager.json` with the exact frozen owner scope together:

1. `servant.voyager.skill.sc-voyager-1` / 讯息：希望
   - static metadata: 特殊, cost 0, base Power 0;
   - `群星低吟`: exact entering-player Recon trigger creates two outside-game `sc-voyager-4` copies in that player's hand with source provenance;
   - action: all active players receive private optional exact-definition reveal decisions; each valid revealer gains exactly +2 VP.
2. `servant.voyager.skill.sc-voyager-2` / 讯息：和平
   - static metadata: 特殊, cost 2, base Power 0;
   - action: bounded ordinary effect-play of up to two exact `sc-voyager-4` cards face-up and up to two other hand cards face-down;
   - combat: reveal all hands and force active attack Power to zero only for players whose revealed hand contains the exact matching definition for this round.
3. `servant.voyager.skill.sc-voyager-3` / 遥远的蓝色星球啊
   - static metadata: 宝具, cost 5, base Power 8, canonical skill-zone threshold 8, 真名解放 metadata preserved;
   - action: choose one opponent, reveal the live discard, optionally all-or-none free-play every currently revealed exact `sc-voyager-4`, then transfer up to exactly 2 VP only after at least one successful play.
4. `servant.voyager.skill.sc-voyager-4` / 领域外生命
   - static metadata: 特殊, cost 1, base Power 0, 真名解放 metadata preserved;
   - explicitly `initialPlacement: outside_game`, so Voyager still has exactly three in-game servant skills while sc4 is the generated matching-definition card required by the printed contract;
   - on play, accepted generic provenance grants +6 total Power to the exact generated-card controller and exact generator owner, deduplicating the same player;
   - after battle, the exact generated card returns to the generator owner's discard and the consumed return/+6 authority is retired.

No Voyager/card-name/printed-text/legacy `core.voyager-*` production identity route is added.

## Deck / pack integration

Frozen 12-card deck is preserved exactly:

- q1 ×1
- q2 ×2
- q3 ×3
- a2 ×2
- a3 ×1
- luck ×1
- surveil ×2

`data/packs/fd-playtest-v1/pack.json` integrates `servant.voyager.json` exactly once immediately after `servant.vlad.json`, matching stable frozen-owner order.

Generated content was regenerated deterministically after integration.

## Shared-test fixture reconciliation

Expanding the production servant pool from 17 to 18 changed deterministic roster sampling for two old MatchSession tests even though Base..Candidate contains no production MatchSession/runtime behavior change.

Two test fixtures were minimally re-seeded without weakening their assertions:

- `packages/rules/tests/match-session.test.ts`: the durability-authentication one-round fixture uses seed `20260880`, keeping the same tamper/restore assertions while staying below its existing 5-second per-test budget;
- `packages/rules/src/__tests__/match-session-regressions.test.ts`: the dash regression uses seed `20260908`, which still gives `p1` a physical `basic.surveil` and preserves the exact before/after activation assertions.

No production runtime source implementation is modified by the formal Candidate; the `packages/rules/src/**` delta is test-only at `src/__tests__`.

## Verification

Formal owner-complete regression:
- `packages/rules/tests/regression/p3-voyager-owner-complete-migration.test.ts`: `6/6 PASS`.

Accepted readiness regression:
- `packages/rules/tests/regression/p3-voyager-owner-readiness-capability.test.ts`: `10/10 PASS`.

Affected shared regressions:
- complex-skills regression: `38/38 PASS`;
- `packages/rules/tests/match-session.test.ts`: `33/33 PASS`;
- `packages/rules/src/__tests__/match-session-regressions.test.ts`: `11/11 PASS`;
- playtest pack loader: `21/21 PASS`.

Affected total: **`119/119 PASS`** (session suites intentionally executed as a separate group to avoid parallel 5-second timeout noise; coverage is unchanged).

Static/content gates:
- `FD_TOOLCHAIN_OK`;
- `npm run typecheck` PASS;
- `npm run content:validate` PASS — `7 masters / 18 servants / 20 events / 0 blocking issues`;
- `npm run content:compile` PASS — same counts;
- `npm run verify:generated-content` PASS:
  - content-library `b001533b86c695069982a85ffa35ec4de3a30b623b41554f4f6441972d65f50e`;
  - fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`;
  - evidence-report `8346639085dad774da89824712814cf56ffd58b91bf407155871aefd255060e6`;
- production identity audit for `servant.voyager`, `sc-voyager`, Voyager skill names, and `core.voyager-*` under production rules source: CLEAN;
- `git diff --check` PASS.

## Accounting / gate

Before fresh R, strict formal accounting remains **`166/944`**, remaining **`778`**.

This Candidate claims four newly materialized frozen identities, but **no credit is granted before exact fresh independent `MIGRATION_ACCEPTED` plus A-sync/accounting**. If accepted and synchronized, the accounting transaction is exactly `+4`: `166/944 -> 170/944`, remaining `774`.