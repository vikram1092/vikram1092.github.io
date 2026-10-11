export type JunctionPhase = 'approach' | 'fork' | 'exit' | 'return' | 'complete';
export type JunctionEvent = 'exit-entered' | 'exit-missed' | 'returned' | 'arrived';
export type RoadStrip = { center: number; width: number; exit: boolean };
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const smooth = (n: number) => { const t = clamp(n, 0, 1); return t*t*(3-2*t); };

/** The road surface, route selection and rider boundaries use this same geometry. */
export class RoadJunction {
  position = 0;
  phase: JunctionPhase = 'approach';
  attempts = 0;
  private entryTravel = 0;
  readonly mouth = 2200;
  readonly decisionEnd = 2900;
  readonly destination = 7600;
  readonly returnEnd = 7600;
  constructor(readonly destinationName: string) {}
  get selected(): boolean { return this.phase === 'exit' || this.phase === 'complete'; }
  get complete(): boolean { return this.phase === 'complete'; }
  exitCenter(s: number): number { return 420 + 600 * smooth((s-this.mouth)/3300); }
  exitWidth(s: number): number { return 184 + 200*smooth((s-this.mouth-1600)/1800); }
  returnCenter(s: number): number {
    const t = clamp((s-this.decisionEnd)/(this.returnEnd-this.decisionEnd), 0, 1);
    return 320 - 500*Math.sin(Math.PI*t)**2;
  }
  /** Offset removed from rider/camera coordinates only when the selected road changes. */
  get origin(): number { return this.selected ? this.exitCenter(this.position)-320 : this.phase === 'return' ? this.returnCenter(this.position)-320 : 0; }
  centerAhead(z: number): number {
    if (this.selected) return this.exitCenter(this.position+z)-this.exitCenter(this.position);
    if (this.phase === 'return') return this.returnCenter(this.position+z)-this.returnCenter(this.position);
    return 0;
  }
  get riderBounds(): { min: number; max: number } {
    const half = (this.selected ? this.exitWidth(this.position) : 384)/2;
    return { min: 320-half+22, max: 320+half-22 };
  }
  stripsAhead(z: number): RoadStrip[] {
    const s = this.position+z;
    if (this.phase === 'return') return [{ center: 320+this.centerAhead(z), width: 384, exit: false }];
    const strips: RoadStrip[] = [];
    // The original road remains visible peeling away after selecting the exit.
    if (!this.selected || this.position < this.mouth+3000)
      strips.push({ center: 320-this.origin, width: 384, exit: false });
    if (s >= this.mouth) strips.push({ center: this.exitCenter(s)-this.origin, width: this.exitWidth(s), exit: true });
    return strips;
  }
  get cue(): string {
    if (this.complete) return `${this.destinationName} · ARRIVED`;
    if (this.selected) return `${this.destinationName} · FOLLOW THE RIGHT ROAD`;
    if (this.phase === 'return') return 'EXIT MISSED · RETURN ROAD TO THE SAME FORK';
    return `${this.destinationName} ↗ · ${this.phase === 'fork' ? 'TAKE THE RIGHT BRANCH' : 'RIGHT FORK AHEAD'}`;
  }
  tick(travel: number, riderX: number, grounded = true): JunctionEvent[] {
    if (this.complete) return [];
    const events: JunctionEvent[] = [];
    // Substeps make a slow frame behave like ordinary riding, including the entry window.
    let remaining = Math.max(0, travel);
    while (remaining > 0 && !this.complete) {
      const step = Math.min(20, remaining); remaining -= step;
      this.position += step;
      if (this.phase === 'approach' && this.position >= this.mouth) this.phase = 'fork';
      if (this.phase === 'fork') {
        const center = this.exitCenter(this.position), half = this.exitWidth(this.position)/2;
        const onExit = grounded && riderX >= center-half+22 && riderX <= center+half-22;
        this.entryTravel = onExit ? this.entryTravel+step : 0;
        if (this.entryTravel >= 80) { this.phase = 'exit'; events.push('exit-entered'); }
        else if (this.position >= this.decisionEnd) { this.phase = 'return'; this.attempts++; events.push('exit-missed'); }
      }
      if (this.selected && this.position >= this.destination) { this.position = this.destination; this.phase = 'complete'; events.push('arrived'); }
      if (this.phase === 'return' && this.position >= this.returnEnd) {
        this.position = 400; this.phase = 'approach'; this.entryTravel = 0; events.push('returned');
        // New approach starts on the next frame; no repeated choices in one stalled frame.
        break;
      }
    }
    return events;
  }
}
