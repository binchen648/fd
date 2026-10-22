# 阿喀琉斯 FORMAL source-bound contract decision（牌面最小裁定）

日期：2026-10-22  
代码基线：`5fb0147a9b89f0d181b872a95059f853dbed8eec`  
source packet：`1198326c9cc4fd99b4c724dfefae4a6a2e7219ad`  
裁定性质：**只读设计提案，不是 acceptance，不修改 production code 或冻结 inventory，不创建 PR。**

本报告只把原文明确写出的内容定为最小 source-bound contract；没有原文支持的持续期、NPC 归属、deployment 映射和外部效果范围一律 `BLOCKED`。archive 的解释、`core.achilles-package` legacy handler、历史 fixture 和 `COMPONENT_VERIFIED` audit 不能提升为正式授权。

## 1. 决策标签

* `ACCEPTABLE_MINIMUM`：牌面文字足以给出可审计的最小运行边界；实现仍需经过正式 schema、测试、review 和 A-sync。
* `PARTIAL_ONLY`：只有部分轴可由牌面闭环；未决轴不得以默认值填补。
* `BLOCKED`：原文没有足够信息，不能实现或不能宣称 owner acceptance。
* `REJECTED_BOUNDARY`：超出牌面文字，必须拒绝，不得静默扩展。

## 2. 总览裁定

| skill | 牌面可裁定的最小子集 | 关键 BLOCKED 项 | 当前允许的 runtime 范围 |
|---|---|---|---|
| S1 `sc-achilles-1` | loss 后 reveal；combat 中对当前 battle 的交战 opponent 执行“一人一张随机手牌”候选动作；仅在服务器能证明属性条件时将该 opponent 当前 battle 合计威力置 0 | 交战集合是否包含 NPC；无手牌/多张未弃牌的判定；battle-local zero 的精确边界虽可收敛为最小值但需 FORMAL 接受；不得延伸到下一战斗 | reveal 可作为正式 primitive 候选；gale 只允许 fail-closed 的 battle-local proposal，不能启用 legacy random/helper |
| S2 `sc-achilles-2` | 一次只选一个 option；option 1 立即随机弃一张；option 3 明确支付 3 mana 并隐藏至回合结束 | option 2 “无法使用技能牌”的持续期没有牌面依据；其跨 action window/round 的 scope、离场后是否继续均 BLOCKED | option 1/3 可进入 formal schema；option 2 只能保留为 blocked branch，不能猜 `this_round` |
| S3 `sc-achilles-3` | 条件为当前 battlefield 恰有一名 opponent；效果对象文字上是所有人 movement enter/leave 以及 controller+该 opponent 的 terrain/外部 servant-NPC effects | 效果持续期；deployment 是否等同 enter；master/event/terrain 以外的外部效果范围；新 opponent 是否加入 pair | 仅可登记 condition/scope candidate；不得安装持久 lock/immunity |

## 3. S1：勇者的不凋花

原文 clause：

* `阿喀琉斯之踵-被动：当你战败后，你【真名解放】。`  
  locator：`servants[80].skills[0].text#line=1`；SHA-256：`a908c6e9dda34d2a9e939055576b266e05cf134e182eb6d3a3a6a83cc4d10402`。
* `疾风驰骋-被动/战斗阶段：若你真名隐藏，令你的所有交战对手随机弃置一张手牌，然后将未弃置牌或弃置的牌不是【幸运】或敏捷牌的对手的合计威力设为0。`  
  locator：`servants[80].skills[0].text#line=2`；SHA-256：`9ccec6e22e460628cdb8b6baa8c7301ff12aada6e225dc1625504294b1d8e247`。

### 3.1 战败触发时机

**裁定：`ACCEPTABLE_MINIMUM`。**

