import * as THREE from 'three';
import { loadAll, clone } from './assets.js';
import { story, sceneZone, miraAbsent, zoneNames, fragments } from './story.js';
import { K, GRID, HALF, cellPos, isRoad, ZONES, buildWorld } from './world.js';
import { buildSky, buildTower, buildStation, buildLibrary, buildBeacon, makeGlow, glowTex, glowGold, glowBlue, glowRed } from './scenery.js';
import { Actor, lerpAngle } from './actors.js';
import { Sound } from './audio.js';

const $ = id => document.getElementById(id);
const SAVE_KEY = 'cityMoon3dSave_v1';
const sound = new Sound();
const defaultState = () => ({ scene: 'opening', trust: 0, clues: [], compassion: 0, flags: {}, history: [], ending: null, orbs: [], mira: false, childGone: false, pos: null, started: false });
let state = defaultState();
const touchCapable = matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window;
if (touchCapable) document.body.classList.add('touch');

// ---------- boot ----------
const bar = $('loadBar');
try {
  await loadAll(p => { bar.style.width = (p * 100).toFixed(0) + '%'; });
} catch (e) { $('loadMsg').textContent = 'Could not load models: ' + e.message; throw e; }

// ---------- renderer & scene ----------
const canvas = $('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
let quality = (() => { try { return localStorage.getItem('cm_quality') || (touchCapable ? 'low' : 'high'); } catch (e) { return 'low'; } })();
function applyQuality() {
  renderer.setPixelRatio(quality === 'high' ? Math.min(window.devicePixelRatio || 1, 2) : 1);
  renderer.shadowMap.enabled = quality === 'high'; moonLight && (moonLight.castShadow = quality === 'high');
  renderer.setSize(innerWidth, innerHeight, false);
  try { localStorage.setItem('cm_quality', quality); } catch (e) {}
}
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.25;
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x2d2548, 0.0105);
const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 900);

scene.add(new THREE.HemisphereLight(0x95a6ff, 0x4a3252, 1.9));
const moonLight = new THREE.DirectionalLight(0xffa7bd, 1.7);
moonLight.position.set(60, 90, -50); moonLight.castShadow = false;
moonLight.shadow.mapSize.set(2048, 2048); const sc = moonLight.shadow.camera; sc.left = -26; sc.right = 26; sc.top = 26; sc.bottom = -26; sc.near = 1; sc.far = 220; moonLight.shadow.bias = -0.0008;
scene.add(moonLight, moonLight.target);
const lantern = new THREE.PointLight(0xffd9a0, 90, 20, 2); scene.add(lantern);

const sky = buildSky(scene);
const world = buildWorld(scene);
const { colliders } = world;
const tower = buildTower(scene, colliders);
const station = buildStation(scene, colliders);
const library = buildLibrary(scene, clone, colliders);
applyQuality();

// lamp glows + door glows
const lampSprites = [];
for (const l of world.lamps) {
  const s = makeGlow(glowTex, l.broken ? 4 : 5.5, l.broken ? 0xffb070 : 0xffffff, 0.6); s.position.copy(l.pos); scene.add(s);
  lampSprites.push({ s, broken: l.broken, base: l.broken ? 0.5 : 0.6 });
}
const doorDirs = { S: [0, 1], N: [0, -1], E: [1, 0], W: [-1, 0] };
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
for (const h of world.houseCells) {
  if (!h.home && rnd() > 0.5) continue;
  const [dx, dz] = doorDirs[h.side]; const s = makeGlow(glowTex, h.home ? 3.2 : 2.4, h.home ? 0xffdca0 : 0xffc890, h.home ? 0.8 : 0.55);
  s.position.set(h.c.x + dx * 3.7, 1.8, h.c.z + dz * 3.7); scene.add(s); lampSprites.push({ s, broken: false, base: h.home ? 0.8 : 0.55 });
}

