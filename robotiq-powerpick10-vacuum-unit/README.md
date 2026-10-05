# Robotiq PowerPick10 Vacuum Generation Unit — 独自形状の参照モデル

参照実機: **Robotiq PowerPick10 の真空発生ユニット (ベンチュリ・電磁弁・フィルタレギュレータ入りの壁掛け筐体)**。
カタログ `robotiq/powerpick/powerpick10-vacuum-unit/r1`。CC0-1.0。メーカー CAD・画像・第三者メッシュを使わず、取扱説明書の外形図から著作した。

出典: [PowerPick10 Instruction Manual (2024-02-12)](https://assets.robotiq.com/website-assets/support_documents/document/PowerPick10_user_manual_PDF_SN_PPD-XXXX_20240212.pdf)
(sha256 ea58e9492e84d1492c5860770f63fd7118d32a0d4ca0c888737070169328d2b1) Fig. 5-1 (外形)、5.2.1 (質量)。

| 項目 | 出典値 | 本モデル |
| --- | --- | --- |
| 筐体 | 220 幅 × 160 奥行 (レギュレータ込み 182) × 260 高さ | 同寸の箱、前面にレギュレータ Ø48 × 22 |
| 全高 | 352 (吊りブラケット〜底面継手)、継手下端まで 293 | ブラケット耳 59 を上に、継手 33 を下に出す |
| 配管 | 12 mm 外径チューブ (入・出) | 底面の継手 2 本とエルボ (見た目のみ、衝突無し) |
| 質量 | 6.7 kg | specs の参照値。慣性は未同定 |

レギュレータ・つまみ・スイッチ・継手の位置は図の見た目から置いたもので寸法の根拠は無い。

## フレーム

- root の `mount` = 筐体背面 (壁・柱側) の中心、+Z が筐体の内側 (前方)、+Y が上。
- `air_out` = 真空出口継手の先端 (グリッパへのチューブの起点)。

## 再生成・表示

```sh
npm --prefix authoring ci
node robotiq-powerpick10-vacuum-unit/authoring/export.mjs
node robotiq-powerpick10-vacuum-unit/authoring/export.mjs --check
python3 -m http.server 8765 --bind 127.0.0.1
```

`http://127.0.0.1:8765/robotiq-powerpick10-vacuum-unit/authoring/` で確認できる。
