import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { clone, get } from './assets.js';

export const K = 7;              // metres per kit tile
export const GRID = 17;          // cells per side
export const HALF = (GRID - 1) / 2;
export const cellPos = (gx, gz) => new THREE.Vector3((gx - HALF) * K, 0, (gz - HALF) * K);
export const isRoad = (i, j) => i < 0 || j < 0 || i >= GRID || j >= GRID ? false : (i % 4 === 0 || j % 4 === 0);

// Story zones in grid coordinates (cell units; integers are cell centres)
export const ZONES = {
  home:    { g: [2, 12.2], r: 3.2 },
  street:  { g: [4, 10.6], r: 3.2 },
  library: { g: [6, 4.0],  r: 4.0 },
  station: { g: [14, 6.31], r: 4.5 },
  tower:   { g: [10, 8.9], r: 4.2 }
};
for (const z of Object.values(ZONES)) z.pos = cellPos(z.g[0], z.g[1]);

// seeded RNG so the city is identical every run
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

// rotation helpers: three.js rotation.y = th maps (x,z) -> (x cos + z sin, -x sin + z cos)
const SIDES = { E: [1, 0], W: [-1, 0], S: [0, 1], N: [0, -1] };
const rotSide = (name, q) => { let [x, z] = SIDES[name]; for (let k = 0; k < q; k++) { const nx = z, nz = -x; x = nx; z = nz; } return x === 1 ? 'E' : x === -1 ? 'W' : z === 1 ? 'S' : 'N'; };
const BASE = { // sides each road tile connects at rotation 0 (measured from the models)
  'road-straight': ['E', 'W'], 'road-bend': ['W', 'S'], 'road-intersection': ['E', 'W', 'S'], 'road-end': ['E'], 'road-crossroad': ['E', 'W', 'N', 'S']
};
function pickRoad(conn) {
  const want = [...conn].sort().join('');
  for (const [name, base] of Object.entries(BASE)) {
    if (base.length !== conn.length) continue;
    for (let q = 0; q < 4; q++) if ([...base.map(s => rotSide(s, q))].sort().join('') === want) return { name, rot: q * Math.PI / 2 };
  }
  return { name: 'road-straight', rot: 0 };
}

