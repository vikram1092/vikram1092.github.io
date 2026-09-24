// BASTROP37 step 3: bike handling and abilities. X and Z are shared road-space units.
// Depth gates physical contact; projected opaque bodies decide visible contact.
type Car = { x: number; z: number; w: number; h: number; kind: string; velocity: number; passed: boolean };
type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string };
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
  const horizon = () => H * .28 + (reduced ? 0 : cameraPitch);
  function project(wx:number, z:number) {
    // Close chase: enlarge the whole road-space view, tracking the rider laterally.
    const scale = 65 / (65 + Math.max(-53,z));
    const zoom = (W < H ? 3 : 2.2) * (1 - (reduced ? 0 : turboView * .07));
    const unit = Math.min(W * .9, 520) / (right-left) * zoom;
    return {x:W/2+(wx-cameraX)*unit*scale, y:horizon()+(H*.84-horizon())*scale, scale:unit*scale};
  }
  let state: 'ready' | 'playing' | 'paused' | 'crashed' = 'ready';
  let x = 320, vx = 0, angle = 0;
  let charge = 1, boost = 0, speed = 260, distance = 0, calls = 0, elapsed = 0;
  let sliding = false, spawn = 0, offset = 0, last = 0, feedbackTime = 0;
  let traffic: Car[] = [], particles: Particle[] = [];
  let frames = 0;
  let cameraX = 320, cameraPitch = 0, turboView = 0;
  let height = 0, verticalSpeed = 0, jumpWindup = 0, jumpCooldown = 0;
  let landing = 0, blades = 0, slices = 0;
  const pressed = new Set<string>();
  function press(key:string) { if(!keys.has(key)) pressed.add(key); keys.add(key); }
  const actionKeys = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','ShiftLeft','KeyB','KeyJ'];
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
    clearInput(); x = 320; vx = angle = charge = boost = distance = calls = elapsed = offset = 0;
    charge = 1; speed = 210; spawn = .65; particles = [];
    cameraX = 320; cameraPitch = turboView = height = verticalSpeed = jumpWindup = jumpCooldown = landing = blades = slices = 0;
    traffic = [makeVehicle(1, 430, 'coupe'), makeVehicle(3, 730, 'hauler')];
    state = 'playing'; overlay.hidden = true; pauseButton.disabled = false; pauseButton.textContent = 'Ⅱ PAUSE';
    setMessage('SHIFT: TURBO · B: BLADES · J: JUMP', 3); canvas.focus({preventScroll:true});
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
    state = 'crashed'; clearInput(); charge = boost = 0; overlay.hidden = false;
    el('overline').textContent = 'CONTACT / CIRCUIT RESET'; el('headline').textContent = 'ONE MORE RUN.';
    el('message').textContent = `${Math.floor(distance)} m ridden · ${calls} close calls. Your next gap is waiting.`;
    start.textContent = 'RIDE AGAIN →'; pauseButton.disabled = true;
    setMessage('CONTACT — R TO RETRY', 5);
  }
  start.addEventListener('click', () => state === 'paused' ? resume() : reset());
  pauseButton.addEventListener('click', () => state === 'paused' ? resume() : pause());
  const aliases: Record<string,string> = { KeyA:'ArrowLeft',KeyD:'ArrowRight',KeyW:'ArrowUp',KeyS:'ArrowDown',ShiftRight:'ShiftLeft' };
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
  function spriteRect(name:string,wx:number,z:number,width:number,height:number,lift:number) {
    const p=project(wx,z), b=bounds[name];
    if(!b)return null;
    const scale=(['bike','slide','jump'].some(prefix=>name.startsWith(prefix))?height/b.h:width/b.w)*p.scale;
    return {x:p.x-b.w*scale/2,y:p.y-lift*p.scale-b.h*scale,w:b.w*scale,h:b.h*scale};
  }
  function bodyContact(car:Car,z:number,wx:number) {
    // Blades, exhaust, shadows and transparent sprite corners are not crash bodies.
    const name=bikePose(true), a=spriteRect(name,wx,0,26,47,bikeLift());
    const b=spriteRect(car.kind,car.x,z,car.w,0,hoverLift(car));
    if(!a||!b)return false;
    const am=masks[name], bm=masks[car.kind];
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
  function update(dt:number) {
    const oldX=x;
    elapsed += dt; feedbackTime -= dt;
    const input = Number(keys.has('ArrowRight'))-Number(keys.has('ArrowLeft'));
    boost = Math.max(0, boost-dt);
    jumpCooldown = Math.max(0,jumpCooldown-dt);
    landing = Math.max(0,landing-dt);
    if(pressed.has('ShiftLeft')) {
      if(boost===0 && charge>=.4) { charge-=.4; boost=1.15; sparks(18,'#ffe575'); setMessage('TURBO / TAKE THE GAP',1.15); }
      else if(boost===0) setMessage('TURBO RECHARGING',.8);
    }
    if(pressed.has('KeyJ') && height===0 && jumpWindup===0 && jumpCooldown===0) {
      jumpWindup=.12; jumpCooldown=1.25; setMessage('SPRING LOADED',.12);
    }
    pressed.clear();
    if(jumpWindup>0) {
      jumpWindup=Math.max(0,jumpWindup-dt);
      if(jumpWindup===0) { verticalSpeed=190; setMessage('AIRBORNE / CLEAR LOW TRAFFIC',.8); }
    }
    if(verticalSpeed!==0 || height>0) {
      verticalSpeed-=380*dt; height+=verticalSpeed*dt;
      if(height<=0) { height=verticalSpeed=0; landing=.42; sparks(20,'#8fffea'); setMessage('TOUCHDOWN',.5); }
    }
    blades += ((keys.has('KeyB')?1:0)-blades)*(1-Math.exp(-25*dt));
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
    offset += speed*dt; distance += speed*dt/3.6;
    if(sliding && Math.random()<.65) sparks(1,'#8fffea');
    if(boost>0) sparks(2,'#ffe575');
    spawn -= dt;
    if(spawn<=0) {
      const lane = Math.floor(Math.random()*5);
      const kind = Math.random()<.22 ? 'hauler' : Math.random()<.15 ? 'drone' : 'coupe';
      // One vehicle per wave leaves four lanes open; all enter at the far plane.
      traffic.push(makeVehicle(lane, 950, kind));
      spawn = 1.05+Math.random()*.35;
    }
    const bw = 26 + (sliding ? 8 : 0), bh = 24;
    for(const car of traffic) {
      const oldZ = car.z;
      car.z -= (speed-car.velocity)*dt;
      const dx = Math.abs(x-car.x), reach = (bh+car.h)/2;
      // Step 3 uses the existing passive drones as blade targets; encounters come later.
      if(car.kind==='drone' && blades>.65 && height<18 && dx<car.w/2+bladeReach(car.x) && oldZ>-40 && car.z<40) {
        car.passed=true; car.z=-100; slices++; sparks(24,'#ffe575',car.x,0);
        setMessage('DRONE SLICED',1); continue;
      }
      // The coupe's windows and glow extend above its physical body.
      const clearance = car.kind==='hauler'?110:car.kind==='drone'?32:24;
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
    particles=particles.filter(p=>p.life>0).slice(-180);
    for(const p of particles) {p.life-=dt;p.x+=p.vx*dt;p.y+=(p.vy+speed*.4)*dt;}
    if(feedbackTime<=0) el('feedback').textContent=height>0?'AIRBORNE':boost>0?'TURBO':sliding?'ENERGY SLIDE':blades>.5?'BLADES DEPLOYED':charge<.4?'TURBO RECHARGING':'SHIFT: TURBO · B: BLADES · J: JUMP';
  }
  function makeVehicle(lane:number,z:number,kind:string):Car {
    return {x:left+(lane+.5)*(right-left)/5,z,w:kind==='hauler'?76:kind==='drone'?48:64,
      h:kind==='hauler'?62:kind==='drone'?28:43,kind,velocity:kind==='hauler'?22:38,passed:false};
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
  function render() {
    c.imageSmoothingEnabled=true;
    const sky=c.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#070c20');sky.addColorStop(.32,'#56364f');sky.addColorStop(1,'#0c1527');c.fillStyle=sky;c.fillRect(0,0,W,H);
    // Stable skyline, with the vanishing point clear of tall scenery.
    for(let i=0;i<34;i++) {
      const bx=i*W/33, height=18+((i*73)%79), width=W/33+2;
      c.fillStyle=i%3?'#111c30':'#1b233d';c.fillRect(bx,horizon()-height,width,height+20);
      c.fillStyle=i%4?'#61748966':'#e5699555';
      for(let yy=horizon()-height+8;yy<horizon();yy+=9) c.fillRect(bx+4,yy,3,2);
    }
    strip(left-60,right+60,-65,2800,'#162032');
    strip(left,right,-65,2800,'#1c2939');
    for(let z=2400;z>-65;z-=40) {
      const zz=z-offset%40;
      if(zz < -65)continue;
      strip(left,right,zz,zz+20,'#1a2535');
      for(let lane=1;lane<5;lane++) {
        const lx=left+lane*(right-left)/5;
        strip(lx-.7,lx+.7,zz,zz+18,'#81929c88');
      }
      strip(left-3,left,zz,zz+25,'#e7779d');strip(right,right+3,zz,zz+25,'#65cdd1');
    }
    // Perspective roadside pylons reinforce distance without obscuring traffic.
    for(let z=1500;z>0;z-=150) for(const edge of [left-18,right+18]) {
      const p=project(edge,z-offset%150);
      c.strokeStyle='#67c6d077';c.lineWidth=Math.max(1,2*p.scale);c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x,p.y-95*p.scale);c.stroke();
    }
    const drawBike=()=>{
      const p=project(x,0);
      // Exhaust and sparks remain independent of the approved vehicle sprite.
      if(boost>0) polygon([{x:p.x-7*p.scale,y:p.y-height*p.scale-7},{x:p.x+7*p.scale,y:p.y-height*p.scale-7},{x:p.x+4*p.scale,y:H},{x:p.x-4*p.scale,y:H}],'#ffe35e88');
      const lift=bikeLift();
      if(sliding && Math.abs(vx)>20) {
        c.strokeStyle='#8fffea99';c.lineWidth=2;c.beginPath();c.moveTo(p.x-14,p.y);c.lineTo(p.x-vx*.22,p.y+28);c.stroke();
      }
      const pose=bikePose();
      sprite(pose,x,0,sliding?34:26,47,lift);
      for(const particle of particles){c.globalAlpha=clamp(particle.life*3,0,1);c.fillStyle=particle.color;c.fillRect(particle.x,particle.y,2,boost>0?7:3);}c.globalAlpha=1;
    };
    let bikeDrawn=false;
    for(const car of [...traffic].sort((a,b)=>b.z-a.z)) {
      if(car.z<0&&!bikeDrawn){drawBike();bikeDrawn=true;}
      // Lift the sprite independently of its road-plane shadow; preserve its aspect ratio.
      const hover = hoverLift(car);

      sprite(car.kind,car.x,car.z,car.w,car.kind==='hauler'?66:car.kind==='drone'?38:31,hover);
    }
    if(!bikeDrawn)drawBike();
    if(!reduced&&boost>0){c.strokeStyle='#ffe57b55';for(let i=0;i<8;i++){const px=(i*137)%W;c.beginPath();c.moveTo(px,H);c.lineTo(W/2+(px-W/2)*.8,H*.8);c.stroke();}}
    el('speed').textContent=Math.round(speed).toString();el('near').textContent=calls.toString();
    el('charge-value').textContent=Math.round(charge*100)+'%';el('charge-bar').style.width=charge*100+'%';
    // Small observable state is useful for regression tests and tuning controls.
    canvas.dataset.hazard=String(Math.min(9999,...traffic.filter(car=>Math.abs(car.x-x)<(car.w+26)/2&&car.z>0).map(car=>car.z)));canvas.dataset.height=height.toFixed(2);canvas.dataset.blades=blades.toFixed(2);canvas.dataset.slices=String(slices);canvas.dataset.sliding=String(sliding);canvas.dataset.jumpReady=String(jumpCooldown===0);canvas.dataset.view='rear-chase';canvas.dataset.state=state;canvas.dataset.x=x.toFixed(1);canvas.dataset.charge=charge.toFixed(2);canvas.dataset.boost=boost.toFixed(2);canvas.dataset.distance=distance.toFixed(1);
  }
  function frame(now:number){const dt=Math.min((now-last)/1000,1/30);last=now;if(state==='playing')update(dt);if(state==='playing'||frames++%3===0)render();requestAnimationFrame(frame);}
  const assets:Record<string,string>={bike:'bike-normal-straight',bikeBlades:'bike-blades-straight',bikeBladesLeft:'bike-blades-left-15',bikeBladesRight:'bike-blades-right-15',bikeBladesLeft35:'bike-blades-left-35',bikeBladesRight35:'bike-blades-right-35',bikeLeft:'bike-normal-left-15',bikeRight:'bike-normal-right-15',slideLeft:'bike-normal-left-35',slideRight:'bike-normal-right-35',jump:'bike-jump-straight',jumpLeft:'bike-jump-left-15',jumpRight:'bike-jump-right-15',coupe:'traffic-coupe',hauler:'traffic-hauler',drone:'drone-hover'};
  Promise.all(Object.entries(assets).map(([name,file])=>new Promise<void>((resolve,reject)=>{
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
  })))
    .then(()=>{size();start.disabled=false;start.textContent='START RIDING →';requestAnimationFrame(frame);})
    .catch(()=>{el('message').textContent='A sprite could not load. Refresh to try again.';start.textContent='ASSET LOAD FAILED';});
}
