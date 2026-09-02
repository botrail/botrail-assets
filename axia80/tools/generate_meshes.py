#!/usr/bin/env python3
"""axia80 の visual メッシュを生成する (再現可能な手続き的著作)。

出力: axia80/meshes/{body,band}.stl (メートル単位, Z-up, 原点 = 取付面中心)

**参照実機: ATI Axia80** (6 軸力覚センサ、M8/M20/M50 共通筐体)。外形は ATI の
公開図面 (Drawing # 9230-05-1507、製品フライヤ掲載) の公表値に合わせてある:

  - **φ82 × 25.4 mm** (航空機グレードアルミ)
  - 取付側・ツール側とも **6× M5×0.8 タップ (等配)、ボルト円 φ71.12**、
    位置決めピン穴 (取付側 2× φ4、ツール側 φ4 + φ3)
  - センシング基準座標系の原点はツール側の面の中心
  - M8 コネクタは側面 (取付面から 6.97 mm)、先端は中心から 50.2 mm

**これは ATI の CAD ではない。** 上の公表値だけを採り、外周の黒帯 (意匠) と
面取り、タップ穴の省略は当方の設計。詳細は README / URDF ヘッダ参照。

座標系: 原点 = mount (取付面 = ロボット側の面の中心)。+Z = ツール側。
コネクタは -X 側 (図面の +X が LED 側 = コネクタの反対)。

依存は trimesh のみ。実行: python axia80/tools/generate_meshes.py
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import trimesh

MM = 0.001
SECTIONS = 128

# ------------------------------------------------- 参照実機の図面値 (mm) --
DIAMETER = 82.0
HEIGHT = 25.4
CONNECTOR_Z = 6.97  # 取付面からコネクタ中心線まで
CONNECTOR_TIP_R = 50.2  # 中心からコネクタ先端まで

# --------------------------------------------------------- 当方設計 (mm) --
BAND_Z = (9.5, 13.5)  # 外周の黒帯 (実機の意匠を模した当方設計)
BAND_INSET = 1.2
CHAMFER = 0.8
CONNECTOR_D = 10.0


def build_body() -> trimesh.Trimesh:
    """面取り + 帯溝つきの回転体。輪郭は軸上で始まり軸上で終わる。"""
    r = DIAMETER / 2
    profile = [
        (0.0, 0.0), (r - CHAMFER, 0.0), (r, CHAMFER),
        (r, BAND_Z[0]), (r - BAND_INSET, BAND_Z[0]), (r - BAND_INSET, BAND_Z[1]), (r, BAND_Z[1]),
        (r, HEIGHT - CHAMFER), (r - CHAMFER, HEIGHT), (0.0, HEIGHT),
    ]
    return trimesh.creation.revolve(np.array(profile) * MM, sections=SECTIONS)


def build_band() -> trimesh.Trimesh:
    band = trimesh.creation.cylinder(radius=(DIAMETER / 2 - BAND_INSET + 0.3) * MM,
                                     height=(BAND_Z[1] - BAND_Z[0] - 0.4) * MM, sections=SECTIONS)
    band.apply_translation([0.0, 0.0, (BAND_Z[0] + BAND_Z[1]) / 2 * MM])
    conn = trimesh.creation.cylinder(radius=CONNECTOR_D / 2 * MM,
                                     height=(CONNECTOR_TIP_R - DIAMETER / 2 + 2.0) * MM, sections=48)
    conn.apply_transform(trimesh.transformations.rotation_matrix(np.pi / 2, [0, 1, 0]))
    conn.apply_translation([-(DIAMETER / 2 + (CONNECTOR_TIP_R - DIAMETER / 2) / 2 - 1.0) * MM, 0.0,
                            CONNECTOR_Z * MM])
    return trimesh.util.concatenate([band, conn])


def main() -> None:
    out_dir = Path(__file__).resolve().parent.parent / "meshes"
    out_dir.mkdir(parents=True, exist_ok=True)
    for name, mesh in (("body", build_body()), ("band", build_band())):
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
