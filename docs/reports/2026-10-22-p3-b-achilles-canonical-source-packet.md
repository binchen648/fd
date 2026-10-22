# 阿喀琉斯 canonical source packet（proposal）

日期：2026-10-22  
基线：`5fb0147a9b89f0d181b872a95059f853dbed8eec`  
前置合同提案：`23bd096a6697c8f965c1332292fccfa8f2333146`  
状态：**source packet 候选；尚未获得 FORMAL source/semantic acceptance。**

本报告只读取并整理现有证据。未修改 production code、`data/phase3/full-roster-ability-inventory.json`、`data/authoring/servants/servant.achilles.json`，未创建或推送 PR。旧 handler、旧 fixture、历史 audit 的行为描述均不替代本 packet 的 source evidence，也不产生 owner-complete credit。

## 1. Canonical identity 与证据链

冻结 inventory：`data/phase3/full-roster-ability-inventory.json`，SHA-256 `FF0424802F9989FB134C336A87CFDAC0961E44250B01D1B6968D562006662BC4`，inventory 文件最近相关提交 `3329328762420000b8f6960c34b771b4e556ddf7`。三个 frozen identities 均为 `DISCOVERED` / `semanticNormalization.status=BLOCKED` / `SEMANTIC_SOURCE_REQUIRED` / `phase3.mappingStatus=EXPLICIT_BLOCK`，且 acceptance contract 数组为空。

| canonical identity | 第二仓库 legacy identity | current authoring identity | 原文/archive 定位 |
|---|---|---|---|
| `servant.achilles.skill.sc-achilles-1` | `sc_achilles_1` | `sc-achilles-1.achilles-heel`, `sc-achilles-1.gale-advance` | `data/authoring/servants/servant.achilles.json:97-194`；历史 legacy `servants[80].skills[0].text#line=1/2` |
| `servant.achilles.skill.sc-achilles-2` | `sc_achilles_2` | `sc-achilles-2.blue-sky` | `data/authoring/servants/servant.achilles.json:199-350`；历史 legacy `servants[80].skills[1].text#line=1..4` |
| `servant.achilles.skill.sc-achilles-3` | `sc_achilles_3` | `sc-achilles-3.hero-duel` | `data/authoring/servants/servant.achilles.json:357-459`；历史 legacy `servants[80].skills[2].text#line=1` |

### 1.1 Main-repo legacy source

当前 exact base 的 working tree 不包含 `src/content/generated/legacy-content.json`，所以不能把一个未检出的 working-tree 文件说成当前 source。该路径在可达历史 commit `3d7f599b81374eeb177d33b4bd9fd1a3eed1ff6a` 中存在；从该 commit 的 JSON 解析得到 `servants[80]` 正是阿喀琉斯。以下 clause SHA 是由 source text 的 UTF-8 字节逐条计算，并与 frozen inventory 的 `clauses[].source.sha256` 一致：

| skill | source commit/path | clause locator | clause SHA-256 |
|---|---|---|---|
| S1 | `3d7f599b81374eeb177d33b4bd9fd1a3eed1ff6a:src/content/generated/legacy-content.json` | `servants[80].skills[0].text#line=1` | `a908c6e9dda34d2a9e939055576b266e05cf134e182eb6d3a3a6a83cc4d10402` |
| S1 | 同上 | `servants[80].skills[0].text#line=2` | `9ccec6e22e460628cdb8b6baa8c7301ff12aada6e225dc1625504294b1d8e247` |
| S2 | 同上 | `servants[80].skills[1].text#line=1` | `37e7aeaa9fae4758cdd84f9141b4ae90fab3854083ef5b6eb3fea8f09102abe2` |
| S2 | 同上 | `servants[80].skills[1].text#line=2` | `72f4bc34d100c9eedc02d51c818e9aefa995af7382f0193883a31819e8099957` |
| S2 | 同上 | `servants[80].skills[1].text#line=3` | `4c22f403ae476bd935adf0ab4e361d4e3367618dfeba1a098bb929a273bca138` |
| S2 | 同上 | `servants[80].skills[1].text#line=4` | `b6992b7119b433466d35bd7c5ae0f14f136448cc6fbaaf81aa594e31fa693d15` |
| S3 | 同上 | `servants[80].skills[2].text#line=1` | `c3cf72179056049fc0496d3aa0a3476212ab7f8f79bdc6c93d1e3ab39c1b43cb` |

