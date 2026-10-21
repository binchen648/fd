# P3-A Zouken s1 Acceptance Synchronization — 2026-10-22

Role: Codex A
Status: `SYNCHRONIZED`
Credit: zero frozen-migration credit

## Exact accepted lineage

- A synchronization base: `f87e8a01fc96e21dbd3f8dc3c1cc8fe7458fbc10`.
- Candidate PR: [#648](https://github.com/binchen648/fd/pull/648).
- Candidate branch: `codex/b-p3-zouken-s1-successor`.
- Candidate SHA: `f87e8a01fc96e21dbd3f8dc3c1cc8fe7458fbc10`.
- Candidate parent: `eb2d542115bd7a63132619972e5510781ccbd279`.
- Independent reviewer result: GPT-6 Sol accepted the exact Candidate after R2.

This synchronization starts from the exact independently accepted Candidate and
adds only this A-owned acceptance/accounting report. It does not modify the
Candidate's production/runtime/content files, create another Candidate, or
merge PR #648.

## Accepted scope

The synchronized executable scope is exactly:

- `master.zouken.skill.s1` / `zouken.dead-in-great-cavern`;
- game-start controller mana set to exactly `10`;
- authoritative controller mana cap set to exactly `16`;
- later mana gains clamped to the authoritative cap;
- restore/replay idempotency through the existing runtime event path;
- fixed seven-player session sampling from an expanded eight-master content
  pool, preserving the established `MatchSession` contract.

The implementation is fail-closed and shape-bound. It does not authorize a
generic `game_start` `set_mana` handler, arbitrary cap values, or any legacy
Zouken runtime route.

## Owner boundary and accounting

The complete owner remains out of scope. The current active/archive boundary is:

| Ability | Synchronization result |
| --- | --- |
| `master.zouken.skill.ascension` | source-only / `SEMANTIC_SOURCE_REQUIRED` |
| `master.zouken.skill.s1` | accepted Candidate runtime contract; synchronized here |
| `master.zouken.skill.s2` | source-only / `SEMANTIC_SOURCE_REQUIRED` |
| `master.zouken.skill.s3` | source-only / `SEMANTIC_SOURCE_REQUIRED` |
| `master.zouken.skill.s4` | source-only / `SEMANTIC_SOURCE_REQUIRED` |
| `master.zouken.skill.s5` | pre-existing accepted runtime contract; unchanged |

The frozen inventory is not edited. Its Zouken rows retain their existing
`SOURCE_EVIDENCE_REQUIRED`, `SEMANTIC_SOURCE_REQUIRED`, and
`EXPLICIT_BLOCK` boundaries. Consequently:

- mainline migration credit: `0`;
- recovery migration credit: `0`;
- Candidate/frozen overlap credit: `0`;
- newly synchronized runtime contract count: `1` (s1 only);
- newly synchronized frozen canonical identity count: `0`.

This is acceptance synchronization/accounting, not a claim of six-skill owner
completion or frozen-inventory promotion.

## Evidence synchronized from the accepted Candidate

The exact Candidate contains the active s1 authoring archive, its bound source
and card-art provenance, the exact loader/interpreter contract, and the
deterministic generated content/evidence artifacts. It also contains the
seven-player roster repair: the runtime samples exactly seven entries after
deterministic shuffle instead of mapping the entire expanded master pool onto
the fixed seven-player state.

Source/provenance authority remains the Candidate's existing Builder records;
this report does not promote the cross-repository legacy texts or old runtime
handlers as new semantic authority.

## Independent verification

Re-run from exact Candidate SHA before this synchronization:

- `npm exec vitest run packages/rules/tests/regression/p3-zouken-s1-mana-bootstrap.test.ts packages/rules/tests/regression/zouken-owner-builder.test.ts`: `6/6 PASS`;
- `npm exec vitest run packages/rules/tests/match-session.test.ts`: `30/30 PASS`;
- `npm run content:validate`: `8 masters, 7 servants, 20 events, 0 blocking issues`;
- `npm run typecheck`: `PASS`;
- `git diff --check`: `PASS`.

The s1 focused suite includes the expanded-pool/fixed-seven-player regression,
exact mana/cap behavior, cap-clamped gain, trusted restore/replay idempotency,
and loader/semantic rejection of malformed contract shapes.

## Non-effects and next boundary

This synchronization does not alter frozen inventory counts, semantic-axis
classification, global coverage denominators, s2/s3/s4 provisioning, ascension
targeting, s5 behavior, or any other owner. It does not create a promotion or
merge PR #648. The next legal step is independent integration/review handling
of this A-sync commit; the remaining four source-only Zouken skills stay
blocked until their source and target-runtime contracts are separately
accepted.
