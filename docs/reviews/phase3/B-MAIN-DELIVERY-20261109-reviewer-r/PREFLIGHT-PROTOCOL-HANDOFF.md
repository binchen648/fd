# 病弱预检协议交接

当前工具和输入均已在 `3f2e213e36defb9e701935754bc0ab328d053e63` 复跑。

1. 该提交只有五个机制文件，交接 manifest 未随该提交交付。使用候选内相对 manifest 路径得到 ENOENT。
2. 使用现有绝对路径 manifest，返回 `unknown field owner`，exit 2。
3. 使用已有 task-check-v1 协议探针，返回 `Unsupported task or epoch`，exit 2。工具明确限制 `P3-E08-B11-COMBINATION-READINESS` 与 `FD-P3-2026-09-23-08`。

Root / G 需确定 B-HAND-REMOVAL-01 的正式任务协议、控制 epoch、允许路径、验收范围和依赖证据。若采用现有预检工具，应由治理负责人提供针对该任务的 adapter 或正式扩展。必须保留任务、epoch、源文件版本和审核证据的严格绑定。

本次技术接受范围为卡级移除替换机制。病弱的完整角色生产初始化、进入手牌、参战归零、战后弃置和恢复，需要冲田依赖接入及单独正式 L1/L2。

生产修复可沿现有 Promotion 流程继续。Root / I 需将真实 GitHub reviewer、PR 审核链接、审核承载 SHA、synchronization SHA、最终 integration HEAD 绑定到当前 schema，重跑门禁。