// ---------- actors ----------
const player = new Actor('character-male-a', 1.75, { shadow: true }); scene.add(player.group);
const mira = new Actor('character-female-d', 1.7, { shadow: true }); mira.group.visible = false; scene.add(mira.group);
const child = new Actor('character-female-b', 1.15, { shadow: true }); scene.add(child.group);
const conductor = new Actor('character-male-e', 1.8); scene.add(conductor.group);
const passengers = [new Actor('character-female-a', 1.7), new Actor('character-male-c', 1.75), new Actor('character-female-e', 1.65)]; passengers.forEach(a => scene.add(a.group));
const clockmaker = new Actor('character-male-f', 2.0, { shadow: true }); scene.add(clockmaker.group);
// clock-face mask on the Clockmaker's head
{
  let head = null; clockmaker.model.traverse(o => { if (o.name === 'head' && !head) head = o; });
  if (head) {
    const t = new THREE.CanvasTexture(Object.assign(document.createElement('canvas'), { width: 128, height: 128 }));
    const g = t.image.getContext('2d'); g.fillStyle = '#e8d9b4'; g.beginPath(); g.arc(64, 64, 60, 0, 7); g.fill(); g.strokeStyle = '#4a2f2a'; g.lineWidth = 6; g.stroke();
    g.fillStyle = '#4a2f2a'; for (let i = 0; i < 12; i++) { g.save(); g.translate(64, 64); g.rotate(i * Math.PI / 6); g.fillRect(-2, -52, 4, i % 3 ? 7 : 13); g.restore(); } t.needsUpdate = true;
    const mask = new THREE.Mesh(new THREE.CircleGeometry(0.23, 28), new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide })); mask.name = 'mask';
    const hb = new THREE.Box3().setFromObject(head); const hc = hb.getCenter(new THREE.Vector3()); const inv = new THREE.Matrix4().copy(head.matrixWorld).invert(); 
    mask.position.copy(hc.applyMatrix4(inv)); mask.position.z += 0.2; head.add(mask); clockmaker.mask = mask;
  }
}
// NPC placement
const zoneAt = (name, dx = 0, dz = 0) => ZONES[name].pos.clone().add(new THREE.Vector3(dx, 0, dz));
child.group.position.copy(zoneAt('street', -1.4, -0.5)); child.setYaw(Math.PI * 0.6); 
{ const p = ZONES.station.pos;
  conductor.group.position.set(p.x + 2.6, 0.12, p.z + 0.2); conductor.setYaw(Math.PI);
  const spots = [[-6, 3.6], [-5, 3.6], [5, 3.6]]; // on benches
  passengers.forEach((a, i) => { a.group.position.set(p.x + spots[i][0], 0.12, p.z - 2.2 + spots[i][1] + 0.1 - 0.0); a.play('sit'); a.setYaw(Math.PI); });
}
{ const p = ZONES.tower.pos; clockmaker.group.position.set(p.x + 0.8, 0, p.z + 1.2); clockmaker.setYaw(Math.PI); }

// memory fragments (orbs)
const orbCells = [[1, 4], [3, 8], [5, 12], [7, 0], [8, 3], [8, 6], [9, 12], [11, 8], [12, 2], [13, 4], [15, 8], [16, 13], [12, 14], [4, 15]];
const orbs = orbCells.map((c, i) => {
  const p = cellPos(c[0], c[1]); p.x += ((i * 37) % 5 - 2) * 0.9; p.z += ((i * 53) % 5 - 2) * 0.9;
  const g = new THREE.Group(); g.position.set(p.x, 1.2, p.z);
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 1), new THREE.MeshBasicMaterial({ color: 0xaeeaff })); g.add(m);
  const gl = makeGlow(glowBlue, 3.2, 0xffffff, 0.95); g.add(gl); scene.add(g);
  return { g, m, id: i, taken: false };
});

const beacon = buildBeacon(); scene.add(beacon);

