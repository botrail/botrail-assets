#!/usr/bin/env python3
"""weld-gun-x1 の visual メッシュを生成する (再現可能な手続き的著作)。

出力: weld-gun-x1/meshes/{body,electrode_arm}.stl (メートル単位, Z-up)

URDF の collision はプリミティブのままにし (のど開口を保つため)、visual だけを
このスクリプトのメッシュに置き換える。寸法定数は下の GEOMETRY ブロックに集約して
あるので、botrail 側の著作確定版ではここを実機値に差し替える。

依存は trimesh のみ (shapely / manifold3d 不使用 — ブーリアンは使わない)。
実行: python weld-gun-x1/tools/generate_meshes.py
"""

from __future__ import annotations

import math
from pathlib import Path

import numpy as np
import trimesh

# ---------------------------------------------------------------- GEOMETRY --
# 座標系: body フレーム。原点 = mount (フランジ接触面)、+Z がツール内側、
# +X がのど深さ方向。可動リンクはピボット PIVOT を原点とするローカル系で出力する。

PIVOT = np.array([0.115, 0.0, 0.335])  # アーム交差ピボット (Y 軸まわり)
ELECTRODE_X = 0.553  # 電極軸の X 位置 (クレビス前面 x=0.153 から のど深さ 400 mm)
TIP_FIXED_Z = 0.360  # 固定電極 先端 (= tcp)
TIP_MOVING_Z = 0.365  # 可動電極 先端 (q=0 で 5 mm クリアランス)

# --- ISO 5821 (Resistance spot welding electrode caps) Type F, d1=16, l1=20 ---
# 規格表 (d1=16 の行): d2=6, d3=12, l1=20, l2=9.5, e=4, R1=40, R2=6, Fmax=4 kN
# Type F = 球面 (R1) 先端。テーパ嵌合は 1:10 (ISO 1089 / ISO 5183)
CAP_D1 = 0.016  # キャップ外径
CAP_L1 = 0.020  # キャップ全長
CAP_R1 = 0.040  # 先端球面半径 (Type F)
CAP_TAPER = 0.10  # 1:10 テーパ

FLANGE_R = 0.085  # 取付フランジ板 半径
BOLT_CIRCLE_R = 0.050
BOLT_COUNT = 6

TRANSFORMER_CENTER = np.array([-0.140, 0.0, 0.190])
TRANSFORMER_SIZE = np.array([0.220, 0.300, 0.260])  # MFDC トランス本体

DRIVE_A = np.array([-0.150, 0.0, 0.395])  # サーボ後端
DRIVE_B = np.array([0.025, 0.0, 0.415])  # ボールねじ先端 = タイフレーム連結点

# アーム中心線 (XZ) と断面 (幅 y, 高さ z)。ピボット前方から電極まで。
# のど深さ 400 mm 級はアームが長くなるので根元を太く、先端に向けて強くテーパさせる
FIXED_ARM_PATH = [(0.150, 0.288), (0.280, 0.280), (0.420, 0.275), (0.578, 0.272)]
FIXED_ARM_SECTION = [(0.078, 0.058), (0.068, 0.052), (0.058, 0.046), (0.050, 0.040)]
MOVING_ARM_PATH = [(0.150, 0.375), (0.280, 0.412), (0.430, 0.443), (0.578, 0.462)]
MOVING_ARM_SECTION = [(0.062, 0.064), (0.054, 0.056), (0.046, 0.048), (0.042, 0.042)]

CLEVIS_Y = 0.048  # 固定側クレビス板の中心 Y (可動ブレードを挟む)
CLEVIS_T = 0.020
BLADE_T = 0.056  # 可動側ブレード厚

OUT_DIR = Path(__file__).resolve().parent.parent / "meshes"


# ----------------------------------------------------------------- HELPERS --
def _mesh(vertices: np.ndarray, faces: list[list[int]]) -> trimesh.Trimesh:
    m = trimesh.Trimesh(np.asarray(vertices, dtype=np.float64), np.asarray(faces, dtype=np.int64))
    m.fix_normals()
    return m


