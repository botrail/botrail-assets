#!/usr/bin/env python3
"""tool-changer-sws011 の visual メッシュを生成する (再現可能な手続き的著作)。

出力: tool-changer-sws011/meshes/{master,tool}.stl (メートル単位, Z-up)

**参照実機: SCHUNK SWS-011** (SWK-011-000-000 マスタ + SWA-011-000-000 アダプタ)。
寸法は **CC BY-ND 4.0 の STEP を「測定器」として計測した実測値**に合わせてある
(docs/step-measurements.md)。**STEP をテッセレートしたメッシュは ND 条項で配布
できない**ため、ここでは読み取った寸法から手続き的に再著作する。

板は旋盤加工品なので閉じた (r, z) 輪郭の回転体で作る。回転体なら中ぐり
(通し穴・段付き受け穴) がブーリアン無しでそのまま出せる。非軸対称のディテール
(S7 の取付穴、エア通し、側面ポート) だけ後から足す。

依存は trimesh のみ。実行: python tool-changer-sws011/tools/generate_meshes.py
"""

from __future__ import annotations

import math
from pathlib import Path

import numpy as np
import trimesh

MM = 0.001

# ============================ 実測値 (docs/step-measurements.md) ============
# 座標系: 各板のローカル系で原点 = mount 面、+Z がツール側。
# STEP は Y 軸が主軸で向きが逆なので、下記は符号を反転して読み替えた値。

OD = 50.0  # 両半分とも ø50 (実測 ø50.02 / ø50.20)

# --- 取付パターン "S7" (両半分で共通) ---
# 公式カタログ (SWS 011 Main view) で確定: ボルト円 **ø40 公称** (STEP 実測 39.9)。
# SWA ツール側 = M5 めねじ 深さ8 x4、SWK 側 = M3x25 (DIN EN ISO 4762) 貫通 x4。
# STEP で見えた ø4.2 は M5 のねじ下穴だった (docs/step-measurements.md 追記参照)
S7_BCD = 40.0
S7_SWA_THREAD_D = 5.0  # M5 (めねじ)
S7_SWK_BOLT_D = 3.0  # M3 (貫通ボルト)
S7_ANGLES = (45.0, 135.0, 225.0, 315.0)

# --- エア通し 6 ポート (両半分で共通。実測: r=1.4 が半径 17.5 mm 上) ---
AIR_BCD = 35.0
AIR_HOLE_D = 2.8
AIR_COUNT = 6

BORE = 10.0  # 中央通し穴 (実測 r=5.0)

# --- SWK-011 (マスタ) ---
# 実測: 結合面 -> 外周リム上端 15.5 (公表値と一致)、カムボス 12.5、上部構造 12.8
MASTER_H = 15.5  # mount 面 (z=0) -> 結合面
MASTER_CAM_H = 12.5  # 結合面から突き出すカムボス (SWA の受け穴へ入る)
MASTER_CAM_R_BASE = 12.5
MASTER_CAM_R_TIP = 7.8  # 実測
MASTER_TOP_H = 12.8  # mount 面より上 (ロボット側) へ出る上部構造
MASTER_TOP_R = 22.5  # 実測 r 22.35。ロボット側インタフェースプレートの穴で逃がす
MASTER_MASS = 0.13

# --- SWA-011 (アダプタ / ツール側) ---
# 実測: 結合面 -> ツール面 20.6 (公表値と一致)、位置決めリング 3.19、受け穴 r13.5/12.5/9.7
TOOL_H = 20.6  # mount 面 (= 結合面, z=0) -> ツール面
TOOL_RING_H = 3.19  # マスタ側へ突き出す位置決めリング
TOOL_RING_R = (20.0, 24.0)
TOOL_BORE = ((13.5, 9.0), (12.5, 12.0), (9.7, TOOL_H))  # (半径, その段の終端 z)
TOOL_MASS = 0.09

# 結合時の積み高さ = MASTER_H + TOOL_H = 36.1 mm (公表値と一致)


# ----------------------------------------------------------------- HELPERS --
def revolve_closed(profile_rz, sections: int = 64) -> trimesh.Trimesh:
    """閉じた (r, z) 輪郭を Z 軸まわりに回して中空の回転体にする。"""
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


def cyl(p0, p1, radius: float, sections: int = 18) -> trimesh.Trimesh:
    return trimesh.creation.cylinder(
        radius=radius, segment=np.array([p0, p1], dtype=np.float64), sections=sections
    )


def on_circle(pcd: float, angle_deg: float) -> tuple[float, float]:
    a = math.radians(angle_deg)
    return (pcd / 2 * math.cos(a), pcd / 2 * math.sin(a))


def air_ports(z0: float, z1: float) -> list[trimesh.Trimesh]:
    """エア通し 6 ポートの継手 (両半分で共通のパターン)。"""
    out = []
    for i in range(AIR_COUNT):
        x, y = on_circle(AIR_BCD, 30.0 + i * (360.0 / AIR_COUNT))
        out.append(cyl([x, y, z0], [x, y, z1], AIR_HOLE_D / 2 + 1.0, sections=12))
    return out


