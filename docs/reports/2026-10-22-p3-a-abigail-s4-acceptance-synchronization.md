# P3-A Abigail s4 Acceptance Synchronization — 2026-10-22

Role: Codex A  
Status: `SYNCHRONIZED`  
Credit: zero frozen-migration credit

## Exact accepted lineage

- A-sync branch: `codex/a-p3-abigail-s4-acceptance-sync`.
- Exact accepted Candidate SHA: `726e6e55cd51b80d360366e62a0cb6058804265e`.
- Candidate PR: [#662](https://github.com/binchen648/fd/pull/662).
- Candidate branch: `codex/b-p3-abigail-s4-builder`.
- Candidate base branch: `codex/b-p3-abigail-s3b-builder`.
- Independent reviewer: GPT-6 Sol, verdict `MIGRATION_ACCEPTED` for this exact Candidate.

This synchronization starts from the exact independently accepted Candidate and
adds only this A-owned acceptance/accounting report. It does not modify the
Candidate, production/runtime/content/generated files, frozen inventory, or PR
#662, and does not merge the Candidate.

## Accepted executable scope

The newly synchronized scope is exactly one source-bound contract:
`servant.abigail.skill.sc-abigail-4`:

- action-phase `on_use_declared` true-name release on the canonical active
  Outside-Life source;
- exact +6 total-power envelope for the controller and Abigail, with a single
  +6 when Abigail is the controller;
- exact target envelope `[controller, Abigail]` (or `[controller]` when they
  are the same player), rejecting third players, duplicates, and reordering;
- source/owner/controller/provenance/active-zone/visibility/phase validation;
- canonical `after_battle_ended` atomic move of the released card to Abigail's
  owner-only discard and removal of the power envelope;
- event-order independence with accepted s3b cleanup, replay idempotence, and
  restore/replay fail-closed validation;
- generated active-pack authoring and live MatchSession presence evidence.

The already synchronized s3a and s3b contracts are carried by this exact
lineage and are not counted again as newly synchronized contracts. No other
Abigail skill is synchronized by this report.

## Canonical provenance

- Legacy text candidate:
  `E:\Codex\FD\Fate_Domination-重构版\src\content\generated\legacy-content.json`,
  SHA-256 `8DE23E47529D59E1E05BB8FBD74E1FAAADF21687CBCCDD859B5A8ACFB85E277C`,
  locator `servants[178].skills[3].text`;
  - true-name clause SHA-256 `34d0686e0a3e32928564917e173f901363e57039d02d16fb7d63a4003209ab4c`;
  - power clause SHA-256 `6a848e72c9475916be224140aae1bd920e23d7716e82ced6b7c039321ea54a60`;
  - terminal discard clause SHA-256 `04d91af3bd1b263a8e9a2ed8d6562257fc21cdb07810c9344230caa419ad1231`.
- Development source candidate:
  `E:\Codex\FD\Fate_Domination-开发版\batch_berserker_extra.js`, SHA-256
  `6BF26E40FF08FF632AC5DCEE88A9CDA4684E60CA71C39ADADBB239D1F3723FDC`,
  Abigail `x_Foreigner` record.
- Development card image candidate:
  `E:\Codex\FD\Fate_Domination-开发版\images\servants\阿比盖尔·威廉姆斯.png`,
  SHA-256 `3A049A05FC5B7A1C8CA864EA3152239C2E353E15CA509C623487A91B73179D1F`.

The active authoring archive binds the clauses to these source candidates. The
old Abigail runtime was not copied as semantic authorization.

## Owner boundary and accounting

The frozen inventory is unchanged. Abigail status after this synchronization:

| Scope | Synchronization result |
| --- | --- |
| `servant.abigail.skill.sc-abigail-1` | source-only / unchanged |
| `servant.abigail.skill.sc-abigail-2` | source-only / unchanged |
| `servant.abigail.skill.sc-abigail-3` first clause | already synchronized |
| `servant.abigail.skill.sc-abigail-3` second clause | already synchronized |
| `servant.abigail.skill.sc-abigail-4` | synchronized by this report |

Accounting transaction:

- mainline migration credit: `0`;
- recovery migration credit: `0`;
- Candidate/frozen overlap credit: `0`;
- newly synchronized executable contract count: `1` (`sc-abigail-4`);
- newly synchronized frozen canonical identity count: `0`;
- Abigail executable frontier: `s3a + s3b + s4`;
- Abigail owner completion: `3` executable contracts, with s1/s2 remaining
  source-only and uncredited.

This A-sync does not clear any `SOURCE_EVIDENCE_REQUIRED`,
`SEMANTIC_SOURCE_REQUIRED`, or `EXPLICIT_BLOCKED` inventory state and does not
advance global coverage accounting.

## Independent verification from the exact Candidate

- Abigail s3a+s3b+s4 focused regressions: `17/17 PASS`;
- existing MatchSession regression: `30/30 PASS`;
- content compile/validation: `8 masters, 8 servants, 20 events, 0 blocking issues`;
- generated-content determinism: `PASS`;
- playtest verification: `8 masters, 8 servants, 20 events, 96 starting-deck cards, 0 private-view leaks`;
- TypeScript build: `PASS`;
- `git diff --check`: `PASS`.

## Non-effects and next boundary

This synchronization does not alter s1, s2, s3a, s3b, the frozen inventory,
or any other owner. It does not create or modify Candidate PR #662 and does
not merge it. The next legal step is independent integration handling of this
A-sync PR; Abigail s1 and s2 remain outside the synchronized executable
frontier.
