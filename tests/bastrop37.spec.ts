import { test, expect, type Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { reveal, ack, escape } from './helpers/betrayal';

const capture = 'docs/bastrop37/phase3/captures';
test.beforeEach(async ({ page }) => { await page.clock.install(); });
async function start(page: Page) {
  await page.goto('/bastrop37/');
  await page.locator('#start').click();
  await expect(page.locator('#game')).toHaveAttribute('data-state', 'playing');
  await expect(page.locator('#dialogue-text')).toHaveText('You have the module?');
}
async function acknowledge(page: Page, count: number) {
  for (let i = 0; i < count; i++) await page.keyboard.press('Enter');
}
async function toAction(page: Page) { await start(page); await acknowledge(page, 5); }
async function rideToOmega(page: Page) {
  for (let i = 0; i < 60; i++) {
    if (await page.locator('#dialogue-text').textContent() === 'The crossing signal reports a blockage. The right service lane is clear.' && await page.locator('#comms').isVisible()) return;
    const route = Number(await page.locator('#game').getAttribute('data-route'));
    if (route > 900 && route < 1500) await steerTo(page, 455);
    await page.clock.runFor(500);
    expect(await page.locator('#game').getAttribute('data-state')).toBe('playing');
  }
  throw new Error('Delivery traffic did not clear into Omega dialogue');
}
async function steerTo(page: Page, target: number) {
  for (let i = 0; i < 80; i++) {
    const x = Number(await page.locator('#game').getAttribute('data-x'));
    if (Math.abs(x - target) < 7) return;
    const key = x < target ? 'ArrowRight' : 'ArrowLeft';
    await page.keyboard.down(key); await page.clock.runFor(16); await page.keyboard.up(key);
  }
}
async function finishService(page: Page) {
  await steerTo(page, 397);
  for (let i = 0; i < 50; i++) {
    if (await page.locator('#comms').isVisible()) return;
    await page.clock.runFor(300);
    expect(await page.locator('#game').getAttribute('data-state')).toBe('playing');
  }
  throw new Error('Service corridor failed to reach closure');
}

test('fresh story waits for a slow reader, repeated Enter is ignored and pause holds every clock', async ({ page }) => {
  await start(page);
  const game = page.locator('#game');
  const route = await game.getAttribute('data-route');
  await page.clock.fastForward(60000); await page.clock.runFor(1000);
  await expect(page.locator('#dialogue-text')).toHaveText('You have the module?');
  expect(await game.getAttribute('data-route')).toBe(route);
  await expect(game).toHaveAttribute('data-traffic-count', '0');
  await page.keyboard.down('Enter');
  await page.keyboard.down('Enter');
  await page.keyboard.down('Enter');
  await expect(page.locator('#dialogue-text')).toHaveText("It's on the bike. Where am I going?");
  await page.keyboard.up('Enter');
  await page.keyboard.press('KeyP');
  await expect(game).toHaveAttribute('data-state', 'paused');
  const frozen = await game.getAttribute('data-distance');
  await page.keyboard.press('Enter'); await page.clock.runFor(5000);
  expect(await game.getAttribute('data-distance')).toBe(frozen);
  await page.locator('#resume').click();
  await expect(page.locator('#dialogue-text')).toHaveText("It's on the bike. Where am I going?");
  await page.screenshot({ path: `${capture}/desktop-story.png` });
  await expect(page.locator('body')).not.toContainText(/VOSS|SEA WALL|90 SECONDS/);
});

test('riding, slide energy, deliberate turbo, pause and checkpoint retry preserve mechanics', async ({ page }) => {
  await toAction(page);
  const game = page.locator('#game');
  const before = Number(await game.getAttribute('data-x'));
  await page.keyboard.down('ArrowRight'); await page.clock.runFor(100); await page.keyboard.up('ArrowRight');
  expect(Number(await game.getAttribute('data-x'))).toBeGreaterThan(before + 9);
  await page.keyboard.down('Shift'); await page.clock.runFor(100);
  expect(Number(await game.getAttribute('data-boost'))).toBeGreaterThan(.2);
  await page.clock.runFor(1400);
  await expect(game).toHaveAttribute('data-boost', '0.00');
  await page.keyboard.up('Shift');
  const energy = Number(await game.getAttribute('data-charge'));
  await page.keyboard.down('Space'); await page.clock.runFor(300); await page.keyboard.up('Space');
  expect(Number(await game.getAttribute('data-charge'))).toBeGreaterThan(energy);
  await page.keyboard.press('KeyP');
  const route = await game.getAttribute('data-route');
  await page.clock.runFor(1000); expect(await game.getAttribute('data-route')).toBe(route);
  await page.locator('#retry').click();
  await expect(game).toHaveAttribute('data-state', 'playing');
  await expect(game).toHaveAttribute('data-charge', '1.00');
  await expect(page.locator('#comms')).toBeHidden();
});

test('fresh full Delivery traverses traffic, saves and continues to Intake', async ({ page }) => {
  test.setTimeout(300000);
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => {
    const audit = { drainWithActors: false, removals: [] as number[] };
    (window as unknown as { drainAudit: typeof audit }).drainAudit = audit;
    new MutationObserver(records => {
      const game = document.querySelector<HTMLCanvasElement>('#game');
      if (!game) return;
      const current = JSON.parse(game.dataset.traffic || '[]');
      if (game.dataset.mode === 'drain' && current.length) audit.drainWithActors = true;
      for (const record of records) {
        if (record.target !== game || record.attributeName !== 'data-traffic') continue;
        const previous = JSON.parse(record.oldValue || '[]');
        for (const car of previous) if (!current.some((next: {id:number}) => next.id === car.id)) audit.removals.push(car.z);
      }
    }).observe(document, { subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ['data-traffic', 'data-mode'] });
  });
  await toAction(page);
  await page.clock.runFor(1700);
  await expect(page.locator('#feedback')).toContainText('STEER THROUGH THE GAP');
  await page.clock.runFor(1000);
  await expect(page.locator('#feedback')).toContainText('SHIFT');
  await page.screenshot({ path: `${capture}/desktop-action.png` });
  await rideToOmega(page);
  await expect(page.locator('#game')).toHaveAttribute('data-traffic-count', '0');
  const drainAudit = await page.evaluate(() => (window as unknown as {drainAudit:{drainWithActors:boolean;removals:number[]}}).drainAudit);
  expect(drainAudit.drainWithActors).toBe(true);
  expect(drainAudit.removals).toHaveLength(5);
  expect(drainAudit.removals.every(z => z < -50)).toBe(true);
  await expect(page.locator('#comms')).toBeVisible();
  const route = await page.locator('#game').getAttribute('data-route');
  await page.clock.fastForward(60000); await page.clock.runFor(1000);
  expect(await page.locator('#game').getAttribute('data-route')).toBe(route);
  await page.screenshot({ path: `${capture}/desktop-omega.png` });
  await acknowledge(page, 5);
  await expect(page.locator('#objective')).toHaveText('TAKE THE SERVICE LANE');
  await finishService(page);
  await expect(page.locator('#dialogue-text')).toHaveText("You're nearly here. Take the inspection lane. I'll have you cleared through.");
  await acknowledge(page, 3);
  await expect(page.locator('#game')).toHaveAttribute('data-state', 'complete');
  await expect(page.locator('#headline')).toHaveText('DELIVERY APPROACH REACHED');
  await expect(page.locator('#save-note')).toContainText(/SAVED/i);
  await page.screenshot({ path: `${capture}/desktop-complete.png` });
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('bastrop37-campaign-v1')!));
  expect(saved.checkpoint).toBe('CP-L1-COMPLETE');
  writeFileSync('docs/bastrop37/phase3/earned-completion-save.json', JSON.stringify(saved, null, 2));
  expect(saved.completedLevels).toEqual(['L1']); expect(saved.flags.omegaReleased).toBe(false); expect(saved.log).toHaveLength(13);
  await page.reload(); await page.locator('#continue-save').click();
  await expect(page.locator('#game')).toHaveAttribute('data-state', 'complete');
  await page.locator('#continue-chapter').click();
  await expect(page.locator('#game')).toHaveAttribute('data-beat', 'L2.01');
  await expect(page.locator('#dialogue-text')).toHaveText("Stay beside the recovery vehicle. It'll take the module from there.");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('bastrop37-campaign-v1')!).completedLevels)).toEqual(['L1']);
  await reveal(page);
  await expect(page.locator('#dialogue-text')).toContainText('WIPE MODULE');
  await ack(page,9);
  await expect(page.locator('#game')).toHaveAttribute('data-betrayal-known','true');
  await escape(page);
  await ack(page,4);
  await expect(page.locator('#headline')).toHaveText('RECOVERY LOCK BROKEN');
  const finalSave = await page.evaluate(() => JSON.parse(localStorage.getItem('bastrop37-campaign-v1')!));
  expect(finalSave.checkpoint).toBe('CP-L2-COMPLETE');
  expect(finalSave.completedLevels).toEqual(['L1','L2']);
  expect(finalSave.flags.omegaReleased).toBe(false);
  writeFileSync('docs/bastrop37/phase3/m2/earned-completion-save.json',JSON.stringify(finalSave,null,2));
  expect(errors).toEqual([]);
});

