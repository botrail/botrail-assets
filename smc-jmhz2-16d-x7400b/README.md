# SMC JMHZ2-16D-X7400B — 独自形状の参照モデル

参照実機: **SMC 協働ロボット用エアグリッパ JMHZ2-16D-X7400B for Universal Robots** (UR+ 認証、ISO 9409-1-50-4-M6 直付け、
電磁弁・速度調整機構・オートスイッチ内蔵、M8 8 ピンソケット)。カタログ `smc/jmhz2/jmhz2-16d-x7400b/r1`。CC0-1.0。
メーカー CAD・画像・第三者メッシュを使わず、公表数値から著作した。

出典:

- [SMC フライヤ P-20-26 「協働ロボット用エアグリッパ JMHZ2-X7400B-CRX」](https://www.smcworld.com/catalog/New-products/mpv/P-20-26-JMHZ2-X7400B-CRX/data/P-20-26-JMHZ2-X7400B-CRX.pdf)
  (sha256 b8fc52cec3106338bd667a47511e9327f5caa26d563cce51f976a111d2cfa71b) p.1 仕様表、p.2 外形寸法図。
  FANUC CRX 版だがグリッパユニット (JMHZ2-16D) と仕様値は UR 版と同じ。フランジ部の形は UR 版 (M8 ソケット) に読み替えた。
- [UR Marketplace 掲載](https://www.universal-robots.com/marketplace/products/01tP40000071Ni1IAE/): 外形 85 × 68 × 135 mm、同梱品 (JMHZ2-16D 本体、平行ピン φ6×10、M6×23 ×4、樹脂カバー、φ4 チューブ 2 m)。
- [カンタム・ウシカタ 製品ページ](https://www.kantum.co.jp/product/ur-accessories/gripper-for-UR/smc_air-chuck): 把持力・質量・取付規格 (SMC 公式 Web カタログは会員限定)。

| 項目 | 出典値 | 本モデル |
| --- | --- | --- |
| フランジ面 → 爪取付基準 | 88.1 mm (フライヤ図) | 88.1 mm |
| 把持点 L 基準点 / アタッチメント先端 | 85.8 mm / (135) mm | アタッチメントは 85.8–135 mm (長さ 49.2 mm、幅 12.5、厚さ 9.5) |
| アタッチメント内側間隔 | 開時 27 / 閉時 17 mm (両側ストローク 10 mm) | 同値。q = 0 が閉、各爪 5 mm |
| 本体 (カバー) の幅 / 奥行 | 33.1 + 50 / 33.6 + 37 mm | 83.1 / 70.6 mm の箱 (弁側に偏心)。UR 掲載の 85 × 68 と整合 |
| 上部ブロック | 幅 60、高さ 28.6 mm | 同値 (フランジ板 Ø63 × 3 を含む) |
| 把持力 | 外径 32.7 N / 内径 43.5 N (0.5 MPa、L=20) | specs の値。effort 33 はシミュレーション設定 |
| 質量 | 430 g | specs の参照値。重心・慣性は未同定 |

## フレーム

- root の `mount` = ISO 9409-1-50-4-M6 のロボットフランジ接合面 (+Z がツール内部へ)。φ31.5 パイロットと M6 穴は描いていない。
- `finger_joint` = 0 が閉、0.005 m が開 (右爪は mimic)。`left_contact` / `right_contact` = アタッチメント内側面 (z = 122 mm)。
- `tcp` = アタッチメント間の中心、mount から 122 mm (把持点 L 基準点 85.8 mm から約 36 mm 下)。

## 表現範囲

カバー・弁ブロック・速度調整つまみ・コネクタは図の見た目から置いた近似形状。collision は箱と円筒。
標準アタッチメントの M3 穴、エア継手の向き、カバー分割線は作っていない。

## 再生成・表示

```sh
npm --prefix authoring ci
node smc-jmhz2-16d-x7400b/authoring/export.mjs
node smc-jmhz2-16d-x7400b/authoring/export.mjs --check
node --test smc-jmhz2-16d-x7400b/authoring/model.test.mjs
python3 -m http.server 8765 --bind 127.0.0.1
```

`http://127.0.0.1:8765/smc-jmhz2-16d-x7400b/authoring/` で確認できる。
