import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {PublicAccessMission,RELAY_CORRIDOR_START,RELAY_CORRIDOR_END} from '../src/scripts/bastrop37/public-access';
import {LinkProgress,LINK_SECONDS,RELAY_CORRIDOR_LENGTH,RELAY_LOOP_LENGTH} from '../src/scripts/bastrop37/link';
import {publicAccessSave,validPublicAccessSave,validDeliverySave,validBetrayalSave} from '../src/scripts/bastrop37/save';
const m2=JSON.parse(readFileSync('docs/bastrop37/phase3/m2/earned-completion-save.json','utf8'));
const m1=JSON.parse(readFileSync('docs/bastrop37/phase3/earned-completion-save.json','utf8'));
function opening(){const m=new PublicAccessMission(undefined,m2.log,m2.records,m2.history);for(let i=0;i<3;i++)m.advance();return m;}
function linkA(m:PublicAccessMission){m.tick(RELAY_CORRIDOR_START/260,RELAY_CORRIDOR_START,320,true,true);return m.tick(LINK_SECONDS,260*LINK_SECONDS,320,true,true);}

test('L3 reading holds route and link A commits once without releasing Omega or skipping B',()=>{
 const m=new PublicAccessMission(undefined,m2.log,m2.records,m2.history);
 m.tick(600,100000,320,true,true);expect(m.route).toBe(0);expect(m.relayA).toBe(false);expect(m.corridor()).toBeNull();
 for(let i=0;i<2;i++)expect(m.advance()).toEqual([]);
 expect(m.advance()).toEqual(['checkpoint-a']);expect(m.advance()).toEqual([]);
 expect(RELAY_CORRIDOR_LENGTH/260).toBeGreaterThanOrEqual(5);
 expect(linkA(m)).toEqual(['relay-a-linked','checkpoint-b']);expect(m.relayA).toBe(true);expect(m.relayB).toBe(false);
 expect(m.tick(1.5,390,320,true,true)).toEqual(['drone-approach']);
 expect(m.tick(30,7800,320,true,false)).toEqual([]);expect(m.route).toBe(0);expect(m.linkB.seconds).toBe(0);
 expect(m.tick(.1,26,320,true,true)).toEqual(['drone-cleared']);
 m.tick(RELAY_CORRIDOR_START/260,RELAY_CORRIDOR_START,320,true,true);
 expect(m.tick(3,780,320,true,true)).toEqual(['relay-b-linked']);
 expect(m.tick(1,260,320,true,false)).toEqual([]);
 expect(m.tick(0,0,320,true,true)).toEqual([]); // Linked node still visibly ahead.
 expect(m.tick(4,1040,320,true,true)).toEqual(['closure']);
 for(let i=0;i<3;i++)expect(m.advance()).toEqual([]);
 expect(m.advance()).toEqual(['level-complete']);expect(m.advance()).toEqual([]);
 expect(m.log).toHaveLength(34);expect(m.history).toHaveLength(36);expect(m.records).toEqual(m2.records);
});

test('grounded connection counts corridor overlap only and retains partial seconds through a missed service loop',()=>{
 const m=opening();m.tick(RELAY_CORRIDOR_START/260,RELAY_CORRIDOR_START,320,true,true);
 m.tick(1,260,320,true,true);expect(m.linkA.seconds).toBe(1);
 m.tick(.5,130,320,false,true);expect(m.linkA.seconds).toBe(1);
 m.tick(1,260,490,true,true);expect(m.linkA.seconds).toBe(1);
 const travel=RELAY_CORRIDOR_END+100-m.route;
 expect(m.tick(travel/260,travel,490,true,true)).toEqual(['link-missed']);
 expect(m.linkA.seconds).toBe(1);expect(m.loopsA).toBe(1);
 expect(m.tick(RELAY_LOOP_LENGTH/260,RELAY_LOOP_LENGTH,320,true,true)).toEqual(['loop-return']);
 expect(m.linkA.seconds).toBe(1);expect(m.route).toBe(0);
 m.tick(RELAY_CORRIDOR_START/260,RELAY_CORRIDOR_START,320,true,true);
 expect(m.tick(2,520,320,true,true)).toEqual(['relay-a-linked','checkpoint-b']);
});

