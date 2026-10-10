import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { enterLockdown, startController, savedCampaign, earnedM3 } from './helpers/lockdown';
import { ack } from './helpers/betrayal';
const capture='docs/bastrop37/phase3/m5/regression-m4';
mkdirSync(capture,{recursive:true});
test.beforeEach(async({page})=>{page.setDefaultTimeout(10000);await page.clock.install();});

test('L4 spillway record precedes Omega evidence line and slow reading preserves earned relays',async({page})=>{
 await enterLockdown(page);
 const game=page.locator('#game');
 await expect(game).toHaveAttribute('data-dialogue-id','L4.01-01');
 expect(await savedCampaign(page)).toEqual(earnedM3);
 const route=await game.getAttribute('data-route');await page.clock.fastForward(60000);await page.clock.runFor(32);
 expect(await game.getAttribute('data-route')).toBe(route);
 await page.screenshot({path:`${capture}/desktop-geography.png`});await ack(page,1);
 await expect(game).toHaveAttribute('data-record-id','L4.01-RECORD-01');
 await expect(page.locator('#dialogue-text')).toContainText('LOWER ROAD DISCHARGE');
 await expect(page.locator('#dialogue-text')).toContainText('AUTH: MAYOR VLAD');
 await page.screenshot({path:`${capture}/desktop-record.png`});
 await page.clock.fastForward(60000);await page.clock.runFor(32);
 await expect(game).toHaveAttribute('data-record-id','L4.01-RECORD-01');
 expect(await savedCampaign(page)).toEqual(earnedM3);
 await ack(page,1);await expect(game).toHaveAttribute('data-dialogue-id','L4.01-02');await ack(page,2);
 await expect(game).toHaveAttribute('data-beat','L4.02');
 const save=await savedCampaign(page);expect(save.checkpoint).toBe('CP-L4-CONTROLLER');
 expect(save.log).toHaveLength(37);expect(save.records).toHaveLength(3);expect(save.history).toHaveLength(40);
 expect(save.flags).toEqual({betrayalKnown:true,relayA:true,relayB:true,busSafe:false,omegaReleased:false});
 expect(save.history.slice(-4).map((entry:{id:string})=>entry.id)).toEqual(['L4.01-01','L4.01-RECORD-01','L4.01-02','L4.01-03']);
 await page.locator('#pause').click();await page.locator('#log-details summary').click();
 await expect(page.locator('#dialogue-log li')).toHaveCount(40);await expect(page.locator('#dialogue-log li[data-kind=record]')).toHaveCount(3);
 await page.locator('#retry').click();await expect(page.locator('#comms')).toBeHidden();
 await page.reload();await page.locator('#continue-save').click();await expect(game).toHaveAttribute('data-beat','L4.02');
 expect((await savedCampaign(page)).history).toHaveLength(40);
});

test('missing L4 bus asset preserves M3 completion and explicit retry recovers',async({page})=>{
 let fail=true;await page.route('**/lockdown/evac-bus-rear-v1.png',route=>fail?route.abort():route.continue());
 await page.goto('/bastrop37/?fixture=encounters');await page.evaluate(save=>localStorage.setItem('bastrop37-campaign-v1',JSON.stringify(save)),earnedM3);
 await page.reload();await page.locator('#continue-save').click();await page.locator('#continue-chapter').click();
 await expect(page.locator('#game')).toHaveAttribute('data-state','error');expect(await savedCampaign(page)).toEqual(earnedM3);
 fail=false;await page.locator('#retry').click();await expect(page.locator('#game')).toHaveAttribute('data-beat','L4.01');
});

