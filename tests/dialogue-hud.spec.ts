import { test, expect, type Page } from '@playwright/test';

async function start(page: Page) {
  await page.clock.install();
  await page.goto('/bastrop37/');
  await page.locator('#start').click();
  await page.clock.runFor(32);
  await expect(page.locator('#comms')).toBeVisible();
}
async function line(page: Page, id: string) {
  await page.clock.runFor(32);
  await expect(page.locator('#game')).toHaveAttribute('data-dialogue-id', id);
}

for (const mobile of [false, true]) {
  test.describe(mobile ? 'mobile whole dialogue card' : 'desktop whole dialogue card', () => {
    test.use(mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 } });
    test('header, words, portrait, outer rim and footer each advance once; checkpoint reload survives', async ({ page }) => {
      await start(page);
      const card = page.locator('#advance');
      await expect(card).toHaveJSProperty('tagName', 'BUTTON');
      await expect(card).toHaveAccessibleName('Continue dialogue');
      await expect(card).toHaveAccessibleDescription(/MAYOR VLAD.*You have the module/);
      expect(await card.locator('button,a,input,select,textarea,[role=button]').count()).toBe(0);
      // Every visible card surface is owned by this one native activation target.
      for (const selector of ['#channel', '#dialogue-text', '#portrait']) {
        expect(await page.locator(selector).evaluate(el => el.closest('button')?.id)).toBe('advance');
      }
      async function activate(selector: string) {
        if (mobile) await page.locator(selector).tap(); else await page.locator(selector).click();
      }
      await activate('#channel'); await line(page, 'L1.01-02');
      await activate('#dialogue-text'); await line(page, 'L1.01-03');
      await activate('#portrait'); await line(page, 'L1.01-04');
      let box = (await page.locator('#comms').boundingBox())!;
      if (mobile) await page.touchscreen.tap(box.x + 1, box.y + box.height / 2);
      else await page.mouse.click(box.x + 1, box.y + box.height / 2);
      await line(page, 'L1.01-05');
      box = (await card.boundingBox())!;
      if (mobile) await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height - 12);
      else await page.mouse.click(box.x + box.width / 2, box.y + box.height - 12);
      await page.clock.runFor(32);
      await expect(page.locator('#game')).toHaveAttribute('data-beat', 'L1.02');
      await expect(page.locator('#comms')).toBeHidden();
      await expect(page.locator('#game')).toHaveAttribute('data-checkpoint', 'CP-L1-ACTION');
      await page.reload(); await page.locator('#continue-save').click(); await page.clock.runFor(32);
      await expect(page.locator('#game')).toHaveAttribute('data-beat', 'L1.02');
      await expect(page.locator('#comms')).toBeHidden();
    });
  });
}

test('whole-card keyboard activation, slow reading and pause cannot double advance', async ({ page }) => {
  await start(page);
  const card = page.locator('#advance');
  await card.focus();
  await expect(card).toBeFocused();
  await page.keyboard.down('Enter'); await page.keyboard.down('Enter'); await page.keyboard.down('Enter'); await page.keyboard.up('Enter');
  await line(page, 'L1.01-02');
  await card.focus();
  await page.keyboard.down('Space'); await page.keyboard.down('Space'); await page.keyboard.up('Space');
  await line(page, 'L1.01-03');
  await page.clock.fastForward(60000); await page.clock.runFor(32);
  await line(page, 'L1.01-03');
  await expect(page.locator('#game')).toHaveAttribute('data-route', '0.0');
  await page.locator('#pause').click(); await page.clock.runFor(32);
  await expect(card).toBeHidden();
  await page.locator('#resume').click(); await line(page, 'L1.01-03');
});

test('mobile steering outside the dialogue card never acknowledges a line', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const touchPage = await context.newPage();
  await start(touchPage);
  const key = touchPage.locator('[data-key=ArrowRight]');
  const before = Number(await touchPage.locator('#game').getAttribute('data-x'));
  const box = (await key.boundingBox())!;
  const cdp = await context.newCDPSession(touchPage);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2, id: 1 }] });
  await touchPage.clock.runFor(200);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await line(touchPage, 'L1.01-01');
  expect(Number(await touchPage.locator('#game').getAttribute('data-x'))).toBeGreaterThan(before);
  await context.close();
});
