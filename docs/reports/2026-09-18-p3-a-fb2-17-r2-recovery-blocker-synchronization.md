# P3-A FB2-17-R2 Recovery Blocker Synchronization / R3 Dispatch

Date: 2026-09-18
Role: Codex A
Status: `SYNCHRONIZED`
Credit: zero frozen-migration credit

## Exact lineage

- Post-R44-R2 A sync: `2756ffe13d4bc181b4a00032afd1d9475064fc00`.
- Fresh R2 blocker: `d020adc97f53b16371109b5aaa1ecd77bab6be0b`.
- Accepted FB2-18: `cb81559033db6b96b1f26cf7d9bd15686db5d4fb`.
- Accepted FB2-19 revised candidate: `211ba4994acaf063834c28bef9525366b88ae463`.

R2 commits only its blocker report. Its separate worktree intentionally retains three uncommitted experimental product changes as non-authoritative evidence.

## Blocker reconciliation

Fresh R2 proves the support definition itself is valid on the current recovery lineage: official content validation/compile/determinism pass; playable masters remain 7; characters remain 14; the derived target registers exactly once outside game with no Shirou character/fallback/deck; FB2-15/16/18 and FB2-19 structural regressions pass.

The required focused gate is `93 PASS / 1 FAIL`. The sole failure is `packages/rules/tests/executable-card-pack.test.ts:51`, whose aggregate production card-count assertion remains hard-coded at `70` while the one authorized support definition correctly makes the product count `71`.

This is a stale aggregate test baseline, not a new semantic dependency. A therefore does not dispatch another runtime/compiler task.

## Narrowest next step

P3-FB2-17-R3-RECOVERY is authorized to retry the exact one-card support definition and, in addition to the R2 May-touch files, make exactly one package change: update the aggregate executable-card count assertion from `70` to `71`.

R3 may not weaken/delete structural assertions or change loader/compiler/runtime behavior. It must preserve 7 playable masters, 14 existing characters plus no Shirou character, no Shirou fallback/deck, normal archive ordering, outside-game placement, 8-mana gate, exact FB2-16 marker, and absence of the other eleven frozen FM09 targets.

Accepted overlap remains `111/944`; FM09 remains `MIGRATION_BLOCKED`.