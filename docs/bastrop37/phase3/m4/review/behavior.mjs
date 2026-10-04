import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';

const root = 'docs/bastrop37/phase3/m4/review';
const earned = JSON.parse(readFileSync(`${root}/earned-escort-save.json`, 'utf8'));
const browser = await chromium.launch({ headless: true });
const results = [];
const keys = ['state','beat','mode','checkpoint','x','route','controllerState','barrierProgress','busCondition','busProgress','busZ','escortInRange','escortAttackPhase','escortTarget','escortPasses','busSafe','rampPassed','rampLoops','trafficCount','droneCount'];
async function setup(label, viewport = { width: 1440, height: 900 }) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  await page.clock.install();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:4321/bastrop37/');
  await page.evaluate(value => localStorage.setItem('bastrop37-campaign-v1', JSON.stringify(value)), earned);
  await page.reload(); await page.locator('#continue-save').click();
  const game = page.locator('#game');
  const observations = [];
  async function snap(stage, screenshot=false) {
    const all = await game.evaluate(el => ({ ...el.dataset }));
    const gameState = Object.fromEntries(keys.map(k => [k, all[k]]));
    const value = { stage, game: gameState, save: await page.evaluate(() => JSON.parse(localStorage.getItem('bastrop37-campaign-v1') || 'null')), scrollWidth: await page.evaluate(() => document.documentElement.scrollWidth) };
    observations.push(value);
    if (screenshot) await page.screenshot({ path: `${root}/${label}-${stage}.png` });
    return value;
  }
  async function steer(target) {
    for(let i=0;i<180;i++) {
      const x=Number(await game.getAttribute('data-x'));
      if(Math.abs(x-target)<6)return;
      const key=x<target?'ArrowRight':'ArrowLeft';
      await page.keyboard.down(key); await page.clock.runFor(16); await page.keyboard.up(key);
    }
    throw new Error(`steer failed ${target}`);
  }
  async function runUntil(pred, max=200, step=50) { for(let i=0;i<max;i++){if(await pred()) return true; await page.clock.runFor(step);}return false; }
  return { page, game, errors, observations, snap, steer, runUntil };
}
async function scenario(label, fn) {
  const t=await setup(label);
  try { await fn(t); results.push({ label, observations:t.observations, errors:t.errors }); }
  catch(e) { await t.snap('error',true).catch(()=>{}); results.push({ label, observations:t.observations, errors:[...t.errors,String(e?.stack||e)] }); }
  finally { await t.page.close(); }
}
await scenario('missed-attacks', async t => {
  await t.steer(365); await t.snap('start',true);
  for(let i=0;i<600;i++) {
    await t.page.clock.runFor(50);
    const condition=Number(await t.game.getAttribute('data-bus-condition'));
    if(!t.observations.some(o=>o.stage===`condition-${condition}`)) await t.snap(`condition-${condition}`,true);
    if(await t.game.getAttribute('data-state')==='crashed') break;
  }
  await t.snap('failure',true);
  await t.page.locator('#retry').click(); await t.page.clock.runFor(32); await t.snap('retry',true);
});
await scenario('out-of-range', async t => {
  await t.steer(365);
  await t.runUntil(async()=>await t.game.getAttribute('data-escort-attack-phase')==='telegraph',140,50);
  await t.snap('telegraph',true);
  await t.steer(320); await t.snap('leave-range',true);
  await t.page.clock.runFor(5000); await t.snap('wait-outside',true);
  await t.steer(365); await t.snap('return',true);
});
await scenario('blade-rescue', async t => {
  await t.steer(460); await t.page.keyboard.down('KeyJ'); await t.snap('defend-start',true);
  const reached=await t.runUntil(async()=>await t.game.getAttribute('data-beat')==='L4.04' || await t.game.getAttribute('data-state')==='crashed',600,50);
  await t.page.keyboard.up('KeyJ'); await t.snap('closure-or-fail',true);
  if(!reached) throw new Error('No closure/failure in 30 simulated seconds');
  if(await t.game.getAttribute('data-beat')==='L4.04') {
    for(let i=0;i<4;i++){await t.page.locator('#advance').click();await t.page.clock.runFor(32);}
    await t.snap('complete',true);
    await t.page.reload(); await t.page.locator('#continue-save').click();
    await t.page.waitForFunction(() => document.querySelector('#game')?.dataset.state === 'complete' && document.querySelector('#game')?.dataset.chapter === 'L4', null, {timeout:30000});
    await t.snap('reload',true);
  }
});
writeFileSync(`${root}/behavior-results.json`, JSON.stringify(results,null,2));
await browser.close();
