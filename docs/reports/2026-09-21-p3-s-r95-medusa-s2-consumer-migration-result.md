# P3-S R95 Medusa s2 Consumer Migration Result

Role: Codex S
Status: `CANDIDATE_READY_FOR_FRESH_R`
Date: 2026-09-21

## Exact dispatch input

- Task: `P3-S-R95-MEDUSA-S2-CONSUMER-MIGRATION`
- Exact corrected A dispatch Base: `4d3d7bf9e7e0673e7647a398d55aee012cbfd9e4`
- A dispatch branch: `codex/a-p3-r95-medusa-s2-consumer-migration-dispatch`
- S branch: `codex/s-p3-r95-medusa-s2-consumer-migration-reissued`
- Accepted FB2-45 runtime Candidate: `17685e678e758cb38032732bf15d47b07592d81e`
- FB2-45 acceptance-sync: `02d7a696658b639cdd7bfecc3e377dc4abebdbf0`
- Canonical FB2-45 reviewer evidence: `https://github.com/binchen648/fd/pull/408#issuecomment-5752550000`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Frozen F1 evidence lineage: `59f145434695d29bdd17e4cb3adc887e84182377`
- Formal project migration before/after this unreviewed S Candidate: **`148/944`**, remaining **`796`**.

The initial A dispatch commit `02aaf3eb55f614067150f5ce433196bd3dc0f5b0` correctly released only Medusa s2 but described `servant.medusa.json` as a new one-card archive. Mechanical S setup showed the archive already existed with accepted `servant.medusa.skill.sc-medusa-1`. A therefore issued the docs-only scope correction `4d3d7bf9e7e0673e7647a398d55aee012cbfd9e4`, requiring s1 to remain unchanged while exactly s2 is appended. This Candidate starts from that corrected exact Base; the superseded old S worktree was left untouched.

## Migrated frozen identity

Exactly one frozen identity is added:

- canonical id: `servant.medusa.skill.sc-medusa-2`
- owner: `servant.medusa`
- owner name: `美杜莎`
- class: `Rider`
- legacy id / alias: `sc_medusa_2`
- name: `石化之魔眼`
- static metadata: cost `4`, basePower `1`, typeLabel `魔术`, attributes `魔术`, skill-zone mana requirement `4`.

Frozen full printed text and the sole ability clause are exactly:

`【真名解放】\n行动阶段：在战斗阶段开始前，若与你进行战斗的对手本回合没有打出/加入迅捷属性攻击，则其【败北】。`

SHA-256: `fe34566fb9dbea83e43f7f97dc56a97f5176e07e8a124ee1816aa5645bf770ff`.

Frozen F1 evidence is `src/content/authoring/cards.json / skillCards[35].abilities[0].printedClause`; Locked Reference independently confirms the exact id/name/text, owner, `Rider`, legacy id, cost `4`, basePower `1`, requirement `4`, `魔术` type label and attribute. Reference runtime behavior is not imported.

## Authoring implementation

The existing `data/authoring/servants/servant.medusa.json` archive is preserved and extended rather than replaced:

- the pre-existing `servant.medusa.skill.sc-medusa-1` object remains intact and authored exactly once;
- exactly one new card object, `servant.medusa.skill.sc-medusa-2`, is appended;
- standard servant-skill card envelope: action/controller-play-card window and explicit `skill_zone_mana_at_least: 4`;
- one `phase_action` ability `mystic-eyes-petrification` with exact action/controller-action-window activation and one `source_active` condition;
- exact structural servant-package true-name release metadata, `revealsTrueName: true`, `revealTiming: on_use_declared`, `revealScope: servant_package`;
- one accepted FB2-45 `defeat_player` effect targeting `engaged_opponents` with sole predicate `no_attack_played_this_round_with_attribute("迅捷")`;
- empty targets/cost/creates/ruleModifiers/lifecycle/responseWindow/limit payloads and automatic execution;
- no production runtime code, name routing, skill-id routing, Chinese runtime parsing, product registration, generated product edit or coverage-definition change.

## Runtime-focused evidence

`packages/rules/tests/medusa-s2-consumer-migration.test.ts` proves the migrated whole card through public/authoritative runtime paths:

