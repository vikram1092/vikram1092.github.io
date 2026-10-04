import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
const root='docs/bastrop37/phase3/m4/review/repair';
const m3=JSON.parse(readFileSync('docs/bastrop37/phase3/m3/earned-completion-save.json','utf8'));
const escort=JSON.parse(readFileSync(`${root}/earned-escort-save.json`,'utf8'));
const complete=JSON.parse(readFileSync(`${root}/earned-complete-save.json`,'utf8'));
const browser=await chromium.launch({headless:true});
const results=[];
const sizes=[[1440,900],[1280,720],[1024,768],[390,844]];
async function make(width,height,save){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,hasTouch:width===390,isMobile:width===390});
  const page=await context.newPage();await page.clock.install();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4321/bastrop37/');
  await page.evaluate(s=>localStorage.setItem('bastrop37-campaign-v1',JSON.stringify(s)),save);
  await page.reload();await page.locator('#continue-save').click();
  await page.waitForFunction(()=>['playing','complete'].includes(document.querySelector('#game')?.dataset.state)&&document.querySelector('#game')?.dataset.chapter=== (localStorage.getItem('bastrop37-campaign-v1')?.includes('CP-L3-COMPLETE')?'L3':'L4'),null,{timeout:30000});
  return {context,page,errors};
}
async function snap(page,label){
  const state=await page.evaluate(()=>{
    const g=document.querySelector('#game'),canvas=g.getBoundingClientRect(),meter=document.querySelector('#mission-meter'),card=document.querySelector('#advance');
    const rect=el=>el.getBoundingClientRect().toJSON();
    return {viewport:[innerWidth,innerHeight],scrollWidth:document.documentElement.scrollWidth,game:{...g.dataset},canvas:rect(g),meter:{hidden:meter.hidden,rect:rect(meter),text:meter.textContent},card:{hidden:card.closest('#comms').hidden,rect:rect(card),text:card.textContent},dpad:rect(document.querySelector('.dpad')),actions:rect(document.querySelector('.actions'))};
  });
  await page.screenshot({path:`${root}/visual-${label}.png`});
  return state;
}
for(const [w,h] of sizes){
  const t=await make(w,h,escort);
  await t.page.clock.runFor(250);
  const state=await snap(t.page,`action-${w}`);
  if(w===390){
    const before=Number(state.game.x);
    const b=await t.page.locator('[data-key="ArrowRight"]').boundingBox();
    const session=await t.context.newCDPSession(t.page);
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2,id:1}]});
    await t.page.clock.runFor(320);
    await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await t.page.clock.runFor(32);
    state.touchSteer={before,after:Number(await t.page.locator('#game').getAttribute('data-x'))};
  }
  results.push({label:`action-${w}`,state,errors:t.errors});await t.context.close();
}
for(const [w,h] of [[1440,900],[390,844]]){
  const s=await make(w,h,m3);
  await s.page.locator('#continue-chapter').click();
  await s.page.locator('#game[data-beat="L4.01"]').waitFor();
  const state=await snap(s.page,`story-${w}`);
  if(w===390){
    const before=state.game.dialogueId;
    await s.page.locator('#advance').tap({position:{x:20,y:20}});
    await s.page.clock.runFor(32);
    state.cardTap={before,after:await s.page.locator('#game').getAttribute('data-record-id')};
  }
  results.push({label:`story-${w}`,state,errors:s.errors});await s.context.close();
  const c=await make(w,h,complete);
  results.push({label:`complete-${w}`,state:await snap(c.page,`complete-${w}`),errors:c.errors});await c.context.close();
}
writeFileSync(`${root}/visual-results.json`,JSON.stringify(results,null,2));await browser.close();
