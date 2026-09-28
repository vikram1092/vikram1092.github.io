import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';

const origin = 'http://127.0.0.1:4321/bastrop37/';
const out = 'docs/bastrop37/phase3/m2/review';
const legacy = JSON.parse(readFileSync('docs/bastrop37/phase3/earned-completion-save.json', 'utf8'));
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const findings = [];
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const read = async (page, name) => page.locator('#game').getAttribute(`data-${name}`);
async function advance(page, count) {
  for (let i = 0; i < count; i++) {
    await page.locator('#advance').click({ force: true });
    await page.clock.runFor(32);
  }
}
async function until(page, predicate, max = 80) {
  for (let i = 0; i < max; i++) {
    if (await predicate()) return;
    await page.clock.runFor(150);
  }
  throw new Error(`State did not arrive within clock limit: state=${await read(page, 'state')} beat=${await read(page, 'beat')} mode=${await read(page, 'mode')} route=${await read(page, 'route')} traffic=${await read(page, 'traffic-count')} carrier=${await read(page, 'carrier-z')}`);
}
async function steer(page, target, touch = false) {
  const cdp = touch ? await page.context().newCDPSession(page) : null;
  let held = '';
  for (let i = 0; i < 110; i++) {
    const x = Number(await read(page, 'x'));
    if (Math.abs(x - target) < 7) {
      if (held) await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      return;
    }
    const key = x < target ? 'ArrowRight' : 'ArrowLeft';
    if (touch) {
      if (held !== key) {
        if (held) await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        const box = await page.locator(`[data-key="${key}"]`).boundingBox();
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }] });
        held = key;
      }
    } else await page.keyboard.down(key);
    await page.clock.runFor(16);
    if (!touch) await page.keyboard.up(key);
  }
  if (held) await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  throw new Error(`Unable to steer to ${target}: x=${await read(page, 'x')} state=${await read(page, 'state')} beat=${await read(page, 'beat')}`);
}
async function run(width, height, touch) {
  const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install();
  await page.goto(origin);
  await page.evaluate(save => localStorage.setItem('bastrop37-campaign-v1', JSON.stringify(save)), legacy);
  await page.reload();
  await page.locator('#continue-save').click();
  await until(page, async () => await read(page, 'state') === 'complete');
  assert(await read(page, 'checkpoint') === 'CP-L1-COMPLETE', 'Published L1 save not restored');
  await page.locator('#continue-chapter').click();
  await until(page, async () => await read(page, 'beat') === 'L2.01');
  assert(await read(page, 'betrayal-known') === 'false', 'Betrayal revealed before scan');
  assert(await read(page, 'carrier-active') === 'false', 'Carrier hostile before scan');
  await page.screenshot({ path: `${out}/${touch ? 'mobile' : 'desktop'}-opening.png` });
  await page.clock.fastForward(60000);
  assert(await read(page, 'beat') === 'L2.01', 'Slow reading advanced beat');
  await advance(page, 3);
  await until(page, async () => !!await read(page, 'record-id'));
  assert(await read(page, 'traffic-count') === '0', 'Receipt shown before corridor cleared');
  assert(await read(page, 'record-id') === 'L2.02-RECORD-01', 'First record absent');
  assert(await read(page, 'betrayal-known') === 'false', 'Betrayal flag set before refusal');
  await page.screenshot({ path: `${out}/${touch ? 'mobile' : 'desktop'}-record.png` });
  const frozenRoute = await read(page, 'route');
  await page.clock.fastForward(60000);
  assert(await read(page, 'route') === frozenRoute, 'Route advanced during record reading');
  await advance(page, 2);
  assert(await read(page, 'dialogue-id') === 'L2.02-01', 'Confrontation did not follow two records');
  await page.locator('#pause').click({ force: true });
  await page.locator('#log-details summary').click();
  const log = await page.locator('#dialogue-log li').allTextContents();
  assert(log.length === 18 && log[16].includes('WIPE MODULE') && log[17].includes('POWER SHUTDOWN'), 'Chronological receipt log missing');
  await page.locator('#resume').click();
  await page.clock.runFor(32);
  await advance(page, 7);
  await page.clock.runFor(32);
  assert(await read(page, 'checkpoint') === 'CP-L2-ESCAPE', 'Refusal checkpoint absent');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('bastrop37-campaign-v1')));
  writeFileSync(`${out}/earned-escape-save.json`, JSON.stringify(saved, null, 2));
  assert(saved.flags.betrayalKnown && !saved.flags.omegaReleased && saved.records.length === 2, 'Saved flags/records invalid');
  for (let i = 0; i < 2; i++) {
    await page.locator('#pause').click({ force: true });
    await page.clock.runFor(32);
    await page.locator('#retry').click();
    await page.clock.runFor(32);
    assert(await read(page, 'beat') === 'L2.03' && !(await page.locator('#comms').isVisible()), 'Retry replayed revelation');
  }
  await page.reload();
  await page.locator('#continue-save').click();
  await until(page, async () => await read(page, 'beat') === 'L2.03' && await read(page, 'state') === 'playing');
  assert(await read(page, 'beat') === 'L2.03', `L2 save did not resume: beat=${await read(page, 'beat')} state=${await read(page, 'state')} message=${await page.locator('#message').textContent()} save=${await page.evaluate(() => localStorage.getItem('bastrop37-campaign-v1'))}`);
  await steer(page, 460, touch);
  await until(page, async () => await read(page, 'drone-phase') === 'signal', 100);
  let cdp;
  if (touch) {
    cdp = await page.context().newCDPSession(page);
    const box = await page.locator('[data-key="ArrowLeft"]').boundingBox();
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }] });
  } else await page.keyboard.down('ArrowLeft');
  await until(page, async () => await read(page, 'beat') === 'L2.04', 140);
  if (touch) await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  else await page.keyboard.up('ArrowLeft');
  assert(await read(page, 'traffic-count') === '0', 'Closure shown before drone drain');
  await page.screenshot({ path: `${out}/${touch ? 'mobile' : 'desktop'}-closure.png` });
  await advance(page, 4);
  await page.clock.runFor(32);
  assert(await read(page, 'state') === 'complete', 'L2 did not complete');
  await page.reload();
  await page.locator('#continue-save').click();
  await until(page, async () => await read(page, 'state') === 'complete');
  assert(await read(page, 'state') === 'complete', 'Saved L2 ending did not restore');
  await page.locator('#continue-chapter').click();
  assert(await read(page, 'beat') === 'L2.04', 'M3 chapter entered unexpectedly');
  const viewport = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: innerWidth }));
  assert(viewport.scroll === viewport.width, 'Horizontal page overflow');
  assert(errors.length === 0, `Page errors: ${errors.join('; ')}`);
  findings.push({ viewport: `${width}x${height}`, touch, records: log.slice(16, 18), savedCheckpoint: saved.checkpoint, complete: true, errors });
  await context.close();
}
try {
  if (process.argv[2] !== 'mobile') await run(1440, 900, false);
  await run(390, 844, true);
  writeFileSync(`${out}/independent-check.json`, JSON.stringify({ result: 'pass', findings }, null, 2));
} catch (error) {
  writeFileSync(`${out}/independent-check.json`, JSON.stringify({ result: 'fail', findings, error: String(error) }, null, 2));
  throw error;
} finally {
  await browser.close();
}
