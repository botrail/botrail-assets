"""Independent, standard-library-only audit of every authored OBJ component.
Run from any directory: python3 piab-picobot/authoring/verify_obj.py
Welds coincident positions at 1e-7 m; does not change the mesh.
"""
from pathlib import Path
from collections import Counter
import json, math
asset_dir=Path(__file__).resolve().parent.parent
results=[]
for path in sorted(asset_dir.glob('meshes/*.obj')):
    vertices=[];components={};current=None
    for line in path.read_text().splitlines():
        if line.startswith('v '):vertices.append(tuple(map(float,line.split()[1:4])))
        elif line.startswith('o '):
            current=line[2:];assert current not in components,current;components[current]=[]
        elif line.startswith('f '):
            face=[int(x.split('/')[0])-1 for x in line.split()[1:]]
            assert len(face)==3 and current is not None
            components[current].append(face)
    assert vertices and components
    assert all(math.isfinite(c) for v in vertices for c in v)
    keys=[tuple(round(c*1e7) for c in v) for v in vertices]
    def sub(a,b):return tuple(x-y for x,y in zip(a,b))
    def cross(a,b):return (a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
    def dot(a,b):return sum(x*y for x,y in zip(a,b))
    failures=[]
    for name,faces in components.items():
        edges=Counter();directed=Counter();volume=0;zero=0
        for face in faces:
            a,b,c=(vertices[i] for i in face)
            q=cross(sub(b,a),sub(c,a));zero+=dot(q,q)<1e-28
            volume+=dot(a,cross(b,c))/6
            for i in range(3):
                p,q=keys[face[i]],keys[face[(i+1)%3]]
                edges[tuple(sorted((p,q)))]+=1;directed[(p,q)]+=1
        bad_edges=sum(n!=2 for n in edges.values())
        winding=sum(directed[(p,q)]!=directed[(q,p)] for p,q in edges)
        if zero or bad_edges or winding or volume<=0:
            failures.append({'name':name,'zero_area':zero,'nonmanifold_edges':bad_edges,'winding_errors':winding,'signed_volume':volume})
    result={'components':len(components),'triangles':sum(map(len,components.values())),
            'bounds_m':[[min(v[i] for v in vertices) for i in range(3)],[max(v[i] for v in vertices) for i in range(3)]],
            'failures':failures}
    result['file']=str(path.relative_to(asset_dir));results.append(result);assert not failures,f'OBJ topology audit failed: {path.name}: {failures}'
print(json.dumps(results,indent=2))
