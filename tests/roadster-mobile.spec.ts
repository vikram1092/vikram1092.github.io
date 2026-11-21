import { test, expect, type Page } from '@playwright/test';

// Use the Mac's GPU for the complete scene; CI retains the shared software renderer.
if (process.platform === 'darwin') test.use({ launchOptions: { args: ['--use-gl=angle', '--use-angle=metal'] } });

const snapshot = (page: Page) => page.evaluate(() => (window as any).__roadster.snapshot());
async function openRoadster(page: Page) {
  await page.goto('/roadster/');
  await page.waitForFunction(() => (window as any).__roadster?.snapshot().ready);
}

test.describe('touch driving', () => {
  test.use({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true });

  test('auto drive, thrust, directional swipes, kickflip, brake and interruptions work together', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await openRoadster(page);
    await expect(page.locator('#brake')).toBeVisible();
    await expect(page.locator('#paint-selector')).toBeHidden();
    await expect.poll(async () => (await snapshot(page)).speed).toBeGreaterThan(1);
    expect((await snapshot(page)).mode).toBe('drive');
    expect((await snapshot(page)).boost).toBe(false);

    // Real browser touch input exercises hit testing, pointer capture and
    // touch-action, rather than dispatching synthetic DOM pointer events.
    const cdp = await page.context().newCDPSession(page);
    const fingers = new Map<number, { id: number; x: number; y: number }>();
    const down = async (id: number, x: number, y: number) => {
      fingers.set(id, { id, x, y });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [...fingers.values()] });
    };
    const move = async (id: number, x: number, y: number) => {
      fingers.set(id, { id, x, y });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [...fingers.values()] });
    };
    const up = async (id: number) => {
      const finger = fingers.get(id)!;
      fingers.delete(id);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [finger] });
    };

    await down(1, 200, 600);
    await expect.poll(async () => (await snapshot(page)).boost).toBe(true);
    await move(1, 160, 600);
    await expect.poll(async () => (await snapshot(page)).steer).toBeGreaterThan(.15);
    await move(1, 240, 600);
    await expect.poll(async () => (await snapshot(page)).steer).toBeLessThan(-.15);
    await up(1);
    await expect.poll(async () => (await snapshot(page)).boost).toBe(false);
    await expect.poll(async () => Math.abs((await snapshot(page)).steer)).toBeLessThan(.02);

    const tricks = (await snapshot(page)).tricks;
    await down(1, 220, 600);
    await move(1, 220, 520);
    await expect.poll(async () => (await snapshot(page)).flip).toBeGreaterThan(0);
    expect((await snapshot(page)).flipAxis).toBe('z');
    await expect.poll(async () => (await snapshot(page)).tricks, { timeout: 20_000 }).toBe(tricks + 1);
    await move(1, 220, 450);
    expect((await snapshot(page)).flip).toBe(0); // One flip per swipe.
    await up(1);

    await down(1, 220, 500);
    await move(1, 220, 580);
    expect((await snapshot(page)).flip).toBe(0); // A downward swipe is not a kickflip.
    await down(2, 200, 400);
    await up(2);
    expect((await snapshot(page)).boost).toBe(true); // First finger still holds thrust.
    const brake = await page.locator('#brake').boundingBox();
    expect(brake).toBeTruthy();
    await down(2, brake!.x + brake!.width / 2, brake!.y + brake!.height / 2);
    await expect(page.locator('#brake')).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(async () => (await snapshot(page)).boost).toBe(false);
    await expect.poll(async () => (await snapshot(page)).speed, { timeout: 30_000 }).toBe(0);
    await page.screenshot({ path: 'test-results/roadster-mobile-portrait.png' });
    expect((await snapshot(page)).speed).toBe(0); // Holding the brake cannot reverse.
    await move(2, 130, 700); // The brake remains held outside its circle.
    await expect(page.locator('#brake')).toHaveAttribute('aria-pressed', 'true');
    await up(2);
    await expect.poll(async () => (await snapshot(page)).boost).toBe(true);
    await expect.poll(async () => (await snapshot(page)).speed).toBeGreaterThan(1);

    // A cancelled touch cannot leave thrust or steering held.
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    fingers.clear();
    await expect.poll(async () => (await snapshot(page)).boost).toBe(false);
    await down(1, 200, 500);
    await down(2, brake!.x + 24, brake!.y + 24);
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    expect((await snapshot(page)).paused).toBe(true);
    await expect(page.locator('#brake')).toHaveAttribute('aria-pressed', 'false');
    await up(2);
    await up(1);
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect.poll(async () => (await snapshot(page)).boost).toBe(false);
    await expect.poll(async () => (await snapshot(page)).speed).toBeGreaterThan(1);

    await page.setViewportSize({ width: 852, height: 393 });
    await expect(page.locator('#brake')).toBeInViewport();
    await expect(page.locator('#speed')).toBeInViewport();
    expect(await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
    }))).toEqual({ width: 852, height: 393 });
    await page.screenshot({ path: 'test-results/roadster-mobile-landscape.png' });
    expect(errors).toEqual([]);
  });
});

test('desktop retains orbit, paint, keyboard driving, reverse and kickflips even in a narrow window', async ({ page }) => {
  await openRoadster(page);
  expect((await snapshot(page)).mode).toBe('orbit');
  expect((await snapshot(page)).speed).toBe(0);
  await expect(page.locator('#brake')).toBeHidden();
  await expect(page.locator('#paint-selector')).toBeVisible();
  await page.locator('[data-finish="2"]').click();
  expect((await snapshot(page)).finish).toBe(2);
  await page.mouse.move(700, 400);
  await page.mouse.down();
  await page.mouse.move(850, 450);
  await page.mouse.up();
  expect((await snapshot(page)).mode).toBe('orbit');
  await page.keyboard.down('ArrowUp');
  await expect.poll(async () => (await snapshot(page)).speed).toBeGreaterThan(1);
  await page.keyboard.down('Shift');
  await expect.poll(async () => (await snapshot(page)).boost).toBe(true);
  await page.keyboard.up('Shift');
  await page.keyboard.up('ArrowUp');
  await page.keyboard.down('ArrowDown');
  await expect.poll(async () => (await snapshot(page)).speed, { timeout: 30_000 }).toBeLessThan(0);
  await page.keyboard.up('ArrowDown');
  await page.keyboard.press('f');
  await expect.poll(async () => (await snapshot(page)).flip).toBeGreaterThan(0);
  await page.keyboard.press('c');
  expect((await snapshot(page)).mode).toBe('orbit');
  await page.screenshot({ path: 'test-results/roadster-desktop.png' });
  await page.setViewportSize({ width: 393, height: 852 });
  await expect(page.locator('#brake')).toBeHidden();
  await expect(page.locator('#paint-selector')).toBeVisible();
  expect((await snapshot(page)).speed).toBe(0);
});
