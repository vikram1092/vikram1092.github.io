import { chromium } from '@playwright/test';
import fs from 'node:fs';
import crypto from 'node:crypto';
const dir='docs/bastrop37/phase2/revision-v2/review/';
const base='http://localhost:4178/docs/bastrop37/phase2/revision-v2/';
const spec=fs.readFileSync('docs/bastrop37/PHASE_1_NARRATIVE_AND_ENCOUNTERS.md','utf8');
const canonical=Object.fromEntries([...spec.matchAll(/`(L1\.(?:01|03)-\d+)` (VLAD|JO|OMEGA): “([^”]+)”/g)].map(m=>[m[1],{speaker:m[2].toLowerCase(),text:m[3]}]));
const b=await chromium.launch();const p=await b.newPage();let checks=[],errors=[],dialogue=[];
p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
for(const [width,height] of [[1440,900],[390,844],[1280,720],[1024,768]]){
 await p.setViewportSize({width,height});
 for(const [view,line] of [['action',0],['vlad',0],['vlad',2],['omega',0],['omega',4]]){
  await p.goto(`${base}?view=${view}&line=${line}`);await p.waitForFunction(()=>window.previewReady);
  const result=await p.evaluate(()=>{const rect=s=>{let r=document.querySelector(s).getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right}};return{overflow:document.documentElement.scrollWidth>innerWidth,missing:window.previewErrors,frame:rect('#scene-frame'),comms:rect('#comms'),touch:rect('.touch'),dialogueFont:getComputedStyle(document.querySelector('#dialogue')).fontSize,bike:window.sceneMetrics.bike,commsVisible:!document.querySelector('#comms').hidden,text:document.querySelector('#dialogue').textContent,speaker:document.querySelector('#comms').dataset.speaker,gateHidden:document.querySelector('#route-marker').hidden,identityVisible:getComputedStyle(document.querySelector('.identity')).display!=='none'}});
  checks.push({width,height,view,line,...result});await p.screenshot({path:`${dir}${width}x${height}-${view}-${line}.png`});
 }
}
for(const view of ['vlad','omega']){await p.goto(`${base}?view=${view}`);await p.waitForFunction(()=>window.previewReady);for(let i=0;i<5;i++){const line=await p.evaluate(()=>({id:document.querySelector('#line-ref').textContent.split(' · ')[0],speaker:document.querySelector('#comms').dataset.speaker,text:document.querySelector('#dialogue').textContent,identityVisible:getComputedStyle(document.querySelector('.identity')).display!=='none'}));dialogue.push({...line,exact:JSON.stringify({speaker:line.speaker,text:line.text})===JSON.stringify(canonical[line.id])});await p.locator('#advance').click()}}
await p.goto(`${base}?view=omega`);await p.waitForFunction(()=>window.previewReady);await p.keyboard.press('Enter');const keyboardAdvance=await p.locator('#dialogue').textContent()==="Who's talking?";
await p.keyboard.press('Tab');const keyboardFocus=await p.evaluate(()=>document.activeElement.tagName==='BUTTON');
const manifest=JSON.parse(fs.readFileSync('docs/bastrop37/phase2/revision-v2/asset-manifest.json','utf8'));const assetChecks=manifest.assets.map(a=>{const data=fs.readFileSync('docs/bastrop37/phase2/revision-v2/'+a.file);return{id:a.id,width:data.readUInt32BE(16),height:data.readUInt32BE(20),bytes:data.length,match:data.readUInt32BE(16)===a.width&&data.readUInt32BE(20)===a.height&&data.length===a.bytes,promptsExist:a.promptFiles.every(f=>fs.existsSync('docs/bastrop37/phase2/revision-v2/'+f))}});
const hashes=Object.fromEntries(['preview.js','preview.css','index.html','asset-manifest.json'].map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync('docs/bastrop37/phase2/revision-v2/'+f)).digest('hex')]));
fs.writeFileSync(dir+'independent-checks.json',JSON.stringify({timestamp:new Date().toISOString(),hashes,errors,checks,dialogue,keyboardAdvance,keyboardFocus,assetChecks},null,2));console.log(JSON.stringify({layouts:checks.length,errors,exactDialogue:dialogue.every(l=>l.exact),keyboardAdvance,keyboardFocus,assetChecks}));await b.close();
