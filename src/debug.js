import * as THREE from 'three';
import { loadAll } from './assets.js';
import { Actor } from './actors.js';
await loadAll();
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(900, 300); document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x445566);
scene.add(new THREE.HemisphereLight(0xffffff, 0x666666, 2.5));
const names = ['static', 'idle', 'walk', 'sprint', 'jump', 'pick-up'];
const actors = names.map((n, i) => { const a = new Actor('character-male-a', 1.75); a.group.position.set(i * 1.8 - 4.5, 0, 0); a.group.rotation.y = 0; scene.add(a.group); a.play(n); return a; });
const cam = new THREE.PerspectiveCamera(35, 3, 0.1, 100); cam.position.set(0, 1.2, 9); cam.lookAt(0, 0.9, 0);
const info = [];
for (let k = 0; k < 20; k++) { actors.forEach(a => a.update(0.05)); }
renderer.render(scene, cam);
// bone check: arm-left rotation per animation
const bones = actors.map((a, i) => { let q = null; a.model.traverse(o => { if (o.name === 'arm-left') q = o.quaternion.toArray().map(v => +v.toFixed(2)); }); return names[i] + ' arm-left q=' + JSON.stringify(q) + ' clips=' + Object.keys(a.actions).length; });
window.__measure = bones; window.__done = true;
