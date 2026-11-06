import * as THREE from 'three';
import { buildWorld, LOCATIONS, colliders, roadSpots, BOUNDS } from './world.js';
import { setupSky } from './sky.js';
import { Player, Character, CameraRig } from './player.js';
import { Input } from './input.js';
import { story, CAST, PLAYER_FILE } from './story.js';
import { Sound } from './audio.js';
import { Weather } from './weather.js';
import { createWalkers, updateWalkers } from './walkers.js';
import { THEMES, THEME_KEYS } from './themes.js';

const $ = id => document.getElementById(id);
const SAVE_KEY = 'cityMoon3dSave', PREF_KEY = 'cityMoon3dPrefs';
const lsGet = k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };
const prefs = Object.assign({ theme: 'auto', weather: 'rain', quality: matchMedia('(pointer:coarse)').matches ? 'low' : 'high', sound: true }, lsGet(PREF_KEY) || {});
const HIGH = prefs.quality === 'high';

// ---------- renderer / scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: HIGH, powerPreference: 'high-performance' });
renderer.setPixelRatio(HIGH ? Math.min(devicePixelRatio, 2) : 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = HIGH; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
document.body.prepend(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 600);
if (prefs.theme !== 'auto' && !THEMES[prefs.theme]) prefs.theme = 'auto';
const sky = setupSky(scene, HIGH, prefs.theme === 'auto' ? 'crimson' : prefs.theme); sky.hooks.renderer = renderer;
function resize() { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

const sound = new Sound(); sound.on = prefs.sound;
const input = new Input(renderer.domElement);
input.enabled = false;

// ---------- load ----------
const bar = document.querySelector('#bar span');
let loadedN = 0; const step = f => { bar.style.width = Math.min(100, (loadedN + f) * 100 / 3) + '%'; };
const world = await buildWorld(scene, p => step(p), sky.hooks); loadedN = 1;
sky.hooks.lamps.push(...world.lights);
const player = new Player(); await player.init(scene, PLAYER_FILE); loadedN = 2;
const npcs = {}; let ci = 0;
for (const [k, d] of Object.entries(CAST)) {
  const n = new Character(); await n.init(scene, d.file, d.height || 1.8); n.root.visible = false; n.key = k; npcs[k] = n; step(++ci / Object.keys(CAST).length * 0 + 0);
}
const walkers = await createWalkers(scene, HIGH ? 7 : 3, colliders);
loadedN = 3; step(0);
const rig = new CameraRig(camera);
const weather = new Weather(scene, !HIGH); weather.fogMul = sky.hooks.fogMul; weather.set(prefs.weather);

// ---------- beacon, orbs ----------
const beacon = new THREE.Group();
{
  const mat = new THREE.MeshBasicMaterial({ color: 0xffd98a, transparent: true, opacity: .22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const col = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 40, 20, 1, true), mat); col.position.y = 20; beacon.add(col);
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.1, 2.6, 40), new THREE.MeshBasicMaterial({ color: 0xffd98a, transparent: true, opacity: .8, side: THREE.DoubleSide, fog: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = .08; beacon.add(ring); beacon.visible = false; scene.add(beacon);
}
const orbs = [];
{
  const r = (() => { let s = 99; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  const pool = roadSpots.slice(); const geo = new THREE.IcosahedronGeometry(.35, 1);
  for (let i = 0; i < 10 && pool.length; i++) {
    const [x, z] = pool.splice(Math.floor(r() * pool.length), 1)[0];
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xbfe8ff, fog: false }));
    const halo = new THREE.Mesh(new THREE.SphereGeometry(.75, 12, 8), new THREE.MeshBasicMaterial({ color: 0x7fc4ff, transparent: true, opacity: .25, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    m.add(halo); m.position.set(x, 1.1, z); m.userData = { id: i, t: r() * 6, got: false }; scene.add(m); orbs.push(m);
  }
}

// ---------- game state ----------
const fresh = () => ({ scene: 'opening', pending: 'opening', loc: 'home', trust: 0, clues: [], compassion: 0, orbs: [], history: [], flags: {}, pos: [0, 18], yaw: 0 });
let state = fresh(), mode = 'title';   // title | play | dialog
const save = () => { state.pos = [player.pos.x, player.pos.z]; state.yaw = rig.yaw; lsSet(SAVE_KEY, state); };
function toast(msg, ms = 2200) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('show'), ms); }
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function hud() {
  $('sTrust').textContent = state.trust; $('sClues').textContent = state.clues.length; $('sComp').textContent = state.compassion;
  $('sOrbs').textContent = state.orbs.length + '/' + orbs.length;
}
function applyOrbs() { orbs.forEach(o => { o.userData.got = state.orbs.includes(o.userData.id); o.visible = !o.userData.got; }); }

// ---------- NPC staging ----------
function hideNpcs() { Object.values(npcs).forEach(n => { n.root.visible = false; n.col = null; }); for (let i = colliders.length - 1; i >= 0; i--) if (colliders[i].npc) colliders.splice(i, 1); }
function showCast(list, loc) {
  hideNpcs();
  const fx = -Math.sin(rig.yaw), fz = -Math.cos(rig.yaw);       // camera-forward on the ground
  let ax, az, dx, dz, lx, lz;
  if (loc === 'street') { ax = player.pos.x + fx * 3.2; az = player.pos.z + fz * 3.2; lx = -fz; lz = fx; }
  else { [ax, az] = LOCATIONS[loc].marker; const sg = fz >= 0 ? 1 : -1; ax += 0; az += sg * 3; lx = 1; lz = 0; }   // all story markers sit on z-running roads
  list.forEach((k, i) => {
    const n = npcs[k], sp = (i - (list.length - 1) / 2) * 1.5 + 1.5, px = ax + lx * sp, pz = az + lz * sp;
    n.root.position.set(px, 0, pz); n.root.visible = true; n.play('idle');
    colliders.push({ x: px, z: pz, r: .5, h: 0, npc: true });
  });
}

// ---------- dialogue ----------
const needClue = c => !c.requires || !((c.requires.clues && state.clues.length < c.requires.clues) || (c.requires.trust && state.trust < c.requires.trust) || (c.requires.compassion && state.compassion < c.requires.compassion));
function openScene(id) {
  const sc = story[id]; if (!sc) return;
  state.scene = id; state.pending = null; state.loc = sc.loc === 'street' ? state.loc : sc.loc;
  state.history.push({ id, title: sc.title, chapter: sc.chapter });
  mode = 'dialog'; applyTheme(); input.enabled = false; input.joy.x = input.joy.y = 0; beacon.visible = false;
  showCast(sc.cast, sc.loc);
  $('dChap').textContent = `Chapter ${sc.chapter} · ${sc.chapterName}`; $('dTitle').textContent = sc.title; $('dText').textContent = sc.text;
  $('dNpc').textContent = sc.cast.length ? sc.cast.map(k => CAST[k].name).filter((v, i, a) => a.indexOf(v) === i).join(' · ') : '';
  const box = $('dChoices'); box.innerHTML = '';
  sc.choices.filter(needClue).forEach(c => { const b = document.createElement('button'); b.className = 'choice'; b.textContent = c.label; b.onclick = () => { sound.click(); choose(c); }; box.appendChild(b); });
  $('dialog').classList.add('show'); document.body.classList.add('dlg'); $('dialog').scrollTop = 0; $('dText').scrollTop = 0;
  if (sc.ending) { sound.ending(); } else sound.chime();
  hud(); save();
}
function choose(c) {
  const e = c.effects || {}; let gained = false;
  if (e.trust) state.trust += e.trust; if (e.compassion) state.compassion += e.compassion;
  if (e.clue && !state.clues.includes(e.clue)) { state.clues.push(e.clue); gained = true; }
  if (c.log) state.flags[c.log] = true;
  $('dialog').classList.remove('show'); document.body.classList.remove('dlg'); hud();
  if (c.next === 'home') { state = fresh(); lsSet(SAVE_KEY, null); hideNpcs(); showTitle(); return; }
  mode = 'play'; input.enabled = true; hideNpcsSoon();
  if (gained) { player.once('pick-up', .9); toast('Clue found: ' + e.clue); sound.chime(); }
  queueScene(c.next); save();
}
let npcHideT = 0; function hideNpcsSoon() { npcHideT = 1.2; }
function queueScene(id) {
  state.pending = id; const sc = story[id];
  if (sc.loc === 'street') { setTimeout(() => { if (state.pending === id && mode === 'play') openScene(id); }, 650); return; }
  checkArrive();
}
function checkArrive() {
  if (!state.pending || mode !== 'play') return;
  const sc = story[state.pending], L = LOCATIONS[sc.loc]; if (!L) return;
  const d = Math.hypot(player.pos.x - L.marker[0], player.pos.z - L.marker[1]);
  if (d < 2.8) openScene(state.pending);
}

// ---------- journal / menus ----------
function modal(title, html) { $('mTitle').textContent = title; $('mBody').innerHTML = html; $('modal').classList.add('show'); }
function journal() {
  if (mode === 'title') return;
  const clues = state.clues.map(c => `<li>${esc(c)}</li>`).join('') || '<li>No clues collected yet.</li>';
  const hist = state.history.slice(-14).map(h => `<li><b>Ch.${h.chapter}</b> ${esc(h.title)}</li>`).join('') || '<li>—</li>';
  const goal = state.pending ? `Go to: <b>${esc(LOCATIONS[story[state.pending].loc]?.name || 'the street')}</b>` : 'Explore the city';
  modal('Ren’s Journal', `<p>${goal}</p><p>Trust ${state.trust} · Clues ${state.clues.length} · Compassion ${state.compassion} · Memory fragments ${state.orbs.length}/${orbs.length}</p><h3>Clues</h3><ul>${clues}</ul><h3>Recent scenes</h3><ul>${hist}</ul>`);
}
input.onJournal = journal; $('btnJournal').onclick = journal;
$('mClose').onclick = () => $('modal').classList.remove('show');
$('btnSoundHud').onclick = () => { prefs.sound = !prefs.sound; sound.setOn(prefs.sound); lsSet(PREF_KEY, prefs); $('btnSoundHud').textContent = prefs.sound ? '🔊' : '🔇'; };
$('btnSoundHud').textContent = prefs.sound ? '🔊' : '🔇';
$('btnMenu').onclick = () => modal('Menu', `<div class="row"><button class="choice" id="mSave">Save game</button><button class="choice" id="mTitleBtn">Back to title</button><button class="choice" id="mTheme">${themeLabel()}</button><button class="choice" id="mWeather">${weatherLabel()}</button></div><p class="dim">Controls: WASD / arrows move · Shift run · Space jump · drag mouse to look · J journal. On touch: left thumb moves, right thumb looks.</p>`);
document.addEventListener('click', e => {
  if (e.target.id === 'mTheme') cycleTheme();
  if (e.target.id === 'mWeather') cycleWeather();
  if (e.target.id === 'mSave') { save(); toast('Saved'); $('modal').classList.remove('show'); }
  if (e.target.id === 'mTitleBtn') { save(); $('modal').classList.remove('show'); hideNpcs(); showTitle(); }
});

// ---------- title ----------
function showTitle() {
  mode = 'title'; applyTheme(); input.enabled = false; $('title').classList.remove('hidden'); $('hudTop').classList.add('hidden'); $('mini').classList.add('hidden'); $('controls').classList.add('hidden'); beacon.visible = false;
  $('btnContinue').style.display = lsGet(SAVE_KEY) ? '' : 'none';
  $('btnQuality').textContent = 'Graphics: ' + (HIGH ? 'High' : 'Low (battery saver)');
}
function enterGame() { setTimeout(applyTheme, 0); $('title').classList.add('hidden'); $('hudTop').classList.remove('hidden'); $('mini').classList.remove('hidden'); $('controls').classList.remove('hidden'); mode = 'play'; input.enabled = true; hud(); applyOrbs(); sound.start(); sound.setOn(prefs.sound); }
$('btnBegin').onclick = () => { state = fresh(); player.pos.set(0, 0, 18); player.vel.set(0, 0, 0); rig.yaw = 0; rig.target.set(0, 1.6, 18); enterGame(); lsSet(SAVE_KEY, null); applyOrbs(); setTimeout(() => openScene('opening'), 900); };
$('btnContinue').onclick = () => {
  const s = lsGet(SAVE_KEY); if (!s) return; state = Object.assign(fresh(), s);
  player.pos.set(state.pos[0], 0, state.pos[1]); rig.yaw = state.yaw || 0; rig.target.set(state.pos[0], 1.6, state.pos[1]); enterGame();
  if (state.pending) queueScene(state.pending); else if (story[state.scene]?.ending) { /* ended */ }
};
// Auto theme: the sky follows the story. chapter -> look, endings get their own colours.
const AUTO_CH = { 1: 'crimson', 2: 'blue', 3: 'dusk', 4: 'crimson', 5: 'dusk' };
const AUTO_END = { endingRestore: 'dawn', endingSilence: 'blue', endingNew: 'dawn', endingCompassion: 'dusk' };
function autoThemeKey() { const sc = story[state.scene]; return !sc || mode === 'title' ? 'crimson' : AUTO_END[state.scene] || AUTO_CH[sc.chapter] || 'crimson'; }
function applyTheme() { sky.setTheme(prefs.theme === 'auto' ? autoThemeKey() : prefs.theme); }
function themeLabel() { return 'Theme: ' + (prefs.theme === 'auto' ? 'Story (auto)' : THEMES[prefs.theme].label); }
const WEATHERS = ['rain', 'mist', 'clear'], weatherLabel = () => 'Weather: ' + prefs.weather[0].toUpperCase() + prefs.weather.slice(1);
function cycleWeather() { prefs.weather = WEATHERS[(WEATHERS.indexOf(prefs.weather) + 1) % 3]; lsSet(PREF_KEY, prefs); weather.set(prefs.weather); $('btnWeather').textContent = weatherLabel(); const m = $('mWeather'); if (m) m.textContent = weatherLabel(); sound.click(); }
function cycleTheme() { const all = ['auto', ...THEME_KEYS]; prefs.theme = all[(all.indexOf(prefs.theme) + 1) % all.length]; lsSet(PREF_KEY, prefs); applyTheme(); $('btnTheme').textContent = themeLabel(); const m = $('mTheme'); if (m) m.textContent = themeLabel(); sound.click(); }
$('btnWeather').onclick = cycleWeather; $('btnWeather').textContent = weatherLabel();
$('btnTheme').onclick = cycleTheme; $('btnTheme').textContent = themeLabel();
$('btnQuality').onclick = () => { prefs.quality = HIGH ? 'low' : 'high'; lsSet(PREF_KEY, prefs); location.reload(); };

// ---------- minimap ----------
const mini = $('mini'), mx = mini.getContext('2d'), MS = 224, MR = 44;   // shows +-44 world units around the player, north up
const bg = document.createElement('canvas'); bg.width = bg.height = 1024; {
  const g = bg.getContext('2d'), k = 1024 / 120, c = v => (v + 60) * k;         // world -60..60 -> 0..1024
  g.fillStyle = '#10142a'; g.fillRect(0, 0, 1024, 1024);
  g.fillStyle = '#2b2f4d'; for (let r = -2; r <= 2; r++) { g.fillRect(c(r * 24) - 3 * k, 0, 6 * k, 1024); g.fillRect(0, c(r * 24) - 3 * k, 1024, 6 * k); }
  g.fillStyle = '#3d5a52'; for (const o of colliders) if (o.h) { g.fillRect(c(o.x) - 2.4 * k, c(o.z) - 2.4 * k, 4.8 * k, 4.8 * k); }
  g.fillStyle = '#8a7fb0'; g.beginPath(); g.arc(c(0), c(0), 3 * k, 0, 7); g.fill();
}
function drawMini() {
  const k = MS / (MR * 2), px = player.pos.x, pz = player.pos.z, w = v => [(v[0] - px + MR) * k, (v[1] - pz + MR) * k];
  mx.clearRect(0, 0, MS, MS); const s = 1024 / 120;
  mx.drawImage(bg, (px + 60 - MR) * s, (pz + 60 - MR) * s, MR * 2 * s, MR * 2 * s, 0, 0, MS, MS);
  mx.fillStyle = '#9fd8ff'; for (const o of orbs) if (!o.userData.got) { const [x, y] = w([o.position.x, o.position.z]); mx.beginPath(); mx.arc(x, y, 3, 0, 7); mx.fill(); }
  const p = state.pending && story[state.pending], L = p && LOCATIONS[p.loc];
  if (L) { let [x, y] = w(L.marker); const dx = x - MS / 2, dy = y - MS / 2, d = Math.hypot(dx, dy), lim = MS / 2 - 10; if (d > lim) { x = MS / 2 + dx / d * lim; y = MS / 2 + dy / d * lim; }
    mx.fillStyle = '#ffd98a'; mx.beginPath(); mx.arc(x, y, 7, 0, 7); mx.fill(); mx.strokeStyle = '#000a'; mx.lineWidth = 2; mx.stroke(); }
  // player arrow: rotate with the model's facing
  mx.save(); mx.translate(MS / 2, MS / 2); mx.rotate(Math.PI - player.root.rotation.y); mx.fillStyle = '#ff6f91'; mx.beginPath(); mx.moveTo(0, -9); mx.lineTo(6, 7); mx.lineTo(0, 3); mx.lineTo(-6, 7); mx.closePath(); mx.fill(); mx.restore();
}

// ---------- loop ----------
let vs = 0, miniT = 0;
function viewShift(dt) {
  const want = mode === 'dialog' ? 1 : 0; vs += (want - vs) * Math.min(1, dt * 6);
  const side = innerHeight <= 500 && innerWidth > innerHeight;
  if (vs < 0.002) { if (camera.view && camera.view.enabled) camera.clearViewOffset(); return; }
  const w = innerWidth, h = innerHeight;
  camera.setViewOffset(w, h, side ? w * 0.2 * vs : 0, side ? 0 : h * 0.2 * vs, w, h);
}
const clock = new THREE.Clock(); let t = 0, arrow = $('objArrow');
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05); t += dt;
  const a = input.consume();
  if (mode === 'title') {
    rig.yaw += dt * 0.12; rig.target.set(0, 3, 12); const r = 22; camera.position.set(Math.sin(rig.yaw) * r, 7, 12 + Math.cos(rig.yaw) * r); camera.lookAt(0, 4, 8);
    player.update(dt, { x: 0, y: 0 }, 0, { sprint: false }, colliders, BOUNDS);
  } else {
    const ev = player.update(dt, input.move(), rig.yaw, { sprint: input.sprint, jump: a.jump && input.enabled }, colliders, BOUNDS);
    if (ev.step) sound.step(); if (ev.jumped) sound.jump(); if (ev.landed) sound.land();
    rig.update(dt, player, mode === 'dialog' ? { x: 0, y: 0 } : a.look, colliders);
    if (mode === 'play') {
      checkArrive();
      for (const o of orbs) if (!o.userData.got && Math.hypot(o.position.x - player.pos.x, o.position.z - player.pos.z) < 1.9) {
        o.userData.got = true; o.visible = false; state.orbs.push(o.userData.id); sound.chime(); player.once('pick-up', .8);
        toast(`Memory fragment ${state.orbs.length}/${orbs.length}`);
        if (state.orbs.length === 5 && !state.clues.includes('Moon fragments')) { state.clues.push('Moon fragments'); setTimeout(() => toast('Clue found: Moon fragments'), 1700); }
        hud(); save();
      }
      // objective HUD
      const p = state.pending && story[state.pending], L = p && LOCATIONS[p.loc];
      if (L) {
        beacon.visible = true; beacon.position.set(L.marker[0], 0, L.marker[1]);
        const dx = L.marker[0] - player.pos.x, dz = L.marker[1] - player.pos.z;
        $('objText').textContent = `${L.name} · ${Math.round(Math.hypot(dx, dz))} m`;
        const rx = Math.cos(rig.yaw), rz = -Math.sin(rig.yaw), fx = -Math.sin(rig.yaw), fz = -Math.cos(rig.yaw);
        arrow.style.transform = `rotate(${Math.atan2(dx * rx + dz * rz, dx * fx + dz * fz)}rad)`; $('objective').classList.remove('hidden');
      } else { beacon.visible = false; $('objective').classList.add('hidden'); }
    }
  }
  if (npcHideT > 0) { npcHideT -= dt; if (npcHideT <= 0 && mode === 'play') hideNpcs(); }
  for (const n of Object.values(npcs)) if (n.root.visible) { n.update(dt); n.face(player.pos.x - n.root.position.x, player.pos.z - n.root.position.z, dt, 6); }
  for (const o of orbs) if (o.visible) { o.userData.t += dt; o.position.y = 1.1 + Math.sin(o.userData.t * 2) * .2; o.rotation.y += dt; }
  beacon.children[0].material.opacity = .18 + Math.sin(t * 3) * .05; beacon.children[1].scale.setScalar(1 + Math.sin(t * 3) * .06);
  world.tower.userData.light.intensity = 50 + Math.sin(t * 1.3) * 18;
  if (mode !== 'title' && ((miniT = (miniT + 1) % 3) === 0)) drawMini();
  viewShift(dt);
  updateWalkers(walkers, dt, player);
  weather.update(dt, player.pos);
  sky.update(camera, dt);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
$('loading').style.opacity = 0; setTimeout(() => $('loading').remove(), 700);
showTitle();
window.__game = { sky, walkers, renderer, state: () => state, player, rig, openScene, mode: () => mode, orbs, npcs, LOCATIONS, queueScene, input };
window.__ready = true;
frame();
