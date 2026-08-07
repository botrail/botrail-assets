#!/usr/bin/env python3
"""vacuum-gripper-ecbpi の visual メッシュを生成する (再現可能な手続き的著作)。

出力: vacuum-gripper-ecbpi/meshes/{body,cups}.stl (メートル単位, Z-up)

**参照実機: Schmalz CobotPump ECBPi** (電動真空発生器)。外形・全高・質量・負荷限界を
その公表値に合わせてある。**取付インタフェースも実機どおり** (3 x M4 / ボルト円 ø46)。
ロボットへは別アセット flange-plate-ecbpi 経由で付く。詳細は README / URDF ヘッダ参照。

胴は**丸みを帯びた三角断面** (Ø151.5 に内接) が実機の姿なので、回転体ではなく
3 ローブ断面のロフトで作る。カップは軸対称なので回転体。

依存は trimesh のみ。実行: python vacuum-gripper-ecbpi/tools/generate_meshes.py
"""

from __future__ import annotations

import math
from pathlib import Path

import numpy as np
import trimesh

# ---------------------------------------------------------------- GEOMETRY --
# 単位は mm (出力時に m へ換算)。原点 = mount (ロボットフランジ接触面)、+Z がツール側。

MM = 0.001

# --- 参照実機 Schmalz ECBPi の公表値 (§4.5 Dimensions) ---
REF_D = 151.5  # 胴の外接円 (丸みのある三角断面)
REF_D2 = 76.0  # 上部ボス径
REF_L = 88.6  # 全高 (mount 面 -> 本体下端)

# --- 取付インタフェース: **参照実機どおり** (取説 §4.5) ---
# Dmk1 = ボルト円 ø46 / G1 = M4-IG (めねじ) / LG1 = ねじ深さ 6。胴の 3 ローブと同じ
# 3 回対称の 3 本止め。**ISO 9409-1 ではない** — ロボットへは Schmalz が別売する
# フランジプレート経由で付く (カタログでは別アセット flange-plate-ecbpi が担当)
MOUNT_BCD = 46.0
MOUNT_THREAD_D = 4.0
MOUNT_THREAD_DEPTH = 6.0
MOUNT_HOLES = 3

NECK_Z = (0.0, 10.0)  # 上部ボス (D2)
BODY_Z = (10.0, 76.0)  # 三角断面の胴
BAYONET_Z = (76.0, REF_L)  # バヨネット (吸着プレートの差し替え口)。下端 = 88.6

# --- 吸着プレート + カップ (参照実機は別売エンドエフェクタ。ここは当方の設計) ---
PLATE_D = 110.0
PLATE_Z = (REF_L, REF_L + 7.4)  # 88.6 -> 96.0
CUP_D = 40.0  # ベローズカップ
CUP_H = 22.0
CUP_PCD = 66.0
CUP_COUNT = 4
TCP_Z = PLATE_Z[1] + CUP_H  # 118.0 — カップ接触面 (= tcp)


# ----------------------------------------------------------------- HELPERS --
def revolve_open(profile_rz, at, sections: int = 32) -> trimesh.Trimesh:
    """軸上で始まり軸上で終わる (r, z) 輪郭を Z 軸まわりに回す (中実の回転体)。"""
    at = np.asarray(at, dtype=np.float64)
    rings, verts, faces = [], [], []
    ang = np.linspace(0.0, 2 * math.pi, sections, endpoint=False)
    for r, z in profile_rz:
        if abs(r) < 1e-9:
            rings.append([len(verts)])
            verts.append(at + [0.0, 0.0, z])
        else:
            rings.append(list(range(len(verts), len(verts) + sections)))
            for a in ang:
                verts.append(at + [r * math.cos(a), r * math.sin(a), z])
    for lo, hi in zip(rings, rings[1:]):
        if len(lo) == 1 and len(hi) == 1:
            continue
        if len(lo) == 1:
            faces += [[lo[0], hi[i], hi[(i + 1) % sections]] for i in range(sections)]
        elif len(hi) == 1:
            faces += [[lo[i], hi[0], lo[(i + 1) % sections]] for i in range(sections)]
        else:
            for i in range(sections):
                j = (i + 1) % sections
                faces += [[lo[i], hi[i], hi[j]], [lo[i], hi[j], lo[j]]]
    m = trimesh.Trimesh(vertices=np.array(verts), faces=np.array(faces), process=True)
    m.fix_normals()
    return m


def loft(rings: list[np.ndarray]) -> trimesh.Trimesh:
    """同じ頂点数のリング列を筒状に張り、両端を閉じる。"""
    n = len(rings[0])
    verts = np.vstack(rings)
    faces = []
    for k in range(len(rings) - 1):
        a, b = k * n, (k + 1) * n
        for i in range(n):
            j = (i + 1) % n
            faces += [[a + i, b + i, b + j], [a + i, b + j, a + j]]
    for base, flip in ((0, True), ((len(rings) - 1) * n, False)):
        for i in range(1, n - 1):
            f = [base, base + i, base + i + 1]
            faces.append(f[::-1] if flip else f)
    m = trimesh.Trimesh(vertices=verts, faces=np.array(faces), process=True)
    m.fix_normals()
    return m


def trilobe_ring(z: float, r_max: float, amp: float, n: int = 96) -> np.ndarray:
    """丸みを帯びた三角断面のリング。r(theta) = (r_max - amp) + amp*cos(3*theta)。

    r_max が外接円半径 (theta = 0, 120, 240 度で到達)。
    """
    ang = np.linspace(0.0, 2 * math.pi, n, endpoint=False)
    r = (r_max - amp) + amp * np.cos(3 * ang)
    return np.stack([r * np.cos(ang), r * np.sin(ang), np.full(n, z)], axis=1)


