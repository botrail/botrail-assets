# ASPINA ARH350A — 独自形状の参照モデル

参照実機: **ASPINA (シナノケンシ) 電動 3 爪ロボットハンド ARH350A** (標準爪、UR+ 認証)。
カタログ `aspina/arh/arh350a/r1`。CC0-1.0。メーカー CAD (STEP 公開あり、会員登録制) は使わず、公表数値から著作した。

出典:

- [ASPINA 製品ページ](https://aspina-robotics.com/ja/products/roboticgripper/products/arh350a/): 最大開口径 φ143、把持力 50 N、質量 640 g、開閉 0.8–10 s。
- [カンタム・ウシカタ 製品ページ](https://www.kantum.co.jp/product/ur-accessories/gripper-for-UR/arh350): サイズ φ60 × 155 mm、繰り返し精度 ±50 µm、24 V ±10 %。
- [UR Marketplace 掲載](https://www.universal-robots.com/marketplace/products/01tP40000071NGnIAM/): 高さ 153 mm (全閉) / 135 mm (全開)、幅・奥行 60 mm、同梱品、URCap ShinanoARH、UR 用アタッチメントは別売。

| 項目 | 出典値 | 本モデル |
| --- | --- | --- |
| 本体 | φ60、全閉高さ 153 mm | Ø60 × 76 の円筒 + 77 mm の指 3 本 (全閉で 153 mm) |
| 全開高さ / 最大開口径 | 135 mm / φ143 | 指の揺動 40° で指先中心線の端が 135 mm・φ143 (**ピボット半径 22 mm とともに解いた値で、公表の機構ではない**) |
| 爪 | 標準爪 (最大フィンガ長 100 mm) | 8 × 12 mm の角棒 77 mm、先端内側に 20 mm のパッド |
| 質量 | 640 g | specs の参照値。慣性は未同定 |
| 把持力 / 可搬 | 50 N / つまみ 500 g・つかみ 3 kg | specs の値。effort 5 はシミュレーション設定 |

## フレーム

- root の `mount` = ハンド底面 (ロボット側) の中心、+Z がツール側 (指の方向)。**UR 用アタッチメント (別売、品番未確認) は含まない**。
- `finger_joint` = 0 が全閉 (指が真っ直ぐ)、0.698 rad (40°) が全開。指 2・3 は mimic。
- `finger_N_tip` = 各指のパッド内側、`tcp` = 全閉時の指先高さ (mount から 141 mm) の軸上。

## 再生成・表示

```sh
npm --prefix authoring ci
node aspina-arh350a/authoring/export.mjs
node aspina-arh350a/authoring/export.mjs --check
node --test aspina-arh350a/authoring/model.test.mjs
python3 -m http.server 8765 --bind 127.0.0.1
```
