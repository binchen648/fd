# P3-FB2-17-R2 Recovery Shirou Derived-Card Support Definition Retry Handoff

Date: 2026-09-18
Role: Codex A -> Codex S
Status: `READY_FOR_S_RECOVERY`
Credit: zero frozen-migration credit

## Base and authority

- Base: exact post-R44-R2 A acceptance-synchronization commit carrying this handoff.
- Accepted FB2-18 candidate: `cb81559033db6b96b1f26cf7d9bd15686db5d4fb` (`initialPlacement: "outside_game"`).
- Accepted FB2-19 revised candidate: `211ba4994acaf063834c28bef9525366b88ae463` (support-only registration, including R44-R1 compiler fail-closed repair).
- R43 verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`.
- R44-R2 verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`, no blocking finding.
- Prior fresh FB2-17-R1 blocker: `7e0356146766486180bcd959ee4e90dcfe193be5`.
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`.
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.
- Support target: `card.derived.master.shirou-emiya.ganjiang-moye`.

Historical FB2-17-R2/R3 worktrees and commits are technical evidence only. Do not inherit their blocker/acceptance conclusions; re-run the retry from this current integrated recovery lineage.

## Goal

Materialize exactly one **non-frozen derived support definition**, `card.derived.master.shirou-emiya.ganjiang-moye`, so accepted FB2-15 may later provision it, accepted FB2-18 keeps it outside game initially, accepted FB2-16 supplies its required-additional marker semantics, and accepted FB2-19 keeps the archive rules-only rather than creating an eighth playable master.

Do **not** migrate frozen `master.shirou-emiya.skill.s2` in this task.

F1 remains authoritative for the future provisioning relation: `游戏开始时，将【干将·莫邪】从游戏外加入技能区。` Source-text SHA: `a0ea1f45cedb3ac69c9d4050cfdadcf318cf32f62b749013a8454245535ca575`.

Locked Reference may supply stable identity/static metadata/source locator only: id, name `干将·莫邪`, owner `master.shirou-emiya`, `master_skill`, cost `1`, base Power `5`, attributes `力量` + `宝具`, skill-zone mana requirement `8`, printed text, and source locator. Do not copy Reference implementation/runtime routing.

## Exact archive/card contract

Create `data/authoring/masters/master.shirou-emiya.json` as exactly one support-only archive:

- `schemaVersion: "fd-card-authoring-v1"`;
- `archiveType: "master_support_definition_archive"` exactly;
- id `master.shirou-emiya`;
- no `publicInformation` and no `deck`;
- exactly one card, the derived target.

Register it only in `authoringMasterSupportFiles` in `data/packs/fd-playtest-v1/pack.json`.

The card must use exact `initialPlacement: "outside_game"`, `cardType: "master_skill"`, cost/basePower `1/5`, attributes `力量` + `宝具`, `skill_zone_mana_at_least = 8`, ordinary action/controller play timing, and the accepted FB2-16 bare required-additional marker: passive + exact `while_active` activation + effects exactly `[{ type: "append_only_rule" }]` + automatic execution, with no extra marker fields.

## May touch

Only:

1. `data/authoring/masters/master.shirou-emiya.json` — new support-only archive.
2. `data/packs/fd-playtest-v1/pack.json` — register under `authoringMasterSupportFiles` only.
3. `data/generated/fd-playtest-v1.content-library.json` — official deterministic output only if changed.
4. `data/generated/fd-playtest-v1.evidence-report.json` — official deterministic output only if changed.
5. `docs/reports/2026-09-18-p3-fb2-17-r2-recovery-shirou-derived-card-support-definition-result.md` — result report.

`data/generated/fd-playtest-v1.fixture.json` must remain unchanged. No `packages/`, runtime/compiler, scripts, taxonomy/KPI, Reference, other authoring archive, frozen skill, UI/server, or unrelated generated file may change.

If a required gate reveals a stale baseline outside this May-touch scope, do not edit it here. Return `SUPPORT_DEFINITION_BLOCKED` with exact evidence.

## Required verification

Prove from the fresh R2 lineage:

- target absent -> exactly one canonical registered definition;
- `library.masters` and fixture remain exactly 7 playable masters;
- support archive appears after normal rules archives without shifting existing normal indices;
- executable owner is `master.shirou-emiya`, placement is outside-game, `initialZone` absent;
- no Shirou executable character, fallback command spell, generated command-spell card, deck, or playable setup surface;
- 8-mana gate and exact FB2-16 marker survive authoring -> loaded rules -> executable product;
- generated definition/content hashes update coherently and deterministically;
- other eleven frozen FM09 provisioning targets remain absent;
- zero frozen identity added; accepted overlap remains `111/944`;
- `npm ci --offline`, typecheck, focused content-loader/executable-pack/FB2-15/16/18, content validation, official content compilation, generated determinism, full `test:ci`, `git diff --check`, exact scope/identity-routing scan, and final cleanliness.

Completion status is `SUPPORT_DEFINITION_COMPLETE_CANDIDATE` or `SUPPORT_DEFINITION_BLOCKED`. Do not continue FM09 or another dependency after this task; A must synchronize the result first.