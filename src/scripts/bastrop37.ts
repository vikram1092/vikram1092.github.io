// BASTROP37 step 5: a timed city-to-sea-wall escape.
// X and Z are shared road-space units; projected opaque bodies decide visible contact.
type DronePhase = 'approach' | 'flank' | 'signal' | 'lunge' | 'recover';
type DroneOutcome = 'none' | 'slice' | 'boost' | 'jump' | 'miss';
type Car = {
  x: number; z: number; w: number; h: number; kind: 'coupe' | 'sedan' | 'hauler' | 'drone';
  velocity: number; passed: boolean; phase?: DronePhase; phaseTime?: number;
  side?: -1 | 1; attackX?: number; outcome?: DroneOutcome; attackPasses?: number;
  lane: number; targetLane: number; turn: -1 | 0 | 1; changeZ: number; changed: boolean;
};
type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string };
type Fragment = { sprite: string; x: number; z: number; lift: number; vx: number; vz: number; vy: number; rotation: number; spin: number; life: number; width: number };
type EffectBurst = { sprite: string; x: number; z: number; lift: number; life: number; duration: number; width: number };
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
export function mountGame() {
  const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
  const ctx = canvas.getContext('2d');
  const start = document.querySelector<HTMLButtonElement>('#start')!;
  if (!ctx) { start.textContent = 'CANVAS UNAVAILABLE'; return; }
  const c = ctx;
  const el = (id: string) => document.getElementById(id)!;
  const overlay = el('overlay');
  const pauseButton = document.querySelector<HTMLButtonElement>('#pause')!;
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

  let W = 640, H = 360;
  const left = 128, right = 512;
  const bounds: Record<string, {x:number;y:number;w:number;h:number}> = {};
  // The environment plate's road vanishes just below the city shelf. Keeping the
  // projection on that same horizon makes traffic feel embedded in the painting.
  const horizon = () => H * .475 + (reduced ? 0 : cameraPitch);
  function project(wx:number, z:number) {
    // Close chase: enlarge the whole road-space view, tracking the rider laterally.
    const scale = 65 / (65 + Math.max(-53,z));
    const zoom = (W < H ? 3 : 2.2) * (1 - (reduced ? 0 : turboView * .07));
    const unit = Math.min(W * .9, 520) / (right-left) * zoom;
    return {x:W/2+(wx-cameraX)*unit*scale, y:horizon()+(H*.84-horizon())*scale, scale:unit*scale};
  }
  type GameState = 'ready' | 'playing' | 'paused' | 'crashed' | 'escaped' | 'timeout';
  let state: GameState = 'ready';
  let x = 320, vx = 0, angle = 0;
  let charge = 1, boost = 0, speed = 260, distance = 0, calls = 0, elapsed = 0;
  let sliding = false, spawn = 0, offset = 0, last = 0, feedbackTime = 0;
  let traffic: Car[] = [], particles: Particle[] = [], fragments: Fragment[] = [], effects: EffectBurst[] = [];
  let frames = 0;
  let cameraX = 320, cameraPitch = 0, turboView = 0;
  let height = 0, verticalSpeed = 0, jumpWindup = 0, jumpCooldown = 0;
  let landing = 0, blades = 0, slices = 0, droneDodges = 0, laneChanges = 0;
  let droneOutcome: DroneOutcome = 'none';
  let introDroneSpawned = false;
  const timeLimit = 90;
  const finishDistance = 6000;
  let score = 0;
  const pressed = new Set<string>();
  function press(key:string) { if(!keys.has(key)) pressed.add(key); keys.add(key); }
  const actionKeys = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','ShiftLeft','ControlLeft','AltLeft'];
  function size() {
    const portrait = canvas.clientWidth / canvas.clientHeight < 1;
    const nw = portrait ? 360 : 640, nh = portrait ? 450 : 360;
    if (W === nw && H === nh) return;
    W = canvas.width = nw; H = canvas.height = nh;
  }
  const resize = new ResizeObserver(() => { size(); if (state === 'playing') pause(); });
  resize.observe(canvas);
  function setMessage(text: string, seconds = 1) { el('feedback').textContent = text; feedbackTime = seconds; }
  function clearInput() { keys.clear(); pressed.clear(); sliding = false; document.querySelectorAll('.held').forEach(b => b.classList.remove('held')); }
  function reset() {
    clearInput(); x = 320; vx = angle = charge = boost = distance = calls = elapsed = offset = score = 0;
    charge = 1; speed = 210; spawn = 7.5; particles = []; fragments = []; effects = [];
    cameraX = 320; cameraPitch = turboView = height = verticalSpeed = jumpWindup = jumpCooldown = landing = blades = slices = droneDodges = laneChanges = 0;
    droneOutcome = 'none'; introDroneSpawned = false;
    traffic = [makeVehicle(1, 430, 'coupe'), makeVehicle(3, 730, 'hauler'), makeVehicle(0, 850, 'sedan')];
    state = 'playing'; overlay.hidden = true; pauseButton.disabled = false; pauseButton.textContent = 'Ⅱ PAUSE';
    setMessage('SHIFT: TURBO · CMD/CTRL: BLADES · OPT/ALT: JUMP', 3); canvas.focus({preventScroll:true});
  }
  function pause() {
    if (state !== 'playing') return;
    state = 'paused'; clearInput(); overlay.hidden = false;
    el('overline').textContent = 'CIRCUIT ON HOLD'; el('headline').textContent = 'TAKE A BREATH.';
    el('message').textContent = 'Your ride is right where you left it.'; start.textContent = 'RESUME RIDE →';
    pauseButton.textContent = '▶ RESUME';
  }
  function resume() { state = 'playing'; clearInput(); overlay.hidden = true; pauseButton.textContent = 'Ⅱ PAUSE'; canvas.focus({preventScroll:true}); }
  function crash() {
    burst('impactSparks',x,0,bikeLift(),74,.55);
    burst('debris',x,0,bikeLift(),62,.75);
    state = 'crashed'; clearInput(); charge = boost = 0; overlay.hidden = false;
    el('overline').textContent = 'CONTACT / CIRCUIT RESET'; el('headline').textContent = 'ONE MORE RUN.';
    el('message').textContent = `${Math.floor(distance)} m ridden · ${formatScore(score)} points · ${calls} close calls.`;
    start.textContent = 'RIDE AGAIN →'; pauseButton.disabled = true;
    setMessage('CONTACT — R TO RETRY', 5);
  }
  function formatScore(value:number) { return Math.max(0,Math.floor(value)).toString().padStart(6,'0'); }
  function endRun(result:'escaped'|'timeout') {
    if(state!=='playing')return;
    state=result; clearInput(); boost=0; overlay.hidden=false; pauseButton.disabled=true;
    if(result==='escaped') {
      const bonus=Math.ceil(Math.max(0,timeLimit-elapsed))*100;
      score+=bonus;
      el('overline').textContent='SEA WALL / GATE CLEARED'; el('headline').innerHTML='ESCAPE<br/><em>COMPLETE.</em>';
      el('message').textContent=`${formatScore(score)} points · ${Math.max(0,timeLimit-elapsed).toFixed(1)} seconds left · ${slices} drones cut.`;
      start.textContent='RIDE AGAIN →'; setMessage(`EXTRACTED / +${bonus} TIME BONUS`,5);
    } else {
      el('overline').textContent='SEA WALL / GATE SEALED'; el('headline').innerHTML='TIME<br/><em>EXPIRED.</em>';
      el('message').textContent=`${Math.floor(distance)} of ${finishDistance} m · ${formatScore(score)} points. The route is still warm.`;
      start.textContent='RETRY ESCAPE →'; setMessage('GATE SEALED — R TO RETRY',5);
    }
  }
  start.addEventListener('click', () => state === 'paused' ? resume() : reset());
  pauseButton.addEventListener('click', () => state === 'paused' ? resume() : pause());
  const aliases: Record<string,string> = {
    KeyA:'ArrowLeft', KeyD:'ArrowRight', KeyW:'ArrowUp', KeyS:'ArrowDown',
    ShiftRight:'ShiftLeft', ControlRight:'ControlLeft', MetaLeft:'ControlLeft', MetaRight:'ControlLeft', AltRight:'AltLeft',
  };
  addEventListener('keydown', e => {
    // Keep keyboard activation and navigation working on page controls.
    if ((e.target as HTMLElement)?.tagName === 'BUTTON' || (e.target as HTMLElement)?.tagName === 'A') return;
    const key = aliases[e.code] || e.code;
    if (actionKeys.includes(key)) { e.preventDefault(); if (state === 'playing' && !e.repeat) press(key); }
    if (e.repeat) return;
    if (e.code === 'KeyP' || e.code === 'Escape') state === 'paused' ? resume() : pause();
    if (e.code === 'KeyR' && start.disabled === false) reset();
  });
  addEventListener('keyup', e => keys.delete(aliases[e.code] || e.code));
  addEventListener('blur', pause);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  document.querySelectorAll<HTMLButtonElement>('[data-key]').forEach(button => {
    button.addEventListener('pointerdown', e => { e.preventDefault(); if(state!=='playing')return; button.setPointerCapture(e.pointerId); press(button.dataset.key!); button.classList.add('held'); });
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
  function activeDrone() { return traffic.find(car=>car.kind==='drone'&&!car.passed); }
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
      setMessage('DRONE SLICED / CLEAN CUT',1.15);
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
    if(car.phase==='approach') {
      car.z-=Math.min(115,Math.max(70,speed-car.velocity))*dt;
      if(car.z<=610) {
        car.phase='flank'; car.phaseTime=1.05;
        setMessage('DRONE APPROACH / WATCH THE FLANK',1);
      }
    } else if(car.phase==='flank') {
      car.phaseTime=Math.max(0,(car.phaseTime||0)-dt);
      const flankX=clamp(x+(car.side||1)*82,left+28,right-28);
      car.x+=(flankX-car.x)*(1-Math.exp(-3.2*dt));
      car.z-=Math.min(105,Math.max(62,speed-car.velocity))*dt;
      if(car.phaseTime===0&&car.z<=235&&canSignalDrone(car)) {
        car.phase='signal'; car.phaseTime=.8; car.attackX=x; car.z=205;
        setMessage('ATTACK SIGNAL / SLICE · BOOST · JUMP',.9);
      } else if(car.z<170) car.z=170;
    } else if(car.phase==='signal') {
      car.phaseTime=Math.max(0,(car.phaseTime||0)-dt);
      car.z+=(205-car.z)*(1-Math.exp(-6*dt));
      if(boost>0) { finishDrone(car,'boost'); return; }
      if(car.phaseTime===0) {
        car.phase='lunge'; car.phaseTime=1.05;
        setMessage('LUNGE / ACT NOW',.55);
      }
    } else if(car.phase==='lunge') {
      if(boost>0&&car.z>34) { finishDrone(car,'boost'); return; }
      car.phaseTime=Math.max(0,(car.phaseTime||0)-dt);
      car.x+=((car.attackX??x)-car.x)*(1-Math.exp(-7*dt));
      car.z-=300*dt;
    } else {
      car.phaseTime=Math.max(0,(car.phaseTime||0)-dt);
      const retreatX=clamp(x+(car.side||1)*130,left+28,right-28);
      car.x+=(retreatX-car.x)*(1-Math.exp(-3.6*dt));
      car.z+=(255-car.z)*(1-Math.exp(-2.7*dt));
      if(car.phaseTime===0) {
        if((car.attackPasses||0)>=3) { car.passed=true; car.z=-100; }
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
    if(elapsed>=timeLimit) { endRun('timeout'); return; }
    const input = Number(keys.has('ArrowRight'))-Number(keys.has('ArrowLeft'));
    boost = Math.max(0, boost-dt);
    jumpCooldown = Math.max(0,jumpCooldown-dt);
    landing = Math.max(0,landing-dt);
    if(pressed.has('ShiftLeft')) {
      if(boost===0 && charge>=.4) { charge-=.4; boost=1.15; sparks(18,'#ffe575'); setMessage('TURBO / TAKE THE GAP',1.15); }
      else if(boost===0) setMessage('TURBO RECHARGING',.8);
    }
    if(pressed.has('AltLeft') && height===0 && jumpWindup===0 && jumpCooldown===0) {
      jumpWindup=.12; jumpCooldown=1.25; setMessage('SPRING LOADED',.12);
    }
    pressed.clear();
    if(jumpWindup>0) {
      jumpWindup=Math.max(0,jumpWindup-dt);
      if(jumpWindup===0) { verticalSpeed=190; setMessage('AIRBORNE / CLEAR LOW TRAFFIC',.8); }
    }
    if(verticalSpeed!==0 || height>0) {
      verticalSpeed-=380*dt; height+=verticalSpeed*dt;
      if(height<=0) { height=verticalSpeed=0; landing=.42; burst('landingRing',x,0,0,72,.5); sparks(20,'#8fffea'); setMessage('TOUCHDOWN',.5); }
    }
    blades += ((keys.has('ControlLeft')?1:0)-blades)*(1-Math.exp(-25*dt));
    sliding = keys.has('Space') && height===0 && boost===0;
    // Slide is a deliberate lateral reposition, with countersteer and strong release grip.
    if(boost===0) charge=clamp(charge+dt*(sliding&&input ? .3 : .10),0,1);
    // Faster road motion and closing speed, while keeping ability timers in real time.
    const target = sliding ? 200 : boost>0 ? 470 : keys.has('ArrowDown') ? 155 : keys.has('ArrowUp') ? 320 : 260;
    speed += (target-speed)*(1-Math.exp(-(boost>0?7:4)*dt));
    vx += (input*(sliding?230:180)*(height>0?.8:1)-vx)*(1-Math.exp(-(sliding?10:20)*dt));
    x = clamp(x+vx*dt,left+22,right-22);
    if(x===left+22 || x===right-22) vx=0;
    angle += ((sliding?input*.65:input*.19)-angle)*(1-Math.exp(-16*dt));
    cameraX += (320+(x-320)*.85-cameraX)*(1-Math.exp(-12*dt));
    turboView += ((boost>0?1:0)-turboView)*(1-Math.exp(-5*dt));
    cameraPitch += ((boost>0?5:0)-height*.08+(landing>0?Math.sin((.42-landing)*22)*landing*10:0)-cameraPitch)*(1-Math.exp(-8*dt));
    // Denser road flow sells velocity without changing collision or encounter timing.
    offset += speed*dt*1.55; distance += speed*dt/3.6;
    if(sliding && Math.random()<.65) sparks(1,'#8fffea');
    if(boost>0) sparks(2,'#ffe575');
    spawn -= dt;
    // An authored first encounter follows the traffic-only opening; later drones
    // join the procedural pressure curve and eventually overlap with traffic.
    if(!introDroneSpawned&&elapsed>=6.2) {
      introDroneSpawned=true;
      // Open a fair answer window before the authored lunge.
      traffic=traffic.filter(car=>car.kind==='drone'||car.z< -90||car.z>700);
      traffic.push(makeVehicle(x<320?3:1,420,'drone'));
    }
    const runProgress=distance/finishDistance;
    if(spawn<=0&&(!activeDrone()||runProgress>=.6)) {
      const lane = Math.floor(Math.random()*5);
      const progress=runProgress;
      const droneChance=progress<.24?0:progress<.6?.16:.25;
      const roll=Math.random();
      const kind = !activeDrone()&&roll<droneChance ? 'drone' : roll<droneChance+.2 ? 'hauler' : Math.random()<.48 ? 'sedan' : 'coupe';
      // One vehicle per wave leaves four lanes open; all enter at the far plane.
      traffic.push(makeVehicle(lane, 950, kind));
      spawn = (progress<.24?1.2:progress<.6?1.05:.86)+Math.random()*.28;
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
        if(gap>=0 && gap<17) { calls++; charge=clamp(charge+.3,0,1); sparks(10,'#ffd5a3'); setMessage('CLOSE CALL / +30 ENERGY',1.2); }
      }
    }
    traffic=traffic.filter(car=>car.z>-65);
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
    if(distance>=finishDistance) { endRun('escaped'); return; }
    if(feedbackTime<=0) el('feedback').textContent=height>0?'AIRBORNE':boost>0?'TURBO':sliding?'ENERGY SLIDE':blades>.5?'BLADES DEPLOYED':charge<.4?'TURBO RECHARGING':'SHIFT: TURBO · CMD/CTRL: BLADES · OPT/ALT: JUMP';
  }
  function makeVehicle(lane:number,z:number,kind:string):Car {
    const vehicle=kind as Car['kind'];
    return {x:left+(lane+.5)*(right-left)/5,z,w:vehicle==='hauler'?76:vehicle==='drone'?48:64,
      h:vehicle==='hauler'?62:vehicle==='drone'?28:43,kind:vehicle,velocity:vehicle==='hauler'?22:38,passed:false,
      lane,targetLane:lane,turn:0,changeZ:720,changed:lane===2||(Math.floor(z)+lane*7+vehicle.length)%3!==0,
      ...(vehicle==='drone'?{phase:'approach' as DronePhase,phaseTime:0,side:(lane<=2?-1:1) as -1|1,attackX:320,outcome:'none' as DroneOutcome,attackPasses:0}:{})};
  }
  function polygon(points:{x:number;y:number}[],color:string) {
    c.fillStyle=color;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fill();
  }
  function strip(x1:number,x2:number,z1:number,z2:number,color:string) {
    polygon([project(x1,z1),project(x2,z1),project(x2,z2),project(x1,z2)],color);
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
  function drawSeaWall() {
    const z=(finishDistance-distance)*3.6;
    if(z>2600||z< -55)return;
    const gateHalf=66, wallLeft=project(left-70,z), wallRight=project(right+70,z);
    const gateL=project(320-gateHalf,z), gateR=project(320+gateHalf,z);
    const topY=Math.min(gateL.y,gateR.y)-190*gateL.scale;
    c.fillStyle='#091522';
    c.fillRect(wallLeft.x,topY,Math.max(0,gateL.x-wallLeft.x),wallLeft.y-topY);
    c.fillRect(gateR.x,topY,Math.max(0,wallRight.x-gateR.x),wallRight.y-topY);
    c.strokeStyle='#77e5df';c.lineWidth=Math.max(1,3*gateL.scale);
    c.beginPath();c.moveTo(gateL.x,gateL.y);c.lineTo(gateL.x,topY);c.lineTo(gateR.x,topY);c.lineTo(gateR.x,gateR.y);c.stroke();
    c.fillStyle='#ff5d70';c.font=`${Math.max(5,10*gateL.scale)}px monospace`;c.textAlign='center';
    c.fillText('SEA WALL 37 / EXTRACTION', (gateL.x+gateR.x)/2, topY+16*gateL.scale);
    c.textAlign='start';
  }
  function drawEnvironment() {
    const img=images.environment;
    if(!img)return;
    // Cover gives portrait screens a cinematic center crop. A little overscan
    // leaves room for restrained lateral parallax without exposing an edge.
    const scale=Math.max(W/img.width,H/img.height)*1.055;
    const dw=img.width*scale,dh=img.height*scale;
    const parallax=-(cameraX-320)*.055;
    c.drawImage(img,(W-dw)/2+parallax,(H-dh)/2,dw,dh);

    // Keep the road dark enough for silhouettes while retaining the plate's
    // puddles, seams, specular detail, and colored architectural reflections.
    const roadShade=c.createLinearGradient(0,horizon(),0,H);
    roadShade.addColorStop(0,'#06101a00');
    roadShade.addColorStop(.35,'#04081212');
    roadShade.addColorStop(1,'#02050a38');
    c.fillStyle=roadShade;c.fillRect(0,horizon(),W,H-horizon());

    const vignette=c.createRadialGradient(W/2,H*.58,H*.08,W/2,H*.56,Math.max(W,H)*.72);
    vignette.addColorStop(.45,'#00000000');vignette.addColorStop(1,'#02061172');
    c.fillStyle=vignette;c.fillRect(0,0,W,H);
  }
  function render() {
    c.imageSmoothingEnabled=true;
    drawEnvironment();
    // Gameplay geometry now sits lightly over the painted asphalt instead of
    // replacing it with broad, flat trapezoids.
    strip(left,right,-65,2800,'#02071318');
    for(let z=2500;z>-65;z-=96) {
      const zz=z-offset%96;
      if(zz < -65)continue;
      for(let lane=1;lane<5;lane++) {
        const lx=left+lane*(right-left)/5;
        strip(lx-.52,lx+.52,zz,zz+42,'#d6edf0a0');
      }
      strip(left-1.8,left,zz,zz+56,'#ff6b78aa');strip(right,right+1.8,zz,zz+56,'#67e1e6aa');
    }
    // Small reflected guide lights add motion without rebuilding the roadside
    // architecture from primitive shapes.
    for(let z=1800;z>0;z-=120) for(const [edge,color] of [[left-8,'#ff6979'],[right+8,'#7bf5ef']] as const) {
      const p=project(edge,z-offset%120),radius=Math.max(.45,2.6*p.scale);
      c.save();c.shadowColor=color;c.shadowBlur=8*p.scale;c.fillStyle=color;
      c.beginPath();c.ellipse(p.x,p.y,radius,radius*.34,0,0,Math.PI*2);c.fill();c.restore();
    }
    drawSeaWall();
    for(const car of traffic) if(car.kind==='drone') drawTelegraph(car);
    for(const car of traffic) if(car.kind==='drone'&&car.phase!=='lunge')
      drawEffect('hoverThrust',car.x,car.z,car.w*.9,hoverLift(car)-8,.5+.18*Math.sin(elapsed*18));
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

      sprite(vehicleSprite(car),car.x,car.z,car.w,car.kind==='hauler'?66:car.kind==='drone'?38:31,hover);
    }
    if(!bikeDrawn)drawBike();
    for(const fragment of [...fragments].sort((a,b)=>b.z-a.z))drawFragment(fragment);
    for(const effect of [...effects].filter(effect=>effect.sprite!=='landingRing').sort((a,b)=>b.z-a.z))drawBurst(effect);
    if(!reduced&&boost>0){c.strokeStyle='#ffe57b55';for(let i=0;i<8;i++){const px=(i*137)%W;c.beginPath();c.moveTo(px,H);c.lineTo(W/2+(px-W/2)*.8,H*.8);c.stroke();}}
    const remaining=Math.max(0,timeLimit-elapsed),minutes=Math.floor(remaining/60),seconds=remaining-minutes*60;
    el('timer').textContent=`0${minutes}:${seconds.toFixed(1).padStart(4,'0')}`;
    el('timer').classList.toggle('urgent',remaining<=15);
    el('score').textContent=formatScore(score);
    el('sector').textContent=distance<finishDistance*.24?'CITY EXIT / TRAFFIC':distance<finishDistance*.6?'UNDERPASS / DRONES':distance<finishDistance-700?'PURSUIT / COMBINED':'SEA WALL / FINAL';
    el('speed').textContent=Math.round(speed).toString();el('near').textContent=calls.toString();
    el('charge-value').textContent=Math.round(charge*100)+'%';el('charge-bar').style.width=charge*100+'%';
    // Small observable state is useful for regression tests and tuning controls.
    const drone=activeDrone();canvas.dataset.dronePhase=drone?.phase||'none';canvas.dataset.droneOutcome=droneOutcome;canvas.dataset.dronePasses=String(drone?.attackPasses||0);canvas.dataset.droneZ=drone?.z.toFixed(1)||'none';canvas.dataset.fragments=String(fragments.length);canvas.dataset.dodges=String(droneDodges);canvas.dataset.hazard=String(Math.min(9999,...traffic.filter(car=>Math.abs(car.x-x)<(car.w+26)/2&&car.z>0).map(car=>car.z)));canvas.dataset.height=height.toFixed(2);canvas.dataset.blades=blades.toFixed(2);canvas.dataset.slices=String(slices);canvas.dataset.sliding=String(sliding);canvas.dataset.jumpReady=String(jumpCooldown===0);canvas.dataset.laneChanges=String(laneChanges);canvas.dataset.trafficSprites=traffic.filter(car=>car.kind!=='drone').map(vehicleSprite).join(',');canvas.dataset.view='rear-chase';canvas.dataset.state=state;canvas.dataset.x=x.toFixed(1);canvas.dataset.charge=charge.toFixed(2);canvas.dataset.boost=boost.toFixed(2);canvas.dataset.distance=distance.toFixed(1);canvas.dataset.time=remaining.toFixed(1);canvas.dataset.score=String(Math.floor(score));canvas.dataset.sector=el('sector').textContent||'';
  }
  function frame(now:number){const dt=Math.min((now-last)/1000,1/30);last=now;if(state==='playing')update(dt);if(state==='playing'||frames++%3===0)render();requestAnimationFrame(frame);}
  const assets:Record<string,string>={bike:'bike-normal-straight',bikeBlades:'bike-blades-straight',bikeBladesLeft:'bike-blades-left-15',bikeBladesRight:'bike-blades-right-15',bikeBladesLeft35:'bike-blades-left-35',bikeBladesRight35:'bike-blades-right-35',bikeLeft:'bike-normal-left-15',bikeRight:'bike-normal-right-15',slideLeft:'bike-slide-left',slideRight:'bike-slide-right',jump:'bike-jump-straight',jumpLeft:'bike-jump-left-15',jumpRight:'bike-jump-right-15',coupe:'traffic-coupe',coupeLeft:'traffic-coupe-right',coupeRight:'traffic-coupe-left',sedan:'traffic-sedan',sedanLeft:'traffic-sedan-left',sedanRight:'traffic-sedan-right',hauler:'traffic-hauler',haulerLeft:'traffic-hauler-left',haulerRight:'traffic-hauler-right',drone:'drone-hover',droneFlankLeft:'drone-flank-left',droneFlankRight:'drone-flank-right',droneWarning:'drone-attack-warning',droneLunge:'drone-lunge',droneFragmentLeft:'drone-fragment-left',droneFragmentRight:'drone-fragment-right',droneCore:'drone-core',cyanTrail:'effects-cyan-trail',yellowTurbo:'effects-yellow-turbo',hoverThrust:'effects-hover-thrust',bladeEffect:'effects-blades',cutSparks:'effects-cut-sparks',impactSparks:'effects-impact-sparks',landingRing:'effects-landing-ring',debris:'effects-debris'};
  const environmentReady=new Promise<void>((resolve,reject)=>{
    const img=new Image();img.onload=()=>{images.environment=img;resolve();};img.onerror=reject;
    img.src='/bastrop37/assets/environment/city-expressway-v2.jpg';
  });
  Promise.all([environmentReady,...Object.entries(assets).map(([name,file])=>new Promise<void>((resolve,reject)=>{
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
  }))])
    .then(()=>{size();start.disabled=false;start.textContent='START RIDING →';requestAnimationFrame(frame);})
    .catch(()=>{el('message').textContent='A sprite could not load. Refresh to try again.';start.textContent='ASSET LOAD FAILED';});
}
