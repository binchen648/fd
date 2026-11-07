# A/B 五项字段接入修复 — 最终实施与验收报告

日期：2026-11-07（Asia/Shanghai）。Owner：Root；独立 Reviewer：rc_independent。

五项字段缺陷与本批发现的准入、生命周期问题已实现，以下为实际验证结果。代码候选 `8b60e48b35e2df30d17d95b8c4c329c8ae645ac3`；Base `493c87fa469fae3598e8368927d458708d890ac4`；分支 `codex/b-field-five-closeout-20261107`。本报告不授予全94身份技能的 ACCEPTED、合并或 credit。

## 1. 修复前后

| 项目 | 当前行为 |
|---|---|
| 舞弥压制 | 非舞弥先向唯一有效舞弥足额支付2 VP；余额0/1时不展示且原子拒绝。豁免按当前御主身份判断。地利按(基础值+1)×2，支持0基础和无槽位，不凭空分配槽位；来源或轮次失效后停止。 |
| Caster幸运计数 | 同时计普通 basic.luck、生成 card.luck；只计拥有且位于弃牌区的实体一次，×5封顶15；区域、所有权变化及恢复会重算。 |
| 艾蕾花开冥界 | 缺席时放置唯一关联实体，锚定真实战场并接入反转、部署收益、豁免及清理；不伪造打出或真名。已有同场才加一次+6合计，异场不迁移也不加。施放来源关闭后撤销+6。缺失来源zone、锚点或地点不误放行。 |
| 巴御前使用限制 | 牌级 playRequirements 与能力条件共用轮转顺位谓词，按 active 人数 floor(N/2)；stage、confirm 与状态变化后重验，测试覆盖 N=1..7。 |
| 起源弹实际结果 | 同一 Typed 事务读取目标实际魔力 after-before；正常9→6则牌2→8，卧藤免疫时损失0、牌仍2。目标变化、来源关闭或控制转移、旧选择和错误binding均拒绝并回滚。 |

B提案以4c为来源。五份源档案的印文全部保留。A明确两处序列化修订：舞弥 terrain_bonus.layer=base（保留既有A2最终地利语义）；艾蕾 total modifier.sourceMustRemainActive=true（Final Rules11.7/12.2）。未知或不完整新形状在 Loader/Runtime 拒绝，不靠字段透传制造自动化。

## 2. 最终同候选实测

