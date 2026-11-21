import * as T from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { vehiclePresentation } from './presentation';
import { PoseInterpolator, ChaseCamera, damp } from './motion';
import { DrivingEffects, speedFragmentShader } from './effects';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createCar, box } from './car';
import { createWorld } from './world';
import { DEFAULT_FINISH, finishes } from './finishes';
import { FIXED_STEP, SIXTY_MPH, integrateSpeed, steeringYaw } from './physics';

const canvas=document.querySelector<HTMLCanvasElement>('#roadster')!;
const speedText=document.querySelector<HTMLElement>('#velocity')!;
const clamp=T.MathUtils.clamp, lerp=T.MathUtils.lerp;
const review=import.meta.env.DEV?new URLSearchParams(location.search):new URLSearchParams();
const inspect=review.get('inspect');
const keys=new Set<string>();
const state={mode:'orbit',speed:0,x:0,z:0,heading:0,height:0,verticalSpeed:0,steer:0,boost:false,flip:0,flipAxis:'z',flipDirection:1,flipDuration:1.04,launchTime:0,zeroToSixty:0,finish:DEFAULT_FINISH,airtime:0,distance:0,crashes:0,tricks:0,paused:false};
const motion=new PoseInterpolator(state),chase=new ChaseCamera(),effects=new DrivingEffects();
let accumulator=0,bodyPitch=0,bodyRoll=0,cameraGapMin=Infinity,cameraGapMax=-Infinity;
let renderer:T.WebGLRenderer;
try {renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}catch(error){console.error('Roadster requires WebGL2.',error);throw error;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);
// Cabin detail occupies a small part of the frame; reflections remain full size.
renderer.transmissionResolutionScale=.5;
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.16;
renderer.info.autoReset=false;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
const scene=new T.Scene();scene.background=new T.Color(0x0b1429);scene.fog=new T.FogExp2(0x17243c,.00024);
const camera=new T.PerspectiveCamera(42,innerWidth/innerHeight,.08,24000);
const environment=new T.Scene();environment.background=new T.Color(0x111722);
const softbox=new T.MeshBasicMaterial({color:new T.Color(2.2,2.3,2.5)});
box(environment,[16,.1,10],[0,10,0],new T.MeshBasicMaterial({color:new T.Color(.38,.42,.48)}));
box(environment,[12,.1,1.5],[-1,6,-2],softbox);box(environment,[.1,1.3,12],[-7,2.5,-1],new T.MeshBasicMaterial({color:new T.Color(.8,1.2,1.6)}));
box(environment,[.1,1,10],[7,3,1],new T.MeshBasicMaterial({color:new T.Color(.8,.6,1.2)}));
box(environment,[7,.65,.1],[0,3,-8],softbox);box(environment,[7,.45,.1],[0,2,7],softbox);
const pmrem=new T.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(environment,.01).texture;pmrem.dispose();
scene.add(new T.HemisphereLight(0x9cbde9,0x22182a,1.05));
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
const speedFX=new ShaderPass({uniforms:{tDiffuse:{value:null},amount:{value:0},boost:{value:0},aspect:{value:camera.aspect},carUv:{value:new T.Vector2(.5,.3)}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:speedFragmentShader});composer.addPass(speedFX);composer.addPass(new OutputPass());
// A bounded particle pool for cold-gas plumes and impact sparks.
const MAX=500,particlePos=new Float32Array(MAX*3),particleColor=new Float32Array(MAX*3),particleLife=new Float32Array(MAX),particleVelocity=new Float32Array(MAX*3);
particlePos.fill(-9999);let particleCursor=0;
const particleGeometry=new T.BufferGeometry();particleGeometry.setAttribute('position',new T.BufferAttribute(particlePos,3));particleGeometry.setAttribute('color',new T.BufferAttribute(particleColor,3));
const particleCanvas=document.createElement('canvas');particleCanvas.width=32;particleCanvas.height=32;const pctx=particleCanvas.getContext('2d')!;const pg=pctx.createRadialGradient(16,16,0,16,16,16);pg.addColorStop(0,'#fff');pg.addColorStop(.2,'#ffffffa0');pg.addColorStop(1,'#ffffff00');pctx.fillStyle=pg;pctx.fillRect(0,0,32,32);
const particles=new T.Points(particleGeometry,new T.PointsMaterial({size:.22,map:new T.CanvasTexture(particleCanvas),transparent:true,opacity:.11,vertexColors:true,depthWrite:false,blending:T.AdditiveBlending}));particles.frustumCulled=false;scene.add(particles);
function emit(position:T.Vector3,velocity:T.Vector3,spark=false) {const i=particleCursor++%MAX;particlePos.set(position.toArray(),i*3);particleVelocity.set(velocity.toArray(),i*3);particleColor.set(spark?[1,.43,.12]:[.45,.65,.85],i*3);particleLife[i]=spark?.5:.24+Math.random()*.24;}
let audio:AudioContext|null=null,motor:OscillatorNode|null=null,motorGain:GainNode|null=null,windGain:GainNode|null=null,jetGain:GainNode|null=null,master:GainNode|null=null,muted=false;
function startAudio(){if(audio){void audio.resume();return;}try {audio=new AudioContext();master=audio.createGain();master.gain.value=.27;master.connect(audio.destination);motor=audio.createOscillator();motor.type='sawtooth';motorGain=audio.createGain();motorGain.gain.value=0;const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=550;motor.connect(filter);filter.connect(motorGain);motorGain.connect(master);motor.start();const buffer=audio.createBuffer(1,audio.sampleRate*2,audio.sampleRate);const data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;const noise=audio.createBufferSource();noise.buffer=buffer;noise.loop=true;const wind=audio.createBiquadFilter();wind.type='lowpass';wind.frequency.value=450;windGain=audio.createGain();windGain.gain.value=0;noise.connect(wind);wind.connect(windGain);windGain.connect(master);const jet=audio.createBiquadFilter();jet.type='bandpass';jet.frequency.value=1200;jet.Q.value=.4;jetGain=audio.createGain();jetGain.gain.value=0;noise.connect(jet);jet.connect(jetGain);jetGain.connect(master);noise.start();}catch{/* Audio remains optional. */}}
let orbitAngle=-.66,orbitElevation=.16,orbitRadius=6.4,drag=false,lastX=0,lastY=0,manualOrbit=0,shock=0,collisionCooldown=0,jumpPulse=0,frameCount=0,frameTime=0,averageFPS=60;
const target=new T.Vector3(),desired=new T.Vector3();
function startDrive(){if(state.mode!=='drive'){state.mode='drive';document.body.dataset.driving='true';chase.enter(camera.position,motion.value);}startAudio();}
function reset(full=true) {
  const near=world.nearest(state.x,state.z);const p=full?world.route.getPointAt(0):near.point,t=full?world.route.getTangentAt(0):near.tangent;
  state.x=p.x;state.z=p.z;state.heading=Math.atan2(-t.x,-t.z);state.speed=0;state.height=0;state.verticalSpeed=0;state.flip=0;state.steer=0;shock=0;jumpPulse=0;
  motion.snap(state);accumulator=0;bodyPitch=bodyRoll=0;chase.snap(state);effects.reset();cameraGapMin=Infinity;cameraGapMax=-Infinity;
  if(full){state.mode='orbit';document.body.dataset.driving='false';orbitAngle=-.66;}
  else if(state.mode==='drive')camera.position.copy(chase.position);
}
reset();
if(review.has('driveAt')){const progress=Number(review.get('driveAt'))/world.length;if(Number.isFinite(progress)){const p=world.route.getPointAt(progress),t=world.route.getTangentAt(progress);state.x=p.x;state.z=p.z;state.heading=Math.atan2(-t.x,-t.z);orbitAngle=state.heading-.66;}}
const paintButtons=[...document.querySelectorAll<HTMLButtonElement>('#paint-selector button')];
function selectFinish(index:number){
  if(!Number.isInteger(index)||!finishes[index])return;
  state.finish=index;car.setFinish(index);
  for(const button of paintButtons)button.setAttribute('aria-pressed',String(Number(button.dataset.finish)===index));
}
for(const button of paintButtons)button.addEventListener('click',()=>{selectFinish(Number(button.dataset.finish));canvas.focus({preventScroll:true});});
selectFinish(DEFAULT_FINISH);
if(inspect){state.x=0;state.z=0;state.heading=0;selectFinish(Number(review.get('paint')??DEFAULT_FINISH));}
motion.snap(state);
function swatchActivation(event:KeyboardEvent){return (event.code==='Space'||event.code==='Enter')&&event.target instanceof HTMLElement&&!!event.target.closest('#paint-selector');}
function jump(){startDrive();if(state.height<.15){state.verticalSpeed=13.5;state.height=.03;}else state.verticalSpeed=Math.max(state.verticalSpeed,10);jumpPulse=.55;}
function trick(axis:string,direction:number){startDrive();if(state.flip>0)return;if(state.height<1)jump();else if(state.verticalSpeed<4)state.verticalSpeed=9;state.flip=.0001;state.flipAxis=axis;state.flipDirection=direction;jumpPulse=.8;}
const controlKeys=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','ShiftLeft','ShiftRight','KeyF','KeyQ','KeyE','KeyX','KeyR','KeyC','KeyM','Digit1','Digit2','Digit3','Digit4','Digit5','Digit6'];
window.addEventListener('keydown',event=>{if(swatchActivation(event)||!controlKeys.includes(event.code))return;event.preventDefault();keys.add(event.code);if(event.code==='ArrowUp'||event.code==='ArrowDown')startDrive();if(event.repeat)return;if(event.code==='Space')jump();if(event.code==='KeyF'||event.code==='KeyE')trick('z',-1);if(event.code==='KeyQ')trick('z',1);if(event.code==='KeyX')trick('x',-1);if(event.code==='KeyR')reset(false);if(event.code==='KeyC'){state.mode='orbit';state.speed=0;state.height=0;state.verticalSpeed=0;state.flip=0;motion.snap(state);accumulator=0;orbitAngle=state.heading-.66;document.body.dataset.driving='false';}if(event.code==='KeyM'){muted=!muted;if(master)master.gain.setTargetAtTime(muted?0:.27,audio!.currentTime,.1);}if(event.code.startsWith('Digit'))selectFinish(Number(event.code.slice(-1))-1);});
window.addEventListener('keyup',event=>{keys.delete(event.code);if(swatchActivation(event))return;if(controlKeys.includes(event.code))event.preventDefault();});
function pause(){keys.clear();state.paused=true;if(audio)void audio.suspend();}
window.addEventListener('blur',pause);window.addEventListener('focus',()=>{last=performance.now();state.paused=false;});document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();else{last=performance.now();state.paused=false;}});
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
  state.steer=lerp(state.steer,steering,1-Math.exp(-dt*(Math.abs(state.speed)>60?7:12)));
  const yaw=steeringYaw(state.speed,state.steer);
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
  const safeEdge=world.roadHalfWidth-1.1;
  if(near.distance>safeEdge&&near.distance<world.roadHalfWidth+6&&state.height<1.05){
    const side=Math.sign(near.side),n=new T.Vector3(-near.tangent.z,0,near.tangent.x);
    state.x=near.point.x+n.x*side*safeEdge;state.z=near.point.z+n.z*side*safeEdge;
    // A glancing barrier scrape sheds speed and aligns the car with the road.
    // Retain forward motion instead of bouncing into reverse at 300 mph.
    const roadHeading=Math.atan2(-near.tangent.x,-near.tangent.z);
    const difference=Math.atan2(Math.sin(state.heading-roadHeading),Math.cos(state.heading-roadHeading));
    if(Math.abs(difference)<Math.PI/2){state.heading-=difference*Math.min(1,dt*9);state.speed*=Math.exp(-dt*1.7);shock=Math.max(shock,.15);}
    else collision(Math.abs(state.speed)/65);
  }
  if(near.distance>world.roadHalfWidth+6&&state.height<.1){
    if(!world.onLand(state.x,state.z)){reset(false);return;}
    state.speed*=Math.exp(-dt*.65);
  }
  if(near.distance>world.roadHalfWidth+6)for(const b of world.buildings)if(Math.abs(state.x-b.x)<b.w/2+1&&Math.abs(state.z-b.z)<b.d/2+2&&state.height<b.h){state.x=oldX;state.z=oldZ;collision(.8);break;}
  if(near.distance>180)reset(false);
}
function render(dt:number,time:number) {
  const pose=motion.sample(state,accumulator/FIXED_STEP);
  if(!inspect)world.update(time,pose.x,pose.z);
  const driving=state.mode==='drive',throttle=keys.has('ArrowUp')&&!keys.has('ArrowDown')&&driving;
  const thrust=throttle&&(Math.abs(pose.speed)<30||state.boost),lifting=jumpPulse>0;
  car.root.position.set(pose.x,pose.height,pose.z);car.root.rotation.y=pose.heading;
  car.body.rotation.set(0,0,0);car.body.position.y=.55-Math.sin(shock*Math.PI)*.035;
  const presentation=vehiclePresentation(inspect?Number(review.get('speed')??pose.speed):pose.speed,(inspect&&review.has('brake'))||keys.has('ArrowDown')&&driving);
  const fx=effects.update({driving,speed:pose.speed,boost:throttle&&state.boost,braking:presentation.braking,shock},dt);
  const pitch=throttle?-.018:presentation.braking?.027:0;
  bodyPitch=damp(bodyPitch,pitch,9,dt);bodyRoll=damp(bodyRoll,-pose.steer*Math.min(Math.abs(pose.speed)*.001,.045),9,dt);
  car.body.rotation.x=bodyPitch;car.body.rotation.z=bodyRoll;
  if(pose.flip>0)car.body.rotation[state.flipAxis as 'x'|'z']=state.flipDirection*Math.PI*2*(pose.flip*pose.flip*(3-2*pose.flip));
  for(const wheel of car.wheels)wheel.rotation.x-=pose.speed*dt/wheel.userData.radius;
  for(const pivot of car.steering)pivot.rotation.y=pose.steer*.36/(1+Math.abs(pose.speed)*.025);
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
    const active=jet.kind==='rear'?thrust:jet.kind==='lift'?lifting:pose.flip>0;
    jet.cone.visible=jet.halo.visible=active;
    if(active){const flicker=.8+Math.random()*.35;jet.cone.scale.set(1,flicker,1);jet.halo.scale.y=flicker;jet.group.getWorldPosition(worldPoint);jetDirection.set(0,1,0).transformDirection(jet.group.matrixWorld);for(let j=0;j<2;j++){const velocity=jetDirection.clone().multiplyScalar(jet.kind==='rear'?20:12);velocity.x-=Math.sin(pose.heading)*pose.speed;velocity.z-=Math.cos(pose.heading)*pose.speed;velocity.add(new T.Vector3((Math.random()-.5)*3,Math.random()*1.5,(Math.random()-.5)*3));emit(worldPoint.clone().addScaledVector(jetDirection,.1),velocity);}}
  }
  rocketLight.intensity=thrust?9:0;
  for(let i=0;i<MAX;i++)if(particleLife[i]>0){particleLife[i]-=dt;for(let j=0;j<3;j++)particlePos[i*3+j]+=particleVelocity[i*3+j]*dt;particleColor[i*3]*=.975;particleColor[i*3+1]*=.975;particleColor[i*3+2]*=.975;if(particleLife[i]<=0)particlePos[i*3+1]=-9999;}
  particleGeometry.attributes.position.needsUpdate=true;particleGeometry.attributes.color.needsUpdate=true;
  contact.position.set(pose.x,.02,pose.z);contact.rotation.z=-pose.heading;contact.scale.setScalar(1+pose.height*.08);contact.material.opacity=Math.max(.12,.8-pose.height*.06);
  keyLight.position.set(pose.x-4,7+pose.height,pose.z-4);keyLight.target.position.copy(car.root.position);
  rim.position.set(pose.x+4,pose.height+2,pose.z+2);fill.position.set(pose.x-4,pose.height+3,pose.z-3);
  worldPoint.set(pose.x,pose.height+.6,pose.z);rim.lookAt(worldPoint);fill.lookAt(worldPoint);
  if(!driving){manualOrbit=Math.max(0,manualOrbit-dt);if(!drag&&manualOrbit===0)orbitAngle+=dt*.12;desired.set(pose.x+Math.sin(orbitAngle)*orbitRadius, .62+Math.sin(orbitElevation)*orbitRadius,pose.z-Math.cos(orbitAngle)*orbitRadius);target.set(pose.x,.64,pose.z);camera.position.lerp(desired,1-Math.exp(-dt*6));camera.fov=lerp(camera.fov,42,1-Math.exp(-dt*5));}
  else {
    const v=Math.abs(pose.speed);
    chase.update(pose,dt);camera.position.copy(chase.position);target.copy(chase.target);
    camera.fov=damp(camera.fov,58+Math.min(v*.16,22)+fx.fov,7,dt);
    const gap=Math.hypot(camera.position.x-pose.x,camera.position.z-pose.z);
    cameraGapMin=Math.min(cameraGapMin,gap);cameraGapMax=Math.max(cameraGapMax,gap);
  }
  if(inspect&&!driving){const views:Record<string,number[]>={front:[0,1.7,-18],side:[7,.64,0],rear:[0,.73,7],detail:[0,.60,4.8],hero:[-4.7,2.1,-6.3],back:[-4.7,2.1,6.3],reference:[-8,1.85,-15],profile:[-15,.64,0],aft:[0,2.0,5.6],rearref:[0,2.6,8.0],top:[0,8,.01]};const view=views[inspect]||views.hero;camera.position.set(view[0],view[1],view[2]);target.set(0,.55,0);camera.fov=inspect==='reference'?10.5:inspect==='front'?9:inspect==='aft'?32:inspect==='rearref'?22:inspect==='top'?34:inspect==='profile'?12:inspect==='back'?28:35;}
  if(inspect==='glass'&&!driving){camera.position.set(-4.5,2,-6);target.set(0,.88,-.15);camera.fov=11;}
  camera.lookAt(target);
  camera.rotateX(fx.pitch);camera.rotateZ(fx.roll);camera.updateProjectionMatrix();camera.updateMatrixWorld();
  worldPoint.set(pose.x,pose.height+.65,pose.z).project(camera);
  speedFX.uniforms.carUv.value.set(worldPoint.x*.5+.5,worldPoint.y*.5+.5);
  speedFX.uniforms.aspect.value=camera.aspect;
  speedFX.uniforms.amount.value=fx.blur;speedFX.uniforms.boost.value=fx.boost;
  shock=Math.max(0,shock-dt*2.8);
  speedText.textContent=String(Math.round(Math.abs(pose.speed)*2.236936));
  if(audio&&motor&&motorGain&&windGain&&jetGain&&!state.paused){const now=audio.currentTime;motor.frequency.setTargetAtTime(38+Math.abs(pose.speed)*3.5,now,.06);motorGain.gain.setTargetAtTime(driving?Math.min(.035,Math.abs(pose.speed)*.001):0,now,.07);windGain.gain.setTargetAtTime(driving?Math.min(.15,Math.abs(pose.speed)*.001):0,now,.1);jetGain.gain.setTargetAtTime(thrust||lifting?.11:0,now,.04);}
  roadReflectionPending=true;renderer.info.reset();composer.render();
}
let last=performance.now();
function animate(now:number){requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.08);last=now;if(state.paused||document.hidden)return;accumulator+=dt;while(accumulator>=FIXED_STEP){motion.capture(state);step(FIXED_STEP);accumulator=Math.max(0,accumulator-FIXED_STEP);}render(dt,now/1000);frameCount++;frameTime+=dt;if(frameTime>2){averageFPS=frameCount/frameTime;canvas.dataset.telemetry=JSON.stringify({...state,district:world.district(world.nearest(state.x,state.z).progress),roadDistance:world.nearest(state.x,state.z).distance,routeLength:world.length,roadWidth:world.roadHalfWidth*2,cameraGapRange:Number.isFinite(cameraGapMin)?cameraGapMax-cameraGapMin:0,effects:{...effects.value},bodyPitch,wingLift:car.wing.position.y-(car.wingRestHeight-.55),wingRearward:car.wing.position.z-car.wingRestZ,wingAngle:car.wing.rotation.x,tailIntensity:car.red.emissiveIntensity,fps:Math.round(averageFPS),calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,camera:camera.position.toArray(),car:car.root.position.toArray()});frameCount=0;frameTime=0;cameraGapMin=Infinity;cameraGapMax=-Infinity;}}
camera.position.set(state.x-4,2.4,state.z-5);camera.lookAt(state.x,.6,state.z);requestAnimationFrame(animate);
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);});
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();pause();});canvas.addEventListener('webglcontextrestored',()=>location.reload());
// Read-only telemetry enables browser checks without adding any on-screen interface.
Object.defineProperty(window,'__roadster',{value:{snapshot:()=>({...state,district:world.district(world.nearest(state.x,state.z).progress),roadDistance:world.nearest(state.x,state.z).distance,routeLength:world.length,roadWidth:world.roadHalfWidth*2,fps:averageFPS,camera:camera.position.toArray(),car:car.root.position.toArray(),calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,ready:true}),route:()=>world.samples.map(p=>[p.x,p.z])},configurable:true});
