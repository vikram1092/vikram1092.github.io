import { expect, test, type Page } from '@playwright/test';
import { memories } from '../src/data/justyna34';

const route = '/justyna34/';
const memoryCount = 35;
const lastMemory = memoryCount - 1;
const videoIndex = memories.findIndex((memory) => memory.video);
const currentPhoto = (page: Page) => page.locator('.photo-slot.is-current:not([data-clone])');
async function openAlbum(page: Page) {
  await page.getByRole('button', { name: 'Open your birthday memories' }).click();
  await expect(page.locator('.album')).toHaveCSS('opacity', '1');
}
async function centered(page: Page, index: number) {
  await expect(page.locator(`#question-${index}`)).not.toHaveAttribute('hidden');
  await expect.poll(() => page.locator(`.photo-slot:not([data-clone])[data-photo-index="${index}"]`).evaluate((slot) => {
    const box = slot.getBoundingClientRect();
    return Math.abs(box.left + box.width / 2 - innerWidth / 2);
  })).toBeLessThan(2);
}

async function visit(page: Page, index: number) {
  const active = Number(await currentPhoto(page).getAttribute('data-photo-index'));
  for (let step = active; step !== index; step += Math.sign(index - active)) {
    await page.keyboard.press(index > active ? 'ArrowRight' : 'ArrowLeft');
  }
  await centered(page, index);
}

test('the birthday story keeps all captions, saves seven quiz answers, and stops at both ends', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(route);
  await openAlbum(page);
  await expect(page.locator('h1')).toHaveText('happy 34 birthday');
  await expect(page.locator('.photo-slot')).toHaveCount(35);
  await expect(page.locator('[data-clone], .album-controls, .memory-strip')).toHaveCount(0);
  await expect(page.locator('#question-0 h2')).toHaveText('Once in my life…');
  await page.keyboard.press('ArrowLeft');
  await centered(page, 0);
  const quizIndices: number[] = [];
  for (let index = 0; index < memoryCount; index++) {
    await centered(page, index);
    const memory = memories[index];
    const question = page.locator(`#question-${index}`);
    await expect(question.locator('h2')).toHaveText(memory.question);
    if (memory.options.length) {
      quizIndices.push(index);
      await expect(question.locator('.answer')).toHaveText(memory.options.map((option) => option.label));
      const correct = question.locator(`[data-option="${memory.correctOption}"]`);
      await correct.click();
      await expect(correct).toHaveAttribute('aria-pressed', 'true');
      // The next caption must never be skipped, including after the final quiz.
      await centered(page, index + 1);
    } else {
      await expect(question.locator('.answers, .answer')).toHaveCount(0);
      if (index < lastMemory) await page.keyboard.press('ArrowRight');
    }
  }
  expect(quizIndices).toEqual([3, 6, 8, 13, 15, 17, 25]);
  expect(quizIndices.map((index) => memories[index].options.find((option) => option.id === memories[index].correctOption)!.label)).toEqual(['Krakow', 'The VA', 'Soldier', 'Washington', 'Ojcow', 'Yes', 'San Diego']);
  await expect(page.locator('#birthday')).toHaveClass(/is-complete/);
  await expect(page.locator('.answer[aria-pressed="true"]')).toHaveCount(7);
  await expect(page.locator('#question-34 h2')).toHaveText('Here’s to the next 34 years of success. Happy birthday my love ❤️');
  await page.keyboard.press('ArrowRight');
  await centered(page, lastMemory);
  await page.reload();
  await openAlbum(page);
  await centered(page, 0);
  await expect(page.locator('#birthday')).toHaveClass(/is-complete/);
  await expect(page.locator('.answer[aria-pressed="true"]')).toHaveCount(7);
  expect(errors).toEqual([]);
});

test('manual navigation cancels an answer advance and neighboring photos remain tappable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(route);
  await openAlbum(page);
  await visit(page, 3);
  await page.getByRole('button', { name: 'Krakow', exact: true }).click();
  await page.keyboard.press('ArrowLeft');
  await centered(page, 2);
  await page.waitForTimeout(1600);
  await centered(page, 2);
  await expect(currentPhoto(page).locator('button')).toBeFocused();
  await page.locator('.photo-slot[data-photo-index="3"] button').click();
  await centered(page, 3);
});

