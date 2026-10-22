# P3-B Albion owner readiness preflight

- Date: 2026-10-22
- Lane: FORMAL Builder (GPT-5.6 Luna)
- Target repository: `https://github.com/binchen648/fd`
- Exact base: `19ac14d5c3c69e0dbbcb2da2fddb8319a7391f03` (`codex/a-p3-achilles-acceptance-sync`, PR #667 A-sync lineage)
- Worktree: `E:\Codex\FD\fd-albion-builder`
- Builder branch: `codex/p3-albion-owner-complete`
- Owner: `servant.albion` / 阿尔比恩之骸
- Decision: **BLOCKED — S1/S2 have no accepted current contract; S3 is `SOURCE_EVIDENCE_REQUIRED` / `SEMANTIC_SOURCE_REQUIRED`; no Candidate implementation**

This is a read-only owner readiness and contract proposal pass. It does not
modify the frozen inventory, import a legacy handler, add an Albion pack entry,
or claim migration credit. The only committed change from this pass is this
auditable report and the companion source-bound proposal.

## Exact frozen scope

The owner-local scope is exactly three static skills:

| Canonical identity | Legacy identity | Printed name | Frozen semantic state | Frozen current route | Observed Reference route |
| --- | --- | --- | --- | --- | --- |
| `servant.albion.skill.sc-albion-1` | `sc_albion_1` | 未能回归于星的龙 | `SOURCE_GROUNDED` / `CONTRACT_MAPPED` | `none` | `shared_handler` / `core.structured-skill` |
| `servant.albion.skill.sc-albion-2` | `sc_albion_2` | 炎之灾厄 | `SOURCE_GROUNDED` / `CONTRACT_MAPPED` | `none` | `shared_handler` / `core.structured-skill` |
| `servant.albion.skill.sc-albion-3` | `sc_albion_3` | 无人知晓的无垢搏动 | `BLOCKED` / `DISCOVERED` | `none` | `shared_handler` / `core.dragon-heart` |

Frozen inventory input:
`data/phase3/full-roster-ability-inventory.json`, SHA-256
`FF0424802F9989FB134C336A87CFDAC0961E44250B01D1B6968D562006662BC4`.
The inventory records `inheritedAcceptanceContracts=[]` and
`partialAcceptanceContracts=[]` for all three entries. The observed handler
and `hasConfirmedOverride=true` fields are Reference observations only; they do
not authorize a target-runtime implementation.

## Frozen source text and clause hashes

The exact frozen inventory text is:

| Skill | Frozen printed text | Frozen source clause SHA-256 |
| --- | --- | --- |
| S1 | `星陨-被动：当你进入侦查时，你可以将此牌加入攻击。若如此做，你获得4点魔力与2点战果并移动至除侦查外的任意地点且你于战斗阶段结束后失去8点魔力。` | `76ce5c6080e5fa7b1cd6642ff87133617f91a07a00020721f56df4366ceba1ab`; `679fed0d35a87156418c6a298693e00215da2b793ca03b03712f43c5b316915f` |
| S2 | `<每局游戏限一次>\n被动：当你于每回合第一次进行移动后，此攻击获得等于你移动距离的威力直至游戏结束。` | `7cf0bf703fad6229c071b8598c684111a5e16965050226fe1825e3451ba08258` |
| S3 | `龙之心-若你赢得了一场战斗，且你的交战对手控制与你控制的攻击具有相同属性且威力高于该攻击的攻击，战斗阶段结束且计算战斗获得的战果后，你失去3点战果。` | `4bd77425bde34cec725d4b43f8a1987b7cd0ecf74c5a175cf64a16d588e89677` |

For S1 and S2 the frozen source locators claim
`src/content/authoring/cards.json#skillCards[61]` and
`#skillCards[2]`; that file is not present in this exact checkout. For S3 the
frozen source locator is `src/content/generated/legacy-content.json#servants[77].skills[2].text#line=1`,
which is also not present in the working tree. The historical source commit
`3d7f599b81374eeb177d33b4bd9fd1a3eed1ff6a` contains the legacy Albion records,
but historical legacy text is discovery evidence, not a current semantic
contract.

An external source candidate was inspected read-only at
`E:\Codex\FD\Fate_Domination-开发版\batch_lancer_rider.js:42` (SHA-256
`4123B4E5F01A099EB7E0BB04A3AAF5366BDCD6AA6F4EB02D6DD498B6B65A7F0F`). It
contains all three card records and the same printed text. The associated
servant image `images\servants\阿尔比恩之骸.png` has SHA-256
`37BB48048CBB1D07CC984F362A0C657EBBA3FF2F3EC4510FC9798EE8A9032371`.
This external tree has no Git provenance and therefore remains a source
candidate pending FORMAL acceptance.

## Authoring, pack, generation, handler and test evidence

The exact baseline has no `data/authoring/servants/servant.albion.json`, no
Albion entry in `data/packs/fd-playtest-v1/pack.json`, no generated Albion
servant/card file, and no Albion-focused target-runtime test. `rg` found no
target source implementation keyed by `servant.albion`, `sc_albion`,
`core.structured-skill`, or `core.dragon-heart` under `packages/`, `apps/`, or
`scripts/`. The active pack currently registers eight other servant authoring
archives and zero Albion cards.

The frozen Phase 3 capability catalog and request list provide reusable generic
capability membership, but do not provide acceptance for this owner:

| Skill | Generic capability families listed | Acceptance state |
| --- | --- | --- |
| S1 | Battle integration, card zone, condition, pending interaction, resource numeric, target selection, trigger gateway, visibility | `READY_GENERIC_EXTENSION` only; `representatives=[]`; no inherited/partial contract |
| S2 | Condition, modifier, power, status/lifecycle, trigger gateway | `READY_GENERIC_EXTENSION` only; `representatives=[]`; no inherited/partial contract |
| S3 | none | `SOURCE_EVIDENCE_REQUIRED`; `SEMANTIC_SOURCE_REQUIRED`; explicit block |

The request/capability artifacts are evidence of possible shared inputs, not
permission to implement or to bypass source/contract review. In particular,
the existing catalog's fail-closed/atomic/no-legacy-fallback language is a
shared design constraint, not Albion-specific acceptance.

## Readiness decision

Albion is **not owner-complete-ready**:

1. S1 and S2 have source-grounded frozen axes, but the exact baseline contains
   no accepted authoring card, current route, scoped acceptance contract,
   representative, or restore/replay evidence for either card.
2. S3 is explicitly blocked by `SEMANTIC_SOURCE_REQUIRED`; the inventory has
   no normalized abilities or semantic axes for it.
3. The active pack and generated playtest content contain zero Albion
   registrations, so no owner-level generation or test evidence exists.
4. Reference handler names and historical legacy behavior cannot be promoted
   into a target-runtime contract by a Builder.

The legal result is a source-bound decision proposal only. No Candidate,
runtime handler, test migration, inventory regeneration, A-sync, merge, or PR
was created.

## Read-only verification

After installing the exact baseline's locked dependencies in the isolated
worktree:

- `npm run typecheck`: PASS.
- `npm run content:validate`: PASS (`8 masters, 8 servants, 20 events, 0 blocking issues`).
- `npx vitest run scripts/tests/phase3-full-roster-inventory.test.ts scripts/tests/phase3-full-roster-semantics.test.ts scripts/tests/phase3-full-roster-capabilities.test.ts`: PASS, 26/26 tests.
- `git diff --check`: PASS.
- `git status --porcelain`: clean before this report commit; dependency output is ignored.

These are baseline/inventory checks only. They do not constitute Albion
behavioral acceptance.

## Required next legal action

FORMAL must first accept the companion source-bound proposal, bind verifiable
source paths/hashes to all three canonical IDs, and define the missing
source/restore contracts. Only after the frozen inventory is regenerated by
the governing authority and S3 leaves its explicit block may a Builder
implement a scoped Candidate with focused tests and independent GPT-6 Sol
review.
