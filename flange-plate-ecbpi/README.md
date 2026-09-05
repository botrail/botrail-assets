# flange-plate-ecbpi

**取付仕様の訂正 (2026-09-05)**: 現行 ECBPi の公式寸法図は **4-M4 / PCD 46 mm**。
この旧モデルは3穴であり、実機への適合を保証しない。
[ECBPi r2 候補の調査記録](../vacuum-gripper-ecbpi/authoring/README.md) を参照。
公開済み r1 の再現用に形状は維持するが、新しい4穴 ECBPi モデルとの互換は主張しない。

ロボットフランジ (ISO 9409-1-50-4-M6) と Schmalz CobotPump ECBPi を繋ぐ
アダプタプレートの自作アセット。CC0-1.0。

## なぜ必要か

`vacuum-gripper-ecbpi` は取付が **3 x M4 / ボルト円 ø46** で **ISO 9409-1 ではない**ため、
ロボットフランジに直付けできない。これは実機の姿そのままで、Schmalz も実機では
ロボット別のフランジプレートを同梱/別売している。

**カタログ側で ECBPi のインタフェースを ISO へ描き替えるのではなく、
実在するアダプタを別アセットにして繋ぐ** — botrail-assets の「実機忠実が優先」規約に従う。

```
ロボットフランジ (ISO 9409-1-50-4-M6)
  -> [plate.mount .. plate.flange]        flange-plate-ecbpi   (8 mm)
  -> [ecbpi.mount .. ecbpi.tcp]           vacuum-gripper-ecbpi (118 mm)
```

## 参照実機

**Schmalz ROB-SET ECBPi** に同梱されるフランジプレート
([UR+ 掲載](https://www.universal-robots.com/plus/products/schmalz/ecbpi-cobotpump/) の
"flange plate suited for all UR3 / UR5 / UR10")。

### 公開データで確定している値

| 面 | インタフェース | 出典 |
|---|---|---|
| ロボット側 | **ISO 9409-1-50-4-M6** (外径 63 / ボルト円 50 x 4-M6 / 位置決め径 31.5 / ダウエル 6) | 公開規格。OMRON i837 (Techman TM5) のフランジ図と一致確認済み |
| ツール側 | **3 x M4 / ボルト円 ø46** | Schmalz ECBPi 取説 §4.5 の Dmk1 / G1 |

### 設計値 (公開データが無い部分)

**ROB-SET のプレート単体の寸法は公開されていない。** 当方の設計値は次の 2 つだけ:

- **板厚 8 mm** — M4 / M6 の座ぐりが成立する最小厚
- **外径 ø63** — ISO 呼び 50 のフランジ外径に合わせた

質量 0.06 kg も ø63 x 8 のアルミ板から見積もった値。

## 設計上の注記

ISO の M6 穴 (P.C.D 50) と ECBPi の M4 穴 (P.C.D 46) は**半径がほぼ重なる**ので、
角度をずらして逃がしてある (M6 = 0/90/180/270°、M4 = 45/165/285°)。
最小角度差 15° = 半径 24 mm で約 6.3 mm しかなく、**実機のアダプタプレートも
同じ制約を抱える**箇所。

## 生成

```sh
python flange-plate-ecbpi/tools/generate_meshes.py
```

板は回転体 (閉じた `(r, z)` 輪郭) なので中央通し穴 ø10 と位置決めスピゴットが
ブーリアン無しで出せる。ダウエルピンとボルトは後付け。
