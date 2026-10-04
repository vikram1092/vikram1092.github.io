import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';

const root='docs/bastrop37/phase3/m5/review/repair';
const earned=JSON.parse(readFileSync('docs/bastrop37/phase3/m5/review/independent-results.json','utf8')).earnedComplete;
const browser=await chromium.launch({headless:true});const results=[];
const address='http://127.0.0.1:4321/bastrop37/',key='bastrop37-campaign-v1';
for(const width of [1440,390])for(const clocked of [true,false]){
  const context=await browser.newContext({viewport:{width,height:width===390?844:900},deviceScaleFactor:1,hasTouch:width===390,isMobile:width===390});
  const page=await context.newPage();if(clocked)await page.clock.install();const game=page.locator('#game');const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const steps=[];
  async function observe(name){const value=await page.evaluate(key=>({state:document.querySelector('#game').dataset.state,
    confirmation:!document.querySelector('#reset-confirm').hidden,
    newGameVisible:!document.querySelector('#new-game').hidden,
    continueVisible:!document.querySelector('#continue-save').hidden,
    checkpoint:JSON.parse(localStorage.getItem(key)||'null')?.checkpoint,
    durable:localStorage.getItem(key),
    scrollWidth:document.documentElement.scrollWidth,width:innerWidth}),key);steps.push({name,...value});return value;}
  try{
    await page.goto(address);await page.evaluate(({key,earned})=>localStorage.setItem(key,JSON.stringify(earned)),{key,earned});await page.reload();
    await page.locator('#continue-save').click();await page.locator('#game[data-state="complete"][data-chapter="L5"]').waitFor();
    if(clocked)await page.clock.runFor(32);else await page.waitForTimeout(50);
    await observe('complete');
    // Normal settled-title path: wait for the ready frame before opening the prompt.
    await page.locator('#menu').click();
    if(clocked)await page.clock.runFor(32);
    await page.locator('#game[data-state="ready"]').waitFor();await observe('ready');
    for(let i=0;i<3;i++){
      const button=page.locator('#new-game');if(width===390)await button.tap();else await button.click();
      await observe(`prompt-${i}`);
      const cancel=page.locator('#cancel-new-game');if(width===390)await cancel.tap();else await cancel.click();
      if(clocked)await page.clock.runFor(32);
      await observe(`cancel-${i}`);
    }
    await page.locator('#continue-save').click();await page.locator('#game[data-state="complete"][data-chapter="L5"]').waitFor();
    if(clocked)await page.clock.runFor(32);else await page.waitForTimeout(50);
    await observe('continue-after-cancel');
    // A deliberately same-frame pair probes the suspected test-driver race.
    await page.locator('#menu').click();await observe('rapid-menu-before-render');
    if(width===390)await page.locator('#new-game').tap();else await page.locator('#new-game').click();
    await observe('rapid-prompt-before-render');
    if(clocked)await page.clock.runFor(32);else await page.waitForTimeout(50);
    await observe('rapid-next-frame');
    if(await page.locator('#reset-confirm').isVisible()){
      if(width===390)await page.locator('#cancel-new-game').tap();else await page.locator('#cancel-new-game').click();
    }
    results.push({width,clocked,steps,errors});
  }catch(error){results.push({width,clocked,steps,errors:[...errors,String(error?.stack||error)]});}
  finally{await context.close();}
}
writeFileSync(`${root}/confirmation-review.json`,JSON.stringify({candidate:'2026-10-04 11:18:36 local',seed:'independently earned CP-CAMPAIGN-COMPLETE',results},null,2));
await browser.close();
