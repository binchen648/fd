# FD Runtime Convergence Final Report

> 2026-11-06 后续核验：最新代码候选 `4c744e103b7c86dd1a1b3eb911c2f5e919aac5cb`，完整CI **1930 PASS /19 FAIL /0 SKIP，自然退出1**；整体仍 **NOT_ACCEPTED / Integration NO**。详见 [A侧接入验证收尾](docs/reports/2026-11-06-a-intake-closeout.md) 与逐技能矩阵。以下2026-11-05数据按历史收据保留，不代表当前候选结果。

日期：2026-11-05（Asia/Shanghai）。Task：FD-RC-20261105。

**结论：IMPLEMENTATION_COMPLETE_CANDIDATE / NOT_ACCEPTED；当前禁止集成。**

RC-01～RC-05 已形成分批提交的实现候选。独立复审未再找到未关闭的、可复现的这五类新 Runtime 缺陷；这不等于整体验收通过。最终完整 CI 自然退出 1：**1784 PASS / 25 FAIL / 0 SKIP**。25 项失败完整保留，没有放宽超时、关闭测试或修改旧预期值制造 PASS。

## 1. 基线、权限与交付状态

| 项目 | 核验结果 |
| --- | --- |
| 创建分支时及收尾 API 核验的 main | `e63cdeb2a065a9f87c24039d2b08bbe059513fed` |
| 代码候选 | `b052183a1f3f73afd4dfee785d9af6e6e305aed4` |
| 分支 / 工作区 | `codex/runtime-convergence-20261105` / `D:/fd-validation/runtime-convergence-20261105` |
| 编码前合同 | `d7849cc3` 提交六份合同、用户释放声明和任务/Reservation；合同起点错误随后按独立审查更正，正式 RC 修复从 `1a5d46c3` 开始 |
| 当前写入所有者 | Root；Reservation 保持 `GRANTED`，Runtime 写入冻结；**没有自动 release/transfer** |
| 原 B 工作区 | `D:/fd`，HEAD `289db0121b73461d1a2bfd2a4d0576f06e4980f9`；释放时记录的 37 个文件 SHA256 全部未变；全部未提交成果保留 |
| PR #689 | OPEN，HEAD `44726d40033da44bb1dc10147fe5c4fd357ff980`；未修改、合并或关闭 |
| PR #690 | OPEN，HEAD `1fc8c9df352882bf7e2d1faaf1c53f48d0488d01`；仅读取历史实现，不修改、合并或关闭 |
| Promotion / credit | 未创建或合并 Promotion PR；未授予 migration / coverage credit |

本报告之后的提交只封装文档、Reservation 候选状态及独立结果。**报告交付 HEAD 与上面的代码候选 SHA 分开记账**；测试不冒称绑定到后续文档提交。

六份合同位于 `docs/contracts/runtime-convergence/01-*.md` 至 `06-*.md`，分别覆盖 Normalized Runtime、Legality、Effect Plan、Unified Consumer、Lifecycle、Suspend/Resume/Failure。每份均记录输入、输出、状态变化、拒绝与恢复。未新建第二套 Flow Engine。

## 2. 修复前后差异

| 项目 | 修复前 | 当前候选 |
| --- | --- | --- |
| RC-01 五个默认御主移动令咒 | 仅记录 directive；没有实际目的地选择和移动 | 闭合类型合同；从深山町/新都选择其他合法地点，忽略交战但保留明确移动锁、容量和来源限制；选择完成时由既有 Typed Resolution 实际移动、释放原地利；私有选择可恢复 |
| RC-02 四倍速 | 缺少暗置起源弹仍进入不可完成的窗口；B 目标错指技能区 | 生产 authoring 改为攻击区暗置起源弹；预检两个必需目标；收集完两次选择前不关闭攻击；重验来源/阶段/每个选择后按自身关闭规则处理攻击并激活起源弹 |
| RC-03 合计威力 +2 | 默认令咒给每张攻击 +2，两张变 +4 | 显式 `aggregate: total`，复用合计威力消费者；每消耗一枚令咒合计 +2，多枚可叠加；每枚个人胜利奖励 +2 VP，避免旧 forced-trigger 重复计奖；原攻击牌数值不变、按回合到期 |
| RC-04 业火费用 | 用槽位索引+1收费，立即生效、向来源收费；零支付/满地利可能阻止进入战场 | 按地图真实值 `[3,1]`；支付 1 只能取 +1；下回合生效并按期失效、来源豁免；无地利仍可入战场；空位保留 null，不重排；本地/远端 UI 读取服务端公开槽位 |
| RC-05 客户端/服务端合法性 | 固定费用不足或缺少必需目标仍展示；派发再失败 | 共享 `activationContractFailure`；投影和提交读取最新权威状态；固定费用、必需首目标和指定多步合同使用同一预检；保留已有兼容错误码并给明确原因；服务端重新验证 |

