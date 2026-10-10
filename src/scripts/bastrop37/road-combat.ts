export type RivalPhase = 'approach' | 'flank' | 'windup' | 'strike' | 'stunned' | 'leaving' | 'down';
export type RivalEvent = 'windup' | 'player-hit' | 'counter' | 'knockout';
export type RoadBlocker = { x: number; z: number; w: number };
export type CombatRider = { x: number; height: number; spikes: boolean; reach: number };
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** Rivals ride beside Jo, telegraph a committed side strike, and can be countered. */
export class RoadRival {
  x: number;
  z = 500;
  health = 2;
  phase: RivalPhase = 'approach';
  timer = 0;
  age = 0;
  targetX = 320;
  private hitGrace = 0;
  constructor(readonly id: number, public side: -1 | 1) { this.x = side < 0 ? 205 : 435; }
  get finished(): boolean { return this.z < -100 || this.z > 1600; }
  tick(dt: number, rider: CombatRider, blockers: RoadBlocker[], leave = false): RivalEvent[] {
    const events: RivalEvent[] = [];
    this.age += dt; this.timer += dt; this.hitGrace = Math.max(0, this.hitGrace - dt);
    if (leave || this.age > 23) if (this.phase !== 'down') this.phase = 'leaving';
    if (this.phase === 'down') { this.z -= 230 * dt; this.x += this.side * 40 * dt; return events; }
    if (this.phase === 'leaving') { this.z += 380 * dt; return events; }
    const gap = Math.abs(this.x - rider.x);
    if (rider.spikes && rider.height < 12 && this.hitGrace === 0 && Math.abs(this.z) < 50 && gap > 24 && gap < rider.reach + 12) {
      this.health--; this.hitGrace = 1.1; this.timer = 0;
      this.x = clamp(this.x + this.side * 28, 148, 492);
      if (this.health === 0) { this.phase = 'down'; events.push('knockout'); }
      else { this.phase = 'stunned'; events.push('counter'); }
      return events;
    }
    const blocked = (x: number, z: number) => blockers.some(car => Math.abs(car.z-z) < 100 && Math.abs(car.x-x) < (car.w+30)/2 + 10);
    if (this.phase === 'approach') {
      if (!blocked(this.x, this.z - 90 * dt)) this.z -= 90 * dt;
      else this.x += (320 - this.x) * Math.min(1, dt * 2);
      if (this.z <= 25) { this.phase = 'flank'; this.timer = 0; }
    } else if (this.phase === 'flank') {
      if (rider.x + this.side * 66 < 150 || rider.x + this.side * 66 > 490) this.side = this.side === -1 ? 1 : -1;
      const target = clamp(rider.x + this.side * 66, 150, 490);
      if (!blocked(target, 12)) {
        this.x += (target - this.x) * (1 - Math.exp(-4 * dt));
        this.z += (12 - this.z) * (1 - Math.exp(-3 * dt));
        if (this.timer > 1.6 && gap < 88 && gap > 40) {
          this.phase = 'windup'; this.timer = 0; this.targetX = rider.x; events.push('windup');
        }
      }
    } else if (this.phase === 'windup') {
      if (this.timer >= .95) { this.phase = 'strike'; this.timer = 0; }
    } else if (this.phase === 'strike') {
      const next = this.x + (this.targetX - this.x) * (1 - Math.exp(-9 * dt));
      if (!blocked(next, this.z)) this.x = next;
      if (Math.abs(this.x - rider.x) < 32 && Math.abs(this.z) < 35 && rider.height < 28) {
        events.push('player-hit'); this.phase = 'stunned'; this.timer = 0;
      } else if (this.timer > .55) { this.phase = 'stunned'; this.timer = 0; }
    } else if (this.phase === 'stunned') {
      this.z += (55 - this.z) * (1 - Math.exp(-3 * dt));
      if (this.timer > 1.1) { this.phase = 'flank'; this.timer = 0; }
    }
    return events;
  }
}

/** One active finger owns steering; vertical gestures fire once per swipe, not once per frame. */
export class RideGesture {
  pointer: number | null = null;
  startX = 0;
  startY = 0;
  riderX = 320;
  targetX = 320;
  lastSwipeY = 0;
  private swipeTravel = 0;
  private swipeLatched = false;
  start(id: number, x: number, y: number, riderX: number): boolean {
    if (this.pointer !== null) return false;
    this.pointer = id; this.startX = x; this.startY = this.lastSwipeY = y;
    this.riderX = this.targetX = riderX; this.swipeTravel = 0; this.swipeLatched = false; return true;
  }
  move(id: number, x: number, y: number, width: number): 'jump' | 'spikes' | null {
    if (id !== this.pointer) return null;
    this.targetX = clamp(this.riderX + (x - this.startX) * 384 / Math.max(180, width * .7), 150, 490);
    const dy = y - this.lastSwipeY;
    this.lastSwipeY = y;
    if (dy === 0) return null;
    if (Math.sign(dy) !== Math.sign(this.swipeTravel)) { this.swipeTravel = 0; this.swipeLatched = false; }
    this.swipeTravel += dy;
    if (this.swipeLatched || Math.abs(this.swipeTravel) < 48) return null;
    this.swipeLatched = true;
    return this.swipeTravel < 0 ? 'jump' : 'spikes';
  }
  end(id?: number): void { if (id === undefined || id === this.pointer) this.pointer = null; }
}
