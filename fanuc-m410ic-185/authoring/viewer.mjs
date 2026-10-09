/** FANUC-specific controls and pose-envelope framing. The shared viewer API and
 * neutral-studio display profile are unchanged. No hidden geometry is added.
 */
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createDisplayRig,DISPLAY_PROFILE,frameCamera,prepareVisuals} from '@botrail/authoring/display.mjs';
import {framingBounds} from './framing.mjs';
export function mountFanucViewer(model) {
  const renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);
  document.body.prepend(renderer.domElement);
  const scene=new THREE.Scene(),display=createDisplayRig(renderer,scene);
  prepareVisuals(model.root);scene.add(model.root);
  const bounds=framingBounds(model);display.fit(bounds);
  // Some kinematically legal poses enter the floor. Camera framing must not
  // move the physical ground down to those poses; self-collision is not modeled.
  display.floor.position.z=-.005;
  const camera=new THREE.PerspectiveCamera(DISPLAY_PROFILE.fov,innerWidth/innerHeight,.001,100);
  camera.up.set(0,0,1);const controls=new OrbitControls(camera,renderer.domElement);
  const render=()=>{model.root.updateMatrixWorld(true);display.floor.visible=!['side','front','top'].includes(currentView) && new THREE.Box3().setFromObject(model.root).min.z>=-.02;renderer.render(scene,camera);};let currentView='iso';
  function view(name) {
    currentView=name;const directions={iso:[1.5,-2,1],side:[0,-1,.02],front:[1,0,.02],top:[0,-.001,1],bottom:[0,-.001,-1]};
    display.floor.visible=!['side','front','top'].includes(name);
    controls.target.copy(frameCamera(camera,bounds,directions[name]??directions.iso));
    controls.update();render();
  }
  controls.addEventListener('change',render);
  for(const name of ['iso','side','front','top'])document.querySelector(`#${name}`).onclick=()=>view(name);
  addEventListener('resize',()=>{
    renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;view(currentView);
  });
  view('iso');const result={ready:true,scene,renderer,camera,object:model.root,view,render,profile:DISPLAY_PROFILE.id};
  window.authoredModel=result;return result;
}
