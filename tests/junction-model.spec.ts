import { test, expect } from '@playwright/test';
import { RoadJunction } from '../src/scripts/bastrop37/junction';

test('every point across the usable right entrance, including full-right steering, selects the branch', () => {
  for (const x of [370, 397, 440, 490]) {
    const road = new RoadJunction('INTAKE');
    const events = [];
    while (!road.selected && road.position < road.decisionEnd) events.push(...road.tick(8,x));
    expect(events).toContain('exit-entered'); expect(road.complete).toBe(false);
    expect(road.position).toBeLessThan(2400);
    const localX = x-road.origin;
    expect(localX).toBeGreaterThanOrEqual(road.riderBounds.min);
    expect(localX).toBeLessThanOrEqual(road.riderBounds.max);
    road.tick(road.destination-road.position-1,localX);
    expect(road.complete).toBe(false);
    expect(road.tick(1,localX)).toEqual(['arrived']);
  }
});

test('staying on the main road visibly loops back; arrival cannot be granted on a miss', () => {
  const road = new RoadJunction('CIVIC ROAD');
  expect(road.tick(3000,320)).toContain('exit-missed');
  expect(road.phase).toBe('return'); expect(road.complete).toBe(false);
  expect(road.centerAhead(1200)).not.toBe(0);
  expect(road.tick(5000,320)).toContain('returned');
  expect(road.phase).toBe('approach'); expect(road.position).toBe(400);
  road.tick(2100,490); expect(road.selected).toBe(true);
});

test('painted road strips and hit boundaries agree, with a continuous selected path', () => {
  const road = new RoadJunction('SERVICE ROAD');
  road.tick(1500,320);
  expect(road.stripsAhead(100)).toHaveLength(1);
  expect(road.stripsAhead(1200)).toHaveLength(2);
  road.tick(800,397);
  expect(road.selected).toBe(true);
  for (let i=0;i<200;i++) {
    const before = road.centerAhead(500);
    const strip = road.stripsAhead(0).find(strip=>strip.exit)!;
    expect(strip.center).toBeCloseTo(320);
    expect(road.riderBounds.min).toBeCloseTo(strip.center-strip.width/2+22);
    expect(road.riderBounds.max).toBeCloseTo(strip.center+strip.width/2-22);
    road.tick(8,320);
    expect(Math.abs(road.centerAhead(500)-before)).toBeLessThan(3);
  }
});

test('jumping over the branch mouth does not select a road beneath the rider', () => {
  const road = new RoadJunction('SERVICE ROAD');
  road.tick(3000,490,false);
  expect(road.phase).toBe('return'); expect(road.selected).toBe(false);
});