1. exact owner/card/static metadata, preserved s1 + appended s2 ordering, F1/Reference provenance and full/clause hash;
2. loader `report=[]`, card automatic, sole ability automatic, `isAcceptedPreBattleDefeatAbility(..., "compiled") === true`, and structural true-name release recognized;
3. real card play from skill zone succeeds, pays exactly 4 mana, moves active to attack area and records current `playedRound`; mere placement does not prematurely reveal true name, while phase-action declaration reveals it exactly at `on_use_declared`;
4. an engaged opponent with no qualifying current-round `迅捷` attack receives the separate pre-battle defeat intent, is excluded from winning authoritative settlement even with higher Power, and the intent is consumed;
5. a real ordinary current-round `迅捷` attack play writes authoritative `playedRound` and protects the opponent;
6. a current-round non-`迅捷` attack plus a previous-round `迅捷` attack does not protect;
7. the accepted real Maiya add-to-attack gateway moves `master.maiya.deck.support-shot` to the recipient attack area, changes controller provenance, writes current `playedRound`, and protects the engaged opponent as an authoritatively classified `迅捷` attack;
8. a face-down current-round `迅捷` attack still protects server-side while a player at another battlefield is not targeted;
9. Basic Luck routes through existing battle-loss immunity, ignores the defeat while consuming the intent; repeated exact activation is idempotent and round advance clears stale unmatched intent;
10. product pack/generated content remain unregistered for this standalone consumer, frozen denominator remains 944, both Medusa frozen ids are authored once, and duplicate frozen ids remain zero.

## Mechanical frozen accounting

A direct recount was run independently on the exact corrected A Base worktree and this S working tree using the authoritative frozen inventory (`943 static + 1 dynamic = 944`) and all top-level `data/authoring/**/cards[]` ids.

Exact Base `4d3d7bf9e7e0673e7647a398d55aee012cbfd9e4`:

- authoring unique ids: `166`;
- frozen overlap: **`143/944`**;
- duplicate frozen ids: `0`;
- `servant.medusa.skill.sc-medusa-2` count: `0`;
- existing `servant.medusa.skill.sc-medusa-1` count: `1`.

S working tree:

- authoring unique ids: `167`;
- frozen overlap: **`144/944`**;
- duplicate frozen ids: `0`;
- `servant.medusa.skill.sc-medusa-2` count: `1`;
- existing `servant.medusa.skill.sc-medusa-1` count: `1`.

The authoring diff is append-only at the end of the existing Medusa `cards[]`: no pre-existing s1 field is rewritten. Therefore the Candidate material delta is exactly **+1 Medusa s2**, zero frozen removals, zero duplicate frozen ids and no second new frozen identity.

This material `144/944` overlap is Candidate evidence only. It does **not** change formal project migration credit before fresh independent R returns `MIGRATION_ACCEPTED` for the exact Candidate and A synchronizes that verdict.

## Validation

Fresh S worktree dependencies were installed with `npm.cmd ci --ignore-scripts --offline` (239 packages, 0 vulnerabilities).

Validation on the final working tree before Candidate commit:

- `npm.cmd run typecheck` — PASS.
- Medusa s2 + FB2-45 + Presence Concealment + Return Silence/B23 + Basic Luck focused compatibility — PASS, **5 files / 47 tests**; Medusa s2 focused suite itself **9/9**.
- rules `src/__tests__ + core + regression + FB2-43 + FB2-44 + FB2-45 + Medusa s2` strong suite — PASS, **86 files / 541 tests**.
- `npm.cmd run test:ci -- --maxWorkers=2` — PASS, **171 files / 1222 tests**.
- `npm.cmd run content:validate` — PASS, **7 masters / 7 servants / 20 events / 0 blocking issues**.
- `npm.cmd run verify:generated-content` — PASS with unchanged hashes:
  - library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- `npm.cmd run phase3:reference:verify -- --reference-root E:\\Codex\\FD\\fd-reference` — PASS at exact Locked Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.
- `npm.cmd run build --workspace @fd/client` — PASS; only existing Vite browser-externalization/chunk-size warnings.
- `npm.cmd run phase3:coverage` — PASS: **125 archives / 167 cards / 278 abilities / 0 blocking issues**, `newRuntimeSemanticRouted=22`, `dualRuntime=0`; generated `artifacts/phase3-skill-coverage.json` was restored byte-for-byte from HEAD because it is validation output outside S scope.

## Candidate scope / next gate

The intended S Candidate contains exactly three paths:

- `data/authoring/servants/servant.medusa.json` — append exactly `servant.medusa.skill.sc-medusa-2`, preserving existing s1;
- `packages/rules/tests/medusa-s2-consumer-migration.test.ts` — focused whole-card/runtime/accounting regression;
- this result report.

No production runtime, product pack, generated product output, client production code, Task Index, coverage artifact or second frozen identity belongs in the S Candidate.

Formal migration remains **`148/944`**, remaining **`796`**. This is only an S Candidate for fresh independent R; no migration acceptance or credit is claimed here.

Long-term S rule: **S 完成 recertification 并提交 Exact Base/Candidate**。
