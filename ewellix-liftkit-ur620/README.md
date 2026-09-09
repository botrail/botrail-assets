# Ewellix LIFTKIT-UR 620 — 独自形状の参照モデル

参照実機: **LIFTKIT-UR-800-xx00-620**、UR20/UR30向け、800 mmストローク。
xxは電源・電源コードの注文オプションで、本モデルは選定しない。
カタログIDは既存互換のため `ewellix/liftkit/liftkit-ur/r2`。CC0-1.0。
メーカーCAD、第三者のSTL、画像を取り込まず、数値から独自著作した。

出典: [Schaeffler / Ewellix PDB 81製品ブローシャ](https://medias-library.schaeffler-cdn.com/hcms/v4.1/entity/file/1270921/storage/MTI3MDkyMS8wL21hc3Rlci8vLzIyOTc1NzU)
6・7ページとordering key。
[公開ROS構成](https://github.com/clearpathrobotics/ewellix_lift_common/blob/2b27ef90b9ef62f1c011619c444462e73f5f7a1a/ewellix_description/config/ur_620.yaml)
は段ごとの長さとフレーム名の参照。コード・メッシュは複製しない。

| 項目 | 公表値 | 本モデル |
| --- | --- | --- |
| 620型対応ロボット | UR20、UR30 | 620型の上板包絡を描く。取付穴は未実装 |
| ストローク | 800 mm | 400 mm × 2段、upperはlowerのmimic |
| 柱単体の格納長 / 伸長 | 875 / 1675 mm | 同値 |
| 下板 / 上板厚 | 各15 mm | 各15 mm |
| 下板 / UR20・30用上板 | 200 / 251 mm角 | 同値 |
| 段の断面外寸 | 163 / 146 / 129 mm | 同値、角の丸みと肉厚3 mmは近似 |
| 取付面高さ (上記の合計) | 905 / 1705 mm | 同値、既存の格納時mount高さを維持 |
| 質量、620・800 mm構成 | 26 kg | specs値。段別慣性と周辺制御盤・配線の質量は未同定 |
| 最高直線速度 | 55–80 mm/s | 各段0.04 m/s、合計上限80 mm/s |
| 定格押力 / 位置決め | 1500 N / ±1 mm | 仕様値。±1 mmを繰返し精度へ転記しない |

旧r1の675 mm格納長の説明と34.6 kgは601型の資料を混在させたもの。
620型は875 mmなので、従来mount高さ905 mmを200 mm縮める必要はない。
各段0.088 m/sという従来のシミュレーション速度は合計0.176 m/sになるため、r2では修正する。

## 表現範囲

3段の中空押出形状、ワイパ、上下板を独自に作る。
段別の有効長は公開ROS構成に基づく近似で、実機内部のねじ・ガイド・ストッパを再現しない。
collisionは4枚の壁に分け、中空部を維持する。これは詳細な隙間・公差の検証形状ではない。
ボルト穴、URベースへの締結、制御盤、ケーブル、URCap通信は含まない。
仕様上の対応機種と、モデルで取付適合を検証できることは別である。
未確認の段別質量・重心・慣性は省略する。各段のeffortは仕様値を参照した設定で、
2段の値を合計して実機の押力や搭載質量を判定しない。

root `base_link`は下板底面。`lift_lower_joint`が駆動、`lift_upper_joint`がmimic。
`lift_mount`は上板上面、+Z上向き。

## 再生成・表示

```sh
npm --prefix ewellix-liftkit-ur620/authoring ci
npm --prefix ewellix-liftkit-ur620/authoring run export
npm --prefix ewellix-liftkit-ur620/authoring test
npm --prefix ewellix-liftkit-ur620/authoring run check
python3 -m http.server 8737 --bind 127.0.0.1
```

`http://127.0.0.1:8737/ewellix-liftkit-ur620/authoring/` で伸縮を確認できる。
