# P3-B Altera owner readiness preflight

- Date: 2026-10-22
- Lane: FORMAL Builder (GPT-5.6 Luna)
- Target repository: `https://github.com/binchen648/fd`
- Exact base: `e1f995bba356433519b6c823cbeffe53d48cffb0`
  (`codex/a-p3-albion-acceptance-sync`, PR #669 A-sync lineage)
- Worktree: `E:\Codex\FD\fd-altera-readiness`
- Builder branch: `codex/p3-altera-owner-complete`
- Owner: `servant.altera` / 阿蒂拉
- Decision: **BLOCKED for owner-complete — S1/S2 are
  `SOURCE_EVIDENCE_REQUIRED` / `SEMANTIC_SOURCE_REQUIRED`; S3 has a
  source-bound FM03 contract and focused runtime evidence, but that evidence
  is not synchronized into the frozen inventory or playable pack**

This is a read-only readiness and source-bound contract pass. It does not
modify the frozen inventory, import a legacy handler, add an Altera pack
entry, regenerate content, or claim owner migration credit. The companion
proposal records the only legally supportable next decision boundary.

## Exact frozen scope

The owner-local scope is exactly three static skills. The frozen inventory is
`data/phase3/full-roster-ability-inventory.json`, SHA-256
`FF0424802F9989FB134C336A87CFDAC0961E44250B01D1B6968D562006662BC4`.
The inventory's top-level historical provenance metadata contains a pointer to
an unrelated legacy repository; this audit uses only the checked-out
`binchen648/fd` tree and treats that pointer as non-authoritative metadata.

| Canonical identity | Legacy ID | Printed name | Frozen route/status | Observed Reference handler |
| --- | --- | --- | --- | --- |
| `servant.altera.skill.sc-altera-1` | `sc_altera_1` | 军神之剑·泪之星 | `none`; `SOURCE_EVIDENCE_REQUIRED`; `EXPLICIT_BLOCK` | `specific_handler` / `core.altera-teardrop-photon-ray` |
| `servant.altera.skill.sc-altera-2` | `sc_altera_2` | 军神之剑 | `none`; `SOURCE_EVIDENCE_REQUIRED`; `EXPLICIT_BLOCK` | `specific_handler` / `core.altera-photon-ray` |
| `servant.altera.skill.sc-altera-3` | `sc_altera_3` | 对魔力（saber class） | `none`; `SOURCE_EVIDENCE_REQUIRED`; `EXPLICIT_BLOCK` | `shared_handler` / `core.saber-magic-resistance` |

All three rows mechanically report
`semanticNormalization.status=BLOCKED`,
`semanticNormalization.source=null`, no normalized abilities or axes,
`semanticNormalization.blocks=["SEMANTIC_SOURCE_REQUIRED"]`,
`phase3.inheritedAcceptanceContracts=[]`, and
`phase3.partialAcceptanceContracts=[]`. The handler and
`hasConfirmedOverride=true` fields are Reference observations only. They do
not authorize a target-runtime implementation or capability inheritance.

## Frozen source text and source hashes

The exact frozen text and clause hashes are preserved below. The inventory
source locators point at `src/content/generated/legacy-content.json`, which is
not present in this refactored checkout; the CHM/development-image locators
are provenance references, not independently revalidated files in this
worktree.

### S1 — `servant.altera.skill.sc-altera-1`

Printed text:

> 轨道打击-此牌无法被打出。于此牌被放置的回合后，当你于此地点战斗时，于战斗阶段将此牌加入攻击并真名解放，然后于战斗阶段结束后，将此牌移除游戏并为其所在的地点抽取【文明废墟】事件牌代替原本的事件牌直至游戏结束。

- Source locator: `servants[16].skills[0].text#line=1`
- Clause/source SHA-256: `1bcc870988df713b11d7e5b248c8df0cc9386ad383dc5202c091fd212c5b8548`
- Other frozen references: `FD全卡图鉴V2.0.chm#从者/剑士/英文版/阿蒂拉.htm`; `Fate_Domination-开发版#servant.altera/阿蒂拉`
- Frozen semantic decision: `BLOCKED`; `SEMANTIC_SOURCE_REQUIRED`

### S2 — `servant.altera.skill.sc-altera-2`

Printed text:

> 被动/行动阶段：阿蒂拉的技能牌减少等于你所在战场正面战果最高的事件牌的战果数的魔力消耗。<br>行动阶段：你的攻击无法因其他能力被关闭或减少威力。<br>战斗阶段：将【军神之剑·泪之星】放置于你所在的地点。

- Source locators: `servants[16].skills[1].text#line=1..3`
- Clause/source SHA-256: `2cedf0f973ec6e558aa12bcefa93ed2ac07a617abc1638a2890af6a3528b531c`; `a3bf9a44f08c88cf66b474f7688f351e7c4892dcd5e383327ade631309d50639`; `dadc5af1b3d8b46d57e16cd03ceacba7d00fce0b8e43e065993b1ebde50bf0bf`
- Other frozen references: `FD全卡图鉴V2.0.chm#从者/剑士/英文版/阿蒂拉.htm`; `Fate_Domination-开发版#servant.altera/阿蒂拉`
- Frozen semantic decision: `BLOCKED`; `SEMANTIC_SOURCE_REQUIRED`

### S3 — `servant.altera.skill.sc-altera-3`

Printed text:

> 宝具绽放-被动/战斗阶段：若你于本回合打出了你战斗中魔力消耗最高的宝具攻击，获得1点战果。<br>若其消耗≥4，你额外获得1点战果。<br>魔术抗性-战斗阶段：将与你位于同一战场的交战对手控制的魔术属性攻击威力设置为0。

- Source locators: `servants[16].skills[2].text#line=1..3`
- Clause/source SHA-256: `1cef15482dd584d9d18b4e9016476b7bffb31cb0331efd38b4025a26611c84c2`; `f0631437ce658c07be75426fc0394d6f32c6fafc10805bcb359ff17d4de97f85`; `bd7530459d6ccd00217d1192b06509e322d48bafd44f037c383470ecbba55229`
- Accepted archive source-text SHA-256: `8a6da48db16868ce5d5766fa7ff05c00b2c392f715106f869cb59aaabee65ffc`
- Other frozen references: `FD全卡图鉴V2.0.chm#从者/剑士/英文版/阿蒂拉.htm`; `Fate_Domination-开发版#servant.altera/阿蒂拉`
- Frozen semantic decision: `BLOCKED`; `SEMANTIC_SOURCE_REQUIRED`

## Existing authoring, handler, pack, generated, and test evidence

The exact base contains evidence from the earlier FM03 migration, but it is
not an owner-complete A-sync. This distinction is material: the current
inventory says all three Altera rows have no authoring card and no accepted
contracts, while the checked-out tree already contains one Altera archive.

| Surface | Evidence in this exact base | Boundary |
| --- | --- | --- |
| Authoring | `data/authoring/servants/servant.altera.json`, SHA-256 `207074DEAD8DF81C6FE7AFBA82F5A59C56E0FB391CF4242A9D40B103DDCEAF76`; exactly one card, S3, with three abilities | Real source-bound evidence for S3 only; not evidence for S1/S2 and not synchronized inventory accounting |
| Existing contract labels | Archive names `P3-R12/B18`, `P3-R13/B19`, and `P3-R29/FB2-10` for S3's Noble Bloom/base, Noble Bloom extra-VP, and Magic Resistance abilities | Identity-free shared contracts are real and narrowly reusable; they do not clear S1/S2 or erase the frozen block |
| Reference/handler | Frozen observations are `core.altera-teardrop-photon-ray`, `core.altera-photon-ray`, and `core.saber-magic-resistance` | Non-authoritative; no Altera-specific target handler may be copied from these names |
| Playable pack | `data/packs/fd-playtest-v1/pack.json`, SHA-256 `A99F36106BEBC187826D3E5151E6B28D5C55A39A41BE213685E21405AAA60D7E`; `authoringServantFiles` does not include `servant.altera` | No playable Altera registration |
| Generated library | `data/generated/fd-playtest-v1.content-library.json`, SHA-256 `B5527D19AEB8AFFF6812ACE8AD19EDC29F7CF74FD7ECEEAEFDAF1A498B1919D4`; no `servant.altera`/`sc-altera` key | No generated Altera card/archive |
| Generated evidence | `data/generated/fd-playtest-v1.evidence-report.json`, SHA-256 `5AAE65CE42DCBB393E307F50586E2C7BF53137C82B0C758D4953610527CE898A`; no Altera key | No generated Altera evidence summary |
| Tests | `packages/rules/tests/fm03-saber-magic-resistance-authoring.test.ts`, SHA-256 `C54FE72AC32FD954E236986243EAC7C26066A79A21118ED76870BC8A0E7BFB00`; five focused tests pass | Proves S3's three accepted shapes and two runtime sides; no S1/S2 owner behavior |

The FM03 test verifies exact ten-member membership and source hashes, loads the
Altera archive, classifies the three S3 abilities, runs Magic Resistance
against same-battlefield/attribute boundaries, and settles the two independent
Noble Bloom +1 VP responses. It is valid evidence for the accepted FM03
contract boundary. It is not a proof that S1/S2 can execute, that Altera is in
the playable pack, or that the frozen inventory has been regenerated.

The frozen capability catalog and semantic-axis matrix deliberately list
`NONE` for all Altera axes and no representatives or inherited/partial
contracts. Therefore no generic trigger, card-zone, resource, event-deck,
modifier, power, lifecycle, or special-subsystem capability may be inferred
for S1/S2 from the handler names or from the S3 test.

## Readiness decision

Altera is **not owner-complete-ready**:

1. S1 and S2 have only frozen text/source locators and Reference handler
   observations. Their semantic axes are explicitly blocked, and no
   source-bound authoring or accepted current contract exists.
2. S3 has an existing source-bound archive and focused evidence for the exact
   FM03/B18/B19/FB2-10 shapes. That is a legitimate small-scope contract
   candidate, but the exact Albion A-sync baseline has not synchronized this
   prior Altera evidence into inventory acceptance accounting.
3. No Altera card is registered in the active playable pack or generated
   executable library; there is no owner-level pack/generation evidence.
4. Reference handlers, historical scripts, and the historical inventory
   provenance pointer cannot be promoted to target-runtime semantics.

The legal result is a report plus source-bound FORMAL decision proposal only.
No Candidate implementation, runtime handler, test migration, inventory
regeneration, A-sync, merge, or PR was created.

## Read-only verification

After installing the exact lockfile dependencies in the isolated worktree:

- `npm.cmd run typecheck`: PASS.
- `npm.cmd run content:validate`: PASS (`8 masters, 8 servants, 20 events, 0 blocking issues`).
- `npx.cmd vitest run packages/rules/tests/fm03-saber-magic-resistance-authoring.test.ts scripts/tests/phase3-full-roster-inventory.test.ts scripts/tests/phase3-full-roster-semantics.test.ts scripts/tests/phase3-full-roster-capabilities.test.ts`: PASS, 4 files / 31 tests.
- `git diff --check`: PASS.
- `git status --porcelain`: clean before this report/proposal commit; `node_modules` is ignored.

These are baseline and prior-contract checks only. They do not constitute
Altera owner-complete acceptance.

## Required next legal action

FORMAL/A must first reconcile the stale Altera S3 FM03 evidence against the
frozen inventory and exact source hashes, without altering S1/S2 status. A
small scoped synchronization may record only the accepted S3 contracts and
must preserve the no-pack/no-generated-runtime boundary until separately
authorized. S1/S2 require a source-aligned semantic packet and explicit
trigger, card-zone, event-deck, resource, modifier, timing, and restore
contracts. Only after those gates close may a Builder implement a Candidate
and hand its exact SHA to an independent GPT-6 Sol reviewer.
