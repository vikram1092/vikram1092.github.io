import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
const root='docs/bastrop37/phase3/m4/review';
const earned=JSON.parse(readFileSync(`${root}/earned-escort-save.json`,'utf8'));
const complete=JSON.parse(readFileSync(`${root}/earned-complete-save.json`,'utf8'));
const browser=await chromium.launch({headless:true});
const results=[];
for(const [label,save] of [['escort',earned],['complete',complete]]){
  const page=await browser.newPage({viewport:{width:1440,height:900}}); await page.clock.install();
  await page.goto('http://127.0.0.1:4321/bastrop37/');
  await page.evaluate(s=>localStorage.setItem('bastrop37-campaign-v1',JSON.stringify(s)),save);
  await page.reload(); await page.locator('#continue-save').click();
  await page.waitForFunction(() => document.querySelector('#game')?.dataset.chapter === 'L4' && ['playing','complete'].includes(document.querySelector('#game')?.dataset.state), null, {timeout:30000});
  results.push({label,state:await page.locator('#game').evaluate(el=>({...el.dataset})),save:await page.evaluate(()=>JSON.parse(localStorage.getItem('bastrop37-campaign-v1')))});
  await page.screenshot({path:`${root}/reload-${label}.png`}); await page.close();
}
writeFileSync(`${root}/reload-results.json`,JSON.stringify(results,null,2));await browser.close();
