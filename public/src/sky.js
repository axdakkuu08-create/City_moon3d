import * as THREE from 'three';
import { THEMES } from './themes.js';

// Night sky + lighting that can blend smoothly between colour themes.
export function setupSky(scene, shadows = true, themeKey = 'crimson') {
  scene.fog = new THREE.Fog(0x1a1530, 40, 190);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, hor: { value: new THREE.Color() } },
    vertexShader: 'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'uniform vec3 top,mid,hor;varying vec3 p;void main(){float h=normalize(p).y;vec3 c=mix(hor,mid,smoothstep(0.,.25,h));c=mix(c,top,smoothstep(.2,.8,h));gl_FragColor=vec4(c,1.);}'
  }));
  scene.add(dome);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(28, 32, 24), new THREE.MeshBasicMaterial({ fog: false }));
  moon.position.set(-150, 150, -280); scene.add(moon);
  const glow = new THREE.Mesh(new THREE.SphereGeometry(48, 24, 16), new THREE.MeshBasicMaterial({ transparent: true, fog: false, depthWrite: false }));
  glow.position.copy(moon.position); scene.add(glow);
  const n = 700, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, e = Math.random() * 1.2 + .15, r = 380; pos[i * 3] = Math.cos(a) * Math.cos(e) * r; pos[i * 3 + 1] = Math.sin(e) * r; pos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r; }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, fog: false, transparent: true }));
  scene.add(stars);
  const hemi = new THREE.HemisphereLight(0x7f8fd8, 0x2a1d33, 0.9); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xf2a2b8, 1.4); sun.position.set(-60, 90, -80); sun.castShadow = shadows;
  sun.shadow.mapSize.set(2048, 2048); const s = sun.shadow.camera; s.left = -90; s.right = 90; s.top = 90; s.bottom = -90; s.near = 10; s.far = 300; sun.shadow.bias = -0.0004; scene.add(sun);
  const gmat = new THREE.MeshStandardMaterial({ roughness: 1 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), gmat); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; ground.receiveShadow = true; scene.add(ground);

  // --- theme blending ---
  const COL = ['domeTop', 'domeMid', 'domeHor', 'fog', 'moon', 'halo', 'hemiSky', 'hemiGnd', 'sun', 'ground', 'bld', 'lamp'];
  const NUM = ['fogNear', 'fogFar', 'haloA', 'hemiI', 'sunI', 'exposure', 'win', 'stars'];
  const cur = {}, tgt = {};
  const load = (o, t) => { for (const k of COL) o[k] = new THREE.Color(t[k]); for (const k of NUM) o[k] = t[k]; };
  load(cur, THEMES[themeKey]); load(tgt, THEMES[themeKey]);
  const hooks = { buildingMat: [], winUniform: { value: 1 }, lamps: [], renderer: null, fogMul: { value: 1 }, glow: [] };
  function paint() {
    dome.material.uniforms.top.value.copy(cur.domeTop); dome.material.uniforms.mid.value.copy(cur.domeMid); dome.material.uniforms.hor.value.copy(cur.domeHor);
    scene.background = cur.domeMid; scene.fog.color.copy(cur.fog); scene.fog.near = cur.fogNear * hooks.fogMul.value; scene.fog.far = cur.fogFar * hooks.fogMul.value;
    moon.material.color.copy(cur.moon); glow.material.color.copy(cur.halo); glow.material.opacity = cur.haloA;
    hemi.color.copy(cur.hemiSky); hemi.groundColor.copy(cur.hemiGnd); hemi.intensity = cur.hemiI; sun.color.copy(cur.sun); sun.intensity = cur.sunI;
    gmat.color.copy(cur.ground); stars.material.opacity = cur.stars * .9; stars.visible = cur.stars > .02;
    hooks.winUniform.value = cur.win; for (const m of hooks.buildingMat) m.color.copy(cur.bld); for (const l of hooks.lamps) l.color.copy(cur.lamp);
    if (hooks.renderer) hooks.renderer.toneMappingExposure = cur.exposure;
    for (const g of hooks.glow) { g.material.color.copy(cur.lamp); g.material.opacity = Math.min(1, .15 + cur.win * .6); g.visible = cur.win > .05; }
  }
  paint();
  return {
    sun, hooks, moon, cur,
    setTheme(key, instant = false) { load(tgt, THEMES[key]); if (instant) { load(cur, THEMES[key]); paint(); } },
    update(cam, dt = 0.016) {
      dome.position.copy(cam.position); stars.position.copy(cam.position);
      const k = 1 - Math.exp(-dt * 1.6);
      for (const c of COL) cur[c].lerp(tgt[c], k);
      for (const c of NUM) cur[c] += (tgt[c] - cur[c]) * k;
      paint();
    }
  };
}
