import {test} from '@playwright/test';
import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3} from 'three';
import {DrivingEffects,type EffectInput} from '../src/scripts/roadster/effects';
import {ChaseCamera} from '../src/scripts/roadster/motion';

const boost:EffectInput={driving:true,speed:156,boost:true,braking:false,shock:0};
const schedules=[[1/30],[1/60],[1/90],[1/144],[1/144,1/45,1/72,1/38,1/110,1/57]];

test('boost and braking envelopes are consistent across display rates',()=>{
  const results=[];
  for(const schedule of schedules){
    const effects=new DrivingEffects();
    for(const input of [boost,{...boost,boost:false,braking:true},{...boost,boost:false,braking:false}]){
      let elapsed=0,frame=0;
      while(elapsed<2){const dt=Math.min(schedule[frame++%schedule.length],2-elapsed);effects.update(input,dt);elapsed+=dt;}
    }
    results.push({...effects.value});
  }
  for(const actual of results)for(const key of Object.keys(actual) as (keyof typeof actual)[]){
    assert.ok(Math.abs(actual[key]-results[0][key])<1e-9,`${key} depends on refresh timing`);
  }
});

test('boost ramps in, braking settles once, and both ease away without overshoot',()=>{
  const effects=new DrivingEffects();
  const first={...effects.update(boost,1/60)};
  assert.ok(first.boost>0&&first.boost<.15,'boost snaps on');
  for(let i=0;i<180;i++)effects.update(boost,1/60);
  assert.ok(effects.value.blur>.027&&effects.value.fov>3.99,'full boost has no distinct response');
  let previousBoost=effects.value.boost,previousBrake=0;
  for(let i=0;i<180;i++){
    // Brake takes precedence even if Shift is still held.
    const fx=effects.update({...boost,braking:true},1/60);
    assert.ok(fx.boost<=previousBoost&&fx.boost>=0);
    assert.ok(fx.brake>=previousBrake&&fx.brake<=1);
    assert.ok(fx.fov>=-1.2&&fx.fov<=4);
    previousBoost=fx.boost;previousBrake=fx.brake;
  }
  assert.ok(effects.value.blur<.008&&Math.abs(effects.value.roll)<.0002,'braking keeps boost turbulence');
  for(let i=0;i<180;i++){
    const fx=effects.update({...boost,boost:false,braking:false,speed:0},1/60);
    assert.ok(fx.brake<=previousBrake&&fx.brake>=0);previousBrake=fx.brake;
  }
  assert.ok(effects.value.blur<1e-6&&Math.abs(effects.value.pitch)<1e-6,'effect persists at rest');
});

test('full-speed buffeting stays subpixel and cannot change the chase stand-off',()=>{
  for(const schedule of schedules){
    const effects=new DrivingEffects(),chase=new ChaseCamera();
    const pose={x:2200,z:0,height:0,heading:0,speed:156,steer:0,flip:0};chase.snap(pose);
    const camera=new PerspectiveCamera(84,16/10,.08,24000),subject=new Vector3(),reference=new Vector3();
    for(let frame=0;frame<900;frame++){
      const dt=schedule[frame%schedule.length];pose.z-=pose.speed*dt;chase.update(pose,dt);
      const fx=effects.update(boost,dt);
      camera.position.copy(chase.position);camera.lookAt(new Vector3().copy(chase.target));camera.updateMatrixWorld();
      reference.set(pose.x,.65,pose.z).project(camera);
      camera.rotateX(fx.pitch);camera.rotateZ(fx.roll);camera.updateMatrixWorld();
      subject.set(pose.x,.65,pose.z).project(camera);
      assert.ok(Math.abs(subject.x-reference.x)*720<.5,'horizontal buffeting exceeds half a pixel at 1440×900');
      assert.ok(Math.abs(subject.y-reference.y)*450<.5,'vertical buffeting exceeds half a pixel at 1440×900');
      assert.ok(Math.abs(camera.position.z-pose.z-4.8)<1e-9,'effects move the chase mount');
      assert.ok(Math.abs(fx.roll)<=.002&&Math.abs(fx.pitch)<=.0006);
    }
  }
});

test('recovery, orbit and reverse cannot retain boost or braking effects',()=>{
  const effects=new DrivingEffects();
  for(let i=0;i<60;i++)effects.update(boost,1/60);
  effects.reset();assert.ok(Object.values(effects.value).every(value=>value===0));
  effects.update(boost,.1);
  effects.update({...boost,driving:false},1/60);
  assert.ok(Object.values(effects.value).every(value=>value===0));
  for(let i=0;i<60;i++)effects.update({...boost,speed:-10,braking:true},1/60);
  assert.ok(Object.values(effects.value).every(value=>value===0));
});
