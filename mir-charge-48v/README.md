# mir-charge-48v

**MiR Charge 48V**(MiR250/500/600/1000/1350 共用の充電ステーション)の**見た目**を持つアセット(CC0-1.0)。
カタログの `mobile_industrial_robots/mir/charge-48v/r1`(`vehicle.charger`、生成器 `bt.parts.charging_station`)が
`components[].trim` から参照する。

- **メッシュは無い。プリミティブの xacro だけ** — 当たり判定は botrail が置く筐体と充電板が持つ
- 参照実機: [MiR Charge 48V](https://mobile-industrial-robots.com/products/applications/mir-charge-48v)、
  [仕様書 (販売店掲載 PDF)](https://www.fit-robotique.com/wp-content/uploads/2025/09/MiR-Charge-48V-Specifications.pdf)

| 項目 | 公表値 | モデル |
| --- | --- | --- |
| 長さ | 237 mm(充電板込み 487 mm) | 筐体 237 + 板 250 |
| 幅 / 高さ | 622 / 287 mm | 同値 |
| 質量 | 20 kg | specs |
| 入力 / 出力 | AC 100–240 V / DC 48 V、40 A(240 V)・20 A(120 V) | specs |
| 筐体材質 | アルミニウム | 色のみ |

`visual/station.urdf.xacro`: 引数 `length` `width` `height` `plate`(m)。原点は床レベル・筐体中心、+X が充電板側
(ロボットが後退して接続する向き)。接点ブロック・充電バー・状態 LED・板のガイドを描く。