独立审核发现并已修复：弃牌/移出游戏的源仍可执行，以及四倍速挂起后源被暗置仍可续选。来源可用性统一用于发动、挂起选择和恢复验证。

五个默认御主：肯尼斯、慎二、切嗣、舞弥、爱丽丝菲尔。当前 B 的卧藤/奥尔加移动令咒也采用战场起点；不沿用旧分支里混淆的工房起点。慎二更换御主能力按用户范围排除，没有把它算作已验证。

## 3. 文件与函数修改清单

下表列本轮修复主体；B 前提迁移也属于本分支差异，不能隐藏为 main 既有成果。

| 文件 | 主要函数 / 变更 |
| --- | --- |
| `ability/seal-runtime-contract.ts` | `normalizeSealPlan`：封闭令咒类型合同，拒绝额外权限语义 |
| `ability/square-accel-contract.ts` | `normalizeSquareAccelPlan`：两个必需步骤的类型化计划 |
| `ability/interpreter.ts` | `convergenceSourceAvailable`、`activationContractFailure`、`canActivate`、`executeEffects`、`findPendingTargetRestoreSpec`、`isCanonicalGenericPendingDecisionForRestore`、`closeOwnAttack`、`recordMovementForAbilityRuntime`、`processEvent`、`projectAbilityState`、choose-target 分支、Inferno 合同 |
| `ability/executable-card-pack.ts` | `defaultCommandSpellCard`：实际移动目标/效果，显式总威力聚合 |
| `ability/types.ts` | 公开 `AbilityPlayerView.terrainSlots`，不传私有执行上下文 |
| `ability/terrain-state.ts` | 冻结 B helper：稳定槽位、赋予/释放/恢复校验 |
| `ability/deployment-hooks.ts` / `status.ts` | 真实地利值、来源豁免、`startsAtRound` 与失效 |
| `ability/resolution-dataflow.ts` | 地利移除使用稳定槽位消费者 |
| `core/movement.ts` / `core/terrain-advantage.ts` | 纯移动结果释放原槽；合计/地利读取保持索引身份和防御式纯查询 |
| `match-session.ts` | `legalDeploymentActions`、`dispatchDeployPlayer`、`assignTerrainOnDeployment`、恢复准入；枚举服务端许可的支付选项 |
| 客户端 `MatchTable.tsx`、三个 fixture/loader 文件 | 本地/远端按权威地利空位绘制；无地利玩家不占虚假槽位 |
| `data/authoring/masters/master.kiritsugu.json` 与生成文件 | 四倍速暗置弹真实区域及确定性重新生成 |
| `packages/rules/tests/acceptance/runtime-convergence/` | 新增 66 项限定回归，保留红/绿原始日志；旧客户端测试仅追加公开槽位案例 |

相对 main 的完整文件清单：[changed-files.json](D:/fd-validation/runtime-convergence-evidence-20261105/changed-files.json)。
命名函数/方法差异 **193 项 / 27 个 TS/TSX 文件**，含前提迁移：[function-changes.json](D:/fd-validation/runtime-convergence-evidence-20261105/function-changes.json)。匿名回调计入所属命名函数哈希；类型、顶层注册及完整差异以 Git diff 为准。

## 4. 历史迁移与来源

- **B 已测试集成源**：`b39a3c06fba757cecac2d6552789ad3291dea18f`。从最新 main 选择性迁入 36 个生产/内容/客户端前提文件，逐文件源 SHA 与哈希见 `prerequisite-migration.json`。没有将 B 的旧测试预期整批覆盖进来。这部分前提与 main 旧测试的冲突，是本候选必须关闭的集成回归，**不是已证明 main 原本失败**。
- **PR #690**：参考冻结候选的严格移动约束、总威力和恢复边界，按新 B 字段改写为当前 Typed 路径。没有 merge/cherry-pick 整个历史 Runtime 文件，没有移入旧 `vpPayment` 协议。
- **B 冻结未提交地利 helper**：只迁入 `terrain-state.ts`，其确切 SHA256 见 `terrain-migration.json`。未整文件复制新 B Interpreter/Session，未接入 Medusa 或其他计划机制。
- **幸运 A3 来源**：B 的 `FD-A3-LUCK-DEFEAT-SEMANTICS.md` 和 `FD-DECISION-CARDS.md` 记录 2026-11-02 用户裁定，后随 `b6e327f3` 提交。副本在证据目录 `rule-provenance/`。它们支持免疫被赋予【败北】、不免疫正常战败；原聊天不在本轮独立核验材料中。文档保留“未提交”历史标题，不能据该旧标题否认其后提交，也不能据文档宣称 main 门禁已通过。未要求用户重作该裁定。