// ---------- input ----------
const keys = {};
addEventListener('keydown', e => {
  if (e.repeat && e.code !== 'Space') return; keys[e.code] = true;
  if (!started) return;
  if (dialogueOpen) { const n = parseInt(e.key); if (n >= 1 && n <= 9) { const b = $('dlgChoices').children[n - 1]; b && b.click(); } if (e.key === 'Enter' && $('dlgChoices').children.length === 1) $('dlgChoices').children[0].click(); return; }
  if (e.code === 'KeyJ') openJournal(); if (e.code === 'KeyM') toggleMute(); if (e.code === 'Escape') openMenu();
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
const joy = { id: null, ox: 0, oy: 0, x: 0, y: 0 };
let camYaw = 0, camPitch = 0.28, camDist = 6.2, jumpQueued = false, runToggle = false;
const joyBase = $('joyBase'), joyKnob = $('joyKnob');
$('touchMove').addEventListener('pointerdown', e => {
  if (joy.id !== null) return; joy.id = e.pointerId; joy.ox = e.clientX; joy.oy = e.clientY; joy.x = joy.y = 0; e.target.setPointerCapture(e.pointerId);
  joyBase.style.display = joyKnob.style.display = 'block'; joyBase.style.left = joyKnob.style.left = e.clientX + 'px'; joyBase.style.top = joyKnob.style.top = e.clientY + 'px'; sound.init();
});
$('touchMove').addEventListener('pointermove', e => {
  if (e.pointerId !== joy.id) return; let dx = e.clientX - joy.ox, dy = e.clientY - joy.oy; const R = 54, d = Math.hypot(dx, dy); if (d > R) { dx *= R / d; dy *= R / d; }
  joy.x = dx / R; joy.y = dy / R; joyKnob.style.left = joy.ox + dx + 'px'; joyKnob.style.top = joy.oy + dy + 'px';
});
const endJoy = e => { if (e.pointerId !== joy.id) return; joy.id = null; joy.x = joy.y = 0; joyBase.style.display = joyKnob.style.display = 'none'; };
$('touchMove').addEventListener('pointerup', endJoy); $('touchMove').addEventListener('pointercancel', endJoy);
let look = { id: null, x: 0, y: 0 };
const L = $('touchLook');
L.addEventListener('pointerdown', e => { if (look.id !== null) return; look.id = e.pointerId; look.x = e.clientX; look.y = e.clientY; L.setPointerCapture(e.pointerId); sound.init(); });
L.addEventListener('pointermove', e => { if (e.pointerId !== look.id) return; camYaw -= (e.clientX - look.x) * 0.0055; camPitch = Math.min(1.25, Math.max(-0.1, camPitch + (e.clientY - look.y) * 0.004)); look.x = e.clientX; look.y = e.clientY; });
const endLook = e => { if (e.pointerId === look.id) look.id = null; }; L.addEventListener('pointerup', endLook); L.addEventListener('pointercancel', endLook);
L.addEventListener('wheel', e => { camDist = Math.min(14, Math.max(3.2, camDist + e.deltaY * 0.005)); }, { passive: true });
$('jumpBtn').addEventListener('pointerdown', e => { e.stopPropagation(); jumpQueued = true; });
$('runBtn').addEventListener('pointerdown', e => { e.stopPropagation(); runToggle = !runToggle; $('runBtn').classList.toggle('on', runToggle); });
for (const id of ['menuBtn', 'journalBtn']) $(id).addEventListener('pointerdown', e => e.stopPropagation());

// ---------- state / flow ----------
let started = false, dialogueOpen = false, currentZoneName = null, arriveTimer = 0, objective = null;
function persist() { try { state.pos = { x: player.position.x, z: player.position.z }; localStorage.setItem(SAVE_KEY, JSON.stringify(state)); return true; } catch (e) { return false; } }
function loadSave() { try { const raw = localStorage.getItem(SAVE_KEY); if (!raw) return null; const s = JSON.parse(raw); if (!s || !story[s.scene]) return null; return { ...defaultState(), ...s }; } catch (e) { return null; } }
function toast(msg, ms = 3600) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), ms); }
function toggleMute() { sound.setMuted(!sound.muted); toast(sound.muted ? 'Sound off' : 'Sound on', 1200); }
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function setObjective(zone) {
  objective = zone; const z = ZONES[zone]; 
  if (!zone) { beacon.visible = false; $('objective').textContent = ''; return; }
  beacon.visible = true; beacon.position.copy(z.pos); $('objective').textContent = 'Go to: ' + zoneNames[zone];
}
function updateHud() {
  const sc = story[state.scene]; $('chapter').textContent = `Chapter ${sc.chapter} · ${sc.chapterName}`;
  $('frag').textContent = `✦ Memory fragments ${state.orbs.length} / ${orbs.length}`;
}
function ensureMira() {
  if (state.mira && mira.group.visible) return; state.mira = true;
  const f = new THREE.Vector3(-Math.sin(camYaw), 0, -Math.cos(camYaw)); const r = new THREE.Vector3(Math.cos(camYaw), 0, -Math.sin(camYaw));
  mira.group.position.copy(player.position).addScaledVector(r, 1.6).addScaledVector(f, -0.6); mira.group.visible = true;
  const flash = makeGlow(glowGold, 5, 0xffffff, 1); flash.position.copy(mira.group.position).setY(1.2); scene.add(flash); let t = 0;
  const tick = setInterval(() => { t += 0.05; flash.material.opacity = Math.max(0, 1 - t * 1.5); flash.scale.setScalar(5 + t * 8); if (t > 0.7) { clearInterval(tick); scene.remove(flash); } }, 50);
}
function openScene(id) {
  const sc = story[id]; state.scene = id; dialogueOpen = true; document.body.classList.add('dlg');
  state.history.push({ id, title: sc.title, chapter: sc.chapter });
  if (!miraAbsent.has(id)) ensureMira();
  if (sc.ending) state.ending = sc.title;
  $('dlgChapter').textContent = `Chapter ${sc.chapter} · ${sc.chapterName}`; $('dlgScene').textContent = `Scene ${sc.scene}`; $('dlgTitle').textContent = sc.title;
  let text = sc.text; if (sc.ending) text += `\n\n✦ Memory fragments recovered: ${state.orbs.length} of ${orbs.length}.`;
  $('dlgText').textContent = text;
  const box = $('dlgChoices'); box.innerHTML = '';
  let n = 0;
  for (const c of sc.choices) {
    if (c.requires && ((c.requires.clues && state.clues.length < c.requires.clues) || (c.requires.trust && state.trust < c.requires.trust) || (c.requires.compassion && state.compassion < c.requires.compassion))) continue;
    n++; const b = document.createElement('button'); b.className = 'choice'; b.innerHTML = esc(c.label) + (touchCapable ? '' : `<small>${n}</small>`); b.addEventListener('click', () => choose(c, id)); box.appendChild(b);
  }
  if (sc.ending) {
    const b1 = document.createElement('button'); b1.className = 'choice'; b1.textContent = 'Return to the title screen'; b1.onclick = () => { closeDialogue(); showTitle(); persist(); }; box.appendChild(b1);
    const b2 = document.createElement('button'); b2.className = 'choice'; b2.textContent = 'Walk the city again (keep exploring)'; b2.onclick = () => { closeDialogue(); setObjective(null); persist(); }; box.appendChild(b2);
  }
  $('dialogue').scrollTop = 0; sound.bell(); updateHud(); persist();
}
function closeDialogue() { dialogueOpen = false; document.body.classList.remove('dlg'); $('dialogue').classList.add('hidden'); }
function choose(c, fromId) {
  sound.choice();
  if (c.effects) { if (c.effects.trust) state.trust += c.effects.trust; if (c.effects.compassion) state.compassion += c.effects.compassion; if (c.effects.clue && !state.clues.includes(c.effects.clue)) { state.clues.push(c.effects.clue); toast('New clue: ' + c.effects.clue, 2400); } }
  if (c.log) state.flags[c.log] = true;
  if (fromId === 'lostChild') state.childGone = true;
  const next = c.next; state.scene = next; updateHud(); persist();
  if (sceneZone[next] === sceneZone[fromId]) { $('dialogue').classList.add('hidden'); setTimeout(() => { $('dialogue').classList.remove('hidden'); openScene(next); }, 250); }
  else { closeDialogue(); setObjective(sceneZone[next]); toast('Next: ' + zoneNames[sceneZone[next]], 3200); }
}
function openJournal() {
  const hist = state.history.slice(-14).map(h => `<li><b>Ch ${h.chapter}:</b> ${esc(h.title)}</li>`).join('') || '<li>Nothing yet.</li>';
  const clues = state.clues.map(c => `<li>${esc(c)}</li>`).join('') || '<li>No clues collected yet.</li>';
  const frs = state.orbs.map(i => `<li>${esc(fragments[i])}</li>`).join('') || '<li>Gather the glowing fragments scattered through the city.</li>';
  showModal(`<h2>Ren’s Journal</h2><p>Trust ${state.trust} · Clues ${state.clues.length} · Compassion ${state.compassion}</p><h3>Clues</h3><ul>${clues}</ul><h3>Memory fragments (${state.orbs.length}/${orbs.length})</h3><ul>${frs}</ul><h3>Recent scenes</h3><ul>${hist}</ul>`, [['Close', hideModal]]);
}
function openMenu() {
  showModal(`<h2>Paused</h2><p>Graphics: <b>${quality === 'high' ? 'High' : 'Battery saver'}</b> · Sound: <b>${sound.muted ? 'Off' : 'On'}</b></p><p>Progress saves automatically on this device.</p>`, [
    ['Resume', hideModal], ['Toggle graphics', () => { quality = quality === 'high' ? 'low' : 'high'; applyQuality(); openMenu(); }], ['Toggle sound', () => { toggleMute(); openMenu(); }],
    ['Controls', () => showControls()], ['Save & title', () => { persist(); hideModal(); showTitle(); }]]);
}
function showControls() { showModal(`<h2>Controls</h2><p><b>Phone:</b> drag on the left to walk, drag on the right to look. RUN toggles sprint, JUMP leaps.</p><p><b>Keyboard:</b> WASD / arrows move · Shift run · Space jump · mouse drag look · wheel zoom · J journal · M mute · Esc menu · 1-4 choose answers.</p><p>Follow the golden beam and arrow to the next story place. Blue glowing orbs are lost memories — collect them all.</p>`, [['Close', hideModal]]); }
function showModal(html, btns) { $('modalBody').innerHTML = html; const b = $('modalBtns'); b.innerHTML = ''; for (const [t, fn] of btns) { const x = document.createElement('button'); x.className = 'secondary'; x.textContent = t; x.onclick = fn; b.appendChild(x); } $('modal').classList.remove('hidden'); paused = true; }
function hideModal() { $('modal').classList.add('hidden'); paused = false; }
let paused = false;
$('journalBtn').addEventListener('click', openJournal); $('menuBtn').addEventListener('click', openMenu); $('helpBtn').addEventListener('click', showControls);

