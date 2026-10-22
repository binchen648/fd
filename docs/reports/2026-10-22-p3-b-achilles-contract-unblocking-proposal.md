# 阿喀琉斯 owner-complete contract-unblocking proposal

日期：2026-10-22  
工作区：`codex/achilles-owner-complete`  
代码基线：`5fb0147a9b89f0d181b872a95059f853dbed8eec`（Abigail A-sync exact commit）  
结论：**仍阻塞；本报告只读，不修改生产代码、冻结 inventory、authoring source 或 PR。**

## 1. 范围与证据边界

冻结 inventory `data/phase3/full-roster-ability-inventory.json`（SHA-256 `FF0424802F9989FB134C336A87CFDAC0961E44250B01D1B6968D562006662BC4`）机械确认以下三个 canonical identities：

| canonical identity | legacy identity | 当前冻结状态 |
|---|---|---|
| `servant.achilles.skill.sc-achilles-1` | `sc_achilles_1` | `DISCOVERED`, `semanticNormalization=BLOCKED`, `SEMANTIC_SOURCE_REQUIRED`, `currentRoute=legacy`, `mappingStatus=EXPLICIT_BLOCK` |
| `servant.achilles.skill.sc-achilles-2` | `sc_achilles_2` | 同上 |
| `servant.achilles.skill.sc-achilles-3` | `sc_achilles_3` | 同上 |

三项的 `inheritedAcceptanceContracts` 与 `partialAcceptanceContracts` 均为空；`reference.handlerId=core.achilles-package`、`hasConfirmedOverride=true` 只证明曾观察到 shared-handler route，**不是实现授权或验收合同**。

已核对的第二仓库候选证据：

* `E:\Codex\FD\Fate_Domination-开发版\batch_lancer_rider.js`，SHA-256 `4123B4E5F01A099EB7E0BB04A3AAF5366BDCD6AA6F4EB02D6DD498B6B65A7F0F`，第 45 行提供 `sc_achilles_1/2/3` 及中文牌面文本。
* `data_servants.js` SHA-256 `6DA31EBDF36561C550DFE9725963A71496705050E90A8B5A87464F501EE43AE3`、`index.html` SHA-256 `1ADEB8CA963D18BC53A6FE18EDD365EABD1125D554E25A393E036CEF9E28C3D1` 未提供可替代正式合同的 owner acceptance。
* 第二仓库图片 `images\servants\阿喀琉斯.png` SHA-256 `4F0078056176A00D842599C108CFDA10152831FF2E73BCFD74CF6F01C5553B53` 是可复核的图像候选证据，不是 semantic normalization 的授权。
* 当前仓库 `data/authoring/servants/servant.achilles.json` 是结构化 archive 草稿；其 `failureMode=disabled_until_shared_mechanics_exist`，外部 `D:/fd/chm-extract/...` 路径在此工作区不可验证。archive 的 `resolvedQuestions`、旧 handler、旧测试夹具均只用于提出待确认合同，不能直接升级冻结状态。

因此本报告将“source-bound semantic”写成**待 FORMAL 接受的候选合同**，不会把 legacy 行为或测试通过当作 owner acceptance。

## 2. 当前正式 primitive 基线

代码中存在可复用的通用片段，但它们不等于 Achilles owner contract：

* `resolution-dataflow.ts` 有带 source/controller 校验、幂等 no-op、事件输出的 `reveal_servant_package` primitive（也可由 `reveal_information` typed coercion 生成）。
* `interpreter.ts` 已有 `after_controller_loses_battle` 事件网关、`controller_servant_revealed`、`controller_at_battlefield_with_exactly_one_opponent`、choice/pending decision、`pay_mana` 与 source-bound ongoing lifecycle 基础。
* `ongoingCardPlayForbidRules` 可识别同战场 opponent 的 `use_skill_card` forbid；movement 侧有 `enter_or_leave_current_battlefield` 的 ongoing lock 检查；combat resolver 可识别 `terrain_and_external_servant_or_npc_effects` 的 suppression 条件。
* 但 `extended-effects.ts` 中的 `opponents_random_discard` 使用 `Math.random()`，并以非 source-bound 的 `modeState`/`powerModifiers` 直接写状态；文件顶部列出的 Achilles handler 是 legacy/extended helper，不是验收合同。
* 当前 typed resolution dataflow 没有 Achilles 专用的随机弃牌、手牌属性判定、battle power-zero、battlefield lock、外部 servant/NPC effect immunity primitive，也没有为这些组合建立 source-bound restore/replay schema。

