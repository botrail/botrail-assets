"""Independent reference-aware visual authoring for NIMAK 95.020.516/P3U.

The measured coordinate frame, mounting geometry and kinematic model belong to
``generate_model.py``. This module changes only visible solids. Profiles and
perforation layouts are intentionally authored, not traced/imported vendor CAD.
Dimensions below are SI metres, approximate unless explicitly labelled measured.
"""
from __future__ import annotations
import math
import numpy as np
import trimesh as tm
from reference_urdf import cylinder

ALUMINUM=(.66,.69,.71,1)
EDGE=(.51,.55,.58,1)
STEEL=(.34,.38,.40,1)
DARK=(.10,.12,.13,1)
COPPER=(.65,.36,.19,1)
RESIN=(.58,.245,.095,1)
ORANGE=(.79,.29,.08,1)

# The surface language of the exact official 95.020.516 illustration: raked
# cradle, perforated pivot spine, tapered silver arms and cast transformer.
# These modest vertex lists are authored design choices, NOT digitized contours.
CRADLE_PROFILE=[(-.274,.052),(.116,.052),(.213,.191),(.107,.356),
                 (.041,.506),(-.204,.528),(-.294,.335),(-.308,.098)]
SPINE_PROFILE=[(-.310,.570),(.047,.570),(.063,.601),(.062,.654),
               (.039,.677),(-.286,.677),(-.320,.647),(-.320,.594)]
FORK_PROFILE=[(-.039,.598),(-.028,.663),(.281,.677),(.315,.654),
              (.315,.398),(.297,.367),(.253,.360),(.218,.390),
              (.208,.482),(.100,.558)]
ARM_PROFILE=[(.146,.688),(.272,.688),(.272,1.082),(.251,1.141),
             (.187,1.325),(.151,1.325),(.151,1.215),(.197,1.066),
             (.197,.790),(.146,.790)]
ARM_POCKET=[(.210,.800),(.257,.800),(.257,1.078),(.236,1.139),
            (.181,1.295),(.168,1.295),(.168,1.217),(.210,1.066)]


def _earclip(poly):
    """Small deterministic triangulator for independently authored simple loops."""
    p=np.asarray(poly,float)
    area=sum(p[i,0]*p[(i+1)%len(p),1]-p[(i+1)%len(p),0]*p[i,1] for i in range(len(p)))
    order=list(range(len(p))) if area>0 else list(reversed(range(len(p))))
    def cross(a,b):return a[0]*b[1]-a[1]*b[0]
    triangles=[]
    while len(order)>3:
        for n,b in enumerate(order):
            a,c=order[n-1],order[(n+1)%len(order)]
            if cross(p[b]-p[a],p[c]-p[b])<=1e-12:continue
            inside=False
            for k in order:
                if k in (a,b,c):continue
                if all(cross(p[v]-p[u],p[k]-p[u])>=-1e-12 for u,v in [(a,b),(b,c),(c,a)]):inside=True;break
            if inside:continue
            triangles.append((a,b,c));order.pop(n);break
        else:raise ValueError('Profile must be a nondegenerate simple polygon')
    triangles.append(tuple(order))
    return triangles


def plate(poly,y,thickness):
    """Extrude an XZ loop in Y, with checked outward winding."""
    n=len(poly)
    verts=[(x,y+s*thickness/2,z) for s in [-1,1] for x,z in poly]
    faces=[]
    for a,b,c in _earclip(poly):faces.extend([(a,b,c),(a+n,c+n,b+n)])
    area=sum(poly[i][0]*poly[(i+1)%n][1]-poly[(i+1)%n][0]*poly[i][1] for i in range(n))
    for i in range(n):
        j=(i+1)%n
        f=[(i,i+n,j+n),(i,j+n,j)]
        faces.extend(f if area>0 else [(a,c,b) for a,b,c in f])
    mesh=tm.Trimesh(verts,faces,process=True)
    if mesh.volume<0:mesh.invert()
    assert mesh.is_watertight
    return mesh


