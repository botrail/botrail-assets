# OnRobot RG6 v2 — 独自形状の参照モデル

参照実機: **OnRobot RG6 v2、標準指**。カタログ `onrobot/rg/rg6/r2`。
CC0-1.0。メーカーCAD・画像・第三者メッシュを使わず、数値寸法から著作した。

出典:

- [OnRobot公式データシート v2.0](https://onrobot.com/storage/datasheets/rg6/datasheet_rg6_v2.0_en.pdf)、2・8ページ。
- [公開ROS設定](https://github.com/inria-paris-robotics-lab/onrobot_ros/blob/9c6ce32d84bd903d59120c2a95d4a115d6e33cde/onrobot_description/config/rg6_v2.yaml)の関節原点の数値。
  コード・URDF・メッシュは複製せず、独自の生成器に数値だけを記述する。

| 項目 | 出典値 | 本モデル |
| --- | --- | --- |
| 調整可能な全ストローク | 160 mm (データシートv2.0) | 160.01 mm、閉時0 mm、丸め誤差0.05 mm未満 |
| 閉時の全長 | 262 mm | 262 mm |
| 開時の全長 | 208 mm | 約208 mm |
| 最大幅 / 本体厚 | 212 / 42 mm | 約213 / 42 mm。ピン端部等は近似 |
| 標準指の閉時合計厚 / 幅 | 16.8 / 30 mm | 8.4 mm × 2 / 30 mm |
| データシート質量 | 1.25 kg | specsの参照値。ブラケット込み質量とリンク慣性は未同定 |
| 力把持の可搬質量 / 把持力 | 6 kg / 25–120 N | カタログ仕様値。接触・把持力モデルではない |
| ブラケット→body、body→grasp_frame | 56.1 / 212 mm (公開ROS設定) | 同値、固定TCPの高さ268.1 mm |
| moment / truss / tip原点 | (-23.8,0,88) / (-10.5,0,111.1) / (-55.03,0,58.07) mm | 同値 |

製品ページの150 mm表記とデータシートv2.0の160 mm表記を混ぜない。本revは後者を参照する。
メーカー指令の幅mmと本モデルの関節radは別の値。
`rg6_v2_gripper_joint=0`が開、`1.3`が閉。0.5 rad/s、effort=10は従来モデルの
シミュレーション設定で、実機の最大速度・出力トルクを示さない。
ミラー・平行リンクはmimic、対向指の平行と開閉を維持する。

## 表現範囲

body、ブラケット、指の丸み、ピン、ゴムは独自の近似形状。
接触面を公表ストロークと全長に合わせ、指の局所形状は第三者メッシュと異なる。
固定TCPは既存のデータムを維持するため、可動する指端の位置とは一致しない。
rootの`mount`はブラケットの工具側接触面、+Zは工具内部へ向く。`tcp`は既存の
`rg6_v2_gripper_grasp_frame`と同位置の固定リンク。
Quick Changerは包絡のみ。UR用アダプタ、ねじ穴、配線、安全スイッチ、指の弾性は含まない。
mountの名前だけでURへ直結できるとは判定しない。

collisionはリンクごとのboxで、開いた指の間を単一の凸包で塞がない。
筐体全体を保証付きで包絡する形状ではなく、狭い隙間の適合判断には使えない。
未確認のリンク質量・重心・慣性は省略している。

## 再生成・表示

```sh
npm --prefix onrobot-rg6/authoring ci
npm --prefix onrobot-rg6/authoring run export
npm --prefix onrobot-rg6/authoring test
npm --prefix onrobot-rg6/authoring run check
python3 -m http.server 8737 --bind 127.0.0.1
```

`http://127.0.0.1:8737/onrobot-rg6/authoring/` のスライダーで開閉を確認できる。
形状はThree.js→OBJ/MTL、関節はURDF、配布用USDはbuilderで生成する。
