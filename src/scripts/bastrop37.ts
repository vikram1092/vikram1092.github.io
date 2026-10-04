// BASTROP37 Delivery: authored beats over the existing projected sprite road.
// X and Z are shared road-space units; projected opaque bodies decide visible contact.
import { createHud } from './bastrop37/hud';
import { DeliveryMission, SERVICE_CORRIDOR, type DeliveryEvent } from './bastrop37/delivery';
import { DELIVERY_ASSETS, DELIVERY_ASSET_METADATA } from './bastrop37/delivery-content';
import { BETRAYAL_ASSETS, BETRAYAL_ASSET_METADATA } from './bastrop37/betrayal-content';
import { PUBLIC_ACCESS_ASSETS, PUBLIC_ACCESS_ASSET_METADATA } from './bastrop37/public-access-content';
import { BetrayalMission, SCAN_CORRIDOR, LOCK_CORRIDOR, type BetrayalEvent } from './bastrop37/betrayal';
import { PublicAccessMission, type PublicAccessEvent } from './bastrop37/public-access';
import { OverdriveMeter } from './bastrop37/overdrive';
import { betrayalSave, clearDeliverySave, deliverySave, publicAccessSave, readDeliverySave, writeDeliverySave, type BetrayalCheckpoint, type CampaignSave, type DeliveryCheckpoint, type PublicAccessCheckpoint } from './bastrop37/save';
import type { HudView } from './bastrop37/contracts';
type DronePhase = 'approach' | 'flank' | 'signal' | 'lunge' | 'recover';
type DroneOutcome = 'none' | 'slice' | 'boost' | 'jump' | 'miss';
type Car = {
  id: string;
  x: number; z: number; w: number; h: number; kind: 'coupe' | 'sedan' | 'hauler' | 'drone';
  velocity: number; passed: boolean; phase?: DronePhase; phaseTime?: number;
  side?: -1 | 1; attackX?: number; outcome?: DroneOutcome; attackPasses?: number;
  lane: number; targetLane: number; turn: -1 | 0 | 1; changeZ: number; changed: boolean;
  disengaging?: boolean;
  retreatDirection?: -1 | 1;
};
type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string };
type Fragment = { sprite: string; x: number; z: number; lift: number; vx: number; vz: number; vy: number; rotation: number; spin: number; life: number; width: number };
type EffectBurst = { sprite: string; x: number; z: number; lift: number; life: number; duration: number; width: number };
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
export function mountGame() {
  // Local-only mechanic regression surface. It never advances or writes campaign state.
  const mechanicsFixture = ['localhost','127.0.0.1'].includes(location.hostname) &&
    new URLSearchParams(location.search).get('fixture') === 'mechanics';
  const m2Fixture = ['localhost','127.0.0.1'].includes(location.hostname) &&
    new URLSearchParams(location.search).get('fixture') === 'm2';
  const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
  const ctx = canvas.getContext('2d');
  const start = document.querySelector<HTMLButtonElement>('#start')!;
  if (!ctx) { start.textContent = 'CANVAS UNAVAILABLE'; return; }
  const c = ctx;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const keys = new Set<string>();
  const images: Record<string, HTMLImageElement> = {};
  const masks: Record<string, Uint8Array> = {};
  // Extend only the blade pixels; rider and chassis keep their original proportions.
  const bladeLayers: Record<string, {image:HTMLCanvasElement;root:number;tip:number}[]> = {};
  const bladeRoots: Record<string, number[]> = {
    bikeBlades:[242,400], bikeBladesLeft:[211,422], bikeBladesLeft35:[205,414],
    bikeBladesRight:[233,418], bikeBladesRight35:[209,432],
  };
  const bladeExtension = 3;

  let W = 640, H = 360, renderScale = 0;
  let roadBaseRatio = .84;
  const storyBaseRatio = () => {
    if (W >= H) return .84;
    const card = document.querySelector<HTMLElement>('#comms');
    if (!card || card.hidden) return .60;
    const canvasBox = canvas.getBoundingClientRect();
    if (canvasBox.height <= 0) return .60;
    // The rider sprite ends at its projected road point. Keep that point above
    // the actual card top, including when a longer line enlarges the card.
    return clamp((card.getBoundingClientRect().top - canvasBox.top - 24) / canvasBox.height, .48, .60);
  };
  const left = 128, right = 512;
  const bounds: Record<string, {x:number;y:number;w:number;h:number}> = {};
  const horizon = () => H * (W < H ? .32 : .42) + (reduced ? 0 : cameraPitch);
  function project(wx:number, z:number) {
    // Close chase: enlarge the whole road-space view, tracking the rider laterally.
    const scale = 65 / (65 + Math.max(-53,z));
    const zoom = (W < H ? 3 : 1.6) * (1 - (reduced ? 0 : turboView * .07));
    const unit = Math.min(W * .9, 520) / (right-left) * zoom;
    return {x:W/2+(wx-cameraX)*unit*scale, y:horizon()+(H*roadBaseRatio-horizon())*scale, scale:unit*scale};
  }
  type GameState = HudView['state'];
  let state: GameState = 'loading';
  let mission: DeliveryMission | BetrayalMission | PublicAccessMission = new DeliveryMission();
  let checkpoint: DeliveryCheckpoint | BetrayalCheckpoint | PublicAccessCheckpoint | null = null;
  let sessionSave: CampaignSave | null = null;
  const initialSave = readDeliverySave();
  let hasSave = initialSave.kind === 'valid';
  let saveStatus: HudView['saveStatus'] = initialSave.kind === 'invalid' ? 'invalid' : hasSave ? 'saved' : 'none';
  let statusMessage = initialSave.kind === 'invalid' ? 'Saved progress is incompatible. Start a safe new ride.' : '';
  let assetLoadFailed = false;
  let betrayalAssetsReady = false;
  let loadingBetrayal = false;
  let publicAccessAssetsReady = false;
  let loadingPublicAccess = false;
  let ignoreStoredSave = false;
  let serviceLoops = 0;
  let fixtureDroneSpawned = false;
  let overdrive = new OverdriveMeter();
  let l2DroneSpawned = false;
  let carrierZ = 720;
  let carrierActive = false;
  let scanPulse = 0;
  const isBetrayal = () => mission instanceof BetrayalMission;
  const isPublicAccess = () => mission instanceof PublicAccessMission;
  let x = 320, vx = 0, angle = 0;
  let charge = 1, boost = 0, speed = 260, distance = 0, calls = 0, elapsed = 0;
  let sliding = false, spawn = 0, offset = 0, last = 0, feedbackTime = 0;
  let feedbackText = '';
  let traffic: Car[] = [], particles: Particle[] = [], fragments: Fragment[] = [], effects: EffectBurst[] = [];
  let vehicleSerial = 0;
  let frames = 0;
  let cameraX = 320, cameraPitch = 0, turboView = 0;
  let height = 0, verticalSpeed = 0, jumpWindup = 0, jumpCooldown = 0;
  let landing = 0, blades = 0, slices = 0, droneDodges = 0, laneChanges = 0;
  let droneOutcome: DroneOutcome = 'none';
  let score = 0;
  let musicStep = 0, musicClock = 0, bladesAudible = false;
  let muted = false;
  try { muted = localStorage.getItem('bastrop37-muted') === 'true'; } catch {}
  type AudioRig = { ctx:AudioContext; master:GainNode; music:GainNode; engine:GainNode; blade:GainNode; fx:GainNode; motor:OscillatorNode; whine:OscillatorNode; bladeOsc:OscillatorNode };
  let audio: AudioRig | null = null;
  const pressed = new Set<string>();
  function press(key:string) { if(!keys.has(key)) pressed.add(key); keys.add(key); }
  const actionKeys = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','ShiftLeft','ControlLeft','AltLeft'];
  function size() {
    const portrait = canvas.clientWidth / canvas.clientHeight < 1;
    const nw = portrait ? 360 : 640;
    const nh = Math.round(nw * canvas.clientHeight / Math.max(1, canvas.clientWidth));
    // Preserve the game's logical coordinate system while rendering enough
    // backing pixels for the actual display size and Retina-class screens.
    const cssScale=canvas.clientWidth>0?canvas.clientWidth/nw:1;
    const nextScale=Math.min(2,Math.max(1,window.devicePixelRatio||1,cssScale));
    const pixelWidth=Math.round(nw*nextScale),pixelHeight=Math.round(nh*nextScale);
    if(W===nw&&H===nh&&canvas.width===pixelWidth&&canvas.height===pixelHeight)return;
    W=nw;H=nh;renderScale=nextScale;
    canvas.width=pixelWidth;canvas.height=pixelHeight;
    c.setTransform(renderScale,0,0,renderScale,0,0);
  }
  const resize = new ResizeObserver(() => { size(); if (state === 'playing') pause(); });
  resize.observe(canvas);
  const muteButton = document.querySelector<HTMLButtonElement>('#mute')!;
  function updateMuteButton() {
    muteButton.setAttribute('aria-pressed',String(muted));
    muteButton.setAttribute('aria-label',muted?'Unmute audio':'Mute audio');
    muteButton.textContent=muted?'◌ MUTED':'◉ SOUND';
  }
  function initAudio() {
    if(audio) { void audio.ctx.resume(); return; }
    const AudioCtor=(window.AudioContext||(window as typeof window & {webkitAudioContext?:typeof AudioContext}).webkitAudioContext);
    if(!AudioCtor)return;
    const ac=new AudioCtor(),master=ac.createGain(),music=ac.createGain(),engine=ac.createGain(),blade=ac.createGain(),fx=ac.createGain();
    const compressor=ac.createDynamicsCompressor();
    compressor.threshold.value=-18;compressor.knee.value=18;compressor.ratio.value=5;
    master.gain.value=muted?0:.18;music.gain.value=.0001;engine.gain.value=.0001;blade.gain.value=.0001;fx.gain.value=.65;
    music.connect(master);engine.connect(master);blade.connect(master);fx.connect(master);master.connect(compressor);compressor.connect(ac.destination);
    const motor=ac.createOscillator(),whine=ac.createOscillator(),bladeOsc=ac.createOscillator();
    const motorFilter=ac.createBiquadFilter();motorFilter.type='lowpass';motorFilter.frequency.value=420;
    motor.type='sawtooth';motor.frequency.value=58;whine.type='triangle';whine.frequency.value=116;bladeOsc.type='square';bladeOsc.frequency.value=980;
    motor.connect(motorFilter);motorFilter.connect(engine);whine.connect(engine);bladeOsc.connect(blade);
    motor.start();whine.start();bladeOsc.start();audio={ctx:ac,master,music,engine,blade,fx,motor,whine,bladeOsc};
  }
  function tone(frequency:number,duration=.14,type:OscillatorType='square',volume=.12,delay=0,bus:'fx'|'music'='fx') {
    if(!audio||muted)return;
    const t=audio.ctx.currentTime+delay,o=audio.ctx.createOscillator(),g=audio.ctx.createGain();
    o.type=type;o.frequency.setValueAtTime(frequency,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+duration);
    o.connect(g);g.connect(bus==='music'?audio.music:audio.fx);o.start(t);o.stop(t+duration+.03);
  }
  function sound(name:'signal'|'turbo'|'jump'|'land'|'warning'|'lunge'|'slice'|'impact'|'success'|'timeout'|'close') {
    const notes:Record<typeof name,number[]>={signal:[220,330,165],turbo:[110,220,440],jump:[180,270],land:[92,62],warning:[740,740],lunge:[310,155],slice:[1180,760],impact:[72,48],success:[220,330,440,660],timeout:[220,185,147],close:[620,820]};
    const gap=name==='warning'?.13:.07;
    notes[name].forEach((note,i)=>tone(note,name==='impact'?.28:.12,name==='impact'?'sawtooth':name==='slice'?'triangle':'square',name==='impact'?.22:.1,i*gap));
  }
  function syncAudio(dt=0) {
    if(!audio)return;
    const now=audio.ctx.currentTime,active=state==='playing';
    audio.master.gain.setTargetAtTime(muted?0:.18,now,.025);
    audio.engine.gain.setTargetAtTime(active?.1:.0001,now,.08);
    audio.music.gain.setTargetAtTime(active?.075:.0001,now,.18);
    audio.blade.gain.setTargetAtTime(active&&blades>.08?.045+.035*blades:.0001,now,.025);
    audio.motor.frequency.setTargetAtTime(43+speed*.12+(boost>0?24:0),now,.045);
    audio.whine.frequency.setTargetAtTime(92+speed*.31+(boost>0?80:0),now,.04);
    audio.bladeOsc.frequency.setTargetAtTime(760+blades*520+Math.sin(elapsed*45)*55,now,.018);
    if(active&&dt>0) {
      musicClock-=dt;
      if(musicClock<=0) {
        const scale=[55,82.41,65.41,98,73.42,110,65.41,82.41];
        tone(scale[musicStep++%scale.length],.23,'sawtooth',.055,0,'music');
        musicClock=.28;
      }
    }
    const bladeNow=active&&blades>.35;
    if(bladeNow&&!bladesAudible)tone(920,.09,'triangle',.08);
    bladesAudible=bladeNow;
  }
  updateMuteButton();
  muteButton.addEventListener('click',()=>{
    muted=!muted;try{localStorage.setItem('bastrop37-muted',String(muted));}catch{}
    updateMuteButton();if(!muted)initAudio();syncAudio();
  });
  function setMessage(text: string, seconds = 1) { feedbackText = text; feedbackTime = seconds; }
  function clearInput() { keys.clear(); pressed.clear(); sliding = false; document.querySelectorAll('.held').forEach(b => b.classList.remove('held')); }
  function resetPhysical() {
    clearInput(); x = 320; vx = angle = boost = distance = calls = elapsed = offset = score = 0;
    charge = 1; speed = 260; spawn = Infinity; particles = []; fragments = []; effects = [];
    cameraX = 320; cameraPitch = turboView = height = verticalSpeed = jumpWindup = jumpCooldown = landing = blades = slices = droneDodges = laneChanges = 0;
    droneOutcome = 'none';
    traffic = []; vehicleSerial = 0; musicClock = musicStep = 0; fixtureDroneSpawned = false;
    overdrive = new OverdriveMeter(); l2DroneSpawned = false; carrierZ = 720; carrierActive = false; scanPulse = 0;
    feedbackText = ''; feedbackTime = 0;
    roadBaseRatio = mission.mode === 'story' ? storyBaseRatio() : .84;
  }
  function spawnActionTraffic() {
    if (isBetrayal()) {
      traffic = mission.beat === 'L2.02'
        ? [makeVehicle(0, 520, 'sedan'), makeVehicle(4, 760, 'coupe')]
        : [];
      traffic.forEach(car => { car.changed = true; car.changeZ = -1; });
      return;
    }
    // Two authored, readable traffic pairs. Every pair leaves multiple lanes open.
    traffic = mission.beat === 'L1.02'
      ? [makeVehicle(1, 590, 'coupe'), makeVehicle(3, 650, 'sedan'),
         makeVehicle(0, 1280, 'hauler'), makeVehicle(2, 1370, 'coupe'),
         makeVehicle(1, 2050, 'sedan')]
      : [makeVehicle(0, 640, 'sedan')];
    traffic.forEach(car => { car.changed = true; car.changeZ = -1; });
  }
  function saveCheckpoint(next: DeliveryCheckpoint | BetrayalCheckpoint | PublicAccessCheckpoint) {
    // Local mechanics fixtures must never create either durable or resumable campaign progress.
    if (mechanicsFixture || m2Fixture) return;
    checkpoint = next;
    sessionSave = isPublicAccess() && next.startsWith('CP-L3-')
      ? publicAccessSave(next as PublicAccessCheckpoint, mission.log, (mission as PublicAccessMission).records, (mission as PublicAccessMission).history)
      : isBetrayal() && next.startsWith('CP-L2-')
      ? betrayalSave(next as BetrayalCheckpoint, mission.log, (mission as BetrayalMission).records, (mission as BetrayalMission).history)
      : deliverySave(next as DeliveryCheckpoint, mission.log);
    const durable = writeDeliverySave(sessionSave);
    if (durable) ignoreStoredSave = false;
    saveStatus = durable ? 'saved' : 'session';
    hasSave = true;
    statusMessage = durable ? 'Progress saved.' : 'Progress continues this session, but storage is unavailable.';
  }
  function beginNewGame(resetSaved = false) {
    const cleared = resetSaved ? clearDeliverySave() : true;
    if (resetSaved) ignoreStoredSave = !cleared;
    initAudio(); mission = new DeliveryMission(); resetPhysical(); checkpoint = null; sessionSave = null;
    if (mechanicsFixture) {
      mission = new DeliveryMission('CP-L1-ACTION');
      traffic = [makeVehicle(1,430,'coupe'),makeVehicle(3,730,'hauler'),makeVehicle(0,850,'sedan')];
      statusMessage = 'Local riding and drone mechanics fixture.';
      state = 'playing'; roadBaseRatio = .84; syncAudio(); canvas.focus({ preventScroll: true }); return;
    }
    if (m2Fixture) {
      state = 'loading'; statusMessage = 'Loading local M2 mechanics fixture.';
      void loadBetrayalAssets().then(ok => {
        if (!ok) { state = 'error'; statusMessage = 'M2 fixture art unavailable.'; return; }
        mission = new BetrayalMission('CP-L2-ESCAPE'); resetPhysical();
        overdrive = new OverdriveMeter(100); charge = 0; carrierActive = true; carrierZ = 320;
        state = 'playing'; roadBaseRatio = .84; syncAudio(); canvas.focus({ preventScroll: true });
      });
      return;
    }
    roadBaseRatio = storyBaseRatio();
    const prior = ignoreStoredSave ? { kind: 'none' as const } : readDeliverySave();
    hasSave = prior.kind === 'valid';
    saveStatus = prior.kind === 'valid' ? 'saved' : prior.kind === 'invalid' ? 'invalid' : 'none';
    statusMessage = cleared ? '' : 'Storage could not clear the prior ride. This new run is held in this session until a checkpoint can be saved.';
    serviceLoops = 0; state = 'playing';
    syncAudio(); setMessage('MODULE SECURED · MAYOR VLAD INBOUND', 3); canvas.focus({ preventScroll: true });
  }
  function restoreCheckpoint(save: CampaignSave) {
    mission = save.checkpoint.startsWith('CP-L3-')
      ? new PublicAccessMission(save.checkpoint as PublicAccessCheckpoint, save.log, 'records' in save ? save.records : [], 'history' in save ? save.history : [])
      : save.checkpoint.startsWith('CP-L2-')
      ? new BetrayalMission(save.checkpoint as BetrayalCheckpoint, save.log, 'records' in save ? save.records : [], 'history' in save ? save.history : [])
      : new DeliveryMission(save.checkpoint as DeliveryCheckpoint, save.log);
    resetPhysical();
    roadBaseRatio = mission.mode === 'action' ? .84 : storyBaseRatio();
    checkpoint = save.checkpoint; sessionSave = save; serviceLoops = 0;
    if (mission.mode === 'action') spawnActionTraffic();
    if (isBetrayal()) { carrierActive = save.checkpoint !== 'CP-L2-SCAN'; carrierZ = save.checkpoint === 'CP-L2-SCAN' ? 720 : save.checkpoint === 'CP-L2-COMPLETE' ? 1600 : 350; }
    state = save.checkpoint.endsWith('COMPLETE') ? 'complete' : 'playing';
    statusMessage = state === 'complete' ? (isPublicAccess() ? 'Public route ready. Level 3 complete.' : isBetrayal() ? 'Recovery lock broken. Level 2 complete.' : 'Delivery approach reached. Level 1 complete.') : 'Safe checkpoint restored.';
    syncAudio(); canvas.focus({ preventScroll: true });
  }
  function startGame() {
    if (state !== 'ready' || assetLoadFailed) return;
    beginNewGame();
  }
  async function loadBetrayalAssets(): Promise<boolean> {
    if (betrayalAssetsReady) return true;
    if (loadingBetrayal) return false;
    loadingBetrayal = true;
    const required = Object.entries(BETRAYAL_ASSETS);
    try {
      await Promise.all(required.map(([name, url]) => loadImage(name === 'architecture' ? 'betrayalArchitecture' : name, url)));
      betrayalAssetsReady = true;
      return true;
    } catch { return false; }
    finally { loadingBetrayal = false; }
  }
  async function loadPublicAccessAssets(): Promise<boolean> {
    if (publicAccessAssetsReady) return true;
    if (loadingPublicAccess) return false;
    loadingPublicAccess = true;
    try {
      await Promise.all(Object.entries(PUBLIC_ACCESS_ASSETS).map(([name, url]) => loadImage(name === 'architecture' ? 'publicAccessArchitecture' : name, url)));
      publicAccessAssetsReady = true;
      return true;
    } catch { return false; }
    finally { loadingPublicAccess = false; }
  }
  function enterBetrayal(previousLog: typeof mission.log) {
    mission = new BetrayalMission(undefined, previousLog, [], [...previousLog]);
    resetPhysical(); checkpoint = 'CP-L1-COMPLETE';
    carrierZ = 720; carrierActive = false;
    state = 'playing'; statusMessage = '';
    setMessage('INSPECTION LANE · MAYOR VLAD CONNECTED', 3);
    syncAudio(); canvas.focus({ preventScroll: true });
  }
  function enterPublicAccess(previous: BetrayalMission) {
    mission = new PublicAccessMission(undefined, previous.log, previous.records, previous.history);
    resetPhysical(); checkpoint = 'CP-L2-COMPLETE';
    state = 'playing'; statusMessage = '';
    setMessage('OLD PUBLIC RELAY · OMEGA CONTAINED', 3);
    syncAudio(); canvas.focus({ preventScroll: true });
  }
  function continueGame() {
    if (assetLoadFailed) { state = 'error'; statusMessage = 'A required Delivery asset is missing. Retry loading before continuing.'; return; }
    if (state === 'ready') {
      if (sessionSave) {
        if (sessionSave.checkpoint.startsWith('CP-L3-') && !publicAccessAssetsReady) {
          state = 'loading'; statusMessage = 'Loading Public Access art.';
          void loadPublicAccessAssets().then(ok => { if (ok) restoreCheckpoint(sessionSave!); else { state = 'error'; statusMessage = 'Public Access art could not load. Retry Load or Menu.'; } });
          return;
        }
        if (sessionSave.checkpoint.startsWith('CP-L2-') && !betrayalAssetsReady) {
          state = 'loading'; statusMessage = 'Loading Betrayal art.';
          void loadBetrayalAssets().then(ok => { if (ok) restoreCheckpoint(sessionSave!); else { state = 'error'; statusMessage = 'Betrayal art could not load. Retry Load or Menu.'; } });
          return;
        }
        restoreCheckpoint(sessionSave); return;
      }
      const found = ignoreStoredSave ? { kind: 'none' as const } : readDeliverySave();
      if (found.kind === 'valid') {
        if (found.save.checkpoint.startsWith('CP-L3-') && !publicAccessAssetsReady) {
          state = 'loading'; statusMessage = 'Loading Public Access art.';
          void loadPublicAccessAssets().then(ok => { if (ok) { restoreCheckpoint(found.save); hasSave = true; saveStatus = 'saved'; } else { state = 'error'; statusMessage = 'Public Access art could not load. Retry Load or Menu.'; } });
          return;
        }
        if (found.save.checkpoint.startsWith('CP-L2-') && !betrayalAssetsReady) {
          state = 'loading'; statusMessage = 'Loading Betrayal art.';
          void loadBetrayalAssets().then(ok => { if (ok) { restoreCheckpoint(found.save); hasSave = true; saveStatus = 'saved'; } else { state = 'error'; statusMessage = 'Betrayal art could not load. Retry Load or Menu.'; } });
          return;
        }
        restoreCheckpoint(found.save); hasSave = true; saveStatus = 'saved';
      }
      else { state = 'error'; saveStatus = found.kind === 'invalid' ? 'invalid' : 'none'; statusMessage = 'No compatible safe checkpoint is available. Start a new Delivery ride.'; }
      return;
    }
    if (state === 'complete' && checkpoint === 'CP-L1-COMPLETE') {
      state = 'loading'; statusMessage = 'Loading municipal intake.'; clearInput();
      const l1Log = [...mission.log];
      void loadBetrayalAssets().then(ok => {
        if (ok) enterBetrayal(l1Log);
        else { state = 'error'; statusMessage = 'Betrayal art could not load. Delivery completion is saved. Retry Load or Menu.'; syncAudio(); }
      });
      return;
    }
    if (state === 'complete' && checkpoint === 'CP-L2-COMPLETE' && mission instanceof BetrayalMission) {
      state = 'loading'; statusMessage = 'Loading old public relay.'; clearInput();
      const previous = mission;
      void loadPublicAccessAssets().then(ok => {
        if (ok) enterPublicAccess(previous);
        else { state = 'error'; statusMessage = 'Public Access art could not load. Betrayal completion is saved. Retry Load or Menu.'; syncAudio(); }
      });
      return;
    }
    if (state === 'complete' || state === 'error') {
      state = 'error'; statusMessage = isPublicAccess() ? 'Public route ready. The reservoir chapter is not in this milestone yet.' : 'Retry loading the next chapter.';
      syncAudio();
    }
  }
  function newGame() {
    beginNewGame(true);
  }
  function pause() {
    if (state !== 'playing') return;
    state = 'paused'; clearInput(); syncAudio();
  }
  function resume() { if (state !== 'paused') return; state = 'playing'; clearInput(); syncAudio(); canvas.focus({preventScroll:true}); }
  function crash() {
    burst('impactSparks',x,0,bikeLift(),74,.55);
    burst('debris',x,0,bikeLift(),62,.75);
    state = 'crashed'; clearInput(); charge = boost = 0;
    statusMessage = 'Contact. Retry from the last safe checkpoint.';
    sound('impact');syncAudio();setMessage('CONTACT — R TO RETRY', 5);
  }
  function retry() {
    if (state === 'error') {
      if (assetLoadFailed) { loadAssets(); return; }
      if (checkpoint === 'CP-L1-COMPLETE') {
        state = 'complete'; statusMessage = 'Delivery approach reached. Level 1 complete.';
        continueGame(); return;
      }
      if (checkpoint === 'CP-L2-COMPLETE' && mission instanceof BetrayalMission) {
        state = 'complete'; statusMessage = 'Recovery lock broken. Level 2 complete.';
        continueGame(); return;
      }
      if (sessionSave?.checkpoint.startsWith('CP-L2-')) {
        state = 'ready'; continueGame(); return;
      }
      const prior = sessionSave ?? (ignoreStoredSave ? null : readDeliverySave().kind === 'valid' ? (readDeliverySave() as {kind:'valid';save:CampaignSave}).save : null);
      if (prior?.checkpoint.startsWith('CP-L3-')) { state = 'ready'; continueGame(); return; }
    }
    if (state !== 'crashed' && state !== 'paused') return;
    if (sessionSave) restoreCheckpoint(sessionSave);
    else beginNewGame();
  }
  function menu() {
    if (state === 'loading') return;
    if (assetLoadFailed) { state = 'error'; statusMessage = 'Required Delivery art is unavailable. Retry loading to recover.'; return; }
    state = 'ready'; clearInput(); syncAudio();
  }
  function onMissionEvents(events: DeliveryEvent[]) {
    for (const event of events) {
      if (event === 'checkpoint-action') { spawnActionTraffic(); saveCheckpoint('CP-L1-ACTION'); setMessage(saveStatus === 'session' ? 'SESSION ONLY — STORAGE UNAVAILABLE · STEER THROUGH THE GAP' : 'STEER THROUGH THE GAP', 4); }
      if (event === 'checkpoint-service') { spawnActionTraffic(); saveCheckpoint('CP-L1-SERVICE'); setMessage(saveStatus === 'session' ? 'SESSION ONLY — STORAGE UNAVAILABLE · OPEN RIGHT SERVICE LANE' : 'OPEN RIGHT SERVICE LANE', 4); }
      if (event === 'gap-one') setMessage('FIRST GAP CLEAR · SHIFT FOR TURBO', 3);
      if (event === 'gap-two') setMessage('SECOND GAP CLEAR · DEAD SIGNAL AHEAD', 3);
      if (event === 'signal') setMessage('DEAD SIGNAL · CROSSING BLOCKED', 2);
      if (event === 'gate') setMessage('SERVICE GATE CROSSED', 2);
      if (event === 'gate-missed') { serviceLoops++; setMessage('SERVICE LOOP · FOLLOW THE REPEAT APPROACH', 4); }
      if (event === 'barrier-contact') { crash(); return; }
      if (event === 'loop-return') setMessage('OPEN SERVICE GATE AHEAD', 3);
      if (event === 'approach') setMessage('DELIVERY APPROACH MARKER REACHED', 3);
      if (event === 'drain-complete') { clearInput(); setMessage('ROAD CLEAR · ADVANCE TO READ', 3); }
      if (event === 'level-complete') {
        clearInput(); saveCheckpoint('CP-L1-COMPLETE'); state = 'complete';
        sound('success'); syncAudio(); setMessage('DELIVERY APPROACH REACHED', 5);
      }
    }
  }
  function onBetrayalEvents(events: BetrayalEvent[]) {
    for (const event of events) {
      if (event === 'checkpoint-scan') { spawnActionTraffic(); saveCheckpoint('CP-L2-SCAN'); setMessage('NEUTRAL CARRIER · ENTER THE WIDE SCAN ZONE', 4); }
      if (event === 'scan-missed') setMessage('SCAN MISSED · SERVICE LOOP AHEAD', 3);
      if (event === 'loop-return') { carrierZ = 720; setMessage('CARRIER SCAN AHEAD', 3); }
      if (event === 'scan') { carrierActive = true; scanPulse = 1.4; setMessage('RECOVERY SCAN · HOLD THE ROAD CLEAR', 3); }
      if (event === 'revelation') { clearInput(); setMessage('EQUIPMENT RECORDS · ACKNOWLEDGE EACH', 3); }
      if (event === 'checkpoint-escape') {
        clearInput(); carrierActive = true; carrierZ = 320;
        saveCheckpoint('CP-L2-ESCAPE'); setMessage('BREAK THE LOCK · STEER OUTSIDE THE MARKED ZONE', 4);
      }
      if (event === 'lock-broken') setMessage('LOCK BROKEN · CLEAR THE PURSUIT EXIT', 3);
      if (event === 'exit') {
        traffic.filter(car => car.kind === 'drone').forEach(car => {
          car.disengaging = true; car.retreatDirection = car.z < 0 ? -1 : 1;
          car.side = car.x < x ? -1 : 1; car.phase = 'recover';
        });
        setMessage('PURSUIT DISENGAGING', 3);
      }
      if (event === 'closure') { clearInput(); carrierActive = false; setMessage('ROAD CLEAR · READ OMEGA', 3); }
      if (event === 'level-complete') {
        clearInput(); saveCheckpoint('CP-L2-COMPLETE'); state = 'complete';
        sound('success'); syncAudio(); setMessage('RECOVERY LOCK BROKEN', 5);
      }
    }
  }
  function onPublicAccessEvents(events: PublicAccessEvent[]) {
    for (const event of events) {
      if (event === 'checkpoint-a') {
        saveCheckpoint('CP-L3-A'); setMessage('RELAY A · STAY GROUNDED IN THE MARKED CORRIDOR', 4);
      }
      if (event === 'relay-a-linked') { sound('success'); setMessage('RELAY A LINKED · LOCAL ROUTE READY', 3); }
      if (event === 'checkpoint-b') {
        saveCheckpoint('CP-L3-B'); setMessage(saveStatus === 'session' ? 'RELAY A LINKED · SESSION ONLY · DRONE AHEAD' : 'RELAY A LINKED · DRONE AHEAD', 3);
      }
      if (event === 'drone-approach') {
        traffic.push(makeVehicle(2, 540, 'drone'));
        setMessage('MUNICIPAL DRONE · BLADES OR STEER CLEAR', 3);
      }
      if (event === 'drone-cleared') setMessage('DRONE CLEAR · RELAY B CORRIDOR AHEAD', 3);
      if (event === 'link-missed') setMessage('LINK INCOMPLETE — FOLLOW SERVICE LOOP', 4);
      if (event === 'loop-return') setMessage('RELAY CORRIDOR REJOINED · PROGRESS RETAINED', 3);
      if (event === 'relay-b-linked') { sound('success'); setMessage('RELAY B LINKED · ROAD CLEARING', 3); }
      if (event === 'closure') { clearInput(); setMessage('BOTH RELAYS READY · OMEGA CONTAINED', 3); }
      if (event === 'level-complete') {
        clearInput(); saveCheckpoint('CP-L3-COMPLETE'); state = 'complete';
        sound('success'); syncAudio(); setMessage('PUBLIC ROUTE READY', 5);
      }
    }
  }
  function advance() {
    if (state !== 'playing' || (mission.mode !== 'story' && mission.mode !== 'resolve')) return;
    clearInput();
    if (mission instanceof PublicAccessMission) onPublicAccessEvents(mission.advance());
    else if (mission instanceof BetrayalMission) onBetrayalEvents(mission.advance());
    else onMissionEvents(mission.advance());
    if (state === 'playing' && String(mission.mode) === 'action') canvas.focus({ preventScroll: true });
  }
  const actions = { start: startGame, continue: continueGame, newGame, advance, pause, resume, retry, menu };
  const hud = createHud(actions);
  const aliases: Record<string,string> = {
    KeyA:'ArrowLeft', KeyD:'ArrowRight', KeyW:'ArrowUp', KeyS:'ArrowDown',
    ShiftRight:'ShiftLeft', ControlRight:'ControlLeft', MetaLeft:'ControlLeft', MetaRight:'ControlLeft', AltRight:'AltLeft', KeyJ:'ControlLeft', KeyK:'AltLeft',
  };
  addEventListener('keydown', e => {
    if (e.repeat && (e.code === 'Enter' || e.code === 'Space') && (e.target as HTMLElement)?.closest('#bastrop-game')) {
      e.preventDefault(); return;
    }
    if (e.code === 'KeyP' || e.code === 'Escape') {
      if (state === 'playing' || state === 'paused') {
        e.preventDefault(); if (!e.repeat) state === 'paused' ? actions.resume() : actions.pause();
      }
      return;
    }
    if (e.code === 'KeyR' && state === 'crashed') { e.preventDefault(); if (!e.repeat) actions.retry(); return; }
    // Keep keyboard activation and navigation working on page controls.
    if ((e.target as HTMLElement)?.tagName === 'BUTTON' || (e.target as HTMLElement)?.tagName === 'A') return;
    const key = aliases[e.code] || e.code;
    if (actionKeys.includes(key)) {
      e.preventDefault();
      if (state === 'playing' && mission.mode === 'action' && !e.repeat) press(key);
      else if (state === 'playing' && (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowDown') && !e.repeat) press(key);
    }
    if (e.repeat) return;
    if (e.code === 'Enter' && (e.target as HTMLElement)?.tagName !== 'TEXTAREA') {
      e.preventDefault();
      if (state === 'ready') actions.start();
      else if (state === 'complete' || state === 'error') actions.continue();
      else actions.advance();
    }
    if (e.code === 'KeyM') muteButton.click();
  });
  addEventListener('keyup', e => keys.delete(aliases[e.code] || e.code));
  addEventListener('blur', pause);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  document.querySelectorAll<HTMLButtonElement>('[data-key]').forEach(button => {
    button.addEventListener('pointerdown', e => {
      e.preventDefault(); if(state!=='playing')return;
      const key = button.dataset.key!;
      if (mission.mode !== 'action' && !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(key)) return;
      button.setPointerCapture(e.pointerId); press(key); button.classList.add('held');
    });
    const release = () => { keys.delete(button.dataset.key!); button.classList.remove('held'); };
    button.addEventListener('pointerup', release); button.addEventListener('pointercancel', release); button.addEventListener('lostpointercapture', release);
  });
  function sparks(count:number, color:string, wx=x, z=0) {
    const p=project(wx,z);
    for(let i=0;i<count;i++) particles.push({x:p.x+(Math.random()-.5)*15,y:p.y-height*p.scale,vx:(Math.random()-.5)*130,vy:40+Math.random()*90,life:.25+Math.random()*.3,color});
  }
  function burst(sprite:string, wx:number, z:number, lift:number, width:number, duration=.42) {
    effects.push({sprite,x:wx,z,lift,width,life:duration,duration});
  }
  function bladePose() {
    return Math.abs(angle)>.3 ? (angle<0?'bikeBladesLeft35':'bikeBladesRight35')
      : angle<-.08?'bikeBladesLeft':angle>.08?'bikeBladesRight':'bikeBlades';
  }
  function bladeReach(targetX:number) {
    const b=bounds[bladePose()];
    // Use the same extended tips as the renderer, including each turning pose.
    const layers=bladeLayers[bladePose()];
    const layer=layers?.[targetX<x?0:1];
    return b && layer ? Math.abs(layer.root+(layer.tip-layer.root)*bladeExtension-(b.x+b.w/2))/b.h*47 : 0;
  }
  function bikePose(bodyOnly=false) {
    return !bodyOnly&&blades>.65?bladePose():height>0?(angle<-.08?'jumpLeft':angle>.08?'jumpRight':'jump'):sliding&&Math.abs(angle)>.3?(angle<0?'slideLeft':'slideRight'):angle<-.08?'bikeLeft':angle>.08?'bikeRight':'bike';
  }
  function bikeLift() {
    return height+(landing>0?Math.sin((.42-landing)*22)*landing*8:0)-(jumpWindup>0?Math.sin(jumpWindup/.12*Math.PI)*3:0);
  }
  function hoverLift(car:Car) {
    return (car.kind==='drone'?16:car.kind==='hauler'?12:9)+Math.sin(elapsed*3+car.x)*1.2;
  }
  function vehicleSprite(car:Car) {
    if(car.kind!=='drone') {
      // Far traffic reads cleanly from the rear; nearby traffic reveals its camera angle.
      const nearLaneSide=car.z<330?(car.x<320-(right-left)/10?-1:car.x>320+(right-left)/10?1:0):0;
      const laneSide=car.turn || nearLaneSide;
      if(car.kind==='sedan') return laneSide<0?'sedanLeft':laneSide>0?'sedanRight':'sedan';
      if(car.kind==='hauler') return laneSide<0?'haulerLeft':laneSide>0?'haulerRight':'hauler';
      return laneSide<0?'coupeLeft':laneSide>0?'coupeRight':'coupe';
    }
    if(car.phase==='flank') return car.side===-1?'droneFlankLeft':'droneFlankRight';
    if(car.phase==='signal') return 'droneWarning';
    if(car.phase==='lunge') return 'droneLunge';
    if(car.phase==='recover') return car.side===-1?'droneFlankRight':'droneFlankLeft';
    return 'drone';
  }
  function spriteRect(name:string,wx:number,z:number,width:number,height:number,lift:number) {
    const p=project(wx,z), b=bounds[name];
    if(!b)return null;
    const scale=(['bike','slide','jump'].some(prefix=>name.startsWith(prefix))?height/b.h:width/b.w)*p.scale;
    return {x:p.x-b.w*scale/2,y:p.y-lift*p.scale-b.h*scale,w:b.w*scale,h:b.h*scale};
  }
  function bodyContact(car:Car,z:number,wx:number) {
    // Blades, exhaust, shadows and transparent sprite corners are not crash bodies.
    const name=bikePose(true), a=spriteRect(name,wx,0,26,47,bikeLift());
    const carSprite=vehicleSprite(car), b=spriteRect(carSprite,car.x,z,car.w,0,hoverLift(car));
    if(!a||!b)return false;
    const am=masks[name], bm=masks[carSprite];
    if(!am||!bm)return false;
    const left=Math.max(a.x,b.x), right=Math.min(a.x+a.w,b.x+b.w);
    const top=Math.max(a.y,b.y), bottom=Math.min(a.y+a.h,b.y+b.h);
    // Sample only the overlapping area, at sub-mask resolution, for a forgiving silhouette hit.
    const step=Math.max(.5,Math.min(a.w,a.h,b.w,b.h)/64);
    for(let yy=top+step/2;yy<bottom;yy+=step)for(let xx=left+step/2;xx<right;xx+=step) {
      const ai=Math.floor((yy-a.y)/a.h*64)*64+Math.floor((xx-a.x)/a.w*64);
      const bi=Math.floor((yy-b.y)/b.h*64)*64+Math.floor((xx-b.x)/b.w*64);
      if(am[ai]&&bm[bi])return true;
    }
    return false;
  }
  function activeDrones() { return traffic.filter(car=>car.kind==='drone'&&!car.passed); }
  function activeDrone() { return activeDrones().sort((a,b)=>a.z-b.z)[0]; }
  function droneTrafficConflict(drone:Car,wx:number,z:number) {
    return traffic.some(car=>car.kind!=='drone'&&!car.passed&&
      Math.abs(car.z-z)<(car.h+drone.h)/2+24&&Math.abs(car.x-wx)<(car.w+drone.w)/2+12);
  }
  function trafficSafeDroneX(drone:Car,desiredX:number,z:number) {
    const laneWidth=(right-left)/5;
    const candidates=[desiredX,drone.x,...Array.from({length:5},(_,lane)=>left+(lane+.5)*laneWidth),left+28,right-28]
      .map(candidate=>clamp(candidate,left+28,right-28));
    return candidates.filter(candidate=>!droneTrafficConflict(drone,candidate,z))
      .sort((a,b)=>Math.abs(a-desiredX)-Math.abs(b-desiredX))[0]??drone.x;
  }
  function moveDroneAroundTraffic(drone:Car,desiredX:number,desiredZ:number,response:number,dt:number) {
    const safeX=trafficSafeDroneX(drone,desiredX,desiredZ);
    const nextX=drone.x+(safeX-drone.x)*(1-Math.exp(-response*dt));
    if(droneTrafficConflict(drone,nextX,desiredZ)) {
      // Brake in depth until the lateral escape corridor is visibly clear.
      drone.x+=(safeX-drone.x)*(1-Math.exp(-9*dt));
      drone.z+=(desiredZ-drone.z)*(1-Math.exp(-2*dt));
    } else {
      drone.x=nextX; drone.z=desiredZ;
    }
  }
  function splitDrone(car:Car) {
    const lift=hoverLift(car);
    for(const fragment of [
      {sprite:'droneFragmentLeft',vx:-54,vz:28,vy:72,spin:-5.6,width:27},
      {sprite:'droneFragmentRight',vx:58,vz:12,vy:82,spin:6.2,width:27},
      {sprite:'droneCore',vx:5,vz:-18,vy:105,spin:8.5,width:20},
    ]) fragments.push({...fragment,x:car.x,z:car.z,lift,rotation:0,life:1.15});
    burst('cutSparks',car.x,car.z,lift,72,.48);
    burst('debris',car.x,car.z,lift,66,.7);
    sparks(30,'#ffe575',car.x,car.z); sparks(18,'#e7edf2',car.x,car.z);
  }
  function finishDrone(car:Car,outcome:DroneOutcome) {
    if(car.phase==='recover'||car.passed)return;
    car.attackPasses=(car.attackPasses||0)+1;
    car.phase='recover'; car.phaseTime=1.45; car.outcome=outcome; droneOutcome=outcome;
    // Keep a completed lunge on-screen so recovery can visibly carry it back out.
    car.z=Math.max(car.z,-24);
    car.side=car.x<x?-1:1; spawn=Math.max(spawn,.7);
    if(outcome==='slice') {
      slices++; splitDrone(car); car.passed=true; car.z=-100;
      if (isBetrayal()) overdrive.award('drone-kill', car.id);
      sound('slice');setMessage('DRONE SLICED / CLEAN CUT',1.15);
    } else if(outcome==='boost') {
      droneDodges++; setMessage('DRONE OUTRUN / TURBO',1.15);
    } else if(outcome==='jump') {
      droneDodges++; setMessage('LUNGE CLEARED / AIRBORNE',1.15);
    } else setMessage('DRONE MISSED / IT IS COMING BACK',1.15);
  }
  function canSignalDrone(drone:Car) {
    // Only hold an attack for traffic that is actually occupying the rider's
    // escape corridor. Requiring the whole road to clear starves later drones
    // because procedural traffic continually replenishes the larger zone.
    return traffic.every(car=>car===drone||car.kind==='drone'||car.z< -60||car.z>135||
      Math.abs(car.x-x)>(car.w+70)/2);
  }
  function updateDrone(car:Car,dt:number,oldX:number) {
    const oldZ=car.z;
    if (car.disengaging) {
      if (Math.abs(car.z) < 90 && bodyContact(car, car.z, oldX)) { crash(); return; }
      car.x += ((car.side === -1 ? left + 22 : right - 22) - car.x) * (1 - Math.exp(-4 * dt));
      car.z += (car.retreatDirection ?? 1) * 460 * dt;
      return;
    }
    if(car.phase==='approach') {
      moveDroneAroundTraffic(car,car.x,car.z-Math.min(115,Math.max(70,speed-car.velocity))*dt,4.5,dt);
      if(car.z<=610) {
        car.phase='flank'; car.phaseTime=1.05;
        setMessage('DRONE APPROACH / WATCH THE FLANK',1);
      }
    } else if(car.phase==='flank') {
      car.phaseTime=Math.max(0,(car.phaseTime||0)-dt);
      const flankX=clamp(x+(car.side||1)*82,left+28,right-28);
      moveDroneAroundTraffic(car,flankX,car.z-Math.min(105,Math.max(62,speed-car.velocity))*dt,3.2,dt);
      if(car.phaseTime===0&&car.z<=235&&canSignalDrone(car)) {
        car.phase='signal'; car.phaseTime=.8; car.attackX=x; car.z=205;
        sound('warning');setMessage('ATTACK SIGNAL / SLICE · BOOST · JUMP',.9);
      } else if(car.z<170) car.z=170;
    } else if(car.phase==='signal') {
      car.phaseTime=Math.max(0,(car.phaseTime||0)-dt);
      moveDroneAroundTraffic(car,car.x,car.z+(205-car.z)*(1-Math.exp(-6*dt)),7,dt);
      if(boost>0) { finishDrone(car,'boost'); return; }
      if(car.phaseTime===0) {
        car.phase='lunge'; car.phaseTime=1.05;
        sound('lunge');setMessage('LUNGE / ACT NOW',.55);
      }
    } else if(car.phase==='lunge') {
      if(boost>0&&car.z>34) { finishDrone(car,'boost'); return; }
      car.phaseTime=Math.max(0,(car.phaseTime||0)-dt);
      moveDroneAroundTraffic(car,car.attackX??x,car.z-300*dt,7,dt);
    } else {
      car.phaseTime=Math.max(0,(car.phaseTime||0)-dt);
      const retreatX=clamp(x+(car.side||1)*130,left+28,right-28);
      moveDroneAroundTraffic(car,retreatX,car.z+(255-car.z)*(1-Math.exp(-2.7*dt)),3.6,dt);
      if(car.phaseTime===0) {
        if((car.attackPasses||0)>=3) {
          if (isBetrayal() || isPublicAccess()) {
            car.disengaging = true; car.retreatDirection = car.z < 0 ? -1 : 1;
            car.side = car.x < x ? -1 : 1;
          } else { car.passed=true; car.z=-100; }
        }
        else {
          car.phase='flank'; car.phaseTime=1.15; car.side=car.side===-1?1:-1;
          car.attackX=x; car.outcome='none';
          setMessage(`DRONE RESET / PASS ${(car.attackPasses||0)+1} INCOMING`,1);
        }
      }
      return;
    }

    const dx=Math.abs(x-car.x), reach=(24+car.h)/2;
    if(blades>.65&&height<18&&dx<car.w/2+bladeReach(car.x)&&oldZ>-48&&car.z<48) {
      finishDrone(car,'slice'); return;
    }
    if(car.phase==='lunge'&&oldZ>-reach&&car.z<reach) {
      if(height>=28) { finishDrone(car,'jump'); return; }
      const steps=Math.max(1,Math.ceil(Math.max(Math.abs(car.z-oldZ),Math.abs(x-oldX))/2));
      for(let i=0;i<=steps;i++) {
        const t=i/steps,z=oldZ+(car.z-oldZ)*t;
        if(Math.abs(z)<reach&&bodyContact(car,z,oldX+(x-oldX)*t)) { crash(); return; }
      }
      if(oldZ>0&&car.z<=0) { finishDrone(car,'miss'); return; }
    }
    if(car.phase==='lunge'&&(car.phaseTime===0||car.z< -70)) finishDrone(car,height>0?'jump':'miss');
  }
  function update(dt:number) {
    const oldX=x;
    elapsed += dt; feedbackTime -= dt;
    syncAudio(dt);
    const action = mission.mode === 'action';
    const safeCruise = mission.mode === 'story' || mission.mode === 'resolve';
    if (safeCruise && W < H) roadBaseRatio = storyBaseRatio();
    else roadBaseRatio += ((safeCruise ? storyBaseRatio() : .84)-roadBaseRatio)*(1-Math.exp(-3*dt));
    const input = Number(keys.has('ArrowRight'))-Number(keys.has('ArrowLeft'));
    boost = Math.max(0, boost-dt);
    overdrive.tick(dt);
    jumpCooldown = Math.max(0,jumpCooldown-dt);
    landing = Math.max(0,landing-dt);
    if(action && pressed.has('ShiftLeft')) {
      if (boost === 0 && isBetrayal() && overdrive.activate()) {
        boost = 1.5; sparks(25,'#ffe575'); sound('turbo'); setMessage('OVERDRIVE / 1.5 SECOND BURST', 1.5);
      }
      else if(boost===0 && charge>=.4) { charge-=.4; boost=1.15; sparks(18,'#ffe575'); sound('turbo');setMessage('TURBO / TAKE THE GAP',1.15); }
      else if(boost===0) setMessage('TURBO RECHARGING',.8);
    }
    if(action && pressed.has('AltLeft') && height===0 && jumpWindup===0 && jumpCooldown===0) {
      jumpWindup=.12; jumpCooldown=1.25; sound('jump');setMessage('SPRING LOADED',.12);
    }
    pressed.clear();
    if(jumpWindup>0) {
      jumpWindup=Math.max(0,jumpWindup-dt);
      if(jumpWindup===0) { verticalSpeed=190; setMessage('AIRBORNE / CLEAR LOW TRAFFIC',.8); }
    }
    if(verticalSpeed!==0 || height>0) {
      verticalSpeed-=380*dt; height+=verticalSpeed*dt;
      if(height<=0) { height=verticalSpeed=0; landing=.42; burst('landingRing',x,0,0,72,.5); sparks(20,'#8fffea'); sound('land');setMessage('TOUCHDOWN',.5); }
    }
    blades += ((action && keys.has('ControlLeft')?1:0)-blades)*(1-Math.exp(-25*dt));
    sliding = action && keys.has('Space') && height===0 && boost===0;
    // Slide is a deliberate lateral reposition, with countersteer and strong release grip.
    if(boost===0) charge=clamp(charge+dt*(sliding&&input ? .3 : .10),0,1);
    // Faster road motion and closing speed, while keeping ability timers in real time.
    const target = safeCruise ? keys.has('ArrowDown') ? 205 : keys.has('ArrowUp') ? 255 : 230
      : mission.mode === 'drain' ? 230
      : sliding ? 200 : overdrive.active > 0 ? 540 : boost>0 ? 470 : keys.has('ArrowDown') ? 155 : keys.has('ArrowUp') ? 320 : 260;
    speed += (target-speed)*(1-Math.exp(-(boost>0?7:4)*dt));
    vx += (input*(sliding?230:180)*(height>0?.8:1)-vx)*(1-Math.exp(-(sliding?10:20)*dt));
    x = clamp(x+vx*dt,left+22,right-22);
    if(x===left+22 || x===right-22) vx=0;
    angle += ((sliding?input*.65:input*.19)-angle)*(1-Math.exp(-16*dt));
    cameraX += (320+(x-320)*.85-cameraX)*(1-Math.exp(-12*dt));
    turboView += ((boost>0?1:0)-turboView)*(1-Math.exp(-5*dt));
    cameraPitch += ((boost>0?5:0)-height*.08+(landing>0?Math.sin((.42-landing)*22)*landing*10:0)-cameraPitch)*(1-Math.exp(-8*dt));
    // Scroll the texture faster than world-space hazards for a stronger default
    // sensation of speed without shortening reaction or collision windows.
    offset += speed*dt*2.2; distance += speed*dt/3.6;
    if(sliding && Math.random()<.65) sparks(1,'#8fffea');
    if(boost>0) sparks(2,'#ffe575');
    spawn -= dt;
    // Delivery traffic is deterministic and finite. No vehicle may appear after DRAIN begins.
    if (mechanicsFixture && !fixtureDroneSpawned && elapsed >= 2.5) {
      fixtureDroneSpawned = true;
      traffic.push(makeVehicle(2,540,'drone'));
    }
    if (mission instanceof BetrayalMission) {
      scanPulse = Math.max(0, scanPulse - dt);
      if (mission.beat === 'L2.02') {
        if (mission.mode === 'action' && mission.loop) carrierZ -= Math.max(180, speed - 30) * dt;
        else if (mission.mode === 'action') carrierZ = clamp(720 - mission.route, -50, 720);
        else carrierZ += (250 - carrierZ) * (1 - Math.exp(-2.5 * dt));
      }
      if (mission.beat === 'L2.03' && mission.mode === 'action' && !l2DroneSpawned && mission.reaction === 0) {
        l2DroneSpawned = true; traffic.push(makeVehicle(2, 540, 'drone'));
        setMessage('MUNICIPAL DRONE · BLADES OR STEER CLEAR', 2);
      }
      if (mission.beat === 'L2.03' && mission.mode === 'drain') carrierZ += 460 * dt;
    }
    const bw = 26 + (sliding ? 8 : 0), bh = 24;
    for(const car of traffic) {
      const oldZ = car.z;
      if(car.kind==='drone') {
        updateDrone(car,dt,oldX);
        if(state==='crashed')break;
        continue;
      }
      car.z -= (speed-car.velocity)*dt;
      // A subset of traffic makes one readable, adjacent-lane move per pass.
      if(!car.changed&&car.z<car.changeZ&&car.z>190) {
        const direction=(car.lane===0?1:car.lane===4?-1:(car.lane+car.kind.length)%2?1:-1) as -1|1;
        const target=clamp(car.lane+direction,0,4);
        const occupied=traffic.some(other=>other!==car&&other.kind!=='drone'&&Math.abs(other.targetLane-target)<.1&&Math.abs(other.z-car.z)<150);
        car.changed=true;
        if(!occupied) { car.targetLane=target; car.turn=direction; laneChanges++; }
      }
      if(car.turn) {
        const targetX=left+(car.targetLane+.5)*(right-left)/5;
        car.x+=(targetX-car.x)*(1-Math.exp(-2.7*dt));
        if(Math.abs(targetX-car.x)<1) { car.x=targetX; car.lane=car.targetLane; car.turn=0; }
      }
      const dx = Math.abs(x-car.x), reach = (bh+car.h)/2;
      // The coupe's windows and glow extend above its physical body.
      const clearance = car.kind==='hauler'?110:24;
      // Swept depth interval avoids tunnelling during turbo or a slow frame.
      if(height<clearance && oldZ > -reach && car.z < reach) {
        // Sweep both steering and approach, so turbo cannot skip a narrow contact.
        const steps=Math.max(1,Math.ceil(Math.max(Math.abs(car.z-oldZ),Math.abs(x-oldX))/2));
        for(let i=0;i<=steps;i++) {
          const t=i/steps, z=oldZ+(car.z-oldZ)*t;
          if(Math.abs(z)<reach&&bodyContact(car,z,oldX+(x-oldX)*t)) { crash(); break; }
        }
        if(state==='crashed')break;
      }
      if(!car.passed && car.z < -reach) {
        car.passed=true;
        const gap = dx-(bw+car.w)/2;
        if(gap>=0 && gap<17) {
          calls++; charge=clamp(charge+.3,0,1);
          if (isBetrayal()) overdrive.award('near-pass', car.id);
          sparks(10,'#ffd5a3'); sound('close');setMessage(isBetrayal() ? 'CLOSE CALL / +30 ENERGY · +10 OVERDRIVE' : 'CLOSE CALL / +30 ENERGY',1.2);
        }
      }
    }
    traffic=traffic.filter(car=>car.z>-65 && (!car.disengaging || car.z<1500));
    for(const f of fragments) {
      f.life-=dt; f.x+=f.vx*dt; f.z-=(speed-f.vz)*dt;
      f.lift=Math.max(0,f.lift+f.vy*dt); f.vy-=150*dt; f.rotation+=f.spin*dt;
    }
    fragments=fragments.filter(f=>f.life>0&&f.z>-100);
    for(const effect of effects) effect.life-=dt;
    effects=effects.filter(effect=>effect.life>0&&effect.z>-100);
    particles=particles.filter(p=>p.life>0).slice(-180);
    for(const p of particles) {p.life-=dt;p.x+=p.vx*dt;p.y+=(p.vy+speed*.4)*dt;}
    score=Math.max(score,distance*8+calls*350+slices*1200+droneDodges*700);
    if(state==='playing' && !mechanicsFixture) {
      if (mission instanceof PublicAccessMission) onPublicAccessEvents(mission.tick(dt, speed*dt, x, height === 0 && jumpWindup === 0, traffic.length === 0));
      else if (mission instanceof BetrayalMission) onBetrayalEvents(mission.tick(dt,speed*dt,x,traffic.length===0 && (mission.beat !== 'L2.03' || carrierZ >= 1500)));
      else onMissionEvents(mission.tick(dt,speed*dt,x,traffic.length===0));
    }
    if(feedbackTime<=0) feedbackText=safeCruise?'SAFE CRUISE · ENTER TO ADVANCE':mission.mode==='drain'?'TRAFFIC CLEARING':height>0?'AIRBORNE':boost>0?'TURBO':sliding?'ENERGY SLIDE':blades>.5?'BLADES DEPLOYED':charge<.4?'TURBO RECHARGING':'STEER · SHIFT TURBO · SPACE SLIDE';
  }
  function makeVehicle(lane:number,z:number,kind:string):Car {
    const vehicle=kind as Car['kind'];
    return {id:`delivery-vehicle-${++vehicleSerial}`,x:left+(lane+.5)*(right-left)/5,z,w:vehicle==='hauler'?76:vehicle==='drone'?48:64,
      h:vehicle==='hauler'?62:vehicle==='drone'?28:43,kind:vehicle,velocity:vehicle==='hauler'?22:38,passed:false,
      lane,targetLane:lane,turn:0,changeZ:720,changed:lane===2||(Math.floor(z)+lane*7+vehicle.length)%3!==0,
      ...(vehicle==='drone'?{phase:'approach' as DronePhase,phaseTime:0,side:(lane<=2?-1:1) as -1|1,attackX:320,outcome:'none' as DroneOutcome,attackPasses:0}:{})};
  }
  function sprite(name:string,wx:number,z:number,width:number,height:number,lift=0) {
    const p=project(wx,z), img=images[name], b=bounds[name];
    c.fillStyle='#02071188';c.beginPath();c.ellipse(p.x,p.y,width*p.scale*.53,5*p.scale,0,0,Math.PI*2);c.fill();
    if(img&&b) {
      const r=spriteRect(name,wx,z,width,height,lift)!;
      c.drawImage(img,b.x,b.y,b.w,b.h,r.x,r.y,r.w,r.h);
      for(const layer of bladeLayers[name] || []) {
        const scale=r.h/b.h;
        c.save();
        c.translate(r.x+(layer.root-b.x)*scale,r.y);
        c.scale(scale*bladeExtension,scale);
        c.drawImage(layer.image,-layer.root,-b.y);
        c.restore();
      }

    }
  }
  function drawTelegraph(car:Car) {
    if(car.phase!=='signal')return;
    const from=project(car.x,car.z), target=project(car.attackX??x,0);
    const pulse=.55+.45*Math.sin(elapsed*30), alpha=Math.round(70+90*pulse).toString(16).padStart(2,'0');
    c.strokeStyle=`#ff5362${alpha}`; c.lineWidth=2+pulse*2; c.setLineDash([7,6]);
    c.beginPath(); c.moveTo(from.x,from.y-hoverLift(car)*from.scale); c.lineTo(target.x,target.y); c.stroke(); c.setLineDash([]);
    c.fillStyle=`#ff5362${Math.round(25+35*pulse).toString(16).padStart(2,'0')}`;
    c.beginPath(); c.ellipse(target.x,target.y,28+10*pulse,8+3*pulse,0,0,Math.PI*2); c.fill();
    c.strokeStyle='#ffe7eb'; c.lineWidth=1; c.beginPath(); c.arc(from.x,from.y-hoverLift(car)*from.scale,10+5*pulse,0,Math.PI*2); c.stroke();
  }
  function drawFragment(fragment:Fragment) {
    const p=project(fragment.x,fragment.z), img=images[fragment.sprite], b=bounds[fragment.sprite];
    if(!img||!b)return;
    const scale=fragment.width/b.w*p.scale;
    c.save(); c.globalAlpha=clamp(fragment.life*1.8,0,1); c.translate(p.x,p.y-fragment.lift*p.scale); c.rotate(fragment.rotation);
    c.drawImage(img,b.x,b.y,b.w,b.h,-b.w*scale/2,-b.h*scale/2,b.w*scale,b.h*scale); c.restore();
  }
  function drawEffect(name:string,wx:number,z:number,width:number,lift=0,alpha=1,scalePulse=1,yOffset=0) {
    const p=project(wx,z), img=images[name], b=bounds[name];
    if(!img||!b)return;
    const scale=width/b.w*p.scale*scalePulse;
    c.save(); c.globalCompositeOperation='lighter'; c.globalAlpha=alpha;
    c.drawImage(img,b.x,b.y,b.w,b.h,p.x-b.w*scale/2,p.y-lift*p.scale-b.h*scale/2+yOffset*p.scale,b.w*scale,b.h*scale);
    c.restore();
  }
  function drawBurst(effect:EffectBurst) {
    const progress=1-effect.life/effect.duration;
    drawEffect(effect.sprite,effect.x,effect.z,effect.width,effect.lift,Math.sin(Math.PI*progress),.78+progress*.45);
  }
  function drawRoadProp(name: 'signalDead' | 'serviceGateOpen' | 'crossingBlocked', wx:number,z:number,worldWidth:number) {
    if(z>1500||z<=-12)return;
    const img=images[name], meta=DELIVERY_ASSET_METADATA[name];
    if(!img)return;
    const crop=meta.displayCrop??[0,0,img.width,img.height];
    const [sx,sy,sw,sh]=crop;
    // Fade near the camera before an overhead beam can cross the rider. The
    // plane still has its real world position for route and collision checks.
    const alpha=clamp((z+12)/92,0,1);
    const p=project(wx,z), scale=worldWidth/sw*p.scale;
    const [anchorX,anchorY]=meta.anchor;
    const y=p.y-(anchorY-sy)*scale;
    if(y>=H||y+sh*scale<=0)return;
    c.save();c.globalAlpha*=alpha;
    c.drawImage(img,sx,sy,sw,sh,p.x-(anchorX-sx)*scale,y,sw*scale,sh*scale);
    c.restore();
  }
  function drawRouteBand(z:number,label:string,minX:number=SERVICE_CORRIDOR.minX,maxX:number=SERVICE_CORRIDOR.maxX,tint='#55e9df28') {
    if(z>1200||z< -60)return;
    const far=project(minX,z+150), farR=project(maxX,z+150);
    const near=project(minX,z), nearR=project(maxX,z);
    c.fillStyle=tint;c.strokeStyle='#72e5dbaa';c.lineWidth=Math.max(1,2*near.scale);
    c.beginPath();c.moveTo(far.x,far.y);c.lineTo(farR.x,farR.y);c.lineTo(nearR.x,nearR.y);c.lineTo(near.x,near.y);c.closePath();c.fill();c.stroke();
    c.fillStyle='#e6fff9';c.textAlign='center';c.font=`700 ${Math.max(8,10*near.scale)}px monospace`;
    c.fillText(label,(near.x+nearR.x)/2,near.y-10*near.scale);c.textAlign='start';
  }
  function drawDeliveryProps() {
    if (!(mission instanceof DeliveryMission)) return;
    const signal=mission.landmark('signal');
    if(signal!==null) drawRoadProp('signalDead',left+18,signal,30);
    const gate=mission.landmark('gate');
    if(gate!==null) {
      drawRouteBand(gate,'SERVICE');
      drawRoadProp('crossingBlocked',205,gate,105);
      drawRoadProp('serviceGateOpen',400,gate,138);
    }
    const approach=mission.landmark('approach');
    if(approach!==null) drawRouteBand(approach,'INTAKE APPROACH');
  }
  function drawCarrierImage(name: 'carrier' | 'carrierActive', wx: number, z: number, width: number) {
    if (z > 1500 || z < -35) return;
    const img = images[name], meta = BETRAYAL_ASSET_METADATA[name];
    if (!img) return;
    const [sx, sy, sw, sh] = meta.displayCrop ?? [0, 0, img.width, img.height];
    const [ax, ay] = meta.anchor;
    const p = project(wx, z), scale = width / sw * p.scale;
    c.save(); c.globalAlpha *= clamp((z + 35) / 100, 0, 1) * clamp((1500 - z) / 400, 0, 1);
    c.drawImage(img, sx, sy, sw, sh, p.x - (ax - sx) * scale, p.y - (ay - sy) * scale, sw * scale, sh * scale);
    c.restore();
  }
  function drawBetrayalProps() {
    if (!(mission instanceof BetrayalMission)) return;
    const scan = mission.landmark('scan');
    if (scan !== null) drawRouteBand(scan, 'SCAN ZONE', SCAN_CORRIDOR.minX, SCAN_CORRIDOR.maxX);
    if (mission.beat === 'L2.03' && mission.mode === 'action' && !mission.lockBroken) {
      drawRouteBand(430, 'RECOVERY LOCK', LOCK_CORRIDOR.minX, LOCK_CORRIDOR.maxX, '#ff465342');
      drawRouteBand(120, 'MOVE OUTSIDE', LOCK_CORRIDOR.minX, LOCK_CORRIDOR.maxX, '#ff46532e');
    }
    const exit = mission.landmark('exit');
    if (exit !== null) drawRouteBand(exit, 'PURSUIT EXIT', 190, 450);
    if (carrierZ < 1500) {
      drawCarrierImage('carrier', 468, carrierZ, 112);
      if (carrierActive) drawCarrierImage('carrierActive', 468, carrierZ, 112);
      if (scanPulse > 0) {
        const p = project(468, carrierZ), rider = project(x, 0);
        c.save(); c.globalAlpha = clamp(scanPulse / 1.4, 0, 1) * .75; c.strokeStyle = '#61ecf2'; c.lineWidth = 3;
        c.setLineDash([8, 7]); c.beginPath(); c.moveTo(p.x, p.y - 45 * p.scale); c.lineTo(rider.x, rider.y - 30 * rider.scale); c.stroke(); c.restore();
      }
    }
  }
  function drawRelayImage(name: 'relay' | 'relayConnecting' | 'relayLinked', z: number, width = 74) {
    if (z > 1500 || z < -90) return;
    const img = images[name], meta = PUBLIC_ACCESS_ASSET_METADATA[name];
    if (!img) return;
    const [sx, sy, sw, sh] = meta.displayCrop ?? [0, 0, img.width, img.height];
    const [ax, ay] = meta.anchor;
    const p = project(471, z), scale = width / sw * p.scale;
    c.save(); c.globalAlpha *= clamp((z + 90) / 130, 0, 1);
    c.drawImage(img, sx, sy, sw, sh, p.x - (ax - sx) * scale, p.y - (ay - sy) * scale, sw * scale, sh * scale);
    c.restore();
  }
  function drawPublicAccessProps() {
    if (!(mission instanceof PublicAccessMission)) return;
    if (mission.linkedAExitZ !== null) {
      drawRelayImage('relay', mission.linkedAExitZ);
      drawRelayImage('relayLinked', mission.linkedAExitZ);
    }
    if (mission.linkedBExitZ !== null) {
      drawRelayImage('relay', mission.linkedBExitZ);
      drawRelayImage('relayLinked', mission.linkedBExitZ);
    }
    const corridor = mission.corridor();
    if (!corridor) return;
    const nearZ = Math.max(-35, corridor.startZ), farZ = Math.min(1100, corridor.endZ);
    if (farZ > nearZ) {
      const nearL = project(corridor.minX, nearZ), nearR = project(corridor.maxX, nearZ);
      const farL = project(corridor.minX, farZ), farR = project(corridor.maxX, farZ);
      c.save(); c.fillStyle = '#44e5e929'; c.strokeStyle = '#70f3ea9a'; c.lineWidth = Math.max(1, nearL.scale * 2);
      c.beginPath(); c.moveTo(farL.x, farL.y); c.lineTo(farR.x, farR.y); c.lineTo(nearR.x, nearR.y); c.lineTo(nearL.x, nearL.y); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#ddfffb'; c.font = `700 ${Math.max(8, 11 * nearL.scale)}px monospace`; c.textAlign = 'center';
      c.fillText(`RELAY ${corridor.relay} · LINK CORRIDOR`, (nearL.x + nearR.x) / 2, nearL.y - 12 * nearL.scale);
      c.restore();
    }
    drawRelayImage('relay', corridor.endZ);
    if (mission.inRange && mission.activeLink && mission.activeLink.seconds > 0) drawRelayImage('relayConnecting', corridor.endZ);
  }
  function drawCity() {
    c.fillStyle='#08101b';c.fillRect(0,0,W,H);
    const skyline=images.city;
    if(skyline) {
      const skyScale=Math.max(W/skyline.width,H*.64/skyline.height);
      const skyW=skyline.width*skyScale,skyH=skyline.height*skyScale;
      c.drawImage(skyline,(W-skyW)/2-(cameraX-320)*.02,(H-skyH)/2,skyW,skyH);
    }
    const img=images[isPublicAccess() ? 'publicAccessArchitecture' : isBetrayal() ? 'betrayalArchitecture' : 'architecture'];
    if(!img)return;
    const scale=Math.max(W/img.width,H*.65/img.height)*1.03;
    const dw=img.width*scale,dh=img.height*scale;
    const parallax=-(cameraX-320)*.035;
    const anchorY=isPublicAccess() ? PUBLIC_ACCESS_ASSET_METADATA.architecture.anchor[1]
      : isBetrayal() ? BETRAYAL_ASSET_METADATA.architecture.anchor[1] : DELIVERY_ASSET_METADATA.architecture.anchor[1];
    c.drawImage(img,(W-dw)/2+parallax,H*(W<H?.32:.42)-anchorY*scale,dw,dh);
    if (isBetrayal() && carrierActive && images.intakeScan) {
      c.save(); c.globalAlpha = .38 + .08 * Math.sin(elapsed * 7);
      c.drawImage(images.intakeScan,(W-dw)/2+parallax,H*(W<H?.32:.42)-anchorY*scale,dw,dh);
      c.restore();
    }
  }
  function mirroredRow(value:number,length:number) {
    const cycle=length*2,wrapped=((value%cycle)+cycle)%cycle;
    return Math.min(length-1,Math.floor(wrapped<length?wrapped:cycle-wrapped));
  }
  function drawRoad() {
    const img=images.road;
    if(!img)return;
    const hy=horizon(),base=H*roadBaseRatio;
    const zoom=(W<H?3:1.6)*(1-(reduced?0:turboView*.07));
    const unit=Math.min(W*.9,520)/(right-left)*zoom;
    // Warp the orthographic road texture one horizontal slice at a time. Its
    // baked five-lane markings now move with the asphalt as a single layer.
    for(let y=Math.ceil(hy)+1;y<H;y++) {
      const t=(y-hy)/(base-hy);
      const scale=Math.max(.012,t),z=65/scale-65;
      const width=(right-left)*unit*scale;
      const center=W/2+(320-cameraX)*unit*scale;
      const sy=mirroredRow(offset*1.35+z*2.15,img.height);
      c.globalAlpha=clamp((scale-.01)/.16,.32,1);
      const sampleHeight=Math.min(2,img.height-sy);
      c.drawImage(img,0,sy,img.width,sampleHeight,center-width/2,y,width,2);
    }
    c.globalAlpha=1;
    const roadShade=c.createLinearGradient(0,hy,0,H);
    roadShade.addColorStop(0,'#02061144');roadShade.addColorStop(.24,'#02061108');roadShade.addColorStop(1,'#01040a24');
    c.fillStyle=roadShade;c.fillRect(0,hy,W,H-hy);
  }
  function drawVignette() {
    const vignette=c.createRadialGradient(W/2,H*.58,H*.08,W/2,H*.56,Math.max(W,H)*.72);
    vignette.addColorStop(.45,'#00000000');vignette.addColorStop(1,'#02061172');
    c.fillStyle=vignette;c.fillRect(0,0,W,H);
  }
  function render() {
    const betrayal = mission instanceof BetrayalMission ? mission : null;
    const publicAccess = mission instanceof PublicAccessMission ? mission : null;
    const view: HudView = {
      state, readyToStart: state !== 'loading', mode: mission.mode, beatId: mission.beat,
      chapterId: publicAccess ? 'L3' : betrayal ? 'L2' : 'L1', chapterLabel: publicAccess ? 'PUBLIC ACCESS' : betrayal ? 'BETRAYAL' : 'DELIVERY',
      completionTitle: publicAccess ? 'PUBLIC ROUTE READY' : betrayal ? 'RECOVERY LOCK BROKEN' : 'DELIVERY APPROACH REACHED',
      continueLabel: publicAccess ? 'TAKE THE RESERVOIR ROAD' : betrayal ? 'RIDE TO THE RELAY' : 'CONTINUE TO INTAKE',
      completionSaveLabel: publicAccess ? 'SAVED / PUBLIC ROUTE READY' : betrayal ? 'SAVED / RECOVERY LOCK BROKEN' : 'SAVED / DELIVERY APPROACH',
      retryLabel: state === 'error' && (checkpoint === 'CP-L1-COMPLETE' || checkpoint === 'CP-L2-COMPLETE' || checkpoint?.startsWith('CP-L3-')) ? 'RETRY LOAD' : 'RETRY CHECKPOINT',
      objective: mission.objective, routeCue: mission.routeCue,
      speed: Math.round(speed), energy: charge,
      turbo: mission.mode !== 'action' ? 'unavailable' : boost > 0 && overdrive.active === 0 ? 'active' : charge >= .4 ? 'ready' : 'charging',
      dialogue: mission.dialogue, dialogueIndex: mission.dialogueIndex,
      dialogueCount: mission.dialogueCount, log: mission.log,
      record: betrayal?.record ?? null, recordIndex: betrayal?.recordIndex ?? (publicAccess ? publicAccess.records.length : 0), recordCount: betrayal ? 2 : publicAccess ? publicAccess.records.length : 0,
      records: betrayal?.records ?? publicAccess?.records, history: betrayal?.history ?? publicAccess?.history,
      abilities: {
        blades: { state: mission.mode === 'action' ? blades > .65 ? 'active' : 'ready' : 'unavailable', binding: 'J / CTRL' },
        jump: { state: mission.mode !== 'action' ? 'unavailable' : height > 0 ? 'active' : jumpCooldown > 0 ? 'cooldown' : 'ready', binding: 'K / ALT', cooldown: jumpCooldown },
      },
      overdrive: betrayal ? { value: overdrive.value, ready: overdrive.ready, active: overdrive.active > 0 } : undefined,
      missionMeter: publicAccess?.relay && publicAccess.mode === 'action' && (publicAccess.relay === 'A' || publicAccess.droneCleared) ? {
        label: `RELAY ${publicAccess.relay} CONNECTION`, value: publicAccess.activeLink?.progress ?? 0,
        detail: publicAccess.connectionState === 'linking' ? 'LINKING · STAY GROUNDED' : publicAccess.connectionState === 'in-range' ? 'IN RANGE · LAND TO LINK' : 'OUT OF RANGE · FOLLOW THE CORRIDOR',
      } : betrayal?.beat === 'L2.03' && !betrayal.lockBroken ? { label: 'RECOVERY LOCK', value: Math.min(1, betrayal.lockOutside / 1.5), detail: 'STEER OUTSIDE · HOLD 1.5S' } : undefined,
      connection: publicAccess?.relay && publicAccess.mode === 'action' && (publicAccess.relay === 'A' || publicAccess.droneCleared) ? {
        relay: publicAccess.relay, state: publicAccess.connectionState, progress: publicAccess.activeLink?.progress ?? 0,
      } : undefined,
      hasSave, saveStatus, message: state === 'playing' ? feedbackText : statusMessage,
    };
    hud.render(view);
    if (state === 'playing' && W < H && (mission.mode === 'story' || mission.mode === 'resolve')) {
      roadBaseRatio = storyBaseRatio();
    }
    c.imageSmoothingEnabled=true;
    drawCity();
    drawRoad();
    drawVignette();
    if (publicAccess) drawPublicAccessProps(); else if (betrayal) drawBetrayalProps(); else drawDeliveryProps();
    for(const car of traffic) if(car.kind==='drone') drawTelegraph(car);
    for(const car of traffic) if(car.kind==='drone'&&car.phase!=='lunge') {
      const fade = car.disengaging ? car.retreatDirection === -1 ? clamp((car.z + 65) / 53, 0, 1) : clamp((1500 - car.z) / 400, 0, 1) : 1;
      drawEffect('hoverThrust',car.x,car.z,car.w*.9,hoverLift(car)-8,(.5+.18*Math.sin(elapsed*18))*fade);
    }
    const drawBike=()=>{
      const lift=bikeLift();
      // Effects are road-layer art: render them behind the bike, centered on its exhaust/axle.
      for(const effect of effects.filter(effect=>effect.sprite==='landingRing')) drawBurst(effect);
      if(sliding && Math.abs(vx)>20) drawEffect('cyanTrail',x-vx*.035,0,32,lift-9,.72,1,10);
      if(boost>0) drawEffect('yellowTurbo',x,0,30,lift-10,.85+.1*Math.sin(elapsed*26),.9,12);
      if(blades>.08) drawEffect('bladeEffect',x,0,42,lift+1,Math.min(1,blades*.85),.9,9);
      const pose=bikePose();
      sprite(pose,x,0,sliding?34:26,47,lift);
      for(const particle of particles){c.globalAlpha=clamp(particle.life*3,0,1);c.fillStyle=particle.color;c.fillRect(particle.x,particle.y,2,boost>0?7:3);}c.globalAlpha=1;
    };
    let bikeDrawn=false;
    for(const car of [...traffic].sort((a,b)=>b.z-a.z)) {
      if(car.z<0&&!bikeDrawn){drawBike();bikeDrawn=true;}
      // Lift the sprite independently of its road-plane shadow; preserve its aspect ratio.
      const hover = hoverLift(car);

      c.save();
      if (car.disengaging) c.globalAlpha *= car.retreatDirection === -1
        ? clamp((car.z + 65) / 53, 0, 1) : clamp((1500 - car.z) / 400, 0, 1);
      sprite(vehicleSprite(car),car.x,car.z,car.w,car.kind==='hauler'?66:car.kind==='drone'?38:31,hover);
      c.restore();
    }
    if(!bikeDrawn)drawBike();
    for(const fragment of [...fragments].sort((a,b)=>b.z-a.z))drawFragment(fragment);
    for(const effect of [...effects].filter(effect=>effect.sprite!=='landingRing').sort((a,b)=>b.z-a.z))drawBurst(effect);
    if(!reduced&&boost>0){c.strokeStyle='#ffe57b55';for(let i=0;i<8;i++){const px=(i*137)%W;c.beginPath();c.moveTo(px,H);c.lineTo(W/2+(px-W/2)*.8,H*.8);c.stroke();}}
    // Small observable state is useful for regression tests and tuning controls.
    const drones=activeDrones(),drone=activeDrone();canvas.dataset.audio=audio?'ready':'locked';canvas.dataset.muted=String(muted);canvas.dataset.dronePhase=drone?.phase||'none';canvas.dataset.dronePhases=drones.map(item=>item.phase).join(',');canvas.dataset.droneCount=String(drones.length);canvas.dataset.droneOutcome=droneOutcome;canvas.dataset.dronePasses=String(drone?.attackPasses||0);canvas.dataset.droneZ=drone?.z.toFixed(1)||'none';canvas.dataset.fragments=String(fragments.length);canvas.dataset.dodges=String(droneDodges);canvas.dataset.hazard=String(Math.min(9999,...traffic.filter(car=>Math.abs(car.x-x)<(car.w+26)/2&&car.z>0).map(car=>car.z)));canvas.dataset.height=height.toFixed(2);canvas.dataset.blades=blades.toFixed(2);canvas.dataset.slices=String(slices);canvas.dataset.sliding=String(sliding);canvas.dataset.jumpReady=String(jumpCooldown===0);canvas.dataset.laneChanges=String(laneChanges);canvas.dataset.trafficSprites=traffic.filter(car=>car.kind!=='drone').map(vehicleSprite).join(',');canvas.dataset.view='rear-chase';canvas.dataset.state=state;canvas.dataset.mode=mission.mode;canvas.dataset.beat=mission.beat;canvas.dataset.dialogueId=mission.dialogue?.id??'';canvas.dataset.dialogueIndex=String(mission.dialogueIndex);canvas.dataset.route=mission.route.toFixed(1);canvas.dataset.visualDistance=distance.toFixed(1);canvas.dataset.trafficCount=String(traffic.length);canvas.dataset.traffic=JSON.stringify(traffic.map(car=>({id:car.id,x:+car.x.toFixed(1),z:+car.z.toFixed(1),kind:car.kind,lane:car.lane})));canvas.dataset.checkpoint=checkpoint??'';canvas.dataset.gatePassed=String(mission instanceof DeliveryMission && mission.gates.serviceGate);canvas.dataset.approachPassed=String(mission instanceof DeliveryMission && mission.gates.approach);canvas.dataset.serviceLoops=String(serviceLoops);canvas.dataset.x=x.toFixed(1);canvas.dataset.charge=charge.toFixed(2);canvas.dataset.boost=boost.toFixed(2);canvas.dataset.distance=distance.toFixed(1);canvas.dataset.score=String(Math.floor(score));
    canvas.dataset.chapter=publicAccess?'L3':betrayal?'L2':'L1';canvas.dataset.recordId=betrayal?.record?.id??'';canvas.dataset.recordIndex=String(betrayal?.recordIndex??publicAccess?.records.length??0);canvas.dataset.recordCount=String(betrayal?.records.length??publicAccess?.records.length??0);canvas.dataset.betrayalKnown=String(betrayal?.betrayalKnown??(publicAccess ? true : false));canvas.dataset.lockOutside=(betrayal?.lockOutside??0).toFixed(2);canvas.dataset.lockBroken=String(betrayal?.lockBroken??false);canvas.dataset.carrierZ=carrierZ.toFixed(1);canvas.dataset.carrierActive=String(carrierActive);canvas.dataset.overdrive=String(overdrive.value);canvas.dataset.overdriveActive=String(overdrive.active>0);
    const corridor = publicAccess?.corridor();
    canvas.dataset.relayA = String(publicAccess?.relayA ?? false); canvas.dataset.relayB = String(publicAccess?.relayB ?? false);
    canvas.dataset.relayTarget = publicAccess?.relay ?? 'none'; canvas.dataset.linkState = publicAccess?.connectionState ?? 'none';
    canvas.dataset.linkProgress = (publicAccess?.activeLink?.progress ?? 0).toFixed(3); canvas.dataset.linkSeconds = (publicAccess?.activeLink?.seconds ?? 0).toFixed(3);
    canvas.dataset.relayLoopsA = String(publicAccess?.loopsA ?? 0); canvas.dataset.relayLoopsB = String(publicAccess?.loopsB ?? 0);
    canvas.dataset.corridorStartZ = corridor?.startZ.toFixed(1) ?? 'none'; canvas.dataset.corridorEndZ = corridor?.endZ.toFixed(1) ?? 'none';
    canvas.dataset.relayDroneCleared = String(publicAccess?.droneCleared ?? false);
    const canvasBox = canvas.getBoundingClientRect();
    canvas.dataset.riderBottom = (canvasBox.top + project(x,0).y * canvasBox.height / H).toFixed(1);
  }
  function frame(now:number){
    const dt=Math.min((now-last)/1000,1/30);last=now;
    if(state==='playing')update(dt);
    if(state==='complete') { offset+=speed*dt*2.2; distance+=speed*dt/3.6; }
    if(state==='playing'||state==='complete'||frames++%3===0)render();
    requestAnimationFrame(frame);
  }
  const assets:Record<string,string>={bike:'bike-normal-straight',bikeBlades:'bike-blades-straight',bikeBladesLeft:'bike-blades-left-15',bikeBladesRight:'bike-blades-right-15',bikeBladesLeft35:'bike-blades-left-35',bikeBladesRight35:'bike-blades-right-35',bikeLeft:'bike-normal-left-15',bikeRight:'bike-normal-right-15',slideLeft:'bike-slide-left',slideRight:'bike-slide-right',jump:'bike-jump-straight',jumpLeft:'bike-jump-left-15',jumpRight:'bike-jump-right-15',coupe:'traffic-coupe',coupeLeft:'traffic-coupe-right',coupeRight:'traffic-coupe-left',sedan:'traffic-sedan',sedanLeft:'traffic-sedan-left',sedanRight:'traffic-sedan-right',hauler:'traffic-hauler',haulerLeft:'traffic-hauler-right',haulerRight:'traffic-hauler-left',drone:'drone-hover',droneFlankLeft:'drone-flank-left',droneFlankRight:'drone-flank-right',droneWarning:'drone-attack-warning',droneLunge:'drone-lunge',droneFragmentLeft:'drone-fragment-left',droneFragmentRight:'drone-fragment-right',droneCore:'drone-core',cyanTrail:'effects-cyan-trail',yellowTurbo:'effects-yellow-turbo',hoverThrust:'effects-hover-thrust',bladeEffect:'effects-blades',cutSparks:'effects-cut-sparks',impactSparks:'effects-impact-sparks',landingRing:'effects-landing-ring',debris:'effects-debris'};
  function loadImage(name: string, url: string) {
    return new Promise<void>((resolve,reject)=>{
      const img=new Image();img.onload=()=>{images[name]=img;resolve();};img.onerror=reject;img.src=url;
    });
  }
  function loadSprite(name:string,file:string) {
    return new Promise<void>((resolve,reject)=>{
    const img=new Image();img.onload=()=>{
      images[name]=img;
      // Remove transparent padding at draw time, leaving source art untouched.
      const surface=document.createElement('canvas');surface.width=img.width;surface.height=img.height;
      const sc=surface.getContext('2d')!;sc.drawImage(img,0,0);const data=sc.getImageData(0,0,img.width,img.height).data;
      let x0=img.width,y0=img.height,x1=0,y1=0;
      for(let yy=0;yy<img.height;yy++)for(let xx=0;xx<img.width;xx++)if(data[(yy*img.width+xx)*4+3]>80){x0=Math.min(x0,xx);x1=Math.max(x1,xx);y0=Math.min(y0,yy);y1=Math.max(y1,yy);}
      bounds[name]={x:x0,y:y0,w:Math.max(1,x1-x0+1),h:Math.max(1,y1-y0+1)};
      const b=bounds[name], maskCanvas=document.createElement('canvas');
      maskCanvas.width=maskCanvas.height=64;
      const mc=maskCanvas.getContext('2d')!;
      mc.drawImage(img,b.x,b.y,b.w,b.h,0,0,64,64);
      const pixels=mc.getImageData(0,0,64,64).data;
      masks[name]=Uint8Array.from({length:4096},(_,i)=>pixels[i*4+3]>200?1:0);
      if(bladeRoots[name]) bladeLayers[name]=bladeRoots[name].map((root,side)=>{
        const image=document.createElement('canvas');image.width=img.width;image.height=img.height;
        const context=image.getContext('2d')!, pixels=context.createImageData(img.width,img.height);
        let tip=root;
        for(let yy=0;yy<img.height;yy++)for(let xx=0;xx<img.width;xx++) {
          const i=(yy*img.width+xx)*4;
          // Isolate the yellow blade and its pale core beyond its mounting point.
          if(yy>=300 && yy<=365 && (side===0?xx<root:xx>root) && data[i]>140 && data[i+1]>110 &&
            data[i+1]>data[i]*.68 && data[i+2]<=data[i+1]*1.05 && data[i+3]>0) {
            pixels.data.set(data.subarray(i,i+4),i);
            if(data[i+3]>80) tip=side===0?Math.min(tip,xx):Math.max(tip,xx);
          }
        }
        context.putImageData(pixels,0,0);
        return {image,root,tip};
      });

      resolve();
    };img.onerror=reject;img.src=`/bastrop37/assets/sprites/${file}.png`;
    });
  }
  function loadAssets() {
    state = 'loading'; assetLoadFailed = false; statusMessage = 'Loading Delivery art and riding sprites.';
    void Promise.all([
      loadImage('city','/bastrop37/assets/environment/city-skyline-v4.png'),
      loadImage('architecture',DELIVERY_ASSETS.architecture),
      loadImage('signalDead',DELIVERY_ASSETS.signalDead),
      loadImage('serviceGateOpen',DELIVERY_ASSETS.serviceGateOpen),
      loadImage('crossingBlocked',DELIVERY_ASSETS.crossingBlocked),
      loadImage('vladNeutral',DELIVERY_ASSETS.vladNeutral),
      loadImage('omegaSymbol',DELIVERY_ASSETS.omegaSymbol),
      loadImage('road','/bastrop37/assets/environment/road-loop-v4.png'),
      ...Object.entries(assets).map(([name,file])=>loadSprite(name,file)),
    ]).then(()=>{
      size(); state = 'ready'; statusMessage = saveStatus === 'invalid' ? 'Saved progress is incompatible. Start a safe new ride.' : '';
    }).catch(()=>{
      assetLoadFailed = true; state = 'error'; statusMessage = 'A required Delivery asset could not load. Retry loading or return to the menu.';
    });
  }
  size(); requestAnimationFrame(frame); loadAssets();
}