`当你战败后` 只允许在服务器已经完成本次 battle 的 authoritative result、确定 controller 是 loser 之后触发。它不是 battle declaration、power calculation、response window 或“可能会输”的预触发。建议 canonical trigger facts 至少包含 `controllerId + battleId/resultId + battlefieldId + loss outcome`；同一事件二次投递必须 idempotent。

牌面没有写“source card 必须仍在 active area”，因此不能把 source-active 作为 printed semantic 的额外条件；runtime 仍可要求 canonical source instance/controller provenance，以防客户端伪造或将事件绑定到另一张卡。

**拒绝边界：** tie、winner、未完成结算或客户端自报 loser 不得触发；不能把“失去战斗”改成“失去任意 power contest”。

### 3.2 battle loser 与交战对手集合

**battle loser：`ACCEPTABLE_MINIMUM`。**

“你”只绑定 controller 自己；S1 heel 不给其他 loser 扩展 reveal。gale 的触发主体仍是 controller，必须在该次 combat action 中验证 controller servant hidden。

**交战 opponent：`PARTIAL_ONLY`。**

牌面明确要求“所有交战对手”，所以最小集合是同一场当前 battle 中、相对于 controller 的全部 opponent，不是任意同 battlefield player，也不是客户端选择的单一 target。当前 formal player participant 可直接用于 player opponents。

**NPC inclusion：`BLOCKED`。**

原文没有出现 NPC；archive 的“包括 NPC”是历史解释，不是本裁定的牌面事实。若 FORMAL 另行确认 NPC 是游戏规则中“交战对手”的既有定义，可扩展集合；在此之前不得把 NPC 自动加入，也不得把 NPC 自动排除后宣称完整 S1。最小可实现子集仅限 formal battle participant 中已被 authoritative model 定义为 opponent 的对象；遇到未定义 NPC 目标必须 fail closed。

**拒绝边界：** 不得用“同一地点所有 active players”替代 battle participant 集合，不得跨 battle、跨 battlefield 或在 trigger 后重新扫描并纳入新进入者。

### 3.3 随机弃牌一次性与威力归零持续期

**一次性随机弃牌：`ACCEPTABLE_MINIMUM`（带 fail-closed 边界）。**

对每个已确定的交战 opponent，在该次 S1 gale resolution 最多执行一次随机弃牌；随机源必须是 server-persisted deterministic RNG，候选是该 opponent resolution 开始时的当前 hand。没有 hand 时，牌面没有“跳过/替代/失败”规则，故该 target 的 no-hand 行为为 `BLOCKED`，实现不得自行抽 deck、弃别的牌或把无牌目标当作成功。一次 resolution 不得反复弃牌，也不得因 replay 改抽另一张。

**Luck/Agility 判定：`PARTIAL_ONLY`。**

牌面要求根据“未弃置牌或弃置的牌”是否为 `幸运` 或敏捷牌决定目标，但没有规定 hand 中多张未弃牌如何聚合，也没有定义缺牌时的判定。正式实现只能在 server card definition 能无歧义证明条件时应用 zero；否则拒绝该 target 的 zero branch，不得随意采用“只看弃牌牌”或“只要有一张非 Luck/Agility 即 zero”。

**威力归零持续期：`ACCEPTABLE_MINIMUM` 为当前 battle 结算范围；更长范围 `REJECTED_BOUNDARY`。**

`战斗阶段`与“合计威力”只支持把归零作用限制在当前 battle 的有效 power calculation/settlement；它必须在该 battle result 完成后清除，不能进入下一 battle、下一 round 或永久修改 card base power。若实现需要在 battle result 之后仍保存 deferred loser settlement，保存的只应是该 battle identity 的 battle-local receipt，不是持久 modifier。

### 3.4 S1 允许子集与正式 primitive

允许进入 formal implementation review 的最小子集：

