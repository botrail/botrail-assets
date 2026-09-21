# KUKA KR 210 L150-2 — 独自形状の参照モデル

参照実機は **KUKA KR 210 L150-2 (Series 2000、床置き)**。CC0-1.0。
6 軸の外装を Three.js で独自著作し、OBJ / MTL / URDF に出力する。
メーカー CAD、ROS-I メッシュ、NVIDIA USD、そのテッセレーションは含まない。
カタログ ID: `kuka/kr210/kr210-l150/r2`。

## 出典と採用値

- [KUKA Series 2000 公開製品データシート](https://www.kuka.com/-/media/kuka-downloads/imported/6b77eecacfe542d3b736af377562ecaa/pf0022_kr_2102_en.pdf): 型番・可搬・リーチ。旧 URL は現在 Download Center に転送される場合がある。
- [ROS-Industrial の数値運動学](https://github.com/ros-industrial/kuka_experimental/blob/54444a29c50fee342efd4f76c00265fa02c4155a/kuka_kr210_support/urdf/kr210l150_macro.xacro): 関節原点・軸・計画用制限の数値のみを参照。ソースコードや形状は複製しない。

| 項目 | 参照値 | 本モデル |
|---|---|---|
| 公称可搬 / リーチ | KUKA: 150 kg / 3100 mm | カタログ仕様値。荷重性能の検証ではない |
| 軸数 | 6 | `joint_a1` … `joint_a6` |
| A1 原点 | ROS-I: (−2.62, 0.97586, 330.99) mm | 同値 |
| A2 / A3 相対原点 | (352.77, −37.476, 419.2) / (−0.098483, −147.5, 1249.9) mm | 同値 |
| A4 / A5 / A6 相対原点 | (957.95, 184, −55.059) / (542, 0, 0) / (192.5, 0, 0) mm | 同値 |
| ROS-I 系軸範囲 A1…A6 | ±185°, −45…85°, −210…65°, ±350°, ±125°, ±350° | 同値。メーカーの A2/A3 原点とは異なる |
| ROS-I 速度制限 | 123 / 115 / 112 / 179 / 172 / 219 °/s | r1 と同じ計画用値。メーカー定格負荷時速度ではない |
| ゼロ姿勢の flange 原点 | 上記数値の順運動学 | (2080.001517, −0.00014, 1944.79176) mm |
| flange 法線 | r1 と同じ工具出力方向 | ゼロ姿勢で +X。フレーム自身の +Z が外向き |
| 外装・台座・出力面径 | 詳細寸法は未確認 | オレンジの鋳物、黒いモータ、金属面を独自の面取り箱・円筒・テーパで近似 |

## 表現範囲

`base_link`、`link_1` … `link_6`、`Link1`、`tool0`、`flange` は旧 r1 の名前を維持。
NVIDIA 変換で生じた小さな浮動小数誤差は使わず、ROS-I の数値と単位軸に戻す。
`tool0` の微小な軸外オフセット (Z −0.23924 mm) も維持する。
フランジのねじ・位置決め穴は未確認のため描かず、ISO 規格適合も宣言しない。
ボルトに見える台座の円形部は外観の近似で、締結仕様を持たない。

collision は独立した box / cylinder の近似。完全な包絡、ケーブルの掃引、
製造公差を表さない。ケーブルとバランサ機構は省略。
各リンクの質量・重心・慣性・モータトルクは未確認のため省略する。
姿勢計画用の参照モデルであり、実機校正・動力学・サイクルタイムの保証はない。

## 再生成・表示

リポジトリのルートで:

```sh
npm --prefix kuka-kr210-l150/authoring ci
npm --prefix kuka-kr210-l150/authoring run export
npm --prefix kuka-kr210-l150/authoring test
npm --prefix kuka-kr210-l150/authoring run check
python3 -m http.server 8737 --bind 127.0.0.1
# http://127.0.0.1:8737/kuka-kr210-l150/authoring/
```

URDF は `urdf/kuka-kr210-l150.urdf`。USD は catalog-builder が生成する。
旧 r1 を変更せず、独自形状は r2 で使用する。
