import {THREE,group,silver,dark,rubber,blue,box,cylinder,lathe,plate,addMesh,namedMaterial,collisionBox as cb,collisionCylinder as cc,fixed} from '../../authoring/tool-shapes.mjs';

// 10.02.02.05559 individual datasheet, body L76.5/B12/H65.3; L1 incl. silencer95.3.
// Mount is the underside datum (z=0), not a qualified robot flange.
export const D={length:.0765,width:.012,height:.0653,overallLength:.0953,overallHeight:.0739};
export function definition(){
 const g=group();
 box(g,'valve_manifold',[D.length,D.width,.038],[0,0,.019],dark);
 box(g,'control_housing',[D.length,D.width,.0273],[0,0,.05165],silver);
 for(const x of [-.022,.018])box(g,'control_face_'+x,[.014,.001,.012],[x,-.00575,.049],dark);
 for(const x of [-.022,.018])box(g,'status_'+x,[.004,.0005,.0015],[x,-.006,.053],blue);
 for(const z of [.0075,.0175,.030]){
  const fitting=cylinder(g,'push_in_'+z,.0045,.002,[0,0,z],silver);fitting.rotation.y=Math.PI/2;fitting.position.x=-D.length/2+.001;
  const bore=cylinder(g,'bore_'+z,.0021,.0022,[0,0,z],dark);bore.rotation.y=Math.PI/2;bore.position.x=-D.length/2+.0011;
 }
 const silencer=cylinder(g,'silencer',.0045,.0188,[0,0,.0175],silver);silencer.rotation.y=Math.PI/2;silencer.position.x=D.length/2+.0094;
 cylinder(g,'m8_connector',.004,.0086,[.02685,0,.0696],dark);
 return{name:'schmalz_scpmc_05',links:[{name:'mount',visual:g,collisions:[cb([D.length,D.width,D.height],[0,0,D.height/2])]},{name:'tcp'}],joints:[fixed('tcp_joint','mount','tcp')]};
}
