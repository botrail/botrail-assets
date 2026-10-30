# KUKA KMP 3000P — 独自形状の参照モデル

参照実機: **KUKA KMP 3000P**(全方向移動の重量物 AMR、積載 3 t、昇降 100 mm の電動リフト付き。2 台の
load sharing で最大 6 t)。CC0-1.0。メーカー CAD・図面・画像・ロゴは取り込まず、公表値から独自著作した。
カタログ ID は `kuka/kmp/kmp-3000p/r1`(`vehicle.amr`、公開前)。

出典(2026-10-30 参照、詳細と確認済み／推定の区分は [provenance.json](./authoring/provenance.json)):

- KUKA 製品ページ [KMP 3000P omniMove](https://www.kuka.com/en-de/products/autonomous-mobile-robots-amr/mobile-platforms/kmp-3000p-omnimove)
  と KUKA ニュース「KMP 3000P」— 外形・リフト・速度・旋回半径・停止精度・駆動ユニット・センサ構成
- KUKA 代理店 [Parmley Graham の KMP 3000P ページ](https://www.parmley-graham.co.uk/content/manufacturers/kuka/kuka-robots/autonomous-mobile-platforms-ov/kmp-3000p-omni-ov/)
  — 2 台の load sharing(最大 6 t、片方がマスターになり方向を決める)。**協調の記述は KUKA の現行製品ページには無い**
- 製品ページの製品写真(レンダリング)を外観の参照に目視した。画像は同梱していない

| 項目 | 公表値 | 本モデル |
| --- | --- | --- |
| 外形 (L × W × H) | 2,200 × 1,200 × 370 mm | バンパー外形 2,200 × 1,200、リフト下降時の天板上面 370 mm(テストで固定) |
| 積載 | 3,000 kg(load sharing で 2 台 6,000 kg) | レシピの specs |
| 昇降 | 電動、揚程 100 mm、30 mm/s | `lift` 直動関節 0〜0.100 m、速度上限 0.030 m/s |
| 走行速度 | 空荷 1.2 m/s、積載 1.0 m/s | レシピの specs。車輪関節の速度上限は空荷 1.2 m/s |
| その場旋回半径 | 1.3 m | 外形の半対角 1.253 m(−3.6 %、テストで ±5 % に固定)。原点 = 外形中心 = 旋回中心 |
| 駆動 | 全方向。動力付き旋回キャスタの駆動ユニット 2 組、各 2 輪 | `steer_front` / `steer_rear`(Z 回り continuous)→ 各ユニットの 2 輪を 1 本の車軸 `drive_wheel_front` / `_rear` に。**ユニットの位置(長手軸上 x = ±0.70)と車輪径 Ø200 は推定** |
| 支持輪 | 非公表 | 四隅の従動キャスタ `castor_{fl,fr,rl,rr}`(旋回 `_swivel` + 車輪、Ø125)。**有無・位置・径とも推定** |
| 停止精度 | SLAM ±10 mm / ±1°、QR ±5 mm / ±0.5° | レシピの specs(代理店の SLAM 値は ±15 mm と食い違う。KUKA の値を採った) |
| センサ | レーザスキャナ 2 (前後)、3D カメラ 4 (各側面)、非常停止 6、バンパー | 前左・後右の角のスキャナ(`scanner_front_frame` / `scanner_rear_frame`、角の対角方向を向く)、各面のカメラ窓、非常停止 6(両端の角寄り 4 + 長辺中央 2)。配置は写真からの推定 |
| 質量 | 非公表 | 入れない(リンク別の質量・慣性は省略) |

## 表現範囲と仮定

- **フレーム** `base_footprint`(root、外形中心の床)= botrail の Vehicle 原点、+X = 前(前側スキャナのある端)。
  `deck` = リフト天板の上面(下降 370 mm、上昇 470 mm)、+Z 上向き。荷はこのフレームのリンク `lift_plate` に `attach` する。
- **層の高さ**(推定): 黒いスカート 45〜115 mm(床から 67〜75 mm に銀のバンパー線)、凹んだ帯 115〜160 mm、
  白い外装 160〜350 mm(バンパー外形から 40 mm 内側)、天板 350〜370 mm(外装から 30 mm 内側、2,060 × 1,060)。
  天板の下の昇降部(1,700 × 800 × 100、黒)は上げると見える表示のみ。
- **衝突**: `base_link` = バンパー外形 2,200 × 1,200 をスカート下端 45 mm から外装上端の 2 mm 下まで 1 箱、
  `lift_plate` = 天板 2,060 × 1,060 × 20 の 1 箱。車輪・キャスタは表示のみ(衝突なし)。下降時に両者は 2 mm 離れる。
- **駆動ユニット**: 実機は 1 ユニット 2 輪の差動旋回キャスタだが、botrail は 1 関節 1 輪で車輪を回すので、
  2 輪を同じ車軸の 1 関節にまとめた(ユニット中心の進行で回り、左右輪の差は描かない)。旋回は無制限(continuous)。
- 非常停止・カメラ窓・LED 帯・通気グリル・パネルの継ぎ目・天板の固定点は意匠。ロゴ・銘板・充電パッドは入れない。

## 再生成・表示

```sh
npm --prefix kuka-kmp-3000p/authoring ci
npm --prefix kuka-kmp-3000p/authoring run export
npm --prefix kuka-kmp-3000p/authoring test
npm --prefix kuka-kmp-3000p/authoring run check
```

`authoring/index.html` を `kuka-kmp-3000p/authoring` から HTTP 配信すると、リフトのスライダ付きで表示できる。
