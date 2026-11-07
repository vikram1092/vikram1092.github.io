import { test, expect, type Page } from '@playwright/test';
import { enterLockdown } from './helpers/lockdown';
import { ridingGuidance, urgentFeedback } from '../src/scripts/bastrop37/hud-presentation';
import type { HudView } from '../src/scripts/bastrop37/contracts';

async function ride(page: Page) {
  await page.clock.install(); await page.goto('/bastrop37/');
  await page.locator('#start').click();
  for (let i=0;i<5;i++) await page.keyboard.press('Enter');
  await page.clock.runFor(64);
}
function overlaps(a: {x:number;y:number;width:number;height:number}, b: typeof a) {
  return a.x < b.x+b.width && a.x+a.width > b.x && a.y < b.y+b.height && a.y+a.height > b.y;
}

test('the bare red speed number follows the bike and boost preserves steering', async ({ page }) => {
  await ride(page);
  const speed = page.locator('#speed'), before = Number(await speed.textContent());
  await page.keyboard.down('ArrowUp'); await page.clock.runFor(250); await page.keyboard.up('ArrowUp');
  expect(Number(await speed.textContent())).toBeGreaterThan(before);
  const reading = await page.evaluate(() => ({ speed:Number(document.querySelector('#speed')!.textContent), meter:Number(document.querySelector('#velocity')!.getAttribute('aria-valuenow')) }));
  expect(reading.meter).toBe(reading.speed);
  await expect(speed).toHaveCSS('color','rgb(255, 68, 82)');
  await expect(page.locator('#velocity')).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
  await expect(page.locator('#velocity')).toHaveCSS('border-top-width','0px');
  const turbo = page.locator('#turbo-trigger');
  await turbo.click(); await page.clock.runFor(100);
  await expect(turbo).toHaveAttribute('data-state','active'); await expect(turbo).toBeDisabled();
  await expect(page.locator('#game')).toBeFocused();
  const x = Number(await page.locator('#game').getAttribute('data-x'));
  await page.keyboard.down('ArrowRight'); await page.clock.runFor(64); await page.keyboard.up('ArrowRight');
  expect(Number(await page.locator('#game').getAttribute('data-x'))).toBeGreaterThan(x);
});

test('pause holds details, audio and focus while Escape cancels a reset without resuming', async ({ page }) => {
  await ride(page);
  await expect(page.locator('#mute')).toBeHidden();
  await page.keyboard.press('KeyP'); await page.clock.runFor(32);
  await expect(page.locator('#overlay')).toBeFocused();
  await page.keyboard.press('Enter'); await page.clock.runFor(100);
  await expect(page.locator('#game')).toHaveAttribute('data-state','paused');
  await page.keyboard.press('Tab'); await expect(page.locator('#resume')).toBeFocused();
  await page.keyboard.press('Shift+Tab'); await expect(page.locator('.site-link')).toBeFocused();
  await page.locator('#ride-details summary').click();
  await expect(page.locator('#objective')).toHaveText('DELIVER THE MODULE');
  await expect(page.locator('#charge-value')).toContainText('%');
  await page.locator('#mute').click(); await expect(page.locator('#mute')).toHaveAttribute('aria-pressed','true');
  await page.locator('#new-game').click(); await expect(page.locator('#confirm-new-game')).toBeFocused();
  await page.keyboard.press('Shift+Tab'); await expect(page.locator('#cancel-new-game')).toBeFocused();
  await page.keyboard.press('Escape'); await expect(page.locator('#reset-confirm')).toBeHidden();
  await expect(page.locator('#new-game')).toBeFocused();
  await expect(page.locator('#game')).toHaveAttribute('data-state','paused');
  await page.locator('#resume').click(); await page.clock.runFor(32);
  await expect(page.locator('#game')).toBeFocused();
});

