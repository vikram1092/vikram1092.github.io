import type { BeatMode, DialogueLine, EquipmentRecord, TransmissionEntry } from './contracts';
import { BETRAYAL_DIALOGUE, BETRAYAL_RECORDS } from './betrayal-content';
import type { BetrayalCheckpoint } from './save';

export type BetrayalBeat = 'L2.01' | 'L2.02' | 'L2.03' | 'L2.04';
export type BetrayalEvent = 'checkpoint-scan' | 'scan' | 'scan-missed' | 'loop-return' |
  'revelation' | 'checkpoint-escape' | 'lock-broken' | 'exit' | 'closure' | 'level-complete';
const SCAN = 620;
const EXIT = 1700;
const LOOP = 650;
export const SCAN_CORRIDOR = { minX: 225, maxX: 425 } as const;
export const LOCK_CORRIDOR = { minX: 265, maxX: 375 } as const;

/** Level 2 owns only authored mission state. The rider and actors remain in the shared simulation. */
export class BetrayalMission {
  beat: BetrayalBeat = 'L2.01';
  mode: BeatMode = 'story';
  route = 0;
  dialogueIndex = 0;
  recordIndex = 0;
  readonly log: DialogueLine[] = [];
  readonly records: EquipmentRecord[] = [];
  readonly history: TransmissionEntry[] = [];
  reaction = 0;
  loop = false;
  loopDistance = 0;
  scanEntered = false;
  betrayalKnown = false;
  lockOutside = 0;
  lockBroken = false;
  exitPassed = false;

  constructor(checkpoint?: BetrayalCheckpoint, log: DialogueLine[] = [], records: EquipmentRecord[] = [], history: TransmissionEntry[] = []) {
    this.log.push(...log); this.records.push(...records); this.history.push(...history);
    if (checkpoint === 'CP-L2-SCAN') {
      this.beat = 'L2.02'; this.mode = 'action'; this.reaction = 1.5;
    } else if (checkpoint === 'CP-L2-ESCAPE') {
      this.beat = 'L2.03'; this.mode = 'action'; this.reaction = 1.5; this.scanEntered = this.betrayalKnown = true;
      this.recordIndex = BETRAYAL_RECORDS.length;
    } else if (checkpoint === 'CP-L2-COMPLETE') {
      this.beat = 'L2.04'; this.mode = 'resolve'; this.scanEntered = this.betrayalKnown = this.lockBroken = this.exitPassed = true;
      this.recordIndex = BETRAYAL_RECORDS.length; this.dialogueIndex = BETRAYAL_DIALOGUE['L2.04'].length;
    }
  }

  get record(): EquipmentRecord | null {
    return this.beat === 'L2.02' && this.mode === 'story' ? BETRAYAL_RECORDS[this.recordIndex] ?? null : null;
  }
  get dialogue(): DialogueLine | null {
    if (this.record) return null;
    return this.mode === 'story' || this.mode === 'resolve' ? BETRAYAL_DIALOGUE[this.beat]?.[this.dialogueIndex] ?? null : null;
  }
  get dialogueCount(): number { return BETRAYAL_DIALOGUE[this.beat]?.length ?? 0; }
  get objective(): string {
    if (this.beat === 'L2.01' || this.beat === 'L2.02') return 'ENTER THE INSPECTION LANE';
    return this.beat === 'L2.03' ? 'BREAK THE RECOVERY LOCK' : 'RIDE TO THE PUBLIC RELAY';
  }
  get routeCue(): string {
    if (this.mode === 'drain') return 'PURSUIT CLEARING';
    if (this.beat === 'L2.02' && this.mode === 'action') return this.loop ? 'SCAN LOOP — REJOIN AHEAD' : 'ENTER THE WIDE SCAN ZONE';
    if (this.beat === 'L2.03') return this.lockBroken ? 'PURSUIT EXIT AHEAD' : 'STEER OUTSIDE THE LOCK';
    return 'SAFE CRUISE · READ';
  }

  advance(): BetrayalEvent[] {
    if (this.record) {
      const record = this.record;
      this.records.push(record); this.history.push(record); this.recordIndex++;
      return [];
    }
    const line = this.dialogue;
    if (!line) return [];
    this.log.push(line); this.history.push(line); this.dialogueIndex++;
    if (this.dialogueIndex < this.dialogueCount) return [];
    this.route = 0; this.dialogueIndex = 0; this.reaction = 1.5;
    if (this.beat === 'L2.01') {
      this.beat = 'L2.02'; this.mode = 'action'; return ['checkpoint-scan'];
    }
    if (this.beat === 'L2.02') {
      this.beat = 'L2.03'; this.mode = 'action'; this.betrayalKnown = true; return ['checkpoint-escape'];
    }
    this.dialogueIndex = BETRAYAL_DIALOGUE['L2.04'].length;
    return ['level-complete'];
  }

  tick(dt: number, travel: number, riderX: number, trafficClear: boolean): BetrayalEvent[] {
    if (this.mode === 'drain') {
      this.route += travel;
      if (!trafficClear) return [];
      if (this.beat === 'L2.02') {
        this.mode = 'story'; this.route = 0; this.dialogueIndex = 0; return ['revelation'];
      }
      this.beat = 'L2.04'; this.mode = 'resolve'; this.route = 0; this.dialogueIndex = 0; return ['closure'];
    }
    if (this.mode !== 'action') return [];
    this.reaction = Math.max(0, this.reaction - dt);
    if (this.beat === 'L2.02') {
      if (this.loop) {
        this.loopDistance += travel;
        if (this.loopDistance >= LOOP) { this.loop = false; this.loopDistance = 0; this.route = 0; return ['loop-return']; }
        return [];
      }
      const before = this.route; this.route += travel;
      if (!this.scanEntered && before < SCAN && this.route >= SCAN) {
        if (riderX >= SCAN_CORRIDOR.minX && riderX <= SCAN_CORRIDOR.maxX) {
          this.scanEntered = true; this.mode = 'drain'; return ['scan'];
        }
        this.loop = true; this.loopDistance = 0; return ['scan-missed'];
      }
      return [];
    }
    if (this.beat === 'L2.03') {
      this.route += travel;
      if (!this.lockBroken) {
        this.lockOutside = riderX < LOCK_CORRIDOR.minX || riderX > LOCK_CORRIDOR.maxX ? this.lockOutside + dt : 0;
        if (this.lockOutside >= 1.5) { this.lockBroken = true; this.route = 0; return ['lock-broken']; }
        return [];
      }
      if (!this.exitPassed && this.route >= EXIT) {
        this.exitPassed = true; this.mode = 'drain'; return ['exit'];
      }
    }
    return [];
  }

  landmark(kind: 'scan' | 'exit'): number | null {
    if (this.mode !== 'action' && this.mode !== 'drain') return null;
    if (kind === 'scan' && this.beat === 'L2.02' && !this.loop) return Math.max(-95, SCAN - this.route);
    if (kind === 'exit' && this.beat === 'L2.03' && this.lockBroken) return Math.max(-95, EXIT - this.route);
    return null;
  }
}
