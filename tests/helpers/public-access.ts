import { expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { ack } from './betrayal';
export const earnedM2 = JSON.parse(readFileSync('docs/bastrop37/phase3/m2/earned-completion-save.json','utf8'));
export async function enterPublicAccess(page: Page) {
  await page.goto('/bastrop37/');
  await page.evaluate(save => localStorage.setItem('bastrop37-campaign-v1', JSON.stringify(save)), earnedM2);
  await page.reload();
  await page.locator('#continue-save').click();
  await expect(page.locator('#headline')).toHaveText('RECOVERY LOCK BROKEN');
  await page.locator('#continue-chapter').click();
  await expect(page.locator('#game')).toHaveAttribute('data-beat','L3.01');
  await page.clock.runFor(32);
}
export async function startRelayA(page: Page) { await enterPublicAccess(page); await ack(page,3); }
export async function savedCampaign(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('bastrop37-campaign-v1')!));
}

/** Drive through both real relay corridors and the authored drone using ordinary inputs. */
export async function finishRelays(page: Page, defense: 'steer' | 'blades' = 'steer', touch = false) {
  const { steer } = await import('./betrayal');
  let priorPhase='';
  for(let i=0;i<500;i++) {
    const game=page.locator('#game');
    if(await game.getAttribute('data-beat')==='L3.04') {
      await expect(game).toHaveAttribute('data-traffic-count','0');
      await page.keyboard.up('KeyJ');return;
    }
    const phase=await game.getAttribute('data-drone-phase')||'';
    const clear=await game.getAttribute('data-relay-drone-cleared');
    const a=await game.getAttribute('data-relay-a');
    if(a==='true' && clear!=='true') {
      if(defense==='blades') {
        await page.keyboard.down('KeyJ');
        if(Math.abs(Number(await game.getAttribute('data-x'))-490)>8)await steer(page,490,touch);
      } else if(phase==='signal' && priorPhase!=='signal') {
        const x=Number(await game.getAttribute('data-x'));
        await steer(page,x>360?300:460,touch);
      }
    } else {
      await page.keyboard.up('KeyJ');
      if(Math.abs(Number(await game.getAttribute('data-x'))-320)>8)await steer(page,320,touch);
    }
    priorPhase=phase;
    await page.clock.runFor(100);
    await expect(game).toHaveAttribute('data-state','playing');
  }
  throw new Error(`Relay route did not resolve: ${await page.locator('#game').evaluate(el=>JSON.stringify((el as HTMLElement).dataset))}`);
}
