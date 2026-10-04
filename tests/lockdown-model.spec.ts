import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {ControllerGate,CONTROLLER_ROUTE,CONTROLLER_LOOP_START,CONTROLLER_LOOP_LENGTH,BARRIER_RETRACT_SECONDS} from '../src/scripts/bastrop37/controller';
import {LockdownMission,BUS_PROGRESS_GOAL,RAMP_ROUTE} from '../src/scripts/bastrop37/lockdown';
import {lockdownSave,validLockdownSave,validPublicAccessSave} from '../src/scripts/bastrop37/save';
const earned=JSON.parse(readFileSync('docs/bastrop37/phase3/m3/earned-completion-save.json','utf8'));
function opening(){const m=new LockdownMission(undefined,earned.log,earned.records,earned.history);for(let i=0;i<4;i++)m.advance();return m;}
function escort(){const m=opening();return new LockdownMission('CP-L4-ESCORT',m.log,m.records,m.history);}
function frames(m:LockdownMission,seconds:number,x:number,travel=true){const events:string[]=[];for(let t=0;t<seconds;t+=.02)events.push(...m.tick(.02,travel?5.2:0,x,true));return events;}

test('L4 opening inserts the separate receipt before Omega without replaying prior evidence',()=>{
 const m=new LockdownMission(undefined,earned.log,earned.records,earned.history);
 m.tick(600,100000,440,false);expect(m.beat).toBe('L4.01');expect(m.busProgress).toBe(0);expect(m.busCondition).toBe(3);
 expect(m.dialogue?.id).toBe('L4.01-01');m.advance();expect(m.record?.id).toBe('L4.01-RECORD-01');expect(m.dialogue).toBeNull();
 m.advance();expect(m.record).toBeNull();expect(m.dialogue?.id).toBe('L4.01-02');m.advance();
 expect(m.advance()).toEqual(['checkpoint-controller']);expect(m.advance()).toEqual([]);
 expect(m.log).toHaveLength(37);expect(m.records).toHaveLength(3);expect(m.history).toHaveLength(40);
 expect(m.history.slice(-4).map(e=>e.id)).toEqual(['L4.01-01','L4.01-RECORD-01','L4.01-02','L4.01-03']);
 expect(earned.records).toHaveLength(2);
});

test('controller needs a grounded adjacent blade hit and visibly retracts once; missed pass safely repeats',()=>{
 const c=new ControllerGate();c.tick(CONTROLLER_ROUTE/260,CONTROLLER_ROUTE);
 expect(c.bladeHit(415,true,45,false)).toEqual([]);expect(c.bladeHit(415,false,45,true)).toEqual([]);
 expect(c.bladeHit(452,true,45,true)).toEqual([]);expect(c.bladeHit(320,true,45,true)).toEqual([]);
 expect(c.bladeHit(415,true,45,true)).toEqual(['controller-hit']);expect(c.bladeHit(415,true,45,true)).toEqual([]);
 expect(c.tick(BARRIER_RETRACT_SECONDS/2,156)).toEqual([]);expect(c.progress).toBeCloseTo(.5);expect(c.state).toBe('retracting');
 expect(c.tick(BARRIER_RETRACT_SECONDS/2,156)).toEqual(['barrier-open']);expect(c.tick(10,2600)).toEqual([]);
 const miss=new ControllerGate();expect(miss.tick(3,CONTROLLER_LOOP_START)).toEqual(['controller-missed']);expect(miss.loop).toBe(true);
 miss.tick(1,260);expect(miss.barrierZ).toBeLessThan(0);expect(miss.bypassShift).toBeLessThan(0);
 expect(miss.tick(2,CONTROLLER_LOOP_LENGTH-260)).toEqual(['loop-return']);expect(miss.route).toBe(0);expect(miss.loops).toBe(1);
});

test('escort stays reachable and cannot advance or begin attacks while Jo is out of range',()=>{
 const m=escort();frames(m,30,300);expect(m.busProgress).toBe(0);expect(m.busCondition).toBe(3);expect(m.attackPhase).toBe('idle');expect(m.busZ).toBeGreaterThanOrEqual(100);expect(m.busZ).toBeLessThanOrEqual(230);
 expect(m.rampLoops).toBeGreaterThan(0);expect(m.rampPassed).toBe(false);expect(m.routeCue).toContain('RETURN TO BUS');
 frames(m,1,370);expect(m.busProgress).toBeGreaterThan(0);expect(m.escortInRange).toBe(true);
});

