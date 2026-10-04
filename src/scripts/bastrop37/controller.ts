/** One marked blade target, one visible retracting barrier, and a safe signed repeat approach. */
export const CONTROLLER_ROUTE = 520;
export const CONTROLLER_X = 452;
export const BARRIER_ROUTE = 780;
export const CONTROLLER_LOOP_START = 700;
export const CONTROLLER_LOOP_LENGTH = 650;
export const CONTROLLER_BLADE_DEPTH = 38;
export const BARRIER_RETRACT_SECONDS = 1.2;

export type ControllerState = 'active' | 'retracting' | 'open';
export type ControllerEvent = 'controller-hit' | 'controller-missed' | 'loop-return' | 'barrier-open';

export class ControllerGate {
  state: ControllerState = 'active';
  progress = 0;
  route = 0;
  loop = false;
  loopDistance = 0;
  loops = 0;
  get controllerZ(): number { return CONTROLLER_ROUTE - this.route; }
  get barrierZ(): number { return BARRIER_ROUTE - this.route; }
  /** During the right service bypass the still-closed barrier recedes to the left of Jo's path. */
  get bypassShift(): number {
    if (!this.loop) return 0;
    return -250 * Math.min(1, Math.max(0, this.loopDistance / 110));
  }
  bladeHit(riderX: number, grounded: boolean, bladeReach: number, bladesActive: boolean): ControllerEvent[] {
    if (this.state !== 'active' || this.loop || !grounded || !bladesActive || Math.abs(this.controllerZ) > CONTROLLER_BLADE_DEPTH) return [];
    const gap = Math.abs(CONTROLLER_X - riderX);
    // Source-grounded cabinet is a marked target. The body stays beside Jo; blade tips reach it.
    if (gap < 25 || gap > bladeReach + 10) return [];
    this.state = 'retracting'; this.progress = 0;
    return ['controller-hit'];
  }
  tick(dt: number, travel: number): ControllerEvent[] {
    if (this.state === 'retracting') {
      this.progress = Math.min(1, this.progress + Math.max(0, dt) / BARRIER_RETRACT_SECONDS);
      if (this.progress === 1) { this.state = 'open'; return ['barrier-open']; }
      return [];
    }
    if (this.state === 'open') return [];
    this.route += Math.max(0, travel);
    if (this.loop) {
      this.loopDistance += Math.max(0, travel);
      if (this.loopDistance >= CONTROLLER_LOOP_LENGTH) {
        this.loop = false; this.loopDistance = 0; this.route = 0;
        return ['loop-return'];
      }
      return [];
    }
    if (this.route >= CONTROLLER_LOOP_START) {
      this.route = CONTROLLER_LOOP_START;
      this.loop = true; this.loopDistance = 0; this.loops++;
      return ['controller-missed'];
    }
    return [];
  }
}
