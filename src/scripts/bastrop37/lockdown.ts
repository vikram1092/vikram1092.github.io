import type { BeatMode, DialogueLine, EquipmentRecord, TransmissionEntry } from './contracts';
import { LOCKDOWN_DIALOGUE, LOCKDOWN_RECORDS } from './lockdown-content';
import { ControllerGate, type ControllerEvent } from './controller';
import type { LockdownCheckpoint } from './save';

export type LockdownBeat = 'L4.01' | 'L4.02' | 'L4.03' | 'L4.04';
export type EscortAttackPhase = 'idle' | 'telegraph' | 'strike' | 'recover' | 'cleared';
export type LockdownEvent = ControllerEvent | 'checkpoint-controller' | 'checkpoint-escort' |
  'escort-telegraph' | 'escort-retarget' | 'escort-strike' | 'escort-recover' | 'escort-cleared' |
  'bus-hit' | 'bus-lost' | 'bus-safe' | 'ramp-passed' | 'ramp-missed' | 'ramp-loop-return' |
  'closure' | 'level-complete';
export const ESCORT_MIN_X = 340;
export const ESCORT_MAX_X = 490;
export const INTERCEPT_MIN_X = 420;
export const INTERCEPT_MAX_X = 490;
export const BUS_WORLD_X = 550;
export const BUS_PROGRESS_GOAL = 3600;
export const RAMP_ROUTE = 3900;
export const RAMP_MIN_X = 345;
export const RAMP_MAX_X = 490;
export const RAMP_LOOP_LENGTH = 650;
export const BUS_ATTACK_MARKERS = [650, 1300, 1950] as const;
const RAMP_MISS_ROUTE = RAMP_ROUTE + 100;

/** L4 authored mission state. The rider, drone body, and visual props remain in the shared renderer. */
export class LockdownMission {
  beat: LockdownBeat = 'L4.01';
  mode: BeatMode = 'story';
  dialogueIndex = 0;
  readonly log: DialogueLine[] = [];
  readonly records: EquipmentRecord[] = [];
  readonly history: TransmissionEntry[] = [];
  readonly controller = new ControllerGate();
  busCondition: 0 | 1 | 2 | 3 = 3;
  busProgress = 0;
  busSafe = false;
  rampPassed = false;
  riderRoute = 0;
  rampLoop = false;
  rampLoopDistance = 0;
  rampLoops = 0;
  escortInRange = false;
  attackPhase: EscortAttackPhase = 'idle';
  attackTimer = 0;
  attackPasses = 0;
  attackTarget: 'bus' | 'jo' = 'bus';
  attackJoX = 440;
  droneDestroyed = false;
  droneDeparted = false;
  busZ = 120;
  drainBusZ = 220;
  drainRoute = 0;
  barrierExitZ: number | null = null;
  get route(): number { return this.beat === 'L4.02' ? this.controller.route : this.riderRoute; }

  constructor(checkpoint?: LockdownCheckpoint, log: DialogueLine[] = [], records: EquipmentRecord[] = [], history: TransmissionEntry[] = []) {
    this.log.push(...log); this.records.push(...records); this.history.push(...history);
    if (checkpoint === 'CP-L4-CONTROLLER') {
      this.beat = 'L4.02'; this.mode = 'action';
    } else if (checkpoint === 'CP-L4-ESCORT') {
      this.beat = 'L4.03'; this.mode = 'action';
      this.controller.state = 'open'; this.controller.progress = 1;
      this.barrierExitZ = 260;
      this.busZ = 120;
    } else if (checkpoint === 'CP-L4-COMPLETE') {
      this.beat = 'L4.04'; this.mode = 'resolve';
      this.controller.state = 'open'; this.controller.progress = 1;
      this.busSafe = this.rampPassed = true; this.busProgress = BUS_PROGRESS_GOAL;
      this.attackPhase = 'cleared'; this.droneDeparted = true;
      this.dialogueIndex = LOCKDOWN_DIALOGUE['L4.04'].length;
    }
  }

