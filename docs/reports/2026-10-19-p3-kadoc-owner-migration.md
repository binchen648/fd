# P3 `master.kadoc` owner migration

- Remote: `https://github.com/binchen648/fd.git`
- Worktree: `E:\Codex\FD\binchen648_fd\kadoc-owner-migration`
- Base: Julius A-sync `644fb8cc59d58763f8c3ec7f943892cb14724d58` (candidate parent `be0a4a8d83cbc85af5f90d61ae17b5c0d0b603b6`)
- Scope: exactly seven frozen identities: `ascension`, `s1`, `s1a`, `s2`, `s3`, `s4`, and `s5`.
- Candidate SHA: `634c0564ca437e4fe2ed3bbf1d1e797837f6375c`; no push, PR, merge, or A-sync action performed.

## Evidence preserved

`data/authoring/masters/master.kadoc.json` preserves the canonical printed text from `data/phase3/full-roster-ability-inventory.json`, the development locator `Fate_Domination-开发版#master.kadoc/卡多克·泽姆露普斯`, every legacy locator, and all generated legacy-content SHA values. The source artifact's canonical owner name is retained as `卡多克·泽姆露普斯`.

Generated content and evidence were rebuilt through the canonical pack compiler. The overview projection is the loader's normal `FULL` status, while all seven skill rows are explicitly `HOST_ADJUDICATED`.

## Runtime boundary and skill status

| Skill | Printed behavior | Status | Boundary |
| --- | --- | --- | --- |
| `ascension` / 快速扩张 | Russian battlefield gives +5 total power; in Action, place a Russian event from outside the game as an expansion, otherwise gain 5 VP. | `HOST_ADJUDICATED` | Russian event availability, placement/expansion timing, and fallback VP are not authoritative contracts. |
| `s1` / 隐匿者 | Owns the Russia Lostbelt; expands at game start and on wins; ignores Russian events. | `HOST_ADJUDICATED` | Expansion synchronization, win/game-start triggers, and Russian-event immunity are not authoritative contracts. |
| `s1a` / 缺乏自信 | At round end, lose 1 VP while in the Magic Workshop. | `HOST_ADJUDICATED` | Round-end location check and VP loss are not an authoritative contract. |
| `s2` / 俄罗斯异闻带 | Expansion draws two events, optionally replaces one with an outside Russian event, then shuffles both back; qualifying players expand synchronously. | `HOST_ADJUDICATED` | Event draw/replacement, outside-game pool, shuffle, and synchronized expansion are not authoritative contracts. |
| `s3` / 冻土 | Russian event, VP 1, quantity 5; deployment and entry each immediately lose 2 mana. | `HOST_ADJUDICATED` | Russian event identity/quantity and battlefield deployment/entry effects are not authoritative contracts. |
| `s4` / 适者生存 | Russian event, VP 3, quantity 2; players cannot leave; battlefield losers lose 3 VP. | `HOST_ADJUDICATED` | Battlefield leave restriction and defeat effect are not authoritative contracts. |
| `s5` / 皇帝敕令 | Russian event, VP 5, quantity 2; after battle, players away lose 2 VP and players at no battlefield lose all VP gained this round. | `HOST_ADJUDICATED` | Battle-end location checks and round VP history are not authoritative contracts. |

Every card uses an audit-only `record_master_directive` envelope with no allowed runtime operations. Legacy handler names (`core.kadoc-fast-expansion`, `core.kadoc-crypter`, `core.round-end-victory-point-loss`, and `core.lostbelt-{expansion,objective}`) are retained only as source evidence and are not treated as automation proof.

## Verification evidence

- `npx vitest run packages/rules/tests/regression/p3-kadoc-owner-migration.test.ts` — **4 passed**.
- `npm run typecheck` — **PASS**.
- `npm run content:validate` — **PASS** — `35 masters, 19 servants, 20 events, 0 blocking issues`.
- `npm run content:compile` — **PASS** — `35 masters, 19 servants, 20 events, 0 blocking issues`.
- `npm run verify:generated-content` — **PASS**.
  - content library: `ddb4a12f56928edeb7b4b2e7bcd7bdf112cc7337d80e07df621ebe01e7579167`
  - fixture: `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`
  - evidence report: `963729ed79660d37400582adbfd695bc607560c9d3f610097ac20b567fd06c9c`
- `git diff --check` — **PASS**.

Dependencies were absent initially; `npm ci --ignore-scripts` installed the lockfile dependencies in this isolated worktree before verification. npm reported 12 audit findings (1 low, 4 moderate, 5 high, 2 critical); no audit fix was applied.

## Changed files

- `data/authoring/masters/master.kadoc.json`
- `data/packs/fd-playtest-v1/pack.json`
- `data/generated/fd-playtest-v1.content-library.json`
- `data/generated/fd-playtest-v1.evidence-report.json`
- `packages/rules/tests/regression/p3-kadoc-owner-migration.test.ts`
- `docs/reports/2026-10-19-p3-kadoc-owner-migration.md`