def prism_xz(points_xz: list[tuple[float, float]], thickness: float, y: float = 0.0):
    """XZ 平面の凸多角形を Y 方向に押し出す (板・ガセット用)。"""
    pts = np.asarray(points_xz, dtype=np.float64)
    n = len(pts)
    y0, y1 = y - thickness / 2.0, y + thickness / 2.0
    verts = np.vstack(
        [
            np.column_stack([pts[:, 0], np.full(n, y0), pts[:, 1]]),
            np.column_stack([pts[:, 0], np.full(n, y1), pts[:, 1]]),
        ]
    )
    faces: list[list[int]] = []
    for i in range(1, n - 1):  # 端面 (凸なので扇状分割)
        faces.append([0, i, i + 1])
        faces.append([n, n + i, n + i + 1])
    for i in range(n):  # 側面
        j = (i + 1) % n
        faces.append([i, n + i, n + j])
        faces.append([i, n + j, j])
    return _mesh(verts, faces)


def loft(rings: list[np.ndarray]) -> trimesh.Trimesh:
    """同一頂点数の閉リング列を張り合わせ、両端を塞ぐ (リングは凸前提)。"""
    n, k = len(rings[0]), len(rings)
    verts = np.vstack(rings)
    faces: list[list[int]] = []
    for s in range(k - 1):
        a, b = s * n, (s + 1) * n
        for i in range(n):
            j = (i + 1) % n
            faces.append([a + i, b + i, b + j])
            faces.append([a + i, b + j, a + j])
    for i in range(1, n - 1):
        faces.append([0, i, i + 1])
    base = (k - 1) * n
    for i in range(1, n - 1):
        faces.append([base, base + i, base + i + 1])
    return _mesh(verts, faces)


def rounded_rect(width: float, height: float, corner: float = 0.35, seg: int = 5):
    """角丸長方形の 2D 輪郭 (幅方向, 高さ方向)。corner は短辺に対する丸め比。"""
    r = corner * min(width, height) / 2.0
    cx, cy = width / 2.0 - r, height / 2.0 - r
    centers = [(cx, cy), (-cx, cy), (-cx, -cy), (cx, -cy)]
    pts = []
    for q, (ox, oy) in enumerate(centers):
        a0 = math.radians(q * 90)
        for t in np.linspace(a0, a0 + math.pi / 2.0, seg, endpoint=False):
            pts.append((ox + r * math.cos(t), oy + r * math.sin(t)))
    return np.asarray(pts, dtype=np.float64)


def ngon(radius: float, sides: int = 8, rotate: float = 0.0):
    """正 n 角形の 2D 輪郭 (loft のリング数合わせ用)。"""
    a = np.linspace(0.0, 2 * math.pi, sides, endpoint=False) + rotate
    return np.column_stack([radius * np.cos(a), radius * np.sin(a)])


def ring_xy(profile2d, z: float) -> np.ndarray:
    """2D 輪郭を Z=z の水平リングとして 3D 化する。"""
    p = np.asarray(profile2d, dtype=np.float64)
    return np.column_stack([p[:, 0], p[:, 1], np.full(len(p), z)])


def bolt(center, direction: str, radius: float = 0.0065, height: float = 0.008):
    """六角ボルト頭 (面のディテール用)。"""
    m = trimesh.creation.cylinder(radius=radius, height=height, sections=6)
    if direction == "x":
        m.apply_transform(trimesh.transformations.rotation_matrix(math.pi / 2, [0, 1, 0]))
    elif direction == "y":
        m.apply_transform(trimesh.transformations.rotation_matrix(math.pi / 2, [1, 0, 0]))
    m.apply_translation(np.asarray(center, dtype=np.float64))
    return m


def beam(path_xz, sections, y: float = 0.0, corner: float = 0.35, seg: int = 5):
    """XZ 平面の折れ線に沿ったテーパー角丸ビーム (鍛造アーム用)。"""
    path = np.asarray(path_xz, dtype=np.float64)
    rings = []
    for i, (px, pz) in enumerate(path):
        prev = path[max(i - 1, 0)]
        nxt = path[min(i + 1, len(path) - 1)]
        d = nxt - prev
        d /= np.linalg.norm(d)
        up = np.array([-d[1], 0.0, d[0]])  # XZ 面内の法線
        side = np.array([0.0, 1.0, 0.0])
        w, h = sections[i]
        profile = rounded_rect(w, h, corner, seg)
        center = np.array([px, y, pz])
        rings.append(center + profile[:, 0:1] * side + profile[:, 1:2] * up)
    return loft(rings)


