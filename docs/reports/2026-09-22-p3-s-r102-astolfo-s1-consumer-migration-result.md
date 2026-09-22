# P3-S R102 Astolfo S1 Consumer Migration Result

Role: Codex S
Status: `CANDIDATE_READY_FOR_FRESH_R`
Date: 2026-09-22

## Exact dispatch input

- Task: `P3-S-R102-ASTOLFO-S1-CONSUMER-MIGRATION`
- Exact A dispatch Base: `2909898608d0d986fbc77b5936bdfbfdcf0ed953`
- A dispatch branch: `codex/a-p3-r102-astolfo-s1-consumer-dispatch`
- S branch: `codex/s-p3-r102-astolfo-s1-consumer-migration`
- R102 FB2-49 acceptance synchronization: `d413c10bb9d631582ac13c57a022fa7056e61391`
- Accepted FB2-49 runtime Candidate: `f0eb754edb7f7840ceb0121e376d88b7fadfd544`
- Canonical FB2-49 reviewer evidence: `https://github.com/binchen648/fd/pull/415#issuecomment-5765967083`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- F1/source lineage: S `b014cada5ae30c489ca384094681cf313aa71c82` -> A `b258039cc5da519cecee2129a658dd95bdb5524c` -> independent R `222a8ea0e2d73d64a1138b3326df20c767f37b01` (`ACCEPTED`).
- Formal project migration before/after this unreviewed S Candidate: **`151/944`**, remaining **`793`**.

FB2-49 is already accepted identity-free infrastructure and earns zero migration credit. This S Candidate consumes that exact contract for one frozen card and does not reopen or change production runtime.

## Migrated frozen identity

Exactly one frozen identity is added:

- canonical id: `servant.astolfo.skill.sc-astolfo-1`
- owner: `servant.astolfo`
- owner name: `阿斯托尔福`
- class: `Rider`
- legacy id / alias: `sc_astolfo_1`
- name: `唤起恐慌之魔笛`
- card face: type/attribute `宝具`, cost `4`, basePower `1`, canonical skill-zone mana requirement `8`.

Frozen full printed text is exactly:

`【真名解放】\n战斗阶段：与你交战的对手关闭其非残留的牌直至只剩一张为止。`

Sole semantic clause is exactly:

`战斗阶段：与你交战的对手关闭其非残留的牌直至只剩一张为止。`

- source ability id: `panic-flute-close-to-one`
- F1 source: `src/content/authoring/cards.json / skillCards[58].abilities[0].printedClause`
- clause SHA-256: `693e886ed5695721ec10dce30d64b978e45407eba1b81de3c7c5401f8bcb4e67`
- full printed-text SHA-256: `a66f9f8f2f72bea1f7b801459ea742cc4359723a847ef5a5a855501c3ac6d083`.

Locked Reference independently confirms owner/class/legacy id/card face/requirement 8 and is not used as an identity-specific runtime route.

## Authoring implementation

`data/authoring/servants/servant.astolfo.json` is a new standalone servant-skill archive containing exactly the dispatched S1 card:

- standard action / `controller_play_card_window` servant-skill play envelope;
- exact `skill_zone_mana_at_least: 8`; printed cost remains 4 and basePower remains 1;
- sole `phase_action` ability uses the exact accepted FB2-49 envelope: combat / `controller_combat_action_window`, ordered conditions `source_owned` then `at_battlefield`, one `opponent_close_non_residual_to_one` effect, no targets/cost/creates/rule modifiers, and automatic execution;
- visibility is exact true-name release on declaration for `servant_package`;
- no generic `choose_each_player_cards`, no `close_matching_cards_except_selected`, no arbitrary selector/mass-close vocabulary, no identity/name/text runtime routing, and no Chinese runtime parsing.

## Runtime-focused evidence

`packages/rules/tests/astolfo-s1-consumer-migration.test.ts` owns the migrated whole-card evidence. Test-first execution before authoring failed exactly because the Astolfo file was absent and frozen overlap was still 146/944. After implementation its **9/9** tests prove:

1. exact archive identity, F1 S/A/R lineage, locked static metadata, exact text and SHA-256;
2. loader `report=[]` and `isAcceptedOpponentCloseToOneAbility(..., "compiled") === true` for the exact FB2-49 envelope;
3. 7 mana rejects skill-zone play mutation-free; 8 mana succeeds, pays exact printed cost 4 (8 -> 4), moves source to attack area and marks it active/face-up;
4. real combat activation reveals the servant package and privately serializes owner-only, non-cancellable, exactly-one keep decisions for each eligible same-battlefield opponent;
5. selected cards remain active/open while the other frozen qualifying non-residual cards close; residual cards and remote-battlefield opponents remain unaffected;
6. source-ownership and non-battlefield negatives fail unchanged;
7. forged outsider selection and stale frozen-card provenance fail closed mutation-free on the actual card;
8. authenticated FB2-49 persistence authority round-trips a live actual-card decision while state/seal drift is rejected;
9. product/generated packs remain unregistered and frozen material accounting is exactly 147/944 with one Astolfo S1, one Spartacus S2 and zero duplicates.

