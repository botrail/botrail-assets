# OnRobot 3FG15 — 独自形状の参照モデル

参照実機: **OnRobot 3FG15 (品番 103666)、ツール側 Quick Changer 内蔵、同梱の 49 mm フィンガーと Ø13.5 シリコン指先**。
カタログ `onrobot/3fg/3fg15/r1`。CC0-1.0。メーカー CAD・画像・第三者メッシュを使わず、データシートの公表数値から著作した。

出典: [3FG15 データシート v2.1](https://onrobot.com/storage/datasheets/3fg15/datasheet_3fg15_v2.1_en.pdf)
(sha256 df2f1a0dbff826a5c6e7e6c89eecd06d391f0541d4d12450ff49592ef6d73dc0) p.2–3 仕様、p.3–4 フィンガー、p.11 同梱品、p.12–13 外形図。

| 項目 | 出典値 | 本モデル |
| --- | --- | --- |
| 外径把持径 | 4–152 mm | 指先中心の半径 8.75–82.75 mm (Ø13.5 の指先で 4–152 mm) |
| 外形 | 156 × 158 × 180 mm、Ø71 QC、QC 面からプラットフォーム下面 101.5 mm、全高 156.5 mm | 同値 |
| プラットフォーム円 / 指の掃引 | Ø110 / Ø180.5 | プラットフォーム軸を半径 55 mm に置き、46.25 mm のアームで指先を振る (**4 / 152 mm から解いた機構で、公表のリンク機構ではない**) |
| フィンガー / 指先 | 49 mm、Ø10 鋼 + Ø13.5 シリコン | Ø10 の棒 49 mm + Ø13.5 × 20.5 mm のキャップ (先端 6 mm 突出) |
| 質量 | 1.15 kg | specs の参照値 |
| 把持力 / モータトルク | 10–240 N / プラットフォーム 5.3 N·m | specs の値。effort 5.3 はデータシート値、velocity 1 rad/s はシミュレーション設定 |
| 電源 | 20–25 V、43–1500 mA (既定 600) | カタログ electrical |

## フレーム

- root の `mount` = ツール側 Quick Changer の接合面。+Z がツール内部へ。
- `finger_joint` = 0 が閉 (指先が中心に集まり Ø4 を挟む位置)、1.9 rad で全開 (Ø152)。指 2・3 は mimic で同じ向きに回る。
- `finger_N_tip` = 指先キャップの中心、`tcp` = 軸上の同じ高さ (mount から 146.5 mm)。

フィンガーの 3 取付位置のうち内側の範囲 (4–152 mm) だけを表す。筐体の絞り・ロゴ窓は図の見た目から置いた近似。

## 再生成・表示

```sh
npm --prefix authoring ci
node onrobot-3fg15/authoring/export.mjs
node onrobot-3fg15/authoring/export.mjs --check
node --test onrobot-3fg15/authoring/model.test.mjs
python3 -m http.server 8765 --bind 127.0.0.1
```
