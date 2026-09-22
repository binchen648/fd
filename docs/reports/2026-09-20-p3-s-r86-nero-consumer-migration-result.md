# P3-S R86 Nero s1 Consumer Migration Result

Role: Codex S
Status: `CANDIDATE_READY`
Date: 2026-09-20

## Exact migration scope

- A dispatch Base: `3b5ea4bc2a90cfa424dae5a8a57ed37813392354`
- Frozen identity: `servant.nero.skill.sc-nero-1`
- Owner: `servant.nero`
- Skill: `邀至心荡神驰的黄金剧场`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Frozen F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`

This Candidate adds exactly one standalone servant authoring archive plus one focused consumer migration test and this report. It does not modify production runtime, product pack/generated outputs, client production code, or any second frozen identity.

## Frozen evidence and authoring

The standalone archive `data/authoring/servants/servant.nero.json` materializes exactly one card, `servant.nero.skill.sc-nero-1`, with:

- owner/class: `servant.nero` / `Saber`;
- legacy id: `sc_nero_1`;
- card face: `特殊/宝具`, cost `7`, base power `6`, attributes `特殊` + `宝具`;
- explicit skill-zone mana threshold `8`;
- full printed-text SHA-256 `037586179bc5beaa08b9722fefcd87fc11137eee9b469d6493cb11e4e08b74b2`;
- reward-clause SHA-256 `107c5565a029baec317ec995e49c5936aaa9bae2be0d093e1d895507d31fb7c3`;
- no-win-close clause SHA-256 `f70b15b49681932cb6a636e3efcaf38fc8456c1a1167f4fc61ee405e9ef6a3c9`.

The normalized card has exactly two semantic abilities:

1. `golden-theater-win-reward`
   - residual `after_controller_wins_battle` with active source;
   - `adjust_victory_points` for the controller;
   - amount `{ var: "source_card_active_round_count" }` from accepted FB2-40;
   - `while_active / remain_active` lifecycle;
   - structural true-name release through `visibility.revealsTrueName = true`, `on_use_declared`, `servant_package`.
2. `golden-theater-close-on-no-win`
   - residual authoritative `round_end` with active source;
   - exact accepted FB2-41 condition `{ type: "player_flag_number_not_current_round", key: "combatWinRound" }`;
   - `close_source_card`;
   - `while_active / remain_active` lifecycle.

Loader compilation returns `report=[]` and the card is fully `automatic`; no fallback or identity route is used.

## Behavioral proof

Focused consumer coverage proves:

- activation-round win grants `1` VP, records the current-round combat win, and keeps the source active at round end;
- if the source was played in round 1 and wins in round 3, each win grants `3` VP; two wins grant `6` total;
- no current-round win closes the source at authoritative round end;
- a prior-round-only win does not suppress a later round's no-win close;
- a real `stepGameLoop` result with loser-side `lossEffectSuppressedPlayerIds` still grants the real winner its active-round VP and records `combatWinRound`, exercising the accepted FB2-41 producer semantics;
- the standalone identity is not registered into `fd-playtest-v1` product manifest or generated content output.

## Frozen overlap accounting

Mechanical Base contract from A dispatch: **`138/944`** frozen overlap with zero duplicates.

Candidate working tree mechanically reports:

- frozen identities: `944`;
- authoring card ids: `162`;
- unique authoring ids: `162`;
- frozen overlap: **`139/944`**;
- duplicates: `0`;
- added frozen identity: exactly `servant.nero.skill.sc-nero-1`.

This is branch-local migration evidence only. Formal project migration remains **`143/944`**, remaining **`801`**, until fresh independent R returns `MIGRATION_ACCEPTED` for the exact committed Candidate and A synchronizes it. If accepted, formal accounting may advance exactly to **`144/944`**, remaining **`800`**.

## Validation

This fresh S worktree had no `node_modules`; installation used only:

- `npm.cmd ci --ignore-scripts --offline` — PASS, 239 packages, 0 vulnerabilities.

Candidate validation:

- `npm.cmd run typecheck` — PASS.
- Nero + FB2-40 + FB2-41 focused — PASS, **3 files / 22 tests** (`7 + 5 + 10`).
- rules `src/__tests__ + core + regression + focused` — PASS, **85 files / 516 tests**.
- official `npm.cmd run test:ci -- --maxWorkers=2` — PASS, **162 files / 1139 tests**.
- `npm.cmd run content:validate` — PASS, **7 masters / 7 servants / 20 events / 0 blocking issues**.
- `npm.cmd run verify:generated-content` — PASS with unchanged hashes:
  - library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- `npm.cmd run phase3:reference:verify -- --reference-root E:\Codex\FD\fd-reference` — PASS at exact Locked Reference.
- `npm.cmd run build --workspace @fd/client` — PASS; only existing Vite browser-externalization/chunk-size warnings.
- `git diff --check` — PASS.
- frozen overlap audit — exactly `138 -> 139/944`, duplicates `0`.

## Fresh R handoff

The exact committed Candidate must receive a fresh independent read-only migration review against exact Base `3b5ea4bc2a90cfa424dae5a8a57ed37813392354`.

Expected formal verdict: `MIGRATION_ACCEPTED` or `MIGRATION_NEEDS_REVISION`.

Do not merge or retarget. Do not add formal migration credit until a fresh R accepts this exact Candidate and A synchronizes it.
