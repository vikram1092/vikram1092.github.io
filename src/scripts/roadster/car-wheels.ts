import * as T from 'three';
import { box, cylinder, lathe, line, panel, patch, torus, wheelStations, type P } from './car-geometry';
import type { Materials } from './car-materials';

export function createWheels(body:T.Group,m:Materials) {
  const wheels:T.Group[]=[],steering:T.Group[]=[],staticGroups:T.Group[]=[];
  const tireCanvas=document.createElement('canvas');tireCanvas.width=tireCanvas.height=1024;
  const ctx=tireCanvas.getContext('2d')!;ctx.fillStyle='#161718';ctx.fillRect(0,0,1024,1024);
  // Raised sidewall lettering and size marks, baked into a single original texture.
  function lettering(text:string,r:number,start:number,size:number){ctx.font=`600 ${size}px Arial`;ctx.textAlign='center';ctx.fillStyle='#323436';for(let i=0;i<text.length;i++){const a=start+i*.072;ctx.save();ctx.translate(512+Math.cos(a)*r,512+Math.sin(a)*r);ctx.rotate(a+Math.PI/2);ctx.fillText(text[i],0,0);ctx.restore();}}
  lettering('MICHELIN',462,-1.85,24);lettering('PILOT SPORT CUP 2',462,.65,22);lettering('285 / 30 ZR 21',452,2.55,10);
  ctx.strokeStyle='#292b2d';ctx.lineWidth=2;for(const r of [402,420,475,486]){ctx.beginPath();ctx.arc(512,512,r,0,Math.PI*2);ctx.stroke();}
  const tireMap=new T.CanvasTexture(tireCanvas);tireMap.colorSpace=T.SRGBColorSpace;tireMap.anisotropy=8;
  const sidewall=new T.MeshStandardMaterial({map:tireMap,roughness:.88});
  const brake=new T.MeshStandardMaterial({color:0x656666,metalness:.8,roughness:.58});
  const caliper=new T.MeshStandardMaterial({color:0x696052,metalness:.48,roughness:.4});
  for(const side of [-1,1])for(const w of wheelStations){
    const pivot=new T.Group();pivot.position.set(side*w.x,w.y,w.z);body.add(pivot);if(w.z<0)steering.push(pivot);
    const wheel=new T.Group();wheel.name=`${w.z<0?'Front':'Rear'} ${side<0?'left':'right'} aero wheel`;pivot.add(wheel);wheel.userData.radius=w.radius;wheels.push(wheel);staticGroups.push(wheel);
    const r=w.radius,half=w.width/2,rim=r-.053,outer=side*(half+.001);
    const tire=lathe(wheel,[[rim-.012,-half*.91],[rim+.005,-half],[r-.025,-half],[r-.009,-half*.84],[r-.002,-half*.61],[r,-half*.4],[r,half*.4],[r-.002,half*.61],[r-.009,half*.84],[r-.025,half],[rim+.005,half],[rim-.012,half*.91]],m.rubber,112);tire.rotation.z=Math.PI/2;
    const sideFace=new T.Mesh(new T.RingGeometry(rim+.003,r-.014,112),sidewall);sideFace.rotation.y=side*Math.PI/2;sideFace.position.x=outer;wheel.add(sideFace);
    const barrel=lathe(wheel,[[rim-.005,-half*.85],[rim-.005,half*.87],[rim-.011,half*.99]],m.graphite,96);barrel.rotation.z=Math.PI/2;
    torus(wheel,rim,.005,m.machined,[outer,0,0]);torus(wheel,rim-.012,.003,m.graphite,[outer+side*.002,0,0]);
    cylinder(wheel,rim-.028,.012,[side*(half-.047),0,0],brake);
    cylinder(wheel,.089,.017,[side*(half-.037),0,0],m.titanium);
    // Cross-drilled rotor holes and concentric wear tracks sit behind the open spokes.
    for(let i=0;i<60;i++){const a=i*Math.PI*2/60,rr=rim-.048-(i%3)*.02;const hole=new T.Mesh(new T.CircleGeometry(.0033,6),m.black);hole.rotation.y=side*Math.PI/2;hole.position.set(side*(half-.039),Math.cos(a)*rr,Math.sin(a)*rr);wheel.add(hole);}
    for(const rr of [rim-.035,rim-.044,rim-.105])torus(wheel,rr,.0007,m.titanium,[side*(half-.039),0,0]);
    for(let k=0;k<5;k++){
      const a=k*Math.PI*2/5+.15;
      const spoke=(radius:number,angle:number,depth=0):P=>[outer+side*depth,Math.cos(a+angle)*radius,Math.sin(a+angle)*radius];
      // The reference wheel has five curved aluminium petals over a split graphite skeleton.
      for(const offset of [-.04,.17]){panel(wheel,[spoke(.052,offset,-.002),spoke(rim-.014,offset+.06,-.004),spoke(rim-.014,offset+.19,.001),spoke(.061,offset+.23,.006)],m.graphite);}
      for(const off of [-.04,.36])line(wheel,[spoke(.075,off,.010),spoke(rim-.018,off+.07,.003)],.0015,m.titanium,false);
      patch(wheel,(u,v)=>{const rr=.081+u*(rim-.097),aa=.37+u*.03+v*(.63+.08*u);return spoke(rr,aa,.008+Math.sin(u*Math.PI)*.007+v*.004);},m.alloy,28,12);
      line(wheel,Array.from({length:25},(_,j)=>{const u=j/24;return spoke(.081+u*(rim-.097),.37+u*.03,.009+Math.sin(u*Math.PI)*.007);}),.0011,m.machined);
      cylinder(wheel,.006,.011,spoke(.042,.1,.013),m.machined,'x',8);
    }
    cylinder(wheel,.064,.015,[outer,0,0],m.graphite);cylinder(wheel,.030,.016,[outer+side*.009,0,0],m.alloy);
    // Small embossed T on the centre cap.
    line(wheel,[[outer+side*.019,.015,-.014],[outer+side*.020,.017,0],[outer+side*.019,.015,.014]],.0016,m.graphite);
    line(wheel,[[outer+side*.020,.011,0],[outer+side*.020,-.014,0]],.002,m.graphite);
    for(const offset of [-.063,-.025,.025,.063])torus(wheel,r-.0006,.0015,m.seam,[offset,0,0]);
    // Short angled tread channels at the shoulders.
    for(let i=0;i<76;i++)for(const s of [-1,1]){const a=i*Math.PI*2/76;line(wheel,[[s*half*.48,Math.cos(a)*r,Math.sin(a)*r],[s*half*.82,Math.cos(a+.028)*(r-.009),Math.sin(a+.028)*(r-.009)]],.0011,m.seam,false);}
    const fixed=new T.Group();pivot.add(fixed);staticGroups.push(fixed);
    const cal=box(fixed,[.055,.133,.075],[side*(half-.061),.075,.185],caliper,.018);cal.rotation.x=-.32;
    for(let i=0;i<3;i++)box(fixed,[.057,.003,.038],[side*(half-.061),.045+i*.025,.221],m.graphite,.001);
  }
  return {wheels,steering,staticGroups};
}
