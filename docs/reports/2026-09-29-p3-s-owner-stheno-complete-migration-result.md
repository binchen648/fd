# P3-S Owner Stheno Complete Migration Result

Role: Codex S
Status: `MIGRATION_CANDIDATE_READY_FOR_FRESH_R`
Date: 2026-09-29
Task: `P3-S-OWNER-STHENO-COMPLETE-MIGRATION`
Exact Base: `9fd9036c6d74427f88b3b268f9ef2916cf3f3beb`
Owner root: `servant.stheno`

## Formal owner scope

This owner-complete transaction contains all three canonical Stheno frozen identities together:

1. `servant.stheno.skill.sc-stheno-1` — historical FM06 Presence Concealment, preservation-only and no duplicate credit;
2. `servant.stheno.skill.sc-stheno-2` — Goddess's Smile, newly creditable;
3. `servant.stheno.skill.sc-stheno-3` — Divine Core / Goddess's Conceit, newly creditable.

Strict formal accounting remains `139/944`, remaining `805`, until this exact formal Candidate receives `MIGRATION_ACCEPTED` and a subsequent A-sync/accounting transaction completes. If accepted and synchronized, this owner batch adds exactly sc2 + sc3 (`+2`) and moves strict formal accounting to `141/944`, remaining `803`. Historical sc1 receives no duplicate credit.

## Accepted prerequisites and provenance

Locked Reference was mechanically held at exact commit `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.

- sc1 is historical FM06 Presence Concealment acceptance. FM06 S Candidate `ebc1ca575fcef0e3894b13ec10613801e4227970` was independently accepted by R36 on A-synchronized lineage `34f891a7739e86b835bc78e65aa58fdf5f4e955a`; the current Base already contains this card.
- sc1 remains exact JSON-object-equal to Base; SHA-256 of the canonical card object is `201bbac3a5181d19d4d162936bcc0b5bc422a0aef341657bb2ac028a2aa97229`.
- sc2 consumes accepted generic battle-win/+1 VP support plus the accepted `combat_reward_distribution/full_reward_each` readiness seam from PR #474 exact Candidate `4dd8eca5746d63d72c7906716cb7118e2569872a`; canonical same-attempt acceptance relay is `https://github.com/binchen648/fd/pull/474#issuecomment-5871992188`.
- sc3 consumes the accepted Divine Core battle Luck-close/refund/draw/immediate-play family from PR #472 final accepted Candidate `5d7ec79524b577dcd729ae7bc93d905343bd3e1f`; canonical accepted-candidate evidence correction is `https://github.com/binchen648/fd/pull/472#issuecomment-5867235240`.
- exact formal Base `9fd9036c6d74427f88b3b268f9ef2916cf3f3beb` is the zero-credit A-sync/rescan after PR #474 acceptance; it closes the complete currently discoverable Stheno readiness gap set before this formal migration begins.

Source/static evidence preserved in the owner archive:

- owner class `Assassin` and final skill-zone rule 9.4 threshold `8` mana for all three cards;
- sc1: `迅捷`, printed cost `3`, base Power `4`; historical Reference requirement `3` is evidence only;
- sc2: `宝具`, printed cost `0`, base Power `3`, source-text SHA-256 `edc8e5b95f81153ebace50f23ed1e9a1342bd380891b07b35f74c1948eaac702`;
- sc3: `特殊`, printed cost `2`, base Power `4`, source-text SHA-256 `1f24c0d49af558844049e6245e39fd4de29688afeae0bf3bf5808e855ff6e0fc`; historical Reference requirement `2` is retained only as evidence while the final skill-zone gate remains `8`.

## Implementation

`data/authoring/servants/servant.stheno.json` remains one canonical Stheno owner archive and now contains exactly sc1 + sc2 + sc3.

- sc1 is preserved byte-semantically as the existing accepted FM06 card object.
- sc2 authors true-name release, the exact accepted full-reward-each passive replacement, and the separate accepted forced battle-win +1 VP branch.
- sc3 authors the exact accepted Divine Core whole-ability effect: discard one Luck, close at most one eligible non-per-game attack per engaged opponent, refund that closed card's effective cost, draw one, then offer the exact drawn card for optional immediate play in turn order with bounded same-round combat Action permission.
- `packages/rules/src/**` production runtime delta from exact Base is EMPTY. No Stheno/card-id/name/printed-text identity routing, runtime Chinese parsing, or `SkillLib` fallback is introduced by this formal consumer migration.

