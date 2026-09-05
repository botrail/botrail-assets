/** Browser-only authoring shell; the model keeps its own dimensions and finish. */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createDisplayRig, DISPLAY_PROFILE, frameCamera, prepareVisuals } from "./display.mjs";

export function mountAuthoring(object, { onJoint, iso = [1, -1.5, 0.8] } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  document.body.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  const display = createDisplayRig(renderer, scene);
  prepareVisuals(object); scene.add(object); object.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(object);
  display.fit(bounds);
  const camera = new THREE.PerspectiveCamera(DISPLAY_PROFILE.fov,
    innerWidth / innerHeight, 0.001, 100);
  camera.up.set(0, 0, 1);
  const controls = new OrbitControls(camera, renderer.domElement);
  const render = () => renderer.render(scene, camera);
  function view(name) {
    const directions = { iso, side: [0, -1, 0.02], front: [1, 0, 0.02],
      top: [0, -0.001, 1], bottom: [0, -0.001, -1] };
    display.floor.visible = name !== "bottom";
    controls.target.copy(frameCamera(camera, bounds, directions[name] ?? iso));
    controls.update(); render();
  }
  controls.addEventListener("change", render);
  for (const button of document.querySelectorAll("button")) {
    const name = button.dataset.view ?? button.id;
    if (["iso", "side", "front", "top", "bottom"].includes(name))
      button.onclick = () => view(name);
  }
  const input = document.querySelector("#joint");
  if (input && onJoint) input.addEventListener("input", () => {
    const value = Number(input.value); onJoint(value);
    const output = document.querySelector("#angle");
    if (output) output.value = `${value.toFixed(3)} rad`;
    render();
  });
  addEventListener("resize", () => {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); render();
  });
  view("iso");
  const result = { ready: true, scene, renderer, camera, object, view, render,
    profile: DISPLAY_PROFILE.id };
  window.authoredModel = result;
  return result;
}