def tube(path_xyz, radius: float, sections: int = 10) -> trimesh.Trimesh:
    """3D 折れ線に沿った円管 (冷却ホース・シャント用)。"""
    path = np.asarray(path_xyz, dtype=np.float64)
    angles = np.linspace(0.0, 2 * math.pi, sections, endpoint=False)
    ref = np.array([0.0, 1.0, 0.0])
    rings = []
    for i, p in enumerate(path):
        prev = path[max(i - 1, 0)]
        nxt = path[min(i + 1, len(path) - 1)]
        t = nxt - prev
        t /= np.linalg.norm(t)
        if abs(np.dot(t, ref)) > 0.95:
            ref_i = np.array([0.0, 0.0, 1.0])
        else:
            ref_i = ref
        side = np.cross(t, ref_i)
        side /= np.linalg.norm(side)
        up = np.cross(side, t)
        rings.append(
            p + radius * (np.outer(np.cos(angles), side) + np.outer(np.sin(angles), up))
        )
    return loft(rings)


def revolve_z(profile_rz, at, axis: str = "z", sections: int = 28) -> trimesh.Trimesh:
    """(半径, 高さ) 輪郭を回して配置する。axis='y' なら Y 軸まわりに倒す。"""
    m = trimesh.creation.revolve(np.asarray(profile_rz, dtype=np.float64), sections=sections)
    if axis == "y":
        m.apply_transform(trimesh.transformations.rotation_matrix(math.pi / 2, [1, 0, 0]))
    elif axis == "x":
        m.apply_transform(trimesh.transformations.rotation_matrix(math.pi / 2, [0, 1, 0]))
    m.apply_translation(np.asarray(at, dtype=np.float64))
    return m


def box_at(size, at, rpy=(0.0, 0.0, 0.0)) -> trimesh.Trimesh:
    m = trimesh.creation.box(extents=np.asarray(size, dtype=np.float64))
    if any(rpy):
        m.apply_transform(trimesh.transformations.euler_matrix(*rpy))
    m.apply_translation(np.asarray(at, dtype=np.float64))
    return m


def cyl_between(p0, p1, radius: float, sections: int = 20) -> trimesh.Trimesh:
    return trimesh.creation.cylinder(
        radius=radius, segment=np.array([p0, p1], dtype=np.float64), sections=sections
    )


def electrode(tip: np.ndarray, direction: float, holder_len: float) -> list[trimesh.Trimesh]:
    """電極 = ISO 5821 Type F キャップ (16 x 20) + ホルダシャンク。direction=+1 で上向き。

    キャップ形状は規格どおり: 先端は R40 の球面、そこから ⌀16 の胴が全長 20 mm。
    球面の張り出しは R1 - sqrt(R1^2 - (d1/2)^2) = 0.81 mm しかないので、実物の
    スポット溶接キャップと同じ「ほぼ平坦な胴付き円筒」に見える。
    """
    d = direction
    cap_r = CAP_D1 / 2.0
    dome_h = CAP_R1 - math.sqrt(CAP_R1**2 - cap_r**2)
    # 先端球面 -> ⌀16 胴 -> 背面
    cap_profile = [
        (r, CAP_R1 - math.sqrt(CAP_R1**2 - r**2)) for r in np.linspace(0.0, cap_r, 7)
    ]
    cap_profile += [(cap_r, CAP_L1), (0.0, CAP_L1)]
    cap = revolve_z([(r, d * z) for r, z in cap_profile], tip, sections=32)

    shank_top = tip[2] + d * CAP_L1
    # ホルダ: キャップ背面と同径 (⌀16) から立ち上がり、1:10 テーパ嵌合部を経て
    # アーム取付部へ段付きで太る
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
    # 冷却水継手 (斜め上に出るニップル)
    nip_base = np.array([tip[0], tip[1], shank_top + d * (holder_len - 0.024)])
    nip_tip = nip_base + np.array([-0.020, 0.026, d * 0.010])
    fitting = cyl_between(nip_base, nip_tip, 0.0075)
    assert dome_h > 0
    return [cap, holder, fitting]


