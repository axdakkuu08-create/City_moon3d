import * as THREE from 'three';
import { K, cellPos, ZONES } from './world.js';

// ---------- procedural textures ----------
export function glowTexture(inner = 'rgba(255,230,170,1)', mid = 'rgba(255,180,90,0.35)') {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, inner); gr.addColorStop(0.25, mid); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); return t;
}
export function clockTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#e8d9b4'; g.beginPath(); g.arc(128, 128, 124, 0, 7); g.fill();
  g.strokeStyle = '#4a2f2a'; g.lineWidth = 10; g.beginPath(); g.arc(128, 128, 118, 0, 7); g.stroke();
  g.fillStyle = '#4a2f2a';
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.save(); g.translate(128, 128); g.rotate(a); g.fillRect(-4, -108, 8, i % 3 === 0 ? 26 : 14); g.restore(); }
  g.beginPath(); g.arc(128, 128, 8, 0, 7); g.fill();            // pivot only — the clock has no hands
  return new THREE.CanvasTexture(c);
}
export const glowTex = glowTexture();
export const glowRed = glowTexture('rgba(255,150,170,1)', 'rgba(230,80,120,0.35)');
export const glowBlue = glowTexture('rgba(180,220,255,1)', 'rgba(90,150,255,0.35)');
export const glowGold = glowTexture('rgba(255,240,190,1)', 'rgba(255,200,110,0.4)');

export function makeGlow(tex, size, color = 0xffffff, opacity = 1) {
  const m = new THREE.SpriteMaterial({ map: tex, color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, fog: true });
  const s = new THREE.Sprite(m); s.scale.set(size, size, 1); return s;
}

// ---------- sky, stars, moon ----------
export function buildSky(scene) {
  const sky = new THREE.Mesh(new THREE.SphereGeometry(520, 24, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(0x0a0c22) }, mid: { value: new THREE.Color(0x2b2547) }, bot: { value: new THREE.Color(0x4a2f4f) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} ',
    fragmentShader: 'varying vec3 vP; uniform vec3 top; uniform vec3 mid; uniform vec3 bot; void main(){ float h = normalize(vP).y; vec3 c = mix(bot, mid, smoothstep(-0.05, 0.25, h)); c = mix(c, top, smoothstep(0.2, 0.8, h)); gl_FragColor = vec4(c,1.0);} '
  }));
  sky.renderOrder = -10; scene.add(sky);
  // stars
  const n = 700, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const u = Math.random() * 6.283, v = Math.acos(Math.random() * 0.92 + 0.08); const r = 500; pos[i * 3] = r * Math.sin(v) * Math.cos(u); pos[i * 3 + 1] = r * Math.cos(v); pos[i * 3 + 2] = r * Math.sin(v) * Math.sin(u); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xcfd8ff, size: 2.2, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.85 }));
  scene.add(stars);
  // the crimson moon, low over the tower, with a pale crescent bite
  const moon = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CircleGeometry(46, 48), new THREE.MeshBasicMaterial({ color: 0xe0687f, fog: false }));
  const bite = new THREE.Mesh(new THREE.CircleGeometry(40, 48), new THREE.MeshBasicMaterial({ color: 0x8a2e56, fog: false }));
  bite.position.set(-10, 6, 0.5);
  const glow = makeGlow(glowRed, 420, 0xffffff, 0.8); glow.material.fog = false; glow.position.z = -1;
  moon.add(glow, disc, bite);
  moon.position.set(120, 230, -420); moon.lookAt(0, 0, 0); scene.add(moon);
  return { sky, stars, moon, glow };
}

// ---------- landmarks ----------
const box = (w, h, d, color, emissive = 0x000000) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color, emissive }));

