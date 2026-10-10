#!/usr/bin/env python3
"""Reproducible RG2/RG6 URDF/OBJ audit, independent of the authoring scene.

Requires numpy, trimesh, scipy and manifold3d; no packages are installed here.
Example: PYTHONPATH=/path/to/deps python authoring/audits/onrobot-motion.py \
  --asset onrobot-rg2 --samples 101 --output /tmp/rg2-audit.json

All geometry calculations use millimetres. Boolean volumes are intersections of
actual tessellated closed solids, not AABB intersection volumes. AABBs only reject
obviously separated pairs. The motion sweep is sampled, not a continuous-motion
collision proof. Pivot/shaft/housing and attached-part overlaps are reported too;
these require engineering interpretation rather than being silently suppressed.
OBJ normal/UV seams are welded at 1e-5 mm for topology checks; no holes are filled.
"""
import argparse
import hashlib
import itertools
import json
from pathlib import Path
import xml.etree.ElementTree as ET

import numpy as np
import trimesh
import manifold3d as md


def numbers(text, default=(0., 0., 0.)):
    return np.array([float(x) for x in text.split()] if text else default)


def transform(xyz=None, rpy=None):
    xyz = np.zeros(3) if xyz is None else np.asarray(xyz)
    rpy = np.zeros(3) if rpy is None else np.asarray(rpy)
    result = trimesh.transformations.euler_matrix(*rpy, axes='sxyz')
    result[:3, 3] = xyz
    return result


def origin(element):
    o = element.find('origin')
    return transform() if o is None else transform(numbers(o.get('xyz')) * 1000, numbers(o.get('rpy')))


def union(solids):
    return md.Manifold.batch_boolean(solids, md.OpType.Add)


def obj_objects(path):
    vertices, objects, name = [], {}, 'default'
    for line in path.read_text().splitlines():
        parts = line.split()
        if not parts:
            continue
        if parts[0] == 'v':
            vertices.append([float(v) * 1000 for v in parts[1:4]])
        elif parts[0] == 'o':
            name = ' '.join(parts[1:])
        elif parts[0] == 'f':
            face = [int(p.split('/')[0]) for p in parts[1:]]
            face = [v - 1 if v > 0 else len(vertices) + v for v in face]
            for i in range(1, len(face) - 1):
                objects.setdefault(name, []).append([face[0], face[i], face[i+1]])
    for name, faces in objects.items():
        mesh = trimesh.Trimesh(vertices=np.array(vertices), faces=np.array(faces), process=False)
        mesh.remove_unreferenced_vertices()
        original_faces = len(mesh.faces)
        mesh.merge_vertices(merge_norm=True, merge_tex=True, digits_vertex=5)
        mesh.update_faces(mesh.nondegenerate_faces(height=1e-8))
        mesh.remove_unreferenced_vertices()
        edges, counts = np.unique(np.sort(mesh.edges, axis=1), axis=0, return_counts=True)
        stats = {'vertices': len(mesh.vertices), 'triangles': len(mesh.faces),
                 'removed_degenerate_triangles': original_faces - len(mesh.faces),
                 'boundary_edges': int((counts == 1).sum()),
                 'nonmanifold_edges': int((counts > 2).sum()),
                 'watertight': bool(mesh.is_watertight),
                 'winding_consistent': bool(mesh.is_winding_consistent),
                 'signed_volume_mm3': float(mesh.volume)}
        if not mesh.is_volume:
            raise ValueError(f'{path}: {name} is not an outward closed solid: {stats}')
        solid = md.Manifold(md.Mesh64(np.array(mesh.vertices, dtype=np.float64), np.array(mesh.faces, dtype=np.uint64)))
        if solid.status() != md.Error.NoError:
            raise ValueError(f'{path}: {name}: {solid.status()}')
        yield name, mesh, solid, stats