test('service miss repeats safely; checkpoint reload retains Omega introduction without duplication', async ({ page }) => {
  await toAction(page); await rideToOmega(page); await acknowledge(page, 5);
  await page.reload(); await page.locator('#continue-save').click();
  await expect(page.locator('#comms')).toBeHidden();
  await page.clock.runFor(4500);
  await expect(page.locator('#route-cue')).toContainText('LOOP');
  await page.clock.runFor(3500);
  await finishService(page); await acknowledge(page, 3);
  const log = await page.evaluate(() => JSON.parse(localStorage.getItem('bastrop37-campaign-v1')!).log);
  expect(log).toHaveLength(13); expect(new Set(log.map((line: {id:string}) => line.id)).size).toBe(13);
});

test('actual traffic contact offers checkpoint retry without replaying acknowledged opening', async ({ page }) => {
  await toAction(page);
  await steerTo(page, 243);
  for (let i = 0; i < 60 && await page.locator('#game').getAttribute('data-state') === 'playing'; i++) await page.clock.runFor(200);
  await expect(page.locator('#game')).toHaveAttribute('data-state', 'crashed');
  await page.screenshot({ path: `${capture}/desktop-failure.png` });
  await page.locator('#retry').click();
  await expect(page.locator('#game')).toHaveAttribute('data-state', 'playing');
  await expect(page.locator('#comms')).toBeHidden();
});

