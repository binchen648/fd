# P3-A Zouken S4 Acceptance Synchronization — 2026-10-22

Role: Codex A
Status: `SYNCHRONIZED`
Credit: zero frozen-migration credit

## Exact accepted lineage

- A synchronization base: `8587818ead1dd60e9e96a2971e06b8c35ade21c1`.
- Candidate PR: [#650](https://github.com/binchen648/fd/pull/650).
- Candidate branch: `codex/b-p3-zouken-s4-builder`.
- Candidate SHA: `8587818ead1dd60e9e96a2971e06b8c35ade21c1`.
- Candidate parent: `605daa8901fb933923f573484400544eff300789`.
- Review base: `f87e8a01fc96e21dbd3f8dc3c1cc8fe7458fbc10`.
- Independent reviewer result: GPT-6 Sol accepted this exact Candidate after R3.

This synchronization starts from the exact independently accepted Candidate and
adds only this A-owned acceptance/accounting report. It does not modify the
Candidate's production/runtime/content/generated files, create another
Candidate, merge PR #650, or edit the frozen inventory.

## Accepted scope and sync frontier

The newly synchronized executable scope is exactly
`master.zouken.skill.s4` / `zouken.pseudo-vampire`:

- round-end authoritative mana-gain ledger: less than three gained means two
  VP lost, clamped and source/round idempotent;
- terminal battle outcome binding to authoritative battle history, including
  exact winner and participant sets, canonical battlefield/ID provenance,
  deterministic loser selection, recon/no-other-participant fallback, cap-aware
  atomic transfer, and phase idempotency;
- combat movement with the exact seven-mana cost, legal enabled-location
  target, payment-before-move ordering, and restore-safe pending target flow;
- generated content-library/evidence presence and live seven-player
  `MatchSession` loading of S4.

The cumulative Zouken executable frontier is now `s1 + s4 + s5`: s1 was
already synchronized by A-sync PR #649, s5 is the pre-existing accepted
contract, and this report synchronizes s4. The remaining owner rows are not
promoted:

| Ability | Synchronization result |
| --- | --- |
| `master.zouken.skill.ascension` | source-only / `SEMANTIC_SOURCE_REQUIRED` |
| `master.zouken.skill.s1` | previously synchronized by A-sync PR #649 |
| `master.zouken.skill.s2` | source-only / `SEMANTIC_SOURCE_REQUIRED` |
| `master.zouken.skill.s3` | source-only / `SEMANTIC_SOURCE_REQUIRED` |
| `master.zouken.skill.s4` | synchronized by this report |
| `master.zouken.skill.s5` | pre-existing accepted runtime contract; unchanged |

## Owner boundary and accounting

The frozen inventory is unchanged. Its Zouken rows retain their existing
`SOURCE_EVIDENCE_REQUIRED`, `SEMANTIC_SOURCE_REQUIRED`, and `EXPLICIT_BLOCK`
boundaries where applicable. This synchronization therefore records:

- mainline migration credit: `0`;
- recovery migration credit: `0`;
- Candidate/frozen overlap credit: `0`;
- newly synchronized runtime contract count: `1` (s4);
- newly synchronized frozen canonical identity count: `0`;
- newly synchronized owner completion count: `0` (the owner remains partial).

This is acceptance synchronization/accounting, not a claim of six-skill owner
completion or frozen-inventory promotion.

## Evidence synchronized from the accepted Candidate

The exact Candidate contains the S4 source-bound authoring archive, strict
interpreter contract, restore validation, generated content-library and
evidence report, and focused/live regression coverage. The generated artifacts
contain `master.zouken.skill.s4` with all three source-bound abilities and its
evidence/source-map entry. The live regression verifies that a real
seven-player `MatchSession` loads the same S4 definition into both its runtime
pack and raw-card map and provisions the Zouken S4 skill instance.

The Candidate's provenance report binds the development source and card art;
the cross-repository legacy texts remain provenance evidence only and are not
treated as semantic authorization. No old Zouken runtime was copied by this
A-sync.

## Independent verification from the exact Candidate

- S4 focused regression: `9/9 PASS`;
- S4/S1/owner focused regressions: `15/15 PASS`;
- MatchSession plus battle-terminal regressions with a 30-second per-test
  timeout: `45/45 PASS`;
- content validation: `8 masters, 7 servants, 20 events, 0 blocking issues`;
- generated-content determinism: `PASS`;
- TypeScript build: `PASS`;
- `git diff --check`: `PASS`.

The default five-second test setting still times out on the pre-existing
eleven-round long test; the same timeout occurs on the s1 base and the exact
Candidate passes with the explicit 30-second test timeout.

## Non-effects and next boundary

This synchronization does not alter frozen inventory counts, semantic-axis
classification, global coverage denominators, s1 or s5 behavior, or any other
owner. It does not create a promotion or merge PR #650. The next legal step is
independent integration/review handling of this A-sync commit; Zouken
ascension, s2, and s3 remain source-only until separately accepted.