class Robot:
    def __init__(self, asset):
        self.asset = Path(asset)
        self.urdf = next((self.asset / 'urdf').glob('*.urdf'))
        self.xml = ET.parse(self.urdf).getroot()
        self.joints = list(self.xml.findall('joint'))
        self.by_joint = {j.get('name'): j for j in self.joints}
        self.links = [l.get('name') for l in self.xml.findall('link')]
        self.master = [j for j in self.joints if j.get('type') != 'fixed' and j.find('mimic') is None]
        assert len(self.master) == 1, 'Expected exactly one independent joint'
        self.master = self.master[0]
        self.upper = float(self.master.find('limit').get('upper'))
        self.lower = float(self.master.find('limit').get('lower'))
        self.visual, self.collision, self.objects, self.topology, self.vertices = {}, {}, {}, {}, {}
        for link in self.xml.findall('link'):
            name = link.get('name')
            visuals, points, stats, objects = [], [], {}, {}
            for visual in link.findall('visual'):
                mesh = visual.find('geometry/mesh')
                assert mesh is not None, 'Expected exported visual meshes'
                path = (self.urdf.parent / mesh.get('filename')).resolve()
                placement = origin(visual)
                for object_name, obj, solid, info in obj_objects(path):
                    obj.apply_transform(placement)
                    objects[object_name] = solid.transform(placement[:3])
                    visuals.append(objects[object_name])
                    points.extend(obj.vertices)
                    stats[object_name] = info
            if visuals:
                self.visual[name] = union(visuals)
                self.vertices[name] = np.array(points)
                self.objects[name], self.topology[name] = objects, stats
            collisions = []
            for collision in link.findall('collision'):
                geometry = collision.find('geometry')
                if geometry.find('box') is not None:
                    solid = md.Manifold.cube(numbers(geometry.find('box').get('size')) * 1000, center=True)
                elif geometry.find('cylinder') is not None:
                    cylinder = geometry.find('cylinder')
                    solid = md.Manifold.cylinder(float(cylinder.get('length')) * 1000,
                        float(cylinder.get('radius')) * 1000, circular_segments=128, center=True)
                else:
                    raise ValueError('Collision audit supports only boxes and cylinders')
                collisions.append(solid.transform(origin(collision)[:3]))
            if collisions:
                self.collision[name] = union(collisions)

    def pose(self, q):
        values = {}
        def value(joint):
            name = joint.get('name')
            if name not in values:
                mimic = joint.find('mimic')
                values[name] = (value(self.by_joint[mimic.get('joint')]) * float(mimic.get('multiplier', 1))
                    + float(mimic.get('offset', 0))) if mimic is not None else (q if name == self.master.get('name') else 0.)
            return values[name]
        children = {j.find('child').get('link') for j in self.joints}
        frames = {name: np.eye(4) for name in self.links if name not in children}
        pending = self.joints.copy()
        while pending:
            ready = [j for j in pending if j.find('parent').get('link') in frames]
            assert ready, 'Joint graph contains a cycle or unresolved parent'
            for joint in ready:
                motion = np.eye(4)
                if joint.get('type') in ('revolute', 'continuous'):
                    motion = trimesh.transformations.rotation_matrix(value(joint), numbers(joint.find('axis').get('xyz')))
                elif joint.get('type') == 'prismatic':
                    motion[:3,3] = numbers(joint.find('axis').get('xyz')) * value(joint) * 1000
                frames[joint.find('child').get('link')] = frames[joint.find('parent').get('link')] @ origin(joint) @ motion
                pending.remove(joint)
        return frames


def volume(solid):
    result = float(solid.volume())
    if result < -1e-5:
        raise ValueError(f'Negative Boolean volume: {result}')
    return max(result, 0.)


def bounds_overlap(a, b, tol=1e-8):
    a, b = np.array(a.bounding_box()), np.array(b.bounding_box())
    return np.all(np.minimum(a[3:], b[3:]) - np.maximum(a[:3], b[:3]) > tol)


def pair_kind(a, b):
    if '_flex_finger' in a and '_flex_finger' in b:
        return 'opposing_pads'
    if ('_finger_1_' in a and '_finger_2_' in b) or ('_finger_2_' in a and '_finger_1_' in b):
        return 'opposing_fingers'
    if a.endswith('_body') or b.endswith('_body'):
        return 'body_attachment_or_sweep'
    if a.endswith('_bracket') or b.endswith('_bracket'):
        return 'mount_attachment_or_sweep'
    return 'same_finger_joint_or_interference'


