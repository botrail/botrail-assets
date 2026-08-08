#!/usr/bin/env python3
"""weld-gun-c1 の visual メッシュを生成する (再現可能な手続き的著作)。

出力: weld-gun-c1/meshes/{body,electrode_ram}.stl (メートル単位, Z-up)

URDF の collision はプリミティブのままにし (のど開口を保つため)、visual だけを
このスクリプトのメッシュに置き換える。weld-gun-x1 と同じ方針。

寸法の根拠は README と URDF ヘッダを参照 (Milco XR C-gun 637-12402-15 の
公表値 230 x 225 mm / 100 kVA / 1100 lbf / 84 kg に合わせてある)。

依存は trimesh のみ。実行: python weld-gun-c1/tools/generate_meshes.py
"""

from __future__ import annotations

import math
from pathlib import Path

import numpy as np
import trimesh

# ---------------------------------------------------------------- GEOMETRY --
# 座標系: body フレーム。原点 = mount (フランジ接触面)、+Z がツール内側、
# +X がのど深さ方向。可動リンクは RAM_ORIGIN を原点とするローカル系で出力する。

FLANGE_R = 0.080
FLANGE_T = 0.016

# トランス + 制御箱 (MFDC 100 kVA 一体型)
TF = ((-0.130, 0.130), (-0.145, 0.145), (0.016, 0.300))

# C フレーム: 支柱 -> 下アーム / 上ビーム
COLUMN = ((0.130, 0.200), (-0.058, 0.058), (0.060, 0.530))
LOWER_ARM = ((0.145, 0.470), (-0.045, 0.045), (0.075, 0.125))
UPPER_BEAM = ((0.200, 0.485), (-0.052, 0.052), (0.470, 0.530))
ACTUATOR = ((0.365, 0.485), (-0.070, 0.070), (0.355, 0.470))

ELECTRODE_X = 0.425  # 電極軸。支柱前面 0.200 から のど深さ 225 mm
ARM_TOP_Z = 0.125  # 下アーム上面 = のど開口の下端
MOUTH_TOP_Z = 0.355  # アクチュエータ下面 = のど開口の上端 (差 = 230 mm)
TIP_FIXED_Z = 0.195  # 固定電極 先端 (= tcp)
TIP_MOVING_Z = 0.200  # 可動電極 先端 (q=0 で 5 mm クリアランス)
RAM_ORIGIN = np.array([ELECTRODE_X, 0.0, MOUTH_TOP_Z])
STROKE = 0.080
RAM_R = 0.026

# --- ISO 5821 (Resistance spot welding electrode caps) Type F, d1=16, l1=20 ---
# 規格表 (d1=16 の行): d2=6, d3=12, l1=20, l2=9.5, e=4, R1=40, R2=6, Fmax=4 kN
CAP_D1 = 0.016
CAP_L1 = 0.020
CAP_R1 = 0.040
CAP_TAPER = 0.10  # 1:10 テーパ嵌合 (ISO 1089 / ISO 5183)

MOTOR_R = 0.055
MOTOR_Z = (0.530, 0.632)


# ----------------------------------------------------------------- HELPERS --
def box_span(xs, ys, zs) -> trimesh.Trimesh:
    """(x0,x1),(y0,y1),(z0,z1) で与えた直方体。"""
    size = [xs[1] - xs[0], ys[1] - ys[0], zs[1] - zs[0]]
    at = [(xs[0] + xs[1]) / 2, (ys[0] + ys[1]) / 2, (zs[0] + zs[1]) / 2]
    m = trimesh.creation.box(extents=np.asarray(size, dtype=np.float64))
    m.apply_translation(np.asarray(at, dtype=np.float64))
    return m


def cyl_between(p0, p1, radius: float, sections: int = 24) -> trimesh.Trimesh:
    return trimesh.creation.cylinder(
        radius=radius, segment=np.array([p0, p1], dtype=np.float64), sections=sections
    )


