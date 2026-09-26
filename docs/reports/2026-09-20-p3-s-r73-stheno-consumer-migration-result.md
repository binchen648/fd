# P3-S R73 Stheno Consumer Migration Result

Role: Codex S
Status: `MIGRATION_COMPLETE_CANDIDATE`
Date: 2026-09-20

## Exact baseline

- Exact A dispatch Base: `d0a4f332efd96f7c0cc07102626bcc4b97068b09`
- Accepted FB2-34 runtime Candidate in ancestry: `99032d4458352ecdee26dd8964b46ce4e094c0f3`
- FB2-34 canonical reviewer evidence: `https://github.com/binchen648/fd/pull/378#issuecomment-5744013376`
- R73 capability synchronization: `94710dc571cf7a474aa826572d518b89676dcf25`
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Project formal migration state at dispatch: `136/944`, remaining `808`
- Branch-local frozen authoring overlap at Base: `132/944`

This Candidate migrates exactly one frozen consumer and does not pre-credit project formal accounting. Only a fresh independent R `MIGRATION_ACCEPTED` verdict followed by A acceptance synchronization may move formal accounting to `137/944`.

## Exact migrated identity

Exactly one frozen identity is added to authoring material:

- `servant.stheno.skill.sc-stheno-2`

Frozen F1 full printed-text SHA-256:

- `edc8e5b95f81153ebace50f23ed1e9a1342bd380891b07b35f74c1948eaac702`

Frozen clause evidence:

1. `true-name-release`: `34d0686e0a3e32928564917e173f901363e57039d02d16fb7d63a4003209ab4c`;
2. `goddess-smile-reward-distribution`: `45fbb637d015849fc9403a5e28561b067a07b92a583e324a1175bbc300da79d6`;
3. `goddess-smile-win-reward`: `d975b3ebb616a10292d326140d2d1fe5d510bb7b80092d57465c0637b0e13d72`.

F1 remains authoritative for canonical identity and printed text. Locked Reference handler `core.structured-skill` is evidence only and is not used for runtime routing.

## Authoring material

The pre-existing archive `data/authoring/servants/servant.stheno.json` already contained the separately migrated `servant.stheno.skill.sc-stheno-1`. This Candidate preserves that card exactly and appends only `sc-stheno-2`.

Canonical JSON hash of the pre-existing `sc-stheno-1` object is unchanged across Base and Candidate:

- Base: `d1794c0584f6ca08a91444ded8efc605612455dde2bd24745228d3af71b8d6dc`
- Candidate: `d1794c0584f6ca08a91444ded8efc605612455dde2bd24745228d3af71b8d6dc`

The archive card order after migration is exactly:

1. `servant.stheno.skill.sc-stheno-1`
2. `servant.stheno.skill.sc-stheno-2`

Locked Reference / legacy static metadata used for the new card:

- owner: `servant.stheno`;
- class: `Assassin`;
- legacy ID: `sc_stheno_2`;
- cost: `0`;
- base Power: `3`;
- legacy requirement: `8`;
- exact Reference card-face type/attribute values;
- accepted standalone servant-skill play envelope: action / `controller_play_card_window`, `skill_zone_mana_at_least: 8`.

## Accepted semantic normalization reused

The migration uses only previously accepted structural capabilities; it adds no generic runtime behavior.

### True-name release

The source-grounded true-name marker metadata is retained through the already accepted marker convention. Loader compilation exposes the standard reveal visibility metadata without any identity-specific runtime branch.

### Full reward distribution

The second ability is exactly the R73/FB2-34 accepted static passive envelope:

- `operation = replace`;
- `rule = combat_reward_distribution`;
- scope exactly `{ subject: "controller", whenControllerWins: true, mode: "full_reward_each" }`;
- no lifecycle, installation, or extra scope payload;
- automatic execution.

### Battle-win +1 VP

Reference semantics `combat.resolved + event_player_won_combat + gain_victory_points(controller,1)` are normalized onto already accepted current runtime structures:

- `kind = forced_trigger`;
- `activation.trigger = after_controller_wins_battle`;
- `activation.requiresSourceState = active`;
- one typed Resource Numeric effect: `adjust_victory_points(controller,+1)`;
- no extra condition/target/cost/modifier/create/lifecycle/limit/visibility semantics.

