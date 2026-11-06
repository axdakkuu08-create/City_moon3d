// Procedural audio (no files needed): night ambience, tower bell, chimes, footsteps.
export class Sound {
  constructor() { this.ctx = null; this.on = true; }
  start() {
    if (this.ctx) { this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const c = this.ctx = new AC(); this.master = c.createGain(); this.master.gain.value = this.on ? 0.5 : 0; this.master.connect(c.destination);
    // drone pad
    const pad = c.createGain(); pad.gain.value = .07; pad.connect(this.master);
    for (const [f, d] of [[55, 0], [82.4, 4], [110.2, -5]]) {
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f; o.detune.value = d; o.connect(pad); o.start();
    }
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = .08; lg.gain.value = .03; lfo.connect(lg); lg.connect(pad.gain); lfo.start();
    // wind
    const len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    let last = 0; for (let i = 0; i < len; i++) { last = (last + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
    const n = c.createBufferSource(); n.buffer = buf; n.loop = true; const bp = c.createBiquadFilter(); bp.type = 'lowpass'; bp.frequency.value = 500;
    const wg = c.createGain(); wg.gain.value = .35; n.connect(bp); bp.connect(wg); wg.connect(this.master); n.start();
    this.noise = buf;
    setInterval(() => this.on && Math.random() < .5 && this.bell(), 26000);
  }
  setOn(v) { this.on = v; if (this.master) this.master.gain.setTargetAtTime(v ? .5 : 0, this.ctx.currentTime, .05); }
  tone(f, dur, type = 'sine', vol = .2, when = 0, slide = 0) {
    if (!this.ctx || !this.on) return; const c = this.ctx, t = c.currentTime + when;
    const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(f + slide, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur); o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + .05);
  }
  chime() { [880, 1318, 1760].forEach((f, i) => this.tone(f, .9, 'sine', .12, i * .09)); }
  click() { this.tone(520, .08, 'triangle', .1); }
  bell() { this.tone(196, 4, 'sine', .25); this.tone(392, 3, 'sine', .1); this.tone(588, 2, 'sine', .05); }
  step() { if (!this.ctx || !this.on) return; const c = this.ctx, s = c.createBufferSource(); s.buffer = this.noise; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 260 + Math.random() * 120;
    const g = c.createGain(); g.gain.setValueAtTime(.22, c.currentTime); g.gain.exponentialRampToValueAtTime(.001, c.currentTime + .09); s.connect(f); f.connect(g); g.connect(this.master); s.start(0, Math.random(), .1); }
  jump() { this.tone(300, .18, 'sine', .1, 0, 200); }
  land() { this.tone(110, .15, 'sine', .15); }
  ending() { [392, 494, 587, 784].forEach((f, i) => this.tone(f, 2.5, 'sine', .12, i * .25)); }
}
