import { RoadJunction } from './junction';
import type { BeatMode, DialogueLine } from './contracts';
import type { DeliveryCheckpoint } from './save';
import { DELIVERY_DIALOGUE } from './delivery-content';

export type DeliveryBeat = 'L1.01' | 'L1.02' | 'L1.03' | 'L1.04' | 'L1.05';
export type DeliveryEvent = 'gap-one' | 'gap-two' | 'signal' | 'gate' | 'gate-missed' | 'barrier-contact' | 'loop-return' | 'approach' | 'drain-complete' | 'checkpoint-action' | 'checkpoint-service' | 'level-complete';
const GAP_ONE = 650;
const GAP_TWO = 1450;
const SIGNAL = 2150;

/** Authored mission position is independent of visual road scroll and wall time. */
export class DeliveryMission {
  beat: DeliveryBeat = 'L1.01';
  mode: BeatMode = 'story';
  route = 0;
  dialogueIndex = 0;
  readonly log: DialogueLine[] = [];
  readonly gates = { gapOne: false, gapTwo: false, signal: false, serviceGate: false, approach: false };
  readonly junction = new RoadJunction('INTAKE SERVICE ROAD');
  loop = false;
  loopDistance = 0;
  reaction = 0;

  constructor(checkpoint?: DeliveryCheckpoint, previousLog: DialogueLine[] = []) {
    this.log.push(...previousLog);
    if (checkpoint === 'CP-L1-ACTION') {
      this.beat = 'L1.02'; this.mode = 'action'; this.reaction = 1.5;
    } else if (checkpoint === 'CP-L1-SERVICE') {
      this.beat = 'L1.04'; this.mode = 'action'; this.reaction = 1.5;
    } else if (checkpoint === 'CP-L1-COMPLETE') {
      this.beat = 'L1.05'; this.mode = 'resolve'; this.dialogueIndex = DELIVERY_DIALOGUE['L1.05'].length;
      this.gates.gapOne = this.gates.gapTwo = this.gates.signal = this.gates.serviceGate = this.gates.approach = true;
    }
  }

  get dialogue(): DialogueLine | null {
    return this.mode === 'story' || this.mode === 'resolve' ? DELIVERY_DIALOGUE[this.beat]?.[this.dialogueIndex] ?? null : null;
  }

  get dialogueCount(): number { return DELIVERY_DIALOGUE[this.beat]?.length ?? 0; }
  get objective(): string { return this.beat === 'L1.04' || this.beat === 'L1.05' ? 'TAKE THE SERVICE LANE' : 'DELIVER THE MODULE'; }
  get routeCue(): string {
    if (this.mode === 'drain') return 'TRAFFIC CLEARING';
    if (this.beat === 'L1.02') return this.gates.gapOne ? 'WATCH THE NEXT GAP' : 'STEER THROUGH THE GAP';
    if (this.beat === 'L1.04') return this.junction.cue;
    return this.beat === 'L1.05' ? 'MUNICIPAL INTAKE APPROACH' : 'CRUISE AND READ';
  }

  advance(): DeliveryEvent[] {
    const line = this.dialogue;
    if (!line) return [];
    this.log.push(line);
    this.dialogueIndex++;
    if (this.dialogueIndex < this.dialogueCount) return [];
    this.route = 0;
    this.dialogueIndex = 0;
    this.reaction = 1.5;
    if (this.beat === 'L1.01') {
      this.beat = 'L1.02'; this.mode = 'action'; return ['checkpoint-action'];
    }
    if (this.beat === 'L1.03') {
      this.beat = 'L1.04'; this.mode = 'action'; return ['checkpoint-service'];
    }
    this.dialogueIndex = DELIVERY_DIALOGUE['L1.05'].length;
    return ['level-complete'];
  }

  tick(dt: number, worldTravel: number, riderX: number, trafficClear: boolean, grounded = true): DeliveryEvent[] {
    if (this.mode === 'drain') {
      // Continue past the just-crossed landmark while traffic leaves. The next
      // named landmark is withheld until action resumes after reading.
      this.route += worldTravel;
      const passedMarker = this.beat === 'L1.02' ? SIGNAL : this.junction.destination;
      if (!trafficClear || this.route - passedMarker < 95) return [];
      this.beat = this.beat === 'L1.02' ? 'L1.03' : 'L1.05';
      this.mode = this.beat === 'L1.03' ? 'story' : 'resolve';
      this.route = 0;
      this.dialogueIndex = 0;
      return ['drain-complete'];
    }
    if (this.mode !== 'action') return [];
    this.reaction = Math.max(0, this.reaction - dt);
    const before = this.route;
    this.route += worldTravel;
    const crossed = (plane: number) => before < plane && this.route >= plane;
    const events: DeliveryEvent[] = [];
    if (this.beat === 'L1.02') {
      if (!this.gates.gapOne && crossed(GAP_ONE)) { this.gates.gapOne = true; events.push('gap-one'); }
      if (!this.gates.gapTwo && crossed(GAP_TWO)) { this.gates.gapTwo = true; events.push('gap-two'); }
      if (!this.gates.signal && crossed(SIGNAL)) {
        this.gates.signal = true; events.push('signal');
        if (this.gates.gapOne && this.gates.gapTwo) this.mode = 'drain';
      }
      return events;
    }
    const junctionEvents = this.junction.tick(worldTravel, riderX, grounded);
    this.route = this.junction.position;
    this.loop = this.junction.phase === 'return';
    this.loopDistance = this.loop ? this.junction.position-this.junction.decisionEnd : 0;
    if (junctionEvents.includes('exit-entered')) { this.gates.serviceGate = true; events.push('gate'); }
    if (junctionEvents.includes('exit-missed')) events.push('gate-missed');
    if (junctionEvents.includes('returned')) events.push('loop-return');
    if (junctionEvents.includes('arrived')) {
      this.gates.approach = true; this.mode = 'drain'; events.push('approach');
    }
    return events;
  }

  /** Distance in world units from Jo; null hides a unique marker during held reading. */
  landmark(kind: 'signal' | 'gate' | 'approach'): number | null {
    if (this.mode !== 'action' && this.mode !== 'drain') return null;
    if (this.beat === 'L1.02' && kind === 'signal') {
      const z = SIGNAL - this.route;
      return z > -95 ? z : null;
    }
    if (this.beat === 'L1.04') {
      if (kind === 'gate' && !this.junction.selected && !this.loop) {
        const z = this.junction.mouth - this.route;
        return z > -95 ? z : null;
      }
      if (kind === 'approach' && this.gates.serviceGate) {
        const z = this.junction.destination - this.route;
        return z > -95 ? z : null;
      }
    }
    return null;
  }
}