这使 source path/commit 可复核，同时保留了一个重要边界：exact base 没有该文件的现行 checkout，故本 packet 不会悄悄把历史 source 当作 frozen inventory 的新授权。

### 1.2 第二仓库 source

第二仓库 `E:\Codex\FD\Fate_Domination-开发版` 不是 Git worktree（无 `.git`），因此不存在可报告的 Git commit；其 file hash 与完整路径是本 packet 的跨仓库内容 identity：

* `batch_lancer_rider.js:45`，SHA-256 `4123B4E5F01A099EB7E0BB04A3AAF5366BDCD6AA6F4EB02D6DD498B6B65A7F0F`。该行同时包含 `sc_achilles_1`, `sc_achilles_2`, `sc_achilles_3` 及三项牌面描述。
* `images/servants/阿喀琉斯.png`，SHA-256 `4F0078056176A00D842599C108CFDA10152831FF2E73BCFD74CF6F01C5553B53`；这是一张 servant source image，不能单独替代每项技能的规则合同。
* `data_servants.js`，SHA-256 `6DA31EBDF36561C550DFE9725963A71496705050E90A8B5A87464F501EE43AE3`，未发现比 `batch_lancer_rider.js:45` 更细的 Achilles skill semantic source。
* `index.html`，SHA-256 `1ADEB8CA963D18BC53A6FE18EDD365EABD1125D554E25A393E036CEF9E28C3D1`，仅作第二仓库页面/资源关联证据。

当前仓库还保留四个复制的图像候选（对应 archive image index 0..3）：

| image index | path | SHA-256 |
|---:|---|---|
| 0 | `apps/client/public/assets/fd/real/chm-used/servants/servant-achilles/00.png` | `7CB58AFC9ABC9085BC8037E9044458A17A6F699A10A674CDC18A10F797ECA11F` |
| 1 | `.../01.png` | `36F9075CFD848D659782F2DA88D03ACF29F01C6BA3E42567AB01BD41384C856D` |
| 2 | `.../02.png` | `729CAC3E81A2D6A8EDCFBA00EA8E30A7AB1A6D487AFA4CFE6FA9F50F3CE80016` |
| 3 | `.../03.png` | `83D8126A6231BB85D23184BD3C49C867E4C7865FB4EA06C5BEFABA693DF7000D` |

archive file `data/authoring/servants/servant.achilles.json` SHA-256 为 `0F781712C035CC4C8078DA74349C988751790D4B941EC53FD6CEF787359EFB7C`，来源优先级声明为 original image > CHM association > main-repo legacy > OCR/manual draft；其原始 `D:/fd/chm-extract/...` 路径在本工作区不可验证。

## 2. Source packet：S1 / 勇者的不凋花

### 2.1 原文与 clause identity

原文分为两条 frozen clauses：

* `阿喀琉斯之踵-被动：当你战败后，你【真名解放】。`  
  locator `servants[80].skills[0].text#line=1`；SHA `a908c6e9dda34d2a9e939055576b266e05cf134e182eb6d3a3a6a83cc4d10402`；第二仓库同义文本位于 `batch_lancer_rider.js:45` 的 `sc_achilles_1.desc` 第一段。
* `疾风驰骋-被动/战斗阶段：若你真名隐藏，令你的所有交战对手随机弃置一张手牌，然后将未弃置牌或弃置的牌不是【幸运】或敏捷牌的对手的合计威力设为0。`  
  locator `servants[80].skills[0].text#line=2`；SHA `9ccec6e22e460628cdb8b6baa8c7301ff12aada6e225dc1625504294b1d8e247`；第二仓库同一 `desc` 第二段。

