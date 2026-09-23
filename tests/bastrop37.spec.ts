import { test, expect } from '@playwright/test';

test('riding responds, slides charge, release bursts, and pause freezes simulation', async ({page}) => {
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/bastrop37/');
  await page.getByRole('button',{name:'START RIDING'}).click();
  const game=page.locator('#game');
  await expect(game).toHaveAttribute('data-state','playing');
  const before=Number(await game.getAttribute('data-x'));
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(180);await page.keyboard.up('ArrowRight');
  expect(Number(await game.getAttribute('data-x'))).toBeGreaterThan(before+10);
  await page.keyboard.down('Space');await page.waitForTimeout(600);
  expect(Number(await game.getAttribute('data-charge'))).toBeGreaterThan(.18);
  await page.keyboard.up('Space');
  await expect.poll(async()=>Number(await game.getAttribute('data-boost'))).toBeGreaterThan(.2);
  await page.keyboard.press('KeyP');await expect(game).toHaveAttribute('data-state','paused');
  const frozen=await game.getAttribute('data-distance');await page.waitForTimeout(200);
  expect(await game.getAttribute('data-distance')).toBe(frozen);
  await page.getByRole('button',{name:'RESUME RIDE'}).click();
  await page.keyboard.press('KeyR');await expect(game).toHaveAttribute('data-state','playing');
  expect(Number(await game.getAttribute('data-charge'))).toBe(0);
  await page.screenshot({path:'test-results/bastrop37-riding.png'});
  expect(errors).toEqual([]);
});

test('traffic collision offers immediate retry and assets all load', async ({page})=>{
  await page.addInitScript(()=>{Math.random=()=>.5;});
  await page.goto('/bastrop37/');
  await page.getByRole('button',{name:'START RIDING'}).click();
  await expect(page.locator('#game')).toHaveAttribute('data-state','crashed',{timeout:15000});
  await page.getByRole('button',{name:'RIDE AGAIN'}).click();
  await expect(page.locator('#game')).toHaveAttribute('data-state','playing');
  await page.goto('/bastrop37/assets/');
  expect(await page.locator('.asset img').evaluateAll(imgs=>imgs.every(img=>(img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth>0))).toBe(true);
  await page.screenshot({path:'test-results/bastrop37-assets.png',fullPage:true});
});

test('mobile multi-touch steers while sliding without page overflow',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage();await page.goto('/bastrop37/');
  await page.getByRole('button',{name:'START RIDING'}).tap();
  const touch=await context.newCDPSession(page);
  const steer=await page.getByRole('button',{name:'Steer right'}).boundingBox();
  const slide=await page.locator('.slide-control').boundingBox();
  const before=Number(await page.locator('#game').getAttribute('data-x'));
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:steer!.x+20,y:steer!.y+15,id:1},{x:slide!.x+20,y:slide!.y+15,id:2}]});
  await page.waitForTimeout(550);
  expect(Number(await page.locator('#game').getAttribute('data-charge'))).toBeGreaterThan(.15);
  expect(Number(await page.locator('#game').getAttribute('data-x'))).toBeGreaterThan(before+20);
  await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect.poll(async()=>Number(await page.locator('#game').getAttribute('data-boost'))).toBeGreaterThan(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);
  await page.screenshot({path:'test-results/bastrop37-mobile.png',fullPage:true});
  await context.close();
});

test('homepage portal navigates to the isolated game',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
  await page.getByRole('link',{name:'AFTERHOURS'}).click();
  await expect(page).toHaveURL(/\/bastrop37\//);
  await expect(page.getByRole('button',{name:'START RIDING'})).toBeEnabled();
  await page.screenshot({path:'test-results/bastrop37-title.png'});
});
