# FD Phase 3 Development Throughput Optimization Plan

登记：2026-10-12。Owner：Planner / Process Controller。
状态：EPOCH_10_PREPLANNING_PROPOSAL，待用户确认，不是有效治理合同。
不激活 Epoch 10、不派发实现、不改变当前 B11、规则或 acceptance。
这是任务流优化，不是重新设计 Phase 3 宏观架构。

## 当前事实与目标

已核验 main：9a1689d2ec5b56b67d1483d2593b4ab809d6c15c。
主线已发布 Epoch 08；Epoch 09 限域批准已发布在 Planner 分支，主线发布仍待确认。
B11 最终组合 FAILED，P0 身份冒用与 P1 revision 绕过必须继续修复。
A 原日志/执行范围完成，不应回到重复同步循环。
正式账本保留 111/944，本计划不授予迁移 credit、Gate C 或 Release。

目标：减少等待、重复读取、重复测试和角色级 PR，同时保持 exact-SHA、
独立 Review、服务端权威及单 Slice 最终 promotion 边界。
2–5 倍提速是待验证假设，不是承诺或已有测量结果。

## 方案选择

| 方案 | 优点 | 代价/风险 | 建议 |
| --- | --- | --- | --- |
| 仅新增 prompt 字段 | 成本低 | 人工同步及锁漂移仍在 | 用作过渡，不作为终点 |
| 资源锁 + 小批次 + 机器 handoff | 可渐进试点，保留现有验收边界 | 需验证闭包和锁机制 | 推荐 |
| 全自动跨对话调度 + 大批次合并 | 理论并发高 | 当前真实来源认证/恢复/桌面控制未证明；放大权限与验收风险 | 暂不采用 |

## Task Packet 字段

每个可执行任务应有一份权威机器 packet，Markdown 为生成视图/入口，避免双份状态。
新增字段及其候选语义：

| 字段 | 值/要求 |
| --- | --- |
| risk | LOW / MEDIUM / HIGH / CRITICAL |
| promotionClass | EVIDENCE_ONLY / AUTHORING_ONLY / RUNTIME_DELTA / SECURITY_RUNTIME / CONTRACT_CHANGE |
| lane | Ability / Session / Content / Security；证据工作为共享支持角色，不是 runtime lane |
| stage | PREPARE / READY / IMPLEMENT / VERIFY / PROMOTE / DONE / BLOCKED |
| identity binding | task、epoch、main base、source/candidate/review SHA、tested SHA 分别记录 |
| resources | exact paths + dependency/contract closure + lock owner/generation |
| acceptance | 每个 boundary 的 scope、review artifact/hash、未验证项、required checks |

风险与类别不互相替代。LOW 也需要事实/哈希/范围审查；authoring 使用已有
contract 不等于无需身份级执行证明。安全或 shared authority 变更通常 CRITICAL；
CONTRACT_CHANGE 至少 HIGH，最终分级由实际影响而非作者自评决定。
机器仅汇总证据与守卫状态，不自行产生 Reviewer PASS 或 main credit。

## Lane 与资源锁

- Ability：compiler/interpreter/resolution 等能力运行时。
- Session：room/session/socket/persistence/authority。
- Content：authoring 与依赖的 generated 内容，须确认运行时合同已接受。
- Security：按风险管理认证/权限修复，不是免于 Session 锁的第四个 writer。

一个任务可占多个资源域；任何同路径或合同闭包冲突都禁止并发写。
Security 与 Session 重叠时必须串行，或分配给同一独占 owner。
Generated 文件冲突、共享 schema/helper、测试夹具和 package 命令也纳入检测。
获取多锁应 all-or-none；过期锁不能自动抢占，有效工作必须保留并由 Planner 处置。
source 锁与主机重测试窗口分别管理，不把没有进程等同于 Worker 确认。

## Ready Queue 与流水线

建议初始全局 WIP 上限：1 IMPLEMENT、最多 2 VERIFY、最多 3 PREPARE。
这是上限及预备目标，不是必须占满的数字；不能以积压数量制造任务。
资源域试点证明安全后，再允许不同非重叠域分别拥有一个 IMPLEMENT。

