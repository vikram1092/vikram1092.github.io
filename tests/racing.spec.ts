import { test, expect, type Page } from '@playwright/test';

test.use({ launchOptions: { executablePath: process.env.CHROME_PATH || undefined, args: ['--no-sandbox', '--disable-gpu'] } });

async function start(page: Page) {
  await page.clock.install();
  await page.goto('/bastrop37/');
  await page.locator('#start').click();
  for (let i = 0; i < 5; i++) await page.keyboard.press('Enter');
  await page.clock.runFor(32);
  await expect(page.locator('#game')).toHaveAttribute('data-race-active', 'true');
}

// Drive using only real keyboard inputs and observable rider/traffic telemetry.
async function driver(page: Page) {
  await page.evaluate(() => {
    let held = '';
    setInterval(() => {
      const game = document.querySelector<HTMLCanvasElement>('#game')!;
      if (game.dataset.state !== 'playing' || game.dataset.raceActive !== 'true') {
        if (held) document.dispatchEvent(new KeyboardEvent('keyup', { code: held, bubbles: true }));
        held = ''; return;
      }
      const x = Number(game.dataset.x);
      const curve = Number(game.dataset.curvature);
      const cars = JSON.parse(game.dataset.traffic!) as { x: number; z: number }[];
      const rivals = JSON.parse(game.dataset.rivals || '[]') as { x: number; z: number; phase: string; timer: number; targetX: number }[];
      const obstacles = JSON.parse(game.dataset.roadObstacles || '[]') as { x: number; z: number }[];
      const pulse = (code: string) => { document.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true })); };
      if (Number(game.dataset.spikeCooldown) === 0 && rivals.some(rival => Math.abs(rival.z) < 50 && Math.abs(rival.x-x) < 105)) pulse('ControlLeft');
      if (game.dataset.jumpReady === 'true' && (obstacles.some(obstacle => obstacle.z > 100 && obstacle.z < 230 && Math.abs(obstacle.x-x) < 55) || rivals.some(rival => rival.phase === 'windup' && rival.timer > .4))) pulse('AltLeft');
      const danger = rivals.filter(rival => rival.phase === 'windup' || rival.phase === 'strike').map(rival => ({ x: rival.targetX, z: 80 }));
      const relevant = [...cars, ...obstacles, ...danger].filter(car => car.z > -55 && car.z < 650);
      const options = [166, 205, 243, 282, 320, 358, 397, 435, 474];
      const ranked = options.map(target => ({ target, cost: Math.abs(target-x) * .25 + Math.abs(target-320)*.04 +
        relevant.reduce((cost, car) => cost + (Math.abs(target-car.x) < 65 ? 1500/(Math.max(0,car.z)+100) * 200 : 0), 0) })).sort((a,b) => a.cost-b.cost);
      const target = ranked[0].target;
      const difference = target - x + curve * 4;
      const next = difference > 5 ? 'ArrowRight' : difference < -5 ? 'ArrowLeft' : '';
      if (next !== held) {
        if (held) document.dispatchEvent(new KeyboardEvent('keyup', { code: held, bubbles: true }));
        if (next) document.dispatchEvent(new KeyboardEvent('keydown', { code: next, bubbles: true }));
        held = next;
      }
    }, 40);
  });
}

test('real route lasts over a minute, bends flow, pause freezes it and encounters resume', async ({ page }) => {
  test.setTimeout(240000);
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await start(page); await driver(page);
  const game = page.locator('#game');
  await page.clock.runFor(12000);
  await expect(game).toHaveAttribute('data-state', 'playing');
  await expect(game).toHaveAttribute('data-race-active', 'true');
  await expect(game).toHaveAttribute('data-route', '0.0');
  await page.keyboard.press('KeyP');
  const position = await game.getAttribute('data-race-position');
  await page.clock.runFor(5000);
  expect(await game.getAttribute('data-race-position')).toBe(position);
  await page.locator('#resume').click();
  await page.clock.runFor(7000);
  await expect(game).toHaveAttribute('data-state', 'playing');
  expect(Number(await game.getAttribute('data-curvature'))).toBeGreaterThan(.2);
  expect(Number(await game.getAttribute('data-knockouts'))).toBeGreaterThan(0);
  await page.screenshot({ path: 'test-results/racing-desktop.png' });
  await page.keyboard.press('KeyP');
  await page.locator('#retry').click();
  await page.clock.runFor(32);
  expect(Number(await game.getAttribute('data-race-position'))).toBeGreaterThanOrEqual(4200);
  expect(Number(await game.getAttribute('data-race-position'))).toBeLessThan(4250);
  await expect(game).toHaveAttribute('data-traffic-count', '0');
  for (let i = 0; i < 120; i++) {
    await page.clock.runFor(1000);
    await expect(game).toHaveAttribute('data-state', 'playing');
    if (await game.getAttribute('data-race-active') === 'false') break;
  }
  await expect(game).toHaveAttribute('data-race-active', 'false');
  expect(Number(await game.getAttribute('data-race-position'))).toBeGreaterThanOrEqual(25000);
  await expect(game).toHaveAttribute('data-beat', 'L1.02');
  expect(errors).toEqual([]);
});

