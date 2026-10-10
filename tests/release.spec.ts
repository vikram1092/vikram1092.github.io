import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {enterRelease,startFinalController,savedCampaign,earnedM4} from './helpers/release';
import {ack,steer} from './helpers/betrayal';
const capture='docs/bastrop37/phase3/m5';mkdirSync(capture,{recursive:true});
test.beforeEach(async({page})=>{page.setDefaultTimeout(10000);await page.clock.install();});

test('L5 begins safely with earned prerequisites; slow reading and controller checkpoint retain all evidence',async({page})=>{
 await enterRelease(page);const game=page.locator('#game');
 await expect(page.locator('#objective')).toHaveText('RELEASE OMEGA');expect(await savedCampaign(page)).toEqual(earnedM4);
 const route=await game.getAttribute('data-route');await page.clock.fastForward(120000);await page.clock.runFor(32);
 expect(await game.getAttribute('data-route')).toBe(route);await expect(game).toHaveAttribute('data-traffic-count','0');await expect(game).toHaveAttribute('data-omega-released','false');
 await page.screenshot({path:`${capture}/desktop-opening.png`});await ack(page,3);
 const save=await savedCampaign(page);expect(save.checkpoint).toBe('CP-L5-CONTROLLER');expect(save.completedLevels).toEqual(['L1','L2','L3','L4']);
 expect(save.flags).toEqual({betrayalKnown:true,relayA:true,relayB:true,busSafe:true,omegaReleased:false});
 expect(save.log).toHaveLength(44);expect(save.records).toEqual(earnedM4.records);expect(save.history).toHaveLength(47);
 await page.locator('#pause').click();await page.locator('#log-details summary').click();await expect(page.locator('#dialogue-log li')).toHaveCount(47);await expect(page.locator('#dialogue-log li[data-kind=record]')).toHaveCount(3);
 await page.locator('#retry').click();await expect(game).toHaveAttribute('data-beat','L5.02');await expect(page.locator('#comms')).toBeHidden();
 await page.reload();await page.locator('#continue-save').click();await expect(game).toHaveAttribute('data-beat','L5.02');expect((await savedCampaign(page)).history).toHaveLength(47);
});

test('failed civic asset preserves M4 completion; Retry Load recovers without granting release',async({page})=>{
 let fail=true;await page.route('**/release/civic-node-v3.png',route=>fail?route.abort():route.continue());
 await page.goto('/bastrop37/?fixture=encounters');await page.evaluate(save=>localStorage.setItem('bastrop37-campaign-v1',JSON.stringify(save)),earnedM4);await page.reload();
 await page.locator('#continue-save').click();await page.locator('#continue-chapter').click();await expect(page.locator('#game')).toHaveAttribute('data-state','error');
 expect(await savedCampaign(page)).toEqual(earnedM4);fail=false;await page.locator('#retry').click();await expect(page.locator('#game')).toHaveAttribute('data-beat','L5.01');await expect(page.locator('#game')).toHaveAttribute('data-omega-released','false');
});

test('controller miss safely repeats and real sequential defender must clear before the upload checkpoint',async({page})=>{
 test.setTimeout(300000);const {openFinalCorridor}=await import('./helpers/release');await startFinalController(page);const game=page.locator('#game');
 for(let i=0;i<100&&Number(await game.getAttribute('data-controller-loops'))===0;i++)await page.clock.runFor(100);
 expect(Number(await game.getAttribute('data-controller-loops'))).toBe(1);await expect(game).toHaveAttribute('data-release-stage','controller');await expect(game).toHaveAttribute('data-traffic-count','0');
 await page.screenshot({path:`${capture}/desktop-controller-loop.png`});await openFinalCorridor(page,'steer');
 const save=await savedCampaign(page);expect(save.checkpoint).toBe('CP-L5-UPLOAD');expect(save.flags.omegaReleased).toBe(false);expect(save.log).toHaveLength(44);
 writeFileSync(`${capture}/earned-upload-save.json`,JSON.stringify(save,null,2));await page.screenshot({path:`${capture}/desktop-upload-start.png`});
 await page.reload();await page.locator('#continue-save').click();await expect(game).toHaveAttribute('data-release-stage','upload-a');await expect(game).toHaveAttribute('data-controller-state','open');await expect(game).toHaveAttribute('data-release-defender-cleared','true');
 expect(Number(await game.getAttribute('data-upload-seconds-a'))).toBe(0);expect(Number(await game.getAttribute('data-upload-seconds-b'))).toBe(0);
});

