import { expect, test } from '@playwright/test';

const route = '/justyna34/';

test('the album supports answers, revisiting, completion, reload, and replay', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(route);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('happy34th birthday');
  await expect(page.locator('.question:visible')).toHaveCount(1);
  await expect(page.locator('.photo-slot.is-current:not([data-clone])')).toHaveAttribute('data-photo-index', '0');
  await page.getByRole('button', { name: 'Answer two' }).click();
  await expect(page.getByRole('button', { name: 'Answer two' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('img', { name: '1 of 5 questions answered' })).toBeVisible();
  await page.getByRole('button', { name: 'Next photo', exact: true }).click();
  await expect(page.locator('#question-1')).toBeVisible();
  await page.getByRole('button', { name: 'Previous photo', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Answer two' })).toHaveAttribute('aria-pressed', 'true');
  for (let index = 1; index < 5; index++) {
    await page.locator(`[data-memory-index="${index}"]`).click();
    await expect(page.locator(`#question-${index}`)).toBeVisible();
    await page.getByRole('button', { name: 'Answer one' }).click();
  }
  await expect(page.getByRole('img', { name: '5 of 5 questions answered' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start the quiz again' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('img', { name: '5 of 5 questions answered' })).toBeVisible();
  await page.getByRole('button', { name: 'Start the quiz again' }).click();
  await expect(page.getByRole('img', { name: '0 of 5 questions answered' })).toBeVisible();
  await expect(page.locator('#question-0')).toBeVisible();
  await expect(page.locator('.answer[aria-pressed="true"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('photos enlarge, close with Escape, and navigate by keyboard or mouse drag', async ({ page }) => {
  await page.goto(route);
  const photo = page.locator('.photo-slot:not([data-clone])').first().getByRole('button');
  await photo.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('#enlarged-photo')).toHaveAttribute('src', '/justyna34/photos/coast.jpg');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(photo).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#question-1')).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#question-0')).toBeVisible();
  await expect.poll(async () => {
    const stage = await page.locator('#photo-stage').boundingBox();
    const box = await page.locator('.photo-slot:not([data-clone])').first().boundingBox();
    return Math.abs(box!.x + box!.width / 2 - (stage!.x + stage!.width / 2));
  }).toBeLessThan(2);
  const bounds = await photo.boundingBox();
  await page.mouse.move(bounds!.x + bounds!.width * .8, bounds!.y + 130);
  await page.mouse.down();
  await page.mouse.move(bounds!.x - 120, bounds!.y + 133, { steps: 16 });
  await page.mouse.up();
  await expect(page.locator('#question-1')).toBeVisible();
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('real touch swipes move memories, loop at the end, and preserve vertical scrolling', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:4321${route}`);
  await expect(page.locator('.photo-stage')).toHaveCSS('opacity', '1');
  const touch = await context.newCDPSession(page);
  async function swipe(from: [number, number], to: [number, number]) {
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: from[0], y: from[1] }] });
    for (let step = 1; step <= 12; step++) {
      await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: from[0] + (to[0] - from[0]) * step / 12, y: from[1] + (to[1] - from[1]) * step / 12 }] });
    }
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
  await swipe([325, 360], [65, 365]);
  await expect(page.locator('#question-1')).toBeVisible();
  await page.locator('[data-memory-index="4"]').tap();
  await expect(page.locator('#question-4')).toBeVisible();
  // Wait for the programmatic slide before starting a fresh gesture.
  await expect.poll(() => page.locator('.photo-slot:not([data-clone])').last().evaluate((slot) => {
    const box = slot.getBoundingClientRect();
    return Math.abs(box.left + box.width / 2 - innerWidth / 2);
  })).toBeLessThan(2);
  await page.evaluate(() => window.scrollTo(0, 0));
  await swipe([325, 360], [65, 365]);
  await expect(page.locator('#question-0')).toBeVisible();
  await expect.poll(() => page.locator('.photo-slot:not([data-clone])').first().evaluate((slot) => {
    const box = slot.getBoundingClientRect();
    return Math.abs(box.left + box.width / 2 - innerWidth / 2);
  })).toBeLessThan(2);
  await swipe([190, 470], [190, 210]);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(50);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await context.close();
});

test('configured correct answers allow gentle retries without awarding progress', async ({ page }) => {
  await page.route('**/justyna34/', async (request) => {
    const response = await request.fetch();
    const body = (await response.text()).replace('"id":"memory-01",', '"id":"memory-01","correctOption":"b",');
    await request.fulfill({ response, body });
  });
  await page.goto(route);
  await page.getByRole('button', { name: 'Answer one' }).click();
  await expect(page.getByRole('button', { name: 'Answer one' })).toHaveClass(/is-retry/);
  await expect(page.getByRole('img', { name: '0 of 5 questions answered' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Give it another try.');
  await page.getByRole('button', { name: 'Answer two' }).click();
  await expect(page.getByRole('img', { name: '1 of 5 questions answered' })).toBeVisible();
  await expect(page.locator('.is-retry')).toHaveCount(0);
});

test('reduced motion, unavailable storage, responsive layouts, assets, and text contrast', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage unavailable'); } });
  });
  await page.goto(route);
  await page.getByRole('button', { name: 'Answer one' }).click();
  await expect(page.getByRole('img', { name: '1 of 5 questions answered' })).toBeVisible();
  await expect(page.locator('.love-particle')).toHaveCount(0);
  await page.getByRole('button', { name: 'Send a little love' }).click();
  await expect(page.locator('.love-particle')).toHaveCount(0);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    const answers = await page.locator('.question:visible .answer').all();
    for (const answer of answers) expect((await answer.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await page.screenshot({ path: `test-results/justyna34-${width}.png`, fullPage: true });
  }
  const images = await page.locator('.memory-thumb img').evaluateAll((images) => images.every((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0));
  expect(images).toBeTruthy();
  const contrast = await page.evaluate(() => {
    const luminance = (color: string) => {
      const rgb = color.match(/\d+/g)!.slice(0, 3).map(Number).map((value) => {
        const channel = value / 255;
        return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
      });
      return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2];
    };
    const text = luminance(getComputedStyle(document.documentElement).color);
    const background = luminance(getComputedStyle(document.documentElement).backgroundColor);
    const selected = luminance(getComputedStyle(document.querySelector('.answer[aria-pressed="true"]')!).backgroundColor);
    return { normal: (background + .05) / (text + .05), selected: (selected + .05) / (text + .05) };
  });
  expect(contrast.normal).toBeGreaterThan(4.5);
  expect(contrast.selected).toBeGreaterThan(4.5);
  console.log('Birthday palette contrast:', contrast);
});
