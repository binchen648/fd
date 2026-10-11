# 公告与教程网络配图

公告默认插图、教程目录及六章新手教程使用从官网获取的横版壁纸。按用户要求，四张图片已下载至 `assets/ui/display-art/`，界面引用本地文件，支持离线显示。游戏卡牌和地图资源仍用于各自的游戏内容。

## 来源

- FGO 所罗门纪念壁纸：https://anime.fate-go.jp/ep7-tv/special/wallpaper2/
  - https://anime.fate-go.jp/ep7-tv/special/wallpaper2/dl/pc_wp.jpg
- FGO 神圣圆桌领域卡美洛壁纸：https://anime.fate-go.jp/ep6-movie/wandering/special/digicon/
  - https://anime.fate-go.jp/ep6-movie/wandering/assets/img/special/digicon/pc_01.jpg
  - https://anime.fate-go.jp/ep6-movie/wandering/assets/img/special/digicon/pc_02.jpg
  - https://anime.fate-go.jp/ep6-movie/wandering/assets/img/special/digicon/pc_03.jpg

2026-10-05 四个图片地址均返回 HTTP 200、image/jpeg。图片版权属于 TYPE-MOON / 对应 FGO ANIME PROJECT，来源不代表游戏拥有这些图片的授权。

旧公告的三种默认地图插图及上一版四个网络图片地址，在加载时映射至对应本地文件；公告文字和自定义上传图片保留。

本地文件：`fgo-solomon.jpg`、`fgo-camelot-knights.jpg`、`fgo-camelot-journey.jpg`、`fgo-camelot-battle.jpg`。下载原图，未裁改；界面通过 CSS 显示。

## 备用图片库

新增九张 FGO 地图：冬木、奥尔良、罗马、俄刻阿诺斯、伦敦、北美、卡美洛、巴比伦尼亚、新宿，保存至 `maps/`。来自 Atlas Academy 的 FGO 数据及资源服务，具体源地址与尺寸记录在 `assets/ui/display-art/library.json`。

新增三张宣传图：Fate/Heaven’s Feel 两张官网主视觉、FGO 卡美洛后篇官网主视觉，保存至 `visuals/`。

连同此前四张壁纸，共十六张本地素材。打开 `assets/ui/display-art/index.html` 查看缩略图、尺寸、原图与来源。通过 `node tools/build-display-art-library.cjs` 重建图片目录。
