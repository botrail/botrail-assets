# MiR EU Pallet Lift 1350 — 独自形状の参照モデル

参照実機: **MiR EU Pallet Lift 1350**(MiR1350 用トップモジュール。EUR パレット 1,200 × 800 を
Nord/MiR パレットラックから自律で持ち上げる 1 軸リフト)。CC0-1.0。
カタログ ID は `mobile_industrial_robots/mir/eu-pallet-lift-1350/r1`(`vehicle.top_module`)。

出典: [MiR EU Pallet Lift 1350](https://mobile-industrial-robots.com/products/applications/mir-eu-pallet-lift-1350)
(可搬 1,250 kg、1.2 m/s、2026-09-13 参照)、
[Qviro 転記の仕様表](https://qviro.com/product/mobile-industrial-robots/mir-eu-pallet-lift-1350/specifications)
(1,371 × 853 × 154 mm、125 kg、揚程 60 mm)、
[リフトレールの寸法・昇降時間を載せた販売店ページ](https://roboticinnovation.no/mir1350-eu-pallet-lift-3/)
(レール 1,200 × 162 × 87 mm、上昇 4.0 s / 下降 3.2 s、EN 13698-1)。

| 項目 | 公表値 | 本モデル |
| --- | --- | --- |
| モジュール外形 | 1,371 × 853 × 154 mm | 基部枠 1,371 × 853 × 67 + レール 87 = 154 mm |
| 質量 | 125 kg | specs(リンク別の配分は未同定) |
| 揚程 | 60 mm | `lift` 直動関節 0〜0.060 m |
| 昇降時間 | 上昇 4.0 s | 関節速度 0.015 m/s |
| 可搬 | 1,250 kg(MiR1350 上) | specs |
| リフトレール | 1,200 × 162 × 87 mm × 2 | 同寸。**レール間隔 600 mm と基部枠の厚さ 67 mm は推定** |
| 対象パレット | EUR 1,200 × 800(EN 13698-1) | 座面フレーム `pallet` はレール上面の中心 |

## 表現範囲

- root `mount` = 基部枠の底面中心。MiR1350 の `deck` にそのまま載る。
- `pallet` フレームはレール上面(下降時 154 mm、上昇時 214 mm)、+Z 上向き。パレットはこのフレームで
  リンクに `attach` して運ぶ。
- 入口側のガイド 2 個・レール間の横材は意匠。センタリング機構・ホールセンサ・配線は含まない。

## 再生成・表示

```sh
npm --prefix mir-eu-pallet-lift-1350/authoring ci
npm --prefix mir-eu-pallet-lift-1350/authoring run export
npm --prefix mir-eu-pallet-lift-1350/authoring test
```
