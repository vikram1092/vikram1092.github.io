import * as T from 'three';
import { box,cylinder,lathe,line,loft,panel,patch,torus,V,type P } from './car-geometry';
import type { Materials } from './car-materials';
export type Jet={group:T.Group;kind:'rear'|'lift'|'side';cone:T.Mesh;halo:T.Mesh};
export function createRear(body:T.Group,m:Materials){
  const rear=new T.Group();rear.name='06 Rear fascia, diffuser and fan system';body.add(rear);
  const underbody=new T.Group();underbody.name='07 Carbon floor and cold-gas plumbing';body.add(underbody);
  const jets:Jet[]=[],staticGroups:T.Group[]=[rear,underbody];
  const wing=new T.Group();wing.name='Flush active rear airfoil';wing.position.set(0,.817,1.925);body.add(wing);
  // Match the deck's leading edge exactly; the swept trailing edge follows the lamp.
  const wingPoint=(u:number,v:number):P=>{const f=u*2-1;return [f*(.918-v*.033),T.MathUtils.lerp(.004+.006*f**4,-.009+.004*f*f,v),-.135+v*.275-.012*f*f*v];};
  patch(wing,wingPoint,m.paint,96,28);
  patch(wing,(u,v)=>{const p=wingPoint(u,v);p[1]-=.004;return p;},m.carbon,96,16);
  for(const edge of [0,1]){
    patch(wing,(u,v)=>{const p=wingPoint(u,edge);p[1]-=v*.004;return p;},m.paint,96,4);
    patch(wing,(u,v)=>{const p=wingPoint(edge,u);p[1]-=v*.004;return p;},m.paint,28,4);
  }
  staticGroups.push(wing);
  // Independent articulated supports keep their bases attached during lift and tilt.
  const wingStruts:T.Group[]=[];
  for(const side of [-1,1]){
    const strut=new T.Group();strut.position.set(side*.53,.779,1.883);body.add(strut);wingStruts.push(strut);
    strut.userData.attachment=new T.Vector3(side*.50,-.023,-.02);
    const profile=(u:number,v:number):P=>[T.MathUtils.lerp(-.015,.015,v)*(1-u*.25),u,-.025-.030*Math.sin(u*Math.PI)];
    patch(strut,profile,m.carbon,24,4);
    patch(strut,(u,v)=>{const p=profile(u,v);p[2]+=.055;return p;},m.carbon,24,4);
    for(const edge of [0,1])patch(strut,(u,v)=>{const p=profile(u,edge);p[2]+=v*.055;return p;},m.carbon,24,4);
    staticGroups.push(strut);
  }
  // Closed recessed mounting bed is visible only when the airfoil deploys.
  patch(rear,(u,v)=>{const f=u*2-1;return [f*(.902-v*.017),.772-.004*f*f,1.774+v*.289];},m.paint,72,20);
  for(const x of [-.53,.53])box(rear,[.085,.018,.13],[x,.773,1.883],m.graphite,.009);
  // The lens sits inside a black cassette, with end caps and visible upper/lower
  // margins. It must not touch the white body or the movable airfoil.
  const tailSurface=(x:number,y:number,depth:number):P=>{const f=x/.879;return [x,.775+.008*(1-f*f)+y,2.072+.018*(1-f*f)+depth];};
  const roundedHeight=(x:number,w:number,h:number,r:number)=>h-r+Math.sqrt(Math.max(0,r*r-Math.max(0,Math.abs(x)-(w-r))**2));
  patch(rear,(u,v)=>{const x=(u*2-1)*.879;return tailSurface(x,(v*2-1)*roundedHeight(x,.879,.023,.010),.006);},m.black,144,8);
  for(const side of [-1,1]){
    patch(rear,(u,v)=>{const x=(u*2-1)*.879,h=roundedHeight(x,.879,.023,.010);return tailSurface(x,side*T.MathUtils.lerp(.009,h,v),.015);},m.black,144,6);
    patch(rear,(u,v)=>tailSurface((u*2-1)*.841,side*.009,.008+v*.007),m.black,128,3);
    patch(rear,(u,v)=>{const x=side*(.841+u*.038);return tailSurface(x,(v*2-1)*roundedHeight(x,.879,.023,.010),.015);},m.black,12,8);
  }
  patch(rear,(u,v)=>{const x=(u*2-1)*.841,h=roundedHeight(x,.841,.009,.008);return tailSurface(x,(v*2-1)*h,.011+.001*Math.sin(v*Math.PI));},m.red,144,8);
  const tailSpill=new T.SpotLight(0xff1224,.65,3,.85,.7,2);tailSpill.position.set(0,.60,2.24);tailSpill.target.position.set(0,.02,3.05);body.add(tailSpill,tailSpill.target);
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
  box(rear,[1.59,.254,.022],[0,.224,1.866],m.black,.008);
  for(const x of [-.59,-.197,.197,.59]){
    const fan=new T.Group();fan.position.set(x,.233,1.966);fan.rotation.x=-.26;rear.add(fan);staticGroups.push(fan);
    // Photo-fitted ratios: 254 mm blade sweep / 104 mm nozzle mouth. Large
    // conical hubs and recessed, broad blades replace the tiny exposed propellers.
    cylinder(fan,.132,.009,[0,0,-.032],m.black,'z');
    const duct=lathe(fan,[[.132,-.032],[.132,.016],[.129,.023],[.125,.018],[.125,-.026]],m.graphite,96);duct.rotation.x=Math.PI/2;
    torus(fan,.129,.0025,m.black,[0,0,.020],'z');
    for(let j=0;j<9;j++){
      const a=j*Math.PI*2/9;
      const blade=(u:number,v:number):P=>{const rr=.048+u*.079,aa=a+v*(.57-.11*u)+u*.43;return [Math.cos(aa)*rr,Math.sin(aa)*rr,-.018+.023*v+.009*Math.sin(u*Math.PI)];};
      patch(fan,blade,m.graphite,18,10);
      patch(fan,(u,v)=>{const p=blade(u,1);p[2]-=v*.002;return p;},m.black,18,2);
    }
    const hub=lathe(fan,[[.054,-.018],[.056,.003],[.052,.025],[.045,.045],[.030,.057],[.018,.061],[0,.061]],m.graphite,72);hub.rotation.x=Math.PI/2;
    torus(fan,.049,.0015,m.titanium,[0,0,.033],'z');
    cylinder(fan,.017,.002,[0,0,.062],m.black,'z');torus(fan,.018,.0012,m.titanium,[0,0,.064],'z');
  }
  for(const x of [-.794,-.393,0,.393,.794])panel(rear,[[x,.35,2.08],[x,.35,1.83],[x,.113,1.88],[x,.103,1.975]],m.carbon);
  loft(rear,[[-.795,.105,1.975],[0,.092,1.987],[.795,.105,1.975]],[[-.785,.124,1.77],[0,.108,1.76],[.785,.124,1.77]],m.carbon,80,12);
  function nozzle(position:P,direction:P,kind:Jet['kind'],radius:number){
    const g=new T.Group();g.position.set(...position);g.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),V(direction));body.add(g);
    const hardware=new T.Group();g.add(hardware);staticGroups.push(hardware);
    const length=radius*1.06;
    // Short dark barrels, a thin machined mouth, and a recessed converging
    // interior, as visible in the rear reference. No bright trumpet or flat cap.
    lathe(hardware,[[radius*.88,-length*.35],[radius*1.10,-length*.15],[radius*1.10,length*.12],[radius*1.03,length*.82],[radius,length],[radius*.96,length]],m.graphite,96);
    lathe(hardware,[[radius*.96,length],[radius*.91,length*.84],[radius*.85,length*.44],[radius*.65,length*.10]],m.titanium,96);
    cylinder(hardware,radius*.67,.002,[0,length*.08,0],m.seam,'y');
    torus(hardware,radius*.982,.0012,m.machined,[0,length,0],'y');
    torus(hardware,radius*1.075,.002,m.black,[0,length*.12,0],'y');
    for(let j=0;j<3;j++){
      const a=j*Math.PI*2/3+Math.PI/6;
      const lug=box(hardware,[.011,length*.48,.009],[Math.cos(a)*radius*1.05,0,Math.sin(a)*radius*1.05],m.graphite,.002);lug.rotation.y=-a;
      cylinder(hardware,.002,.003,[Math.cos(a)*radius*1.07,length*.25,Math.sin(a)*radius*1.07],m.titanium,'y',8);
    }
    const plumeMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,vertexShader:'varying vec2 vUv;varying vec3 vNormal;varying vec3 vView;void main(){vUv=uv;vNormal=normalMatrix*normal;vec4 p=modelViewMatrix*vec4(position,1.);vView=-p.xyz;gl_Position=projectionMatrix*p;}',fragmentShader:'varying vec2 vUv;varying vec3 vNormal;varying vec3 vView;void main(){float edge=pow(abs(dot(normalize(vNormal),normalize(vView))),.7);float fade=pow(vUv.y,2.)*.12*edge;gl_FragColor=vec4(.65,.82,1.,fade);}'});
    const cone=new T.Mesh(new T.ConeGeometry(radius*2.3,1.3,24,1,true),plumeMaterial);cone.rotation.z=Math.PI;cone.position.y=.7;cone.visible=false;g.add(cone);
    const halo=new T.Mesh(new T.ConeGeometry(radius*.7,.7,20,1,true),new T.MeshBasicMaterial({color:0xe2f9ff,transparent:true,opacity:.12,depthWrite:false,blending:T.AdditiveBlending}));halo.rotation.z=Math.PI;halo.position.y=.36;halo.visible=false;g.add(halo);jets.push({group:g,kind,cone,halo});
  }
  for(const x of [-.48,-.16,.16,.48])nozzle([x,.445,2.091],[0,0,1],'rear',.052);
  for(const s of [-1,1])for(const z of [-.92,.94])nozzle([s*.72,.132,z],[0,-1,0],'lift',.042);
  for(const s of [-1,1])nozzle([s*.891,.283,.66],[s,0,0],'side',.030);
  box(underbody,[1.53,.024,3.32],[0,.146,.0],m.carbon,.035);
  for(const s of [-1,1])line(underbody,[[s*.70,.125,-1.2],[s*.70,.115,-.7],[s*.65,.115,.5],[s*.69,.135,1.53]],.009,m.titanium);
  for(const z of [-1.1,-.55,.15,.8,1.4])for(const x of [-.68,.68])cylinder(underbody,.006,.004,[x,.132,z],m.machined,'y',8);
  return {wing,wingStruts,tailSpill,wingRestHeight:.817,jets,staticGroups};
}
