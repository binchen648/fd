# P3-B Zouken S4 builder candidate R2

- Date: 2026-10-29
- Lane: Builder (GPT-5.6 Luna)
- Base Candidate: `002927e77b629f85934d9b59598d342f4ba13bc4`
- Parent line: `67bbe571cb460d51b9e0b9a92acc07f841919e32`
- Scope: exactly `master.zouken.skill.s4` / 间桐脏砚 S4
- Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`

## Reviewer blocker repaired

The prior terminal handler read `state.battleResults[ordinal - 1]` even
though `applyBattleScoring` intentionally clears that transient array before
post-scoring terminal events are dispatched. It also treated the terminal
event's participant union as if it were the participant set of every single
battle, rejecting valid multi-battle phases.

The handler now derives each battle's authoritative battlefield, winners,
losers, battle participants, and scoring participants only from the persistent
canonical scoring receipt keyed by `resultId`. It independently binds
`battleId`, `resultId`, receipt id, phase resolution, ordinal, battlefield,
canonical scoring log, and canonical log for every envelope entry. The
terminal event may carry the union of all battle participants, but each
receipt's participants must be contained in that union and the final union
must match exactly. Duplicate/cross-battle identities, forged winners or
participants, missing receipts, and restore-time receipt tampering remain
fail-closed. Settlement markers now carry the receipt-bound battlefield.

## Verification evidence

- Focused S4 regression: `8/8 PASS`
- MatchSession + Zouken S3 + battle-terminal + resolution regressions: `47/47 PASS`
- Real seven-player MatchSession (`seed=20261029`) with `p1/p2` at
  `miyama_town`, `p3/p4` at `shinto`: `PASS`; `battleResults=[]` after scoring,
  two independent receipts, one valid p1 siphon, and no cross-battle rejection
- Real serialize/restore: `PASS`; forged canonical receipt restore: rejected
- TypeScript project build: `PASS`
- `npm run content:validate`: `14 masters, 7 servants, 20 events, 0 blocking issues`
- `npm run verify:generated-content`: `PASS` (generated content unchanged)
- `git diff --check`: `PASS`

No A-sync, accounting, merge, PR, acceptance, or credit claim is included in
this Builder candidate.
