import { expect, test, type Page } from '@playwright/test';

const route = '/justyna34/';
const currentPhoto = (page: Page) => page.locator('.photo-slot.is-current:not([data-clone])');
async function centered(page: Page, index: number) {
  await expect(page.locator(`#question-${index}`)).toBeVisible();
  await expect.poll(() => page.locator(`.photo-slot:not([data-clone])[data-photo-index="${index}"]`).evaluate((slot) => {
    const box = slot.getBoundingClientRect();
    return Math.abs(box.left + box.width / 2 - innerWidth / 2);
  })).toBeLessThan(2);
}

test('minimal album advances after an answer, remembers revisited answers, and completes', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(route);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('happy 34 birthday');
  await expect(page.locator('.question:visible')).toHaveCount(1);
  await expect(currentPhoto(page)).toHaveAttribute('data-photo-index', '0');
  await expect(page.locator('.album-controls, .memory-strip, .print-footer, .little-heart, .progress-hearts, .love-particles')).toHaveCount(0);
  await page.getByRole('button', { name: 'Answer two' }).click();
  await expect(page.getByRole('button', { name: 'Answer two' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#question-1')).toBeVisible({ timeout: 4000 });
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('button', { name: 'Answer two' })).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('ArrowRight');
  for (let index = 1; index < 5; index++) {
    await centered(page, index);
    await page.getByRole('button', { name: 'Answer one' }).click();
    if (index < 4) await expect(page.locator(`#question-${index + 1}`)).toBeVisible({ timeout: 4000 });
  }
  await expect(page.locator('#birthday')).toHaveClass(/is-complete/);
  await expect(page.getByRole('status')).toHaveText('All memories answered. Happy birthday, Justyna!');
  await expect(page.locator('.answer[aria-pressed="true"]')).toHaveCount(5);
  await page.reload();
  await expect(page.locator('#birthday')).toHaveClass(/is-complete/);
  await expect(page.locator('.answer[aria-pressed="true"]')).toHaveCount(5);
  expect(errors).toEqual([]);
});

test('manual navigation cancels an answer advance and neighboring photos remain tappable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(route);
  await page.getByRole('button', { name: 'Answer one' }).click();
  await page.keyboard.press('ArrowLeft');
  await centered(page, 4);
  // Longer than the answer's deliberate pause: the user's chosen photo must remain.
  await page.waitForTimeout(1600);
  await expect(page.locator('#question-4')).toBeVisible();
  const neighbor = page.locator('.photo-slot[data-clone][data-photo-index="0"] button');
  await neighbor.click();
  await centered(page, 0);
});

test('photos enlarge from their position, close with Escape, and support mouse drag', async ({ page }) => {
  await page.goto(route);
  await expect(page.locator('.photo-stage')).toHaveCSS('opacity', '1');
  const photo = page.locator('.photo-slot:not([data-clone])').first().getByRole('button');
  // The photo has slow ambient motion: click the visual center, as a user does.
  let bounds = (await photo.boundingBox())!;
  await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('#enlarged-photo')).toHaveAttribute('src', '/justyna34/photos/coast.jpg');
  await expect(page.getByRole('dialog')).toHaveCSS('padding', '0px');
  await expect(page.getByRole('dialog')).toHaveCSS('border-radius', '0px');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(photo).toBeFocused();
  await centered(page, 0);
  bounds = (await photo.boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width * .8, bounds.y + 130);
  await page.mouse.down();
  await page.mouse.move(bounds.x - 180, bounds.y + 133, { steps: 20 });
  await page.mouse.up();
  await centered(page, 1);
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('real touch swipes navigate and loop, while vertical scrolling still works', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 700 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
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
  await swipe([330, 320], [60, 325]);
  await centered(page, 1);
  await swipe([60, 320], [330, 325]);
  await centered(page, 0);
  await swipe([60, 320], [330, 325]);
  await centered(page, 4);
  await swipe([330, 320], [60, 325]);
  await centered(page, 0);
  await swipe([190, 450], [190, 210]);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(30);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  expect(errors).toEqual([]);
  await context.close();
});

test('incorrect answers invite a retry and do not advance or save progress', async ({ page }) => {
  await page.route('**/justyna34/', async (request) => {
    const response = await request.fetch();
    const body = (await response.text()).replace('"id":"memory-01",', '"id":"memory-01","correctOption":"b",');
    await request.fulfill({ response, body });
  });
  await page.goto(route);
  await page.getByRole('button', { name: 'Answer one' }).click();
  await expect(page.getByRole('button', { name: 'Answer one' })).toHaveClass(/is-retry/);
  await expect(page.locator('.answer[aria-pressed="true"]')).toHaveCount(0);
  await expect(page.getByRole('status')).toHaveText('Give it another try.');
  await page.waitForTimeout(1500);
  await expect(page.locator('#question-0')).toBeVisible();
  await page.getByRole('button', { name: 'Answer two' }).click();
  await expect(page.locator('.is-retry')).toHaveCount(0);
  await expect(page.locator('#question-1')).toBeVisible({ timeout: 4000 });
});

