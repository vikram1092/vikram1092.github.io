import * as T from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { vehiclePresentation } from './presentation';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createCar, box } from './car';
import { createWorld } from './world';
import { DEFAULT_FINISH, finishes } from './finishes';
import { FIXED_STEP, SIXTY_MPH, integrateSpeed } from './physics';

const canvas=document.querySelector<HTMLCanvasElement>('#roadster')!;
const speedText=document.querySelector<HTMLElement>('#velocity')!;
const clamp=T.MathUtils.clamp, lerp=T.MathUtils.lerp;
const review=import.meta.env.DEV?new URLSearchParams(location.search):new URLSearchParams();
const inspect=review.get('inspect');
const keys=new Set<string>();
const state={mode:'orbit',speed:0,x:0,z:0,heading:0,height:0,verticalSpeed:0,steer:0,boost:false,flip:0,flipAxis:'z',flipDirection:1,flipDuration:1.04,launchTime:0,zeroToSixty:0,finish:DEFAULT_FINISH,airtime:0,distance:0,crashes:0,tricks:0,paused:false};
let renderer:T.WebGLRenderer;
try {renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}catch(error){console.error('Roadster requires WebGL2.',error);throw error;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);
// Cabin detail occupies a small part of the frame; reflections remain full size.
renderer.transmissionResolutionScale=.5;
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.16;
renderer.info.autoReset=false;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
const scene=new T.Scene();scene.background=new T.Color(0x050913);scene.fog=new T.FogExp2(0x070d1b,.0038);
const camera=new T.PerspectiveCamera(42,innerWidth/innerHeight,.08,1800);
const environment=new T.Scene();environment.background=new T.Color(0x111722);
const softbox=new T.MeshBasicMaterial({color:new T.Color(2.2,2.3,2.5)});
box(environment,[16,.1,10],[0,10,0],new T.MeshBasicMaterial({color:new T.Color(.38,.42,.48)}));
box(environment,[12,.1,1.5],[-1,6,-2],softbox);box(environment,[.1,1.3,12],[-7,2.5,-1],new T.MeshBasicMaterial({color:new T.Color(.8,1.2,1.6)}));
box(environment,[.1,1,10],[7,3,1],new T.MeshBasicMaterial({color:new T.Color(.8,.6,1.2)}));
box(environment,[7,.65,.1],[0,3,-8],softbox);box(environment,[7,.45,.1],[0,2,7],softbox);
const pmrem=new T.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(environment,.01).texture;pmrem.dispose();
scene.add(new T.HemisphereLight(0xa1c5ed,0x080511,.92));
const keyLight=new T.DirectionalLight(0xd9e4ff,2.65);keyLight.position.set(-3,7,-3);keyLight.castShadow=true;keyLight.shadow.mapSize.set(2048,2048);keyLight.shadow.camera.left=-6;keyLight.shadow.camera.right=6;keyLight.shadow.camera.top=6;keyLight.shadow.camera.bottom=-6;keyLight.shadow.camera.near=.1;keyLight.shadow.camera.far=25;keyLight.shadow.radius=2.5;keyLight.shadow.normalBias=.006;keyLight.shadow.bias=-.0001;scene.add(keyLight,keyLight.target);
RectAreaLightUniformsLib.init();
const rim=new T.RectAreaLight(0xb8a4ed,2.8,6,2.5),fill=new T.RectAreaLight(0xc7e7ff,3.6,7,3);scene.add(rim,fill);
const beforeWorld=new Set(scene.children);
const world=createWorld(scene),car=createCar();
if(inspect){for(const object of scene.children)if(!beforeWorld.has(object))object.visible=false;scene.background=new T.Color(0x181a1e);scene.fog=null;const ground=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshStandardMaterial({color:0x282a2e,roughness:.86}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);rim.color.set(0xffffff);fill.color.set(0xffffff);rim.intensity=1.2;fill.intensity=1.4;keyLight.intensity=1.7;}
scene.add(car.root);
// Merge static detail by material. Wheels, active aero and rocket assemblies retain their transforms.
function batchStatic(parent:T.Group) {
  const groups=new Map<T.Material,T.Mesh[]>();
  for(const child of parent.children)if(child instanceof T.Mesh && !Array.isArray(child.material)) {const arr=groups.get(child.material)||[];arr.push(child);groups.set(child.material,arr);}
  for(const [material,meshes]of groups)if(meshes.length>1){const gs=meshes.map(m=>{m.updateMatrix();return (m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone()).applyMatrix4(m.matrix);});for(const g of gs)if(!g.getAttribute('uv'))g.setAttribute('uv',new T.BufferAttribute(new Float32Array(g.getAttribute('position').count*2),2));const merged=new T.Mesh(mergeGeometries(gs),material);merged.castShadow=meshes.some(m=>m.castShadow);merged.receiveShadow=meshes.some(m=>m.receiveShadow);parent.add(merged);for(const m of meshes)parent.remove(m);for(const g of gs)g.dispose();}
}
for(const section of car.staticGroups)batchStatic(section);
// Capture the wet-road reflection once per frame. The transmission prepass also
// draws the road; allowing its Reflector to recapture recursively doubled work.
// The faint road reflection needs only the glass's outer reflective surface.
const reflectedGlass=car.glass.clone();reflectedGlass.transmission=0;reflectedGlass.color.set(0x211a15);
const glassMeshes:T.Mesh[]=[];car.root.traverse(o=>{if(o instanceof T.Mesh&&o.material===car.glass)glassMeshes.push(o);});
const captureRoad=world.road.onBeforeRender.bind(world.road);
let roadReflectionPending=true;
world.road.onBeforeRender=(...args)=>{
  if(!roadReflectionPending)return;roadReflectionPending=false;
  for(const mesh of glassMeshes)mesh.material=reflectedGlass;
  try{captureRoad(...args);}finally{for(const mesh of glassMeshes)mesh.material=car.glass;}
};
for(const child of car.body.children)child.position.y-=.55;car.body.position.y=.55;
const headlights:T.SpotLight[]=[];
for(const x of [-.65,.65]){const l=new T.SpotLight(0xd5eaff,55,38,.40,.65,1.7);l.position.set(x,.46,-2.10);l.target.position.set(x,.05,-24);car.root.add(l,l.target);headlights.push(l);}
const rocketLight=new T.PointLight(0x90cdff,0,7);car.root.add(rocketLight);rocketLight.position.set(0,.4,2.6);
const shadowCanvas=document.createElement('canvas');shadowCanvas.width=64;shadowCanvas.height=128;const sc=shadowCanvas.getContext('2d')!;const gr=sc.createRadialGradient(32,64,8,32,64,64);gr.addColorStop(0,'rgba(0,0,0,.9)');gr.addColorStop(.55,'rgba(0,0,0,.5)');gr.addColorStop(1,'rgba(0,0,0,0)');sc.fillStyle=gr;sc.fillRect(0,0,64,128);
const contact=new T.Mesh(new T.PlaneGeometry(3.1,5.7),new T.MeshBasicMaterial({map:new T.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false,opacity:.85}));contact.rotation.x=-Math.PI/2;contact.position.y=.018;scene.add(contact);
const renderTarget=new T.WebGLRenderTarget(innerWidth,innerHeight,{type:T.HalfFloatType,samples:4});
const composer=new EffectComposer(renderer,renderTarget);composer.addPass(new RenderPass(scene,camera));
// Keep lamp highlights, but avoid turning the white body into a glowing surface.
const bloom=new UnrealBloomPass(new T.Vector2(innerWidth*.6,innerHeight*.6),.10,.30,1.8);composer.addPass(bloom);
const speedFX=new ShaderPass({uniforms:{tDiffuse:{value:null},amount:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`uniform sampler2D tDiffuse;uniform float amount;varying vec2 vUv;void main(){vec2 p=vUv-.5;float edge=smoothstep(.12,.65,length(p));vec2 d=p*amount*.009*edge;vec4 c=texture2D(tDiffuse,vUv)*.52;c+=texture2D(tDiffuse,vUv-d)*.24;c+=texture2D(tDiffuse,vUv-d*2.)*.14;c+=texture2D(tDiffuse,vUv-d*3.)*.1;c.rgb*=1.-smoothstep(.25,.76,length(p))*.2;gl_FragColor=c;}`});composer.addPass(speedFX);composer.addPass(new OutputPass());
// A bounded particle pool for cold-gas plumes and impact sparks.
const MAX=500,particlePos=new Float32Array(MAX*3),particleColor=new Float32Array(MAX*3),particleLife=new Float32Array(MAX),particleVelocity=new Float32Array(MAX*3);
particlePos.fill(-9999);let particleCursor=0;
const particleGeometry=new T.BufferGeometry();particleGeometry.setAttribute('position',new T.BufferAttribute(particlePos,3));particleGeometry.setAttribute('color',new T.BufferAttribute(particleColor,3));
const particleCanvas=document.createElement('canvas');particleCanvas.width=32;particleCanvas.height=32;const pctx=particleCanvas.getContext('2d')!;const pg=pctx.createRadialGradient(16,16,0,16,16,16);pg.addColorStop(0,'#fff');pg.addColorStop(.2,'#ffffffa0');pg.addColorStop(1,'#ffffff00');pctx.fillStyle=pg;pctx.fillRect(0,0,32,32);
const particles=new T.Points(particleGeometry,new T.PointsMaterial({size:.22,map:new T.CanvasTexture(particleCanvas),transparent:true,opacity:.11,vertexColors:true,depthWrite:false,blending:T.AdditiveBlending}));particles.frustumCulled=false;scene.add(particles);
function emit(position:T.Vector3,velocity:T.Vector3,spark=false) {const i=particleCursor++%MAX;particlePos.set(position.toArray(),i*3);particleVelocity.set(velocity.toArray(),i*3);particleColor.set(spark?[1,.43,.12]:[.45,.65,.85],i*3);particleLife[i]=spark?.5:.24+Math.random()*.24;}
let audio:AudioContext|null=null,motor:OscillatorNode|null=null,motorGain:GainNode|null=null,windGain:GainNode|null=null,jetGain:GainNode|null=null,master:GainNode|null=null,muted=false;
function startAudio(){if(audio){void audio.resume();return;}try {audio=new AudioContext();master=audio.createGain();master.gain.value=.27;master.connect(audio.destination);motor=audio.createOscillator();motor.type='sawtooth';motorGain=audio.createGain();motorGain.gain.value=0;const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=550;motor.connect(filter);filter.connect(motorGain);motorGain.connect(master);motor.start();const buffer=audio.createBuffer(1,audio.sampleRate*2,audio.sampleRate);const data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;const noise=audio.createBufferSource();noise.buffer=buffer;noise.loop=true;const wind=audio.createBiquadFilter();wind.type='lowpass';wind.frequency.value=450;windGain=audio.createGain();windGain.gain.value=0;noise.connect(wind);wind.connect(windGain);windGain.connect(master);const jet=audio.createBiquadFilter();jet.type='bandpass';jet.frequency.value=1200;jet.Q.value=.4;jetGain=audio.createGain();jetGain.gain.value=0;noise.connect(jet);jet.connect(jetGain);jetGain.connect(master);noise.start();}catch{/* Audio remains optional. */}}
let orbitAngle=-.66,orbitElevation=.16,orbitRadius=6.4,drag=false,lastX=0,lastY=0,manualOrbit=0,cameraBlend=0,shock=0,collisionCooldown=0,jumpPulse=0,frameCount=0,frameTime=0,averageFPS=60;
const target=new T.Vector3(),desired=new T.Vector3(),forward=new T.Vector3(),right=new T.Vector3();
function startDrive(){if(state.mode!=='drive'){state.mode='drive';document.body.dataset.driving='true';cameraBlend=0;}startAudio();}
function reset(full=true) {
  const near=world.nearest(state.x,state.z);const p=full?world.route.getPointAt(0):near.point,t=full?world.route.getTangentAt(0):near.tangent;
  state.x=p.x;state.z=p.z;state.heading=Math.atan2(-t.x,-t.z);state.speed=0;state.height=0;state.verticalSpeed=0;state.flip=0;state.steer=0;shock=0;jumpPulse=0;
  if(full){state.mode='orbit';document.body.dataset.driving='false';orbitAngle=-.66;cameraBlend=0;}
}
reset();
const paintButtons=[...document.querySelectorAll<HTMLButtonElement>('#paint-selector button')];
function selectFinish(index:number){
  if(!Number.isInteger(index)||!finishes[index])return;
  state.finish=index;car.setFinish(index);
  for(const button of paintButtons)button.setAttribute('aria-pressed',String(Number(button.dataset.finish)===index));
}
for(const button of paintButtons)button.addEventListener('click',()=>{selectFinish(Number(button.dataset.finish));canvas.focus({preventScroll:true});});
selectFinish(DEFAULT_FINISH);
if(inspect){state.x=0;state.z=0;state.heading=0;selectFinish(Number(review.get('paint')??DEFAULT_FINISH));}
function swatchActivation(event:KeyboardEvent){return (event.code==='Space'||event.code==='Enter')&&event.target instanceof HTMLElement&&!!event.target.closest('#paint-selector');}
function jump(){startDrive();if(state.height<.15){state.verticalSpeed=13.5;state.height=.03;}else state.verticalSpeed=Math.max(state.verticalSpeed,10);jumpPulse=.55;}
function trick(axis:string,direction:number){startDrive();if(state.flip>0)return;if(state.height<1)jump();else if(state.verticalSpeed<4)state.verticalSpeed=9;state.flip=.0001;state.flipAxis=axis;state.flipDirection=direction;jumpPulse=.8;}
const controlKeys=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','ShiftLeft','ShiftRight','KeyF','KeyQ','KeyE','KeyX','KeyR','KeyC','KeyM','Digit1','Digit2','Digit3','Digit4','Digit5','Digit6'];
window.addEventListener('keydown',event=>{if(swatchActivation(event)||!controlKeys.includes(event.code))return;event.preventDefault();keys.add(event.code);if(event.code==='ArrowUp'||event.code==='ArrowDown')startDrive();if(event.repeat)return;if(event.code==='Space')jump();if(event.code==='KeyF'||event.code==='KeyE')trick('z',-1);if(event.code==='KeyQ')trick('z',1);if(event.code==='KeyX')trick('x',-1);if(event.code==='KeyR')reset(false);if(event.code==='KeyC'){state.mode='orbit';state.speed=0;state.height=0;state.verticalSpeed=0;state.flip=0;orbitAngle=state.heading-.66;document.body.dataset.driving='false';}if(event.code==='KeyM'){muted=!muted;if(master)master.gain.setTargetAtTime(muted?0:.27,audio!.currentTime,.1);}if(event.code.startsWith('Digit'))selectFinish(Number(event.code.slice(-1))-1);});
window.addEventListener('keyup',event=>{keys.delete(event.code);if(swatchActivation(event))return;if(controlKeys.includes(event.code))event.preventDefault();});
function pause(){keys.clear();state.paused=true;if(audio)void audio.suspend();}
window.addEventListener('blur',pause);window.addEventListener('focus',()=>{state.paused=false;});document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();else state.paused=false;});
canvas.addEventListener('pointerdown',event=>{if(state.mode!=='orbit')return;drag=true;lastX=event.clientX;lastY=event.clientY;canvas.setPointerCapture(event.pointerId);});
canvas.addEventListener('pointermove',event=>{if(!drag)return;orbitAngle-=(event.clientX-lastX)*.006;orbitElevation=clamp(orbitElevation+(event.clientY-lastY)*.004,.06,1.15);lastX=event.clientX;lastY=event.clientY;manualOrbit=3;});
canvas.addEventListener('pointerup',()=>{drag=false;});canvas.addEventListener('wheel',event=>{event.preventDefault();orbitRadius=clamp(orbitRadius+event.deltaY*.003,3.5,12);},{passive:false});
const worldPoint=new T.Vector3(),jetDirection=new T.Vector3(),wingAttachment=new T.Vector3(),strutDirection=new T.Vector3(),upAxis=new T.Vector3(0,1,0);
function collision(strength:number){if(collisionCooldown>0)return;state.crashes++;collisionCooldown=.2;shock=Math.min(1,strength);state.speed*=-.22;for(let j=0;j<24;j++)emit(new T.Vector3(state.x,.5,state.z),new T.Vector3((Math.random()-.5)*12,Math.random()*5,(Math.random()-.5)*12),true);}
function step(dt:number) {
  collisionCooldown=Math.max(0,collisionCooldown-dt);jumpPulse=Math.max(0,jumpPulse-dt);
  if(state.mode!=='drive')return;
  const throttle=keys.has('ArrowUp'),brake=keys.has('ArrowDown');state.boost=keys.has('ShiftLeft')||keys.has('ShiftRight');
  if(throttle&&state.speed===0){state.launchTime=0;state.zeroToSixty=0;}
  if(throttle&&state.speed<SIXTY_MPH)state.launchTime+=dt;
  state.speed=integrateSpeed(state.speed,throttle,brake,state.boost,dt);
  if(throttle&&state.speed>=SIXTY_MPH&&state.zeroToSixty===0)state.zeroToSixty=state.launchTime;
  const steering=(keys.has('ArrowLeft')?1:0)-(keys.has('ArrowRight')?1:0);
  state.steer=lerp(state.steer,steering,1-Math.exp(-dt*12));
  const angle=state.steer*.48/(1+Math.abs(state.speed)*.026);
  const yaw=clamp(state.speed/2.725*Math.tan(angle),-(40+Math.abs(state.speed)*.2)/Math.max(8,Math.abs(state.speed)),(40+Math.abs(state.speed)*.2)/Math.max(8,Math.abs(state.speed)));
  state.heading+=yaw*dt*(state.height>.3?.65:1);
  const oldX=state.x,oldZ=state.z;
  state.x-=Math.sin(state.heading)*state.speed*dt;state.z-=Math.cos(state.heading)*state.speed*dt;state.distance+=Math.abs(state.speed)*dt;
  // Rocket lift has no fuel or recharge gate. Holding Space gives sustained climb.
  if(keys.has('Space')&&state.height>.03&&state.height<32){state.verticalSpeed+=20*dt;jumpPulse=.12;}
  if(state.height>0||state.verticalSpeed>0) {
    state.verticalSpeed-=16*dt;state.height+=state.verticalSpeed*dt;state.airtime+=dt;
    if(state.height<0){state.height=0;state.verticalSpeed=0;shock=.24;state.airtime=0;}
    if(state.height>42){state.height=42;state.verticalSpeed=Math.min(0,state.verticalSpeed);}
  }
  if(state.flip>0){state.flip+=dt/state.flipDuration;if(state.flip>=1){state.flip=0;state.tricks++;}else if(state.height<.7){state.height=.7;state.verticalSpeed=Math.max(state.verticalSpeed,2);}}
  const near=world.nearest(state.x,state.z);
  if(near.distance>11.1&&near.distance<15&&state.height<.55){const n=new T.Vector3(-near.tangent.z,0,near.tangent.x);const side=Math.sign(near.side);state.x=near.point.x+n.x*side*11.05;state.z=near.point.z+n.z*side*11.05;collision(Math.abs(state.speed)/65);}
  if(near.distance>15&&state.height<.1)state.speed*=1-dt*.65;
  for(const ob of world.obstacles) {
    const dx=state.x-ob.position.x,dz=state.z-ob.position.z;if(Math.abs(dx)>15||Math.abs(dz)>15)continue;
    const x=dx*Math.cos(ob.angle)-dz*Math.sin(ob.angle),z=dx*Math.sin(ob.angle)+dz*Math.cos(ob.angle);
    if(Math.abs(x)<ob.width/2+.75&&Math.abs(z)<ob.depth/2+1.5) {
      if(ob.kind==='ramp'&&state.height<ob.height+.05&&state.speed>0){const rampY=clamp((5-z)/10,0,1)*ob.height;if(state.height<rampY){state.height=rampY;state.verticalSpeed=Math.max(3,state.speed*.17);jumpPulse=.15;}}
      else if(ob.kind==='block'&&state.height<ob.height){state.x=oldX;state.z=oldZ;collision(Math.abs(state.speed)/50);}
    }
  }
  if(near.distance>24)for(const b of world.buildings)if(Math.abs(state.x-b.x)<b.w/2+1&&Math.abs(state.z-b.z)<b.d/2+2&&state.height<b.h){state.x=oldX;state.z=oldZ;collision(.8);break;}
  if(near.distance>180)reset(false);
}
function render(dt:number,time:number) {
  const driving=state.mode==='drive',throttle=keys.has('ArrowUp')&&driving;
  const thrust=throttle&&(Math.abs(state.speed)<30||state.boost),lifting=jumpPulse>0;
  car.root.position.set(state.x,state.height,state.z);car.root.rotation.y=state.heading;
  car.body.rotation.set(0,0,0);car.body.position.y=.55-Math.sin(shock*Math.PI)*.035;
  const presentation=vehiclePresentation(inspect?Number(review.get('speed')??state.speed):state.speed,(inspect&&review.has('brake'))||keys.has('ArrowDown')&&driving);
  const pitch=throttle?-.018:presentation.braking?.027:0;
  car.body.rotation.x=pitch;car.body.rotation.z=-state.steer*Math.min(Math.abs(state.speed)*.001,.045);
  if(state.flip>0)car.body.rotation[state.flipAxis as 'x'|'z']=state.flipDirection*Math.PI*2*(state.flip*state.flip*(3-2*state.flip));
  for(const wheel of car.wheels)wheel.rotation.x-=state.speed*dt/wheel.userData.radius;
  for(const pivot of car.steering)pivot.rotation.y=state.steer*.36/(1+Math.abs(state.speed)*.025);
  const aeroBlend=1-Math.exp(-dt*6);
  car.wing.position.y=lerp(car.wing.position.y,car.wingRestHeight-.55+presentation.wingLift,aeroBlend);
  car.wing.position.z=lerp(car.wing.position.z,car.wingRestZ+presentation.wingRearward,aeroBlend);
  car.wing.rotation.x=lerp(car.wing.rotation.x,presentation.wingAngle,aeroBlend);
  for(const strut of car.wingStruts){
    strut.visible=car.wing.position.y-(car.wingRestHeight-.55)>.025;
    wingAttachment.copy(strut.userData.attachment).applyEuler(car.wing.rotation).add(car.wing.position);
    strutDirection.copy(wingAttachment).sub(strut.position);strut.scale.y=strutDirection.length();
    strut.quaternion.setFromUnitVectors(upAxis,strutDirection.normalize());
  }
  car.red.emissiveIntensity=lerp(car.red.emissiveIntensity,presentation.lampIntensity,1-Math.exp(-dt*22));
  car.tailSpill.intensity=lerp(car.tailSpill.intensity,presentation.lampSpill,1-Math.exp(-dt*22));
  car.root.updateMatrixWorld(true);
  for(const jet of car.jets) {
    const active=jet.kind==='rear'?thrust:jet.kind==='lift'?lifting:state.flip>0;
    jet.cone.visible=jet.halo.visible=active;
    if(active){const flicker=.8+Math.random()*.35;jet.cone.scale.set(1,flicker,1);jet.halo.scale.y=flicker;jet.group.getWorldPosition(worldPoint);jetDirection.set(0,1,0).transformDirection(jet.group.matrixWorld);for(let j=0;j<2;j++){const velocity=jetDirection.clone().multiplyScalar(jet.kind==='rear'?20:12);velocity.x-=Math.sin(state.heading)*state.speed;velocity.z-=Math.cos(state.heading)*state.speed;velocity.add(new T.Vector3((Math.random()-.5)*3,Math.random()*1.5,(Math.random()-.5)*3));emit(worldPoint.clone().addScaledVector(jetDirection,.1),velocity);}}
  }
  rocketLight.intensity=thrust?9:0;
  for(let i=0;i<MAX;i++)if(particleLife[i]>0){particleLife[i]-=dt;for(let j=0;j<3;j++)particlePos[i*3+j]+=particleVelocity[i*3+j]*dt;particleColor[i*3]*=.975;particleColor[i*3+1]*=.975;particleColor[i*3+2]*=.975;if(particleLife[i]<=0)particlePos[i*3+1]=-9999;}
  particleGeometry.attributes.position.needsUpdate=true;particleGeometry.attributes.color.needsUpdate=true;
  contact.position.set(state.x,.02,state.z);contact.rotation.z=-state.heading;contact.scale.setScalar(1+state.height*.08);contact.material.opacity=Math.max(.12,.8-state.height*.06);
  keyLight.position.set(state.x-4,7+state.height,state.z-4);keyLight.target.position.copy(car.root.position);
  rim.position.set(state.x+4,state.height+2,state.z+2);fill.position.set(state.x-4,state.height+3,state.z-3);
  worldPoint.set(state.x,state.height+.6,state.z);rim.lookAt(worldPoint);fill.lookAt(worldPoint);
  forward.set(-Math.sin(state.heading),0,-Math.cos(state.heading));right.set(Math.cos(state.heading),0,-Math.sin(state.heading));
  if(!driving){manualOrbit=Math.max(0,manualOrbit-dt);if(!drag&&manualOrbit===0)orbitAngle+=dt*.12;desired.set(state.x+Math.sin(orbitAngle)*orbitRadius, .62+Math.sin(orbitElevation)*orbitRadius,state.z-Math.cos(orbitAngle)*orbitRadius);target.set(state.x,.64,state.z);camera.position.lerp(desired,1-Math.exp(-dt*6));camera.fov=lerp(camera.fov,42,1-Math.exp(-dt*5));}
  else {
    cameraBlend=Math.min(1,cameraBlend+dt*6);const v=Math.abs(state.speed);
    desired.copy(car.root.position).addScaledVector(forward,-(4.8+Math.min(v*.008,1.1))).addScaledVector(right,-state.steer*.35);desired.y+=1.55+Math.min(v*.003,.3);
    const followRate=cameraBlend<1?26:20;
    desired.addScaledVector(forward,state.speed/followRate);
    camera.position.lerp(desired,1-Math.exp(-dt*followRate));
    target.copy(car.root.position).addScaledVector(forward,7+v*.045);target.y+=.75;
    camera.fov=lerp(camera.fov,58+Math.min(v*.16,22)+(state.boost?4:0),1-Math.exp(-dt*7));
    const vibration=(thrust?.018:0)+shock*.10+Math.max(0,v-55)*.0001;camera.position.x+=Math.sin(time*92)*vibration;camera.position.y+=Math.sin(time*71)*vibration;
  }
  if(inspect&&!driving){const views:Record<string,number[]>={front:[0,1.7,-18],side:[7,.64,0],rear:[0,.73,7],detail:[0,.60,4.8],hero:[-4.7,2.1,-6.3],back:[-4.7,2.1,6.3],reference:[-8,1.85,-15],profile:[-15,.64,0],aft:[0,2.0,5.6],rearref:[0,2.6,8.0],top:[0,8,.01]};const view=views[inspect]||views.hero;camera.position.set(view[0],view[1],view[2]);target.set(0,.55,0);camera.fov=inspect==='reference'?10.5:inspect==='front'?9:inspect==='aft'?32:inspect==='rearref'?22:inspect==='top'?34:inspect==='profile'?12:inspect==='back'?28:35;}
  if(inspect==='glass'&&!driving){camera.position.set(-4.5,2,-6);target.set(0,.88,-.15);camera.fov=11;}
  camera.lookAt(target);camera.updateProjectionMatrix();shock=Math.max(0,shock-dt*2.8);
  speedFX.uniforms.amount.value=clamp(Math.abs(state.speed)/130,0,1);
  speedText.textContent=String(Math.round(Math.abs(state.speed)*2.236936));
  if(audio&&motor&&motorGain&&windGain&&jetGain&&!state.paused){const now=audio.currentTime;motor.frequency.setTargetAtTime(38+Math.abs(state.speed)*3.5,now,.06);motorGain.gain.setTargetAtTime(driving?Math.min(.035,Math.abs(state.speed)*.001):0,now,.07);windGain.gain.setTargetAtTime(driving?Math.min(.15,Math.abs(state.speed)*.001):0,now,.1);jetGain.gain.setTargetAtTime(thrust||lifting?.11:0,now,.04);}
  roadReflectionPending=true;renderer.info.reset();composer.render();
}
let last=performance.now(),accumulator=0;
function animate(now:number){requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.08);last=now;if(state.paused||document.hidden)return;accumulator+=dt;while(accumulator>=FIXED_STEP){step(FIXED_STEP);accumulator-=FIXED_STEP;}render(dt,now/1000);frameCount++;frameTime+=dt;if(frameTime>2){averageFPS=frameCount/frameTime;canvas.dataset.telemetry=JSON.stringify({...state,wingLift:car.wing.position.y-(car.wingRestHeight-.55),wingRearward:car.wing.position.z-car.wingRestZ,wingAngle:car.wing.rotation.x,tailIntensity:car.red.emissiveIntensity,fps:Math.round(averageFPS),calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,camera:camera.position.toArray(),car:car.root.position.toArray()});frameCount=0;frameTime=0;}}
camera.position.set(-4,2.4,-5);camera.lookAt(0,.6,0);requestAnimationFrame(animate);
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);});
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();pause();});canvas.addEventListener('webglcontextrestored',()=>location.reload());
// Read-only telemetry enables browser checks without adding any on-screen interface.
Object.defineProperty(window,'__roadster',{value:{snapshot:()=>({...state,fps:averageFPS,camera:camera.position.toArray(),car:car.root.position.toArray(),calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,ready:true}),route:()=>world.samples.map(p=>[p.x,p.z])},configurable:true});
