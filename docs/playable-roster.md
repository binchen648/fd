# 当前可玩主从名单

浏览器正式入口使用 8 名御主和 8 名从者作为选人池，每局从中组成 7 个主从席位（玩家先选，其余由 AI 补齐）。选人池中的每个技能都来自 `legacy-content.json` 的稳定 ID，并通过 `buildStandardContent` 注册为 `FULL` 规则定义。

## 御主

- 肯尼斯 (`master.kayneth`)
- 间桐慎二 (`master.shinji`)
- 卫宫切嗣 (`master.kiritsugu`)
- 久宇舞弥 (`master.maiya`)
- 丹·布拉克莫尔 (`master.dan`)
- 远坂凛 (`master.rin`)
- 爱丽丝菲尔 (`master.irisviel`)
- 尤里鸟斯·贝尔奇斯科·哈维 (`master.julius`)

## 从者

- 阿尔托莉雅·卡斯特 (`servant.artoriac`)
- 弗朗西斯·德雷克 (`servant.drake`)
- 阿喀琉斯 (`servant.achilles`)
- 阿尔托莉雅·潘德拉贡 (Alter) (`servant.artoria-alt`)
- 埃列什基伽勒 (`servant.ereshkigal`)
- 巴御前 (`servant.tomoe`)
- 坂田金时 (`servant.kintoki`)
- 卫宫 (`servant.emiya`)

## 验证方式

- `npm run audit:skills`：944 个运行时技能定义全部为 `FULL`，没有未解析规则节点。
- `node --test test/playable-roster.test.js`：检查选人池、图鉴技能 ID 与运行时技能注册一致。
- `node tools/verify-selection-art.cjs`：检查正式入口选人页、搜索、职阶筛选和 3X 禁用布局。
- `node tools/verify-full-game-flow.cjs`：从正式入口进入冬木对局，验证 7 人席位、技能卡载入、AI 自动行动、结算和下一回合抽牌。

远端 `binchen648/fd` 的示例包仍有部分角色标记为需要主持人裁定；本名单优先使用本地规则引擎已经完成并可在对局中执行的角色，避免出现能选中但无法结算的角色。
