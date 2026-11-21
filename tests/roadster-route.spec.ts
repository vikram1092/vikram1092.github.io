import {test} from '@playwright/test';
import assert from 'node:assert/strict';
import {createRoute,ROAD_HALF_WIDTH,ROUTE_SECTIONS} from '../src/scripts/roadster/route';
import {FIXED_STEP,integrateSpeed,steeringYaw} from '../src/scripts/roadster/physics';

const circuit=createRoute();
test('Miami loop closes smoothly, with two long full-speed straights',()=>{
  assert.equal(circuit.length,15200);
  assert.ok(circuit.route.getPointAt(0).distanceTo(circuit.route.getPointAt(1-1e-8))<.001);
  assert.ok(circuit.route.getTangentAt(0).dot(circuit.route.getTangentAt(1-1e-8))>.999999);
  assert.ok(ROUTE_SECTIONS.filter(s=>!s.turn&&s.length>=3200).length>=2);
  let speed=0,distance=0,time=0;
  while(distance<3000){speed=integrateSpeed(speed,true,false,true,FIXED_STEP);distance+=speed*FIXED_STEP;time+=FIXED_STEP;}
  assert.ok(speed>155,`Only reached ${speed} m/s before the turn`);
  assert.ok(time>20,'straight should give time to use sustained boost');
  assert.ok(ROAD_HALF_WIDTH>=18);
});
test('all corners are driveable at maximum boost with steering reserve and eased entry',()=>{
  for(let i=0;i<circuit.samples.length;i++){
    const requiredYaw=circuit.curvatures[i]*156;
    assert.ok(requiredYaw<steeringYaw(156,1)*.8,`insufficient steering reserve at sample ${i}`);
    const previous=circuit.curvatures[(i+circuit.curvatures.length-1)%circuit.curvatures.length];
    assert.ok(Math.abs(circuit.curvatures[i]-previous)<.00004,'abrupt curvature transition');
  }
  assert.ok(1/Math.max(...circuit.curvatures)>730);
});
test('nearest-road projection and recovery stay accurate on both edges of every section',()=>{
  for(let distance=0;distance<circuit.length;distance+=37){
    const p=circuit.route.getPointAt(distance/circuit.length),t=circuit.route.getTangentAt(distance/circuit.length);
    for(const side of [-1,1]){
      const x=p.x-t.z*side*17,z=p.z+t.x*side*17,near=circuit.nearest(x,z);
      assert.ok(Math.abs(near.distance-17)<.02,`wrong edge at ${distance}`);
      assert.equal(Math.sign(near.side),side);
      assert.ok(near.point.distanceTo(p)<.05,'recovery projects along the wrong road');
    }
  }
});
test('high-speed steering supports fine corrections and reverse keeps its steering direction',()=>{
  for(const speed of [30,108,156]){
    assert.equal(steeringYaw(speed,0),0);
    assert.ok(steeringYaw(speed,.1)<steeringYaw(speed,1)*.22);
    assert.equal(steeringYaw(speed,-1),-steeringYaw(speed,1));
  }
  assert.ok(steeringYaw(-10,1)<0);
});
