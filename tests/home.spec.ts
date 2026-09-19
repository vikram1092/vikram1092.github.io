import { expect, test } from '@playwright/test';

test('interactive scene renders, drops a letter, reassembles, and pauses', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  await expect(page.locator('.home')).toHaveClass(/is-ready/, { timeout: 45_000 });
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('VikramRamkumar');
  await page.mouse.move(950, 375);
  await page.mouse.down();
  await expect(page.locator('#water-scene')).toHaveClass(/is-dragging/);
  await page.mouse.move(1000, 490, { steps: 4 });
  await page.mouse.up();
  await expect(page.locator('#water-scene')).not.toHaveClass(/is-dragging/);
  await page.getByRole('button', { name: 'Drop a letter' }).click();
  await expect(page.locator('#water-status')).toContainText('V dropped');
  await expect(page.locator('#water-status')).toContainText('V is floating', { timeout: 30_000 });
  await page.screenshot({ path: 'test-results/desktop-water.png' });
  await page.getByRole('button', { name: 'Reassemble' }).click();
  await expect(page.locator('#water-status')).toContainText('Reassembling');
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: 'Pause animation' }).click();
  await expect(page.getByRole('button', { name: 'Drop a letter' })).toBeDisabled();
  const still = await page.locator('canvas').screenshot();
  await page.waitForTimeout(250);
  expect(await page.locator('canvas').screenshot()).toEqual(still);
  await page.getByRole('button', { name: 'Resume animation' }).click();
  await expect(page.getByRole('button', { name: 'Drop a letter' })).toBeEnabled();
  expect(errors).toEqual([]);
});

test('mobile fits the viewport and supports touch and resize', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('.home')).toHaveClass(/is-ready/, { timeout: 45_000 });
  await page.getByRole('button', { name: 'Drop a letter' }).tap();
  await expect(page.locator('#water-status')).toContainText('V dropped');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'test-results/mobile-water.png' });
  const touch = await context.newCDPSession(page);
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 276, y: 320 }] });
  await expect(page.locator('#water-scene')).toHaveClass(/is-dragging/);
  await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 260, y: 450 }] });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(page.locator('#water-scene')).not.toHaveClass(/is-dragging/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await expect(page.getByRole('link', { name: 'Résumé' })).toBeVisible();
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('canvas')).toBeVisible();
  await page.getByRole('button', { name: 'Reassemble' }).click();
  expect(errors).toEqual([]);
  await context.close();
});

test('reduced motion keeps the name and navigation without loading WebGL', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect(page.locator('.water-controls')).toBeHidden();
  await expect(page.getByRole('link', { name: 'Say hello' })).toHaveAttribute('href', 'mailto:vik.r92@gmail.com');
  await expect(page.getByRole('navigation', { name: 'Selected work' }).getByRole('link')).toHaveCount(3);
});

test('WebGL failure preserves a usable homepage', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
      if (type === 'webgl' || type === 'webgl2') return null;
      return getContext.apply(this, [type, ...args] as Parameters<typeof getContext>);
    } as typeof getContext;
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: 'LinkedIn' })).toBeVisible();
  await expect(page.locator('.water-controls')).toBeHidden();
});

test('JavaScript-disabled visitors retain the entire portfolio', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Résumé' })).toHaveAttribute('href', '/resume/vikram-ramkumar.pdf');
  await context.close();
});