test('storage failure is truthful and corrupt save remains recoverable', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('Quota', 'QuotaExceededError'); }; });
  await toAction(page); await page.keyboard.press('KeyP');
  await expect(page.locator('#save-note')).toContainText(/Session only/i);
  await page.locator('#menu').click();
  await expect(page.locator('#continue-save')).toBeVisible();
});

test('invalid save is preserved until an explicit new-run confirmation', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('bastrop37-campaign-v1', '{invalid'));
  await page.goto('/bastrop37/');
  await expect(page.locator('#save-note')).toContainText(/save|progress/i);
  expect(await page.evaluate(() => localStorage.getItem('bastrop37-campaign-v1'))).toBe('{invalid');
});

test('audio mute persists and gallery/home navigation still work', async ({ page }) => {
  await start(page);
  await page.getByRole('button', { name: 'Mute audio' }).click();
  await expect(page.locator('#game')).toHaveAttribute('data-muted', 'true');
  await page.reload(); await expect(page.getByRole('button', { name: 'Unmute audio' })).toHaveAttribute('aria-pressed', 'true');
  await page.goto('/bastrop37/assets/');
  expect(await page.locator('.asset img').evaluateAll(imgs => imgs.every(img => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/');
  await page.getByRole('link', { name: 'AFTERHOURS' }).click();
  await expect(page.locator('#start')).toBeEnabled();
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  test('readable touch dialogue and simultaneous steering/slide remain separated', async ({ page, context }) => {
    await start(page);
    await page.screenshot({ path: `${capture}/mobile-story.png` });
    expect(await page.locator('#dialogue-text').evaluate(e => parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(16);
    for (let i = 0; i < 5; i++) await page.locator('#advance').tap();
    await page.clock.runFor(32);
    await expect(page.locator('#comms')).toBeHidden();
    await expect(page.locator('[data-key=Space]')).toBeVisible();
    const touch = await context.newCDPSession(page);
    const steer = await page.locator('[data-key=ArrowRight]').boundingBox();
    const slide = await page.locator('[data-key=Space]').boundingBox();
    const before = Number(await page.locator('#game').getAttribute('data-x'));
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: steer!.x + 20, y: steer!.y + 15, id: 1 }, { x: slide!.x + 20, y: slide!.y + 15, id: 2 }] });
    await page.clock.runFor(200);
    expect(Number(await page.locator('#game').getAttribute('data-x'))).toBeGreaterThan(before + 20);
    await expect(page.locator('#game')).toHaveAttribute('data-sliding', 'true');
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.clock.runFor(100);
    await expect(page.locator('#game')).toHaveAttribute('data-sliding', 'false');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    await page.screenshot({ path: `${capture}/mobile-action.png` });
  });
});

test('local mechanics regression keeps jump fresh-press, blade retraction and genuine drone combat', async ({ page }) => {
  await page.goto('/bastrop37/?fixture=mechanics');
  await page.locator('#start').click();
  const game = page.locator('#game');
  await page.keyboard.down('Alt'); await page.clock.runFor(500);
  expect(Number(await game.getAttribute('data-height'))).toBeGreaterThan(10);
  await page.clock.runFor(650); await expect(game).toHaveAttribute('data-height', '0.00');
  await page.keyboard.up('Alt');
  expect(Number(await game.getAttribute('data-lane-changes'))).toBeGreaterThan(0);
  await page.keyboard.down('Control'); await page.clock.runFor(200);
  expect(Number(await game.getAttribute('data-blades'))).toBeGreaterThan(.9);
  await page.keyboard.up('Control'); await page.clock.runFor(200);
  expect(Number(await game.getAttribute('data-blades'))).toBeLessThan(.05);
  await page.keyboard.down('Control');
  for (let i = 0; i < 50 && Number(await game.getAttribute('data-slices')) === 0; i++) await page.clock.runFor(200);
  expect(Number(await game.getAttribute('data-slices'))).toBeGreaterThan(0);
  expect(await page.evaluate(() => localStorage.getItem('bastrop37-campaign-v1'))).toBeNull();
});

test('failed required asset load offers retry without losing saved progress', async ({ page }) => {
  await page.route('**/delivery/signal-dead-v2.png', route => route.abort());
  await page.goto('/bastrop37/');
  await expect(page.locator('#game')).toHaveAttribute('data-state', 'error');
  await page.locator('#menu').click();
  await expect(page.locator('#start')).toBeDisabled();
  await page.unroute('**/delivery/signal-dead-v2.png');
  await page.locator('#retry').click();
  await expect(page.locator('#start')).toBeEnabled();
  await page.locator('#start').click();
  await expect(page.locator('#dialogue-text')).toHaveText('You have the module?');
});


test('confirmed new delivery cannot continue the previous checkpoint', async ({ page }) => {
  await toAction(page); await page.keyboard.press('KeyP');
  await page.locator('#new-game').click(); await page.locator('#confirm-new-game').click();
  await expect(page.locator('#dialogue-text')).toHaveText('You have the module?');
  await page.keyboard.press('KeyP'); await page.locator('#menu').click();
  if (await page.locator('#continue-save').isVisible()) {
    await page.locator('#continue-save').click();
    await expect(page.locator('#dialogue-text')).toHaveText('You have the module?');
  } else {
    await page.locator('#start').click();
    await expect(page.locator('#dialogue-text')).toHaveText('You have the module?');
  }
});


test('focused dialogue button ignores native repeated Enter', async ({ page }) => {
  await start(page); await page.locator('#advance').focus();
  await page.keyboard.down('Enter'); await page.keyboard.down('Enter'); await page.keyboard.down('Enter');
  await page.keyboard.up('Enter');
  await expect(page.locator('#dialogue-text')).toHaveText("It's on the bike. Where am I going?");
});

test.describe('mobile full Delivery', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  test('touch-only Delivery reaches a saved ending and can continue after reload', async ({ page, context }) => {
    test.setTimeout(300000);
    await start(page);
    const touch = await context.newCDPSession(page);
    async function steer(target: number) {
      for (let i = 0; i < 100; i++) {
        const x = Number(await page.locator('#game').getAttribute('data-x'));
        if (Math.abs(x - target) < 7) return;
        const button = page.locator(`[data-key=${x < target ? 'ArrowRight' : 'ArrowLeft'}]`);
        const bounds = (await button.boundingBox())!;
        await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2, id: 1 }] });
        await page.clock.runFor(32);
        await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      }
      throw new Error('Touch steering did not reach target');
    }
    for (let i = 0; i < 5; i++) await page.locator('#advance').tap();
    await page.clock.runFor(32);
    for (let i = 0; i < 60 && await page.locator('#comms').isHidden(); i++) {
      const route = Number(await page.locator('#game').getAttribute('data-route'));
      if (route > 900 && route < 1500) await steer(455);
      await page.clock.runFor(300);
      await expect(page.locator('#game')).toHaveAttribute('data-state', 'playing');
    }
    await expect(page.locator('#dialogue-text')).toContainText('crossing signal');
    for (let i = 0; i < 4; i++) await page.locator('#advance').tap();
    await page.clock.runFor(32);
    const cardTop = (await page.locator('#comms').boundingBox())!.y;
    expect(Number(await page.locator('#game').getAttribute('data-rider-bottom'))).toBeLessThanOrEqual(cardTop - 20);
    await page.screenshot({ path: `${capture}/mobile-omega-long.png` });
    await page.locator('#advance').tap(); await page.clock.runFor(32);
    await steer(397);
    for (let i = 0; i < 50 && await page.locator('#comms').isHidden(); i++) await page.clock.runFor(300);
    await expect(page.locator('#dialogue-text')).toContainText("You're nearly here");
    for (let i = 0; i < 3; i++) await page.locator('#advance').tap();
    await expect(page.locator('#game')).toHaveAttribute('data-state', 'complete');
    await page.screenshot({ path: `${capture}/mobile-complete.png` });
    await page.reload(); await page.locator('#continue-save').tap();
    await expect(page.locator('#headline')).toHaveText('DELIVERY APPROACH REACHED');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  });
});
