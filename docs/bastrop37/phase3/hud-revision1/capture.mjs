import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const base = 'docs/bastrop37/phase3/hud-revision1';
const save = JSON.parse(await readFile('docs/bastrop37/phase3/earned-completion-save.json', 'utf8'));
const browser = await chromium.launch({ headless: true });
const result = [];
await mkdir(base, { recursive: true });

for (const [width, height] of [[1440, 900], [1280, 720], [1024, 768], [390, 844]]) {
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: width === 390 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install();
  await page.goto('http://127.0.0.1:4321/bastrop37/');
  await page.locator('#start').waitFor({ state: 'visible' });
  await page.waitForFunction(() => !document.querySelector('#start').disabled);
  await page.locator('#start').click();
  await page.clock.runFor(32);
  await page.locator('#comms').waitFor({ state: 'visible' });
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.clock.runFor(32);
  await page.waitForFunction(() => document.querySelector('#dialogue-text').textContent?.startsWith('Municipal intake.'));
  const long = await page.evaluate(() => {
    const box = selector => {
      const rect = document.querySelector(selector).getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right };
    };
    return {
      line: document.querySelector('#dialogue-text').textContent,
      fontSize: getComputedStyle(document.querySelector('#dialogue-text')).fontSize,
      comms: box('#comms'),
      touch: box('.touch-controls'),
      touchDisplay: getComputedStyle(document.querySelector('.touch-controls')).display,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    };
  });
  await page.screenshot({ path: `${base}/${width}x${height}-long-line.png` });
  if (width === 390) {
    for (let index = 0; index < 3; index++) await page.keyboard.press('Enter');
    await page.clock.runFor(32);
    for (let index = 0; index < 60; index++) {
      if (await page.locator('#dialogue-text').textContent() === 'The crossing signal reports a blockage. The right service lane is clear.' && await page.locator('#comms').isVisible()) break;
      const route = Number(await page.locator('#game').getAttribute('data-route'));
      if (route > 900 && route < 1500) {
        for (let steer = 0; steer < 80; steer++) {
          const x = Number(await page.locator('#game').getAttribute('data-x'));
          if (Math.abs(x - 455) < 7) break;
          const key = x < 455 ? 'ArrowRight' : 'ArrowLeft';
          await page.keyboard.down(key);
          await page.clock.runFor(16);
          await page.keyboard.up(key);
        }
      }
      await page.clock.runFor(500);
    }
    if (!(await page.locator('#comms').isVisible())) throw new Error('Actual ride did not reach Omega');
    await page.screenshot({ path: `${base}/390x844-omega-long-line.png` });
    await page.keyboard.press('Enter'); await page.clock.runFor(32);
    await page.screenshot({ path: `${base}/390x844-jo.png` });
    for (let index = 0; index < 3; index++) await page.keyboard.press('Enter');
    await page.clock.runFor(32);
    if(await page.locator('#game').getAttribute('data-dialogue-id') !== 'L1.03-05') throw new Error('Expected long service line');
    const comms = await page.locator('#comms').boundingBox();
    const riderBottom = Number(await page.locator('#game').getAttribute('data-rider-bottom'));
    long.serviceLine = await page.locator('#dialogue-text').textContent();
    long.serviceCardTop = comms.y;
    long.riderBottom = riderBottom;
    long.riderClearance = comms.y - riderBottom;
    if(long.riderClearance < 20) throw new Error('Long service card obscures rider');
    await page.screenshot({ path: `${base}/390x844-vlad-service-long.png` });
  }
  await page.evaluate(data => localStorage.setItem('bastrop37-campaign-v1', JSON.stringify(data)), save);
  await page.reload();
  await page.locator('#continue-save').waitFor({ state: 'visible' });
  await page.locator('#continue-save').click();
  await page.clock.runFor(32);
  await page.waitForFunction(() => document.querySelector('#game').dataset.state === 'complete');
  const complete = await page.evaluate(() => ({
    state: document.querySelector('#game').dataset.state,
    headline: document.querySelector('#headline').textContent,
    message: document.querySelector('#message').textContent,
    saveNote: document.querySelector('#save-note').textContent,
    continueLabel: document.querySelector('#continue-chapter').textContent,
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
  }));
  await page.screenshot({ path: `${base}/${width}x${height}-earned-complete.png` });
  result.push({ width, height, long, complete, errors });
  await page.close();
}
await writeFile(`${base}/geometry.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result));
await browser.close();
