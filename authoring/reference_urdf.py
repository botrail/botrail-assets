"""Small SI-unit URDF authoring helpers for numeric reference models (CC0).

Visuals are authored meshes; collisions remain explicit analytic primitives.
There is no CAD reader, inferred mass, effort limit or kinematic inference here.
"""
from pathlib import Path
import xml.etree.ElementTree as ET
import numpy as np
import trimesh as tm
from scipy.spatial.transform import Rotation


def values(items):
    return ' '.join(f'{v:.12g}' for v in items)


def cylinder(radius, a, b):
    a, b = np.asarray(a, dtype=float), np.asarray(b, dtype=float)
    direction = b-a
    pose = tm.geometry.align_vectors([0, 0, 1], direction)
    pose[:3, 3] = (a+b)/2
    return tm.creation.cylinder(radius, height=np.linalg.norm(direction), sections=64, transform=pose), pose


class Model:
    def __init__(self, root, name):
        self.root, self.name = Path(root), name
        self.tree = ET.Element('robot', name=name)
        self.links, self.origins, self.generated = {}, {}, {}

    def link(self, name, origin=(0, 0, 0)):
        self.links[name] = ET.SubElement(self.tree, 'link', name=name)
        self.origins[name] = np.asarray(origin, dtype=float)

    def joint(self, name, parent, child, axis=None, limits=None, velocity=None, mimic=None, rpy=None):
        kind = 'fixed' if axis is None else 'continuous' if mimic else 'revolute'
        j = ET.SubElement(self.tree, 'joint', name=name, type=kind)
        ET.SubElement(j, 'parent', link=parent); ET.SubElement(j, 'child', link=child)
        ET.SubElement(j, 'origin', xyz=values(self.origins[child]-self.origins[parent]), rpy=values(rpy or [0, 0, 0]))
        if axis is not None:
            ET.SubElement(j, 'axis', xyz=values(axis))
        if limits is not None:
            # Unknown actuator effort is omitted; this is a kinematic model.
            ET.SubElement(j, 'limit', lower=f'{limits[0]:.12g}', upper=f'{limits[1]:.12g}', velocity=f'{velocity:.12g}')
        if mimic:
            ET.SubElement(j, 'mimic', joint=mimic[0], multiplier=str(mimic[1]), offset='0')

    def mesh(self, link, name, mesh, color):
        mesh = mesh.copy(); mesh.apply_translation(-self.origins[link])
        self.generated[f'meshes/{name}.stl'] = mesh.export(file_type='stl')
        visual = ET.SubElement(self.links[link], 'visual', name=name)
        geometry = ET.SubElement(visual, 'geometry')
        ET.SubElement(geometry, 'mesh', filename=f'../meshes/{name}.stl')
        mat = ET.SubElement(visual, 'material', name=name+'_material')
        ET.SubElement(mat, 'color', rgba=values(color))

    def collision(self, link, kind, center, rpy=(0, 0, 0), **size):
        item = ET.SubElement(self.links[link], 'collision')
        ET.SubElement(item, 'origin', xyz=values(np.asarray(center)-self.origins[link]), rpy=values(rpy))
        geom = ET.SubElement(item, 'geometry')
        ET.SubElement(geom, kind, **{k: values(v) if isinstance(v, (tuple, list, np.ndarray)) else str(v) for k,v in size.items()})

    def box(self, link, name, size, center, color, collide=True):
        mesh = tm.creation.box(size, transform=tm.transformations.translation_matrix(center))
        self.mesh(link, name, mesh, color)
        if collide: self.collision(link, 'box', center, size=size)

    def cylinder(self, link, name, radius, a, b, color, collide=True):
        mesh, pose = cylinder(radius, a, b)
        self.mesh(link, name, mesh, color)
        if collide:
            self.collision(link, 'cylinder', pose[:3, 3],
                Rotation.from_matrix(pose[:3, :3]).as_euler('xyz'), radius=radius,
                length=float(np.linalg.norm(np.asarray(b)-a)))

    def write(self, check=False):
        ET.indent(self.tree)
        self.generated[f'urdf/{self.name}.urdf'] = ET.tostring(self.tree, encoding='utf-8', xml_declaration=True)+b'\n'
        for rel, data in self.generated.items():
            path = self.root/rel
            if check:
                previous = path.read_bytes()
                if path.suffix == '.stl':
                    # CPU math can change the final float32 bit in STL export.
                    # Keep triangle order/winding, vertex coordinates, normals
                    # and attributes checked; do not require identical rounding.
                    dtype = np.dtype([('normal','<f4',(3,)), ('vertices','<f4',(3,3)), ('attribute','<u2')])
                    old = np.frombuffer(previous[84:], dtype=dtype)
                    new = np.frombuffer(data[84:], dtype=dtype)
                    assert old.shape == new.shape, f'Triangle count changed: {path}'
                    np.testing.assert_allclose(old['vertices'], new['vertices'], rtol=0, atol=3e-7, err_msg=str(path))
                    np.testing.assert_allclose(old['normal'], new['normal'], rtol=0, atol=1e-6, err_msg=str(path))
                    np.testing.assert_array_equal(old['attribute'], new['attribute'], err_msg=str(path))
                else:
                    assert previous == data, f'Regeneration mismatch: {path}'
            else:
                path.parent.mkdir(parents=True, exist_ok=True); path.write_bytes(data)
        return len(self.generated)