PREPARE 只读：source delta、lineage、等价分类、合同闭包、hot-file 及测试设计。
READY 必须已有 exact 任务、已接受依赖、明确 owner 和可获取 inputs。
IMPLEMENT 必须取得实际资源锁；VERIFY 只读 frozen candidate，不占源文件 writer。
下一任务可以预备，但 Review 失败后需保留修复优先级，不能无限堆积同域候选。

## Runtime Batch Mode 的边界

Slice 是一个可独立验收的行为/合同边界，不是一个对话。
Batch 是基于同一 accepted capability 的受限工作分组，不是宏批次自动验收。

1. 先实现一个共享 capability 和一个真实代表 consumer，RB 独立接受。
2. 已接受 capability 的其他 consumers 可按同 shape 分组迁移；逐 identity
   保留 canonical 条款、编译/注册、正负测试、路径与 lineage 证据。
3. 不同 Trigger/Battle/Lifecycle/Target 合同不得因同批次而合并验收。
4. Reviewer 可一次接收完整批次 packet，但结论按 boundary/identity 输出；
   任一 identity 缺证据保持未接受，不把全部批次标为 PASS。
5. promotion 仍每个 Slice 一个最终 PR；多 consumer 只有确属同一验收 Slice
   才可一起晋升。不同 Slice 可以同次协调审查，仍分别晋升。

先小规模试点，暂不设无证据的固定“每批几十技能”目标。
风险分级缩短的是不适用环节，不是独立 Review、实际负例或最终门禁。

## 测试与自动 Handoff

开发：focused positive/negative/boundary。冻结：typecheck、关联回归及必需组件/
浏览器验证。晋升：适用 full CI/build/policy 和 exact promotion-head checks。
具体 mandatory tests 由当前合同/任务确定；不能以分层为理由省略必需 full CI。
审查 source-equivalent carrier 可复用真实 receipt，但新源码不能继承旧 PASS。

优先实现本地 CLI 的只读状态/handoff：Git SHA、base、dirty、paths、source blobs、
原始命令 receipt/hash 和 drift 闭包。然后实现经审查的锁与状态转换。
运行过的命令必须有真实记录；CLI 不从摘要补造 exit/log。
与已有 C01 方案复用，不另造并行调度器。跨对话发送/桌面控制不列入试点依赖。

## 落地顺序与责任

| 阶段 | Owner | 产出/启动条件 |
| --- | --- | --- |
| 前置确认 | Planner + 用户 | 确认本提案边界；B11 不停工 |
| 有效合同 | Planner/G | B11 完成当前修复验收收尾、Epoch 09 发布后，确认 exact main 并发布 Epoch 10；不得提前重标旧任务 |
| 字段/入口 | A；RA 审查 | task packet schema、只读状态/Markdown 视图、fail-closed validation |
| Handoff/锁 | A；RA 审查 | 原子多锁、恢复/冲突负例、真实 receipts、无自动 acceptance |
| 只读试点 | Planner/A/B/R | 下一 capability + 两个预备任务；冻结 baseline，测试真实漂移和冲突 |
| 小批次试点 | B/S + RB/RA | 一个 accepted capability 的少量真实 consumers，逐 identity 验收 |
| 评估/推广 | Planner | 达标后逐资源域增加并行度；失败则回退调度方式，不回退有效源码 |

此表是规划，不是 A/B 新派工。没有为这些任务授予路径、writer reservation 或实现授权。

## 当前 B11 保持不变

B 修复 -> RB fresh security/composition Review -> RA 最终 evidence ->
G 最终 attestation -> Planner 单独授权 I -> promotion/required checks/human merge。
RA 旧缺口的只读准备及 G transition 准备可以并行；最终 verdict 必须绑定新源码。
不能因本方案暂停 P0/P1 修复、重开 A 旧执行任务或扩大已批准九个 blob 范围。

## 测量与退出条件

试点前记录真实任务的等待时间、实现时间、review turnaround、重复重跑/同步次数、
promotion lead time、返工率、stale binding 和冲突数。按风险/类别比较，
不能用一项轻量 evidence 任务与历史大型 runtime slice 比较来宣称倍数提升。

最低正确性退出条件：无并发同域 writer、无错误 PASS/credit、每项变更有 exact
审查及来源、恢复后无重复派工/丢锁、拒绝 stale/tampered packet。
吞吐改善应表现为可比任务等待/重复工作下降且返工/漏验未增加。
未达到条件则不扩大并行，不声称效率优化完成。
