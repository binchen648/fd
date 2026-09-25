# P3-B Current-Main M50 Player-Flag / State Core Replay

Role: Codex B2
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Date: 2026-09-26

## Exact input

- Base: `2f104335e3e943db1f2fe550596e93de3cfe35e6` (`P3-A-F4-EXACT-50-COMPOSITION-01-RESULT`).
- Historical accepted semantic sources: PR #440 accepted successor `f0e5554e3210e721ae98faa29fc5241b410c5b72` and PR #441 accepted Candidate `fc6d2f52f2d2cebbedc60e9e5d106744b347c8ff`.
- Canonical evidence: `https://github.com/binchen648/fd/pull/440#issuecomment-5805914781`, `https://github.com/binchen648/fd/pull/441#issuecomment-5825842148`.

## Implemented contract

Identity-free server-owned structured player-flag/state core only:

- direct ability conditions: `player_flag_equals`, `player_flag_number_at_least`, `player_flag_number_current_round`, `player_flag_number_not_current_round`;
- direct ability effects: `set_player_flag`, `clear_player_flag`, `add_player_flag_number`;
- all flag mutations target only `controller` in this replay;
- flag values are limited to boolean, string, safe integer, or exact `current_round` value for `set_player_flag`;
- optional flag lifecycle is limited to exact `this_round`;
- current-round flags are server-owned and expire deterministically on first authoritative flag access after the round changes;
- numeric add rejects non-safe prior state and overflow;
- runtime persistence uses bounded `structuredPlayerFlagsByPlayer` / `structuredRoundFlagKeysByPlayer` maps with MatchSession restore validation and player-reference validation.

No consumer authoring, choice/selection, status, event-relation, resource, formula/metric, modifier, trigger-producer, card-create, movement, identity/name/printed-text/Chinese routing, or SkillLib fallback is added.

## Verification

- focused player-flag/state core: `1 file / 6 tests PASS`;
- affected chain (player-flag core + M50-01/02 + FB2-32/33/42/49 + card-source-state + resolution-dataflow + full match-session): `10 files / 150 tests PASS`;
- `match-session.test.ts`: `30/30 PASS`;
- `npm run typecheck`: `PASS`;
- `npm run phase3:coverage`: `PASS`, `blockingIssues=0`;
- valid structured flag persistence round-trip: `PASS`;
- host-signed malformed nested flag payload restore: rejected;
- host-signed unknown-player flag owner restore: rejected;
- exact-50 strict loader/material/evidence prefilter under this Candidate rises mechanically from `8` to `17`; this is readiness evidence only, not migration credit;
- Base-to-Candidate `data/authoring/**` delta: `EMPTY`;
- production identity/name/printed-text/Chinese/SkillLib routing audit: `CLEAN`;
- exact Base-to-Candidate `git diff --check`: `PASS`.

## Accounting

Zero migration credit. Formal/material remains `112/944`, remaining `832`. Acceptance/synchronization of this capability only enlarges the future exact-50 eligibility pool.
