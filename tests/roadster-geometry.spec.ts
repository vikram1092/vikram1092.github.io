import {test} from '@playwright/test';
import assert from 'node:assert/strict';
import {roof,sail,skinX,shoulder,width,upperBody,backlightHalfWidth,sideGlassBounds,CANOPY_REAR,SIDE_GLASS_START,SIDE_GLASS_END} from '../src/scripts/roadster/car-geometry';

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
