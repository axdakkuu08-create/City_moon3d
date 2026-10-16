import * as THREE from 'three';

// Rain: one LineSegments draw call, animated entirely in the vertex shader around the player.
// Modes: clear | rain | mist (mist thickens the fog). Count drops on low graphics.
export class Weather {
  constructor(scene, low) {
    const N = low ? 600 : 1800, pos = new Float32Array(N * 6), aTop = new Float32Array(N * 2), seed = new Float32Array(N * 2);
    for (let i = 0; i < N; i++) {
      const x = Math.random() * 44 - 22, y = Math.random() * 26, z = Math.random() * 44 - 22, s = Math.random();
      for (let k = 0; k < 2; k++) { pos.set([x, y, z], i * 6 + k * 3); aTop[i * 2 + k] = k; seed[i * 2 + k] = s; }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aTop', new THREE.BufferAttribute(aTop, 1)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    this.u = { uT: { value: 0 }, uC: { value: new THREE.Vector3() }, uA: { value: 0 } };
    this.mesh = new THREE.LineSegments(g, new THREE.ShaderMaterial({
      uniforms: this.u, transparent: true, depthWrite: false,
      vertexShader: `uniform float uT; uniform vec3 uC; attribute float aTop; attribute float aSeed; varying float vA;
        void main(){ float H=26.; float sp=22.+aSeed*8.; float y=mod(position.y - uT*sp, H);
          vec3 p=vec3(position.x, y, position.z); p.xz = mod(p.xz - uC.xz + 22., 44.) - 22.;   // wrap around player
          p += vec3(uC.x, 0., uC.z); p.y += max(uC.y-1.,0.) ; p.y -= aTop*1.3; p.x -= aTop*.18;
          vA = (1.-aTop)*.65 + .1; gl_Position = projectionMatrix*viewMatrix*vec4(p,1.); }`,
      fragmentShader: 'uniform float uA; varying float vA; void main(){ gl_FragColor=vec4(.75,.85,1.,vA*uA); }'
    }));
    this.mesh.frustumCulled = false; this.mesh.visible = false; scene.add(this.mesh);
    this.mode = 'clear'; this.fogMul = { value: 1 }; this.fogTarget = 1; this.alpha = 0; this.alphaT = 0;
  }
  set(mode) { this.mode = mode; this.alphaT = mode === 'rain' ? 1 : 0; this.fogTarget = mode === 'mist' ? 0.38 : mode === 'rain' ? 0.8 : 1; }
  update(dt, center) {
    this.u.uT.value += dt; this.u.uC.value.copy(center);
    this.alpha += (this.alphaT - this.alpha) * Math.min(1, dt * 1.5); this.u.uA.value = this.alpha; this.mesh.visible = this.alpha > 0.02;
    this.fogMul.value += (this.fogTarget - this.fogMul.value) * Math.min(1, dt * 1.2);
  }
}
