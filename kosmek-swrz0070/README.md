# コスメック 変換プレート SWRZ0070-MF4 / SWRZ0070-TF4 — 独自形状の参照モデル

参照実機: **コスメック SWRZ0070-MF4 (マスターシリンダ用、ISO インターフェース番号 4) と SWRZ0070-TF4 (ツールアダプタ用、同 4)**。
SWR0070 ハンドチェンジャーを ISO 9409-1-50-4-M6 のロボットフランジ / ツールに繋ぐ純正プレート。
カタログ `kosmek/swrz/swrz0070-mf4/r1` / `kosmek/swrz/swrz0070-tf4/r1`。CC0-1.0。公表数値から著作した。

出典: [SWRZ カタログ R01 (2022FA)](https://www.kosmek.co.jp/data/pdf/jp/SWRZ_R01_2022FA.pdf)
p.106 形式表示・仕様、p.110 外形寸法 SWRZ0070-MF4、p.116A 外形寸法 SWRZ0070-TF4。

| 項目 | 出典値 | 本モデル |
| --- | --- | --- |
| MF4 プレート A (ロボット側) | φ63、厚さ 11、4-φ6.8 (ザグリ裏カラ) p.c.d. 50、φ31.5 −0.03 のパイロット、φ6 ピン穴 | φ63 × 11、p.c.d. 50 の穴 4 つ、φ31.5 のボス (4.5 mm) |
| MF4 プレート B (SWR 側) | φ48、厚さ 9、p.c.d. 39、2-φ4 ピン | φ48 × 9、p.c.d. 39 の穴 4 つ |
| MF4 積み高さ / 質量 | 20 mm / 100 g | 20 mm、specs 0.1 kg |
| TF4 プレート B (SWR 側) | φ50 (47.6)、厚さ 9、p.c.d. 39 4-M4 | φ50 × 9 |
| TF4 プレート A (ツール側) | φ63 h8、厚さ 7、φ31.5 H7 の凹み、4-M6 深 8 p.c.d. 50 | φ63 × 7 (凹みは貫通穴で表す) |
| TF4 積み高さ / 質量 | 16 mm / 70 g | 16 mm、specs 0.07 kg |
| 材質 / 表面 | A2017BE-T4 / アルマイト (赤) | 赤の材質 |

## フレーム

- mf4: root `mount` = ロボットフランジ接合面 (ISO 9409-1-50-4-M6、+Z がツール側)、`flange` = SWR0070-M の取付面 (mount + 20 mm)。
- tf4: root `mount` = SWR0070-T の下面 (p.c.d. 39) と合う面、`flange` = ISO 9409-1-50-4-M6 のツール取付面 (mount + 16 mm)。
- 付属ボルト・平行ピン・ザグリの深さは再現していない。

## 再生成・表示

```sh
npm --prefix authoring ci
node kosmek-swrz0070/authoring/export.mjs
node kosmek-swrz0070/authoring/export.mjs --check
python3 -m http.server 8765 --bind 127.0.0.1
```