export function buildTower(scene, colliders) {
  const g = new THREE.Group(); const p = cellPos(10, 10); g.position.copy(p);
  const stone = 0x8c84ab, stone2 = 0x6f6890;
  const base = box(12, 4, 12, stone2, 0x120d22); base.position.y = 2; g.add(base);
  const shaft = box(7, 30, 7, stone, 0x1a1330); shaft.position.y = 19; g.add(shaft);
  const belfry = box(9, 7, 9, stone2, 0x1a1330); belfry.position.y = 37.5; g.add(belfry);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(7.2, 12, 4), new THREE.MeshLambertMaterial({ color: 0x9a3a5c, emissive: 0x2a0c1c })); roof.position.y = 47; roof.rotation.y = Math.PI / 4; g.add(roof);
  const clock = clockTexture();
  const faceMat = new THREE.MeshBasicMaterial({ map: clock, fog: false });
  for (let k = 0; k < 4; k++) {
    const f = new THREE.Mesh(new THREE.CircleGeometry(3.4, 32), faceMat); const a = k * Math.PI / 2;
    f.position.set(Math.sin(a) * 4.55, 37.5, Math.cos(a) * 4.55); f.rotation.y = a; g.add(f);
  }
  // door (gate) on the north side (-Z) facing the road
  const door = box(2.8, 3.8, 0.4, 0x1a1428, 0x2a1030); door.position.set(0, 3.8, -6.05); g.add(door);
  const arch = new THREE.Mesh(new THREE.CircleGeometry(1.4, 24, 0, Math.PI), new THREE.MeshLambertMaterial({ color: 0x1a1428, emissive: 0x2a1030 })); arch.position.set(0, 5.7, -6.05); g.add(arch);
  // glowing seams
  const beacon = makeGlow(glowRed, 30, 0xffffff, 0.9); beacon.position.set(0, 47, 0); g.add(beacon);
  const inner = makeGlow(glowRed, 9, 0xffffff, 0.55); inner.position.set(0, 3.8, -6.6); g.add(inner);
  // low wall plaza ring
  for (let k = 0; k < 4; k++) { const w = box(k % 2 ? 0.8 : 18, 0.7, k % 2 ? 18 : 0.8, 0x353050); const a = k * Math.PI / 2; w.position.set(Math.sin(a) * 9.5 * (k%2), 0.35, Math.cos(a) * 9.5 * ((k+1)%2) ); if (k !== 0) g.add(w); }
  scene.add(g);
  colliders.push({ x: p.x, z: p.z, hx: 6.1, hz: 6.1, h: 60 });
  return { group: g, beacon, inner };
}

export function buildStation(scene, colliders) {
  const g = new THREE.Group(); const p = cellPos(14, 6); g.position.copy(p);
  const plat = box(22, 0.12, 6, 0x6a6a82); plat.position.set(0, 0.06, 2.2); g.add(plat);
  const edge = box(22, 0.13, 0.4, 0xd7c27a); edge.position.set(0, 0.065, -0.6); g.add(edge);
  // canopy
  const roof = box(21, 0.3, 5.4, 0x2c3a58); roof.position.set(0, 4.2, 2.3); g.add(roof);
  for (const x of [-9.5, -3, 3.5, 9.5]) { const c = box(0.35, 4, 0.35, 0x232b45); c.position.set(x, 2.2, 4.4); g.add(c); const l = makeGlow(glowBlue, 4.5); l.position.set(x, 3.8, 3.2); g.add(l); const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), new THREE.MeshBasicMaterial({ color: 0xbfe0ff })); bulb.position.copy(l.position); g.add(bulb); }
  // tracks
  for (const z of [-3.2, -4.4]) { const r = box(40, 0.15, 0.18, 0x55555f); r.position.set(0, 0.07, z); g.add(r); }
  for (let x = -19; x <= 19; x += 1.2) { const t = box(0.3, 0.1, 2.4, 0x3b2d29); t.position.set(x, 0.04, -3.8); g.add(t); }
  // train: 3 carriages + engine, windows show "different weather"
  const colors = [0xaed6ff, 0xffe49a, 0x8f9bff];
  const train = new THREE.Group(); train.position.set(0, 0, -3.8);
  const carriages = [];
  for (let k = 0; k < 3; k++) {
    const c = new THREE.Group(); c.position.x = -8 + k * 7.3;
    const body = box(7, 2.6, 2.5, 0x37445c); body.position.y = 1.9; c.add(body);
    const stripe = box(7.02, 0.3, 2.52, 0x8a3b52); stripe.position.y = 1.2; c.add(stripe);
    for (let w = 0; w < 4; w++) {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.9), new THREE.MeshBasicMaterial({ color: colors[(k + w) % 3] }));
      win.position.set(-2.4 + w * 1.6, 2.2, 1.27); c.add(win);
      const win2 = win.clone(); win2.position.z = -1.27; win2.rotation.y = Math.PI; c.add(win2);
    }
    train.add(c); carriages.push(c);
  }
  const engine = new THREE.Group(); engine.position.x = 14.5;
  const eb = box(5, 3, 2.6, 0x2a2f45); eb.position.y = 2.1; engine.add(eb);
  const chim = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 1.4, 12), new THREE.MeshLambertMaterial({ color: 0x1d2033 })); chim.position.set(1.2, 4.4, 0); engine.add(chim);
  const lamp = makeGlow(glowGold, 5); lamp.position.set(2.7, 2.2, 0); engine.add(lamp);
  train.add(engine); g.add(train);
  colliders.push({ x: p.x, z: p.z - 3.8, hx: 17, hz: 1.4, h: 4 });
  // benches
  for (const x of [-6, 5]) { const b = box(2.2, 0.4, 0.6, 0x4b3a33); b.position.set(x, 0.65, 3.8); g.add(b); }
  // station sign
  const sign = box(4, 0.8, 0.2, 0x1b2036, 0x101830); sign.position.set(0, 4.9, 4.6); g.add(sign);
  scene.add(g); return { group: g, train };
}

