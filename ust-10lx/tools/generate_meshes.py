#!/usr/bin/env python3
"""ust-10lx の visual メッシュを生成する (再現可能な手続き的著作)。

出力: ust-10lx/meshes/{base,head}.stl (メートル単位, Z-up, 原点 = 底面中心)

**参照実機: 北陽電機 UST-10LX** (測域センサ、Smart-URG mini)。外形は北陽の
公開外形図 (製品ページの外形図 PNG と仕様書 C-42-04077) の公表値に合わせてある:

  - 外形 **50 (W) × 50 (D) × 70 (H) mm** (本体のみ)
  - 下部筐体 (アルミ) 高さ **35**、上部 (ポリカーボネート) に光学窓 **28.7**
  - 走査中心 (受光部) は底面から **47.4**
  - 底面取付 **4-M3 深さ 6 (40 × 40)**、位置決め **2-φ3 深さ 2.8**
  - ケーブルは背面 (-X) 下部から引き出し

**これは UST-10LX の複製ではない。** 上の公表値だけを採り、角丸・上部の丸み・
窓帯の凹み・ケーブル付け根の意匠は当方の設計。詳細は README / URDF ヘッダ参照。

座標系: 原点 = mount (底面中心)。+X = 走査正面 (ケーブルの反対側)、+Z = 上。
走査焦点 laser は (0, 0, 47.4 mm)。

依存は trimesh のみ。実行: python ust-10lx/tools/generate_meshes.py
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import trimesh

MM = 0.001
SECTIONS = 64

# ------------------------------------------------- 参照実機の図面値 (mm) --
BODY_W = 50.0  # 幅 (Y)
BODY_D = 50.0  # 奥行 (X)
BASE_H = 35.0  # 下部筐体 (アルミ) の高さ
TOTAL_H = 70.0  # 全高
WINDOW_H = 28.7  # 光学窓の高さ (下部筐体の直上から)
SCAN_Z = 47.4  # 走査中心 (受光部) の高さ

# --------------------------------------------------------- 当方設計 (mm) --
HEAD_W = 46.0  # 上部の幅 — 外形図の正面図で下部より一回り細く見える
HEAD_R = 9.0  # 上部の角丸
BASE_R = 3.0  # 下部の角丸
WINDOW_INSET = 1.2  # 窓帯の凹み
CABLE_D = 4.0  # ケーブル付け根 φ4 × 2 本 (背面下部)
CABLE_L = 10.0


def _rounded_box(w: float, d: float, h: float, r: float) -> trimesh.Trimesh:
    """角丸の直方体 (mm 指定)。四隅に立てた円柱の凸包 (lms1xx と同じ手)。"""
    if r <= 0:
        return trimesh.creation.box(extents=(d * MM, w * MM, h * MM))
    corners = []
    for sx in (-1, 1):
        for sy in (-1, 1):
            cyl = trimesh.creation.cylinder(radius=r * MM, height=h * MM, sections=SECTIONS)
            cyl.apply_translation([sx * (d / 2 - r) * MM, sy * (w / 2 - r) * MM, 0.0])
            corners.append(cyl)
    return trimesh.util.concatenate(corners).convex_hull


def _at(mesh: trimesh.Trimesh, z_center: float) -> trimesh.Trimesh:
    mesh.apply_translation([0.0, 0.0, z_center * MM])
    return mesh


def build_base() -> trimesh.Trimesh:
    base = _at(_rounded_box(BODY_W, BODY_D, BASE_H, BASE_R), BASE_H / 2)
    stubs = []
    for y in (-6.0, 6.0):
        stub = trimesh.creation.cylinder(radius=CABLE_D / 2 * MM, height=CABLE_L * MM, sections=32)
        stub.apply_transform(trimesh.transformations.rotation_matrix(np.pi / 2, [0, 1, 0]))
        stub.apply_translation([-(BODY_D / 2 + CABLE_L / 2 - 1.0) * MM, y * MM, 8.0 * MM])
        stubs.append(stub)
    return trimesh.util.concatenate([base] + stubs)


def build_head() -> trimesh.Trimesh:
    # 窓帯 (一回り細い) の上に天面キャップ。焦点はこの帯の中にある
    cap_h = TOTAL_H - BASE_H - WINDOW_H
    window = _at(_rounded_box(HEAD_W - 2 * WINDOW_INSET, HEAD_W - 2 * WINDOW_INSET, WINDOW_H, HEAD_R),
                 BASE_H + WINDOW_H / 2)
    cap = _at(_rounded_box(HEAD_W, HEAD_W, cap_h, HEAD_R), TOTAL_H - cap_h / 2)
    collar = _at(_rounded_box(HEAD_W, HEAD_W, 1.5, HEAD_R), BASE_H + 0.75)
    return trimesh.util.concatenate([window, cap, collar])


def main() -> None:
    out_dir = Path(__file__).resolve().parent.parent / "meshes"
    out_dir.mkdir(parents=True, exist_ok=True)
    for name, mesh in (("base", build_base()), ("head", build_head())):
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
