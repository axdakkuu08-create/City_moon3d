import * as THREE from 'three';
import { spawn, preload } from './loader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { TINTS } from './themes.js';

export const SC = 6;            // world units per road tile
export const BLOCK = 4;         // a road line every 4 tiles
const ROADS = 5;
const N = (ROADS - 1) * BLOCK;  // tiles 0..N
const tile = i => (i - N / 2) * SC;
export const BOUNDS = N / 2 * SC + 2;

function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }
export const colliders = [];    // {x,z,r,h}  h=0 means low prop (camera ignores)
export const roadSpots = [];    // positions on roads for memory fragments

// Story locations: marker = where the player stands to trigger, npc = where NPCs gather
export const LOCATIONS = {
  home:    { name: "Ren's Home",        marker: [tile(8) , tile(11)], lot: [9, 11], face: [-1, 0] },
  library: { name: 'Library of Unwritten Names', marker: [tile(4), tile(6)], lot: [3, 6], face: [1, 0] },
  station: { name: 'Platform Zero',     marker: [tile(12), tile(14)], lot: [13, 14], face: [-1, 0] },
  tower:   { name: 'The Clock Tower',   marker: [0, 6.5], lot: null, face: [0, -1] }
};

function labelSprite(text, color = '#e8c98a') {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128;
  const g = c.getContext('2d'); g.font = 'bold 54px Georgia,serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 10; g.strokeStyle = 'rgba(8,10,25,.85)'; g.strokeText(text, 256, 64); g.fillStyle = color; g.fillText(text, 256, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, fog: false }));
  s.scale.set(6, 1.5, 1); return s;
}

function clockTower() {
  const g = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0x9a90b4, roughness: .85, emissive: 0x2a2440, emissiveIntensity: .6 });
  const trim = new THREE.MeshStandardMaterial({ color: 0x6a5f86, roughness: .8, emissive: 0x1d1830, emissiveIntensity: .6 });
  const box = (w, h, d, y, m = stone) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.y = y; b.castShadow = b.receiveShadow = true; g.add(b); return b; };
  box(5, 1.4, 5, .7, trim); box(3.6, 14, 3.6, 8.4); box(4.4, .7, 4.4, 15.6, trim); box(4, 4.4, 4, 18.2);
  box(4.6, .6, 4.6, 20.7, trim);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(3.4, 5, 4), new THREE.MeshStandardMaterial({ color: 0x6b2848, roughness: .7 }));
  roof.position.y = 23.5; roof.rotation.y = Math.PI / 4; roof.castShadow = true; g.add(roof);
  // clock face with no hands
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#e8d9b8'; x.beginPath(); x.arc(128, 128, 120, 0, 7); x.fill();
  x.strokeStyle = '#3b2c3e'; x.lineWidth = 8; x.stroke(); x.fillStyle = '#3b2c3e';
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; x.fillRect(128 + Math.sin(a) * 96 - 5, 128 - Math.cos(a) * 96 - 5, 10, 10); }
  x.fillStyle = '#c4466e'; x.beginPath(); x.arc(128, 128, 9, 0, 7); x.fill();
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const fm = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: .55 });
  for (let i = 0; i < 4; i++) {
    const f = new THREE.Mesh(new THREE.CircleGeometry(1.6, 32), fm);
    f.position.set(Math.sin(i * Math.PI / 2) * 2.02, 18.2, Math.cos(i * Math.PI / 2) * 2.02); f.rotation.y = i * Math.PI / 2; g.add(f);
  }
  const l = new THREE.PointLight(0xff5c8a, 60, 40); l.position.y = 12; g.add(l); g.userData.light = l;
  return g;
}