function showTitle() { started = false; $('hud').classList.add('hidden'); closeDialogue(); $('title').classList.remove('hidden'); $('continueBtn').style.display = loadSave() ? '' : 'none'; }
function startGame(fresh) {
  sound.init(); $('title').classList.add('hidden'); $('hud').classList.remove('hidden');
  if (fresh) { state = defaultState(); orbs.forEach(o => { o.taken = false; o.g.visible = true; }); mira.group.visible = false; }
  else { const s = loadSave(); if (s) state = s; }
  state.started = true;
  orbs.forEach(o => { o.taken = state.orbs.includes(o.id); o.g.visible = !o.taken; });
  child.group.visible = !state.childGone;
  const sp = ZONES.home.pos.clone().add(new THREE.Vector3(0, 0, 0.6));
  if (!fresh && state.pos) { player.position.set(state.pos.x, 0, state.pos.z); } else player.position.copy(sp);
  player.setYaw(fresh ? 0 : Math.PI); if (fresh) { camYaw = Math.PI; camInit = false; } if (state.mira) { mira.group.visible = false; ensureMira(); }
  const z = sceneZone[state.scene]; const sc = story[state.scene];
  if (sc.ending && !fresh) { setObjective(null); } else setObjective(z);
  updateHud(); arriveTimer = fresh ? 1.6 : 0.6; started = true; vel.set(0, 0, 0);
  $('fade').style.opacity = 1; setTimeout(() => $('fade').style.opacity = 0, 60);
  canvas.focus();
}
$('beginBtn').addEventListener('click', () => startGame(true));
$('continueBtn').addEventListener('click', () => startGame(false));

