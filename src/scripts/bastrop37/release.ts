import type { BeatMode, DialogueLine, EquipmentRecord, TransmissionEntry } from './contracts';
import { RELEASE_DIALOGUE } from './release-content';
import { ControllerGate, type ControllerEvent } from './controller';
import { LinkProgress } from './link';
import type { ReleaseCheckpoint } from './save';

export type ReleaseBeat = 'L5.01' | 'L5.02' | 'L5.03' | 'L5.04' | 'L5.05';
export type ReleaseEvent = ControllerEvent | 'checkpoint-controller' | 'defender-approach' |
  'checkpoint-upload' | 'section-a-linked' | 'intercept-approach' | 'intercept-cleared' |
  'link-missed' | 'omega-released' | 'release-prefix-updated' | 'closure-ack' |
  'recovery-start' | 'campaign-complete';
export const UPLOAD_START = 420;
export const UPLOAD_END = 2720;
export const UPLOAD_EXIT = 2820;
export const UPLOAD_LOOP = 650;
export const UPLOAD_MIN_X = 225;
export const UPLOAD_MAX_X = 425;
export const RECOVERY_MARKER = 800;

/** Authored chapter state. Physical drone bodies and road contact belong to the shared rider simulation. */
export class ReleaseMission {
  beat: ReleaseBeat = 'L5.01';
  mode: BeatMode = 'story';
  dialogueIndex = 0;
  readonly log: DialogueLine[] = [];
  readonly records: EquipmentRecord[] = [];
  readonly history: TransmissionEntry[] = [];
  readonly controller = new ControllerGate();
  readonly linkA = new LinkProgress(5);
  readonly linkB = new LinkProgress(5);
  section: 'A' | 'B' | null = null;
  defenderStarted = false;
  defenderCleared = false;
  interceptStarted = false;
  interceptCleared = false;
  collisionCorridorClear = true;
  inRange = false;
  grounded = true;
  route = 0;
  loop = false;
  loopDistance = 0;
  loopsA = 0;
  loopsB = 0;
  linkedAExitZ: number | null = null;
  linkedBExitZ: number | null = null;
  barrierExitZ: number | null = null;
  omegaReleased = false;
  dawn = 0;
  recoveryRoute = 0;
  recoveryMarkerPassed = false;
  campaignComplete = false;

  constructor(checkpoint?: ReleaseCheckpoint, log: DialogueLine[] = [], records: EquipmentRecord[] = [], history: TransmissionEntry[] = []) {
    this.log.push(...log); this.records.push(...records); this.history.push(...history);
    if (checkpoint === 'CP-L5-CONTROLLER') {
      this.beat = 'L5.02'; this.mode = 'action';
    } else if (checkpoint === 'CP-L5-UPLOAD') {
      this.beat = 'L5.03'; this.mode = 'action'; this.section = 'A';
      this.controller.state = 'open'; this.controller.progress = 1;
      this.defenderStarted = this.defenderCleared = true;
      this.barrierExitZ = 260;
    } else if (checkpoint === 'CP-L5-RELEASED' || checkpoint === 'CP-CAMPAIGN-COMPLETE') {
      this.controller.state = 'open'; this.controller.progress = 1;
      this.defenderStarted = this.defenderCleared = true;
      this.interceptStarted = this.interceptCleared = true;
      this.linkA.seconds = this.linkB.seconds = 5;
      this.omegaReleased = true;
      const acknowledged = Math.max(0, this.log.length - 44);
      if (acknowledged < 3) {
        this.beat = 'L5.04'; this.mode = 'resolve'; this.dialogueIndex = acknowledged;
      } else {
        this.beat = 'L5.05'; this.mode = acknowledged < 6 ? 'story' : 'drain';
        this.dialogueIndex = Math.min(3, acknowledged - 3);
        this.dawn = 1;
      }
      if (checkpoint === 'CP-CAMPAIGN-COMPLETE') {
        this.beat = 'L5.05'; this.mode = 'resolve'; this.dialogueIndex = 3;
        this.recoveryMarkerPassed = this.campaignComplete = true;
      }
    }
  }

