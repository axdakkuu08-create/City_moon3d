// Packs the Kenney models we use into one JS file (base64) so the game works offline from file:// or an Android WebView.
import fs from 'node:fs';
import path from 'node:path';
const A = process.argv[2];            // assets root
const OUT = process.argv[3];
const L = 'abcdefghijklmnopqrstu'.split('');
const want = {
  chars: ['Models/GLB format', [...'abcdef'].flatMap(c => [`character-male-${c}`, `character-female-${c}`])],
  suburban: ['Models/GLB format', [...L.map(c => `building-type-${c}`), 'tree-large','tree-small','fence','fence-low','fence-1x3','planter','path-long','path-short','path-stones-long','driveway-short']],
  roads: ['Models/GLB format', ['road-straight','road-bend','road-crossroad','road-intersection','road-end','road-square','road-crossing','road-bend-sidewalk','road-side','light-square','light-curved','light-square-double','construction-cone','construction-barrier','dumpster','road-sign-street','tile-low','road-roundabout']]
};
const out = { glb: {}, tex: {} };
let total = 0;
for (const [pack, [dir, names]] of Object.entries(want)) {
  const base = path.join(A, pack, dir);
  out.tex[pack] = 'data:image/png;base64,' + fs.readFileSync(path.join(base, 'Textures/colormap.png')).toString('base64');
  for (const n of names) {
    const f = path.join(base, n + '.glb');
    if (!fs.existsSync(f)) { console.warn('missing', f); continue; }
    const b = fs.readFileSync(f); total += b.length;
    out.glb[pack + '/' + n] = b.toString('base64');
  }
}
fs.writeFileSync(OUT, 'window.__ASSETS=' + JSON.stringify(out) + ';');
console.log('packed', Object.keys(out.glb).length, 'models', (total/1e6).toFixed(2), 'MB raw');
