import { expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { ack } from './betrayal';
export const earnedM3 = JSON.parse(readFileSync('docs/bastrop37/phase3/m3/earned-completion-save.json','utf8'));
export async function enterLockdown(page: Page) {
  await page.goto('/bastrop37/?fixture=encounters');
  await page.evaluate(save => localStorage.setItem('bastrop37-campaign-v1', JSON.stringify(save)), earnedM3);
  await page.reload(); await page.locator('#continue-save').click();
  await expect(page.locator('#headline')).toHaveText('PUBLIC ROUTE READY');
  await page.locator('#continue-chapter').click();
  await expect(page.locator('#game')).toHaveAttribute('data-beat','L4.01');
  await page.clock.runFor(32);
}
export async function startController(page: Page) {
  await enterLockdown(page);
  await ack(page,1);
  await expect(page.locator('#game')).toHaveAttribute('data-record-id','L4.01-RECORD-01');
  await ack(page,1);
  await expect(page.locator('#game')).toHaveAttribute('data-dialogue-id','L4.01-02');
  await ack(page,2);
  await expect(page.locator('#game')).toHaveAttribute('data-beat','L4.02');
}
export async function savedCampaign(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('bastrop37-campaign-v1')!));
}

/** The controller is hit with the existing blade input at its authored adjacent lane. */
export async function openController(page: Page, touch=false) {
  const {steer}=await import('./betrayal');
  await steer(page,415,touch);
  const cdp=touch?await page.context().newCDPSession(page):null;
  if(cdp){const b=(await page.locator('[data-key="ControlLeft"]').boundingBox())!;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2,id:2}]});}
  else await page.keyboard.down('KeyJ');
  let retraction=false;
  for(let i=0;i<220;i++) {
    const game=page.locator('#game');
    if(await game.getAttribute('data-controller-state')==='retracting')retraction=true;
    if(await game.getAttribute('data-beat')==='L4.03') {
      if(cdp)await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});else await page.keyboard.up('KeyJ');
      await expect(game).toHaveAttribute('data-controller-state','open');
      expect(retraction).toBe(true);return;
    }
    await page.clock.runFor(50);await expect(game).toHaveAttribute('data-state','playing');
  }
  throw new Error(`Controller did not open: ${await page.locator('#game').evaluate(el=>JSON.stringify((el as HTMLElement).dataset))}`);
}

export async function finishEscort(page: Page, defense:'blades'|'steer'='blades',touch=false) {
  const {steer}=await import('./betrayal');
  const game=page.locator('#game');const cdp=touch?await page.context().newCDPSession(page):null;
  if(defense==='blades') {
    await steer(page,490,touch);
    if(cdp){const b=(await page.locator('[data-key="ControlLeft"]').boundingBox())!;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2,id:2}]});}
    else await page.keyboard.down('KeyJ');
  } else await steer(page,370,touch);
  for(let i=0;i<650;i++) {
    if(await game.getAttribute('data-beat')==='L4.04') {
      if(cdp)await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});else await page.keyboard.up('KeyJ');
      await expect(game).toHaveAttribute('data-traffic-count','0');return;
    }
    if(defense==='steer') {
      const phase=await game.getAttribute('data-escort-attack-phase');
      const target=await game.getAttribute('data-escort-target');
      const desired=phase==='telegraph'&&target==='bus'?440:370;
      if(Math.abs(Number(await game.getAttribute('data-x'))-desired)>8)await steer(page,desired,touch);
    }
    await page.clock.runFor(100);await expect(game).toHaveAttribute('data-state','playing');
  }
  throw new Error(`Escort did not resolve: ${await game.evaluate(el=>JSON.stringify((el as HTMLElement).dataset))}`);
}
