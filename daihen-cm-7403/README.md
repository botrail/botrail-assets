# ダイヘン ワイヤ送給装置 CM-7403 — 独自形状の参照モデル

参照実機: **DAIHEN CM-7403**。CC0-1.0 の独立した手続き形状。
カタログ ID `daihen/cm/cm-7403/r2`（公開前）。旧外観の `r1` は以前のコミットを固定参照する。

## 今回採った公表値と出典

[メーカー製品ページ](https://www.daihen.co.jp/products/welder/wirefeeder/wirefeeder.html)
の CM-7403 欄と [同型番の公式写真](https://www.daihen.co.jp/products/welder/img/A-B-M-17.jpg)
を 2026-10-09 に確認した。画像は目視参照のみで、写真・図面・CAD・ロゴ・テクスチャを同梱していない。
制限付き取扱説明書から新しい寸法を採っていない。

| 項目 | 現行製品ページの公表値 | 本 visual |
| --- | --- | --- |
| 幅 × 奥行 × 高さ | 254 × 611 × 393 mm | 全 visual 包絡 254 × 611 × 393 mm |

**上表以外のすべての形状寸法は推定**。公式の旧
[M500G カタログ](https://www.daihen.co.jp/products/welder/pdf/co2_mag/m500g.pdf)
も補助的に見たが、同資料の 207 × 588 × 372 mm は現行ページと異なるため採用していない。
写真の構成差も未解明であり、反対側のカバーを含め実機の完全再現とはしない。
[出典と不確かさの記録](./authoring/provenance.json)。

## 2026-10-09 の外観改修

- 箱状だった筐体を、薄い青緑のベース、側面フレーム、明灰色の傾斜カバー、濃色の前面パネルに分けた
- 白系フランジ、開いたハブ部、3 本のスポーク、銅色の巻線、ロック部から成るスプールを独立生成
- 細い後部支柱、幅方向の握り、側面の送給部、低い位置の真鍮色接続口を追加
- メーカー名、ロゴ、銘板文字は複製していない

[同条件の前後比較](./docs/before-after.png) / [側面・後部・前面の詳細](./docs/detail-views.png)。
比較の前後でカメラ・照明・材質変換は共通。

## 保持した互換情報と重要な限界

リンク、固定関節、`base_link` / `mount` は main `9c3c564` と同じ。2026-10-10 に `torch_outlet_frame` と collision を新しい visual に合わせて改訂した。
`base_link` は取付面の旧原点、+Z が上、+Y が前。`mount` は同位置・同方向。
`torch_outlet_frame` は写真に合わせた前面下側の接続口の前面中心 `[0.052, 0.3175, 0.115]`、+Z が前方 (+Y)（旧値 `[0, 0.3295, 0.200]`）。

ただし旧モデルは現在の著作規約が避ける取扱説明書を出典にしていた。
取付パターン・スプール傾きなどの旧定数は**互換維持のために残す未検証値**であり、
今回採った公表寸法や実機への取付適合を意味しない。

- 接続口の位置は写真からの推定で、実測の工具・ケーブル接続データムではない
- collision は visual 全体を囲む 5 個の box（前面下部の筐体、傾斜面の下の上部、傾斜面の前側、スプールの区画、握り）で、
  公表外形 254 × 611 × 393 mm の内側に収まる。傾斜面の上や丸いスプールの角の空間も含む包絡なので、
  穴・側面空間の干渉判定や安全評価には使わない（旧 collision は外側に張り出したスプールの円柱を持ち、新 visual から最大 96 mm はみ出していた）
- 青い側面には透明なカバーがある可能性がある。写真だけでは確定できず、この opaque OBJ/MTL 系では
  透明板を省略して側面の空間・送給部を近似表示。開放状態を実機仕様として主張しない
- 反対側の明灰色カバー、ローラ、支柱、ハブ、巻線、15° の軸傾斜は推定。スプールは汎用の表示モデルで、
  実物アクセサリ型番・最大容量・巻線量は保証しない
- 動作、速度、質量、重心、慣性、耐荷重、寸法公差は今回検証していない。可動関節は追加していない

## 再生成・確認

Node.js 22 以降。共通著作ライブラリの依存を準備して実行する。

```sh
npm --prefix authoring ci --ignore-scripts --no-audit --no-fund
npm --prefix daihen-cm-7403/authoring run export
npm --prefix daihen-cm-7403/authoring test
npm --prefix daihen-cm-7403/authoring run check
python3 daihen-cm-7403/authoring/verify_obj.py
python3 -m http.server 8765 --bind 127.0.0.1
```

`http://127.0.0.1:8765/daihen-cm-7403/authoring/`。
10 件のテストは旧 URDF の SHA-256、包絡寸法、主要部位、有限座標・法線、巻線とフランジの間隔、
握りの離隔、生成物一致、OBJ 全面コーナー情報の非破壊圧縮を確認。
独立 Python 検査は各 component の閉鎖性、面の向き、正体積、ゼロ面積を確認する。

```sh
node daihen-cm-7403/authoring/export-materials.mjs > /tmp/cm7403-materials.json
blender -b -t 4 --python daihen-cm-7403/authoring/render_review.py -- \
  daihen-cm-7403/urdf/daihen-cm-7403.urdf /tmp/cm7403.png \
  --view iso --materials /tmp/cm7403-materials.json --samples 64
```

静止画は Blender 4.x による実 OBJ/URDF のレンダー。この環境ではブラウザ UI 操作は未検証。
Node テストと静止画をブラウザ動作確認とは扱わない。