test('photos enlarge from their position, close with Escape, and support mouse drag', async ({ page }) => {
  await page.goto(route);
  await openAlbum(page);
  await expect(page.locator('.photo-stage')).toHaveCSS('opacity', '1');
  const photo = page.locator('.photo-slot:not([data-clone])').first().getByRole('button');
  // The photo has slow ambient motion: click the visual center, as a user does.
  let bounds = (await photo.boundingBox())!;
  await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('#enlarged-photo')).toHaveAttribute('src', memories[0].photo);
  await expect(page.getByRole('dialog')).toHaveAttribute('data-frame', 'rococo');
  await expect(page.getByRole('dialog')).toHaveCSS('border-image-source', /rococo-rail\.svg/);
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
  bounds = (await currentPhoto(page).locator('button').boundingBox())!;
  await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await expect(page.getByRole('dialog')).toHaveAttribute('data-frame', 'laurel');
  await expect(page.getByRole('dialog')).toHaveCSS('border-image-source', /laurel-rail\.svg/);
  await expect(page.getByRole('dialog').locator('.frame-corner').first()).toHaveCSS('background-image', /laurel-corner\.svg/);
  await expect(page.locator('#enlarged-photo')).toHaveAttribute('src', memories[1].photo);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('real touch swipes stop at both ends and the page stays within the viewport', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 700 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`http://127.0.0.1:4321${route}`);
  await openAlbum(page);
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
  await centered(page, 0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await visit(page, lastMemory);
  await swipe([330, 320], [60, 325]);
  await centered(page, lastMemory);
  await visit(page, 3);
  await swipe([190, 450], [190, 210]);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  expect(errors).toEqual([]);
  await context.close();
});

test('mobile enlargement matches the source rectangle and reverses without a jump', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route);
  await openAlbum(page);
  await expect(page.locator('.photo-stage')).toHaveCSS('opacity', '1');
  const photo = currentPhoto(page).locator('button');
  const box = (await photo.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const initial = await dialog.evaluate((element) => {
    const animation = element.getAnimations()[0];
    animation.pause();
    animation.currentTime = 0;
    const modal = element.getBoundingClientRect();
    const source = document.querySelector('.photo-slot.is-expanded button')!.getBoundingClientRect();
    return { width: Math.abs(modal.width - source.width), height: Math.abs(modal.height - source.height), x: Math.abs(modal.x - source.x), y: Math.abs(modal.y - source.y) };
  });
  for (const error of Object.values(initial)) expect(error).toBeLessThan(2);
  const halfway = await dialog.evaluate((element) => {
    element.getAnimations()[0].currentTime = 250;
    const box = element.getBoundingClientRect();
    return { x: box.x, y: box.y, width: box.width, height: box.height };
  });
  await page.keyboard.press('Escape');
  const reversal = await dialog.evaluate((element) => {
    const animation = element.getAnimations()[0];
    animation.pause();
    animation.currentTime = 0;
    const box = element.getBoundingClientRect();
    animation.play();
    return { x: box.x, y: box.y, width: box.width, height: box.height };
  });
  for (const key of ['x', 'y', 'width', 'height'] as const) expect(Math.abs(reversal[key] - halfway[key])).toBeLessThan(2);
  await expect(dialog).toBeHidden();
});

test.describe('option taps', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('every option advances one memory, including saved and repeated choices', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(route);
    await openAlbum(page);
    for (let index = 0; index < memoryCount; index++) {
      for (const option of memories[index].options) {
        await visit(page, index);
        const button = page.locator(`#question-${index} [data-option="${option.id}"]`);
        await button.tap();
        await expect(button).toHaveAttribute('aria-pressed', 'true');
        await expect(page.locator(`#question-${index + 1}`)).toBeVisible({ timeout: 1000 });
        await centered(page, index + 1);
      }
    }
    await expect(page.locator('#birthday')).toHaveClass(/is-complete/);
    await expect(page.locator('.answer[aria-pressed="true"]')).toHaveCount(7);

    // Previously incorrect choices survive a reload and remain tappable.
    await page.reload();
    await openAlbum(page);
    await visit(page, 3);
    const saved = page.getByRole('button', { name: 'Greece', exact: true });
    await expect(saved).toHaveAttribute('aria-pressed', 'true');
    await saved.tap();
    await centered(page, 4);
    await visit(page, 3);
    await saved.tap();
    await centered(page, 4);
    await page.waitForTimeout(500);
    await centered(page, 4);
  });
});

