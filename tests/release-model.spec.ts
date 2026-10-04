import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {ReleaseMission,UPLOAD_END,UPLOAD_EXIT,UPLOAD_LOOP,RECOVERY_MARKER} from '../src/scripts/bastrop37/release';
import {LinkProgress} from '../src/scripts/bastrop37/link';
import {RELEASE_DIALOGUE} from '../src/scripts/bastrop37/release-content';
import {releaseSave,validReleaseSave,validLockdownSave} from '../src/scripts/bastrop37/save';
const earned=JSON.parse(readFileSync('docs/bastrop37/phase3/m4/earned-completion-save.json','utf8'));
const opening=RELEASE_DIALOGUE['L5.01'];const post=[...RELEASE_DIALOGUE['L5.04'],...RELEASE_DIALOGUE['L5.05']];
const baseLog=[...earned.log,...opening],baseHistory=[...earned.history,...opening];
function upload(){return new ReleaseMission('CP-L5-UPLOAD',baseLog,earned.records,baseHistory);}
function frames(m:ReleaseMission,seconds:number,x=320,grounded=true,clear=true){const out:string[]=[];for(let t=0;t<seconds;t+=.02)out.push(...m.tick(.02,5.2,x,grounded,clear));return out;}
function linkA(m:ReleaseMission){const events=frames(m,8);expect(events.filter(e=>e==='section-a-linked')).toHaveLength(1);expect(m.linkA.complete).toBe(true);expect(m.section).toBe('B');}
function released(){const m=upload();linkA(m);m.droneCleared('intercept');const events=frames(m,9);expect(events.filter(e=>e==='omega-released')).toHaveLength(1);return m;}

test('reusable link defaults to three seconds while each final section independently needs five',()=>{
 const old=new LinkProgress();old.advance(3,true,true);expect(old.complete).toBe(true);
 const final=new LinkProgress(5);final.advance(3,true,true);expect(final.complete).toBe(false);expect(final.progress).toBe(.6);
 final.advance(10,false,true);final.advance(10,true,false);expect(final.seconds).toBe(3);final.advance(2,true,true);expect(final.complete).toBe(true);
});

test('L5 safe opening cannot progress or release before all three lines; controller checkpoint keeps prior evidence',()=>{
 const m=new ReleaseMission(undefined,earned.log,earned.records,earned.history);frames(m,60,490,false,false);
 expect(m.beat).toBe('L5.01');expect(m.route).toBe(0);expect(m.omegaReleased).toBe(false);
 expect(m.advance()).toEqual([]);expect(m.advance()).toEqual([]);expect(m.advance()).toEqual(['checkpoint-controller']);expect(m.advance()).toEqual([]);
 expect(m.log).toHaveLength(44);expect(m.records).toHaveLength(3);expect(m.history).toHaveLength(47);
});

test('final controller miss loops with no defender; grounded blade and full visible retraction precede defender and upload gate',()=>{
 const m=new ReleaseMission('CP-L5-CONTROLLER',baseLog,earned.records,baseHistory);
 m.tick(3,700,320,true,true);expect(m.controller.loop).toBe(true);expect(m.defenderStarted).toBe(false);
 m.tick(3,650,320,true,true);expect(m.controller.route).toBe(0);
 m.tick(2,520,415,true,true);expect(m.controllerBladeHit(415,false,60,true)).toEqual([]);
 expect(m.controllerBladeHit(415,true,60,true)).toEqual(['controller-hit']);expect(m.controllerBladeHit(415,true,60,true)).toEqual([]);
 m.tick(.6,156,415,true,true);expect(m.defenderStarted).toBe(false);expect(m.controller.state).toBe('retracting');
 expect(m.tick(.6,156,415,true,true)).toContain('defender-approach');expect(m.controller.state).toBe('open');
 expect(frames(m,4,320,true,true)).not.toContain('checkpoint-upload');expect(m.beat).toBe('L5.02');
 m.droneCleared('defender');expect(m.tick(.02,5.2,320,true,false)).toEqual([]);expect(m.beat).toBe('L5.02');
 expect(m.tick(.02,5.2,320,true,true)).toEqual(['checkpoint-upload']);expect(m.beat).toBe('L5.03');expect(m.uploadProgress).toBe(0);
});

test('upload partial time pauses airborne and out of range, warns before a miss, and survives its repeat approach',()=>{
 const m=upload();frames(m,3.5);const partial=m.linkA.seconds;expect(partial).toBeGreaterThan(1);expect(partial).toBeLessThan(5);
 frames(m,.5,320,false);expect(m.linkA.seconds).toBe(partial);frames(m,1,490);expect(m.linkA.seconds).toBe(partial);
 while(m.route<UPLOAD_END-220)m.tick(.02,5.2,490,true,true);expect(m.routeCue).toContain('LOOP');
 while(!m.loop)m.tick(.02,5.2,490,true,true);expect(m.loopsA).toBe(1);expect(m.route).toBeGreaterThanOrEqual(UPLOAD_EXIT);expect(m.linkA.seconds).toBe(partial);
 expect(m.tick(UPLOAD_LOOP/260,UPLOAD_LOOP,490,true,true)).toContain('loop-return');expect(m.linkA.seconds).toBe(partial);
 linkA(m);expect(m.uploadProgress).toBe(.5);expect(m.linkB.seconds).toBe(0);
});

