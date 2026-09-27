import {chromium} from '@playwright/test';
import fs from 'node:fs';
const out='docs/bastrop37/phase2/final-review';
const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:390,height:844}});
await page.goto('http://localhost:4178/docs/bastrop37/phase2/');await page.waitForFunction(()=>window.previewReady);
const checks={};
await page.evaluate(()=>window.renderPhase2Sample('l5-public'));
await page.selectOption('#line-select','0');
checks.lineReset=await page.evaluate(()=>({sample:document.querySelector('#preview').dataset.sample,chapter:document.querySelector('.objective .eyebrow').textContent,line:document.querySelector('#dialogue').textContent}));
await page.click('#advance');checks.lineAdvance=await page.locator('#dialogue').innerText();
await page.evaluate(()=>window.renderPhase2Sample('l5-public'));await page.selectOption('#ability-select','active');
checks.abilityReset=await page.evaluate(()=>({sample:document.querySelector('#preview').dataset.sample,chapter:document.querySelector('.objective .eyebrow').textContent,state:document.querySelector('#turbo').textContent}));
await page.evaluate(()=>window.renderPhase2Sample('pause'));for(const x of await page.locator('#state-panel summary').all())await x.click();await page.locator('#state-panel').evaluate(e=>e.scrollTop=e.scrollHeight);await page.screenshot({path:out+'/390x844-pause-scroll-bottom.png'});await page.getByRole('button',{name:'RESUME',exact:true}).click();checks.pauseResume=await page.locator('#preview').getAttribute('data-sample');
await page.evaluate(()=>window.renderPhase2Sample('l5-public'));checks.finaleSequence=[];
for(let i=0;i<7;i++){checks.finaleSequence.push(await page.evaluate(()=>({sample:document.querySelector('#preview').dataset.sample,text:document.querySelector('#state-panel').innerText,context:document.querySelector('#mission-context').innerText})));if(i<6)await page.locator('#state-panel button').first().click();}
for(const [width,height]of [[1440,900],[1280,720],[1024,768],[390,844]]){await page.setViewportSize({width,height});for(const mode of ['action','complete','compare']){await page.goto('http://localhost:4178/docs/bastrop37/phase2/?view='+mode);await page.waitForFunction(()=>window.previewReady);await page.screenshot({path:`${out}/${width}x${height}-delivery-${mode}.png`});}}
fs.writeFileSync(out+'/interaction-rechecks.json',JSON.stringify(checks,null,2));console.log(checks);await browser.close();
