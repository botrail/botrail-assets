#!/usr/bin/env python3
"""flange-plate-sws011 の visual メッシュを生成する (再現可能な手続き的著作)。

出力: flange-plate-sws011/meshes/plate.stl (メートル単位, Z-up)

**参照実機: SCHUNK A-SWK-011-ISO-A50** (ID 0302223) — SWS-011 マスタ (SWK-011) を
ISO 9409-1-50-4-M6 のロボットフランジへ取り付けるロボット側アダプタプレート。
寸法は SCHUNK 公式 SWS カタログ p.28 "Adapter plate ISO-A50-R" の公表図から。

依存は trimesh のみ。実行: python flange-plate-sws011/tools/generate_meshes.py
"""

from __future__ import annotations

import math
from pathlib import Path

import numpy as np
import trimesh

MM = 0.001

# --- 公式カタログ図 (SWS カタログ p.28, A-SWK-011-ISO-A50) の値 ---
OD = 63.0  # 外径 ø63
BODY_H = 25.5  # 本体高さ (ロボット接触面 -> ツール面)
TOTAL_H = 30.5  # 全高 = 本体 25.5 + ロボット側 ISO パイロット 5.0
PILOT_D = 31.5  # ISO 9409-1 呼び 50 の位置決め径 (ロボットフランジの穴へ入る)
PILOT_H = TOTAL_H - BODY_H  # 5.0
ISO_PCD = 50.0  # ロボット側ボルト円 (4 x M6 通し)
ISO_DOWEL = 6.0  # ダウエルピン ø6 (図の 95)

# --- ツール側 (S7 / SWK-011 の受け) ---
# SWK cover (ø44.7 / ø45h7, 厚 3.2) を受けるポケット。「cover はアダプタプレートに
# 支持されることが必須」という公式注記の実装で、深さ = cover 厚 3.2 (面で支持)
POCKET_D = 45.0
POCKET_H = 3.2
S7_BCD = 40.0  # SWK の M3x25 貫通ボルトを受ける M3 めねじ x4 (ポケット底に開く)

BORE = 10.0  # 中央通し穴 (設計値。カタログ図に中央穴の記載は無い — ケーブル/エア通し)

PROFILE = [
    (BORE / 2, -PILOT_H),  # 通し穴、パイロット端
    (PILOT_D / 2, -PILOT_H),  # パイロット端面 (ø31.5)
    (PILOT_D / 2, 0.0),  # パイロット外周
    (OD / 2 - 1.0, 0.0),  # ロボット側 座面 (円環)
    (OD / 2, 1.0),  # 面取り
    (OD / 2, BODY_H - 1.0),  # 板外周 ø63
    (OD / 2 - 1.0, BODY_H),  # 面取り
    (POCKET_D / 2, BODY_H),  # ツール面 -> ポケット口
    (POCKET_D / 2, BODY_H - POCKET_H),  # ポケット壁
    (BORE / 2, BODY_H - POCKET_H),  # ポケット底 -> 通し穴
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

    # ISO ダウエルピン ø6 (ロボットフランジの位置決め穴へ)。ボルト間の 90 度位置
    x, y = on_circle(ISO_PCD, 90.0)
    parts.append(cyl([x, y, -4.0], [x, y, 2.0], ISO_DOWEL / 2, sections=16))

    # ロボット側 M6 ボルトの座ぐり縁 (ツール面側から挿してロボットのめねじへ)。
    # ボルト円 ø50 は ポケット口 ø45 のすぐ外なので、縁ボスはツール面の環状部に載る
    for ang in (0.0, 90.0, 180.0, 270.0):
        x, y = on_circle(ISO_PCD, ang)
        parts.append(cyl([x, y, BODY_H - 2.5], [x, y, BODY_H], 4.0, sections=14))

    # S7: SWK の M3x25 を受ける M3 めねじ x4 (ポケット底)。ねじ座の縁を見せる
    for ang in (45.0, 135.0, 225.0, 315.0):
        x, y = on_circle(S7_BCD, ang)
        parts.append(
            cyl([x, y, BODY_H - POCKET_H], [x, y, BODY_H - POCKET_H + 0.8], 2.6, sections=12)
        )

    return trimesh.util.concatenate(parts)


def main() -> None:
    out_dir = Path(__file__).resolve().parent.parent / "meshes"
    out_dir.mkdir(parents=True, exist_ok=True)
    mesh = build_plate()
    mesh.apply_scale(MM)
    mesh.export(out_dir / "plate.stl")
    print(f"plate.stl: {len(mesh.faces)} faces, bounds {mesh.bounds.round(4).tolist()}")
    print(f"OD ø{OD} x {BODY_H} (+ pilot ø{PILOT_D} x {PILOT_H}) = total {TOTAL_H}")
    print(f"robot side: ISO 9409-1-50-4-M6 / tool side: S7 pocket ø{POCKET_D} x {POCKET_H}")


if __name__ == "__main__":
    main()
