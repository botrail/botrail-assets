"""Author a parallel-motion URDF over pinned Menagerie meshes (no CAD build).

Only the URDF and this authored kinematic declaration belong to this CC0
repository. Fetch the BSD-2-Clause input next to robotiq-2f85/:
  robotiq_2f85_v4/{2f85.xml, LICENSE, assets/*.stl}
The catalog recipe pins the source commit and retains its license.
"""
from pathlib import Path
from xml.etree import ElementTree as ET

import numpy as np
from scipy.spatial.transform import Rotation

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / 'robotiq_2f85_v4'


def transform(node, mjcf=False):
    value = np.eye(4)
    if node is None:
        return value
    value[:3, 3] = np.fromstring(node.get('pos' if mjcf else 'xyz', '0 0 0'), sep=' ')
    if mjcf:
        w, x, y, z = np.fromstring(node.get('quat', '1 0 0 0'), sep=' ')
        value[:3, :3] = Rotation.from_quat([x, y, z, w]).as_matrix()
    else:
        value[:3, :3] = Rotation.from_euler('xyz', np.fromstring(node.get('rpy', '0 0 0'), sep=' ')).as_matrix()
    return value


def origin(parent, value):
    xyz = ' '.join(f'{v:.12g}' for v in value[:3, 3])
    rpy = ' '.join(f'{v:.12g}' for v in Rotation.from_matrix(value[:3, :3]).as_euler('xyz'))
    ET.SubElement(parent, 'origin', xyz=xyz, rpy=rpy)


def geometry(link, filename, offset, color):
    for kind in ('visual', 'collision'):
        item = ET.SubElement(link, kind)
        origin(item, offset)
        shape = ET.SubElement(item, 'geometry')
        ET.SubElement(shape, 'mesh', filename=f'../../robotiq_2f85_v4/assets/{filename}.stl')
        if kind == 'visual':
            material = ET.SubElement(item, 'material', name=f'{link.get("name")}_{filename}')
            ET.SubElement(material, 'color', rgba=color)


def main():
    tree = ET.parse(ROOT / 'tools/kinematic-tree.urdf')
    links = {link.get('name'): link for link in tree.findall('link')}
    edges = {j.find('child').get('link'): (j.find('parent').get('link'), transform(j.find('origin')))
             for j in tree.findall('joint')}
    frames = {'robotiq_arg2f_base_link': np.eye(4)}
    def frame(name):
        if name not in frames:
            parent, offset = edges[name]
            frames[name] = frame(parent) @ offset
        return frames[name]

    # The r2 mount uses +Z along the hand, fingers along +/-Y. Menagerie's
    # hand datum is 10.8 mm above its base frame, with fingers along +/-X.
    basis = np.eye(4)
    basis[:3, :3] = Rotation.from_euler('z', np.pi / 2).as_matrix()
    basis[2, 3] = -0.0108
    mapping = {'base/base': 'body', 'base/c-a01-85-open': 'body'}
    for side in ('left', 'right'):
        mapping.update({f'{side}_driver/driver': f'{side}_outer_knuckle',
                        f'{side}_coupler/coupler': f'{side}_outer_finger',
                        f'{side}_spring_link/spring_link': f'{side}_inner_knuckle',
                        f'{side}_follower/follower': f'{side}_inner_finger',
                        f'{side}_follower/tongue': f'{side}_inner_finger_pad'})
    colors = {'black': '.149 .149 .149 1', 'metal': '.58 .58 .58 1', 'silicone': '.1882 .1882 .1882 1'}
    def visit(body, parent):
        pose = parent @ transform(body, True)
        for geom in body.findall('geom'):
            if geom.get('class') != 'visual':
                continue
            filename = geom.get('mesh')
            key = f'{body.get("name")}/{filename}'
            if key not in mapping:
                continue  # Coupling is a separate purchased component.
            link = mapping[key]
            offset = np.linalg.inv(frame(link)) @ basis @ pose @ transform(geom, True)
            geometry(links[link], filename, offset, colors[geom.get('material', 'black')])
        for child in body.findall('body'):
            visit(child, pose)
    visit(ET.parse(SOURCE / '2f85.xml').find('worldbody/body'), np.eye(4))
    ET.indent(tree)
    tree.write(ROOT/'urdf/robotiq-2f85.urdf', encoding='utf-8', xml_declaration=True)

    # Published reference housing: PCD50 and the four M5 axes are retained.
    # Electronics, spring contacts and flexible cable are not represented.
    robot = ET.Element('robot', name='grp-es-cpl-062')
    plate = ET.SubElement(robot, 'link', name='mount')
    offset = np.eye(4)
    offset[:3, :3] = Rotation.from_euler('x', -np.pi/2).as_matrix()
    offset[2, 3] = .004
    geometry(plate, 'base_coupling', offset, colors['black'])
    ET.SubElement(robot, 'link', name='flange')
    joint = ET.SubElement(robot, 'joint', name='flange_joint', type='fixed')
    ET.SubElement(joint, 'parent', link='mount')
    ET.SubElement(joint, 'child', link='flange')
    ET.SubElement(joint, 'origin', xyz='0 0 0.0139', rpy='0 0 0')
    ET.indent(robot)
    ET.ElementTree(robot).write(ROOT/'urdf/grp-es-cpl-062.urdf', encoding='utf-8', xml_declaration=True)


if __name__ == '__main__':
    main()
