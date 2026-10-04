import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';

const root='docs/bastrop37/phase3/m5/review';
const prior=JSON.parse(readFileSync(`${root}/independent-results.json`,'utf8'));
const upload=prior.earnedUpload,complete=prior.earnedComplete;
const browser=await chromium.launch({headless:true});
const address='http://127.0.0.1:4321/bastrop37/';
const key='bastrop37-campaign-v1';
const results=[];
async function setup(label,save,width=1440,height=900){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,hasTouch:width===390,isMobile:width===390});
  const page=await context.newPage();await page.clock.install();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(address);await page.evaluate(({key,save})=>localStorage.setItem(key,JSON.stringify(save)),{key,save});await page.reload();
  await page.locator('#continue-save').click();await page.locator('#game[data-state="playing"][data-chapter="L5"]').waitFor();
  const game=page.locator('#game'),obs=[];
  async function snap(name){const state=await page.evaluate(key=>({game:{...document.querySelector('#game').dataset},save:JSON.parse(localStorage.getItem(key)||'null'),scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,card:document.querySelector('#comms').getBoundingClientRect().toJSON()}),key);obs.push({name,...state});await page.screenshot({path:`${root}/${label}-${name}.png`});return state;}
  async function runUntil(predicate,limit=300,ms=50){for(let i=0;i<limit;i++){if(await predicate())return true;await page.clock.runFor(ms);}return false;}
  async function steer(target){for(let i=0;i<200;i++){let x=Number(await game.getAttribute('data-x'));if(Math.abs(x-target)<6)return;let k=x<target?'ArrowRight':'ArrowLeft';await page.keyboard.down(k);await page.clock.runFor(16);await page.keyboard.up(k);}throw Error(`steer ${target}`);}
  return {context,page,game,errors,obs,snap,runUntil,steer};
}
async function scenario(label,save,fn,width=1440,height=900){const t=await setup(label,save,width,height);try{await fn(t);results.push({label,obs:t.obs,errors:t.errors});}catch(e){await t.snap('error').catch(()=>{});results.push({label,obs:t.obs,errors:[...t.errors,String(e?.stack||e)]});}finally{await t.context.close();}}

await scenario('crash-reset-desktop',upload,async t=>{
  if(!await t.runUntil(async()=>await t.game.getAttribute('data-release-stage')==='intercept',300,50))throw Error('A failed to link');
  await t.snap('a-linked');await t.steer(490);
  if(!await t.runUntil(async()=>await t.game.getAttribute('data-state')==='crashed',400,50))throw Error('No real intercept collision');
  await t.snap('failure');await t.page.locator('#retry').click();await t.page.clock.runFor(32);
  await t.page.locator('#game[data-state="playing"][data-release-stage="upload-a"]').waitFor();await t.snap('retry-rendered');
},1440,900);

await scenario('dropout-loop',upload,async t=>{
  if(!await t.runUntil(async()=>Number(await t.game.getAttribute('data-upload-seconds-a'))>=.7,100,50))throw Error('A no partial progress');
  await t.snap('partial');await t.page.keyboard.press('KeyK');await t.page.clock.runFor(200);await t.snap('airborne');
  await t.steer(490);await t.snap('outside');
  if(!await t.runUntil(async()=>Number(await t.game.getAttribute('data-upload-loops-a'))>=1,300,50))throw Error('A did not loop');
  await t.snap('loop');await t.page.locator('#pause').click();await t.page.locator('#retry').click();await t.page.clock.runFor(32);
  await t.page.locator('#game[data-state="playing"][data-release-stage="upload-a"]').waitFor();await t.snap('retry-rendered');
},1440,900);

await scenario('crash-reset-mobile',upload,async t=>{
  if(!await t.runUntil(async()=>await t.game.getAttribute('data-release-stage')==='intercept',350,50))throw Error('A failed to link');
  await t.steer(490);
  if(!await t.runUntil(async()=>await t.game.getAttribute('data-state')==='crashed',400,50))throw Error('No mobile collision');
  await t.snap('failure');await t.page.locator('#retry').tap();await t.page.clock.runFor(32);
  await t.page.locator('#game[data-state="playing"][data-release-stage="upload-a"]').waitFor();await t.snap('retry-rendered');
},390,844);

await scenario('touch-multitouch',upload,async t=>{
  const cdp=await t.context.newCDPSession(t.page);const right=(await t.page.locator('[data-key="ArrowRight"]').boundingBox());const blade=(await t.page.locator('[data-key="ControlLeft"]').boundingBox());
  const point=(box,id)=>({x:box.x+box.width/2,y:box.y+box.height/2,id});
  const before=Number(await t.game.getAttribute('data-x'));
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(right,1)]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(right,1),point(blade,2)]});
  await t.page.clock.runFor(300);await t.snap('both-held');
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await t.page.clock.runFor(32);
  const after=Number(await t.game.getAttribute('data-x'));if(after<=before+10)throw Error(`touch steer failed ${before}→${after}`);
},390,844);

for(const [width,height]of[[1440,900],[1280,720],[1024,768],[390,844]]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,hasTouch:width===390,isMobile:width===390});
  const page=await context.newPage();await page.goto(address);await page.evaluate(({key,complete})=>localStorage.setItem(key,JSON.stringify(complete)),{key,complete});await page.reload();await page.locator('#continue-save').click();await page.locator('#game[data-state="complete"][data-chapter="L5"]').waitFor();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const state=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,game:{...document.querySelector('#game').dataset},overlay:document.querySelector('#overlay').textContent,buttons:[...document.querySelectorAll('#chapter-picker button')].filter(b=>!b.hidden).map(b=>b.textContent)}));
  await page.screenshot({path:`${root}/complete-${width}.png`});results.push({label:`complete-${width}`,obs:[state],errors});await context.close();
}
writeFileSync(`${root}/edges-results.json`,JSON.stringify({candidate:'2026-10-04 11:03:33 local',seed:'earned CP-L5-UPLOAD and completed save from independent normal play',results},null,2));
await browser.close();