# -------------------------------------------------------------- BODY LINK --
def build_body() -> trimesh.Trimesh:
    parts: list[trimesh.Trimesh] = []

    # 1) 取付フランジ板 (段付き円板 + ボルト頭 + 位置決めスピゴット)
    parts.append(
        revolve_z(
            [
                (0.0, 0.0),
                (FLANGE_R, 0.0),
                (FLANGE_R, 0.013),
                (0.066, 0.017),
                (0.066, 0.026),
                (0.0, 0.026),
            ],
            [0.0, 0.0, 0.0],
            sections=40,
        )
    )
    for i in range(BOLT_COUNT):
        a = 2 * math.pi * i / BOLT_COUNT + math.pi / BOLT_COUNT
        c = np.array([BOLT_CIRCLE_R * math.cos(a), BOLT_CIRCLE_R * math.sin(a), 0.013])
        parts.append(trimesh.creation.cylinder(radius=0.0085, height=0.010, sections=6).apply_translation(c + [0, 0, 0.005]))  # noqa: E501

    # 2) ブラケット (溶接構造: ライザ + 縦リブ + 側板 + 天板 + ガセット)
    parts.append(  # フランジ板からブラケットへ広がるライザ
        loft(
            [
                ring_xy(ngon(0.076, 8, math.pi / 8), 0.024),
                ring_xy(ngon(0.086, 8, math.pi / 8), 0.048),
                ring_xy(rounded_rect(0.180, 0.180, 0.45, 2), 0.082),
            ]
        )
    )
    parts.append(box_at((0.170, 0.026, 0.250), (0.010, 0.0, 0.150)))
    for sy in (-1, 1):
        parts.append(box_at((0.170, 0.020, 0.250), (0.010, sy * 0.076, 0.150)))
        parts.append(  # ガセット (三角板)
            prism_xz(
                [(-0.070, 0.028), (0.072, 0.028), (0.072, 0.115)],
                0.016,
                y=sy * 0.050,
            )
        )
    parts.append(box_at((0.200, 0.190, 0.024), (0.016, 0.0, 0.268)))

    # 3) MFDC トランス (面取り天面 + 冷却フィン + 端子箱 + 銘板)
    tx, _, tz = TRANSFORMER_CENTER
    sx, sy_, sz = TRANSFORMER_SIZE
    x0, x1 = tx - sx / 2, tx + sx / 2
    z0, z1 = tz - sz / 2, tz + sz / 2
    parts.append(
        loft(
            [
                np.array(
                    [
                        [x0 + 0.012, -sy_ / 2, z0],
                        [x1 - 0.012, -sy_ / 2, z0],
                        [x1, -sy_ / 2 + 0.012, z0],
                        [x1, sy_ / 2 - 0.012, z0],
                        [x1 - 0.012, sy_ / 2, z0],
                        [x0 + 0.012, sy_ / 2, z0],
                        [x0, sy_ / 2 - 0.012, z0],
                        [x0, -sy_ / 2 + 0.012, z0],
                    ]
                ),
                np.array(
                    [
                        [x0 + 0.012, -sy_ / 2, z1 - 0.018],
                        [x1 - 0.012, -sy_ / 2, z1 - 0.018],
                        [x1, -sy_ / 2 + 0.012, z1 - 0.018],
                        [x1, sy_ / 2 - 0.012, z1 - 0.018],
                        [x1 - 0.012, sy_ / 2, z1 - 0.018],
                        [x0 + 0.012, sy_ / 2, z1 - 0.018],
                        [x0, sy_ / 2 - 0.012, z1 - 0.018],
                        [x0, -sy_ / 2 + 0.012, z1 - 0.018],
                    ]
                ),
                np.array(  # 天面を面取り
                    [
                        [x0 + 0.026, -sy_ / 2 + 0.014, z1],
                        [x1 - 0.026, -sy_ / 2 + 0.014, z1],
                        [x1 - 0.014, -sy_ / 2 + 0.026, z1],
                        [x1 - 0.014, sy_ / 2 - 0.026, z1],
                        [x1 - 0.026, sy_ / 2 - 0.014, z1],
                        [x0 + 0.026, sy_ / 2 - 0.014, z1],
                        [x0 + 0.014, sy_ / 2 - 0.026, z1],
                        [x0 + 0.014, -sy_ / 2 + 0.026, z1],
                    ]
                ),
            ]
        )
    )
    for i in range(7):  # 冷却フィン
        parts.append(
            box_at((sx - 0.070, 0.008, 0.022), (tx, -0.084 + i * 0.028, z1 + 0.010))
        )
    parts.append(box_at((0.070, 0.110, 0.058), (x0 + 0.045, 0.0, z0 - 0.022)))  # 端子箱
    parts.append(box_at((0.004, 0.090, 0.055), (x0 - 0.002, 0.055, tz + 0.030)))  # 銘板
    for sy in (-1, 1):  # 側面補強リブ
        for i in range(3):
            parts.append(box_at((0.016, 0.006, sz - 0.040), (x0 + 0.045 + i * 0.065, sy * sy_ / 2, tz)))  # noqa: E501
    for i in range(3):  # 端面のケース締結ボルト
        for k in (-1, 1):
            parts.append(bolt([x0 - 0.004, k * 0.115, z0 + 0.045 + i * 0.085], "x"))
    for i in range(4):  # 天面カバーのボルト列
        for k in (-1, 1):
            parts.append(bolt([x0 + 0.030 + i * 0.050, k * 0.132, z1 + 0.002], "z"))
    parts.append(  # 二次側ターミナル (アーム側へ電流を送る銅バー座)
        box_at((0.052, 0.150, 0.036), (x1 - 0.010, 0.0, z1 - 0.048))
    )

    # 4) サーボ + ボールねじ (トランス上面に載り、タイフレームを押し引きする)
    axis = DRIVE_B - DRIVE_A
    length = float(np.linalg.norm(axis))
    axis /= length
    motor_end = DRIVE_A + axis * 0.135
    parts.append(cyl_between(DRIVE_A, motor_end, 0.050, sections=28))
    parts.append(cyl_between(DRIVE_A - axis * 0.052, DRIVE_A, 0.036, sections=24))  # ブレーキ/エンコーダ
    parts.append(cyl_between(DRIVE_A - axis * 0.062, DRIVE_A - axis * 0.052, 0.022, sections=16))
    for i in range(4):  # モータ胴の冷却リブ
        parts.append(cyl_between(DRIVE_A + axis * (0.030 + i * 0.026), DRIVE_A + axis * (0.034 + i * 0.026), 0.054, sections=28))  # noqa: E501
    nut_center = motor_end + axis * 0.045
    parts.append(box_at((0.090, 0.100, 0.096), nut_center))  # ナット/減速ハウジング
    parts.append(cyl_between(nut_center + axis * 0.040, DRIVE_B, 0.014, sections=16))  # ねじ軸
    parts.append(cyl_between(DRIVE_B - axis * 0.018, DRIVE_B + axis * 0.004, 0.024, sections=20))
    # モータ取付脚
    parts.append(box_at((0.150, 0.130, 0.016), (DRIVE_A[0] + 0.060, 0.0, DRIVE_A[2] - 0.052)))
    for sy in (-1, 1):
        parts.append(
            prism_xz(
                [(-0.230, 0.300), (-0.060, 0.300), (-0.060, 0.345), (-0.230, 0.345)],
                0.014,
                y=sy * 0.060,
            )
        )

    # 5) ピボットクレビス (固定側の二枚板 + ピン)
    px, pz = PIVOT[0], PIVOT[2]
    for sy in (-1, 1):
        parts.append(
            prism_xz(
                [
                    (px - 0.105, pz - 0.070),
                    (px - 0.020, pz - 0.058),
                    (px + 0.038, pz - 0.006),
                    (px + 0.030, pz + 0.042),
                    (px - 0.070, pz + 0.010),
                ],
                CLEVIS_T,
                y=sy * CLEVIS_Y,
            )
        )
    parts.append(
        cyl_between([px, -0.072, pz], [px, 0.072, pz], 0.026, sections=24)
    )  # ピボットピン
    for sy in (-1, 1):  # ピン頭 / 止め輪
        parts.append(
            cyl_between([px, sy * 0.072, pz], [px, sy * 0.080, pz], 0.034, sections=24)
        )

    # 6) 固定アーム + 固定電極 (下側 / 上向き電極)
    parts.append(beam(FIXED_ARM_PATH, FIXED_ARM_SECTION))
    parts.append(box_at((0.040, 0.092, 0.070), (0.162, 0.0, 0.294)))  # アーム根元のクランプ
    parts.append(
        prism_xz(
            [(0.126, 0.256), (0.180, 0.256), (0.180, 0.332), (0.126, 0.324)], 0.078
        )
    )  # アームホルダ
    tip_fixed = np.array([ELECTRODE_X, 0.0, TIP_FIXED_Z])
    parts.extend(electrode(tip_fixed, direction=-1.0, holder_len=0.048))
    parts.append(  # 電極台座 (アーム断面から電極ホルダへのテーパーボス)
        loft(
            [
                ring_xy(rounded_rect(0.050, 0.042, 0.40, 5) + [ELECTRODE_X - 0.004, 0.0], 0.262),
                ring_xy(rounded_rect(0.046, 0.038, 0.60, 5) + [ELECTRODE_X - 0.002, 0.0], 0.282),
                ring_xy(ngon(0.021, 20) + [ELECTRODE_X, 0.0], 0.294),
            ]
        )
    )
    parts.append(  # 外側面 (下面) の稜線リブ — 鍛造アームの補強ウェブ
        beam(
            [(0.175, 0.262), (0.340, 0.256), (0.520, 0.253)],
            [(0.032, 0.017), (0.026, 0.014), (0.020, 0.011)],
        )
    )
    for sy in (-1, 1):  # ホースクランプ
        parts.append(box_at((0.026, 0.020, 0.018), (0.300, sy * 0.050, 0.283)))
        parts.append(box_at((0.024, 0.018, 0.016), (0.450, sy * 0.041, 0.278)))

    # 7) 冷却水マニホールド + ソレノイドバルブ (ホースの起点)
    parts.append(box_at((0.070, 0.046, 0.056), (0.030, 0.086, 0.232)))
    parts.append(box_at((0.070, 0.046, 0.056), (0.030, -0.086, 0.232)))
    for sy in (-1, 1):
        for i in range(2):
            parts.append(
                cyl_between(
                    [0.012 + i * 0.034, sy * 0.086, 0.258],
                    [0.012 + i * 0.034, sy * 0.086, 0.272],
                    0.009,
                    sections=14,
                )
            )
    parts.append(box_at((0.058, 0.052, 0.086), (-0.040, 0.092, 0.210)))  # バルブブロック
    parts.append(cyl_between([-0.040, 0.092, 0.253], [-0.040, 0.092, 0.286], 0.020, sections=18))

    # 8) 冷却ホース (アーム側面に沿って走る)
    parts.append(
        tube(
            [
                [0.060, 0.072, 0.250],
                [0.170, 0.082, 0.266],
                [0.320, 0.060, 0.276],
                [0.470, 0.046, 0.276],
                [0.536, 0.040, 0.300],
            ],
            0.0095,
        )
    )
    parts.append(
        tube(
            [
                [0.060, -0.072, 0.250],
                [0.170, -0.082, 0.266],
                [0.320, -0.060, 0.276],
                [0.470, -0.046, 0.276],
                [0.536, -0.040, 0.300],
            ],
            0.0095,
        )
    )
    # 一次側ケーブル (トランス -> 端子)
    parts.append(
        tube(
            [
                [-0.240, 0.090, 0.075],
                [-0.190, 0.108, 0.150],
                [-0.150, 0.100, 0.240],
                [-0.120, 0.078, 0.300],
            ],
            0.013,
        )
    )
    # キックレスケーブル (トランス -> 固定アーム根元, 太い可撓導体)
    parts.append(
        tube(
            [
                [-0.040, 0.058, 0.120],
                [0.020, 0.070, 0.150],
                [0.080, 0.072, 0.210],
                [0.115, 0.060, 0.262],
                [0.140, 0.048, 0.280],
            ],
            0.019,
            sections=12,
        )
    )

    merged = trimesh.util.concatenate(parts)
    merged.merge_vertices()
    return merged