test('controller miss uses safe bypass; actual blade pass retracts barrier before full-condition escort save',async({page})=>{
 test.setTimeout(180000);const {openController}=await import('./helpers/lockdown');
 await startController(page);const game=page.locator('#game');
 for(let i=0;i<100&&Number(await game.getAttribute('data-controller-loops'))===0;i++)await page.clock.runFor(100);
 expect(Number(await game.getAttribute('data-controller-loops'))).toBe(1);await expect(game).toHaveAttribute('data-state','playing');
 await expect(game).toHaveAttribute('data-controller-state','active');await expect(game).toHaveAttribute('data-bus-condition','3');
 await page.screenshot({path:`${capture}/desktop-controller-loop.png`});
 await openController(page);expect((await savedCampaign(page)).checkpoint).toBe('CP-L4-ESCORT');
 await expect(game).toHaveAttribute('data-bus-condition','3');await page.screenshot({path:`${capture}/desktop-escort-start.png`});
 await page.reload();await page.locator('#continue-save').click();await expect(game).toHaveAttribute('data-controller-state','open');
 await expect(game).toHaveAttribute('data-bus-condition','3');await expect(page.locator('#comms')).toBeHidden();
});

test('required controller and blade escort save contained L4 completion with all three records',async({page})=>{
 test.setTimeout(300000);const {openController,finishEscort}=await import('./helpers/lockdown');
 await startController(page);await openController(page);await finishEscort(page);
 const game=page.locator('#game');await expect(game).toHaveAttribute('data-bus-safe','true');await expect(game).toHaveAttribute('data-ramp-passed','true');
 await expect(game).toHaveAttribute('data-bus-condition','3');await page.screenshot({path:`${capture}/desktop-closure.png`});await ack(page,4);
 await expect(page.locator('#headline')).toHaveText('EVACUATION ROUTE CLEARED');const save=await savedCampaign(page);
 expect(save.checkpoint).toBe('CP-L4-COMPLETE');expect(save.completedLevels).toEqual(['L1','L2','L3','L4']);
 expect(save.flags).toEqual({betrayalKnown:true,relayA:true,relayB:true,busSafe:true,omegaReleased:false});
 expect(save.log).toHaveLength(41);expect(save.records).toHaveLength(3);expect(save.history).toHaveLength(44);
 writeFileSync(`${capture}/earned-completion-save.json`,JSON.stringify(save,null,2));await page.screenshot({path:`${capture}/desktop-complete.png`});
 await page.reload();await page.locator('#continue-save').click();await expect(page.locator('#headline')).toHaveText('EVACUATION ROUTE CLEARED');
 await page.locator('#continue-chapter').click();await expect(game).toHaveAttribute('data-beat','L5.01');
 expect(await savedCampaign(page)).toEqual(save);
});

async function escortCheckpoint(page:import('@playwright/test').Page) {
 const {LockdownMission}=await import('../src/scripts/bastrop37/lockdown');const {lockdownSave}=await import('../src/scripts/bastrop37/save');
 const mission=new LockdownMission(undefined,earnedM3.log,earnedM3.records,earnedM3.history);for(let i=0;i<4;i++)mission.advance();
 const save=lockdownSave('CP-L4-ESCORT',mission.log,mission.records,mission.history);
 await page.goto('/bastrop37/?fixture=encounters');await page.evaluate(value=>localStorage.setItem('bastrop37-campaign-v1',JSON.stringify(value)),save);
 await page.reload();await page.locator('#continue-save').click();await expect(page.locator('#game')).toHaveAttribute('data-beat','L4.03');return save;
}

test('three uncountered bus attacks cause explicit failure and retry restores full condition; leaving range prevents fresh attacks',async({page})=>{
 test.setTimeout(240000);const {steer}=await import('./helpers/betrayal');await escortCheckpoint(page);const game=page.locator('#game');
 await steer(page,370);
 for(let i=0;i<80&&await game.getAttribute('data-escort-attack-phase')!=='telegraph';i++)await page.clock.runFor(100);
 await expect(game).toHaveAttribute('data-escort-attack-phase','telegraph');await steer(page,300);
 for(let i=0;i<50;i++)await page.clock.runFor(100);
 await expect(game).toHaveAttribute('data-bus-condition','2');const stopped=await game.getAttribute('data-bus-progress');
 await page.clock.runFor(6000);await expect(game).toHaveAttribute('data-bus-condition','2');expect(await game.getAttribute('data-bus-progress')).toBe(stopped);
 await page.screenshot({path:`${capture}/desktop-escort-outside.png`});await steer(page,370);
 for(let i=0;i<180&&await game.getAttribute('data-state')==='playing';i++)await page.clock.runFor(100);
 await expect(game).toHaveAttribute('data-state','crashed');await expect(game).toHaveAttribute('data-bus-condition','0');
 await expect(page.locator('#headline')).toHaveText('EVACUATION ROUTE LOST');await page.screenshot({path:`${capture}/desktop-bus-failure.png`});
 await page.locator('#retry').click();await expect(game).toHaveAttribute('data-bus-condition','3');await expect(game).toHaveAttribute('data-beat','L4.03');
 expect((await savedCampaign(page)).checkpoint).toBe('CP-L4-ESCORT');expect((await savedCampaign(page)).history).toHaveLength(40);
});