// ---------- physics / movement ----------
const vel = new THREE.Vector3(); let vy = 0, grounded = true, stepT = 0;
const WALK = 4.4, RUN = 7.6, ACCEL = 9, R = 0.42, LIM = (HALF + 3.4) * K;
function resolve(pos, r, y) {
  for (let pass = 0; pass < 2; pass++) for (const c of colliders) {
    if (c.h < 99 && y > c.h) continue;
    if (c.r !== undefined) { const dx = pos.x - c.x, dz = pos.z - c.z, d = Math.hypot(dx, dz), m = r + c.r; if (d < m && d > 1e-4) { pos.x = c.x + dx / d * m; pos.z = c.z + dz / d * m; } }
    else { const nx = Math.max(c.x - c.hx, Math.min(pos.x, c.x + c.hx)), nz = Math.max(c.z - c.hz, Math.min(pos.z, c.z + c.hz)); let dx = pos.x - nx, dz = pos.z - nz; const d = Math.hypot(dx, dz);
      if (d < r) { if (d > 1e-4) { pos.x = nx + dx / d * r; pos.z = nz + dz / d * r; } else { const ox = c.hx - Math.abs(pos.x - c.x), oz = c.hz - Math.abs(pos.z - c.z); if (ox < oz) pos.x += Math.sign(pos.x - c.x || 1) * (ox + r); else pos.z += Math.sign(pos.z - c.z || 1) * (oz + r); } } }
  }
  pos.x = Math.max(-LIM, Math.min(LIM, pos.x)); pos.z = Math.max(-LIM, Math.min(LIM, pos.z));
}
function updatePlayer(dt) {
  let ix = 0, iz = 0; // iz: forward positive
  if (!dialogueOpen && !paused && started) {
    if (keys.KeyW || keys.ArrowUp) iz += 1; if (keys.KeyS || keys.ArrowDown) iz -= 1; if (keys.KeyD || keys.ArrowRight) ix += 1; if (keys.KeyA || keys.ArrowLeft) ix -= 1;
    if (joy.id !== null) { ix += joy.x; iz += -joy.y; }
  }
  const mag = Math.min(1, Math.hypot(ix, iz)); if (mag > 0) { ix /= Math.max(1, Math.hypot(ix, iz)); iz /= Math.max(1, Math.hypot(ix, iz)); }
  const run = !!(keys.ShiftLeft || keys.ShiftRight) || runToggle || (joy.id !== null && mag > 0.9 && touchCapable && false);
  const f = [-Math.sin(camYaw), -Math.cos(camYaw)], r = [Math.cos(camYaw), -Math.sin(camYaw)];
  const sp = (run ? RUN : WALK) * Math.min(1, mag * 1.05);
  const wx = (f[0] * iz + r[0] * ix), wz = (f[1] * iz + r[1] * ix); const wl = Math.hypot(wx, wz) || 1;
  const tx = mag > 0.05 ? wx / wl * sp : 0, tz = mag > 0.05 ? wz / wl * sp : 0;
  const k = 1 - Math.exp(-ACCEL * dt); vel.x += (tx - vel.x) * k; vel.z += (tz - vel.z) * k;
  if (jumpQueued || keys.Space) { if (grounded && !dialogueOpen && !paused) { vy = 8.2; grounded = false; player.play('jump', { once: true, fade: 0.08 }); } } jumpQueued = false;
  player.position.x += vel.x * dt; player.position.z += vel.z * dt;
  vy -= 26 * dt; player.position.y += vy * dt; if (player.position.y <= 0) { player.position.y = 0; if (!grounded) { grounded = true; stepT = 0; } vy = 0; }
  resolve(player.position, R, player.position.y);
  const hs = Math.hypot(vel.x, vel.z);
  if (hs > 0.6) { player.yaw = lerpAngle(player.yaw, Math.atan2(vel.x, vel.z), 1 - Math.exp(-12 * dt)); player.group.rotation.y = player.yaw; }
  if (!grounded) { if (vy < -1.5) player.play('fall', { fade: 0.1 }); }
  else if (hs > RUN * 0.72) player.play('sprint', { speed: 1 }); else if (hs > 0.8) player.play('walk', { speed: Math.max(0.8, hs / WALK) }); else player.play('idle');
  if (grounded && hs > 1) { stepT -= dt * hs; if (stepT <= 0) { sound.step(hs > RUN * 0.7); stepT = 1.9; } }
  lantern.position.set(player.position.x, 2.6, player.position.z);
}
function updateFollower(dt) {
  if (!mira.group.visible) return;
  const mp = mira.group.position, pp = player.position; let dx = pp.x - mp.x, dz = pp.z - mp.z; const d = Math.hypot(dx, dz);
  if (d > 40) { mp.set(pp.x + 2, 0, pp.z + 2); return; }
  const want = dialogueOpen ? 2.2 : 3.0;
  if (d > want + 0.6) { const sp = d > 9 ? RUN * 1.1 : d > 5 ? RUN * 0.8 : WALK * 0.95; mp.x += dx / d * sp * dt; mp.z += dz / d * sp * dt; mira.yaw = lerpAngle(mira.yaw, Math.atan2(dx, dz), 1 - Math.exp(-10 * dt)); mira.group.rotation.y = mira.yaw; mira.play(d > 9 ? 'sprint' : 'walk'); }
  else { mira.play('idle'); mira.faceToward(pp.x, pp.z, dt, 6); }
  resolve(mp, 0.4, 0);
}
function updateNpcs(dt) {
  const pp = player.position;
  if (child.group.visible) { child.faceToward(pp.x, pp.z, dt, 3); }
  conductor.faceToward(pp.x, pp.z, dt, 3); clockmaker.faceToward(pp.x, pp.z, dt, 2.5);
  passengers.forEach(p => p.faceToward(pp.x, pp.z, dt, 1.5));
}

