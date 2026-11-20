import {test} from '@playwright/test';
import assert from 'node:assert/strict';
import {roof,sail,skinX,sideX,shoulder,width,upperBody,backlightHalfWidth,sideGlassBounds,rearFascia,rearValance,rearCorner,CANOPY_REAR,SIDE_GLASS_START,SIDE_GLASS_END} from '../src/scripts/roadster/car-geometry';

test('side apertures stay inside the body and close at both rounded returns',()=>{
  for(let i=0;i<=1000;i++){
    const z=SIDE_GLASS_START+(SIDE_GLASS_END-SIDE_GLASS_START)*i/1000;
    const [top,bottom]=sideGlassBounds(z);
    assert.ok(top>=bottom,`inverted aperture at ${z}`);
    assert.ok(top<roof(z,1)[1],`glass crosses roof at ${z}`);
    assert.ok(bottom>shoulder(z),`glass crosses shoulder at ${z}`);
    for(const y of [top,bottom])assert.ok(Number.isFinite(skinX(z,y)));
  }
  for(const z of [SIDE_GLASS_START,SIDE_GLASS_END]){
    const [top,bottom]=sideGlassBounds(z);assert.ok(Math.abs(top-bottom)<1e-8);
  }
});

test('rear glazing narrows inside the buttresses without crossing the roof',()=>{
  let previous=backlightHalfWidth(.72);
  for(let i=0;i<=300;i++){
    const z=.72+(CANOPY_REAR-.72)*i/300,w=backlightHalfWidth(z);
    assert.ok(w<=previous+1e-8,`backlight widens at ${z}`);
    assert.ok(w>0&&w<=roof(z,1)[0]);previous=w;
    const left=roof(z,-w/roof(z,1)[0]),right=roof(z,w/roof(z,1)[0]);
    assert.ok(Math.abs(left[0]+right[0])<1e-9);
    assert.equal(left[1],right[1]);
  }
});

test('airfoil leading section meets the roof and both quarter surfaces',()=>{
  for(let i=0;i<=100;i++){
    const v=i/100;
    for(const side of [-1,1]){
      const p=sail(CANOPY_REAR,v,side),q=upperBody(CANOPY_REAR,p[0]);
      assert.ok(Math.abs(p[1]-q[1])<1e-8,`open quarter join at ${v}`);
    }
    const p=roof(CANOPY_REAR,v),q=upperBody(CANOPY_REAR,p[0]);
    assert.deepEqual(p,q);
  }
  assert.ok(width(CANOPY_REAR)>roof(CANOPY_REAR,1)[0]);
});

test('rear carbon meets the fascia and returns upward from the wheel opening',()=>{
  for(let i=0;i<=200;i++){
    const u=i/200,paint=rearFascia(u,1),carbon=rearValance(u,0);
    for(let axis=0;axis<3;axis++)assert.ok(Math.abs(paint[axis]-carbon[axis])<1e-8,`open fascia join at ${u}`);
    const lower=rearValance(u,1);
    assert.ok(lower[1]>=.3499,`outer bumper hangs into the fan tray at ${u}`);
    for(const side of [-1,1]){
      const top=rearCorner(u,0,side),bottom=rearCorner(u,1,side);
      assert.ok(Math.abs(Math.abs(top[0])-sideX(top[2],top[1]))<1e-8);
      assert.ok(bottom[1]<top[1]);
      assert.ok(bottom[2]<=top[2]+1e-8);
      assert.ok(Math.abs(bottom[0])<=Math.abs(top[0]));
      const end=rearCorner(1,1,side),rear=rearValance((side+1)/2,1);
      for(let axis=0;axis<3;axis++)assert.ok(Math.abs(end[axis]-rear[axis])<1e-8);
    }
  }
});