## 3. 逐项候选合同与闭环判断

### sc-achilles-1 / 勇者的不凋花

**Source-bound semantic（待接受）**

1. `achilles-heel`：server-authoritative `after_controller_loses_battle`，且必须是该 controller 的实际败北结算事件；效果为一次性公开 controller servant package。重复投递同一 event/source/ability 必须 no-op，不得重复 reveal 或重复产生副作用。
2. `gale-advance`：combat/controller combat action window，source card active，controller servant 仍 hidden；目标为 controller 当前战场中实际处于交战的全部 opponent（archive 解释把 NPC 也纳入，需 FORMAL 明确是否采用）；每名目标至多随机弃一张 hand card；根据弃掉的牌或未弃牌的属性，非 `幸运`、非 `敏捷` 的目标的**本次战斗合计有效威力**设为 0。

**Target / lifecycle**

* 目标绑定到 source controller 的当前 battle identity，而不是仅按 location 事后扫描；不得跨战场、跨战斗或把 inactive player 纳入。
* reveal 是 battle-loss 结算后的公开状态转换；gale 是当前 combat window/battle-local effect，不应隐式延长到下一轮或下一场战斗。source 失活、移除或 card instance 改绑时，未完成的 pending effect 必须拒绝而非漂移到新 source。

**Battle / visibility**

* reveal 必须由后端 battle result/loss provenance 驱动；客户端不能伪造 `after_controller_loses_battle`、winner/loser 或 battle participant。
* 随机弃牌在选择前对其他 viewer 保持 hand secrecy，弃牌后按公开 discard 规则投影；属性判定应绑定 server card definition，不应从客户端 payload 读取。
* power-zero 必须作用于该 battle 的 trusted participant/card-power snapshot 或明确的 battle-local modifier；不能只给当前 attack cards 写不可追溯的 ad-hoc modifier。

**Restore / replay**

* 保存并校验 `sourceCardId + abilityId + triggerEventId + battleId/resultId + controllerId`；replay 使用 processed-event ledger 幂等。
* 随机选择必须消耗并持久化 `abilityRuntime.randomState`（当前正式 shuffle 已有 xorshift 先例），恢复后再次 replay 必须得到同一弃牌结果，不能使用 `Math.random()`。
* battle-local power-zero 的 install/expiry/cleanup 以及 reveal 的 public projection 必须可验证；未完成 transaction restore 时不得半扣资源、半弃牌或残留 modifier。

**当前正式 primitive 闭环判断：部分可闭环，不能验收。**

`reveal_servant_package` 与 loss event gateway 足以作为 S1 reveal 的实现基础，前提是 FORMAL 接受该 source/printed-text mapping。gale 的 location 扫描和 extended handler 不是可接受闭环：随机源不确定、target/battle provenance 未绑定、手牌属性和 battle total-power override 没有正式 restore/replay contract。因此 S1 的合法实现顺序应是“先接受 reveal semantic，再补 deterministic discard + battle snapshot/power-zero contract”，不能直接开启 owner-complete。

### sc-achilles-2 / 包围苍天的小世界

**Source-bound semantic（待接受）**

* action/controller action window，source active，controller 在 battlefield；一次 activation 只能从三个互斥 option 中选择一个：`discard_hand`、`forbid_skills`、`hide_true_name`。
* `discard_hand`：controller 当前 battlefield 的所有对手各随机弃一张 hand card；目标集合、没有手牌时的 no-op、随机算法和 discard visibility 必须明确。
* `forbid_skills`：同 battlefield opponents 对 `servant_skill` card 的 play 立即被 forbid；modifier source-bound、duration `this_round`，并在 source invalidation/round end 清理。
* `hide_true_name`：原子地支付 controller 3 mana，然后把 controller servant name 隐藏至 round end；支付失败时不得改变 visibility，重复 resolution 不得重复扣费。
* 牌面 cost 3 与 skill-zone requirement 8 是 play contract；option 3 的额外 3 mana 是 branch effect cost，不得与牌面 cost 混成一次或漏付。

