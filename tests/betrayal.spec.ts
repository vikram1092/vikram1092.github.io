import { test,expect,type Page } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const legacy=JSON.parse(readFileSync('docs/bastrop37/phase3/earned-completion-save.json','utf8'));
import { ack,reveal,escape } from './helpers/betrayal';
const capture='docs/bastrop37/phase3/m5/regression-m2';
mkdirSync(capture,{recursive:true});
test.beforeEach(async({page})=>{page.setDefaultTimeout(10000);await page.clock.install();});
async function intake(page:Page) {
 await page.goto('/bastrop37/');
 await page.evaluate(value=>localStorage.setItem('bastrop37-campaign-v1',JSON.stringify(value)),legacy);
 await page.reload(); await page.locator('#continue-save').click();
 await page.locator('#continue-chapter').click();
 await expect(page.locator('#game')).toHaveAttribute('data-beat','L2.01');
 await page.clock.runFor(32);
}

test('legacy save enters neutral intake; receipts wait, log chronologically, refusal saves, retries skip revelation',async({page})=>{
 test.setTimeout(300000);
 await intake(page);
 await expect(page.locator('#objective')).toHaveText('ENTER THE INSPECTION LANE');
 await expect(page.locator('#game')).toHaveAttribute('data-betrayal-known','false');
 await page.screenshot({path:`${capture}/desktop-intake.png`});
 await reveal(page);
 await expect(page.locator('#game')).toHaveAttribute('data-traffic-count','0');
 await expect(page.locator('#comms')).toHaveAttribute('data-speaker','system');
 await expect(page.locator('#comms-identity')).toBeHidden();
 await expect(page.locator('#dialogue-text')).toHaveText('WIPE MODULE\nDETAIN COURIER\nAUTH: MAYOR VLAD');
 const route=await page.locator('#game').getAttribute('data-route');
 await page.clock.fastForward(60000); await page.clock.runFor(32);
 expect(await page.locator('#game').getAttribute('data-route')).toBe(route);
 await page.screenshot({path:`${capture}/desktop-record.png`});
 await ack(page,1); await expect(page.locator('#dialogue-text')).toContainText('POWER SHUTDOWN');
 await ack(page,1); await expect(page.locator('#speaker')).toHaveText('OMEGA');
 await page.locator('#pause').click(); await page.locator('#log-details summary').click();
 await expect(page.locator('#dialogue-log li[data-kind=record]')).toHaveCount(2);
 await expect(page.locator('#dialogue-log li').nth(16)).toContainText('WIPE MODULE');
 await page.locator('#resume').click(); await ack(page,7);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('bastrop37-campaign-v1')!));
 expect(saved.checkpoint).toBe('CP-L2-ESCAPE'); expect(saved.flags.betrayalKnown).toBe(true);expect(saved.records).toHaveLength(2);
 for(let i=0;i<2;i++) {
  await page.locator('#pause').click(); await page.locator('#retry').click();
  await expect(page.locator('#game')).toHaveAttribute('data-beat','L2.03');
  await expect(page.locator('#game')).toHaveAttribute('data-state','playing');
  await expect(page.locator('#comms')).toBeHidden();
  expect(await page.locator('#game').getAttribute('data-overdrive')).toBe('0');
 }
 await page.reload(); await page.locator('#continue-save').click();
 await expect(page.locator('#game')).toHaveAttribute('data-beat','L2.03');
 await escape(page);await ack(page,4);
 await expect(page.locator('#headline')).toHaveText('RECOVERY LOCK BROKEN');
 await expect(page.locator('#continue-chapter')).toHaveText('RIDE TO THE RELAY');
 await page.screenshot({path:`${capture}/desktop-complete.png`});
 await page.reload();await page.locator('#continue-save').click();
 await expect(page.locator('#game')).toHaveAttribute('data-state','complete');
 await page.locator('#continue-chapter').click();
 await expect(page.locator('#game')).toHaveAttribute('data-beat','L3.01');
 expect((await page.evaluate(()=>JSON.parse(localStorage.getItem('bastrop37-campaign-v1')!))).checkpoint).toBe('CP-L2-COMPLETE');
});

