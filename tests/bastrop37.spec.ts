import { test, expect } from '@playwright/test';

test.beforeEach(async({page})=>{await page.clock.install();});

test('riding responds, slides position, turbo is deliberate, and pause freezes simulation', async ({page}) => {
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/bastrop37/');
  await page.getByRole('button',{name:'START RIDING'}).click();
  const game=page.locator('#game');
  await expect(game).toHaveAttribute('data-state','playing');
  const before=Number(await game.getAttribute('data-x'));
  await page.keyboard.down('ArrowRight');await page.clock.runFor(100);await page.keyboard.up('ArrowRight');
  expect(Number(await game.getAttribute('data-x'))).toBeGreaterThan(before+9);
  await page.keyboard.down('Shift');await page.clock.runFor(100);await page.keyboard.up('Shift');
  await expect.poll(async()=>Number(await game.getAttribute('data-boost'))).toBeGreaterThan(.2);
  await page.clock.runFor(1200);
  await page.keyboard.down('Space');await page.clock.runFor(300);
  expect(Number(await game.getAttribute('data-charge'))).toBeGreaterThan(.18);
  await page.keyboard.up('Space');
  await expect(game).toHaveAttribute('data-boost','0.00');
  await page.keyboard.press('KeyP');await expect(game).toHaveAttribute('data-state','paused');
  const frozen=await game.getAttribute('data-distance');await page.clock.runFor(200);
  expect(await game.getAttribute('data-distance')).toBe(frozen);
  await page.getByRole('button',{name:'RESUME RIDE'}).click();
  await page.keyboard.press('KeyR');await expect(game).toHaveAttribute('data-state','playing');
  expect(Number(await game.getAttribute('data-charge'))).toBe(1);
  await page.screenshot({path:'test-results/bastrop37-riding.png'});
  expect(errors).toEqual([]);
});

test('traffic collision offers immediate retry and assets all load', async ({page})=>{
  await page.addInitScript(()=>{Math.random=()=>.5;});
  await page.goto('/bastrop37/');
  await page.getByRole('button',{name:'START RIDING'}).click();
  await page.clock.runFor(8500);
  await expect(page.locator('#game')).toHaveAttribute('data-state','crashed');
  await page.getByRole('button',{name:'RIDE AGAIN'}).click();
  await expect(page.locator('#game')).toHaveAttribute('data-state','playing');
  await page.goto('/bastrop37/assets/');
  expect(await page.locator('.asset img').evaluateAll(imgs=>imgs.every(img=>(img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth>0))).toBe(true);
  await page.screenshot({path:'test-results/bastrop37-assets.png',fullPage:true});
});

test('traffic uses lane-perspective sprites and can change lanes',async({page})=>{
  await page.goto('/bastrop37/');
  await page.getByRole('button',{name:'START RIDING'}).click();
  const game=page.locator('#game');
  await expect(game).toHaveAttribute('data-traffic-sprites',/^coupe,hauler,sedan/);
  await page.clock.runFor(1400);
  await expect.poll(async()=>Number(await game.getAttribute('data-lane-changes'))).toBeGreaterThan(0);
  await expect(game).toHaveAttribute('data-traffic-sprites',/(Left|Right)/);
});

test.describe('touch layout',()=>{
 test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 test('mobile multi-touch steers while sliding without page overflow',async({page,context})=>{
  await page.goto('/bastrop37/');
  await page.getByRole('button',{name:'START RIDING'}).tap();
  const touch=await context.newCDPSession(page);
  const steer=await page.getByRole('button',{name:'Steer right'}).boundingBox();
  const slide=await page.locator('.slide-control').boundingBox();
  const before=Number(await page.locator('#game').getAttribute('data-x'));
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:steer!.x+20,y:steer!.y+15,id:1},{x:slide!.x+20,y:slide!.y+15,id:2}]});
  await page.clock.runFor(550);
  expect(Number(await page.locator('#game').getAttribute('data-charge'))).toBeGreaterThan(.15);
  expect(Number(await page.locator('#game').getAttribute('data-x'))).toBeGreaterThan(before+20);
  await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect(page.locator('#game')).toHaveAttribute('data-boost','0.00');
  await page.locator('[data-key=ShiftLeft]').tap();
  await expect.poll(async()=>Number(await page.locator('#game').getAttribute('data-boost'))).toBeGreaterThan(0);
  await page.locator('[data-key=AltLeft]').tap();
  await expect.poll(async()=>Number(await page.locator('#game').getAttribute('data-height'))).toBeGreaterThan(10);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);
  await page.screenshot({path:'test-results/bastrop37-mobile.png',fullPage:true});
 });
});

test('homepage portal navigates to the isolated game',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
  await page.getByRole('link',{name:'AFTERHOURS'}).click();
  await expect(page).toHaveURL(/\/bastrop37\//);
  await expect(page.getByRole('button',{name:'START RIDING'})).toBeEnabled();
  await page.screenshot({path:'test-results/bastrop37-title.png'});
});