test('actual final route commits release before dialogue, every acknowledgment reloads safely, and recovery completes once',async({page})=>{
 test.setTimeout(420000);const {openFinalCorridor,finishUpload,finishRecovery}=await import('./helpers/release');
 await startFinalController(page);await openFinalCorridor(page);await finishUpload(page);const game=page.locator('#game');
 expect(Number(await game.getAttribute('data-slices'))).toBe(2);
 await expect(game).toHaveAttribute('data-dialogue-id','L5.04-01');await expect(game).toHaveAttribute('data-traffic-count','0');
 expect(Number(await game.getAttribute('data-upload-seconds-a'))).toBe(5);expect(Number(await game.getAttribute('data-upload-seconds-b'))).toBe(5);
 expect(Number(await game.getAttribute('data-upload-loops-a'))).toBe(0);expect(Number(await game.getAttribute('data-upload-loops-b'))).toBe(0);
 let save=await savedCampaign(page);expect(save.checkpoint).toBe('CP-L5-RELEASED');expect(save.flags.omegaReleased).toBe(true);expect(save.log).toHaveLength(44);
 writeFileSync(`${capture}/earned-released-save.json`,JSON.stringify(save,null,2));await page.screenshot({path:`${capture}/desktop-release.png`});
 await page.reload();await page.locator('#continue-save').click();await expect(game).toHaveAttribute('data-dialogue-id','L5.04-01');
 const ids=['L5.04-01','L5.04-02','L5.04-03','L5.05-01','L5.05-02','L5.05-03'];
 for(let n=0;n<6;n++){
  await expect(game).toHaveAttribute('data-dialogue-id',ids[n]);const route=await game.getAttribute('data-recovery-route');await page.clock.fastForward(60000);await page.clock.runFor(32);expect(await game.getAttribute('data-recovery-route')).toBe(route);
  await ack(page,1);save=await savedCampaign(page);expect(save.checkpoint).toBe('CP-L5-RELEASED');expect(save.flags.omegaReleased).toBe(true);expect(save.log).toHaveLength(45+n);expect(save.history).toHaveLength(48+n);
  if(n===2){await expect(game).toHaveAttribute('data-release-stage','dawn');await page.screenshot({path:`${capture}/desktop-dawn.png`});}
  await page.reload();await page.locator('#continue-save').click();await expect(game).toHaveAttribute('data-omega-released','true');await expect(game).toHaveAttribute('data-traffic-count','0');
 }
 await expect(game).toHaveAttribute('data-release-stage','recovery-travel');await page.keyboard.down('ArrowRight');await page.keyboard.down('KeyJ');await page.clock.runFor(250);await page.keyboard.up('ArrowRight');await page.keyboard.up('KeyJ');await expect(game).toHaveAttribute('data-state','playing');
 await finishRecovery(page);save=await savedCampaign(page);expect(save.checkpoint).toBe('CP-CAMPAIGN-COMPLETE');expect(save.completedLevels).toEqual(['L1','L2','L3','L4','L5']);expect(save.log).toHaveLength(50);expect(save.records).toHaveLength(3);expect(save.history).toHaveLength(53);
 await expect(page.locator('#headline')).toContainText('PUBLIC ACCESS RESTORED');await expect(page.locator('#continue-chapter')).toBeHidden();await expect(page.locator('#chapter-picker')).toBeVisible();
 writeFileSync(`${capture}/earned-completion-save.json`,JSON.stringify(save,null,2));await page.screenshot({path:`${capture}/desktop-complete.png`});await page.clock.runFor(3000);expect(await savedCampaign(page)).toEqual(save);
 await page.reload();await page.locator('#continue-save').click();await expect(game).toHaveAttribute('data-campaign-complete','true');expect(await savedCampaign(page)).toEqual(save);
 await page.locator('#game').focus();await page.keyboard.press('Enter');await expect(game).toHaveAttribute('data-state','ready');expect(await savedCampaign(page)).toEqual(save);
});

