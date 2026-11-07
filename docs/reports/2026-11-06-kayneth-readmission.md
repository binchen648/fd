# KAYNETH-READMISSION-01 — 指定版本重新送审

日期：2026-11-06。当前状态：SCOPED_REVIEW_COMPLETE（限正常有效来源；等待最终接受决定）；未授予 ACCEPTED、promotion、migration credit 或合并权限。

## 授权与版本

用户本轮明确解除 `data/authoring/masters/master.kayneth.json` 原字节冻结，仅允许 `b39a3c06fba757cecac2d6552789ad3291dea18f` 的 `pride`、`double-master` 已记录变化重新送审。授权提交 `1379fc27`；机器记录：`docs/agents/manifests/releases/KAYNETH-REGISTERED-ARCHIVE-20261106.json`。技术审查 Base：`b5c86226a976b2f340d4980e3de1aa1106a121ee`。

旧 blob `85566cc68fef031b804fe00c7fa8184afdff8a4c`，SHA256 `8047edd19f83c733e72c2b25c6c9bdf76e36a0d8005d358bbe6a2e6df4304c20`。候选 blob `30881da2d5da7e8bcb8b0061a1b1445295941e5b`，SHA256 `8007738adacc3918f349ab9edad38706a319b4d4026537bebe1f9ff240eda183`。当前注册文件已是候选版本，本任务未改动 authoring 或生产代码。

完整 JSON 对比证明：只有两张授权卡的 abilities 不同，其余卡、原文、来源和元数据相同。独立 s3 文件及身份 `master.kayneth.skill.s3` 保持冻结，不用于替代注册 pride 的验收。

## 验证与实际结果

命令：`npx vitest run packages/rules/tests/kayneth-s3-consumer-migration.test.ts packages/rules/tests/acceptance/kayneth-readmission.test.ts --reporter=json`。

边界假设诊断执行：16 项，15 PASS / 1 FAIL，自然退出码 1；2026-11-06 04:27:30.831Z 至 04:27:35.598Z。分类 TEST_FAILURE，不是 timeout 或环境推断。

独立 Reviewer 随后确认 owner-only 必须失效的假设无独立规则依据，撤回其必需准入门禁要求。四个混合归属诊断原样保存为 external `ownership-hypothesis.diagnostic.ts`，未改变预期或隐藏原始失败。正式测试保留已确立规则的 12 项断言，最终 scoped 执行 12 PASS / 0 FAIL，自然退出码 0；04:29:16.125Z 至 04:29:20.126Z。这是审核纠正测试前提后的限定范围结果，不是16项全部通过。

实际验证包括精确版本、原文保持、注册 pride 部署限制/非法目的地原子拒绝/当前 VP 与占位重检/Session 恢复/实际位置变化；double-master 解除八魔力准入而仍支付实际印刷费用、资源不足拒绝和实际激活；移除真实来源后两项被动不再生效，；另行诊断了 owner/controller 边界。

旧档案哈希断言保留，迁移为读取固定测试 fixture；当前文件另按用户授权和候选哈希绑定。fixture 保存完整旧 Git 字节，避免浅克隆 CI 依赖历史 Git 对象。初始 12 PASS 和最终 scoped 12 PASS 均不覆盖四项混合归属假设。

## 独立审核纠正与未覆盖边界

唯一失败：只改变 pride 来源的 ownerPlayerId，保留原 controllerPlayerId，原玩家仍仅能部署 shinto，测试要求可选 magic_workshop。MatchSession::structuralDeploymentReplacementLocations 的 canonical s3 分支检查 owner；registered deployment.requirement 分支只检查 controller 和来源区域。

这证明两条消费者路径边界不同，尚不证明正常对局规则漏洞：注册字段明确 scope.subject=controller，最终规则也承认拥有或控制的牌的效果。新增反例假定必须同时 owned/controlled；该假定须独立审核，不能仅以旧 s3 验收替代注册合同，也不能因红测试直接改生产实现。尚未证明该混合归属状态由本次七人正常流程可达。

独立审核结论：这项 owner-only 反例没有独立规则依据，不能据此认定已确认 Runtime 缺陷或否决指定档案；限定正常有效来源的重新送审技术审核可以完成。若未来引入混合归属消费者，由 A 总控与 B 字段负责人先明确边界。若需要 Runtime 修复，另行确认精确授权与单写入范围后执行；本任务未转移热点写权限。原始失败保持原分类；不得将12项范围结果写成16项全部通过。

## 证据与限制

外部目录：`D:/fd-validation/kayneth-readmission-20261106/`。完整诊断证据：`final-boundaries.json`、`final-boundaries.log`、`final-run-receipt.json`、`ownership-hypothesis.diagnostic.ts`；限定规则最终证据：`scoped-final.json`、`scoped-final.log`、`scoped-run-receipt.json`；独立审查：`review.md`、`review.json`。初始化解析失败及历次运行原样保留。

本轮只做 L1/L2 定向验证；未重跑完整 CI 或七人 11 回合，不覆盖历史全量 CI 阻塞、B94、地利/Medusa 候选或其他技能验收。未修改 D:/fd 的冻结未提交成果，未创建或合并 PR，未释放任何共享 Runtime reservation。
