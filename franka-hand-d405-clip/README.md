# franka-hand-d405-clip — D405 を Franka Hand に留めるクリップ

Intel RealSense D405 を Franka Hand (FR3 世代) の広い面に留める、プリント前提のクリップ
(CC0-1.0)。**参照実機は無い**独自著作で、型番もメーカーも名乗らない。botrail の
卓上 RL 例 (`examples/rl/tabletop_env.py`) の手先カメラの見た目として作った。

## 形

- 手首フランジの下にある**丸いカップリングリング** (R 31.5、z 0〜7.5) の側面をカラーで抱え、
  その下をレッジで引っかける。フランジ面 (z 0) から 2.2 mm 離す
- ハンドの**広い面** (+x、x ≈ 18.3) に 4 mm のプレートで沿う。凹んだ帯 (z 12〜27) の上に窓
- **下端の丸み**に沿って回り込み、指スロットの脇の**底面**を 3 mm のリップで引っかける
  (指からは 3 mm 離す)
- 足元の**座**が D405 を底面の 1/4-20 ねじ点で受ける。光軸を手の軸へ **30°** 倒す
  (指先が画面の中ほど、真下の物が画面の反対寄りに入る)。座は左右のガセットと中央の
  リブで面板から持ち出し、背面にストップ

手の面との隙間は 0.6 mm。当たる面は `authoring/hand-envelope.json` に**実測値**
(カタログ `franka/hand/franka-hand/r1` の `hand.obj` と `franka/fr/fr3` の `fr3_link7` を
ハンド座標でラスタ化) として置き、テストがクリップの全頂点を照合する。

## 座標と使い方

`usd/clip.usda` の `/Clip/clip` (Mesh 1 つ、材質 `/Clip/Looks/pa12`) は **`fr3_hand` リンク
座標・メートル**で書いてある (+z がフランジから指へ、+x がカメラ側の面)。

- botrail は `examples/assets/franka_hand_d405_clip.usda` にベンダリングし、手に attach した
  衝突しない住人に `set_obstacle_visual_asset` で被せる (変換 = その住人のハンド座標
  オフセットの逆)。当たり判定はツメとプレートの箱 2 つ + カメラ自身のメッシュ
- D405 のマウント座標 (底面ねじ点、x = 光軸・y = 横・z = 底面から上) は、ハンド座標で
  原点 **(33.8, 0, 38.0) mm**、光軸 `(−sin 30°, 0, cos 30°)`、上 `(cos 30°, 0, sin 30°)`
  (`clip.mjs` の `SEAT`)。カメラ本体の包絡 (`D405`) は realsense2_description の値
- 質量の目安 28 g (PA12 約 27 cm³)

## 再生成と検証

```sh
cd franka-hand-d405-clip/authoring
npm ci
npm test          # 手の実測面との隙間・カメラとの非干渉・座の位置・出力の再現性
npm run export    # ../usd/clip.usda を書く
npm run check     # 書いてある層が著作ソースと一致するか
```

Node.js 22。共通部は [`@botrail/authoring`](../authoring/README.md)。形を変えたら botrail 側の
ベンダリング (`examples/assets/franka_hand_d405_clip.usda`) も差し替える。
