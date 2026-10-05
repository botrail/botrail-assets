# ダイヘン BLUE TORCH III BT350RD-30D + Welbee Co-R トーチマウント TMCU-01 — 独自形状の参照モデル

参照実機: **ダイヘン Welbee Co-R (協働ロボット溶接パッケージ) のトーチ部 = 自動機用カーブドトーチ BT350RD-30D (ケーブル 3.0 m) を
トーチマウント TMCU-01 (フリードライブスイッチ付き) に載せた組立**。カタログ `daihen/bt350/bt350rd-30d-tmcu01/r1`。CC0-1.0。
メーカー CAD・画像・第三者メッシュを使わず、パーツリストの定格表とカタログの構成品表・写真から著作した。

出典:

- [BLUE TORCH III 自動機用 パーツリスト (zip)](https://www.daihen.co.jp/products/welder/pdf/manual/torch/blue_torch3_auto.zip) 内の
  `BT350RD-15D,20D,25D,30D(1U6818-1(J)).pdf` (sha256 1bb379b8b7643596b5777b485bf99526dc5c9a9fa9bbe2de64d77cfd3ad8c3da) — 定格仕様。
- [Welbee Co-R カタログ B222001B](https://www.daihen.co.jp/products/welder/pdf/cor/Welbee_Co-R.pdf)
  (sha256 60d2135de35458342f35485543ddc0da3f1b4a53ea6773a3db9ae2ae4fa4ed69) — 構成品表 (TMCU-01、RBCU-01、IFR-800EI) と写真。

| 項目 | 出典値 | 本モデル |
| --- | --- | --- |
| 定格電流・使用率 | 350 A、CO2 60 % / MAG 35 % | specs の参照値 |
| 適用ワイヤ | 0.9–1.4 mm (1.2 mm チップ組込) | ワイヤ突出し Ø1.2 × 15 mm を描く |
| ノズル内径 | Ø16 | ノズル外径 Ø24 × 65 mm (真鍮色) |
| 質量 | 3.3 kg (ケーブル 3.0 m 込み、TMCU-01 は非公表) | specs の参照値。慣性は未同定 |
| トーチマウント TMCU-01 | 寸法図なし (カタログ写真のみ) | ISO 9409-1-50-4-M6 の Ø63 × 10 プレート + 70 × 60 × 40 ブラケット + 56 × 56 × 40 クランプ、+Y にフリードライブ用ハンドル Ø24 × 112 |
| ネック形状 | 非公表 (カーブドトーチ) | 直線 110 mm → R50 で 45° 曲げ → 60 mm → ノズル。ワイヤ先端はマウント面から (113.6, 0, 334.4) mm |

ブラケットとクランプの寸法、曲げ半径・角度、ケーブルの取り回しは写真からの近似で、寸法の根拠は無い。実機のスティックアウトは
溶接条件で変わるので、`tcp` は教示で上書きする前提。

## フレーム

- root の `mount` = TMCU-01 のロボット側プレート面の中心、+Z がトーチ側へ向く。
- `tcp` = ワイヤ先端 (スティックアウト 15 mm)。+Z がワイヤの進行方向 (マウント面の +Z から +X 側へ 45° 倒れる)。
- `torch_tip` = コンタクトチップ先端 (スティックアウト無し)。向きは `tcp` と同じ。

## 再生成・表示

```sh
npm --prefix authoring ci
node daihen-bt350rd-tmcu01/authoring/export.mjs
node daihen-bt350rd-tmcu01/authoring/export.mjs --check
python3 -m http.server 8765 --bind 127.0.0.1
```

`http://127.0.0.1:8765/daihen-bt350rd-tmcu01/authoring/` で確認できる。
