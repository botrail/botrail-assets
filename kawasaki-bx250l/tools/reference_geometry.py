"""Independently authored BX250L cast geometry from public reference evidence.

SI metres, global zero-pose coordinates. Numeric interfaces come from the
90151-0028DED drawing; undocumented cast radii/skin thicknesses are estimates.
No CAD import, image contour tracing or vendor tessellation is used.
"""
import math
import numpy as np
import trimesh as tm
from scipy.interpolate import PchipInterpolator

WHITE=(.79,.82,.80,1)
BLACK=(.028,.035,.039,1)
METAL=(.43,.46,.47,1)
# Drafting dimensions: base W750/D875, top wrist +237/-196 mm about J5.
BASE_WIDTH=.750
BASE_DEPTH=.875
WRIST_TOP=.237
WRIST_BOTTOM=-.196


def loft_z(stations, segments=64, samples=4, exponent=2.5):
    """Rounded cast section: rows are z, cx, cy, half-width-x, half-width-y."""
    a=np.array(stations,float);z=[]
    for u,v in zip(a[:-1,0],a[1:,0]):z.extend(np.linspace(u,v,samples,endpoint=False))
    z=np.array([*z,a[-1,0]]);v=PchipInterpolator(a[:,0],a[:,1:],axis=0)(z)
    t=np.arange(segments)*2*math.pi/segments
    cs=np.sign(np.cos(t))*abs(np.cos(t))**(2/exponent)
    sn=np.sign(np.sin(t))*abs(np.sin(t))**(2/exponent)
    verts=np.array([(cx+rx*c,cy+ry*s,zz) for zz,(cx,cy,rx,ry) in zip(z,v) for c,s in zip(cs,sn)])
    faces=[]
    for j in range(len(z)-1):
        for i in range(segments):
            k=(i+1)%segments;a0=j*segments+i;b0=j*segments+k;c0=(j+1)*segments+k;d0=(j+1)*segments+i
            faces.extend([(a0,b0,c0),(a0,c0,d0)])
    for j,reverse in [(0,True),(len(z)-1,False)]:
        c=len(verts);verts=np.vstack((verts,verts[j*segments:(j+1)*segments].mean(axis=0)))
        for i in range(segments):
            face=(c,j*segments+i,j*segments+(i+1)%segments);faces.append(face[::-1] if reverse else face)
    return tm.Trimesh(verts,faces,process=True)


def prism(points,thickness,axis=0,center=0):
    """Extruded independent 2D section with ear-clipped concave caps."""
    pts=np.asarray(points,float)
    signed=sum(pts[i,0]*pts[(i+1)%len(pts),1]-pts[(i+1)%len(pts),0]*pts[i,1] for i in range(len(pts)))
    if signed<0:pts=pts[::-1]
    def cross2(a,b,c):
        u,v=b-a,c-a
        return u[0]*v[1]-u[1]*v[0]
    ids=list(range(len(pts)));cap=[]
    while len(ids)>3:
        for j in range(len(ids)):
            a,b,c=ids[j-1],ids[j],ids[(j+1)%len(ids)]
            if cross2(pts[a],pts[b],pts[c])<=1e-12:continue
            if any(min(cross2(pts[a],pts[b],pts[k]),cross2(pts[b],pts[c],pts[k]),cross2(pts[c],pts[a],pts[k]))>=-1e-12 for k in ids if k not in (a,b,c)):continue
            cap.append((a,b,c));ids.pop(j);break
        else:raise ValueError('Invalid section polygon')
    cap.append(tuple(ids));n=len(pts);verts=[]
    for level in [center-thickness/2,center+thickness/2]:
        for u,v in pts:
            p=[0.,0.,0.];p[axis]=level;p[(axis+1)%3]=u;p[(axis+2)%3]=v;verts.append(p)
    faces=[tuple(reversed(t)) for t in cap]+[tuple(k+n for k in t) for t in cap]
    for i in range(n):
        j=(i+1)%n;faces.extend([(i,j,j+n),(i,j+n,i+n)])
    return tm.Trimesh(verts,faces,process=True)


def soften_section(points, iterations=2):
    p=np.asarray(points,float)
    for _ in range(iterations):
        p=np.array([q for a,b in zip(p,np.roll(p,-1,axis=0)) for q in [.8*a+.2*b,.2*a+.8*b]])
    return p


