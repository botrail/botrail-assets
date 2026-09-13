# MiR1350 — 独自形状の参照モデル

参照実機: **Mobile Industrial Robots MiR1350**(パレット級 AMR、可搬 1350 kg)。CC0-1.0。
メーカー CAD・第三者メッシュ・図面は取り込まず、公表値から独自著作した。
カタログ ID は `mobile_industrial_robots/mir/mir1350/r1`(`vehicle.amr`)。

出典: [MiR1350 specifications](https://mobile-industrial-robots.com/products/robots/mir1350/specifications)
(2026-09-13 参照)。DFKI の `mir_robot` は MiR100/250 のみで、本機の公開記述は無い。

| 項目 | 公表値 | 本モデル |
| --- | --- | --- |
| 外形 L × W × H | 1,350 × 910 × 322 mm | 同値(衝突ボックスも同じ外形) |
| 質量 / 可搬 | 244 kg / 1,350 kg | レシピの specs(リンク別の質量・慣性は未同定のため省略) |
| 最高速度 | 1.2 m/s(最大可搬時) | specs |
| 地上高 | 25–27 mm | 27 mm(車体下面 z = 0.027) |
| 荷台面 | 1,304 × 864 mm | 上面プレートの寸法に採用 |
| 駆動輪 / キャスタ | φ200 / φ100 | 同径。トレッド 720 mm・キャスタ位置 (±520, ±330) は写真からの推定 |
| 安全スキャナ | SICK microScan3 × 2(対角) | 前左・後右の角に 112 mm 角の筐体(表示のみ) |
| 3D カメラ | 前面 2 台 | 前面の小さなレンズ窓(表示のみ) |
| トップモジュール取付面 | **非公開** | `deck` = z 192 mm。Nord Pallet Rack (EU) の床→パレット 348 mm の下に EU パレットリフト(154 mm)ごと潜れる高さから逆算した**仮定** |
| 推奨通路(単機 / すれ違い) | 1,800 / 3,500 mm | セル側の検証で使う数値(モデルには入れない) |

## 表現範囲

- `base_link` = 上部カバーを外しても残るシャシ(z 27〜192 mm)。`top_cover` は**別リンク**で、
  トップモジュール(パレットリフト等)を載せるときは利用側がこのリンクを非表示・干渉オフにする。
- 車輪 6 個は表示のみ(collision 無し)。車両は botrail の Vehicle としてシャシの箱で通路検査され、
  車輪の回転は `Scene.set_vehicle_wheel` に半径(0.100 / 0.050)を渡して付ける。
- フレーム: `base_footprint`(root、接地面)、`deck`(トップモジュール取付面 +Z)、`cover_top`(カバー上面 322 mm)。
- 光の帯・スキャナ窓・カメラ窓は意匠の近似で、センサの視野や保護フィールドを表さない。

## 再生成・表示

```sh
npm --prefix mir1350/authoring ci
npm --prefix mir1350/authoring run export     # meshes/*.obj + urdf/mir1350.urdf
npm --prefix mir1350/authoring test
python3 -m http.server 8737 --bind 127.0.0.1   # http://127.0.0.1:8737/mir1350/authoring/
```