test('upload dropout pauses while airborne or outside range and survives the service loop; retry resets both sections',async({page})=>{
 test.setTimeout(240000);const {loadUploadFixture}=await import('./helpers/release');await loadUploadFixture(page);const game=page.locator('#game');
 for(let i=0;i<80&&Number(await game.getAttribute('data-upload-seconds-a'))<.7;i++)await page.clock.runFor(100);
 const partial=Number(await game.getAttribute('data-upload-seconds-a'));expect(partial).toBeGreaterThan(.6);
 await page.keyboard.press('KeyK');await page.clock.runFor(200);expect(Number(await game.getAttribute('data-height'))).toBeGreaterThan(0);
 const airborne=Number(await game.getAttribute('data-upload-seconds-a'));await page.clock.runFor(300);expect(Number(await game.getAttribute('data-upload-seconds-a'))).toBeCloseTo(airborne,2);
 await steer(page,490);const outside=Number(await game.getAttribute('data-upload-seconds-a'));await page.locator('#pause').click();await page.clock.runFor(5000);expect(Number(await game.getAttribute('data-upload-seconds-a'))).toBe(outside);
 await page.locator('#resume').click();await page.clock.fastForward(60000);await page.clock.runFor(32);expect(Number(await game.getAttribute('data-upload-seconds-a'))).toBe(outside);
 for(let i=0;i<160&&Number(await game.getAttribute('data-upload-loops-a'))===0;i++)await page.clock.runFor(100);
 expect(Number(await game.getAttribute('data-upload-loops-a'))).toBe(1);expect(Number(await game.getAttribute('data-upload-seconds-a'))).toBe(outside);await page.screenshot({path:`${capture}/desktop-upload-loop.png`});
 await page.locator('#pause').click();await page.locator('#retry').click();await page.clock.runFor(32);await expect(game).toHaveAttribute('data-state','playing');expect(Number(await game.getAttribute('data-upload-seconds-a'))).toBe(0);expect(Number(await game.getAttribute('data-upload-seconds-b'))).toBe(0);await expect(game).toHaveAttribute('data-release-stage','upload-a');expect((await savedCampaign(page)).checkpoint).toBe('CP-L5-UPLOAD');
});

test('real between-section collision retries empty upload; blocked storage preserves released session and safe recovery',async({page})=>{
 test.setTimeout(360000);const {loadUploadFixture,finishUpload,finishRecovery}=await import('./helpers/release');const durable=await loadUploadFixture(page);const game=page.locator('#game');
 for(let i=0;i<140&&await game.getAttribute('data-release-stage')!=='intercept';i++)await page.clock.runFor(100);
 await expect(game).toHaveAttribute('data-release-stage','intercept');expect(Number(await game.getAttribute('data-upload-seconds-a'))).toBe(5);expect(Number(await game.getAttribute('data-upload-seconds-b'))).toBe(0);
 await steer(page,490);for(let i=0;i<180&&await game.getAttribute('data-state')==='playing';i++)await page.clock.runFor(100);
 await expect(game).toHaveAttribute('data-state','crashed');await expect(game).toHaveAttribute('data-omega-released','false');await page.screenshot({path:`${capture}/desktop-failure.png`});
 await page.locator('#retry').click();await page.clock.runFor(32);await expect(game).toHaveAttribute('data-state','playing');expect(Number(await game.getAttribute('data-upload-seconds-a'))).toBe(0);expect(Number(await game.getAttribute('data-upload-seconds-b'))).toBe(0);await expect(game).toHaveAttribute('data-controller-state','open');
 await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new DOMException('Quota','QuotaExceededError');};});
 await finishUpload(page);expect(await savedCampaign(page)).toEqual(durable);await finishRecovery(page);await expect(page.locator('#save-note')).toContainText('SESSION ONLY');expect(await savedCampaign(page)).toEqual(durable);
 await page.locator('#menu').click();await page.locator('#continue-save').click();await expect(game).toHaveAttribute('data-campaign-complete','true');await expect(game).toHaveAttribute('data-omega-released','true');
});

test('four-size finale dialogue remains readable and the entire finale works with touch controls',async({page})=>{
 test.setTimeout(480000);const {openFinalCorridor,finishUpload,finishRecovery}=await import('./helpers/release');const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:390,height:844});await enterRelease(page);const geometry:unknown[]=[];
 for(const [width,height]of[[1440,900],[1280,720],[1024,768],[390,844]]){
  await page.setViewportSize({width,height});await page.clock.runFor(64);await expect(page.locator('#game')).toHaveAttribute('data-state','paused');await page.locator('#resume').click();await page.clock.runFor(64);
  const card=(await page.locator('#comms').boundingBox())!;expect(card).not.toBeNull();expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
  const rider=Number(await page.locator('#game').getAttribute('data-rider-bottom'));if(width===390){expect(card.y-rider).toBeGreaterThan(20);const dpad=(await page.locator('.dpad').boundingBox())!;expect(dpad.y-card.y-card.height).toBeGreaterThanOrEqual(8);}
  geometry.push({width,height,card,rider});await page.screenshot({path:`${capture}/story-${width}.png`});
 }
 const cdp=await page.context().newCDPSession(page);for(let i=0;i<3;i++){const b=(await page.locator('#advance').boundingBox())!;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+12,y:b.y+20,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.clock.runFor(32);}
 await openFinalCorridor(page,'steer',true);await finishUpload(page,'steer',true);await page.screenshot({path:`${capture}/mobile-release.png`});await finishRecovery(page,true);
 await expect(page.locator('#game')).toHaveAttribute('data-campaign-complete','true');await page.screenshot({path:`${capture}/mobile-complete.png`});writeFileSync(`${capture}/story-geometry.json`,JSON.stringify({geometry,errors},null,2));expect(errors).toEqual([]);
});

