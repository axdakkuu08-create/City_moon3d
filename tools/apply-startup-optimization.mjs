import fs from 'node:fs';

const worldPath = 'public/src/world.js';
const mainPath = 'public/src/main.js';
const walkersPath = 'public/src/walkers.js';

const read = p => fs.readFileSync(p, 'utf8');
const write = (p, s) => fs.writeFileSync(p, s);
const must = (s, needle, label) => {
  if (!s.includes(needle)) throw new Error(`Patch anchor not found: ${label}`);
};

// ---------- world.js: yield during city construction and static merging ----------
let world = read(worldPath);
must(world, "export async function buildWorld(scene, onProgress, hooks) {", 'world buildWorld');
must(world, "  const jobs = [];", 'world jobs');
must(world, "  await Promise.all(jobs);\n  mergeStatic(staticGroup, scene, hooks);", 'world job wait');
must(world, "function mergeStatic(group, scene, hooks) {", 'world mergeStatic');

world = world.replace(
  "export async function buildWorld(scene, onProgress, hooks) {\n  const rand = rng(7);",
  "const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve));\n\nexport async function buildWorld(scene, onProgress, hooks) {\n  const rand = rng(7);"
);
world = world.replace(
  "  await preload(['roads/road-straight.glb', 'roads/road-crossroad.glb', 'roads/light-square.glb', 'roads/light-curved.glb',\n    'buildings/tree-large.glb', 'buildings/tree-small.glb', ...bt], onProgress);",
  "  await preload(['roads/road-straight.glb', 'roads/road-crossroad.glb', 'roads/light-square.glb', 'roads/light-curved.glb',\n    'buildings/tree-large.glb', 'buildings/tree-small.glb', ...bt], p => onProgress && onProgress(p * 0.2));"
);
world = world.replace(
  "  const jobs = [];",
  "  const jobs = [];\n  const totalTiles = (N + 1) * (N + 1);\n  let builtTiles = 0;\n  const queue = promise => jobs.push(promise);\n  const reportTile = () => { builtTiles++; if (onProgress) onProgress(0.2 + builtTiles / totalTiles * 0.55); };"
);
world = world.replaceAll("jobs.push(add(", "queue(add(");
world = world.replaceAll("jobs.push(add(", "queue(add(");
// The previous replacements intentionally only alter the call prefix. Add progress to each resolved spawn.
world = world.replaceAll(").then(o => { o.userData.tint", ").then(o => { reportTile(); o.userData.tint");
world = world.replaceAll("jobs.push(add('buildings/tree-large.glb', x, z, rand() * 6, 1.2));", "queue(add('buildings/tree-large.glb', x, z, rand() * 6, 1.2).then(o => { reportTile(); return o; }));");
world = world.replaceAll("jobs.push(add('buildings/tree-small.glb', x, z));", "queue(add('buildings/tree-small.glb', x, z).then(o => { reportTile(); return o; }));");
world = world.replaceAll("jobs.push(add('roads/road-crossroad.glb', x, z));", "queue(add('roads/road-crossroad.glb', x, z).then(o => { reportTile(); return o; }));");
world = world.replaceAll("jobs.push(add('roads/road-straight.glb', x, z, Math.PI / 2));", "queue(add('roads/road-straight.glb', x, z, Math.PI / 2).then(o => { reportTile(); return o; }));");
world = world.replaceAll("jobs.push(add('roads/road-straight.glb', x, z, 0));", "queue(add('roads/road-straight.glb', x, z, 0).then(o => { reportTile(); return o; }));");
// Street lamps are extra jobs and should also be chunked/yielded rather than added to the same 289-job burst.
world = world.replace(
  "  const lights = [];\n  for (let a = 0; a < ROADS; a++) for (let b = 0; b < ROADS; b++) jobs.push(add('roads/light-square.glb', tile(a * BLOCK) + SC * .4, tile(b * BLOCK) + SC * .4, 0, 1));\n  await Promise.all(jobs);\n  mergeStatic(staticGroup, scene, hooks);",
  "  const lights = [];\n  for (let a = 0; a < ROADS; a++) for (let b = 0; b < ROADS; b++) queue(add('roads/light-square.glb', tile(a * BLOCK) + SC * .4, tile(b * BLOCK) + SC * .4, 0, 1));\n\n  // Limit clone work and yield between batches so the WebView can paint the title/progress UI.\n  for (let i = 0; i < jobs.length; i += 12) {\n    await Promise.all(jobs.slice(i, i + 12));\n    await nextFrame();\n  }\n  if (onProgress) onProgress(0.78);\n  await mergeStatic(staticGroup, scene, hooks, nextFrame, onProgress);\n  if (onProgress) onProgress(0.92);"
);
// Because the generic prefix replacement can miss the road/tree branches after earlier edits, validate all jobs are gone.
if (world.includes('jobs.push(')) throw new Error('Unconverted world job queue call remains');

world = world.replace(
  "function mergeStatic(group, scene, hooks) {\n  group.updateMatrixWorld(true);",
  "async function mergeStatic(group, scene, hooks, nextFrame = () => Promise.resolve(), onProgress) {\n  group.updateMatrixWorld(true);"
);
world = world.replace(
  "  group.traverse(o => {\n    if (!o.isMesh) return;",
  "  const meshes = [];\n  group.traverse(o => { if (o.isMesh) meshes.push(o); });\n  for (let mi = 0; mi < meshes.length; mi++) {\n    const o = meshes[mi];"
);
world = world.replace(
  "    byMat.get(key).geos.push(g);\n  });\n  let merged = 0;\n  for (const { mat, geos } of byMat.values()) {",
  "    byMat.get(key).geos.push(g);\n    if ((mi + 1) % 40 === 0) { if (onProgress) onProgress(0.78 + mi / meshes.length * 0.08); await nextFrame(); }\n  }\n  let merged = 0;\n  for (const { mat, geos } of byMat.values()) {"
);
world = world.replace(
  "    scene.add(m); merged += geos.length;\n  }\n  scene.remove(group);",
  "    scene.add(m); merged += geos.length;\n    await nextFrame();\n  }\n  scene.remove(group);"
);
write(worldPath, world);

