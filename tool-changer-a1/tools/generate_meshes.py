#!/usr/bin/env python3
"""tool-changer-a1 の visual メッシュを生成する (再現可能な手続き的著作)。

出力: tool-changer-a1/meshes/{master,tool}.stl (メートル単位, Z-up)

板は旋盤加工品なので **閉じた (r, z) 輪郭の回転体** で作る。回転体なら中ぐり
(through bore / パイロット穴 / 受け穴) がブーリアン無しでそのまま出せる。
非軸対称のディテール (ダウエルピン、エア継手、側面ポート) だけ後から足す。

**参照実機: SCHUNK SWS-011** (SWK-011-000-000 マスタ + SWA-011-000-000 アダプタ)。
板厚・質量・性能値はその公表値に合わせてある。インタフェースだけは意図的に
ISO 9409-1-50-4-M6 へ振り替えた (理由は README)。詳細は README / URDF ヘッダ参照。

依存は trimesh のみ。実行: python tool-changer-a1/tools/generate_meshes.py
"""

from __future__ import annotations

import math
from pathlib import Path

import numpy as np
import trimesh

# ---------------------------------------------------------------- GEOMETRY --
# 単位は mm (出力時に m へ換算)。座標系: 各板のローカル系で原点 = mount 面、
# +Z がツール側。master は robot フランジ面が z=0、tool は master との結合面が z=0。

MM = 0.001

# --- ISO 9409-1-50-4-M6 (円形機械インタフェース) ---
# 呼び 50 の行: 外径 63 / ボルト円 50 x 4-M6 / 位置決め径 31.5 / ダウエル 6。
# OMRON i837 (Techman TM5) のフランジ図 "P.C.D ø50.00 / M6 x4 / ø63.00 h8 /
# ø31.50(H7) / ø6.00(H7) x2" と一致することを確認済み
# 参照実機 SWS-011 の外径は ø50 だが、ø50 の胴には ISO 呼び 50 のボルト円 (P.C.D 50)
# が載らない。**カタログ収録済みの UR5e / TM5-900 / 2F-85 と直結できること**を優先し、
# 外径だけ ISO 呼び 50 の外径 63 へ広げてある (README「参照実機との差分」参照)
ISO_OD = 63.0
ISO_PCD = 50.0
ISO_PILOT = 31.5
ISO_DOWEL = 6.0
PILOT_DEPTH = 5.0
DOWEL_PROTRUSION = 4.0

BORE = 10.0  # 中央通し穴 (エア/信号の通り道)
CAM_BOSS = 25.0  # master 側の結合ボス (tool 側の受け穴に入る)

# 板厚は参照実機 SCHUNK SWS-011 の公表値そのまま。
# **マスタの方が薄い**のが実機の姿 (直感に反するが SWK 15.5 < SWA 20.6)
MASTER_H = 15.5  # SWK-011-000-000 の高さ。robot 面 -> 結合面
TOOL_H = 20.6  # SWA-011-000-000 の高さ。結合面 -> ツール面
# 結合時の積み高さ = 36.1 mm (ボスは tool 側に入るので加算されない)

BALL_COUNT = 6  # ロッキングボール (機構が見えるように groove に並べる)
PORT_COUNT = 6  # エア通し継手
PORT_PCD = 44.0


# ----------------------------------------------------------------- HELPERS --
def revolve_closed(profile_rz, sections: int = 64) -> trimesh.Trimesh:
    """閉じた (r, z) 輪郭を Z 軸まわりに回して中空の回転体にする。

    輪郭は自己交差しない閉ループで、軸 (r=0) に触れないこと。触れなければ
    トーラス位相の閉曲面になるので watertight な中ぐり付きソリッドが得られる。
    """
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


def cyl(p0, p1, radius: float, sections: int = 24) -> trimesh.Trimesh:
    return trimesh.creation.cylinder(
        radius=radius, segment=np.array([p0, p1], dtype=np.float64), sections=sections
    )


def on_circle(pcd: float, angle_deg: float) -> tuple[float, float]:
    a = math.radians(angle_deg)
    return (pcd / 2 * math.cos(a), pcd / 2 * math.sin(a))


# ------------------------------------------------------------ MASTER PLATE --
# robot フランジに付く側。内部に piston/cam があり、ボールを外へ押し出して
# tool 側のベアリングレースを掴む (機構は外から見えないので groove とボールで示す)
MASTER_PROFILE = [
    (BORE / 2, -PILOT_DEPTH),  # 通し穴、スピゴット端
    (ISO_PILOT / 2, -PILOT_DEPTH),  # スピゴット端面 (ISO 位置決め径 ø31.5)
    (ISO_PILOT / 2, 0.0),  # スピゴット外周
    (ISO_OD / 2 - 1.0, 0.0),  # robot 側 座面 (円環)
    (ISO_OD / 2, 1.0),  # 面取り
    (ISO_OD / 2, MASTER_H - 1.0),  # 板外周
    (ISO_OD / 2 - 1.0, MASTER_H),  # 面取り
    (CAM_BOSS / 2, MASTER_H),  # 結合面 (円環)
    (CAM_BOSS / 2, MASTER_H + 3.0),  # カムボス
    (CAM_BOSS / 2 - 1.5, MASTER_H + 4.0),  # ボール溝
    (CAM_BOSS / 2 - 1.5, MASTER_H + 5.0),
    (CAM_BOSS / 2, MASTER_H + 6.0),
    (CAM_BOSS / 2, MASTER_H + 7.0),
    (CAM_BOSS / 2 - 1.5, MASTER_H + 8.0),  # 食い付き角 (No-Touch 結合の導入)
    (BORE / 2, MASTER_H + 8.0),  # ボス端面
]


