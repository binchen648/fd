# B-MAIN-DELIVERY-20261109 独立审核

审核人为 Codex Reviewer R / Capability Batch Verifier。生产四项修复与手牌移除替换机制的结论分别为 `PASS_SCOPED`。病弱角色的正式生产 L1/L2 和 Promotion 仍为 `BLOCKED`。逐项范围见机器记录和矩阵。

| 版本 | 固定值 |
| --- | --- |
| Base | `816433dd881ad5852de27cc9ce4ce3e65ca09069` |
| 生产实现 Candidate | `f6f8bfc7a5d5ee34985be2885de39008cfccbbda` |
| 手牌机制 Candidate | `3f2e213e36defb9e701935754bc0ab328d053e63` |
| 实现者材料承载 | `8ae925ee835e2fb97cc248456c1ea32f97dea585` |

生产候选从 Base 变更 9 文件，手牌候选变更 5 文件。14 份 blob/SHA-256 逐项与提交相符。材料内 10 份已提交日志哈希相符。两候选基线祖先关系成立，工作树干净。生产最终提交相对 `587f5e40` 只修改投影测试，所有本次新鲜执行仍分别绑定实际候选。 [文件与日志审计](D:/fd-validation/r-b-main-delivery-20261109/packet-audit.json)

| 身份与合同 | 独立验收范围 | 结论 |
| --- | --- | --- |
| `sc-achilles-1.gale-advance` | 正式包初始化、未激活技能区发动、真名与来源区域、公开手牌、保护、空手牌及地利后归零、幸运和敏捷豁免、迅捷负例、恢复与重复拒绝。补做正常打出至攻击区后仍能发动。 | PASS_SCOPED |
| `sc-achilles-2.blue-sky` | 同战场弃牌，排除工房、异场及受保护玩家，2 魔力时不展示固定 3 魔力分支，待选窗口恢复和重复提交原子拒绝。 | PASS_SCOPED |
| `sc-tomoe-1.penalty-on-defeat` | 合法出牌与 +3，后半拒绝，未打出不扣，打出后移除仍在真正生产战后屏障扣一次不可阻止 5 VP，重复/跨回合及恢复。 | PASS_SCOPED |
| `sc-artoria-alt-1.chain-of-wind-king` | 正式 Session 普通出牌后发动，同实例连续 +3/+6/+9，间隔重置 +3，每次支付 4 魔力，期间保存恢复和重复发动拒绝。 | PASS_SCOPED |
| `zoneMoveReplacement` | 授权效果的手牌移除转弃置，发动费用真实移除，选择、保护、资源不足、目标变化、恢复、非法规则拒绝及七席初始化兼容。 | PASS_SCOPED，限机制 |
| `card.x-weak` / 冲田 | 当前生产包无冲田，源档案仍有 7 条加载诊断。真实牌库初始化、病弱进入手牌、参战归零、战后弃置及角色恢复待执行。 | CONTENT_BLOCKED，L1/L2 NOT_RUN |

执行链核对为正式 Authoring → 内容编译/生成库 → executable pack → createMatchSession → 客户端合法操作投影与玩家指令 → 效果与战算。巴御前补充场景经过 Session 的统一战后结算屏障。受控起始状态、阶段推进和结算数据在脚本中明示。新鲜证据包括最终 SHA 的定向 17 项、客户端 66 项、服务端 25 项，以及补充 L2。手牌 SHA 的 21 项机制测试与类型检查也通过。生产完整 CI 为 2057 项通过、0 项跳过，exit 0。 [完整 CI](D:/fd-validation/r-b-main-delivery-20261109/production-ci.log) · [生产类型、客户端、服务端与生成校验](D:/fd-validation/r-b-main-delivery-20261109/production-validation.log) · [定向结果](D:/fd-validation/r-b-main-delivery-20261109/production-focused.log) · [补充 L2](D:/fd-validation/r-b-main-delivery-20261109/l2-probes.log) · [手牌机制](D:/fd-validation/r-b-main-delivery-20261109/hand-validation.log)

共享 Runtime 回归覆盖实际生产 consumers、统一战算顺序、合法投影、来源生命周期、恢复、联机修订和幂等。完整 CI 包含七席 11 回合、多 seed 与组合回归，服务端也执行 HTTP/WebSocket 完整对局。当前生产候选没有「抵御」参与声明入口，该子系统的独立验收保留。分支费用过滤的已验范围是立即执行的固定数字 pay_mana。旧存档缺少连续使用历史时重新记账。

两个阻塞需由 Root 继续处理。手牌候选内没有交接 manifest，直接使用相对路径会 ENOENT。使用已有外部 manifest 返回 `unknown field owner`，通用协议探针返回 `Unsupported task or epoch`，均已在手牌固定 SHA 上重跑。Root / G 应绑定本任务协议、epoch、允许文件及依赖范围，再适配预检。冲田所需的私有手牌选择、临时攻击、持续公开手牌与阶段预约先分批接入，再进行角色级验收。 [协议交接](D:/fd-validation/r-b-main-delivery-20261109/PREFLIGHT-PROTOCOL-HANDOFF.md) · [预检日志](D:/fd-validation/r-b-main-delivery-20261109/hand-preflight.log) · [冲田诊断](D:/fd-validation/r-b-main-delivery-20261109/okita-dependencies.log)

生产修复建议进入 Root / I 的 Promotion 组装。现行工具要求真实 `github:<login>`、实际 PR 审核链接、包含 attestation 的独立 review SHA、synchronization SHA 和最终 integration HEAD。此审核记录提供本次真实技术 reviewer、候选、范围和结论，后续按实际 GitHub 记录生成工具所需 attestation。病弱角色保持阻塞。准入和 migration/coverage credit 增量均为 0。 [Review 到集成交接数据](D:/fd-validation/r-b-main-delivery-20261109/PROMOTION-HANDOFF.json)

材料完整性有一项补充。原材料承载提交未包含收据列出的 `publish-final.log`。本次从原证据目录复制该文件并验证 SHA-256 相符，放入复核包。该补充记录见 packet audit。

执行时曾因给已有 maxWorkers 参数再次追加值导致 CI 包装命令失败。按原命令重新运行后的完整结果使用 production-ci.log。补充恢复夹具最初遗漏 playedRound，恢复校验按预期拒绝。补齐真实运行时必需字段后已重新执行。巴御前先前尝试直接调用单战场结算未进入全阶段屏障，最终场景已改为实际 Session 战后阶段入口。上述均为审核夹具/调用修正，本次源码未发生调整。

候选变化后，重新核对受影响源数据、共享消费者、L1/L2 与门禁。独立承载记录的提交信息见 review-carrier.json。
