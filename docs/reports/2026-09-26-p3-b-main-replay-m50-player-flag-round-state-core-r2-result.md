# P3-B Current-Main M50 Player-Flag Round-State Core R2 Replay

Role: Codex B2
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Date: 2026-09-26

## Exact input

- Base: `c5ac8e9f90874a5bbebedf7f28fd80ca2db0d048` (`P3-A-MAIN-REPLAY-SET-PLAYER-FLAG-SCALAR-CONTROLLER-ACCEPTANCE-SYNC`).
- Accepted predecessor capability: PR #452 Candidate `a0f58e40bb82dd33740e9aec395e884cc40b2ab2`, canonical evidence `https://github.com/binchen648/fd/pull/452#issuecomment-5838947759`.
- Historical semantic sources: PR #440 accepted successor `f0e5554e3210e721ae98faa29fc5241b410c5b72` and PR #441 accepted Candidate `fc6d2f52f2d2cebbedc60e9e5d106744b347c8ff`.
- PR #451 / `bdfa753c...` is implementation reference only; it is not formal lineage because its Base descends from the non-canonical planning branch.

## Implemented delta beyond #452

Identity-free server-owned player-flag round-state semantics only:

- direct conditions: `player_flag_equals`, `player_flag_number_at_least`, `player_flag_number_current_round`, `player_flag_number_not_current_round`;
- direct controller-only mutations: `clear_player_flag`, `add_player_flag_number`;
- `set_player_flag` is extended only with exact `current_round` value and optional exact `this_round` lifecycle;
- current-round offsets and numeric add/compare semantics are safe-integer bounded;
- round-scoped flags use `structuredRoundFlagKeysByPlayer` and expire deterministically on authoritative flag access after the round changes;
- MatchSession restore validates finite scalar flag payloads, safe-integer round markers, and real player-key ownership.

The accepted #452 scalar contract is preserved: boolean/string/finite-number controller flags remain valid, including finite fractional values. Numeric add/current-round comparisons require safe integers only when their semantics require integer arithmetic.

`key`, `lifecycle`, and `offset` are **not** added to the global mechanic-key whitelist. They are locally admitted only for exact player-flag/current-round shapes; unrelated mechanics carrying those fields remain fail-closed.

No consumer authoring, arbitrary player targets, status subsystem, event-relation family, resource family, choice/selection, modifier family, card create/movement, identity/name/printed-text/Chinese routing, or SkillLib fallback is added.

## Verification

- focused R2: `1 file / 6 tests PASS`;
- affected chain (R2 + M50-01/02 + FB2-32/33/42/49 + card-source-state + resolution-dataflow + MatchSession): `10 files / 150 tests PASS`;
- `match-session.test.ts`: `30/30 PASS`;
- `npm run typecheck`: `PASS`;
- `npm run phase3:coverage`: `PASS`, `blockingIssues=0`;
- accepted #452 finite scalar compatibility: `1.5` load/runtime/persistence regression `PASS`;
- unrelated `noop` with `key/lifecycle/offset`: loader remains fail-closed;
- strict reconciliation/evidence prefilter under this runtime: `17` identities; readiness only, not migration credit or final S membership;
- Base-to-Candidate `data/authoring/**`: `EMPTY` by construction;
- formal source delta is limited to loader/interpreter/types/MatchSession + one focused test + this report;
- `git diff --check`: `PASS`.

## Accounting

Zero migration credit. Formal/material remains `112/944`, remaining `832`. Exact-50 composition remains blocked until 50 identities pass all loader/runtime plus provenance/semantic recertification gates.
