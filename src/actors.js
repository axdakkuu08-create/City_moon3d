import * as THREE from 'three';
import { clone, animationsOf } from './assets.js';

// A Kenney mini character with its animation set. Faces +Z at rotation 0.
export class Actor {
  constructor(key, height = 1.8, opts = {}) {
    this.key = key;
    this.group = new THREE.Group();
    this.model = clone('chars/' + key);
    const box = new THREE.Box3().setFromObject(this.model);
    const size = box.getSize(new THREE.Vector3());
    this.scale = height / size.y;
    this.model.scale.setScalar(this.scale);
    this.model.position.y = -box.min.y * this.scale;
    this.group.add(this.model);
    this.model.traverse(o => { if (o.isMesh) { o.castShadow = !!opts.shadow; o.frustumCulled = false; } });
    this.mixer = new THREE.AnimationMixer(this.model);
    this.actions = {};
    for (const clip of animationsOf('chars/' + key)) this.actions[clip.name] = this.mixer.clipAction(clip);
    this.current = null; this.height = height;
    this.yaw = 0; this.vel = new THREE.Vector3();
    this.play('idle');
  }
  play(name, { fade = 0.18, once = false, speed = 1 } = {}) {
    const a = this.actions[name]; if (!a || this.current === name) return;
    const prev = this.actions[this.current];
    a.reset(); a.setEffectiveTimeScale(speed); a.setEffectiveWeight(1);
    a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity); a.clampWhenFinished = once;
    a.play(); if (prev) prev.crossFadeTo(a, fade, false);
    this.current = name;
  }
  update(dt) { this.mixer.update(dt); }
  get position() { return this.group.position; }
  faceToward(x, z, dt, rate = 10) {
    const target = Math.atan2(x - this.group.position.x, z - this.group.position.z);
    this.yaw = lerpAngle(this.yaw, target, 1 - Math.exp(-rate * dt)); this.group.rotation.y = this.yaw;
  }
  setYaw(y) { this.yaw = y; this.group.rotation.y = y; }
}
export function lerpAngle(a, b, t) { let d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; return a + d * t; }
