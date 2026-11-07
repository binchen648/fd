# A/B CI 接入收敛：RC-CI-01 进展与 B 资料清单

2026-11-05。测试分支 codex/a-b-ci-reconcile-20261105；独立工作区 D:/fd-validation/a-b-ci-reconcile-20261105。
Base c9e383f99eb69afd49da22a4817e629fb1a6e182；生产代码仍为冻结候选 b052183a1f3f73afd4dfee785d9af6e6e305aed4。

## 本轮已经执行

按新三级体系，只执行相关 L1/L2：修复7个旧 fixture 缺少生产 Lucky/Preparation 规则声明的问题，注册当前生产定义，不恢复按卡ID授予效果的旧逻辑。

- 修复前：74项中65 PASS /9 FAIL /0 SKIP；修复后：74 PASS /0 FAIL /0 SKIP，测试名称相同。
- 原25项CI失败中的9个同名案例已在定向复现中通过；其余16项未在本批复验。没有重跑全CI，不能宣称当前全CI只剩16 FAIL或已经通过。
- 原有732个 expect 调用及其 matcher/参数AST文本完全一致；没有改预期、超时、skip或生产代码/数据。
- 独立审查：APPROVED_FOR_SCOPED_TEST_FIXTURE_PATCH。它只接受此7文件fixture修复，不接受整个游戏/CI。
- 首次新工作区运行未生成@fd/content编译产物，0项测试收集失败；保留fixture-red.json但不当语义红证据。完成工作区构建后取得有效fixture-red-02.json的65/9。
- 原Runtime工作区、B的D:/fd未修改；共享Runtime Reservation未释放、未转移。未创建/合并PR。

## 已有 B 资料直接复用

A当前接入快照为b39a3c06fba757cecac2d6552789ad3291dea18f，B来源链51c54e933c84985aec45467f413b90768d61183d；后续RC生产修复冻结于b052183a。
已有生产字段：basic.luck声明immune_to_defeat；basic.preparation声明terrain.multiplier和battle.winVpBonus。
已有A3用户裁定文档：FD-A3-LUCK-DEFEAT-SEMANTICS.md、FD-DECISION-CARDS.md（b39树，随b6e327f3提交）。不重作幸运裁定，也不重新建设OCR/全量规则化盘点。

## 仍需要 B 补充的增量信息

| 信息 | 需要的具体内容 | 用途 |
| --- | --- | --- |
| 1. 本次正式交付版本 | Candidate SHA、Base SHA、分支/工作区、变更文件与冻结状态；未提交文件另附固定哈希，区分已实现/已审/已接受/已合并 | 避免把新字段与未审Medusa/地利等其他批次混入当前七人基线 |
| 2. 当前七对主从的字段差异 | 只列相对A当前快照有变化的能力：稳定ID、原字段→新字段、规则来源、时点/目标/费用/范围/生命周期、对应消费者；若与A的四倍速attack_area、合计aggregate:total、业火修复冲突，显式列出 | 对齐执行与验收合同，防止接入覆盖A修复 |
| 3. 肯尼斯冻结材料变更依据 | master.kayneth.json原冻结registered archive SHA与新SHA的差异、pride旧条款/新字段映射、变更的规则依据、既有独立接受/迁移记录 | 关闭R79来源指纹失败；不能直接把预期hash换成当前hash |
| 4. 五张额外事件的准入与消费者 | 作弊器、短兵相接、核心骇入、嵌合涡流、优势火力学说：各自规则来源、生产引用/消费者、是否进入常规牌堆、准入记录 | 静态已确认库注册23张，常规牌堆20槽/18个唯一ID；五张额外定义未在该牌堆内，不能直接改18→23的断言 |
| 5. 能力身份及消费者拆分 | command-spell.victory-vp等新增/拆分ID是否正式纳入当前名单；旧directive→新Typed消费者映射、个人胜利奖励唯一读点 | 对齐能力名单、避免令咒重复计奖；不授予迁移credit |
| 6. 与这些变更对应的验收证据 | 精确SHA上的最小L1/L2用例、真实效果/拒绝/费用/生命周期与恢复结果、已有独立结论及OPEN项；无需逐技能七人11回合 | 支撑合同同步，区分实现候选与正式接受 |

B可直接给现有文件路径+SHA+必要差异，不必重新写整套报告。当前不分配B共享Runtime生产写权限。

## 可直接转交 B / DeepSeek 的提示词

你负责本次B线只读资料交接，不修改Interpreter、Loader、MatchSession或其他共享Runtime。A生产基准b052183a，已接入B快照b39a3c06，当前RC-CI-01仅修fixture。请按上表六项返回现有证据路径/固定版本及增量差异；优先处理正式版本、肯尼斯冻结指纹、5张额外事件、command-spell.victory-vp身份与奖励消费者。幸运A3裁定和当前两个基础攻击生产声明已有，直接复用。未提交/未审/未合并成果分开标明；不得把候选PASS写成main接受，也不要以本次请求恢复共享文件写入。

## 后续分工与验证

Root继续负责A侧合法性fixture、响应驱动、恢复/地利表示与测试合同收敛；B提供上述版本、来源和字段/消费者证据。其余16项中仍有可独立处理的A侧场景问题，并非全等待B。

先按用例完成L1/L2及独立审查；只有剩余失败已被正确处理、候选稳定并有明确集成目的后，再进行一次完整CI和必要L3。保留A-MATCH-03基线，不逐卡重跑整局。

证据目录：D:/fd-validation/a-b-ci-reconcile-evidence-20261105。关键文件：fixture-red-02.json、fixture-green.json、assertion-integrity.json、review.md/json、remaining-ledger.json、event-inventory-observed.json。全局接受状态仍NOT_ACCEPTED。