# ------------------------------------------------------------ MASTER (SWK) --
MASTER_PROFILE = [
    (BORE / 2, -MASTER_TOP_H),  # 通し穴、上部構造の天面
    (MASTER_TOP_R - 7.5, -MASTER_TOP_H),  # 上部構造 天面 (検出シャフト側は絞る)
    (MASTER_TOP_R - 7.5, -MASTER_TOP_H + 6.6),
    (MASTER_TOP_R, -MASTER_TOP_H + 6.6),  # ピストンカバー外周 (実測 r 22.35)
    (MASTER_TOP_R, 0.0),
    (OD / 2 - 1.0, 0.0),  # ロボット側 座面 = 外周リム上端 (実測の薄いリング)
    (OD / 2, 1.0),  # 面取り
    (OD / 2, MASTER_H - 1.0),  # 板外周 ø50
    (OD / 2 - 1.0, MASTER_H),  # 面取り
    (MASTER_CAM_R_BASE, MASTER_H),  # 結合面 (円環)
    (MASTER_CAM_R_BASE, MASTER_H + MASTER_CAM_H - 4.0),  # カムボス
    (MASTER_CAM_R_TIP, MASTER_H + MASTER_CAM_H - 1.5),  # 食い付き角
    (MASTER_CAM_R_TIP, MASTER_H + MASTER_CAM_H),  # ボス先端 (実測 r 7.8)
    (BORE / 2, MASTER_H + MASTER_CAM_H),
]


def build_master() -> trimesh.Trimesh:
    parts = [revolve_closed(MASTER_PROFILE)]

    # S7 固定ボルト M3x25 x4 (SWK を貫通してアダプタプレートのめねじへ)。座ぐり縁を見せる
    for ang in S7_ANGLES:
        x, y = on_circle(S7_BCD, ang)
        parts.append(cyl([x, y, 0.0], [x, y, 3.0], S7_SWK_BOLT_D / 2 + 1.8, sections=14))

    parts += air_ports(MASTER_H - 2.0, MASTER_H + 1.5)

    # ロック / アンロックのエアポート (側面。実測で半径 18.4 / 20.0 に穴)
    for ang in (0.0, 180.0):
        a = math.radians(ang)
        r0, r1 = OD / 2 - 4.0, OD / 2 + 3.0
        parts.append(
            cyl(
                [r0 * math.cos(a), r0 * math.sin(a), MASTER_H / 2],
                [r1 * math.cos(a), r1 * math.sin(a), MASTER_H / 2],
                3.5,
                sections=14,
            )
        )

    # ロッキングボール (カムボスの溝に並ぶ。機構が見えるように)
    for i in range(6):
        x, y = on_circle(MASTER_CAM_R_BASE * 2 - 4.0, i * 60.0)
        ball = trimesh.creation.icosphere(subdivisions=2, radius=2.2)
        ball.apply_translation([x, y, MASTER_H + 5.0])
        parts.append(ball)

    return trimesh.util.concatenate(parts)


# -------------------------------------------------------------- TOOL (SWA) --
def _tool_profile() -> list[tuple[float, float]]:
    p = [
        (TOOL_BORE[0][0], 0.0),  # 受け穴の口 (結合面)
        (TOOL_RING_R[0], 0.0),
        (TOOL_RING_R[0], -TOOL_RING_H),  # 位置決めリング (マスタ側へ +3.19)
        (TOOL_RING_R[1], -TOOL_RING_H),
        (TOOL_RING_R[1], 0.0),
        (OD / 2 - 1.0, 0.0),  # 結合面 (円環)
        (OD / 2, 1.0),  # 面取り
        (OD / 2, TOOL_H - 1.0),  # 板外周 ø50
        (OD / 2 - 1.0, TOOL_H),  # 面取り
    ]
    # 段付き受け穴を上 (ツール面) から下 (結合面) へ辿って閉じる
    for r, z_end in reversed(TOOL_BORE):
        p.append((r, z_end))
    p.append((TOOL_BORE[0][0], TOOL_BORE[0][1]))
    return p


def build_tool() -> trimesh.Trimesh:
    parts = [revolve_closed(_tool_profile())]

    # S7 めねじ M5 深さ8 x4 (次段のツールがここへボルト留めされる)。ねじ座の縁を見せる
    for ang in S7_ANGLES:
        x, y = on_circle(S7_BCD, ang)
        parts.append(cyl([x, y, TOOL_H - 3.0], [x, y, TOOL_H], S7_SWA_THREAD_D / 2 + 1.5, sections=14))

    parts += air_ports(-1.5, 2.0)

    # エアマニホールドのボス (側面)
    for ang in (90.0, 270.0):
        a = math.radians(ang)
        r0, r1 = OD / 2 - 4.0, OD / 2 + 2.5
        parts.append(
            cyl(
                [r0 * math.cos(a), r0 * math.sin(a), TOOL_H / 2],
                [r1 * math.cos(a), r1 * math.sin(a), TOOL_H / 2],
                3.0,
                sections=14,
            )
        )

    return trimesh.util.concatenate(parts)


def main() -> None:
    out_dir = Path(__file__).resolve().parent.parent / "meshes"
    out_dir.mkdir(parents=True, exist_ok=True)
    for name, mesh in (("master", build_master()), ("tool", build_tool())):
        mesh.apply_scale(MM)
        mesh.export(out_dir / f"{name}.stl")
        print(f"{name}.stl: {len(mesh.faces)} faces, bounds {mesh.bounds.round(4).tolist()}")

    print(f"\nOD ø{OD} / S7: BCD ø{S7_BCD} @45deg (SWA: 4x M{S7_SWA_THREAD_D:.0f} / SWK: 4x M{S7_SWK_BOLT_D:.0f} through) / air {AIR_COUNT} x M5 on ø{AIR_BCD}")
    print(f"coupled stack = {MASTER_H + TOOL_H:.1f} mm (SWK {MASTER_H} + SWA {TOOL_H})")


if __name__ == "__main__":
    main()