test('three separately telegraphed uncountered strikes can lose bus before safety and emit failure once',()=>{
 const m=escort();const events=frames(m,20,370);
 expect(events.filter(e=>e==='escort-telegraph')).toHaveLength(3);expect(events.filter(e=>e==='bus-hit')).toHaveLength(3);
 expect(events.filter(e=>e==='bus-lost')).toHaveLength(1);expect(m.busCondition).toBe(0);expect(m.busSafe).toBe(false);expect(m.busProgress).toBeLessThan(BUS_PROGRESS_GOAL);
 const progress=m.busProgress;expect(frames(m,10,370)).toEqual([]);expect(m.busProgress).toBe(progress);
 const retry=escort();expect(retry.busCondition).toBe(3);expect(retry.busProgress).toBe(0);expect(retry.controller.state).toBe('open');
});

test('leaving during a bus telegraph allows only that strike; returning starts a new distinct warning',()=>{
 const m=escort();for(let i=0;i<200&&m.attackPhase!=='telegraph';i++)m.tick(.02,5.2,370,true);
 expect(m.attackPhase).toBe('telegraph');const progress=m.busProgress;
 const away=frames(m,20,300);expect(away.filter(e=>e==='bus-hit')).toHaveLength(1);expect(m.busCondition).toBe(2);expect(m.busProgress).toBe(progress);
 expect(away.filter(e=>e==='escort-telegraph')).toHaveLength(0);
 const back=frames(m,4,370);expect(back).toContain('escort-telegraph');
});

test('marked interception retargets one pass to Jo and a completed dodge costs no bus condition',()=>{
 const m=escort();for(let i=0;i<200&&m.attackPhase!=='telegraph';i++)m.tick(.02,5.2,370,true);
 expect(m.tick(.02,5.2,440,true)).toContain('escort-retarget');expect(m.attackTarget).toBe('jo');
 while(m.attackPhase==='telegraph')m.tick(.02,5.2,370,true);
 expect(m.attackPhase).toBe('strike');expect(m.escortDodge()).toEqual(['escort-recover']);expect(m.escortDodge()).toEqual([]);
 expect(m.busCondition).toBe(3);expect(m.attackPasses).toBe(1);
 expect(m.escortDroneCut()).toEqual(['escort-cleared']);expect(m.escortDroneCut()).toEqual([]);
});

test('bus safety and Jo ramp latch independently in either order; safe latch prevents further bus damage',()=>{
 const first=escort();first.escortDroneCut();first.tick(BUS_PROGRESS_GOAL/260,BUS_PROGRESS_GOAL,370,true);
 expect(first.busSafe).toBe(true);expect(first.rampPassed).toBe(false);expect(first.mode).toBe('action');
 first.tick((RAMP_ROUTE-BUS_PROGRESS_GOAL)/260,RAMP_ROUTE-BUS_PROGRESS_GOAL,370,true);expect(first.rampPassed).toBe(true);expect(first.mode).toBe('drain');
 const ramp=escort();ramp.escortDroneCut();ramp.tick((RAMP_ROUTE-10)/260,RAMP_ROUTE-10,300,true);ramp.tick(.04,10,370,true);
 expect(ramp.rampPassed).toBe(true);expect(ramp.busSafe).toBe(false);expect(ramp.mode).toBe('action');
 ramp.tick(BUS_PROGRESS_GOAL/260,BUS_PROGRESS_GOAL,370,true);expect(ramp.busSafe).toBe(true);expect(ramp.mode).toBe('drain');expect(ramp.busCondition).toBe(3);
 expect(ramp.tick(10,3000,370,false)).toEqual([]);ramp.droneDeparted=true;expect(ramp.tick(2,520,370,true)).toEqual(['closure']);
 for(let i=0;i<3;i++)expect(ramp.advance()).toEqual([]);expect(ramp.advance()).toEqual(['level-complete']);expect(ramp.advance()).toEqual([]);
 expect(ramp.log).toHaveLength(41);expect(ramp.records).toHaveLength(3);expect(ramp.history).toHaveLength(44);
});

test('strict L4 checkpoints retain old saves and reject skipped receipt, early safety or release',()=>{
 expect(validPublicAccessSave(earned)).toBe(true);const m=opening();
 const c=lockdownSave('CP-L4-CONTROLLER',m.log,m.records,m.history);const e=lockdownSave('CP-L4-ESCORT',m.log,m.records,m.history);
 expect(validLockdownSave(c)).toBe(true);expect(validLockdownSave(e)).toBe(true);
 for(const bad of [{...c,records:earned.records},{...c,history:[...c.history].reverse()},{...c,flags:{...c.flags,busSafe:true}},{...e,flags:{...e.flags,omegaReleased:true}},{...e,flags:{...e.flags,relayB:false}},{...e,completedLevels:['L1','L2','L3','L4']},{...e,checkpoint:'CP-L5-UPLOAD'}])expect(validLockdownSave(bad)).toBe(false);
 expect(validPublicAccessSave({...earned,flags:{...earned.flags,busSafe:true}})).toBe(false);
});