test('relay time is capped and invalid/airborne intervals cannot charge it',()=>{
 const link=new LinkProgress();link.advance(2,false,true);link.advance(2,true,false);link.advance(-2,true,true);expect(link.seconds).toBe(0);
 expect(link.advance(2,true,true)).toBe(false);expect(link.progress).toBeCloseTo(2/3);
 expect(link.advance(100,true,true)).toBe(true);expect(link.seconds).toBe(3);expect(link.progress).toBe(1);
 link.advance(10,true,true);expect(link.seconds).toBe(3);
});

test('L3 saves strictly bind checkpoint relay flags and canonical evidence while retaining published L1/L2 compatibility',()=>{
 expect(validDeliverySave(m1)).toBe(true);expect(validBetrayalSave(m2)).toBe(true);
 const m=opening();
 const a=publicAccessSave('CP-L3-A',m.log,m.records,m.history);
 const b=publicAccessSave('CP-L3-B',m.log,m.records,m.history);
 expect(validPublicAccessSave(a)).toBe(true);expect(validPublicAccessSave(b)).toBe(true);
 expect(a.flags.relayA).toBe(false);expect(b.flags.relayA).toBe(true);expect(b.flags.relayB).toBe(false);
 for(const bad of [
 {...a,flags:{...a.flags,relayA:true}}, {...b,flags:{...b.flags,relayB:true}},
 {...b,flags:{...b.flags,omegaReleased:true}}, {...b,flags:{...b.flags,busSafe:true}},
 {...b,records:[]}, {...b,history:[...b.history].reverse()}, {...b,completedLevels:['L1','L2','L3']},
 {...b,log:[...b.log,b.log[0]]}, {...b,acknowledged:[]}, {...b,checkpoint:'CP-L5-UPLOAD'},
 ])expect(validPublicAccessSave(bad)).toBe(false);
 expect(validBetrayalSave({...m2,flags:{...m2.flags,relayA:true}})).toBe(false);
});

test('retry snapshots reset unbanked progress and CP-L3-B permanently retains A',()=>{
 const m=opening();linkA(m);
 const save=publicAccessSave('CP-L3-B',m.log,m.records,m.history);
 const restored=new PublicAccessMission(save.checkpoint,save.log,save.records,save.history);
 expect(restored.relayA).toBe(true);expect(restored.linkA.complete).toBe(true);expect(restored.relayB).toBe(false);
 expect(restored.linkB.seconds).toBe(0);expect(restored.droneStarted).toBe(false);expect(restored.dialogue).toBeNull();
 expect(restored.reaction).toBe(1.5);expect(restored.log).toHaveLength(30);expect(restored.history).toHaveLength(32);
 const fresh=new PublicAccessMission('CP-L3-A',save.log,save.records,save.history);expect(fresh.linkA.seconds).toBe(0);expect(fresh.relayA).toBe(false);
});

test('relay B loop retains A and partial B without replaying the cleared interception',()=>{
 const m=new PublicAccessMission('CP-L3-B');
 expect(m.tick(1.5,390,320,true,true)).toEqual(['drone-approach']);
 expect(m.tick(.1,26,320,true,true)).toEqual(['drone-cleared']);
 m.tick(RELAY_CORRIDOR_START/260,RELAY_CORRIDOR_START,320,true,true);
 m.tick(1,260,320,true,true);expect(m.linkB.seconds).toBe(1);
 const travel=RELAY_CORRIDOR_END+100-m.route;
 expect(m.tick(travel/260,travel,490,true,true)).toEqual(['link-missed']);
 expect(m.relayA).toBe(true);expect(m.relayB).toBe(false);expect(m.loopsB).toBe(1);
 expect(m.tick(RELAY_LOOP_LENGTH/260,RELAY_LOOP_LENGTH,320,true,true)).toEqual(['loop-return']);
 expect(m.linkB.seconds).toBe(1);expect(m.droneCleared).toBe(true);
 m.tick(RELAY_CORRIDOR_START/260,RELAY_CORRIDOR_START,320,true,true);
 expect(m.tick(2,520,320,true,true)).toEqual(['relay-b-linked']);
});