archive 映射的 candidate ability 是 `sc-achilles-1.achilles-heel`（`after_controller_loses_battle` → `reveal_information(servant_package, controller.servant)`）和 `sc-achilles-1.gale-advance`（combat window、hidden condition、random discard、power zero）。该 archive mapping 仍是 candidate，不能代替 FORMAL acceptance。

### 2.2 语义轴与 runtime 边界

| 轴 | 候选 source-bound contract |
|---|---|
| timing/trigger | heel：服务器产生的该 controller 败北结算事件之后；gale：combat phase/controller combat action window。牌本身 play timing 是 action，但 gale 的 source active 运行窗口是 combat。 |
| condition | gale 仅在 controller servant hidden；heel 不从牌面推导额外 source-active 条件，source validity 是否要求卡仍在 active area 必须由 FORMAL 明确。 |
| target/binding | heel 绑定 controller servant package；gale 绑定 source controller 在该 battle 的全部实际交战 opponent。archive 说“包括 NPC”，但当前 formal `GameState` 的 NPC participant/source model 尚未形成，必须单独确认。 |
| effect | heel public reveal；gale 每名目标最多随机弃一张 hand card，再按弃牌/未弃牌是否为 Luck 或 Agility 决定该目标合计有效 power=0。 |
| visibility | 弃牌前 hand identity 对其他 viewer 保密，弃牌后 discard 公开；servant package reveal 只能在 authoritative loss event 后进入公开 projection。 |
| lifecycle/modifier | heel 是 post-loss idempotent state transition；gale 是 battle/window-local effect，不能自动变成 next-round residual。power zero 必须是可追踪的 battle-local modifier/snapshot，而非无来源 card mutation。 |

**可复用正式 primitive：** `resolution-dataflow.ts` 的 `reveal_servant_package`（source owner/controller 检查、already-revealed no-op、事件输出）；`interpreter.ts` 的 loss event gateway、processed-event ledger、`controller_servant_revealed` condition；runtime 的 deterministic `randomState` 机制可作为随机算法基础。

**需要新增/正式化的 contract：** exact loss source/battle provenance；gale 的 deterministic per-target hand-card selection；Luck/Agility 从 server card definition 得出的属性判定；battle participant/power snapshot 与 zeroing 作用层；source-bound cleanup/expiry；NPC target model（若 FORMAL 接受 archive 解释）。`extended-effects.ts` 的 `opponents_random_discard` 使用 `Math.random()`，不能作为实现授权或 replay contract。

### 2.3 Restore / replay 边界

必须保存并校验 `sourceCardId + abilityId + triggerEventId + battleId/resultId + controllerId`。同一 loss event 重放只能 no-op；不能以新的 battle 或新 source card 重新绑定。随机选择必须消耗并保存 `abilityRuntime.randomState`，并在 receipt 中固定每个 target 的 card instance；restore 后不能重新抽到另一张牌。power zero 的 battle scope、清理时机和 visibility projection 必须可验证；transaction 失败不得出现“已弃牌但未归零”或“已扣资源但未 reveal”的半提交。

**结论：** reveal 子合同有可复用 formal 基础；gale 和完整 S1 owner contract 仍阻塞。

## 3. Source packet：S2 / 包围苍天的小世界

### 3.1 原文与 clause identity

四条 frozen clauses：

1. `湛蓝天空-行动阶段：选择下列一项：` — `servants[80].skills[1].text#line=1` — SHA `37e7aeaa9fae4758cdd84f9141b4ae90fab3854083ef5b6eb3fea8f09102abe2`。
2. `1.与你位于同一战场的对手立即随机弃置一张手牌。` — line 2 — SHA `72f4bc34d100c9eedc02d51c818e9aefa995af7382f0193883a31819e8099957`。
3. `2.与你位于同一战场的对手无法使用技能牌。` — line 3 — SHA `4c22f403ae476bd935adf0ab4e361d4e3367618dfeba1a098bb929a273bca138`。
4. `3.花费3点魔力，隐藏你的从者真名直至回合结束。` — line 4 — SHA `b6992b7119b433466d35bd7c5ae0f14f136448cc6fbaaf81aa594e31fa693d15`。

