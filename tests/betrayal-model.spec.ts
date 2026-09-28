import { test, expect } from '@playwright/test';
import { BetrayalMission, SCAN_CORRIDOR } from '../src/scripts/bastrop37/betrayal';
import { OverdriveMeter } from '../src/scripts/bastrop37/overdrive';
import { BETRAYAL_DIALOGUE, BETRAYAL_RECORDS } from '../src/scripts/bastrop37/betrayal-content';
import { DELIVERY_DIALOGUE } from '../src/scripts/bastrop37/delivery-content';
import { betrayalSave, validBetrayalSave, validDeliverySave } from '../src/scripts/bastrop37/save';
import { readFileSync } from 'node:fs';
const legacy=JSON.parse(readFileSync('docs/bastrop37/phase3/earned-completion-save.json','utf8'));

const l1 = Object.values(DELIVERY_DIALOGUE).flat();
function reveal() {
  const m = new BetrayalMission(undefined, l1, [], l1);
  for(let i=0;i<3;i++) m.advance();
  expect(m.tick(5,1000,320,false)).toEqual(['scan']);
  expect(m.tick(60,1000,320,false)).toEqual([]);
  expect(m.record).toBeNull();
  expect(m.tick(0,0,320,true)).toEqual(['revelation']);
  return m;
}

test('equipment receipts precede confrontation and slow reading never changes route or flags', () => {
  const m = reveal();
  expect(m.record).toEqual(BETRAYAL_RECORDS[0]); expect(m.dialogue).toBeNull();
  m.tick(600,100000,320,true);
  expect(m.route).toBe(0); expect(m.betrayalKnown).toBe(false);
  m.advance(); expect(m.record).toEqual(BETRAYAL_RECORDS[1]);
  m.advance(); expect(m.dialogue?.id).toBe('L2.02-01');
  for(let i=0;i<6;i++) m.advance();
  expect(m.betrayalKnown).toBe(false);
  expect(m.advance()).toEqual(['checkpoint-escape']);
  expect(m.betrayalKnown).toBe(true); expect(m.reaction).toBe(1.5);
  expect(m.history.slice(16,18)).toEqual(BETRAYAL_RECORDS);
});

test('missed scan loops and steering escape requires continuous hold plus exit and actor clearance', () => {
  const scan = new BetrayalMission('CP-L2-SCAN');
  expect(scan.tick(5,1000,SCAN_CORRIDOR.maxX+10,true)).toEqual(['scan-missed']);
  expect(scan.scanEntered).toBe(false);
  expect(scan.tick(5,1000,320,true)).toEqual(['loop-return']);
  expect(scan.tick(5,1000,320,true)).toEqual(['scan']);
  const m = new BetrayalMission('CP-L2-ESCAPE');
  m.tick(1,1000,450,true); expect(m.lockOutside).toBe(1);
  m.tick(.1,10,320,true); expect(m.lockOutside).toBe(0);
  m.tick(1,1000,450,true); expect(m.lockBroken).toBe(false);
  expect(m.tick(.5,500,450,false)).toEqual(['lock-broken']);
  expect(m.tick(5,2000,450,false)).toEqual(['exit']);
  m.tick(600,100000,450,false); expect(m.mode).toBe('drain');
  expect(m.tick(0,0,450,true)).toEqual(['closure']);
  for(let i=0;i<3;i++) expect(m.advance()).toEqual([]);
  expect(m.advance()).toEqual(['level-complete']); expect(m.advance()).toEqual([]);
});

test('published version1 saves remain valid and L2 receipts/flags/history cannot be forged', () => {
  expect(validDeliverySave(legacy)).toBe(true);
  const m = reveal(); for(let i=0;i<9;i++) m.advance();
  const save = betrayalSave('CP-L2-ESCAPE',m.log,m.records,m.history);
  expect(validBetrayalSave(save)).toBe(true);
  for(const bad of [ {...save,records:[]}, {...save,history:[...save.history].reverse()}, {...save,flags:{...save.flags,omegaReleased:true}}, {...save,completedLevels:['L1','L2']}, {...save,log:[...save.log,...BETRAYAL_DIALOGUE['L2.04']]} ]) expect(validBetrayalSave(bad)).toBe(false);
  const restored = new BetrayalMission(save.checkpoint,save.log,save.records,save.history);
  expect(restored.betrayalKnown).toBe(true); expect(restored.dialogue).toBeNull(); expect(restored.record).toBeNull();
});

test('Overdrive awards each event once, has a distinct full meter and cannot retrigger an active burst', () => {
  const m = new OverdriveMeter();
  expect(m.activate()).toBe(false);
  expect(m.award('drone-kill','drone1')).toBe(true); expect(m.value).toBe(35);
  expect(m.award('drone-kill','drone1')).toBe(false);
  m.award('marked-landing','obstacle1');
  for(let i=0;i<5;i++) m.award('near-pass',`car${i}`);
  expect(m.value).toBe(100); expect(m.ready).toBe(true); expect(m.activate()).toBe(true);
  expect(m.value).toBe(0); expect(m.active).toBe(1.5); expect(m.activate()).toBe(false);
  m.tick(.75); expect(m.active).toBe(.75); m.tick(1); expect(m.active).toBe(0);
  expect(new OverdriveMeter().value).toBe(0);
});
