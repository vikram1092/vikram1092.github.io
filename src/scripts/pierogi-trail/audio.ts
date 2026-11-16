import type { Game, GameEvent } from "./model";

const STORAGE_KEY = "pierogi-trail-audio-v1";
const EIGHTH = 60 / 104 / 2;
const BAR = EIGHTH * 8;
const SONG_LENGTH = BAR * 32;
const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

// An original, unhurried G-major trail tune. Zeroes leave room between phrases.
const MELODY = [
  [71, 0, 74, 76, 74, 0, 71, 69],
  [67, 0, 69, 71, 69, 0, 0, 0],
  [67, 0, 71, 74, 76, 0, 74, 71],
  [69, 0, 66, 69, 74, 0, 0, 0],
  [71, 0, 74, 76, 79, 0, 76, 74],
  [76, 0, 74, 71, 69, 0, 67, 0],
  [69, 0, 71, 69, 66, 0, 69, 0],
  [67, 0, 0, 0, 0, 0, 0, 0],
  [76, 0, 79, 0, 78, 76, 74, 0],
  [76, 0, 74, 71, 67, 0, 0, 0],
  [71, 0, 74, 0, 71, 69, 67, 0],
  [69, 0, 74, 0, 78, 0, 0, 0],
  [76, 0, 74, 71, 69, 0, 67, 0],
  [71, 0, 69, 67, 64, 0, 67, 0],
  [69, 0, 71, 74, 69, 0, 66, 0],
  [67, 0, 0, 0, 0, 0, 0, 0],
];
const CHORDS = [
  [43, 55, 59, 62], [48, 55, 60, 64], [40, 55, 59, 64], [38, 54, 57, 62],
  [43, 55, 59, 62], [48, 55, 60, 64], [38, 54, 57, 62], [43, 55, 59, 62],
  [40, 55, 59, 64], [48, 55, 60, 64], [43, 55, 59, 62], [38, 54, 57, 62],
  [48, 55, 60, 64], [40, 55, 59, 64], [38, 54, 57, 62], [43, 55, 59, 62],
];