def revolve_z(profile_rz, at, sections: int = 28) -> trimesh.Trimesh:
    """(r, z) の輪郭を Z 軸まわりに回して at へ置く。"""
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


def rrect(w: float, h: float, corner: float = 0.30, seg: int = 4):
    """角を丸めた矩形の輪郭 (2D)。鋳物の稜線を落とすため。"""
    r = corner * min(w, h) / 2.0
    pts = []
    for cx, cy, a0 in (
        (w / 2 - r, h / 2 - r, 0.0),
        (-(w / 2 - r), h / 2 - r, math.pi / 2),
        (-(w / 2 - r), -(h / 2 - r), math.pi),
        (w / 2 - r, -(h / 2 - r), 1.5 * math.pi),
    ):
        for i in range(seg + 1):
            a = a0 + (math.pi / 2) * i / seg
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


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


def member(axis: str, stations, corner: float = 0.30) -> trimesh.Trimesh:
    """stations = [(t, centre_a, centre_b, size_a, size_b), ...] を axis に沿ってロフト。

    axis='x' なら t が X、(a,b) が (Y,Z)。断面を変えられるのでテーパが付けられる。
    """
    rings = []
    for t, ca, cb, sa, sb in stations:
        prof = rrect(sa, sb, corner)
        if axis == "x":
            rings.append(np.array([[t, ca + u, cb + v] for u, v in prof]))
        elif axis == "z":
            rings.append(np.array([[ca + u, cb + v, t] for u, v in prof]))
        else:
            rings.append(np.array([[ca + u, t, cb + v] for u, v in prof]))
    return loft(rings)


def rib(xs, ys, zs, n: int, axis: str = "x") -> list[trimesh.Trimesh]:
    """箱の面に並ぶ放熱リブ。見た目の情報量を上げるためだけのもの。"""
    out = []
    if axis == "x":
        for t in np.linspace(xs[0] + 0.02, xs[1] - 0.02, n):
            out.append(box_span((t - 0.004, t + 0.004), (ys[1], ys[1] + 0.008), zs))
            out.append(box_span((t - 0.004, t + 0.004), (ys[0] - 0.008, ys[0]), zs))
    return out


def electrode(tip: np.ndarray, direction: float, holder_len: float) -> list[trimesh.Trimesh]:
    """ISO 5821 Type F キャップ (16 x 20) + ホルダシャンク。direction=+1 で上向き。

    先端は R40 の球面。張り出しは R1 - sqrt(R1^2 - (d1/2)^2) = 0.81 mm しかないので、
    実物と同じ「ほぼ平坦な胴付き円筒」に見える。
    """
    d = direction
    cap_r = CAP_D1 / 2.0
    cap_profile = [(r, CAP_R1 - math.sqrt(CAP_R1**2 - r**2)) for r in np.linspace(0.0, cap_r, 7)]
    cap_profile += [(cap_r, CAP_L1), (0.0, CAP_L1)]
    cap = revolve_z([(r, d * z) for r, z in cap_profile], tip, sections=32)

    shank_top = tip[2] + d * CAP_L1
    taper_rise = CAP_TAPER * 0.012 / 2.0
    holder_profile = [
        (0.0, 0.0),
        (cap_r, 0.0),
        (cap_r + taper_rise, 0.012),
        (0.013, 0.018),
        (0.013, holder_len - 0.014),
        (0.019, holder_len - 0.009),
        (0.019, holder_len),
        (0.0, holder_len),
    ]
    holder = revolve_z(
        [(r, d * z) for r, z in holder_profile],
        np.array([tip[0], tip[1], shank_top]),
        sections=28,
    )
    # 冷却水ニップル
    nip_z = shank_top + d * (holder_len - 0.030)
    nipple = cyl_between(
        [tip[0], 0.0, nip_z], [tip[0], 0.052, nip_z + d * 0.014], 0.007, sections=14
    )
    return [cap, holder, nipple]