A pre-dispatch whole-card probe and the checked-in migration test both confirm the real migrated archive compiles with `loadAuthoringJson(...).report = []` and all three abilities remain automatic.

## Real migrated-definition runtime evidence

`packages/rules/tests/stheno-consumer-migration.test.ts` loads the real `data/authoring/servants/servant.stheno.json` archive and proves:

- exact F1 full-text and three clause hashes;
- exact owner/class/cost/basePower/requirement evidence;
- pre-existing `sc-stheno-1` remains present while only `sc-stheno-2` is added;
- whole archive loads with zero authoring issues;
- all three new-card abilities compile automatic;
- true-name marker compiles to accepted reveal visibility metadata;
- the compiled reward-distribution ability satisfies the FB2-34 compiled structural recognizer;
- a real tied-winner battle with event pool `4`, competition pool `2`, and location pool `6` gives each winner the full shared pools when the migrated source controller wins;
- losing-controller, inactive-source, and face-down-source cases retain ordinary split behavior;
- a real `after_controller_wins_battle` event gives the source controller exactly `+1 VP`;
- replay of the same event is idempotent;
- another player's win event and an inactive source give no reward;
- the archive is not registered into the production playtest pack or generated product library.

## Product / role isolation

Relative to exact A dispatch Base, before result-report creation the only tracked implementation diff is:

- `data/authoring/servants/servant.stheno.json`

The focused test is a new test-only path. There is zero diff under:

- `packages/rules/src/**`;
- `data/packs/**`;
- `data/generated/**`;
- `data/phase3/**`;
- `apps/**`.

No runtime identity/name/text/hash/Reference-handler route is introduced. No merge or retarget is performed.

## Mechanical frozen accounting

Fresh scan of every JSON archive under `data/authoring/**` against the exact 944-ID F1 roster:

### Base `d0a4f332...`

- archives with cards: `116`;
- cards: `155`;
- unique card IDs: `155`;
- frozen overlap: `132/944`;
- duplicates: `[]`.

### Candidate material

- archives with cards: `116`;
- cards: `156`;
- unique card IDs: `156`;
- frozen overlap: `133/944`;
- duplicates: `[]`;
- exact frozen addition: `servant.stheno.skill.sc-stheno-2`;
- removals: `[]`.

These are branch-local material counts. Project formal migration accounting remains **`136/944`**, remaining **`808`**, until fresh independent R accepts this exact migration and A synchronizes it. If accepted and synchronized, project formal accounting becomes **`137/944`**, remaining **`807`**.

Historical `P3-FM09-RECOVERY` remains `MIGRATION_BLOCKED`.

## Fresh validation on exact S worktree

Dependencies were materialized in this exact worktree using `npm.cmd ci --ignore-scripts --offline`; no cross-worktree `node_modules` junction was used.

Final validation:

- `npm.cmd run typecheck`: PASS;
- focused Stheno migration: `1 file / 5 tests PASS`;
- rules core + regression + focused: `79 files / 487 tests PASS`;
- official `npm.cmd run test:ci`: `149 files / 1044 tests PASS`;
- official eleven-round MatchSession case: PASS (approximately `4985 ms` in this run);
- content validation: `7 masters / 7 servants / 20 events / 0 blocking issues`;
- generated-content determinism: PASS with unchanged hashes:
  - content library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence report `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`;
- Locked Reference verification: PASS at exact `b2f9fa15fba07c63530bbf4612b03b8b704755f9`, checkout clean;
- client production build: PASS; only existing Vite `node:crypto` browser-externalization warning;
- `git diff --check`: PASS;
- CI/content/build side effects: none remain in tracked status beyond authorized migration material/test/report.

## Next gate

Commit and push this one-card S Candidate, open one PR against exact A dispatch branch `codex/a-p3-r73-stheno-consumer-migration-dispatch`, then hand the exact Candidate to a fresh independent R. Required successful migration verdict is `MIGRATION_ACCEPTED`. S does not perform A acceptance synchronization or formal credit itself.
