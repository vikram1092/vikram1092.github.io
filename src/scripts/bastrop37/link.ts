/** A grounded proximity link retains earned time through an authored service loop. */
export const LINK_SECONDS = 3;
export const RELAY_CORRIDOR_LENGTH = 1560;
export const RELAY_CORRIDOR_X = { minX: 225, maxX: 425 } as const;
export const RELAY_LOOP_LENGTH = 650;

export class LinkProgress {
  constructor(readonly requiredSeconds = LINK_SECONDS) {}
  seconds = 0;
  get progress(): number { return Math.min(1, this.seconds / this.requiredSeconds); }
  get complete(): boolean { return this.seconds >= this.requiredSeconds; }
  advance(dt: number, inRange: boolean, grounded: boolean): boolean {
    if (!this.complete && inRange && grounded) this.seconds = Math.min(this.requiredSeconds, this.seconds + Math.max(0, dt));
    return this.complete;
  }
}
