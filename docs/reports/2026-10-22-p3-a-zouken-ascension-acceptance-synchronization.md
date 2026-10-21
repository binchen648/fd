# P3-A Zouken Ascension Acceptance Synchronization — 2026-10-22

Role: Codex A  
Status: `SYNCHRONIZED`  
Credit: zero frozen-migration credit

## Exact accepted lineage

- A-sync base: `94e05581bb1dc62c01fa69f8e30fb1e8e8f9eb10`.
- Candidate PR: [#652](https://github.com/binchen648/fd/pull/652).
- Candidate branch: `codex/b-p3-zouken-ascension-builder`.
- Exact accepted Candidate SHA: `94e05581bb1dc62c01fa69f8e30fb1e8e8f9eb10`.
- Candidate parent: `b92e800bfaa126b3483c767c1e201ccb0a6a2b0a`.
- Candidate review base: `8587818ead1dd60e9e96a2971e06b8c35ade21c1`.
- Independent reviewer: GPT-6 Sol, verdict `MIGRATION_ACCEPTED`.

This synchronization starts from the exact independently accepted Candidate and
adds only this A-owned acceptance/accounting report. It does not modify the
Candidate, production/runtime/content files, frozen inventory, or PR #652, and
does not merge the Candidate.

## Accepted executable scope

The newly synchronized scope is exactly `master.zouken.skill.ascension`:

- exact active passive predicate that bypasses movement engagement and removes
  the accepted S4 pseudo-vampire controller-win gate;
- action-phase payment of six mana for one active opponent on the controller's
  battlefield, with an exact one-seal lower bound and atomic target transfer;
- stale continuation rejection when phase, source activity, mana, battlefield,
  target activity, or target seal state changes before selection resolution;
- JSON restore/replay-safe pending decisions and live seven-player
  `MatchSession` generated-pack presence.

The source archive binds the development text and card image through the
cross-repository audit. Its active card uses `typeLabel: 升华技` and ascension
clause locators `legacy-content.json#masters[14].skills[5].text#line=1/2`.
The generated content/evidence hashes from the accepted Candidate are retained
unchanged by this A-sync.

## Owner boundary and accounting

The frozen inventory is unchanged. Current Zouken synchronization state:

| Ability | Synchronization result |
| --- | --- |
| `master.zouken.skill.ascension` | synchronized by this report |
| `master.zouken.skill.s1` | previously synchronized by A-sync PR #649 |
| `master.zouken.skill.s2` | source-only / `SEMANTIC_SOURCE_REQUIRED` |
| `master.zouken.skill.s3` | source-only / `SEMANTIC_SOURCE_REQUIRED` |
| `master.zouken.skill.s4` | synchronized by A-sync PR #651 |
| `master.zouken.skill.s5` | pre-existing accepted runtime contract; unchanged |

Accounting transaction:

- mainline migration credit: `0`;
- recovery migration credit: `0`;
- Candidate/frozen overlap credit: `0`;
- newly synchronized runtime contract count: `1` (ascension);
- newly synchronized frozen canonical identity count: `0`;
- cumulative Zouken executable runtime frontier: `ascension + s1 + s4 + s5`;
- owner completion: `4/6`; s2 and s3 remain source-only and uncredited.

This is acceptance synchronization/accounting, not frozen-inventory promotion or
claim of complete six-skill owner migration.

## Independent verification from the exact Candidate

- ascension focused regression: `7/7 PASS`;
- s1/s4/ascension plus MatchSession regressions: `50/50 PASS`;
- generated-content determinism: `PASS`;
- content validation: `8 masters, 7 servants, 20 events, 0 blocking issues`;
- TypeScript build: `PASS`;
- `git diff --check`: `PASS`.

The Candidate's stale continuation regression proves that a phase/source/target
change cannot consume mana or command seals. No old Zouken runtime was copied as
semantic authorization by this synchronization.

## Non-effects and next boundary

This synchronization does not alter frozen inventory counts, semantic-axis
classification, global coverage denominators, s1/s4/s5 behavior, or any other
owner. It does not create a Candidate or merge PR #652. The next legal step is
independent integration handling of this A-sync PR; Zouken s2 and s3 remain
blocked until separately accepted target-runtime contracts exist.
