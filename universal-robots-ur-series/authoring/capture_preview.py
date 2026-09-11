"""Render source and exported OBJ with local Chromium; optional before/after capture.

Requires Python playwright + its Chromium. All browser requests stay on localhost.
Run from any directory: python3 capture_preview.py --before-ref 9827aef
"""
import argparse
import functools
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import subprocess
import threading

from playwright.sync_api import sync_playwright

ASSET = Path(__file__).resolve().parents[1]
ROOT = ASSET.parent
MODELS = ['ur8long', 'ur15', 'ur18', 'ur20', 'ur30']


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--before-ref', help='Git revision of the previous model.mjs')
    args = parser.parse_args()
    output = ASSET / 'docs'
    output.mkdir(exist_ok=True)
    before = None
    if args.before_ref:
        before = subprocess.check_output([
            'git', '-C', str(ROOT), 'show',
            f'{args.before_ref}:universal-robots-ur-series/authoring/model.mjs',
        ], text=True)
    server = ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(ROOT)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{server.server_port}/universal-robots-ur-series/'
    report = {'renderer': 'Chromium / SwiftShader', 'profile': 'neutral-studio-v1',
              'before_ref': args.before_ref, 'checks': [], 'errors': [], 'warnings': []}
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
            page = browser.new_page(viewport={'width': 1000, 'height': 1000}, device_scale_factor=1)
            page.on('pageerror', lambda e: report['errors'].append(str(e)))
            page.on('console', lambda e: report['errors' if e.type == 'error' else 'warnings'].append(e.text)
                    if e.type in ('error', 'warning') else None)

            def settle():
                page.evaluate('''async()=>{
                  const a=window.authoredModel;
                  await new Promise(r=>setTimeout(r,250));
                  a.render();await new Promise(r=>requestAnimationFrame(r));a.render();
                }''')
                assert not page.evaluate('window.authoredModel.renderer.getContext().isContextLost()')

            for model in MODELS:
                for pose in ['presentation', 'inspection', 'extended']:
                    page.goto(f'{base}authoring/?model={model}&pose={pose}')
                    page.wait_for_function('window.authoredModel?.ready')
                    page.locator('.panel').evaluate('(e)=>e.style.display="none"')
                    settle()
                    check = page.evaluate('''async()=>{
                      const THREE=await import('three'),a=window.authoredModel;
                      const box=new THREE.Box3().setFromObject(a.object);
                      const values=[...box.min,...box.max];
                      if(!values.every(Number.isFinite))throw Error('Nonfinite world bounds');
                      const camera=a.camera;
                      for(let x of [box.min.x,box.max.x])for(let y of [box.min.y,box.max.y])for(let z of [box.min.z,box.max.z]){
                        const q=new THREE.Vector3(x,y,z).project(camera);
                        if(Math.abs(q.x)>1||Math.abs(q.y)>1)throw Error('Model outside frame');
                      }
                      return {bounds:values,triangles:a.renderer.info.render.triangles,
                        camera:camera.position.toArray(),quaternion:camera.quaternion.toArray()};
                    }''')
                    assert check['triangles'] > 1000
                    report['checks'].append({'model': model, 'pose': pose, 'format': 'source', **check})
                    if pose == 'presentation':
                        page.screenshot(path=str(output / f'{model}-r3.png'))
                    if model == 'ur20' and pose == 'presentation':
                        comparison_camera = check

                # Load the actual committed OBJ/MTL into the same six-joint tree.
                page.goto(f'{base}authoring/?model={model}&pose=presentation')
                page.wait_for_function('window.authoredModel?.ready')
                page.locator('.panel').evaluate('(e)=>e.style.display="none"')
                imported = page.evaluate('''async(type)=>{
                  const THREE=await import('three');
                  const {OBJLoader}=await import('three/addons/loaders/OBJLoader.js');
                  const {MTLLoader}=await import('three/addons/loaders/MTLLoader.js');
                  const {definition}=await import('./model.mjs');
                  const {referenceScene}=await import('@botrail/authoring/reference-model.mjs');
                  const {poses}=await import('./poses.mjs');
                  const {prepareVisuals}=await import('@botrail/authoring/display.mjs');
                  const d=definition(type);
                  for(const link of d.links.filter(l=>l.visual)) {
                    const path=`../meshes/${type}/${link.name}`;
                    const materials=await new MTLLoader().loadAsync(`${path}.mtl`);
                    materials.preload();
                    link.visual=await new OBJLoader().setMaterials(materials).loadAsync(`${path}.obj`);
                  }
                  const model=referenceScene(d);model.pose(poses.presentation);
                  const a=window.authoredModel,old=new THREE.Box3().setFromObject(a.object);
                  const box=new THREE.Box3().setFromObject(model.root);
                  if(old.min.distanceTo(box.min)>1e-6||old.max.distanceTo(box.max)>1e-6)throw Error('OBJ bounds differ');
                  a.scene.remove(a.object);a.object=model.root;prepareVisuals(model.root);a.scene.add(model.root);a.render();
                  return {links:d.links.filter(l=>l.visual).length,bounds:[...box.min,...box.max]};
                }''', model)
                settle()
                report['checks'].append({'model': model, 'pose': 'presentation', 'format': 'OBJ/MTL', **imported})
                if model == 'ur20':
                    page.screenshot(path=str(output / 'ur20-obj-r3.png'))
                print(f'{model}: 3 poses + exported OBJ/MTL passed', flush=True)

            if before:
                page.route('**/model.mjs', lambda route: route.fulfill(body=before, content_type='text/javascript'))
                page.goto(f'{base}authoring/?model=ur20&pose=presentation')
                page.wait_for_function('window.authoredModel?.ready')
                page.locator('.panel').evaluate('(e)=>e.style.display="none"')
                page.evaluate('''c=>{const a=window.authoredModel;a.camera.position.fromArray(c.camera);
                    a.camera.quaternion.fromArray(c.quaternion);a.camera.updateMatrixWorld(true);a.render();}''', comparison_camera)
                settle()
                page.screenshot(path=str(output / 'ur20-before-r3.png'))
                page.unroute('**/model.mjs')

            # A native HTML contact sheet, rendered without changing the screenshots.
            cards = ''.join(f'<figure><img src="{base}docs/{m}-r3.png"><figcaption>{m.upper()}</figcaption></figure>' for m in MODELS)
            page.set_viewport_size({'width': 1500, 'height': 390})
            page.set_content('<style>body{margin:0;background:#e9edf1;font:16px system-ui}main{display:flex}figure{margin:0;width:300px}img{width:300px}figcaption{text-align:center}</style><main>' + cards + '</main>')
            page.locator('img').last.wait_for()
            page.evaluate('Promise.all([...document.images].map(i=>i.decode()))')
            page.screenshot(path=str(output / 'ur-series-r3.png'))
            if before:
                page.set_viewport_size({'width': 1400, 'height': 760})
                page.set_content('<style>body{margin:0;background:#e9edf1;font:20px system-ui}main{display:flex}figure{margin:0;width:700px}img{width:700px}figcaption{text-align:center}</style><main>' +
                                 ''.join(f'<figure><img src="{base}docs/{name}"><figcaption>{title}</figcaption></figure>' for name, title in
                                         [('ur20-before-r3.png','Before'),('ur20-r3.png','After · UR20')]) + '</main>')
                page.evaluate('Promise.all([...document.images].map(i=>i.decode()))')
                page.screenshot(path=str(output / 'ur20-comparison-r3.png'))
            report['warnings'] = sorted(set(report['warnings']))
            assert not report['errors'], report['errors']
            (output / 'visual-validation-r3.json').write_text(json.dumps(report, indent=2)+'\n')
            browser.close()
    finally:
        server.shutdown()


if __name__ == '__main__':
    main()
