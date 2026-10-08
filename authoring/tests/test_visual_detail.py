"""Regression contracts for the independently authored reference redesign.

The kinematic and protected-interface hashes were frozen from the pre-redesign
BX250L/NIMAK snapshots, not calculated from the generators under test. Visual
part names, silhouettes and Kawasaki collision envelopes may intentionally
change; no test freezes the earlier box-based appearance or its bounds.

Mesh/topology checks use only the standard library. Generator integration also
requires authoring/reference-requirements.txt, as do test_reference_models.py's
three independent drawing/kinematic tests. Run both suites with:
    python -m unittest discover -s authoring/tests -p 'test_*.py'
The 200,000-triangle and 16-MiB limits are review budgets, not product specs.
"""
from collections import Counter, defaultdict
from functools import lru_cache
import hashlib
import json
import math
from pathlib import Path
import struct
import subprocess
import sys
import textwrap
import unittest
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
ASSETS = {"kawasaki-bx250l": "bx250l-b001", "nimak-multiframegun": "95-020-516-p3u"}
# Semantic robot tree with visual and collision elements removed. All links,
# joint types/axes/origins/limits/mimics and named fixed frames remain covered.
KINEMATIC_HASH = {
    "kawasaki-bx250l": "d243fb6cebd9bc3bbbd4cc46ef139c6d650727713942c768b2aaa13fbaa5e996",
    "nimak-multiframegun": "abdfadfeae199c89c7c22449b10019f78971edc5b82ebd0884bc786b826928df",
}
NIMAK_NONVISUAL_HASH = "3c990677ccb742c4d3acb64d69cda33aada634d201a6b91daa35273d26a4cb6c"
# Drawing-based flange coordinates in metres. The old Ø210-mm flange envelope
# was incorrect; its corrected Ø200-mm skin is deliberately not hash-frozen.
MOUNT_HOLES = ((-.069282032, -.040), (-.069282032, .040),
               (-.040, -.069282032), (-.040, .069282032),
               (0., -.080), (0., .080),
               (.040, -.069282032), (.040, .069282032),
               (.069282032, -.040), (.069282032, .040))
CRITICAL_MESH_HASH = {
    "nimak-multiframegun": {
        "flange_plate": "7c467e3b4c4ad52bf1cf991cd19b1af93a266947bee3894cd91ccfdc7cd9a708",
        "left_electrode": "409f5b9e0dca3f0121bcb0b43497b8c764f3d9824497dd0d3e991ae391f856a2",
        "left_holder": "7644bbcb387b98ba1b52e48a18b6230c06a8a0debce96d7b2850a6dbedc4320c",
        "location_pin": "79769f5a25e805ba19aa889045bf02f0d35427cae8053d983654f1dd33351cfe",
        "mount_plate": "091bfd9435518072f70eb39f65aa30fe0dd9c79938b3aef6f780d29c540fd558",
        "quick_coupling_housing": "f2468fad49afc367e84275de20ec7f3f6d86762eb85d9970c9ad95f507098424",
        "right_electrode": "8d6064216653e25b8a41014907c3327115c6f066a3b656557c652d4250e82761",
        "right_holder": "2ece820dd826f3b1ca329a54a0f03510d580035ea080fc41e48b9f05a2505900",
        **{f"CB10_25_shaft_h{i}":
           ("2a31676eba975f86b08ecda1c1bea86947397eca72ed1f6944bfc44ede66ec96" if i in (5, 6)
            else "b992de435d5f86edffcfbed3d17f6bfa3024f59613cfb4d058756ef6d89a6ce3")
           for i in range(1, 11)},
        **dict(zip((f"washer_h{i}" for i in range(1, 11)), (
            "31545ace45d3acb75993e2ec5af4059ba925c9cc315530136cac43abc04338f3",
            "986b4878f2d7d6cdb42b13515fcfe4857a97c2c63ef647c0ce6ccda0912c48cd",
            "c54ce12a73030b256d846cfee64b2f7e9fc1c712e80a7ab9a5b529d977a092af",
            "848ca961630c57cbe87e990bef72922b99ec5e58cc778ef938ad8471bcb91f46",
            "e7c32a5d6455991cf72172e7bb142b37725cab2456b74cd60a741b3f634a3888",
            "fc60ff038745b816b40f2d256feb4d8e5c72b159d041ec3ccea068b59fe85584",
            "180f2ba349db092ef2389b3129fd5fad7084cf3b706b18913349465948c5d3b3",
            "04be2909f1e886b601668da9728701412c184f226ba014d1012139409e98d2ff",
            "e3a4c69d621be8621b0795f4ca2ac3f4d62c38ab74a24e73b56cf18812574a6a",
            "31f5d5abfecc829866afd1a798843fdf7a7f78347ff05399525bd7dc2d57c891",
        ))),
    },
}
NUMERIC_ATTRS = {
    "xyz", "rpy", "rgba", "size", "scale", "radius", "length", "lower", "upper",
    "velocity", "effort", "multiplier", "offset", "mass", "value", "ixx", "ixy",
    "ixz", "iyy", "iyz", "izz", "damping", "friction",
}


