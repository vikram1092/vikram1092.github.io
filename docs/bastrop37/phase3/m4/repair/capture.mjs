import {chromium} from '@playwright/test';
import {readFileSync,writeFileSync} from 'node:fs';
const root='docs/bastrop37/phase3/m4/repair';
const save=JSON.parse(readFileSync('docs/bastrop37/phase3/m4/review/earned-escort-save.json','utf8'));
const browser=await chromium.launch({headless:true});const results=[];
for(const [width,height] of [[1440,900],[1280,720],[1024,768],[390,844]]){
 const page=await browser.newPage({viewport:{width,height}});await page.clock.install();
 await page.goto('http://127.0.0.1:4321/bastrop37/');await page.evaluate(s=>localStorage.setItem('bastrop37-campaign-v1',JSON.stringify(s)),save);
 await page.reload();await page.locator('#continue-save').click();await page.locator('#game[data-beat="L4.03"][data-state="playing"]').waitFor();await page.clock.runFor(250);
 await page.screenshot({path:`${root}/action-${width}.png`});results.push(await page.evaluate(()=>({width:innerWidth,height:innerHeight,game:{...document.querySelector('#game').dataset}})));await page.close();
}
writeFileSync(`${root}/geometry.json`,JSON.stringify(results,null,2));await browser.close();