# -------------------------------------------------------------- BODY LINK --
def build_body() -> trimesh.Trimesh:
    parts: list[trimesh.Trimesh] = []

    # 取付フランジ (ISO 9409-1 相当の板 + ボルト穴を模したボス)
    parts.append(cyl_between([0, 0, 0.0], [0, 0, FLANGE_T], FLANGE_R, sections=36))
    for a in np.linspace(0, 2 * math.pi, 6, endpoint=False):
        parts.append(
            cyl_between(
                [0.050 * math.cos(a), 0.050 * math.sin(a), FLANGE_T],
                [0.050 * math.cos(a), 0.050 * math.sin(a), FLANGE_T + 0.008],
                0.0065,
                sections=12,
            )
        )

    # トランス + 制御箱。角を落として鋳物らしく見せる
    parts.append(
        member("z", [
            (TF[2][0], 0.0, 0.0, 0.252, 0.282),
            (TF[2][0] + 0.030, 0.0, 0.0, 0.260, 0.290),
            (TF[2][1] - 0.030, 0.0, 0.0, 0.260, 0.290),
            (TF[2][1], 0.0, 0.0, 0.248, 0.278),
        ], corner=0.22)
    )
    parts += rib(TF[0], (-0.142, 0.142), (TF[2][0] + 0.04, TF[2][1] - 0.04), 7)
    # 一次側ケーブルのブッシング
    parts.append(cyl_between([-0.100, 0.0, TF[2][1]], [-0.100, 0.0, TF[2][1] + 0.030], 0.026))
    # 水配管ヘッダ
    parts.append(
        cyl_between([-0.130, 0.100, 0.070], [0.130, 0.100, 0.070], 0.011, sections=14)
    )
    parts.append(
        cyl_between([-0.130, -0.100, 0.070], [0.130, -0.100, 0.070], 0.011, sections=14)
    )

    # C フレーム。鋳物らしく角を落とし、先端に向けて断面を絞る
    # 支柱: 根元が最も太く、上へ行くほど薄い
    parts.append(
        member("z", [
            (0.055, 0.165, 0.0, 0.088, 0.130),
            (0.240, 0.165, 0.0, 0.080, 0.122),
            (0.420, 0.166, 0.0, 0.072, 0.112),
            (0.532, 0.168, 0.0, 0.068, 0.106),
        ])
    )
    # 下アーム: 上面 (= のど下端 0.125) は平らに保ち、下側と幅だけ先細りさせる
    parts.append(
        member("x", [
            (0.145, 0.0, 0.095, 0.096, 0.060),
            (0.300, 0.0, 0.099, 0.086, 0.052),
            (0.400, 0.0, 0.103, 0.076, 0.044),
            (0.472, 0.0, 0.106, 0.068, 0.038),
        ])
    )
    # 上ビーム
    parts.append(
        member("x", [
            (0.196, 0.0, 0.500, 0.110, 0.064),
            (0.340, 0.0, 0.500, 0.102, 0.058),
            (0.487, 0.0, 0.500, 0.096, 0.054),
        ])
    )
    # アクチュエータ筐体
    parts.append(
        member("z", [
            (0.352, ELECTRODE_X, 0.0, 0.126, 0.142),
            (0.410, ELECTRODE_X, 0.0, 0.122, 0.138),
            (0.472, ELECTRODE_X, 0.0, 0.112, 0.128),
        ])
    )
    # 支柱と下アームの付け根のガセット
    for sy in (1, -1):
        parts.append(box_span((0.150, 0.245), (sy * 0.038, sy * 0.050), (0.125, 0.235)))
    # 上ビーム / アクチュエータ取付ボルト
    for bx in (0.372, 0.478):
        for by in (-0.048, 0.048):
            parts.append(cyl_between([bx, by, 0.468], [bx, by, 0.478], 0.008, sections=10))

    # サーボモータ + 減速機
    parts.append(cyl_between([ELECTRODE_X, 0, MOTOR_Z[0]], [ELECTRODE_X, 0, MOTOR_Z[1]], MOTOR_R))
    parts.append(
        cyl_between(
            [ELECTRODE_X, 0, MOTOR_Z[1]], [ELECTRODE_X, 0, MOTOR_Z[1] + 0.028], 0.034, sections=20
        )
    )
    # ボールねじハウジング (ビーム上面 -> アクチュエータ)
    parts.append(
        cyl_between([ELECTRODE_X, 0, ACTUATOR[2][1]], [ELECTRODE_X, 0, MOTOR_Z[0]], 0.040)
    )

    # 固定電極 (下アーム先端、上向き)
    holder_len = TIP_FIXED_Z - CAP_L1 - ARM_TOP_Z
    parts += electrode(np.array([ELECTRODE_X, 0.0, TIP_FIXED_Z]), 1.0, holder_len)
    # 電極台座
    parts.append(
        cyl_between(
            [ELECTRODE_X, 0, ARM_TOP_Z - 0.010], [ELECTRODE_X, 0, ARM_TOP_Z + 0.012], 0.030
        )
    )

    # キックレスケーブル (トランス -> 下アーム)。可撓物なので collision には出さない
    for sy in (1, -1):
        parts.append(
            cyl_between(
                [0.120, sy * 0.070, 0.120], [0.210, sy * 0.055, 0.100], 0.018, sections=14
            )
        )

    return trimesh.util.concatenate(parts)


