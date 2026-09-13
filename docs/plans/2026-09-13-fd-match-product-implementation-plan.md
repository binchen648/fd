# FD Match Product Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 FD 七人对局实现为可完成 11 回合的桌面产品，支持本地七席人工、确定性 AI、七客户端同步、完整交互窗口、隐藏信息、保存和回放。

**Architecture:** `MatchSession` 是阶段、合法操作、区域、战斗和暂停状态的唯一权威；客户端只消费按玩家生成的投影并提交带 revision 的 command。前端拆成棋盘、决策栏和焦点式操作台，所有特殊卡牌交互复用支付、目标、响应、模式和 directive 窗口。

**Tech Stack:** TypeScript、React、Vitest、现有 rules/client packages、现有实时房间服务、Playwright（关键点击流）。

---

### Task 1: 固化阶段与客户端投影契约

**Files:**
- Modify: `packages/rules/src/match-session.ts`
- Modify: `apps/client/src/state/playtest-fixture-loader.ts`
- Test: `packages/rules/src/__tests__/match-session-regressions.test.ts`
- Test: `apps/client/src/pages/MatchTable.test.tsx`

**Steps:**

1. 写失败测试，断言 phase 使用稳定 ID，准备阶段发生在事件放置/抽牌之后且普通部署 action 不存在。
2. 运行上述两个定向测试，确认失败原因来自字符串阶段或错误 action 投影。
3. 增加 `phaseId`、`stepId`、`priorityPlayerId`、`waitingPlayerIds` 的稳定投影。
4. 让前端阶段标签直接映射枚举，不再用 `includes('准备')` 判断。
5. 运行定向 rules/client 测试并提交：`feat: stabilize match phase projection`。

### Task 2: 完成七席本地轮转和自动推进边界

**Files:**
- Modify: `packages/rules/src/match-session.ts`
- Modify: `apps/client/src/pages/MatchTable.tsx`
- Test: `packages/rules/src/__tests__/match-session-regressions.test.ts`
- Test: `apps/client/src/pages/MatchTable.test.tsx`

**Steps:**

1. 写失败测试：席位完成准备/前哨/行动后切换到下一个未完成席位，所有席位完成前不得推进阶段。
2. 写本地七席模式测试：视角跟随 priority player，联网模式不能越权切换。
3. 在 MatchSession 记录每阶段席位完成集合并输出下一个 decision。
4. 前端在 revision 更新后跟随权威 priority，清理上一席位的临时 UI 选择。
5. 运行 1 回合七席定向测试并提交：`feat: complete seven-seat phase rotation`。

### Task 3: 统一普通移动、令咒移动和卡牌移动

**Files:**
- Modify: `packages/rules/src/match-session.ts`
- Modify: `packages/rules/src/ability/interpreter.ts`
- Modify: `packages/rules/src/core/movement.ts`
- Modify: `packages/rules/src/core/map-engine.ts`
- Test: `packages/rules/src/__tests__/match-session-regressions.test.ts`

**Steps:**

1. 分别写普通移动、令咒自由移动、急行沿箭头移动的正反例测试。
2. 增加统一 movement legality 服务，输入来源、阶段、起点、终点、是否忽略交战和成本规则。
3. 增加正式 move command，执行支付、位置变化、移动事件和进入地点触发。
4. 保证后移动者只进入普通 occupants，不覆盖既有 terrain assignment。
5. 运行移动定向测试并提交：`feat: unify authoritative movement commands`。

### Task 4: 完成攻击暂存、追加和生命周期

**Files:**
- Modify: `packages/rules/src/ability/interpreter.ts`
- Modify: `packages/rules/src/match-session.ts`
- Modify: `packages/rules/src/core/combat-resolver.ts`
- Test: `packages/rules/src/__tests__/match-session-regressions.test.ts`

**Steps:**