## Material and accounting boundary

Mechanical frozen-roster reconciliation against all `944` canonical identities:

- exact Base material overlap: `140`;
- formal worktree material overlap: `142`;
- exact additions: `servant.stheno.skill.sc-stheno-2`, `servant.stheno.skill.sc-stheno-3`;
- removals: `0`;
- duplicate frozen identities: `0` at Base and Candidate material;
- sc1/sc2/sc3 each occur exactly once in canonical authoring.

Material overlap is not the formal acceptance ledger: exact Base already has material overlap `140` while strict accepted formal accounting is `139/944`. Therefore this transaction claims only the source-grounded new-credit set sc2 + sc3 (`+2`) and does not infer credit from raw material count.

## Focused and affected verification

Fresh exact-scope affected serial run: **8 files / 147 tests PASS**:

- Stheno owner-complete formal regression: `5/5`;
- Divine Core readiness regression: `15/15`;
- full-reward-each readiness regression: `7/7`;
- authoring interpreter: `38/38`;
- executable-card-pack: `50/50`;
- combat resolver: `10/10`;
- resolution-dataflow: `15/15`;
- MatchSession regressions: `7/7`.

The formal regression proves:

- exact owner/class/static metadata and exactly sc1 + sc2 + sc3;
- sc1 JSON object remains unchanged from exact Base;
- sc2 and sc3 only load through their accepted generic whole-shape gateways;
- final 8-mana skill-zone boundary and printed costs are enforced through real play;
- sc2 real multi-winner battle settlement grants full event/competition/location reward to each winner and separately settles the +1 VP battle-win trigger idempotently;
- sc3 real Luck discard -> close/refund/draw -> turn-order exact-drawn-card optional play path executes, grants the bounded combat Action permission, completes its transaction, and survives trusted MatchSession serialization/restore;
- no identity-routed production runtime is introduced.

## Static/content gates

- `npm run typecheck`: PASS;
- `npm run content:validate`: PASS — `7 masters / 12 servants / 20 events / 0 blocking issues`;
- `npm run content:compile`: PASS — same summary;
- `npm run verify:generated-content`: PASS with unchanged hashes:
  - content `b2c446488a28c5036ac36557e09b563b54b11018d5396233a53f37ffdbff6923`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `f4ae33de4dc2832766064bdf46e277d9559398d4d34b45d7d05a0eb76744cd14`;
- `git diff --check`: PASS;
- `packages/rules/src/**` delta: EMPTY.

## Whole-suite baseline comparison

The official Work `npm run test:ci` probe completed with `1166 PASS / 17 FAIL` across `161` test files. These failures are not hidden or treated as green.

A fixed Helper was then loaded at the exact Base `9fd9036c6d74427f88b3b268f9ef2916cf3f3beb`, its workspace packages were built with `npm run typecheck`, and the same `test:ci` command reproduced **12 pre-existing tracked failures** (`1161 PASS / 12 FAIL` across `159` files):

- stale Astolfo material-overlap assertion: `1`;
- M50-02 opponent-close replay: `6`;
- MatchSession authentication timeout: `1`;
- seven-servant deck projection: `1`;
- complex-skills three-round MatchSession timeout: `1`;
- Phase 2 golden-card compiled-content pipeline: `1`;
- Tomoe real-compiled direct-VP regression: `1`.

The five additional Work failures come from local ignored file `packages/rules/tests/.fd-shiki-runtime-debug.test.ts`. `git ls-files --error-unmatch` confirms it is not tracked, and `.git/info/exclude` contains `.fd-*`; it is not part of this Candidate and was not deleted or modified.

The formal Candidate adds one tracked test file with `5/5 PASS`, explaining the tracked test-count delta. A complementary candidate run excluding only the seven mechanically reproduced Base-debt files plus the ignored debug file is fully green: **153 files / 1084 tests PASS**.

These existing full-suite debts remain F4/F5 convergence work; they are not attributed to this Stheno consumer delta.

## Review boundary

Freeze one exact Candidate from Base `9fd9036c6d74427f88b3b268f9ef2916cf3f3beb` on branch `codex/s-p3-owner-stheno-complete-migration`, push one PR, pass the exact-Candidate Phase 3 policy gate, and request one fresh independent R for the complete three-skill owner batch.

No migration credit is granted by this report. Allowed formal verdicts:

- `MIGRATION_ACCEPTED`
- `MIGRATION_NEEDS_REVISION`
- `MIGRATION_BLOCKED`