/** Render once, then use sample-accurate looping without a timer per note. */
async function makeSong() {
  const context = new OfflineAudioContext(1, Math.ceil(SONG_LENGTH * 22050), 22050);
  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 2100;
  filter.Q.value = 0.45;
  filter.connect(context.destination);
  const pulse = context.createPeriodicWave(
    new Float32Array(6), new Float32Array([0, 1, 0, 0.22, 0, 0.08]),
  );
  function note(midi: number, at: number, length: number, volume: number, lead = false) {
    const oscillator = context.createOscillator(), gain = context.createGain();
    if (lead) oscillator.setPeriodicWave(pulse);
    else oscillator.type = "triangle";
    oscillator.frequency.value = hz(midi);
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(volume, at + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
    gain.gain.linearRampToValueAtTime(0, at + length + 0.02);
    oscillator.connect(gain).connect(filter);
    oscillator.start(at);
    oscillator.stop(at + length + 0.025);
  }
  for (let bar = 0; bar < 32; bar++) {
    const chord = CHORDS[bar % 16];
    const start = bar * BAR;
    MELODY[bar % 16].forEach((midi, beat) => {
      if (midi) note(midi, start + beat * EIGHTH, EIGHTH * 1.35, 0.12, true);
    });
    // Soft triangle bass and offbeat plucks give a galloping, handheld-game feel.
    for (const beat of [0, 4])
      note(chord[0] + (beat === 4 ? 7 : 0), start + beat * EIGHTH, EIGHTH * 1.7, 0.105);
    for (const beat of [2, 6]) {
      note(chord[1], start + beat * EIGHTH, EIGHTH * 0.8, 0.035);
      note(chord[2], start + beat * EIGHTH, EIGHTH * 0.8, 0.028);
    }
    // A lighter second pass makes the loop a full 74-second arrangement.
    if (bar >= 16 && bar % 4 !== 3)
      note(chord[3] + 12, start + 7 * EIGHTH, EIGHTH * 0.65, 0.026);
  }
  return context.startRendering();
}

export class TrailAudio {
  music = true;
  sfx = true;
  available = true;
  private context?: AudioContext;
  private master?: GainNode;
  private filter?: BiquadFilterNode;
  private song?: AudioBuffer;
  private track?: { source: AudioBufferSourceNode; gain: GainNode; started: number };
  private offset = 0;
  private mode: Game["mode"] = "ready";
  private voices = new Map<OscillatorNode, GainNode>();
  private suspendTimer?: number;
  private lastEffect = -Infinity;
  private lastCollect = -Infinity;
  private lastBump = -Infinity;
  private flourishUntil = 0;
  private collectNote = 0;
  private restore = { music: true, sfx: true };

  constructor(private changed: () => void) {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
      if (typeof saved?.music === "boolean") this.music = saved.music;
      if (typeof saved?.sfx === "boolean") this.sfx = saved.sfx;
    } catch { /* Private browsing may disallow storage. */ }
  }

  /** Called synchronously from a real tap or keypress, including mobile Safari. */
  unlock() {
    if (!this.available || (!this.music && !this.sfx)) return;
    try {
      if (!this.context) {
        const context = this.context = new AudioContext();
        this.master = context.createGain();
        this.master.gain.value = 0;
        this.master.connect(context.destination);
        this.filter = context.createBiquadFilter();
        this.filter.type = "lowpass";
        this.filter.frequency.value = 2200;
        this.filter.Q.value = 0.45;
        this.filter.connect(this.master);
        context.onstatechange = () => {
          if (context.state === "running") this.sync();
        };
        void makeSong().then((song) => {
          this.song = song;
          this.sync();
        }).catch(() => this.unavailable());
      }
      // Cancel a pending pause/mute suspension before requesting resume.
      window.clearTimeout(this.suspendTimer);
      void this.context.resume().then(() => this.sync()).catch(() => {});
      this.sync();
    } catch { this.unavailable(); }
  }

  private unavailable() {
    this.available = false;
    this.stopMusic();
    this.stopEffects();
    void this.context?.suspend().catch(() => {});
    this.changed();
  }

  toggle(channel: "music" | "sfx") {
    this[channel] = !this[channel];
    this.save();
    this.unlock();
    this.sync();
  }

  toggleMute() {
    if (this.music || this.sfx) {
      this.restore = { music: this.music, sfx: this.sfx };
      this.music = this.sfx = false;
    } else {
      this.music = this.restore.music;
      this.sfx = this.restore.sfx;
    }
    this.save();
    this.unlock();
    this.sync();
  }

  private save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ music: this.music, sfx: this.sfx })); }
    catch { /* Sound remains usable without storage. */ }
    this.changed();
  }

  setMode(mode: Game["mode"]) {
    this.mode = mode;
    // A first tap may arrive while artwork is still loading. Reuse that unlocked
    // context when loading finishes, even if it was suspended during the wait.
    if (mode === "playing" && this.context?.state === "suspended") this.unlock();
    this.sync();
  }

  restart() {
    this.stopMusic();
    this.stopEffects();
    this.offset = 0;
    this.lastEffect = this.lastCollect = this.lastBump = -Infinity;
    this.flourishUntil = this.collectNote = 0;
  }

  setCave(alpha: number) {
    if (this.context && this.filter)
      this.filter.frequency.setTargetAtTime(2200 - alpha * 1250, this.context.currentTime, 0.35);
  }

  private sync() {
    const context = this.context;
    if (!context || !this.master || !this.available) return;
    window.clearTimeout(this.suspendTimer);
    const playing = this.mode === "playing";
    this.master.gain.setTargetAtTime(playing ? 0.45 : 0, context.currentTime, 0.025);
    if (!playing || !this.sfx) this.stopEffects();
    if (playing && this.music && this.song && !this.track && context.state === "running") {
      const source = context.createBufferSource(), gain = context.createGain();
      source.buffer = this.song;
      source.loop = true;
      gain.gain.setValueAtTime(0, context.currentTime);
      gain.gain.setTargetAtTime(0.8, context.currentTime, 0.12);
      source.connect(gain).connect(this.filter!);
      source.start(0, this.offset % this.song.duration);
      this.track = { source, gain, started: context.currentTime };
      source.onended = () => { source.disconnect(); gain.disconnect(); };
    } else if (!playing || !this.music) this.stopMusic();
    if (!playing || (!this.music && !this.sfx)) this.suspendAfter(100);
  }

  private suspendAfter(ms: number) {
    window.clearTimeout(this.suspendTimer);
    this.suspendTimer = window.setTimeout(() => {
      void this.context?.suspend().catch(() => {});
    }, ms);
  }

  private stopMusic() {
    if (!this.track || !this.context) return;
    const { source, gain, started } = this.track;
    const now = this.context.currentTime;
    this.offset += now - started;
    gain.gain.cancelAndHoldAtTime(now);
    gain.gain.linearRampToValueAtTime(0, now + 0.04);
    source.stop(now + 0.05);
    this.track = undefined;
  }

  private stopEffects() {
    if (!this.context) return;
    const now = this.context.currentTime;
    for (const [oscillator, gain] of this.voices) {
      gain.gain.cancelAndHoldAtTime(now);
      gain.gain.linearRampToValueAtTime(0, now + 0.025);
      oscillator.stop(now + 0.03);
    }
    this.voices.clear();
    this.flourishUntil = 0;
  }

  private tone(midi: number, duration: number, volume: number, delay = 0, slide = 0) {
    const context = this.context!;
    const oscillator = context.createOscillator(), gain = context.createGain();
    const at = context.currentTime + delay;
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(hz(midi), at);
    if (slide) oscillator.frequency.exponentialRampToValueAtTime(hz(midi + slide), at + duration);
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(volume, at + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    gain.gain.linearRampToValueAtTime(0, at + duration + 0.015);
    oscillator.connect(gain).connect(this.master!);
    this.voices.set(oscillator, gain);
    oscillator.onended = () => {
      oscillator.disconnect(); gain.disconnect(); this.voices.delete(oscillator);
    };
    oscillator.start(at);
    oscillator.stop(at + duration + 0.02);
  }

  play(type: GameEvent["type"]) {
    const context = this.context;
    if (!this.available || !this.sfx || context?.state !== "running") return;
    if (type === "land" || type === "clear") return; // No repetitive hoof/landing chatter.
    if (this.mode !== "playing" && !(type === "finish" && this.mode === "finished")) return;
    const now = context.currentTime;
    if (type === "cave" || type === "finish") {
      this.stopEffects();
      const notes = type === "finish" ? [67, 71, 74, 79] : [67, 71, 74];
      notes.forEach((midi, i) => this.tone(midi, type === "finish" ? 0.5 : 0.24, 0.07, i * 0.14));
      this.flourishUntil = now + 1.2;
      if (type === "finish") {
        this.master!.gain.setTargetAtTime(0.45, now, 0.025);
        this.suspendAfter(1400);
      }
      return;
    }
    if (now < this.flourishUntil || now - this.lastEffect < 0.18 || this.voices.size >= 3) return;
    if (type === "collect") {
      if (now - this.lastCollect < 0.85) return; // One small chime per cluster, not per pierogi.
      this.lastCollect = now;
      this.tone([67, 71, 74, 71][this.collectNote++ % 4], 0.12, 0.047);
    } else if (type === "jump") {
      this.tone(55, 0.14, 0.055, 0, 7);
    } else if (type === "bump") {
      if (now - this.lastBump < 1.5) return;
      this.lastBump = now;
      this.tone(43, 0.12, 0.055, 0, -5);
    }
    this.lastEffect = now;
  }
}
