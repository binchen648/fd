# P3-B Zouken S4 builder candidate R1

- Date: 2026-10-29
- Lane: Builder (GPT-5.6 Luna)
- Base Candidate: `67bbe571cb460d51b9e0b9a92acc07f841919e32`
- Parent line: `c6840697579e178216b6f901669c1a4017f69abd`
- Scope: exactly `master.zouken.skill.s4` / 间桐脏砚 S4
- Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`

## Implemented contract

The active authoring archive and generated playtest library now contain the
three exact source-bound S4 clauses. The runtime reads the authoritative
`manaGainedThisRound` ledger at round end and applies the two-VP loss once per
source and round. Battle-end siphoning accepts only a canonical terminal
`after_battle_ended` envelope whose winners, participants, battle ordinal,
receipt, scoring log, and canonical log all agree with authoritative
`battleResults`; a real loser is capped at three mana, while recon/no legal
loser uses the fixed three-mana fallback. Recipient caps and source deduction
are committed in one transaction and emit source/target/result provenance.

Combat movement validates a live enabled-location target before payment. The
seven-mana payment and movement are resolved atomically with payment event
ordering, and stale/expired/replayed targets fail closed without resource
mutation. Serialize/restore validation covers S4 ledgers, settlement markers,
canonical receipts, deferred post-battle envelopes, pending terminal events,
and source/result identity.

## Verification evidence

- Focused S4 regression: `7/7 PASS`
- Existing MatchSession + Zouken S3 + resolution-dataflow regressions: `50/50 PASS`
- Battle-terminal / battle reward regressions: `25/25 PASS`
- TypeScript project build: `PASS`
- `npm run content:validate`: `14 masters, 7 servants, 20 events, 0 blocking issues`
- `npm run verify:generated-content`: `PASS`
- `git diff --check`: `PASS`

The focused regression covers generated/live MatchSession pack loading,
real `buildBattleTerminalEvent` identity, authoritative round ledger and
restore, true-loser transfer, recon fallback, forged winner/participant and
missing-receipt rejection, duplicate terminal replay, and pre-payment stale
movement-target rollback. No A-sync, accounting, merge, PR, or credit claim
is included in this Builder candidate.