test('motion responds to the pointer, and stops when reduced motion is requested', async ({ page }) => {
  await page.goto(route);
  await openAlbum(page);
  await expect(page.locator('.photo-stage')).toHaveCSS('opacity', '1');
  const photo = currentPhoto(page).locator('button');
  const bounds = (await photo.boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width * .8, bounds.y + bounds.height * .3);
  await expect.poll(() => photo.evaluate((button) => button.style.getPropertyValue('--light-x'))).not.toBe('');
  const animated = await page.evaluate(() => document.getAnimations().some((a) => a.playState === 'running' && a instanceof CSSAnimation && a.animationName === 'photo-float'));
  expect(animated).toBeTruthy();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)).toBe(0);
  await expect(photo).toHaveCSS('transform', 'none');
  for (const frame of await page.locator('.photo-surface').all()) await expect(frame).toHaveCSS('transform', 'none');
  await photo.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Close enlarged photo' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('hover and press do not resize carousel frames or fight their centered size', async ({ page }) => {
  await page.goto(route);
  await openAlbum(page);
  await expect(page.locator('.photo-stage')).toHaveCSS('opacity', '1');
  const photo = currentPhoto(page).locator('button');
  const box = (await photo.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(300);
  expect(Math.abs((await photo.boundingBox())!.width - box.width)).toBeLessThan(1);
  await page.mouse.up();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  const neighbor = page.locator('.photo-slot:not([data-clone])[data-photo-index="1"] button');
  const before = (await neighbor.boundingBox())!;
  await page.mouse.move(Math.min(1420, before.x + before.width / 2), before.y + before.height / 2);
  await page.waitForTimeout(400);
  expect(Math.abs((await neighbor.boundingBox())!.width - before.width)).toBeLessThan(1);
  await page.keyboard.press('ArrowRight');
  await centered(page, 1);
  const focusedWidth = (await neighbor.boundingBox())!.width;
  await page.mouse.move(10, 10);
  await page.waitForTimeout(1100);
  expect(Math.abs((await neighbor.boundingBox())!.width - focusedWidth)).toBeLessThan(1);
});

