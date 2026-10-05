# OnRobot 2FG7 — 独自形状の参照モデル

参照実機: **OnRobot 2FG7 (品番 106376)、ツール側 Quick Changer 内蔵、同梱フィンガーを内向きに取り付けた構成**。
カタログ `onrobot/2fg/2fg7/r1`。CC0-1.0。メーカー CAD・画像・第三者メッシュを使わず、データシートの公表数値から著作した。

出典: [2FG7 データシート v2.0](https://onrobot.com/storage/datasheets/2fg7/datasheet_2fg7_v2.0_en.pdf)
(sha256 261c025c26c3dad4f1af2be3550407af35e7bbc90f61b3903e9bf3539648b463) p.2–3 仕様、p.5 フィンガー、p.11 外形図。

| 項目 | 出典値 | 本モデル |
| --- | --- | --- |
| 全ストローク / 外径把持幅 (内向き) | 38 mm / 1–39 mm | 閉 1 mm、開 39 mm (各指 19 mm) |
| 外形 | 144 × 90 × 71 mm (L × W × D)、QC 面から 99 mm、全高 145 mm | 同値 (Ø71 の QC 12 mm + 90 × 71 の筐体 + 指 46 mm) |
| フィンガープラットフォーム幅 | 60 / 32 mm | 60 mm の座、32 mm 幅・8.5 mm 厚の指 |
| 質量 | 1.1 kg | specs の参照値 |
| 把持力 / 速度 | 20–140 N / 16–450 mm/s | specs の値。velocity 0.225 m/s・effort 140 は片指のシミュレーション設定 |
| 電源 | 20–25 V、最大 2000 mA | カタログ electrical |

## フレーム

- root の `mount` = ツール側 Quick Changer の接合面 (ロボット側 109498 と合う面)。+Z がツール内部へ。
- `finger_joint` = 0 が閉、0.019 m が開 (右指は mimic)。`left_contact` / `right_contact` = 指の内側面 (mount から 130 mm)。
- `tcp` = 指の間の中心、同じ高さ。全閉で対向指が 1 mm 離れて止まる (接触しない)。

外向き取付 (35–73 mm) は別構成で、本モデルには含まない。ベローズ・ロゴ窓・M3 サービス穴は図の見た目から置いた近似。

## 再生成・表示

```sh
npm --prefix authoring ci
node onrobot-2fg7/authoring/export.mjs
node onrobot-2fg7/authoring/export.mjs --check
node --test onrobot-2fg7/authoring/model.test.mjs
python3 -m http.server 8765 --bind 127.0.0.1
```
