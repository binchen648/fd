# A-ACCEPT-06-REPAIR：七对主从机制修复

首个功能代码候选：`82ac9a0deeee7fa6d15a21a989f0d16ff44b9c4d`。当前性能修复候选：`d6fabffa9aa6e1ea70a7275610316043a09f03de`。技术 main：`e63cdeb2a065a9f87c24039d2b08bbe059513fed`。独立工作区：`D:/fd-validation/a-accept-06-repair-20261101`。

本任务修复原验收定位的 11 类共享机制错误，保留原冻结失败证据。原验收报告不是被改写为 PASS；本报告绑定新的代码和执行收据。实现者只声明 IMPLEMENTATION_COMPLETE_CANDIDATE，合并仍需用户批准。

| 原问题 | 实现结果及反例边界 |
|---|---|
| F01 黑呆低魔力禁宝具 | 实时读取合法的活动来源、当前魔力与同战场；mana7拒绝，mana8/异地/失活不滥禁；未接受合同字段拒绝扩权。 |
| F02 艾蕾佑护位置 | attack_area/field 均按真实版图处理；固定放置地点，同地总威力+6；缺席时执行严格连续场地放置合同，不伪造出牌事件。 |
| F03 肯尼斯低魔力技能 | 所属御主被动只豁免技能区通常魔力门槛，保留印刷费用、控制者与合同限制。 |
| F04 舞弥借用费用 | 必须全额支付2VP；0/1VP原子拒绝，本人使用不误收费。 |
| F05 舞弥地利 | 当回合计算(base+1)*2，轮转后清理，非永久倍率。 |
| F06 业火 | 固定地点、次回合生效、来源豁免；支付0–5VP精确分配可负担槽位，保留空洞；不限制无限容量战场入场。服务端投影驱动客户端真实格位。 |
| F07 Caster幸运 | 生产basic.luck与历史card.luck按规范身份归一；公式5/10/15封顶，保留旧pack兼容。 |
| F08 巴御前顺位 | 使用startingSeat相对顺时针顺位，实际出牌准入和发动条件一致。 |
| F09 费用可用性 | 合法操作过滤不能承担的固定魔力费用；真实执行仍保留校验。 |
| F10 令咒威力与奖励 | 玩家总威力只+2一次；按正式御主合同区别每回合/每战斗奖励，持久化、重复结算与回合过期有用例。 |
| F11 令咒移动 | 从允许起点进入真实目标选择，检查容量/关闭/持续移动限制；激活只消耗一次令咒，恢复及重复选择不重复扣除。 |

完整CI的第一次修复候选运行(aab32073)自然退出1：1849PASS/6FAIL。原始日志保留。六项依次为静态查询性能、历史肯尼斯档案哈希、资产警告环境假设、移动令咒起点夹具、自然局超时、结算后可选响应驱动。已分别处理：保留原性能预算与30秒超时；哈希仅反向规范一处已授权selector后校验原档案；资产警告用独立缺资产夹具；正确起点；减少不相关来源active查询；通过真实Session完成已投影可选响应并确认不重复结算。没有新增排除或跳过测试。

## 第一阶段冻结候选82ac9a0d的历史验证结果

全部绑定代码候选82ac9a0d。完整CI开始/结束HEAD一致，工作树均clean。

| 检查 | 结果 |
|---|---|
| 原始完整npm run test:ci | 自然exit0；1855PASS/0FAIL/0SKIP；2026-11-01 14:29:22–14:38:52 UTC |
| 本轮七对主从验收5文件 | 112PASS，含1结构盘点；原22行失败见证全部转为有界通过 |
| 七人主动策略自然局 | 无状态注入；679操作、19主动能力ID、1恢复，第11轮match_complete，p6胜；不是能力条款完整覆盖 |
| 完整客户端 / 服务端 | 63PASS / 24PASS；服务端含未修改默认七人真实HTTP/WS完整对局 |
| TypeScript / 内容验证 / 客户端构建 | 均exit0 |
| 实际来源资产检查 | test:source-assets自然exit0，7御主/7从者/20事件，0blocking |
| 生成产物一致性 | 同候选干净git archive三产物byte一致；原有本地图片的工作区报告因94处来源存在性警告不同而退出1，原日志保留；未改写脚本/报告刷绿 |
| 最终冻结代码浏览器 | 2PASS：支付1/3VP后精确+1/+3格位，真实HTTP/WS、stale拒绝、SIGKILL后不同服务进程重启、重连/刷新一致 |
| 历史authoring修订回归 | 2文件23PASS；未删除/跳过历史测试 |