  get record(): EquipmentRecord | null {
    return this.beat === 'L4.01' && this.dialogueIndex === 1 &&
      !this.records.some(record => record.id === LOCKDOWN_RECORDS[0].id) ? LOCKDOWN_RECORDS[0] : null;
  }
  get dialogue(): DialogueLine | null {
    if (this.record) return null;
    return this.mode === 'story' || this.mode === 'resolve' ? LOCKDOWN_DIALOGUE[this.beat]?.[this.dialogueIndex] ?? null : null;
  }
  get dialogueCount(): number { return LOCKDOWN_DIALOGUE[this.beat]?.length ?? 0; }
  get objective(): string {
    if (this.beat === 'L4.02') return 'CLEAR THE BUS ROUTE';
    if (this.beat === 'L4.03') return 'KEEP THE EXIT CLEAR';
    return 'REACH THE CIVIC ROAD';
  }
  get routeCue(): string {
    if (this.mode === 'drain') return 'BUS SAFE · THREAT CLEARING';
    if (this.beat === 'L4.02') {
      if (this.controller.loop) return 'CONTROLLER MISSED · RIGHT SERVICE LOOP';
      if (this.controller.state === 'retracting') return 'CONTROLLER DISABLED · BARRIER RETRACTING';
      return this.controller.route >= 430 ? 'BLADES J / CTRL · MARKED CONTROLLER RIGHT' : 'MARKED CONTROLLER · BLADES J / CTRL';
    }
    if (this.beat === 'L4.03') {
      if (!this.escortInRange && !this.busSafe) return 'OUT OF RANGE · RETURN TO BUS';
      if (this.attackPhase === 'telegraph') return this.attackTarget === 'jo' ? 'DRONE ON JO · EVADE OR CUT' : 'INTERCEPT RIGHT LANE · STEER OR CUT';
      if (this.rampLoop) return 'CIVIC RAMP MISSED · SERVICE LOOP';
      if (this.busSafe && !this.rampPassed) return 'BUS SAFE · REACH CIVIC RAMP';
      if (this.rampPassed && !this.busSafe) return 'RAMP REACHED · STAY WITH BUS';
      return 'STAY WITH BUS · PROTECT THE EXIT';
    }
    return 'SAFE CRUISE · READ';
  }
  get intercept(): 'right' | null { return this.attackPhase === 'telegraph' && this.attackTarget === 'bus' ? 'right' : null; }

  advance(): LockdownEvent[] {
    const record = this.record;
    if (record) {
      this.records.push(record); this.history.push(record);
      return [];
    }
    const line = this.dialogue;
    if (!line) return [];
    this.log.push(line); this.history.push(line); this.dialogueIndex++;
    if (this.dialogueIndex < this.dialogueCount) return [];
    this.dialogueIndex = 0;
    if (this.beat === 'L4.01') {
      this.beat = 'L4.02'; this.mode = 'action';
      return ['checkpoint-controller'];
    }
    this.dialogueIndex = LOCKDOWN_DIALOGUE['L4.04'].length;
    return ['level-complete'];
  }

  controllerBladeHit(riderX: number, grounded: boolean, bladeReach: number, bladesActive: boolean): LockdownEvent[] {
    return this.beat === 'L4.02' && this.mode === 'action'
      ? this.controller.bladeHit(riderX, grounded, bladeReach, bladesActive) : [];
  }
  escortDroneCut(): LockdownEvent[] {
    if (this.beat !== 'L4.03' || this.droneDestroyed || this.droneDeparted) return [];
    this.droneDestroyed = true; this.attackPhase = 'cleared'; this.attackTimer = 0;
    return ['escort-cleared'];
  }
  /** A completed Jo-targeted pass produces no bus damage. Physical Jo contact is checked by the shared simulation. */
  escortDodge(): LockdownEvent[] {
    if (this.beat !== 'L4.03' || this.attackPhase !== 'strike' || this.attackTarget !== 'jo') return [];
    this.attackPasses++;
    this.attackPhase = 'recover'; this.attackTimer = 1.3;
    return ['escort-recover'];
  }