def section_loft_x(points, stations):
    """Variable-thickness cast section with geometric edge chamfers."""
    p=np.asarray(points,float)
    if sum(p[i,0]*p[(i+1)%len(p),1]-p[(i+1)%len(p),0]*p[i,1] for i in range(len(p)))<0:p=p[::-1]
    n=len(p);c=p.mean(axis=0);verts=np.array([[x,*xy] for x,scale in stations for xy in c+(p-c)*scale])
    base=prism(p,1,0,0);faces=[]
    for f in base.faces:
        if np.all(f<n):faces.append(tuple(f))
        elif np.all(f>=n):faces.append(tuple(f-n+(len(stations)-1)*n))
    for j in range(len(stations)-1):
        for i in range(n):
            k=(i+1)%n;faces.extend([(j*n+i,j*n+k,(j+1)*n+k),(j*n+i,(j+1)*n+k,(j+1)*n+i)])
    return tm.Trimesh(verts,faces,process=True)


def cylinder(r,a,b,sections=96):
    a,b=np.array(a),np.array(b);t=tm.geometry.align_vectors([0,0,1],b-a);t[:3,3]=(a+b)/2
    return tm.creation.cylinder(r,np.linalg.norm(b-a),sections=sections,transform=t)


def ring(r,inner,a,b):
    a,b=np.array(a),np.array(b);d=(b-a)/np.linalg.norm(b-a)
    return tm.boolean.difference([cylinder(r,a,b),cylinder(inner,a-.002*d,b+.002*d)],engine='manifold')


def capsule(a,b,r,count=18):
    a,b=np.array(a),np.array(b);theta=math.atan2(*(b-a)[::-1]);out=[]
    for p,start in [(b,theta-math.pi/2),(a,theta+math.pi/2)]:
        out.extend([p+r*np.array([math.cos(t),math.sin(t)]) for t in np.linspace(start,start+math.pi,count)])
    return out


def finish_motor(m,link,name,center,axis,r=.078,length=.115):
    c=np.array(center);d=np.eye(3)[axis]
    m.mesh(link,name+'_body',cylinder(r,c-length/2*d,c+length/2*d),BLACK)
    m.mesh(link,name+'_endcap',cylinder(r*.87,c+(length/2-.002)*d,c+(length/2+.015)*d),BLACK)
    # Simple connector block is supported by visible motor silhouette, not a
    # claimed pinout or exact motor SKU.
    size=np.array([r*.7]*3);size[axis]=length*.55
    m.box(link,name+'_connector',size,c+np.roll(d,1)*r*.88,BLACK,False)