def ycyl(x,z,r,y0=-.12,y1=.12):
    return cylinder(r,(x,y0,z),(x,y1,z))[0]


def box(size,center):return tm.creation.box(size,transform=tm.transformations.translation_matrix(center))


def chamfer_box(size,center,b=.004):
    """Convex machined box with edge chamfers, no render-time modifier."""
    h=np.asarray(size)/2;points=[]
    for a in range(3):
        other=[i for i in range(3) if i!=a]
        for s in [-1,1]:
            for u in [-1,1]:
                for v in [-1,1]:
                    p=np.zeros(3);p[a]=s*h[a]
                    p[other[0]]=u*(h[other[0]]-min(b,h[other[0]]*.3))
                    p[other[1]]=v*(h[other[1]]-min(b,h[other[1]]*.3))
                    points.append(p+center)
    return tm.convex.convex_hull(points)


def cut(mesh,tools):
    return tm.boolean.difference([mesh,*tools],engine='manifold') if tools else mesh


def rounded_slot(x,z,w,h,y0=-.12,y1=.12,r=.009):
    # X and Z size, extruded along Y. Corner squares are removed by a convex
    # profile approximation rather than intersecting multiple bore surfaces.
    p=[]
    for cx,cz,start in [(x+w/2-r,z+h/2-r,0),(x-w/2+r,z+h/2-r,90),(x-w/2+r,z-h/2+r,180),(x+w/2-r,z-h/2+r,270)]:
        for deg in np.linspace(start,start+90,9):
            a=math.radians(deg);p.append((cx+r*math.cos(a),cz+r*math.sin(a)))
    return plate(p,(y0+y1)/2,y1-y0)


def ring(x,z,outer,inner,y,thickness):return cut(ycyl(x,z,outer,y-thickness/2,y+thickness/2),[ycyl(x,z,inner,y-thickness,y+thickness)])


def socket_head(center,axis=1,r=.006,h=.004,outward=1):
    c=np.asarray(center,float);direction=np.eye(3)[axis]*outward
    outer=cylinder(r,c-direction*h,c)[0]
    depth=h*.65
    # A true blind recess with a preserved floor.
    hole=tm.creation.cylinder(r*.47,height=depth+.001,sections=6)
    pose=tm.geometry.align_vectors([0,0,1],direction);pose[:3,3]=c-direction*(depth-.001)/2;hole.apply_transform(pose)
    return cut(outer,[hole])


