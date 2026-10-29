# P3-B Zouken S4 builder candidate R3

- Date: 2026-10-29
- Lane: Builder (GPT-5.6 Luna)
- Base Candidate: `958f58955f7e49d7c71b040f3409d28bc71a0074`
- Parent line: `002927e77b629f85934d9b59598d342f4ba13bc4`
- Scope: exactly `master.zouken.skill.s4` / 间桐脏砚 S4
- Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`

## Reviewer blocker repaired

S4 terminal settlement now consumes a server-owned, persistent ordered phase
receipt manifest committed by the MatchSession scoring barrier. The manifest
records the complete `battleIds`, `resultIds`, scoring receipt ids, canonical
battle outcome order, and the complete terminal participant union. It is
written once per scored phase and cannot be rewritten with a different
manifest.

Before any S4 marker or mana transfer, terminal processing requires the
envelope arrays to match the manifest exactly and in canonical order. Each
entry then independently validates its canonical receipt, battlefield,
winners, losers, scoring participants, scoring logs, and canonical logs.
Restore validation cross-checks every manifest against every receipt in its
phase, including complete coverage, ordinal/order, outcome winners,
participant union, and scoring receipt ids. Reversed, missing/subset,
extra, duplicate, and cross-phase terminal envelopes now fail closed, as do
tampered receipts or manifests during restore.

## Verification evidence

- Focused S4 regression: `9/9 PASS`
- MatchSession + Zouken S3 + battle-terminal + resolution regressions: `48/48 PASS`
- Real seven-player MatchSession (`seed=20261029`) with `p1/p2` at
  `miyama_town`, `p3/p4` at `shinto`: `PASS`; two-battle receipt manifest and
  S4 siphon remain valid after `battleResults` is cleared
- Forged terminal replay negatives: reversed order, subset, extra, duplicate,
  and cross-phase envelopes all rejected before resource mutation
- Serialize/restore negatives: forged receipt and forged manifest rejected
- No-battle MatchSession serialize/restore: `PASS`
- TypeScript project build: `PASS`
- `npm run content:validate`: `14 masters, 7 servants, 20 events, 0 blocking issues`
- `npm run verify:generated-content`: `PASS` (generated content unchanged)
- `git diff --check`: `PASS`

No A-sync, accounting, merge, PR, acceptance, or credit claim is included in
this Builder candidate.
