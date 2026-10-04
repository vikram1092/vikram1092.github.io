import type { BeatMode, DialogueLine, EquipmentRecord, TransmissionEntry } from './contracts';
import { PUBLIC_ACCESS_DIALOGUE } from './public-access-content';
import { LinkProgress, RELAY_CORRIDOR_LENGTH, RELAY_CORRIDOR_X, RELAY_LOOP_LENGTH } from './link';
import type { PublicAccessCheckpoint } from './save';

export type PublicAccessBeat = 'L3.01' | 'L3.02' | 'L3.03' | 'L3.04';
export type PublicAccessEvent = 'checkpoint-a' | 'relay-a-linked' | 'checkpoint-b' | 'drone-approach' |
  'drone-cleared' | 'link-missed' | 'loop-return' | 'relay-b-linked' | 'closure' | 'level-complete';
export type Relay = 'A' | 'B';
export const RELAY_CORRIDOR_START = 420;
export const RELAY_CORRIDOR_END = RELAY_CORRIDOR_START + RELAY_CORRIDOR_LENGTH;
const RELAY_EXIT = RELAY_CORRIDOR_END + 100;

/** Chapter state only. The shared rider/drone simulation owns physical contact and visible departure. */
export class PublicAccessMission {
  beat: PublicAccessBeat = 'L3.01';
  mode: BeatMode = 'story';
  route = 0;
  dialogueIndex = 0;
  readonly log: DialogueLine[] = [];
  readonly records: EquipmentRecord[] = [];
  readonly history: TransmissionEntry[] = [];
  readonly linkA = new LinkProgress();
  readonly linkB = new LinkProgress();
  relayA = false;
  relayB = false;
  loop = false;
  loopDistance = 0;
  loopsA = 0;
  loopsB = 0;
  droneStarted = false;
  droneCleared = false;
  reaction = 0;
  inRange = false;
  grounded = true;
  linkedAExitZ: number | null = null;
  linkedBExitZ: number | null = null;

  constructor(checkpoint?: PublicAccessCheckpoint, log: DialogueLine[] = [], records: EquipmentRecord[] = [], history: TransmissionEntry[] = []) {
    this.log.push(...log); this.records.push(...records); this.history.push(...history);
    if (checkpoint === 'CP-L3-A') {
      this.beat = 'L3.02'; this.mode = 'action'; this.reaction = 1.5;
    } else if (checkpoint === 'CP-L3-B') {
      this.beat = 'L3.03'; this.mode = 'action'; this.reaction = 1.5; this.relayA = true;
      this.linkA.seconds = 3;
    } else if (checkpoint === 'CP-L3-COMPLETE') {
      this.beat = 'L3.04'; this.mode = 'resolve'; this.relayA = this.relayB = true;
      this.droneStarted = this.droneCleared = true;
      this.linkA.seconds = this.linkB.seconds = 3;
      this.dialogueIndex = PUBLIC_ACCESS_DIALOGUE['L3.04'].length;
    }
  }

  get relay(): Relay | null { return this.beat === 'L3.02' ? 'A' : this.beat === 'L3.03' ? 'B' : null; }
  get activeLink(): LinkProgress | null { return this.relay === 'A' ? this.linkA : this.relay === 'B' ? this.linkB : null; }
  get dialogue(): DialogueLine | null {
    return this.mode === 'story' || this.mode === 'resolve' ? PUBLIC_ACCESS_DIALOGUE[this.beat]?.[this.dialogueIndex] ?? null : null;
  }
  get dialogueCount(): number { return PUBLIC_ACCESS_DIALOGUE[this.beat]?.length ?? 0; }
  get objective(): string { return this.beat === 'L3.04' ? 'TAKE THE RESERVOIR ROAD' : 'LINK THE PUBLIC RELAY'; }
  get routeCue(): string {
    if (this.mode === 'drain') return 'RELAY LIGHTS READY · ROAD CLEARING';
    if (this.loop || (this.mode === 'action' && this.route >= RELAY_CORRIDOR_END - 260 && !this.activeLink?.complete))
      return 'LINK INCOMPLETE — FOLLOW SERVICE LOOP';
    if (this.beat === 'L3.03' && !this.droneCleared) return 'DRONE INTERCEPTION · BLADES OR STEER CLEAR';
    if (this.mode === 'action') return this.inRange ? this.grounded ? 'IN RANGE · HOLD CONNECTION' : 'LAND TO CONTINUE LINK' : 'FOLLOW THE MARKED LINK CORRIDOR';
    return 'SAFE CRUISE · READ';
  }
  get connectionState(): 'in-range' | 'linking' | 'out-of-range' | 'linked' {
    if (this.activeLink?.complete) return 'linked';
    if (!this.inRange || this.loop || (this.relay === 'B' && !this.droneCleared)) return 'out-of-range';
    return this.grounded ? 'linking' : 'in-range';
  }

