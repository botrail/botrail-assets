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


# 外板スキン: ビルトライン上で内側に絞る (タンブルホーム)。凸ではないので
# collision には使えないが、visual は分離してあるので構造上の制約が無い
BELTLINE_Z = 0.78
TUMBLEHOME = 0.085  # ルーフレール高さでの絞り量 [m]


def skin_y(x: float, z: float) -> float:
    """車体外板の Y 半幅。

    上下方向はビルトラインから上を二次で絞り (タンブルホーム)、前後方向は
    キャビンから端に向けて絞る (平面視のテーパー)。どちらも凸にならないので
    collision には使えない — visual を分離したから張れる形。
    """
    half = SIDE_Y + 0.035
    if z > BELTLINE_Z:
        t = min(1.0, (z - BELTLINE_Z) / (1.24 - BELTLINE_Z))
        half -= TUMBLEHOME * t * t
    flat = 1.30  # ここまでは全幅、外側へ絞る
    if abs(x) > flat:
        t = min(1.0, (abs(x) - flat) / (2.06 - flat))
        half -= 0.16 * t * t
    return half


def skin_top(x: float) -> float:
    """外板の上端 = ルーフラインとベルトラインをつないだシルエット。"""
    if -0.88 <= x <= 0.97:
        return 1.26  # キャビン (ルーフレールまで)
    if x > 0.97:  # 前方: A ピラーからフェンダー上面へ落ちる
        return max(0.93, 1.26 - (x - 0.97) * (1.26 - 0.95) / (1.45 - 0.97))
    return max(0.95, 1.26 - (-0.88 - x) * (1.26 - 1.00) / (1.45 - 0.88))


def _aperture(x: float, z: float) -> bool:
    """外板を張らない領域 (ドア開口とホイールアーチ)。"""
    if 0.10 <= x <= 0.96 and 0.38 <= z <= 1.16:  # 前ドア
        return True
    if -0.86 <= x <= 0.02 and 0.38 <= z <= 1.16:  # 後ドア
        return True
    for cx in (AXLE_F, AXLE_R):  # ホイールアーチ
        if math.hypot(x - cx, z - 0.28) <= ARCH_R:
            return True
    return False


def body_skin(sy: float, nx: int = 130, nz: int = 44) -> trimesh.Trimesh:
    """左右いずれかの外板。開口セルを飛ばして張るので**実開口**になる。"""
    xs = np.linspace(-2.02, 2.06, nx + 1)
    zs = np.linspace(0.14, 1.26, nz + 1)
    verts: list[tuple[float, float, float]] = []
    faces: list[tuple[int, int, int]] = []
    index: dict[tuple[int, int], int] = {}

    def vid(i: int, k: int) -> int:
        if (i, k) not in index:
            index[(i, k)] = len(verts)
            verts.append((float(xs[i]), float(sy * skin_y(xs[i], zs[k])), float(zs[k])))
        return index[(i, k)]

    for i in range(nx):
        for k in range(nz):
            cx = (xs[i] + xs[i + 1]) / 2
            cz = (zs[k] + zs[k + 1]) / 2
            if _aperture(cx, cz) or cz > skin_top(cx):
                continue
            a, b, c, d = vid(i, k), vid(i + 1, k), vid(i + 1, k + 1), vid(i, k + 1)
            if sy > 0:
                faces += [(a, b, c), (a, c, d)]
            else:
                faces += [(a, c, b), (a, d, c)]
    m = trimesh.Trimesh(np.asarray(verts), np.asarray(faces, dtype=np.int64), process=False)
    return m


def roof_skin(nx: int = 60, ny: int = 24) -> trimesh.Trimesh:
    """クラウン付きルーフ外板 (滑らかな曲面)。"""
    xs = np.linspace(-1.46, 1.46, nx + 1)
    ys = np.linspace(-0.86, 0.86, ny + 1)
    verts, faces = [], []
    for i, x in enumerate(xs):
        for j, y in enumerate(ys):
            crown = 0.085 * (1.0 - (y / 0.86) ** 2) * (1.0 - 0.25 * (x / 1.46) ** 2)
            verts.append((float(x), float(y), float(1.24 + crown)))
    for i in range(nx):
        for j in range(ny):
            a = i * (ny + 1) + j
            b = a + (ny + 1)
            faces += [(a, b, b + 1), (a, b + 1, a + 1)]
    return trimesh.Trimesh(np.asarray(verts), np.asarray(faces, dtype=np.int64), process=False)


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


STRUCTURE_COLOR = [150, 155, 162, 255]  # 亜鉛メッキ鋼板 (骨格)
SKIN_COLOR = [176, 182, 190, 255]  # 外板


