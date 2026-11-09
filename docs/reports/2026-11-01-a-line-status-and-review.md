# A 线成果与审查入口（2026-11-01）

核验 main：e63cdeb2a065a9f87c24039d2b08bbe059513fed。PR682—688均已合并，main Test41218741570／Build41218741549／Policy41218741685／Deploy41218741676成功。此处引用历史验收，不声称本次重跑全部历史测试；历史报告的“候选／待门禁”段落须结合后续合并与最终收据解读。

| 成果 | 集成与审查入口 | 已验证边界 |
|---|---|---|
| DR-P01行动回合、少量手牌卡死和公开合计威力修复 | PR682，48eef963；行动回归、MatchTable.test、server protocol tests | 普通移动后常规出牌，合法操作、费用不足、拒绝原子性和投影；不是全部能力窗口验收 |
| 七人标准终局 | PR683，67bd7416；standard-endgame.test、fd-standard-endgame.spec、A-END-01-review-attestation | VP淘汰8/9/10轮、同分、11轮破平／溢出、结果恢复和终局拒绝 |
| 连续阶段／回合推进 | PR684，dec47680；round-transition.test、fd-round-transition.spec、A-ROUND-02-review-attestation | 顺位轮转、跳过淘汰、清理／计数／待处理窗口，恢复时不重复推进 |
| 全对局CI性能修复 | PR685，bbe1ef91；A-ROUND-02-CI-01-review-attestation、保留原始失败日志 | 通过差分验证缩短重复查询／哈希成本；保留原时限和全部门禁，不把定向PASS当完整CI |
| 真实七人完整对局 | PR686，b27b9801；full-seven-player-match.test、server同名测试、fd-full-seven-player-match.spec | 默认生产内容、两种种子、补牌／弃牌回收／移动／战斗／结算；七页浏览器523次UI操作完成11轮，p5获胜、零错误 |
| 准入资产与技能图 | PR687，462bb827；fd-asset-registry.test、fd-approved-assets.spec、A-ASSET-01-review-attestation | 精确7御主+7从者准入，14御主技能图修复，78资源URL真实图片；client门禁加入CI |
| 自动重连与进程恢复 | PR688，e63cdeb2；room-store.test、room-persistence-serialization.test、fd-server-recovery.spec、A-RECOVER-04-review-attestation | 七页浏览器无需刷新自动恢复；另有真实HTTP/WS七人536次操作至11轮，4/9/11轮强杀生产进程再恢复，p4获胜、零协议错误 |

各层须分别核验：规则合同→实现调用链→生产内容准入→用例→真实浏览器／服务端→独立结论→精确HEAD CI→main合并结果。核心调用链为浏览器命令→HTTP/WS→MatchRoomHub／MatchRoom→MatchSession→现有规则引擎→按玩家裁剪投影。重复／过期revision、错误凭证、手牌隐私、存档篡改与存储故障应检查负例，而非只看成功截图。

最近恢复任务最终HEAD8dfa71ec的CI：202规则文件1742PASS/1项原有SKIP，客户端9文件60PASS，服务端3文件24PASS。独立最终TECHNICAL_ACCEPTANCE_PASS；完整原始证据在 D:/fd-validation/a-recover-04-evidence-20261031/final-ci-receipt.json、independent-final-8dfa71ec.json、full-durable-match-result.json。更早真实全浏览器对局证据在 a-match-03-evidence-20261031 的 whole-match-result/transcript 与独立收据。注意恢复任务完整11轮是HTTP/WS路径，不能冒充全程浏览器运行。

未覆盖：全943+1能力、所有主动／可选技能组合、3—6人／NPC／3X等全部模式、分布式高可用、全部网络与发行条件。部分完整对局使用确定性放弃可选能力策略。尚不能把上述成果写成“完整游戏所有内容已验收”。

当前新增 A-CLOUD-05：无需自购云服务器的房主托管试玩入口，统一网页/API/WS与不含私人凭证的邀请；SakuraFrp实际账号／节点验收单列。GitHubPages的Deploy成功只意味着静态网页部署，不意味着权威服务器公网可达。B线与全角色能力仍独立准入；没有新增迁移credit。
