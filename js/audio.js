/* Rith Dearg — Web Audio synthesiser: sound cues and a looping chiptune, no audio files. */

class Synth {
  constructor() {
    this.ctx = null; this.master = null; this.musicGain = null; this.noiseBuf = null;
    this.muted = Store.get('rd_muted', false);
    this.unlocked = false; /* browsers only allow audio after a user gesture */
    this.music = { playing: false, timer: null, step: 0, nextTime: 0, tempo: 0.19, variant: 'play' };
  }
  ensure() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); return true; }
    if (!this.unlocked) return false;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 1;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.16;
    this.musicGain.connect(this.master);
    const len = this.ctx.sampleRate * 1.5;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }
  setMuted(m) {
    this.muted = m; Store.set('rd_muted', m);
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.02);
  }
  toggleMuted() { this.setMuted(!this.muted); return this.muted; }

  /* --- building blocks --- */
  tone(freq, dur, type = 'square', vol = 0.06, opts = {}) {
    if (!this.ensure()) return;
    const c = this.ctx, t0 = c.currentTime + (opts.delay || 0);
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (opts.slideTo) o.frequency.exponentialRampToValueAtTime(opts.slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(0.02, dur));
    o.connect(g).connect(opts.dest || this.master);
    o.start(t0); o.stop(t0 + dur + 0.03);
  }
  noise(dur, vol = 0.05, filterFreq = 1200, type = 'bandpass', delay = 0, dest) {
    if (!this.ensure()) return;
    const c = this.ctx, t0 = c.currentTime + delay;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = filterFreq; f.Q.value = 0.8;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f).connect(g).connect(dest || this.master);
    s.start(t0, Math.random() * 0.8); s.stop(t0 + dur + 0.02);
  }

  /* --- cues --- */
  jump() { this.tone(420, 0.14, 'square', 0.05, { slideTo: 880 }); }
  swim() { this.noise(0.18, 0.05, 900, 'lowpass'); this.tone(300, 0.1, 'sine', 0.03, { slideTo: 520 }); }
  splash() { this.noise(0.35, 0.09, 700, 'lowpass'); this.tone(220, 0.25, 'sine', 0.04, { slideTo: 90 }); }
  land() { this.noise(0.06, 0.03, 300, 'lowpass'); }
  hit() { this.noise(0.12, 0.08, 500, 'lowpass'); this.tone(180, 0.18, 'sawtooth', 0.06, { slideTo: 70 }); }
  acorn() { this.tone(988, 0.07, 'triangle', 0.05); this.tone(1319, 0.1, 'triangle', 0.05, { delay: 0.06 }); }
  collect() { [660, 880, 1320].forEach((f, i) => this.tone(f, 0.09, 'triangle', 0.05, { delay: i * 0.05 })); }
  power() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.12, 'square', 0.04, { delay: i * 0.06 })); }
  attack() { this.noise(0.09, 0.07, 2200, 'bandpass'); this.tone(500, 0.06, 'square', 0.03, { slideTo: 260 }); }
  ui() { this.tone(720, 0.05, 'triangle', 0.04); }
  checkpoint() { [784, 988, 1175].forEach((f, i) => this.tone(f, 0.14, 'sine', 0.05, { delay: i * 0.08 })); }
  enemyDown() { this.tone(300, 0.14, 'square', 0.05, { slideTo: 110 }); this.noise(0.1, 0.05, 1500); }
  bossRoar() { this.tone(110, 0.6, 'sawtooth', 0.09, { slideTo: 55 }); this.noise(0.5, 0.08, 250, 'lowpass'); }
  bossHit() { this.tone(240, 0.2, 'sawtooth', 0.07, { slideTo: 120 }); this.noise(0.15, 0.08, 900); }
  fanfare() { [587, 740, 880, 1175, 880, 1175].forEach((f, i) => this.tone(f, 0.18, 'square', 0.05, { delay: i * 0.11 })); }
  gameOverCue() { [440, 415, 392, 330].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.06, { delay: i * 0.22 })); }
  lifeLost() { this.tone(330, 0.25, 'square', 0.05, { slideTo: 165 }); }

  /* --- music: a jig-flavoured chiptune loop in D dorian, scheduled a little ahead of time --- */
  startMusic(variant = 'play') {
    if (!this.ensure()) return;
    const m = this.music;
    if (m.playing && m.variant === variant) return;
    this.stopMusic();
    m.playing = true; m.variant = variant; m.step = 0;
    m.tempo = variant === 'title' ? 0.24 : 0.19;
    m.nextTime = this.ctx.currentTime + 0.1;
    m.timer = setInterval(() => this.scheduleMusic(), 60);
  }
  stopMusic() {
    const m = this.music;
    if (m.timer) clearInterval(m.timer);
    m.timer = null; m.playing = false;
  }
  scheduleMusic() {
    const m = this.music, c = this.ctx;
    if (!m.playing || !c) return;
    while (m.nextTime < c.currentTime + 0.25) {
      this.playStep(m.step, m.nextTime, m.variant);
      m.step = (m.step + 1) % SONG.lead.length;
      m.nextTime += m.tempo;
    }
  }
  playStep(step, t, variant) {
    const c = this.ctx, dur = this.music.tempo;
    const lead = SONG.lead[step], bass = SONG.bass[step];
    const leadVol = variant === 'title' ? 0.22 : 0.3;
    if (lead) {
      const f = NOTE[lead];
      [0, 1].forEach(k => {
        const o = c.createOscillator(), g = c.createGain();
        o.type = variant === 'title' ? 'triangle' : 'square';
        o.frequency.value = f * (k ? 1.004 : 1);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(leadVol * 0.5, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.95);
        o.connect(g).connect(this.musicGain);
        o.start(t); o.stop(t + dur);
      });
    }
    if (bass) {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'triangle'; o.frequency.value = NOTE[bass];
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.5, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 2.6);
      o.connect(g).connect(this.musicGain);
      o.start(t); o.stop(t + dur * 2.7);
    }
    if (variant !== 'title') {
      const accent = step % 6 === 0 || step % 6 === 3;
      this.noise(accent ? 0.07 : 0.035, accent ? 0.16 : 0.07, accent ? 3000 : 6000, 'highpass', t - c.currentTime, this.musicGain);
    }
  }
}

const NOTE = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, B5: 987.77,
  C6: 1046.5, D6: 1174.66,
};
/* 8 bars of 6 quavers each (6/8 jig). Empty strings are rests. */
const SONG = {
  lead: [
    'D5', 'F5', 'A5', 'A5', 'G5', 'F5',
    'E5', 'G5', 'B5', 'B5', 'A5', 'G5',
    'D5', 'F5', 'A5', 'D6', 'C6', 'A5',
    'G5', 'F5', 'E5', 'D5', '', '',
    'A5', 'A5', 'G5', 'F5', 'E5', 'D5',
    'E5', 'E5', 'F5', 'G5', 'A5', 'B5',
    'C6', 'B5', 'A5', 'G5', 'F5', 'E5',
    'F5', 'E5', 'D5', 'D5', '', '',
  ],
  bass: [
    'D3', '', '', 'D3', '', '',
    'E3', '', '', 'E3', '', '',
    'D3', '', '', 'D3', '', '',
    'G3', '', '', 'A3', '', '',
    'F3', '', '', 'F3', '', '',
    'E3', '', '', 'E3', '', '',
    'C3', '', '', 'A3', '', '',
    'D3', '', '', 'D3', '', '',
  ],
};

const SND = new Synth();
