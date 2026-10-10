import test from 'node:test';
import assert from 'node:assert/strict';
import {THREE} from '../../authoring/tool-shapes.mjs';
import {referenceScene} from '../../authoring/reference-model.mjs';
import {definition,dimensions as d,motion} from './model.mjs';

// Datasheet v1.8: bare-finger lengths are drawn from the top of the robot-side Quick Changer,
// 2.5 mm above `mount` (16.1 mm overall vs the 13.6 mm tool interface). Strict URDF hashes,
// the continuous stroke and 1001-pose pivot checks: node --test authoring/test/onrobot-contract.test.mjs
const datum=2.5,sheet={open:174,closed:213,housing:132,stroke:110,neck:54,head:65,depth:36,bracket:75},boot=[11.4,20.2,29.8];
const p='rg2_v2_gripper',near=(a,b,tol,why)=>assert.ok(Math.abs(a-b)<=tol,`${why}: ${a} vs ${b}`);
const meshBox=(group,name)=>{let found;group.traverse(o=>{if(o.isMesh&&o.name===name)found=o;});return new THREE.Box3().setFromObject(found);};

test('RG2 measured sizes agree with the datasheet drawing',()=>{
 const top=Math.max(...d.carrier.outline.map(q=>q[1])),len=motion.len;
 near(2*d.housing.nw,sheet.neck,0,'neck width');near(2*d.housing.hw,sheet.head,.6,'head width');
 near(2*d.housing.depth,sheet.depth,0,'depth');near(2*d.cheek.wallOuter,sheet.bracket,.5,'bracket width');
 near(d.housing.zt,datum+sheet.housing,.5,'housing far end');
 near(motion.tipAt(0)[1]+top,datum+sheet.open,1,'open bare-tip length');
 near(d.truss[1]+Math.sqrt(len**2-(d.truss[0]-d.bareInner)**2)+top,datum+sheet.closed,1,'closed bare-tip length');
 assert.deepEqual([d.pad.depth,d.pad.width,d.pad.length],boot);
});

test('RG2 pads stay parallel, meet at the upper limit and travel 101.1 mm; bare fingers open 110 mm',()=>{
 const def=definition(),s=referenceScene(def),gaps=[];
 assert.equal(def.joints.filter(j=>j.type!=='fixed'&&!j.mimic).length,1);
 for(let n=0;n<=100;n++){
  s.pose({[`${p}_joint`]:n*motion.upper/100});
  const a=new THREE.Box3().setFromObject(s.links.get(`${p}_finger_1_flex_finger`));
  const b=new THREE.Box3().setFromObject(s.links.get(`${p}_finger_2_flex_finger`));
  const gap=b.min.x-a.max.x;gaps.push(gap);
  assert.ok(gap>=-1e-8,`Pad overlap at step ${n}`);
  const size=a.getSize(new THREE.Vector3()).toArray();
  for(let k=0;k<3;k++)near(size[k],boot[k]/1000,1e-8,`boot axis ${k}`);
  if(n>0)assert.ok(gap<gaps[n-1]);
 }
 near(gaps[0],motion.padTravel/1000,1e-6,'open pad gap');near(motion.padTravel,sheet.stroke-8.9,1e-9,'pads stand 4.45 mm proud');
 near(gaps.at(-1),0,1e-8,'closed pad gap');
 s.pose({[`${p}_joint`]:0});
 const f1=meshBox(s.links.get(`${p}_finger_1_finger_tip`),'finger_carrier'),f2=meshBox(s.links.get(`${p}_finger_2_finger_tip`),'finger_carrier');
 near(f2.min.x-f1.max.x,sheet.stroke/1000,1e-6,'bare-finger stroke');
 near(new THREE.Box3().setFromObject(s.root).min.z,0,1e-8,'mounting face at mount z=0');
 s.pose({[`${p}_joint`]:motion.upper});
 near(new THREE.Box3().setFromObject(s.root).max.z,motion.padTop/1000,1e-6,'closed pad tip');
 near(s.links.get('tcp').getWorldPosition(new THREE.Vector3()).z,motion.tcp/1000,1e-12,'TCP');
 near(motion.tcp,205.07,.01,'TCP from mount');near(motion.padTop,219.97,.01,'closed pad tip from mount');
 assert.ok(def.links.every(l=>(l.collisions??[]).every(c=>c.kind==='box'||c.kind==='cylinder')));
});