export function buildLibrary(scene, clone, colliders) {
  const g = new THREE.Group(); const p = cellPos(6, 3); g.position.copy(p);
  const b = clone('suburban/building-type-k'); const bb = new THREE.Box3().setFromObject(b); const sz = bb.getSize(new THREE.Vector3());
  const s = K * 1.25; b.scale.setScalar(s); b.rotation.y = Math.PI * 0 ; b.position.y = 0; g.add(b);
  const hx = sz.x * s / 2, hz = sz.z * s / 2, h = sz.y * s;
  colliders.push({ x: p.x, z: p.z, hx: hx * 0.92, hz: hz * 0.92, h });
  // glass arcade glow + silver crescent sign
  const glow = makeGlow(glowBlue, 28, 0xffffff, 0.55); glow.position.set(0, 3, hz + 1.5); g.add(glow);
  const glow2 = makeGlow(glowBlue, 16, 0xffffff, 0.5); glow2.position.set(0, h * 0.7, hz + 0.5); g.add(glow2);
  const cres = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.5, 32, 1, 0.6, 4.6), new THREE.MeshBasicMaterial({ color: 0xcfe6ff, side: THREE.DoubleSide, fog: false }));
  cres.position.set(0, h + 2.2, 0); g.add(cres);
  // floating books
  const books = new THREE.Group(); books.position.set(0, 4.2, hz + 4.2); g.add(books);
  const bm = [0x9fc6ff, 0xe8c98a, 0xd9879f];
  const items = [];
  for (let i = 0; i < 16; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.4), new THREE.MeshBasicMaterial({ color: bm[i % 3] }));
    books.add(m); items.push({ m, a: i / 16 * 6.283, r: 2.2 + (i % 3) * 0.9, h: (i % 5) * 0.55 - 1 });
  }
  scene.add(g); return { group: g, books, items };
}

// ---------- objective beacon ----------
export function buildBeacon() {
  const g = new THREE.Group();
  const col = new THREE.MeshBasicMaterial({ color: 0xffe3a3, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 70, 16, 1, true), col); beam.position.y = 30; g.add(beam);
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.4, 3, 40), new THREE.MeshBasicMaterial({ color: 0xffe3a3, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.08; g.add(ring);
  const glow = makeGlow(glowGold, 7, 0xffffff, 0.9); glow.position.y = 1.4; g.add(glow);
  g.userData = { ring, beam, glow };
  g.visible = false; return g;
}
