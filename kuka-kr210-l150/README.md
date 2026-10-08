# KUKA KR 210 L150-2 — 独自形状の参照モデル

参照実機は **KUKA KR 210 L150-2 (Series 2000、床置き)**。CC0-1.0。
6 軸の外装を Three.js で独自著作し、OBJ / MTL / URDF に出力する。
メーカー CAD、ROS-I メッシュ、NVIDIA USD、第三者の写真・寸法図・テッセレーションは含まない。

この形状改訂は **次版 r3 の候補**。公開済み `kuka/kr210/kr210-l150/r2` の
ピン留め SHA やカタログ登録は変更していない。新しい形状を配布する際は別 rev を切る。
`L150-2 K` (棚置き) の形状は参照していない。

## 出典と確度

- [KUKA 公開製品データシート (2007、公開ミラー)](https://www.construnario.com/ebooks/9365/hojas%20de%20datos/kr%20210-2,%20kr%20210%20l180-2,%20kr%20210%20l150-2/files/kr%20210-2,%20kr%20210%20l180-2,%20kr%20210%20l150-2.pdf): 床/天井仕様の L150-2 を明記。公称寸法と A6 フランジの数値を参照。図は複製しない
- [KUKA PF0022/E/1/0709 (2009、公開ミラー)](https://archiv.robolution.eu/letoltes.php?name=1085-kuka-kr-210-l180-2-robot-adatlap.pdf&type=media): L150-2 の寸法表。表紙写真は短い KR 210-2 なので、L150-2 の腕長の根拠にはしない。[旧公式 URL](https://www.kuka.com/-/media/kuka-downloads/imported/6b77eecacfe542d3b736af377562ecaa/pf0022_kr_2102_en.pdf)
- [Goedicke の現物写真](https://www.goedicke.com/new-arrivals/7-46705-en.html): [銘板](https://www.goedicke.com/images/product_images/original_images/7-46705-type.jpg)に `KR 210 L150-2 2000`、2007-07、`FLOOR` を確認。[肩・バランサ側](https://www.goedicke.com/images/product_images/original_images/7-46705-b.jpg)と[反対側](https://www.goedicke.com/images/product_images/original_images/7-46705.jpg)で鋳物・モータ・延長部を確認。写真は閲覧用の参照に限り、リポジトリ/配布物には含めない
- [ROS-Industrial の数値運動学](https://github.com/ros-industrial/kuka_experimental/blob/54444a29c50fee342efd4f76c00265fa02c4155a/kuka_kr210_support/urdf/kr210l150_macro.xacro): 既存モデルの関節原点・軸・計画用制限の数値を維持。ソースコードや形状は複製しない

機械可読の出典、適用範囲、推定箇所は [authoring/provenance.json](authoring/provenance.json)。
鋳物断面、丸み、裸の台座外形、モータ寸法、バランサのアンカー位置は **写真からの独自推定**。
詳細寸法をメーカー実測値と見なしてはいけない。1006 × 1006 mm の設置寸法を
そのまま裸の台座外形にはしていない。個体の溶接工具、大径ドレスパック、追加金具は省略した。

## 採用した値

| 項目 | 公表値 / 既存契約 | 本モデル |
|---|---|---|
| 公称可搬 / リーチ | KUKA: 150 kg / 3100 mm | 仕様値。荷重性能の検証ではない |
| A2 高さ / A1–A2 水平距離 | KUKA: 750 / 350 mm | 既存 ROS-I フレームを維持。外装スケールの照合に使用 |
| A2–A3 / A3–A5 軸交点距離 | KUKA: 1250 / 1500 mm | 既存原点を維持。L150-2 の長い前腕を表現 |
| 標準 KR 210-2 に対する延長 | G=1500−1100=400 mm、現物写真でも延長部確認 | 前腕の鋳物と長い筒状部を分けて著作。接合位置・径は推定 |
| A5 軸交点→工具面 | KUKA: 230 mm | A5→A6 192.5 + A6→tool0 37.5 mm を維持 |
| A6 外径 / パイロット凹部 | KUKA: Ø200 / Ø100、深さ 8 mm | 同公称値の実形状 |
| A6 ねじ穴 | KUKA: 6×M10、PCD160、60° 間隔、深さ 14 mm | Ø10 の平滑な有底穴で近似。ねじ山は省略 |
| A6 位置決め穴 | KUKA: Ø10、深さ10 mm、隣のねじ穴から30° | 同公称値の有底穴。A6 ゼロに対する時計位置は参照上の約束 |
| A1 原点 | ROS-I: (−2.62, 0.97586, 330.99) mm | 同値 |
| A2 / A3 相対原点 | (352.77, −37.476, 419.2) / (−0.098483, −147.5, 1249.9) mm | 同値 |
| A4 / A5 / A6 相対原点 | (957.95, 184, −55.059) / (542, 0, 0) / (192.5, 0, 0) mm | 同値 |
| ROS-I 系軸範囲 A1…A6 | ±185°, −45…85°, −210…65°, ±350°, ±125°, ±350° | 同値。メーカーの電気的原点・A2/A3 範囲に置換しない |
| ROS-I 速度制限 | 123 / 115 / 112 / 179 / 172 / 219 °/s | 同値。メーカー定格負荷時速度ではない |
| ゼロ姿勢 flange 原点 | 既存モデル | (2080.001517, −0.00014, 1944.79176) mm |
| flange 法線 | 既存モデル | ゼロ姿勢 +X。flange 自身の +Z が外向き |

## 形状改訂と互換性

- 黒い四角い足とオレンジ円筒を、オレンジの裾広がり台座・黒い円すい状スカートへ変更
- 箱と細いテーパだった肩/上腕を、曲がった肩鋳物、開いた三日月状の頬、平たい連続面を持つ可変断面へ変更
- 肘後方の3モータと側面駆動部、長い延長筒、開口を持つ手首フォークを追加
- フランジは公表値に基づくパイロット凹部と有底穴を実形状化。接触面/フレームは変更しない

`base_link`、`link_1` … `link_6`、`Link1`、`tool0`、`flange` と全関節を維持。
生成 URDF は基準コミット `e1565dd` と **バイト一致**する。
つまり原点、回転符号、可動域、速度、接続、collision の定義を変更していない。
`tool0` の微小な軸外オフセット (Z −0.23924 mm) もそのまま。
穴の公称値は再現するが、公差・ねじはめあい・実機での時計位置や ISO 適合を保証しない。
台座の取付穴は確実なインターフェース寸法を採用していないため省略。

### バランサ: viewer と URDF の差

肩のバランサは回転台と上腕の両方に接続する非線形な閉ループ機構。
通常の URDF mimic だけでは正しく記述できず、固定円筒を入れると A2 を動かした際に外れる。
そこで **URDF には剛体の支持金具/ピンだけ**を含め、追加の自由度やコントローラを要求しない。

ブラウザ viewer の [scene.mjs](authoring/scene.mjs) だけに、2つのアンカーから
角度と露出ロッド長を求める可視化用バランサを加えた。A1/A2 に追従し、チェックボックスで外せる。
アンカー・シリンダ寸法は写真に基づく推定で、実機ストローク、ばね、力、衝突形状ではない。
viewer の姿勢画像は、この URDF との差を明記して使う。

collision は従来の独立 box / cylinder のままで、精細外装の完全な包絡にはしていない。
干渉安全の検証には使用できず、細部やバランサの掃引、製造公差を表さない。
質量・重心・慣性・モータトルク・可撓ケーブルは未確認のため省略。
姿勢計画用の参照モデルであり、実機校正・動力学・サイクルタイムの保証はない。

## 再生成・検証・表示

リポジトリのルートで:

```sh
npm --prefix kuka-kr210-l150/authoring ci --ignore-scripts --no-audit --no-fund
npm --prefix kuka-kr210-l150/authoring test
npm --prefix kuka-kr210-l150/authoring run export
npm --prefix kuka-kr210-l150/authoring run check
python3 -m http.server 8737 --bind 127.0.0.1
# http://127.0.0.1:8737/kuka-kr210-l150/authoring/
```

14項目のモデルテストは全 URDF 契約、独立に固定した5姿勢の全リンク行列 (上下限を含む)、
鋳物メッシュの閉鎖/法線、655姿勢のバランサ接続、有底穴の深さ、再生成のバイト一致を確認。
これは自己干渉や実機安全性のテストではない。
実ブラウザでの UI 試験は環境のソケット制限で未実施。
[検証記録](docs/verification.md)、[変更前後](docs/before-after.png)、[viewer 姿勢](docs/viewer-poses.png) を参照。

Blender 4.x がある場合の再現可能なレビュー画像 (追加 Python パッケージ不要):

```sh
blender -b -t 6 --python kuka-kr210-l150/authoring/render_review.py -- \
  kuka-kr210-l150/urdf/kuka-kr210-l150.urdf /tmp/kuka-urdf.png --view side
node kuka-kr210-l150/authoring/export-review.mjs /tmp/kuka-viewer.json reach viewer
blender -b -t 6 --python kuka-kr210-l150/authoring/render_review.py -- \
  /tmp/kuka-viewer.json /tmp/kuka-viewer.png --snapshot
```

カメラ/照明は比較用に固定。レビュー用 `.blend` も出力するが配布 URDF には使わない。
URDF は `urdf/kuka-kr210-l150.urdf`。カタログ USD は従来どおり catalog-builder が生成する。
