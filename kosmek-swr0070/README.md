# コスメック ロボットハンドチェンジャー SWR0070 — 独自形状の参照モデル (マスタ + ツール)

参照実機: **コスメック SWR0070-M (マスターシリンダ、ロボット側) と SWR0070-T (ツールアダプタ、ツール側)**。
カタログ `kosmek/swr/swr0070-master/r1` / `kosmek/swr/swr0070-tool/r1`。CC0-1.0。
公式 STEP (製品ページ) は使わず、カタログの公表数値から著作した。

出典: [SWR カタログ R09 (2022FA)](https://www.kosmek.co.jp/data/pdf/jp/SWR_R09_2022FA.pdf)
(sha256 9ffedbf6707c46d02ea151a9c5f6bc44a769ad5f4c1da53750dc130e86d23e22) p.25 仕様、p.28 外形寸法 (SWR0070)。

SWR0030 ではなく SWR0070 を参照実機にしたのは、ISO インターフェース番号 4 (ISO 9409-1-50-4-M6、UR の手首) 用の
純正変換プレート SWRZ が SWR0070 以上にしか無いため (SWRZ カタログ p.106)。変換プレートは別アセット `kosmek-swrz0070`。

| 項目 | 出典値 | 本モデル |
| --- | --- | --- |
| 外径 | φ47 (両側) | φ47 |
| マスタ本体 / 位置決めボス | 22.5 mm / φ20 g7、接合面から 14.4 mm | 同値 (ボスは円筒で表す) |
| ツールアダプタ | 16 mm (下面に 2-φ4 ピン 5 mm) | 16 mm、ピン付き |
| 連結時 | 38.5 mm (ロック) / 39.3 mm (リリース) | ロック状態 38.5 mm (= 22.5 + 16) |
| 取付 | マスタ上面 4-φ3.4 (ザグリ φ6)、ツール下面 4-M4 深 8.5、いずれも p.c.d. 39、2-φ4 h7 ピン (±19.5) | p.c.d. 39 の穴 4 つとピン 2 本 (ねじ・公差は未再現) |
| エアポート | 6× M5 (両側) | 側面に 6 個の印 |
| 可搬 / 位置再現精度 | 7 kg (0.5 MPa)、0.003 mm | specs の値 |
| 質量 | マスタ 180 g / ツール 120 g | specs の参照値 |

## フレーム

```
ロボットフランジ (ISO 9409-1-50-4-M6)
  -> [kosmek-swrz0070-mf4: mount .. flange]   20 mm
  -> [swr0070-master: mount .. coupling]      22.5 mm (ボス 14.4 mm は相手側に入る)
  -> [swr0070-tool: mount .. flange]          16 mm
  -> [kosmek-swrz0070-tf4: mount .. flange]   16 mm
  -> エンドエフェクタ (ISO 9409-1-50-4-M6)               合計 74.5 mm
```

- master: root `mount` = ロボット側の取付面 (p.c.d. 39)、`coupling` = 接合面 (mount + 22.5 mm)。ボスの collision は接合面から下へ 14.4 mm 出る。
- tool: root `mount` = 接合面 (マスタと合う面)、`flange` = ツール側の取付面 (mount + 16 mm、p.c.d. 39 の 4-M4)。
- ボールロック、エア通路、外付オプション電極は作っていない。外付オプション取付面 (平取り 6 mm) は印だけ。

## 再生成・表示

```sh
npm --prefix authoring ci
node kosmek-swr0070/authoring/export.mjs
node kosmek-swr0070/authoring/export.mjs --check
python3 -m http.server 8765 --bind 127.0.0.1
```
