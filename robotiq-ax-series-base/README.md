# Robotiq Palletizing Solution AX Series — 基台・昇降柱・コントローラの参照モデル

参照実機: **Robotiq Palletizing Solution AX Series (AX10 = UR10e 構成) の基台 + リニア軸 (ストローク 1500 mm) + コントローラ + パレットセンサ + 状態表示灯**。
カタログ `robotiq/ax/ax10/r1`。CC0-1.0。メーカー CAD・画像・第三者メッシュを使わず、取扱説明書の公表数値から著作した。
ロボット (UR10e) とグリッパ (PowerPick) は含まない。AX20 / AX30 は同じ基台に UR20 / UR30 を載せる。

出典: [Palletizing Solution AX Series Instruction Manual (2023-05-31)](https://assets.robotiq.com/website-assets/support_archives/document_en/Palletizing_Solution_Instruction_Manual_AXSeries_20230531.pdf)
(sha256 d6d0557674854c5b0102c48c93d0a6e5a19e5fcef351c7dc5890b8230e77e556) 3.1 (ストローク)、6.1.1 (外形)、6.2.1 (質量)、6.3.1 (電気)。

| 項目 | 出典値 | 本モデル |
| --- | --- | --- |
| 設置面積・高さ | 809 × 1370 mm、2334 mm | 基台 809 × 1370 × 60、柱 220 × 160 を 2254 まで、表示灯 2 本で 2334 |
| リニア軸ストローク | 1500 mm | `lift_joint` (prismatic) 0–1.5 m |
| ロボット取付板 | 4 × M8 + ダウエルピン (UR10e の基部パターン) | 300 × 300 × 20 の板。最下位置で板上面 550 mm、最上で 2050 mm |
| 質量 | 基台 45 kg + 柱 110 kg | specs の参照値 155 kg。慣性は未同定 |
| 電源 | AC 100–240 V、290 W max、ピーク 12.8 A @ 120 V | specs の値 |

柱の断面、キャリッジと取付板の張り出し (柱前面から 420 mm)、最下位置の板高さ 550 mm、コントローラ箱 (420 × 200 × 400)、
センサ・表示灯の位置は図からの割り付けで公表値ではない。`lift_joint` の速度 0.3 m/s・推力 3000 N はシミュレーション用の設定値。

## フレーム

- root の `base_link` = 基台中心の床面、+Z 上、柱は −Y 側、取付板は柱の +Y 側に張り出す。
- `carriage` = `lift_joint` の子。キャリッジとロボット取付板。
- `robot_mount` = ロボット取付板の上面中心 (UR10e の `base` が載る面)。+Z 上。

## 再生成・表示・テスト

```sh
npm --prefix authoring ci
node robotiq-ax-series-base/authoring/export.mjs
node robotiq-ax-series-base/authoring/export.mjs --check
node --test robotiq-ax-series-base/authoring/model.test.mjs
python3 -m http.server 8765 --bind 127.0.0.1
```

`http://127.0.0.1:8765/robotiq-ax-series-base/authoring/` で `lift_joint` を動かして確認できる。