async function completeFixture(){
 const {RELEASE_DIALOGUE}=await import('../src/scripts/bastrop37/release-content');const {releaseSave}=await import('../src/scripts/bastrop37/save');
 const lines=[...RELEASE_DIALOGUE['L5.01'],...RELEASE_DIALOGUE['L5.04'],...RELEASE_DIALOGUE['L5.05']];
 return releaseSave('CP-CAMPAIGN-COMPLETE',[...earnedM4.log,...lines],earnedM4.records,[...earnedM4.history,...lines]);
}

test('unlocked chapter replay keeps completed campaign immutable through opening retries, final replay and new-game cancellation',async({page})=>{
 test.setTimeout(420000);const {openFinalCorridor,finishUpload,finishRecovery}=await import('./helpers/release');const durable=await completeFixture();
 await page.goto('/bastrop37/?fixture=encounters');await page.evaluate(save=>localStorage.setItem('bastrop37-campaign-v1',JSON.stringify(save)),durable);await page.reload();const game=page.locator('#game');
 await expect(page.locator('#chapter-picker')).toBeVisible();
 for(const chapter of ['L1','L2','L3','L4','L5']){
  await page.locator(`[data-replay-chapter="${chapter}"]`).click();await expect(game).toHaveAttribute('data-state','playing');await expect(game).toHaveAttribute('data-beat',`${chapter}.01`);await expect(game).toHaveAttribute('data-replay-active','true');await expect(game).toHaveAttribute('data-omega-released','false');await expect(page.locator('#replay-badge')).toBeVisible();expect(await savedCampaign(page)).toEqual(durable);
  if(chapter==='L1'){await page.locator('#pause').click();await page.locator('#retry').click();await expect(game).toHaveAttribute('data-beat','L1.01');await ack(page,5);await page.locator('#pause').click();await page.locator('#retry').click();await expect(game).toHaveAttribute('data-beat','L1.02');expect(await savedCampaign(page)).toEqual(durable);}
  if(chapter!=='L5'){await page.locator('#pause').click();await page.locator('#menu').click();await expect(game).toHaveAttribute('data-state','ready');expect(await savedCampaign(page)).toEqual(durable);}
 }
 await ack(page,3);await openFinalCorridor(page);await finishUpload(page);await finishRecovery(page);expect(await savedCampaign(page)).toEqual(durable);await expect(page.locator('#continue-chapter')).toBeHidden();await expect(page.locator('#chapter-picker')).toBeVisible();
 await page.locator('#menu').click();await page.clock.runFor(32);await expect(game).toHaveAttribute('data-state','ready');await page.locator('#continue-save').click();await expect(game).toHaveAttribute('data-campaign-complete','true');await expect(game).toHaveAttribute('data-replay-active','false');
 await page.locator('#menu').click();await page.clock.runFor(32);await expect(game).toHaveAttribute('data-state','ready');await page.locator('#new-game').click();await expect(page.locator('#reset-confirm')).toBeVisible();await page.locator('#cancel-new-game').click();expect(await savedCampaign(page)).toEqual(durable);
 await page.locator('#new-game').click();await page.locator('#confirm-new-game').click();await expect(game).toHaveAttribute('data-beat','L1.01');expect(await page.evaluate(()=>localStorage.getItem('bastrop37-campaign-v1'))).toBeNull();await expect(game).toHaveAttribute('data-omega-released','false');
});

test('a failed replay asset keeps the completed campaign and menu Continue intact',async({page})=>{
 const durable=await completeFixture();let fail=true;await page.route('**/release/civic-node-v3.png',route=>fail?route.abort():route.continue());
 await page.goto('/bastrop37/?fixture=encounters');await page.evaluate(save=>localStorage.setItem('bastrop37-campaign-v1',JSON.stringify(save)),durable);await page.reload();
 await page.locator('[data-replay-chapter="L5"]').click();await expect(page.locator('#game')).toHaveAttribute('data-state','error');expect(await savedCampaign(page)).toEqual(durable);
 await page.locator('#menu').click();fail=false;await page.locator('#continue-save').click();await expect(page.locator('#game')).toHaveAttribute('data-campaign-complete','true');await expect(page.locator('#game')).toHaveAttribute('data-omega-released','true');expect(await savedCampaign(page)).toEqual(durable);
});
