/** Botrail neutral-studio-v1. Z-up, metres, no network assets or material overrides.
 * Mirrored byte-for-byte to botrail-assets/authoring/display.mjs; verify with
 * eval/check_display.py. Keep model appearance separate from display settings.
 */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export const DISPLAY_PROFILE = Object.freeze({
  id: "neutral-studio-v1", three: "0.185.1", worldUp: "Z",
  background: 0xe9edf1, floor: 0xcbd3dc, exposure: 1.0,
  environmentIntensity: 0.75, environmentBlur: 0.04,
  keyIntensity: 1.75, hemisphereIntensity: 0.5,
  shadowSize: 2048, floorRoughness: 0.95, fov: 35,
});

/** @param {THREE.WebGLRenderer} renderer */
export function configureRenderer(renderer) {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = DISPLAY_PROFILE.exposure;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
}

/** Only change shadow participation, never colour/roughness/normals.
 * @param {THREE.Object3D} object */
export function prepareVisuals(object) {
  object.traverse(child => {
    const mesh = /** @type {THREE.Mesh} */ (child);
    if (mesh.isMesh) { mesh.castShadow = true; mesh.receiveShadow = true; }
  });
}

/** One fixed rig for authoring, catalog and comparisons. Call fit once with
 * reference bounds; do not refit each format and hide a conversion scale error.
 * @param {THREE.WebGLRenderer} renderer
 * @param {THREE.Scene} scene */
export function createDisplayRig(renderer, scene) {
  configureRenderer(renderer);
  const previous = { background: scene.background, environment: scene.environment,
    intensity: scene.environmentIntensity };
  scene.background = new THREE.Color(DISPLAY_PROFILE.background);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  room.rotation.x = Math.PI / 2;
  const environment = pmrem.fromScene(room, DISPLAY_PROFILE.environmentBlur);
  room.dispose(); pmrem.dispose();
  scene.environment = environment.texture;
  scene.environmentIntensity = DISPLAY_PROFILE.environmentIntensity;
  const lights = new THREE.Group();
  const key = new THREE.DirectionalLight(0xffffff, DISPLAY_PROFILE.keyIntensity);
  key.castShadow = true;
  key.shadow.mapSize.setScalar(DISPLAY_PROFILE.shadowSize);
  const hemisphere = new THREE.HemisphereLight(0xffffff, 0x697c8b,
    DISPLAY_PROFILE.hemisphereIntensity);
  hemisphere.position.set(0, 0, 1);
  lights.add(key, key.target, hemisphere); scene.add(lights);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(1, 1),
    new THREE.MeshStandardMaterial({ color: DISPLAY_PROFILE.floor,
      roughness: DISPLAY_PROFILE.floorRoughness, metalness: 0 }));
  floor.name = "__display_floor"; floor.receiveShadow = true; scene.add(floor);
  return {
    floor, key,
    /** @param {THREE.Box3} bounds */
    fit(bounds) {
      if (bounds.isEmpty()) throw new Error("Cannot light an empty model");
      const center = bounds.getCenter(new THREE.Vector3());
      const span = Math.max(...bounds.getSize(new THREE.Vector3()).toArray(), 0.001);
      floor.scale.setScalar(span * 4);
      floor.position.set(center.x, center.y, bounds.min.z - span * 0.002);
      key.target.position.copy(center);
      key.position.copy(center).add(new THREE.Vector3(2, -3, 5).multiplyScalar(span));
      key.shadow.normalBias = span * 0.0005;
      Object.assign(key.shadow.camera, { left: -span * 1.6, right: span * 1.6,
        top: span * 1.6, bottom: -span * 1.6, near: span * 0.01, far: span * 12 });
      key.shadow.camera.updateProjectionMatrix();
      key.shadow.needsUpdate = true;
    },
    dispose() {
      scene.remove(lights, floor);
      key.shadow.dispose(); floor.geometry.dispose(); floor.material.dispose();
      environment.dispose(); scene.background = previous.background;
      scene.environment = previous.environment; scene.environmentIntensity = previous.intensity;
    },
  };
}

/** @param {THREE.PerspectiveCamera} camera
 * @param {THREE.Box3} bounds
 * @param {number[]} direction */
export function frameCamera(camera, bounds, direction = [1, -1.5, 0.8]) {
  const center = bounds.getCenter(new THREE.Vector3());
  const radius = Math.max(bounds.getSize(new THREE.Vector3()).length() / 2, 0.001);
  const halfFov = Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) *
    Math.min(camera.aspect, 1));
  camera.up.set(0, 0, 1);
  camera.position.copy(center).add(new THREE.Vector3(...direction).normalize()
    .multiplyScalar(radius / Math.sin(halfFov) * 1.1));
  camera.near = radius / 100; camera.far = radius * 100;
  camera.lookAt(center); camera.updateProjectionMatrix();
  return center;
}

/** Dispose shared geometries, materials AND textures once.
 * @param {THREE.Object3D} object */
export function disposeVisuals(object) {
  const geometries = new Set(), materials = new Set(), textures = new Set();
  object.traverse(child => {
    const mesh = /** @type {THREE.Mesh} */ (child);
    if (!mesh.isMesh && !/** @type {THREE.Line} */ (child).isLine) return;
    if (mesh.geometry) geometries.add(mesh.geometry);
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      if (!material) continue;
      materials.add(material);
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
    }
  });
  for (const item of [...textures, ...materials, ...geometries]) item.dispose();
}