def numbers(text):
    values = tuple(float(value) for value in text.split())
    if not all(math.isfinite(value) for value in values):
        raise ValueError(f"Nonfinite numeric attribute: {text}")
    return values


def semantic(element, exclude=()):
    attrs = tuple(sorted((key, numbers(value) if key in NUMERIC_ATTRS else value)
                         for key, value in element.attrib.items()))
    children = [semantic(child, exclude) for child in element
                if child.tag not in exclude]
    return element.tag, attrs, (element.text or "").strip(), tuple(sorted(children, key=repr))


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def urdf(asset):
    return ET.parse(ROOT/asset/"urdf"/f"{ASSETS[asset]}.urdf").getroot()


def sub(a, b):
    return tuple(x-y for x, y in zip(a, b))


def cross(a, b):
    return (a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0])


def dot(a, b):
    return sum(x*y for x, y in zip(a, b))


@lru_cache(maxsize=None)
def triangles(path):
    raw = path.read_bytes()
    if len(raw) < 84:
        raise ValueError(f"Truncated STL: {path}")
    count = struct.unpack_from("<I", raw, 80)[0]
    if not count or len(raw) != 84+50*count:
        raise ValueError(f"Invalid binary STL count/length: {path}")
    result = []
    for index in range(count):
        values = struct.unpack_from("<12fH", raw, 84+50*index)
        if not all(math.isfinite(value) for value in values[:12]):
            raise ValueError(f"Nonfinite triangle {index}: {path}")
        a, b, c = (values[start:start+3] for start in (3, 6, 9))
        geometric = cross(sub(b, a), sub(c, a))
        length_squared = dot(geometric, geometric)
        normal_squared = dot(values[:3], values[:3])
        agreement = dot(values[:3], geometric)
        if length_squared == 0 or agreement <= 0:
            raise ValueError(f"Degenerate triangle or inconsistent STL normal {index}: {path}")
        if abs(normal_squared-1) > 1e-5 or agreement/math.sqrt(length_squared*normal_squared) < 1-1e-5:
            raise ValueError(f"STL normal is not a unit geometric face normal {index}: {path}")
        result.append((a, b, c))
    return result


def bounds(tris):
    return [[limit(v[axis] for tri in tris for v in tri) for axis in range(3)] for limit in (min, max)]


def inside(tris, point):
    """Independent Moller-Trumbore ray parity for blind-socket samples."""
    direction = (1., .371390676, .694746591)
    hits = []
    for a, b, c in tris:
        e1, e2 = sub(b, a), sub(c, a)
        h = cross(direction, e2)
        determinant = dot(e1, h)
        if abs(determinant) < 1e-15:
            continue
        inverse, s = 1/determinant, sub(point, a)
        u = inverse*dot(s, h)
        if not 0 <= u <= 1:
            continue
        q = cross(s, e1)
        v = inverse*dot(direction, q)
        if v < 0 or u+v > 1:
            continue
        distance = inverse*dot(e2, q)
        if distance > 1e-10:
            hits.append(distance)
    unique = []
    for distance in sorted(hits):
        if not unique or abs(distance-unique[-1]) > 1e-8:
            unique.append(distance)
    return len(unique) % 2 == 1


