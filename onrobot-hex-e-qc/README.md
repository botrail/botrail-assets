# OnRobot HEX-E QC — 独自形状の参照モデル

参照実機: **OnRobot HEX-E QC 6 軸力覚センサ (同梱の取付アダプタプレートと、ロボット側 Quick Changer 内蔵の工具側面を含む)**。
カタログ `onrobot/hex/hex-e-qc/r1`。CC0-1.0。メーカー CAD・画像・第三者メッシュを使わず、データシートの公表数値から著作した。
HEX-H QC は同一筐体で定格だけが違う。

出典: [HEX-E/H QC データシート v1.5](https://onrobot.com/storage/datasheets/hex/datasheet_hex-e_h_qc_v1.5_en.pdf)
(sha256 326a5015a1149413fea4faed385964e101e4b114e164071bf1e4e3b8999c6dfd) p.2 (仕様) と p.7 (外形図)。

| 項目 | 出典値 | 本モデル |
| --- | --- | --- |
| ロボットフランジ面 → OnRobot ツール面 | 50 mm (p.7 の * 寸法) | `flange` = mount + 50 mm |
| 外形 | 50 × 71 × 93 mm (H × W × L、p.2)、図では Ø72 | Ø72 の円筒 (アダプタプレート 6 + 本体 24 + QC リング 18 mm) |
| コネクタ | M12 12 ピン、全長 93 mm まで張り出す | 径方向の箱 (半径 36 → 57 mm) と M12 の円筒を −Y 側に置く |
| アダプタプレートの穴 | 35.36 mm 角 (= PCD 50、ISO 9409-1-50-4-M6) | PCD 50 の通し穴 4 つ、中央穴 Ø31.6 |
| 質量 | 0.347 kg (アダプタプレート込み) | specs の参照値。慣性は未同定 |
| 定格 | Fxy / Fz 200 N、Txy 10 N·m、Tz 6.5 N·m | specs の値 |

リング間の継ぎ目、リリースボタン、インデックス印の位置は図の見た目から置いたもので、寸法の根拠は無い。

## フレーム

- root の `mount` = ロボット側 (アダプタプレート) の面の中心、+Z がツール側へ向く。
- `flange` = 工具側の面 (mount + 50 mm) = OnRobot ツール側 Quick Changer が掛かる面 (`onrobot/quick-changer/109498` の flange と同じ契約)。
- `ft_frame` = `flange` と同位置・同向き。**センシング基準座標系の実際の位置はデータシートに無く、工具側面の中心と仮定している。**

## 再生成・表示

```sh
npm --prefix authoring ci
node onrobot-hex-e-qc/authoring/export.mjs
node onrobot-hex-e-qc/authoring/export.mjs --check
python3 -m http.server 8765 --bind 127.0.0.1
```

`http://127.0.0.1:8765/onrobot-hex-e-qc/authoring/` で確認できる。
