# FD 项目快速参考卡

## 🎯 项目概览（30秒速读）

| 项目 | 值 |
|------|-----|
| **名称** | Fate/Domination (FD) Content Pipeline |
| **当前版本** | 1.0.0 (核心完成) |
| **完成度** | ✅ 85% (核心功能完成，需补充测试和工具) |
| **最后更新** | 2026-04-13 |
| **关键成果** | 6个执行步骤完成，15+ CHM约束集成 |

---

## 📁 核心文件速查表

### 规则文档
```
docs/rules/FD-Game-Rules-Final.md         ← 最终权威全游戏规则（唯一入口）
```

### 内容库系统
```
packages/content/src/
├── chm-card-types.ts                    ← 卡牌类型定义 + CHM_CONSTRAINTS常量
├── index.ts                              ← ContentLibraryManager类
└── guardrail-integration.ts              ← Guardrail集成管理器
```

### 样本数据
```
data/manifests/chm-base-samples-v1.json   ← 8张代表性样本卡牌
```

### 验证脚本
```
scripts/verify-pipeline-e2e.ts            ← E2E验证脚本（可直接运行）
scripts/run-chm-smoke-chain.ts            ← Smoke Chain测试
```

---

## 🚀 快速命令

### 运行 E2E 验证（验证整个 Pipeline）
```bash
cd d:\fd
npx ts-node scripts/verify-pipeline-e2e.ts
```

### 查看规则文档
```bash
# 查看规则目录
ls -la docs/rules/

# 查看最终规则大纲
grep "^## " docs/rules/FD-Game-Rules-Final.md
```

### 查看样本卡牌
```bash
# 查看卡牌清单内容
jq '.items' data/manifests/chm-base-samples-v1.json

# 统计卡牌数量
jq '.items | length' data/manifests/chm-base-samples-v1.json
```

---

## 📊 关键数字一览

### CHM 基础约束
| 约束 | 值 |
|------|-----|
| 玩家数量 | 3-7 名玩家；少于 3 人时添加 1 名 NPC |
| 总回合数 | 11 回合 |
| Master 初始魔力 | 4 |
| Master 令咒数 | 3 枚 |
| Servant 攻击牌 | 12 张 |
| Servant 技能牌 | 3 张 |
| 工房容量 | 通常 4 人 |
| 侦查容量 | 1人 |
| 深山町战果 | 2 VP |
| 新都战果 | 3 VP |
| 侦查战果 | 2 VP |
| 常规移动 | 沿箭头方向从当前地点移动；每回合至多一次；一次性决定终点 |
| 常规出牌 | 通常 2 张；不足时全部打出；无合法牌才可空过 |
| 高潮回合 | 9-11 |

### 项目统计
| 统计 | 数值 |
|------|------|
| 规则文档章节数 | 16 |
| 卡牌类型 | 8 种 |
| 样本卡牌 | 8 张 |
| 约束常量 | 15+ |
| 类型守卫函数 | 8 个 |
| 测试脚本 | 2 个 |

---

## 🏗️ 系统架构

```
                    ┌─────────────┐
                    │  CHM提取    │
                    │  30+张卡牌  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ Vision Agent│ ← OCR识别
                    │ SiliconFlow │
                    └──────┬──────┘
                           │
              data/staged/ocr/{namespace}/
                           │
                    ┌──────▼────────┐
                    │Structuring    │ ← 结构化
                    │   Agent       │
                    └──────┬────────┘
                           │
          data/staged/structured/{namespace}/
                           │
                    ┌──────▼──────┐
                    │ Guardrail   │ ← 验证CHM规则
                    │   Agent     │
                    └──────┬──────┘
                           │
           data/staged/guardrail/{namespace}/
                           │
                    ┌──────▼──────────────┐
                    │ Content Library    │
                    │ - CardMetadata     │
                    │ - CHM_CONSTRAINTS  │
                    │ - Type Guards      │
                    └──────┬──────────────┘
                           │
                    packages/content/
                    ├── chm-card-types.ts
                    ├── index.ts
                    └── guardrail-integration.ts
                           │
                    ┌──────▼──────┐
                    │Game Engine  │
                    │   (Rules)   │
                    └─────────────┘
```

---

## 📋 卡牌类型速查

### Master (御主)
- **Master Identity** (主身份卡)
  - 初始魔力: 4
  - 令咒数: 3
  - 被动能力

- **Master Skill** (技能卡)
  - 5种触发时机: preparation / sentinel / action / battle / end_of_turn

### Servant (从者)
- **Servant Overview** (概览卡)
  - 职阶标签
  - 12张攻击牌
  - 3张技能牌

- **Servant Attack** (攻击卡)
  - 魔力消耗 (J值)
  - 基础威力 (K值)
  - 5种属性: strength / agility / magic / special / noble_phantasm

- **Servant Skill** (技能卡)
  - 最低魔力需求: 8+
  - 能力文本

### Situation (局势牌)
- **Regular** (常规局势, 回合1-8)
  - 为所有玩家提供魔力
  
- **Climax** (高潮局势, 回合9-11)
  - 特殊名称: 命运之夜 / 身处地狱之门 / 天之杯

### Event (事件牌)
- **Deep Mountain** (深山町)
  - 战果: 2 VP
  - 显示: 明置

- **New Capital** (新都)
  - 战果: 3 VP
  - 显示: 暗置

### Command Spell (令咒)
- 4种用途:
  1. 在深山町/新都移动
  2. 获得4点魔力
  3. 战力+2 / 获胜时额外+2VP
  4. (预留)

