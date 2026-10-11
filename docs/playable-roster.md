# 当前可玩主从名单

浏览器正式入口从 `src/content/generated/playable-roster.json` 读取选人池。名单由技能迁移批次记录生成：角色的全部技能必须标记为 `FULL`，并且必须有本地正式立绘。这样不会把只有预览卡或仍含 `PARTIAL` 技能的角色放进真实对局。

当前结果：**11 名御主、15 名从者、96 个已完成技能**。目标的 16+16 目前没有凑齐，按实际完成数量开放。

## 御主（11）

- 肯尼斯 (`master.kayneth`)
- 卫宫切嗣 (`master.kiritsugu`)
- 远坂凛 (`master.rin`)
- 间桐樱 (`master.sakura`)
- 言峰绮礼 (`master.kirei`)
- 伊莉雅斯菲尔 (`master.iliya`)
- 韦伯·维尔维特 (`master.waver`)
- 爱丽丝菲尔 (`master.irisviel`)
- 巴泽特 (`master.bazett`)
- 丹·布拉克莫尔 (`master.dan`)
- 尤里鸟斯·贝尔奇斯科·哈维 (`master.julius`)

## 从者（15）

- 阿尔托莉雅 (`servant.saber`)
- 卫宫 (`servant.emiya`)
- 伊斯坎达尔 (`servant.iskandar`)
- 美杜莎 (`servant.medusa`)
- 库·丘林 (`servant.cu`)
- 吉尔·德·雷 (`servant.gilles`)
- 赫拉克勒斯 (`servant.herc`)
- 宫本武藏 (`servant.musashi`)
- 阿尔托莉雅·潘德拉贡 (Alter) (`servant.artoria-alt`)
- 巴御前 (`servant.tomoe`)
- 埃列什基伽勒 (`servant.ereshkigal`)
- 梅柳齐娜 (`servant.melusine`)
- 弗朗西斯·德雷克 (`servant.drake`)
- 坂田金时 (`servant.kintoki`)
- 贞德 (`servant.jeanne`)

## 未进入选人池的现有立绘角色

这些角色都有本地立绘，但技能批次记录仍含未完成技能，所以暂不进入真实对局：间桐慎二、久宇舞弥、佩佩、阿喀琉斯、阿尔托莉雅·卡斯特、山中老人。预览用的卧藤门司和奥尔加玛丽没有对应可执行技能包，也不会再被选人页误列为可玩角色。

## 验证方式

- `node tools/generate-playable-roster-data.mjs`：根据技能批次和立绘重新生成唯一选人清单、图鉴数据与审核明细。
- `node --test test/playable-roster.test.js`：检查角色内容、技能 `FULL`、本地立绘和图鉴条目一致。
- `node tools/build-browser-runtime.cjs`：把同一清单编入正式浏览器运行时。
