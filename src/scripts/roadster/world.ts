import * as T from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { createRoute, ROAD_HALF_WIDTH, SHOULDER_EDGE } from './route';
import { Scenery, makePalmGeometry, windowTexture } from './scenery';

export function createWorld(scene:T.Scene) {
  const circuit=createRoute(),{route,samples,tangents,length,nearest}=circuit;
  const east=2200,west=Math.min(...samples.map(p=>p.x)),north=Math.min(...samples.map(p=>p.z)),south=-north;
  const city=(p:T.Vector3)=>p.x>east-1||p.x<west+1;
  let seed=819;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  const b=new Scenery(scene);
  const standard=(color:number,roughness=.8)=>new T.MeshStandardMaterial({color:new T.Color(color).multiplyScalar(.57),roughness});
  const glow=(color:number,power=1.8)=>new T.MeshBasicMaterial({color:new T.Color(color).multiplyScalar(power)});
  const concrete=standard(0x727c82),sidewalk=standard(0x777e83),metal=standard(0x23333d,.43),soil=standard(0x153b31),sand=standard(0x998b79);
  const dark=standard(0x101f2b,.4),white=glow(0xd5ecde,.8),warm=glow(0xffdfac,2.1),pink=glow(0xff5ba6,2.4),cyan=glow(0x4ae4da,2),yellow=glow(0xd6b66a,.8);
  const poolCanvas=document.createElement('canvas');poolCanvas.width=64;poolCanvas.height=64;
  const poolContext=poolCanvas.getContext('2d')!,gradient=poolContext.createRadialGradient(32,32,1,32,32,32);
  gradient.addColorStop(0,'#ffffff55');gradient.addColorStop(.4,'#ffffff22');gradient.addColorStop(1,'#ffffff00');poolContext.fillStyle=gradient;poolContext.fillRect(0,0,64,64);
  const lightPool=new T.MeshBasicMaterial({map:new T.CanvasTexture(poolCanvas),color:0xffd8ac,transparent:true,depthWrite:false,blending:T.AdditiveBlending,opacity:.13});
  const trunkMat=standard(0x7d7562),leafMat=new T.MeshStandardMaterial({color:0x216a4c,roughness:1,side:T.DoubleSide});
  const palmGeometry=makePalmGeometry();
  const palm=(x:number,z:number,scale=1)=>{
    const rotation=rand()*Math.PI*2;
    for(const [geometry,material] of [[palmGeometry.trunk,trunkMat],[palmGeometry.leaves,leafMat]] as const){const g=geometry.clone();g.scale(scale,scale,scale);g.rotateY(rotation);g.translate(x,0,z);b.add(g,material,x,z);}
    b.cylinder(concrete,.65,.7,.18,[x,.04,z]);
  };
  const land:{x:number,z:number,w:number,d:number}[]=[
    {x:west-1750,z:0,w:3590,d:10500}, // Miami mainland
    {x:east+445,z:0,w:980,d:10500},   // Miami Beach barrier island
  ];
  const islands:{x:number,z:number,r:number}[]=[];
  for(const l of land)b.box(soil,[l.w,3,l.d],[l.x,-1.8,l.z]);
  b.box(sand,[130,1,10500],[east+910,-2.3,0]);
  b.box(sidewalk,[7,.15,6000],[east+840,-.15,0]);
  // The Venetian chain sits north of the port; Palm and Star Island sit in the bay.
  for(let i=0;i<6;i++)islands.push({x:west+1000+i*520,z:north+105,r:155+i%2*35});
  islands.push({x:east-1150,z:south-490,r:330},{x:east-1800,z:south-600,r:245},{x:west+840,z:south-80,r:260});
  for(const island of islands){b.cylinder(concrete,island.r,island.r+7,3,[island.x,-2.2,island.z],48);b.cylinder(soil,island.r-4,island.r,1,[island.x,-.8,island.z],48);}
  const onLand=(x:number,z:number)=>land.some(l=>Math.abs(x-l.x)<l.w/2&&Math.abs(z-l.z)<l.d/2)||islands.some(i=>(x-i.x)**2+(z-i.z)**2<i.r*i.r);

  // Water has wind ripples and long, broken city-light reflections. One material,
  // no extra reflection camera; the road retains the actual car reflection.
  const waterMaterial=new T.ShaderMaterial({fog:true,uniforms:{...T.UniformsLib.fog,time:{value:0},west:{value:west},east:{value:east}},vertexShader:`varying vec3 vWorld;
    #include <fog_pars_vertex>
    void main(){vec4 p=modelMatrix*vec4(position,1.);vWorld=p.xyz;vec4 mvPosition=viewMatrix*p;gl_Position=projectionMatrix*mvPosition;
    #include <fog_vertex>
    }`,fragmentShader:`uniform float time;uniform float west;uniform float east;varying vec3 vWorld;
    #include <fog_pars_fragment>
    void main(){vec2 p=vWorld.xz;float ripple=sin(p.x*.21+p.y*.32+time*.7)*sin(p.y*.63-p.x*.18-time*.5);float fine=sin(p.y*2.+p.x*.36+time);
    float shore=exp(-abs(p.x-west)/240.)+exp(-abs(p.x-east)/190.);
    float lights=pow(max(0.,sin(p.y*.042)),14.)*(.35+.65*max(0.,ripple));
    vec3 col=vec3(.008,.035,.055)+vec3(.012,.035,.043)*max(0.,ripple)*.35;
    col+=vec3(.05,.17,.15)*shore*lights;col+=vec3(.04,.05,.07)*pow(max(0.,fine*ripple),10.);
    gl_FragColor=vec4(col,1.);
    #include <fog_fragment>
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    }`});
  const water=new T.Mesh(new T.PlaneGeometry(30000,30000),waterMaterial);water.rotation.x=-Math.PI/2;water.position.y=-3.1;scene.add(water);
  const sky=new T.Mesh(new T.SphereGeometry(14000,32,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{},vertexShader:'varying vec3 vPosition;void main(){vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec3 vPosition;void main(){float h=normalize(vPosition).y;vec3 col=mix(vec3(.045,.024,.075),vec3(.004,.009,.028),smoothstep(-.01,.46,h));col+=vec3(.018,.012,.009)*exp(-pow((h-.015)*18.,2.));gl_FragColor=vec4(col,1.);}` }));scene.add(sky);

  const positions:number[]=[],indices:number[]=[];
  for(let i=0;i<=samples.length;i+=2) {
    const j=i%samples.length,p=samples[j],t=tangents[j],nx=-t.z,nz=t.x;
    for(const side of [-1,1])positions.push(p.x+nx*ROAD_HALF_WIDTH*side,-p.z-nz*ROAD_HALF_WIDTH*side,0);
    if(i<samples.length){const a=i;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
  }
  const roadGeometry=new T.BufferGeometry();roadGeometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));roadGeometry.setIndex(indices);roadGeometry.computeVertexNormals();
  const baseShader=(Reflector as unknown as {ReflectorShader:{uniforms:Record<string,T.IUniform>,vertexShader:string,fragmentShader:string}}).ReflectorShader;
  const shader={...baseShader,fragmentShader:baseShader.fragmentShader.replace('vec4 base = texture2DProj( tDiffuse, vUv );',`vec2 uv = vUv.xy / vUv.w;
    float noise = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898,78.233))) * 43758.5453);
    vec4 base = texture2D(tDiffuse, uv + vec2(noise-.5)*.0015);
    base += texture2D(tDiffuse, uv+vec2(.0015, .0008));
    base += texture2D(tDiffuse, uv-vec2(.0015, .0008)); base /= 3.;`).replace('vec4( blendOverlay( base.rgb, color ), 1.0 )','vec4(base.rgb * .13 + vec3(.014, .021, .029) + noise * .002, 1.0)')};
  const road=new Reflector(roadGeometry,{textureWidth:1024,textureHeight:768,color:0x303747,clipBias:.002,multisample:0,shader});road.rotation.x=-Math.PI/2;road.position.y=.001;scene.add(road);
  // Six usable lanes, shoulders, regular road paint and broad unobstructed sight lines.
  for(let distance=0;distance<length;distance+=8) {
    const p=route.getPointAt(distance/length),dir=route.getTangentAt(distance/length),n=new T.Vector3(-dir.z,0,dir.x),angle=Math.atan2(dir.x,dir.z),urban=city(p);
    const at=(offset:number,y:number)=>[p.x+n.x*offset,y,p.z+n.z*offset];
    b.box(concrete,[49,.5,8.2],at(0,-.30),angle);
    for(const side of [-1,1]){
      b.box(sidewalk,[5,.22,8.2],at(side*21,.04),angle);
      // City curb and bridge parapet leave the same 36 m collision envelope.
      b.box(concrete,[.35,urban?.2:.8,8.2],at(side*18.2,urban?.10:.4),angle);
      if(!urban)b.box(metal,[.12,.09,8.2],at(side*18.2,.95),angle);
      b.box(white,[.14,.008,8.1],at(side*SHOULDER_EDGE,.014),angle);
      if(distance%32===0)b.box(warm,[.12,.09,.3],at(side*17.7,.1),angle);
    }
    for(const off of [-.15,.15])b.box(yellow,[.1,.008,8.1],at(off,.014),angle);
    if(distance%16===0)for(const off of [-9,-4.5,4.5,9])b.box(white,[.13,.008,5],at(off,.016),angle);
    if(distance%64===0)for(const side of [-1,1]) {
      const q=at(side*22,0),top=new T.Vector3(q[0],10.5,q[2]),tip=top.clone().addScaledVector(n,-side*3.7);
      b.box(metal,[.15,10.5,.15],[q[0],5.25,q[2]]);b.beam(metal,top,tip,.12);
      b.box(warm,[3.2,.055,.35],[tip.x+n.x*side*1.5,10.43,tip.z+n.z*side*1.5],angle);
      // A pool of warm light is baked into geometry, avoiding hundreds of lights.
      const pool=new T.PlaneGeometry(13,25);pool.rotateX(-Math.PI/2);pool.rotateY(angle);pool.translate(...at(side*10,.022) as [number,number,number]);b.add(pool,lightPool,p.x,p.z);
      if(urban)palm(q[0]+n.x*side*7,q[2]+n.z*side*7,.9+rand()*.4);
    }
    if(distance%160===0&&!urban){for(const side of [-1,1])b.box(concrete,[2.3,5,2.3],at(side*14,-2.7),angle);}
  }

  const buildings:{x:number,z:number,w:number,d:number,h:number}[]=[];
  const facades=[0,1,2].map(i=>{const map=windowTexture(93+i*47);return new T.MeshStandardMaterial({color:0x97aebe,map,emissiveMap:map,emissive:0xb6d9e0,emissiveIntensity:.75,roughness:.4,metalness:.3});});
  const pastels=[0xd7b6ac,0x9fbfba,0xc8c2b1,0xb0b3cd,0xc4a5ba].map(c=>standard(c,.65));
  const glass=standard(0x153448,.24);
  const building=(x:number,z:number,w:number,d:number,h:number,material:T.Material)=>{b.box(material,[w,h,d],[x,h/2,z]);buildings.push({x,z,w,d,h});};
  // A dense but deliberate mainland skyline: setbacks, illuminated crowns,
  // balcony bands and a few slender spires instead of scattered anonymous cubes.
  for(let i=0;i<155;i++){
    const x=west-70-rand()*1450,z=-2600+rand()*5600,w=28+rand()*45,d=28+rand()*48,h=45+Math.pow(rand(),1.5)*245;
    building(x,z,w,d,h,facades[i%3]);
    b.box(dark,[w+1,1.2,d+1],[x,h,z]);
    if(i%3===0){building(x,z,w*.64,d*.64,h+16,facades[i%3]);b.box(i%2?cyan:pink,[w*.65,.6,d*.65],[x,h+16,z]);}
    if(i%7===0)b.box(warm,[.3,22,.3],[x,h+11,z]);
    if(i%4===0)for(let y=10;y<h;y+=14)b.box(concrete,[w+1,.45,d+1],[x,y,z]);
  }
  // Downtown's recognizable waterfront forms: a stepped tower, the Freedom
  // Tower silhouette and a luminous observation wheel at Bayside.
  const freedomX=west-85,freedomZ=180;
  building(freedomX,freedomZ,38,30,16,pastels[2]);building(freedomX,freedomZ,15,15,67,pastels[2]);
  b.cylinder(warm,0,10,14,[freedomX,74,freedomZ],4);b.box(warm,[1,12,1],[freedomX,84,freedomZ]);
  b.text('BISCAYNE BOULEVARD',[west-42,8,20],24,3,Math.PI/2,'#f4e5bb','#162d3c');
  const wheelCenter=new T.Vector3(west+50,31,480);
  const wheel=new T.TorusGeometry(27,.22,6,64);wheel.rotateY(Math.PI/2);wheel.translate(wheelCenter.x,wheelCenter.y,wheelCenter.z);b.add(wheel,cyan,wheelCenter.x,wheelCenter.z);
  for(let i=0;i<24;i++){const a=i*Math.PI/12,q=new T.Vector3(wheelCenter.x,31+Math.sin(a)*27,480+Math.cos(a)*27);b.beam(metal,wheelCenter,q,.12);b.box(i%2?pink:warm,[2,2.2,1.8],q.toArray());}
  b.beam(concrete,new T.Vector3(west+42,0,468),wheelCenter,1.1);b.beam(concrete,new T.Vector3(west+42,0,492),wheelCenter,1.1);

  // Miami Beach: low pastel hotels on the near frontage, taller residential
  // blocks behind, sidewalk cafes, striped awnings and glowing vertical fins.
  const hotelNames=['THE TIDES','COLONY','BREAKWATER','CAVALIER','BEACON','AVALON','SOUTH BEACH','OCEAN FIVE'];
  for(let i=0;i<38;i++) {
    const z=-780+i*42,x=east+53,w=26+rand()*7,d=34,h=10+(i%4)*3,mat=pastels[i%pastels.length];
    building(x,z,w,d,h,mat);
    for(let y=3;y<h;y+=3){b.box(concrete,[w+1,.32,d+1],[x,y,z]);for(let dz=-12;dz<=12;dz+=5){b.box(glass,[.1,1.65,2.6],[x-w/2-.06,y-1.3,z+dz]);b.box(i%3?warm:cyan,[.12,.09,2.6],[x-w/2-.13,y-.5,z+dz]);}}
    const front=x-w/2-.3;
    b.box(i%2?cyan:pink,[.12,.12,d+1],[front,h-.7,z]);b.box(mat,[2.8,h+3,6],[front-.5,(h+3)/2,z]);
    for(const offset of [-2.9,2.9])b.box(i%2?pink:cyan,[.1,h+2,.13],[front-2,h/2+1,z+offset]);
    b.box(i%2?cyan:pink,[4,.17,13],[front-1,3.2,z]);
    if(i%3===0)b.text(hotelNames[(i/3)%8|0],[front-2.05,h+1,z],17,2.6,-Math.PI/2,i%2?'#9dfff2':'#ffc2df','#172b35',72);
    // Cafe terraces and striped shade canopies stay beyond the sidewalk.
    for(const dz of [-10,10]){
      b.cylinder(concrete,.7,.7,.12,[front-4,.9,z+dz]);b.box(metal,[.1,.9,.1],[front-4,.45,z+dz]);
      for(const side of [-1,1])b.box(pastels[1],[.55,.6,.55],[front-4+side*1.1,.3,z+dz]);
      b.cylinder(i%2?pink:cyan,0,1.9,.6,[front-4,2.9,z+dz],8);b.box(metal,[.06,2.6,.06],[front-4,1.3,z+dz]);
    }
    for(let stripe=-2;stripe<=2;stripe++)b.box(stripe%2===0?pastels[2]:pastels[1],[3,.12,1.1],[front-1,3.4,z+stripe*1.1]);
    if(i%4===0){b.box(metal,[1,.8,2],[east+26,.4,z-16]);b.box(concrete,[.6,.7,.6],[east+26,.35,z+17]);}
  }
  for(let i=0;i<85;i++){
    const x=east+135+rand()*570,z=-3200+rand()*6400,w=20+rand()*35,d=22+rand()*35,h=20+rand()*95;
    building(x,z,w,d,h,facades[i%3]);if(i%3===0)for(let y=4;y<h;y+=5)b.box(pastels[i%5],[w+1,.3,d+1],[x,y,z]);
  }
  // Palms, low villas and pools give the Venetian islands a distinct scale.
  for(const island of islands)for(let i=0;i<20;i++){
    const a=rand()*Math.PI*2,r=island.r*(.45+rand()*.45),x=island.x+Math.cos(a)*r,z=island.z+Math.sin(a)*r;
    if(nearest(x,z).distance<42)continue;
    palm(x,z,.8+rand()*.4);
    if(i%3===0){building(x+12,z,16,12,5,pastels[i%5]);b.box(cyan,[10,.03,5],[x+12,.05,z+12]);b.box(concrete,[12,.1,7],[x+12,-.05,z+12]);}
  }
  for(let z=-2300;z<2400;z+=65)palm(east+837,z,1.1);

  const yacht=(x:number,z:number,size:number,yaw=0)=>{
    const outline=[[-.12,.48],[.12,.48],[.15,-.18],[.11,-.39],[0,-.57],[-.11,-.39],[-.15,-.18]];
    const hullVertices:number[]=[],hullUV:number[]=[];
    const vertex=(u:number,v:number,y:number)=>{hullVertices.push(u*size,y,v*size);hullUV.push(u+.5,v+.5);};
    for(let i=0;i<outline.length;i++){
      const a=outline[i],c=outline[(i+1)%outline.length];
      vertex(0,0,-1);vertex(c[0],c[1],-1);vertex(a[0],a[1],-1);
      vertex(a[0],a[1],-1);vertex(c[0],c[1],-1);vertex(a[0]*.7,a[1]*.9,-2.8);
      vertex(c[0],c[1],-1);vertex(c[0]*.7,c[1]*.9,-2.8);vertex(a[0]*.7,a[1]*.9,-2.8);
    }
    const hull=new T.BufferGeometry();hull.setAttribute('position',new T.Float32BufferAttribute(hullVertices,3));hull.setAttribute('uv',new T.Float32BufferAttribute(hullUV,2));hull.computeVertexNormals();hull.rotateY(yaw);hull.translate(x,0,z);b.add(hull,pastels[2],x,z);
    b.box(dark,[size*.24,.12,size*.67],[x,-.92,z],yaw);
    b.box(pastels[2],[size*.21,size*.12,size*.46],[x,-.15,z],yaw);b.box(glass,[size*.215,.6,size*.24],[x,.2,z],yaw);
    b.box(warm,[size*.22,.09,size*.48],[x,size*.06,z],yaw);b.box(metal,[.08,size*.25,.08],[x,size*.17,z]);
  };
  // Marina fingers and moored yachts just off the Miami Beach seawall.
  for(let i=0;i<13;i++){
    const z=-730+i*115,x=east-74;
    b.box(concrete,[65,.45,3],[x,-1.1,z]);b.box(metal,[3,.45,100],[x-30,-1.1,z]);
    for(const dz of [-35,-10,15,40]){yacht(x-43,z+dz,17+rand()*9,Math.PI/2);b.box(warm,[.18,.9,.18],[x-30,-.45,z+dz]);}
  }
  // PortMiami occupies the southern waterfront. Container stacks, gantry cranes
  // and a lit cruise ship read as a port even from across the causeway.
  const portX=west+1500,portZ=south+360;
  land.push({x:portX,z:portZ,w:1900,d:460});b.box(concrete,[1900,2,460],[portX,-2,portZ]);
  const containers=[0x925854,0x3c686b,0x52749b,0xa59370].map(c=>standard(c));
  for(let i=0;i<110;i++)b.box(containers[i%4],[12,3+3*(i%3),3],[portX-850+(i%35)*45,1.5+1.5*(i%3),portZ-150+Math.floor(i/35)*35]);
  for(let i=0;i<7;i++){
    const x=portX-750+i*240,z=portZ+120;
    for(const dx of [-12,12])b.box(concrete,[2,55,2],[x+dx,25,z]);
    b.box(concrete,[28,2,3],[x,52,z]);b.box(concrete,[2,3,120],[x,56,z+36]);
    b.beam(metal,new T.Vector3(x,68,z-22),new T.Vector3(x,56,z+90),.3);b.box(pink,[.5,.5,3],[x,57.7,z+90]);
  }
  const shipX=portX+250,shipZ=portZ+320;
  b.box(pastels[2],[240,13,36],[shipX,3,shipZ]);b.box(facades[0],[202,22,30],[shipX,19,shipZ]);
  for(let deck=0;deck<6;deck++)b.box(warm,[204,.22,30.3],[shipX,10+deck*4,shipZ]);
  b.box(dark,[18,12,13],[shipX-44,36,shipZ]);b.box(pink,[18,.5,13],[shipX-44,42,shipZ]);

  // Place-name signs are part of the streetscape, not an overlay on the car.
  const signs:[number,string][]=[
    [100,'MIAMI BEACH\nVenetian Causeway  /  Downtown'],[650,'VENETIAN CAUSEWAY\nBiscayne Bay'],
    [2400,'VENETIAN ISLANDS\nDowntown Miami'],[5200,'BISCAYNE BOULEVARD\nDowntown  /  PortMiami'],
    [7000,'DOWNTOWN MIAMI\nMacArthur Causeway'],[8600,'MacARTHUR CAUSEWAY\nMiami Beach'],
    [10500,'BISCAYNE BAY\nSouth Beach'],[12500,'MIAMI BEACH\nAlton Road  /  South Beach'],[14600,'SOUTH BEACH\nArt Deco District'],
  ];
  for(const [distance,label] of signs){
    const p=route.getPointAt(distance/length),t=route.getTangentAt(distance/length),n=new T.Vector3(-t.z,0,t.x),yaw=Math.atan2(-t.x,-t.z);
    for(const side of [-1,1])b.box(metal,[.3,10,.3],[p.x+n.x*side*22,5,p.z+n.z*side*22]);
    b.box(metal,[44,.28,.3],[p.x,9.7,p.z],yaw);b.text(label,[p.x,8,p.z],23,3.4,yaw);
  }
  // Reflective chevrons give advance visual feedback through the broad sweeps.
  for(let distance=0;distance<length;distance+=120){
    const i=Math.floor(distance/4);if(circuit.curvatures[i]<.001)continue;
    const p=route.getPointAt(distance/length),t=route.getTangentAt(distance/length),n=new T.Vector3(-t.z,0,t.x);
    b.box(metal,[.1,2.5,.1],[p.x+n.x*22,1.25,p.z+n.z*22]);
    b.text('‹  ‹',[p.x+n.x*22,2.7,p.z+n.z*22],2.8,1.6,Math.atan2(-t.x,-t.z)+.35,'#ffdd79','#182027',130);
  }
  b.text('MIAMI BEACH',[east+37,6,35],22,3,-Math.PI/2,'#ffa2ce','#192638',72);
  b.text('BISCAYNE BAY MARINA',[east-32,3,-55],17,2.2,Math.PI/2,'#9dfff2','#142e35');
  // Small palms and benches frame the starting view across the marina.
  for(let z=-780;z<=780;z+=48){palm(east-29,z,1+rand()*.15);b.box(metal,[1.7,.6,.6],[east-27,.3,z+12]);}
  b.finish();palmGeometry.trunk.dispose();palmGeometry.leaves.dispose();
  const stars:number[]=[];for(let i=0;i<550;i++){const a=rand()*Math.PI*2,h=.12+rand()*.85,r=12000;stars.push(Math.cos(a)*r*Math.sqrt(1-h*h),h*r,Math.sin(a)*r*Math.sqrt(1-h*h));}
  const starGeometry=new T.BufferGeometry();starGeometry.setAttribute('position',new T.Float32BufferAttribute(stars,3));scene.add(new T.Points(starGeometry,new T.PointsMaterial({color:0xa7b7ce,size:9,fog:false})));
  const moon=new T.Mesh(new T.SphereGeometry(100,24,16),new T.MeshBasicMaterial({color:0xd1dbe2,fog:false}));moon.position.set(-7000,4200,-8000);scene.add(moon);
  return {...circuit,road,buildings,onLand,update:(time:number,x:number,z:number)=>{waterMaterial.uniforms.time.value=time;for(const mesh of b.chunks){const sphere=mesh.geometry.boundingSphere!;const range=mesh.userData.range;mesh.visible=(sphere.center.x-x)**2+(sphere.center.z-z)**2<(range+sphere.radius)**2;}},roadHalfWidth:ROAD_HALF_WIDTH};
}