test('touch intake and long L2 lines fit four layouts; controls stay separate through saved ending',async({page})=>{
 test.setTimeout(300000);
 await page.setViewportSize({width:390,height:844});
 await intake(page); await reveal(page);
 const geometry: unknown[]=[];
 for(const [w,h] of [[1440,900],[1280,720],[1024,768],[390,844]]) {
  await page.setViewportSize({width:w,height:h});await page.clock.runFor(64);
  await expect(page.locator('#resume')).toBeVisible(); await page.locator('#resume').click();
  await expect(page.locator('#game')).toHaveAttribute('data-state','playing');
  await page.clock.runFor(64);
  const bounds=await page.locator('#comms').boundingBox();expect(bounds!.x).toBeGreaterThanOrEqual(0);expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(w);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(w);
  geometry.push({viewport:{width:w,height:h},card:bounds,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});
  await page.screenshot({path:`${capture}/record-${w}.png`});
 }
 await ack(page,2);await ack(page,2);
 await expect(page.locator('#dialogue-text')).toContainText('power shutdowns');
 await page.clock.runFor(64);
 const card=await page.locator('#comms').boundingBox();
 expect(card!.y-Number(await page.locator('#game').getAttribute('data-rider-bottom'))).toBeGreaterThan(20);
 const controls=await page.locator('.dpad').boundingBox();expect(controls!.y-card!.y-card!.height).toBeGreaterThanOrEqual(8);
 geometry.push({longLineCard:card,riderBottom:Number(await page.locator('#game').getAttribute('data-rider-bottom')),controls});
 writeFileSync(`${capture}/geometry.json`,JSON.stringify(geometry,null,2));
 await page.screenshot({path:`${capture}/mobile-long-dialogue.png`});
 await ack(page,5);await escape(page,true);await ack(page,4);
 await expect(page.locator('#headline')).toHaveText('RECOVERY LOCK BROKEN');
 await page.reload();await page.locator('#continue-save').click();await expect(page.locator('#game')).toHaveAttribute('data-state','complete');
});

test('required L2 asset failure preserves earned L1 save and Retry Load recovers',async({page})=>{
 let fail=true;
 await page.route('**/betrayal/carrier-rear-v3.png',route=>fail?route.abort():route.continue());
 await page.goto('/bastrop37/');await page.evaluate(value=>localStorage.setItem('bastrop37-campaign-v1',JSON.stringify(value)),legacy);
 await page.reload();await page.locator('#continue-save').click();await page.locator('#continue-chapter').click();
 await expect(page.locator('#game')).toHaveAttribute('data-state','error');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('bastrop37-campaign-v1')!).checkpoint)).toBe('CP-L1-COMPLETE');
 fail=false;await page.locator('#retry').click();await expect(page.locator('#game')).toHaveAttribute('data-beat','L2.01');
});

test('local optional Overdrive fixture activates once at zero ordinary energy and lateral escape stays available',async({page})=>{
 await page.goto('/bastrop37/?fixture=m2');await page.locator('#start').click();await expect(page.locator('#game')).toHaveAttribute('data-beat','L2.03');await page.clock.runFor(32);
 expect(Number(await page.locator('#game').getAttribute('data-charge'))).toBeLessThan(.05);
 await expect(page.locator('#overdrive-state')).toContainText('READY');
 await page.keyboard.down('Shift');await page.clock.runFor(100);
 await expect(page.locator('#game')).toHaveAttribute('data-overdrive-active','true');
 await expect(page.locator('#game')).toHaveAttribute('data-overdrive','0');
 await page.clock.runFor(1600);await expect(page.locator('#game')).toHaveAttribute('data-overdrive-active','false');
 await page.keyboard.up('Shift');await escape(page);await ack(page,4);
 expect(await page.evaluate(()=>localStorage.getItem('bastrop37-campaign-v1'))).toBeNull();
});

// A canonical checkpoint fixture isolates combat retries; the continuous test earns this state through both chapters.
test('actual drone collision retries safely, blade defense earns once, and session-only L2 completion is truthful',async({page})=>{
 test.setTimeout(180000);
 const { BETRAYAL_DIALOGUE, BETRAYAL_RECORDS } = await import('../src/scripts/bastrop37/betrayal-content');
 const { betrayalSave } = await import('../src/scripts/bastrop37/save');
 const opening=BETRAYAL_DIALOGUE['L2.01'], confrontation=BETRAYAL_DIALOGUE['L2.02'];
 const log=[...legacy.log,...opening,...confrontation];
 const save=betrayalSave('CP-L2-ESCAPE',log,BETRAYAL_RECORDS,[...legacy.log,...opening,...BETRAYAL_RECORDS,...confrontation]);
 await page.goto('/bastrop37/'); await page.evaluate(value=>localStorage.setItem('bastrop37-campaign-v1',JSON.stringify(value)),save);
 await page.reload(); await page.locator('#continue-save').click();
 const {steer}=await import('./helpers/betrayal');
 await steer(page,490);
 for(let i=0;i<70 && await page.locator('#game').getAttribute('data-state')==='playing';i++)await page.clock.runFor(150);
 await expect(page.locator('#game')).toHaveAttribute('data-state','crashed');
 await page.screenshot({path:`${capture}/desktop-drone-failure.png`});
 await page.locator('#retry').click();await expect(page.locator('#game')).toHaveAttribute('data-beat','L2.03');
 await expect(page.locator('#comms')).toBeHidden();
 await page.keyboard.down('KeyJ');await steer(page,490);
 for(let i=0;i<70 && await page.locator('#game').getAttribute('data-slices')==='0';i++)await page.clock.runFor(100);
 await page.keyboard.up('KeyJ');await expect(page.locator('#game')).toHaveAttribute('data-slices','1');
 await expect(page.locator('#game')).toHaveAttribute('data-overdrive','35');
 await page.screenshot({path:`${capture}/desktop-blade-defense.png`});
 await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new DOMException('Quota','QuotaExceededError');};});
 await escape(page);await ack(page,4);
 await expect(page.locator('#save-note')).toContainText('SESSION ONLY');
 await page.locator('#menu').click();await page.locator('#continue-save').click();
 await expect(page.locator('#game')).toHaveAttribute('data-state','complete');
});

