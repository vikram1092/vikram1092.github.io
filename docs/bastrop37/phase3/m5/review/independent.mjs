import { chromium } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const root = 'docs/bastrop37/phase3/m5/review';
mkdirSync(root, { recursive: true });
const earnedM4 = JSON.parse(readFileSync('docs/bastrop37/phase3/m4/earned-completion-save.json', 'utf8'));
const browser = await chromium.launch({ headless: true });
const results = [];
const key = 'bastrop37-campaign-v1';
const address = 'http://127.0.0.1:4321/bastrop37/';
const fields = ['state','chapter','beat','mode','route','x','checkpoint','trafficCount','droneCount','dronePhase','dronePasses','droneOutcome','slices','fragments','controllerState','controllerLoops','barrierProgress','releaseStage','releaseDefenderCleared','releaseInterceptCleared','uploadSection','uploadSecondsA','uploadSecondsB','uploadLoopsA','uploadLoopsB','uploadProgress','omegaReleased','releasePrefix','recoveryRoute','campaignComplete','replayActive'];

async function make(label, width=1440, height=900, seed=earnedM4) {
  const context = await browser.newContext({ viewport:{width,height},deviceScaleFactor:1,hasTouch:width===390,isMobile:width===390 });
  const page = await context.newPage();
  await page.clock.install();
  const errors=[]; page.on('pageerror', error=>errors.push(error.message));
  await page.goto(address);
  if (seed) {
    await page.evaluate(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),{key,value:seed});
    await page.reload();
  }
  const game=page.locator('#game');
  const observations=[];
  async function snap(name, shot=true) {
    const value=await page.evaluate(({key,fields})=>{
      const game=document.querySelector('#game');const data=game.dataset;
      return {game:Object.fromEntries(fields.map(field=>[field,data[field]])),
        dialogue:document.querySelector('#dialogue-text')?.textContent,
        speaker:document.querySelector('#speaker')?.textContent,
        routeCue:document.querySelector('#route-cue')?.textContent,
        meter:document.querySelector('#mission-meter')?.textContent,
        receiver:document.querySelector('#comms')?.textContent,
        module:document.querySelector('.module-stamp')?.textContent,
        overlay:document.querySelector('#overlay')?.textContent,
        save:JSON.parse(localStorage.getItem(key)||'null'),
        width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
        canvas:document.querySelector('#game').getBoundingClientRect().toJSON(),
        comms:document.querySelector('#comms').getBoundingClientRect().toJSON()};
    },{key,fields});
    observations.push({name,...value});
    if(shot) await page.screenshot({path:`${root}/${label}-${name}.png`});
    return value;
  }
  async function runUntil(predicate, max=300, ms=50) {
    for(let i=0;i<max;i++){if(await predicate())return true;await page.clock.runFor(ms);}
    return false;
  }
  async function steer(target) {
    for(let i=0;i<220;i++){
      const x=Number(await game.getAttribute('data-x'));
      if(Math.abs(x-target)<6)return;
      const code=x<target?'ArrowRight':'ArrowLeft';
      await page.keyboard.down(code);await page.clock.runFor(16);await page.keyboard.up(code);
    }
    throw Error(`Steering did not reach ${target}`);
  }
  async function advance(){await page.locator('#advance').click();await page.clock.runFor(32);}
  return {context,page,game,errors,observations,snap,runUntil,steer,advance};
}
async function scenario(label,fn,width=1440,height=900,seed=earnedM4){
  const t=await make(label,width,height,seed);
  try {await fn(t);results.push({label,observations:t.observations,errors:t.errors});}
  catch(error){await t.snap('error').catch(()=>{});results.push({label,observations:t.observations,errors:[...t.errors,String(error?.stack||error)]});}
  finally{await t.context.close();}
}

