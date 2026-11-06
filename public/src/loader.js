import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';

// Asset loader: one GLTFLoader per asset pack (each pack has its own colormap.png).
// Normal mode: loads ./assets/<pack>/<file>.glb. Offline single-file mode: window.__EMBED holds data: URLs.
export const ASSET_BASE = './assets/';
const loaders = {}, cache = new Map();

function loaderFor(pack) {
  if (!loaders[pack]) {
    const m = new THREE.LoadingManager();
    m.setURLModifier(url => {
      const E = window.__EMBED;
      return E && url.includes('colormap.png') ? E[pack + '/Textures/colormap.png'] : url;
    });
    loaders[pack] = new GLTFLoader(m);
  }
  return loaders[pack];
}
export function loadGLB(path) {
  if (!cache.has(path)) {
    const E = window.__EMBED, pack = path.split('/')[0];
    cache.set(path, new Promise((res, rej) => loaderFor(pack).load(E ? E[path] : ASSET_BASE + path, g => {
      g.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      res(g);
    }, undefined, rej)));
  }
  return cache.get(path);
}
export async function spawn(path) { return cloneSkinned((await loadGLB(path)).scene); }
export async function spawnAnimated(path) { const g = await loadGLB(path); return { object: cloneSkinned(g.scene), clips: g.animations }; }
export async function preload(paths, onProgress) {
  let done = 0;
  await Promise.all(paths.map(p => loadGLB(p).then(() => onProgress && onProgress(++done / paths.length))));
}
