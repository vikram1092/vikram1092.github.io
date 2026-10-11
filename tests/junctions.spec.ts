import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { deliverySave, lockdownSave, type ReleaseSave } from '../src/scripts/bastrop37/save';
import { DELIVERY_DIALOGUE } from '../src/scripts/bastrop37/delivery-content';

test.use({ launchOptions: { executablePath: process.env.CHROME_PATH || undefined, args: ['--no-sandbox','--disable-gpu'] } });
async function enter(page: Page, chapter: 'delivery' | 'lockdown') {
  await page.clock.install();
  const earned = JSON.parse(readFileSync('docs/bastrop37/phase3/m5/earned-completion-save.json','utf8')) as ReleaseSave;
  const save = chapter === 'delivery'
    ? deliverySave('CP-L1-SERVICE', [...DELIVERY_DIALOGUE['L1.01'],...DELIVERY_DIALOGUE['L1.03']])
    : lockdownSave('CP-L4-ESCORT',earned.log.filter(e=>e.id.slice(0,5)<'L4.02'),earned.records.filter(e=>e.id.slice(0,5)<'L4.02'),earned.history.filter(e=>e.id.slice(0,5)<'L4.02'));
  await page.addInitScript(save=>localStorage.setItem('bastrop37-campaign-v1',JSON.stringify(save)),save);
  await page.goto('/bastrop37/'); await page.locator('#continue-save').click(); await page.clock.runFor(32);
  await expect(page.locator('#game')).toHaveAttribute('data-state','playing');
}
async function until(page: Page, attribute: string, value: string, limit = 100) {
  for (let i=0;i<limit;i++) {
    if (await page.locator('#game').getAttribute(attribute) === value) return;
    await page.clock.runFor(400);
    await expect(page.locator('#game')).toHaveAttribute('data-state','playing');
  }
  throw new Error(`${attribute} did not reach ${value}: ${await page.locator('#game').evaluate(el=>JSON.stringify((el as HTMLElement).dataset))}`);
}

test('Delivery main road returns to its fork, then the right road reaches intake', async ({ page }) => {
  test.setTimeout(180000);
  await enter(page,'delivery'); const game = page.locator('#game');
  await page.clock.runFor(6000);
  await page.screenshot({path:'test-results/delivery-fork-desktop.png'});
  await until(page,'data-junction-phase','return');
  await expect(game).toHaveAttribute('data-gate-passed','false');
  await expect(game).toHaveAttribute('data-approach-passed','false');
  await page.keyboard.press('KeyP'); const frozen = await game.getAttribute('data-junction-position');
  await page.clock.runFor(3000); expect(await game.getAttribute('data-junction-position')).toBe(frozen);
  await page.locator('#resume').click();
  await until(page,'data-junction-phase','approach');
  await page.keyboard.down('ArrowRight'); await page.clock.runFor(1400); await page.keyboard.up('ArrowRight');
  await until(page,'data-junction-phase','exit');
  await expect(game).toHaveAttribute('data-gate-passed','true');
  await expect(game).toHaveAttribute('data-approach-passed','false');
  await until(page,'data-beat','L1.05');
  await expect(game).toHaveAttribute('data-junction-phase','complete');
  await expect(page.locator('#dialogue-text')).toHaveText(DELIVERY_DIALOGUE['L1.05'][0].text);
});

for (const chapter of ['delivery','lockdown'] as const) {
  test(`${chapter}: phone steers onto the right road and rides to the story destination`, async ({page}) => {
    test.setTimeout(180000); await page.setViewportSize({width:390,height:844});
    const errors: string[]=[]; page.on('pageerror',error=>errors.push(error.message));
    await enter(page,chapter); const game=page.locator('#game');
    const touch=await page.context().newCDPSession(page); let fingerY=460;
    const point=(type:'touchStart'|'touchMove',x:number,y=fingerY)=>touch.send('Input.dispatchTouchEvent',{type,touchPoints:[{x,y,id:1}]});
    const release=()=>touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await point('touchStart',195); await point('touchMove',315);
    if(chapter==='lockdown') {
      for(let i=0;i<120&&await game.getAttribute('data-bus-safe')!=='true';i++) {
        const cars=JSON.parse(await game.getAttribute('data-traffic')||'[]') as {kind:string;z:number}[];
        if(cars.some(car=>car.kind==='drone'&&car.z<75&&car.z>0)&&Number(await game.getAttribute('data-spike-cooldown'))===0) {
          fingerY+=55; await point('touchMove',315); fingerY-=15; await point('touchMove',315);
        }
        await page.clock.runFor(150); await expect(game).toHaveAttribute('data-state','playing');
      }
      await expect(game).toHaveAttribute('data-bus-safe','true');
      // A junction retry preserves the bus safety earned in this session.
      await release(); await page.locator('#pause').click(); await page.locator('#retry').click(); await page.clock.runFor(32);
      await expect(game).toHaveAttribute('data-bus-safe','true');
      await expect(game).toHaveAttribute('data-ramp-passed','false');
      await point('touchStart',195); await point('touchMove',315);
    }
    await page.clock.runFor(4500);
    await page.screenshot({path:`test-results/${chapter}-fork-phone.png`});
    await until(page,'data-junction-phase','exit');
    await expect(game).toHaveAttribute(chapter==='delivery'?'data-approach-passed':'data-ramp-passed','false');
    await page.clock.runFor(4000);
    await page.screenshot({path:`test-results/${chapter}-turn-phone.png`});
    await until(page,'data-beat',chapter==='delivery'?'L1.05':'L4.04');
    await release();
    await expect(game).toHaveAttribute('data-junction-phase','complete');
    await expect(page.locator('#comms')).toBeVisible();
    expect(errors).toEqual([]);
  });
}
