/** Small URDF-shaped scene descriptions for independently authored reference models.
 * SI units; product facts, approximations and geometry belong to each product.
 */
import * as THREE from 'three';

export function origin(object, xyz = [0, 0, 0], rpy = [0, 0, 0]) {
  object.position.fromArray(xyz);
  object.rotation.set(...rpy, 'ZYX'); // URDF fixed-axis roll, pitch, yaw
  return object;
}

export function referenceScene(definition) {
  const root = new THREE.Group(); root.name = definition.name;
  const links = new Map(definition.links.map(link => {
    const group = new THREE.Group(); group.name = link.name;
    if (link.visual) group.add(link.visual.clone(true));
    return [link.name, group];
  }));
  const drives = new Map();
  const children = new Set();
  for (const joint of definition.joints) {
    const frame = origin(new THREE.Group(), joint.xyz, joint.rpy);
    const drive = new THREE.Group(); drive.name = joint.name;
    frame.add(drive); drive.add(links.get(joint.child));
    links.get(joint.parent).add(frame); children.add(joint.child);
    drives.set(joint.name, drive);
  }
  for (const [name, link] of links) if (!children.has(name)) root.add(link);
  function pose(values = {}) {
    const resolved = new Map();
    function value(joint) {
      if (resolved.has(joint.name)) return resolved.get(joint.name);
      const q = joint.mimic
        ? value(definition.joints.find(j => j.name === joint.mimic.joint)) * (joint.mimic.multiplier ?? 1) + (joint.mimic.offset ?? 0)
        : (values[joint.name] ?? 0);
      resolved.set(joint.name, q); return q;
    }
    for (const joint of definition.joints) {
      const drive = drives.get(joint.name), q = value(joint);
      const axis = new THREE.Vector3(...(joint.axis ?? [0, 0, 1]));
      if (joint.type === 'revolute' || joint.type === 'continuous') drive.quaternion.setFromAxisAngle(axis, q);
      if (joint.type === 'prismatic') drive.position.copy(axis.multiplyScalar(q));
    }
    root.updateMatrixWorld(true);
  }
  pose();
  return {root, links, pose};
}
