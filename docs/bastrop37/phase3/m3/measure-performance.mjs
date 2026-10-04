import { chromium } from '@playwright/test';
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const m2=JSON.parse(readFileSync('docs/bastrop37/phase3/m2/earned-completion-save.json','utf8'));
const software=process.env.PERF_SOFTWARE==='1';
const browser=await chromium.launch({headless:true,args:software?['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:4321/bastrop37/');
await page.evaluate(save=>localStorage.setItem('bastrop37-campaign-v1',JSON.stringify(save)),m2);await page.reload();
await page.locator('#continue-save').click();await page.locator('#continue-chapter').click();
await page.waitForFunction(()=>document.querySelector('#game')?.dataset.beat==='L3.01');
async function sample(){return page.evaluate(()=>new Promise(resolve=>{
 const intervals=[];let last;function frame(time){if(last!==undefined)intervals.push(time-last);last=time;if(intervals.length<90)requestAnimationFrame(frame);else{const sorted=[...intervals].sort((a,b)=>a-b);const mean=intervals.reduce((sum,n)=>sum+n,0)/intervals.length;resolve({frames:intervals.length,meanMs:mean,p95Ms:sorted[Math.floor(sorted.length*.95)],estimatedFps:1000/mean});}}requestAnimationFrame(frame);
}));}
const snapshot=()=>page.evaluate(()=>({state:document.querySelector('#game').dataset.state,beat:document.querySelector('#game').dataset.beat,relayTarget:document.querySelector('#game').dataset.relayTarget,linkState:document.querySelector('#game').dataset.linkState}));
const storyBefore=await snapshot();const story=await sample();const storyAfter=await snapshot();
for(let i=0;i<3;i++)await page.locator('#advance').click();
await page.waitForFunction(()=>document.querySelector('#game')?.dataset.beat==='L3.02');
await page.waitForFunction(()=>document.querySelector('#game')?.dataset.linkState==='linking');
const actionBefore=await snapshot();const action=await sample();const actionAfter=await snapshot();
const resources=await page.evaluate(()=>performance.getEntriesByType('resource').map(r=>({name:new URL(r.name).pathname,encodedBytes:r.encodedBodySize,decodedBytes:r.decodedBodySize})));
const renderer=await page.evaluate(()=>{const gl=document.createElement('canvas').getContext('webgl');const ext=gl?.getExtension('WEBGL_debug_renderer_info');return gl&&ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unavailable';});
const jsHeap=await page.evaluate(()=>performance.memory?{usedBytes:performance.memory.usedJSHeapSize,totalBytes:performance.memory.totalJSHeapSize}:null);
const result={date:new Date().toISOString(),machine:execFileSync('sysctl',['-n','machdep.cpu.brand_string']).toString().trim(),memoryBytes:Number(execFileSync('sysctl',['-n','hw.memsize']).toString().trim()),browser:browser.version(),viewport:{width:1440,height:900},requestedRenderer:software?'ANGLE SwiftShader':'Browser default',reportedWebGLRenderer:renderer,story,storyBefore,storyAfter,earlyRelayAction:action,actionBefore,actionAfter,jsHeap,nominalL3RasterRgbaBytes:12582912,resourceBytes:resources.reduce((sum,r)=>sum+r.encodedBytes,0),resources,errors,limits:'Two short 90-frame samples on local desktop; not sustained performance, physical mobile, cross-browser or human pacing evidence. Check requested/reported renderer and run context.'};
writeFileSync('docs/bastrop37/phase3/m3/performance.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({...result,resources:undefined}));await browser.close();
