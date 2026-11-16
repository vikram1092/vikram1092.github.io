import type { Game, GameEvent } from "./model";

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

/** Native music playback keeps Safari on the media route; Web Audio handles SFX. */
export class TrailAudio {
  private context?: AudioContext;
  private master?: GainNode;
  private mode: Game["mode"] = "ready";
  private voices = new Map<OscillatorNode, GainNode>();
  private suspendTimer?: number;
  private lastEffect = -Infinity;
  private lastCollect = -Infinity;
  private lastBump = -Infinity;
  private flourishUntil = 0;
  private collectNote = 0;

  constructor(private music: HTMLAudioElement) {}

  /** Must call play/resume directly in touchend/click/keydown, without awaiting. */
  unlock() {
    if (document.hidden) return;
    // Web Audio otherwise defaults to ambient audio on iOS, which can be silent
    // even while AudioContext.state is running. Native music also supplies the
    // playback route on Safari versions without the Audio Session API.
    try {
      const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
      if (session) session.type = "playback";
    } catch { /* Native media still works without Audio Session support. */ }
    this.playMusic(true);
    try {
      if (!this.context) {
        const context = this.context = new AudioContext();
        this.master = context.createGain();
        this.master.gain.value = 0;
        this.master.connect(context.destination);
        context.onstatechange = () => {
          if (context.state === "running") this.syncEffects();
        };
      }
      window.clearTimeout(this.suspendTimer);
      void this.context.resume().then(() => this.syncEffects()).catch(() => {});
      this.syncEffects();
    } catch { /* Music and the ride continue even when synthesized SFX fail. */ }
  }

  private playMusic(fromGesture = false) {
    if (document.hidden || (this.mode !== "playing" && this.mode !== "ready")) return;
    // Attempt autoplay when allowed, and retry on every genuine interaction.
    // Rejected autoplay is never remembered as a muted setting.
    if (fromGesture || this.music.paused) void this.music.play().catch(() => {});
  }

  setMode(mode: Game["mode"]) {
    this.mode = mode;
    if (mode === "playing") {
      this.playMusic();
      if (this.context && this.context.state !== "running")
        void this.context.resume().then(() => this.syncEffects()).catch(() => {});
    } else this.music.pause();
    this.syncEffects();
  }

  restart() {
    this.stopEffects();
    this.music.currentTime = 0;
    this.lastEffect = this.lastCollect = this.lastBump = -Infinity;
    this.flourishUntil = this.collectNote = 0;
  }

  private syncEffects() {
    const context = this.context;
    if (!context || !this.master) return;
    window.clearTimeout(this.suspendTimer);
    const playing = this.mode === "playing";
    this.master.gain.setTargetAtTime(playing ? 0.75 : 0, context.currentTime, 0.025);
    if (!playing) {
      this.stopEffects();
      this.suspendAfter(100);
    }
  }

  private suspendAfter(ms: number) {
    window.clearTimeout(this.suspendTimer);
    this.suspendTimer = window.setTimeout(() => {
      void this.context?.suspend().catch(() => {});
    }, ms);
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
    if (context?.state !== "running") return;
    if (type === "land" || type === "clear") return; // No repetitive hoof/landing chatter.
    if (this.mode !== "playing" && !(type === "finish" && this.mode === "finished")) return;
    const now = context.currentTime;
    if (type === "cave" || type === "finish") {
      this.stopEffects();
      const notes = type === "finish" ? [67, 71, 74, 79] : [67, 71, 74];
      notes.forEach((midi, i) => this.tone(midi, type === "finish" ? 0.5 : 0.24, 0.07, i * 0.14));
      this.flourishUntil = now + 1.2;
      if (type === "finish") {
        this.master!.gain.setTargetAtTime(0.75, now, 0.025);
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
