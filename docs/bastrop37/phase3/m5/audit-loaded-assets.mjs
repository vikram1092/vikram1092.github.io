import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
const save = JSON.parse(readFileSync('docs/bastrop37/phase3/m5/fresh-campaign-completion-save.json', 'utf8'));
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [], responses = [], pending = [], states = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (!response.url().startsWith('http://127.0.0.1:4321/')) return;
    pending.push((async () => {
      try { responses.push({ path: new URL(response.url()).pathname, status: response.status(), decodedBodyBytes: (await response.body()).length }); }
      catch (error) { errors.push(`Resource read: ${response.url()}: ${error.message}`); }
    })());
  });
  await page.addInitScript(value => localStorage.setItem('bastrop37-campaign-v1', JSON.stringify(value)), save);
  await page.goto('http://127.0.0.1:4321/bastrop37/');
  for (const chapter of ['L1', 'L2', 'L3', 'L4', 'L5']) {
    await page.locator(`[data-replay-chapter="${chapter}"]`).click();
    await page.waitForFunction(ch => document.querySelector('#game').dataset.state === 'playing' && document.querySelector('#game').dataset.beat === `${ch}.01`, chapter);
    states.push(await page.evaluate(() => ({ chapter: document.querySelector('#game').dataset.chapter, beat: document.querySelector('#game').dataset.beat, resources: performance.getEntriesByType('resource').length })));
    await page.locator('#pause').click(); await page.locator('#menu').click();
    await page.locator('#game[data-state="ready"]').waitFor();
  }
  await Promise.all(pending);
  const resources = await page.evaluate(() => performance.getEntriesByType('resource').map(r => ({ path: new URL(r.name).pathname, encodedBytes: r.encodedBodySize, decodedBytes: r.decodedBodySize, transferBytes: r.transferSize })));
  const unique = [...new Map(responses.map(r => [r.path, r])).values()];
  const report = { date: new Date().toISOString(), browser: browser.version(), method: 'Real-clock browser with a fresh context; seed the separately earned full campaign completion, then load each unlocked chapter opening using ordinary replay controls. This measures complete chapter asset loads, not a second earned campaign or frame performance.', states, resources, responses, uniqueResponseCount: unique.length, uniqueDecodedBodyBytes: unique.reduce((n, r) => n + r.decodedBodyBytes, 0), resourceEncodedBytes: resources.reduce((n, r) => n + r.encodedBytes, 0), resourceTransferBytes: resources.reduce((n, r) => n + r.transferBytes, 0), durableCampaignUnchanged: await page.evaluate(value => localStorage.getItem('bastrop37-campaign-v1') === JSON.stringify(value), save), errors, limits: 'Local preview transfer sizes; production HTTP compression/cache may differ. Decoded body bytes are file payloads, not decoded image RAM or GPU/browser memory. The simulated-clock fresh journey resource-timing list was empty and is not treated as a size measurement.' };
  if (!resources.length || errors.length || !report.durableCampaignUnchanged) throw new Error(JSON.stringify(report));
  writeFileSync('docs/bastrop37/phase3/m5/loaded-assets.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ uniqueResponseCount: report.uniqueResponseCount, uniqueDecodedBodyBytes: report.uniqueDecodedBodyBytes, resourceEncodedBytes: report.resourceEncodedBytes, resourceTransferBytes: report.resourceTransferBytes, errors }));
} finally { await browser.close(); }
