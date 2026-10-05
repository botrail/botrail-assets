# Robotiq PowerPick10 (既定構成) — 独自形状の参照モデル

参照実機: **Robotiq PowerPick10 真空グリッパの既定構成 #1 (0 mm オフセットプレート + 200 mm 中空オフセットリンク + 小型カップブラケット + Ø77.5 ベローズカップ 4 個、手首延長無し)**。
カタログ `robotiq/powerpick/powerpick-10/r1`。CC0-1.0。メーカー CAD・画像・第三者メッシュを使わず、取扱説明書の外形図と表から著作した。
真空発生ユニットは [robotiq-powerpick10-vacuum-unit](../robotiq-powerpick10-vacuum-unit) に分けた。

出典: [PowerPick10 Instruction Manual (2024-02-12)](https://assets.robotiq.com/website-assets/support_documents/document/PowerPick10_user_manual_PDF_SN_PPD-XXXX_20240212.pdf)
(sha256 ea58e9492e84d1492c5860770f63fd7118d32a0d4ca0c888737070169328d2b1) Fig. 5-8 (0 mm オフセットプレート)、Fig. 5-9 (既定構成の外形)、5.2.1 / Table 5-2 (TCP・質量)。

| 項目 | 出典値 | 本モデル |
| --- | --- | --- |
| 外形 | 346.7 × 227.5 × 157.6 mm (Fig. 5-9) | 344.9 × 227.5 × 157.6 (ホース端 −63.5 mm、実機は −65.3) |
| カップ | Ø77.5 × 4、外々 162.7 (X) × 227.5 (Y) | ピッチ 85.2 × 150、ベローズは回転体 |
| TCP | (200, 0, 140) mm、フランジ基準 (Table 5-2) | `tcp` = (200, 0, 140)、カップ吸着面 `cup_n_contact` も z = 140 |
| オフセットプレート | 125 × 63 × 8.84、ISO 9409-1-50-4-M6 (Fig. 5-8) | 長辺をリンクと直交する向き (Y) に置く (上面図から) |
| ホースエルボ | 取付面から 17 mm 突出 (157.6 − 140.6) | Ø75 手首の外側 (x = −50、y = ±35) に 16 × 16 × 17.6 の箱 |
| 質量 | 1.2 kg (Table 5-2 構成 3、既定行には質量が無い) | specs の参照値。慣性は未同定 |

中空リンクの断面 (60 × 30)、ブラケットの形、ホースの取り回しは図の見た目から置いたもので寸法の根拠は無い。ホースに衝突形状は無い。
他の 41 構成 (オフセットリンク長、ブラケット、手首延長) は TCP と質量が変わる。

## フレーム

- root の `mount` = 0 mm オフセットプレートのロボット側面の中心、+Z がカップ側へ向く。+X がリンクの延びる向き。
- `tcp` = カップ群の中心 (200, 0, 140)。
- `cup_1`〜`cup_4` = 各カップ (固定リンク)、`cup_n_contact` = カップ吸着面の中心。

## 再生成・表示・テスト

```sh
npm --prefix authoring ci
node robotiq-powerpick10/authoring/export.mjs
node robotiq-powerpick10/authoring/export.mjs --check
node --test robotiq-powerpick10/authoring/model.test.mjs
python3 -m http.server 8765 --bind 127.0.0.1
```

`http://127.0.0.1:8765/robotiq-powerpick10/authoring/` で確認できる。
