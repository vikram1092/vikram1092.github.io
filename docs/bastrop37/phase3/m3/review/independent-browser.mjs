import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const root = 'docs/bastrop37/phase3/m3/review';
mkdirSync(root, { recursive: true });
const earned = JSON.parse(readFileSync('docs/bastrop37/phase3/m2/earned-completion-save.json', 'utf8'));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await page.clock.install();
const observations = [];
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const game = page.locator('#game');
async function record(label, screenshot = false) {
  const value = await page.evaluate(() => {
    const canvas = document.querySelector('#game');
    const meter = document.querySelector('#mission-meter');
    const hud = document.querySelector('#comms');
    const rect = element => { const r = element.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; };
    return { viewport: [innerWidth, innerHeight], scrollWidth: document.documentElement.scrollWidth,
      game: { ...canvas.dataset }, meter: { hidden: meter.hidden, text: meter.innerText, rect: rect(meter) },
      comms: { hidden: hud.hidden, rect: rect(hud) }, riderBottom: canvas.dataset.riderBottom,
      save: JSON.parse(localStorage.getItem('bastrop37-campaign-v1') || 'null') };
  });
  observations.push({ label, ...value });
  if (screenshot) await page.screenshot({ path: `${root}/${label}.png` });
}
async function advance(n) { for (let i = 0; i < n; i++) { await page.locator('#advance').click(); await page.clock.runFor(32); } }
async function steer(target) {
  for (let i = 0; i < 180; i++) {
    const x = Number(await game.getAttribute('data-x'));
    if (Math.abs(x - target) < 7) return;
    const key = x < target ? 'ArrowRight' : 'ArrowLeft';
    await page.keyboard.down(key); await page.clock.runFor(16); await page.keyboard.up(key);
  }
  throw new Error('Steer failed: ' + await game.getAttribute('data-x'));
}
try {
  await page.goto('http://127.0.0.1:4321/bastrop37/');
  await page.evaluate(value => localStorage.setItem('bastrop37-campaign-v1', JSON.stringify(value)), earned);
  await page.reload();
  await page.locator('#continue-save').click();
  await page.locator('#continue-chapter').click();
  await page.locator('#game[data-beat="L3.01"]').waitFor();
  await record('opening-1440', true);
  await advance(3);
  await record('checkpoint-a');
  const savedA = await page.evaluate(() => JSON.parse(localStorage.getItem('bastrop37-campaign-v1')));
  for (let i = 0; i < 80 && Number(await game.getAttribute('data-link-seconds')) < 0.6; i++) await page.clock.runFor(100);
  await record('link-a-1440', true);
  await steer(470);
  const partial = Number(await game.getAttribute('data-link-seconds'));
  await record('a-out-of-range-1440', true);
  for (let i = 0; i < 100 && Number(await game.getAttribute('data-relay-loops-a')) === 0; i++) await page.clock.runFor(100);
  await record('a-loop-1440', true);
  await steer(320);
  for (let i = 0; i < 130 && await game.getAttribute('data-relay-a') !== 'true'; i++) await page.clock.runFor(100);
  await record('checkpoint-b', true);
  await page.reload(); await page.locator('#continue-save').click();
  await record('checkpoint-b-reload');
  let prior = '';
  for (let i = 0; i < 300 && await game.getAttribute('data-beat') !== 'L3.04'; i++) {
    const phase = await game.getAttribute('data-drone-phase') || '';
    const cleared = await game.getAttribute('data-relay-drone-cleared');
    if (cleared !== 'true' && phase === 'signal' && prior !== 'signal') await steer(460);
    if (cleared === 'true' && Math.abs(Number(await game.getAttribute('data-x')) - 320) > 8) await steer(320);
    if (cleared === 'true' && Number(await game.getAttribute('data-link-seconds')) > 0.5 && !observations.some(o => o.label === 'link-b-1440')) await record('link-b-1440', true);
    prior = phase;
    await page.clock.runFor(100);
    if (await game.getAttribute('data-state') === 'crashed') throw new Error('Crashed during B evasion');
  }
  await record('closure-1440', true);
  await advance(4);
  await record('complete-1440', true);
  await page.reload(); await page.locator('#continue-save').click();
  await page.locator('#continue-chapter').click();
  await record('m3-boundary');
  observations.push({ label: 'partial-link-before-loop', seconds: partial });
  for (const [width, height] of [[1280, 720], [1024, 768], [390, 844]]) {
    const shot = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await shot.clock.install();
    await shot.goto('http://127.0.0.1:4321/bastrop37/');
    await shot.evaluate(value => localStorage.setItem('bastrop37-campaign-v1', JSON.stringify(value)), savedA);
    await shot.reload();
    await shot.locator('#continue-save').click();
    for (let i = 0; i < 80 && Number(await shot.locator('#game').getAttribute('data-link-seconds')) < 0.6; i++) await shot.clock.runFor(100);
    const snapshot = await shot.evaluate(() => ({ viewport: [innerWidth, innerHeight], scrollWidth: document.documentElement.scrollWidth,
      game: { ...document.querySelector('#game').dataset }, meter: { hidden: document.querySelector('#mission-meter').hidden,
        text: document.querySelector('#mission-meter').innerText }, save: JSON.parse(localStorage.getItem('bastrop37-campaign-v1')) }));
    observations.push({ label: `link-a-${width}`, ...snapshot });
    if (snapshot.game.state === 'playing' && snapshot.game.linkState === 'linking') await shot.screenshot({ path: `${root}/link-a-${width}.png` });
    else errors.push(`Action capture at ${width} not playing/linking: ${snapshot.game.state}/${snapshot.game.linkState}`);
    await shot.close();
  }
} catch (error) {
  errors.push(String(error?.stack || error));
  await record('failure-state', true).catch(() => {});
} finally {
  writeFileSync(`${root}/independent-browser-results.json`, JSON.stringify({ observations, errors }, null, 2));
  await browser.close();
}
