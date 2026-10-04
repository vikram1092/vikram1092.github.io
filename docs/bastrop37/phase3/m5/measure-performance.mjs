import {chromium} from '@playwright/test';
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const software=process.env.PERF_SOFTWARE==='1';
const browser=await chromium.launch({headless:true,args:software?['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:['--no-sandbox']});
const samples=[];
async function sample(page){return page.evaluate(()=>new Promise(resolve=>{const values=[];let prior;function frame(now){if(prior!==undefined)values.push(now-prior);prior=now;if(values.length<90)requestAnimationFrame(frame);else{const sorted=[...values].sort((a,b)=>a-b),mean=values.reduce((a,b)=>a+b,0)/values.length;resolve({frames:values.length,meanMs:mean,p95Ms:sorted[Math.floor(sorted.length*.95)],estimatedFps:1000/mean});}}requestAnimationFrame(frame);}));}
async function run(label,path,prepare){
 const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const save=JSON.parse(readFileSync(path,'utf8'));await page.goto('http://127.0.0.1:4321/bastrop37/');await page.evaluate(s=>localStorage.setItem('bastrop37-campaign-v1',JSON.stringify(s)),save);await page.reload();await page.locator('#continue-save').click();await prepare(page);
 const snapshot=()=>page.evaluate(()=>({...document.querySelector('#game').dataset}));const before=await snapshot();const result=await sample(page);const after=await snapshot();
 const detail=await page.evaluate(()=>{const gl=document.createElement('canvas').getContext('webgl'),ext=gl?.getExtension('WEBGL_debug_renderer_info');return {reportedWebGLRenderer:gl&&ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unavailable',jsHeap:performance.memory?{usedBytes:performance.memory.usedJSHeapSize,totalBytes:performance.memory.totalJSHeapSize}:null,resources:performance.getEntriesByType('resource').map(r=>({path:new URL(r.name).pathname,encodedBytes:r.encodedBodySize,transferBytes:r.transferSize}))};});
 samples.push({label,before,result,after,...detail,errors});await page.close();
}
try{
 await run('L4 active escort warning','docs/bastrop37/phase3/m4/review/earned-escort-save.json',async p=>{await p.locator('#game[data-beat="L4.03"]').waitFor();await p.keyboard.down('ArrowRight');await p.waitForFunction(()=>Number(document.querySelector('#game').dataset.x)>440);await p.keyboard.up('ArrowRight');await p.keyboard.down('KeyJ');await p.waitForFunction(()=>document.querySelector('#game').dataset.escortAttackPhase==='telegraph');});
 await run('L5 safe opening','docs/bastrop37/phase3/m4/earned-completion-save.json',async p=>{await p.locator('#continue-chapter').click();await p.locator('#game[data-beat="L5.01"]').waitFor();});
 await run('L5 active upload A','docs/bastrop37/phase3/m5/earned-upload-save.json',async p=>{await p.waitForFunction(()=>document.querySelector('#game').dataset.releaseStage==='upload-a'&&Number(document.querySelector('#game').dataset.uploadSecondsA)>0);});
 const report={date:new Date().toISOString(),machine:execFileSync('sysctl',['-n','machdep.cpu.brand_string']).toString().trim(),memoryBytes:Number(execFileSync('sysctl',['-n','hw.memsize']).toString().trim()),browser:browser.version(),viewport:[1440,900],requestedRenderer:software?'ANGLE SwiftShader':'Browser default',samples,limits:'Three isolated short 90-frame samples on local desktop. No concurrent tests/review during collection. Diagnostic WebGL renderer does not prove the Canvas2D/compositor acceleration path; JS heap excludes GPU and total browser memory. Not sustained-load, physical-phone, cross-browser or human-pacing evidence. Real-clock chapter asset payload is measured separately; the fake-clock fresh campaign returned no resource timing entries.'};
 writeFileSync(`docs/bastrop37/phase3/m5/performance-${software?'software':'default'}.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({...report,samples:samples.map(s=>({label:s.label,before:{beat:s.before.beat,state:s.before.state},result:s.result,after:{beat:s.after.beat,state:s.after.state},errors:s.errors}))}));
}finally{await browser.close();}
