# psenscan

Pilz PSENscan (PSEN sc M) の **URDF エントリファイルだけ** を置くディレクトリ
(CC0-1.0)。メッシュは含まない。

phoxi / velodyne と同じ立て付けで、これは自作幾何ではない。メッシュは
Pilz 公式の [PilzDE/psen_scan_v2](https://github.com/PilzDE/psen_scan_v2)
(LGPL-3.0) のもので、カタログのビルド工程が psen_scan_v2 と本ディレクトリを
併せて取得し、公開カタログの `pilz/psenscan/psen-sc-m-5-5` として収録する。

## なぜ要るか

上流の `urdf/xacros/psen_scan.urdf.xacro` はマクロ定義のみで、実体化の見本
(`urdf/main.urdf.xacro`) は最大 4 台をデモ配置するセル。さらに上流の
laser フレームは `rpy="pi 0 0"`(X 軸半回転)— デバイスの時計回り角度規約を
ROS LaserScan に合わせる反転で、botrail の lidar 規約(スキャン面 XY・
0°=+X・CCW・+Z 上)とは合わない。`urdf/psen-sc-m.urdf` がデータシート値
(走査面 = 上端 37.7 mm 下、走査軸 = 背面 52.5 mm)から規約どおりの
フレームを直接立てる。

## 座標系

| フレーム | 位置 |
|---|---|
| `mount` | 走査軸直下の底面点(組み立て規約) |
| `laser` | 走査焦点 — 底面の 114.3 mm 上。+X = 0°、CCW、+Z 上 |

メッシュの向きは実測で判定した(奥行 112.5 mm と「軸は背面から 52.5 mm」が
bbox・走査ヘッド円筒中心と 1 mm 以内で整合 → メッシュ正面は −X、
エントリでヨー半回転)。色は実機のイエロー筐体を URDF material で当てる
(メッシュ自身の材質は一律グレーのプレースホルダ)。
