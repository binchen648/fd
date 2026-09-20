# P3-A FB2-17-R3 Recovery Material Synchronization

Date: 2026-09-18
Role: Codex A
Status: `SYNCHRONIZED`
Credit: zero frozen-migration credit

## Exact identity

- Implementation Base: `1ef5262abb7d6c55edef8d98e2bc127b631f5d0b`.
- S Candidate / R45 review target: `1c3149ba5f33ad3092a57da4a12d7bbe96f43823`.
- S branch: `codex/s-p3-fb2-17-r3-recovery-current`.
- Stacked PR: `#354`.
- A branch: `codex/a-p3-fb2-17-r3-material-sync-recovery`.
- Handoff: `docs/reports/2026-09-18-p3-fb2-17-r3-recovery-shirou-derived-card-support-definition-handoff.md`.
- S result: `docs/reports/2026-09-18-p3-fb2-17-r3-recovery-shirou-derived-card-support-definition-result.md`.

## A material review

A independently verified exact Base -> Candidate ancestry and the R3 May-touch boundary. Candidate scope is exactly five files:

1. `data/authoring/masters/master.shirou-emiya.json`;
2. `data/packs/fd-playtest-v1/pack.json`;
3. `data/generated/fd-playtest-v1.content-library.json`;
4. `packages/rules/tests/executable-card-pack.test.ts`, whose only change is aggregate count `70 -> 71`;
5. the R3 S result report.

There is no fixture/evidence-report drift, production loader/compiler/runtime implementation change, script/taxonomy/KPI/Reference modification, other authoring archive, frozen skill, UI/server change, or unrelated generated output.

The material candidate contains exactly one non-frozen support definition `card.derived.master.shirou-emiya.ganjiang-moye`, registered through `authoringMasterSupportFiles`. Product shape remains seven playable masters and fourteen executable characters; no Shirou playable character, fallback command spell, generated command-spell card, deck, or initial playable setup surface is introduced. The card remains explicit `outside_game` with no executable `initialZone`, keeps the exact 8-mana gate, and retains the exact accepted FB2-16 `append_only_rule` marker.

The eleven frozen FM09 provisioning targets remain absent. This material therefore takes no frozen migration credit.

## Independent A verification

From a fresh worktree at exact S Candidate:

- Base -> Candidate direct ancestry: PASS.
- `git diff --check Base..Candidate`: PASS.
- exact five-file scope / forbidden-surface audit: PASS.
- `npm ci --offline`: PASS, 239 packages, 0 vulnerabilities.
- `npm run typecheck`: PASS.
- focused content loader / executable compiler / FB2-15 / FB2-16 / FB2-18: **5 files / 94 tests PASS**.
- `npm run content:validate`: **7 masters / 7 servants / 20 events / 0 blocking issues**.
- official `npm run content:compile`: PASS.
- `npm run verify:generated-content`: PASS:
  - content library `c9841d4bad3d43a525895372fabd3b49ea07e79075652a5cbd18fad3405e2e1e`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence report `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- full `npm run test:ci`: **129 files / 835 tests PASS**.
- locked Reference verification at `b2f9fa15fba07c63530bbf4612b03b8b704755f9`: PASS.
- worktree remained clean before this documentation-only synchronization.

S's recorded material coverage is `99 archives / 134 cards / 233 abilities`, compiled `71 cards / 14 characters / 0 blockers`, runtime buckets `22/3/128/0/80/126`, and automation audit `128/3/80/20`. These material counters legitimately include the one non-frozen support archive/card/ability and do not change the frozen denominator.

## Dispatch

A does not grant semantic acceptance. P3-R45-RECOVERY is READY for a fresh independent reviewer context and fresh reviewer worktree. R45 must review exact implementation Base `1ef5262abb7d6c55edef8d98e2bc127b631f5d0b`, exact Candidate `1c3149ba5f33ad3092a57da4a12d7bbe96f43823`, and the documentation-only A synchronization commit carrying this report/task block.

R45 must independently judge source/provenance correctness, exact support-only registration, no playable-surface leakage, outside-game semantics, required-additional marker, exact `70 -> 71` baseline update, deterministic generated scope, absence of all eleven other frozen FM09 targets, zero-credit accounting, required tests, and final cleanliness. A evidence is mechanical and non-authoritative.

Accepted frozen overlap remains **111/944 = 11.76%**, leaving **833/944**. P3-FM09 remains `MIGRATION_BLOCKED` by the other eleven frozen provisioning targets until later dependency work; no `121/944`, FM10, or Ciel credit is authorized here.