export function buildWorld(scene) {
  const R = rng(1337);
  const colliders = [];       // {x,z,hx,hz,h} AABBs  /  {x,z,r,h} circles
  const statics = {};         // pack -> [geometry] for merging
  const lamps = [];           // {pos, broken}
  const sprites = [];
  const root = new THREE.Group(); scene.add(root);

  // collect all meshes of a cloned model with its world matrix applied at (pos, rotY, scale)
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s3 = new THREE.Vector3(), p3 = new THREE.Vector3();
  const matsByPack = {};
  function addStatic(key, pos, rotY = 0, scale = K) {
    const obj = get(key).scene;
    const pack = key.split('/')[0];
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY); s3.setScalar(scale); p3.copy(pos);
    const place = new THREE.Matrix4().compose(p3, q, s3);
    obj.updateMatrixWorld(true);
    obj.traverse(o => {
      if (!o.isMesh) return;
      let g = o.geometry.clone();
      const keep = ['position', 'normal', 'uv']; for (const a of Object.keys(g.attributes)) if (!keep.includes(a)) g.deleteAttribute(a);
      if (g.index) g = g.toNonIndexed();
      g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(place, o.matrixWorld));
      matsByPack[pack] ||= o.material.map;
      (statics[pack] ||= []).push(g);
    });
  }
  const sizeCache = {};
  function sizeOf(key) { if (!sizeCache[key]) { const b = new THREE.Box3().setFromObject(get(key).scene); sizeCache[key] = b.getSize(new THREE.Vector3()); } return sizeCache[key]; }

  // ---------- ground ----------
  const groundMat = new THREE.MeshLambertMaterial({ color: 0x25443f });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), groundMat);
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; ground.receiveShadow = true; root.add(ground);

  // ---------- roads ----------
  for (let i = 0; i < GRID; i++) for (let j = 0; j < GRID; j++) {
    if (!isRoad(i, j)) continue;
    const conn = [];
    if (isRoad(i + 1, j)) conn.push('E'); if (isRoad(i - 1, j)) conn.push('W'); if (isRoad(i, j + 1)) conn.push('S'); if (isRoad(i, j - 1)) conn.push('N');
    const { name, rot } = pickRoad(conn);
    addStatic('roads/' + name, cellPos(i, j), rot, K);
  }

  // ---------- reserved block cells ----------
  const reserved = new Set(); const rk = (i, j) => i + ',' + j;
  const reserveBlock = (bi, bj) => { for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) reserved.add(rk(1 + 4 * bi + a, 1 + 4 * bj + b)); };
  reserveBlock(2, 2);  // tower
  reserveBlock(3, 1);  // station
  reserved.add(rk(6, 3)); reserved.add(rk(5, 3)); reserved.add(rk(7, 3)); // library frontage
  reserved.add(rk(2, 13));   // Ren's house cell

  // ---------- buildings & trees ----------
  const types = 'abcdefghijklmnopqrstu'.split('');
  const B = K * 0.72;
  const facing = []; // for door glows
  function placeBuilding(i, j, side, typeKey, scale = B) {
    const rotMap = { S: 0, E: Math.PI / 2, N: Math.PI, W: -Math.PI / 2 };
    const rot = rotMap[side];
    const c = cellPos(i, j);
    // nudge toward the road a little
    const [dx, dz] = SIDES[side]; c.x += dx * K * 0.12; c.z += dz * K * 0.12;
    const key = 'suburban/' + typeKey;
    addStatic(key, c, rot, scale);
    const sz = sizeOf(key);
    let hx = sz.x * scale / 2, hz = sz.z * scale / 2; if (Math.abs(Math.sin(rot)) > 0.5) [hx, hz] = [hz, hx];
    colliders.push({ x: c.x, z: c.z, hx: hx * 0.92, hz: hz * 0.92, h: sz.y * scale });
    facing.push({ pos: c.clone().add(new THREE.Vector3(dx * hz * 0.95 * (dx ? 0 : 0), 0, 0)), side, c });
    return c;
  }
  function placeTree(x, z, big = true) {
    const key = 'suburban/' + (big ? 'tree-large' : 'tree-small');
    const sc = K * (big ? 1.5 : 1.3) * (0.8 + R() * 0.5);
    addStatic(key, new THREE.Vector3(x, 0, z), R() * 6.28, sc);
    colliders.push({ x, z, r: 0.55, h: 99 });
  }
  const houseCells = [];
  for (let i = 1; i < GRID - 1; i++) for (let j = 1; j < GRID - 1; j++) {
    if (isRoad(i, j) || reserved.has(rk(i, j))) continue;
    // which neighbours are road
    const sides = []; if (isRoad(i, j + 1)) sides.push('S'); if (isRoad(i, j - 1)) sides.push('N'); if (isRoad(i + 1, j)) sides.push('E'); if (isRoad(i - 1, j)) sides.push('W');
    if (sides.length) {
      const side = sides[Math.floor(R() * sides.length)];
      const t = types[Math.floor(R() * types.length)];
      const c = placeBuilding(i, j, side, 'building-type-' + t);
      houseCells.push({ c, side, i, j });
    } else {
      // inner garden cell: a few trees
      const c = cellPos(i, j); const n = 2 + Math.floor(R() * 3);
      for (let k = 0; k < n; k++) placeTree(c.x + (R() - 0.5) * K * 0.8, c.z + (R() - 0.5) * K * 0.8, R() > 0.35);
    }
  }
  // Ren's house (special: nicer type facing north toward the street at row 12)
  {
    const c = placeBuilding(2, 13, 'N', 'building-type-c', B * 1.05);
    houseCells.push({ c, side: 'N', i: 2, j: 13, home: true });
  }
  // trees on the verges of the outer ring
  for (let k = 0; k < 40; k++) {
    const side = Math.floor(R() * 4), t = (R() - 0.5) * (GRID - 1) * K, e = HALF * K + K * (0.9 + R() * 3);
    const x = side === 0 ? t : side === 1 ? t : side === 2 ? -e : e, z = side === 0 ? -e : side === 1 ? e : t;
    placeTree(x, z, true);
  }

  // ---------- lamps ----------
  const lampKey = 'roads/light-square';
  const LS = K * 0.95, up = new THREE.Vector3(0, 1, 0);
  const bulbLocal = new THREE.Vector3(0, 0.575, -0.2);
  function placeLamp(x, z, rot, broken = false) {
    addStatic(lampKey, new THREE.Vector3(x, 0, z), rot, LS);
    const bulb = bulbLocal.clone().multiplyScalar(LS).applyAxisAngle(up, rot).add(new THREE.Vector3(x, 0, z));
    lamps.push({ pos: bulb, broken });
    colliders.push({ x, z, r: 0.25, h: 99 });
  }
  for (let i = 0; i < GRID; i++) for (let j = 0; j < GRID; j++) {
    if (!isRoad(i, j)) continue;
    const c = cellPos(i, j); const e = K * 0.44;
    const ew = isRoad(i - 1, j) && isRoad(i + 1, j) && !(isRoad(i, j - 1) && isRoad(i, j + 1));
    const ns = isRoad(i, j - 1) && isRoad(i, j + 1) && !(isRoad(i - 1, j) && isRoad(i + 1, j));
    if (ew && (i + j) % 2 === 0) { const south = (i % 4 === 2); placeLamp(c.x, c.z + (south ? e : -e), south ? 0 : Math.PI); }
    if (ns && (i + j) % 2 === 0) { const east = (j % 4 === 2); placeLamp(c.x + (east ? e : -e), c.z, east ? Math.PI / 2 : -Math.PI / 2); }
  }
  // the broken streetlamp beside the lost child
  {
    const zp = ZONES.street.pos; const c = cellPos(4, 11); 
    placeLamp(c.x + K * 0.44, c.z + 2, Math.PI / 2, true);
  }

  // street clutter
  for (const [i, j, key] of [[4, 6, 'dumpster'], [8, 2, 'construction-barrier'], [12, 10, 'construction-cone'], [12, 11, 'construction-cone'], [2, 8, 'road-sign-street'], [6, 12, 'dumpster']]) {
    const c = cellPos(i, j); addStatic('roads/' + key, new THREE.Vector3(c.x + K * 0.3, 0, c.z + K * 0.3), R() * 6, K * 0.9);
    colliders.push({ x: c.x + K * 0.3, z: c.z + K * 0.3, r: 0.8, h: 3 });
  }

  // ---------- merge statics into one mesh per texture pack ----------
  for (const [pack, geoms] of Object.entries(statics)) {
    const mesh = new THREE.Mesh(mergeGeometries(geoms, false), new THREE.MeshLambertMaterial({ map: matsByPack[pack] }));
    mesh.frustumCulled = false; root.add(mesh);
    geoms.forEach(g => g.dispose());
  }
  return { root, colliders, lamps, houseCells, addStatic, reserved, rng: R, sizeOf };
}