// ---------- camera ----------
const camTarget = new THREE.Vector3(), camPos = new THREE.Vector3(); let camInit = false;
function updateCamera(dt) {
  if (window.__freeCam) { camera.position.set(...window.__freeCam.pos); camera.lookAt(...window.__freeCam.look); return; }
  if (!dialogueOpen && !paused) { // keyboard look
    if (keys.KeyQ) camYaw += 1.8 * dt; if (keys.KeyE) camYaw -= 1.8 * dt;
  }
  const hp = player.position; const tgt = new THREE.Vector3(hp.x, 1.55 + hp.y * 0.6, hp.z);
  camTarget.lerp(tgt, camInit ? 1 - Math.exp(-14 * dt) : 1);
  const cp = Math.cos(camPitch); const off = new THREE.Vector3(Math.sin(camYaw) * cp, Math.sin(camPitch), Math.cos(camYaw) * cp);
  let dist = camDist; if (dialogueOpen) dist = Math.min(dist, 4.4);
  // shorten the arm if a building is in the way
  for (let t = dist; t > 1.2; t -= 0.35) { const x = camTarget.x + off.x * t, y = camTarget.y + off.y * t, z = camTarget.z + off.z * t; let hit = false;
    for (const c of colliders) { if (c.r !== undefined) continue; if (y < c.h + 0.3 && Math.abs(x - c.x) < c.hx + 0.35 && Math.abs(z - c.z) < c.hz + 0.35) { hit = true; break; } } if (!hit) { dist = t; break; } if (t - 0.35 <= 1.2) dist = 1.2; }
  const want = camTarget.clone().addScaledVector(off, dist); want.y = Math.max(0.5, want.y);
  camPos.lerp(want, camInit ? 1 - Math.exp(-16 * dt) : 1); camInit = true;
  camera.position.copy(camPos); camera.lookAt(camTarget);
  moonLight.position.set(hp.x + 60, 90, hp.z - 50); moonLight.target.position.set(hp.x, 0, hp.z); moonLight.target.updateMatrixWorld();
}

