import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
const root='docs/bastrop37/phase3/m4/review';
const controller=JSON.parse(readFileSync(`${root}/earned-controller-save.json`,'utf8'));
const escort=JSON.parse(readFileSync(`${root}/earned-escort-save.json`,'utf8'));
const browser=await chromium.launch({headless:true});
const results=[];
async function run(name,save,task){
  const page=await browser.newPage({viewport:{width:1440,height:900}});await page.clock.install();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4321/bastrop37/');await page.evaluate(s=>localStorage.setItem('bastrop37-campaign-v1',JSON.stringify(s)),save);
  await page.reload();await page.locator('#continue-save').click();
  await page.waitForFunction(()=>document.querySelector('#game')?.dataset.chapter==='L4'&&document.querySelector('#game')?.dataset.state==='playing',null,{timeout:30000});
  const game=page.locator('#game'),obs=[];
  const snap=async stage=>{const d=await game.evaluate(el=>({...el.dataset}));obs.push({stage,state:d.state,beat:d.beat,mode:d.mode,route:d.route,x:d.x,controllerState:d.controllerState,controllerLoops:d.controllerLoops,barrierProgress:d.barrierProgress,busCondition:d.busCondition,busProgress:d.busProgress,busSafe:d.busSafe,rampPassed:d.rampPassed,rampLoops:d.rampLoops,escortAttackPhase:d.escortAttackPhase,escortPasses:d.escortPasses,trafficCount:d.trafficCount,checkpoint:d.checkpoint});await page.screenshot({path:`${root}/edge-${name}-${stage}.png`});};
  const steer=async target=>{for(let i=0;i<200;i++){const x=Number(await game.getAttribute('data-x'));if(Math.abs(x-target)<6)return;const key=x<target?'ArrowRight':'ArrowLeft';await page.keyboard.down(key);await page.clock.runFor(16);await page.keyboard.up(key);}throw Error('steer '+target);};
  try{await task({page,game,snap,steer});results.push({name,obs,errors});}
  catch(e){await snap('error').catch(()=>{});results.push({name,obs,errors:[...errors,String(e?.stack||e)]});}
  finally{await page.close();}
}
await run('controller-loop',controller,async t=>{
  await t.snap('start');
  for(let i=0;i<200&&Number(await t.game.getAttribute('data-controller-loops'))===0;i++)await t.page.clock.runFor(50);
  await t.snap('miss');
  for(let i=0;i<200&&Number(await t.game.getAttribute('data-controller-loops'))===1&&Number(await t.game.getAttribute('data-route'))>5;i++)await t.page.clock.runFor(50);
  await t.snap('return');
});
await run('ramp-first',escort,async t=>{
  for(let i=0;i<300&&Number(await t.game.getAttribute('data-route'))<3600;i++)await t.page.clock.runFor(50);
  await t.snap('before-ramp');
  await t.steer(455);await t.page.keyboard.down('KeyJ');
  for(let i=0;i<100&&await t.game.getAttribute('data-ramp-passed')!=='true';i++)await t.page.clock.runFor(50);
  await t.snap('ramp-passed');
  for(let i=0;i<500&&await t.game.getAttribute('data-beat')!=='L4.04'&&await t.game.getAttribute('data-state')!=='crashed';i++)await t.page.clock.runFor(50);
  await t.page.keyboard.up('KeyJ');await t.snap('finish');
});
writeFileSync(`${root}/edges-results.json`,JSON.stringify(results,null,2));await browser.close();
