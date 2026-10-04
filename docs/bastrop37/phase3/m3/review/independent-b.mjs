import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';

const root = 'docs/bastrop37/phase3/m3/review';
const prior = JSON.parse(readFileSync(`${root}/independent-browser-results.json`, 'utf8'));
const earnedB = prior.observations.find(item => item.label === 'checkpoint-b')?.save;
if (earnedB?.checkpoint !== 'CP-L3-B') throw new Error('No browser-earned CP-L3-B in prior review result');
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.clock.install();
const game = page.locator('#game');
const result = { steps: [], errors: [] };
const sample = async label => result.steps.push({ label, ...(await page.evaluate(() => {
  const c = document.querySelector('#game'), s = JSON.parse(localStorage.getItem('bastrop37-campaign-v1') || 'null');
  return { game: { ...c.dataset }, save: s, headline: document.querySelector('#headline')?.innerText,
    objective: document.querySelector('#objective')?.innerText, routeCue: document.querySelector('#route-cue')?.innerText };
})) });
async function steer(target) {
  for (let i = 0; i < 180; i++) {
    const x = Number(await game.getAttribute('data-x'));
    if (Math.abs(x - target) < 7) return;
    const key = x < target ? 'ArrowRight' : 'ArrowLeft';
    await page.keyboard.down(key); await page.clock.runFor(16); await page.keyboard.up(key);
  }
  throw new Error('Steer target unavailable, x=' + await game.getAttribute('data-x'));
}
try {
  await page.goto('http://127.0.0.1:4321/bastrop37/');
  await page.evaluate(value => localStorage.setItem('bastrop37-campaign-v1', JSON.stringify(value)), earnedB);
  await page.reload(); await page.locator('#continue-save').click();
  await page.locator('#game[data-state="playing"][data-beat="L3.03"]').waitFor();
  await sample('earned-b-reload');
  await steer(490);
  for (let i = 0; i < 160 && await game.getAttribute('data-state') === 'playing'; i++) await page.clock.runFor(100);
  await sample('actual-crash');
  if (await game.getAttribute('data-state') === 'crashed') {
    await page.screenshot({ path: `${root}/actual-b-crash.png` });
    await page.locator('#retry').click();
    await page.locator('#game[data-state="playing"][data-beat="L3.03"]').waitFor();
    await sample('b-retry');
  }
  await steer(490);
  await page.keyboard.down('KeyJ');
  let capturedB = false;
  for (let i = 0; i < 450 && await game.getAttribute('data-beat') !== 'L3.04'; i++) {
    const cleared = await game.getAttribute('data-relay-drone-cleared');
    const phase = await game.getAttribute('data-drone-phase');
    if (cleared === 'true' && Math.abs(Number(await game.getAttribute('data-x')) - 320) > 8) {
      await page.keyboard.up('KeyJ'); await steer(320);
    } else if (cleared !== 'true' && phase === 'flank') {
      const actors = JSON.parse(await game.getAttribute('data-traffic') || '[]');
      const drone = actors.find(actor => actor.kind === 'drone');
      if (drone) await steer(Math.max(150, Math.min(490, drone.x)));
    }
    await page.clock.runFor(100);
    if (!capturedB && await game.getAttribute('data-link-state') === 'linking' && Number(await game.getAttribute('data-link-seconds')) > 0.5) {
      capturedB = true; await sample('link-b'); await page.screenshot({ path: `${root}/actual-link-b.png` });
    }
    if (await game.getAttribute('data-state') === 'crashed') throw new Error('Crashed during blade retry');
  }
  await page.keyboard.up('KeyJ');
  await sample('closure');
  await page.screenshot({ path: `${root}/actual-closure.png` });
  for (let i = 0; i < 4; i++) { await page.locator('#advance').click(); await page.clock.runFor(32); }
  await sample('complete');
  await page.screenshot({ path: `${root}/actual-complete.png` });
  await page.reload(); await page.locator('#continue-save').click();
  await page.locator('#game[data-state="complete"]').waitFor();
  await sample('complete-reload');
  await page.locator('#continue-chapter').click();
  await sample('m3-boundary');
} catch (error) {
  result.errors.push(String(error?.stack || error));
  await sample('failure').catch(() => {});
} finally {
  writeFileSync(`${root}/independent-b-results.json`, JSON.stringify(result, null, 2));
  await browser.close();
}
