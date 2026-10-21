# P3-A Abigail s3a Acceptance Synchronization — 2026-10-22

Role: Codex A
Status: `SYNCHRONIZED`
Credit: zero frozen-migration credit

## Exact accepted lineage

- A-sync branch: `codex/a-p3-abigail-s3a-acceptance-sync`.
- Exact accepted Candidate SHA: `6424b3463751b29664b8ef56df1819a18aeab454`.
- Candidate PR: [#658](https://github.com/binchen648/fd/pull/658).
- Candidate branch: `codex/b-p3-abigail-s3a-builder`.
- Candidate review base: `a3aecb7d5104a3567153eb0b1e2fb3ca5b2eddb1`.
- Builder baseline: `99a698ed071e184910fe35319a3fd8e191a46f63`.
- Independent reviewer: GPT-6 Sol, verdict `MIGRATION_ACCEPTED` for this exact Candidate.

This synchronization starts from the exact independently accepted Candidate and
adds only this A-owned acceptance/accounting report. It does not modify the
Candidate, production/runtime/content/generated files, frozen inventory, or PR
#658, and does not merge the Candidate.

## Accepted executable scope

The synchronized scope is exactly one source-bound contract:
`servant.abigail.skill.sc-abigail-3` first clause (`s3a`):

- action-phase activation of the active canonical Abigail s3 source card;
- exactly one controller-owned/controller-controlled hand `card_instance` whose
  definition is the canonical Outside-Life derived card;
- exact provenance marker `generatedBy=servant.abigail.skill.sc-abigail-1`;
- atomic movement of that card to `removed_from_game`, followed by typed +2 mana;
- fail-closed source, owner, controller, zone, visibility, target, duplicate,
  stale continuation, replay, and restore validation;
- generated active-pack authoring and live MatchSession presence evidence.

The source archive binds the cross-repository candidates without copying the old
runtime as semantic authorization:

- legacy text candidate:
  `E:\Codex\FD\Fate_Domination-重构版\src\content\generated\legacy-content.json`,
  SHA-256 `8DE23E47529D59E1E05BB8FBD74E1FAAADF21687CBCCDD859B5A8ACFB85E277C`,
  locator `servants[178].skills[2].text#line=1`, clause SHA-256
  `967eb0e8af3fde249604483793fb7d414e2e702dc7f37dff62ebd122b3675838`;
- development source candidate:
  `E:\Codex\FD\Fate_Domination-开发版\batch_berserker_extra.js`, SHA-256
  `6BF26E40FF08FF632AC5DCEE88A9CDA4684E60CA71C39ADADBB239D1F3723FDC`;
- development card image candidate:
  `E:\Codex\FD\Fate_Domination-开发版\images\servants\阿比盖尔·威廉姆斯.png`,
  SHA-256 `3A049A05FC5B7A1C8CA864EA3152239C2E353E15CA509C623487A91B73179D1F`.

## Owner boundary and accounting

The frozen inventory is unchanged. Abigail status after this synchronization:

| Scope | Synchronization result |
| --- | --- |
| `servant.abigail.skill.sc-abigail-1` | source-only / unchanged |
| `servant.abigail.skill.sc-abigail-2` | source-only / unchanged |
| `servant.abigail.skill.sc-abigail-3` first clause | synchronized by this report |
| `servant.abigail.skill.sc-abigail-3` second clause | source-only / unchanged |
| `servant.abigail.skill.sc-abigail-4` | source-only derived-card identity only |

Accounting transaction:

- mainline migration credit: `0`;
- recovery migration credit: `0`;
- Candidate/frozen overlap credit: `0`;
- newly synchronized executable contract count: `1` (`sc-abigail-3` first clause);
- newly synchronized frozen canonical identity count: `0`;
- Abigail executable frontier: `s3a` only;
- owner completion: `1` executable contract, with all other Abigail clauses/skills
  remaining source-only and uncredited.

This A-sync does not clear any `SOURCE_EVIDENCE_REQUIRED`,
`SEMANTIC_SOURCE_REQUIRED`, or `EXPLICIT_BLOCKED` inventory state and does not
advance global coverage accounting.

## Independent verification from the exact Candidate

- Abigail focused regression: `4/4 PASS`;
- existing MatchSession regression: `30/30 PASS`;
- generated-content determinism: `PASS`;
- content validation: `8 masters, 8 servants, 20 events, 0 blocking issues`;
- playtest verification: `PASS`;
- TypeScript build: `PASS`;
- `git diff --check`: `PASS`.

The accepted Candidate's generated evidence retains a non-blocking warning that
the external development image is not present in this checkout; the provenance
path and SHA remain recorded. No old Abigail runtime was copied as semantic
authorization.

## Non-effects and next boundary

This synchronization does not alter s1, s2, s3b, s4, the frozen inventory, or any
other owner. It does not create or modify Candidate PR #658 and does not merge
it. The next legal step is independent integration handling of this A-sync PR;
the remaining Abigail source-only contracts require separate source/runtime
acceptance.