1. 写失败测试：普通玩家超量出牌被拒绝、待确认取消不改变正式区域、确认后公开进入攻击区。
2. 写援护射击加入目标玩家攻击区、战斗阶段追加、残留跨回合和普通牌清理入弃牌的测试。
3. 将额外出牌额度建模为有来源和生命周期的 modifier。
4. 让战斗读取攻击区中的激活卡，并保留纸面 0 威力属性攻击的修正资格。
5. 运行攻击/战斗定向测试并提交：`feat: complete attack area lifecycle`。

### Task 5: 完成通用交互窗口

**Files:**
- Modify: `packages/rules/src/ability/interpreter.ts`
- Modify: `packages/rules/src/match-session.ts`
- Create: `apps/client/src/components/InteractionWindowPanel.tsx`
- Test: `apps/client/src/pages/MatchTable.test.tsx`
- Test: `packages/rules/src/__tests__/match-session-regressions.test.ts`

**Steps:**

1. 为固定额外支付、X 支付、卡牌/玩家/地点目标、min/max、多触发、放弃、模式和追加写窗口契约测试。
2. 统一投影 `controllerId`、`visibility`、`blocking`、`candidates`、`min/max` 和 command 模板。
3. 实现通用 React 窗口；只保存未提交输入，不复制候选和合法性。
4. 服务端拒绝后保持窗口并显示 reason code。
5. 运行交互窗口组件测试并提交：`feat: add generic match interaction windows`。

### Task 6: 将关键 directive 产品化

**Files:**
- Modify: `packages/rules/src/match-session.ts`
- Modify: `packages/rules/src/ability/interpreter.ts`
- Modify: `apps/client/src/components/InteractionWindowPanel.tsx`
- Create: `apps/client/src/components/DirectivePanel.tsx`
- Test: `packages/rules/src/__tests__/match-session-regressions.test.ts`
- Test: `apps/client/src/pages/MatchTable.test.tsx`

**Steps:**

1. 为起源弹替换、援护射击、Kayneth 部署/月灵髓液、Chaldeas、归寂和伪臣之书建立未处理/处理后测试。
2. 能结构化执行的 directive 转为 target/mode/replacement command。
3. 仅保留真正需要房主判断的 `host_adjudication`，未处理时暂停 session。
4. 增加“暂停并报告问题”诊断包，包括 revision、卡牌、能力、窗口和最近日志。
5. 运行 directive 定向测试并提交：`feat: productize critical directives`。

### Task 7: 拆分棋盘并修正事件与占位呈现

**Files:**
- Modify: `apps/client/src/pages/MatchTable.tsx`
- Modify: `apps/client/src/pages/MatchTable.css`
- Create: `apps/client/src/components/BoardMap.tsx`
- Create: `apps/client/src/components/LocationNode.tsx`
- Create: `apps/client/src/components/EventCardRail.tsx`
- Create: `apps/client/src/components/PositionSlotBoard.tsx`
- Test: `apps/client/src/pages/MatchTable.test.tsx`

**Steps:**

1. 写组件测试：额外事件在右侧横排、暗置事件显示背面、地利槽显示头像、普通占位不挤地利。
2. 从 `MatchTable` 提取地点和事件组件，不改变现有 dispatch。
3. 删除悬浮 PUBLIC INTEL，公开信息改由地点、攻击区和玩家详情呈现。
4. 建立固定槽位尺寸和浮层层级，验证 1440p/2560×1440 无遮挡。
5. 运行客户端定向测试并提交：`refactor: build structured battlefield board`。

### Task 8: 重做焦点式本人作战中心

**Files:**
- Modify: `apps/client/src/components/PlayerWorkbench.tsx`
- Modify: `apps/client/src/pages/MatchTable.css`
- Create: `apps/client/src/components/HandFan.tsx`
- Create: `apps/client/src/components/PrivateZoneDrawer.tsx`
- Test: `apps/client/src/pages/MatchTable.test.tsx`

**Steps:**

1. 写观察/操作两态、自动展开/收回、手牌 hover、私有区域权限和焦点恢复测试。
2. 操作态使用 `clamp(520px, 56vh, 780px)`，重排为身份资源、操作画布、技能特殊区和手牌托盘。
3. 手牌改为稳定重叠扇形；静态牌库构成移入从者详情抽屉。
4. 分离御主技能、升华技、从者技能、令咒、攻击区、牌库和弃牌区。
5. 运行组件测试并提交：`feat: rebuild focused player workbench`。

