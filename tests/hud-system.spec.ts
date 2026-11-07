import { test, expect, type Page } from '@playwright/test';
import { enterLockdown } from './helpers/lockdown';

async function ride(page: Page) {
  await page.clock.install();
  await page.goto('/bastrop37/');
  await page.locator('#start').click();
  for (let i = 0; i < 5; i++) await page.keyboard.press('Enter');
  await page.clock.runFor(64);
}

function overlaps(a: {x:number;y:number;width:number;height:number}, b: typeof a) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

test('red velocity meter follows acceleration and boost; pointer controls return keyboard steering', async ({ page }) => {
  await ride(page);
  const speed = page.locator('#speed');
  const before = Number(await speed.textContent());
  await page.keyboard.down('ArrowUp'); await page.clock.runFor(250); await page.keyboard.up('ArrowUp');
  expect(Number(await speed.textContent())).toBeGreaterThan(before);
  const reading = await page.evaluate(() => ({
    speed: Number(document.querySelector('#speed')!.textContent),
    meter: Number(document.querySelector('#speed-meter')!.getAttribute('aria-valuenow')),
    fill: Number((document.querySelector('#speed-meter') as HTMLElement).style.getPropertyValue('--speed-fill')),
  }));
  expect(reading.meter).toBe(reading.speed);
  expect(reading.fill).toBeCloseTo(reading.speed / 600);
  await expect(speed).toHaveCSS('color', 'rgb(255, 75, 85)');
  expect(await speed.evaluate(el => getComputedStyle(el).fontFamily)).toContain('Share Tech Mono');
  const turbo = page.locator('#turbo-trigger');
  await turbo.click(); await page.clock.runFor(100);
  await expect(turbo).toHaveAttribute('data-state', 'active');
  await expect(turbo).toBeDisabled();
  await expect(page.locator('#game')).toBeFocused();
  const x = Number(await page.locator('#game').getAttribute('data-x'));
  await page.keyboard.down('ArrowRight'); await page.clock.runFor(64); await page.keyboard.up('ArrowRight');
  expect(Number(await page.locator('#game').getAttribute('data-x'))).toBeGreaterThan(x);
  await page.locator('#mute').click();
  await expect(page.locator('#game')).toBeFocused();
});

test('terminal traps focus, Escape cancels reset and a pause ignores incidental Enter', async ({ page }) => {
  await ride(page);
  await page.keyboard.press('KeyP'); await page.clock.runFor(32);
  await expect(page.locator('#overlay')).toBeFocused();
  await page.keyboard.press('Enter'); await page.clock.runFor(100);
  await expect(page.locator('#game')).toHaveAttribute('data-state', 'paused');
  await page.keyboard.press('Tab'); await expect(page.locator('#resume')).toBeFocused();
  await page.keyboard.press('Shift+Tab'); await expect(page.locator('.site-link')).toBeFocused();
  await page.locator('#new-game').click();
  await expect(page.locator('#confirm-new-game')).toBeFocused();
  await page.keyboard.press('Shift+Tab'); await expect(page.locator('#cancel-new-game')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#reset-confirm')).toBeHidden();
  await expect(page.locator('#new-game')).toBeFocused();
  await expect(page.locator('#game')).toHaveAttribute('data-state', 'paused');
  await page.locator('#resume').click(); await page.clock.runFor(32);
  await expect(page.locator('#game')).toBeFocused();
});

for (const [width, height] of [[320,568],[390,844],[844,390],[1024,768]]) {
  test(`HUD targets stay separate at ${width} × ${height}`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await ride(page);
    const panels = ['.mission', '.mission-meter', '.instruments', '.combat-status', '#gesture-hint'];
    const boxes = [];
    for (const selector of panels) {
      const box = (await page.locator(selector).boundingBox())!;
      expect(box, selector).not.toBeNull();
      expect(box.x, selector).toBeGreaterThanOrEqual(0);
      expect(box.y, selector).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width, selector).toBeLessThanOrEqual(width);
      expect(box.y + box.height, selector).toBeLessThanOrEqual(height);
      boxes.push(box);
    }
    for (let a=0;a<boxes.length;a++) for(let b=a+1;b<boxes.length;b++) expect(overlaps(boxes[a],boxes[b]), `${panels[a]} overlaps ${panels[b]}`).toBe(false);
    expect(await page.locator('#turbo-trigger').evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
    await page.screenshot({path:`test-results/hud-${width}-action.png`});
    // Exercise earned story records as well as the opening's short dialogue.
    await enterLockdown(page);
    await page.locator('#advance').click(); await page.clock.runFor(250);
    await expect(page.locator('#comms')).toHaveAttribute('data-speaker','system');
    await page.screenshot({path:`test-results/hud-${width}-record.png`});
    await page.locator('#advance').click(); await page.clock.runFor(250);
    const card = (await page.locator('#comms').boundingBox())!;
    const instruments = (await page.locator('.instruments').boundingBox())!;
    expect(overlaps(card, instruments)).toBe(false);
    expect(overlaps((await page.locator('.mission').boundingBox())!, instruments)).toBe(false);
    expect(card.y).toBeGreaterThanOrEqual(0);
    expect(card.y+card.height).toBeLessThanOrEqual(height);
    const words = (await page.locator('#dialogue-text').boundingBox())!;
    expect(words.y + words.height).toBeLessThanOrEqual(card.y + card.height);
    await page.screenshot({path:`test-results/hud-${width}-long-story.png`});
    await context.close();
  });
}

test('reduced motion suppresses receiver and instrument animation', async ({ page }) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/bastrop37/');
  await page.locator('#start').click();
  await expect(page.locator('#comms')).toBeVisible();
  expect(await page.locator('#comms').evaluate(el => el.getAnimations({subtree:true}).length)).toBe(0);
  await expect(page.locator('#speed-meter > span')).toHaveCSS('transition-duration','0s');
});

test('earned overdrive can be activated from the HUD at zero ordinary energy', async ({ page }) => {
  await page.clock.install();
  await page.goto('/bastrop37/?fixture=m2');
  await page.locator('#start').click();
  await expect(page.locator('#game')).toHaveAttribute('data-beat','L2.03');
  await page.clock.runFor(32);
  expect(Number(await page.locator('#game').getAttribute('data-charge'))).toBeLessThan(.05);
  await page.getByRole('button', {name:'Activate overdrive'}).click();
  await page.clock.runFor(100);
  await expect(page.locator('#game')).toHaveAttribute('data-overdrive-active','true');
  await expect(page.locator('#turbo-trigger')).toHaveAttribute('data-state','active');
  await expect(page.locator('#turbo-trigger')).toBeDisabled();
});
