import { test, expect } from '@playwright/test';
import { enterPublicAccess, startRelayA, savedCampaign, earnedM2 } from './helpers/public-access';
import { ack, steer } from './helpers/betrayal';
import { mkdirSync, writeFileSync } from 'node:fs';
const capture='docs/bastrop37/phase3/m3';
mkdirSync(capture,{recursive:true});
test.beforeEach(async({page})=>{page.setDefaultTimeout(10000);await page.clock.install();});

test('M2 completion enters safe L3; slow reading, whole-card input and first checkpoint retain evidence',async({page})=>{
 await enterPublicAccess(page);
 await expect(page.locator('#objective')).toHaveText('LINK THE PUBLIC RELAY');
 expect((await savedCampaign(page)).checkpoint).toBe('CP-L2-COMPLETE');
 const route=await page.locator('#game').getAttribute('data-route');
 await page.clock.fastForward(60000);await page.clock.runFor(64);
 expect(await page.locator('#game').getAttribute('data-route')).toBe(route);
 await expect(page.locator('#game')).toHaveAttribute('data-traffic-count','0');
 await expect(page.locator('#dialogue-text')).toHaveText('Two relay points. Keep me close long enough to connect each one.');
 await page.screenshot({path:`${capture}/desktop-opening.png`});
 await ack(page,3);
 const save=await savedCampaign(page);
 expect(save.checkpoint).toBe('CP-L3-A');expect(save.completedLevels).toEqual(['L1','L2']);
 expect(save.flags).toEqual({betrayalKnown:true,relayA:false,relayB:false,busSafe:false,omegaReleased:false});
 expect(save.log).toHaveLength(30);expect(save.records).toEqual(earnedM2.records);expect(save.history).toHaveLength(32);
 await page.locator('#pause').click();await page.locator('#log-details summary').click();
 await expect(page.locator('#dialogue-log li')).toHaveCount(32);
 await expect(page.locator('#dialogue-log li[data-kind=record]')).toHaveCount(2);
 const paused=await page.locator('#game').getAttribute('data-route');await page.clock.runFor(3000);
 expect(await page.locator('#game').getAttribute('data-route')).toBe(paused);
 await page.locator('#retry').click();await expect(page.locator('#game')).toHaveAttribute('data-beat','L3.02');
 await expect(page.locator('#comms')).toBeHidden();
 await page.reload();await page.locator('#continue-save').click();
 await expect(page.locator('#game')).toHaveAttribute('data-beat','L3.02');
 expect((await savedCampaign(page)).history).toHaveLength(32);
});

test('failed relay asset preserves completed M2 and Retry Load recovers',async({page})=>{
 let fail=true;
 await page.route('**/public-access/relay-node-v3.png',route=>fail?route.abort():route.continue());
 await page.goto('/bastrop37/');await page.evaluate(save=>localStorage.setItem('bastrop37-campaign-v1',JSON.stringify(save)),earnedM2);
 await page.reload();await page.locator('#continue-save').click();await page.locator('#continue-chapter').click();
 await expect(page.locator('#game')).toHaveAttribute('data-state','error');
 expect(await savedCampaign(page)).toEqual(earnedM2);
 await page.locator('#menu').click();
 expect((await savedCampaign(page)).checkpoint).toBe('CP-L2-COMPLETE');
 await expect(page.locator('#game')).toHaveAttribute('data-state','ready');
 await page.locator('#continue-save').click();
 await expect(page.locator('#game')).toHaveAttribute('data-state','complete');
 await page.locator('#continue-chapter').click();
 await expect(page.locator('#game')).toHaveAttribute('data-state','error');
 fail=false;await page.locator('#retry').click();
 await expect(page.locator('#game')).toHaveAttribute('data-beat','L3.01');
});