// ---------- minimap / compass ----------
const mapC = $('map'), mctx = mapC.getContext('2d'); const MS = mapC.width; const WORLD = (GRID + 2) * K;
const mapStatic = document.createElement('canvas'); mapStatic.width = mapStatic.height = MS; {
  const g = mapStatic.getContext('2d'); g.fillStyle = '#10142a'; g.fillRect(0, 0, MS, MS); g.fillStyle = '#4b5273';
  for (let i = 0; i < GRID; i++) for (let j = 0; j < GRID; j++) if (isRoad(i, j)) { const p = cellPos(i, j); const x = (p.x / WORLD + 0.5) * MS, y = (p.z / WORLD + 0.5) * MS; g.fillRect(x - K / WORLD * MS / 2, y - K / WORLD * MS / 2, K / WORLD * MS + 0.5, K / WORLD * MS + 0.5); }
  g.fillStyle = '#e8c98a55'; for (const z of Object.values(ZONES)) { const x = (z.pos.x / WORLD + 0.5) * MS, y = (z.pos.z / WORLD + 0.5) * MS; g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); }
}
let hudT = 0;
function updateHudFrame(dt) {
  hudT -= dt; if (hudT > 0) return; hudT = 0.08;
  const px = (player.position.x / WORLD + 0.5) * MS, py = (player.position.z / WORLD + 0.5) * MS;
  mctx.drawImage(mapStatic, 0, 0);
  if (objective) { const z = ZONES[objective].pos; const x = (z.x / WORLD + 0.5) * MS, y = (z.z / WORLD + 0.5) * MS; mctx.fillStyle = '#ffe3a3'; mctx.beginPath(); mctx.arc(x, y, 7 + Math.sin(performance.now() / 250) * 1.5, 0, 7); mctx.fill(); }
  mctx.fillStyle = '#9fe8ff'; for (const o of orbs) if (!o.taken) { const x = (o.g.position.x / WORLD + 0.5) * MS, y = (o.g.position.z / WORLD + 0.5) * MS; mctx.fillRect(x - 2, y - 2, 4, 4); }
  if (mira.group.visible) { mctx.fillStyle = '#f0a0b8'; mctx.beginPath(); mctx.arc((mira.group.position.x / WORLD + 0.5) * MS, (mira.group.position.z / WORLD + 0.5) * MS, 4, 0, 7); mctx.fill(); }
  mctx.save(); mctx.translate(px, py); mctx.rotate(-camYaw + Math.PI); mctx.fillStyle = '#fff'; mctx.beginPath(); mctx.moveTo(0, -9); mctx.lineTo(6, 7); mctx.lineTo(0, 3); mctx.lineTo(-6, 7); mctx.closePath(); mctx.fill(); mctx.restore();
  const comp = $('compass');
  if (objective && !dialogueOpen) {
    comp.style.display = ''; const t = ZONES[objective].pos; const dx = t.x - player.position.x, dz = t.z - player.position.z;
    const f = [-Math.sin(camYaw), -Math.cos(camYaw)], r = [Math.cos(camYaw), -Math.sin(camYaw)];
    const ang = Math.atan2(dx * r[0] + dz * r[1], dx * f[0] + dz * f[1]); $('arrow').style.transform = `rotate(${ang}rad)`; $('dist').textContent = Math.round(Math.hypot(dx, dz)) + ' m';
  } else comp.style.display = 'none';
}

