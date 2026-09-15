# gear-cover-set — GH-160 ギヤハウジングとカバーの見た目

カタログの `botrail/workpiece/gear-cover-set/r2` (`workpiece`、生成器 `workpiece`) が
`components[].visual` から参照する USD レイヤ (CC0-1.0)。botrail の組立デモのワーク。

- **参照実機は無い** — レシピの設計値そのもの (図面のある製品ではない)。ハウジング 160 × 120 × 60
  (アルミ) に M5 雌ねじ 6 とノックピン穴 2、カバー 160 × 120 × 10 に φ45 × 30 の軸受ボス
- **`trim` ではなく `visual`**: ワークは把持されて運ばれる 1 住人なので、装飾を別の住人で足すのでは
  なく、生成器の衝突形状 (ハウジングは箱、カバーは板 + ボスの複合) に **描画 prim 1 つを束ねる**。
  絵は住人と一緒に動き、`.botrail` にも USD 書き出しにも付いていく
- **穴は実形状**: ハウジング上面の雌ねじ 6 (φ5、深さ 13 の止まり穴 — 壁と底を暗く描く) と
  ノックピン座 2 (φ6)、カバーの通し穴 6 (φ5.5) とピン穴 2 (φ6.1)。ねじが穴に入って見える。
  ノックピンそのものは生成器の円筒 (`<name>/dowel/p0` …) が立つ
- **干渉には入らない**。当たり判定は生成器の箱と複合が持つ

| prim | 原点 (部材の frame) | 描くもの |
|---|---|---|
| `/GH160/housing` | ブロックの中心 (z ∈ [−0.030, 0.030]) | 角丸の底フランジと上フランジ (中央に開口)、4 面の壁、外側の冷却リブ、雌ねじの止まり穴、ピン座 |
| `/GH160/cover` | 底面の中心 (z ∈ [0, 0.040]) | 角丸の板と通し穴・ピン穴、ボスの根元のフィレット・ボス・上端の面取り |

仕上げは `cast_aluminium` (鋳肌)、`machined_aluminium` (切削面)、`bore` (穴の中)。
色は linear RGB、metalness / roughness は著作した値で測定値ではない。

## 再生成と検証

```sh
cd gear-cover-set/authoring
npm ci
npm test          # 包絡・穴の実在 (レイで確認)・prim 構成・出力の再現性
npm run export    # ../usd/gh-160.usda
npm run check
npm run view      # http://localhost:8735/viewer.html
```

[共通著作ライブラリ](../authoring/README.md) (`@botrail/authoring`) を使う。寸法を変えるときは
`model.mjs` の `DIM` とレシピの `dimensions_mm` / `mounting` を一緒に変え、新 rev にする。