def sweep(robot, samples):
    qs = np.linspace(robot.lower, robot.upper, samples)
    pairs, gaps, parallel_errors, closure_errors, extents, tcp = {}, [], [], [], [], []
    connections = {}
    for sample, q in enumerate(qs):
        frames = robot.pose(float(q))
        world_vertices = {k: trimesh.transform_points(v, frames[k]) for k,v in robot.vertices.items()}
        all_vertices = np.vstack(list(world_vertices.values()))
        extents.append([all_vertices.min(axis=0).tolist(), all_vertices.max(axis=0).tolist()])
        tcp.append(frames['tcp'][:3,3].tolist())
        pads = sorted(k for k in robot.visual if k.endswith('_flex_finger'))
        gaps.append(float(world_vertices[pads[1]][:,0].min() - world_vertices[pads[0]][:,0].max()))
        for pad in pads:
            normal = frames[pad][:3,:3] @ np.array([1.,0,0])
            parallel_errors.append(float(np.linalg.norm(normal[1:])))
        # Analytic parallelogram constraint: rotating both equal arm vectors
        # preserves the fixed base-pivot separation in the tip/carrier frame.
        for side in (1,2):
            suffix = f'_finger_{side}_'
            moment = next(k for k in robot.visual if suffix in k and k.endswith('_moment_arm'))
            truss = moment.replace('_moment_arm','_truss_arm')
            tip = moment.replace('_moment_arm','_finger_tip')
            tj = next(j for j in robot.joints if j.find('child').get('link') == tip)
            v = origin(tj)[:3,3]
            mj = next(j for j in robot.joints if j.find('child').get('link') == moment)
            rj = next(j for j in robot.joints if j.find('child').get('link') == truss)
            base_delta = origin(mj)[:3,3] - origin(rj)[:3,3]
            moment_end = trimesh.transform_points([v],frames[moment])[0]
            carrier_pivot = trimesh.transform_points([base_delta],frames[tip])[0]
            closure_errors.append(float(np.linalg.norm(moment_end-carrier_pivot)))
        for representation, local in [('visual', robot.visual), ('collision', robot.collision)]:
            solids = {k:s.transform(frames[k][:3]) for k,s in local.items()}
            world_objects = {}
            if representation == 'visual':
                # A zero result means contact or overlap, not an interference-free joint.
                # The search is capped at 25 mm; larger gaps are reported as >=25 mm.
                for side in (1,2):
                    stem = next(k.rsplit('_moment_arm',1)[0] for k in solids if f'_finger_{side}_moment_arm' in k)
                    body = next(k for k in solids if k.endswith('_body'))
                    expected = [(body,stem+'_moment_arm'),(body,stem+'_truss_arm'),
                        (stem+'_moment_arm',stem+'_finger_tip'),(stem+'_truss_arm',stem+'_finger_tip'),
                        (stem+'_finger_tip',stem+'_flex_finger')]
                    for a,b in expected:
                        gap = float(solids[a].min_gap(solids[b],25.))
                        connection = connections.setdefault((a,b),{'links':[a,b],'minimum_mm':gap,'maximum_mm':gap,
                            'maximum_q_rad':float(q),'search_cap_mm':25.})
                        connection['minimum_mm'] = min(connection['minimum_mm'],gap)
                        if gap > connection['maximum_mm']:
                            connection['maximum_mm'],connection['maximum_q_rad'] = gap,float(q)
            for a,b in itertools.combinations(sorted(solids),2):
                if not bounds_overlap(solids[a],solids[b]):
                    continue
                overlap = volume(solids[a] ^ solids[b])
                if overlap <= 1e-4:
                    continue
                key = (representation, a, b)
                entry = pairs.setdefault(key, {'representation':representation,'links':[a,b], 'category':pair_kind(a,b),
                    'sample_count':0,'max_overlap_mm3':0.,'first_q_rad':float(q),'last_q_rad':float(q)})
                if representation == 'visual':
                    for link in (a,b):
                        if link not in world_objects:
                            world_objects[link] = {n:s.transform(frames[link][:3]) for n,s in robot.objects[link].items()}
                    components = entry.setdefault('_components',{})
                    for (an,aa),(bn,bb) in itertools.product(world_objects[a].items(),world_objects[b].items()):
                        if not bounds_overlap(aa,bb):
                            continue
                        component_volume=volume(aa^bb)
                        if component_volume<=1e-3:
                            continue
                        component=components.setdefault((an,bn),{'objects':[an,bn],'maximum_overlap_mm3':0.,'sample_count':0})
                        component['sample_count']+=1
                        if component_volume>component['maximum_overlap_mm3']:
                            component['maximum_overlap_mm3']=component_volume
                            component['maximum_q_rad']=float(q)
                entry['sample_count'] += 1
                entry['last_q_rad'] = float(q)
                if overlap > entry['max_overlap_mm3']:
                    entry['max_overlap_mm3'] = overlap
                    entry['max_q_rad'] = float(q)
        if sample % max(1, samples // 10) == 0:
            print(f'{robot.asset.name}: pose {sample+1}/{samples}', flush=True)
    for entry in pairs.values():
        if entry['representation'] != 'visual':
            continue
        entry['component_intersections_over_sweep']=sorted(entry.pop('_components',{}).values(),key=lambda x:-x['maximum_overlap_mm3'])
        frames = robot.pose(entry['max_q_rad'])
        a,b = entry['links']
        details=[]
        for (an,aa),(bn,bb) in itertools.product(robot.objects[a].items(),robot.objects[b].items()):
            aa,bb=aa.transform(frames[a][:3]),bb.transform(frames[b][:3])
            if bounds_overlap(aa,bb):
                overlap=volume(aa^bb)
                if overlap>1e-3:
                    details.append({'objects':[an,bn],'overlap_mm3':overlap})
        entry['component_intersections_at_max_pose']=sorted(details,key=lambda x:-x['overlap_mm3'])
    return {'samples':samples,'q_range_rad':[robot.lower,robot.upper],
            'pad_gap_open_mm':gaps[0],'pad_gap_closed_mm':gaps[-1],
            'pad_travel_mm':gaps[0]-gaps[-1], 'pad_minimum_gap_mm':min(gaps),
            'pad_gap_monotonic_decreasing':bool(np.all(np.diff(gaps)<0)),
            'pad_max_normal_off_axis':max(parallel_errors),
            'parallelogram_max_pivot_error_mm':max(closure_errors),
            'tcp_mm':tcp[0], 'tcp_max_change_mm':float(np.linalg.norm(np.array(tcp)-tcp[0],axis=1).max()),
            'open_bounds_mm':extents[0],'closed_bounds_mm':extents[-1],
            'connection_gaps':list(connections.values()),
            'pair_intersections':sorted(pairs.values(),key=lambda x:(x['representation'],-x['max_overlap_mm3']))}


def audit(asset, samples):
    robot = Robot(asset)
    coverage = []
    for name,visual in robot.visual.items():
        collision = robot.collision.get(name,md.Manifold())
        coverage.append({'link':name,'visual_volume_mm3':volume(visual),'collision_volume_mm3':volume(collision),
            'visual_outside_collision_mm3':volume(visual-collision),
            'collision_outside_visual_mm3':volume(collision-visual)})
    return {'asset':str(asset),'robot_name':robot.xml.get('name'),'urdf_sha256':hashlib.sha256(robot.urdf.read_bytes()).hexdigest(),
        'mesh_sha256':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted((robot.asset/'meshes').glob('*.obj'))},
        'method': 'Welded OBJ object solids, manifold3d Boolean union/intersection/difference in millimetres; sampled FK from committed URDF. Contacts below 1e-4 mm3 excluded. No continuous collision guarantee.',
        'topology':robot.topology,'visual_collision_coverage':coverage, 'motion':sweep(robot,samples)}



