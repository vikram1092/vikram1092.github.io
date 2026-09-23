// BASTROP37 milestone 01–02: a self-contained Canvas riding sandbox.
// Sprite coordinates, physics and collision geometry share logical canvas pixels.
type Car = { x: number; y: number; w: number; h: number; kind: string; velocity: number; passed: boolean };
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
  let W = 640, H = 360, left = 128, right = 512;
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
    const px = (x - left) / (right - left), py = y / H;
    W = canvas.width = nw; H = canvas.height = nh;
    const road = Math.min(384, W - 64); left = (W - road) / 2; right = W - left;
    x = left + px * road; y = py * H; traffic = [];
  }
  const resize = new ResizeObserver(() => { size(); if (state === 'playing') pause(); });
  resize.observe(canvas);
  function setMessage(text: string, seconds = 1) { el('feedback').textContent = text; feedbackTime = seconds; }
  function clearInput() { keys.clear(); sliding = false; document.querySelectorAll('.held').forEach(b => b.classList.remove('held')); }
  function reset() {
    clearInput(); x = W / 2; y = H * .75; vx = angle = charge = boost = distance = calls = elapsed = offset = 0;
    speed = 180; spawn = .8; particles = [];
    traffic = [{ x: left + (right-left)*.28, y: -20, w:24, h:42, kind:'coupe', velocity:38, passed:false },
      { x: left + (right-left)*.74, y:-180, w:34,h:65,kind:'hauler',velocity:22,passed:false }];
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
    if(sliding && !nextSlide && charge >= .12) { boost = .25+charge*.95; sparks(18,'#9bffe2'); setMessage('BURST / FIND THE OPENING',1.1); charge = 0; }
    sliding = nextSlide;
    boost = Math.max(0, boost-dt);
    if(sliding) { charge = clamp(charge+dt*.43,0,1); boost=0; } else charge = Math.max(0,charge-dt*.65);
    const target = sliding ? 122 : boost>0 ? 330 : 180;
    speed += (target-speed)*(1-Math.exp(-9*dt));
    vx += (input*(sliding?205:180)-vx)*(1-Math.exp(-22*dt));
    x = clamp(x+vx*dt,left+22,right-22);
    y = clamp(y+(Number(keys.has('ArrowDown'))-Number(keys.has('ArrowUp')))*130*dt, H*.32,H-45);
    angle += ((sliding?direction*1.02:input*.19)-angle)*(1-Math.exp(-16*dt));
    offset += speed*dt; distance += speed*dt/3.6;
    if(sliding && Math.random()<.65) sparks(1,'#f87085');
    if(boost>0) sparks(2,'#71f7dc');
    spawn -= dt;
    if(spawn<=0) {
      const lane = Math.floor(Math.random()*5), truck = Math.random()<.25;
      traffic.push({x:left+(lane+.5)*(right-left)/5,y:-80,w:truck?34:24,h:truck?65:42,kind:truck?'hauler':'coupe',velocity:truck?22:38+Math.random()*18,passed:false});
      spawn = .7+Math.random()*.35;
    }
    // Rotating bike silhouette: a tighter upright profile and a wider slide.
    const bw = Math.abs(Math.cos(angle))*11+Math.abs(Math.sin(angle))*27;
    const bh = Math.abs(Math.cos(angle))*27+Math.abs(Math.sin(angle))*11;
    for(const car of traffic) {
      car.y += (speed-car.velocity)*dt;
      const dx = Math.abs(x-car.x), dy = Math.abs(y-car.y);
      if(dx<(bw+car.w-5)/2 && dy<(bh+car.h-5)/2) { crash(); break; }
      if(!car.passed && car.y>y+(bh+car.h)/2) {
        car.passed=true;
        const gap = dx-(bw+car.w)/2;
        if(gap>=-2 && gap<17) { calls++; charge=clamp(charge+.3,0,1); sparks(10,'#ffd5a3'); setMessage('CLOSE CALL / +30 ENERGY',1.2); }
      }
    }
    traffic=traffic.filter(car=>car.y<H+100);
    particles=particles.filter(p=>p.life>0).slice(-180);
    for(const p of particles) {p.life-=dt;p.x+=p.vx*dt;p.y+=(p.vy+speed*.4)*dt;}
    if(feedbackTime<=0) el('feedback').textContent=sliding?'RELEASE TO BURST':boost>0?'BURST':'HOLD SLIDE → RELEASE TO BURST';
  }
  function rect(color:string,a:number,b:number,w:number,h:number) { c.fillStyle=color;c.fillRect(Math.round(a),Math.round(b),w,h); }
  function render() {
    c.imageSmoothingEnabled=false;
    rect('#0a1020',0,0,W,H);
    // Reusable procedural city blocks keep this milestone light and editable.
    for(let side=0;side<2;side++) for(let i=0;i<7;i++) {
      const by=((i*89+offset*.32)%(H+100))-100, bx=side?right+16:0, width=side?W-right-9:left-12;
      rect(i%2?'#152036':'#1b2239',bx,by,width,76);
      rect('#25304a',bx,by,width,3);
      for(let j=7;j<width-5;j+=11)for(let k=12;k<65;k+=13) if((j+k+i)%4) rect((j+i)%3?'#39435d':'#805062',bx+j,by+k,3,5);
      if(i%3===0) { rect('#55243e',bx+5,by+30,width-12,16);rect('#f06b84',bx+9,by+34,Math.max(4,width-22),2); }
    }
    rect('#1a2435',left-8,0,right-left+16,H);rect('#111a29',left,0,right-left,H);
    for(let i=0;i<28;i++) {const yy=(i*23+offset)%(H+30);rect('#182232',left+7,yy,right-left-14,1);}
    for(let lane=1;lane<5;lane++)for(let i=-1;i<H/44+1;i++) rect('#344355',left+lane*(right-left)/5,i*44+offset%44,2,20);
    rect('#4b354e',left-5,0,3,H);rect('#4b354e',right+2,0,3,H);
    for(let i=-1;i<H/60+1;i++){const yy=i*60+offset%60;rect('#fa5d7b',left-5,yy,3,24);rect('#55aaad',right+2,yy,3,24);}
    // Road stencil and moving shadows provide speed without camera shake.
    c.save();c.globalAlpha=.13;c.fillStyle='#99aec4';c.font='bold 30px monospace';c.fillText('B / 37',W/2-54,(offset*.8)%(H+400)-40);c.restore();
    for(const car of traffic) {
      rect('#070b18',car.x-car.w/2+4,car.y-car.h/2+6,car.w,car.h);
      if(images[car.kind])c.drawImage(images[car.kind],car.x-car.w/2,car.y-car.h/2,car.w,car.h);
      rect('#ff476844',car.x-car.w/2,car.y+car.h/2,car.w,9);
    }
    if(state==='ready'){x=W*.62;y=H*.6;angle=-.35;}
    for(const p of particles){c.globalAlpha=clamp(p.life*3,0,1);rect(p.color,p.x,p.y,2,boost>0?7:3);}c.globalAlpha=1;
    if(boost>0){c.fillStyle='#5bf4d433';c.beginPath();c.moveTo(x-8,y+10);c.lineTo(x+8,y+10);c.lineTo(x+3,y+65);c.lineTo(x-3,y+65);c.fill();}
    c.save();c.translate(x,y);c.rotate(angle);
    c.fillStyle='#02061199';c.fillRect(-7, -15,18,36);
    if(images.bike)c.drawImage(images.bike,-10,-20,20,40);
    if(sliding){rect('#71fadd',-15,6,5,2);rect('#71fadd',10,6,5,2);}
    c.restore();
    if(!reduced){c.globalAlpha=.15;for(let i=0;i<36;i++){const rx=(i*73)%W,ry=(i*41+offset*1.4)%H;rect('#8298b0',rx,ry,1,7);}c.globalAlpha=1;}
    const vignette=c.createLinearGradient(0,0,0,H);vignette.addColorStop(0,'#090d1933');vignette.addColorStop(.7,'#090d1900');vignette.addColorStop(1,'#090d19bb');c.fillStyle=vignette;c.fillRect(0,0,W,H);
    el('speed').textContent=Math.round(speed).toString();el('near').textContent=calls.toString();
    el('charge-value').textContent=Math.round(charge*100)+'%';el('charge-bar').style.width=charge*100+'%';
    // Small observable state is useful for regression tests and tuning controls.
    canvas.dataset.state=state;canvas.dataset.x=x.toFixed(1);canvas.dataset.charge=charge.toFixed(2);canvas.dataset.boost=boost.toFixed(2);canvas.dataset.distance=distance.toFixed(1);
  }
  function frame(now:number){const dt=Math.min((now-last)/1000,1/30);last=now;if(state==='playing')update(dt);if(state==='playing'||frames++%3===0)render();requestAnimationFrame(frame);}
  Promise.all(['bike','coupe','hauler'].map(name=>new Promise<void>((resolve,reject)=>{const img=new Image();img.onload=()=>{images[name]=img;resolve();};img.onerror=reject;img.src=`/bastrop37/assets/${name}.svg`;})))
    .then(()=>{size();start.disabled=false;start.textContent='START RIDING →';requestAnimationFrame(frame);})
    .catch(()=>{el('message').textContent='A sprite could not load. Refresh to try again.';start.textContent='ASSET LOAD FAILED';});
}
