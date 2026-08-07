#!/usr/bin/env python3
"""spindle-emsf3060 の visual メッシュを生成する (再現可能な手続き的著作)。

出力: spindle-emsf3060/meshes/{body,collet,cutter}.stl (メートル単位, Z-up)

**参照実機: ナカニシ EMSF-3060K** (フランジ付きモータスピンドル、E3000 シリーズ)。
外形・フランジ位置・コレットナット寸法・質量をカタログ公表値 (E3000 カタログ
p.2-43 の寸法図) に合わせてある。詳細は README / URDF ヘッダ参照。

座標系: 原点 = mount (フランジ前面 = ホルダ後端面が当たる面)。+Z がツール側。
胴はフランジより後ろ (-Z) へ 97.3 mm 突き出す — ブラケット設計はこの逃げが前提。

依存は trimesh のみ。実行: python spindle-emsf3060/tools/generate_meshes.py
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import trimesh

MM = 0.001
SECTIONS = 96

# ------------------------------------------------- 参照実機の図面値 (mm) --
# E3000 カタログ p.2-43 EMSF-3060K 寸法図より。z は mount (フランジ前面) 基準
BARREL_D = 30.0  # 外径 ø30
BARREL_FRONT = 50.0  # フランジ前面 -> 胴前端面 (クランプ不可 50)
BARREL_REAR = -86.3  # 胴後端面 (全長 136.3 = 50 + 8 + 50.5 + 27.8)
FLANGE_D = 46.0  # フランジ外形 (R23)。実機輪郭 43x33 の角丸は円で簡略 (独自著作)
FLANGE_Z = (-8.0, 0.0)  # 厚さ 8
FLANGE_BCD = 39.0  # 本体取り付け穴 4-ø4.2 貫通のボルト円
FLANGE_HOLE_D = 4.2
CORD_STUB_D = 10.0  # 後端のジョイントコード付け根 (コード曲げ半径 60 は非モデル)
CORD_STUB_L = 11.0
NUT_D = 15.9  # コレットナット K-265 (標準装備) ø15.9
NUT_CYL_L = 12.5  # 円筒部
NUT_TOTAL_L = 16.9  # 胴前端面 -> ナット先端 (テーパ 4.4 を含む)
NUT_TIP_D = 9.0  # ナット先端開口まわり (テーパ終端。意匠は独自)

# --- カッタ (当方の設計。CHK コレット ø0.5-6.35 の範囲で ø6 エンドミルを想定) ---
CUTTER_D = 6.0
CUTTER_STICKOUT = 30.0  # ナット先端 -> 工具先端 (工具入れ込み長さ最大 46.4 の範囲)
FLUTE_L = 8.0  # 先端側の刃部 (視覚上わずかに細くして示す)

NUT_Z0 = BARREL_FRONT  # 50.0
NUT_TIP = NUT_Z0 + NUT_TOTAL_L  # 66.9
CUTTER_TIP = NUT_TIP + CUTTER_STICKOUT  # 96.9


# ----------------------------------------------------------------- HELPERS --
def revolve(profile_rz: list[tuple[float, float]]) -> trimesh.Trimesh:
    """軸上で始まり軸上で終わる (r, z) 輪郭 [mm] を Z 軸まわりに回した中実回転体。"""
    pts = np.array(profile_rz, dtype=np.float64)
    mesh = trimesh.creation.revolve(pts[:, [0, 1]], sections=SECTIONS)
    return mesh


def cyl(d: float, z0: float, z1: float) -> trimesh.Trimesh:
    m = trimesh.creation.cylinder(radius=d / 2.0, height=abs(z1 - z0), sections=SECTIONS)
    m.apply_translation([0.0, 0.0, (z0 + z1) / 2.0])
    return m


def to_meters(mesh: trimesh.Trimesh) -> trimesh.Trimesh:
    mesh = mesh.copy()
    mesh.apply_scale(MM)
    return mesh


# -------------------------------------------------------------------- BODY --
def build_body() -> trimesh.Trimesh:
    ch = 1.0  # 前後端の面取り
    barrel = revolve(
        [
            (0.0, BARREL_REAR),
            (BARREL_D / 2 - ch, BARREL_REAR),
            (BARREL_D / 2, BARREL_REAR + ch),
            (BARREL_D / 2, BARREL_FRONT - ch),
            (BARREL_D / 2 - ch, BARREL_FRONT),
            (0.0, BARREL_FRONT),
        ]
    )
    flange = cyl(FLANGE_D, FLANGE_Z[0], FLANGE_Z[1])
    # 取り付け穴 4-ø4.2 (貫通) — 視覚のみの浅いマーカ穴柱で示す (ブーリアンは使わない)
    holes = []
    for k in range(4):
        a = np.deg2rad(45.0 + 90.0 * k)  # 実機の 35° 配置は簡略 (独自著作)
        h = cyl(FLANGE_HOLE_D, FLANGE_Z[0] - 0.3, FLANGE_Z[1] + 0.3)
        h.apply_translation([FLANGE_BCD / 2 * np.cos(a), FLANGE_BCD / 2 * np.sin(a), 0.0])
        holes.append(h)
    stub = revolve(
        [
            (0.0, BARREL_REAR - CORD_STUB_L),
            (CORD_STUB_D / 2, BARREL_REAR - CORD_STUB_L),
            (CORD_STUB_D / 2, BARREL_REAR),
            (0.0, BARREL_REAR),
        ]
    )
    return trimesh.util.concatenate([barrel, flange, *holes, stub])


# ------------------------------------------------------------------ COLLET --
def build_collet() -> trimesh.Trimesh:
    return revolve(
        [
            (0.0, NUT_Z0),
            (NUT_D / 2, NUT_Z0),
            (NUT_D / 2, NUT_Z0 + NUT_CYL_L),
            (NUT_TIP_D / 2, NUT_TIP),
            (0.0, NUT_TIP),
        ]
    )


# ------------------------------------------------------------------ CUTTER --
def build_cutter() -> trimesh.Trimesh:
    shank_l = CUTTER_STICKOUT - FLUTE_L
    return revolve(
        [
            (0.0, NUT_TIP),
            (CUTTER_D / 2, NUT_TIP),
            (CUTTER_D / 2, NUT_TIP + shank_l),
            (CUTTER_D / 2 - 0.2, NUT_TIP + shank_l),  # 刃部はわずかに細く見せる
            (CUTTER_D / 2 - 0.2, CUTTER_TIP - 0.5),
            (CUTTER_D / 2 - 0.8, CUTTER_TIP),
            (0.0, CUTTER_TIP),
        ]
    )


def main() -> None:
    out = Path(__file__).resolve().parent.parent / "meshes"
    out.mkdir(exist_ok=True)
    for name, mesh in [
        ("body", build_body()),
        ("collet", build_collet()),
        ("cutter", build_cutter()),
    ]:
        m = to_meters(mesh)
        path = out / f"{name}.stl"
        m.export(path)
        ext = m.bounds
        print(
            f"{path.name}: {len(m.faces)} faces, "
            f"z [{ext[0][2] * 1000:.1f}, {ext[1][2] * 1000:.1f}] mm"
        )


if __name__ == "__main__":
    main()