// ---------- main.js: paint title before heavy work and load characters with bounded parallelism ----------
let main = read(mainPath);
must(main, "// ---------- load ----------", 'main load section');
must(main, "const world = await buildWorld(scene, p => step(p), sky.hooks); loadedN = 1;", 'main world load');
must(main, "for (const [k, d] of Object.entries(CAST)) {", 'main cast loop');
must(main, "$('loading').style.opacity = 0; setTimeout(() => $('loading').remove(), 700);", 'main loading removal');

main = main.replace(
  "const bar = document.querySelector('#bar span');\nlet loadedN = 0; const step = f => { bar.style.width = Math.min(100, (loadedN + f) * 100 / 3) + '%'; };\nconst world = await buildWorld(scene, p => step(p), sky.hooks); loadedN = 1;",
  "const bar = document.querySelector('#bar span');\nconst startupPct = document.querySelector('#startupPct');\nconst step = f => { const pct = Math.round(Math.max(0, Math.min(1, f)) * 100); bar.style.width = pct + '%'; if (startupPct) startupPct.textContent = pct + '%'; };\n\n// Let the browser paint the title screen before the expensive city build begins.\nawait new Promise(resolve => requestAnimationFrame(resolve));\n$('loading').style.opacity = 0; $('loading').style.pointerEvents = 'none';\nconst world = await buildWorld(scene, p => step(p), sky.hooks); step(0.92);"
);
main = main.replace(
  "const player = new Player(); await player.init(scene, PLAYER_FILE); loadedN = 2;\nconst npcs = {}; let ci = 0;\nfor (const [k, d] of Object.entries(CAST)) {\n  const n = new Character(); await n.init(scene, d.file, d.height || 1.8); n.root.visible = false; n.key = k; npcs[k] = n; step(++ci / Object.keys(CAST).length * 0 + 0);\n}\nconst walkers = await createWalkers(scene, HIGH ? 7 : 3, colliders);\nloadedN = 3; step(0);",
  "const player = new Player(); await player.init(scene, PLAYER_FILE); step(0.95);\nconst npcs = {};\nconst castEntries = Object.entries(CAST);\nfor (let i = 0; i < castEntries.length; i += 3) {\n  await Promise.all(castEntries.slice(i, i + 3).map(async ([k, d]) => {\n    const n = new Character(); await n.init(scene, d.file, d.height || 1.8); n.root.visible = false; n.key = k; npcs[k] = n;\n  }));\n  await new Promise(resolve => requestAnimationFrame(resolve));\n  step(0.95 + 0.02 * Math.min(1, (i + 3) / castEntries.length));\n}\nconst walkers = await createWalkers(scene, HIGH ? 7 : 3, colliders);\nstep(1);"
);
main = main.replace(
  "$('loading').style.opacity = 0; setTimeout(() => $('loading').remove(), 700);",
  "$('loading').style.opacity = 0; setTimeout(() => $('loading').remove(), 350);"
);
write(mainPath, main);

// ---------- walkers.js: load ambient characters in small parallel batches ----------
let walkers = read(walkersPath);
must(walkers, "  for (let i = 0; i < count; i++) {\n    const c = new Character(); await c.init", 'walker loop');
walkers = walkers.replace(
  "  for (let i = 0; i < count; i++) {\n    const c = new Character(); await c.init(scene, `characters/character-${FILES[i % FILES.length]}.glb`, 1.7 + (i % 3) * 0.05);\n    const w = { c, axis: Math.random() < .5 ? 'x' : 'z', line: Math.floor(rnd(-2, 3)), pos: rnd(-LIM, LIM), dir: Math.random() < .5 ? 1 : -1, lane: Math.random() < .5 ? 1.9 : -1.9, speed: rnd(1.4, 2.0), wait: 0,\n      col: { x: 0, z: 0, r: .42, h: 0, walker: true } };\n    colliders.push(w.col); list.push(w); place(w, 0);\n  }",
  "  // Keep a small concurrency window: enough parallelism to hide network/decode latency without cloning every walker at once.\n  for (let i = 0; i < count; i += 3) {\n    const batch = [];\n    for (let j = i; j < Math.min(count, i + 3); j++) {\n      batch.push((async () => {\n        const c = new Character(); await c.init(scene, `characters/character-${FILES[j % FILES.length]}.glb`, 1.7 + (j % 3) * 0.05);\n        const w = { c, axis: Math.random() < .5 ? 'x' : 'z', line: Math.floor(rnd(-2, 3)), pos: rnd(-LIM, LIM), dir: Math.random() < .5 ? 1 : -1, lane: Math.random() < .5 ? 1.9 : -1.9, speed: rnd(1.4, 2.0), wait: 0,\n          col: { x: 0, z: 0, r: .42, h: 0, walker: true } };\n        colliders.push(w.col); list.push(w); place(w, 0);\n      })());\n    }\n    await Promise.all(batch);\n    await new Promise(resolve => requestAnimationFrame(resolve));\n  }"
);
write(walkersPath, walkers);

console.log('Startup optimization patch applied.');
