import * as T from 'three';
import { box,cylinder,lathe,line,loft,panel,patch,points,torus,V,type P } from './car-geometry';
import type { Materials } from './car-materials';
export type Jet={group:T.Group;kind:'rear'|'lift'|'side';cone:T.Mesh;halo:T.Mesh};
export function createRear(body:T.Group,m:Materials){
  const rear=new T.Group();rear.name='06 Rear fascia, diffuser and fan system';body.add(rear);
  const underbody=new T.Group();underbody.name='07 Carbon floor and cold-gas plumbing';body.add(underbody);
  const jets:Jet[]=[],staticGroups:T.Group[]=[rear,underbody];
  const wing=new T.Group();wing.name='Flush active rear airfoil';wing.position.set(0,.817,1.925);body.add(wing);
  // A flush curved airfoil, not a rectangular plate. Its trailing edge tracks the lamp.
  patch(wing,(u,v)=>{const f=u*2-1;return [f*(.904-v*.019),-.012*f*f+.014*Math.sin(v*Math.PI),-.137+v*.277-.012*f*f];},m.paint,96,20);
  loft(wing,[[-.886,-.011,.128],[0,-.006,.142],[.886,-.011,.128]],[[-.884,-.024,.124],[0,-.022,.136],[.884,-.024,.124]],m.carbon,72,6);
  for(const s of [-1,1])loft(wing,[[s*.49,-.012,-.02],[s*.50,-.10,-.05],[s*.53,-.23,-.085]],[[s*.515,-.012,.04],[s*.525,-.10,.015],[s*.55,-.23,-.015]],m.graphite,32,8);
  staticGroups.push(wing);
  // The deployed airfoil exposes a closed recessed deck and its mounting bed.
  patch(rear,(u,v)=>{const f=u*2-1;return [f*(.902-v*.017),.785-.011*f*f,1.774+v*.289];},m.paint,72,20);
  for(const x of [-.53,.53])box(rear,[.085,.018,.13],[x,.788,1.885],m.graphite,.009);
  const tail=points(t=>{const x=(t*2-1)*.882;return [x,.783+.017*(1-(x/.882)**2),2.067+.018*(1-(x/.882)**2)];});
  line(rear,tail,.009,m.lens);line(rear,tail.map(([x,y,z])=>[x,y,z+.009]),.0038,m.red);
  // Painted rear corners wrap around a single clean carbon centre panel.
  for(const s of [-1,1]){
    line(rear,[[s*.877,.765,2.042],[s*.871,.563,2.043],[s*.834,.367,2.045]],.0014,m.seam);
  }
  patch(rear,(u,v)=>{const f=u*2-1,edge=T.MathUtils.smoothstep(Math.abs(f),.79,1);return [f*(.879-.011*v),.773-v*(.248+.158*edge),2.062+.015*(1-f*f)-.007*v];},m.paint,100,24);
  const plateCanvas=document.createElement('canvas');plateCanvas.width=768;plateCanvas.height=192;const pc=plateCanvas.getContext('2d')!;
  pc.fillStyle='#13161b';pc.fillRect(0,0,768,192);pc.strokeStyle='#363b43';pc.lineWidth=6;pc.strokeRect(5,5,758,182);pc.fillStyle='#b2b9c1';pc.textAlign='center';pc.font='500 78px Arial';pc.fillText('R D S T R',384,125);
  const plateMap=new T.CanvasTexture(plateCanvas);plateMap.colorSpace=T.SRGBColorSpace;
  box(rear,[.349,.088,.012],[0,.645,2.087],new T.MeshStandardMaterial({map:plateMap,roughness:.45}),.003);
  for(const x of [-.147,.147])cylinder(rear,.0025,.014,[x,.674,2.095],m.machined,'z',8);
  box(rear,[.043,.018,.015],[0,.711,2.085],m.black,.004);cylinder(rear,.005,.017,[0,.711,2.097],m.lens,'z',16);
  // Carbon enclosure around the four nozzle mouths and the four individual fan bays.
  panel(rear,[[-.72,.525,2.082],[.72,.525,2.082],[.796,.466,2.073],[.794,.350,2.079],[-.794,.350,2.079],[-.796,.466,2.073]],m.carbon);
  line(rear,[[-.794,.352,2.082],[-.796,.466,2.077],[-.72,.525,2.086],[.72,.525,2.086],[.796,.466,2.077],[.794,.352,2.082]],.003,m.graphite);
  box(rear,[1.59,.018,.18],[0,.353,2.001],m.carbon,.005);
  box(rear,[1.59,.254,.022],[0,.224,1.888],m.black,.008);
  for(const x of [-.59,-.197,.197,.59]){
    const fan=new T.Group();fan.position.set(x,.246,1.992);rear.add(fan);staticGroups.push(fan);
    cylinder(fan,.113,.012,[0,0,0],m.black,'z');torus(fan,.112,.005,m.graphite,[0,0,.008],'z');
    for(let j=0;j<9;j++){const a=j*Math.PI*2/9;patch(fan,(u,v)=>{const rr=.025+u*.084,aa=a+v*.31+u*.45;return [Math.cos(aa)*rr,Math.sin(aa)*rr,.013+v*.012];},m.graphite,12,6);}
    cylinder(fan,.026,.030,[0,0,.018],m.titanium,'z');torus(fan,.018,.0015,m.machined,[0,0,.034],'z');
  }
  for(const x of [-.794,-.393,0,.393,.794])panel(rear,[[x,.35,2.08],[x,.35,1.83],[x,.113,1.88],[x,.103,2.115]],m.carbon);
  loft(rear,[[-.795,.105,2.11],[0,.092,2.118],[.795,.105,2.11]],[[-.785,.124,1.77],[0,.108,1.76],[.785,.124,1.77]],m.carbon,80,12);
  function nozzle(position:P,direction:P,kind:Jet['kind'],radius:number){
    const g=new T.Group();g.position.set(...position);g.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),V(direction));body.add(g);
    const hardware=new T.Group();g.add(hardware);staticGroups.push(hardware);
    lathe(hardware,[[radius*.51,-.064],[radius*.55,-.043],[radius*.75,-.016],[radius,.032],[radius,.037],[radius*.935,.037],[radius*.88,.021],[radius*.67,-.019],[radius*.47,-.051]],m.titanium,64);
    cylinder(hardware,radius*.87,.003,[0,.012,0],m.black,'y');torus(hardware,radius*.967,.0018,m.machined,[0,.038,0],'y');
    for(let j=0;j<4;j++){const a=j*Math.PI/2;box(hardware,[.006,.025,.009],[Math.cos(a)*radius*.73,-.018,Math.sin(a)*radius*.73],m.graphite,.002);}
    const plumeMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,vertexShader:'varying vec2 vUv;varying vec3 vNormal;varying vec3 vView;void main(){vUv=uv;vNormal=normalMatrix*normal;vec4 p=modelViewMatrix*vec4(position,1.);vView=-p.xyz;gl_Position=projectionMatrix*p;}',fragmentShader:'varying vec2 vUv;varying vec3 vNormal;varying vec3 vView;void main(){float edge=pow(abs(dot(normalize(vNormal),normalize(vView))),.7);float fade=pow(vUv.y,2.)*.12*edge;gl_FragColor=vec4(.65,.82,1.,fade);}'});
    const cone=new T.Mesh(new T.ConeGeometry(radius*2.3,1.3,24,1,true),plumeMaterial);cone.rotation.z=Math.PI;cone.position.y=.7;cone.visible=false;g.add(cone);
    const halo=new T.Mesh(new T.ConeGeometry(radius*.7,.7,20,1,true),new T.MeshBasicMaterial({color:0xe2f9ff,transparent:true,opacity:.12,depthWrite:false,blending:T.AdditiveBlending}));halo.rotation.z=Math.PI;halo.position.y=.36;halo.visible=false;g.add(halo);jets.push({group:g,kind,cone,halo});
  }
  for(const x of [-.48,-.16,.16,.48])nozzle([x,.445,2.091],[0,0,1],'rear',.054);
  for(const s of [-1,1])for(const z of [-.92,.94])nozzle([s*.72,.132,z],[0,-1,0],'lift',.042);
  for(const s of [-1,1])nozzle([s*.891,.283,.66],[s,0,0],'side',.030);
  box(underbody,[1.53,.024,3.32],[0,.146,.0],m.carbon,.035);
  for(const s of [-1,1])line(underbody,[[s*.70,.125,-1.2],[s*.70,.115,-.7],[s*.65,.115,.5],[s*.69,.135,1.53]],.009,m.titanium);
  for(const z of [-1.1,-.55,.15,.8,1.4])for(const x of [-.68,.68])cylinder(underbody,.006,.004,[x,.132,z],m.machined,'y',8);
  return {wing,wingRestHeight:.817,jets,staticGroups};
}
