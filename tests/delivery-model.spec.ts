import { test, expect } from '@playwright/test';
import { DeliveryMission, SERVICE_CORRIDOR } from '../src/scripts/bastrop37/delivery';
import { DELIVERY_DIALOGUE } from '../src/scripts/bastrop37/delivery-content';
import { deliverySave, validDeliverySave } from '../src/scripts/bastrop37/save';

const opening = DELIVERY_DIALOGUE['L1.01'];
const service = DELIVERY_DIALOGUE['L1.03'];
const closure = DELIVERY_DIALOGUE['L1.05'];

test('reading holds mission route and requires all thirteen acknowledgments', () => {
  const mission = new DeliveryMission();
  expect(mission.tick(600, 100000, 320, true)).toEqual([]);
  expect(mission.route).toBe(0);
  expect(mission.dialogue?.id).toBe('L1.01-01');
  for (let i = 0; i < 4; i++) expect(mission.advance()).toEqual([]);
  expect(mission.advance()).toEqual(['checkpoint-action']);
  expect(mission.advance()).toEqual([]);
  expect(mission.log).toEqual(opening);
  mission.tick(30, 10000, 320, false);
  expect(mission.mode).toBe('drain');
  expect(mission.dialogue).toBeNull();
  mission.tick(600, 100000, 320, false);
  expect(mission.mode).toBe('drain');
  expect(mission.tick(0, 0, 320, true)).toContain('drain-complete');
  expect(mission.dialogue?.id).toBe('L1.03-01');
  for (let i = 0; i < 5; i++) mission.advance();
  expect(mission.objective).toBe('TAKE THE SERVICE LANE');
  mission.tick(30, 10000, (SERVICE_CORRIDOR.minX + SERVICE_CORRIDOR.maxX) / 2, true);
  expect(mission.gates.serviceGate).toBe(true);
  expect(mission.gates.approach).toBe(true);
  mission.tick(0, 0, 400, true);
  expect(mission.dialogue?.id).toBe('L1.05-01');
  for (let i = 0; i < 2; i++) expect(mission.advance()).toEqual([]);
  expect(mission.advance()).toEqual(['level-complete']);
  expect(mission.advance()).toEqual([]);
  expect(mission.log).toEqual([...opening, ...service, ...closure]);
});

test('missed service entrance cannot complete and repeat approach recovers', () => {
  const mission = new DeliveryMission('CP-L1-SERVICE', [...opening, ...service]);
  mission.tick(30, 10000, 490, true);
  expect(mission.loop).toBe(true);
  expect(mission.gates.serviceGate).toBe(false);
  expect(mission.gates.approach).toBe(false);
  mission.tick(30, 10000, 400, true);
  expect(mission.route).toBe(0);
  expect(mission.loop).toBe(false);
  mission.tick(30, 10000, 400, true);
  expect(mission.gates.serviceGate).toBe(true);
  expect(mission.gates.approach).toBe(true);
});

test('save validation rejects corruption and preserves contained Omega', () => {
  const good = deliverySave('CP-L1-ACTION', opening);
  expect(validDeliverySave(good)).toBe(true);
  for (const corrupt of [
    { ...good, version: 99 },
    { ...good, checkpoint: 'CP-L5-RELEASED' },
    { ...good, completedLevels: ['L1'] },
    { ...good, flags: {} },
    { ...good, flags: { ...good.flags, omegaReleased: true } },
    { ...good, log: [] },
    { ...good, acknowledged: [...good.acknowledged].reverse() },
    { ...good, log: good.log.map((line, i) => i ? line : { ...line, text: 'Forged story.' }) },
  ]) expect(validDeliverySave(corrupt)).toBe(false);
});