test('phone hold accelerates, dragging steers, swipes jump/deploy spikes and release slows', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await start(page);
  const game = page.locator('#game');
  await expect(page.locator('.touch-controls')).toBeHidden();
  await expect(page.locator('#gesture-hint')).toBeVisible();
  const touch = await page.context().newCDPSession(page);
  const point = async (type: 'touchStart' | 'touchMove', x: number, y: number) => touch.send('Input.dispatchTouchEvent', { type, touchPoints: [{ x, y, id: 1 }] });
  await point('touchStart', 195, 500); await page.clock.runFor(1000);
  expect(Number(await page.locator('#speed').textContent())).toBeGreaterThan(315);
  await point('touchMove', 245, 500); await page.clock.runFor(600);
  expect(Number(await game.getAttribute('data-x'))).toBeGreaterThan(365);
  await point('touchMove', 245, 430); await page.clock.runFor(500);
  expect(Number(await game.getAttribute('data-height'))).toBeGreaterThan(28);
  await point('touchMove', 245, 510); await page.clock.runFor(250);
  expect(Number(await game.getAttribute('data-blades'))).toBeGreaterThan(.65);
  await expect(game).toHaveAttribute('data-touch-held', 'true');
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.clock.runFor(1200);
  await expect(game).toHaveAttribute('data-touch-held', 'false');
  expect(Number(await page.locator('#speed').textContent())).toBeLessThan(220);
  await page.locator('#turbo-trigger').click(); await page.clock.runFor(100);
  expect(Number(await game.getAttribute('data-boost'))).toBeGreaterThan(0);
  await page.screenshot({ path: 'test-results/racing-portrait.png' });
  expect(errors).toEqual([]);
});

test('a rival rides alongside, signals its strike and takes a real spike counter', async ({ page }) => {
  await start(page);
  const game = page.locator('#game');
  let warned = false;
  for (let i = 0; i < 100; i++) {
    await page.clock.runFor(200);
    const rivals = JSON.parse(await game.getAttribute('data-rivals') || '[]') as { phase: string }[];
    if (rivals.some(rival => rival.phase === 'windup')) { warned = true; break; }
  }
  expect(warned).toBe(true);
  await expect(game).toHaveAttribute('data-state', 'playing');
  await page.screenshot({ path: 'test-results/racing-combat.png' });
  await page.keyboard.press('ControlLeft');
  await page.clock.runFor(350);
  const rivals = JSON.parse(await game.getAttribute('data-rivals') || '[]') as { health: number; phase: string }[];
  expect(rivals.some(rival => rival.health === 1 && rival.phase === 'stunned')).toBe(true);
});

test.describe('landscape phone', () => {
  test.use({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
  test('road gestures and essential controls fit the visible screen', async ({ page }) => {
    await start(page);
    const game = page.locator('#game');
    await expect(page.locator('#bastrop-game')).toHaveAttribute('data-controls', 'gestures');
    await expect(page.locator('.touch-controls')).toBeHidden();
    for (const selector of ['#game', '#gesture-hint', '#turbo-trigger', '#pause', '.combat-status', '.mission-meter']) {
      const box = await page.locator(selector).boundingBox();
      expect(box, selector).not.toBeNull();
      expect(box!.y, selector).toBeGreaterThanOrEqual(0);
      expect(box!.y + box!.height, selector).toBeLessThanOrEqual(390);
    }
    await page.touchscreen.tap(420, 220);
    await page.clock.runFor(32);
    await expect(game).toHaveAttribute('data-touch-held', 'false');
    await page.screenshot({ path: 'test-results/racing-landscape.png' });
  });
});

for (const [beat, checkpoint] of [['L2.03', 'CP-L2-ESCAPE'], ['L3.02', 'CP-L3-A'], ['L4.02', 'CP-L4-CONTROLLER'], ['L5.02', 'CP-L5-CONTROLLER']] as const) {
  test(`${beat}: restored campaign enters its road before the story encounter`, async ({ page }) => {
    const { readFileSync } = await import('node:fs');
    const { betrayalSave, publicAccessSave, lockdownSave, releaseSave } = await import('../src/scripts/bastrop37/save');
    const earned = JSON.parse(readFileSync('docs/bastrop37/phase3/m5/earned-completion-save.json', 'utf8')) as import('../src/scripts/bastrop37/save').ReleaseSave;
    const log = earned.log.filter(entry => entry.id.slice(0,5) < beat);
    const records = earned.records.filter(entry => entry.id.slice(0,5) < beat);
    const history = earned.history.filter(entry => entry.id.slice(0,5) < beat);
    const save = checkpoint === 'CP-L2-ESCAPE' ? betrayalSave(checkpoint, log, records, history)
      : checkpoint === 'CP-L3-A' ? publicAccessSave(checkpoint, log, records, history)
      : checkpoint === 'CP-L4-CONTROLLER' ? lockdownSave(checkpoint, log, records, history)
      : releaseSave(checkpoint, log, records, history);
    await page.clock.install();
    await page.addInitScript(value => localStorage.setItem('bastrop37-campaign-v1', JSON.stringify(value)), save);
    await page.goto('/bastrop37/'); await page.locator('#continue-save').click();
    await page.clock.runFor(32); await driver(page); await page.clock.runFor(6000);
    const game = page.locator('#game');
    await expect(game).toHaveAttribute('data-state', 'playing');
    await expect(game).toHaveAttribute('data-beat', beat);
    await expect(game).toHaveAttribute('data-race-active', 'true');
    await expect(game).toHaveAttribute('data-route', '0.0');
    await expect(game).toHaveAttribute('data-drone-count', '0');
    await expect(page.locator('#comms')).toBeHidden();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('bastrop37-campaign-v1')!))).toEqual(save);
  });
}
