import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const root='docs/bastrop37/phase3/m5/review/repair';mkdirSync(root,{recursive:true});
const earned=JSON.parse(readFileSync('docs/bastrop37/phase3/m5/review/independent-results.json','utf8')).earnedRelease;
const browser=await chromium.launch({headless:true});
const results=[];const address='http://127.0.0.1:4321/bastrop37/';const key='bastrop37-campaign-v1';
for(const [width,height] of [[1440,900],[1280,720],[1024,768],[390,844]]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,hasTouch:width===390,isMobile:width===390});
  const page=await context.newPage();await page.clock.install();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const stages=[];const game=page.locator('#game');
  async function snap(name){
    const state=await page.evaluate(key=>{
      const game=document.querySelector('#game'),el=document.querySelector('#comms'),drive=document.querySelector('#drive-state');
      return {game:{...game.dataset},save:JSON.parse(localStorage.getItem(key)||'null'),
        drive:drive?.textContent,feedback:document.querySelector('#feedback')?.textContent,
        routeCue:document.querySelector('#route-cue')?.textContent,
        module:document.querySelector('.module-stamp')?.textContent,
        receiver:el?.textContent,card:el?.getBoundingClientRect().toJSON(),
        canvas:game.getBoundingClientRect().toJSON(),width:innerWidth,scrollWidth:document.documentElement.scrollWidth};
    },key);stages.push({name,...state});await page.screenshot({path:`${root}/${width}-${name}.png`});return state;
  }
  async function advance(){if(width===390)await page.locator('#advance').tap({position:{x:15,y:20}});else await page.locator('#advance').click();await page.clock.runFor(32);}
  try{
    await page.goto(address);await page.evaluate(({key,earned})=>localStorage.setItem(key,JSON.stringify(earned)),{key,earned});await page.reload();
    await page.locator('#continue-save').click();await page.locator('#game[data-state="playing"][data-beat="L5.04"]').waitFor();
    await snap('closure-zero');
    for(let i=0;i<3;i++)await advance();
    await snap('dawn-start');
    for(let i=0;i<30&&await game.getAttribute('data-release-stage')!=='recovery-read';i++)await page.clock.runFor(50);
    await page.clock.runFor(200);await snap('recovery-read');
    for(let i=0;i<3;i++)await advance();await snap('protected-travel');
    for(let i=0;i<100&&await game.getAttribute('data-campaign-complete')!=='true';i++)await page.clock.runFor(50);
    await snap('complete');
    await page.reload();await page.locator('#continue-save').click();await page.locator('#game[data-state="complete"][data-chapter="L5"]').waitFor();await snap('complete-reload');
    results.push({width,height,stages,errors});
  }catch(error){await snap('error').catch(()=>{});results.push({width,height,stages,errors:[...errors,String(error?.stack||error)]});}
  finally{await context.close();}
}
writeFileSync(`${root}/results.json`,JSON.stringify({candidate:'2026-10-04 11:18:36 local',seed:'independently earned CP-L5-RELEASED',results},null,2));await browser.close();
