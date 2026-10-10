/** Authored road legs. Route units match the shared simulation's speed × seconds. */
export type RoadSector = { name: string; length: number; bend: number; traffic: 'flow' | 'weave' | 'freight' | 'sprint'; };
export type RoadCourse = { name: string; sectors: RoadSector[] };
const sector = (name: string, length: number, bend: number, traffic: RoadSector['traffic']): RoadSector => ({ name, length, bend, traffic });
export const ROAD_COURSES: Record<string, RoadCourse> = {
  'L1.02': { name: 'INTAKE EXPRESS', sectors: [
    sector('OUTBOUND AVENUE', 4200, 0, 'flow'), sector('CANAL SWEEP', 4800, .65, 'flow'),
    sector('FREIGHT QUARTER', 4200, -.45, 'freight'), sector('SWITCHBACK WEST', 3600, -.95, 'weave'),
    sector('SWITCHBACK EAST', 3600, .95, 'weave'), sector('INTAKE STRAIGHT', 4800, 0, 'sprint'),
  ] },
  'L2.03': { name: 'RECOVERY RUN', sectors: [
    sector('INTAKE BREAKOUT', 3800, .45, 'sprint'), sector('OUTER RING', 5400, -.65, 'flow'),
    sector('INTERCHANGE', 3800, 1, 'weave'), sector('LOWER EXPRESS', 4800, -.8, 'freight'),
    sector('NORTHBOUND CUT', 3600, .9, 'weave'), sector('PURSUIT STRAIGHT', 6200, 0, 'sprint'),
  ] },
  'L3.02': { name: 'RELAY CROSSING', sectors: [
    sector('PUBLIC APPROACH', 4000, 0, 'flow'), sector('EAST AQUEDUCT', 5200, .75, 'freight'),
    sector('RELAY SWITCHBACK', 3600, -.95, 'weave'), sector('VIADUCT', 5400, 0, 'sprint'),
    sector('WEST AQUEDUCT', 5200, -.7, 'flow'), sector('RELAY ACCESS', 4200, .45, 'weave'),
  ] },
  'L4.02': { name: 'RESERVOIR RUN', sectors: [
    sector('RESERVOIR EDGE', 4800, -.65, 'flow'), sector('SPILLWAY', 4400, .9, 'weave'),
    sector('EVACUATION TRAFFIC', 5600, 0, 'freight'), sector('DAM SWITCHBACK', 3600, -1, 'weave'),
    sector('UPPER RESERVOIR', 5200, .8, 'flow'), sector('BUS ROAD APPROACH', 4200, 0, 'sprint'),
  ] },
  'L5.02': { name: 'CIVIC DESCENT', sectors: [
    sector('CIVIC EXPRESS', 5000, 0, 'sprint'), sector('ARCHIVE BEND', 4200, .95, 'weave'),
    sector('GOVERNMENT FREIGHT', 5000, -.6, 'freight'), sector('SOUTH SWITCHBACK', 3600, -1, 'weave'),
    sector('NORTH SWITCHBACK', 3600, 1, 'weave'), sector('PUBLIC MILE', 7000, 0, 'sprint'),
  ] },
};
export type RoadChallenge = { kind: 'rival' | 'barricade' | 'pothole'; lane: number };
export type RoadTraffic = { lane: number; z: number; kind: 'coupe' | 'sedan' | 'hauler'; velocity: number };
export class RoadRace {
  position = 0;
  seconds = 0;
  complete = false;
  overtakes = 0;
  private nextWave = 650;
  private nextRival = 1800;
  private nextObstacle = 3400;
  challenges: RoadChallenge[] = [];
  readonly length: number;
  constructor(readonly course: RoadCourse) { this.length = course.sectors.reduce((n, s) => n + s.length, 0); }
  locate(position = this.position): { sector: RoadSector; index: number; start: number; local: number } {
    let start = 0;
    for (const [index, sector] of this.course.sectors.entries()) {
      if (position < start + sector.length || index === this.course.sectors.length - 1)
        return { sector, index, start, local: Math.max(0, position - start) };
      start += sector.length;
    }
    throw new Error('A road course needs sectors');
  }
  curvature(position = this.position): number {
    if (position < 0 || position >= this.length) return 0;
    const { sector, local } = this.locate(position);
    // Ease both ends to zero so sector boundaries never snap steering or the road.
    const ease = Math.min(1, local / 800, (sector.length - local) / 800);
    return sector.bend * (ease * ease * (3 - 2 * ease));
  }
  get cue(): string {
    const { sector, index, local } = this.locate();
    const next = this.course.sectors[index + 1];
    const upcoming = next && sector.length - local < 1100 ? next : sector;
    const direction = upcoming.bend < -.1 ? 'LEFT' : upcoming.bend > .1 ? 'RIGHT' : 'STRAIGHT';
    return `${upcoming !== sector ? 'NEXT · ' : ''}${direction}${direction !== 'STRAIGHT' ? ` · ${Math.round((330-Math.abs(upcoming.bend)*110)/10)*10} KM/H` : ''}${Math.abs(upcoming.bend) > .8 ? ' · BRAKE / SLIDE' : direction === 'STRAIGHT' ? ' · BUILD SPEED' : ' · SWEEP'}`;
  }
  /** Shared world-space centerline, sampled once per frame for sprites and asphalt. */
  centerline(): number[] {
    const points = [0]; let heading = 0, center = 0;
    for (let z = 40; z <= 2000; z += 40) {
      const curve = this.curvature(this.position + z - 20) * .0017;
      center += heading * 40 + curve * 800;
      heading += curve * 40; points.push(center);
    }
    return points;
  }
  tick(dt: number, travel: number, trafficClear: boolean): RoadTraffic[] {
    this.challenges = [];
    if (this.complete) return [];
    this.seconds += Math.max(0, dt);
    this.position = Math.min(this.length, this.position + Math.max(0, travel));
    if (this.position >= this.length) { this.complete = trafficClear; return []; }
    while (this.nextRival <= this.position && this.nextRival < this.length - 3500) {
      this.challenges.push({ kind: 'rival', lane: Math.floor(this.nextRival / 4500) % 2 ? 0 : 4 });
      this.nextRival += 4500;
    }
    while (this.nextObstacle <= this.position && this.nextObstacle < this.length - 2500) {
      this.challenges.push({ kind: Math.floor(this.nextObstacle / 3400) % 2 ? 'barricade' : 'pothole', lane: Math.floor(this.nextObstacle / 3400) % 5 });
      this.nextObstacle += 3400;
    }
    const spawned: RoadTraffic[] = [];
    while (this.nextWave <= this.position && this.nextWave < this.length - 2400) {
      const { sector, index, local } = this.locate(this.nextWave);
      const wave = Math.floor(local / 1100) + index * 3;
      // At most three occupied lanes, always leaving a contiguous two-lane route.
      const gap = (wave + index) % 4;
      const lanes = [0, 1, 2, 3, 4].filter(lane => lane !== gap && lane !== gap + 1);
      const count = sector.traffic === 'freight' ? 3 : sector.traffic === 'flow' ? 2 : 3;
      lanes.slice(0, count).forEach((lane, i) => spawned.push({
        lane, z: 1150 + i * (sector.traffic === 'weave' ? 240 : 125),
        kind: sector.traffic === 'freight' && i === 0 ? 'hauler' : (wave + i) % 2 ? 'sedan' : 'coupe',
        velocity: sector.traffic === 'sprint' ? 155 + i * 12 : sector.traffic === 'freight' ? 65 : 100 + i * 15,
      }));
      this.nextWave += sector.traffic === 'weave' ? 1450 : sector.traffic === 'freight' ? 1700 : 1500;
    }
    return spawned;
  }
  retrySector(): void {
    this.position = this.locate().start;
    this.nextWave = this.position + 650;
    this.nextRival = this.position + 1800;
    this.nextObstacle = this.position + 3400;
    this.complete = false;
  }
}
