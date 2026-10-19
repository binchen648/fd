# P3 `master.julius` owner migration

- Remote: `https://github.com/binchen648/fd.git`
- Worktree: `E:\Codex\FD\binchen648_fd\julius-owner-migration`
- Base/candidate: `fe79d7a24ecda8511b330d812ad11638f783f602` (`codex/a-p3-jinako-owner-migration-sync`)
- Scope: frozen `master.julius.skill.ascension`, `.s1`, and `.s1a`; no prior Julius authoring archive or canonical pack entry existed.
- Commit: local migration commit after verification; no push, PR, merge, or A-sync action performed.

## Evidence preserved

`data/authoring/masters/master.julius.json` copies all three canonical printed texts from `data/phase3/full-roster-ability-inventory.json`, retains the development/legacy locators, and records the generated legacy-content SHA values:

- `ascension`: `c4c5a1f3075becdc764fa906321256200cebf8c551ebc302f6c8155bf440e2af`, `e338554947be5bf626cc86fed1bc3672975297f1d49de502122bbc028bcfc29f`
- `s1`: `855d431ea91523425e464ff49af8e5a25b84946b675c6113f697c1af9464ecef`
- `s1a`: `58df0e9303c120dc11606102e7ffdcc107622f195cbd2f01e5693386d8c00dc0`

The canonical pack registers the archive once at the end. Generated content and evidence were rebuilt; the overview projection is the loader's normal `FULL` overview status, while all three skill rows are `HOST_ADJUDICATED`.

## Runtime boundary and skill status

| Skill | Printed behavior | Status | Boundary |
| --- | --- | --- | --- |
| `ascension` / 黑蝎 | Safety enhancement permits Skulk deployment at the Magic Workshop; Stealth enhancement pays 2 mana to deploy during the owner's battle phase. | `HOST_ADJUDICATED` | Deployment destination/timing and payment are not authoritative engine contracts. |
| `s1` / 代码_潜行 | No deployment during Outpost; deploy to a battlefield when the owner's Action phase begins. | `HOST_ADJUDICATED` | Outpost suppression, action-start timing, and battlefield choice are not authoritative engine contracts. |
| `s1a` / 快速老化 | At round end remove two cards from discard or randomly discard one; if neither is possible, draw first. | `HOST_ADJUDICATED` | Round-end ordering, discard choice/randomization, and draw fallback are not authoritative engine contracts. |

Each card uses an audit-only `record_master_directive` envelope with no allowed runtime operations. Legacy handler names (`core.julius-black-scorpion`, `core.julius-skulk`, `core.julius-rapid-aging`) are retained only as source evidence and are not treated as automation proof.

## Verification evidence

- `npx vitest run packages/rules/tests/regression/p3-julius-owner-migration.test.ts` — **4 passed**.
- `npm run typecheck` — **PASS**.
- `npm run content:validate` — **PASS** — `34 masters, 19 servants, 20 events, 0 blocking issues`.
- `npm run content:compile` — **PASS** — `34 masters, 19 servants, 20 events, 0 blocking issues`.
- `npm run verify:generated-content` — **PASS**.
  - content library: `0deeb00e4d2117a8a8f80cab937d16721c7c0ea616775fcb5813611814b729b5`
  - fixture: `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`
  - evidence report: `64ee121eb7494f9630ee5dc1c2503524e12309e2d7de1f66b2772ac3460c0d8c`
- `git diff --check` — **PASS**.

## Changed files

- `data/authoring/masters/master.julius.json`
- `data/packs/fd-playtest-v1/pack.json`
- `data/generated/fd-playtest-v1.content-library.json`
- `data/generated/fd-playtest-v1.evidence-report.json`
- `packages/rules/tests/regression/p3-julius-owner-migration.test.ts`
- `docs/reports/2026-10-19-p3-julius-owner-migration.md`
