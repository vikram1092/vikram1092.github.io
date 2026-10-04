import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
const revision = process.argv[2];
if (!revision) throw new Error('Pass the published commit SHA.');
const url = `https://vikramramkumar.me/bastrop37/?v=${revision}`;
const out = 'docs/bastrop37/phase3/m5/public'; mkdirSync(out, { recursive: true });
const response = await fetch(url); const html = await response.text();
if (!response.ok) throw new Error(`Public page returned ${response.status}`);
const scriptPaths = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(match => match[1]);
const scripts = [];
for (const path of scriptPaths) {
  const remote = await fetch(new URL(path, url)); const bytes = Buffer.from(await remote.arrayBuffer());
  const pathname = new URL(path, url).pathname;
  const local = readFileSync(`dist${pathname}`);
  const digest = value => createHash('sha256').update(value).digest('hex');
  const record = { path: pathname, status: remote.status, bytes: bytes.length, remoteSha256: digest(bytes), localSha256: digest(local), matchesLocal: bytes.equals(local) };
  scripts.push(record); if (!remote.ok || !record.matchesLocal) throw new Error(JSON.stringify(record));
}
if (!scripts.length) throw new Error('No published script found.');
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } }); const errors = [], failedRequests = [];
  page.on('pageerror', error => errors.push(error.message)); page.on('requestfailed', request => failedRequests.push({ url: request.url(), error: request.failure() }));
  await page.goto(url); await page.locator('#start').click();
  await page.locator('#game[data-state="playing"][data-beat="L1.01"]').waitFor();
  const opening = await page.locator('#dialogue-text').textContent();
  if (opening !== 'You have the module?') throw new Error(`Unexpected public opening: ${opening}`);
  await page.screenshot({ path: `${out}/fresh-opening.png` });
  const save = JSON.parse(readFileSync('docs/bastrop37/phase3/m5/fresh-campaign-completion-save.json', 'utf8'));
  await page.evaluate(value => localStorage.setItem('bastrop37-campaign-v1', JSON.stringify(value)), save);
  await page.reload(); await page.locator('#continue-save').click();
  await page.locator('#game[data-campaign-complete="true"]').waitFor();
  const completed = await page.evaluate(() => ({ ...document.querySelector('#game').dataset }));
  await page.screenshot({ path: `${out}/earned-completion-reload.png` });
  await page.locator('#menu').click(); await page.locator('#game[data-state="ready"]').waitFor(); await page.locator('[data-replay-chapter="L5"]').click();
  await page.locator('#game[data-state="playing"][data-beat="L5.01"]').waitFor();
  const replay = await page.evaluate(() => ({ ...document.querySelector('#game').dataset }));
  const durableUnchanged = await page.evaluate(value => localStorage.getItem('bastrop37-campaign-v1') === JSON.stringify(value), save);
  await page.screenshot({ path: `${out}/release-replay-opening.png` });
  if (errors.length || failedRequests.length || !durableUnchanged || replay.omegaReleased !== 'false') throw new Error(JSON.stringify({ errors, failedRequests, durableUnchanged, replay }));
  const report = { date: new Date().toISOString(), revision, url, httpStatus: response.status, scripts, opening, completed, replay, durableUnchanged, errors, failedRequests, limits: 'Public smoke in a new isolated browser context: fresh L1 opening, separately earned complete-save reload and L5 replay asset loading. Full earned campaign and 81-case behavioral verification ran locally on the byte-identical script build; this smoke is not a second complete public playthrough.' };
  writeFileSync(`${out}/verification.json`, JSON.stringify(report, null, 2)); console.log(JSON.stringify({ revision, url, scripts, opening, durableUnchanged, errors, failedRequests }));
} finally { await browser.close(); }
