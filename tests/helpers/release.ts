import {expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {ack} from './betrayal';
export const earnedM4=JSON.parse(readFileSync('docs/bastrop37/phase3/m4/earned-completion-save.json','utf8'));
export async function enterRelease(page:Page){
 await page.goto('/bastrop37/');await page.evaluate(save=>localStorage.setItem('bastrop37-campaign-v1',JSON.stringify(save)),earnedM4);
 await page.reload();await page.locator('#continue-save').click();await expect(page.locator('#headline')).toHaveText('EVACUATION ROUTE CLEARED');
 await page.locator('#continue-chapter').click();await expect(page.locator('#game')).toHaveAttribute('data-beat','L5.01');await page.clock.runFor(32);
}
export async function startFinalController(page:Page){await enterRelease(page);await ack(page,3);await expect(page.locator('#game')).toHaveAttribute('data-beat','L5.02');}
export async function savedCampaign(page:Page){return page.evaluate(()=>JSON.parse(localStorage.getItem('bastrop37-campaign-v1')!));}
/** A canonical checkpoint fixture isolates upload cases; the fresh campaign separately earns this checkpoint through play. */
export async function loadUploadFixture(page:Page){
 const {RELEASE_DIALOGUE}=await import('../../src/scripts/bastrop37/release-content');
 const {releaseSave}=await import('../../src/scripts/bastrop37/save');
 const opening=RELEASE_DIALOGUE['L5.01'];
 const save=releaseSave('CP-L5-UPLOAD',[...earnedM4.log,...opening],earnedM4.records,[...earnedM4.history,...opening]);
 await page.goto('/bastrop37/');await page.evaluate(value=>localStorage.setItem('bastrop37-campaign-v1',JSON.stringify(value)),save);
 await page.reload();await page.locator('#continue-save').click();await expect(page.locator('#game')).toHaveAttribute('data-beat','L5.03');return save;
}

async function bladeHold(page:Page,touch:boolean){
 if(!touch){await page.keyboard.up('KeyJ');await page.keyboard.down('KeyJ');return async()=>{await page.keyboard.up('KeyJ');};}
 const cdp=await page.context().newCDPSession(page);const box=(await page.locator('[data-key="ControlLeft"]').boundingBox())!;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2,id:2}]});
 return async()=>{await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});};
}
/** Uses the real required blade control, then actual blade or steering defense. */
export async function openFinalCorridor(page:Page,defense:'blades'|'steer'='blades',touch=false){
 const {steer}=await import('./betrayal');const game=page.locator('#game');
 await steer(page,415,touch);let release=await bladeHold(page,touch);let stage='',priorPhase='',seenRetraction=false;
 for(let i=0;i<450;i++){
  if(await game.getAttribute('data-beat')==='L5.03'){
   await release();expect(seenRetraction).toBe(true);await expect(game).toHaveAttribute('data-release-defender-cleared','true');return;
  }
  if(await game.getAttribute('data-controller-state')==='retracting')seenRetraction=true;
  const next=await game.getAttribute('data-release-stage')||'';const phase=await game.getAttribute('data-drone-phase')||'';
  if(next==='defender'&&stage!=='defender'){
   await release();release=async()=>{};
   if(defense==='blades'){await steer(page,490,touch);release=await bladeHold(page,touch);}
  }
  if(next==='defender'&&defense==='steer'&&phase==='signal'&&priorPhase!=='signal')await steer(page,Number(await game.getAttribute('data-x'))>360?300:460,touch);
  stage=next;priorPhase=phase;await page.clock.runFor(100);await expect(game).toHaveAttribute('data-state','playing');
 }
 await release();throw new Error(`Final corridor failed: ${await game.evaluate(el=>JSON.stringify((el as HTMLElement).dataset))}`);
}
/** Each corridor is traversed normally; A cannot be counted as B. */
export async function finishUpload(page:Page,defense:'blades'|'steer'='blades',touch=false){
 const {steer}=await import('./betrayal');const game=page.locator('#game');let stage='',priorPhase='',release=async()=>{};
 for(let i=0;i<650;i++){
  if(await game.getAttribute('data-omega-released')==='true'){
   await release();await expect(game).toHaveAttribute('data-beat','L5.04');await expect(game).toHaveAttribute('data-traffic-count','0');return;
  }
  const next=await game.getAttribute('data-release-stage')||'';const phase=await game.getAttribute('data-drone-phase')||'';
  if(next!==stage){
   await release();release=async()=>{};
   if(next==='upload-a'||next==='upload-b')await steer(page,320,touch);
   else if(next==='intercept'&&defense==='blades'){await steer(page,490,touch);release=await bladeHold(page,touch);}
  }
  if(next==='intercept'&&defense==='steer'&&phase==='signal'&&priorPhase!=='signal')await steer(page,Number(await game.getAttribute('data-x'))>360?300:460,touch);
  stage=next;priorPhase=phase;await page.clock.runFor(100);await expect(game).toHaveAttribute('data-state','playing');
 }
 await release();throw new Error(`Upload failed: ${await game.evaluate(el=>JSON.stringify((el as HTMLElement).dataset))}`);
}
export async function finishRecovery(page:Page,touch=false){
 const game=page.locator('#game');
 async function advance(){if(touch){const cdp=await page.context().newCDPSession(page);const b=(await page.locator('#advance').boundingBox())!;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+12,y:b.y+20,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.clock.runFor(32);}else await ack(page,1);}
 for(let i=0;i<160;i++){
  if(await game.getAttribute('data-campaign-complete')==='true'){
   await expect(game).toHaveAttribute('data-state','complete');return;
  }
  await expect(game).toHaveAttribute('data-omega-released','true');await expect(game).toHaveAttribute('data-traffic-count','0');
  if(await page.locator('#comms').isVisible())await advance();else await page.clock.runFor(100);
 }
 throw new Error(`Recovery failed: ${await game.evaluate(el=>JSON.stringify((el as HTMLElement).dataset))}`);
}
