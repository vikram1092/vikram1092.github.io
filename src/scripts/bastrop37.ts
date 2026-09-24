// BASTROP37 step 2: rear chase camera. X and Z are shared road-space units.
// Project only for drawing; collision uses the same vehicle footprints.
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
  let W = 640, H = 360;
  const left = 128, right = 512;
  const bounds: Record<string, {x:number;y:number;w:number;h:number}> = {};
  const horizon = () => H * .28;
  function project(wx:number, z:number) {
    const scale = 110 / (110 + Math.max(-65,z));
    const unit = Math.min(W * .9, 520) / (right-left);
    return {x:W/2+(wx-320)*unit*scale, y:horizon()+(H*.84-horizon())*scale, scale:unit*scale};
  }
  let state: 'ready' | 'playing' | 'paused' | 'crashed' = 'ready';
  let x = 320, y = 270, vx = 0, angle = 0, direction = 1;
  let charge = 0, boost = 0, speed = 180, distance = 0, calls = 0, elapsed = 0;
  let sliding = false, spawn = 0, offset = 0, last = 0, feedbackTime = 0;
  let traffic: Car[] = [], particles: Particle[] = [];
  let frames = 0;
  function size() {
    const portrait = canvas.clientWidth / canvas.clientHeight < 1;
    const nw = portrait ? 360 : 640, nh = portrait ? 450 : 360;
    if (W === nw && H === nh) return;
    W = canvas.width = nw; H = canvas.height = nh;
    y = H * .84;
  }
  const resize = new ResizeObserver(() => { size(); if (state === 'playing') pause(); });
  resize.observe(canvas);
  function setMessage(text: string, seconds = 1) { el('feedback').textContent = text; feedbackTime = seconds; }
  function clearInput() { keys.clear(); sliding = false; document.querySelectorAll('.held').forEach(b => b.classList.remove('held')); }
  function reset() {
    clearInput(); x = 320; y = H * .84; vx = angle = charge = boost = distance = calls = elapsed = offset = 0;
    speed = 180; spawn = .8; particles = [];
    traffic = [makeVehicle(1, 430, 'coupe'), makeVehicle(3, 730, 'hauler')];
    state = 'playing'; overlay.hidden = true; pauseButton.disabled = false; pauseButton.textContent = 'Ⅱ PAUSE';
    setMessage('HOLD SLIDE → RELEASE TO BURST', 3); canvas.focus({preventScroll:true});
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
  const aliases: Record<string,string> = { KeyA:'ArrowLeft',KeyD:'ArrowRight',KeyW:'ArrowUp',KeyS:'ArrowDown' };
  addEventListener('keydown', e => {
    // Keep keyboard activation and navigation working on page controls.
    if ((e.target as HTMLElement)?.tagName === 'BUTTON' || (e.target as HTMLElement)?.tagName === 'A') return;
    const key = aliases[e.code] || e.code;
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(key)) { e.preventDefault(); if (state === 'playing') keys.add(key); }
    if (e.repeat) return;
    if (e.code === 'KeyP' || e.code === 'Escape') state === 'paused' ? resume() : pause();
    if (e.code === 'KeyR' && start.disabled === false) reset();
  });
  addEventListener('keyup', e => keys.delete(aliases[e.code] || e.code));
  addEventListener('blur', pause);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  document.querySelectorAll<HTMLButtonElement>('[data-key]').forEach(button => {
    button.addEventListener('pointerdown', e => { e.preventDefault(); if(state!=='playing')return; button.setPointerCapture(e.pointerId); keys.add(button.dataset.key!); button.classList.add('held'); });
    const release = () => { keys.delete(button.dataset.key!); button.classList.remove('held'); };
    button.addEventListener('pointerup', release); button.addEventListener('pointercancel', release); button.addEventListener('lostpointercapture', release);
  });
  function sparks(count:number, color:string) {
    for(let i=0;i<count;i++) particles.push({x:x+(Math.random()-.5)*15,y:y+16,vx:(Math.random()-.5)*70,vy:40+Math.random()*90,life:.25+Math.random()*.3,color});
  }
  function update(dt:number) {
    elapsed += dt; feedbackTime -= dt;
    const input = Number(keys.has('ArrowRight'))-Number(keys.has('ArrowLeft'));
    if(input) direction = input;
    const nextSlide = keys.has('Space');
    if(sliding && !nextSlide && charge >= .12) { boost = .25+charge*.95; sparks(18,'#ffe575'); setMessage('BURST / FIND THE OPENING',1.1); charge = 0; }
    sliding = nextSlide;
    boost = Math.max(0, boost-dt);
    if(sliding) { charge = clamp(charge+dt*.43,0,1); boost=0; } else charge = Math.max(0,charge-dt*.65);
    const target = sliding ? 122 : boost>0 ? 330 : keys.has('ArrowDown') ? 125 : keys.has('ArrowUp') ? 210 : 180;
    speed += (target-speed)*(1-Math.exp(-9*dt));
    vx += (input*(sliding?205:180)-vx)*(1-Math.exp(-22*dt));
    x = clamp(x+vx*dt,left+22,right-22);
    y = H * .84; // Fixed chase camera: steering changes lateral road position only.
    angle += ((sliding?direction*1.02:input*.19)-angle)*(1-Math.exp(-16*dt));
    offset += speed*dt; distance += speed*dt/3.6;
    if(sliding && Math.random()<.65) sparks(1,'#f87085');
    if(boost>0) sparks(2,'#ffe575');
    spawn -= dt;
    if(spawn<=0) {
      const lane = Math.floor(Math.random()*5);
      const kind = Math.random()<.22 ? 'hauler' : Math.random()<.15 ? 'drone' : 'coupe';
      // One vehicle per wave leaves four lanes open; all enter at the far plane.
      traffic.push(makeVehicle(lane, 950, kind));
      spawn = 1.3+Math.random()*.45;
    }
    const bw = 26 + (sliding ? 8 : 0), bh = 24;
    for(const car of traffic) {
      const oldZ = car.z;
      car.z -= (speed-car.velocity)*dt;
      const dx = Math.abs(x-car.x), reach = (bh+car.h)/2;
      // Swept depth interval avoids tunnelling during turbo or a slow frame.
      if(dx<(bw+car.w)/2 && oldZ > -reach && car.z < reach) { crash(); break; }
      if(!car.passed && car.z < -reach) {
        car.passed=true;
        const gap = dx-(bw+car.w)/2;
        if(gap>=0 && gap<17) { calls++; charge=clamp(charge+.3,0,1); sparks(10,'#ffd5a3'); setMessage('CLOSE CALL / +30 ENERGY',1.2); }
      }
    }
    traffic=traffic.filter(car=>car.z>-65);
    particles=particles.filter(p=>p.life>0).slice(-180);
    for(const p of particles) {p.life-=dt;p.x+=p.vx*dt;p.y+=(p.vy+speed*.4)*dt;}
    if(feedbackTime<=0) el('feedback').textContent=sliding?'RELEASE TO BURST':boost>0?'BURST':'HOLD SLIDE → RELEASE TO BURST';
  }
  function makeVehicle(lane:number,z:number,kind:string):Car {
    return {x:left+(lane+.5)*(right-left)/5,z,w:kind==='hauler'?63:kind==='drone'?38:53,
      h:kind==='hauler'?52:kind==='drone'?22:36,kind,velocity:kind==='hauler'?22:38,passed:false};
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
    if(img&&b)c.drawImage(img,b.x,b.y,b.w,b.h,p.x-width*p.scale/2,p.y-(height+lift)*p.scale,width*p.scale,height*p.scale);
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
      if(boost>0) polygon([{x:p.x-7*p.scale,y:p.y-7},{x:p.x+7*p.scale,y:p.y-7},{x:p.x+4*p.scale,y:H},{x:p.x-4*p.scale,y:H}],'#ffe35e88');
      const pose=angle<-.08?'bikeLeft':angle>.08?'bikeRight':'bike';
      sprite(pose,x,0,sliding?34:26,47);
      for(const particle of particles){c.globalAlpha=clamp(particle.life*3,0,1);c.fillStyle=particle.color;c.fillRect(p.x+(particle.x-x)*p.scale,particle.y,2,boost>0?7:3);}c.globalAlpha=1;
    };
    let bikeDrawn=false;
    for(const car of [...traffic].sort((a,b)=>b.z-a.z)) {
      if(car.z<0&&!bikeDrawn){drawBike();bikeDrawn=true;}
      sprite(car.kind,car.x,car.z,car.w,car.kind==='hauler'?55:car.kind==='drone'?30:26,car.kind==='drone'?7:0);
    }
    if(!bikeDrawn)drawBike();
    if(!reduced&&boost>0){c.strokeStyle='#ffe57b55';for(let i=0;i<8;i++){const px=(i*137)%W;c.beginPath();c.moveTo(px,H);c.lineTo(W/2+(px-W/2)*.8,H*.8);c.stroke();}}
    el('speed').textContent=Math.round(speed).toString();el('near').textContent=calls.toString();
    el('charge-value').textContent=Math.round(charge*100)+'%';el('charge-bar').style.width=charge*100+'%';
    // Small observable state is useful for regression tests and tuning controls.
    canvas.dataset.view='rear-chase';canvas.dataset.state=state;canvas.dataset.x=x.toFixed(1);canvas.dataset.charge=charge.toFixed(2);canvas.dataset.boost=boost.toFixed(2);canvas.dataset.distance=distance.toFixed(1);
  }
  function frame(now:number){const dt=Math.min((now-last)/1000,1/30);last=now;if(state==='playing')update(dt);if(state==='playing'||frames++%3===0)render();requestAnimationFrame(frame);}
  const assets:Record<string,string>={bike:'bike-normal-straight',bikeLeft:'bike-normal-left-15',bikeRight:'bike-normal-right-15',coupe:'traffic-coupe',hauler:'traffic-hauler',drone:'drone-hover'};
  Promise.all(Object.entries(assets).map(([name,file])=>new Promise<void>((resolve,reject)=>{
    const img=new Image();img.onload=()=>{
      images[name]=img;
      // Remove transparent padding at draw time, leaving source art untouched.
      const surface=document.createElement('canvas');surface.width=img.width;surface.height=img.height;
      const sc=surface.getContext('2d')!;sc.drawImage(img,0,0);const data=sc.getImageData(0,0,img.width,img.height).data;
      let x0=img.width,y0=img.height,x1=0,y1=0;
      for(let yy=0;yy<img.height;yy++)for(let xx=0;xx<img.width;xx++)if(data[(yy*img.width+xx)*4+3]>80){x0=Math.min(x0,xx);x1=Math.max(x1,xx);y0=Math.min(y0,yy);y1=Math.max(y1,yy);}
      bounds[name]={x:x0,y:y0,w:Math.max(1,x1-x0+1),h:Math.max(1,y1-y0+1)};resolve();
    };img.onerror=reject;img.src=`/bastrop37/assets/sprites/${file}.png`;
  })))
    .then(()=>{size();start.disabled=false;start.textContent='START RIDING →';requestAnimationFrame(frame);})
    .catch(()=>{el('message').textContent='A sprite could not load. Refresh to try again.';start.textContent='ASSET LOAD FAILED';});
}