def referenced_meshes(asset):
    """Only shipped URDF references count; obsolete files cannot hide failures."""
    directory = ROOT / asset
    return sorted({(directory / "urdf" / mesh.get("filename")).resolve()
                   for mesh in urdf(asset).findall(".//visual/geometry/mesh")})


def section_bounds(tris, axis, position):
    """Intersect triangle edges with an interior section plane independently."""
    points = []
    for tri in tris:
        for a, b in zip(tri, tri[1:] + tri[:1]):
            delta = b[axis] - a[axis]
            if abs(delta) < 1e-12:
                continue
            t = (position - a[axis]) / delta
            if 0 <= t <= 1:
                points.append(tuple(x + t * (y-x) for x, y in zip(a, b)))
    if not points:
        raise ValueError(f"No mesh section on axis {axis} at {position}")
    return [tuple(limit(p[k] for p in points) for k in range(3)) for limit in (min, max)]


def collision_contains(collision, point):
    """Independent analytic URDF primitive containment, with inverse XYZ RPY."""
    origin = collision.find("origin")
    xyz = numbers(origin.get("xyz", "0 0 0")) if origin is not None else (0.,) * 3
    rpy = numbers(origin.get("rpy", "0 0 0")) if origin is not None else (0.,) * 3
    p = list(sub(point, xyz))
    # R = Rz(yaw) Ry(pitch) Rx(roll), so undo yaw, pitch, then roll.
    for axis in (2, 1, 0):
        a, b = (axis+1) % 3, (axis+2) % 3
        c, s = math.cos(-rpy[axis]), math.sin(-rpy[axis])
        p[a], p[b] = c*p[a] - s*p[b], s*p[a] + c*p[b]
    primitive = list(collision.find("geometry"))[0]
    if primitive.tag == "box":
        return all(abs(v) < size/2 for v, size in zip(p, numbers(primitive.get("size"))))
    if primitive.tag == "cylinder":
        return p[0]**2 + p[1]**2 < float(primitive.get("radius"))**2 and abs(p[2]) < float(primitive.get("length"))/2
    if primitive.tag == "sphere":
        return dot(p, p) < float(primitive.get("radius"))**2
    raise ValueError(f"Unexpected collision primitive: {primitive.tag}")


