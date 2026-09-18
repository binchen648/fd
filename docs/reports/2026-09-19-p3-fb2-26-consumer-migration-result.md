# P3-FB2-26 Provisioning Consumer Migration Result

Role: Codex S
Status: `MIGRATION_COMPLETE_CANDIDATE`
Date: 2026-09-19

## Exact baseline

- A dispatch Base: `ddbbf36726d44eedcc808f5f6b4ab7d5e48d8e6e`
- Prior A capability synchronization: `8a145c14752391c8de11a102b8fb325045db35d4`
- Accepted FB2-26 Revision Candidate: `e4c703bf3755a5a9e865ca05f0ad93118b70f0e2`
- Fresh R55 verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Exact migration

This Candidate adds exactly three frozen source identities:

1. `master.ciel.skill.s1a` — 埋葬机关的修女 — `将【火葬式典】加入你的技能区。` — SHA `2cdf7e6bcc7876757898867a73658374247440ab0d78a6a21d2b8f34cf19d486` — provisions `master.ciel.skill.s2`.
2. `master.shiki-ryougi.skill.s1a` — 欠损 — `游戏开始时，将【死・紧握】加入你的技能区。` — SHA `d1e84428f5798f573fd01ed7f061e937925424f2fbab89c4a43ad6af7782d98f` — provisions `master.shiki-ryougi.skill.s3`.
3. `master.shirou-emiya.skill.s2` — 投影 — `将【干将·莫邪】加入你的技能区。` — SHA `a0ea1f45cedb3ac69c9d4050cfdadcf318cf32f62b749013a8454245535ca575` — provisions `card.derived.master.shirou-emiya.ganjiang-moye`.

All three reuse the exact accepted identity-free P3-R41 / FB2-15 game-start provisioning semantic. No runtime source file changes are present.

## Representation

The three owner archives:

- `data/authoring/masters/master.ciel.json`
- `data/authoring/masters/master.shiki-ryougi.json`
- `data/authoring/masters/master.shirou-emiya.json`

are converted from support-only archives to the R55-accepted `master_rule_definition_archive` representation. Each archive now contains exactly:

- one ordinary/non-deferred provisioning source; and
- its already accepted same-owner `initialPlacement: "outside_game"` target.

The production pack moves exactly those three owner files from `authoringMasterSupportFiles` to `authoringMasterRuleFiles`. They are not registered through `authoringMasterFiles` and remain non-playable owner definitions.

The existing Ciel s2 and Ryougi s3 regressions were updated only where their old assertions encoded the superseded support-only representation. Their semantic/runtime assertions remain intact. The executable-card-pack test card count moves from 73 to 76 because the three newly migrated rules-only source definitions are now compiled into the executable rule pack; playable characters/decks remain unchanged.

## Product / generated-content effect

`content:validate` and `content:compile` both report:

- 7 playable masters;
- 7 servants;
- 20 events;
- 0 blocking issues.

The deterministic generated content-library changes because the three new rules-only source definitions are now present in production rules:

- content-library: `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`;
- fixture: unchanged `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
- evidence: unchanged `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.

Accordingly `data/generated/fd-playtest-v1.content-library.json` is committed as the deterministic output of the authorized pack/authoring change. There is no new playable master, executable character, fallback command spell, master deck, overview/presentation card, or fixture seat for Ciel, Ryougi, or Shirou.

## Runtime evidence

`packages/rules/tests/fb2-26-provisioning-consumer-migration.test.ts` exercises the real production path:

`loadPlaytestContentPack → compileLoadedPlaytestPack → compileExecutableCardPack → initializeAbilityRuntime → processAbilityEvent(game_start)`.

For each of the three sources it proves:

- ordinary source compiles with `initialZone: "skill"`;
- accepted target remains deferred/outside-game with no initial zone;
- target is absent before trusted `game_start`;
- target is created exactly once for the controller in `skill`;
- owner/controller/owner-only visibility/`generatedBy` are correct;
- exactly one typed `card_created` event is emitted with the source instance and source ability;
- replaying the same event id does not duplicate the target or event.

No interpreter, MatchSession, or generic runtime semantic is changed.

## Validation

Fresh S validation from the exact dispatch Base worktree:

- `npm ci --offline`: PASS, 239 packages, 0 vulnerabilities.
- `npm run typecheck`: PASS.
- focused migration + FB2-15 + FB2-26: `3 files / 14 tests PASS` before stale-assertion reconciliation.
- focused final migration/compiler/Ciel/Ryougi/FB2-15/FB2-26: **`6 files / 95 tests PASS`**.
- initial official CI exposed only four stale representation/count assertions: Ciel support-only archive, Ryougi support-only archive + support-channel registration, and executable card count 73. No runtime/semantic test failed. Those assertions were reconciled to the already accepted FB2-26 mixed-rule representation with no runtime code change.
- final official `npm run test:ci`: **`138 files / 930 tests PASS`**.
- rules `src + core + regression`: **`79 files / 470 tests PASS`**.
- `npm run content:validate`: PASS, `7 masters / 7 servants / 20 events / 0 blockers`.
- `npm run content:compile`: PASS.
- `npm run verify:generated-content`: PASS with hashes above.
- locked Reference verification: PASS at exact `b2f9fa15fba07c63530bbf4612b03b8b704755f9`, clean.
- client production build: PASS; existing Vite `node:crypto` browser-externalization warning only.
- Phase 3 coverage: `106 archives / 144 cards / 249 abilities`; executable definition hash `7f5f8b8aa6f0abbe060b611189d4c104481486aa50435f4b73a8be7c7890bde1`; compiled `76 cards / 14 characters / 0 blockers`; routing buckets `22/3/135/0/89/131`.
- automation audit: `135/3/89/20`.
- `git diff --check`: PASS.

## Frozen accounting

Mechanical reconciliation against authoritative F1 and exact A dispatch Base:

- frozen denominator: `944`;
- Base authoring cards: `141`;
- Base overlap: `118/944`;
- Candidate authoring cards: `144`;
- Candidate overlap: **`121/944`**;
- exact additions: the three authorized source identities above;
- removals: `0`;
- duplicate frozen canonical IDs: `0`.

This is Candidate material only. Formal recovery accepted remains **`118/944`** until fresh independent R returns `MIGRATION_ACCEPTED` and later A synchronizes that verdict.

Historical P3-FM09 remains `MIGRATION_BLOCKED`; this three-card migration does not retroactively accept or relabel the historical exact-ten attempt. No FM10 is claimed.
