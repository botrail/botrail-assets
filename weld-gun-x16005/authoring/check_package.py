#!/usr/bin/env python3
"""Inspect the actual converted r4 artifacts, not just the authoring constants.

Run in botrail-catalog-builder's environment. Source/build files are read-only;
--report optionally writes the verification result.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import xml.etree.ElementTree as ET
from copy import deepcopy
from pathlib import Path

import botrail as bt
import numpy as np
import trimesh
from pxr import Usd, UsdGeom, UsdPhysics, UsdShade


def inspect(package: Path) -> dict:
    urdf = package / "urdf/model.urdf"
    xml = ET.parse(urdf).getroot()
    joint = xml.find("joint[@name='electrode_joint']")
    assert joint is not None
    limit = joint.find("limit")
    upper = float(limit.attrib["upper"])
    assert abs(upper - 0.446) < 1e-6
    assert abs(float(limit.attrib["velocity"]) - 1.2) < 1e-6
    assert abs(float(limit.attrib["effort"]) - 1650) < 1e-5
    axis = np.fromstring(joint.find("axis").attrib["xyz"], sep=" ")
    np.testing.assert_allclose(axis, [0, -1, 0], atol=1e-7)
    origin = np.fromstring(joint.find("origin").attrib["xyz"], sep=" ")
    np.testing.assert_allclose(origin, [0.115, 0, 0.335], atol=1e-7)
    scene_mesh = trimesh.load(package / "visual/model.glb", process=False)
    np.testing.assert_allclose(scene_mesh.extents, [1.161, 0.302, 0.532], atol=0.0001)
    source_meshes = list(scene_mesh.geometry.values())
    assert all("vertex_normals" in m._cache.cache for m in source_meshes)
    assert all(getattr(m.visual, "material", None) is not None for m in source_meshes)
    mass = sum(float(m.attrib["value"]) for m in xml.findall("link/inertial/mass"))
    assert abs(mass - 95.5) < 1e-5

    usd_results = {}
    for name in ["model.usda", "model.usdc"]:
        stage = Usd.Stage.Open(str(package / "usd" / name))
        visuals = [
            p
            for p in stage.Traverse()
            if p.IsA(UsdGeom.Mesh) and UsdGeom.Imageable(p).ComputePurpose() != "guide"
        ]
        assert len(visuals) == 67
        assert all(UsdShade.MaterialBindingAPI(p).ComputeBoundMaterial()[0] for p in visuals)
        assert all(UsdGeom.Mesh(p).GetNormalsAttr().Get() for p in visuals)
        collisions = [p for p in stage.Traverse() if p.HasAPI(UsdPhysics.CollisionAPI)]
        assert len(collisions) == 17
        assert all(p.IsA(UsdGeom.Cube) or p.IsA(UsdGeom.Cylinder) for p in collisions)
        usd_results[name] = {
            "visual_meshes": len(visuals),
            "collision_primitives": len(collisions),
            "materials": sum(p.IsA(UsdShade.Material) for p in stage.Traverse()),
        }

    # Read both packaged kinematic entrypoints. Visual cache warnings must not be ignored.
    robots = {
        "urdf": bt.Robot.from_urdf(str(urdf)),
        "usdc": bt.Robot.from_usd(str(package / "usd/model.usdc")),
    }
    measured_travel = {}
    for kind, robot in robots.items():
        assert robot.dof == 1
        scene = bt.Scene(robot)
        names = {name.rsplit("/", 1)[-1]: name for name in robot.link_names}
        zero_position, zero_quaternion = scene.link_pose(names["electrode_arm"])
        zero_rotation = trimesh.transformations.quaternion_matrix(
            [zero_quaternion[3], *zero_quaternion[:3]]
        )[:3, :3]
        # botrail re-expresses a USD body in its inbound joint frame (localPose1).
        # Compare the physical point, not the arbitrary link-frame orientation.
        local_tip = zero_rotation.T @ (np.array([0.537, 0, 0.365]) - zero_position)
        positions = []
        for q in [0, upper]:
            scene.set_joint_positions([q])
            tcp_position, _ = scene.link_pose(names["tcp"])
            np.testing.assert_allclose(tcp_position, [0.537, 0, 0.36], atol=1e-7)
            position, quaternion = scene.link_pose(names["electrode_arm"])
            matrix = trimesh.transformations.quaternion_matrix([quaternion[3], *quaternion[:3]])
            positions.append(np.asarray(position) + matrix[:3, :3] @ local_tip)
        travel = positions[1][2] - positions[0][2]
        assert abs(travel - 0.179) < 0.0002, (kind, travel)
        measured_travel[kind] = float(travel * 1000)

    # Avoid the normal adjacent-link collision filter: represent every fixed
    # collision primitive as an obstacle and test against the moving link alone.
    moving_xml = deepcopy(xml)
    for link in moving_xml.findall("link"):
        for visual in link.findall("visual"):
            link.remove(visual)
        if link.attrib["name"] != "electrode_arm":
            for collision in link.findall("collision"):
                link.remove(collision)
    moving = bt.Robot.from_urdf_string(ET.tostring(moving_xml, encoding="unicode"))
    separation = bt.Scene(moving)
    for index, collision in enumerate(xml.findall("link[@name='body']/collision")):
        at = collision.find("origin")
        pos = np.fromstring(at.attrib["xyz"], sep=" ")
        rpy = np.fromstring(at.attrib["rpy"], sep=" ")
        quat = trimesh.transformations.quaternion_from_euler(*rpy)
        rotation = [*quat[1:], quat[0]]
        shape = collision.find("geometry")[0]
        if shape.tag == "box":
            separation.add_box(
                f"fixed_{index}", np.fromstring(shape.attrib["size"], sep=" "), pos, rotation
            )
        else:
            assert shape.tag == "cylinder"
            separation.add_cylinder(
                f"fixed_{index}",
                float(shape.attrib["radius"]),
                float(shape.attrib["length"]),
                pos,
                rotation,
            )
    for q in np.linspace(0, upper, 51):
        separation.set_joint_positions([float(q)])
        pairs = separation.check_collisions()
        assert not pairs, f"fixed/moving collision at q={q}: {pairs}"

    throat = bt.Scene(robots["urdf"])
    insertion = []
    for q in [0, upper]:
        throat.set_joint_positions([q])
        for depth_mm in [50, 150, 250, 300, 350, 400, 450]:
            depth = depth_mm / 1000
            name = throat.add_box("sheet", [depth, 0.035, 0.0015], [0.537 - depth / 2, 0, 0.3625])
            pairs = throat.check_collisions()
            blocked = any(("obstacle", name) in pair for pair in pairs)
            throat.remove_obstacle(name)
            assert blocked == (depth_mm >= 400), f"q={q}, depth={depth_mm}, pairs={pairs}"
            insertion.append({"q_rad": round(q, 6), "depth_mm": depth_mm, "blocked": blocked})
    return {
        "extent_xyz_mm": np.round(scene_mesh.extents * 1000, 4).tolist(),
        "mass_kg": mass,
        "joint_velocity_rad_s": float(limit.attrib["velocity"]),
        "tip_travel_mm": measured_travel,
        "usd": usd_results,
        "fixed_vs_moving_sweep_samples": 51,
        "fixed_vs_moving_collisions": 0,
        "plate_thickness_mm": 1.5,
        "insertion": insertion,
        "usdc_sha256": hashlib.sha256((package / "usd/model.usdc").read_bytes()).hexdigest(),
        "limits": (
            "collision proxies only; no bearing contact, internal-tail or flexible-body physics"
        ),
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("package", type=Path)
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()
    text = json.dumps(inspect(args.package.resolve()), indent=2) + "\n"
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(text, encoding="utf-8")
    print(text, end="")
