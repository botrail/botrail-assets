# mecheye-pro-m

産業 3D カメラ (Mech-Mind Mech-Eye PRO M フォームファクタ) の自作マッシング
モデル (CC0-1.0)。

> **Mech-Mind Robotics の CAD ではない。** 公式 CAD (STEP) は登録フォームの先に
> しか無く再配布可否を判断できないため、公表仕様の外形寸法に合わせて独自に
> 著作した簡略形状である。実寸 CAD が要る用途には Mech-Mind の公式
> ダウンロードセンターを使うこと。

## 寸法の根拠

出典: [docs.mech-mind.net Mech-Eye 2.3.1 PRO S / PRO M specifications](https://docs.mech-mind.net/en/eye-3d-camera/2.3.1/hardware/specifications-pro-s-pro-m.html)

| 項目 | 値 | 出典 |
|---|---|---|
| 外形 | 353 × 57 × 100 mm | 公表値 |
| 基線 (レンズ間隔) | 270 mm | 公表値 |
| 質量 | 1.9 kg | 公表値 |
| 前面の黒帯・レンズ径・プロジェクタ窓 | — | **当方設計** (実機の写しではない) |

## 座標系

- 原点 = `mount` = **背面中央** (実機は背面/上面の M6 穴でブラケット取付)
- +X = 光軸 (前面方向)、+Y = バー長軸、+Z = 上
- `camera_optical_frame` = 前面中央 (基線の中点、x = 60.5 mm) の ROS 光学規約
  (+Z 前方・+Y 下)。実機の深度参照フレームの公表値は無いため近似

## 形式

メッシュ無し。URDF プリミティブ (box / cylinder) のみで組んであり、
collision は張り出しまで覆う一体の箱。
