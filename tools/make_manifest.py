import os,json,sys
root=sys.argv[1]
m={}
for d in sorted(os.listdir(root)):
    p=os.path.join(root,d)
    if os.path.isdir(p): m[d]=sorted(f for f in os.listdir(p) if f.endswith('.glb'))
json.dump(m,open(os.path.join(root,'manifest.json'),'w'),indent=1)
print({k:len(v) for k,v in m.items()})
