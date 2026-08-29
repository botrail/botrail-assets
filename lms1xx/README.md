# lms1xx

2D 安全レーザスキャナ (LMS1xx フォームファクタ) の自作アセット (CC0-1.0)。
**他のアセットと違い、これは「カタログに載せる製品モデル」ではなく
ROS パッケージ `lms1xx` の CC0 代替 (スタブ)** である。

> **SICK AG の製品でも Clearpath Robotics のリポジトリでもない。** SICK の CAD にも
> Clearpath のメッシュ／コードにも由来しない。ドライバは含まない (記述のみ)。
> 実機を動かす用途には本家 [clearpathrobotics/LMS1xx](https://github.com/clearpathrobotics/LMS1xx)
> を使うこと。

## なぜ要るか

Clearpath の ROS 1 ロボット記述 (ridgeback / husky / jackal / dingo) の
`accessories.urdf.xacro` は、アクセサリを 1 つも有効にしていなくても
`$(find lms1xx)/urdf/sick_lms1xx.urdf.xacro` を **無条件で** include する。
つまりこのパッケージが解決できないと xacro 展開そのものが失敗する。

| リポジトリ | `$(find lms1xx)` 参照数 |
|---|---|
| ridgeback | 2 |
| jackal | 3 |
| husky | 1 |
| dingo | 1 |

一方、本家 clearpathrobotics/LMS1xx は

- LICENSE ファイルが **無い**
- `package.xml` は `<license>LGPL</license>`
- 当の `urdf/sick_lms1xx.urdf.xacro` の冒頭は **BSD-3-Clause ヘッダ**

という矛盾した表明で、再配布可否を判断できない。カタログの `public` 配布は
`sources/` ごと再配布するため、この矛盾を抱えたままでは public にできなかった。
そこを CC0 の自作で置き換えるのが本パッケージ。これにより Clearpath の
ROS 1 系がまとめて開く。

## 中身

- **マクロ署名は上流と互換** (`sick_lms1xx`、params 名・既定値・リンク名の決まり方)。
  アクセサリを有効にすると**当方の意匠**の幾何が出る (実機の写しではない)
- 座標系: 原点 = **スキャナの焦点 (measurement origin)**。上流と同じ規約で、
  accessories 側がこの前提でマウント位置を決めているため合わせてある。
  +X = 走査面の正面、+Z = 上。焦点は筐体上端から 50 mm 下
- collision は筐体枠そのままの箱、visual は生成メッシュ (watertight, 1,336 面)
- `urdf/lms111.urdf.xacro` — マクロを実体化してカタログ製品 (SICK LMS111,
  `sensor.lidar`) として立てるエントリ。root は `mount` (筐体底面中心)、
  焦点 `laser` はその 102 mm 上。スタブ用途 (Clearpath 系の include 解決) には
  無関係で、カタログのビルドだけが読む

## 寸法の根拠と未確認事項

筐体枠 **105 (W) × 102 (D) × 152 (H) mm** — LMS1xx として広く公表されている値。

> ⚠ **一次情報での裏取りは未了 (2026-08-20)**。著作時に SICK の一次資料へ到達
> できなかった (製品ページが JS 描画、データシート PDF の旧 URL は 404)。同じ寸法を
> 上流 Clearpath 記述の慣性計算も使っているが、SICK 公式で確認できたわけではない。
> 実寸が要る用途に使う前に検証すること。

面取り・走査窓帯の高さと凹み・背面ケーブルボス・角丸半径は**すべて当方設計**。

## 再生成

```sh
python lms1xx/tools/generate_meshes.py   # 依存: trimesh
```

`meshes/sick-lms1xx.stl` (メートル単位, Z-up, 原点 = 焦点) が更新される。
角丸は「四隅に立てた円柱の凸包」で作っている — 箱 + 円柱の union だと同一平面が
重なってブーリアンが穴を残すため。