## 5. 验证结果与证据

以下最终结果绑定代码 `b052183a1f3f73afd4dfee785d9af6e6e305aed4`。完整执行日志、自然退出码、结果哈希见 [final-run-binding.json](D:/fd-validation/runtime-convergence-evidence-20261105/final-run-binding.json)；独立审核核对 **17/17** 所列文件长度及 SHA256。

| 验证 | 实际结果 | 限制 |
| --- | --- | --- |
| RC 定向真实 MatchSession | **66 PASS / 0 FAIL** | 受控起始状态，生产定义；包含正/反/边界、资源、目标、组合、状态变化、重复、挂起/恢复和投影 |
| 客户端全部测试 | **66 PASS / 0 FAIL** | 不代替浏览器 |
| 服务端全部测试 | **24 PASS / 0 FAIL** | 不代替公网隧道 |
| 浏览器 6 项 | **6 PASS / 0 FAIL / 0 SKIP** | 七人完整对局、行动切片、公开威力、鲜进程恢复、真实替换/抽得起源弹、付费业火恢复 |
| 真实 HTTP + 8 WebSocket | **三局均到第 11 回合** | 技能策略 seed20260907：719 操作/24 能力；令咒策略 seed20260904：713 操作/23 能力，实际执行四倍速；普通策略 seed20261105：531 操作；三局投影拒绝/已查隐私/状态违规均 0 |
| 业火浏览器专项 | **支付1、VP8→7、+1槽、stale拒绝、鲜进程与重载保持** | 明示受控七人起始状态，真实生产卡打出/发动及 HTTP/WS；不冒称自然完整对局覆盖了业火所有组合 |
| 客户端 `tsc && vite build` | **通过** | 构建包大小警告保留，不放宽限制消除警告 |
| 生成内容确定性 | **通过，自然退出0** | 三个产物哈希见 `generated-bound.log`；未手工编辑生成库 |
| **最终完整 `npm run test:ci`** | **1784 PASS / 25 FAIL / 0 SKIP，自然退出1，722.87s** | **TEST_FAILURE，仍阻塞接受；不是 timeout 或环境失败** |

历史运行也保留：第一次完整 CI 因确认的新缺陷而明确中止，不记 PASS；第二次 `e285f0c9` 自然 1776 PASS/32 FAIL。最终关闭其中 7 项本轮兼容回归，无新增失败。外置旧断言对照 b39：93 PASS/12 FAIL，其中只有 11 项与 CI02 失败重合；另一项 `STACK_TRACE_ERROR` 不用于语义结论。

红测试证据见 `seals-red.json`、`terrain-red.json`、`legality-red.json`、`source-guard-red.json`、`square-source-face-down-red.json`。四倍速初期 fixture 缺少实际弹实例/playedRound 的失败已明确标注为 fixture 错误；修正 fixture 后以未改预期的同一案例对历史 b39 复现，见 `square-historical-corrected-red.json`，不冒称初期 fixture 失败是产品缺陷。

独立探针最早的旧对象引用观察已作废，保留 `independent-source-zone-observation-correction.md`；最终探针每次从当前 Session 重新取源，实际验证拒绝，未沿用错误观察。

证据局限：没有单独保存每条最终命令启动前的 git-status 文件。绑定依据是创建 b052 后紧接 CI03 的工具事务、随后启动的浏览器/联机、期间没有生产/测试写入、反复观察的 clean HEAD，以及结束时的 Git tree 检查；该局限已写入绑定记录，没有补造启动收据。

## 6. 未解决项、责任人与最短处理路径

**25 项来自本分支 B 前提迁入/合同收敛与 main 验证的冲突，仍是真实门禁失败。不得一律标为“旧测试可忽略”。**

