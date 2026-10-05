# Piab piCOBOT (for Universal Robots) — 独自形状の参照モデル

参照実機: **Piab piCOBOT for Universal Robots** (COAX エジェクタユニット + Adjustable Gripper、ISO 9409-1-50-M6 アダプタプレート付き、UR+ 認証)。
カタログ `piab/picobot/picobot/r1`。CC0-1.0。メーカー CAD・画像・第三者メッシュを使わず、公表数値から著作した。

出典:

- [piCOBOT データシート (2023-01-03、PCO.G.M02.T.MC2.S120PB.X.6.CCA.B.A03K1)](https://24279054.fs1.hubspotusercontent-na1.net/hubfs/24279054/Resources/Piab/Piab%20piCOBOT%20Datasheet.pdf):
  エジェクタ Ø70 × 69 mm (A = 71.9)、22.8 oz、グリッパ 8.6 oz、カップ間隔 97–142 mm、カップ角度 ±15°、M8 8 ピン、最大 7 kg。
  この品番の取付プレートは ISO 9409-1-31.5-4-M5 で、UR 版の ISO 50 プレートは次の掲載で読み替えた。
- [UR Marketplace 掲載](https://www.universal-robots.com/marketplace/products/01tP40000071NYNIA2/): piCOBOT Ø93 × 74 mm、Adjustable Gripper 174 × 72 × 38 mm、同梱品 (エジェクタ、グリッパ、カップ 8 個、プッシュピン、M8 ケーブル、URCap)。
- [Piab 製品ページ](https://www.piab.com/en-us/robot-and-cobot-gripping-solutions/cobots-and-robot-grippers/picobot-vacuum-gripper-unit/picobot-for-universal-robots2): UR アームへ直付け (ISO-9409-1-50-M6)。

| 項目 | 出典値 | 本モデル |
| --- | --- | --- |
| アダプタプレート + エジェクタ | Ø93 × 74 mm (UR 掲載) | Ø93 × 5 の板 + Ø70 × 69 の円筒 |
| Adjustable Gripper | 174 × 72 × 38 mm | 同値の包絡 (ビーム + 弁ブロック + カップホルダ 2) |
| カップ間隔 | 97–142 mm (無段階) | 120 mm 固定 |
| カップ | キットの 8 個 (サイズ混在) | Ø40 の 1.5 段ベローズ 2 個を代表として配置 (高さ 22 mm) |
| 質量 | 22.8 + 8.6 oz = 約 0.89 kg (カップ除く) | specs の参照値 0.89 kg |
| 可搬 | 7 kg (246.9 oz) | specs の値。吸着・漏れ・カップ変形は模擬しない |

## フレーム

- root の `mount` = ISO 9409-1-50-4-M6 のロボットフランジ接合面 (+Z がツール内部へ)。
- `cup_a` / `cup_b` (固定) = カップホルダ下面、`cup_a_contact` / `cup_b_contact` = カップのリップ面 (mount から 134 mm)。
- `tcp` = 2 カップの中点、同じ高さ。真空の ON/OFF は制御状態で、架空の関節は作らない。

## 再生成・表示

```sh
npm --prefix authoring ci
node piab-picobot/authoring/export.mjs
node piab-picobot/authoring/export.mjs --check
python3 -m http.server 8765 --bind 127.0.0.1
```
