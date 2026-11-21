import {test} from '@playwright/test';
import assert from 'node:assert/strict';
import {ChaseCamera,PoseInterpolator,damp,type MotionPose} from '../src/scripts/roadster/motion';
import {FIXED_STEP,integrateSpeed} from '../src/scripts/roadster/physics';

const pose=(speed=156):MotionPose=>({x:2200,z:0,height:0,heading:0,speed,steer:0,flip:0});
const schedules=[[1/30],[1/60],[1/90],[1/144],[1/144,1/45,1/72,1/38,1/110,1/57]];

test('top-speed motion and camera spacing stay continuous across different display rates',()=>{
  for(const schedule of schedules){
    const state=pose(),motion=new PoseInterpolator(state),camera=new ChaseCamera();camera.snap(state);
    let accumulator=0,time=0,previousZ=0;
    for(let frame=0;frame<900;frame++){
      const dt=schedule[frame%schedule.length];time+=dt;accumulator+=dt;
      while(accumulator>=FIXED_STEP){motion.capture(state);state.z-=state.speed*FIXED_STEP;accumulator-=FIXED_STEP;}
      const visible=motion.sample(state,accumulator/FIXED_STEP);camera.update(visible,dt);
      assert.ok(Math.abs(camera.position.z-visible.z-4.8)<1e-8,'camera changes distance from the car');
      if(frame>2){
        assert.ok(Math.abs((previousZ-visible.z)/dt-156)<1e-7,'uneven visual velocity between physics steps');
        assert.ok(Math.abs(visible.z+156*(time-FIXED_STEP))<1e-7,'render pose drifts from elapsed time');
      }
      previousZ=visible.z;
    }
  }
});

test('hard braking holds a steady camera distance and smooths body pitch',()=>{
  for(const schedule of schedules){
    const state=pose(),motion=new PoseInterpolator(state),camera=new ChaseCamera();camera.snap(state);
    let accumulator=0,time=0,previousGap=4.8,pitch=0;
    while(time<4){
      const dt=schedule[Math.floor(time*1000)%schedule.length];time+=dt;accumulator+=dt;
      while(accumulator>=FIXED_STEP){motion.capture(state);state.speed=integrateSpeed(state.speed,false,true,false,FIXED_STEP);state.z-=state.speed*FIXED_STEP;accumulator-=FIXED_STEP;}
      const visible=motion.sample(state,accumulator/FIXED_STEP);camera.update(visible,dt);
      const gap=camera.position.z-visible.z;
      assert.ok(gap<=previousGap+1e-10,'camera pumps away from the car under braking');
      assert.ok(Math.abs(gap-4.8)<1e-9,'camera surges toward the car while braking');
      assert.ok(previousGap-gap<.5*dt,'camera compresses too abruptly');
      const nextPitch=damp(pitch,.027,9,dt);
      assert.ok(nextPitch>=pitch&&nextPitch<=.027,'braking pitch oscillates');
      pitch=nextPitch;previousGap=gap;
    }
  }
});

test('recovery snaps render history and camera together instead of streaking across the world',()=>{
  const state=pose(),motion=new PoseInterpolator(state),camera=new ChaseCamera();
  motion.capture(state);state.x=-2700;state.z=1500;state.heading=Math.PI;state.speed=0;state.height=0;
  motion.snap(state);camera.snap(state);
  for(const alpha of [0,.25,.5,.9,1]){
    const visible=motion.sample(state,alpha);
    assert.deepEqual(visible,state);
    assert.ok(Math.abs(Math.hypot(camera.position.x-visible.x,camera.position.z-visible.z)-4.8)<1e-9);
  }
});

test('heading interpolation takes the short arc and completed flips stay upright',()=>{
  const state=pose(40);state.heading=Math.PI-.01;state.flip=.99;
  const motion=new PoseInterpolator(state);motion.capture(state);state.heading=-Math.PI+.01;state.flip=0;
  const visible=motion.sample(state,.5);
  assert.ok(Math.abs(Math.abs(visible.heading)-Math.PI)<1e-9);
  assert.equal(visible.flip,0);
});
