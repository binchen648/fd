# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- 在电脑端完成七人 Fate/Domination 完整对局的玩家。
- 需要以统一前后端契约继续开发规则和界面的项目协作者。

## Product Purpose

提供一套可读、可操作、可验证的数字桌游对局界面。玩家应能快速确认回合、阶段、行动者、战场局势和自己当前可执行的操作，同时保留桌游的卡面身份与隐藏信息结构。

## Positioning

界面结合七人桌面空间感与规则端驱动的操作提示；系统负责解释和验证，玩家仍亲自选择与出牌，不把策略自动化，也不把游戏压扁为通用管理后台。

## Operating Context

- 首个参考场景为七人局行动阶段。
- 桌面包含魔术工房、深山町、新都和侦查，以及事件、局势、玩家公开状态和本人操作台。
- 玩家频繁悬停或点击卡牌查看中文说明，再从规则端提供的合法操作中选择。

## Capabilities and Constraints

- 电脑端优先，以 1440×900 和 1920×1080 为主要参考视口。
- 后续移动端必须通过重组界面支持完整对局，不能简单缩放桌面端。
- 所有者私密信息由服务端观察者投影裁剪，不能只靠前端隐藏。
- 非本人回合默认只能检视；真实响应窗口开放时例外。
- 自己回合也只有 `availableActions` 明确提供的操作可以执行。
- 技能区允许因角色效果动态增减。
- 常规出牌与效果追加出牌分别显示和计数。
- 初版不加入音效。

## Brand Commitments

- 产品名：Fate/Domination。
- 使用原仓库和 CHM 提供的真实御主、从者、技能、事件及地点图像。
- 保留暗色仪式氛围、蓝黑牌面、金色重点和战场空间感。
- 可读性与操作确定性优先于装饰效果。

## Evidence on Hand

- 最终规则：`D:/fd/docs/rules/FD-Game-Rules-Final.md`。
- 原仓库实现与图片：`D:/fd/references/fate-domination`。
- 已确认桌面设计：`D:/fd/docs/plans/2026-08-31-fd-desktop-ui-reference-design.md`。
- 通用卡牌检视设计：`D:/fd/docs/plans/2026-08-31-fd-universal-card-inspection-design.md`。
- 首批结构化内容：`D:/fd/data/packs/fd-playtest-v1`。

## Product Principles

- 先展示玩家当前需要做出的决定。
- 实际牌图承担识别，结构化中文文本承担阅读。
- 同一种可见卡牌使用同一种检视方式。
- 玩家选择，系统验证；客户端不重建规则。
- 特殊角色可以进入房主裁定，但不能静默猜测。

## Accessibility & Inclusion

主要控件支持键盘操作、可见焦点和 Escape 关闭；状态不能只依靠颜色表达；动效尊重 `prefers-reduced-motion`；正文和控件满足 WCAG AA 对比度目标。