// ---------- game loop ----------
const clock = new THREE.Clock(); let time = 0; 
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, clock.getDelta()); time += dt;
  const frozen = paused;
  if (!frozen) {
    updatePlayer(dt); updateFollower(dt); updateNpcs(dt);
    player.update(dt); mira.update(dt); child.update(dt); conductor.update(dt); clockmaker.update(dt); passengers.forEach(p => p.update(dt));
    // orbs
    for (const o of orbs) { if (o.taken) continue; o.g.position.y = 1.25 + Math.sin(time * 2 + o.id) * 0.18; o.m.rotation.y += dt * 1.6; o.m.rotation.x += dt * 0.7;
      if (started && Math.hypot(o.g.position.x - player.position.x, o.g.position.z - player.position.z) < 1.8 && player.position.y < 2.2) collectOrb(o); }
    // objective trigger
    if (started && !dialogueOpen && objective) { const z = ZONES[objective]; if (Math.hypot(player.position.x - z.pos.x, player.position.z - z.pos.z) < z.r) { arriveTimer -= dt; if (arriveTimer <= 0) { setObjective(null); openScene(state.scene); $('dialogue').classList.remove('hidden'); } } else arriveTimer = Math.max(arriveTimer, 0.5); }
    // ambience
    for (const l of lampSprites) { if (l.broken) continue; const d = l.s.position.distanceTo(camera.position); l.s.material.opacity = l.base * Math.min(1, Math.max(0, (d - 2.5) / 7)); }
    for (const l of lampSprites) if (l.broken) l.s.material.opacity = Math.random() > 0.93 ? 0.05 : (Math.sin(time * 40) > 0.3 ? l.base : 0.25);
    if (objective) { const bz = ZONES[objective].pos; const bd = Math.hypot(bz.x - player.position.x, bz.z - player.position.z); beacon.userData.beam.visible = bd > 9; beacon.userData.glow.visible = bd > 6; }
    beacon.userData.ring.scale.setScalar(1 + Math.sin(time * 3) * 0.08); beacon.userData.beam.material.opacity = 0.2 + Math.sin(time * 2) * 0.06;
    library.items.forEach((it, i) => { const a = it.a + time * (0.5 + (i % 3) * 0.12); it.m.position.set(Math.cos(a) * it.r, it.h + Math.sin(time + i) * 0.2, Math.sin(a) * it.r); it.m.rotation.set(time + i, a, 0.3); });
    sky.moon.children[0].material.opacity = 0.8 + Math.sin(time * 0.6) * 0.1;
  }
  updateCamera(dt); updateHudFrame(dt);
  renderer.render(scene, camera);
}
function collectOrb(o) {
  o.taken = true; o.g.visible = false; state.orbs.push(o.id); sound.chime(); player.play('pick-up', { once: true, fade: 0.1 }); setTimeout(() => { if (player.current === 'pick-up') player.play('idle'); }, 700);
  toast('✦ ' + fragments[o.id], 4200);
  if (state.orbs.length >= 7 && !state.clues.includes('Gathered memories')) { state.clues.push('Gathered memories'); setTimeout(() => toast('New clue: Gathered memories — the city’s lost moments are piecing together.', 3800), 4300); }
  if (state.orbs.length >= orbs.length && !state.flags.allFragments) { state.flags.allFragments = true; state.compassion += 1; setTimeout(() => toast('Every fragment recovered. Ren’s compassion grows.', 3800), 4300); }
  updateHud(); persist();
}
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });
setInterval(() => { if (started && !paused) persist(); }, 8000);
addEventListener('pointerdown', () => sound.init(), { once: true }); addEventListener('keydown', () => sound.init(), { once: true });
document.addEventListener('visibilitychange', () => { if (document.hidden && started) persist(); });

// dev hooks (used by automated tests)
window.__sceneZone = sceneZone;
window.__game = { state: () => state, player, mira, camera, teleport: (x, z) => player.position.set(x, 0, z), setYaw: y => { camYaw = y; }, setPitch: p => { camPitch = p; }, openScene, startGame, ZONES, scene, renderer, orbs, colliders, setObjective, keys };
$('loading').classList.add('hidden'); showTitle(); frame(); window.__ready = true;
