import subprocess,json,concurrent.futures,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1];out=Path(sys.argv[1]) if len(sys.argv)>1 else root/'docs/renders';out.mkdir(parents=True,exist_ok=True)
poses=json.loads((root/'docs/poses.json').read_text());middle=dict(poses['travel'],lift=.28)
jobs=[('zero','iso',{}),('wrist-min','gripper',dict(middle,right_wrist_pitch=-.65)),('wrist-max','gripper',dict(middle,right_wrist_pitch=.65)),('iso','iso',middle),('front','front',middle),('side','side',middle),('rear','rear',middle),('low','iso',poses['travel']),('raised','iso',poses['raised']),('reach','iso',poses['reach']),('head','controls',poses['head_turn']),('gripper-open','gripper',dict(middle,left_gripper_open=1.029696,right_gripper_open=1.029696)),('gripper-closed','gripper',dict(middle,left_gripper_open=0,right_gripper_open=0))]
def run(job):
 name,view,pose=job
 args=['blender','-b','-t','4','--python',str(root/'authoring/render_review.py'),'--',str(root/'urdf/agibot-g1-omnipicker.urdf'),str(out/f'{name}.png'),'--materials',str(root/'docs/materials.json'),'--pose',json.dumps(pose),'--view',view,'--resolution','1100','--samples','40']
 with open(out/f'render-{name}.log','w') as log:subprocess.run(args,stdout=log,stderr=subprocess.STDOUT,check=True)
 print(name,flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:list(pool.map(run,jobs))