  advance(): PublicAccessEvent[] {
    const line = this.dialogue;
    if (!line) return [];
    this.log.push(line); this.history.push(line); this.dialogueIndex++;
    if (this.dialogueIndex < this.dialogueCount) return [];
    this.dialogueIndex = 0; this.route = 0;
    if (this.beat === 'L3.01') {
      this.beat = 'L3.02'; this.mode = 'action'; this.reaction = 1.5;
      return ['checkpoint-a'];
    }
    this.dialogueIndex = PUBLIC_ACCESS_DIALOGUE['L3.04'].length;
    return ['level-complete'];
  }

  tick(dt: number, travel: number, riderX: number, grounded: boolean, droneClear: boolean): PublicAccessEvent[] {
    if (this.linkedAExitZ !== null) this.linkedAExitZ -= travel;
    if (this.linkedBExitZ !== null) this.linkedBExitZ -= travel;
    if (this.mode === 'drain') {
      this.route += travel;
      if (!droneClear || (this.linkedBExitZ !== null && this.linkedBExitZ > -90)) return [];
      this.beat = 'L3.04'; this.mode = 'resolve'; this.route = 0; this.dialogueIndex = 0;
      return ['closure'];
    }
    if (this.mode !== 'action') return [];
    this.reaction = Math.max(0, this.reaction - dt);
    if (this.beat === 'L3.03' && !this.droneStarted) {
      if (this.reaction > 0) return [];
      this.droneStarted = true;
      return ['drone-approach'];
    }
    if (this.beat === 'L3.03' && !this.droneCleared) {
      if (!droneClear) return [];
      this.droneCleared = true;
      this.route = 0;
      return ['drone-cleared'];
    }
    if (this.loop) {
      this.loopDistance += travel;
      if (this.loopDistance < RELAY_LOOP_LENGTH) return [];
      this.loop = false; this.loopDistance = 0; this.route = 0; this.inRange = false;
      return ['loop-return'];
    }
    const before = this.route;
    this.route += travel;
    this.grounded = grounded;
    const inLateralRange = riderX >= RELAY_CORRIDOR_X.minX && riderX <= RELAY_CORRIDOR_X.maxX;
    const overlap = Math.max(0, Math.min(this.route, RELAY_CORRIDOR_END) - Math.max(before, RELAY_CORRIDOR_START));
    this.inRange = inLateralRange && this.route >= RELAY_CORRIDOR_START && this.route <= RELAY_CORRIDOR_END;
    const link = this.activeLink!;
    if (link.advance(travel > 0 ? dt * overlap / travel : 0, inLateralRange && overlap > 0, grounded)) {
      if (this.beat === 'L3.02' && !this.relayA) {
        this.linkedAExitZ = RELAY_CORRIDOR_END - this.route;
        this.relayA = true; this.beat = 'L3.03'; this.route = 0; this.inRange = false;
        this.reaction = 1.5;
        return ['relay-a-linked', 'checkpoint-b'];
      }
      if (this.beat === 'L3.03' && !this.relayB) {
        this.linkedBExitZ = RELAY_CORRIDOR_END - this.route;
        this.relayB = true; this.mode = 'drain'; this.inRange = false;
        return ['relay-b-linked'];
      }
    }
    if (this.route >= RELAY_EXIT) {
      this.loop = true; this.loopDistance = 0; this.inRange = false;
      if (this.beat === 'L3.02') this.loopsA++; else this.loopsB++;
      return ['link-missed'];
    }
    return [];
  }

  corridor(): { startZ: number; endZ: number; minX: number; maxX: number; relay: Relay } | null {
    if (this.mode !== 'action' || !this.relay || this.loop || (this.relay === 'B' && !this.droneCleared)) return null;
    return { startZ: RELAY_CORRIDOR_START - this.route, endZ: RELAY_CORRIDOR_END - this.route,
      minX: RELAY_CORRIDOR_X.minX, maxX: RELAY_CORRIDOR_X.maxX, relay: this.relay };
  }
}