def add_reference_visuals(m):
    # Keep the original nonvisual tree byte-for-byte; no geometry below calls
    # collision(), joint() or link(). Every shape is world-authored at q=0.
    def replace(link,name,mesh,color):
        for e in list(m.links[link].findall('visual')):
            if e.get('name')==name:m.links[link].remove(e)
        m.mesh(link,name,mesh,color)
    def detail(link,name,mesh,color=ALUMINUM):replace(link,'detail_'+name,mesh,color)
    def screws(link,name,positions,r=.006,side=-1):
        if positions:detail(link,name,tm.util.concatenate([socket_head(p,r=r,outward=side) for p in positions]),DARK)

    # Preserve physical mounting interfaces. Add a true blind socket to each
    # CB10-25 head without changing its original nominal 16x10-mm envelope.
    for i in range(1,11):
        link=f'mount_bolt_h{i}';c=m.origins[link]+[0,0,.010]
        replace(link,f'CB10_25_head_h{i}',socket_head(c,axis=2,r=.008,h=.010),DARK)

    # Body chassis perforations: the layout is illustrative, not a manufacturer
    # drill template. Large windows are actual booleans through each plate.
    windows=[rounded_slot(-.154,.164,.093,.110,r=.012),
             rounded_slot(-.021,.164,.090,.115,r=.009),
             rounded_slot(-.088,.323,.110,.068,r=.015),
             rounded_slot(.092,.225,.030,.104,r=.013)]
    bores=[(-.245,.156,.019),(-.185,.399,.037),(.023,.290,.023),
           (.004,.402,.042),(-.238,.282,.020),(.096,.132,.018)]
    hole_centers=[]
    for z in np.linspace(.094,.324,10):hole_centers.append((-.285,z))
    for x in np.linspace(-.255,.102,14):hole_centers.append((x,.072))
    for t in np.linspace(0,1,9):hole_centers.append((.111+.067*t,.092+.107*t))
    for t in np.linspace(0,1,9):hole_centers.append((.165-.076*t,.217+.121*t))
    for t in np.linspace(0,1,6):hole_centers.append((.073-.036*t,.389+.080*t))
    for side,slug in [(-1,'left'),(1,'right')]:
        y=side*.070
        tools=windows+[ycyl(x,z,r) for x,z,r in bores]+[ycyl(x,z,.006) for x,z in hole_centers]
        replace('body',f'lower_frame_{slug}',cut(plate(CRADLE_PROFILE,y,.012),tools),ALUMINUM)
        for num,x in enumerate([-.060,.060]):
            detail('body',f'p3u_standoff_{slug}_{num}',chamfer_box((.035,.028,.044),(x,side*.058,.063),.003),EDGE)
        # The transformer cheek is a genuine short support rail behind the
        # slanted cradle, rather than a visually dominant rectangular wall.
        cheek=[(-.330,.330),(-.041,.330),(-.041,.350),(-.287,.365),(-.302,.517),(-.330,.517)]
        replace('body',f'transformer_cheek_{slug}',plate(cheek,side*.054,.008),EDGE)
        # Broad fixed pivot spine: repeated holes and relieved access opening.
        spine_holes=[]
        for x in np.arange(-.285,.021,.029):
            for z in [.588,.615,.650]:
                if math.hypot(x+.0134,z-.632)>.063 and not (abs(x+.239)<.027 and abs(z-.632)<.032):
                    spine_holes.append(ycyl(x,z,.0055))
        spine_holes+=[ycyl(-.0134,.632,.0455),rounded_slot(-.239,.632,.036,.045,r=.012)]
        detail('body',f'pivot_spine_{slug}',cut(plate(SPINE_PROFILE,side*.077,.010),spine_holes),ALUMINUM)
        screws('body',f'spine_{slug}_hardware',[(x,side*.083,z) for x,z in [(-.289,.585),(-.289,.652),(.035,.593)]],.007,side)
        # Paired moving fork plates carry the eye and pivot. Their two measured
        # hole centers are retained while the surrounding profile is authored.
        forkholes=[ycyl(-.0134,.632,.0455),ycyl(.2541,.384,.0105),
                   rounded_slot(.219,.558,.113,.035,r=.014),ycyl(.257,.475,.022)]
        for x in np.arange(.070,.291,.029):
            for z in [.602,.632,.659]:forkholes.append(ycyl(x,z,.0055))
        fork=plate(FORK_PROFILE,side*.059,.010)
        replace('moving_jaw',f'swing_lever_{slug}',cut(fork,forkholes),ALUMINUM)
        screws('moving_jaw',f'fork_{slug}_hardware',[(x,side*.065,z) for x,z in [(.299,.632),(.296,.395),(.272,.658)]],.007,side)
        bridge=[(-.256,.493),(-.178,.493),(-.157,.595),(-.270,.595)]
        detail('body',f'spine_bridge_{slug}',plate(bridge,side*.063,.024),EDGE)
        # Chassis cross-members behind the holes make the side view visibly
        # three-dimensional and connect the P3U support at Z42 mm.
        for num,(x,z) in enumerate([(-.255,.098),(.083,.106),(-.210,.461)]):
            if side<0:detail('body',f'chassis_crossmember_{num}',cylinder(.013,(x,-.065,z),(x,.065,z))[0],STEEL)
        screws('body',f'cradle_{slug}_hardware',[(x,side*.077,z) for x,z in [(-.255,.098),(.083,.106),(-.210,.461),(-.250,.330)]],.006,side)

    # H3.53N.022-1 transformer uses a brown/orange resin/insulation appearance
    # observed in the exact reference, not the old fictitious blue radiator.
    replace('body','transformer_core',chamfer_box((.30,.106,.168),(-.177,0,.424),.012),RESIN)
    for z in [.35,.385,.42,.455,.49]:
        replace('body',f'transformer_rib_{int(z*1000)}',chamfer_box((.316,.112,.009),(-.175,0,z),.002),EDGE)
    for side,slug in [(-1,'front'),(1,'back')]:
        terminal=[(-.199,.471),(-.003,.471),(.014,.487),(.010,.515),(-.199,.515)]
        detail('body',f'transformer_insulator_{slug}',plate(terminal,side*.060,.006),ORANGE)
        screws('body',f'transformer_{slug}_bolts',[(x,side*.065,z) for x in [-.175,-.140,-.105,-.070,-.035] for z in [.480,.505]],.004,side)
    # Upper connection to the spine is compact and stepped.
    replace('body','fixed_arm_support',chamfer_box((.2125,.075,.060),(-.11965,0,.632),.008),EDGE)
    replace('moving_jaw','swing_arm_support',chamfer_box((.2125,.075,.060),(.09285,0,.632),.008),EDGE)

    for side,slug,link,x in [(1,'right','moving_jaw',.1991),(-1,'left','body',-.2259)]:
        def mirror(poly):return [(px if side>0 else -.0268-px,pz) for px,pz in poly]
        # Main beam is a silver, tapered machined extrusion with recessed faces.
        arm=plate(mirror(ARM_PROFILE),0,.047)
        pockets=[plate(mirror(ARM_POCKET),sy*.025,.013) for sy in [-1,1]]
        replace(link,f'{slug}_arm_blade',cut(arm,pockets),ALUMINUM)
        lower=[(.142,.670),(.264,.670),(.264,.797),(.205,.815),(.153,.772)]
        replace(link,f'{slug}_arm_lower',plate(mirror(lower),0,.055),ALUMINUM)
        replace(link,f'{slug}_arm_clamp',chamfer_box((.18,.10,.10),(x,0,.632),.010),EDGE)
        # Tip transition is a small terminal/clamp, not a long copper arm.
        hx=.1366 if side>0 else -.1634
        tipx=.170 if side>0 else -.1968
        replace(link,f'{slug}_arm_tip_bend',chamfer_box((.054,.053,.048),((hx+tipx)/2,0,1.313),.004),COPPER)
        for sy,label in [(-1,'front'),(1,'rear')]:
            screws(link,f'{slug}_clamp_{label}_screws',[(xx,sy*.051,.632) for xx in [x-.059,x+.059]],.009,sy)
            screws(link,f'{slug}_arm_{label}_screws',[(px if side>0 else -.0268-px,sy*.0245,pz) for px,pz in [(.230,.837),(.224,1.025),(.180,1.286)]],.0045,sy)
            # Distinct narrow reinforcing rail, seated in the arm face pocket.
            rail=[(.216,.809),(.224,.809),(.224,1.071),(.176,1.289),(.172,1.289),(.216,1.069)]
            detail(link,f'{slug}_arm_{label}_rail',plate(mirror(rail),sy*.0198,.003),EDGE)
        # Holder/electrode cylinders remain byte-identical to the numeric source.

    # Visible segmented concentric pivot, preserving the measured pin itself.
    for sy,label in [(-1,'front'),(1,'rear')]:
        detail('body',f'pivot_retainer_{label}',ring(-.0134,.632,.042,.029,sy*.091,.006),EDGE)
        detail('body',f'pivot_seal_{label}',ring(-.0134,.632,.030,.022,sy*.0945,.002),DARK)
        screws('body',f'pivot_{label}_screws',[(-.0134+.035*math.cos(t),sy*.095,.632+.035*math.sin(t)) for t in np.linspace(0,math.tau,7)[:-1]],.0038,sy)
    return m