let earnedUpload=null, earnedRelease=null, earnedComplete=null;
await scenario('earned-main',async t=>{
  await t.page.locator('#continue-save').click();
  await t.page.locator('#continue-chapter').click();
  await t.page.locator('#game[data-beat="L5.01"]').waitFor();
  await t.snap('opening');
  const route=await t.game.getAttribute('data-route');await t.page.clock.runFor(20000);
  await t.snap('slow-read');if(await t.game.getAttribute('data-route')!==route)throw Error('Story route advanced during reading');
  for(let i=0;i<3;i++)await t.advance();
  await t.snap('controller-start');
  await t.steer(415);await t.page.keyboard.down('KeyJ');
  if(!await t.runUntil(async()=>await t.game.getAttribute('data-controller-state')==='retracting',150,50))throw Error('Controller not hit');
  await t.page.keyboard.up('KeyJ');await t.snap('controller-hit');
  if(!await t.runUntil(async()=>await t.game.getAttribute('data-release-stage')==='defender',100,50))throw Error('Defender not reached');
  await t.snap('defender');await t.steer(490);await t.page.keyboard.down('KeyJ');
  if(!await t.runUntil(async()=>await t.game.getAttribute('data-beat')==='L5.03'||await t.game.getAttribute('data-state')==='crashed',450,50))throw Error('Defender did not clear');
  await t.page.keyboard.up('KeyJ');await t.snap('upload-a-start');
  if(await t.game.getAttribute('data-state')==='crashed')throw Error('Crash during earned defender');
  earnedUpload=await t.page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
  await t.steer(320);
  if(!await t.runUntil(async()=>await t.game.getAttribute('data-release-stage')==='intercept',300,50))throw Error('A did not link');
  await t.snap('intercept');await t.steer(490);await t.page.keyboard.down('KeyJ');
  if(!await t.runUntil(async()=>await t.game.getAttribute('data-release-stage')==='upload-b'||await t.game.getAttribute('data-state')==='crashed',450,50))throw Error('Interception did not clear');
  await t.page.keyboard.up('KeyJ');await t.snap('upload-b-start');
  if(await t.game.getAttribute('data-state')==='crashed')throw Error('Crash during earned intercept');
  await t.steer(320);
  if(!await t.runUntil(async()=>await t.game.getAttribute('data-omega-released')==='true',300,50))throw Error('Release not reached');
  await t.snap('released');earnedRelease=await t.page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
  for(let i=0;i<3;i++)await t.advance();await t.snap('dawn-start');
  if(!await t.runUntil(async()=>await t.game.getAttribute('data-release-stage')==='recovery-read',100,50))throw Error('Recovery reading did not begin');
  await t.snap('recovery-read');
  for(let i=0;i<3;i++)await t.advance();await t.snap('recovery-travel');
  if(!await t.runUntil(async()=>await t.game.getAttribute('data-campaign-complete')==='true',200,50))throw Error('Recovery marker did not complete');
  await t.snap('complete');earnedComplete=await t.page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
  await t.page.reload();await t.page.locator('#continue-save').click();
  await t.page.locator('#game[data-state="complete"][data-chapter="L5"]').waitFor();await t.snap('complete-reload');
});

for(const [width,height] of [[1280,720],[1024,768],[390,844]]) {
  await scenario(`visual-${width}`,async t=>{
    await t.page.locator('#continue-save').click();
    await t.page.locator('#game[data-state="complete"][data-chapter="L4"]').waitFor();
    await t.page.locator('#continue-chapter').click();
    await t.page.locator('#game[data-state="playing"][data-beat="L5.01"]').waitFor();
    await t.snap('story');
    for(let i=0;i<3;i++)await t.advance();
    await t.snap('action');
  },width,height);
}

if(earnedRelease) await scenario('release-reload',async t=>{
  await t.page.locator('#continue-save').click();
  await t.page.locator('#game[data-state="playing"][data-beat="L5.04"]').waitFor();await t.snap('closure-zero');
  for(let i=0;i<2;i++)await t.advance();await t.snap('closure-prefix-two');
  await t.page.reload();await t.page.locator('#continue-save').click();
  await t.page.locator('#game[data-state="playing"][data-beat="L5.04"]').waitFor();await t.snap('closure-prefix-two-reload');
  await t.advance();await t.snap('dawn-reload');
  if(!await t.runUntil(async()=>await t.game.getAttribute('data-release-stage')==='recovery-read',100,50))throw Error('Dawn did not resolve');
  await t.advance();await t.snap('recovery-prefix-one');
  await t.page.reload();await t.page.locator('#continue-save').click();
  await t.page.locator('#game[data-state="playing"][data-beat="L5.05"]').waitFor();await t.snap('recovery-prefix-one-reload');
},1440,900,earnedRelease);

if(earnedComplete) await scenario('replay',async t=>{
  await t.page.locator('#continue-save').click();
  await t.page.locator('#game[data-state="complete"][data-chapter="L5"]').waitFor();await t.snap('durable-complete');
  await t.page.locator('#menu').click();await t.snap('title');
  for(const chapter of ['L1','L2','L3','L4','L5']) {
    const button=t.page.locator(`[data-replay-chapter="${chapter}"]`);
    if(!await button.isVisible())throw Error(`${chapter} locked after campaign completion`);
    await button.click();
    await t.page.locator(`#game[data-state="playing"][data-chapter="${chapter}"]`).waitFor();await t.snap(`replay-${chapter}`);
    await t.page.locator('#pause').click();await t.page.locator('#menu').click();
    await t.page.locator('#game[data-state="ready"]').waitFor();
  }
  await t.page.locator('#new-game').click();await t.snap('new-game-confirm');
  await t.page.locator('#cancel-new-game').click();await t.snap('new-game-cancel');
  const after=await t.page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
  if(JSON.stringify(after)!==JSON.stringify(earnedComplete))throw Error('Replay or cancel changed durable save');
},1440,900,earnedComplete);

writeFileSync(`${root}/independent-results.json`,JSON.stringify({candidate:'2026-10-04 11:03:33 local',seed:'earned M4 completion save',results,earnedUpload,earnedRelease,earnedComplete},null,2));
await browser.close();