test('storage fallback, square painting frames on mobile, loaded images, and text contrast', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage unavailable'); } });
  });
  await page.goto(route);
  await openAlbum(page);
  await visit(page, 3);
  await page.getByRole('button', { name: 'Krakow', exact: true }).click();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('button', { name: 'Krakow', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await visit(page, 0);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    const answers = await page.locator('#question-3 .answer').all();
    await visit(page, 3);
    for (const answer of answers) expect((await answer.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await visit(page, 0);
    const surface = currentPhoto(page).locator('button');
    await expect(surface).toHaveCSS('border-radius', '0px');
    await expect(currentPhoto(page).locator('.photo-window')).toHaveCSS('border-radius', '0px');
    await expect(surface).toHaveCSS('padding', '0px');
    await expect(surface).toHaveCSS('border-top-width', width <= 650 ? '28px' : '38px');
    await expect(surface).toHaveCSS('border-image-source', /frames\/rococo-rail\.svg/);
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
  await openAlbum(page);
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
    await expect.poll(() => balloons.locator('canvas').evaluate((canvas) => canvas.getBoundingClientRect().width)).toBe(width);
    await centered(page, 0);
    await page.screenshot({ path: `test-results/justyna34-balloons-${width}.png`, fullPage: true });
    await centered(page, 0);
  }
  await page.setViewportSize({ width: 390, height: 400 });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(balloons).toHaveAttribute('data-motion', 'running');
  await expect(balloons).toHaveAttribute('data-position', 'corners');
  await balloons.evaluate((host: HTMLElement) => { host.style.display = 'none'; });
  await expect(balloons).toHaveAttribute('data-motion', 'paused');
  await balloons.evaluate((host: HTMLElement) => { host.style.display = ''; });
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
  await openAlbum(page);
  await expect(page.locator('.balloon-fallback--left')).toBeVisible();
  await expect(page.locator('.balloon-fallback--right')).toBeVisible();
  await expect(page.locator('#birthday-balloons')).toHaveAttribute('data-renderer', 'fallback');
  await visit(page, 3);
  await page.getByRole('button', { name: 'Krakow', exact: true }).click();
  await centered(page, 4);
});

test('all 34 photos and one video retain their own proportions at every screen size', async ({ page, request }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(route);
  await openAlbum(page);
  const originals = page.locator('.photo-slot:not([data-clone])');
  await expect(originals).toHaveCount(memoryCount);
  await expect(originals.locator('img')).toHaveCount(34);
  await expect(originals.locator('video')).toHaveCount(1);
  // There is exactly one frame for each memory, with alternating finishes.
  await expect(page.locator('[data-clone]')).toHaveCount(0);
  for (const slot of await page.locator('.photo-slot').all()) {
    const index = Number(await slot.getAttribute('data-photo-index'));
    const finish = index % 2 === 0 ? 'rococo' : 'laurel';
    await expect(slot.locator('button')).toHaveAttribute('data-frame', finish);
    await expect(slot.locator('.frame-corner')).toHaveCount(4);
  }
  for (const finish of ['rococo', 'laurel']) {
    for (const part of ['rail', 'corner', 'crest']) {
      const asset = await request.get(`/justyna34/frames/${finish}-${part}.svg`);
      expect(asset.ok()).toBeTruthy();
      expect(asset.headers()['content-type']).toContain('image/svg+xml');
    }
  }
  const media = await page.locator('#birthday-data').evaluate((data) => JSON.parse(data.textContent!));
  for (const item of media) {
    expect((await request.get(item.photo)).ok()).toBeTruthy();
    if (item.video) expect((await request.get(item.video)).ok()).toBeTruthy();
  }
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(originals.first().locator('button')).toHaveCSS('border-top-width', width <= 650 ? '28px' : '38px');
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    await centered(page, 0);
    const ratios = await originals.locator('.photo-window').evaluateAll((windows) => windows.map((window) => {
      const media = window.querySelector('img, video')!;
      const bounds = window.getBoundingClientRect();
      return {
        expected: Number(media.getAttribute('width')) / Number(media.getAttribute('height')),
        actual: bounds.width / bounds.height,
        fit: getComputedStyle(media).objectFit,
        transform: getComputedStyle(media).transform,
      };
    }));
    for (const ratio of ratios) {
      expect(Math.abs(ratio.actual - ratio.expected)).toBeLessThan(.002);
      expect(ratio.fit).toBe('contain');
      expect(ratio.transform).toBe('none');
    }
    await expect(page.locator('.photo-caption')).toHaveCount(0);
    await expect(page.locator('#question-0 h2')).toBeVisible();
    await expect(page.locator('.question-backdrop')).toHaveCSS('mask-image', /linear-gradient/);
    const stageHeight = await page.locator('.photo-stage').evaluate((stage) => stage.clientHeight);
    await page.keyboard.press('ArrowRight');
    await centered(page, 1);
    expect(await page.locator('.photo-stage').evaluate((stage) => stage.clientHeight)).toBe(stageHeight);
    await page.screenshot({ path: `test-results/justyna34-landscape-${width}.png`, fullPage: true });
    await page.keyboard.press('ArrowLeft');
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const index of [3, 17, 34]) {
    await visit(page, index);
    await expect.poll(() => currentPhoto(page).locator('img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBeTruthy();
    expect((await currentPhoto(page).boundingBox())!.height).toBeLessThan((await page.locator('.photo-stage').boundingBox())!.height);
    await page.screenshot({ path: `test-results/justyna34-story-${index + 1}-mobile.png`, fullPage: true });
  }
});

test('video autoplays muted inline, pauses away, and has controls when enlarged', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route);
  await openAlbum(page);
  const video = page.locator('.photo-slot:not([data-clone]) video');
  // No video download on the landing photo.
  await expect(video).not.toHaveAttribute('src');
  for (let index = 1; index <= videoIndex; index++) await page.keyboard.press('ArrowRight');
  await centered(page, videoIndex);
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => !v.paused && v.currentTime > 0)).toBeTruthy();
  expect(await video.evaluate((v: HTMLVideoElement) => v.muted && v.playsInline && v.loop)).toBeTruthy();
  expect(await video.evaluate((v: HTMLVideoElement) => v.videoWidth / v.videoHeight)).toBeCloseTo(720 / 1280);
  await page.keyboard.press('ArrowRight');
  await centered(page, videoIndex + 1);
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBeTruthy();
  await page.keyboard.press('ArrowLeft');
  await centered(page, videoIndex);
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => !v.paused)).toBeTruthy();
  await currentPhoto(page).locator('button').click();
  const enlarged = page.locator('#enlarged-video');
  await expect(enlarged).toBeVisible();
  await expect(page.locator('#enlarged-photo')).toBeHidden();
  await expect.poll(() => enlarged.evaluate((v: HTMLVideoElement) => !v.paused && v.currentTime > 0)).toBeTruthy();
  expect(await enlarged.evaluate((v: HTMLVideoElement) => v.muted && v.controls && v.playsInline)).toBeTruthy();
  expect(await video.evaluate((v: HTMLVideoElement) => v.paused)).toBeTruthy();
  await page.screenshot({ path: 'test-results/justyna34-video-mobile.png' });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  expect(await enlarged.evaluate((v: HTMLVideoElement) => v.paused)).toBeTruthy();
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => !v.paused)).toBeTruthy();
  // Playback still stops if the stage is moved outside the viewport.
  await page.locator('.photo-stage').evaluate((stage: HTMLElement) => { stage.style.transform = 'translateY(-110vh)'; });
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBeTruthy();
  await page.locator('.photo-stage').evaluate((stage: HTMLElement) => { stage.style.transform = ''; });
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => !v.paused)).toBeTruthy();
});

