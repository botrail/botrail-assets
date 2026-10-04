# workshop-shapes — 汎用の形状ライブラリ

工場・倉庫のセルに置く「既成品ではないが普通にある物」のうち、**箱・円筒では描けない形**を
集めたアセット (CC0-1.0)。折り蓋とテープのある段ボール、プレス皿、パンチングのかご、
アジャスタ足、曲げた取っ手、ドレンホース、穴あきの加工ワーク、T スロット押出材とその L ブラケット、人、
カゴ台車、オリコンの袖。botrail の
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
| `tote` | KLT (小型容器) のリブ付きスリーブ: 外皮・縦リブ・段積み縁と底帯・両端の取っ手・カードポケット。**内側と底は開いている** — 壁と床は利用側の箱で、その少し外側に被せる (奥行きは辺の比率なので 300 / 600 mm で釣り合う) | polypropylene (tint 前提) | 708 |
| `tslot` | T スロットのアルミフレーム押出材: 正方形断面、各面に溝 1 本、中空の芯。x・y が断面、z が切断長で、利用側が断面と長さを別々に伸縮する (30 角と 60 角で同じ見え方、溝幅は辺の 27 %)。両端は開いた実形状。黒アルマイトは `tint` | machined_aluminium (tint 前提) | 184 |
| `tslot_2` | 同じ系統の 1 : 2 の矩形押出材 (30 角系の 30×60): 短辺の面に溝 1 本、長辺の面に溝 2 本 (1/4 の位置)、溝の対ごとに芯穴、その間に空洞。x が短辺、y が長辺、z が切断長で、利用側が x を短辺・y を長辺に伸縮する。溝の形は `tslot` と同じ | machined_aluminium (tint 前提) | 320 |
| `bracket` | T スロットフレームのダイカスト L ブラケット: 直角の 2 枚のフランジにボルト穴 1 つずつ (実形状)、両側に三角のリブ。**折り目の角が単位箱の (−x, −y) の角**、フランジは +x と +y へ、幅は z。利用側が (脚, 脚, 幅) に伸縮し、その角を部材どうしの入隅に置く (botrail `frame_unit` の流儀)。比率は 30 角系の 28×28×20 (板厚 4.5、穴は角から 20) | machined_aluminium | 240 |
| `roll_cage` | 2 面のカゴ台車 (ロールボックスパレット)。間口 1.10 (x)・奥行 0.80 (y)・全高 1.70 で描き、床面は 0.243 (40 mm の角パイプ枠にリブ付きの床板、φ150 のキャスター 4 輪)、間口の両端に網の側枠 (上の角を曲げた 32 mm パイプの逆 U・横桟 4 本・縦線 約 85 mm)、長辺の 2 面は開いている。床面の比率 (0.243 / 1.70) を保って使う (botrail `bt.parts.roll_container`) | zinc_steel / zinc_deck / rubber / caster_hub | 5,164 |
| `orikon` | 折りたたみコンテナ (オリコン) の袖: 0.530 x 0.366 x 0.321 (50B の比率) で描いた 4 面の折りたたみ壁 (下にヒンジの帯、長辺にリブ枠、短辺の上に手掛け穴 — 穴は実形状)、角の丸み、スタック縁、内側に入った底の帯。**内側と底は開いている** (`tote` と同じく、壁と床は利用側の箱。botrail `bt.parts.bin` が `sleeve="orikon"` で被せる) | polypropylene (tint 前提) | 1,776 |
| `pod` | 棚搬送型 AGV (GTP) の在庫棚の収納部: 0.956 角 (1.0 m の棚の 40 mm 支柱の内側)・高さ 1.822 で描いた 6 段の布製ビン (段ごとに 3〜5 個、前縁にラベル) を 4 面に並べ、奥は X 字の仕切りまで (面の中央のビンは深く、角は浅い)、上に天板。**支柱・AGV が持ち上げる下枠・上枠は描かない** — 利用側 (botrail `bt.parts.mobile_rack`) が実寸の断面で描き、この形はその間に伸ばす | pod_yellow / pod_yellow_inner / pod_pocket / pod_partition / label_white | 5,796 |
| `person` / `person_reach` / `person_pick` | 人 (身長 1.75 m で描いた男性、ニット・ジーンズ・革靴、+x を向く): 立ち / 両手を腰の前に出して物を扱う / 胸の高さの棚のビンに右手を伸ばす。手は掌・指 4 本・親指、頭は顔・耳・髪。**比率を崩して伸ばさない** — 利用側は姿勢ごとの寸法 (下表) で等倍に縮尺し、足元の点に合わせる (botrail `bt.parts.person`) | knit_oatmeal / knit_rib / denim / denim_seam / shoe_leather / sole_rubber / skin / lips / eye_white / eye_dark / hair | 6,748 |

三角形数は three 0.185.1 での値。色は linear RGB、metalness / roughness は著作した仕上げで
測定値ではない。

人の形の、正規化する前の寸法 (m、原点は両足の間の床、x が正面、y が左):

| `usd/` | 外形 (x, y, z) | 外形の中心 |
|---|---|---|
| `person` | 0.3859 × 0.5344 × 1.7407 | (0.0564, 0, 0.8702) |
| `person_reach` | 0.5146 × 0.5487 × 1.7373 | (0.1208, 0.0045, 0.8685) |
| `person_pick` | 0.8349 × 0.5581 × 1.7319 | (0.2778, 0.0411, 0.8658) |

## 利用側の規約

- スケールは**非等方でよい**が、意味が壊れる形は避ける: `tslot` は x・y (断面) を等倍、z (長さ) だけ別に伸ばす (botrail `bt.parts.frame_unit` の流儀 — 長さ軸は回転行列で部材の向きに合わせる)。`tslot_2` は x を短辺・y を長辺 (= 短辺の 2 倍)。`bracket` は (脚, 脚, 幅) で、折り目の角を入隅に合わせるのは利用側の平行移動。 `workpiece` の穴径は伸縮に追従する
  (60×60×40 のような等方に近い箱に限る)。`handle` / `hose` は太さが最小辺で決まる。`tote` は箱の 1.03 倍に伸ばして被せる (botrail `bt.parts.bin` の流儀)
- `panel` だけは単色なので `tint` (利用側の色で塗り替え) を想定。他は Looks の仕上げを使う
- 人 (`person*`) は非等方に伸ばさない: 上表の寸法を身長の比で等倍に縮め、中心を足元から上表の位置へずらして置く
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