function trainSet() {
  const g = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ color: 0x3a4f78, roughness: .6 });
  const win = new THREE.MeshStandardMaterial({ color: 0xbfe3ff, emissive: 0x8fc8ff, emissiveIntensity: .9 });
  for (let k = 0; k < 3; k++) {
    const car = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.8, 7), body); car.position.set(0, 1.9, k * 7.4); car.castShadow = true; g.add(car);
    for (let w = 0; w < 4; w++) for (const sx of [-1.41, 1.41]) {
      const wm = new THREE.Mesh(new THREE.PlaneGeometry(1.1, .9), win); wm.position.set(sx, 2.3, k * 7.4 - 2.4 + w * 1.6); wm.rotation.y = sx > 0 ? Math.PI / 2 : -Math.PI / 2; g.add(wm);
    }
  }
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(5, .25, 22), new THREE.MeshStandardMaterial({ color: 0x2c3350 }));
  canopy.position.set(-4.5, 4.4, 7.4); g.add(canopy);
  for (const z of [-3, 7.4, 17.8]) { const p = new THREE.Mesh(new THREE.BoxGeometry(.3, 4.4, .3), canopy.material); p.position.set(-6.6, 2.2, z); g.add(p); }
  return g;
}

export async function buildWorld(scene, onProgress, hooks) {
  const rand = rng(7);
  const bt = 'abcdefghijklmnopqrstu'.split('').map(c => `buildings/building-type-${c}.glb`);
  await preload(['roads/road-straight.glb', 'roads/road-crossroad.glb', 'roads/light-square.glb', 'roads/light-curved.glb',
    'buildings/tree-large.glb', 'buildings/tree-small.glb', ...bt], onProgress);

  const staticGroup = new THREE.Group(); scene.add(staticGroup);
  const add = async (f, x, z, ry = 0, s = 1) => { const o = await spawn(f); o.position.set(x, 0, z); o.rotation.y = ry; o.scale.setScalar(s * SC); staticGroup.add(o); return o; };
  const jobs = [];
  const special = {}; for (const [k, L] of Object.entries(LOCATIONS)) if (L.lot) special[L.lot.join(',')] = k;
  const towerAt = (i, j) => i === 8 && j === 8;

  for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) {
    const x = tile(i), z = tile(j), ri = i % BLOCK === 0, rj = j % BLOCK === 0;
    if (ri && rj) jobs.push(add('roads/road-crossroad.glb', x, z));
    else if (ri) { jobs.push(add('roads/road-straight.glb', x, z, Math.PI / 2)); if (rand() < .35) roadSpots.push([x + (rand() - .5) * 2, z]); }
    else if (rj) { jobs.push(add('roads/road-straight.glb', x, z, 0)); if (rand() < .35) roadSpots.push([x, z + (rand() - .5) * 2]); }
    else {
      const u = i % BLOCK, v = j % BLOCK, r = rand();
      let ry = 0; if (u === 1) ry = -Math.PI / 2; else if (u === 3) ry = Math.PI / 2; else if (v === 1) ry = Math.PI;
      if (u === 2 && v === 2) { const big = r < .5; jobs.push(add(big ? 'buildings/tree-large.glb' : 'buildings/tree-small.glb', x, z, rand() * 6, 1.2)); colliders.push({ x, z, r: .6, h: 0 }); continue; }
      const sp = special[i + ',' + j];
      if (!sp && r < .1) { jobs.push(add('buildings/tree-small.glb', x, z, rand() * 6)); colliders.push({ x, z, r: .5, h: 0 }); continue; }
      jobs.push(add(sp === 'library' ? bt[18] : sp === 'station' ? bt[7] : bt[Math.floor(rand() * bt.length)], x, z, ry, .8).then(o => { o.userData.tint = new THREE.Color(sp ? 0xffffff : TINTS[Math.floor(rand() * TINTS.length)]); return o; }));
      colliders.push({ x, z, r: SC * .42, h: 1 });
    }
  }
  // street lights next to every intersection
  const lights = [];
  for (let a = 0; a < ROADS; a++) for (let b = 0; b < ROADS; b++) jobs.push(add('roads/light-square.glb', tile(a * BLOCK) + SC * .4, tile(b * BLOCK) + SC * .4, 0, 1));
  await Promise.all(jobs);
  mergeStatic(staticGroup, scene, hooks);

  // lamp glow: one additive Points draw call, placed at each lamp head (model arm extends -z by ~0.21 tile)
  {
    const gp = [], mk = (x, y, z) => gp.push(x, y, z);
    for (let a = 0; a < ROADS; a++) for (let b = 0; b < ROADS; b++) mk(tile(a * BLOCK) + SC * .4, 3.45, tile(b * BLOCK) + SC * .4 - SC * .21);
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: new THREE.CanvasTexture(c), size: 6, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffd7a0 }));
    pts.frustumCulled = false; scene.add(pts); if (hooks) hooks.glow.push(pts);
  }
  // clock tower on the central plaza
  const tower = clockTower(); tower.position.set(0, 0, 0); scene.add(tower);
  colliders.push({ x: 0, z: 0, r: 2.9, h: 1 });
  // station train + canopy
  const [sx, sz] = LOCATIONS.station.marker; const train = trainSet(); train.position.set(sx + 8.5, 0, sz - 8); scene.add(train);
  colliders.push({ x: sx + 8.5, z: sz - 5, r: 2.2, h: 1 }, { x: sx + 8.5, z: sz + 2.4, r: 2.2, h: 1 });
  // warm lamps near landmarks
  for (const k of Object.keys(LOCATIONS)) {
    const [mx, mz] = LOCATIONS[k].marker; const L = new THREE.PointLight(0xffd7a0, 22, 20); L.position.set(mx, 4.5, mz); scene.add(L); lights.push(L);
    if (k !== 'tower') { const s = labelSprite(LOCATIONS[k].name.toUpperCase().replace('LIBRARY OF UNWRITTEN NAMES', 'LIBRARY')); s.position.set(mx + LOCATIONS[k].face[0] * -3.2, 9, mz); scene.add(s); }
  }
  const ts = labelSprite('CLOCK TOWER'); ts.position.set(0, 27.5, 0); ts.scale.set(10, 2.5, 1); scene.add(ts);
  return { tower, lights };
}

