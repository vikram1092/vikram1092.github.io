import * as T from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { box, panel } from './car';

export function createWorld(scene:T.Scene) {
  const route=new T.CatmullRomCurve3([[0,0,0],[0,0,-100],[0,0,-230],[60,0,-320],[200,0,-330],[330,0,-280],[370,0,-150],[360,0,-20],[280,0,70],[270,0,200],[160,0,280],[40,0,250],[-20,0,150],[0,0,50]].map(p=>new T.Vector3(...p)),true,'centripetal');
  route.arcLengthDivisions=2400;route.updateArcLengths();
  const samples=Array.from({length:1600},(_,i)=>route.getPointAt(i/1600));
  const tangents=Array.from({length:1600},(_,i)=>route.getTangentAt(i/1600));
  const length=route.getLength();
  const nearest=(x:number,z:number)=>{let best=Infinity,index=0;for(let i=0;i<samples.length;i++){const p=samples[i],d=(p.x-x)**2+(p.z-z)**2;if(d<best){best=d;index=i;}}const p=samples[index],t=tangents[index];return {index,point:p,tangent:t,distance:Math.sqrt(best),side:(x-p.x)*(-t.z)+(z-p.z)*t.x};};
  const asphalt=new T.MeshBasicMaterial({color:0x050913});
  const dark=new T.MeshStandardMaterial({color:0x080d18,roughness:.43,metalness:.65});
  const concrete=new T.MeshStandardMaterial({color:0x273040,roughness:.63,metalness:.22});
  const cyan=new T.MeshBasicMaterial({color:new T.Color(0x72daf1).multiplyScalar(2.3)});
  const violet=new T.MeshBasicMaterial({color:new T.Color(0x8b6ada).multiplyScalar(2.2)});
  const white=new T.MeshBasicMaterial({color:new T.Color(0xc8e1f2).multiplyScalar(2)});
  const lane=new T.MeshBasicMaterial({color:0x7a879b});
  const ground=box(scene,[2300,.4,2300],[150,-.28,-30],asphalt);
  ground.receiveShadow=true;
  // Actual planar reflections are restricted to the road, with a fine rough surface.
  const positions:number[]=[],indices:number[]=[];
  for(let i=0;i<=1600;i++) {
    const p=samples[i%1600],t=tangents[i%1600],n=new T.Vector3(-t.z,0,t.x);
    for(const side of [-1,1])positions.push(p.x+n.x*12*side,-p.z-n.z*12*side,0);
    if(i<1600){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
  }
  const roadGeometry=new T.BufferGeometry();roadGeometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));roadGeometry.setIndex(indices);roadGeometry.computeVertexNormals();
  const baseShader=(Reflector as unknown as {ReflectorShader:{uniforms:Record<string,T.IUniform>,vertexShader:string,fragmentShader:string}}).ReflectorShader;
  const shader={...baseShader,fragmentShader:baseShader.fragmentShader.replace('vec4 base = texture2DProj( tDiffuse, vUv );',`vec2 uv = vUv.xy / vUv.w;
    float noise = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898,78.233))) * 43758.5453);
    vec4 base = texture2D(tDiffuse, uv + vec2(noise-.5)*.0015);
    base += texture2D(tDiffuse, uv+vec2(.0015, .0008));
    base += texture2D(tDiffuse, uv-vec2(.0015, .0008)); base /= 3.;`).replace('vec4( blendOverlay( base.rgb, color ), 1.0 )','vec4(base.rgb * .105 + vec3(.008, .011, .018) + noise * .0012, 1.0)')};
  const road=new Reflector(roadGeometry,{textureWidth:1024,textureHeight:768,color:0x303747,clipBias:.002,multisample:0,shader});road.rotation.x=-Math.PI/2;road.position.y=.001;scene.add(road);
  const batches=new Map<T.Material,T.BufferGeometry[]>();
  const addBox=(mat:T.Material,s:T.Vector3,p:T.Vector3,angle=0)=>{const g=new T.BoxGeometry(s.x,s.y,s.z);g.rotateY(angle);g.translate(p.x,p.y,p.z);if(!batches.has(mat))batches.set(mat,[]);batches.get(mat)!.push(g);};
  for(let i=0;i<800;i++) {
    const t=i/800,p=route.getPointAt(t),dir=route.getTangentAt(t),n=new T.Vector3(-dir.z,0,dir.x),angle=Math.atan2(dir.x,dir.z);
    for(const s of [-1,1]) {
      const edge=p.clone().addScaledVector(n,s*12.35);edge.y=.22;
      addBox(concrete,new T.Vector3(.55,.44,length/800+.1),edge,angle);
      const light=edge.clone();light.y=.455;
      addBox(i%100<70?cyan:violet,new T.Vector3(.035,.025,length/800+.12),light,angle);
    }
    if(i%4===0)for(const off of [-4,4]){const q=p.clone().addScaledVector(n,off);q.y=.012;addBox(lane,new T.Vector3(.065,.006,2.6),q,angle);}
    if(i%10===0) {
      for(const s of [-1,1]) {
        const q=p.clone().addScaledVector(n,s*14.1);q.y=3.2;
        addBox(dark,new T.Vector3(.12,6.4,.18),q,angle);
        const cap=q.clone().addScaledVector(n,-s*1.15);cap.y=6.4;
        addBox(dark,new T.Vector3(2.5,.11,.27),cap,angle);cap.y=6.33;
        addBox(white,new T.Vector3(2.1,.025,.16),cap,angle);
      }
    }
    if(i%25===0) {
      for(const s of [-1,1]) {
        const q=p.clone().addScaledVector(n,s*12);q.y=.08;
        addBox(white,new T.Vector3(.16,.05,.18),q,angle);
      }
    }
  }
  let seed=819;
  const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  // Sparse architectural lighting, drawn in batches rather than hundreds of lights.
  const cv=document.createElement('canvas');cv.width=128;cv.height=512;const ctx=cv.getContext('2d')!;
  ctx.fillStyle='#080e1b';ctx.fillRect(0,0,128,512);
  for(let y=3;y<512;y+=8)for(let x=3;x<128;x+=8){const lit=rand();ctx.fillStyle=lit>.83?'#8ba5bc':lit>.58?'#263c52':'#101b2b';ctx.fillRect(x,y,3,3);}
  const win=new T.CanvasTexture(cv);win.colorSpace=T.SRGBColorSpace;win.anisotropy=4;
  const facade=new T.MeshStandardMaterial({map:win,emissiveMap:win,emissive:0x94aacc,emissiveIntensity:.45,roughness:.32,metalness:.7,color:0x647185});
  const buildings:{x:number,z:number,w:number,d:number,h:number}[]=[];
  for(let i=0;i<340;i++) {
    const x=-360+rand()*1050,z=-620+rand()*1180,w=10+rand()*24,d=10+rand()*23;
    if(nearest(x,z).distance<34+Math.max(w,d)*.7)continue;
    const h=18+Math.pow(rand(),1.4)*120;
    buildings.push({x,z,w,d,h});addBox(facade,new T.Vector3(w,h,d),new T.Vector3(x,h/2,z));
    addBox(dark,new T.Vector3(w+1,.7,d+1),new T.Vector3(x,h,z));
    if(i%3===0){const c=i%2?cyan:violet;addBox(c,new T.Vector3(.12,h*.65,.14),new T.Vector3(x-w/2-.02,h*.57,z-d/2-.02));}
    if(i%4===0) {addBox(dark,new T.Vector3(w*.65,h*.18,d*.65),new T.Vector3(x,h*1.09,z));addBox(violet,new T.Vector3(w*.65,.12,.1),new T.Vector3(x,h*1.18,z-d*.325));}
  }
  // Low monolithic pavilions and luminous lintels create landmarks without signs.
  for(const t of [.02,.24,.46,.72,.91]) {
    const p=route.getPointAt(t),dir=route.getTangentAt(t),angle=Math.atan2(dir.x,dir.z);
    const g=new T.Group();g.position.copy(p);g.rotation.y=angle;scene.add(g);
    for(const s of [-1,1])box(g,[.5,14,.6],[s*13,7,0],dark);
    box(g,[26.5,.3,.6],[0,14,0],dark);
    box(g,[24,.035,.22],[0,13.82,0],t===.02?white:cyan);
  }
  const obstacles:{position:T.Vector3,angle:number,width:number,depth:number,height:number,kind:'ramp'|'block'}[]=[];
  for(const [t,offset] of [[.102,4],[.39,-4],[.68,4],[.84,-4]]) {
    const p=route.getPointAt(t),dir=route.getTangentAt(t);p.add(new T.Vector3(-dir.z,0,dir.x).multiplyScalar(offset));
    const angle=Math.atan2(-dir.x,-dir.z),g=new T.Group();g.position.copy(p);g.rotation.y=angle;scene.add(g);
    panel(g,[[-2.1,0,5],[2.1,0,5],[2.1,1.4,-5],[-2.1,1.4,-5]],concrete);
    for(const s of [-1,1]) {panel(g,[[s*2.1,0,5],[s*2.1,1.4,-5],[s*2.1,0,-5]],dark);const rail=box(g,[.05,.035,10.1],[s*2.08,.72,0],cyan);rail.rotation.x=.139;}
    obstacles.push({position:p,angle,width:4.2,depth:10,height:1.4,kind:'ramp'});
    const q=p.clone().addScaledVector(dir,20),b=new T.Group();b.position.copy(q);b.rotation.y=angle;scene.add(b);
    box(b,[3.4,1.4,6],[0,.7,0],dark,.1);box(b,[3.3,.045,5.8],[0,1.42,0],polishMaterial());
    for(const s of [-1,1])box(b,[.025,.07,5.7],[s*1.71,1.2,0],violet);
    obstacles.push({position:q,angle,width:3.4,depth:6,height:1.45,kind:'block'});
  }
  for(const [mat,geoms] of batches){const mesh=new T.Mesh(mergeGeometries(geoms),mat);mesh.receiveShadow=true;scene.add(mesh);for(const g of geoms)g.dispose();}
  // Distant stars and an atmospheric moon; no domes or textures to download.
  const starPositions:number[]=[];for(let i=0;i<650;i++){const a=rand()*Math.PI*2,h=rand()*.82+.08;const r=1000;starPositions.push(150+Math.cos(a)*r*Math.sqrt(1-h*h),h*r,-30+Math.sin(a)*r*Math.sqrt(1-h*h));}
  const stars=new T.BufferGeometry();stars.setAttribute('position',new T.Float32BufferAttribute(starPositions,3));scene.add(new T.Points(stars,new T.PointsMaterial({color:0x61758e,size:1,sizeAttenuation:true,fog:false})));
  const moon=new T.Mesh(new T.SphereGeometry(13,32,16),new T.MeshBasicMaterial({color:0x8796ae,fog:false}));moon.position.set(-500,420,-850);scene.add(moon);
  return {route,samples,length,nearest,road,obstacles,buildings};
}
function polishMaterial(){return new T.MeshStandardMaterial({color:0x1b2333,metalness:.6,roughness:.3});}