  get dialogue(): DialogueLine | null {
    if (this.beat === 'L5.05' && this.dawn < 1) return null;
    return this.mode === 'story' || this.mode === 'resolve' ? RELEASE_DIALOGUE[this.beat]?.[this.dialogueIndex] ?? null : null;
  }
  get dialogueCount(): number { return RELEASE_DIALOGUE[this.beat]?.length ?? 0; }
  get activeLink(): LinkProgress | null { return this.section === 'A' ? this.linkA : this.section === 'B' ? this.linkB : null; }
  get uploadProgress(): number { return (this.linkA.progress + this.linkB.progress) / 2; }
  get recoveryMarkerZ(): number | null { return this.beat === 'L5.05' && !this.recoveryMarkerPassed && this.mode === 'drain' ? RECOVERY_MARKER - this.recoveryRoute : null; }
  get objective(): string {
    if (this.beat === 'L5.02') return 'OPEN THE CIVIC CORRIDOR';
    if (this.beat === 'L5.03') return 'UPLOAD OMEGA';
    if (this.beat === 'L5.05') return this.campaignComplete ? 'HELP THE NEXT BLOCK' : 'RIDE TO THE NEXT BLOCK';
    return 'RELEASE OMEGA';
  }
  get routeCue(): string {
    if (this.beat === 'L5.02') {
      if (this.controller.loop) return 'CONTROLLER MISSED · RIGHT SERVICE LOOP';
      if (this.controller.state === 'retracting') return 'CONTROLLER DISABLED · BARRIER RETRACTING';
      if (this.defenderStarted && !this.defenderCleared) return 'DEFENDER AHEAD · CLEAR THE ROAD';
      return 'MARKED CONTROLLER · BLADES J / CTRL';
    }
    if (this.beat === 'L5.03') {
      if (this.interceptStarted && !this.interceptCleared) return 'INTERCEPTION · CLEAR THE DRONE';
      if (this.loop || (this.route >= UPLOAD_END - 260 && !this.activeLink?.complete)) return 'UPLOAD INCOMPLETE · SERVICE LOOP';
      return this.inRange ? this.grounded ? 'IN RANGE · HOLD CONNECTION' : 'LAND TO CONTINUE UPLOAD' : 'FOLLOW THE MARKED UPLOAD CORRIDOR';
    }
    return this.mode === 'drain' ? 'RECOVERY ROAD · SAFE RIDE' : 'SAFE CRUISE · READ';
  }
  get connectionState(): 'in-range' | 'linking' | 'out-of-range' | 'linked' {
    if (this.activeLink?.complete) return 'linked';
    if (!this.inRange || this.loop || (this.section === 'B' && (!this.interceptCleared || !this.collisionCorridorClear))) return 'out-of-range';
    return this.grounded ? 'linking' : 'in-range';
  }
  advance(): ReleaseEvent[] {
    const line = this.dialogue;
    if (!line) return [];
    this.log.push(line); this.history.push(line); this.dialogueIndex++;
    if (this.beat === 'L5.01' && this.dialogueIndex === 3) {
      this.beat = 'L5.02'; this.mode = 'action'; this.dialogueIndex = 0;
      return ['checkpoint-controller'];
    }
    if (this.beat === 'L5.04') {
      const events: ReleaseEvent[] = ['release-prefix-updated'];
      if (this.dialogueIndex === 3) {
        this.beat = 'L5.05'; this.mode = 'story'; this.dialogueIndex = 0; this.dawn = 0;
        events.push('closure-ack');
      }
      return events;
    }
    if (this.beat === 'L5.05') {
      const events: ReleaseEvent[] = ['release-prefix-updated'];
      if (this.dialogueIndex === 3) { this.mode = 'drain'; this.recoveryRoute = 0; events.push('recovery-start'); }
      return events;
    }
    return [];
  }
  controllerBladeHit(x: number, grounded: boolean, reach: number, active: boolean): ReleaseEvent[] {
    return this.beat === 'L5.02' && this.mode === 'action' ? this.controller.bladeHit(x, grounded, reach, active) : [];
  }
  droneCleared(phase: 'defender' | 'intercept'): ReleaseEvent[] {
    if (phase === 'defender' && this.defenderStarted && !this.defenderCleared) { this.defenderCleared = true; return []; }
    if (phase === 'intercept' && this.interceptStarted && !this.interceptCleared) {
      this.interceptCleared = true; this.route = 0; return ['intercept-cleared'];
    }
    return [];
  }
  tick(dt: number, travel: number, riderX: number, grounded: boolean, trafficClear: boolean): ReleaseEvent[] {
    this.collisionCorridorClear = trafficClear;
    if (this.linkedAExitZ !== null) this.linkedAExitZ -= travel;
    if (this.linkedBExitZ !== null) this.linkedBExitZ -= travel;
    if (this.barrierExitZ !== null) this.barrierExitZ -= travel;
    if (this.beat === 'L5.05' && this.dawn < 1) this.dawn = Math.min(1, this.dawn + Math.max(0, dt) / .8);
    if (this.mode === 'drain' && this.beat === 'L5.05') {
      const before = this.recoveryRoute;
      this.recoveryRoute += Math.max(0, travel);
      if (!this.recoveryMarkerPassed && before < RECOVERY_MARKER && this.recoveryRoute >= RECOVERY_MARKER) {
        this.recoveryMarkerPassed = this.campaignComplete = true;
        this.mode = 'resolve'; return ['campaign-complete'];
      }
      return [];
    }
    if (this.beat === 'L5.02' && this.mode === 'action') {
      const events = this.controller.tick(dt, travel);
      this.route = this.controller.route;
      if (events.includes('barrier-open')) {
        this.defenderStarted = true;
        return [...events, 'defender-approach'];
      }
      if (this.defenderStarted) { this.controller.route += Math.max(0, travel); this.route = this.controller.route; }
      if (this.defenderStarted && this.defenderCleared && trafficClear) {
        this.beat = 'L5.03'; this.mode = 'action'; this.section = 'A'; this.route = 0;
        this.barrierExitZ = this.controller.barrierZ;
        return ['checkpoint-upload'];
      }
      return events;
    }
    if (this.beat !== 'L5.03' || this.mode !== 'action') return [];
    if (this.section === 'B' && (!this.interceptCleared || !trafficClear)) return [];
    if (this.loop) {
      this.loopDistance += Math.max(0, travel);
      if (this.loopDistance < UPLOAD_LOOP) return [];
      this.loop = false; this.loopDistance = 0; this.route = 0; this.inRange = false;
      return ['loop-return'];
    }
    const before = this.route;
    this.route += Math.max(0, travel);
    this.grounded = grounded;
    const lateral = riderX >= UPLOAD_MIN_X && riderX <= UPLOAD_MAX_X;
    const overlap = Math.max(0, Math.min(this.route, UPLOAD_END) - Math.max(before, UPLOAD_START));
    this.inRange = lateral && this.route >= UPLOAD_START && this.route <= UPLOAD_END;
    const link = this.activeLink!;
    if (link.advance(travel > 0 ? dt * overlap / travel : 0, lateral && overlap > 0, grounded)) {
      if (this.section === 'A') {
        this.linkedAExitZ = UPLOAD_END - this.route;
        this.section = 'B'; this.route = 0; this.inRange = false;
        this.interceptStarted = true;
        return ['section-a-linked', 'intercept-approach'];
      }
      this.linkedBExitZ = UPLOAD_END - this.route;
      if (this.linkA.complete && this.linkB.complete && trafficClear && this.interceptCleared && !this.omegaReleased) {
        this.omegaReleased = true; this.beat = 'L5.04'; this.mode = 'resolve'; this.section = null; this.dialogueIndex = 0;
        return ['omega-released'];
      }
    }
    if (this.linkA.complete && this.linkB.complete && trafficClear && this.interceptCleared && !this.omegaReleased) {
      this.omegaReleased = true; this.beat = 'L5.04'; this.mode = 'resolve'; this.section = null; this.dialogueIndex = 0;
      return ['omega-released'];
    }
    if (this.route >= UPLOAD_EXIT && !link.complete) {
      this.loop = true; this.loopDistance = 0; this.inRange = false;
      if (this.section === 'A') this.loopsA++; else this.loopsB++;
      return ['link-missed'];
    }
    return [];
  }
  corridor(): { section: 'A' | 'B'; startZ: number; endZ: number; minX: number; maxX: number } | null {
    if (this.beat !== 'L5.03' || this.mode !== 'action' || !this.section || this.loop ||
      (this.section === 'B' && (!this.interceptCleared || !this.collisionCorridorClear)) || this.activeLink?.complete) return null;
    return { section: this.section, startZ: UPLOAD_START - this.route, endZ: UPLOAD_END - this.route,
      minX: UPLOAD_MIN_X, maxX: UPLOAD_MAX_X };
  }
}