四条均对应第二仓库 `batch_lancer_rider.js:45` 的 `sc_achilles_2.desc`，并对应 archive `sc-achilles-2.blue-sky`。archive card face 另记录牌面 cost=3、skill-zone requirement=8；option 3 的 3 mana 是 branch effect cost，source text 不授权把两者合并。

### 3.2 语义轴与 runtime 边界

| 轴 | 候选 source-bound contract |
|---|---|
| timing | action/controller action window；source card active，controller 位于 battlefield。 |
| interaction | server 创建一个 choice pending decision，三个 mutually exclusive options，min=max=1；一次 activation 只能执行一个 branch。archive 没有独立 unique-group 字段，故不能凭旧 fixture 推导额外 once-per-window policy。 |
| target | discard/forbid 的目标是 controller 当前 battlefield 的所有 active opponents；不能接受客户端提交的 player/card IDs 作为可信集合。 |
| effects | branch 1 每名 opponent 随机弃一张；branch 2 forbid opponent `servant_skill` play；branch 3 原子支付 3 mana 后 hide servant name until round end。 |
| lifecycle | skill forbid source-bound、`this_round`、source invalidation/round-end cleanup；hide 的 round-end restoration 必须有公开 visibility projection 规则。 |
| visibility/battle | hand identity 保密；discard 后公开；skill lock 影响 normal/effect-driven card play；hide 只变 servant package visibility，不隐藏 unrelated public log。没有 battle settlement trigger，但 target scope 依赖 battlefield state。 |

**可复用正式 primitive：** choice target/pending decision、branch/`choice_is`、`pay_mana`、`controller_servant_revealed`/hidden condition、generic source-bound ongoing lifecycle，以及 `ongoingCardPlayForbidRules` 对同战场 opponent `use_skill_card` 的基础检查。

**需要新增/正式化的 contract：** typed choice schema 与候选冻结/restore validation；atomic branch payment+hide；deterministic same-battlefield random discard；skill-forbid 的 real-time vs activation-time battlefield scope；source validity policy、install/expiry receipt；hide-until-round-end 的 re-hide/reveal semantics。旧 extended helper 和旧 tests 不足以证明这些组合已被接受。

### 3.3 Restore / replay 边界

pending state 至少应绑定 source card instance、ability ID、controller、round/revision、三项 option IDs 与 continuation；restore 必须验证 source ownership/control/active state 和候选集未变。discard branch 保存 RNG progression 与每名 target 的 selected card instance。hide branch 的支付、visibility mutation、event receipt 必须原子提交，重复 resolution 不得再次扣费。skill-forbid ongoing effect 要有 source-definition identity、install transition、expiry round 和 cleanup receipt；round end 或 source invalidation 后恢复不能残留禁止规则。

**结论：** S2 是三项中最接近 formal closure，但 source packet 尚未被接受，且 deterministic discard、branch atomicity、scope 与 restore 合同仍缺。

## 4. Source packet：S3 / 驰骋天际星之枪尖

### 4.1 原文与 clause identity

唯一 frozen clause：

`英雄对决-行动阶段：当你所在的战场只有1名对手时，所有人无法进入或离开此战场，同时，你与此对手无法被地利和所有不属于你们的从者或NPC的牌或效果影响。`

定位 `servants[80].skills[2].text#line=1`，SHA `c3cf72179056049fc0496d3aa0a3476212ab7f8f79bdc6c93d1e3ab39c1b43cb`；第二仓库为 `batch_lancer_rider.js:45` 的 `sc_achilles_3.desc`；archive mapping 为 `sc-achilles-3.hero-duel`。

### 4.2 语义轴与 runtime 边界

