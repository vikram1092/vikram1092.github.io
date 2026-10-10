import { test, expect } from '@playwright/test';
import { RoadRace, ROAD_COURSES } from '../src/scripts/bastrop37/race';

for (const [beat, course] of Object.entries(ROAD_COURSES)) {
  test(`${beat}: full-length route, continuous bends, readable traffic and a clean finish`, () => {
    const race = new RoadRace(course);
    expect(race.length / 300).toBeGreaterThanOrEqual(80);
    expect(new Set(course.sectors.map(s => s.traffic)).size).toBeGreaterThanOrEqual(3);
    let boundary = 0;
    for (const sector of course.sectors) {
      expect(Math.abs(race.curvature(boundary - .01) - race.curvature(boundary + .01))).toBeLessThan(.001);
      boundary += sector.length;
    }
    let waves = 0;
    while (race.position < race.length) {
      const cars = race.tick(.1, 30, false);
      if (cars.length) {
        waves++;
        expect(cars.length).toBeLessThanOrEqual(3);
        expect(cars.every(car => car.z >= 1150 && car.velocity < 200)).toBe(true);
        const occupied = new Set(cars.map(car => car.lane));
        expect([0, 1, 2, 3].some(lane => !occupied.has(lane) && !occupied.has(lane + 1))).toBe(true);
      }
      const center = race.centerline();
      expect(center[0]).toBe(0);
      expect(center.every(Number.isFinite)).toBe(true);
    }
    expect(waves).toBeGreaterThan(12);
    expect(race.complete).toBe(false);
    expect(race.tick(1, 300, true)).toEqual([]);
    expect(race.complete).toBe(true);
    expect(race.curvature()).toBe(0);
  });
}

test('sector retry gives a clear run-up, retains the timer, and cannot finish early', () => {
  const race = new RoadRace(ROAD_COURSES['L1.02']);
  race.tick(20, 6000, false);
  race.retrySector();
  expect(race.position).toBe(4200);
  expect(race.seconds).toBe(20);
  expect(race.tick(1, 300, true)).toEqual([]);
  expect(race.complete).toBe(false);
  expect(race.tick(2, 600, false).length).toBeGreaterThan(0);
});
