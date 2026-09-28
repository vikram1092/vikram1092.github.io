import { expect, type Page } from '@playwright/test';
export async function ack(page:Page,count:number) { for(let i=0;i<count;i++) { await expect(page.locator('#advance')).toBeVisible(); await page.locator('#advance').click(); await page.clock.runFor(32); } }
export async function steer(page:Page,target:number,touch=false) {
 const session=touch?await page.context().newCDPSession(page):null;
 for(let i=0;i<180;i++) {
  const x=Number(await page.locator('#game').getAttribute('data-x')); if(Math.abs(x-target)<7)return;
  const key=x<target?'ArrowRight':'ArrowLeft';
  if(session) { const b=(await page.locator(`[data-key="${key}"]`).boundingBox())!; await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2,id:1}]}); } else await page.keyboard.down(key);
  await page.clock.runFor(16);
  if(session) await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}); else await page.keyboard.up(key);
 }
 throw new Error(`Could not steer to ${target}; x=${await page.locator('#game').getAttribute('data-x')} state=${await page.locator('#game').getAttribute('data-state')}`);
}
export async function reveal(page:Page) {
 await ack(page,3);
 for(let i=0;i<60;i++) { if(await page.locator('#game').getAttribute('data-record-id'))return; await page.clock.runFor(150); }
 throw new Error('Scan did not reveal record');
}
export async function escape(page:Page,touch=false) {
 await steer(page,460,touch);
 let priorPhase='';
 for(let i=0;i<180;i++) {
  if(await page.locator('#game').getAttribute('data-beat')==='L2.04') {
   expect(Number(await page.locator('#game').getAttribute('data-carrier-z'))).toBeGreaterThanOrEqual(1500);
   await expect(page.locator('#game')).toHaveAttribute('data-traffic-count','0'); return;
  }
  const phase=await page.locator('#game').getAttribute('data-drone-phase')||'';
  if(phase === 'signal' && priorPhase !== 'signal') {
   const x=Number(await page.locator('#game').getAttribute('data-x')); await steer(page,x>360?320:460,touch);
  }
  priorPhase=phase;
  await page.clock.runFor(100);
  await expect(page.locator('#game')).toHaveAttribute('data-state','playing');
 }
 throw new Error('Pursuit did not clear');
}