**Target / lifecycle**

* choice target 必须是 server-created pending decision，候选集固定为三个 option，min=max=1，禁止多选、空选和跨 ability 复用；branch effect 只能执行被选择分支。
* `forbid_skills` 的 same-battlefield target 是 activation 时 source controller 所在 battlefield 的 opponent 集合，但 play check 应在持续期间按当前合法 location/source validity 重新判断；若设计要求离场仍受禁用，必须在合同中明确，否则默认同战场实时 scope。
* hide 的 duration 是 `this_round`/round-end；若 controller 已 reveal，隐藏是否允许及 public projection 规则需 FORMAL 明确（牌面只说隐藏，不能从旧 helper 推断）。

**Battle / visibility**

* discard 与 skill-forbid 的对象集合必须来自 authoritative player/card state；客户端不能送入 opponent IDs 或 hand card IDs 作为可信随机输入。
* skill lock 应影响 ordinary play validation 和 effect-driven play，且不泄露对方 hand 内容；hide 只改变 servant package visibility，不应隐藏已经公开的 unrelated card/event log。

**Restore / replay**

* pending choice 至少保存 source card instance、ability ID、controller、round/revision、候选 option IDs 和 continuation；restore 时校验 source ownership/control/active state，拒绝变更后的 source 或候选集。
* branch discard 的 RNG state 与每个 target 的 selected card identity 必须在 transaction/event receipt 中可重放；支付与 hide 的 mutation 必须同一 transaction 原子提交。
* ongoing skill lock 需有 source validity policy、install transition、expiry round 和 cleanup receipt；round end/restore/replay 后既不能残留也不能重复安装。

**当前正式 primitive 闭环判断：基础部分可闭环，整体仍缺合同。**

choice/pending、branch、pay_mana、`controller_servant_revealed`、generic ongoing lifecycle 及 `use_skill_card` forbid 检查提供了实现基础；不过当前正式 typed dataflow 没有随机弃牌/隐藏真名分支，旧 extended handler 的 `Math.random()` 和直接 `modeState` 写入不能作为闭环。只要 FORMAL 先接受 option/target/lifecycle/visibility schema，再补 deterministic discard、atomic hide、source-bound restore tests，S2 是三项中最接近可实现者；在此之前仍不得宣称 partial acceptance。

### sc-achilles-3 / 驰骋天际星之枪尖

**Source-bound semantic（待接受）**

* action/controller action window，source active，controller 位于 battlefield 且该 battlefield 恰有一名 active opponent；条件必须按 authoritative player placement 计算，不得只检查两个 card instance。
* install 一个 source-bound `this_round` effect：该 battlefield 的所有 player 均不能进入或离开（normal movement、effect movement、deployment/placement 的边界及授权例外需 FORMAL 列明）。
* 同一 duel pair（controller + exact single opponent）忽略 terrain，以及所有不属于这两名 player 的 servant/NPC card/effect；controller 或该 opponent 自己的 card/effect 是否互相生效需按“所有不属于你们”文字明确。

**Target / lifecycle**

* battlefield ID、controller ID、single opponent ID 在 install receipt 中固定；后来有人加入/离开不得把 immunity scope 静默扩展或把新的 opponent 当成原 pair。
* lock/immunity 均为 `this_round`，source invalidation 与 round end 都要清理；movement lock 应由统一 movement/deployment gateway 读取，不能只阻止 ability target selection。

**Battle / visibility**

* terrain suppression 应作用于 terrain breakdown；external servant/NPC immunity 应覆盖每个效果入口（combat、card play、event/status 等）且能识别 effect source owner，不能只在 combat resolver 中做 location-level shortcut。
* lock 对所有 player 是公开规则状态；但 immunity pair/source provenance 应可审计，不能通过客户端构造 modifier 绕过。