1. 使用既有 typed servant reveal primitive 的 source-bound 版本，在 authoritative loss result 后公开 controller servant package，并以 processed-event ledger 保证幂等。
2. 仅对已确认的 player battle opponents 生成一人一次的 deterministic random-discard proposal；NPC、无手牌、无法判定 Luck/Agility 的 target 保持 blocked。
3. 仅在当前 battle 的 trusted participant/power snapshot 上产生可审计的 aggregate-power-zero receipt，并在该 result settled 后清理。

必须拒绝：`extended-effects.ts` 的 `Math.random()`；按 location 扫描替代 battle participants；把 NPC archive 解释当作正式事实；把 zero 写入没有 source/battle identity 的 ad-hoc card modifier；把 reveal 触发提前到 battle result 前。

## 4. S2：包围苍天的小世界

原文 clauses：

1. `湛蓝天空-行动阶段：选择下列一项：` — `servants[80].skills[1].text#line=1` — SHA `37e7aeaa9fae4758cdd84f9141b4ae90fab3854083ef5b6eb3fea8f09102abe2`。
2. `1.与你位于同一战场的对手立即随机弃置一张手牌。` — line 2 — SHA `72f4bc34d100c9eedc02d51c818e9aefa995af7382f0193883a31819e8099957`。
3. `2.与你位于同一战场的对手无法使用技能牌。` — line 3 — SHA `4c22f403ae476bd935adf0ab4e361d4e3367618dfeba1a098bb929a273bca138`。
4. `3.花费3点魔力，隐藏你的从者真名直至回合结束。` — line 4 — SHA `b6992b7119b433466d35bd7c5ae0f14f136448cc6fbaaf81aa594e31fa693d15`。

### 4.1 三分支共同边界

**裁定：`ACCEPTABLE_MINIMUM`。**

“选择下列一项”只允许一个 choice，不能多选、重复执行或由客户端直接提交多个 branch。choice 应在 action phase/controller action window 创建并在同一 source ability continuation 中解析。三个 option 的 player target 都是 controller 当前 battlefield 的 opponents；但“当前”是否在持续 effect 期间动态重算，只有 option 2 涉及持续期，见下文。

牌面没有写该 skill card 的 play-cost/skill-zone requirement；本裁定不重新裁定 card-face cost，也不把 archive 的数值混入 branch semantics。option 3 明文的 3 mana 是 branch-specific additional cost，支付失败不得隐藏姓名。

### 4.2 Option 1：立即随机弃牌

**裁定：`ACCEPTABLE_MINIMUM`。**

“立即”把 effect 限制为当前 action resolution：对每个同 battlefield opponent 最多随机弃一张当前 hand card，完成后不产生持续 discard lock。没有手牌时的处理原文未定义，按 S1 同样保持 `BLOCKED`，不能抽 deck、弃公开牌或把无牌目标当作成功。随机选择必须可恢复、可重放且不由客户端提供。

**拒绝边界：** 不得把 option 1 解释为“每次 opponent 行动都弃牌”、直到 round end 的 residual、或仅由 controller 选择一个 opponent。

### 4.3 Option 2：无法使用技能牌

**持续期：`BLOCKED`。**

牌面只说明 action phase 中选择该项，以及同 battlefield opponents “无法使用技能牌”；没有写 `until round end`、`until source leaves`、`this action` 或“离开 battlefield 后仍持续”。不能把 archive `this_round` lifecycle 或 loader 支持当作牌面补足。

**action-scope：`ACCEPTABLE_MINIMUM` 仅限 activation 的 authoritative action context；持续性部分 `BLOCKED`。**

可审计的最小读取是：在该 action activation 的目标集合中，对当前同 battlefield opponents 产生一个 forbid-intent。但在没有持续期的情况下，不能把 intent 伪装成运行中的禁止状态；若产品要求实际阻止后续 skill play，必须先由 FORMAL 选择并记录 duration 与 target re-evaluation policy。

