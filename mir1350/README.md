# MiR1350 — 独自著作の参照モデル

参照実機: **Mobile Industrial Robots MiR1350**（可搬 1,350 kg のベース AMR）。CC0-1.0。
2026-10-09 時点の公式製品ページに掲載された**黒い車体・グレーの荷台面の外観**を参照。
メーカー CAD・第三者メッシュ・図面・画像テクスチャ・ロゴは取り込まず、形状は独自著作した。
公式ページにはハードウェア版が明記されていないため、特定 HW 版への適合は保証しない。

既存カタログ ID は `mobile_industrial_robots/mir/mir1350/r1`（`vehicle.amr`）。
この外観改訂は**新 rev 用の未公開ソース**。既存 r1 のピン留め SHA は変更しない。

## 出典と採用値

- [公式仕様](https://mobile-industrial-robots.com/products/robots/mir1350/specifications)
- [公式製品ページ](https://mobile-industrial-robots.com/products/robots/mir1350)
- [仕様ページからリンクされた公式製品画像](https://a.storyblok.com/f/230581/2000x1248/c78fdbb2b7/mir1350-transparent.png)
- [製品ページ掲載アニメーション](https://a.storyblok.com/f/230581/x/a4074a1920/mir1350base-hero.mp4)

全て 2026-10-09 確認。画像・動画は外観観察のみで、リポジトリや配布物に含めない。
複製禁止条項付きマニュアルは寸法・形状の著作ソースに使っていない。
詳細は `authoring/provenance.json`。

| 項目 | 公表値 | 本モデル |
| --- | --- | --- |
| 外形 L × W × H | 1,350 × 910 × 322 mm | visual 全体の包絡も同値。車輪接地点 z=0 |
| 質量 / 可搬 | 244 kg / 1,350 kg | 既存レシピの specs。未確認のリンク別慣性は追加しない |
| 最高速度 | 1.2 m/s | 既存 specs |
| 地上高 | 25–27 mm | 車体コア下面 z=27 mm |
| 荷台面 | 1,304 × 864 mm | グレー上面の XY 寸法に採用。上面パッドを含む最高点 322 mm |
| 車体色 | RAL 9005 / Jet Black | 黒系 PBR 材質。画面上の sRGB 値は RAL の測色保証ではない |
| 安全スキャナ | SICK microScan3 × 2 | 前左・後右の低い光学窓を独自近似。保護領域はモデル化しない |
| 3D カメラ | 2 台 | 前中央の 2 本の縦型光学窓。位置・傾き・形状は概略 |
| 表示灯 | 4 面の状態灯、角に計 8 個の信号灯 | 細い青帯 4 本と縦型白色窓 8 個。動作や安全機能は無い |
| 駆動輪 / キャスタ径 | 今回の公開ページでは確認できない | 既存 φ200 / φ100 mm を互換性のため維持。公表値とは扱わない |
| 車輪トレッド / キャスタ位置 | 非公開・未検証 | 既存 720 mm / (±520, ±330) mm を維持 |
| トップモジュール取付面 | 非公開・未検証 | `deck` = z=192 mm の従来仮定を維持。実機取付寸法ではない |

## 今回の外観改訂

- 白い積層箱を、黒い独立コーナーポッド・長い側板・奥まった上部筐体へ変更
- 荷台の張り出し、グレーの天板、8 枚のパッド、2 枚のアクセス蓋、細い合わせ目を追加
- 黄色い角箱を、水平の隙間に収まる対角スキャナ窓へ変更
- 前面の縦型カメラ部、8 個の角信号灯、青い状態灯、赤黄の停止ボタンを表現
- 輪郭半径、継ぎ目、カメラ筐体、ボタン、天板の小部品、車輪色は写真からの独自近似
- 天板の小点は浅いねじ頭の意匠。取付穴・ねじ規格・ピッチの証明ではなく、機能的な穴を生成しない
- 背面の詳細が選定画像に写っていないため、後部サービス面は簡略表現

## 互換性と限界

`urdf/mir1350.urdf` は main `5a715e3` と**バイト一致**。リンク・フレーム名、
関節原点・軸・可動設定、collision、未同定の慣性を省略する扱いは変更しない。

- `base_footprint`: 接地面の root。+X が前、+Y が左、+Z が上
- `base_link`: 下部車体とセンサ。衝突箱は z=27〜192 mm の従来値
- `top_cover`: 別リンク。従来どおりトップモジュール利用時に非表示・干渉オフにできる
- `deck`: z=192 mm。パレット搭載側との旧互換仮定で、メーカー確認済みの取付面ではない
- `cover_top`: z=322 mm
- 6 車輪: 表示のみ、collision 無し。回転半径 0.100 / 0.050 m とジョイント契約を維持
- 実機の内部構造、荷重・接触挙動、走行性能、センサ視野、制御・停止機能は再現しない

外観包絡を満たすことと、実機への取付適合・安全性は別。寸法検査や安全検証に単独使用しない。

## 再生成・表示

Node.js 22 以降。リポジトリルートから:

```sh
npm --prefix mir1350/authoring ci
npm --prefix mir1350/authoring run export
npm --prefix mir1350/authoring test
npm --prefix mir1350/authoring run check
python3 -m http.server 8737 --bind 127.0.0.1
# http://127.0.0.1:8737/mir1350/authoring/
```

OBJ の大きさを抑えるため、対象内の `compact-obj.mjs` は同一オブジェクト内の重複属性を
損失なく整理する。丸め・デシメーションは無い。全頂点コーナー・法線・UV・材質・オブジェクト順序の
意味的完全一致と、Three.js OBJLoader 読込後の属性一致をテストする。

静止レンダリング（Blender 4.x、OBJ/MTL に無い PBR 値を補う）:

```sh
node mir1350/authoring/export-materials.mjs > /tmp/mir-materials.json
blender -b -t 5 --python mir1350/authoring/render_review.py -- \
  mir1350/urdf/mir1350.urdf /tmp/mir-iso.png --view iso --materials /tmp/mir-materials.json
```

[比較](docs/before-after.png) / [多方向](docs/detail-views.png) / [検証記録](docs/verification.md)