**Restore / replay**

* 保存 install transition、source definition hash/identity、battlefield ID、pair IDs、round expiry 和 causation/event ID；restore 时验证 source 仍为同一 owned/controlled active card。
* replay 同一 activation 必须 idempotent；若 exact-one-opponent 条件在 restore 后已不成立，必须拒绝旧 pending activation，而不是重新绑定新 opponent。
* round transition、source close、player movement 与 effect application 都要有 cleanup/expiry 覆盖测试，确保没有“锁住整场后永不解锁”或 immunity 泄漏。

**当前正式 primitive 闭环判断：不可闭环。**

当前 interpreter 的 lock 查询和 combat resolver 的 terrain suppression 只能证明有局部可复用检查；没有正式的全入口 battlefield lock 合同，也没有 external servant/NPC effect prevention 的统一 source attribution。`extended-effects.ts` 的 `lock_battlefield`、`exclude_from_terrain_and_external_effects` 仅是 legacy helper。S3 必须在 movement/deployment/effect gateways 与 restore schema 正式落地后才能实现。

## 4. 合同缺口矩阵

| 技能 | 已有正式基础 | 仍缺失的 owner/source-bound 合同 | 结论 |
|---|---|---|---|
| S1 | loss event gateway、typed servant reveal、revealed projection、processed event | source/battle provenance；deterministic per-opponent random discard；Luck/Agility card-definition test；battle-local total power zero；restore/expiry | **部分基础，不可验收** |
| S2 | choice/pending、branch、pay_mana、reveal condition、ongoing/card-play forbid、round cleanup 基础 | 三选一 schema/atomicity；deterministic discard；same-battlefield scope policy；hide-until-round-end visibility；pending/ongoing restore receipts | **最接近，但不可验收** |
| S3 | exact-one-opponent condition；局部 movement lock 查询；combat terrain suppression 查询；ongoing expiry 基础 | 全 movement/deployment lock gateway；固定 duel pair；external effect source attribution/prevention；公开规则与 restore/replay contract | **当前不可闭环** |

## 5. 下一合法实现顺序

1. **FORMAL source packet acceptance**：以 canonical IDs、legacy IDs、第二仓库文件与 hash、原图 hash、牌面逐句映射为 source evidence packet；FORMAL 明确是否接受 archive 的 NPC targeting interpretation，并在授权后更新/再生冻结 inventory。Builder 不得自行改 inventory。
2. **先接受并实现 S1 reveal 子合同**：复用 typed reveal/loss gateway；增加 source/battle provenance、idempotency 与 restore tests。随后才实现 S1 gale 的 deterministic RNG、hand attribute classifier 和 battle-local power-zero。
3. **实现 S2 分支合同**：优先 pending choice + atomic payment/hide，再 deterministic discard，最后 source-bound skill forbid 与 round cleanup/restore。每项都要有 focused tests、生成物/内容校验、typecheck、diff-check 和独立 review。
4. **最后实现 S3 shared mechanics**：先正式定义 movement/deployment lock 和 external effect source attribution，再绑定 Achilles 的 exact-one-opponent pair、terrain immunity 与 restore/replay。
5. 每个阶段都必须重新生成 formal/review 双线证据并完成 A-sync；未获得 acceptance 前，不能以旧 handler、旧测试 fixture、`hasConfirmedOverride` 或本报告的候选语义计入 owner-complete。

## 6. 本次变更与验证

本 commit 仅新增本报告；未改 production code、冻结 inventory、authoring source，未联网、未创建或推送 PR。

* `npm run typecheck`：PASS。
* `git diff --check`：PASS。
* 工作区在提交后保持 clean。
* 既有 Achilles authoring test 中的 source-image assertion 仍因外部 `D:/fd/chm-extract/...` 不可见而失败；该既有证据缺口未被本报告掩盖，也不是本报告把 legacy handler 升级为授权的理由。