def add_cast_geometry(m):
    # Four-lobed footprint, rear service extension and eight nominal Ø22 bores.
    outline=[(-.375,-.40),(-.375,-.50),(.375,-.50),(.375,-.40),(.295,-.34),(.285,-.20),(.285,.20),(.375,.28),(.375,.335),(.335,.375),(.28,.375),(.20,.285),(-.20,.285),(-.28,.375),(-.335,.375),(-.375,.335),(-.375,.28),(-.285,.20),(-.285,-.20),(-.295,-.34)]
    foot=prism(outline,.030,2,.015)
    holes=[];pads=[]
    for sx in [-1,1]:
        for sy in [-1,1]:
            for x,y in [(sx*.35,sy*.25),(sx*.25,sy*.35)]:
                holes.append(cylinder(.011,(x,y,-.01),(x,y,.055)))
                pads.append(cylinder(.025,(x,y,0),(x,y,.030)))
    webs=[tm.creation.box((.12,.06,.03),transform=tm.transformations.translation_matrix((sx*.30,sy*.25,.015))) for sx in [-1,1] for sy in [-1,1]]
    foot=tm.boolean.difference([tm.boolean.union([foot,*pads,*webs],engine='manifold'),*holes],engine='manifold')
    m.mesh('base_link','foot',foot,WHITE);m.collision('base_link','box',(0,-.0625,.015),size=(.75,.875,.03))
    pedestal=loft_z([(.030,0,0,.295,.30),(.07,0,0,.285,.29),(.11,0,0,.23,.235),(.21,0,0,.22,.225),(.258,0,0,.264,.268),(.274,0,0,.265,.269)],exponent=2)
    m.mesh('base_link','base_pedestal',pedestal,WHITE);m.collision('base_link','cylinder',(0,0,.152),radius=.295,length=.244)
    # Cast triangular load paths, shaped ribs rather than decoration on a slab.
    for i in range(4):
        a=(i+.5)*math.pi/2
        rib=prism([(.20,.033),(.40,.033),(.37,.08),(.255,.20),(.20,.20)],.048,0,0)
        # prism X thickness, Y radius and Z elevation -> radial placement.
        rib.apply_transform(tm.transformations.rotation_matrix(a,[0,0,1]))
        m.mesh('base_link',f'base_cast_rib_{i}',rib,WHITE)
    m.box('base_link','connector_box',(.31,.13,.17),(0,-.41,.115),WHITE,False)
    m.box('base_link','connector_panel',(.255,.008,.115),(0,-.477,.115),BLACK,False)
    for x in [-.074,0,.074]:m.mesh('base_link',f'power_connector_{str(x).replace("-","m").replace(".","_")}',cylinder(.017,(x,-.483,.11),(x,-.504,.11)),BLACK)
    m.mesh('link1','turntable',loft_z([(.277,0,0,.27,.275),(.295,0,0,.29,.295),(.326,0,0,.294,.299),(.342,0,0,.273,.278)],exponent=2),WHITE)
    m.collision('link1','cylinder',(0,0,.31),radius=.30,length=.07)
    shoulder=loft_z([(.334,0,.025,.26,.25),(.40,0,.045,.27,.275),(.50,-.025,.10,.25,.235),(.63,-.035,.16,.22,.20),(.72,-.035,.20,.21,.175)],samples=5)
    m.mesh('link1','shoulder_web',shoulder,WHITE);m.collision('link1','box',(0,.10,.53),size=(.55,.55,.40))
    m.mesh('link1','shoulder_housing',ring(.212,.151,(-.25,.21,.67),(-.10,.21,.67)),WHITE)
    finish_motor(m,'link1','shoulder_motor',(-.27,.21,.67),0,.105,.11)
    finish_motor(m,'link1','base_axis_motor',(.19,-.13,.53),2,.086,.21)
    # Distinct curved/tapered arm; this replaces the earlier straight box.
    arm=loft_z([(.67,.035,.21,.155,.176),(.78,.045,.22,.147,.184),(.96,.047,.20,.125,.155),(1.19,.045,.155,.105,.109),(1.40,.045,.147,.095,.10),(1.63,.045,.18,.086,.085),(1.77,.045,.21,.11,.096)],samples=6,exponent=3)
    m.mesh('link2','upper_arm',arm,WHITE)
    for j,(z,cy,wx,dy,h) in enumerate([(.84,.21,.30,.36,.34),(1.16,.16,.22,.25,.38),(1.51,.17,.20,.22,.39)]):m.collision('link2','box',(.045,cy,z),size=(wx,dy,h))
    m.mesh('link2','upper_arm_root',ring(.185,.140,(-.09,.21,.67),(.185,.21,.67)),WHITE)
    # Axial hub ring with dark motor rather than an arbitrary green slab.
    finish_motor(m,'link2','arm_axis_motor',(.19,.21,.67),0,.093,.075)
    m.mesh('link2','upper_arm_elbow',cylinder(.104,(-.08,.21,1.77),(.205,.21,1.77)),WHITE)
    # Cast offset carrier and genuine open triangular web.
    carrier=prism([(-.205,1.805),(-.20,1.87),(.20,2.15),(.41,2.18),(.49,2.06),(.43,1.93),(.29,1.78),(.16,1.72)],.075,0,.287)
    openings=[cylinder(.045,(.235,.19,1.89),(.34,.19,1.89)),cylinder(.035,(.235,.35,2.045),(.34,.35,2.045)),prism([(-.11,1.84),(.135,2.045),(.18,1.94),(.10,1.84)],.11,0,.287)]
    carrier=tm.boolean.difference([carrier,*openings],engine='manifold')
    m.mesh('parallel_arm2','elbow_carrier',carrier,WHITE)
    m.collision('parallel_arm2','box',(.287,.27,1.95),size=(.09,.40,.43))
    m.mesh('parallel_arm2','carrier_bearing',ring(.111,.06,(.25,.395,2.04),(.34,.395,2.04)),WHITE)
    link=loft_z([(.739459,.287,-.183923,.04,.064),(.85,.287,-.205,.036,.065),(1.21,.287,-.24,.028,.035),(1.65,.287,-.21,.030,.038),(1.839459,.287,-.183923,.04,.064)],samples=6)
    m.mesh('parallel_arm1','parallel_rod',link,WHITE)
    m.collision('parallel_arm1','box',(.287,-.215,1.29),size=(.09,.17,1.23))
    lower=prism([(-.25,.72),(-.21,.80),(.12,.785),(.25,.70),(.23,.64),(.08,.64)],.085,0,.287)
    lower=tm.boolean.difference([lower,cylinder(.03,(.23,-.08,.725),(.35,-.08,.725))],engine='manifold')
    m.mesh('link1','parallel_lower_bracket',lower,WHITE)
    m.mesh('link3','elbow_housing',ring(.192,.115,(-.21,.395,2.04),(.20,.395,2.04)),WHITE)
    m.mesh('link3','elbow_axis_endcap',cylinder(.114,(.18,.395,2.04),(.205,.395,2.04)),BLACK)
    finish_motor(m,'link3','elbow_motor',(-.19,.395,2.04),0,.092,.085)
    m.collision('link3','cylinder',(0,.395,2.04),(0,math.pi/2,0),radius=.192,length=.42)
    def along_y(stations):
        mesh=loft_z(stations,samples=4,exponent=2);mesh.vertices=mesh.vertices[:,[0,2,1]];mesh.invert();return mesh
    swivel=along_y([(.45,0,2.04,.166,.166),(.49,0,2.04,.170,.170),(.53,0,2.04,.157,.157),(.68,0,2.04,.121,.121),(.718,0,2.04,.145,.145),(.742,0,2.04,.145,.145)])
    m.mesh('link3','wrist_swivel_base',swivel,BLACK)
    m.collision('link3','cylinder',(0,.596,2.04),(math.pi/2,0,0),radius=.170,length=.292)
    # The wrist side elevation has a substantial open cast yoke, not a rod
    # ending in two blocks. These contours are independently chosen cast curves.
    shell_outline=[(.742,1.86),(.78,1.844),(.98,1.844),(1.08,1.87),(1.24,1.895),(1.54,1.87),(1.75,1.855),(1.82,1.91),(1.85,2.04),(1.80,2.21),(1.72,2.267),(1.13,2.277),(.86,2.27),(.78,2.21)]
    hollow=prism(capsule((1.22,2.04),(1.70,2.04),.102),.50,0,0)
    for side,label in [(-1,'left'),(1,'right')]:
        x=side*.14
        shell=section_loft_x(soften_section(shell_outline),[(x-.029,.975),(x-.022,1),(x+.022,1),(x+.029,.975)])
        hole_stations=[(x-.055,1.17),(x-.029,1.12),(x-.017,1),(x+.017,1),(x+.029,1.12),(x+.055,1.17)]
        hollow=section_loft_x(capsule((1.22,2.04),(1.70,2.04),.102),hole_stations)
        motor_cut=section_loft_x(capsule((.885,2.035),(.98,2.035),.100),hole_stations)
        shell=tm.boolean.difference([shell,hollow,motor_cut],engine='manifold')
        m.mesh('link4','wrist_fork_'+label,shell,WHITE)
        for tag,ctr,size in [('top',(side*.14,1.28,2.228),(.06,1.03,.095)),('bottom',(side*.14,1.28,1.877),(.06,1.03,.072)),('root',(side*.14,.77,2.04),(.06,.10,.35))]:m.collision('link4','box',ctr,size=size)
    # Rear bridge with visible motor and open passage forward to the hinge.
    m.mesh('link4','forearm',along_y([(.735,0,2.04,.165,.180),(.76,0,2.04,.17,.185),(.80,0,2.04,.158,.172)]),WHITE)
    m.collision('link4','box',(0,.77,2.04),size=(.34,.08,.38))
    finish_motor(m,'link4','wrist_drive_motor',(0,.96,2.04),0,.080,.28)
    m.box('link4','wrist_motor_mount',(.024,.185,.185),(-.146,.96,2.04),BLACK,False)
    m.mesh('link4','wrist_drive_shaft',cylinder(.037,(0,1.04,2.04),(0,1.70,2.04)),METAL)
    m.collision('link4','cylinder',(0,1.37,2.04),(math.pi/2,0,0),radius=.037,length=.66)
    # Long black service covers follow the cast upper rails; no trademark or
    # unverified lettering is placed on independently authored geometry.
    cover=prism(capsule((.87,2.209),(1.66,2.193),.057),.010,0,.174)
    m.mesh('link4','forearm_cover',cover,BLACK)
    cover2=cover.copy();cover2.apply_translation([-.348,0,0]);m.mesh('link4','forearm_cover_far',cover2,BLACK)
    m.mesh('link5','wrist_bend',cylinder(.116,(-.106,1.745,2.04),(.106,1.745,2.04)),WHITE)
    m.collision('link5','cylinder',(0,1.745,2.04),(0,math.pi/2,0),radius=.116,length=.212)
    m.mesh('link5','wrist_body',along_y([(1.745,0,2.04,.094,.115),(1.80,0,2.04,.108,.126),(1.885,0,2.04,.107,.125),(1.945,0,2.04,.09,.09)]),WHITE)
    m.collision('link5','cylinder',(0,1.845,2.04),(math.pi/2,0,0),radius=.126,length=.20)
    m.mesh('link6','wrist_output_housing',along_y([(1.94,0,2.04,.09,.09),(1.957,0,2.04,.109,.109),(2.015,0,2.04,.109,.109),(2.043,0,2.04,.094,.094),(2.050,0,2.04,.094,.094)]),WHITE)
    m.collision('link6','cylinder',(0,1.995,2.04),(math.pi/2,0,0),radius=.11,length=.11)
