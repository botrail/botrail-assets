// Independently authored product reference; metres, Z-up. See ../README.md.
import * as THREE from "three";
import { namedMaterial, addMesh, roundedBox, cylinderZ } from "@botrail/authoring/geometry.mjs";

export const DIM = Object.freeze({ radius: 0.600, straight: 1.000, fixtureWidth: 0.152,
  bodyHeight: 0.180, radialDepth: 0.070, shuttleDepth: 0.100, shuttleHeight: 0.080 });
const silver = namedMaterial("anodised_aluminium", 0xc6cbce, 0.65, 0.34);
const rail = namedMaterial("ground_steel_rail", 0x7a8389, 0.8, 0.25);
const dark = namedMaterial("graphite_cover", 0x333b40, 0.1, 0.5);
const blue = namedMaterial("status_indicator", 0x377dae, 0.1, 0.35);
const box = (g, n, size, at, mat = silver) => addMesh(g, n, roundedBox(size, Math.min(...size) / 8, 2), mat, at);

// An annular sector, with radial faces and a truly open centre (not a filled disc).
function sector(inner, outer, z0, z1) {
  const s = new THREE.Shape();
  s.moveTo(outer, 0); s.absarc(0, 0, outer, 0, Math.PI / 2, false);
  s.lineTo(0, inner); s.absarc(0, 0, inner, Math.PI / 2, 0, true); s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, {depth: z1 - z0, bevelEnabled: false, curveSegments: 64});
  geo.translate(0, 0, z0); return geo;
}

export function definition(variant = "curve90") {
  const body = new THREE.Group(); body.name = "body";
  const collisions = [], frames = {};
  const R = DIM.radius, H = DIM.bodyHeight, D = DIM.radialDepth;
  if (variant === "curve90") {
    addMesh(body, "stator", sector(R - D, R, 0, H), silver);
    for (const [name, ri, ro, z0, z1, mat] of [
      ["upper_rail", R - 0.018, R + 0.009, H - 0.017, H - 0.005, rail],
      ["lower_rail", R - 0.018, R + 0.009, 0.023, 0.035, rail],
      ["encoder_strip", R + 0.0005, R + 0.002, 0.067, 0.086, dark],
      ["inner_cover", R - D - 0.002, R - D, 0.015, H - 0.015, dark],
    ]) addMesh(body, name, sector(ri, ro, z0, z1), mat);
    for (let i = 0; i < 12; i++) {
      const a = (i + 0.5) * Math.PI / 24;
      const bolt = addMesh(body, `cover_screw_${i}`, cylinderZ(0.003, 0.003), dark,
        [(R - 0.045) * Math.cos(a), (R - 0.045) * Math.sin(a), H + 0.0015]);
      bolt.name = `cover_screw_${i}`;
      // Axis-aligned conservative tiles preserve the hole through the bend.
      const chord = R * Math.PI / 24, r = R - D / 2;
      collisions.push({kind: "box", name: `tile_${i}`,
        size: [D * Math.cos(a) + chord * Math.sin(a), D * Math.sin(a) + chord * Math.cos(a), H],
        at: [r * Math.cos(a), r * Math.sin(a), H / 2]});
    }
    frames.start = [R, 0, H]; frames.end = [0, R, H];
  } else if (variant === "straight1000") {
    // Straight from y=0 to y=1, outside face at x=0; curves join at their R face.
    box(body, "stator", [D, 1, H], [-D / 2, 0.5, H / 2]);
    for (const z of [0.029, H - 0.011]) box(body, `rail_${z}`, [0.027, 1, 0.012], [-0.0045, 0.5, z], rail);
    box(body, "encoder_strip", [0.002, 1, 0.019], [0.001, 0.5, 0.0765], dark);
    box(body, "rear_cover", [0.002, 0.97, H - 0.030], [-D - 0.001, 0.5, H / 2], dark);
    for (let i = 0; i < 8; i++) addMesh(body, `screw_${i}`, cylinderZ(0.003, 0.003), dark, [-0.045, (i + 0.5) / 8, H + 0.0015]);
    collisions.push({kind: "box", name: "stator", size: [D + 0.009, 1, H], at: [(-D + 0.009) / 2, 0.5, H / 2]});
    frames.start = [0, 0, H]; frames.end = [0, 1, H];
  } else if (variant === "shuttle") {
    box(body, "carrier", [0.152, 0.1, 0.024], [0, 0, 0.012]);
    box(body, "magnet_housing", [0.135, 0.030, 0.080], [0, -0.032, -0.028], dark);
    box(body, "status", [0.018, 0.002, 0.008], [0.052, -0.051, 0.012], blue);
    for (const x of [-0.055, 0.055]) for (const y of [-0.025, 0.025])
      addMesh(body, `fastener_${x}_${y}`, cylinderZ(0.003, 0.003), dark, [x, y, 0.0255]);
    collisions.push({kind: "box", name: "carrier", size: [0.152, 0.1, 0.024], at: [0, 0, 0.012]},
      {kind: "box", name: "magnet", size: [0.135, 0.030, 0.080], at: [0, -0.032, -0.028]});
    frames.surface = [0, 0, 0.024];
  } else throw new Error(`Unknown HORIZON10 component: ${variant}`);
  // Avoid punctuation in generated prim names.
  body.traverse(o => { o.name = o.name.replace(/[^A-Za-z0-9_]/g, "_"); });
  return {name: `horizon10_${variant}`, slug: `horizon10-${variant}`, body, frames, collisions};
}
