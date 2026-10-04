import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
const root='docs/bastrop37/phase3/m4/review/repair';
const controller=JSON.parse(readFileSync(`${root}/earned-controller-save.json`,'utf8'));
const escort=JSON.parse(readFileSync(`${root}/earned-escort-save.json`,'utf8'));
const browser=await chromium.launch({headless:true});const results=[];
async function setup(save){
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,hasTouch:true,isMobile:true});
  const page=await context.newPage();await page.clock.install();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4321/bastrop37/');await page.evaluate(s=>localStorage.setItem('bastrop37-campaign-v1',JSON.stringify(s)),save);
  await page.reload();await page.locator('#continue-save').tap();
  await page.waitForFunction(()=>document.querySelector('#game')?.dataset.chapter==='L4'&&document.querySelector('#game')?.dataset.state==='playing',null,{timeout:30000});
  return {context,page,errors,session:await context.newCDPSession(page)};
}
const state=async(page,label)=>{
  const value=await page.evaluate(()=>({game:{...document.querySelector('#game').dataset},scrollWidth:document.documentElement.scrollWidth,viewport:[innerWidth,innerHeight],overlay:document.querySelector('#overlay').textContent}));
  await page.screenshot({path:`${root}/${label}.png`});return value;
};
const touch=async(t,points,ms)=>{
  await t.session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});await t.page.clock.runFor(ms);
  await t.session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await t.page.clock.runFor(32);
};
{
  const t=await setup(controller);const right=await t.page.locator('[data-key="ArrowRight"]').boundingBox(),blade=await t.page.locator('[data-key="ControlLeft"]').boundingBox();
  const before=await state(t.page,'multitouch-before');
  await touch(t,[{x:right.x+right.width/2,y:right.y+right.height/2,id:1},{x:blade.x+blade.width/2,y:blade.y+blade.height/2,id:2}],400);
  const after=await state(t.page,'multitouch-after');
  results.push({label:'steer+blades',before:{x:before.game.x,blades:before.game.blades,route:before.game.route},after:{x:after.game.x,blades:after.game.blades,route:after.game.route,controllerState:after.game.controllerState},errors:t.errors,scrollWidth:after.scrollWidth});await t.context.close();
}
{
  const t=await setup(escort);const right=await t.page.locator('[data-key="ArrowRight"]').boundingBox();
  await touch(t,[{x:right.x+right.width/2,y:right.y+right.height/2,id:1}],265);
  const start=await state(t.page,'mobile-failure-start');
  for(let i=0;i<650&&await t.page.locator('#game').getAttribute('data-state')!=='crashed';i++)await t.page.clock.runFor(50);
  const failure=await state(t.page,'mobile-failure');
  await t.page.locator('#retry').tap();await t.page.clock.runFor(32);
  const retry=await state(t.page,'mobile-retry');
  results.push({label:'failure-retry',start:{state:start.game.state,x:start.game.x,busCondition:start.game.busCondition},failure:{state:failure.game.state,busCondition:failure.game.busCondition,beat:failure.game.beat},retry:{state:retry.game.state,busCondition:retry.game.busCondition,beat:retry.game.beat,checkpoint:retry.game.checkpoint},errors:t.errors,scrollWidth:retry.scrollWidth});await t.context.close();
}
writeFileSync(`${root}/mobile-results.json`,JSON.stringify(results,null,2));await browser.close();
