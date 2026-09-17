# P3-R13 — B19 Noble Bloom Extra-VP Independent Review

- Date: 2026-09-14
- Reviewer lane: Codex R
- Candidate SHA: `24c1ef9dba7436204ac3a334edc2483804d00cc3`
- Candidate branch: `codex/b-p3-b19-noble-bloom-extra-vp-r1`
- Reviewer branch: `codex/r-p3-b19-noble-bloom-extra-vp-r1-review`
- Verdict: `GATE_A_B_CANDIDATE_ACCEPTED`

## Findings

No blocking or non-blocking implementation findings.

The candidate is limited to the declared B19 runtime slice. Production changes are confined to `packages/rules/src/ability/interpreter.ts`; `resolution-dataflow.ts` is unchanged. The production diff contains no representative Artoria/card/ability identity routing.

## Independent Gate A / B checks

Fresh reviewer environment:

- `npm ci`: completed;
- `npm run typecheck`: PASS;
- focused/current-lineage compatibility: `9 files / 93 tests PASS`.

Independent static and behavioral review confirms:

- B19 classification is structural and exact: combat `optional_trigger`, `after_battle_result_determined`, exact normalized response window, exactly the highest-Noble-Phantasm condition plus threshold `value=4`, and exactly one controller VP `+1` effect;
- changing the ability ID does not affect classification;
- wrong threshold, amount, trigger, or additional conditions are not exact B19 semantics;
- exact B18 and B19 semantics enter typed resolution before the same-family fail-closed guard;
- malformed same-family shapes reject with `resolution_failed` rather than reaching legacy effect execution;
- production result events carrying `battleParticipantIds` cannot offer B18 or B19 to a controller outside that battle;
- cost below 4 preserves the valid B18 response while exposing no B19 extra response.

Gate A/B judgment: **PASS**.

## Independent-two-window judgment

Accepted.

At cost 4+, the source retains two independent optional responses on the same authoritative result event:

```text
B18 base response  -> optional typed +1 VP
B19 extra response -> optional typed +1 VP
accept both        -> total +2 VP
```

The candidate does not collapse the pair into a single +2 operation. Accepting the base response exposes/retains the independent extra response; declining the extra response does not undo the already accepted base +1 and emits no B19 VP event.

The historical complex-skill regression for the two sequential responses remains green.

## Post-scoring / participant judgment

Accepted. B19 inherits the accepted B13/B18 result-event envelope rather than introducing a new battle queue. The B18 production test remains green for the phase-wide post-scoring barrier, and the exact B19 shape is covered by the same authoritative result-event participant filter.

## Typed Resource / fail-closed / exactly-once judgment

Accepted.

- each accepted response emits its own typed `victory_points_adjusted` event with `delta: 1`;
- B19 uses existing typed Resource resolution; no new resource primitive was added;
- stable result replay does not reopen either settled response;
- malformed threshold semantics fail closed before legacy fallback;
- B19 decline produces no VP adjustment.

## Gate C

Fresh Chromium compatibility run:

```text
7 / 7 PASS
```

The B19 remote-room path independently proves:

- base response appears first;
- B19 extra response remains independent and appears after base settlement;
- pending B19 response survives reconnect with the same authoritative revision;
- B19 accept awards exactly +1 and records exactly one typed B19 VP event;
- settled reconnect preserves total +2 and one event per response;
- stale replay of the B19 command is rejected and cannot duplicate the extra award;
- accepted B13-B18 browser paths remain green in the same run.

Gate C judgment: **PASS**.

## Full-root baseline

Fresh reviewer root Vitest result:

```text
Test files: 103 PASS / 10 FAIL / 113 total
Tests:      677 PASS / 20 FAIL / 697 total
```

All 20 failures are the inherited local CHM/original-image evidence absence class. No new deterministic B19 failure was observed.

## Scope judgment

Accepted without promoting:

- broader optional-trigger ordering;
- Artoria Caster Luck-on-win triggers;
- Gatou battle-end reward;
- Tomoe defeat penalty/unpreventable semantics;
- Olga loss-transform;
- TO15 Modifier/Power;
- TO16 Special;
- A-owned coverage KPI/taxonomy.

## A03 synchronization input

A03 may synchronize the accepted B19 evidence from this reviewer commit. The scoped TO14 direct-consumer overlay may advance from `6/13` to `7/13` only after A03 records a fresh `phase3:coverage` run. Raw KPI values must come from that actual run; no synthetic increment is authorized.

**Final verdict: `GATE_A_B_CANDIDATE_ACCEPTED`.**
