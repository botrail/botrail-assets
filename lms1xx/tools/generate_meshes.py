#!/usr/bin/env python3
"""lms1xx の visual メッシュを生成する (再現可能な手続き的著作)。

出力: lms1xx/meshes/sick-lms1xx.stl (メートル単位, Z-up)

**これは SICK LMS1xx の複製ではない。** 2D 安全レーザスキャナという製品カテゴリの
一般的な外形 (直方体の本体 + 上部の回転ミラー窓) を、LMS1xx として広く公表されて
いる筐体寸法 **105 x 102 x 152 mm** の枠に収めて独自に著作したもの。細部の意匠
(面取り・窓の高さ・ケーブル出口・取付ボス) はすべて当方の設計で、SICK の CAD にも
Clearpath のメッシュにも由来しない。詳細は README / URDF ヘッダ参照。

座標系: **原点 = スキャナの焦点 (measurement origin)**。これは上流 Clearpath 記述の
`sick_lms1xx` マクロと同じ規約で、accessories がその前提でマウント位置を決めている
ため合わせてある。+X が測距の正面 (走査面の中心)、+Z が上。

依存は trimesh のみ。実行: python lms1xx/tools/generate_meshes.py
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import trimesh

MM = 0.001
SECTIONS = 64

# ------------------------------------------------------- 筐体の枠 (mm) --
# LMS1xx として広く公表されている筐体寸法。**このセッションでは SICK 一次資料
# (製品ページ / データシート PDF) に到達できなかった** (サイトが JS 描画、
# 旧 PDF URL は 404) ため、値は要検証扱い。上流 Clearpath 記述の慣性計算も
# 同じ 105 x 102 x 152 を使っている。
BODY_W = 105.0  # 幅 (Y)
BODY_D = 102.0  # 奥行 (X)
BODY_H = 152.0  # 高さ (Z)

# 焦点 (原点) は筐体上部の回転ミラー中心にある。上流マクロの collision が
# 原点から -50 mm 下に 100 mm 角の箱を置いていることから、焦点は筐体上端から
# 概ね 50 mm 下と読める。これに合わせて筐体を配置する。
FOCUS_FROM_TOP = 50.0

WINDOW_H = 40.0  # 走査窓 (回転ミラーが覗く帯) の高さ — 当方設計
WINDOW_INSET = 10.0  # 窓帯の凹み — 当方設計
CHAMFER = 6.0  # 上部の面取り — 当方設計


def _rounded_box(w: float, d: float, h: float, r: float) -> trimesh.Trimesh:
    """角丸の直方体 (mm 指定)。四隅に立てた円柱の**凸包**で作る。

    箱 + 円柱の union だと同一平面が重なってブーリアンが穴を残すことがあるため、
    凸包で一発で閉じた形を得る (角丸プリズムは凸なので凸包で厳密に一致する)。
    """
    if r <= 0:
        return trimesh.creation.box(extents=(d * MM, w * MM, h * MM))
    corners = []
    for sx in (-1, 1):
        for sy in (-1, 1):
            cyl = trimesh.creation.cylinder(radius=r * MM, height=h * MM, sections=SECTIONS)
            cyl.apply_translation([sx * (d / 2 - r) * MM, sy * (w / 2 - r) * MM, 0.0])
            corners.append(cyl)
    return trimesh.util.concatenate(corners).convex_hull


def build() -> trimesh.Trimesh:
    top_z = FOCUS_FROM_TOP
    bottom_z = FOCUS_FROM_TOP - BODY_H

    # 本体 (走査窓より下)。角丸 8 mm は当方設計
    lower_h = (top_z - WINDOW_H - CHAMFER) - bottom_z
    lower = _rounded_box(BODY_W, BODY_D, lower_h, 8.0)
    lower.apply_translation([0.0, 0.0, (bottom_z + lower_h / 2) * MM])

    # 走査窓の帯 — 一回り細くして「窓がはまっている」表現にする (当方設計)
    win = _rounded_box(BODY_W - 2 * WINDOW_INSET, BODY_D - 2 * WINDOW_INSET, WINDOW_H, 8.0)
    win.apply_translation([0.0, 0.0, (top_z - CHAMFER - WINDOW_H / 2) * MM])

    # 天面のキャップ (面取り相当) — 当方設計
    cap = _rounded_box(BODY_W, BODY_D, CHAMFER, 8.0)
    cap.apply_translation([0.0, 0.0, (top_z - CHAMFER / 2) * MM])

    # 背面のケーブル出口ボス (当方設計、意匠であって実機の写しではない)
    boss = trimesh.creation.cylinder(radius=13.0 * MM, height=18.0 * MM, sections=SECTIONS)
    boss.apply_transform(trimesh.transformations.rotation_matrix(np.pi / 2, [0, 1, 0]))
    boss.apply_translation([-(BODY_D / 2 + 6.0) * MM, 0.0, (bottom_z + 40.0) * MM])

    mesh = trimesh.boolean.union([lower, win, cap, boss])
    # union は稀に穴や重複頂点を残す — 縫ってから法線を揃える
    mesh.merge_vertices()
    mesh.update_faces(mesh.nondegenerate_faces())
    if not mesh.is_watertight:
        trimesh.repair.fill_holes(mesh)
    mesh.fix_normals()
    return mesh


def main() -> None:
    out_dir = Path(__file__).resolve().parent.parent / "meshes"
    out_dir.mkdir(parents=True, exist_ok=True)
    mesh = build()
    path = out_dir / "sick-lms1xx.stl"
    mesh.export(path)
    lo, hi = mesh.bounds
    print(f"wrote {path}")
    print(f"  bounds (mm): {np.round(lo / MM, 1).tolist()} .. {np.round(hi / MM, 1).tolist()}")
    print(f"  size   (mm): {np.round((hi - lo) / MM, 1).tolist()}"
          f"  (筐体枠 {BODY_D} x {BODY_W} x {BODY_H} + 背面ボス 15)")
    print(f"  faces: {len(mesh.faces)}, watertight={mesh.is_watertight}")


if __name__ == "__main__":
    main()