### Task 9: 完成卡牌资产和牌库结构校验

**Files:**
- Modify: `apps/client/src/state/fd-asset-registry.ts`
- Modify: `apps/client/src/components/CardSurface.tsx`
- Modify: `apps/client/src/components/ServantDeckSummary.tsx`
- Test: `apps/client/src/state/fd-asset-registry.test.ts`
- Test: `apps/client/src/components/ServantDeckSummary.test.tsx`

**Steps:**

1. 为七名御主/从者 manifest 映射和七套从者 deck composition 写精确测试。
2. 强制 cardId 映射真实图片，禁止按文件顺序或 OCR 生成牌库数据。
3. 校验基础攻击牌属性、费用、威力和真实图片一致。
4. 缺图时使用带来源标记的占位卡，禁止错图静默回退。
5. 运行资产/牌库测试并提交：`fix: enforce card asset and deck identity`。

### Task 10: 完成战斗 breakdown、日志和回放

**Files:**
- Modify: `packages/rules/src/core/combat-resolver.ts`
- Modify: `packages/rules/src/match-session.ts`
- Create: `apps/client/src/components/BattleBreakdownPanel.tsx`
- Create: `apps/client/src/components/ReplayDrawer.tsx`
- Test: `packages/rules/src/__tests__/match-session-regressions.test.ts`
- Test: `apps/client/src/pages/MatchTable.test.tsx`

**Steps:**

1. 写 breakdown 分层、胜败状态、战果变化、触发和 sourceId 的测试。
2. 让每次 command 记录支付、目标、state delta、事件、directive 和结果。
3. 增加 checkpoint 选择和只读重建至任意节点。
4. 前端允许从 breakdown/日志检视来源卡。
5. 运行战斗与回放定向测试并提交：`feat: add explainable battle replay`。

### Task 11: 完成房间、权限和断线重连

**Files:**
- Modify: `packages/rules/src/match-session.ts`
- Modify: existing room/server transport files discovered by targeted `rg`
- Modify: existing client room state files discovered by targeted `rg`
- Test: existing room/session targeted tests

**Steps:**

1. 写创建/加入/选座/房主权限、旧 revision、重复 command 和重连恢复窗口测试。
2. 为每个玩家生成独立投影，验证手牌、弃牌、牌库和暗置事件不泄露。
3. command 增加 `expectedRevision` 和幂等 ID。
4. 重连恢复 priority、pending interaction、visible zones 和最近 checkpoint。
5. 运行房间定向测试并提交：`feat: complete authoritative multiplayer sessions`。

### Task 12: 产品验收

**Files:**
- Modify: targeted smoke/e2e specs discovered under existing test directories
- Reference: `docs/plans/2026-09-13-fd-match-product-design.md`
- Reference: `docs/plans/fd-rules-conformance-and-acceptance.md`

**Steps:**

1. 跑 1 回合七席全人工点击流，保存日志和 checkpoint。
2. 跑 3 回合事件 smoke，覆盖暗置、高潮额外事件和事件牌回收。
3. 跑支付、目标、响应、directive 和操作台组件测试。
4. 跑 11 回合确定性半自动 smoke；若暂停，必须有明确可处理原因。
5. 跑多 seed、复杂技能回归和 Chromium/Firefox/WebKit 关键点击流。
6. 仅在上述通过后按需扩大验证范围，并提交：`test: verify complete fd match product flow`。

## 执行约束

- 不进行全仓静态审计、无关安全审计或大范围重构。
- 每个任务先写直接相关失败测试，再做最小实现。
- 前端不得新增卡牌 ID 特判来模拟后端规则。
- 遇到未定义规则时暂停并向产品所有者确认，不猜测卡牌语义。
- 每个切片完成后记录当前证据状态，不把 `IMPLEMENTED_UNVERIFIED` 写成已完全支持。
