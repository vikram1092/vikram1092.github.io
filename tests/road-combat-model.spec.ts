import { test, expect } from '@playwright/test';
import { RideGesture, RoadRival } from '../src/scripts/bastrop37/road-combat';

test('one finger steers while an up/down stroke fires each ability once', () => {
  const gesture = new RideGesture();
  expect(gesture.start(1, 100, 400, 320)).toBe(true);
  expect(gesture.start(2, 200, 400, 320)).toBe(false);
  expect(gesture.move(2, 200, 300, 390)).toBeNull();
  expect(gesture.move(1, 150, 400, 390)).toBeNull();
  expect(gesture.targetX).toBeGreaterThan(380);
  expect(gesture.move(1, 150, 340, 390)).toBe('jump');
  expect(gesture.move(1, 150, 240, 390)).toBeNull();
  expect(gesture.move(1, 150, 300, 390)).toBe('spikes');
  expect(gesture.move(1, 150, 400, 390)).toBeNull();
  gesture.end(2); expect(gesture.pointer).toBe(1);
  gesture.end(); expect(gesture.pointer).toBeNull();
});

test('rival warns before committing a side strike; steering away dodges it', () => {
  const rival = new RoadRival(1, 1);
  const rider = { x: 320, height: 0, spikes: false, reach: 80 };
  let warned = false;
  for (let i = 0; i < 300 && !warned; i++) warned = rival.tick(.05, rider, []).includes('windup');
  expect(warned).toBe(true); expect(rival.targetX).toBe(320);
  const events = [];
  for (let i = 0; i < 32; i++) events.push(...rival.tick(.05, { ...rider, x: 200 }, []));
  expect(events).not.toContain('player-hit');
});

test('an ignored warning produces one side hit, not damage every frame', () => {
  const rival = new RoadRival(1, 1); rival.x = 386; rival.z = 12; rival.phase = 'windup'; rival.targetX = 320;
  const events = [];
  for (let i = 0; i < 45; i++) events.push(...rival.tick(.05, { x: 320, height: 0, spikes: false, reach: 80 }, []));
  expect(events.filter(event => event === 'player-hit')).toHaveLength(1);
});

test('spikes require side range and grounding; two separate counters drop a rider', () => {
  const rival = new RoadRival(1, 1); rival.x = 386; rival.z = 12; rival.phase = 'flank';
  const rider = { x: 320, height: 0, spikes: true, reach: 100 };
  expect(rival.tick(.01, { ...rider, height: 35 }, [])).toEqual([]);
  expect(rival.tick(.01, rider, [])).toEqual(['counter']);
  for (let i = 0; i < 10; i++) rival.tick(.05, rider, []);
  expect(rival.health).toBe(1);
  let knockedOut = false;
  for (let i = 0; i < 70; i++) if (rival.tick(.05, rider, []).includes('knockout')) knockedOut = true;
  expect(knockedOut).toBe(true); expect(rival.health).toBe(0);
  expect(rival.finished).toBe(true);
});

test('jumping clears a committed strike and road traffic blocks a rival attack path', () => {
  for (const airborne of [false, true]) {
    const rival = new RoadRival(1, 1); rival.x = 386; rival.z = 12; rival.phase = 'strike'; rival.targetX = 320;
    const events = [];
    for (let i = 0; i < 12; i++) events.push(...rival.tick(.05, { x: 320, height: airborne ? 40 : 0, spikes: false, reach: 80 }, airborne ? [] : [{ x: 350, z: 12, w: 64 }]));
    expect(events).not.toContain('player-hit');
  }
});

test('rivals leave visibly before a route can finish', () => {
  const rival = new RoadRival(1, -1); rival.z = 12;
  for (let i = 0; i < 100; i++) rival.tick(.05, { x: 320, height: 0, spikes: false, reach: 80 }, [], true);
  expect(rival.finished).toBe(true);
});
