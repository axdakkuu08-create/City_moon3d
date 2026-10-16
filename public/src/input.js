// Unified input: keyboard + mouse-drag look, and touch (left = joystick, right = look, buttons).
export class Input {
  constructor(canvas) {
    this.keys = new Set(); this.joy = { x: 0, y: 0 }; this.look = { x: 0, y: 0 };
    this.jump = false; this.interact = false; this.sprintHeld = false; this.sprintToggle = false;
    this.enabled = true; this.isTouch = matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window;
    const k = e => e.code;
    addEventListener('keydown', e => {
      if (e.repeat) return;
      this.keys.add(k(e));
      if (k(e) === 'Space') this.jump = true;
      if (k(e) === 'KeyE' || k(e) === 'Enter') this.interact = true;
      if (k(e) === 'KeyJ') this.onJournal && this.onJournal();
      if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
    });
    addEventListener('keyup', e => this.keys.delete(k(e)));
    addEventListener('blur', () => this.keys.clear());

    // pointer handling
    let joyId = null, lookId = null, jo = null, lp = null;
    const stick = document.getElementById('stick'), knob = document.getElementById('knob');
    const R = 55;
    canvas.addEventListener('pointerdown', e => {
      if (!this.enabled) return;
      canvas.setPointerCapture(e.pointerId);
      if (e.pointerType === 'touch' && e.clientX < innerWidth * 0.5 && joyId === null) {
        joyId = e.pointerId; jo = { x: e.clientX, y: e.clientY };
        stick.style.display = 'block'; stick.style.left = (jo.x - 70) + 'px'; stick.style.top = (jo.y - 70) + 'px'; knob.style.transform = 'translate(0,0)';
      } else if (lookId === null) { lookId = e.pointerId; lp = { x: e.clientX, y: e.clientY }; }
    });
    canvas.addEventListener('pointermove', e => {
      if (e.pointerId === joyId) {
        let dx = e.clientX - jo.x, dy = e.clientY - jo.y; const l = Math.hypot(dx, dy);
        if (l > R) { dx *= R / l; dy *= R / l; }
        this.joy.x = dx / R; this.joy.y = -dy / R; knob.style.transform = `translate(${dx}px,${dy}px)`;
      } else if (e.pointerId === lookId) {
        this.look.x += (e.clientX - lp.x); this.look.y += (e.clientY - lp.y); lp = { x: e.clientX, y: e.clientY };
      }
    });
    const up = e => {
      if (e.pointerId === joyId) { joyId = null; this.joy.x = this.joy.y = 0; stick.style.display = 'none'; }
      if (e.pointerId === lookId) lookId = null;
    };
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);

    const bind = (id, down, upfn) => {
      const el = document.getElementById(id); if (!el) return;
      el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); down(); el.classList.add('on'); });
      const u = e => { upfn && upfn(); el.classList.remove('on'); };
      el.addEventListener('pointerup', u); el.addEventListener('pointerleave', u); el.addEventListener('pointercancel', u);
    };
    bind('btnJump', () => this.jump = true);
    bind('btnAct', () => this.interact = true);
    bind('btnRun', () => { this.sprintToggle = !this.sprintToggle; document.getElementById('btnRun').classList.toggle('toggled', this.sprintToggle); });
    if (this.isTouch) document.body.classList.add('touch');
  }
  // movement vector: x = right, y = forward, magnitude <= 1
  move() {
    if (!this.enabled) return { x: 0, y: 0 };
    let x = this.joy.x, y = this.joy.y;
    const K = this.keys;
    if (K.has('KeyA') || K.has('ArrowLeft')) x -= 1; if (K.has('KeyD') || K.has('ArrowRight')) x += 1;
    if (K.has('KeyW') || K.has('ArrowUp')) y += 1; if (K.has('KeyS') || K.has('ArrowDown')) y -= 1;
    const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
    return { x, y };
  }
  get sprint() { return this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.sprintToggle; }
  consume() { const r = { jump: this.jump, interact: this.interact, look: { ...this.look } }; this.jump = this.interact = false; this.look.x = this.look.y = 0; return r; }
}