浏览器采用可信服务端准备的有界次回合业火状态；不是无注入全局或所有能力七浏览器验收。

证据目录：D:/fd-validation/a-accept-06-repair-evidence-20261101。full-ci-82ac9a0d-receipt.json记录自然退出、SHA与clean状态；final-supplemental-rest-receipt.json记录最终客户端/服务端/构建/浏览器/authoring；generated-no-local-assets-receipt.json记录隔离源码生成校验；repair-witness-matrix.json保留109行的原状态、逐测试修复及剩余未证实条件。


独立复核：R1/R2/R3有界审查、最终源码组合审查、最终收据独立补充核验全部保留。最终补充结论为 IMPLEMENTATION_ACCEPTED_CANDIDATE，无新技术阻断；12项producer哈希匹配。审查者不编辑生产代码，既未将分阶段PASS相加称为全能力验收，也未授予人类合并许可。94个差异路径对应93条素材警告（issues集合和93个entity issueCodes），不是94条警告。

边界：109是当前筛选能力身份，非943+1全角色分母；修复失败见证不等于22行全部条款通过。原75行部分证据、11行缺执行/仅结构、1行慎二排除/圈外分支仍需继续验收。艾蕾同战场部署过滤与行动阶段自免等未覆盖条款不在本修复完整PASS之列。自然七人Session整局与有界真实HTTP/WS浏览器不是所有能力组合或七浏览器主动对局证书。慎二更换御主不驱动；历史测试保留。公网Sakura/TLS链路未配置，NOT_RUN。迁移/覆盖credit增量0。

共享写权限：Root的A-ACCEPT-06-REPAIR仍GRANTED，候选冻结是证据状态，并非release；CB-C02仍SUSPENDED。未修改PR689生产文件，PR689保持OPEN，未经批准不合并。

## 交付与后续集成

修复分支已推送origin/codex/a-accept-06-repair-20261101。本次不合并，不改动PR689。已创建唯一Promotion PR #690（https://github.com/binchen648/fd/pull/690）；远端PR Test/Build/Policy尚待最终HEAD运行，不据本地结果声称远端通过；代码门禁绑定82ac9a0d，后续提交只包含报告和权限状态记账。后续须绑定精确最终HEAD及独立证据，通过现有远端门禁并获得用户合并批准；main变化时重新核对差异。

独立审查的GitHub条目为协调者发布的COMMENT，仅记录Agent审查与证据，不表示用户已批准合并；远端最终门禁以PR690 checks为准。代码候选之后的review/synchronization/head提交仅为文档及权限记账，生产/测试源码一致性另有逐路径差异收据。

## R4：远端完整对局超时的实际恢复

远端5904a991的原始Test工作流41373251629自然退出1：1852PASS/2FAIL/1既有SKIP。两失败分别为原始完整对局10秒、主动七人对局30秒超时；归为TEST_FAILURE，不推定环境故障或TIMEOUT_INCONCLUSIVE。Build/Policy通过不消除此阻塞。原日志github-5904a991-failed.log保留。

CPU剖析定位face-up cap查询对每张实体牌先执行线性来源查找（perf-before保留）；新候选d6fabffa改为区域、严格合同、控制者/位置候选优先，再调用同一canonical活动来源谓词。不引入缓存、不改变规则、超时、选择条件或测试并发。新增读预算测试先红后绿，既有FB2-44/36与相关Session/自然局81PASS；与CI一致Node20.20.2两项原整局定向自然通过约7.07秒/19.11秒；最终d6fabffa真实HTTP/WS浏览器2PASS，HEAD前后相同clean。计时有波动，尚不据此推断远端超时已解决；新完整CI必须以实际远端退出结果为准。

新证据：r4-producer-receipt.json、perf-scan-green.json、perf-node20/tests.json、browser-r4-receipt.json；旧收据及旧独立结果不被修改或转写为新候选PASS。

R4独立结论为SOURCE_ACCEPTED_CANDIDATE_PENDING_NEW_FULL_CI，证据independent-r4.json/md。GitHub发布记录为协调者COMMENT，不能解释为人类合并批准。
