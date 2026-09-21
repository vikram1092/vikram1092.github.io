import { expect, test } from '@playwright/test';

test('green jelly scene has clean navigation and drops the period after 1.5 seconds', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.addInitScript(() => {
    const times = { ready: 0, dropped: 0 };
    (window as unknown as { sceneTimes: typeof times }).sceneTimes = times;
    new MutationObserver(() => {
      if (!times.ready && document.querySelector('.home.is-ready')) times.ready = performance.now();
      if (!times.dropped && document.querySelector('#water-status')?.textContent === 'The period dropped into the water.') times.dropped = performance.now();
    }).observe(document, { subtree: true, attributes: true, childList: true });
  });
  await page.goto('/');
  await expect(page.locator('.home')).toHaveClass(/is-ready/, { timeout: 45_000 });
  await expect(page.locator('.home__canvas')).toHaveCSS('opacity', '1');
  await expect(page.locator('h1')).toHaveText('VikramRamkumar.');
  await expect(page.locator('.home__mark')).toHaveText('vr');
  await expect(page.locator('.water-controls')).toHaveCount(0);
  await expect(page.getByText('A little curiosity goes a long way.')).toHaveCount(0);
  await expect(page.locator('.home__footer')).not.toContainText('↗');
  await expect(page.locator('#water-status')).toContainText('The period is floating.', { timeout: 30_000 });
  const delay = await page.evaluate(() => {
    const times = (window as unknown as { sceneTimes: { ready: number; dropped: number } }).sceneTimes;
    return times.dropped - times.ready;
  });
  expect(delay).toBeGreaterThanOrEqual(1400);
  expect(delay).toBeLessThan(5000);
  await page.screenshot({ path: 'test-results/desktop-water.png' });
  await page.mouse.move(950, 375);
  await page.mouse.down();
  await expect(page.locator('#water-scene')).toHaveClass(/is-dragging/);
  await page.mouse.move(1020, 490, { steps: 4 });
  await page.mouse.up();
  await expect(page.locator('#water-scene')).not.toHaveClass(/is-dragging/);
  expect(errors).toEqual([]);
});

test('mobile preserves left and right footer groups and touch dragging', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('.home')).toHaveClass(/is-ready/, { timeout: 45_000 });
  await expect(page.locator('.home__canvas')).toHaveCSS('opacity', '1');
  await page.screenshot({ path: 'test-results/mobile-water.png' });
  const touch = await context.newCDPSession(page);
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 276, y: 320 }] });
  await expect(page.locator('#water-scene')).toHaveClass(/is-dragging/);
  await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 260, y: 450 }] });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(page.locator('#water-scene')).not.toHaveClass(/is-dragging/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  const left = await page.locator('.home__work').boundingBox();
  const right = await page.locator('.home__links').boundingBox();
  expect(left!.x + left!.width).toBeLessThan(right!.x);
  await expect(page.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', 'mailto:vik.r92@gmail.com');
  expect(errors).toEqual([]);
  await context.close();
});

test('reduced motion and no WebGL preserve the static name and links', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('data-scene', 'fallback');
  await expect(page.locator('.home__identity')).toHaveCSS('opacity', '1');
  await expect(page.locator('h1')).toHaveText('VikramRamkumar.');
  await expect(page.getByRole('navigation', { name: 'Selected work' }).getByRole('link')).toHaveCount(3);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
      if (type === 'webgl' || type === 'webgl2') return null;
      return getContext.apply(this, [type, ...args] as Parameters<typeof getContext>);
    } as typeof getContext;
  });
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-scene', 'fallback');
  await expect(page.locator('.home__identity')).toHaveCSS('opacity', '1');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: 'LinkedIn' })).toBeVisible();
});

test('loading shows the photograph without static letters or water, then reveals the scene', async ({ page }) => {
  let resume!: () => void;
  const downloading = new Promise<void>(resolve => { resume = resolve; });
  await page.route('**/_astro/*.js', async route => {
    await downloading;
    await route.continue();
  });
  await page.goto('/', { waitUntil: 'commit' });
  try {
    await expect(page.locator('html')).toHaveAttribute('data-scene', 'loading');
    await expect(page.locator('.home__identity')).toHaveCSS('opacity', '0');
    await expect(page.locator('.home__still-water')).toBeHidden();
    await expect(page.locator('.home__canvas')).toHaveCSS('opacity', '0');
    await expect(page.getByRole('link', { name: 'Contact' })).toBeVisible();
    await page.screenshot({ path: 'test-results/loading-photo.png' });
  } finally {
    resume();
  }
  await expect(page.locator('html')).toHaveAttribute('data-scene', 'ready', { timeout: 45_000 });
  await expect(page.locator('.home__canvas')).toHaveCSS('opacity', '1');
  await expect(page.locator('.home__still-water')).toBeHidden();
});
