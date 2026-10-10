"""Independent standard-library audit of exported AX OBJ + URDF.
Swept axis-aligned bounds are conservative for this single rigid +Z motion:
separated bounds certify nonintersection; overlapping bounds fail for review,
not a claim of a mesh intersection. No hidden mechanism or load capacity tested.
"""
from pathlib import Path
import hashlib,json,xml.etree.ElementTree as ET
ASSET=Path(__file__).resolve().parent.parent
LEGACY='d01d8d818a02a9e458da0c1ed015921b4c124c56da7d66ace82c906ec1fe85ac'
def parse_obj(path):
    vertices=[];groups={};name=None
    for line in path.read_text().splitlines():
        p=line.split()
        if not p:continue
        if p[0]=='v':vertices.append(tuple(map(float,p[1:4])))
        elif p[0]=='o':name=p[1];groups[name]=set()
        elif p[0]=='f':groups[name].update(int(t.split('/')[0])-1 for t in p[1:])
    return {name:[[min(vertices[j][k] for j in ids) for k in range(3)],
                  [max(vertices[j][k] for j in ids) for k in range(3)]] for name,ids in groups.items()}
def separation(a,b):return max(max(a[0][k]-b[1][k],b[0][k]-a[1][k]) for k in range(3))
def translated(bounds,xyz):return [[p[k]+xyz[k] for k in range(3)] for p in bounds]
p=ASSET/'urdf/robotiq-ax-series-base.urdf';digest=hashlib.sha256(p.read_bytes()).hexdigest();assert digest==LEGACY
xml=ET.parse(p).getroot();joint=xml.find("joint[@name='lift_joint']")
assert joint.get('type')=='prismatic' and joint.find('axis').get('xyz')=='0 0 1'
origin=list(map(float,joint.find('origin').get('xyz').split()));limit=joint.find('limit')
lo,hi=float(limit.get('lower')),float(limit.get('upper'));assert (lo,hi)==(0,1.5)
fixed=parse_obj(ASSET/'meshes/base_link.obj');moving=parse_obj(ASSET/'meshes/carriage.obj')
violations=[];min_gap=float('inf');pair=None
for name,local in moving.items():
    swept=translated(local,origin);swept[1][2]+=hi
    for fname,b in fixed.items():
        gap=separation(swept,b)
        if gap<min_gap:min_gap,pair=gap,[name,fname]
        if gap < -1e-7:violations.append([name,fname,gap])
assert not violations,violations
supports=[]
for sign in [-1,1]:
    rail=fixed[f'guide_rail_{sign}']
    for z in ['-0.095','0.095']:
        for side in [-1,1]:
            name=f'guide_shoe_side_{sign}_{z}_{side}';shoe=translated(moving[name],origin)
            low=shoe[0][2]-rail[0][2];high=rail[1][2]-shoe[1][2]-hi
            assert min(low,high)>0
            lateral=rail[0][0]-shoe[1][0] if side<0 else shoe[0][0]-rail[1][0]
            assert abs(lateral-.001)<1e-7
            supports.append({'shoe':name,'rail_margin_low_m':low,'rail_margin_high_m':high,'lateral_gap_m':lateral})
frames=[]
for i in range(1501):
    q=hi*i/1500;pos=[origin[0],origin[1]+.420,origin[2]+q+.150]
    assert abs(pos[2]-(.550+q))<1e-12
    if i in [0,750,1500]:frames.append({'q_m':q,'robot_mount_m':pos})
report={'urdf_sha256':digest,'meshes_sha256':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted((ASSET/'meshes').glob('*.obj'))},
 'fixed_components':len(fixed),'moving_components':len(moving),'swept_pairs':len(fixed)*len(moving),
 'full_stroke_swept_aabb_violations':violations,'minimum_separating_axis_gap_m':min_gap,'minimum_gap_pair':pair,
 'fk_samples':1501,'representative_frames':frames,'guide_capture':supports,
 'limitations':['Axis-separated swept visual bounds certify nonintersection only for this authored rigid +Z translation.',
 'Legacy collision solids, anchor fit, bearing tolerances, load capacity and flexible cables are not validated.']}
print(json.dumps(report,indent=2))
