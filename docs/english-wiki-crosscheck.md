# 英文 Wiki 规则交叉核对

核对日期：2026-10-01。用于辅助理解中文规则，不自动覆盖用户裁定、中文修订版或对应开发版卡图。

## 来源与术语

- [How to Play](https://fatedomination.fandom.com/wiki/How_to_Play)
- [Movement](https://fatedomination.fandom.com/wiki/Movement)
- [Deployment](https://fatedomination.fandom.com/wiki/Deployment)
- [Power](https://fatedomination.fandom.com/wiki/Power)
- [Events](https://fatedomination.fandom.com/wiki/Events)
- [Objectives](https://fatedomination.fandom.com/wiki/Objectives)

主页直接访问受限；以上内容通过网页搜索索引读取，索引标注约三个月前抓取，不能视为实时版本。

| 英文 | 项目中文 |
| --- | --- |
| Event | 局势牌：全场当回合环境、魔力补给 |
| Objective | 事件牌：放在战场，提供战果和地区效果 |
| Outpost | 前哨／部署阶段 |
| Miyama / Shinto / Recon | 深山町／新都／侦察 |

## 与中文基础规则一致的重点

- 每回合深山町一张明置事件、新都一张暗置事件；局势增加的数量另算。新都进入行动阶段公开。
- 未在地图上的玩家在部署阶段必须部署，不能直接部署到侦察。
- 常规移动先于常规出牌，遵循地图方向和费用；战场有对手时不能常规移动。
- 常规出牌同时打出两张；战场至少一张明置。地图外的手牌选择不会改变已提交攻击的合计威力。
- 工房上限四人、侦察上限一人、普通战场容纳人数不限；地利来自部署占位。
- 一局十一回合，第八至第十回合分别按前四、三、二名淘汰，同分保留。初始顺位随机，之后依回合规则轮转。

代码定位：`src/rules-core/rounds.ts`、`board.ts`、`combat.ts`、`situation-setup.ts`；实际网页链路通过浏览器验证，不能仅凭教程文案认定实现。

## 差异复核

| 项目 | 英文索引 | 中文修订版／当前项目 | 处理 |
| --- | --- | --- | --- |
| 工房至新都移动费用 | Movement 页举例为 3 魔力 | 中文基础规则旧文字例子为 2 + 2 + 1；但中文问题解答与用户提供的地图一致，路线为 1、2、2 | 用户于 2026-10-01 确认按地图费用。代码、地图配置及教程已纠正；工房至新都 3、至侦察 5 |
| 夺回伊莉雅的地区效果 | Objectives 表中 Bring Illya Back 标为无效果 | 当前中文卡面文字有胜者魔力奖励 | 标记待逐卡核对，不按英文表删效果 |

英文也有内容版本差异，卡名对应及具体奖励需要对照中文卡图。此次不扩充事件组，不导入未完成技能，也不把全部规则标为已完成。
