# P3 FB2-25 Initial-Mana Consumer Migration Result

Date: 2026-09-18
Role: Codex S
Status: `MIGRATION_COMPLETE_CANDIDATE`
Base / A dispatch: `bfa9087ab77223e40525fe36214509b1f2cdf9ff`
Accepted runtime seam: FB2-25 / R51 Candidate `101cb0d4e3fbd105cfadafda26585b3825616fe1`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Accepted recovery overlap at dispatch: `115/944`

## Exact migration set

This candidate materializes exactly two frozen F1 identities:

1. `master.iliya.skill.s1` — 人工生命体 — `你的魔力初始值为6。`
2. `master.taiga.skill.s1` — 带着她的头号帮手 — `你的魔力初始值为3。`

No other frozen identity is added. `master.zouken.skill.s1` remains outside this batch because it also modifies Mana capacity for game duration.

## Source / static metadata grounding

Both cards are rebuilt from accepted F1 source evidence rather than from Reference runtime routing.

- Iliya full-text SHA-256: `681da5eab6814317aeb7428ffedec22af430a9b4f889ef2950a7f04ef6a12335`; semantic source `m_iliya.skills[s1]#line=12`; F1 source ability id `iliya.homunculus.initial-mana`; exact normalized effect `SET_MANA(controller, 6)` on `game.started`.
- Taiga full-text SHA-256: `ab00e7ecf418b26b1a697eaede5ef229bfa9ad00707630efd97fd9c1b5352951`; semantic source `m_taiga.skills[s1]#line=136`; F1 source ability id `taiga.helper.initial-mana`; exact normalized effect `SET_MANA(controller, 3)` on `game.started`.
- Locked Reference corroborates owner/name, legacy `s1`, passive type `被动`, normalized generated-card `cost=0`, `basePower=0`, and legacy requirement `null`. Historical `core.master-initial-mana` is evidence only and is not used as production routing authority.

## Authoring shape and accepted runtime contract

Two standalone canonical full-roster archives are added:

- `data/authoring/masters/master.iliya.json`
- `data/authoring/masters/master.taiga.json`

Each archive uses the accepted FM08/R40 `master_skill_card_archive` pattern, contains exactly one authorized `master_skill`, and is intentionally not listed in the playtest pack manifest. Neither archive defines playable-master public information, a deck, or outside-game support placement.

Each card contains one automatic `forced_trigger` with activation exactly `{ trigger: "game_start" }`, no conditions/targets/cost/creates/modifiers/lifecycle/visibility/limit semantics, one fixed-controller literal `set_mana` effect, and explicit empty host authority `allowedOperations: []`.

The normalized abilities satisfy the independently accepted FB2-25/R51 composed parent semantic and reuse the accepted FB2-05/R22 exact `set_mana` primitive. No production runtime source is changed.

## Runtime proof

The focused migration regression loads both real archives through the production authoring loader and proves:

- zero authoring report for each archive;
- exact FB2-25 classifier acceptance;
- trusted `game_start` changes controller Mana from 4 to 6 for Iliya and from 4 to 3 for Taiga;
- the other player remains unchanged at 4;
- non-zero changes emit typed `mana_adjusted` evidence with correct before/after/delta/controller fields;
- same event-id replay is idempotent;
- the current playtest pack manifest does not list either new archive.

## Fresh validation

- `npm ci --offline`: PASS — 239 packages, 0 vulnerabilities.
- `npm run typecheck`: PASS.
- Focused new migration + FB2-25 + FB2-05 + FM08 precedent: **4 files / 21 tests PASS**.
- `npm run content:validate`: PASS — 7 masters / 7 servants / 20 events / 0 blocking issues.
- `npm run content:compile`: PASS with the same product roster.
- `npm run verify:generated-content`: PASS with unchanged hashes:
  - content library `03582e22b830c59ccfe03379159dd5e50aef19fd7bae3561469c000e56618a79`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence report `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- Locked Reference verify: PASS at `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.
- Client production build: PASS; only the existing Vite `node:crypto` browser-externalization warning was emitted.
- Standard full CI: **136 files / 880 tests PASS**.
- Rules core + regression: **74 files / 456 tests PASS**.
- Phase 3 coverage: PASS — **105 archives / 140 cards / 243 abilities**; compiled product remains **73 cards / 14 characters / 0 blockers**; raw routing counts `22/3/133/0/85/130` (new / legacy-execute / legacy-resolve / dual / not-classifiable / taxonomy warnings).
- Automation audit: PASS — `133/3/85/20` (legacy-resolve / legacy-execute / not-classifiable / promotion findings).
- `git diff --check`: PASS.

The two new standalone abilities explain the expected authoring coverage increase while the compiled playtest product and generated hashes remain unchanged.

## Frozen accounting and scope

A fresh mechanical scan of F1 `943 static + 1 dynamic = 944` against the exact Base and Candidate material reports:

- Base material overlap: `115/944`;
- Candidate material overlap: `117/944`;
- exact additions: `master.iliya.skill.s1`, `master.taiga.skill.s1`;
- removals: `0`;
- duplicate frozen canonical IDs: `0`.

Forbidden implementation/product paths remain unchanged relative to Base:

- `packages/rules/src/**`: 0 diff;
- `data/packs/**`: 0 diff;
- `data/generated/**`: 0 diff;
- `apps/**`: 0 diff;
- `scripts/**`: 0 diff;
- `artifacts/**`: 0 diff.

Candidate material `117/944` is **not accepted credit yet**. Recovery-line accepted overlap remains `115/944` until a fresh process-separated migration review returns `MIGRATION_ACCEPTED` and post-review Codex A synchronization completes.

## Next gate

Run a fresh independent Codex R review against the exact committed Candidate. R must independently re-ground F1/Reference evidence, verify the standalone archive/product-isolation choice, run real runtime probes, recompute `115 -> 117` frozen accounting, rerun gates, and confirm final cleanliness. S must not perform that review or merge/retarget the PR.