| 层级／门禁 | 结果 | 原始证据目录中的文件 |
|---|---|---|
| 完整CI | **1997 PASS /0 FAIL /0 SKIP，自然退出0** | final-ci-3.json/log、final-ci-3-receipt.json |
| 独立实际重跑 | 48/48，自然退出0，前后HEAD精确且clean | independent-focused.json/log/receipt.json |
| L1/L2补充 | 22/22，自然退出0：pending后目标／来源变化、恢复到期、N=1..7、公开VP和合计威力 | extra-session-final.json、extra-session-final-receipt.json、extra-session-negatives.test.ts |
| 七御主令咒补充 | 77/77，自然退出0 | seven-seals-final.json、seven-seals-receipt.json |
| 客户端／服务端 | 66/66、24/24，自然退出0 | client-tests.json、server-tests.json及各receipt |
| 类型／构建／内容 | typecheck0；client build0；content validate0 | 终端记录、build.log/receipt、content-validate.log/receipt |
| L3真实HTTP+8路WS | 三场均11回合终局；676/668/532次命令；所选合法动作异常拒绝、隐私、不变量违规及排除分支均0 | wire-final/*.json、wire-final.log/receipt |
| 浏览器真实服务端 | **5/5，自然退出0** | browser-final/results.json、browser-final.log/receipt |

完整CI于2026-11-07 19:45:43至19:54:36（Asia/Shanghai）自然结束。上述测试组存在重叠，不能相加成新的覆盖率。浏览器覆盖普通行动及公开威力、七浏览器11回合与重连、鲜进程恢复、起源弹真实替换抽取／重连／stale。它们是L3整体基线，不表示94条效果全部覆盖。

慎二更换御主按用户排除；严格联机策略核对该分支events/logs为0，其余历史CI入口保留。77项中的胜利奖励使用明确的战后事件fixture，是有界L2，不冒充逐技能自然战算。本机真实HTTP/WS不是尚未配置的Sakura公网隧道验收。

## 3. 文件与函数修改

| 文件／组 | 主要修改点 |
|---|---|
| 五份authoring、generated content library | 条件费用、幸运公式、场地placement／同场谓词／来源绑定、牌级准入、实际结果引用；生成产物由content:compile重建。 |
| ability/exact-vp-transfer.ts | isExactVpTransferCost：精确成本形状。 |
| ability/battlefield-placement.ts | isAcceptedBattlefieldPlacement、supportsBattlefieldPlacement：闭合四类场地消费者。 |
| ability/actual-loss-power.ts | lowerActualLossPower：快照请求表达式输入lowering，后继只读Typed实际结果。 |
| ability/loader.ts | 条件费用、terrain layer、source-bound aggregate、controller mana exception、placement、实际损失序列准入。 |
| ability/interpreter.ts | activationContractFailure／exactVpTransferPlan、installCreatedPowerModifier、battlefieldPlacementFailure／installAnchoredReversal、collectTriggeredAbilities、executeEffects／executeResolutionEffects、hasControllerSkillManaException、projectAbilityState。 |
| ability/resolution-dataflow.ts | 目标参数化adjustMana、保护钩子、source-only createSourcePowerModifierPrimitive、resultSchemas及绑定验证。复用既有事务与bindings store。 |
| core/terrain-advantage.ts、core/combat-resolver.ts | 基础／最终地利分层、来源有效性、无槽位合法加成，以及有来源约束的固定战场反转。 |
| types.ts、extended-effects.ts、face-up-cards-per-round.ts、executable-card-pack.ts | 锚点状态及公开投影、倍率到期、无关定义预过滤、Typed序列可执行编译。 |
| b-field-five-closeout.test.ts及3份regression | 新48项定向和反向证据；保留旧规则断言，补合法fixture及新primitive schema producer。 |

精确24个变化文件见 changed-files.json 与 git diff Base..Candidate。没有修改MatchSession或客户端／服务端生产文件，没有重置D:/fd及旧冻结工作树，没有操作PR689/690或执行合并。

## 4. 迁移、失败及纠正记录

- B三份external提案经精确blob、SHA256和JSON Pointer核对。原patch因CRLF无法直接apply，外部LF副本检查通过；未整包盲目应用。
- a9c7e25a完整CI实际1883/107/0、自然1，原final-ci.*全部保留。新增controller-wide guard误覆盖ArtoriaAlt/Kintoki source-card-only例外；已窄化匹配并加入原始档案正例。
- 历史standalone测试只补有效前提：舞弥生产owner metadata；Bloom真实战场；部署事件实际location；fb2由实际play建立field anchor。原数值预期、失败断言和超时没有削弱，独立ci-repair-review确认。
- e874bf6d完整CI-2实际1992/0/0、自然0；额外实际反例随后发现Bloom关闭来源仍残留+6。该候选未被当最终接受；extra-session.json与红日志保留，修复后的反例已纳入最终CI。
- 新缺失锚点反例先红后绿，消除了undefined===undefined的错误部署奖励。初始Origin不存在的fixture ID、终末事件缺失provenance红日志保留；仅改为真实技能／令咒及可信事件前提，数值规则不变。
- 首次wire因external目录解析不到ws，尚未进入游戏；wire.log/receipt保留。明确导入工作区已安装ws后完整重跑通过，生产与超时不变。

所有逐轮JSON计数见 verification-index.json；历史报告不能重标为当前PASS。

## 5. 未解决事项与风险边界

本批五项缺陷与审查发现的layer、source-zone、Bloom来源关闭、缺失anchor问题均有当前通过证据。旧19失败在最终CI中全部唯一匹配passed，见 independent-historical-19-check.json。

**全94身份逐条效果验收仍未完成。** 当前矩阵109行=94 authored+15 generated：49行有有界通过证据、59行尚无当前逐身份核验映射、1行更换御主执行排除；全部行均不自授技能ACCEPTED。NOT_RUN不等于仓库没有测试，整场通过或automatic声明不能替代条款验收。resume的N/A仅指没有技能专属选择；persistentRestore单列状态恢复。

94 authored与15生成动作的实际Session注册检查通过，只证明编译／注册及automatic声明。未来新B字段仍须合同、准入和消费者验证；本次修复不是任意JSON字段的通用执行授权。

## 6. 提交、冻结与独立验收材料

代码提交依次为：eebd2571、d24f6408、f76368e1、4b7f0552、a9c7e25a、e874bf6d、fecd5767、8b60e48b。完整SHA、候选与Base关系以Git及candidate-binding.json为准。

最终代码候选保持冻结；后续文档提交单列，不宣称文档新HEAD执行过完整CI。任务保留Root reservation，runtime写入冻结，没有release/transfer；Loader不因此向B授予新写权。没有migration／coverage credit或自动PR合并。

B无需重做五项提案。下一批只读筛选应参考本候选词汇和两处A序列化修订，不能用旧patch覆盖当前实现。若后续请求集成，先核对最新main、基线关系与权限，再由用户批准具体集成；本轮停止于可审查候选。

独立材料：batch12-review、batch3-review、batch4-review、ci-repair-review、bloom-review、independent-focused，以及最终final-unified-review。统一审查不得把本批修复通过扩大为完整游戏或全角色能力接受。

全部原始证据：`D:/fd-validation/b-field-five-closeout-20261107/`。入口：candidate-binding.json；逐技能表：seven-roster-skill-acceptance.csv；编译身份：compiled-identities.json。
