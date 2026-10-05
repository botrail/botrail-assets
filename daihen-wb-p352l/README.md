# ダイヘン Welbee Inverter P350L II (WB-P352L) — 独自形状の参照モデル

参照実機: **ダイヘン デジタルインバータ溶接電源 WB-P352L (Welbee Co-R の 350 A 構成の溶接電源)**。
カタログ `daihen/welbee/wb-p352l/r1`。CC0-1.0。メーカー CAD・画像・第三者メッシュを使わず、取扱説明書の仕様表と外形図から著作した。
WB-P502L (500 A) は同じ筐体寸法で質量と定格が違う。

出典: [WB-P352L / WB-P502L 取扱説明書](https://www.daihen.co.jp/products/welder/pdf/manual/co2_mag/WB-P352L_WB-P502L.pdf)
(sha256 bf47396f524429d38d9d7c43b5f8e34ee2a87b9ea5b6ffbbb7795a76a42c5a21) 2.1.1 仕様・2.1.3 外形図・3.1.1 電源設備。

| 項目 | 出典値 | 本モデル |
| --- | --- | --- |
| 外形 (W × D × H) | 395 × 710 × 640 mm (アイボルト除く) | 筐体 395 × 690 × 580 (床上 60 mm から)。前面パネルを 20 mm 奥に置き、つまみ・ソケットが 710 に収まる。アイボルト +30 mm |
| キャスタ | 外形図から 320 mm 幅 × 460 mm 軸距、後方張り出し 100 mm | Ø80 × 30 の車輪 4 個、接地面 z = 0 |
| 質量 | 54 kg | specs の参照値。慣性は未同定 |
| 定格 | 三相 200/220 V、20.1 kVA、30–350 A、使用率 60 % | specs の値 |

前面のつまみ・表示器・トーチソケットの位置、上面カバー、アイボルトは外形図の見た目から置いたもので寸法の根拠は無い。

## フレーム

- root の `base_link` = 筐体中心直下の床面 (キャスタ接地面)、+Z 上、−Y が前面 (操作パネル側)。
- `mount` = `base_link` と同位置・同向き (床に置く契約)。
- `torch_outlet` = 前面左下のパワーケーブルソケット (ケーブル取り回しの目安。向きは `base_link` と同じ)。

## 再生成・表示

```sh
npm --prefix authoring ci
node daihen-wb-p352l/authoring/export.mjs
node daihen-wb-p352l/authoring/export.mjs --check
python3 -m http.server 8765 --bind 127.0.0.1
```

`http://127.0.0.1:8765/daihen-wb-p352l/authoring/` で確認できる。
