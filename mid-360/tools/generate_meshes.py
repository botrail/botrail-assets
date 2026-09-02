#!/usr/bin/env python3
"""mid-360 の visual メッシュを生成する (再現可能な手続き的著作)。

出力: mid-360/meshes/{base,dome}.stl (メートル単位, Z-up, 原点 = 底面中心)

**参照実機: Livox Mid-360** (360°×59° の小型 3D LiDAR)。外形は Livox 公式
ユーザーマニュアル (Appendix "Livox Mid-360 Dimensions") の公表値に合わせてある:

  - 外形 **65 × 65 × 60 mm** (コネクタ突起を含む幅 73)、質量 265 g
  - 下部ブロック (放熱フィン付き) 高さ **39.5**、上に光学ドーム、全高 60
  - 点群座標の原点 O は底面から **47.0** (ドーム内)
  - 底面取付 **4-M3 深さ 5 (48 × 36 mm)**、位置決め **2-φ3 深さ 1.8**
  - M12 航空コネクタが側面 (底面から 16、当方は -X 側に配置)

**これは Livox の CAD ではない** (公式 STEP は公開 DL できるが利用条件の明記が
無い)。上の公表値だけを採り、フィンの本数・ドームの輪郭・角丸は当方の設計。

座標系: 原点 = mount (底面中心)。+X = 前方 (Livox 座標系の X、コネクタの反対側)、
+Z = 上。点群原点 livox_frame は (0, 0, 47.0 mm)。

依存は trimesh のみ。実行: python mid-360/tools/generate_meshes.py
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import trimesh

MM = 0.001
SECTIONS = 96

# ------------------------------------------------- 参照実機の図面値 (mm) --
BODY_W = 65.0
BASE_H = 39.5  # 下部ブロック (フィン付き)
TOTAL_H = 60.0
ORIGIN_Z = 47.0  # 点群原点 O
CONNECTOR_Z = 16.0  # コネクタ中心の高さ
CONNECTOR_PROTRUSION = 8.0  # 65 -> 73 の差

# --------------------------------------------------------- 当方設計 (mm) --
BASE_R = 5.0  # 下部ブロックの角丸
FIN_N = 7  # 放熱フィンの本数 (実機はもっと細かい — 意匠)
FIN_DEPTH = 1.5
FIN_H = 20.0
DOME_R = 28.0  # ドームの半径 (下部ブロックより一回り小さい)
DOME_CYL_H = 10.0  # ドーム下部の円筒部
CONNECTOR_D = 14.0


def _rounded_box(w: float, d: float, h: float, r: float) -> trimesh.Trimesh:
    corners = []
    for sx in (-1, 1):
        for sy in (-1, 1):
            cyl = trimesh.creation.cylinder(radius=r * MM, height=h * MM, sections=SECTIONS)
            cyl.apply_translation([sx * (d / 2 - r) * MM, sy * (w / 2 - r) * MM, 0.0])
            corners.append(cyl)
    return trimesh.util.concatenate(corners).convex_hull


def build_base() -> trimesh.Trimesh:
    block = _rounded_box(BODY_W, BODY_W, BASE_H, BASE_R)
    block.apply_translation([0.0, 0.0, BASE_H / 2 * MM])
    parts = [block]
    # 放熱フィン: 左右 (±Y) の面に薄いリブを立てる (意匠)
    pitch = (BODY_W - 2 * BASE_R) / (FIN_N + 1)
    for side in (-1, 1):
        for i in range(FIN_N):
            x = -BODY_W / 2 + BASE_R + pitch * (i + 1)
            fin = trimesh.creation.box(extents=(2.0 * MM, FIN_DEPTH * MM, FIN_H * MM))
            fin.apply_translation([x * MM, side * (BODY_W / 2 + FIN_DEPTH / 2 - 0.2) * MM,
                                   (BASE_H - FIN_H / 2 - 4.0) * MM])
            parts.append(fin)
    # M12 コネクタ (背面 -X)
    conn = trimesh.creation.cylinder(radius=CONNECTOR_D / 2 * MM, height=CONNECTOR_PROTRUSION * MM,
                                     sections=48)
    conn.apply_transform(trimesh.transformations.rotation_matrix(np.pi / 2, [0, 1, 0]))
    conn.apply_translation([-(BODY_W / 2 + CONNECTOR_PROTRUSION / 2 - 0.5) * MM, 0.0, CONNECTOR_Z * MM])
    parts.append(conn)
    return trimesh.util.concatenate(parts)


def build_dome() -> trimesh.Trimesh:
    """円筒 + 球冠の回転体。輪郭は (半径, 高さ) の折れ線で、軸上で始まり軸上で
    終わるので閉じた面になる。"""
    z0 = BASE_H
    z1 = BASE_H + DOME_CYL_H
    cap_h = TOTAL_H - z1
    # 球冠: 半径 DOME_R の円筒の上に、高さ cap_h で頂点 (0, TOTAL_H) に至る楕円弧
    profile = [(0.0, z0), (DOME_R, z0), (DOME_R, z1)]
    for k in range(1, 25):
        t = k / 24 * np.pi / 2
        profile.append((DOME_R * np.cos(t), z1 + cap_h * np.sin(t)))
    profile.append((0.0, TOTAL_H))
    pts = np.array(profile) * MM
    dome = trimesh.creation.revolve(pts, sections=SECTIONS)
    return dome


def main() -> None:
    out_dir = Path(__file__).resolve().parent.parent / "meshes"
    out_dir.mkdir(parents=True, exist_ok=True)
    for name, mesh in (("base", build_base()), ("dome", build_dome())):
        mesh.merge_vertices()
        mesh.fix_normals()
        path = out_dir / f"{name}.stl"
        mesh.export(path)
        lo, hi = mesh.bounds
        print(f"wrote {path}")
        print(f"  bounds (mm): {np.round(lo / MM, 1).tolist()} .. {np.round(hi / MM, 1).tolist()}"
              f"  faces: {len(mesh.faces)}, watertight={mesh.is_watertight}")


if __name__ == "__main__":
    main()