def cyl(p0, p1, radius: float, sections: int = 32) -> trimesh.Trimesh:
    return trimesh.creation.cylinder(
        radius=radius, segment=np.array([p0, p1], dtype=np.float64), sections=sections
    )


def on_circle(pcd: float, angle_deg: float) -> tuple[float, float]:
    a = math.radians(angle_deg)
    return (pcd / 2 * math.cos(a), pcd / 2 * math.sin(a))


# --------------------------------------------------------------- BODY LINK --
def build_body() -> trimesh.Trimesh:
    parts: list[trimesh.Trimesh] = []

    # 取付ねじ座 (M4-IG x 3, ボルト円 ø46)。めねじなので座の縁だけ形にする。
    # 実機と同じく**取付面から上へ出るものは無い** (フランジプレートが平面で当たる)
    for i in range(MOUNT_HOLES):
        x, y = on_circle(MOUNT_BCD, 60.0 + i * (360.0 / MOUNT_HOLES))
        parts.append(
            cyl([x, y, 0.0], [x, y, MOUNT_THREAD_DEPTH], MOUNT_THREAD_D / 2 + 1.5, sections=14)
        )

    # 上部ボス (参照実機の D2 = Ø76)。天面 (z=0) が取付面
    parts.append(cyl([0, 0, NECK_Z[0]], [0, 0, NECK_Z[1]], REF_D2 / 2))

    # 胴: 丸みを帯びた三角断面。上下を絞って鋳物らしい丸みを出す
    r_max = REF_D / 2
    amp = 14.0
    z0, z1 = BODY_Z
    stations = [
        (z0, REF_D2 / 2 + 2.0, 4.0),
        (z0 + 6.0, r_max - 9.0, amp * 0.7),
        (z0 + 14.0, r_max, amp),
        (z1 - 14.0, r_max, amp),
        (z1 - 5.0, r_max - 7.0, amp * 0.8),
        (z1, r_max - 18.0, amp * 0.5),
    ]
    parts.append(loft([trilobe_ring(z, rm, a) for z, rm, a in stations]))

    # 表示部 (7 セグ LED + ボタン) のパネル。実機の顔なので見える形で入れておく
    panel = trimesh.creation.box(extents=[46.0, 8.0, 30.0])
    panel.apply_translation([0.0, -(r_max - 12.0), (z0 + z1) / 2])
    parts.append(panel)

    # M12 コネクタ (側面)
    a = math.radians(120.0)
    r0, r1 = r_max - 20.0, r_max - 2.0
    parts.append(
        cyl(
            [r0 * math.cos(a), r0 * math.sin(a), (z0 + z1) / 2],
            [r1 * math.cos(a), r1 * math.sin(a), (z0 + z1) / 2],
            7.5,
            sections=20,
        )
    )

    # バヨネット (吸着プレートを工具レスで差し替える口)。爪 3 個
    parts.append(cyl([0, 0, BAYONET_Z[0]], [0, 0, BAYONET_Z[1]], 42.0))
    for i in range(3):
        x, y = on_circle(88.0, i * 120.0)
        parts.append(cyl([x, y, BAYONET_Z[0] + 2.0], [x, y, BAYONET_Z[1] - 2.0], 5.0, sections=14))

    return trimesh.util.concatenate(parts)


# --------------------------------------------------------------- CUPS LINK --
def build_cups() -> trimesh.Trimesh:
    """吸着プレート + ベローズカップ 4 個。body から独立した固定リンクにはせず、
    見た目の都合で別メッシュにしてある (URDF では body と同じリンクに載せる)。"""
    parts: list[trimesh.Trimesh] = []

    # 吸着プレート
    parts.append(cyl([0, 0, PLATE_Z[0]], [0, 0, PLATE_Z[1]], PLATE_D / 2))

    # ベローズカップ (1.5 山)。プレート下面から TCP 面まで
    cup_profile = [
        (0.0, 0.0),
        (CUP_D / 2, 0.0),
        (CUP_D / 2, 4.0),
        (CUP_D / 2 - 3.0, 7.0),
        (CUP_D / 2, 10.0),
        (CUP_D / 2 - 3.0, 13.0),
        (CUP_D / 2, 16.0),
        (CUP_D / 2, 20.0),
        (CUP_D / 2 - 6.0, CUP_H),
        (0.0, CUP_H),
    ]
    for i in range(CUP_COUNT):
        x, y = on_circle(CUP_PCD, 45.0 + i * (360.0 / CUP_COUNT))
        parts.append(revolve_open(cup_profile, [x, y, PLATE_Z[1]]))

    return trimesh.util.concatenate(parts)


def main() -> None:
    out_dir = Path(__file__).resolve().parent.parent / "meshes"
    out_dir.mkdir(parents=True, exist_ok=True)
    for name, mesh in (("body", build_body()), ("cups", build_cups())):
        mesh.apply_scale(MM)
        mesh.export(out_dir / f"{name}.stl")
        print(f"{name}.stl: {len(mesh.faces)} faces, bounds {mesh.bounds.round(4).tolist()}")

    print(f"\nreference ECBPi: D {REF_D} / D2 {REF_D2} / L {REF_L} mm")
    print(f"mount: {MOUNT_HOLES} x M{MOUNT_THREAD_D:.0f} on BCD {MOUNT_BCD} (ECBPi native, not ISO)")
    print(f"tcp = {TCP_Z} mm from the mount face ({CUP_COUNT} x ø{CUP_D} bellows cups)")


if __name__ == "__main__":
    main()