test('jump launches, lands, and holding jump does not auto-repeat',async({page})=>{
  await page.addInitScript(()=>{Math.random=()=>.5;});
  await page.goto('/bastrop37/');await page.getByRole('button',{name:'START RIDING'}).click();
  const game=page.locator('#game');
  await page.keyboard.down('Alt');
  await page.clock.runFor(500);
  expect(Number(await game.getAttribute('data-height'))).toBeGreaterThan(10);
  await page.screenshot({path:'test-results/bastrop37-jump.png'});
  await page.clock.runFor(650);
  await expect(game).toHaveAttribute('data-state','playing');
  await expect(game).toHaveAttribute('data-height','0.00');
  await page.keyboard.up('Alt');
});

test('blades slice existing drones and retract on release',async({page})=>{
  await page.addInitScript(()=>{let n=0;Math.random=()=>[.5,.5,.1,.5][n++%4];});
  await page.goto('/bastrop37/');await page.getByRole('button',{name:'START RIDING'}).click();
  await page.evaluate(()=>{let n=0;Math.random=()=>[.5,.5,.1,.5][n++%4];});
  const game=page.locator('#game');await page.keyboard.down('Control');
  await page.clock.runFor(9500);
  await expect.poll(async()=>Number(await game.getAttribute('data-slices')),{timeout:12000}).toBeGreaterThan(0);
  await expect(game).toHaveAttribute('data-state','playing');
  await page.screenshot({path:'test-results/bastrop37-blades.png'});
  await page.keyboard.up('Control');
  await expect.poll(async()=>Number(await game.getAttribute('data-blades'))).toBeLessThan(.05);
});

test('escape HUD starts a scored 90-second traffic sector',async({page})=>{
  await page.addInitScript(()=>{Math.random=()=>.5;});
  await page.goto('/bastrop37/');await page.getByRole('button',{name:'START RIDING'}).click();
  const game=page.locator('#game');
  await expect(page.locator('#timer')).toHaveText('01:30.0');
  await expect(page.locator('#score')).toHaveText('000000');
  await expect(page.locator('#sector')).toHaveText('CITY EXIT / TRAFFIC');
  await page.clock.runFor(1000);
  expect(Number(await game.getAttribute('data-time'))).toBeLessThan(90);
  expect(Number(await game.getAttribute('data-score'))).toBeGreaterThan(0);
});

test('holding turbo cannot retrigger; pause clears held abilities',async({page})=>{
  await page.goto('/bastrop37/');await page.getByRole('button',{name:'START RIDING'}).click();
  const game=page.locator('#game');await page.keyboard.down('Shift');await page.keyboard.down('Control');
  await expect.poll(async()=>Number(await game.getAttribute('data-boost'))).toBeGreaterThan(0);
  await page.clock.runFor(1400);await expect(game).toHaveAttribute('data-boost','0.00');
  await page.keyboard.press('KeyP');await page.keyboard.up('Shift');await page.keyboard.up('Control');
  await page.getByRole('button',{name:'RESUME RIDE'}).click();
  await expect.poll(async()=>Number(await game.getAttribute('data-blades'))).toBeLessThan(.05);
});

test('purple coupe contact requires visible sprite overlap',async({page})=>{
  await page.addInitScript(()=>{
    Math.random=()=>.5;
    const original=CanvasRenderingContext2D.prototype.drawImage;
    (window as any).vehicleRects={};
    CanvasRenderingContext2D.prototype.drawImage=function(...args:any[]) {
      const image=args[0];
      if(this.canvas.id==='game' && image instanceof HTMLImageElement && args.length===9) {
        const name=image.src.split('/').pop()!;
        ((window as any).vehicleRects[name]??=[]).push(args.slice(5));
      }
      return (original as any).apply(this,args);
    } as typeof original;
  });
  await page.goto('/bastrop37/');await page.getByRole('button',{name:'START RIDING'}).click();
  await page.keyboard.down('ArrowLeft');await page.clock.runFor(260);await page.keyboard.up('ArrowLeft');
  const game=page.locator('#game');
  for(let i=0;i<250&&await game.getAttribute('data-state')==='playing';i++)await page.clock.runFor(16);
  await expect(game).toHaveAttribute('data-state','crashed');
  // Render the stopped scene; the only coupe drawn last is the nearby purple car.
  await page.clock.runFor(64);
  const r=await page.evaluate(()=>(window as any).vehicleRects);
  const bikes=r['bike-normal-straight.png'], coupes=['traffic-coupe.png','traffic-coupe-left.png','traffic-coupe-right.png'].flatMap(name=>r[name]||[]);
  expect(bikes.some((a:number[])=>coupes.some((b:number[])=>
    Math.min(a[0]+a[2],b[0]+b[2])-Math.max(a[0],b[0])>0&&
    Math.min(a[1]+a[3],b[1]+b[3])-Math.max(a[1],b[1])>0))).toBe(true);
});
