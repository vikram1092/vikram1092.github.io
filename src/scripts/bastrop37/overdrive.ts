export type OverdriveReward = 'near-pass' | 'drone-kill' | 'marked-landing';
const points: Record<OverdriveReward, number> = { 'near-pass': 10, 'drone-kill': 35, 'marked-landing': 15 };

/** Attempt-local meter. Actor/event IDs prevent repeat awards; retry creates a fresh authored instance. */
export class OverdriveMeter {
  value: number;
  active = 0;
  private awarded = new Set<string>();

  constructor(authoredValue = 0) { this.value = Math.max(0, Math.min(100, authoredValue)); }
  get ready(): boolean { return this.value === 100 && this.active === 0; }
  award(kind: OverdriveReward, eventId: string): boolean {
    if (!eventId || this.awarded.has(eventId)) return false;
    this.awarded.add(eventId);
    this.value = Math.min(100, this.value + points[kind]);
    return true;
  }
  activate(): boolean {
    if (!this.ready) return false;
    this.value = 0; this.active = 1.5;
    return true;
  }
  tick(dt: number): void { this.active = Math.max(0, this.active - dt); }
}
