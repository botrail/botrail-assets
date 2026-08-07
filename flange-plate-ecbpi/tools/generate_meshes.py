#!/usr/bin/env python3
"""flange-plate-ecbpi の visual メッシュを生成する (再現可能な手続き的著作)。

出力: flange-plate-ecbpi/meshes/plate.stl (メートル単位, Z-up)

ロボットフランジ (ISO 9409-1-50-4-M6) と Schmalz CobotPump ECBPi (3 x M4 /
ボルト円 ø46) を繋ぐアダプタプレート。**両側のインタフェースは公開データで確定**し、
板厚と外径だけが設計値。詳細は README。

依存は trimesh のみ。実行: python flange-plate-ecbpi/tools/generate_meshes.py
"""

from __future__ import annotations

import math
from pathlib import Path

import numpy as np
import trimesh

MM = 0.001

# --- ロボット側: ISO 9409-1-50-4-M6 (公開規格) ---
# 呼び 50 の行: 外径 63 / ボルト円 50 x 4-M6 / 位置決め径 31.5 / ダウエル 6
ISO_OD = 63.0
ISO_PCD = 50.0
ISO_PILOT = 31.5
ISO_DOWEL = 6.0
PILOT_DEPTH = 5.0
ISO_BOLT_ANGLES = (0.0, 90.0, 180.0, 270.0)
DOWEL_ANGLE = 135.0

# --- ツール側: Schmalz ECBPi (取説 §4.5 の Dmk1 / G1) ---
ECBPI_BCD = 46.0
ECBPI_THREAD_D = 4.0
# ISO の M6 穴 (P.C.D 50) と ECBPi の M4 穴 (P.C.D 46) は半径がほぼ重なるので、
# **角度をずらして逃がす**。実機のアダプタプレートも同じ制約を抱える箇所
ECBPI_BOLT_ANGLES = (45.0, 165.0, 285.0)

THICKNESS = 8.0  # 設計値
BORE = 10.0  # 中央通し穴 (エア / ケーブル)

PROFILE = [
    (BORE / 2, -PILOT_DEPTH),  # 通し穴、スピゴット端
    (ISO_PILOT / 2, -PILOT_DEPTH),  # スピゴット端面 (ISO 位置決め径 ø31.5)
    (ISO_PILOT / 2, 0.0),  # スピゴット外周
    (ISO_OD / 2 - 1.0, 0.0),  # ロボット側 座面 (円環)
    (ISO_OD / 2, 1.0),  # 面取り
    (ISO_OD / 2, THICKNESS - 1.0),  # 外周
    (ISO_OD / 2 - 1.0, THICKNESS),  # 面取り
    (BORE / 2, THICKNESS),  # ツール側 座面 -> 通し穴
]


def revolve_closed(profile_rz, sections: int = 64) -> trimesh.Trimesh:
    pts = np.asarray(profile_rz, dtype=np.float64)
    if np.allclose(pts[0], pts[-1]):
        pts = pts[:-1]
    n = len(pts)
    ang = np.linspace(0.0, 2 * math.pi, sections, endpoint=False)
    verts = np.array(
        [[r * math.cos(a), r * math.sin(a), z] for r, z in pts for a in ang], dtype=np.float64
    )
    faces = []
    for i in range(n):
        i2 = (i + 1) % n
        for j in range(sections):
            j2 = (j + 1) % sections
            a, b = i * sections + j, i * sections + j2
            c, d = i2 * sections + j, i2 * sections + j2
            faces += [[a, c, d], [a, d, b]]
    m = trimesh.Trimesh(vertices=verts, faces=np.array(faces), process=True)
    m.fix_normals()
    return m


def cyl(p0, p1, radius: float, sections: int = 20) -> trimesh.Trimesh:
    return trimesh.creation.cylinder(
        radius=radius, segment=np.array([p0, p1], dtype=np.float64), sections=sections
    )


def on_circle(pcd: float, angle_deg: float) -> tuple[float, float]:
    a = math.radians(angle_deg)
    return (pcd / 2 * math.cos(a), pcd / 2 * math.sin(a))


def build_plate() -> trimesh.Trimesh:
    parts = [revolve_closed(PROFILE)]

    # ISO ダウエルピン (ロボットフランジの位置決め穴へ入る)
    x, y = on_circle(ISO_PCD, DOWEL_ANGLE)
    parts.append(cyl([x, y, -4.0], [x, y, 2.0], ISO_DOWEL / 2, sections=16))

    # ロボット側 M6 ボルト (ツール側から挿してロボットのめねじへ)。頭を座ぐりに見せる
    for ang in ISO_BOLT_ANGLES:
        x, y = on_circle(ISO_PCD, ang)
        parts.append(cyl([x, y, THICKNESS - 3.0], [x, y, THICKNESS], 5.0, sections=14))

    # ECBPi 側 M4 ボルト (ロボット側から挿して ECBPi のめねじへ)
    for ang in ECBPI_BOLT_ANGLES:
        x, y = on_circle(ECBPI_BCD, ang)
        parts.append(cyl([x, y, 0.0], [x, y, 2.5], 3.5, sections=12))

    return trimesh.util.concatenate(parts)


def main() -> None:
    out_dir = Path(__file__).resolve().parent.parent / "meshes"
    out_dir.mkdir(parents=True, exist_ok=True)
    mesh = build_plate()
    mesh.apply_scale(MM)
    mesh.export(out_dir / "plate.stl")
    print(f"plate.stl: {len(mesh.faces)} faces, bounds {mesh.bounds.round(4).tolist()}")
    print(f"robot side: ISO 9409-1-50-4-M6 (OD {ISO_OD} / PCD {ISO_PCD} / pilot {ISO_PILOT})")
    print(f"tool side : ECBPi {len(ECBPI_BOLT_ANGLES)} x M{ECBPI_THREAD_D:.0f} on BCD {ECBPI_BCD}")
    print(f"thickness : {THICKNESS} mm (design value)")


if __name__ == "__main__":
    main()
