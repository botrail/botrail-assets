# OnRobot RG2 — 独自形状の参照モデル

参照実機: **OnRobot RG2 (品番 102012、ツール側 Quick Changer 内蔵の現行筐体、標準フィンガーチップ PN 100669)**。
カタログ `onrobot/rg/rg2/r1`。CC0-1.0。メーカー CAD・画像・第三者メッシュを使わず、数値寸法から著作した。
RG6 の参照モデル (`onrobot-rg6`) と同じ平行リンク構成の生成器で、製品固有の数値だけを差し替えている。

出典:

- [OnRobot RG2 データシート v1.8](https://onrobot.com/storage/datasheets/rg2/datasheet_rg2_v1.8_en.pdf)
  (sha256 f9a5fb15fba873b4c4ca645fb5627dcce1f8f8b87102d77bbf873f7a6688dfac)、2 ページの仕様表と 9 ページの外形図。
- [公開 ROS 記述 (大阪大学 原田研究室、MIT)](https://github.com/Osaka-University-Harada-Laboratory/onrobot/blob/46fae3557dd3aff678adf6b3320ec1338493d84a/onrobot_rg_description/urdf/onrobot_rg2_model_macro.xacro)
  の関節原点の数値 (外側ナックル z 125.797 mm、内側ナックル z 142.297 mm、アーム 55.0 mm)。
- [公開 ROS 設定 (inria onrobot_ros、MIT)](https://github.com/inria-paris-robotics-lab/onrobot_ros/blob/9c6ce32d84bd903d59120c2a95d4a115d6e33cde/onrobot_description/config/rg2_v1.yaml)
  のアーム先端ベクトル (−25.6, 0, 48.68) mm と開位置の角度 −0.772 rad。コード・URDF・メッシュは複製せず、数値だけを生成器に記述する。

| 項目 | 出典値 | 本モデル |
| --- | --- | --- |
| 全ストローク (調整可) | 110 mm (データシート v1.8) | 110.00 mm、閉時 0 mm (閉じ角 1.30524 rad をストロークから解いた) |
| 閉時の全長 | 213 mm | 213.0 mm (mount = ツール側 QC 面からパッド先端まで) |
| 外形 | 213 × 149 × 36 mm | 開時の幅 154.5 mm (ピン端まで)、本体厚 36 mm、QC 部 Ø71 |
| ブラケット上部の幅 | 75 mm | 75 mm |
| フィンガーチップ アダプタ幅 | 14 mm | 14 mm |
| 標準フィンガーチップ (EPDM) | 20.2 × 29.8 × 11.4 mm (アダプタ溝込み) | 20.2 × 29.8 mm、ゴム厚 7 mm |
| 質量 | 0.78 kg | specs の参照値。リンク質量・慣性は未同定 |
| 可搬質量 / 把持力 | 2 kg (摩擦) / 5 kg (形状)、3–40 N | カタログ仕様値。接触・把持力モデルではない |
| 把持速度 | 38–127 mm/s | 関節の velocity 0.5 rad/s、effort 10 は RG6 と同じシミュレーション設定で、実機の定格ではない |

mount → 外側ナックルの高さは公開 ROS 記述の 125.797 mm を採り、ブラケット (QC 12 mm + チルトブラケット 14 mm + ネック 13 mm = 39 mm)
と本体の分割はデータシートの外形 (213 − 174 mm) に合わせた当方の割り付け。ブラケットのチルト機構、QC のラッチ、穴パターンは作っていない。

## フレーム

- root の `mount` = ツール側 Quick Changer の接合面 (ロボット側 109498 と合う面)。+Z がツール内部へ向く。
- `rg2_v2_gripper_joint` = 0 が開、1.30524 が閉。鏡像側と平行リンクは mimic で、対向パッドの平行と開閉を維持する。
- `tcp` = `rg2_v2_gripper_grasp_frame` = 閉時のパッド中心 (mount から 198.1 mm)。パッドは開閉で 37.9 mm 上下するので、
  可動する指端の位置とは開時に一致しない (開時のパッドは 145.3–175.1 mm)。
- 完全閉時は対向パッド同士が接触する。空のグリッパの干渉なし経路の終点には、1.30524 rad 未満の開口を残した姿勢を使う。

## 表現範囲

本体、ブラケット、アーム、ピン、ゴムは独自の近似形状。接触面を公表ストロークと全長に合わせ、
局所形状は第三者メッシュと異なる。collision はリンクごとの box で、開いた指の間を単一の凸包で塞がない。
筐体全体を保証付きで包絡する形状ではなく、狭い隙間の適合判断には使えない。
未確認のリンク質量・重心・慣性は省略している。UR 用ケーブル、安全シールド、指の弾性は含まない。

## 再生成・表示

```sh
npm --prefix authoring ci
node onrobot-rg2/authoring/export.mjs
node onrobot-rg2/authoring/export.mjs --check
node --test onrobot-rg2/authoring/model.test.mjs
python3 -m http.server 8737 --bind 127.0.0.1
```

`http://127.0.0.1:8737/onrobot-rg2/authoring/` のスライダーで開閉を確認できる。
形状は Three.js → OBJ/MTL、関節は URDF、配布用 USD はカタログのビルド工程で生成する。