# Complete URDF bytes of the 2026-10-11 contract (sized from the official STEP measurements,
# upper limit where the fitted pads meet, TCP at their centre there) and the travel between the
# fitted pads: the datasheet bare-finger stroke less the pads' 4.45 / 5.0 mm protrusion per side.
FROZEN_CONTRACTS = {
    'onrobot_rg2_reference': ('e3b627fc28e69cb6bd85d31bf342ab3b4e3eb6133bcef6e5f0cdf67036d809f7', 101.1),
    'onrobot_rg6_reference': ('9ba23a7334ad9fce61bc89399f9ffd6c6e492eb752feb4c668d1bdabe2497bd3', 150.),
}


def allowed_joint_interface(a, b, an, bn):
    """Explicit visual joint/seat overlap whitelist; never hides report entries.

    These authored shafts and bosses deliberately overlap solid (unbored) pivot
    eyes. Whitelisting records a visual assembly convention, not physical bearing
    clearance or a manufacturing-tolerance certification.
    """
    if a.endswith('_bracket') or b.endswith('_bracket'):
        return a.endswith('_body') or b.endswith('_body')
    if a.endswith('_body') or b.endswith('_body'):
        body_object, arm_object, arm_link = (an,bn,b) if a.endswith('_body') else (bn,an,a)
        if arm_link.endswith('_moment_arm'):
            return arm_object.startswith(('pivot_boss_0_', 'pivot_axle_0_', 'pivot_recess_0_'))
        if arm_link.endswith('_truss_arm'):
            return body_object.startswith('truss_pivot_socket_') and arm_object.startswith(
                ('sculpted_link_', 'pivot_boss_0_', 'pivot_axle_0_', 'pivot_recess_0_'))
        return False
    # No overlaps between different fingers, including two pad contact faces.
    if ('_finger_1_' in a) != ('_finger_1_' in b):
        return False
    if a.endswith('_finger_tip') or b.endswith('_finger_tip'):
        tip_object, other_object, other_link = (an,bn,b) if a.endswith('_finger_tip') else (bn,an,a)
        if other_link.endswith('_moment_arm'):
            return tip_object == 'carrier_lower_axle' and other_object.startswith(
                ('sculpted_link_', 'pivot_boss_1_', 'pivot_axle_1_', 'pivot_recess_1_'))
        if other_link.endswith('_truss_arm'):
            return tip_object in ('carrier_pin','carrier_bridge') and other_object.startswith(
                ('sculpted_link_', 'pivot_boss_1_', 'pivot_axle_1_', 'pivot_recess_1_'))
        if other_link.endswith('_flex_finger'):
            return (tip_object.startswith('carrier_web_') or tip_object in ('finger_carrier','fingertip_adapter')) and other_object in (
                'rubber_pad_contact','rubber_pad_sleeve')
    return False


