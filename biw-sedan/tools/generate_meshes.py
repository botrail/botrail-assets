#!/usr/bin/env python3
"""biw-sedan の visual メッシュと authored collision compound を生成する。

出力:
  biw-sedan/meshes/visual/biw.stl          — 全ピースを結合した表示用メッシュ
  biw-sedan/meshes/collision/<name>.stl    — **凸ピース 1 個 = 1 ファイル**

collision をピースのまま出すのが肝。BIW の衝突プロキシは「開口を保った凸 compound」
なので、リンク単位でマージ + 穴埋めされるとドア開口・ホイールアーチ・窓が塞がって
壊れる。builder 側は recipe の `collision_mode: authored` でこの経路を素通しする
(docs/weld-line-requests.md #3)。

visual と collision は**同じピース集合**から作る。こうすると衝突形状が見た目より
痩せる/太ることが構造的に起きない。各ピースは直線区間ごとの loft なので凸。

座標系: X = 車両前後 (前が +X)、Y = 左右、Z = 上。原点は床下 (ロッカー下面) の
車体中心 = 治具の基準点。単位 m。

依存は trimesh のみ。実行: python biw-sedan/tools/generate_meshes.py
"""

from __future__ import annotations

import math
from pathlib import Path

import numpy as np
import trimesh

OUT = Path(__file__).resolve().parent.parent / "meshes"

# ---------------------------------------------------------------- GEOMETRY --
LENGTH, WIDTH, HEIGHT = 4.20, 1.74, 1.42  # 全長 / 全幅 / 全高
SIDE_Y = 0.820  # ボディサイド外板の Y (全幅 1.74 に収まる位置)
FLOOR_Z = 0.15  # 床パン上面
SILL_TOP = 0.34  # ロッカー上面 = ドア開口の下辺
RAIL_BOT = 1.15  # ルーフレール下面 = ドア開口の上辺
AXLE_F, AXLE_R = 1.30, -1.30  # 前後車軸 (ホイールアーチ中心)
ARCH_R = 0.40


def rounded_rect(width: float, height: float, corner: float = 0.30, seg: int = 6):
    """角丸長方形の 2D 輪郭。プレス成形パネルらしい見え方になる。"""
    r = corner * min(width, height) / 2.0
    cx, cy = width / 2.0 - r, height / 2.0 - r
    pts = []
    for q, (ox, oy) in enumerate([(cx, cy), (-cx, cy), (-cx, -cy), (cx, -cy)]):
        a0 = math.radians(q * 90)
        for t in np.linspace(a0, a0 + math.pi / 2.0, seg, endpoint=False):
            pts.append((ox + r * math.cos(t), oy + r * math.sin(t)))
    return np.asarray(pts, dtype=np.float64)


def _loft(ring_a: np.ndarray, ring_b: np.ndarray) -> trimesh.Trimesh:
    """2 つの閉リングを張り合わせて両端を塞ぐ。リングが凸なら結果も凸。"""
    n = len(ring_a)
    verts = np.vstack([ring_a, ring_b])
    faces: list[list[int]] = []
    for i in range(n):
        j = (i + 1) % n
        faces.append([i, n + i, n + j])
        faces.append([i, n + j, j])
    for i in range(1, n - 1):
        faces.append([0, i, i + 1])
        faces.append([n, n + i, n + i + 1])
    m = trimesh.Trimesh(verts, np.asarray(faces, dtype=np.int64))
    m.fix_normals()
    return m


def member(path_xz, section, y: float = 0.0, corner: float = 0.30, seg: int = 6):
    """XZ 折れ線に沿った角丸断面の構造材。**直線区間ごとに凸ピースを返す**。

    section は (幅 y, 高さ z) を各パス点で与える。曲がった材は区間ごとに分かれる
    ので、そのまま凸 compound のピースになる。
    """
    path = np.asarray(path_xz, dtype=np.float64)
    rings = []
    for i, (px, pz) in enumerate(path):
        prev = path[max(i - 1, 0)]
        nxt = path[min(i + 1, len(path) - 1)]
        d = nxt - prev
        d /= np.linalg.norm(d)
        up = np.array([-d[1], 0.0, d[0]])
        side = np.array([0.0, 1.0, 0.0])
        w, h = section[i]
        prof = rounded_rect(w, h, corner, seg)
        c = np.array([px, y, pz])
        rings.append(c + prof[:, 0:1] * side + prof[:, 1:2] * up)
    # 折れ点のミターで端区間の凸性が崩れることがある。ピースは消費側で凸包として
    # 使われる前提なので、ここで凸包に丸めておく (見た目の差は無視できる)
    return [
        trimesh.convex.convex_hull(_loft(rings[i], rings[i + 1]))
        for i in range(len(rings) - 1)
    ]