test('motion responds to the pointer, and stops when reduced motion is requested', async ({ page }) => {
  await page.goto(route);
  await expect(page.locator('.photo-stage')).toHaveCSS('opacity', '1');
  const photo = currentPhoto(page).locator('button');
  const bounds = (await photo.boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width * .8, bounds.y + bounds.height * .3);
  await expect.poll(() => photo.evaluate((button) => button.style.getPropertyValue('--tilt-y'))).not.toBe('');
  const animated = await page.evaluate(() => document.getAnimations().some((a) => a.playState === 'running' && a instanceof CSSAnimation && a.animationName === 'photo-breathe'));
  expect(animated).toBeTruthy();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)).toBe(0);
  await expect(photo).toHaveCSS('transform', 'none');
  await photo.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Close enlarged photo' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('storage fallback, square painting frames on mobile, loaded images, and text contrast', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage unavailable'); } });
  });
  await page.goto(route);
  await page.getByRole('button', { name: 'Answer one' }).click();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('button', { name: 'Answer one' })).toHaveAttribute('aria-pressed', 'true');
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    const answers = await page.locator('.question:visible .answer').all();
    for (const answer of answers) expect((await answer.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    const surface = currentPhoto(page).locator('button');
    await expect(surface).toHaveCSS('border-radius', '0px');
    await expect(currentPhoto(page).locator('.photo-window')).toHaveCSS('border-radius', '0px');
    await expect(surface).toHaveCSS('padding', '0px');
    await expect(surface).toHaveCSS('border-top-width', width <= 650 ? '22px' : '28px');
    await expect(surface).toHaveCSS('border-image-source', /painting-frame\.svg/);
    await centered(page, 0);
    await page.screenshot({ path: `test-results/justyna34-${width}.png`, fullPage: true });
  }
  const image = currentPhoto(page).locator('img');
  await expect.poll(() => image.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBeTruthy();
  const contrast = await page.evaluate(() => {
    const luminance = (color: string) => {
      const rgb = color.match(/\d+/g)!.slice(0, 3).map(Number).map((value) => {
        const channel = value / 255;
        return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
      });
      return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2];
    };
    const ratio = (element: Element) => {
      const style = getComputedStyle(element);
      const text = luminance(style.color);
      const background = luminance(style.backgroundColor);
      return (Math.max(text, background) + .05) / (Math.min(text, background) + .05);
    };
    return {
      normal: ratio(document.documentElement),
      selected: ratio(document.querySelector('.answer[aria-pressed="true"]')!),
      answer: ratio(document.querySelector('.answer[aria-pressed="false"]')!),
    };
  });
  expect(contrast.normal).toBeGreaterThan(4.5);
  expect(contrast.selected).toBeGreaterThan(4.5);
  expect(contrast.answer).toBeGreaterThan(4.5);
});

test('3D balloons animate without input, fit small screens, and rest when hidden or motion is reduced', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(route);
  const balloons = page.locator('#birthday-balloons');
  await expect(balloons).toHaveAttribute('data-renderer', 'webgl');
  await expect(balloons).toHaveAttribute('data-motion', 'running');
  await expect(balloons.locator('canvas')).toHaveCSS('opacity', '1');
  await expect(page.locator('.photo-stage')).toHaveCSS('opacity', '1');
  // Hide unrelated CSS motion so this specifically checks the idle 3D scene.
  const isolateBalloons = await page.addStyleTag({ content: '.ambient-light, .birthday-heading h1 { visibility: hidden !important; }' });
  const before = await balloons.screenshot({ path: 'test-results/justyna34-idle-before.png' });
  await page.waitForTimeout(1000);
  expect((await balloons.screenshot({ path: 'test-results/justyna34-idle-after.png' })).equals(before)).toBeFalsy();
  await isolateBalloons.evaluate((style) => style.remove());
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect.poll(() => balloons.locator('canvas').evaluate((canvas) => canvas.getBoundingClientRect().width)).toBe(Math.min(width, 1060));
    await centered(page, 0);
    await page.screenshot({ path: `test-results/justyna34-balloons-${width}.png`, fullPage: true });
    await centered(page, 0);
  }
  await page.setViewportSize({ width: 390, height: 400 });
  await page.locator('.question:visible').scrollIntoViewIfNeeded();
  await expect(balloons).toHaveAttribute('data-motion', 'paused');
  await page.evaluate(() => scrollTo(0, 0));
  await expect(balloons).toHaveAttribute('data-motion', 'running');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(balloons).toHaveAttribute('data-motion', 'reduced');
  const still = await balloons.screenshot();
  await page.waitForTimeout(200);
  expect((await balloons.screenshot()).equals(still)).toBeTruthy();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(balloons).toHaveAttribute('data-motion', 'running');
  expect(errors).toEqual([]);
});

test('balloons keep their illustrated fallback without WebGL, and the quiz remains usable', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type: string, ...args: any[]) {
      if (type === 'webgl2') return null;
      return original.call(this, type as any, ...args);
    } as typeof original;
  });
  await page.goto(route);
  await expect(page.locator('.balloon-fallback--left')).toBeVisible();
  await expect(page.locator('.balloon-fallback--right')).toBeVisible();
  await expect(page.locator('#birthday-balloons')).toHaveAttribute('data-renderer', 'fallback');
  await page.getByRole('button', { name: 'Answer one' }).click();
  await centered(page, 1);
});
