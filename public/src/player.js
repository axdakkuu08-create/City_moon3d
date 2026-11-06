import * as THREE from 'three';
import { spawnAnimated } from './loader.js';

// Third-person controller ported from the Godot demo's feel:
// velocity lerp toward input*speed (acceleration 6), model turns at rotation_speed 12, gravity -30, jump impulse 12.
export const TUNE = { walk: 6.5, run: 11, accel: 6, rotSpeed: 12, gravity: -30, jump: 11, radius: 0.45, height: 1.8 };

export class Character {
  async init(scene, file, height = TUNE.height) {
    const { object, clips } = await spawnAnimated(file);
    this.root = new THREE.Group(); this.model = object; this.root.add(object); scene.add(this.root);
    const box = new THREE.Box3().setFromObject(object); const h = box.max.y - box.min.y || 1;
    object.scale.setScalar(height / h); object.position.y = -box.min.y * (height / h);
    this.mixer = new THREE.AnimationMixer(object); this.actions = {};
    for (const c of clips) this.actions[c.name] = this.mixer.clipAction(c);
    this.current = null; this.play('idle');
    return this;
  }
  play(name, fade = 0.18, once = false) {
    const a = this.actions[name]; if (!a || this.current === a) return;
    a.reset(); a.enabled = true;
    a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity); a.clampWhenFinished = once;
    if (this.current) this.current.crossFadeTo(a, fade, false);
    a.play(); this.current = a; this.currentName = name;
  }
  face(dx, dz, dt, speed = TUNE.rotSpeed) {
    const target = Math.atan2(dx, dz); let d = target - this.root.rotation.y;
    d = Math.atan2(Math.sin(d), Math.cos(d)); this.root.rotation.y += d * Math.min(1, speed * dt);
  }
  update(dt) { this.mixer.update(dt); }
}

export class Player extends Character {
  constructor() { super(); this.vel = new THREE.Vector3(); this.onGround = true; this.locked = false; this.lockT = 0; this.stepT = 0; }
  async init(scene, file) { await super.init(scene, file); this.root.position.set(0, 0, 18); return this; }
  get pos() { return this.root.position; }

  once(name, t = 0.9) { this.lockT = t; this.play(name, 0.1, true); }

  update(dt, mv, camYaw, actions, colliders, bounds) {
    const p = this.root.position;
    // camera-relative input
    const s = Math.sin(camYaw), c = Math.cos(camYaw);
    const fx = -s, fz = -c, rx = c, rz = -s;
    let dx = rx * mv.x + fx * mv.y, dz = rz * mv.x + fz * mv.y;
    const mag = Math.min(1, Math.hypot(mv.x, mv.y));
    if (this.locked || this.lockT > 0) { dx = dz = 0; }
    const speed = actions.sprint ? TUNE.run : TUNE.walk;
    const tx = dx * speed, tz = dz * speed;
    const k = Math.min(1, TUNE.accel * dt);
    this.vel.x += (tx - this.vel.x) * k; this.vel.z += (tz - this.vel.z) * k;
    if (mag < 0.05 && Math.hypot(this.vel.x, this.vel.z) < 1) { this.vel.x = this.vel.z = 0; }
    if (mag > 0.2) this.face(dx, dz, dt);

    this.vel.y += TUNE.gravity * dt;
    let jumped = false;
    if (actions.jump && this.onGround && !this.locked && this.lockT <= 0) { this.vel.y = TUNE.jump; this.onGround = false; jumped = true; }
    p.x += this.vel.x * dt; p.z += this.vel.z * dt; p.y += this.vel.y * dt;
    if (p.y <= 0) { p.y = 0; if (!this.onGround && this.vel.y < -4) this.landed = true; this.vel.y = 0; this.onGround = true; }

    // collide with circles (buildings/trees/npcs); jumping high enough clears small props only
    for (const o of colliders) {
      const ox = p.x - o.x, oz = p.z - o.z, d = Math.hypot(ox, oz), min = o.r + TUNE.radius;
      if (d < min && d > 1e-4) { p.x = o.x + ox / d * min; p.z = o.z + oz / d * min; }
    }
    p.x = Math.max(-bounds, Math.min(bounds, p.x)); p.z = Math.max(-bounds, Math.min(bounds, p.z));

    // animation state
    const hs = Math.hypot(this.vel.x, this.vel.z);
    if (this.lockT > 0) { this.lockT -= dt; if (this.lockT <= 0) { this.current = null; } }
    else if (!this.onGround) this.play(this.vel.y > 0 ? 'jump' : 'fall', 0.1);
    else if (hs > 1.2) {
      this.play(hs > TUNE.walk * 1.2 ? 'sprint' : 'walk');
      this.current.timeScale = THREE.MathUtils.clamp(hs / (hs > TUNE.walk * 1.2 ? TUNE.run : TUNE.walk), 0.6, 1.3);
    } else this.play('idle');
    this.stepEvt = false;
    if (this.onGround && hs > 1.2) { this.stepT += dt * hs; if (this.stepT > 2.2) { this.stepT = 0; this.stepEvt = true; } }
    const jumpedNow = jumped, landed = this.landed; this.landed = false;
    super.update(dt);
    return { jumped: jumpedNow, landed, step: this.stepEvt };
  }
}

export class CameraRig {
  constructor(camera) { this.cam = camera; this.yaw = 0; this.pitch = 0.32; this.dist = 7.5; this.pos = new THREE.Vector3(0, 6, 28); this.target = new THREE.Vector3(); }
  update(dt, player, look, colliders) {
    this.yaw -= look.x * 0.006; this.pitch = THREE.MathUtils.clamp(this.pitch + look.y * 0.004, 0.08, 1.05);
    const t = new THREE.Vector3(player.pos.x, player.pos.y + 1.6, player.pos.z);
    this.target.lerp(t, 1 - Math.exp(-14 * dt));
    let d = this.dist;
    const dir = new THREE.Vector3(Math.sin(this.yaw) * Math.cos(this.pitch), Math.sin(this.pitch), Math.cos(this.yaw) * Math.cos(this.pitch));
    for (; d > 1.6; d -= 0.5) {
      const x = this.target.x + dir.x * d, y = this.target.y + dir.y * d, z = this.target.z + dir.z * d;
      if (y > 6.5) break;
      if (!colliders.some(o => o.h !== 0 && Math.hypot(x - o.x, z - o.z) < o.r + 0.4)) break;
    }
    const want = this.target.clone().addScaledVector(dir, d); want.y = Math.max(want.y, 0.5);
    this.pos.lerp(want, 1 - Math.exp(-18 * dt));
    this.cam.position.copy(this.pos); this.cam.lookAt(this.target);
  }
}
