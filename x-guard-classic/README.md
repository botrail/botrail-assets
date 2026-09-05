# Axelent X-Guard Classic — visual trim

実在する X-Guard Classic を参照した CC0 の独自著作モデル。メーカーCAD・写真の
複製ではなく、カタログが選んだ寸法のパネルを描く。Premium は対象外。

| 項目 | 公表値 | モデル |
| --- | --- | --- |
| パネル高 | 1300 / 1900 / 2200 / 2400 mm | 同じ4種類 |
| パネル幅 | 250〜1500 mmの13種類（1300高には2200幅もある） | 共通13種類のみ |
| 枠断面 | 30 × 20 mm | 見付30・奥行20 mm |
| 金網 | 50 × 30 mm、縦線Ø3・横線Ø2.5 | 同じ開口・線幅、角断面に簡略化 |
| 支柱 | 50 × 50 mm | 同じ、パネル高＋100 mm |
| 床隙間 | 100 mm | 配置元の botrail がパネル原点を持ち上げる |
| 仕上げ | パネルRAL9011、支柱4標準色 | 色選択に対応（画面上の近似色） |

出典: [パネル公式データシート](https://www.axelent.com/en/downloads/product-datasheets/f4d6f01c-bdf7-4ff4-8168-4a42a862e746)、
[支柱公式データシート](https://www.axelent.com/en/downloads/product-datasheets/f86c4491-fa24-45c4-8b99-8a8692f64984)。

`visual/panel.urdf.xacro`: 引数 `width`, `height` はm、`handle` は0/1。
原点はパネル下端中央（床ではない）。Xが横幅、Zが上。
`visual/post.urdf.xacro`: `height` は床からの支柱全高m、`post_finish` は
`graphite-black`, `zinc-yellow`, `signal-blue`, `traffic-red`。
共通マクロ `equipment-common/` と相対参照先の `meshes/` を同梱すること。

金網は全52サイズを生成済み。1枚1メッシュ、最大1,200三角形で、穴は実際に開いている。
全体スケーリングを使わないので、幅を変えても線幅・枠断面・開口は変化しない。
50×30の方向は公式外観を参考に横×縦と解釈している。溶接点、丸い線断面、
三方の支柱穴は省略。ブラケット・足カバー・アンカー形状と寸法は外観近似で、施工図には使えない。

扉表示はD10キットを用いた開口の概念図。扉パネル・ハンドル・ロックは別売で、
キットのBOM行に含まれない。動作、インターロック、安全距離の適合は保証しない。
visual自体にはcollisionを与えず、botrail側のパネルスラブ・支柱を使用する。

再生成: リポジトリ直下で `npm --prefix authoring ci` の後、
`node x-guard-classic/authoring/export.mjs`。`--check` は生成済みSTLとの一致確認。
`--usd /tmp/x-guard-grid.usda` で同じ金網を three-usd-robot から出力できる。
