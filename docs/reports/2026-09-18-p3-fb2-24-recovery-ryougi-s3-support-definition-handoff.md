# P3-FB2-24 Recovery — Ryougi S3 Support Definition Handoff

Date: 2026-09-18
To: Codex B2
Status: `READY_FOR_B2_RECOVERY`
Base: exact feasibility/dispatch commit created from `e8c312986d9d01c9e28e3e70309c925f6f6a5f4b`
Target: exactly `master.shiki-ryougi.skill.s3`

## Goal

Materialize exactly one frozen support-definition card, `master.shiki-ryougi.skill.s3` (两仪式 / 死・紧握), using only already-accepted generic semantics.

Required static shape:

- archive `master_support_definition_archive`;
- archive id / owner `master.shiki-ryougi`;
- card type `master_skill`;
- `initialPlacement: outside_game`;
- no publicInformation/deck/playable-master surface;
- type label/attribute `魔术`; cost `1`; base Power `0`;
- action play timing; no invented source-text requirement.

Required abilities:

1. append-only clause `此牌需追加打出。` using accepted `append_only_rule`;
2. action-phase exact FB2-23 envelope: one `player` target, count `1..1`, exactly one `same_battlefield_as_controller` constraint, exact effect `inspect_target_hand_optional_return_one_to_owner_deck`, target ref match, source active, automatic execution, and otherwise closed empty envelope.

Do not add `not_controller`; self-selection is legal when the controller is at the same battlefield.

## Exact source/provenance

F1 `59f145434695d29bdd17e4cb3adc887e84182377` is authoritative. Clause hashes:

- append-only: `b8948b29606c56ee673f234c17afe98448ae3986ee1a6155b5b827e23096a239`;
- action interaction: `c3554f0f6f966f69aa14816bcba99bb291db64c13b4ca8f345a74fd4619c95c4`.

Locked Reference `b2f9fa15...` supplies only legacy/static metadata and locator. Do not import/reference-route `core.structured-skill`.

## Expected Candidate scope

Exactly six files:

1. `data/authoring/masters/master.shiki-ryougi.json`;
2. `data/packs/fd-playtest-v1/pack.json`;
3. `data/generated/fd-playtest-v1.content-library.json`;
4. `packages/rules/tests/executable-card-pack.test.ts` — aggregate only `72 -> 73`;
5. `packages/rules/tests/regression/fb2-ryougi-s3-support-definition.test.ts`;
6. result report.

No `packages/rules/src/**`, MatchSession, fixture, evidence, taxonomy/KPI, scripts, Reference/F1, UI/server or second frozen target diff.

## Required validation

At minimum: offline install, typecheck, focused Ryougi + FB2-23 + executable compiler, content validate/compile/determinism, unchanged official full CI, rules core+regression, client build, locked Reference verify, coverage/audit, frozen 944 intersection, identity-routing scan, `git diff --check`, final clean worktree.

Expected material/product from feasibility: `101/136/237`, compiled `73/14/0`, buckets `22/3/131/0/81/130`, audit `131/3/81/20`, frozen material overlap `113/944` with exactly one addition and zero removals.

Stop after Candidate commit/push/stacked PR. Fresh independent `P3-R49-RECOVERY` is mandatory. No post-review A, FM09, FM10 or merge.