test('two first-pass links and steering interception save local readiness; reload and M3 boundary preserve containment',async({page})=>{
 test.setTimeout(300000);
 const {finishRelays}=await import('./helpers/public-access');
 await startRelayA(page);await finishRelays(page);
 await expect(page.locator('#game')).toHaveAttribute('data-relay-a','true');
 await expect(page.locator('#game')).toHaveAttribute('data-relay-b','true');
 await expect(page.locator('#game')).toHaveAttribute('data-relay-loops-a','0');
 await expect(page.locator('#game')).toHaveAttribute('data-relay-loops-b','0');
 await page.screenshot({path:`${capture}/desktop-closure.png`});await ack(page,4);
 await expect(page.locator('#headline')).toHaveText('PUBLIC ROUTE READY');
 const save=await savedCampaign(page);expect(save.checkpoint).toBe('CP-L3-COMPLETE');
 expect(save.completedLevels).toEqual(['L1','L2','L3']);
 expect(save.flags).toEqual({betrayalKnown:true,relayA:true,relayB:true,busSafe:false,omegaReleased:false});
 expect(save.log).toHaveLength(34);expect(save.records).toEqual(earnedM2.records);expect(save.history).toHaveLength(36);
 writeFileSync(`${capture}/earned-completion-save.json`,JSON.stringify(save,null,2));
 await page.screenshot({path:`${capture}/desktop-complete.png`});
 await page.reload();await page.locator('#continue-save').click();await expect(page.locator('#headline')).toHaveText('PUBLIC ROUTE READY');
 await page.locator('#continue-chapter').click();
 await expect(page.locator('#message')).toContainText(/M3|slice|reservoir/i);
 expect(await page.locator('#game').getAttribute('data-beat')).not.toMatch(/^L4/);
 expect(await savedCampaign(page)).toEqual(save);
});

test('partial link pauses airborne/outside range, survives miss loop, and pause or slow frame never grants free progress',async({page})=>{
 test.setTimeout(240000);await startRelayA(page);
 const game=page.locator('#game');
 for(let i=0;i<60 && Number(await game.getAttribute('data-link-seconds'))<.6;i++)await page.clock.runFor(100);
 const earned=Number(await game.getAttribute('data-link-seconds'));expect(earned).toBeGreaterThan(.5);
 await page.keyboard.press('KeyK');await page.clock.runFor(200);
 expect(Number(await game.getAttribute('data-height'))).toBeGreaterThan(0);
 const airborne=Number(await game.getAttribute('data-link-seconds'));await page.clock.runFor(350);
 expect(Number(await game.getAttribute('data-link-seconds'))).toBeCloseTo(airborne,2);
 await steer(page,490);
 const outside=Number(await game.getAttribute('data-link-seconds'));
 await page.locator('#pause').click();await page.clock.runFor(3000);expect(Number(await game.getAttribute('data-link-seconds'))).toBe(outside);
 await page.locator('#resume').click();await page.clock.fastForward(60000);await page.clock.runFor(32);
 expect(Number(await game.getAttribute('data-link-seconds'))).toBe(outside);
 for(let i=0;i<100 && Number(await game.getAttribute('data-relay-loops-a'))===0;i++)await page.clock.runFor(100);
 expect(Number(await game.getAttribute('data-relay-loops-a'))).toBeGreaterThan(0);
 expect(Number(await game.getAttribute('data-link-seconds'))).toBe(outside);
 await page.screenshot({path:`${capture}/desktop-service-loop.png`});
 await steer(page,320);
 for(let i=0;i<130 && await game.getAttribute('data-relay-a')!=='true';i++)await page.clock.runFor(100);
 await expect(game).toHaveAttribute('data-relay-a','true');
 expect((await savedCampaign(page)).checkpoint).toBe('CP-L3-B');
 await page.locator('#pause').click();await page.locator('#retry').click();
 await expect(game).toHaveAttribute('data-relay-a','true');await expect(game).toHaveAttribute('data-relay-b','false');
 await expect(game).toHaveAttribute('data-link-progress','0.000');
 await page.reload();await page.locator('#continue-save').click();
 await expect(game).toHaveAttribute('data-relay-a','true');await expect(page.locator('#comms')).toBeHidden();
});

