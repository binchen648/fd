# P3-A Ruler Family Consumer Migration Dispatch

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-19

## Baseline

- Exact post-R58 accepted Base: `1ef039619331d910d966847e3e1b3f82a76cd30b`
- Formal recovery accepted overlap: `121/944` (`12.82%`)
- Remaining frozen identities: `823`
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Accepted runtime dependency: R58 / FB2-27 Revision `e30e7efef3cf9fc111236599441e5a869f4bc81a`

This is a separate S migration dispatch. It does not modify FB2-27 runtime and grants no frozen credit until fresh migration review plus later A acceptance synchronization.

## Exact authorized frozen identities

1. `servant.amakusa.skill.sc-amakusa-3` — 天草四郎时贞 / 裁决者
2. `servant.amor.skill.sc-amor-1` — 阿摩耳 [卡莲] / 裁决者
3. `servant.jeanne.skill.sc-jeanne-1` — 贞德 / 裁决者
4. `servant.morgan.skill.sc-morgan-3` — 摩根 / 裁决者
5. `servant.oberon.skill.sc-oberon-3` — 奥伯龙·伏提庚 / 裁决者
6. `servant.oberon.skill.sc-oberon-4` — 奥伯龙·伏提庚 / 裁决者令咒

All six are absent from the accepted Base authoring tree.

The first five have byte-identical frozen F1 printed text and SHA-256:

`8340a2b1e14bdf601bebf9f0a5a1dbb67c326c0bafbc596d689110ea3cc51137`

Printed text:

`此牌及其效果不可被复制或盗用。<每局游戏限三次>神明裁决-行动阶段：令两名其他玩家获得一枚【裁决者令咒】来对其束缚，你仅可束缚本局游戏束缚次数最少的玩家。只有进行束缚的裁决者可以于自己的行动阶段对被束缚者使用【裁决者令咒】。`

Oberon s4 frozen full printed-text SHA-256:

`125082e75869375ea276d98ddfe24549144efbc1525a5e7a54acac179e1beb3c`

Its four frozen clause hashes are:

- `e582bcd3565fd3cc70fd05c1f7a6f0c2b9adeb6c29c29b7883b80806b07ceb98`
- `e31a036f016aab3ce4b3ee954ce006ed1cb2e06f3c94af16930ae0bf0a4eaf46`
- `2bf5e67b4ed31e19108dbd6796d04dbc2440d95a8813d727877728647eb1d95d`
- `d159e931a4573863ddfe89af916aa90e5389326f0b86465b14d46b43063d3a52`

## Static metadata authority

Frozen F1 is authoritative for exact canonical identity and printed text. Locked Reference is used only for static owner/card metadata:

- Jeanne / Amakusa / Morgan / Amor class = `Ruler`;
- Oberon class = `Pretender`;
- each parent `裁决者`: legacy cost `1`, base power `1`, type label `被动`;
- Oberon s4 `裁决者令咒`: legacy cost `0`, base power `0`, type label `被动`.

Reference handler IDs are evidence only. S must not copy Reference handler/runtime implementation and must not add identity/name/text routing.

## Accepted authoring semantics

### Parent Ruler cards — exact FB2-27 binding structure

Each of the first five cards must contain exactly one FB2-27 binding ability using the accepted identity-free structure:

- `kind: phase_action`;
- activation exact `{ phase: "action", opens: "controller_action_window" }` with no source-active requirement;
- no generic cost/condition/create/ruleModifier/lifecycle/visibility semantics beyond the accepted empty/default axes;
- target `bound_players`, exactly two players, constraints in exact order:
  1. `not_controller`
  2. `least_ruler_binding_count`;
- effects:
  1. `grant_ruler_seals` targeting `bound_players`;
  2. `ruler_copy_steal_guard` with policy `forbid_source_and_effects`;
- limit exact `per_game / 3 / this_card`;
- execution exact automatic with empty allowed operations.

This authoring must preserve the accepted ordered two-stage least-bound runtime semantics; S must not implement its own selection logic.

### Oberon s4 — exact FB2-27 seal-use structure

Oberon s4 must contain exactly one accepted seal-use ability:

- `kind: phase_action`;
- activation exact `{ phase: "action", opens: "controller_action_window" }`, no source-active requirement;
- empty generic source usage limit — physical seal consumption is the accepted once-only limit;
- first target `ruler_seal_option`: one choice, exact option order `move`, `lock_movement`, `free_play_reward`;
- second target `bound_player`: one player constrained by `bound_by_controller_ruler_seal`;
- one `use_ruler_seal` effect with:
  - target `bound_player`;
  - option `ruler_seal_option`;
  - move destinations exactly `miyama_town`, `shinto`;
  - reward VP exactly `2`;
- execution exact automatic with empty allowed operations.

Do not encode the printed `<每局游戏限一次>` as a generic per-game source-card limit; R58 accepted the physical seal instance as the once-only resource, allowing separate seals to be used in the same round.

## Authoring container / product isolation

Expected minimal production authoring is five new standalone `servant_skill_card_archive` files:

- `data/authoring/servants/servant.amakusa.json`
- `data/authoring/servants/servant.amor.json`
- `data/authoring/servants/servant.jeanne.json`
- `data/authoring/servants/servant.morgan.json`
- `data/authoring/servants/servant.oberon.json` (contains exactly s3 and s4)

Use the established accepted Phase-3 standalone servant-skill archive pattern and source-policy provenance. These archives are migration material only:

- do not add them to `data/packs/fd-playtest-v1/pack.json`;
- do not change generated product content;
- do not create playable servant characters/decks/fixture seats;
- do not modify any existing servant archive/card.

The ordinary final-rules skill-zone threshold convention should remain consistent with accepted servant-skill migrations; locked Reference legacy requirement values are static metadata only and must not invent a new runtime rule.

## S scope / role boundary

Owner: Codex S.

Authorized changes:

- exactly the five new servant authoring archive files above;
- one focused Ruler consumer migration test;
- one S result report;
- only narrowly required stale aggregate test expectations if mechanical authoring counts change.

Not authorized:

- any `packages/rules/src/**` runtime/compiler change;
- pack registration or generated product rewrite;
- apps/scripts/artifacts/F1/taxonomy/KPI changes;
- unrelated Ruler-adjacent cards such as Amor s2/s3, Morgan s2, Oberon s1/s2, or any seventh frozen identity;
- Reference modification;
- FM09/FM10 status changes.

## Required acceptance evidence

Fresh S must prove at minimum:

- exact six frozen identities and no seventh addition;
- frozen F1 text/hash equality;
- locked Reference static owner/name/class/card-face metadata;
- all five parent cards classify under `isRulerSealBindingSemantic`;
- Oberon s4 classifies under `isRulerSealUseSemantic`;
- real runtime ordered least-bound behavior including reverse-order rejection;
- issuer isolation and physical seal consumption;
- at least representative move/lock/free-play/reward runtime coverage using actual migrated definitions;
- no identity/name/text routing and zero runtime source diff;
- no playtest pack/generated product drift;
- mechanical frozen accounting exact `121/944 -> 127/944`, additions exactly these six, removals `0`, duplicates `0`;
- typecheck, focused tests, official full CI, rules suite, content validate/compile, generated determinism, Reference verify, client build, coverage/audit, `git diff --check`, final cleanliness.

Candidate material may become `127/944`. Formal recovery accepted remains **`121/944`** until fresh independent R returns `MIGRATION_ACCEPTED` and later A acceptance synchronization records it.

Historical P3-FM09 remains `MIGRATION_BLOCKED`. No FM10 is dispatched.