test('missed inspection scan follows its safe loop and retries without early betrayal',async({page})=>{
 test.setTimeout(180000);
 const { BETRAYAL_DIALOGUE } = await import('../src/scripts/bastrop37/betrayal-content');
 const { betrayalSave } = await import('../src/scripts/bastrop37/save');
 const log=[...legacy.log,...BETRAYAL_DIALOGUE['L2.01']];
 const save=betrayalSave('CP-L2-SCAN',log,[],log);
 await page.goto('/bastrop37/');await page.evaluate(value=>localStorage.setItem('bastrop37-campaign-v1',JSON.stringify(value)),save);
 await page.reload();await page.locator('#continue-save').click();
 await expect(page.locator('#game')).toHaveAttribute('data-beat','L2.02');
 const {steer}=await import('./helpers/betrayal');await steer(page,490);
 for(let i=0;i<35 && !(await page.locator('#route-cue').textContent())?.includes('LOOP');i++)await page.clock.runFor(100);
 await expect(page.locator('#route-cue')).toContainText('LOOP');
 await expect(page.locator('#game')).toHaveAttribute('data-betrayal-known','false');
 await steer(page,320);
 for(let i=0;i<80 && !await page.locator('#game').getAttribute('data-record-id');i++)await page.clock.runFor(100);
 await expect(page.locator('#game')).toHaveAttribute('data-record-id','L2.02-RECORD-01');
 await expect(page.locator('#game')).toHaveAttribute('data-state','playing');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('bastrop37-campaign-v1')!).checkpoint)).toBe('CP-L2-SCAN');
});

test('three defended drone passes leave visibly before removal while the lock remains unfinished',async({page})=>{
 test.setTimeout(180000);
 const { BETRAYAL_DIALOGUE, BETRAYAL_RECORDS } = await import('../src/scripts/bastrop37/betrayal-content');
 const { betrayalSave } = await import('../src/scripts/bastrop37/save');
 const opening=BETRAYAL_DIALOGUE['L2.01'], confrontation=BETRAYAL_DIALOGUE['L2.02'];
 const save=betrayalSave('CP-L2-ESCAPE',[...legacy.log,...opening,...confrontation],BETRAYAL_RECORDS,[...legacy.log,...opening,...BETRAYAL_RECORDS,...confrontation]);
 await page.goto('/bastrop37/');await page.evaluate(value=>localStorage.setItem('bastrop37-campaign-v1',JSON.stringify(value)),save);
 await page.reload();await page.locator('#continue-save').click();await expect(page.locator('#game')).toHaveAttribute('data-beat','L2.03');
 let defenses=0,lastZ=0;
 for(let i=0;i<350;i++) {
  const phase=await page.locator('#game').getAttribute('data-drone-phase');
  const z=Number(await page.locator('#game').getAttribute('data-drone-z'));
  if(Number.isFinite(z))lastZ=z;
  if(defenses===3 && await page.locator('#game').getAttribute('data-drone-count')==='0')break;
  if(phase==='signal') {await page.keyboard.down('Shift');await page.clock.runFor(64);await page.keyboard.up('Shift');defenses++;}
  await page.clock.runFor(100);await expect(page.locator('#game')).toHaveAttribute('data-state','playing');
 }
 expect(defenses).toBe(3);expect(lastZ).toBeGreaterThan(1400);
 await expect(page.locator('#game')).toHaveAttribute('data-drone-count','0');
 await expect(page.locator('#game')).toHaveAttribute('data-beat','L2.03');
 await expect(page.locator('#game')).toHaveAttribute('data-lock-broken','false');
});
