# P3-FB2-17-R3 Recovery Shirou Derived-Card Support Definition Handoff

Date: 2026-09-18
Role: Codex A -> Codex S
Status: `READY_FOR_S_RECOVERY`
Credit: zero frozen-migration credit

## Base

Start from the exact A blocker-synchronization commit carrying this handoff. Do not reuse the dirty R2 experiment. Accepted dependencies remain FB2-18 `cb81559033db6b96b1f26cf7d9bd15686db5d4fb` and revised FB2-19 `211ba4994acaf063834c28bef9525366b88ae463`.

## Goal

Retry exactly `card.derived.master.shirou-emiya.ganjiang-moye` under `authoringMasterSupportFiles` with the exact R2 archive/card contract. The only newly authorized repair is the stale aggregate executable-card test count `70 -> 71` caused by adding exactly one support executable definition.

## May touch

Only:

1. `data/authoring/masters/master.shirou-emiya.json`.
2. `data/packs/fd-playtest-v1/pack.json`.
3. `data/generated/fd-playtest-v1.content-library.json` if official generation changes it.
4. `data/generated/fd-playtest-v1.evidence-report.json` only if official generation changes it.
5. `packages/rules/tests/executable-card-pack.test.ts` — only the exact aggregate production card count `70 -> 71`; no other test/compiler change.
6. `docs/reports/2026-09-18-p3-fb2-17-r3-recovery-shirou-derived-card-support-definition-result.md`.

Fixture must remain unchanged. No loader/compiler/runtime implementation, scripts, taxonomy/KPI, Reference, frozen skill, other authoring archive, UI/server, or unrelated generated output may change.

## Required verification

Re-prove target exact-one registration; 7 playable masters; no Shirou character/fallback/deck; outside-game/no initialZone; 8-mana gate; exact FB2-16 marker; normal archive/sourceMap stability; other eleven frozen FM09 targets absent; deterministic generated outputs; zero frozen credit. Run offline install, typecheck, focused loader/compiler + FB2-15/16/18, content validate/compile/determinism, full `test:ci`, rules core+regression, client build, Reference verify, coverage/audit, `git diff --check`, exact scope and cleanliness.

Completion: `SUPPORT_DEFINITION_COMPLETE_CANDIDATE` or `SUPPORT_DEFINITION_BLOCKED`. A material synchronization and fresh R45 review remain required before acceptance.