---

## ✅ 项目检查清单

### 已完成 ✅
- [x] 最终规则文档 1.1.0（含基础规则、FAQ、3X 与关键词）
- [x] 8种卡牌类型定义
- [x] 8张代表性样本卡牌
- [x] ContentLibraryManager 类
- [x] GuardrailIntegrationManager 类
- [x] 15+ CHM约束集成
- [x] 8个类型守卫函数
- [x] E2E验证脚本
- [x] README和使用示例

### 需要补充 ⚠️
- [ ] 单元测试套件 (0% 覆盖率)
- [ ] package.json 配置
- [ ] 文件持久化 (save/load)
- [ ] API 文档生成
- [ ] CLI 工具
- [ ] 性能基准测试
- [ ] 错误恢复机制

---

## 💡 关键概念

### CHM_CONSTRAINTS 常量
集成了所有CHM基础规则中的数字约束，用于自动验证导入的卡牌：

```typescript
export const CHM_CONSTRAINTS = {
  master: { initialMana: 4, commandSpells: 3 },
  servant: { attackCardsCount: 12, skillCardsCount: 3 },
  situation: { climaxRounds: [9, 10, 11] },
  event: { deepMountainReward: 2, newCapitalReward: 3 },
  // ... 更多约束
};
```

### 类型守卫函数
运行时类型检查，用于确保卡牌类型正确：

```typescript
isMasterIdentityCard()      // 检查Master身份卡
isMasterSkillCard()         // 检查Master技能卡
isServantOverviewCard()     // 检查从者概览卡
isServantAttackCard()       // 检查从者攻击卡
isServantSkillCard()        // 检查从者技能卡
isSituationCard()           // 检查局势卡
isEventCard()               // 检查事件卡
isCommandSpellCard()        // 检查令咒卡
```

### Pipeline 流程
1. **Vision** (OCR) → 识别卡牌图像
2. **Structure** (结构化) → 转换为JSON
3. **Guardrail** (验证) → 检查CHM规则
4. **Content Library** (导入) → 添加到内容库
5. **Game Engine** (使用) → 生成游戏对象

---

## 📞 常见问题

### Q1: 我想快速验证项目工作状态
**A**: 运行 `npx ts-node scripts/verify-pipeline-e2e.ts`，应该看到所有5个阶段都成功。

### Q2: 我想查看CHM规则详情
**A**: 打开 `docs/rules/FD-Game-Rules-Final.md`，这是本地项目唯一权威规则入口。

### Q3: 我想在代码中使用卡牌类型
**A**: 导入 `packages/content/src/chm-card-types.ts`，使用 `ContentLibraryManager` 或 `GuardrailIntegrationManager`。

### Q4: 项目缺少什么？
**A**: 主要缺少单元测试、文件持久化和CLI工具。详见 `PROJECT_STATUS_AND_REFINEMENT.md`。

### Q5: 下一步应该做什么？
**A**: 
1. 优先级1: 添加单元测试 + package.json + 持久化
2. 优先级2: 版本控制 + 性能优化
3. 优先级3: CLI工具 + 管理面板

---

## 🎓 学习资源

### 理解项目
1. 阅读 `docs/rules/FD-Game-Rules-Final.md`（最终规则）
2. 查看 `packages/content/README.md` (系统设计)
3. 运行 `scripts/verify-pipeline-e2e.ts` (实际演示)

### 修改项目
1. 编辑 `packages/content/src/chm-card-types.ts` (修改卡牌类型)
2. 编辑 `packages/content/src/index.ts` (修改导入逻辑)
3. 添加测试到 `packages/content/src/__tests__/` (测试覆盖)

### 扩展项目
1. 添加新的卡牌类型 (编辑 chm-card-types.ts)
2. 添加新的验证规则 (编辑 guardrail-integration.ts)
3. 创建CLI工具 (新建 cli/ 目录)

---

## 📊 项目信息卡

```
┌────────────────────────────────────────┐
│     FD Content Pipeline Project        │
├────────────────────────────────────────┤
│ 版本: 1.0.0 (核心功能完成)             │
│ 完成度: 85% (需补充测试和工具)        │
│ 规则完整性: 100% (最终规则 1.1.0)     │
│ 类型覆盖率: 100% (8种类型)             │
│ 单元测试覆盖: 0% (需补充)              │
├────────────────────────────────────────┤
│ 核心文件: 4个                          │
│ 测试脚本: 2个                          │
│ 样本卡牌: 8张                          │
│ 约束常量: 15+                          │
├────────────────────────────────────────┤
│ 最后更新: 2026-04-13                  │
│ 下一里程碑: 1.0.0-stable               │
│ 需要单元测试: ✅ 是                    │
└────────────────────────────────────────┘
```

---

## 🔗 快速导航

| 需求 | 文件 |
|------|------|
| 查看规则 | `docs/rules/FD-Game-Rules-Final.md` |
| 查看类型 | `packages/content/src/chm-card-types.ts` |
| 查看样本卡牌 | `data/manifests/chm-base-samples-v1.json` |
| 查看管理器 | `packages/content/src/index.ts` |
| 查看集成 | `packages/content/src/guardrail-integration.ts` |
| 运行验证 | `npx ts-node scripts/verify-pipeline-e2e.ts` |
| 查看使用示例 | `packages/content/README.md` |
| 查看完善清单 | `PROJECT_STATUS_AND_REFINEMENT.md` |

---

**生成时间**: 2026-04-13  
**用途**: 快速参考和导航  
**最后更新**: 当前