| 分类 | 数量 | 下一项工作 / Owner |
| --- | ---: | --- |
| bare Luck / Preparation fixture 缺少生产规则声明 | 9 | RC-CI-01：Root；在真实生产字段来源基础上修 fixture，保持正/反断言及字段驱动反证；B/DeepSeek 提供字段依据；禁止恢复卡 ID 硬编码 |
| Kayneth 冻结指纹、事件18/23、能力名单 | 4 | RC-CI-02：Root 总控 + B/DeepSeek 来源核对；必须补确切材料准入和版本证据，不能只更新 hash/count |
| A3、总威力口径、旧 directive 断言 | 6 | RC-CI-03：Root；逐条对照既有裁定与 Typed 消费者，独立验收后同步测试合同；不回退实际规则效果来迎合旧断言 |
| 新 RC 起点/后续步骤/真实锁/合法操作与旧 fixture | 4 | RC-CI-04：Root；保留反例并补合法场景。疾行 trace 已证明真实公开怨灵结界锁定出入；四倍速缺弹、业火侦察起点不得强行放行 |
| B 新真实响应窗口与旧自动驾驶 | 1 | RC-CI-05：Root；按实际响应窗口完成结算，不删除响应或绕过战算屏障 |
| 稳定地利 null 空位与旧紧凑数组 | 1 | RC-CI-06：Root；审查持久化/consumer 合同，保留槽位身份，不靠清空位置通过旧数组断言 |

这六项均以 `b052183a1f3f73afd4dfee785d9af6e6e305aed4` 为调查基线；文件范围为独立 triage 中列明的 15 个失败测试文件及各自来源资料。**不是新发出的 Runtime 写授权**；任何必要生产修复仍须本任务精确 Reservation 或后续授权，B 不因此取得共享文件写权限。

逐项失败名称、文件、分类、依据和对照是否复现见 [ci-03-independent-triage.json](D:/fd-validation/runtime-convergence-evidence-20261105/ci-03-independent-triage.json)。本轮没有修改这些旧测试的预期值；涉及旧冻结材料或规则冲突的更新必须成为可审查的基线同步，不能静默制造绿色结果。

下一次完整 CI 只在上述每项已有来源核对、正确修复/测试合同处理与独立接受、候选重新冻结后启动一次；不对当前相同失败候选无目的重跑。

## 7. 剩余风险与接受范围

- 全部 25 项完整 CI 断言未关闭，因此 Gate A/B/C 的局部检查不能合成整体 PASS；**不得标记 ACCEPTED 或集成 main**。
- 当前七人生产实体攻击的关闭路径已测；尚无已准入的临时攻击生产载体，未证明临时攻击消解/所有未来牌型的全域行为。不能用此批次宣称整个 Full Roster 生命周期已完成。
- 先前七人技能审计中其他能力问题（例如 Caster 幸运别名、Alter 限制、Tomoe 条件、Eresh 保护、Maiya 其他费用语义）未因本轮自动关闭；本任务只承诺 RC 五类限定证据，不授予全技能或完整游戏接受结论。
- 三种自然策略不是对所有技能组合的穷尽证明。业火专项为明示受控起点；公网 Sakura Frp 链路本轮未配置/未验收。
- 旧地利快照仅能保留已保存索引，不能补造丢失的历史身份；不明快照应拒绝/人工核查，恢复使用最后一致的已验证检查点，不自动替换目标。
- 工作区和 Reservation 保留，Runtime 冻结；当前只交付审查，不自动合并、释放写权限或创建新的共享 Runtime 任务。

## 8. Git 提交与独立验收入口

| 提交 | 内容 |
| --- | --- |
| `d7849cc3` | 六份合同、用户释放记录、Root 任务/Reservation |
| `63c58905` | B 前提选择性迁移及逐文件账本，纠正移动起点合同 |
| `1a5d46c3` | RC-01/03：Typed 移动、合计威力、个人奖励 |
| `d9078bdb` | RC-02：四倍速字段、完整目标预检、原子挂起恢复 |
| `094bd533` | RC-04：真实地利费用、稳定空位和生命周期 |
| `c757e751` | RC-05：共享当前状态合法性与明确拒绝 |
| `e285f0c9` | 独立来源权限修复与权威客户端地利投影 |
| `b052183a` | 挂起暗置来源、兼容拒绝码、防御式地利查询和奖励精确断言；**最终代码候选** |

独立结论：[final-independent-review.md](D:/fd-validation/runtime-convergence-evidence-20261105/final-independent-review.md)、[机器记录](D:/fd-validation/runtime-convergence-evidence-20261105/final-independent-review.json)。仓库内原样副本在 `docs/contracts/runtime-convergence/independent/`。

Reviewer 可直接从候选与 main 的 diff、六份合同、36 文件前提账本、冻结地利哈希、193 函数清单、原始红/绿结果、最终绑定和 25 失败明细复核。独立结论为 **IMPLEMENTATION_REVIEWED / NOT_ACCEPTED；integration NO**。本轮到此停止。