**允许子集：** source packet/normalizer 可以记录 option ID、目标快照和 unresolved duration；runtime 可以拒绝执行该 branch（fail closed）或只保留不可生效的 blocked decision receipt。不得以零时长、action phase 末、round end 任一值自行填补。

**拒绝边界：** 不得默认 `this_round`；不得默认只阻止 controller action window 内的 play；不得默认禁止 master skill、NPC ability 或 effect-driven activation；不得默认 opponent 离开后仍被禁止，也不得默认离开即解除。

### 4.4 Option 3：支付并隐藏至回合结束

**裁定：`ACCEPTABLE_MINIMUM`。**

3 mana 是明确的 atomic branch cost；成功后隐藏 controller servant true name，直到牌面所说的“回合结束”。这里的“回合”采用游戏现有 round boundary 名称仅作为 runtime clock mapping，不能延伸到下一 round。支付不足时 transaction 失败且 visibility 不改变；replay 不重复扣费；round end 清理 hide state。

牌面没有写“若已公开则可再次隐藏”或“隐藏是否覆盖其他 reveal source”；这些情况为 `BLOCKED`，不得由 legacy helper 的 `revealedServants.filter` 行为推断。

**拒绝边界：** 不得把额外 3 mana 省略、与 card face cost 合并、延长到 next round，或隐藏非 servant package 的公共信息。

### 4.5 S2 runtime/restore 与正式 primitive

可复用正式基础是 choice/pending decision、branch/choice predicate、pay-mana、visibility projection 和 generic source-bound lifecycle；但 option 2 不能安装 ongoing forbid，直到 FORMAL 补足 duration。restore 必须绑定 source card instance、ability ID、controller、round/revision、单一 option 和 continuation；option 1 保存 RNG/selected card，option 3 原子保存 payment 与 hide mutation。

## 5. S3：驰骋天际星之枪尖

原文 clause：

`英雄对决-行动阶段：当你所在的战场只有1名对手时，所有人无法进入或离开此战场，同时，你与此对手无法被地利和所有不属于你们的从者或NPC的牌或效果影响。`

locator：`servants[80].skills[2].text#line=1`；SHA-256：`c3cf72179056049fc0496d3aa0a3476212ab7f8f79bdc6c93d1e3ab39c1b43cb`。

### 5.1 Single-opponent condition

**裁定：`ACCEPTABLE_MINIMUM`。**

activation 必须在行动阶段、controller 位于 battlefield、同一 battlefield 有且仅有一名 active opponent 时成立。该 opponent 是 source-bound pair member；不得在后续 effect 中按 location 重新挑选另一人。

**拒绝边界：** controller alone、两个以上 opponents、非 battlefield location、inactive player 或客户端提交的 opponent ID 都不能满足条件。

### 5.2 Movement / deployment lock

**movement enter/leave：`PARTIAL_ONLY`。**

“所有人无法进入或离开此战场”明确覆盖所有 player 对该 battlefield 的进入和离开，不限 controller/opponent；这是 location boundary rule，不是只阻止当前两人的 normal movement。normal movement 与 effect-driven movement 若语义上确实执行 enter/leave，可纳入同一 lock gateway。

**deployment：`BLOCKED`。**

牌面没有“部署”一词，也没有说明从 outside/skill/other zone 放置是否等同于 enter。除非 FORMAL 已有独立规则把 deployment 定义为进入该 battlefield，否则不得自动封锁或放行 deployment；实现必须为该路径显式选择合同。

**持续期：`BLOCKED`。**

原文没有写 until round end、until source active、until battle end 等任何 expiry。不能使用 archive 的 `this_round` 作为正式裁定。最小允许实现只有记录 lock candidate（location + source + pair context）而不使其生效；需要实际 lock 前必须补 duration、source invalidation、round transition 和 authorized exception contract。

**拒绝边界：** 不得只在 ability target enumeration 中检查 lock；不得只阻止 controller；不得把 movement lock 延长为永久地图锁；不得在 duration 未定时安装 `this_round`。

