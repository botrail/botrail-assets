# velodyne

Velodyne VLP-16 (Puck) の **URDF エントリファイルだけ** を置くディレクトリ
(CC0-1.0)。メッシュは含まない。

phoxi と同じ立て付けで、これは自作幾何ではない。メッシュ・マクロとも
Dataspeed Inc. の
[velodyne_simulator](https://github.com/ToyotaResearchInstitute/velodyne_simulator)
(BSD-3-Clause) の `velodyne_description` パッケージのもので、カタログの
ビルド工程が velodyne_simulator と本ディレクトリを併せて取得し、公開カタログの
`velodyne/puck/vlp16` として収録する。

## なぜ要るか

上流の `urdf/VLP-16.urdf.xacro` はマクロ定義のみ。実体化の見本
(`urdf/example.urdf.xacro`) は VLP-16 と HDL-32E の 2 台を 0.5 m 角の
箱ベースに載せるデモセルで、単体製品のエントリにならない。さらに
マクロの visual が参照する同梱 DAE は `id="<STL_BINARY>"` の生の山括弧を
含む不正 XML で、どの COLLADA パーサでも読めない。

`urdf/vlp16.urdf` はマクロの
リンク・ジョイント構成 (衝突シリンダ、焦点高 37.7 mm) をそのまま書き下し、
visual を同梱の正常な .stl に差し替え (色は URDF material で付け直し)、
カタログの組み立て規約 (root リンク = mount = 筐体底面中心) の上に
1 台だけ立てる。上流へ DAE 修正 PR が取り込まれたらマクロ実体化に戻せる。

## 座標系 (上流マクロの定義そのまま)

| フレーム | 位置 |
|---|---|
| `mount` | 筐体底面の中心 (マクロ parent の原点) |
| `velodyne` | 走査焦点 — 底面の 37.7 mm 上 (datasheet の optical center)。+X = 0°、スキャン面 XY (ROS laser 規約) |

上流が HDL-32E / VLP-32C のマクロも同梱しているので、需要が出たら
同じ形のエントリを足すだけで収録できる。
