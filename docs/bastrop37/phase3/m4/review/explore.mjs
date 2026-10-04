import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const root = 'docs/bastrop37/phase3/m4/review';
mkdirSync(root, { recursive: true });
const earned = JSON.parse(readFileSync('docs/bastrop37/phase3/m3/earned-completion-save.json', 'utf8'));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await page.clock.install();
const game = page.locator('#game');
const observations = [];
const errors = [];
page.on('pageerror', e => errors.push(e.message));
const snap = async label => {
  const state = await page.evaluate(() => ({
    game: { ...document.querySelector('#game').dataset },
    text: document.querySelector('#dialogue-text').textContent,
    speaker: document.querySelector('#speaker').textContent,
    record: document.querySelector('#comms').textContent,
    meter: document.querySelector('#mission-meter').textContent,
    status: document.querySelector('#route-cue')?.textContent,
    overlay: document.querySelector('#overlay').textContent,
    save: JSON.parse(localStorage.getItem('bastrop37-campaign-v1') || 'null'),
    scrollWidth: document.documentElement.scrollWidth,
  }));
  observations.push({ label, ...state });
  return state;
};
const shot = async label => page.screenshot({ path: `${root}/${label}.png` });
const advance = async () => { await page.locator('#advance').click(); await page.clock.runFor(32); };
const steer = async target => {
  for (let i = 0; i < 180; i++) {
    const x = Number(await game.getAttribute('data-x'));
    if (Math.abs(x - target) < 6) return;
    const key = x < target ? 'ArrowRight' : 'ArrowLeft';
    await page.keyboard.down(key); await page.clock.runFor(16); await page.keyboard.up(key);
  }
  throw new Error(`steer ${target} failed: ${await game.getAttribute('data-x')}`);
};
try {
  await page.goto('http://127.0.0.1:4321/bastrop37/');
  await page.evaluate(value => localStorage.setItem('bastrop37-campaign-v1', JSON.stringify(value)), earned);
  await page.reload();
  await page.locator('#continue-save').click();
  await snap('m3-complete');
  await page.locator('#continue-chapter').click();
  await page.locator('#game[data-beat="L4.01"]').waitFor();
  await snap('opening'); await shot('opening-1440');
  await page.clock.runFor(20000); await snap('slow-read');
  await advance(); await snap('record'); await shot('record-1440');
  await advance(); await snap('omega');
  await advance(); await snap('jo');
  await advance(); await snap('controller-start'); await shot('controller-start-1440');
  await steer(415); await snap('controller-lane');
  for (let i = 0; i < 120 && Number(await game.getAttribute('data-route')) < 430; i++) await page.clock.runFor(100);
  await snap('controller-approach'); await shot('controller-approach-1440');
  await page.keyboard.down('KeyJ');
  for (let i = 0; i < 120 && await game.getAttribute('data-controller-state') === 'active'; i++) await page.clock.runFor(50);
  await snap('controller-hit'); await shot('controller-hit-1440');
  await page.keyboard.up('KeyJ');
  for (let i = 0; i < 100 && await game.getAttribute('data-beat') !== 'L4.03'; i++) await page.clock.runFor(50);
  await snap('escort-start'); await shot('escort-start-1440');
  for (let i = 0; i < 140 && await game.getAttribute('data-escort-attack-phase') !== 'telegraph'; i++) await page.clock.runFor(50);
  await snap('telegraph'); await shot('telegraph-1440');
  await steer(455); await snap('draw-off'); await shot('draw-off-1440');
  for (let i = 0; i < 50; i++) await page.clock.runFor(50);
  await snap('after-draw-off'); await shot('after-draw-off-1440');
} catch (e) { errors.push(String(e?.stack || e)); await snap('error-state').catch(() => {}); await shot('error-state').catch(() => {}); }
finally { writeFileSync(`${root}/explore-results.json`, JSON.stringify({ observations, errors }, null, 2)); await browser.close(); }
