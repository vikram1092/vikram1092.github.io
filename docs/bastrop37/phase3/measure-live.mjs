import { chromium } from '@playwright/test';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import os from 'node:os';
const earnedSave = JSON.parse(await readFile('docs/bastrop37/phase3/earned-completion-save.json', 'utf8'));
const browser = await chromium.launch({ headless: true });
const result = { date: new Date().toISOString(), browser: browser.version(), hardware: { platform: os.platform(), arch: os.arch(), cpu: os.cpus()[0].model, memory: os.totalmem() }, caveat: 'Headless Chromium local measurements; no physical mobile-device or human-play performance claim.', viewports: [] };
await mkdir('docs/bastrop37/phase3/captures', { recursive: true });
for (const [width, height] of [[1440, 900], [1280, 720], [1024, 768], [390, 844]]) {
  let page = await browser.newPage({ viewport: { width, height }, hasTouch: width < 600 });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4321/bastrop37/'); await page.locator('#start').click();
  const measured = await page.evaluate(async () => {
    const samples = []; let last = performance.now();
    for (let i = 0; i < 180; i++) { const now = await new Promise(requestAnimationFrame); samples.push(now - last); last = now; }
    const sorted = samples.slice(5).sort((a, b) => a - b);
    const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length;
    return { frames: sorted.length, meanMs: mean, p95Ms: sorted[Math.floor(sorted.length * .95)], approximateFps: 1000 / mean, jsHeapBytes: performance.memory?.usedJSHeapSize ?? null, loadedResourceBytes: performance.getEntriesByType('resource').reduce((sum, resource) => sum + resource.encodedBodySize, 0), state: document.querySelector('#game').dataset.state, route: document.querySelector('#game').dataset.route, line: document.querySelector('#dialogue-text').textContent, horizontalOverflow: document.documentElement.scrollWidth > innerWidth, logicalCanvas: {width:document.querySelector('#game').width,height:document.querySelector('#game').height} };
  });
  await page.screenshot({ path: `docs/bastrop37/phase3/captures/${width}x${height}-opening.png` });
  for (let i = 0; i < 5; i++) await page.keyboard.press('Enter');
  const actionMeasured = await page.evaluate(async () => {
    const samples = []; let last = performance.now();
    for (let i = 0; i < 180; i++) { const now = await new Promise(requestAnimationFrame); samples.push(now - last); last = now; }
    const sorted = samples.slice(5).sort((a, b) => a - b);
    const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length;
    return { frames: sorted.length, meanMs: mean, p95Ms: sorted[Math.floor(sorted.length * .95)], approximateFps: 1000 / mean, jsHeapBytes: performance.memory?.usedJSHeapSize ?? null, loadedResourceBytes: performance.getEntriesByType('resource').reduce((sum, resource) => sum + resource.encodedBodySize, 0), state: document.querySelector('#game').dataset.state, route: document.querySelector('#game').dataset.route, line: document.querySelector('#dialogue-text').textContent, horizontalOverflow: document.documentElement.scrollWidth > innerWidth, logicalCanvas: {width:document.querySelector('#game').width,height:document.querySelector('#game').height} };
  });
  await page.close();
  page = await browser.newPage({ viewport: { width, height }, hasTouch: width < 600 });
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install();
  await page.goto('http://127.0.0.1:4321/bastrop37/'); await page.locator('#start').click();
  // Longest opening line proves wrapping and rider clearance without advancing the route.
  await page.keyboard.press('Enter'); await page.keyboard.press('Enter');
  await page.clock.runFor(32);
  if(await page.locator('#game').getAttribute('data-dialogue-id') !== 'L1.01-03') throw new Error('Long-line capture did not reach the required dialogue');
  if(!(await page.locator('#comms').isVisible())) throw new Error('Long-line capture must display the dialogue card');
  await page.screenshot({ path: `docs/bastrop37/phase3/captures/${width}x${height}-long-line.png` });
  for (let i = 0; i < 3; i++) await page.keyboard.press('Enter');
  await page.clock.runFor(1000);
  await page.screenshot({ path: `docs/bastrop37/phase3/captures/${width}x${height}-action.png` });
  for(let i=0;i<40;i++) {
    const x=Number(await page.locator('#game').getAttribute('data-x'));
    if(Math.abs(x-243)<5)break;
    const key=x>243?'ArrowLeft':'ArrowRight';
    await page.keyboard.down(key);await page.clock.runFor(16);await page.keyboard.up(key);
  }
  for(let i=0;i<30&&await page.locator('#game').getAttribute('data-state')==='playing';i++)await page.clock.runFor(100);
  const failureState=await page.locator('#game').getAttribute('data-state');
  if(failureState!=='crashed')throw new Error(`Expected real collision at ${width}, got ${failureState}`);
  await page.screenshot({ path: `docs/bastrop37/phase3/captures/${width}x${height}-failure.png` });
  await page.evaluate(save=>localStorage.setItem('bastrop37-campaign-v1',JSON.stringify(save)),earnedSave);
  await page.reload();await page.locator('#continue-save').click();
  await page.waitForFunction(()=>document.querySelector('#game')?.dataset.state==='complete');
  const completionState=await page.locator('#game').getAttribute('data-state');
  await page.screenshot({ path: `docs/bastrop37/phase3/captures/${width}x${height}-complete.png` });
  result.viewports.push({ width, height, ...measured, actionMeasured, failureState, completionState, errors });
  await page.close();
}
await writeFile('docs/bastrop37/phase3/live-measurements.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result));
await browser.close();
