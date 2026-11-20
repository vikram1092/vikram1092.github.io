import {test} from '@playwright/test';
import assert from 'node:assert/strict';
import {vehiclePresentation,RUNNING_LAMP_INTENSITY,BRAKE_LAMP_INTENSITY} from '../src/scripts/roadster/presentation';

test('holding reverse never deploys the air brake or boosts the brake lamp',()=>{
  for(const speed of [0,-.1,-1,-10,-40]){
    const p=vehiclePresentation(speed,true);
    assert.equal(p.wingLift,0);assert.equal(p.wingRearward,0);assert.equal(p.wingAngle,0);
    assert.equal(p.braking,false);assert.equal(p.lampIntensity,RUNNING_LAMP_INTENSITY);
  }
});

test('spoiler extends predominantly rearward and stays low throughout deployment',()=>{
  for(const brake of [false,true]){
    let previous=0;
    for(let speed=0;speed<=50;speed+=.25){
      const p=vehiclePresentation(speed,brake);
      assert.ok(p.wingRearward>=previous&&p.wingRearward<=.30);
      assert.ok(p.wingRearward>=2*p.wingLift);
      assert.ok(p.wingLift<=.13);
      previous=p.wingRearward;
    }
    assert.ok(previous>.25);
  }
});
test('forward braking visibly boosts the lamp and only tilts a lifted wing',()=>{
  for(const speed of [.2,2,7,12,22,50]){
    const p=vehiclePresentation(speed,true);
    assert.equal(p.braking,true);assert.equal(p.lampIntensity,BRAKE_LAMP_INTENSITY);
    assert.ok(p.lampIntensity>=vehiclePresentation(speed,false).lampIntensity*3);
    // The swept wing edge must clear its recess throughout deployment.
    assert.ok(p.wingLift-Math.sin(Math.abs(p.wingAngle))*.24>=0);
  }
  assert.equal(vehiclePresentation(2,true).wingAngle,0);
  assert.ok(vehiclePresentation(50,false).wingLift>0);
  assert.equal(vehiclePresentation(50,false).wingAngle,0);
});
