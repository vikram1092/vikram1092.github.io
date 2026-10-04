/** A grounded proximity link retains earned time through an authored service loop. */
export const LINK_SECONDS = 3;
export const RELAY_CORRIDOR_LENGTH = 1560;
export const RELAY_CORRIDOR_X = { minX: 225, maxX: 425 } as const;
export const RELAY_LOOP_LENGTH = 650;

export class LinkProgress {
  seconds = 0;
  get progress(): number { return Math.min(1, this.seconds / LINK_SECONDS); }
  get complete(): boolean { return this.seconds >= LINK_SECONDS; }
  advance(dt: number, inRange: boolean, grounded: boolean): boolean {
    if (!this.complete && inRange && grounded) this.seconds = Math.min(LINK_SECONDS, this.seconds + Math.max(0, dt));
    return this.complete;
  }
}