test('A banks half exactly once and B stays closed until the one interception and corridor both clear',()=>{
 const m=upload();linkA(m);expect(m.interceptStarted).toBe(true);expect(m.corridor()).toBeNull();
 frames(m,60);expect(m.linkB.seconds).toBe(0);expect(m.omegaReleased).toBe(false);
 expect(m.droneCleared('defender')).toEqual([]);expect(m.interceptCleared).toBe(false);
 expect(m.droneCleared('intercept')).toContain('intercept-cleared');frames(m,20,320,true,false);
 expect(m.linkB.seconds).toBe(0);expect(m.omegaReleased).toBe(false);
 frames(m,1,320,true,true);expect(m.corridor()?.section).toBe('B');expect(m.linkB.seconds).toBe(0);
 expect(m.droneCleared('intercept')).toEqual([]);
});

test('both distinct links and cleared road commit release once; pre-release upload checkpoint resets all partial progress',()=>{
 const m=upload();linkA(m);m.droneCleared('intercept');frames(m,1);frames(m,2);expect(m.linkB.seconds).toBeGreaterThan(0);expect(m.omegaReleased).toBe(false);
 const retry=upload();expect(retry.linkA.seconds).toBe(0);expect(retry.linkB.seconds).toBe(0);expect(retry.controller.state).toBe('open');expect(retry.defenderCleared).toBe(true);
 const events=frames(m,10);expect(events.filter(e=>e==='omega-released')).toHaveLength(1);expect(m.uploadProgress).toBe(1);expect(m.beat).toBe('L5.04');expect(m.omegaReleased).toBe(true);
 expect(frames(m,60)).not.toContain('omega-released');expect(m.dialogue?.id).toBe('L5.04-01');
});

test('release closure precedes dawn, slow recovery reading holds route, then harmless marker completes once',()=>{
 const m=released();for(let i=0;i<3;i++)expect(m.advance()).toContain('release-prefix-updated');
 expect(m.beat).toBe('L5.05');expect(m.dawn).toBe(0);expect(m.dialogue).toBeNull();expect(m.recoveryRoute).toBe(0);
 m.tick(.8,208,320,true,true);expect(m.dawn).toBe(1);expect(m.dialogue?.id).toBe('L5.05-01');frames(m,60);expect(m.recoveryRoute).toBe(0);
 for(let i=0;i<3;i++)m.advance();expect(m.mode).toBe('drain');expect(m.log).toHaveLength(50);expect(m.history).toHaveLength(53);
 expect(m.tick(1,RECOVERY_MARKER-1,490,false,false)).toEqual([]);expect(m.campaignComplete).toBe(false);
 expect(m.tick(.02,1,490,false,false)).toEqual(['campaign-complete']);expect(m.campaignComplete).toBe(true);expect(m.omegaReleased).toBe(true);
 expect(frames(m,30)).not.toContain('campaign-complete');expect(m.advance()).toEqual([]);
});

test('every released dialogue prefix reloads safely and resumes unfinished closure or recovery without duplicate history',()=>{
 for(let n=0;n<=6;n++){
  const log=[...baseLog,...post.slice(0,n)],history=[...baseHistory,...post.slice(0,n)];
  const save=releaseSave('CP-L5-RELEASED',log,earned.records,history);expect(validReleaseSave(save)).toBe(true);
  const m=new ReleaseMission('CP-L5-RELEASED',save.log,save.records,save.history);expect(m.omegaReleased).toBe(true);expect(m.uploadProgress).toBe(1);
  expect(m.dialogue?.id??null).toBe(post[n]?.id??null);expect(m.log).toHaveLength(44+n);expect(m.recoveryRoute).toBe(0);
  if(n===6)expect(m.mode).toBe('drain');
 }
});

test('strict final saves require prior completion, exact receipts and canonical release prefix while retaining old M4 saves',()=>{
 expect(validLockdownSave(earned)).toBe(true);
 const initial=releaseSave('CP-L5-UPLOAD',baseLog,earned.records,baseHistory);expect(validReleaseSave(initial)).toBe(true);
 const done=releaseSave('CP-CAMPAIGN-COMPLETE',[...baseLog,...post],earned.records,[...baseHistory,...post]);expect(validReleaseSave(done)).toBe(true);
 expect(done.log).toHaveLength(50);expect(done.history).toHaveLength(53);expect(done.completedLevels).toEqual(['L1','L2','L3','L4','L5']);expect(done.flags.omegaReleased).toBe(true);
 for(const bad of [{...initial,flags:{...initial.flags,omegaReleased:true}},{...initial,flags:{...initial.flags,busSafe:false}},{...initial,flags:{...initial.flags,relayB:false}},{...done,flags:{...done.flags,omegaReleased:false}},{...done,records:earned.records.slice(0,2)},{...done,history:[...done.history].reverse()},{...done,completedLevels:['L1','L2','L3','L4']},{...initial,checkpoint:'CP-L5-RELEASED',flags:{...initial.flags,omegaReleased:true},log:[...baseLog,post[1]],acknowledged:[...baseLog,post[1]].map(l=>l.id),history:[...baseHistory,post[1]]}])expect(validReleaseSave(bad)).toBe(false);
});