# -------------------------------------------------- ELECTRODE RAM LINK --
def build_electrode_ram() -> trimesh.Trimesh:
    """可動電極。RAM_ORIGIN を原点とするローカル系で出力する。"""
    parts: list[trimesh.Trimesh] = []
    tip = np.array([ELECTRODE_X, 0.0, TIP_MOVING_Z])
    holder_len = 0.050
    parts += electrode(tip, -1.0, holder_len)
    holder_top = TIP_MOVING_Z + CAP_L1 + holder_len  # 0.270
    # ラム (ボールねじ軸)
    parts.append(
        cyl_between([ELECTRODE_X, 0, holder_top], [ELECTRODE_X, 0, MOUTH_TOP_Z], RAM_R)
    )
    # ラム下端の電極ホルダ受け
    parts.append(
        cyl_between(
            [ELECTRODE_X, 0, holder_top - 0.014], [ELECTRODE_X, 0, holder_top + 0.010], 0.032
        )
    )
    # 回り止めキー
    parts.append(
        box_span(
            (ELECTRODE_X - 0.010, ELECTRODE_X + 0.010),
            (RAM_R - 0.002, RAM_R + 0.012),
            (holder_top + 0.020, MOUTH_TOP_Z - 0.010),
        )
    )
    merged = trimesh.util.concatenate(parts)
    merged.apply_translation(-RAM_ORIGIN)
    return merged


def main() -> None:
    out_dir = Path(__file__).resolve().parent.parent / "meshes"
    out_dir.mkdir(parents=True, exist_ok=True)
    for name, mesh in (("body", build_body()), ("electrode_ram", build_electrode_ram())):
        mesh.export(out_dir / f"{name}.stl")
        print(f"{name}.stl: {len(mesh.faces)} faces, bounds {mesh.bounds.round(4).tolist()}")

    print(f"\nthroat depth = {ELECTRODE_X - COLUMN[0][1]:.3f} m (column face -> electrode axis)")
    print(f"throat gap   = {MOUTH_TOP_Z - ARM_TOP_Z:.3f} m (arm top -> actuator underside)")
    print(f"stroke       = {STROKE:.3f} m, tcp = ({ELECTRODE_X}, 0, {TIP_FIXED_Z})")


if __name__ == "__main__":
    main()