The accepted identity-free FB2-49 suite was rerun alongside the actual-card suite so malformed queue/metadata, replay, MatchSession, MatchRoom, Hub restore and close-forbid atomicity remain covered by the already accepted infrastructure rather than being duplicated into card-specific runtime code.

## Authorized Spartacus compatibility edit

The A dispatch identified a historical repository-wide `expect(overlap).toHaveLength(146)` assertion in `packages/rules/tests/spartacus-s2-consumer-migration.test.ts`.

This Candidate makes only the authorized stability correction:

- removes the local computed `overlap` value and the stale absolute 146 assertion;
- retains frozen denominator `944`;
- retains duplicate frozen ids `[]`;
- retains Spartacus S2 authored exactly once;
- changes no Spartacus production data, runtime semantics, identity, text, hash, or other regression assertion.

The new Astolfo focused test owns the current exact 147/944 Candidate accounting.

## Mechanical frozen accounting

A direct tree recount used the authoritative frozen inventory (`943 static + 1 dynamic = 944`) and every top-level `data/authoring/**/cards[]` id.

Exact A dispatch Base `2909898608d0d986fbc77b5936bdfbfdcf0ed953`:

- authoring unique ids: `169`;
- frozen overlap: **`146/944`**;
- duplicate frozen ids: `0`;
- Astolfo S1 count: `0`;
- Spartacus S2 count: `1`.

Final S working tree:

- authoring unique ids: `170`;
- frozen overlap: **`147/944`**;
- duplicate frozen ids: `0`;
- Astolfo S1 count: `1`;
- Spartacus S2 count remains `1`;
- exact added frozen identity: only `servant.astolfo.skill.sc-astolfo-1`;
- frozen removals: none.

Therefore the material delta is exactly +1 Astolfo S1, zero frozen removals, zero duplicate frozen ids, and no second frozen identity. Material 147/944 is Candidate evidence only and does not alter formal migration credit before fresh R `MIGRATION_ACCEPTED` plus A synchronization.

## Validation / S recertification

The fixed Work environment reused its existing `node_modules`; `package-lock.json` was unchanged and no dependency reinstall was needed for this task.

Validation on the final implementation tree before Candidate commit:

- fixed local toolchain verification — PASS (`FD_TOOLCHAIN_OK`).
- `npm.cmd run typecheck` — PASS.
- focused Astolfo + FB2-49 + source-state + MatchRoom/Hub + Spartacus compatibility — PASS, **6 files / 71 tests**; Astolfo suite **9/9**, FB2-49 **40/40**.
- official `npm.cmd run test:ci -- --maxWorkers=2` — PASS, **178 files / 1321 tests**.
- `npm.cmd run content:validate` — PASS, **7 masters / 7 servants / 20 events / 0 blocking issues**.
- `npm.cmd run verify:generated-content` — PASS with unchanged hashes:
  - library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- exact Locked Reference verification — PASS at `b2f9fa15fba07c63530bbf4612b03b8b704755f9` using `E:\Codex\FD\fengling20011118-dotcom_fate-domination\reference`.
- `npm.cmd run build --workspace @fd/client` — PASS; only existing Vite browser-externalization/chunk-size warnings.
- `npm.cmd run phase3:coverage` — PASS: **128 archives / 170 cards / 282 abilities / 0 blocking issues**, `newRuntimeSemanticRouted=22`, `legacyExecuteAbility=3`, `legacyResolveEffect=144`, `dualRuntime=0`, `notClassifiable=113`, `taxonomyWarnings=152`.
- `npm.cmd run phase3:automation-audit` — PASS: `legacyResolveEffect=144`, `legacyExecuteAbility=3`, `notClassifiable=113`, `promotionFindings=20`.
- coverage/audit generated artifacts were restored byte-for-byte to their Base blobs; they are not Candidate scope.
- post-validation recount — base **146/944** -> Candidate **147/944**, exact +1 Astolfo S1, target count 1, Spartacus count 1, duplicates 0, removals 0.
- production runtime / product pack / generated product / client production diff — empty.
- `git diff --check` — PASS before report creation; final staged diff check is required immediately before commit.

These gates constitute S recertification for the dispatched exact Base. The exact Candidate SHA is established by the final commit and is supplied together with this exact Base to fresh independent R.

## Candidate scope / next gate

The intended S Candidate contains exactly four A-authorized paths:

- `data/authoring/servants/servant.astolfo.json` — exactly one frozen card, Astolfo S1;
- `packages/rules/tests/astolfo-s1-consumer-migration.test.ts` — focused whole-card/runtime/persistence/accounting regression;
- `packages/rules/tests/spartacus-s2-consumer-migration.test.ts` — compatibility-only removal of the stale global overlap snapshot;
- this result report.

No production runtime, product pack, generated product output, client production code, Task Index, validation artifact, second frozen identity, merge, or retarget belongs in the S Candidate.

Formal migration remains **`151/944`**, remaining **`793`**. This is only an S Candidate for fresh independent R; no migration acceptance or credit is claimed here.

Long-term S rule: **S 完成 recertification 并提交 Exact Base/Candidate**。