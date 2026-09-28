import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
const save = JSON.parse(readFileSync('docs/bastrop37/phase3/m2/review/earned-escape-save.json', 'utf8'));
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const report = [];
for (const tactic of ['steer', 'jump', 'blades']) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.clock.install();
  await page.goto('http://127.0.0.1:4321/bastrop37/');
  await page.evaluate(value => localStorage.setItem('bastrop37-campaign-v1', JSON.stringify(value)), save);
  await page.reload(); await page.locator('#continue-save').click(); await page.clock.runFor(32);
  const data = async name => page.locator('#game').getAttribute(`data-${name}`);
  const step = async ms => page.clock.runFor(ms);
  await page.keyboard.down('ArrowRight');
  for (let i = 0; i < 70 && Number(await data('x')) < 460; i++) await step(16);
  await page.keyboard.up('ArrowRight');
  let signalSeen = false, tacticUsed = false;
  const trace = [];
  for (let i = 0; i < 220; i++) {
    const snap = { t: i * .08, state: await data('state'), beat: await data('beat'), phase: await data('drone-phase'), outcome: await data('drone-outcome'), x: await data('x'), z: await data('drone-z'), route: await data('route'), charge: await data('charge'), lock: await data('lock-broken') };
    if (i % 10 === 0 || ['signal', 'lunge'].includes(snap.phase || '')) trace.push(snap);
    if (snap.phase === 'signal' && !signalSeen) {
      signalSeen = true; tacticUsed = true;
      if (tactic === 'steer') await page.keyboard.down('ArrowLeft');
      if (tactic === 'jump') await page.keyboard.press('KeyK');
      if (tactic === 'blades') await page.keyboard.down('KeyJ');
    }
    if (snap.state === 'crashed' || snap.beat === 'L2.04') break;
    await step(80);
  }
  await page.keyboard.up('ArrowLeft'); await page.keyboard.up('KeyJ');
  const result = { tactic, signalSeen, tacticUsed, state: await data('state'), beat: await data('beat'), outcome: await data('drone-outcome'), lockBroken: await data('lock-broken'), charge: await data('charge'), trace };
  report.push(result);
  await page.screenshot({ path: `docs/bastrop37/phase3/m2/review/${tactic}-outcome.png` });
  await context.close();
}
writeFileSync('docs/bastrop37/phase3/m2/review/escape-check.json', JSON.stringify(report, null, 2));
await browser.close();
console.log(report.map(({ tactic, signalSeen, state, beat, outcome, lockBroken }) => ({ tactic, signalSeen, state, beat, outcome, lockBroken })));
