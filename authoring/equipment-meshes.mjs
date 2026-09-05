/** Low-cost visual meshes. All arguments and exported vertices are metres.
 * Product dimensions and provenance stay in the calling asset's authoring file.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { RobotBuilder } from 'three-usd-robot';
import { serializeUsda } from 'three-usd-robot/core';
import { namedMaterial } from './geometry.mjs';

export function wireGrid({width, height, apertureX, apertureZ, verticalDiameter, horizontalDiameter}) {
  const values = [width, height, apertureX, apertureZ, verticalDiameter, horizontalDiameter];
  if (!values.every(v => Number.isFinite(v) && v > 0)) throw new RangeError('positive finite dimensions required');
  const pitchX = apertureX + verticalDiameter, pitchZ = apertureZ + horizontalDiameter;
  const nx = Math.floor((width - verticalDiameter) / pitchX) + 1;
  const nz = Math.floor((height - horizontalDiameter) / pitchZ) + 1;
  const pieces = [];
  // Four-sided closed prisms, not per-wire scene residents. Clear gaps are real
  // geometry; no alpha blending, vendor texture, or coarsening of the aperture.
  for (let i = 0; i < nx; i++) {
    pieces.push(new THREE.BoxGeometry(verticalDiameter, verticalDiameter, height)
      .translate((i - (nx - 1) / 2) * pitchX, -verticalDiameter / 2, 0));
  }
  for (let i = 0; i < nz; i++) {
    pieces.push(new THREE.BoxGeometry(width, horizontalDiameter, horizontalDiameter)
      .translate(0, horizontalDiameter / 2, (i - (nz - 1) / 2) * pitchZ));
  }
  const geometry = mergeGeometries(pieces);
  pieces.forEach(g => g.dispose());
  geometry.userData = {verticalWires: nx, horizontalWires: nz, triangles: 12 * (nx + nz)};
  return geometry;
}

export function liftingEye({outerRadius, innerRadius, thickness, totalHeight}) {
  if (![outerRadius, innerRadius, thickness, totalHeight].every(v => Number.isFinite(v) && v > 0)
      || innerRadius >= outerRadius || totalHeight <= 2 * outerRadius) throw new RangeError('invalid lifting eye');
  const shape = new THREE.Shape(); shape.absarc(0, 0, outerRadius, 0, 2 * Math.PI, false);
  const hole = new THREE.Path(); hole.absarc(0, 0, innerRadius, 0, 2 * Math.PI, true); shape.holes.push(hole);
  const ring = new THREE.ExtrudeGeometry(shape, {depth: thickness, bevelEnabled: false, curveSegments: 12});
  ring.translate(0, 0, -thickness / 2); ring.rotateX(Math.PI / 2);
  ring.translate(0, 0, totalHeight - outerRadius);
  const stemHeight = totalHeight - outerRadius;
  const stem = new THREE.CylinderGeometry(thickness / 2, thickness / 2, stemHeight, 12);
  stem.rotateX(Math.PI / 2); stem.translate(0, 0, stemHeight / 2);
  const geometry = mergeGeometries([ring, stem.toNonIndexed()]);
  ring.dispose(); stem.dispose(); return geometry;
}

export function binaryStl(geometry) {
  const data = new STLExporter().parse(new THREE.Mesh(geometry), {binary: true});
  return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
}

// Optional inspectable USD of the same shape, not a frozen equipment assembly.
export function visualUsd(name, geometry) {
  const builder = new RobotBuilder({name});
  const visual = new THREE.Mesh(geometry, namedMaterial('finish', '#343537', 0.5, 0.5));
  visual.name = 'visual';
  builder.addLink({name: 'body', visuals: [visual]});
  builder.addFixedJoint({name: 'root_joint', child: 'body'});
  return serializeUsda(builder.toUsda());
}
