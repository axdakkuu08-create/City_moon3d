import * as THREE from 'three';
import { Character } from './player.js';
import { SC, BLOCK } from './world.js';

// Ambient townsfolk: stroll along the sidewalks, sometimes turn at crossings, pause politely when the player is close.
const FILES = ['female-a', 'female-b', 'female-d', 'male-c', 'male-f', 'female-a', 'male-c', 'female-d'];
const SPACING = BLOCK * SC, LIM = 2 * SPACING;          // road lines at -48,-24,0,24,48
const rnd = (a, b) => a + Math.random() * (b - a);

export async function createWalkers(scene, count, colliders) {
  const list = [];
  for (let i = 0; i < count; i++) {
    const c = new Character(); await c.init(scene, `characters/character-${FILES[i % FILES.length]}.glb`, 1.7 + (i % 3) * 0.05);
    const w = { c, axis: Math.random() < .5 ? 'x' : 'z', line: Math.floor(rnd(-2, 3)), pos: rnd(-LIM, LIM), dir: Math.random() < .5 ? 1 : -1, lane: Math.random() < .5 ? 1.9 : -1.9, speed: rnd(1.4, 2.0), wait: 0,
      col: { x: 0, z: 0, r: .42, h: 0, walker: true } };
    colliders.push(w.col); list.push(w); place(w, 0);
  }
  return list;
}

function place(w, dt) {
  const p = w.axis === 'z' ? [w.line * SPACING + w.lane, w.pos] : [w.pos, w.line * SPACING + w.lane];
  w.c.root.position.set(p[0], 0, p[1]); w.col.x = p[0]; w.col.z = p[1];
}

export function updateWalkers(list, dt, player) {
  for (const w of list) {
    const r = w.c.root, dx = player.pos.x - r.position.x, dz = player.pos.z - r.position.z, near = Math.hypot(dx, dz) < 2.6;
    if (near || w.wait > 0) {
      w.wait = near ? 1.2 : w.wait - dt; w.c.play('idle'); if (near) w.c.face(dx, dz, dt, 5);
    } else {
      const prev = w.pos; w.pos += w.dir * w.speed * dt; w.c.play('walk'); if (w.c.current) w.c.current.timeScale = .75;
      const dx2 = w.axis === 'z' ? 0 : w.dir, dz2 = w.axis === 'z' ? w.dir : 0; w.c.face(dx2, dz2, dt, 8);
      const k0 = Math.floor(prev / SPACING), k1 = Math.floor(w.pos / SPACING);
      if (k0 !== k1) {                                      // crossed an intersection line
        const k = w.dir > 0 ? k1 : k0;
        if (Math.abs(k) <= 2 && Math.random() < .4) {         // turn onto the crossing road
          const along = w.line; w.line = k; w.axis = w.axis === 'z' ? 'x' : 'z'; w.pos = along * SPACING; w.dir = Math.random() < .5 ? 1 : -1; w.lane = Math.random() < .5 ? 1.9 : -1.9;
        }
      }
      if (Math.abs(w.pos) > LIM + SC) { w.dir *= -1; w.pos = Math.sign(w.pos) * (LIM + SC); w.wait = 1; }
    }
    place(w, dt); w.c.update(dt);
  }
}
