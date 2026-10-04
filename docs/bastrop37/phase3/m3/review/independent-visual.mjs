import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';

const root = 'docs/bastrop37/phase3/m3/review';
const earned = JSON.parse(readFileSync('docs/bastrop37/phase3/m2/earned-completion-save.json', 'utf8'));
const browser = await chromium.launch({ headless: true });
const results = [];
for (const [width, height] of [[1440, 900], [1280, 720], [1024, 768], [390, 844]]) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, hasTouch: width === 390, isMobile: width === 390 });
  const page = await context.newPage();
  await page.clock.install();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto('http://127.0.0.1:4321/bastrop37/');
    await page.evaluate(value => localStorage.setItem('bastrop37-campaign-v1', JSON.stringify(value)), earned);
    await page.reload();
    await page.locator('#continue-save').click();
    await page.locator('#continue-chapter').click();
    for (let i = 0; i < 3; i++) { if (width === 390) await page.locator('#advance').tap(); else await page.locator('#advance').click(); await page.clock.runFor(32); }
    const game = page.locator('#game');
    for (let i = 0; i < 80 && Number(await game.getAttribute('data-link-seconds')) < 0.7; i++) await page.clock.runFor(100);
    const snap = await page.evaluate(() => {
      const g = document.querySelector('#game'), m = document.querySelector('#mission-meter');
      const r = m.getBoundingClientRect(), c = g.getBoundingClientRect();
      return { state: g.dataset.state, beat: g.dataset.beat, linkState: g.dataset.linkState,
        seconds: g.dataset.linkSeconds, target: g.dataset.relayTarget, x: g.dataset.x,
        riderBottom: g.dataset.riderBottom, scrollWidth: document.documentElement.scrollWidth,
        meter: { hidden: m.hidden, text: m.innerText, rect: { x:r.x,y:r.y,width:r.width,height:r.height } },
        canvas: { x:c.x,y:c.y,width:c.width,height:c.height },
        dpad: document.querySelector('.dpad').getBoundingClientRect().toJSON() };
    });
    if (snap.state === 'playing' && snap.linkState === 'linking') await page.screenshot({ path: `${root}/action-${width}.png` });
    if (width === 1440 || width === 390) {
      for (let i = 0; i < 100 && await game.getAttribute('data-relay-a') !== 'true'; i++) await page.clock.runFor(100);
      await page.clock.runFor(900);
      snap.linkedA = { state: await game.getAttribute('data-state'), beat: await game.getAttribute('data-beat'),
        relayA: await game.getAttribute('data-relay-a'), dronePhase: await game.getAttribute('data-drone-phase') };
      if (snap.linkedA.state === 'playing' && snap.linkedA.relayA === 'true') await page.screenshot({ path: `${root}/linked-a-${width}.png` });
    }
    if (width === 390) {
      const before = Number(await game.getAttribute('data-x'));
      const button = await page.locator('[data-key="ArrowRight"]').boundingBox();
      const session = await context.newCDPSession(page);
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: button.x + button.width/2, y: button.y + button.height/2, id: 1 }] });
      await page.clock.runFor(320);
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.clock.runFor(32);
      snap.touchSteer = { before, after: Number(await game.getAttribute('data-x')), state: await game.getAttribute('data-state') };
    }
    results.push({ width, height, ...snap, errors });
  } catch (error) { results.push({ width, height, error: String(error?.stack || error), errors }); }
  await context.close();
}
writeFileSync(`${root}/independent-visual-results.json`, JSON.stringify(results, null, 2));
await browser.close();
