import { test } from '@playwright/test';
import assert from 'node:assert/strict';
import { FIXED_STEP, SIXTY_MPH, integrateSpeed } from '../src/scripts/roadster/physics';

test('Rocket launch reaches 60 mph in less than 0.59 seconds', () => {
  let speed=0,time=0;
  while(speed<SIXTY_MPH){speed=integrateSpeed(speed,true,false,false,FIXED_STEP);time+=FIXED_STEP;}
  assert.ok(time>=.58&&time<.59,`0–60 was ${time}s`);
});
test('braking stops a 100 mph run within 1.2 seconds', () => {
  let speed=44.704;
  for(let i=0;i<144;i++)speed=integrateSpeed(speed,false,true,false,FIXED_STEP);
  assert.ok(speed<=0&&speed>=-1);
});
test('continuous rocket boost remains available and bounded after five minutes', () => {
  let speed=0;
  for(let i=0;i<36000;i++)speed=integrateSpeed(speed,true,false,true,FIXED_STEP);
  assert.ok(speed>150&&speed<=156);
});
test('coasting comes to rest, without reversing or accumulating nonfinite state', () => {
  let speed=100;
  for(let i=0;i<12000;i++)speed=integrateSpeed(speed,false,false,false,FIXED_STEP);
  assert.equal(speed,0);
});