### 5.3 Terrain 与外部牌/效果免疫

**controller + single opponent 范围：`ACCEPTABLE_MINIMUM`。**

“你与此对手”只绑定 exact pair，不包括新到达者、其他 spectator 或整个 battlefield。`地利` 是单独明确的 terrain source；`所有不属于你们的从者或NPC的牌或效果` 明确指向不属于 controller 或 pair opponent 的 servant/NPC card/effect。实现必须保留 source-owner attribution，不能只按 location suppress。

**master/event/其他 effect 类别：`BLOCKED` / `REJECTED_BOUNDARY`。**

原文没有说不属于这两名玩家的 master card、一般 event、situation、规则状态或 arbitrary engine effect；不得把“所有牌或效果”扩大成所有系统效果，因为限定语是“从者或NPC的牌或效果”。Terrain 只有前半句明确免疫；terrain 以外的类别需逐项正式补足。

**持续期：`BLOCKED`。**

原文没有 expiry。不得把 immunity 默认成 `this_round`、battle-end 或 source-active duration。未补 duration 前只能登记 pair/rule scope candidate，不能安装 ongoing immunity。

### 5.4 S3 runtime/restore 与正式 primitive

可复用正式基础是 exact-one-opponent condition、source/pair identity binding 的 schema 候选、combat terrain breakdown 的局部 suppression 检查。必须新增/正式化统一 movement/deployment gateway、external servant/NPC source attribution、免疫优先级与 cleanup/restore receipt。restore 时须保存 source card identity、controller、battlefield、exact opponent、causation/event；若恢复后 single-opponent 条件失效，不得换绑新 opponent。

允许实现的最小子集是 condition/scope validation 和不可生效的 contract receipt；不得实现持久 battlefield lock 或 immunity 直到 duration 与 deployment/external-source 边界被 FORMAL 接受。

## 6. 明确拒绝清单

以下行为均不属于本裁定，必须拒绝：

1. 把 archive `resolvedQuestions` 的 NPC 解释、`this_round` lifecycle 或旧 `core.achilles-package` 作为牌面明示。
2. 用 `Math.random()`、客户端 target IDs 或 location 扫描代替 server battle/source provenance。
3. 给 S2 option 2 静默选择 `this_round`、action-only、离场解除或 source-close 解除中的任一持续期。
4. 给 S3 静默选择 `this_round`，或把 deployment、master/event/situation/arbitrary effect 自动并入文字没有明确涵盖的范围。
5. 将 S1 power zero 写成永久 card modifier、跨 battle/round effect，或在 battle result 确定前触发 reveal。
6. 在 no-hand、NPC 未建模、Luck/Agility 不可判定、restore source/pair 变化时继续执行并产生 partial mutation。

## 7. 下一合法动作

本裁定本身不能解除 frozen `SEMANTIC_SOURCE_REQUIRED`。FORMAL 若要继续，应逐项确认：

1. S1 是否正式将 NPC 定义为 `engaged opponent`，以及无手牌与多张未弃牌的属性判定；接受后再实现 reveal → deterministic gale → battle-local power receipt。
2. S2 option 2 的 prohibition duration、action scope、离场/新进入 target policy；未确认前保持 blocked branch。
3. S3 movement/deployment lock 的 duration 与 deployment mapping，以及 terrain/servant/NPC 以外 effect categories；未确认前只保留 condition/scope candidate。

完成这些决定后，才允许由正式 owner-complete 流程更新 semantic axes/inventory、实现 code、补 focused tests、生成物校验、typecheck/diff-check、独立 review 与 A-sync。没有这些步骤不得创建 Candidate PR 或宣称验收。

## 8. 本次验证

* 未修改 production code、冻结 inventory、authoring source；未创建 PR。
* `npm run typecheck`：PASS。
* `git diff --check`：PASS。
* 报告提交后工作区保持 clean。