class VisualDetailContracts(unittest.TestCase):
    def test_original_kinematics_frames_and_nimak_nonvisual_contract(self):
        for asset in ASSETS:
            with self.subTest(asset=asset):
                tree = urdf(asset)
                self.assertEqual(digest(semantic(tree, ("visual", "collision"))), KINEMATIC_HASH[asset],
                                 "Original links, joint origins/axes/limits/mimics or fixed frames changed")
                self.assertFalse(tree.findall(".//collision/geometry/mesh"))
                self.assertFalse(tree.findall(".//inertial"))
                for geometry in tree.findall(".//collision/geometry"):
                    self.assertEqual(len(geometry), 1)
                    self.assertIn(geometry[0].tag, {"box", "cylinder", "sphere"})
                if asset == "nimak-multiframegun":
                    self.assertEqual(digest(semantic(tree, ("visual",))), NIMAK_NONVISUAL_HASH,
                                     "NIMAK's complete original nonvisual tree must stay unchanged")

    def test_visual_references_are_unique_local_meshes(self):
        for asset in ASSETS:
            seen = set()
            tree = urdf(asset)
            self.assertTrue(tree.findall(".//visual"))
            for link in tree.findall("link"):
                for visual in link.findall("visual"):
                    with self.subTest(asset=asset, visual=visual.get("name")):
                        name = visual.get("name")
                        self.assertTrue(name)
                        self.assertNotIn(name, seen)
                        seen.add(name)
                        mesh = visual.find("geometry/mesh")
                        self.assertIsNotNone(mesh)
                        self.assertEqual(mesh.get("filename"), f"../meshes/{name}.stl")
                        self.assertEqual(numbers(mesh.get("scale", "1 1 1")), (1., 1., 1.))
                        self.assertTrue((ROOT / asset / "meshes" / f"{name}.stl").is_file())
                        # Shape samples below are in the original link-local frame.
                        origin = visual.find("origin")
                        if origin is not None:
                            self.assertEqual(numbers(origin.get("xyz", "0 0 0")), (0., 0., 0.))
                            self.assertEqual(numbers(origin.get("rpy", "0 0 0")), (0., 0., 0.))

    def test_critical_nimak_contact_meshes_are_unchanged(self):
        for asset, expected in CRITICAL_MESH_HASH.items():
            references = set(referenced_meshes(asset))
            for name, sha in expected.items():
                with self.subTest(asset=asset, mesh=name):
                    path = ROOT / asset / "meshes" / f"{name}.stl"
                    self.assertIn(path.resolve(), references)
                    self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(), sha)

    def test_corrected_flange_diameter_bores_recess_and_pin_sockets(self):
        flange = triangles(ROOT / "kawasaki-bx250l/meshes/gun_bracket_160.stl")
        lo, hi = bounds(flange)
        for axis in (0, 2):
            self.assertAlmostEqual(hi[axis]-lo[axis], .200, delta=3e-7)
        self.assertAlmostEqual(max(math.hypot(v[0], v[2]) for tri in flange for v in tri), .100, delta=3e-7)
        self.assertAlmostEqual(lo[1], -.038, delta=3e-7)
        self.assertAlmostEqual(hi[1], 0., delta=3e-7)
        # Flange-local (X,Y,Z) maps to link6-local (Y,Z,X).
        def solid(x, y, z):
            return inside(flange, (y, z, x))
        for x, y in MOUNT_HOLES:
            with self.subTest(bore=(x, y)):
                self.assertAlmostEqual(math.hypot(x, y), .080, delta=1e-9)
                for depth in (-.001, -.020, -.037):
                    self.assertFalse(solid(x, y, depth), "M10 bore is not through")
                self.assertFalse(solid(x+.004, y, -.020), "M10 bore is undersize")
                self.assertTrue(solid(x+.006, y, -.020), "M10 bore lost its surrounding web")
        self.assertFalse(solid(0., 0., -.005), "Central recess is filled")
        self.assertFalse(solid(.049, 0., -.005), "Ø100-mm recess is undersize")
        self.assertTrue(solid(.051, 0., -.005), "Ø100-mm recess is oversize")
        self.assertFalse(solid(0., 0., -.010999), "Recess is shallower than 11 mm")
        self.assertTrue(solid(0., 0., -.011001), "Recess lost its 11-mm-deep floor")
        for x in (-.080, .080):
            self.assertFalse(solid(x, 0., -.005), "Locating-pin socket is filled")
            self.assertFalse(solid(x, .004, -.005), "Locating-pin socket is undersize")
            self.assertTrue(solid(x, .006, -.005), "Locating-pin socket is oversize")
            self.assertFalse(solid(x, 0., -.011999), "Locating-pin socket is shallower than 12 mm")
            self.assertTrue(solid(x, 0., -.012001), "Locating-pin socket lost its 12-mm-deep floor")

    def test_bolt_dimensions_blind_sockets_and_mechanism_pin_envelopes(self):
        base = ROOT / "nimak-multiframegun/meshes"
        for index in range(1, 11):
            with self.subTest(bolt=index):
                head = triangles(base / f"CB10_25_head_h{index}.stl")
                shaft = triangles(base / f"CB10_25_shaft_h{index}.stl")
                for tris, expected in ((head, (.016, .016, .010)), (shaft, (.010, .010, .025))):
                    lo, hi = bounds(tris)
                    for axis in range(3):
                        self.assertAlmostEqual(hi[axis]-lo[axis], expected[axis], delta=3e-7)
                self.assertFalse(inside(head, (0., 0., .007)), "Drive recess is filled")
                self.assertTrue(inside(head, (0., 0., .002)), "Blind socket lost its solid floor")
        # Original link-local numeric pin envelopes, independently frozen rather
        # than read from the obsolete box-finishing bounds manifest.
        for name, expected in {
            "gun_pivot": ((-.0584, -.090, .545), (.0316, .090, .635)),
            "drive_eye_pin": ((.2575, -.055, -.258), (.2775, .055, -.238)),
        }.items():
            for actual_row, expected_row in zip(bounds(triangles(base / f"{name}.stl")), expected):
                for actual, value in zip(actual_row, expected_row):
                    self.assertAlmostEqual(actual, value, delta=3e-7)

    def test_kawasaki_cast_arm_has_taper_and_a_bowed_centerline(self):
        arm = triangles(ROOT / "kawasaki-bx250l/meshes/upper_arm.stl")
        sections = [section_bounds(arm, 2, z) for z in (.110, .520, .960)]
        widths = [hi[0]-lo[0] for lo, hi in sections]
        self.assertGreater(widths[0], widths[1]*1.25, "Lower arm reverted to a constant-width extrusion")
        self.assertGreater(widths[1], widths[2]*1.10, "Upper arm lost its cast taper")
        centers = [(lo[1]+hi[1])/2 for lo, hi in sections]
        straight_midpoint = centers[0] + (.520-.110)/(.960-.110)*(centers[2]-centers[0])
        self.assertGreater(abs(centers[1]-straight_midpoint), .025, "Arm reverted to a straight box/linear taper")
        self.assertGreaterEqual(len({round(v[2], 6) for tri in arm for v in tri}), 20,
                                "Curved longitudinal cast transitions disappeared")

    def test_kawasaki_wrist_sides_are_open_with_solid_rails(self):
        asset = "kawasaki-bx250l"
        link = urdf(asset).find("link[@name='link4']")
        meshes = [triangles(ROOT / asset / "meshes" / f"{v.get('name')}.stl") for v in link.findall("visual")]
        for side, name in ((-1, "left"), (1, "right")):
            fork = triangles(ROOT / asset / "meshes" / f"wrist_fork_{name}.stl")
            for y in (.538, .830):  # global Y = 1.260 and 1.552 m
                for z in (-.030, 0., .030):
                    point = (side*.140, y, z)
                    with self.subTest(side=name, passage=point):
                        self.assertFalse(any(inside(mesh, point) for mesh in meshes),
                                         "A wrist visual closes the real side opening")
                        self.assertFalse(any(collision_contains(c, point) for c in link.findall("collision")),
                                         "A collision primitive fills the open yoke")
                for z in (-.130, .200):
                    self.assertTrue(inside(fork, (side*.140, y, z)), "Open yoke lost a structural rail")
        for material in urdf(asset).findall(".//visual/material/color"):
            r, g, b, _ = numbers(material.get("rgba"))
            self.assertFalse(g > r+.08 and g > b+.08, "Unsupported green cover material returned")
        for name in ("forearm_cover", "forearm_cover_far"):
            rgba = numbers(link.find(f"visual[@name='{name}']/material/color").get("rgba"))
            self.assertLess(max(rgba[:3]), .20, "Reference service cover should remain dark")

    def test_nimak_long_arms_are_tapered_silver_and_lean_toward_the_throat(self):
        asset = "nimak-multiframegun"
        for side, link_name, origin_z in (("left", "body", .042), ("right", "moving_jaw", .632)):
            with self.subTest(side=side):
                name = side + "_arm_blade"
                visual = urdf(asset).find(f"link[@name='{link_name}']/visual[@name='{name}']")
                rgb = numbers(visual.find("material/color").get("rgba"))[:3]
                self.assertGreater(min(rgb), .50)
                self.assertLess(max(rgb)-min(rgb), .12, "Long structural arm is no longer silver")
                arm = triangles(ROOT / asset / "meshes" / f"{name}.stl")
                lower, upper = (section_bounds(arm, 2, z-origin_z) for z in (.900, 1.290))
                widths = [hi[0]-lo[0] for lo, hi in (lower, upper)]
                self.assertGreater(widths[0]-widths[1], .018, "Long arm reverted to a constant-width bar")
                centers = [(lo[0]+hi[0])/2 for lo, hi in (lower, upper)]
                inward = centers[1]-centers[0] if side == "left" else centers[0]-centers[1]
                self.assertGreater(inward, .040, "Upper arm no longer tapers inward toward its holder")

    def test_referenced_meshes_are_closed_oriented_positive_volume_and_within_budgets(self):
        for asset in ASSETS:
            count = size = 0
            paths = referenced_meshes(asset)
            self.assertTrue(paths)
            for path in paths:
                with self.subTest(asset=asset, mesh=path.name):
                    tris = triangles(path)
                    count += len(tris)
                    size += path.stat().st_size
                    edges, direction = defaultdict(list), Counter()
                    parent = list(range(len(tris)))
                    def find(index):
                        while parent[index] != index:
                            parent[index] = parent[parent[index]]
                            index = parent[index]
                        return index
                    for index, tri in enumerate(tris):
                        # Weld 10-nanometre export noise, far smaller than the
                        # authored details; retain independent topology checks.
                        verts = [tuple(round(value, 8) for value in v) for v in tri]
                        for a, b in zip(verts, verts[1:]+verts[:1]):
                            self.assertNotEqual(a, b, "Collapsed edge after seam welding")
                            edge = tuple(sorted((a, b)))
                            edges[edge].append(index)
                            direction[edge] += 1 if a < b else -1
                    self.assertTrue(all(len(faces) == 2 for faces in edges.values()), "Open or nonmanifold edge")
                    self.assertTrue(all(value == 0 for value in direction.values()), "Inconsistent adjacent winding")
                    for a, b in edges.values():
                        parent[find(a)] = find(b)
                    volumes = defaultdict(float)
                    for index, (a, b, c) in enumerate(tris):
                        volumes[find(index)] += dot(a, cross(b, c))/6
                    self.assertTrue(all(value > 0 for value in volumes.values()), "Inward or zero-volume closed shell")
                    if asset == "kawasaki-bx250l" and path.name == "foot.stl":
                        self.assertEqual(len(volumes), 1,
                                         "Structural base foot contains disconnected mounting-pad islands")
            self.assertLess(count, 200_000, f"Triangle review budget exceeded: {asset}: {count}")
            self.assertLess(size, 16*1024*1024, f"STL byte review budget exceeded: {asset}: {size}")

    def test_generator_import_is_deterministic_and_cli_check_matches_committed_assets(self):
        # Each asset owns a same-named reference_geometry module. Isolated
        # imports faithfully reproduce its CLI import path without cross-talk.
        script = textwrap.dedent("""\
            import importlib.util
            from pathlib import Path
            import sys
            import xml.etree.ElementTree as ET
            path = Path(sys.argv[1]).resolve()
            sys.path.insert(0, str(path.parent))
            spec = importlib.util.spec_from_file_location('generator_under_test', path)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            def files():
                model = module.build()
                ET.indent(model.tree)
                result = dict(model.generated)
                result[f'urdf/{model.name}.urdf'] = ET.tostring(model.tree, encoding='utf-8', xml_declaration=True) + b'\\n'
                return result
            first, second = files(), files()
            assert first.keys() == second.keys(), 'Repeated builds emitted different file sets'
            for name in first:
                assert first[name] == second[name], f'Non-deterministic generator output: {name}'
            print(f'{len(first)} deterministic generated files')
        """)
        for asset in ASSETS:
            generator = ROOT / asset / "tools/generate_model.py"
            for label, command in (
                ("module import/build repeatability", [sys.executable, "-c", script, str(generator)]),
                ("CLI --check", [sys.executable, str(generator), "--check"]),
            ):
                with self.subTest(asset=asset, integration=label):
                    result = subprocess.run(command, cwd=ROOT, text=True, capture_output=True, timeout=240)
                    self.assertEqual(result.returncode, 0, f"{asset} {label}:\n{result.stdout}\n{result.stderr}")


if __name__ == "__main__":
    unittest.main()
