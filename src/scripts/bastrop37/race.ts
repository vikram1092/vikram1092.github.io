/** Road legs target 85–100 seconds at 285 units/sec before traffic clears.
 * Keep every district and bend; trim travel without speeding up combat or story.
 * Route units match the shared simulation's speed × seconds. */
export type RoadSector = { name: string; length: number; bend: number; traffic: 'flow' | 'weave' | 'freight' | 'sprint'; };
export type RoadCourse = { name: string; sectors: RoadSector[] };
const sector = (name: string, length: number, bend: number, traffic: RoadSector['traffic']): RoadSector => ({ name, length, bend, traffic });
export const ROAD_COURSES: Record<string, RoadCourse> = {
  'L1.02': { name: 'INTAKE EXPRESS', sectors: [
    sector('OUTBOUND AVENUE', 2100, 0, 'flow'), sector('CANAL SWEEP', 2400, .65, 'flow'),
    sector('FREIGHT QUARTER', 2100, -.45, 'freight'), sector('SWITCHBACK WEST', 1800, -.95, 'weave'),
    sector('SWITCHBACK EAST', 1800, .95, 'weave'), sector('INTAKE STRAIGHT', 2400, 0, 'sprint'),
  ] },
  'L2.03': { name: 'RECOVERY RUN', sectors: [
    sector('INTAKE BREAKOUT', 1900, .45, 'sprint'), sector('OUTER RING', 2700, -.65, 'flow'),
    sector('INTERCHANGE', 1900, 1, 'weave'), sector('LOWER EXPRESS', 2400, -.8, 'freight'),
    sector('NORTHBOUND CUT', 1800, .9, 'weave'), sector('PURSUIT STRAIGHT', 3100, 0, 'sprint'),
  ] },
  'L3.02': { name: 'RELAY CROSSING', sectors: [
    sector('PUBLIC APPROACH', 2000, 0, 'flow'), sector('EAST AQUEDUCT', 2600, .75, 'freight'),
    sector('RELAY SWITCHBACK', 1800, -.95, 'weave'), sector('VIADUCT', 2700, 0, 'sprint'),
    sector('WEST AQUEDUCT', 2600, -.7, 'flow'), sector('RELAY ACCESS', 2100, .45, 'weave'),
  ] },
  'L4.02': { name: 'RESERVOIR RUN', sectors: [
    sector('RESERVOIR EDGE', 2400, -.65, 'flow'), sector('SPILLWAY', 2200, .9, 'weave'),
    sector('EVACUATION TRAFFIC', 2800, 0, 'freight'), sector('DAM SWITCHBACK', 1800, -1, 'weave'),
    sector('UPPER RESERVOIR', 2600, .8, 'flow'), sector('BUS ROAD APPROACH', 2100, 0, 'sprint'),
  ] },
  'L5.02': { name: 'CIVIC DESCENT', sectors: [
    sector('CIVIC EXPRESS', 2500, 0, 'sprint'), sector('ARCHIVE BEND', 2100, .95, 'weave'),
    sector('GOVERNMENT FREIGHT', 2500, -.6, 'freight'), sector('SOUTH SWITCHBACK', 1800, -1, 'weave'),
    sector('NORTH SWITCHBACK', 1800, 1, 'weave'), sector('PUBLIC MILE', 3500, 0, 'sprint'),
  ] },
};
// Keep the second district compact while preserving its road and traffic variety.
const DISTRICTS: Record<string, string[]> = {
  'L1.02': ['WAREHOUSE RUN', 'MARKET APPROACH', 'MARKET S-BEND', 'CANAL UNDERPASS', 'EAST FREIGHT', 'INTAKE VIADUCT'],
  'L2.03': ['LOWER RING', 'DEPOT EAST', 'DEPOT WEST', 'RAIL UNDERPASS', 'CARGO BYPASS', 'NORTH VIADUCT'],
  'L3.02': ['RELAY PROMENADE', 'EAST BANK', 'WEST BANK', 'AQUEDUCT UNDERPASS', 'RIVERSIDE FREIGHT', 'HIGH CROSSING'],
  'L4.02': ['LOWER RESERVOIR', 'DAM EAST', 'DAM WEST', 'SPILLWAY UNDERPASS', 'SUPPLY ROAD', 'UPPER VIADUCT'],
  'L5.02': ['CIVIC BOULEVARD', 'ARCHIVE EAST', 'ARCHIVE WEST', 'COUNCIL UNDERPASS', 'SERVICE DISTRICT', 'PUBLIC VIADUCT'],
};
for (const [beat, names] of Object.entries(DISTRICTS)) {
  const extra = [
    sector(names[0], 2400, 0, 'sprint'), sector(names[1], 1800, .7, 'flow'),
    sector(names[2], 1800, -.7, 'weave'), sector(names[3], 2100, 0, 'flow'),
    sector(names[4], 2400, -.4, 'freight'), sector(names[5], 2400, .55, 'sprint'),
  ];
  ROAD_COURSES[beat].sectors.splice(5, 0, ...extra);
}
export type RoadChallenge = { kind: 'drone' | 'rival' | 'barricade' | 'pothole'; lane: number };
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
      this.challenges.push({ kind: Math.floor(this.nextRival / 4500) % 3 === 2 ? 'drone' : 'rival', lane: Math.floor(this.nextRival / 4500) % 2 ? 0 : 4 });
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