def build_master() -> trimesh.Trimesh:
    parts = [revolve_closed(MASTER_PROFILE)]

    # ダウエルピン 2 本 (robot フランジ側へ突き出す)。ISO のボルト円上、45 度位置
    for ang in (45.0, 225.0):
        x, y = on_circle(ISO_PCD, ang)
        parts.append(cyl([x, y, -DOWEL_PROTRUSION], [x, y, 2.0], ISO_DOWEL / 2, sections=16))

    # エア通し継手 (結合面)。実機の「6 ポート エアパススルー」に相当
    for i in range(PORT_COUNT):
        x, y = on_circle(PORT_PCD, 30.0 + i * 60.0)
        parts.append(cyl([x, y, MASTER_H - 2.0], [x, y, MASTER_H + 2.0], 2.5, sections=12))

    # ロック / アンロック エアポートのボス (側面)
    for ang in (90.0, 270.0):
        a = math.radians(ang)
        r0, r1 = ISO_OD / 2 - 3.0, ISO_OD / 2 + 5.0
        parts.append(
            cyl(
                [r0 * math.cos(a), r0 * math.sin(a), MASTER_H / 2],
                [r1 * math.cos(a), r1 * math.sin(a), MASTER_H / 2],
                4.0,
                sections=14,
            )
        )

    # ロッキングボール。溝から少し出た「ロック状態」で描く
    for i in range(BALL_COUNT):
        x, y = on_circle(CAM_BOSS - 3.0, i * (360.0 / BALL_COUNT))
        ball = trimesh.creation.icosphere(subdivisions=2, radius=3.0)
        ball.apply_translation([x, y, MASTER_H + 4.5])
        parts.append(ball)

    return trimesh.util.concatenate(parts)


# -------------------------------------------------------------- TOOL PLATE --
# エンドエフェクタに付く側。下から master のカムボスを受け、上面は次段へ
# ISO 9409-1-50-4-M6 を提示する (= robot フランジと同じ作法で工具を積める)
TOOL_PROFILE = [
    (CAM_BOSS / 2 + 0.25, 0.0),  # 受け穴の口 (master のカムボスが入る)
    (ISO_OD / 2 - 1.0, 0.0),  # 結合面 (円環)
    (ISO_OD / 2, 1.0),  # 面取り
    (ISO_OD / 2, TOOL_H - 1.0),  # 板外周
    (ISO_OD / 2 - 1.0, TOOL_H),  # 面取り
    (ISO_PILOT / 2, TOOL_H),  # ツール面 -> ISO 位置決め穴 ø31.5 H7
    (ISO_PILOT / 2, TOOL_H - PILOT_DEPTH - 0.5),  # 位置決め穴の底
    (BORE / 2, TOOL_H - PILOT_DEPTH - 0.5),
    (BORE / 2, 9.0),  # 通し穴 -> 受け穴の天井
    (CAM_BOSS / 2 + 0.25, 9.0),  # 受け穴の天井 (円環)
]


def build_tool() -> trimesh.Trimesh:
    parts = [revolve_closed(TOOL_PROFILE)]

    # ベアリングレース (master のボールが噛む輪)。受け穴の内壁にリングで示す
    race = revolve_closed(
        [
            (CAM_BOSS / 2 + 0.25, 3.5),
            (CAM_BOSS / 2 + 1.75, 4.5),
            (CAM_BOSS / 2 + 1.75, 5.5),
            (CAM_BOSS / 2 + 0.25, 6.5),
        ],
        sections=48,
    )
    parts.append(race)

    # 次段へ渡す ISO インタフェースのダウエルピン (ツール面から突き出す)
    for ang in (45.0, 225.0):
        x, y = on_circle(ISO_PCD, ang)
        parts.append(
            cyl([x, y, TOOL_H - 2.0], [x, y, TOOL_H + DOWEL_PROTRUSION], ISO_DOWEL / 2, sections=16)
        )

    # エア通し継手 (結合面側。master の継手と向かい合う)
    for i in range(PORT_COUNT):
        x, y = on_circle(PORT_PCD, 30.0 + i * 60.0)
        parts.append(cyl([x, y, -1.0], [x, y, 3.0], 2.5, sections=12))

    # エアマニホールドのボス (側面)
    for ang in (0.0, 180.0):
        a = math.radians(ang)
        r0, r1 = ISO_OD / 2 - 3.0, ISO_OD / 2 + 4.0
        parts.append(
            cyl(
                [r0 * math.cos(a), r0 * math.sin(a), TOOL_H / 2],
                [r1 * math.cos(a), r1 * math.sin(a), TOOL_H / 2],
                3.5,
                sections=14,
            )
        )

    return trimesh.util.concatenate(parts)


def main() -> None:
    out_dir = Path(__file__).resolve().parent.parent / "meshes"
    out_dir.mkdir(parents=True, exist_ok=True)
    for name, mesh in (("master", build_master()), ("tool", build_tool())):
        mesh.apply_scale(MM)  # mm -> m
        mesh.export(out_dir / f"{name}.stl")
        b = mesh.bounds.round(5).tolist()
        print(f"{name}.stl: {len(mesh.faces)} faces, bounds {b}")

    print(f"\nISO 9409-1-50-4-M6: OD {ISO_OD} / PCD {ISO_PCD} x 4-M6 / pilot {ISO_PILOT}")
    print(f"coupled stack = {MASTER_H + TOOL_H:.1f} mm (master {MASTER_H} + tool {TOOL_H})")


if __name__ == "__main__":
    main()
