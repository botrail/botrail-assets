# workshop-shapes — 汎用の形状ライブラリ

工場・倉庫のセルに置く「既成品ではないが普通にある物」のうち、**箱・円筒では描けない形**を
集めたアセット (CC0-1.0)。折り蓋とテープのある段ボール、プレス皿、パンチングのかご、
アジャスタ足、曲げた取っ手、ドレンホース、穴あきの加工ワーク。botrail の
`bt.parts.appearance(scene, name, shape, size)` が、セルの障害物 (衝突用の箱) にこの形を
被せて描く。寸法・配置・衝突・BOM はすべて botrail 側の Python が持ち、**ここにあるのは
形だけ**。

- **参照実機は無い** — 型番もメーカーも名乗らない独自著作 (「市場で一般的な…」を模した
  `mesh-guard` / `medium-rack` と同じ立場)。実在製品の見た目は製品側のアセットが持つ
- **単位箱に正規化** — 各形状は `[-0.5, 0.5]^3` (Z-up・m) に収め、利用側がスケール行列で
  実寸に伸縮する。1 つのファイルが売られている全サイズを描く xacro trim と同じ思想で、
  **検証する寸法をファイルに焼き込まない**
- **1 形状 1 ファイル** (`usd/<name>.usda`)。botrail の `.botrail` は使った stage を丸ごと同梱
  するので、9 形状を 1 ファイルにするとカートン 1 個のセルが全形状を抱える
- **1 ファイル 1 Mesh** (`/Shapes/<name>`) + 仕上げごとの `GeomSubset` + `/Shapes/Looks`。
  botrail の visual asset は描画 prim を 1 つ指す (運ばれる物の見た目は住人 1 個に束ねる)
  ので、部品は 1 メッシュに平坦化し、段ボール・テープ・ラベル・インクの塗り分けを面の
  部分集合として残す
- **干渉には入らない**。当たり判定は botrail が置く箱が持つ

## 形状

| `usd/` | 描くもの | 仕上げ (GeomSubset) | 三角形 |
|---|---|---|---|
| `carton` | 折り蓋・合わせ目・テープ・出荷ラベル・バーコードのある段ボール箱 | kraft / packing_tape / label_paper / label_ink | 588 |
| `workpiece` | 面取りした角ブロックに、段付きの中心貫通穴と取付穴 4 つ (穴は実形状) | machined_aluminium | 2,930 |
| `tray` | 側板を絞ったプレス皿 | brushed_steel | 588 |
| `rim` | 槽の縁の丸めた枠 (中は空) | brushed_steel | 480 |
| `basket` | パンチング板 (穴は実形状 — 向こう側が透ける) | brushed_steel | 2,992 |
| `adjuster` | ゴム足 + 座金 + ねじ軸のレベル調整脚 | rubber / brushed_steel | 864 |
| `panel` | 角を丸めた化粧板 (色は利用側の `tint` で塗り替える前提) | laminate | 108 |
| `handle` | 曲げパイプの取っ手 (XZ 面の U 字、開口は -Z) | brushed_steel | 640 |
| `hose` | 垂れたドレンホース (XZ 面) | rubber | 640 |

三角形数は three 0.185.1 での値。色は linear RGB、metalness / roughness は著作した仕上げで
測定値ではない。

## 利用側の規約

- スケールは**非等方でよい**が、意味が壊れる形は避ける: `workpiece` の穴径は伸縮に追従する
  (60×60×40 のような等方に近い箱に限る)。`handle` / `hose` は太さが最小辺で決まる
- `panel` だけは単色なので `tint` (利用側の色で塗り替え) を想定。他は Looks の仕上げを使う
- 原点は形状の中心。`basket` の床合わせのような位置合わせは利用側の `offset`

## 再生成と検証

[共通著作ライブラリ](../authoring/README.md) (`@botrail/authoring`) を使う。共通部を変えたら
ここでも `npm ci` をやり直す。

```sh
cd workshop-shapes/authoring
npm ci
npm test          # 単位箱・穴の実在・仕上げの部分集合・出力の再現性
npm run export    # ../usd/<name>.usda を書く
npm run check     # 書いてあるファイルが著作ソースと一致するか
npm run view      # http://localhost:8734/viewer.html
```

Node.js 22。出力は three-usd-robot の `serializeUsda` を通し、Float32 の表現ノイズを
1e-7 で丸めてある (単位箱で 0.1 µm)。

## rev 運用

botrail は `python/botrail/_shapes/` にこの `usd/` を**コミット SHA ごと**ベンダリングする
(`scripts/sync_shapes.py`)。形を変えるときは、botrail 側で同期し直して `SOURCES.json` の
SHA を進める。カタログのパックが形を借りる場合も `fetch` の SHA で固定する。