def plate(x0, x1, y0, y1, z0, z1, crown: float = 0.0):
    """板材。crown > 0 で上面を膨らませる (ルーフの張り出し) — 凸のまま。"""
    if crown == 0.0:
        return trimesh.creation.box(
            extents=(x1 - x0, y1 - y0, z1 - z0),
            transform=trimesh.transformations.translation_matrix(
                ((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)
            ),
        )
    ys = np.linspace(y0, y1, 9)
    top = z1 + crown * (1.0 - ((ys - (y0 + y1) / 2) / ((y1 - y0) / 2)) ** 2)
    lower = np.array([[x, y, z0] for y in ys for x in (x0, x1)])
    upper = np.array([[x, y, t] for y, t in zip(ys, top, strict=True) for x in (x0, x1)])
    return trimesh.convex.convex_hull(np.vstack([lower, upper]))


def arc(cx, cz, radius, a0_deg, a1_deg, steps):
    a = np.linspace(math.radians(a0_deg), math.radians(a1_deg), steps + 1)
    return [(cx + radius * math.cos(t), cz + radius * math.sin(t)) for t in a]


def build() -> list[tuple[str, trimesh.Trimesh]]:
    pieces: list[tuple[str, trimesh.Trimesh]] = []

    def add(name: str, meshes) -> None:
        meshes = meshes if isinstance(meshes, list) else [meshes]
        for i, m in enumerate(meshes):
            pieces.append((name if len(meshes) == 1 else f"{name}_{i + 1}", m))

    # --- ボディサイド (左右対称) -------------------------------------------
    for tag, sy in (("l", 1.0), ("r", -1.0)):
        y = sy * SIDE_Y

        # ロッカーシル: ドア開口の下辺。前後アーチの間を通る
        add(f"rocker_{tag}", member([(-1.02, 0.23), (1.02, 0.23)], [(0.11, 0.22)] * 2, y))

        # A / B / C ピラー: この 3 本とシル・レールがドア開口を囲む
        add(f"a_pillar_{tag}", member([(0.99, 0.40), (1.45, 1.13)], [(0.10, 0.12)] * 2, y))
        add(f"b_pillar_{tag}", member([(0.06, 0.36), (0.06, 1.18)], [(0.12, 0.11)] * 2, y))
        add(f"c_pillar_{tag}", member([(-0.90, 1.14), (-1.44, 0.62)], [(0.11, 0.13)] * 2, y))

        # ルーフレール
        add(f"roof_rail_{tag}", member([(-1.46, 1.21), (1.46, 1.21)], [(0.10, 0.11)] * 2, y))

        # ホイールアーチ: 弧に沿って構造だけを置くので内側は実開口のまま
        for label, cx in (("front", AXLE_F), ("rear", AXLE_R)):
            pts = arc(cx, 0.28, ARCH_R, 168, 12, 4)
            add(f"{label}_arch_{tag}", member(pts, [(0.10, 0.10)] * len(pts), y))

        # リアクォーター (サイドパネル) とフロントフェンダーレール
        add(f"quarter_{tag}", member([(-1.46, 0.60), (-1.96, 0.62)], [(0.12, 0.36)] * 2, y))
        add(f"fender_{tag}", member([(1.74, 0.62), (2.06, 0.60)], [(0.12, 0.32)] * 2, y))

        # 前後の下部レール (フレーム)
        add(f"front_rail_{tag}", member([(1.28, 0.24), (2.04, 0.24)], [(0.13, 0.15)] * 2, sy * 0.42))
        add(f"rear_rail_{tag}", member([(-1.28, 0.24), (-2.04, 0.24)], [(0.13, 0.15)] * 2, sy * 0.46))

    # --- センターボディ -----------------------------------------------------
    add("floor_pan", plate(-1.72, 1.72, -0.78, 0.78, FLOOR_Z - 0.03, FLOOR_Z))
    add("tunnel", plate(-1.26, 1.30, -0.17, 0.17, FLOOR_Z, 0.36))
    add("cross_front", plate(0.92, 1.04, -0.78, 0.78, FLOOR_Z, 0.30))
    add("cross_seat", plate(0.04, 0.16, -0.78, 0.78, FLOOR_Z, 0.28))
    add("cross_rear", plate(-0.94, -0.82, -0.78, 0.78, FLOOR_Z, 0.30))
    # フロントバルクヘッド (ダッシュ) とリアバルクヘッド — 窓開口の下辺になる
    add("firewall", plate(1.66, 1.76, -0.78, 0.78, FLOOR_Z, 0.94))
    add("rear_bulkhead", plate(-1.48, -1.38, -0.78, 0.78, FLOOR_Z, 0.80))
    # ウインドシールド / バックライト の上下辺 (間が開口)
    add("cowl", plate(1.52, 1.66, -0.80, 0.80, 0.86, 0.96))
    add("header_front", plate(1.40, 1.52, -0.82, 0.82, 1.14, 1.26))
    add("header_rear", plate(-0.98, -0.86, -0.82, 0.82, 1.10, 1.22))
    # ルーフ: 中央を膨らませたクラウン付き
    add("roof_panel", plate(-1.44, 1.44, -0.84, 0.84, 1.24, 1.32, crown=0.08))
    add("roof_bow_front", plate(0.50, 0.62, -0.82, 0.82, 1.16, 1.25))
    add("roof_bow_rear", plate(-0.50, -0.38, -0.82, 0.82, 1.16, 1.25))
    # 前後端の閉じ板 (ラジエータサポート / リアパネル)
    add("front_end_panel", plate(2.00, 2.08, -0.62, 0.62, 0.20, 0.62))
    add("rear_end_panel", plate(-2.08, -2.00, -0.66, 0.66, 0.18, 0.62))
    return pieces


MASS_KG = 300.0  # コンパクトセダンの BIW (クロージャ・ガラス・内装なし) の実勢値

_URDF_HEAD = """<?xml version="1.0"?>
<!--
  biw-sedan: 溶接デモ用ボディインホワイト (CC0-1.0)。
  **このファイルは tools/generate_meshes.py が生成する。手で編集しないこと。**

  ジョイントレスの単一リンク。カタログ側は category: workpiece /
  articulated: false として「ロボットではなく障害物」を宣言する。

  collision は **{n} 個の凸ピースを個別ファイルのまま**参照する。リンク単位で
  マージ + 穴埋めされるとドア開口・ホイールアーチ・窓が塞がって衝突形状として
  壊れるため、recipe で `collision_mode: authored` を宣言してこの経路を通す
  (docs/weld-line-requests.md #3)。visual は同じピース群を結合したもの。

  座標系: X = 車両前後 (前が +X)、Y = 左右、Z = 上。原点は車体中心・床パン基準
  (治具の位置決め点)。全長 {length:.2f} / 全幅 {width:.2f} / 全高 {height:.2f} m。
-->
<robot name="biw_sedan">
  <link name="biw">
    <visual>
      <geometry><mesh filename="../meshes/visual/biw.stl"/></geometry>
    </visual>
"""

_URDF_TAIL = """    <inertial>
      <origin xyz="{cx:.4f} {cy:.4f} {cz:.4f}"/>
      <mass value="{mass:.0f}"/>
      <inertia ixx="{ixx:.2f}" ixy="0" ixz="0" iyy="{iyy:.2f}" iyz="0" izz="{izz:.2f}"/>
    </inertial>
  </link>
</robot>
"""


def write_urdf(pieces: list[tuple[str, trimesh.Trimesh]]) -> Path:
    """Emit the URDF from the piece list, so the two can never drift apart."""
    # BIW は薄板構造なので質量は体積ではなく**表面積**に比例させる。ピースを中実として
    # 体積按分すると、体積の大きいルーフ/床パンに寄りすぎて重心が上がってしまう
    areas = np.array([m.area for _, m in pieces])
    masses = MASS_KG * areas / areas.sum()
    coms = np.array([m.center_mass for _, m in pieces])
    com = (masses[:, None] * coms).sum(axis=0) / MASS_KG
    inertia = np.zeros((3, 3))
    for (_, mesh), mass, c in zip(pieces, masses, coms, strict=True):
        solid = mesh.copy()
        solid.density = mass / abs(solid.volume)
        d = c - com
        inertia += solid.moment_inertia + mass * (np.dot(d, d) * np.eye(3) - np.outer(d, d))

    parts = [_URDF_HEAD.format(n=len(pieces), length=LENGTH, width=WIDTH, height=HEIGHT)]
    parts += [
        "    <collision>\n"
        f'      <geometry><mesh filename="../meshes/collision/{name}.stl"/></geometry>\n'
        "    </collision>\n"
        for name, _ in pieces
    ]
    parts.append(
        _URDF_TAIL.format(
            cx=com[0],
            cy=com[1],
            cz=com[2],
            mass=MASS_KG,
            ixx=inertia[0, 0],
            iyy=inertia[1, 1],
            izz=inertia[2, 2],
        )
    )
    path = OUT.parent / "urdf" / "biw-sedan.urdf"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("".join(parts), encoding="utf-8")
    return path


def main() -> None:
    pieces = build()
    (OUT / "collision").mkdir(parents=True, exist_ok=True)
    (OUT / "visual").mkdir(parents=True, exist_ok=True)

    non_convex = []
    for name, mesh in pieces:
        mesh.export(OUT / "collision" / f"{name}.stl")
        if not mesh.is_convex:
            non_convex.append(name)

    combined = trimesh.util.concatenate([m for _, m in pieces])
    combined.merge_vertices()
    combined.export(OUT / "visual" / "biw.stl")
    urdf = write_urdf(pieces)

    print(f"collision: {len(pieces)} convex pieces -> {OUT / 'collision'}")
    print(f"visual   : {len(combined.faces)} faces, extent {np.round(combined.extents, 3)} m")
    print(f"urdf     : {urdf}")
    if non_convex:
        print(f"WARNING non-convex pieces: {non_convex}")
    else:
        print("all pieces convex")


if __name__ == "__main__":
    main()