def build_visual(pieces: list[tuple[str, trimesh.Trimesh]]) -> trimesh.Scene:
    """表示用シーン: 構造ピース + 曲面外板 + ルーフ。**collision とは別物**。

    collision は凸 compound という制約があるので曲面外板を持てない。visual を
    分離したことで、タンブルホーム (ビルトラインから上の絞り) やクラウンルーフ
    のような非凸の面を張れるようになった。開口はセルを飛ばして張るので実開口。
    """
    from trimesh.visual.material import PBRMaterial

    def painted(mesh: trimesh.Trimesh, name: str, colour: list[int]) -> trimesh.Trimesh:
        # a named material (not per-vertex colours) so the OBJ the catalog
        # normalizes to carries an MTL rather than the non-standard "v x y z r g b"
        mesh.visual = trimesh.visual.TextureVisuals(
            material=PBRMaterial(baseColorFactor=colour, name=name)
        )
        return mesh

    scene = trimesh.Scene()
    structure = trimesh.util.concatenate([m for _, m in pieces])
    structure.merge_vertices()
    scene.add_geometry(painted(structure, "biw_structure", STRUCTURE_COLOR), geom_name="structure")

    skin = trimesh.util.concatenate([body_skin(1.0), body_skin(-1.0), roof_skin()])
    scene.add_geometry(painted(skin, "biw_skin", SKIN_COLOR), geom_name="skin")
    return scene


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
      <geometry><mesh filename="../meshes/visual/biw.glb"/></geometry>
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


def write_urdf(pieces: list[tuple[str, trimesh.Trimesh]]):
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
    return path, com, inertia


def write_usd(pieces: list[tuple[str, trimesh.Trimesh]], com, inertia) -> Path | None:
    """Emit the same model as a UsdPhysics stage (optional; needs usd-core).

    The point of the USD form is that the "do not decompose this" contract is
    standard rather than catalog-specific: each piece carries `CollisionAPI` and
    `physics:approximation = convexHull`, which Isaac Sim, PhysX and
    three-usd-robot all honour. The catalog derives `collision_mode: authored`
    from it, so the recipe does not have to declare anything.
    """
    try:
        from pxr import Gf, Usd, UsdGeom, UsdPhysics, Vt
    except ImportError:
        print("usd-core not installed — skipping USD output")
        return None

    path = OUT.parent / "usd" / "biw-sedan.usda"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.unlink(missing_ok=True)
    stage = Usd.Stage.CreateNew(str(path))
    UsdGeom.SetStageUpAxis(stage, UsdGeom.Tokens.z)
    UsdGeom.SetStageMetersPerUnit(stage, 1.0)

    root = UsdGeom.Xform.Define(stage, "/biw_sedan")
    stage.SetDefaultPrim(root.GetPrim())
    mass_api = UsdPhysics.MassAPI.Apply(root.GetPrim())
    mass_api.CreateMassAttr(MASS_KG)
    mass_api.CreateCenterOfMassAttr(Gf.Vec3f(*[float(v) for v in com]))
    mass_api.CreateDiagonalInertiaAttr(
        Gf.Vec3f(float(inertia[0, 0]), float(inertia[1, 1]), float(inertia[2, 2]))
    )

    def mesh_prim(prim_path: str, mesh: trimesh.Trimesh):
        usd_mesh = UsdGeom.Mesh.Define(stage, prim_path)
        points = np.asarray(mesh.vertices, dtype=np.float32)
        faces = np.asarray(mesh.faces, dtype=np.int32)
        usd_mesh.CreatePointsAttr(Vt.Vec3fArray.FromNumpy(points))
        usd_mesh.CreateFaceVertexIndicesAttr(Vt.IntArray.FromNumpy(faces.reshape(-1)))
        usd_mesh.CreateFaceVertexCountsAttr(
            Vt.IntArray.FromNumpy(np.full(len(faces), 3, dtype=np.int32))
        )
        usd_mesh.CreateSubdivisionSchemeAttr(UsdGeom.Tokens.none)
        return usd_mesh

    combined = trimesh.util.concatenate([m for _, m in pieces])
    combined.merge_vertices()
    mesh_prim("/biw_sedan/visual", combined)

    for name, mesh in pieces:
        prim = mesh_prim(f"/biw_sedan/collision_{name}", mesh)
        UsdPhysics.CollisionAPI.Apply(prim.GetPrim())
        prim.CreatePurposeAttr(UsdGeom.Tokens.guide)
        UsdPhysics.MeshCollisionAPI.Apply(prim.GetPrim()).CreateApproximationAttr(
            UsdPhysics.Tokens.convexHull
        )
    stage.GetRootLayer().Save()
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

    visual = build_visual(pieces)
    visual.export(OUT / "visual" / "biw.glb")
    combined = trimesh.util.concatenate(list(visual.geometry.values()))
    urdf, com, inertia = write_urdf(pieces)
    usd = write_usd(pieces, com, inertia)

    print(f"collision: {len(pieces)} convex pieces -> {OUT / 'collision'}")
    print(f"visual   : {len(combined.faces)} faces (glb), "
          f"extent {np.round(combined.extents, 3)} m")
    print(f"urdf     : {urdf}")
    print(f"usd      : {usd}")
    if non_convex:
        print(f"WARNING non-convex pieces: {non_convex}")
    else:
        print("all pieces convex")


if __name__ == "__main__":
    main()