  tick(dt: number, travel: number, riderX: number, trafficClear: boolean): LockdownEvent[] {
    if (this.beat === 'L4.02' && this.mode === 'action') {
      const events = this.controller.tick(dt, travel);
      if (events.includes('barrier-open')) {
        this.beat = 'L4.03'; this.mode = 'action';
        this.busCondition = 3; this.busProgress = 0; this.riderRoute = 0;
        this.barrierExitZ = this.controller.barrierZ;
        return [...events, 'checkpoint-escort'];
      }
      return events;
    }
    if (this.mode === 'drain') {
      this.drainRoute += travel;
      this.drainBusZ += travel;
      if (this.drainBusZ < 1500 || !trafficClear || !this.droneDeparted) return [];
      this.beat = 'L4.04'; this.mode = 'resolve'; this.dialogueIndex = 0;
      return ['closure'];
    }
    if (this.beat !== 'L4.03' || this.mode !== 'action') return [];
    if (this.busCondition === 0) return [];
    if (this.barrierExitZ !== null) this.barrierExitZ -= travel;
    // Only after full retraction does the bus visibly join its reachable escort depth band.
    this.busZ = Math.min(220, this.busZ + dt * 165);
    const events: LockdownEvent[] = [];
    this.escortInRange = riderX >= ESCORT_MIN_X && riderX <= ESCORT_MAX_X;
    if (!this.busSafe && this.escortInRange) {
      this.busProgress = Math.min(BUS_PROGRESS_GOAL, this.busProgress + Math.max(0, travel));
      if (this.busProgress === BUS_PROGRESS_GOAL) {
        this.busSafe = true; this.attackPhase = 'cleared'; this.attackTimer = 0;
        events.push('bus-safe');
      }
    }
    // Jo's route remains independent: the civic marker may be earned before or after the bus reaches safety.
    if (this.rampLoop) {
      this.rampLoopDistance += Math.max(0, travel);
      if (this.rampLoopDistance >= RAMP_LOOP_LENGTH) {
        this.rampLoop = false; this.rampLoopDistance = 0; this.riderRoute = RAMP_ROUTE - 650;
        events.push('ramp-loop-return');
      }
    } else if (!this.rampPassed) {
      const before = this.riderRoute;
      this.riderRoute += Math.max(0, travel);
      if (before < RAMP_ROUTE && this.riderRoute >= RAMP_ROUTE && riderX >= RAMP_MIN_X && riderX <= RAMP_MAX_X) {
        this.rampPassed = true; events.push('ramp-passed');
      } else if (this.riderRoute >= RAMP_MISS_ROUTE) {
        this.rampLoop = true; this.rampLoopDistance = 0; this.riderRoute = RAMP_MISS_ROUTE;
        this.rampLoops++; events.push('ramp-missed');
      }
    }
    if (!this.busSafe && !this.droneDestroyed && !this.droneDeparted) {
      if (this.attackPhase === 'idle') {
        const marker = BUS_ATTACK_MARKERS[this.attackPasses];
        if (marker !== undefined && this.escortInRange && this.busProgress >= marker) {
          this.attackPhase = 'telegraph'; this.attackTarget = 'bus';
          this.attackTimer = this.attackPasses === 0 ? 1.6 : 1.2;
          events.push('escort-telegraph');
        }
      } else if (this.attackPhase === 'telegraph') {
        if (this.attackTarget === 'bus' && riderX >= INTERCEPT_MIN_X && riderX <= INTERCEPT_MAX_X) {
          this.attackTarget = 'jo'; this.attackJoX = riderX; events.push('escort-retarget');
        }
        this.attackTimer = Math.max(0, this.attackTimer - dt);
        if (this.attackTimer === 0) {
          this.attackPhase = 'strike'; this.attackTimer = .65;
          events.push('escort-strike');
        }
      } else if (this.attackPhase === 'strike') {
        this.attackTimer = Math.max(0, this.attackTimer - dt);
        if (this.attackTimer === 0) {
          this.attackPasses++;
          if (this.attackTarget === 'bus') {
            this.busCondition = Math.max(0, this.busCondition - 1) as 0 | 1 | 2 | 3;
            events.push('bus-hit');
            if (this.busCondition === 0) { events.push('bus-lost'); return events; }
          }
          this.attackPhase = 'recover'; this.attackTimer = 1.3;
          events.push('escort-recover');
        }
      } else if (this.attackPhase === 'recover') {
        this.attackTimer = Math.max(0, this.attackTimer - dt);
        if (this.attackTimer === 0) this.attackPhase = 'idle';
      }
    }
    if (this.busSafe && this.rampPassed) {
      this.mode = 'drain'; this.drainRoute = 0; this.drainBusZ = this.busZ;
      return events;
    }
    return events;
  }

  rampZ(): number | null {
    if (this.beat !== 'L4.03' || this.rampPassed || this.rampLoop) return null;
    return RAMP_ROUTE - this.riderRoute;
  }
}