def validate_refined(report):
    failures=[]
    expected_hash,stroke=FROZEN_CONTRACTS[report['robot_name']]
    if report['urdf_sha256'] != expected_hash:
        failures.append('Complete URDF bytes differ from the published contract')
    motion=report['motion']
    if abs(motion['pad_travel_mm']-stroke)>0.001:
        failures.append('Pad travel differs from nominal by more than 0.001 mm')
    if motion['pad_minimum_gap_mm'] < -1e-5 or abs(motion['pad_gap_closed_mm']) > 1e-5:
        failures.append('Pad closure/contact exceeds 0.00001 mm tolerance')
    if not motion['pad_gap_monotonic_decreasing']:
        failures.append('Sampled pad closure is not strictly monotonic')
    if motion['pad_max_normal_off_axis']>1e-10:
        failures.append('Pad contact normals are not parallel to the closing axis')
    if motion['parallelogram_max_pivot_error_mm']>1e-7:
        failures.append('Parallelogram pivot closure exceeds 0.0000001 mm')
    if motion['tcp_max_change_mm']>1e-7:
        failures.append('TCP changes during actuation')
    for connection in motion['connection_gaps']:
        if connection['maximum_mm']>0.05:
            failures.append(f"Unsupported joint/seat gap {connection['links']}: {connection['maximum_mm']:.6f} mm > 0.05 mm")
    for pair in motion['pair_intersections']:
        if pair['representation']!='visual' or pair['max_overlap_mm3']<=0.01:
            continue
        components=pair['component_intersections_over_sweep']
        if not components:
            failures.append(f"Unattributed visual intersection: {pair['links']}")
        for component in components:
            if component['maximum_overlap_mm3']<=0.01:
                continue
            if not allowed_joint_interface(*pair['links'],*component['objects']):
                failures.append(f"Unexpected visual intersection {pair['links']} / {component['objects']}: "
                    f"{component['maximum_overlap_mm3']:.6f} mm3 at q={component['maximum_q_rad']}")
    return {'passed':not failures,'failures':failures,
            'support_gap_limit_mm':0.05,'unexpected_overlap_limit_mm3':0.01,
            'scope':'Sampled visual solids; explicitly whitelisted unbored pivot/shaft and rubber-seat interfaces remain reported. Collision-box overlaps (designed pivot and seat contacts) are reported, not gated.'}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--asset',type=Path,required=True)
    parser.add_argument('--baseline',type=Path)
    parser.add_argument('--samples',type=int,default=53)
    parser.add_argument('--output',type=Path,required=True)
    parser.add_argument('--check-refined',action='store_true',help='Fail on changed URDF, unsupported gaps or non-whitelisted visual intersections')
    args=parser.parse_args()
    if args.samples < 2:
        parser.error('--samples must be at least 2')
    report=audit(args.asset,args.samples)
    if args.baseline:
        baseline=audit(args.baseline,args.samples)
        report['baseline']=baseline
        report['compatibility']={'urdf_byte_identical':report['urdf_sha256']==baseline['urdf_sha256']}
        assert report['compatibility']['urdf_byte_identical'], 'URDF compatibility changed'
    if args.check_refined:
        report['refined_validation']=validate_refined(report)
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(report,indent=2)+'\n')
    print(f'Wrote {args.output}')
    if args.check_refined and not report['refined_validation']['passed']:
        for failure in report['refined_validation']['failures']:
            print('FAIL:',failure)
        raise SystemExit(1)


if __name__=='__main__':
    main()
