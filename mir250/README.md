# MiR250 — 独自形状の参照モデル

参照実機は **Mobile Industrial Robots MiR250**。CC0-1.0。
メーカー CAD・第三者メッシュを含まず、Three.js で独自に外装と車輪を著作した。
カタログ ID: `mobile_industrial_robots/mir/mir250/r2`。

## 出典と採用値

- [MiR250 公式仕様](https://mobile-industrial-robots.com/products/robots/mir250/specifications) (2026-09-21 参照): 寸法・可搬・速度・地上高・色・センサ構成。
- [公式製品写真](https://a.storyblok.com/f/230581/2000x1248/71f728b230/mir250-transparent.png): 外装の段差・窓・ランプの目視参照のみ。写真自体やトレース形状は同梱しない。
- [DFKI mir_robot の数値車輪配置](https://github.com/DFKI-NI/mir_robot/blob/c08dfad93be53ac12969f0f37a01a2b74b5c1997/mir_description/urdf/include/mir_v1.urdf.xacro): r1 との車輪座標の連続性のため数値のみを参照。メーカーの校正値ではない。

| 項目 | 公表値 / 参照値 | 本モデル |
|---|---|---|
| L × W × H | 800 × 580 × 300 mm | 同値。装飾を含む外形を検証 |
| 質量 / 可搬 / 最高速度 | 94 kg / 250 kg / 2.0 m/s | カタログ仕様値 |
| 地上高 | 25–28 mm | 車体下端 25 mm |
| 積載面 / deck | 800 × 580 mm / 床から 300 mm | `deck` と `surface` の Z は 0.300 m |
| 色 | RAL 7011 | Iron Gray の近似 sRGB 色 |
| IP | 現行公式ページ: IP21 | カタログ仕様値。モデルは防水・防塵評価を行わない |
| 駆動輪 | r1 数値: 半径 100 mm、トレッド 403 mm | 同値、差動 2 輪 |
| キャスタ | r1 数値: 半径 62.5 mm、トレール 38.2 mm、旋回軸 X +299.215 / −300.485、Y ±188 mm | 半径・トレール・Y は同値、X は ±295 mm の近似。旋回しても公称外形内に収めるため 4.2–5.5 mm 内側に配置 |
| スキャナ / カメラ | 2 / 2 台 | 対角の黒い窓 / 前面の窓。位置は外観の近似 |
| ステータス灯 | 4 面、各角 2 個 | 8 個の表示用窓 |

## 表現範囲と r1 との差

`base_footprint` は接地面、`base_link` は車体。駆動輪とキャスタの 10 関節は
r1 の名前を維持する。駆動輪の配置は同じで、キャスタは上表の近似配置。
ホイールのスポークで回転を視認できる。
従来の `surface` は MiR100 由来の高さ 352 mm だったため、r2 では甲板に合わせて
300 mm に修正した。取付に使う推奨フレーム `deck` は r1 と同じ 300 mm。
未校正の IMU・レーザ・超音波センサフレームは r2 に持ち込まない。

車体 collision は外形の box 1 個。車輪とフォークは表示専用で collision を持たず、
車体内部と車輪の見かけの自己干渉を作らない。通路検証には botrail の Vehicle の
footprint を使う。地上障害物とのタイヤ接触を解く動力学モデルではない。
外装の段差・カメラ窓・フォークは近似。取付穴、コネクタ、保護フィールドは未モデル化。
リンク別の質量・重心・慣性・努力上限は未確認のため省略する。
転動速度上限は 2 m/s ÷ 半径の計算値であり、キャスタ旋回速度は未知のまま。

## 再生成・表示

```sh
npm --prefix mir250/authoring ci
npm --prefix mir250/authoring run export
npm --prefix mir250/authoring test
npm --prefix mir250/authoring run check
python3 -m http.server 8737 --bind 127.0.0.1
# http://127.0.0.1:8737/mir250/authoring/
```

URDF は `urdf/mir250.urdf`。USD は catalog-builder が生成する。
旧 r1 は保持し、独自形状は r2 で使用する。
