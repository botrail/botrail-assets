# phoxi

Photoneo PhoXi 3D Scanner M の **URDF エントリファイルだけ** を置くディレクトリ
(CC0-1.0)。メッシュは含まない。

他のアセットと違い、これは自作幾何ではない。メッシュ・キャリブレーション値とも
Photoneo 公式の [photoneo/phoxi_camera](https://github.com/photoneo/phoxi_camera)
(MIT) のもので、カタログのビルド工程が phoxi_camera と本ディレクトリを併せて
取得し、公開カタログの `photoneo/phoxi/phoxi-m` として収録する。

## なぜ要るか

上流の `urdf/PhoXi3Dscanner.xacro` は、マクロの 4 ブロック引数
(`*scanner_origin *sensor_origin *visual *collision`) に「2 要素へ展開される
マクロ呼び出し 1 個」でブロック 2 個分を渡そうとしている。xacro のブロックは
位置渡し・1 要素 1 ブロックなので、ROS 公式 xacro でも xurdfpy でも
"not enough blocks" で展開が失敗する。`urdf/phoxi_m.urdf.xacro` は同じ内容
(M 構成) をブロック機構なしで直接書き下した修正版エントリ。

上流へ修正 PR を出して取り込まれたら、このディレクトリは不要になる。

## 値の出典

すべて上流 `urdf/PhoXi3Dscanner_values.xacro` の M 構成の引き写し:

| 項目 | 値 |
|---|---|
| センサ外部キャリブレーション xyz | `-0.176277236938477 0.0299 0.002164826095` |
| センサ外部キャリブレーション rpy | `0 ${-11.75/180*pi} ${pi}` |
| メッシュ配置 rpy | `0 1.5707 0` (STL 長軸 +Z → ボディ +X) |
| メッシュ scale | `0.001` (mm → m) |