test('actual interception crash retries after A; blades finish B and blocked storage keeps truthful session progress',async({page})=>{
 test.setTimeout(300000);
 const {PUBLIC_ACCESS_DIALOGUE}=await import('../src/scripts/bastrop37/public-access-content');
 const {publicAccessSave}=await import('../src/scripts/bastrop37/save');
 const {finishRelays}=await import('./helpers/public-access');
 const opening=PUBLIC_ACCESS_DIALOGUE['L3.01'];
 const fixture=publicAccessSave('CP-L3-B',[...earnedM2.log,...opening],earnedM2.records,[...earnedM2.history,...opening]);
 await page.goto('/bastrop37/');await page.evaluate(save=>localStorage.setItem('bastrop37-campaign-v1',JSON.stringify(save)),fixture);
 await page.reload();await page.locator('#continue-save').click();await steer(page,490);
 for(let i=0;i<140 && await page.locator('#game').getAttribute('data-state')==='playing';i++)await page.clock.runFor(100);
 await expect(page.locator('#game')).toHaveAttribute('data-state','crashed');
 await page.screenshot({path:`${capture}/desktop-interception-failure.png`});
 for(let i=0;i<2;i++){
  await page.locator('#retry').click();await expect(page.locator('#game')).toHaveAttribute('data-state','playing');
  await expect(page.locator('#game')).toHaveAttribute('data-relay-a','true');await expect(page.locator('#game')).toHaveAttribute('data-relay-b','false');
  expect((await savedCampaign(page)).history).toHaveLength(32);
  if(i===0)await page.locator('#pause').click();
 }
 await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new DOMException('Quota','QuotaExceededError');};});
 await finishRelays(page,'blades');expect(Number(await page.locator('#game').getAttribute('data-slices'))).toBe(1);
 await ack(page,4);await expect(page.locator('#save-note')).toContainText('SESSION ONLY');
 expect((await savedCampaign(page)).checkpoint).toBe('CP-L3-B');
 await page.locator('#menu').click();await page.locator('#continue-save').click();
 await expect(page.locator('#headline')).toHaveText('PUBLIC ROUTE READY');
});

test('touch-only relay route and whole-card dialogue remain clear at four sizes',async({page})=>{
 test.setTimeout(360000);const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 const {finishRelays}=await import('./helpers/public-access');
 await page.setViewportSize({width:390,height:844});await enterPublicAccess(page);await ack(page,2);
 const geometry:unknown[]=[];
 for(const [width,height] of [[1440,900],[1280,720],[1024,768],[390,844]]) {
  await page.setViewportSize({width,height});await page.clock.runFor(64);
  await expect(page.locator('#game')).toHaveAttribute('data-state','paused');
  await page.locator('#resume').click();
  await expect(page.locator('#game')).toHaveAttribute('data-state','playing');
  await page.clock.runFor(64);await expect(page.locator('#comms')).toBeVisible();
  const card=(await page.locator('#comms').boundingBox())!;expect(card).not.toBeNull();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
  const rider=Number(await page.locator('#game').getAttribute('data-rider-bottom'));
  if(width===390){expect(card.y-rider).toBeGreaterThan(20);const dpad=(await page.locator('.dpad').boundingBox())!;expect(dpad.y-card.y-card.height).toBeGreaterThanOrEqual(8);}
  geometry.push({width,height,card,rider});await page.screenshot({path:`${capture}/story-${width}.png`});
 }
 const session=await page.context().newCDPSession(page);
 async function tapAdvance(){const box=(await page.locator('#advance').boundingBox())!;await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+8,y:box.y+box.height/2,id:1}]});await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.clock.runFor(32);}
 await tapAdvance();await expect(page.locator('#game')).toHaveAttribute('data-beat','L3.02');
 await finishRelays(page,'steer',true);
 for(let i=0;i<4;i++)await tapAdvance();
 await expect(page.locator('#headline')).toHaveText('PUBLIC ROUTE READY');await page.screenshot({path:`${capture}/mobile-complete.png`});
 await page.reload();await page.locator('#continue-save').click();await expect(page.locator('#headline')).toHaveText('PUBLIC ROUTE READY');
 writeFileSync(`${capture}/story-geometry.json`,JSON.stringify({geometry,errors},null,2));expect(errors).toEqual([]);
});
