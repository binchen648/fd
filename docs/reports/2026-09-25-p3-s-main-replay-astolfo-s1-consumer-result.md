# P3-S Current-Main Astolfo S1 Consumer Replay Result

Role: Codex S
Status: `MIGRATION_COMPLETE_CANDIDATE`
Date: 2026-09-25

## Exact dispatch input

- Task: `P3-S-MAIN-REPLAY-ASTOLFO-S1-CONSUMER`
- Exact A synchronization Base: `7c2ee773a8ca36fde7cc2812c86e9cb20cdb83e2`
- A branch: `codex/a-p3-main-replay-fb2-49-acceptance-sync`
- S branch: `codex/s-p3-main-replay-astolfo-s1-consumer`
- Current-main FB2-49 accepted Candidate: `658849d1602bd4b705a924f6aa649e973d9d65ca`
- Current-main FB2-49 evidence: `https://github.com/binchen648/fd/pull/445#issuecomment-5832739229`
- Historical source migration: PR #423 Base `2909898608d0d986fbc77b5936bdfbfdcf0ed953` -> accepted Candidate `110257b76a957a5bba39ea1822f7861cecf288a9`
- Historical reviewer evidence: `https://github.com/binchen648/fd/pull/423#issuecomment-5775187822`
- Reconciliation authority: PR #442 / `artifacts/phase3-frontier-reconciliation.json`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

Historical PR #423 is used only as source/semantic/test evidence. No frontier commit is cherry-picked, merged, retargeted or used as current-main ancestry.

## Migrated frozen identity

Exactly one frozen identity is added:

- canonical id: `servant.astolfo.skill.sc-astolfo-1`
- owner: `servant.astolfo`
- class: `Rider`
- legacy id / alias: `sc_astolfo_1`
- card name: `唤起恐慌之魔笛`
- printed cost: `4`
- base power: `1`
- canonical skill-zone mana requirement: `8`
- ability id: `panic-flute-close-to-one`
- exact F1 clause SHA-256: `693e886ed5695721ec10dce30d64b978e45407eba1b81de3c7c5401f8bcb4e67`
- exact full printed-text SHA-256: `a66f9f8f2f72bea1f7b801459ea742cc4359723a847ef5a5a855501c3ac6d083`

The authoring preserves the historically accepted whole-card shape while binding `acceptedContracts.opponentCloseToOne` to the newly synchronized current-main `P3-A-MAIN-REPLAY-FB2-49-ACCEPTANCE-SYNCHRONIZATION` contract.

## Current-main semantic replay

`data/authoring/servants/servant.astolfo.json` contains exactly the dispatched Astolfo S1 card. It preserves:

- action-window skill-card play;
- `skill_zone_mana_at_least: 8` with printed cost 4;
- combat `phase_action` / `controller_combat_action_window`;
- ordered `source_owned` + `at_battlefield` conditions;
- exactly one `opponent_close_non_residual_to_one` effect;
- no targets/cost/creates/rule-modifier widening;
- true-name reveal on declaration for the servant package;
- automatic execution through the accepted current-main FB2-49 capability.

No production runtime is changed. No identity/name/printed-text/Chinese runtime route or SkillLib fallback is added.

## Focused whole-card evidence

`packages/rules/tests/astolfo-s1-consumer-migration.test.ts` is adapted from the independently accepted historical whole-card test to current-main accounting. The semantic checks remain intact; only stale frontier-wide material assumptions were removed/rebased.

The exact snapshot verifies:

1. source/static metadata and source hashes;
2. loader `report=[]` and exact accepted FB2-49 whole-ability admission;
3. 7-mana mutation-free rejection and 8-mana success paying printed cost 4;
4. combat activation and true-name reveal;
5. private, non-cancellable keep-one decisions for eligible opponents;
6. correct close settlement while residual/remote cards remain unaffected;
7. source ownership / battlefield negatives;
8. forged selection and stale frozen provenance fail closed;
9. authenticated FB2-49 persistence round-trip and drift rejection;
10. product/generated outputs remain unregistered;
11. frozen material accounting is exactly current-main `112/944`, exact +1 Astolfo S1, duplicates 0.

No historical Spartacus compatibility edit is replayed because that old test/path is absent on current main and no current-main baseline coupling requires it.

## S recertification / exact snapshot validation

Validation was run on an exact temporary Git-index snapshot rooted at Base `7c2ee773a8ca36fde7cc2812c86e9cb20cdb83e2` plus only the Astolfo authoring/test changes. The live canonical worktree's unrelated dirty files were therefore unable to affect these results.

- `npm.cmd run typecheck` — PASS.
- focused current-main set — PASS, **5 files / 75 tests**:
  - Astolfo S1: 9/9;
  - FB2-49: 51/51;
  - FB2-42: 9/9;
  - MatchRoom: 5/5;
  - MatchRoomHub: 1/1.
- official `npm.cmd run test:ci -- --maxWorkers=2` — PASS, **133 files / 933 tests**.
- `npm.cmd run content:validate` — PASS: **7 masters / 7 servants / 20 events / 0 blocking issues**.
- `npm.cmd run verify:generated-content` — PASS.
- generated hashes:
  - `fd-playtest-v1.content-library.json`: `c9841d4bad3d43a525895372fabd3b49ea07e79075652a5cbd18fad3405e2e1e`;
  - `fd-playtest-v1.fixture.json`: `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - `fd-playtest-v1.evidence-report.json`: `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- frozen rescan — `943 static + 1 dynamic = 944`; **112 unique / 112 occurrences**; duplicates `0`; dynamic materialized `0`; Astolfo S1 count `1`; remaining material gap `832`.
- Base -> Candidate authoring delta — exactly one added path / one frozen identity: `data/authoring/servants/servant.astolfo.json` / `servant.astolfo.skill.sc-astolfo-1`.
- frozen removals: `0`.
- second frozen identity additions: `0`.
- production runtime / product pack / generated product / client production changes: `0`.
- pre-report `git diff-tree --check`: PASS; final tree diff-check is required immediately before Candidate commit.

These gates complete S recertification for the dispatched exact Base.

## Accounting / next gate

Candidate material is **112/944**, but formal current-main migration remains **111/944** until fresh independent R returns `MIGRATION_ACCEPTED` for the exact Candidate and A performs acceptance synchronization. No early credit is claimed.

Candidate scope is exactly:

- `data/authoring/servants/servant.astolfo.json`;
- `packages/rules/tests/astolfo-s1-consumer-migration.test.ts`;
- this result report.

Long-term S rule: **S 完成 recertification 并提交 Exact Base/Candidate**。

The exact Candidate SHA is established by the commit containing this report and is submitted together with the exact Base above to fresh independent R.
