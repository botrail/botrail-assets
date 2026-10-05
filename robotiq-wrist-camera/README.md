# Robotiq Wrist Camera — 独自形状の参照モデル

参照実機: **Robotiq Wrist Camera RWC-CAM-001 (UR 用キット RWC-UR-KIT のカメラ本体、ツールプレート RWC-TOOL-062 無し)**。
カタログ `robotiq/wrist-camera/wrist-camera/r1`。CC0-1.0。メーカー CAD・画像・第三者メッシュを使わず、取説の公表数値から著作した。

出典: [Wrist Camera Instruction Manual (e-Series、2019-01-16)](https://assets.robotiq.com/website-assets/support_documents/document/Vision_System_e-Series_PDF_20190116.pdf)
(sha256 1303aa58f19bfe422cdb2c4c4bce30cf65871edd367ea335ff8fd1ad282448e4) §7.1 / §3.4。図面は複製せず、数値だけを採った。

| 項目 | 出典値 | 本モデル |
| --- | --- | --- |
| リング | R37.5 (Ø75)、両面 ISO 9409-1-50-4-M6 | Ø75 × 13.5 mm の円盤、PCD 50 の通し穴 4 つと中央穴 Ø31.6 |
| カメラ頭部 | R50 まで張り出し (全長 87.5 mm)、全厚 22.4 mm | 46 × 26 × 22.4 mm の角丸箱を +Y 側に置く |
| 追加高さ (ツールプレート無し、2F グリッパと使う場合) | 13.5 mm | `flange` = mount + 13.5 mm (カップリングはカメラを貫通して UR フランジに締結される) |
| 追加高さ (ツールプレート RWC-TOOL-062 付き) | 23.5 mm (全厚 29.5) | 含まない。ISO 50 の汎用工具を付けるときは別途 +10 mm |
| 撮像素子の位置 | [0, 35.7, −0.1] mm (UR フランジ座標系)、視線は Z 軸から 30° | `camera_optical_frame` を同位置に置き、+Z を視線 (−Y へ 30° 傾く) に合わせる |
| 画角 | 水平 50°、垂直 39° | カタログ specs の値 |
| 質量 | 160 g (ツールプレート無し)、重心 (0, 5, 9) mm | specs の参照値。慣性は未反映 |

レンズ・LED 2 個・ケーブル出口の位置は図の見た目から置いたもので、寸法の根拠は無い。

## フレーム

- root の `mount` = UR フランジ側の面の中心、+Z がツール側へ向く。+Y がカメラ頭部の方向
  (取説の「UR の座標系で [0, 35.7, −0.1]」に合わせた。実機の向きは割りピンで決まるので、セルで使うときは要確認)。
- `flange` = 工具側の面 (mount + 13.5 mm)。Robotiq カップリングの座面。
- `camera_optical_frame` = 撮像素子の位置、+Z = 視線 (光学系の規約: +Z 前方)。

## 再生成・表示

```sh
npm --prefix authoring ci
node robotiq-wrist-camera/authoring/export.mjs
node robotiq-wrist-camera/authoring/export.mjs --check
python3 -m http.server 8765 --bind 127.0.0.1
```

`http://127.0.0.1:8765/robotiq-wrist-camera/authoring/` で確認できる。