for (const [width,height] of [[320,568],[390,844],[844,390],[1024,768],[1440,900]]) {
  test(`road visibility budget at ${width} × ${height}`, async ({ browser }) => {
    const mobile = width !== 1440;
    const context = await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile});
    const page = await context.newPage(); const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
    await ride(page);
    // The full-width road between the first 88 and last 100 pixels is HUD-free.
    const road = {x:0,y:88,width,height:height-188};
    const controls = ['#guidance','#velocity','.boost-control','#pause'];
    const boxes=[]; let area=0;
    for(const selector of controls){
      if (!await page.locator(selector).isVisible()) continue;
      const box=(await page.locator(selector).boundingBox())!;
      expect(box,selector).not.toBeNull();
      expect(box.x,selector).toBeGreaterThanOrEqual(0);expect(box.y,selector).toBeGreaterThanOrEqual(0);
      expect(box.x+box.width,selector).toBeLessThanOrEqual(width);expect(box.y+box.height,selector).toBeLessThanOrEqual(height);
      expect(overlaps(box,road),`${selector} covers the road`).toBe(false);
      area+=box.width*box.height;boxes.push(box);
    }
    expect(area/(width*height),'HUD footprint exceeds 14% of the screen').toBeLessThan(.14);
    for(let a=0;a<boxes.length;a++)for(let b=a+1;b<boxes.length;b++)expect(overlaps(boxes[a],boxes[b])).toBe(false);
    await expect(page.locator('#bike-health')).toBeHidden();
    await expect(page.locator('#ability-recovery')).toBeHidden();
    await expect(page.locator('#task-progress')).toBeHidden();
    await expect(page.locator('#feedback')).toBeHidden();
    await expect(page.locator('#comms')).toBeHidden();
    const hitTargets=await page.evaluate(({width,height})=>[.25,.5,.75].flatMap(x=>[.3,.5,.7].map(y=>document.elementFromPoint(width*x,height*y)?.id)),{width,height});
    expect(hitTargets.every(id=>id==='game'),'road gesture was intercepted').toBe(true);
    expect((await page.locator('#turbo-trigger').boundingBox())!.height).toBeGreaterThanOrEqual(44);
    // Skyline pixels must extend into the previously letterboxed top region.
    const variedSky=await page.locator('#game').evaluate((node)=>{
      const canvas=node as HTMLCanvasElement, ctx=canvas.getContext('2d')!;
      const row=ctx.getImageData(Math.floor(canvas.width*.2),Math.floor(canvas.height*.1),Math.floor(canvas.width*.6),1).data;
      const colors=new Set<string>();for(let i=0;i<row.length;i+=16)colors.add(`${row[i]},${row[i+1]},${row[i+2]}`);
      return colors.size;
    });
    expect(variedSky).toBeGreaterThan(8);
    await page.screenshot({path:`test-results/road-first-${width}-ride.png`});
    await enterLockdown(page); await page.locator('#advance').click(); await page.clock.runFor(250);
    await expect(page.locator('#comms')).toHaveAttribute('data-speaker','system');
    await expect(page.locator('#riding-hud')).toBeHidden();
    await page.locator('#advance').click(); await page.clock.runFor(250);
    const caption=(await page.locator('#comms').boundingBox())!, words=(await page.locator('#dialogue-text').boundingBox())!;
    expect(caption.y).toBeGreaterThanOrEqual(0);expect(caption.y+caption.height).toBeLessThanOrEqual(height);
    expect(words.y+words.height).toBeLessThanOrEqual(caption.y+caption.height);
    if(width<height)expect(caption.y-Number(await page.locator('#game').getAttribute('data-rider-bottom'))).toBeGreaterThan(20);
    await page.screenshot({path:`test-results/road-first-${width}-subtitles.png`});
    expect(errors).toEqual([]);await context.close();
  });
}

test('reduced motion disables subtitle and charge animation',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/bastrop37/');await page.locator('#start').click();
  await expect(page.locator('#comms')).toBeVisible();
  expect(await page.locator('#comms').evaluate(el=>el.getAnimations({subtree:true}).length)).toBe(0);
  await expect(page.locator('#boost-charge')).toHaveCSS('transition-duration','0s');
});

test('earned overdrive works from the single boost control at zero energy',async({page})=>{
  await page.clock.install();await page.goto('/bastrop37/?fixture=m2');await page.locator('#start').click();
  await expect(page.locator('#game')).toHaveAttribute('data-beat','L2.03');await page.clock.runFor(32);
  expect(Number(await page.locator('#game').getAttribute('data-charge'))).toBeLessThan(.05);
  await page.getByRole('button',{name:'Activate overdrive'}).click();await page.clock.runFor(100);
  await expect(page.locator('#game')).toHaveAttribute('data-overdrive-active','true');
  await expect(page.locator('#turbo-trigger')).toHaveAttribute('data-state','active');await expect(page.locator('#turbo-trigger')).toBeDisabled();
});

test('minimal guidance preserves urgent mission decisions and suppresses routine chatter',()=>{
  const view={routeCue:'NEXT · LEFT · 230 KM/H · BRAKE / SLIDE'} as HudView;
  expect(ridingGuidance(view)).toMatchObject({text:'Left ahead · 230 km/h',arrow:'↰'});
  expect(ridingGuidance({...view,connection:{kind:'upload',relay:'B',state:'out-of-range',progress:.4}}).text).toBe('Return to upload B');
  expect(ridingGuidance({...view,connection:{relay:'A',state:'in-range',progress:.2}}).text).toBe('Land inside the corridor');
  expect(ridingGuidance({...view,controller:{state:'active',progress:0}}).text).toContain('Cut');
  expect(ridingGuidance({...view,routeCue:'CONTROLLER MISSED · RIGHT SERVICE LOOP',controller:{state:'active',progress:0}}).text).toBe('Take the right service loop');
  expect(ridingGuidance({...view,routeCue:'DEFENDER AHEAD · CLEAR THE ROAD',controller:{state:'open',progress:1}}).text).toBe('Clear the drone');
  expect(ridingGuidance({...view,controller:{state:'open',progress:1},missionMeter:{label:'PUBLIC UPLOAD',detail:'CLEAR THE INTERCEPT',value:0}}).text).toBe('Clear the intercept');
  expect(ridingGuidance({...view,escort:{condition:2,inRange:false,intercept:null,busSafe:false,busProgress:.3,rampPassed:false,attackPhase:'idle'}}).text).toBe('Return to the bus');
  expect(urgentFeedback('BARRICADE · JUMP OR GO AROUND')).toContain('jump');
  expect(urgentFeedback('RIDER ON LEFT · SPIKES OR SWERVE')).toContain('left');
  for(const message of ['TOUCHDOWN','TURBO / TAKE THE GAP','CLEAN JUMP · +12 ENERGY','INTAKE EXPRESS · BRAKE BEFORE BENDS · BOOST ON EXITS'])expect(urgentFeedback(message)).toBe('');
});
