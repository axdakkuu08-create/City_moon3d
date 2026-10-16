import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

const A = window.__ASSETS;
const cache = {};
export function b64ToBuf(b64) {
  const bin = atob(b64); const len = bin.length; const u = new Uint8Array(len);
  for (let i = 0; i < len; i++) u[i] = bin.charCodeAt(i);
  return u.buffer;
}
// Every pack's GLBs reference "Textures/colormap.png"; we hand the loader a per-pack base path
// and map the resulting URL to the embedded data URL so nothing is fetched from disk or network.
const manager = new THREE.LoadingManager();
manager.setURLModifier(url => {
  const m = url.match(/(chars|suburban|roads)\/Textures\/colormap\.png$/);
  return m ? A.tex[m[1]] : url;
});
const loader = new GLTFLoader(manager);
function parse(buf, pack) {
  return new Promise((res, rej) => loader.parse(buf, pack + '/', res, rej));
}
// Loads every packed model (decoding in small slices so the loading bar can move).
export async function loadAll(onProgress) {
  const keys = Object.keys(A.glb);
  let i = 0;
  for (const k of keys) {
    const pack = k.split('/')[0];
    const gltf = await parse(b64ToBuf(A.glb[k]), pack);
    gltf.scene.traverse(o => {
      if (o.isMesh) {
        const m = o.material;
        if (m && m.map) { m.map.magFilter = THREE.NearestFilter; m.map.anisotropy = 4; }
        // matte, cheap material look for mobile
        m.metalness = 0; m.roughness = 1;
        o.castShadow = false; o.receiveShadow = false;
      }
    });
    cache[k] = gltf;
    onProgress && onProgress(++i / keys.length);
    if (i % 4 === 0) await new Promise(r => setTimeout(r, 0));
  }
}
export function get(key) {
  const g = cache[key]; if (!g) throw new Error('model not loaded: ' + key);
  return g;
}
// Clone a static model
export function clone(key) { return SkeletonUtils.clone(get(key).scene); }
export function animationsOf(key) { return get(key).animations; }
export { THREE };
