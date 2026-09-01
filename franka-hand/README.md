# franka-hand

Franka Hand (FR3 gripper) の **展開済み URDF エントリだけ** を置くディレクトリ。
メッシュは含まない — カタログのビルド工程が frankaemika/franka_description
(Apache-2.0) と本ディレクトリを併せて取得し、`franka/hand/franka-hand` として
収録する。

書き下しではなく **上流 xacro の忠実な展開**: ビルダーの xacro エンジン
(xurdf 0.6.4) が inertials.yaml の YAML アンカー (`&finger` / `*finger`) を
まだ読めないため、ROS xacro で既定引数のまま展開した結果を固定した。
xurdf がアンカー対応したらこのファイルは要らなくなる。

License: Apache-2.0 (上流展開物)。
