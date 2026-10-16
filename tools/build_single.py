#!/usr/bin/env python3
"""Builds dist/city-moon-offline.html: ONE self-contained file (code + all used 3D models + textures).
Needs: bun (bundler) and `npm i three@0.170.0` in this folder. Run: python3 tools/build_single.py"""
import base64,json,os,re,subprocess,sys
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
pub=os.path.join(root,'public'); dist=os.path.join(root,'dist'); os.makedirs(dist,exist_ok=True)
bun=os.environ.get('BUN') or '/root/.bun/bin/bun'
# 1) bundle JS (resolve 'three' and 'three/addons/*' from node_modules)
tmp=os.path.join(dist,'bundle.js')
subprocess.check_call([bun,'build',os.path.join(pub,'src/main.js'),'--outfile',tmp,'--target','browser','--minify'],cwd=root)
js=open(tmp).read().replace('</script','<\\/script')
# 2) used assets only
used=['characters/character-%s.glb'%n for n in ['male-a','male-b','male-c','male-d','male-e','male-f','female-a','female-b','female-c','female-d','female-e','female-f']]
used+=['buildings/building-type-%s.glb'%c for c in 'abcdefghijklmnopqrstu']+['buildings/tree-large.glb','buildings/tree-small.glb']
used+=['roads/road-straight.glb','roads/road-crossroad.glb','roads/light-square.glb','roads/light-curved.glb']
used+=[p+'/Textures/colormap.png' for p in ('characters','buildings','roads')]
emb={}
for u in used:
    mime='image/png' if u.endswith('.png') else 'model/gltf-binary'
    emb[u]='data:%s;base64,%s'%(mime,base64.b64encode(open(os.path.join(pub,'assets',u),'rb').read()).decode())
# 3) assemble html
html=open(os.path.join(pub,'index.html')).read()
html=re.sub(r'<script type="importmap">.*?</script>\n?','',html,flags=re.S)
html=html.replace('<script type="module" src="./src/main.js"></script>',
  '<script>window.__EMBED=%s;</script>\n<script type="module">%s</script>'%(json.dumps(emb),js))
out=os.path.join(dist,'city-moon-offline.html'); open(out,'w').write(html)
os.remove(tmp)
print('wrote',out,round(os.path.getsize(out)/1e6,2),'MB;',len(emb),'embedded files')