# ----------------------------------------------------- ELECTRODE ARM LINK --
def build_electrode_arm() -> trimesh.Trimesh:
    """可動アーム。body 座標で作り、最後にピボット原点へ移す。"""
    parts: list[trimesh.Trimesh] = []
    px, pz = PIVOT[0], PIVOT[2]

    # ピボットブレード + タイフレーム (ボールねじ連結側のテール)
    parts.append(
        prism_xz(
            [
                (px - 0.104, pz + 0.086),
                (px - 0.060, pz + 0.070),
                (px + 0.040, pz + 0.006),
                (px + 0.046, pz + 0.052),
                (px - 0.052, pz + 0.116),
            ],
            BLADE_T,
        )
    )
    parts.append(cyl_between([px, -0.030, pz], [px, 0.030, pz], 0.040, sections=24))  # ボス
    parts.append(
        cyl_between([DRIVE_B[0], -0.032, DRIVE_B[2]], [DRIVE_B[0], 0.032, DRIVE_B[2]], 0.026)
    )  # ねじ連結ピン

    # 可動アーム + 可動電極 (上側 / 下向き電極)
    parts.append(beam(MOVING_ARM_PATH, MOVING_ARM_SECTION))
    parts.append(box_at((0.038, 0.078, 0.066), (0.160, 0.0, 0.377)))  # 根元クランプ
    parts.append(
        prism_xz([(0.124, 0.334), (0.178, 0.348), (0.178, 0.412), (0.124, 0.396)], 0.062)
    )
    tip_moving = np.array([ELECTRODE_X, 0.0, TIP_MOVING_Z])
    parts.extend(electrode(tip_moving, direction=1.0, holder_len=0.048))
    parts.append(  # 電極台座 (テーパーボス)
        loft(
            [
                ring_xy(rounded_rect(0.044, 0.044, 0.40, 5) + [ELECTRODE_X - 0.004, 0.0], 0.472),
                ring_xy(rounded_rect(0.040, 0.040, 0.60, 5) + [ELECTRODE_X - 0.002, 0.0], 0.452),
                ring_xy(ngon(0.021, 20) + [ELECTRODE_X, 0.0], 0.441),
            ]
        )
    )
    parts.append(  # 外側面 (上面) の稜線リブ
        beam(
            [(0.178, 0.410), (0.350, 0.454), (0.520, 0.484)],
            [(0.028, 0.016), (0.023, 0.013), (0.018, 0.011)],
        )
    )
    for sy in (-1, 1):  # ホースクランプ
        parts.append(box_at((0.026, 0.018, 0.016), (0.300, sy * 0.044, 0.418)))
        parts.append(box_at((0.024, 0.016, 0.014), (0.450, sy * 0.037, 0.447)))

    # 冷却ホース + シャント (可動側)
    for sy in (-1, 1):
        parts.append(
            tube(
                [
                    [0.150, sy * 0.052, 0.392],
                    [0.280, sy * 0.058, 0.424],
                    [0.430, sy * 0.046, 0.452],
                    [0.532, sy * 0.038, 0.462],
                ],
                0.0090,
            )
        )
    parts.append(
        tube(
            [
                [px - 0.060, 0.046, pz + 0.062],
                [px - 0.010, 0.056, pz + 0.036],
                [0.080, 0.058, 0.352],
                [0.140, 0.050, 0.372],
            ],
            0.017,
            sections=12,
        )
    )

    merged = trimesh.util.concatenate(parts)
    merged.apply_translation(-PIVOT)  # electrode_arm リンク座標へ
    merged.merge_vertices()
    return merged


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for name, mesh in (("body", build_body()), ("electrode_arm", build_electrode_arm())):
        path = OUT_DIR / f"{name}.stl"
        mesh.export(path)
        print(
            f"{path.name}: {len(mesh.faces)} faces, "
            f"extent {np.round(mesh.extents, 3)}, watertight={mesh.is_watertight}"
        )


if __name__ == "__main__":
    main()