// Merge static meshes that share a material AND sit in the same block-sized chunk: few draw calls, but frustum culling still works.
const WHITE = new THREE.Color(1, 1, 1);
function mergeStatic(group, scene, hooks) {
  group.updateMatrixWorld(true);
  const byMat = new Map();
  group.traverse(o => {
    if (!o.isMesh) return;
    const g = o.geometry.clone(); g.applyMatrix4(o.matrixWorld);
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(k)) g.deleteAttribute(k);
    if (!g.index) g.setIndex([...Array(g.attributes.position.count).keys()]);
    let a = o; while (a && !a.userData.tint) a = a.parent; const tc = a ? a.userData.tint : WHITE, n = g.attributes.position.count, ca = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { ca[i * 3] = tc.r; ca[i * 3 + 1] = tc.g; ca[i * 3 + 2] = tc.b; }
    g.setAttribute('color', new THREE.BufferAttribute(ca, 3));
    const wp = new THREE.Vector3().setFromMatrixPosition(o.matrixWorld);
    const key = o.material.uuid + '|' + Math.floor((wp.x + 60) / (BLOCK * SC * 2)) + '|' + Math.floor((wp.z + 60) / (BLOCK * SC * 2)); if (!byMat.has(key)) byMat.set(key, { mat: o.material, geos: [] });
    byMat.get(key).geos.push(g);
  });
  let merged = 0;
  for (const { mat, geos } of byMat.values()) {
    mat.vertexColors = true; mat.needsUpdate = true; if (hooks) { if (!hooks.buildingMat.includes(mat)) hooks.buildingMat.push(mat); patchWindows(mat, hooks.winUniform); }
    const m = new THREE.Mesh(mergeGeometries(geos, false), mat); m.castShadow = m.receiveShadow = true; m.matrixAutoUpdate = false; scene.add(m); merged += geos.length;
  }
  scene.remove(group);
  console.log(`merged ${merged} meshes into ${byMat.size}`);
}

// Windows in the Kenney palette are a light-blue swatch: make exactly that colour glow warm (strength = theme.win).
function patchWindows(mat, uni) {
  if (mat.userData.winPatched) return; mat.userData.winPatched = true;
  mat.onBeforeCompile = sh => {
    sh.uniforms.uWin = uni;
    sh.fragmentShader = 'uniform float uWin;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
       #ifdef USE_MAP
       { float wm = 1.0 - smoothstep(0.05, 0.12, distance(sampledDiffuseColor.rgb, vec3(0.136, 0.296, 0.694)));
         totalEmissiveRadiance += vec3(1.0, 0.72, 0.36) * wm * uWin * 1.6; }
       #endif`);
  };
  mat.customProgramCacheKey = () => 'win';
}
