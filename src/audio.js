// Tiny WebAudio synth: no audio files needed, so the game stays small and fully offline.
export class Sound {
  constructor() { this.ctx = null; this.muted = false; this.master = null; }
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const c = this.ctx = new AC(); this.master = c.createGain(); this.master.gain.value = this.muted ? 0 : 0.9; this.master.connect(c.destination);
    // night pad
    const pad = c.createGain(); pad.gain.value = 0.05; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520; pad.connect(lp); lp.connect(this.master);
    [55, 82.4, 110.2, 164.9].forEach((f, i) => { const o = c.createOscillator(); o.type = i % 2 ? 'triangle' : 'sine'; o.frequency.value = f; o.detune.value = (i - 1.5) * 6; const g = c.createGain(); g.gain.value = 0.25;
      const lfo = c.createOscillator(); lfo.frequency.value = 0.05 + i * 0.03; const lg = c.createGain(); lg.gain.value = 0.18; lfo.connect(lg); lg.connect(g.gain); lfo.start();
      o.connect(g); g.connect(pad); o.start(); });
    // wind
    const len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0); let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
    const src = c.createBufferSource(); src.buffer = buf; src.loop = true; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 380; bp.Q.value = 0.6;
    const wg = c.createGain(); wg.gain.value = 0.35; const wl = c.createOscillator(); wl.frequency.value = 0.08; const wlg = c.createGain(); wlg.gain.value = 0.2; wl.connect(wlg); wlg.connect(wg.gain); wl.start();
    src.connect(bp); bp.connect(wg); wg.connect(this.master); src.start();
    this.noise = buf;
  }
  setMuted(m) { this.muted = m; if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.05); }
  _tone(freq, dur, vol, type = 'sine', delay = 0) {
    if (!this.ctx) return; const c = this.ctx, t = c.currentTime + delay; const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = freq; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.05);
  }
  chime() { [659.3, 987.8, 1318.5].forEach((f, i) => this._tone(f, 1.1, 0.07, 'sine', i * 0.09)); }
  bell() { this._tone(196, 3.2, 0.12, 'sine'); this._tone(392.5, 2.4, 0.06, 'sine'); this._tone(591, 1.6, 0.03, 'sine'); }
  choice() { this._tone(520, 0.18, 0.05, 'triangle'); this._tone(780, 0.25, 0.04, 'sine', 0.06); }
  step(run) {
    if (!this.ctx || !this.noise) return; const c = this.ctx; const s = c.createBufferSource(); s.buffer = this.noise; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 700 + Math.random() * 300; f.Q.value = 1.2;
    const g = c.createGain(); const t = c.currentTime; g.gain.setValueAtTime(run ? 0.12 : 0.08, t); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.09); s.connect(f); f.connect(g); g.connect(this.master); s.start(t, Math.random(), 0.1);
  }
}
