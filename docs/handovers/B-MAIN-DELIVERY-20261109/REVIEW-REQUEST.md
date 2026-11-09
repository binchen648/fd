# B 线固定候选审核请求

请 Review 先读取 versions-and-evidence.json，核对候选、父版本、文件 blob 及日志哈希，再读取 acceptance-matrix.json。

生产修复候选为 f6f8bfc7a5d5ee34985be2885de39008cfccbbda，病弱手牌移除机制候选为 3f2e213e36defb9e701935754bc0ab328d053e63。共同主线基线为 816433dd881ad5852de27cc9ce4ce3e65ca09069。本材料承载提交的 HEAD 与被审核运行时代码 SHA 分别绑定。

## Review 输出

请逐项给出 PASS、FAIL 或 BLOCKED，记录实际审核人、最终候选 SHA、范围、执行命令、原始输出和未关闭问题。技术判定与角色准入、Phase 3 合并判定分别记录。正式接受保持待审核。

1. 核对阿喀琉斯的发动、同场目标、保护、公开手牌、空手牌及最终威力设置，确认迅捷不会被当成敏捷豁免。
2. 核对巴御前本回合来源打出记录、重复投递、跨回合、来源移除及不可阻止扣分。
3. 核对风王铁锤实例记账、连续 +3/+6/+9、间隔重置和每次支付 4 魔力。审查恢复与旧快照边界。
4. 审查固定候选定向证据与仅测试差异能否复用先前客户端和服务端结果。全量 CI 历史失败必须保留。若需要补跑最终全量，按该 SHA执行。
5. 病弱目前只申请移除替换机制的有界接受。原冲田角色编译存在七条诊断，实际病弱生产 L1/L2 仍为 NOT_RUN。
6. 确认 B-HAND-REMOVAL-01 所需的预检协议适配和负责人。现工具 task-check-v1 限定历史 B11 身份。本批没有修改该限制。

## 合并前缺件

生产修复缺 GitHub 正式审核及 Promotion manifest。病弱缺角色依赖接入、角色正式 L1/L2 和适用预检入口。本材料提供已验证事实及复跑入口。

复跑生产专项

    npx vitest run packages/rules/tests/ability-interaction-projection.test.ts packages/rules/tests/regression/achilles-gale-advance.test.ts packages/rules/tests/regression/tomoe-independent-action-production.test.ts packages/rules/tests/regression/battle-loss-unpreventable-vp-trigger.test.ts --maxWorkers=2

复跑手牌机制

    npx vitest run packages/rules/tests/acceptance/b-hand-removal-01.test.ts --maxWorkers=1

每个命令在对应固定候选的干净 worktree 内执行，先 npm ci 和 npm run typecheck 构建 workspace 依赖。
