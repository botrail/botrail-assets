/** MPH-3 appearance. SI dimensions follow urdf/multi-hand-mph3.urdf.
 * Rounded edges and finishes are authored design choices, not measured data.
 * Use with Robot.with_visuals; the original URDF remains the collision model.
 */
import * as THREE from 'three';
import { RobotBuilder } from 'three-usd-robot';
import { serializeUsda } from 'three-usd-robot/core';
import { roundedBox, namedMaterial, addMesh } from '../authoring/geometry.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FINISH_PITCH, steelFinishMaterial, writeFinishTextures } from './finish.mjs';

export function exportVisual() {
  const b = new RobotBuilder({name: 'mph3'});
  const steel = namedMaterial('machined_steel', new THREE.Color(0.55, 0.56, 0.58), 1, 0.30);
  const black = namedMaterial('black_oxide', new THREE.Color(0.06, 0.06, 0.07), 0.75, 0.38);
  // A revolved bevel stays within the original cylinder and keeps flat ends.
  function beveledCylinder(radius, height, bevel) {
    const profile = [[0, 0], [radius-bevel, 0], [radius, bevel],
      [radius, height-bevel], [radius-bevel, height], [0, height]];
    const g = new THREE.LatheGeometry(profile.map(p => new THREE.Vector2(...p)), 96);
    // Arc length on the cylindrical wall; planar end-face coordinates.
    // Split UVs at the cap boundary without moving any vertex or normal.
    const flat=g.toNonIndexed(), p=flat.getAttribute('position'), uv=flat.getAttribute('uv');
    for(let i=0;i<p.count;i+=3){
      const cap=Math.abs(p.getY(i)-p.getY(i+1))<1e-8 && Math.abs(p.getY(i)-p.getY(i+2))<1e-8;
      for(let j=i;j<i+3;j++) {
        if(cap) uv.setXY(j,p.getX(j)/FINISH_PITCH,p.getZ(j)/FINISH_PITCH);
        else uv.setXY(j,uv.getX(j)*2*Math.PI*radius/FINISH_PITCH,p.getY(j)/FINISH_PITCH);
      }
    }
    g.dispose();
    flat.rotateX(Math.PI / 2);
    return flat;
  }
  const plate = new THREE.Group();
  addMesh(plate, 'plate', beveledCylinder(.04, .012, .0008), steel);
  const pusher = new THREE.Group();
  addMesh(pusher, 'pin', beveledCylinder(.006, .060, .0006), steel);
  const fork = new THREE.Group();
  addMesh(fork, 'crossbar', roundedBox([.050, .010, .010], .0006), black, [0, 0, .005]);
  const prong = () => {
    const group = new THREE.Group();
    addMesh(group, 'prong', roundedBox([.010, .010, .080], .0006), black, [0, 0, .040]);
    return group;
  };
  const frame = (x, y, z, rx=0, rz=0) => new THREE.Matrix4().compose(
    new THREE.Vector3(x,y,z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,0,rz,'ZYX')),
    new THREE.Vector3(1,1,1));
  const pin = frame(.04,0,.022, Math.PI/2,Math.PI/2);
  const hook = frame(-.04,0,.022, -Math.PI/2,Math.PI/2);
  const links = [
    ['mph3_plate', new THREE.Matrix4(), plate],
    ['mph3_gripper', frame(0,0,.012)],
    ['mph3_pusher', pin, pusher],
    ['mph3_pusher_tip', pin.clone().multiply(frame(0,0,.06))],
    ['mph3_fork', hook, fork],
    ['mph3_fork_prong_l', hook.clone().multiply(frame(-.02,0,0)), prong()],
    ['mph3_fork_prong_r', hook.clone().multiply(frame(.02,0,0)), prong()],
    ['mph3_fork_tip', hook.clone().multiply(frame(0,0,.05))],
  ];
  for (const [name, at, geometry] of links) {
    // RobotBuilder consumes visuals in world coordinates and converts them
    // into the declared link frame during export.
    if (geometry) { geometry.applyMatrix4(at); geometry.updateMatrixWorld(true); }
    b.addLink({name, frame: at, visuals: geometry ? [geometry] : []});
    b.addFixedJoint({name: `${name}_joint`, child: name,
      ...(name === 'mph3_plate' ? {} : {parent: 'mph3_plate'})});
  }
  const stage=b.toUsda();
  const looks=stage.prims[0].children.find(p=>p.name==='Looks');
  const i=looks.children.findIndex(p=>p.name==='machined_steel');
  if(i<0)throw new Error('MPH-3 steel material missing');
  looks.children[i]=steelFinishMaterial();
  return serializeUsda(stage);
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const target=resolve(process.argv[2]??fileURLToPath(new URL('./usd/visual.usda',import.meta.url)));
  mkdirSync(dirname(target),{recursive:true});
  writeFinishTextures(resolve(dirname(target),'textures'));
  writeFileSync(target,exportVisual());
  console.log(target);
}
