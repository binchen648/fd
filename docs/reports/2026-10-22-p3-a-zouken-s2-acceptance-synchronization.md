# P3-A Zouken S2 Acceptance Synchronization — 2026-10-22

Role: Codex A  
Status: `SYNCHRONIZED`  
Credit: zero frozen-migration credit

## Exact accepted lineage

- A-sync branch: `codex/a-p3-zouken-s2-acceptance-sync`.
- A-sync base and exact accepted Candidate SHA: `99a698ed071e184910fe35319a3fd8e191a46f63`.
- Candidate PR: [#656](https://github.com/binchen648/fd/pull/656).
- Candidate branch: `codex/b-p3-zouken-s2-builder-r1`.
- Candidate review base: `d655a727c3f07c36e5e5d11beca689bfae1e1618` (`codex/b-p3-zouken-s3-builder-r2`).
- Candidate predecessor chain: `dd374665fe660cbd63f48005e796ae3b49dadaa2` → `9788f5294b98226af2739c5d455323cc7b120bb6` → `99a698ed071e184910fe35319a3fd8e191a46f63`.
- Independent reviewer: GPT-6 Sol, verdict `MIGRATION_ACCEPTED` for this exact Candidate.

This synchronization starts from the exact independently accepted Candidate and
adds only this A-owned acceptance/accounting report. It does not modify the
Candidate, production/runtime/content/generated files, frozen inventory, or PR
#656, and does not merge the Candidate.

## Accepted executable scope

The synchronized scope is exactly `master.zouken.skill.s2`
(`五百年的活尸`):

- exact automatic `game_start` provisioning of the canonical s3 and s4 skill
  definitions, in fixed order, with same-owner and owner/controller-bound
  skill-card materialization;
- deferred target definitions remain outside initial placement and are created
  face-up, inactive, owner-only skill cards with source-instance `generatedBy`
  provenance;
- canonical s3/s4 target IDs, owner, mode, card type, initial-zone state, and
  ability ID sets are checked both at pack compile time and runtime;
- duplicate valid material is retained and repeated/replayed game-start is
  idempotent, while duplicate, forged, cross-owner, reordered, inert, or
  malformed material fails closed;
- runtime source mode and source ownership are revalidated before provisioning;
  rejected s2 game-start attempts are side-effect-free, including no
  `processedEvents` or `revision` bookkeeping;
- MatchSession restore/replay validates the resulting source/target ownership,
  zone, visibility, and provenance contract.

Canonical provenance remains bound to the development text at
`Fate_Domination-开发版/data_masters.js`, locator
`line=19#record=m_zouken.s2`, normalized text SHA
`8b8f4b24424a8600807fd42c0965fad94bd6f9dcdc9917efe10f1bff8b17f3e3`,
development image SHA
`4E4F3F5607D7B39BC16F4ACB01831976E4036F38EBC180514C4E6BC28F75C6B9`, and
legacy snapshot candidate SHA
`BFF4C268CA3F292E3F32FD2A3B51C7520E3D8C475C703BDB854A43B48318BF2A`.
No old Zouken runtime was copied as semantic authorization.

## Owner boundary and accounting

The frozen inventory is unchanged:

| Ability | Synchronization result |
| --- | --- |
| `master.zouken.skill.ascension` | previously synchronized by A-sync PR #653 |
| `master.zouken.skill.s1` | previously synchronized by A-sync PR #649 |
| `master.zouken.skill.s2` | synchronized by this report |
| `master.zouken.skill.s3` | previously synchronized by A-sync PR #655 |
| `master.zouken.skill.s4` | previously synchronized by A-sync PR #651 |
| `master.zouken.skill.s5` | pre-existing accepted runtime contract; unchanged |

Accounting transaction:

- mainline migration credit: `0`;
- recovery migration credit: `0`;
- Candidate/frozen overlap credit: `0`;
- newly synchronized runtime contract count: `1` (s2);
- newly synchronized frozen canonical identity count: `0`;
- cumulative Zouken executable runtime frontier: `ascension + s1 + s2 + s3 + s4 + s5`;
- owner completion: `6/6` executable runtime contracts, with no frozen-inventory promotion claim.

This is acceptance synchronization/accounting only. It does not modify frozen
inventory counts, semantic-axis classification, or global coverage accounting.

## Independent verification from the exact Candidate

- s2 focused regression: `5/5 PASS`;
- s2 + s1/s3/s4/ascension + generic provisioning regressions: `41/41 PASS`;
- MatchSession: `30/30 PASS`;
- generated-content determinism: `PASS`;
- content validation: `8 masters, 7 servants, 20 events, 0 blocking issues`;
- TypeScript build: `PASS`;
- `git diff --check`: `PASS`;
- A-sync worktree contains no production changes beyond this report.

## Non-effects and next boundary

This synchronization does not alter s1/s3/s4/s5/ascension behavior or any
other owner. It does not create or modify Candidate PR #656 and does not merge
it. The next legal step is independent integration handling of this A-sync PR.
