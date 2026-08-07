#!/usr/bin/env python3
"""weld-gun-x16005 の README に載せる寸法を生成メッシュから実測する。

- のど深さ / 電極軸でのアーム開口 (公称 160) は GEOMETRY 定数から解析的に算出
- のど開口の奥行きテーブルは meshes/*.stl の y=0 断面から実測
- 先端ストロークは可動先端のピボットまわり回転から解析的に算出

実行: python weld-gun-x16005/tools/measure_throat.py  (先に generate_meshes.py を実行)
"""

from __future__ import annotations

import math
from pathlib import Path

import numpy as np
import trimesh

from generate_meshes import (
    ELECTRODE_X,
    FIXED_ARM_PATH,
    FIXED_ARM_SECTION,
    MOVING_ARM_PATH,
    MOVING_ARM_SECTION,
    PIVOT,
    TIP_FIXED_Z,
    TIP_MOVING_Z,
)

MESH_DIR = Path(__file__).resolve().parent.parent / "meshes"
Q_OPEN = 0.446  # URDF の electrode_joint 上限


def _interp(path, sections, x: float) -> tuple[float, float]:
    """アーム中心線 z と断面高さを x で線形補間する。"""
    xs = [p[0] for p in path]
    zs = [p[1] for p in path]
    hs = [s[1] for s in sections]
    return float(np.interp(x, xs, zs)), float(np.interp(x, xs, hs))


def crossings(section_3d, x: float) -> list[float]:
    """y=0 断面 (線分集合) と鉛直線 x=const の交点 z を列挙する。"""
    out: list[float] = []
    for a, b in zip(section_3d[::2], section_3d[1::2]):
        if (a[0] - x) * (b[0] - x) <= 0 and abs(a[0] - b[0]) > 1e-12:
            t = (x - a[0]) / (b[0] - a[0])
            out.append(float(a[2] + t * (b[2] - a[2])))
    return out


def section_segments(mesh: trimesh.Trimesh) -> np.ndarray:
    sec = trimesh.intersections.mesh_plane(mesh, [0.0, 1.0, 0.0], [0.0, 0.0, 0.0])
    return np.asarray(sec, dtype=np.float64).reshape(-1, 3)


def main() -> None:
    body = trimesh.load(MESH_DIR / "body.stl")
    arm_local = trimesh.load(MESH_DIR / "electrode_arm.stl")

    throat = (ELECTRODE_X - 0.153) * 1000.0
    zf, hf = _interp(FIXED_ARM_PATH, FIXED_ARM_SECTION, ELECTRODE_X)
    zm, hm = _interp(MOVING_ARM_PATH, MOVING_ARM_SECTION, ELECTRODE_X)
    gap_axis = ((zm - hm / 2.0) - (zf + hf / 2.0)) * 1000.0
    print(f"throat depth (electrode axis - clevis front): {throat:.0f} mm")
    print(f"arm-to-arm opening at electrode axis (q=0, analytic): {gap_axis:.1f} mm")

    # 先端ストローク (ピボットまわりの回転、解析)
    xl, zl = ELECTRODE_X - PIVOT[0], TIP_MOVING_Z - PIVOT[2]
    travel = (xl * math.sin(Q_OPEN) + zl * (math.cos(Q_OPEN) - 1.0)) * 1000.0
    clearance = (TIP_MOVING_Z - TIP_FIXED_Z) * 1000.0
    print(f"tip clearance (q=0): {clearance:.0f} mm")
    print(f"tip stroke (q=0 -> {Q_OPEN} rad): {travel:.1f} mm")
    print(f"tip opening (full open): {clearance + travel:.1f} mm")

    # のど開口の奥行きテーブル (y=0 断面のメッシュ実測)
    body_sec = section_segments(body)
    print("\ndepth-from-electrode-axis | gap q=0 | gap open")
    for q, label in ((0.0, "closed"), (Q_OPEN, "open")):
        pass  # 表は列方向に出すため下でまとめて計算する
    arm_secs = {}
    for q in (0.0, Q_OPEN):
        arm = arm_local.copy()
        arm.apply_transform(trimesh.transformations.rotation_matrix(-q, [0.0, 1.0, 0.0]))
        arm.apply_translation(PIVOT)
        arm_secs[q] = section_segments(arm)
    for depth in (33, 113, 193, 273, 353):
        x = ELECTRODE_X - depth / 1000.0
        top = max((z for z in crossings(body_sec, x) if z < 0.42), default=None)
        row = [f"{depth:>3} mm"]
        for q in (0.0, Q_OPEN):
            bottom = min((z for z in crossings(arm_secs[q], x) if z > 0.30), default=None)
            row.append(
                f"{(bottom - top) * 1000.0:6.0f} mm" if top is not None and bottom is not None else "   n/a"
            )
        print(" | ".join(row))


if __name__ == "__main__":
    main()
