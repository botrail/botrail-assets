# Robotiq EPick — 独自形状の参照モデル (1 カップ構成)

参照実機: **Robotiq EPick 電動真空グリッパ、Single Suction Cup Kit の構成 (Ø40 mm・1.5 ベローズのカップ 1 個を G1/4 ポートに直付け)**。
カタログ `robotiq/epick/epick/r1`。CC0-1.0。メーカー CAD・画像・第三者メッシュを使わず、取説の公表数値から著作した。
カップリング (GRP-ES-CPL-062 / 077) は別アセットで、本モデルの `mount` はカップリング→グリッパの接合面。

出典: [EPick Instruction Manual (e-Series、2021-07-09)](https://assets.robotiq.com/website-assets/support_documents/document/EPick_Instruction_Manual_e-Series_PDF_20210709.pdf)
(sha256 166e94e6c42003c395300cc5ff41eb6318a36e9dc29d5ec6da807771a085fa72)。図面は複製せず、数値 (facts) だけを採った。

| 項目 | 出典値 | 本モデル |
| --- | --- | --- |
| 本体の平面寸法 | 83 × 62 mm (Fig. 6-1) | 83 × 62 mm の角丸箱。上端の絞り (48 / 43 mm) は 70 × 46 mm の段で近似 |
| カップリング面 | Ø75、Ø71 h8 パイロット、4 mm のリップ | Ø75 × 4 mm の円盤。パイロットは掘っていない |
| 高さ | 101 mm (上面) / 102.3 mm (Ø20 e8 ボス) | 同値 |
| 上面の取付 | G1/4 ▽10 中央ポート、4× M5 PCD 65 | 穴は作らない。カップはボス上面 (102.3 mm) から立てる |
| TCP | 113 mm (カップ無し) / 145 mm (1 カップ)、ロボットフランジ基準 (Table 6-4) | 差 32 mm をカップ高さに採り、`tcp` = mount から 134.3 mm。113 − 102.3 = 10.7 mm が取説の GRP-CPL-062 の厚みで、本モデルには含めない |
| 質量 | 706 g (GRP-CPL-062 込み、Table 6-1) | specs の参照値 (カップリング込み)。重心 (0, 0, 51.5) は未反映、慣性は未同定 |
| 可搬 | 0–16 kg (Ø55 カップ 4 個、80 %)、1 air node あたり 4.5 kg まで | 1 カップ構成の上限として 4.5 kg を specs に記す。吸着・漏れ・カップ変形は模擬しない |
| 真空 / 流量 | 80 % / 12 L/min | 仕様値のみ |

## フレーム

- root の `mount` = カップリング→グリッパ接合面の中心、+Z がツール内部 (カップ側) へ向く。
- `cup_1` (固定) = ボス上面、`cup_1_contact` = カップのリップ面 (mount から 134.3 mm)、`tcp` = 同位置。
- 真空の ON/OFF は制御状態で、架空の関節は作らない。

## 表現範囲

筐体・コネクタプロテクタ・LED・カップは独自の近似形状。collision は円筒と箱。
2 カップ / 4 カップのマニホールドとブラケット (VAC-SCS-KIT2 / KIT4) は含まない (TCP 196 mm、質量 1116 / 1341 g の別構成)。

## 再生成・表示

```sh
npm --prefix authoring ci
node robotiq-epick/authoring/export.mjs
node robotiq-epick/authoring/export.mjs --check
python3 -m http.server 8765 --bind 127.0.0.1
```

`http://127.0.0.1:8765/robotiq-epick/authoring/` で確認できる。