| 轴 | 候选 source-bound contract |
|---|---|
| timing/condition | action/controller action window；source active；controller 在 battlefield 且该 battlefield 恰有一名 active opponent。条件必须从 authoritative placement 计算。 |
| binding | install 时固定 `sourceCardId + controllerId + battlefieldId + exactSingleOpponentId`；后来进入该 battlefield 的 player 不能静默加入 immunity pair。 |
| movement effect | `all_players` 不能 enter 或 leave 该 current battlefield；normal movement、effect movement、deployment/placement 与合法例外必须由 FORMAL 定义并走同一个 gateway。 |
| immunity | controller 与固定 opponent 忽略 terrain，以及所有不属于这两名 player 的 servant/NPC card/effect；effect source owner attribution、双方自己的 effect 是否互相生效需明确。 |
| lifecycle/visibility | lock 与 immunity 为 source-bound `this_round`，source invalidation/round end cleanup；规则状态公开且可审计，不能由客户端构造 modifier。 |

**可复用正式 primitive：** exact-one-opponent condition；ongoing `this_round` lifecycle；movement 查询侧已有 `enter_or_leave_current_battlefield` 识别；combat resolver 已能识别 terrain/external modifier 的局部 suppression。

**需要新增/正式化的 contract：** movement/deployment/effect movement 的统一 battlefield lock gateway；固定 pair 的 source-bound target binding；跨 combat/card/event/status 的 external servant/NPC effect source attribution 与 prevention；terrain immunity 与外部 effect immunity 的优先级/例外；install/expiry/restore receipt。当前 `movement.ts` 的 `movePlayer` 主要读取 persistent movement rule，interpreter 的局部 `lockedBattlefieldIdsForMovement` 不能证明所有入口已被封锁；`extended-effects.ts` 的 `lock_battlefield` 与 `exclude_from_terrain_and_external_effects` 是 legacy helper，不是 formal contract。

### 4.3 Restore / replay 边界

保存 install transition、source definition identity/hash、battlefield ID、固定 pair IDs、round expiry、causation/event ID；restore 必须验证 source 仍为同一 owned/controlled active card。重放同一 activation 必须 idempotent；若 exact-one-opponent 在 restore 后已不成立，必须拒绝旧 pending activation，不能重新绑定新 opponent。round transition、source close、movement/deployment 与 effect application 均须覆盖 cleanup，避免锁或 immunity 泄漏到下一轮。

**结论：** S3 的 condition 和局部检查可复用，但 battlefield lock 与 external-effect immunity 当前不可闭环。

## 5. Packet acceptance gate 与下一合法顺序

此 packet 可供 FORMAL 做 source review，但不能自行改变 frozen inventory。合法顺序：

1. FORMAL 核对第二仓库文件 hash、历史 legacy commit/path、四份复制图像及 archive image index，并决定是否接受 archive 关于“交战对手包括 NPC”的解释；接受后才可再生 source/semantic inventory。
2. 先批准 S1 `after_controller_loses_battle → reveal servant package` 的 source-bound contract，再补 deterministic discard/power snapshot；这一步不应把 S1 gale 的复杂合同隐式带入。
3. 批准 S2 三选一 schema、atomic payment/hide、deterministic discard、skill-lock lifecycle/restore。
4. 最后批准 S3 shared movement/effect-prevention contracts，再实现 Achilles-specific binding。
5. 每项实现仍需 focused tests、generated-content/hash 校验、typecheck、diff-check、独立 review 与 A-sync；没有这些 acceptance 不能转为 owner-complete 或创建 Candidate PR。

## 6. 本次验证

* 机械确认 inventory SHA、canonical/legacy IDs、clause locator 与 clause SHA；历史 source 文本逐条 UTF-8 SHA 与 frozen inventory 一致。
* 机械确认第二仓库四个文件路径/hash；第二仓库无 Git metadata，故 commit 明确记为 N/A，不伪造 commit。
* `npm run typecheck`：PASS。
* `git diff --check`：PASS。
* 本次只新增本报告；提交后工作区保持 clean。