test('real Jo collision retries escort; steering draw-off can finish without a drone kill and blocked storage remains session-only',async({page})=>{
 test.setTimeout(300000);const {steer}=await import('./helpers/betrayal');const {finishEscort}=await import('./helpers/lockdown');
 await escortCheckpoint(page);const game=page.locator('#game');await steer(page,490);
 for(let i=0;i<180&&await game.getAttribute('data-state')==='playing';i++)await page.clock.runFor(100);
 await expect(game).toHaveAttribute('data-state','crashed');expect(Number(await game.getAttribute('data-bus-condition'))).toBeGreaterThan(0);
 await page.screenshot({path:`${capture}/desktop-jo-failure.png`});await page.locator('#retry').click();
 await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new DOMException('Quota','QuotaExceededError');};});
 await finishEscort(page,'steer');expect(Number(await game.getAttribute('data-slices'))).toBe(0);await ack(page,4);
 await expect(page.locator('#save-note')).toContainText('SESSION ONLY');expect((await savedCampaign(page)).checkpoint).toBe('CP-L4-ESCORT');
 await page.locator('#menu').click();await page.locator('#continue-save').click();await expect(page.locator('#headline')).toHaveText('EVACUATION ROUTE CLEARED');
});

test('four-size L4 evidence and longest dialogue fit; touch controller plus escort completes without keyboard',async({page})=>{
 test.setTimeout(360000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const {openController,finishEscort}=await import('./helpers/lockdown');await page.setViewportSize({width:390,height:844});await enterLockdown(page);await ack(page,2);
 await expect(page.locator('#game')).toHaveAttribute('data-dialogue-id','L4.01-02');const geometry:unknown[]=[];
 for(const [width,height]of[[1440,900],[1280,720],[1024,768],[390,844]]){
  await page.setViewportSize({width,height});await page.clock.runFor(64);await expect(page.locator('#game')).toHaveAttribute('data-state','paused');await page.locator('#resume').click();
  await page.clock.runFor(64);await expect(page.locator('#comms')).toBeVisible();const card=(await page.locator('#comms').boundingBox())!;expect(card).not.toBeNull();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);const rider=Number(await page.locator('#game').getAttribute('data-rider-bottom'));
  if(width===390){expect(card.y-rider).toBeGreaterThan(20);const dpad=(await page.locator('.dpad').boundingBox())!;expect(dpad.y-card.y-card.height).toBeGreaterThanOrEqual(8);}
  geometry.push({width,height,card,rider});await page.screenshot({path:`${capture}/story-${width}.png`});
 }
 const cdp=await page.context().newCDPSession(page);async function tap(){const b=(await page.locator('#advance').boundingBox())!;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+8,y:b.y+b.height/2,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.clock.runFor(32);}
 await tap();await tap();await openController(page,true);await finishEscort(page,'blades',true);for(let i=0;i<4;i++)await tap();
 await expect(page.locator('#headline')).toHaveText('EVACUATION ROUTE CLEARED');await page.screenshot({path:`${capture}/mobile-complete.png`});
 writeFileSync(`${capture}/story-geometry.json`,JSON.stringify({geometry,errors},null,2));expect(errors).toEqual([]);
});
