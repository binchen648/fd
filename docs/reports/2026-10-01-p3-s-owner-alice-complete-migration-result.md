# P3-S Alice Owner-Complete Migration Result

Date: 2026-10-01
Task: `P3-S-OWNER-ALICE-COMPLETE-MIGRATION`
Exact Base: `d27b48301ea11f8743e62e7222b5006169b88e31`
Accounting before acceptance: `186/944`, remaining `758`.

## Frozen owner scope

- `master.alice.skill.ascension` — Queenside Castle
- `master.alice.skill.s1` — 赛博幽灵
- `master.alice.skill.s2` — 幻影爱丽丝

All three are absent at Base and materialized together in one canonical owner archive. They remain only provisionally newly creditable until exact formal acceptance + A-sync/accounting.

## Formal consumer

- Adds `data/authoring/masters/master.alice.json` and appends Alice exactly once immediately after Akiha in `authoringMasterFiles`.
- Initial mana: `4`.
- `Queenside Castle`: `outside_game`, 魔术, cost `5`, requirement `5`, base Power `1`.
- Explicit development-image source: `../../Fate_Domination-开发版/images/masters/爱丽丝.png`.
- Runtime effects consume only accepted generic multi-presence semantics from #510/#511; no production Alice identity routing is introduced.

## Canonical behavior coverage

- Cyber Ghost: previous-battle-loss marker, preparation deployment, movement mirror, actual-paid-mana batch tax.
- Phantom Alice: one logical player / shared-player multi-presence authority.
- Queenside Castle: shared terrain and Action sacrifice of phantom followed by old-location defeat authority.
- Presence-context and symmetric movement are inherited from accepted #511 successor `49e2afa5554a380b644adc7fbfe035ba8278525d`.

## Verification

- Alice formal regression: `7/7 PASS`.
- Alice readiness regression: `10/10 PASS`.
- Directly affected/shared aggregate: `210/210 PASS` across executable pack, pack loader, provisioning, authoring interpreter, MatchSession, MatchSession regressions, combat/map and resolution dataflow.
- `FD_TOOLCHAIN_OK`.
- typecheck PASS.
- content validate/compile: `10 masters / 19 servants / 20 events / 0 blocking issues`.
- generated determinism PASS.
- production runtime delta EMPTY.
- production Alice identity audit CLEAN.
- `git diff --check` PASS.
- hashes:
  - content-library `cde732266c8ca18995ddacb54a4fd1f273379c4ea2497fdf672218949edd0e3b`
  - fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`
  - evidence-report `d49a5ca87cf614cbba8140b1890225a51548c11479551577033f37615407c7a2`

## Governance

This is the one formal owner-complete Alice Candidate. No migration credit is granted by implementation or Reviewer alone. Only exact `MIGRATION_ACCEPTED` followed by FORMAL A-sync/accounting may add up to `+3` and move strict accounting to `189/944`, remaining `755`.
