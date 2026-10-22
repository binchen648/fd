# Altera FORMAL/A narrow S3 contract reconciliation decision

- Date: 2026-10-22
- Decision lane: FORMAL/A Builder (GPT-5.6 Luna)
- Review status: **READY FOR INDEPENDENT GPT-6 Sol REVIEW**
- Target repository: `https://github.com/binchen648/fd`
- Exact lineage base: `e1f995bba356433519b6c823cbeffe53d48cffb0`
  (`codex/a-p3-albion-acceptance-sync`, PR #669 A-sync lineage)
- Owner: `servant.altera` / 阿蒂拉
- Decision boundary: **S3 prior contract reconciliation only**
- Owner status: **BLOCKED; not owner-complete**

This FORMAL/A decision records the narrow, previously accepted FM03 contract
for Altera S3 so an independent GPT-6 Sol reviewer can verify the exact
boundary. It does not rewrite the frozen inventory, add a Candidate, alter
runtime code, register a playable pack entry, regenerate content, or assign
owner migration credit.

## Decision summary

Only `servant.altera.skill.sc-altera-3` is eligible for this reconciliation,
and only through the three already reviewed identity-free shapes:

| S3 ability | Prior contract | Reconciled boundary |
| --- | --- | --- |
| `sc-altera-3.noble-bloom` | P3-R12 / B18 | Exact optional combat post-result controller VP `+1` response |
| `sc-altera-3.noble-bloom-extra-vp` | P3-R13 / B19 | Exact independent threshold sibling, cost `>=4`, controller VP `+1` |
| `sc-altera-3.magic-resistance` | P3-R29 / FB2-10 | Exact active-source combat power modifier for same-battlefield engaged opponent Magic attacks |

This is a reconciliation of prior accepted contract evidence, not a new
semantic expansion. It does not make S3 a standalone owner-complete result:
S1 and S2 remain blocked, the owner remains blocked, and no playable Altera
registration is authorized.

## Exact frozen identity and source boundary

Frozen input: `data/phase3/full-roster-ability-inventory.json`, SHA-256
`FF0424802F9989FB134C336A87CFDAC0961E44250B01D1B6968D562006662BC4`.

The frozen inventory currently marks S3 `BLOCKED`,
`SOURCE_EVIDENCE_REQUIRED`, `SEMANTIC_SOURCE_REQUIRED`,
`mappingStatus=EXPLICIT_BLOCK`, `currentRoute=none`, with empty inherited and
partial contract lists. This decision does not edit that file or claim that
the current frozen accounting has already been regenerated.

### Canonical S3 identity

- Canonical ability/card ID: `servant.altera.skill.sc-altera-3`
- Legacy ID: `sc_altera_3`
- Owner: `servant.altera` / 阿蒂拉
- Printed name: `对魔力（saber class）`
- Source-text SHA-256: `8a6da48db16868ce5d5766fa7ff05c00b2c392f715106f869cb59aaabee65ffc`
- Frozen source locators:
  - `src/content/generated/legacy-content.json#servants[16].skills[2].text#line=1`
  - `src/content/generated/legacy-content.json#servants[16].skills[2].text#line=2`
  - `src/content/generated/legacy-content.json#servants[16].skills[2].text#line=3`
  - `FD全卡图鉴V2.0.chm#从者/剑士/英文版/阿蒂拉.htm`
  - `Fate_Domination-开发版#servant.altera/阿蒂拉`

The legacy-content path is not present in this refactored checkout. It is
retained as the frozen locator only; no external or unrelated repository is
used as a replacement authority.

### Exact printed text and clause hashes

```text
宝具绽放-被动/战斗阶段：若你于本回合打出了你战斗中魔力消耗最高的宝具攻击，获得1点战果。
若其消耗≥4，你额外获得1点战果。
魔术抗性-战斗阶段：将与你位于同一战场的交战对手控制的魔术属性攻击威力设置为0。
```

| Clause | Frozen source locator | SHA-256 |
| --- | --- | --- |
| Noble Bloom base | `servants[16].skills[2].text#line=1` | `1cef15482dd584d9d18b4e9016476b7bffb31cb0331efd38b4025a26611c84c2` |
| Noble Bloom extra VP | `servants[16].skills[2].text#line=2` | `f0631437ce658c07be75426fc0394d6f32c6fafc10805bcb359ff17d4de97f85` |
| Magic Resistance | `servants[16].skills[2].text#line=3` | `bd7530459d6ccd00217d1192b06509e322d48bafd44f037c383470ecbba55229` |

## Prior accepted evidence and provenance

The checked-in archive and test are retained as evidence; neither is changed
by this decision:

- Archive: `data/authoring/servants/servant.altera.json`, SHA-256
  `207074DEAD8DF81C6FE7AFBA82F5A59C56E0FB391CF4242A9D40B103DDCEAF76`.
- Archive source policy: F1 evidence commit
  `59f145434695d29bdd17e4cb3adc887e84182377`; static/reference metadata
  commit `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.
- Focused evidence: `packages/rules/tests/fm03-saber-magic-resistance-authoring.test.ts`, SHA-256
  `C54FE72AC32FD954E236986243EAC7C26066A79A21118ED76870BC8A0E7BFB00`.
- Prior contract reviews: R12/B18 commit
  `c86eca28dc4c915f60a30eaff7769714f8644d77`; R13/B19 commit
  `24c1ef9dba7436204ac3a334edc2483804d00cc3`; R29/FB2-10 commit
  `37fcdaf6d3367a4efb9dcfaf8a1a532fb4354ae9`.
- FM03 migration evidence identifies the exact ten-member Saber batch and
  reports Altera S3 as a real representative through both runtime sides.

These references establish prior narrow acceptance of the structural shapes;
they do not authorize an Altera-specific handler or broaden any shared
classifier.

## Reconciled S3 contract (only)

### 1. Noble Bloom base — P3-R12 / B18

The reconciled ability must satisfy the exact identity-free shape:

- `kind=optional_trigger`;
- combat activation with trigger `after_battle_result_determined` and the
  accepted response-window envelope;
- exactly one condition:
  `controller_played_highest_cost_noble_phantasm_in_battle_this_round`;
- exactly one typed controller victory-point adjustment of `+1`.

The response is optional and controller-bound. It must settle once against
the authoritative result identity; decline emits no VP mutation. This does
not promote broad optional-trigger ordering or arbitrary VP effects.

### 2. Noble Bloom extra VP — P3-R13 / B19

The reconciled ability must satisfy the exact independent sibling shape:

- same accepted combat post-result response envelope as B18;
- the highest-cost-Noble-Phantasm condition;
- exactly one additional condition
  `highest_cost_noble_phantasm_cost_at_least(value=4)`;
- exactly one typed controller victory-point adjustment of `+1`.

At cost 4+, B18 and B19 remain two independent optional responses. Accepting
the first does not collapse or pre-settle the second. Replay and reconnect
must not duplicate either typed VP adjustment.

### 3. Magic Resistance — P3-R29 / FB2-10

The reconciled ability must satisfy the exact identity-free structural shape:

- `kind=phase_action`, combat phase;
- `opens=controller_combat_action_window`;
- active source required;
- exactly one `combat_power_modifier`;
- operation `set`, rule `attack.currentPower`, value `0`;
- controller scope `engaged_opponents_same_battlefield`;
- object `attack_card`;
- exactly one `has_attribute(魔术)` constraint;
- modifier-local duration `this_round`.

The Altera focused test confirms same-battlefield and attribute filtering:
the engaged opponent's Magic attack is set from Power 5 to 0, while the
opponent's non-Magic attack, the controller's Magic attack, and a remote
battlefield Magic attack remain unchanged. Next-round expiry and malformed
near-miss rejection remain properties of the prior generic contract review;
no broader Power/Modifier acceptance is added here.

## S1/S2 retained blocks and owner status

This decision deliberately does not reconcile S1 or S2.

| Identity | Frozen status retained | Explicitly not accepted |
| --- | --- | --- |
| `servant.altera.skill.sc-altera-1` | `SOURCE_EVIDENCE_REQUIRED` + `SEMANTIC_SOURCE_REQUIRED` + `EXPLICIT_BLOCK` | Orbital/teardrop trigger, add-to-attack, true-name release, event-deck replacement, source removal, combat-end lifecycle, and restore semantics |
| `servant.altera.skill.sc-altera-2` | `SOURCE_EVIDENCE_REQUIRED` + `SEMANTIC_SOURCE_REQUIRED` + `EXPLICIT_BLOCK` | Event-card cost reduction, attack close/power immunity, S1 placement, timing/order, source binding, persistent state, and restore semantics |

No S1/S2 axis, generic capability, Reference handler, historical adapter, or
engine default is inherited. The owner remains blocked until separate source
packets and FORMAL semantic/restore contracts close both rows.

## Explicit non-effects of this decision

This decision does **not**:

1. rewrite `data/phase3/full-roster-ability-inventory.json` or any frozen audit;
2. add Altera to `data/packs/fd-playtest-v1/pack.json`;
3. alter `data/generated/fd-playtest-v1.content-library.json` or the evidence
   report;
4. add or alter a runtime handler, loader route, generated card, or Candidate;
5. make S3 a complete owner migration, clear S1/S2, or assign migration
   credit;
6. promote `core.altera-teardrop-photon-ray` or `core.altera-photon-ray`, or
   broaden B18/B19/FB2-10 beyond their exact identity-free shapes;
7. replace missing source files with an external or unrelated repository.

The active playable pack remains without Altera, and generated executable
content remains without Altera. Any future A-sync must independently verify
the exact S3 hashes before updating accounting.

## Independent GPT-6 Sol handoff

The reviewer should verify:

1. exact repository, lineage base, frozen inventory SHA, S3 text, and all
   clause/source hashes;
2. archive/test evidence and prior R12/R13/R29 boundaries;
3. that this commit changes documentation only and does not rewrite frozen
   input or add runtime/pack/generated artifacts;
4. that S1/S2 remain explicitly blocked and owner status remains blocked;
5. that S3 reconciliation is limited to the three exact identity-free
   structural contracts and does not become owner-complete acceptance.

Following review, A may synchronize the narrow S3 accounting only through a
separate governing action. Until then this report is a FORMAL/A decision
record awaiting independent GPT-6 Sol review.
