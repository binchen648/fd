# A 线三级测试执行原则与 PR #693 收口报告

日期：2026-11-08。Owner：Root；独立审查：promotion_693_review。代码状态：IMPLEMENTATION_ACCEPTED_CANDIDATE；本报告提交时远端最终门禁尚未运行，不预写 PASS。实时正式门禁见 [PR #693 Checks](https://github.com/binchen648/fd/pull/693/checks)。不代表完整游戏、全角色或全部事件自动化验收。

## 基线与权限

- Main：e63cdeb2a065a9f87c24039d2b08bbe059513fed。
- 冻结代码候选：4f18ce1d94a36af477b6279b74b1fe3606199e12。
- Root 工作区：D:/fd-validation/five-field-promotion-693；任务 A-INTAKE-PROMOTION-693。
- 候选相对 main 共126路径，含原有Runtime收敛、前置字段及五项字段修复；不是仅五项小补丁。
- 原始独立审查记录：36d7cedeecce6e3e64d40551ca1980e8e624a186；Promotion协议绑定：8798531aa744f6faa0b498151bb3c2893d6b00f5（P3-A-INTAKE-PROMOTION-693映射至原任务A-INTAKE-PROMOTION-693）；[公开审查引用](https://github.com/binchen648/fd/pull/693#issuecomment-6715941716)。协调者发布实际独立Agent证据，不冒充人类审批。
- 生产写入冻结，reservation保留，未释放或转移。D:/fd及旧冻结候选均未覆盖。

## 每次执行必须遵守的测试原则

仓库根 AGENTS.md、docs/plans/fd-tiered-skill-acceptance.md 与文档入口已持久记录：新卡不需要逐张跑完整对局。每次A任务先声明L1必测集、适用L2组合及L3触发理由。

L1直接构造真实MatchSession，只测本技能的费用、合法目标、最终效果、状态/投影及非法拒绝。L2只推进至相关交互阶段，验证连续选择、共享资源、挂起恢复及来源/目标变化。L3在相关修复和独立审查收口后，针对冻结集成候选统一执行；不逐卡、不逐次局部修复重复。完整CI门禁保持原样。

旧seven-roster-combinations.test.ts夹带的11回合整局项已逐字迁至seven-roster-full-match.test.ts；独立审查核实正文、全部断言和30_000超时不变，root Vitest仍收录。测试拆分并不将历史失败改记PASS。

## 修复前后与实际边界

| 问题 | 本轮结果 |
|---|---|
| 公开事件锁漏掉普通移动 | core.movePlayer统一读取事件锁；合法操作投影与提交复验一致，位置/魔力/revision原子拒绝；保留已有可信绕过授权，不扩张为部署限制。 |
| 缓存锁生命周期错误 | movement-locks.ts从当前公开eventPlacements及注册内容定义派生；移除、替换、真实战斗揭示和恢复即时生效。modeState快照只供诊断。 |
| D5未验收消费者越界 | 抵御/祸神/酒宴/狭路相逢/盈月之仪，以及温柔乡/美丽之物/怒发天升/庆安神前比武/白夜行的相关新自动化消费者撤回到既有主持提示边界。印文、内容不变；白夜行仅延期组合验收，不虚称已证实独立算术错误。 |
| 既有支持 | 保留四类原事件消费者与修复后的movement_lock；五项字段修复保留，并通过当前48项独立字段回归。 |

主持提示仍是consumed advisory，未实现或接受完整裁定/可选恢复UI。延期事件不得算作新增自动化或credit。

## 同冻结代码候选证据

| 验证 | 实际结果 | 原始证据（external目录内） |
|---|---|---|
| Root L1/L2九文件 | 175 PASS /0 FAIL /0 SKIP，自然退出0 | event-lifecycle-l1-l2-green.json/log |
| 独立L1/L2五文件 | 89 PASS /0 FAIL /0 SKIP，自然退出0，前后HEAD精确且clean | promotion-final-4f18ce1d-tests.json/log及review.json |
| 类型检查 | 自然退出0 | event-lifecycle-typecheck.log |
| L3 浏览器真实服务端 | 5/5，自然退出0；七人11回合、重连、鲜进程恢复、行动回合与起源弹 | promotion-4f18ce1d/browser-final/results.json及browser-receipt.json |
| L3 HTTP+8WS | 三场11回合终局；673/677/532条命令，21/20/3种能力；投影指令异常拒绝、隐私及不变量违规均0 | promotion-4f18ce1d/wire-final/*.json及wire-final-receipt.json |
| 最终完整CI / Build / Policy | 本报告提交时待最终远端HEAD执行；不能使用0c的GitHub PASS替代 | PR #693 Checks；最终external收据另行绑定精确HEAD |

175与89测试有重叠，不相加为覆盖率。L3是本次共享Runtime集成节点的一组验收，未逐张新卡运行整局。

前一01c候选客户端63/0、服务端24/0、客户端构建0为历史相邻证据；最终GitHub将在当前HEAD再运行正式客户端/服务端门禁，不冒称旧结果属于4f。0c和8b的完整CI与对局证据同样保留原绑定。

Root L1/L2精确选择：event-promotion-boundaries、resistance-promotion、b-field-five-closeout、a-intake-closeout、seven-roster-session-effects、seven-roster-combinations、core/movement、fb2-any-location-except-workshop-movement、src/__tests__/match-session-regressions九个测试文件。独立精确命令见docs/reviews/phase3/A-INTAKE-PROMOTION-693-independent.json。

## 失败保留与迁移

初始1 PASS/11 FAIL、生命周期19 PASS/4 FAIL均保留红例。旧混合文件运行171 PASS/1 FAIL属于真实失败，原始消息STACK_TRACE_ERROR，未推断资源根因；拆分后只将明确选出的局部171项记PASS，整局门禁仍须完成。

首次最终wire运行写收据时ENOENT，退出1，已保留wire-attempt-1-write-failure.log与receipt；创建缺失external目录后，仅补跑缺失联机证据，自然退出0。未改生产代码、脚本规则或超时获得PASS。

先前8b/ce331冻结成果保持不变；0c撤回第一组六消费者，01c撤回剩余未验收消费者并补普通移动，4f完成事件锁生命周期。无代码盲拷贝、测试跳过或Legacy替代Typed。

## 文件与函数清单

- core/movement.ts / movePlayer：普通和效果移动端点事件锁校验。
- ability/movement-locks.ts / movementLocks、movementLockAt：从权威公开事件派生，缓存不授予权限。
- match-session.ts / AUTOMATIC_EVENT_EFFECTS、placeEvent、refreshEventForbids、resolveBattlePhase：移除未验收自动化、嵌套隐藏事件和直接资源发放；保留诊断快照及主持提示。
- ability/interpreter.ts / calculateCardPower、recordMovementForAbilityRuntime：撤回未验收白夜行覆盖与怒发天升无锚点记账。
- core/combat-resolver.ts：撤回对应未验收合计威力/legacy基本威力消费者。
- event-promotion-boundaries.test.ts：23项L1/L2；resistance-promotion保留前批8项；seven-roster-combinations/full-match仅分开测试层级。
- AGENTS.md、三级规范、roadmap、任务与独立review记录：持久执行原则和精确证据绑定。

## 剩余风险与集成要求

1. 最终远端HEAD必须Test/Build/Policy自然通过；若失败，依据原始日志诊断，不改变测试和时限制造PASS。
2. PR #689/#690保持OPEN和原HEAD，未操作。#690已确认有26个合并冲突且存在vpPayment/terrainBid语义差异，不能当作可直接叠加的依赖。
3. 59条未映射身份、全94技能接受、完整主持裁定UI与公网隧道验证仍未完成；慎二更换御主按用户范围排除。
4. 事件属性禁止的既有缓存生命周期尚未被本轮全面验证，不能用移动锁修复宣称所有事件生命周期均通过。
5. 用户尚未批准本PR合并；不得自动合并、释放reservation或计migration/coverage credit。

外部原始证据总目录：D:/fd-validation/b-field-five-closeout-20261107。独立审查所用历史范围报告、所有红例、启动错误、失败与精确candidate收据均原样保留。