test('intro centers the title and arrow, then releases the viewport to the album', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open your birthday memories' })).toBeVisible();
  await expect(page.locator('.album')).toBeHidden();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#birthday')).not.toHaveClass(/is-started/);
  const title = (await page.locator('h1').boundingBox())!;
  const arrow = (await page.locator('.intro-next').boundingBox())!;
  expect(Math.abs(title.x + title.width / 2 - 195)).toBeLessThan(2);
  expect(Math.abs(title.y + title.height / 2 - 422)).toBeLessThan(40);
  expect(arrow.y).toBeGreaterThan(title.y + title.height);
  await page.screenshot({ path: 'test-results/justyna34-intro-mobile.png' });
  await openAlbum(page);
  await expect(page.locator('.birthday-heading')).toBeHidden();
  await expect(page.locator('#birthday-balloons')).toHaveAttribute('data-position', 'corners');
  await expect(page.locator('#birthday-balloons')).toHaveAttribute('data-motion', 'running');
  await expect(currentPhoto(page).locator('button')).toBeFocused();
  await page.screenshot({ path: 'test-results/justyna34-open-mobile.png' });
});

test('captions overlay the photos without resizing them and keep all options on screen', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(route);
  await openAlbum(page);
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 667 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    await visit(page, 0);
    const originalFrames = await page.locator('.photo-surface').evaluateAll((frames) => frames.map((frame) => {
      const box = frame.getBoundingClientRect();
      return { width: box.width, height: box.height };
    }));
    const stageHeight = await page.locator('.photo-stage').evaluate((stage) => stage.clientHeight);
    let overlaps = 0;
    for (let index = 0; index < memoryCount; index++) {
      await visit(page, index);
      const layout = await page.evaluate(() => {
        const frame = document.querySelector('.photo-slot.is-current button')!.getBoundingClientRect();
        const panel = document.querySelector('.question-space')!.getBoundingClientRect();
        const question = document.querySelector('.question:not([hidden])')!;
        const text = question.querySelector('h2')!.getBoundingClientRect();
        const options = Array.from(question.querySelectorAll('.answer')).map((button) => {
          const box = button.getBoundingClientRect();
          return { top: box.top, bottom: box.bottom, height: box.height };
        });
        return { width: frame.width, height: frame.height, top: frame.top, bottom: frame.bottom, left: frame.left, right: frame.right, panelTop: panel.top, panelBottom: panel.bottom, textTop: text.top, textBottom: text.bottom, options, scrollHeight: document.documentElement.scrollHeight, scrollWidth: document.documentElement.scrollWidth };
      });
      expect(layout.scrollHeight).toBe(viewport.height);
      expect(layout.scrollWidth).toBe(viewport.width);
      expect(layout.top).toBeGreaterThan(8);
      expect(layout.left).toBeGreaterThan(8);
      expect(layout.right).toBeLessThan(viewport.width - 8);
      expect(layout.bottom).toBeLessThan(viewport.height);
      expect(layout.width).toBeCloseTo(originalFrames[index].width, 1);
      expect(layout.height).toBeCloseTo(originalFrames[index].height, 1);
      expect(await page.locator('.photo-stage').evaluate((stage) => stage.clientHeight)).toBe(stageHeight);
      if (layout.bottom > layout.panelTop) overlaps++;
      expect(layout.textTop).toBeGreaterThan(0);
      expect(layout.textBottom).toBeLessThan(viewport.height);
      expect(layout.panelBottom).toBe(viewport.height);
      for (const option of layout.options) {
        expect(option.top).toBeGreaterThan(layout.textBottom);
        expect(option.bottom).toBeLessThan(viewport.height);
        expect(option.height).toBeGreaterThanOrEqual(44);
      }
      if ([0, 3, 17, 34].includes(index)) await page.screenshot({ path: `test-results/justyna34-fit-${viewport.width}x${viewport.height}-${index}.png` });
    }
    expect(overlaps).toBeGreaterThan(0);
    // Both layers share viewport coordinates and colors, so the fade has no seam.
    const backgrounds = await page.locator('.ambient-light').evaluateAll((layers) => layers.map((layer) => {
      const box = layer.getBoundingClientRect();
      return { top: box.top, left: box.left, width: box.width, height: box.height, colors: Array.from(layer.children).map((wash) => getComputedStyle(wash).backgroundImage) };
    }));
    expect(backgrounds[1]).toEqual(backgrounds[0]);
  }
});
