import {chromium} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
const out=path.resolve('docs/bastrop37/phase2/final-review');
const base=path.resolve('docs/bastrop37/phase2');
const manifest=JSON.parse(fs.readFileSync(base+'/asset-manifest.json'));
const errors=[];
for(const a of manifest.assets){const file=path.resolve(base,a.file);if(!fs.existsSync(file))errors.push('missing '+a.file);else if(fs.statSync(file).size!==a.bytes)errors.push('bytes '+a.id);for(const k of ['width','height','alphaBounds','pivot','intendedWorldSize','layer','blend','collision','provenance','approval'])if(a[k]===undefined)errors.push(a.id+' missing '+k);}
for(const [g,ids]of Object.entries(manifest.groups))for(const id of ids)if(!manifest.assets.some(a=>a.id===id))errors.push(g+' unresolved '+id);
const browser=await chromium.launch({headless:true});
const page=await browser.newPage();const consoleErrors=[];page.on('pageerror',e=>consoleErrors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
await page.goto('http://localhost:4178/docs/bastrop37/phase2/');await page.waitForFunction(()=>window.previewReady);
const ids=await page.evaluate(()=>window.phase2Samples);
const rows=[];
for(const [width,height]of [[1440,900],[1280,720],[1024,768],[390,844]]){
 await page.setViewportSize({width,height});
 for(const id of ids){await page.evaluate(id=>window.renderPhase2Sample(id),id);await page.waitForTimeout(30);
 const result=await page.evaluate(()=>{const visible=e=>!!(e.getClientRects().length)&&getComputedStyle(e).visibility!=='hidden';const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right}};return {horizontalOverflow:document.documentElement.scrollWidth>innerWidth,brokenImages:[...document.images].filter(i=>i.src&&(!i.complete||!i.naturalWidth)).map(i=>i.src),panels:[...document.querySelectorAll('#state-panel,#comms,#complete,.mission-context,.objective,.touch-controls')].filter(visible).map(e=>({id:e.id||e.className,...rect(e),scroll:e.scrollHeight>e.clientHeight+1,text:e.innerText})),canvas:rect(document.querySelector('#scene'))}});
 rows.push({width,height,id,...result});await page.screenshot({path:`${out}/${width}x${height}-${id}.png`});}
}
await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.renderPhase2Sample('l2-record-1'));
const sequence=[];for(let i=0;i<10;i++){sequence.push(await page.locator('#state-panel').innerText());if(i<9)await page.locator('#state-panel button').first().click();}
await page.evaluate(()=>window.renderPhase2Sample('pause'));for(const x of await page.locator('#state-panel summary').all())await x.click();await page.screenshot({path:out+'/390x844-pause-expanded.png'});
const pauseExpanded=await page.locator('#state-panel').evaluate(e=>({scrollHeight:e.scrollHeight,clientHeight:e.clientHeight,text:e.innerText}));
for(const size of [[1440,900],[1280,720],[1024,768],[390,844]]){await page.setViewportSize({width:size[0],height:size[1]});await page.goto('http://localhost:4178/docs/bastrop37/phase2/?view=story&line=9');await page.waitForFunction(()=>window.previewReady);await page.screenshot({path:`${out}/${size[0]}x${size[1]}-delivery-long.png`});}
fs.writeFileSync(out+'/independent-checks.json',JSON.stringify({timestamp:new Date().toISOString(),manifest:{entries:manifest.assets.length,approved:manifest.assets.filter(a=>a.approval.startsWith('approved')).length,pending:manifest.assets.filter(a=>a.approval.startsWith('pending')).length,groups:Object.keys(manifest.groups),errors},consoleErrors,rows,sequence,pauseExpanded},null,2));
console.log(JSON.stringify({states:ids.length,layouts:rows.length,errors,consoleErrors,overflow:rows.filter(r=>r.horizontalOverflow).map(r=>r.id),broken:rows.filter(r=>r.brokenImages.length),scroll:rows.filter(r=>r.panels.some(p=>p.scroll)).map(r=>({size:r.width,id:r.id}))}));
await browser.close();
