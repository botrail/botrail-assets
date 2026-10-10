# botrail-assets

[botrail](https://github.com/botrail/botrail) の公開カタログ
[`botrail/botrail-catalog`](https://huggingface.co/datasets/botrail/botrail-catalog)
に収録している**自作アセットのソース**。ベンダーがオープンな 3D モデルを配布して
いない機材 (スポット溶接ガン、ツールチェンジャ、真空グリッパ、ワークピース等) を、
実機の公表仕様に合わせて独自に著作している。

- **ライセンス: 全ファイル CC0-1.0** ([LICENSE](./LICENSE)) — 帰属表示なしで商用含め自由に利用可
- 各アセットは**参照実機を 1 つ定め、公表されている寸法・仕様に一致させた独自著作**
  (メーカー CAD の複製ではない)。どの値をどこから採ったか・意図的に変えた点は、
  各アセットの README に表で明記してある
- 形式: URDF + STL (visual / collision 分離済み)。Z-up、メートル単位

> **2026-08-22 追加**: `mesh-guard/` `belt-conveyor/` `medium-rack/` は
> **メッシュを持たないアセット**。設備品 (安全柵・
> コンベア・棚) は寸法を指定して買うので形状ファイルにできず、代わりに
> **プリミティブの xacro が寸法から絵を組み立てる**。カタログの
> `components[].trim` から参照され、botrail 側は `Scene.load_urdf` で
> `$(arg …)` に寸法を渡して展開する (干渉には入らない装飾)。

## 使い方

**このリポジトリのファイルを直接使う必要はない。** ビルド・検証済みのパッケージが
Hugging Face の公開カタログに載っているので、botrail からはそちらを使う:

```python
import botrail as bt

gun = bt.Robot.from_catalog("weld-gun-x1")  # カタログ ID (下表の右列) で解決される
```

ここはそのカタログの**ソース側**。カタログのビルド工程が各アセットをコミット SHA で
ピン留めして取得し、ビルド・検証を経て上記の公開カタログへ収録する。

## アセット一覧

| アセット | 種別 | 参照実機 (寸法・仕様の出典) | カタログ ID (`from_catalog` に渡す名前) |
|---|---|---|---|
| [weld-gun-x16005](./weld-gun-x16005) | サーボスポットガン (X 型 / シザー式, 1 DOF) | HERON DB6-075-X16005-00 | `weld-gun-x1` |
| [weld-gun-xr637](./weld-gun-xr637) | サーボスポットガン (C 型 / 直動, 1 DOF) | Milco XR 637-12402-15 | `weld-gun-c1` |
| [tool-changer-sws011](./tool-changer-sws011) | ツールチェンジャ (マスタ + ツール側) | SCHUNK SWS-011 (SWK-011 / SWA-011) | `tool-changer-sws011-master` / `-tool` |
| [vacuum-gripper-ecbpi](./vacuum-gripper-ecbpi) | 電動真空グリッパ (4 カップ) | Schmalz CobotPump ECBPi | `vacuum-gripper-ecbpi` |
| [flange-plate-sws011](./flange-plate-sws011) | アダプタ: ISO 9409-1-50-4-M6 ↔ SWS-011 | SCHUNK A-SWK-011-ISO-A50 | `flange-plate-sws011` |
| [flange-plate-ecbpi](./flange-plate-ecbpi) | アダプタ: ISO 9409-1-50-4-M6 ↔ ECBPi | Schmalz ROB-SET ECBPi 同梱プレート | `flange-plate-ecbpi` |
| [biw-sedan](./biw-sedan) | ワークピース: BIW (コンパクトセダン) | — (独自著作) | `biw-sedan` |
| [spindle-emsf3060](./spindle-emsf3060) | 切削スピンドル (フランジ付きモータ) | ナカニシ EMSF-3060K | `spindle-emsf3060` |
| [ati-rcv250-crx-kit](./ati-rcv250-crx-kit) | スピンドル＋取付プレート2点 | ATI 9150-COB-CRX10-RCV250-01 / RCV-250 | `rcv-250-crx10-kit` / `rcv-250` / `3700-50-9210` / `9005-50-6091` |
| [kuka-kr210-l150](./kuka-kr210-l150) | 6軸アームの独自参照形状 | KUKA KR 210 L150-2 | `kuka/kr210/kr210-l150/r2` |
| [kawasaki-bx250l](./kawasaki-bx250l) | 6軸アーム＋平行リンクの参照モデル | Kawasaki BX250L-B001 / GUN BRACKET 160 | `kawasaki/bx/bx250l-b001/r2` (詳細外観 r3 準備中・未公開) |
| [fanuc-m410ic-185](./fanuc-m410ic-185) | 4軸パレタイザ、鋳物腕・前面の立体凹部・開口ペデスタル・平行リンクを持つ参照モデル | FANUC M-410iC/185 (ペデスタル形) | `fanuc/m410ic/m410ic-185/r1` |
| [fanuc-sr-3ia](./fanuc-sr-3ia) | 4軸スカラロボット、J3 直動のボールねじスプラインとケーブルホースの参照モデル | FANUC SR-3iA (床置き) | `fanuc/sr3ia/sr-3ia/r1` |
| [nimak-multiframegun](./nimak-multiframegun) | 片側開閉の取付参照モデル＋指定ボルト10本 | NIMAK 95.020.516 / P3U、BX-NIMAK-HW-A構成 | `nimak/multiframegun/95-020-516-p3u/r4` (詳細外観 r5 準備中・未公開) |
| [universal-robots-ur-series](./universal-robots-ur-series) | 6軸協働ロボットの独自形状 | UR8 Long / UR15 / UR18 / UR20 / UR30 | `ur8-long` / `ur15` / `ur18` / `ur20` / `ur30` (r2) |
| [onrobot-rg6](./onrobot-rg6) | 写真参照の曲線筐体・リンク・標準 EPDM。旧 URDF / collision / TCP を保持、差異を注記 | OnRobot RG6 v2 | `onrobot/rg/rg6/r2` |
| [ewellix-liftkit-ur620](./ewellix-liftkit-ur620) | 伸縮柱の参照モデル | Ewellix LIFTKIT-UR-800-xx00-620 | `ewellix/liftkit/liftkit-ur/r2` |
| [smc-mhz2-20d](./smc-mhz2-20d) | 小物組立用の独自参照モデル | SMC MHZ2-20D | `smc/mhz2/mhz2-20d/r1` |
| [schunk-mpg-plus-25](./schunk-mpg-plus-25) | 小物組立用の独自参照モデル | SCHUNK MPG-plus 25 | `schunk/mpg-plus/mpg-plus-25/r1` |
| [schmalz-pfyn-6-esd](./schmalz-pfyn-6-esd) | 小物組立用の独自参照モデル | Schmalz PFYN 6 NBR-ESD-55 M5-AG | `schmalz/pfyn/pfyn-6-esd/r1` |
| [smc-zp3-t10umn-a5](./smc-zp3-t10umn-a5) | 小物組立用の独自参照モデル | SMC ZP3-T10UMN-A5 | `smc/zp3/zp3-t10umn-a5/r1` |
| [schmalz-scpmc-05](./schmalz-scpmc-05) | 小物組立用の独自参照モデル | Schmalz SCPMc 05 S01 NC M8-6 PNP | `schmalz/scpmc/scpmc-05/r1` |
| [robotiq-hand-e](./robotiq-hand-e) | 平行二指、50 mmストローク | Robotiq HND-GRP / HND-FIN-MLD-KIT | `robotiq/hand-e/hand-e/r1` |
| [robotiq-grp-es-cpl-077](./robotiq-grp-es-cpl-077) | URメス手首向けカップリングの近似外形 | Robotiq GRP-ES-CPL-077 | `robotiq/coupling/grp-es-cpl-077/r1` |
| [zimmer-hrc-03](./zimmer-hrc-03) | 平行二指、UR / CRX / Doosan用の4構成 | Zimmer HRC-03-118505 / 118506 / 116787 / 126895 | `zimmer/hrc/hrc-03-<SKU>/r1` |
| [onrobot-quick-changer](./onrobot-quick-changer) | ロボット側Quick Changer v3 | OnRobot 109498 | `onrobot/quick-changer/109498/r1` |
| [onrobot-dual-quick-changer-109878](./onrobot-dual-quick-changer-109878) | 2工具用の側面取付具 | OnRobot Dual Quick Changer v3 109878 | `onrobot/quick-changer/109878/r1` (公開前) |
| [onrobot-screwdriver-103961](./onrobot-screwdriver-103961) | 側面支持・55 mm送り軸 | OnRobot Screwdriver 103961、109301装着構成 | `onrobot/screwdriver/103961/r1` / `103961-a50/r1` (公開前) |
| [onrobot-bit-extender-109301](./onrobot-bit-extender-109301) | 50 mm追加リーチの参照形状 | OnRobot Bit Extender A 109301 | `onrobot/bit-extender/109301/r1` (公開前) |
| [onrobot-vgc10](./onrobot-vgc10) | 30 mmカップ4個、独立2流路の参照モデル | OnRobot VGC10 102844 | `onrobot/vgc/vgc10/r1` |
| [onrobot-rg2](./onrobot-rg2) | RG2 固有の筐体・リンク・標準 EPDM、110 mm ストローク。旧 URDF と新 visual の差異を注記 | OnRobot RG2 (102012) | `onrobot/rg/rg2/r1` (公開前) |
| [onrobot-hex-e-qc](./onrobot-hex-e-qc) | 6 軸力覚センサ (アダプタプレート + ロボット側 QC 内蔵) の参照モデル | OnRobot HEX-E QC | `onrobot/hex/hex-e-qc/r1` (公開前) |
| [robotiq-epick](./robotiq-epick) | 電動真空グリッパ (1 カップ構成) の参照モデル | Robotiq EPick | `robotiq/epick/epick/r1` (公開前) |
| [robotiq-wrist-camera](./robotiq-wrist-camera) | 手首カメラ (ツールプレート無し) の参照モデル、光学フレーム付き | Robotiq Wrist Camera RWC-CAM-001 | `robotiq/wrist-camera/wrist-camera/r1` (公開前) |
| [smc-jmhz2-16d-x7400b](./smc-jmhz2-16d-x7400b) | UR 直付けの空圧グリッパユニット (弁・スイッチ内蔵、10 mm ストローク) の参照モデル | SMC JMHZ2-16D-X7400B | `smc/jmhz2/jmhz2-16d-x7400b/r1` (公開前) |
| [piab-picobot](./piab-picobot) | COAX 真空グリッパ + 可変 2 カップアームの参照モデル | Piab piCOBOT for Universal Robots | `piab/picobot/picobot/r1` (公開前) |
| [aspina-arh350a](./aspina-arh350a) | 電動 3 爪ハンド (揺動指) の参照モデル | ASPINA ARH350A | `aspina/arh/arh350a/r1` (公開前) |
| [onrobot-2fg7](./onrobot-2fg7) | 平行 2 指電動グリッパ (38 mm ストローク、内向き指) の参照モデル | OnRobot 2FG7 (106376) | `onrobot/2fg/2fg7/r1` (公開前) |
| [onrobot-3fg15](./onrobot-3fg15) | 3 指求心グリッパ (回転プラットフォーム) の参照モデル | OnRobot 3FG15 (103666) | `onrobot/3fg/3fg15/r1` (公開前) |
| [ckd-rlsh-rhlf-rckl-ur](./ckd-rlsh-rhlf-rckl-ur) | UR 認証空圧グリッパ 3 機種の包絡ベース参照モデル (図面未入手) | CKD RLSH-UR / RHLF-UR / RCKL-UR | `ckd/rlsh/rlsh-ur/r1` / `ckd/rhlf/rhlf-ur/r1` / `ckd/rckl/rckl-ur/r1` (公開前) |
| [kosmek-swr0070](./kosmek-swr0070) | 空圧ロボットハンドチェンジャー (マスタ + ツールアダプタ) | コスメック SWR0070-M / SWR0070-T | `kosmek/swr/swr0070-master/r1` / `-tool/r1` (公開前) |
| [kosmek-swrz0070](./kosmek-swrz0070) | SWR0070 用 ISO 9409-1-50-4-M6 変換プレート (ロボット側 / ツール側) | コスメック SWRZ0070-MF4 / SWRZ0070-TF4 | `kosmek/swrz/swrz0070-mf4/r1` / `-tf4/r1` (公開前) |
| [daihen-bt350rd-tmcu01](./daihen-bt350rd-tmcu01) | 協働ロボット用アーク溶接トーチ (トーチマウント込み、TCP = ワイヤ先端) の参照モデル | ダイヘン BLUE TORCH III BT350RD-30D + TMCU-01 (Welbee Co-R) | `daihen/bt350/bt350rd-30d-tmcu01/r1` (公開前) |
| [daihen-wb-p352l](./daihen-wb-p352l) | 溶接電源 (キャスタ付き筐体) の参照モデル | ダイヘン Welbee Inverter P350L II (WB-P352L) | `daihen/welbee/wb-p352l/r2` (詳細化候補・未公開) |
| [daihen-cm-7403](./daihen-cm-7403) | 公式写真参照の独自形状: 傾斜カバー、側面フレーム、巻線付きスプール。旧 URDF を保持（出口座標・collision の差異は注記） | ダイヘン CM-7403 | `daihen/cm/cm-7403/r1` (公開前) |
| [robotiq-ax-series-base](./robotiq-ax-series-base) | パレタイザ基台 + 1500 mm 昇降軸 + コントローラ (prismatic 1 DOF) の参照モデル | Robotiq Palletizing Solution AX Series (AX10) | `robotiq/ax/ax10/r1` (公開前) |
| [robotiq-powerpick10](./robotiq-powerpick10) | パレタイジング用真空グリッパ (既定構成: 200 mm オフセット + Ø77.5 カップ 4 個) の参照モデル | Robotiq PowerPick10 | `robotiq/powerpick/powerpick-10/r1` (公開前) |
| [robotiq-powerpick10-vacuum-unit](./robotiq-powerpick10-vacuum-unit) | PowerPick10 の真空発生ユニット (壁掛け筐体) の参照モデル | Robotiq PowerPick10 Vacuum Generation Unit | `robotiq/powerpick/powerpick10-vacuum-unit/r1` (公開前) |
| [nic-ak-r-fks05](./nic-ak-r-fks05) | 協働ロボット用スタンド型架台 (柱 1 本 + H 形の台枠、キャスタ + ノブ付きアジャスタ、柱は 100 mm 偏心) の参照モデル | NIC オートテック AK-R-FKS05 | `nic_autotec/ak-r/ak-r-fks05/r1` (公開前) |
| [nic-ak-r-fkt10](./nic-ak-r-fkt10) | 協働ロボット用の箱形架台 (4 面パネル、溝付きの天面、アウトリガー) の参照モデル | NIC オートテック AK-R-FKT10 | `nic_autotec/ak-r/ak-r-fkt10/r1` (公開前) |
| [sus-zfm-f401](./sus-zfm-f401) | CRX-10iA 専用台車 (ロボット取付プレートは端から 205 mm、アウトリガー 4 本、取っ手) の参照モデル | SUS ZFM-F401 | `sus/zfm/zfm-f401/r1` (公開前) |
| [misumi-rusa8-5050](./misumi-rusa8-5050) | コントローラ用の台枠 (アジャスタ + キャスタ) の参照モデル、1 構成のみ | ミスミ RUSA8-5050-W500-D400-JC | `misumi/rus/rusa8-5050/r1` (公開前) |
| [swivellink-rb-ped-24-cb200](./swivellink-rb-ped-24-cb200) | コボット用ペデスタルの包絡ベース参照モデル (公表寸法は高さのみ、図面未入手) | Swivellink RB-PED-24-CB200 | `swivellink/rb-ped/rb-ped-24-cb200/r1` (公開前) |
| [mir250](./mir250) | 差動2輪 + 旋回キャスタ4輪の独自参照形状 | MiR250 | `mobile_industrial_robots/mir/mir250/r2` |
| [hitachi-racrew](./hitachi-racrew) | 棚搬送 AGV(小型低床式、棚の下に潜って持ち上げる)の参照モデル: 白い車体・別リンクのターンテーブル・前後バンパ・四隅の灯具 | 日立 Racrew | `hitachi_industrial_products/racrew/racrew/r1`(公開前) |
| [mir1350](./mir1350) | 黒い車体・荷台パッド・対角スキャナ・別リンク上部カバーの参照 AMR | MiR1350 | `mobile_industrial_robots/mir/mir1350/r1` |
| [toyota-sae160](./toyota-sae160) | 実機写真を参照した独自外観: 分割した電池室・駆動カバー、開口グリップ、横長 HMI、5 接点、C 断面マスト、荷重輪窓付きテーパフォーク。TX/DX の URDF・フリーリフト・mimic・collision を維持。DX は `dx/` | Toyota Autopilot SAE160(BT Staxio、TX Hi-Lo / DX Tele) | `toyota_material_handling/autopilot/sae160/r1` / `sae160-dx/r1`(公開前) |
| [aubo-amr300](./aubo-amr300) | 差動 2 輪 AMR の参照モデル(駆動輪 2 + キャスタ 4・スキャナ 2・上面のアーム取付フレーム) | AUBO-AMR300(海纳系列) | `aubo/amr/amr300/r1` |
| [mir-eu-pallet-lift-1350](./mir-eu-pallet-lift-1350) | EUR パレット用 1 軸リフト(揚程 60 mm) | MiR EU Pallet Lift 1350 | `mobile_industrial_robots/mir/eu-pallet-lift-1350/r1` |
| [unitree-g1-fixed-plates](./unitree-g1-fixed-plates) | 頭部カメラ・LiDAR固定プレートの写真参照形状（寸法・取付適合未確認） | Unitree G1 Camera / Radar fixed plate、販売店番号1297 / 1296 | `unitree/g1/camera-fixed-plate/r1` / `radar-fixed-plate/r1` |
| [lms1xx](./lms1xx) | **ROS パッケージ `lms1xx` の CC0 代替 (スタブ)** — 2D 安全レーザスキャナ | — (独自著作。LMS1xx フォームファクタ) | — (カタログ製品ではない) |

**lms1xx だけ性格が違う**: これはカタログに載せる製品モデルではなく、Clearpath の
ROS 1 記述 (ridgeback / husky / jackal / dingo) が無条件 include する ROS パッケージ
`lms1xx` を CC0 で置き換えるためのスタブ。本家がライセンス表明の矛盾を抱えていて
再配布できないため用意した (詳細は [lms1xx/README.md](./lms1xx/README.md))。

weld ガン 2 種のみ、カタログ ID が歴史的な名前のまま (公開済み ID の互換維持のため。
[CONTRIBUTING.md](./CONTRIBUTING.md) の rev 運用参照)。それ以外は
製品ごとのカタログ ID は上表と各アセットの README を参照。

## 寸法可変の製品シリーズモデル

| アセット | 参照製品 | 使用する生成器 |
| --- | --- | --- |
| [x-guard-classic](./x-guard-classic) | Axelent X-Guard Classic | `bt.parts.fence` |
| [belgotch-type34-s1](./belgotch-type34-s1) | マキテック Type34-S1 / 34CSH | `bt.parts.conveyor` |
| [nito-fz](./nito-fz) | 日東工業 FZ / FCX-Z | `bt.parts.cabinet` |
| [nord-pallet-rack](./nord-pallet-rack) | Nord Modules Pallet Rack (EU) | `bt.parts.pallet_stand` |
| [trusco-pallet-rack](./trusco-pallet-rack) | TRUSCO 重量パレットラック 1 トン用 | `bt.parts.pallet_rack` |
| [mir-charge-48v](./mir-charge-48v) | MiR Charge 48V | `bt.parts.charging_station` |
| [trusco-ae-1500](./trusco-ae-1500) | TRUSCO 軽量作業台 AE-1500 | `bt.parts.table` |
| [schneider-xalk178f](./schneider-xalk178f) | Schneider Electric Harmony XALK178F | `bt.parts.operator_panel` |
| [screw-presenter](./screw-presenter) | (汎用) レール式スクリュープレゼンタ | `bt.parts.screw_feeder` |
| [gear-cover-set](./gear-cover-set) | (設計値) GH-160 ギヤハウジングとカバー — `components[].visual` の USD prim | `bt.parts.workpiece` |
| [misumi-hfs6](./misumi-hfs6) | ミスミ アルミフレーム 6 シリーズの断面 HFS6-3030 / 3060 / 6060、フレームキャップ HFC6、ブラケット HBLFS6 (公表寸法からの独自著作) — 押出材の `components[].visual` は長さ方向だけ切断長に伸ばし、金具は入隅と切り口に回して置く | `bt.parts.frame_unit` |

これらは固定寸法ロボットのURDFではなく、対応するスペックパックの
`components[].trim` が参照する表示用xacro＋軽量メッシュ。
`Robot.from_catalog` ではなく、上記生成器の `catalog=` にパックを渡して利用する。
型番・許容寸法はカタログ、外観とその近似条件は各アセットカードが持つ。
描画用の共通部は [equipment-common](./equipment-common/)。

## 汎用の形状ライブラリ

| アセット | 中身 | 利用側 |
| --- | --- | --- |
| [workshop-shapes](./workshop-shapes) | 箱では描けない汎用の形 21 (`tote`・T スロット押出材 `tslot` / `tslot_2`・その L ブラケット `bracket`・人 3 姿勢 `person` / `person_reach` / `person_pick`・カゴ台車 `roll_cage`・オリコンの袖 `orikon`・在庫棚のビン `pod`・ごみ箱 `waste_bin`・高天井照明 `highbay` を含む) (段ボール・プレス皿・パンチングかご・アジャスタ足・取っ手・ホース・穴あきワーク …)。単位箱に正規化した 1 形状 1 USD | botrail が `python/botrail/_shapes/` にベンダリングし、`bt.parts.appearance` が衝突用の箱に被せて描く (人は `bt.parts.person`、カゴ台車は `roll_container`、袖は `bin`、在庫棚のビンは `mobile_rack`) |
| [franka-hand-d405-clip](./franka-hand-d405-clip) | RealSense D405 を Franka Hand の面に留めるプリント用クリップ (リングに引っかけ、面に沿い、底を引っかけ、30° の座)。ハンド座標で著作、手の実測面にフィット | botrail が `examples/assets/` にベンダリングし、卓上 RL 例の手先カメラの見た目にする |

参照実機を持たない独自著作で、型番・寸法を主張しない。実在製品の見た目は製品側の
アセットが持つ。

## 著作・貢献

参照実機の選び方、実機忠実の方針、rev 運用などの著作規約は
[CONTRIBUTING.md](./CONTRIBUTING.md) にまとめてある。

Node.js + Three.js + three-usd-robot の自作モデルには
[共通著作ライブラリ](./authoring/README.md) を用意している。
X16005・Mid-360・ECBPiが利用し、実際の寸法・仕上げ・出所は製品側に保持する。
