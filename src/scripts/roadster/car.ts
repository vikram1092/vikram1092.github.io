import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const finishes = [
  { name: 'Iridescent violet', color: '#7734b7', iridescence: 1, metalness: .78, roughness: .21 },
  { name: 'Arctic pearl', color: '#d9e3eb', iridescence: .2, metalness: .55, roughness: .24 },
  { name: 'Liquid silver', color: '#8999ac', iridescence: .12, metalness: .95, roughness: .18 },
  { name: 'Crimson', color: '#a90e36', iridescence: .25, metalness: .68, roughness: .2 },
  { name: 'Ion blue', color: '#146cac', iridescence: .8, metalness: .75, roughness: .2 },
  { name: 'Obsidian', color: '#141921', iridescence: .25, metalness: .7, roughness: .21 },
];
type V = [number, number, number];
const vec = (p: V) => new T.Vector3(...p);
export function box(parent: T.Object3D, size: V, position: V, material: T.Material, bevel = 0) {
  const m = new T.Mesh(bevel ? new RoundedBoxGeometry(...size, 2, bevel) : new T.BoxGeometry(...size), material);
  m.position.set(...position); parent.add(m); return m;
}
export function panel(parent: T.Object3D, points: V[], material: T.Material) {
  const vertices: number[] = [];
  for (let i = 1; i < points.length - 1; i++) vertices.push(...points[0], ...points[i], ...points[i+1]);
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(vertices, 3)); g.computeVertexNormals();
  const m = new T.Mesh(g, material); parent.add(m); return m;
}
function pipe(parent: T.Object3D, points: V[], radius: number, material: T.Material, smooth = false) {
  const curve = smooth ? new T.CatmullRomCurve3(points.map(vec)) : new T.CurvePath<T.Vector3>();
  if (!smooth) for (let i=1;i<points.length;i++) (curve as T.CurvePath<T.Vector3>).add(new T.LineCurve3(vec(points[i-1]),vec(points[i])));
  const mesh = new T.Mesh(new T.TubeGeometry(curve, Math.max(12,points.length*6),radius,6,false),material); parent.add(mesh); return mesh;
}
function surface(parent: T.Object3D, fn: (u: number, v: number) => V, nu: number, nv: number, material: T.Material) {
  const p: number[] = [], indices: number[]=[];
  for(let i=0;i<=nu;i++) for(let j=0;j<=nv;j++) p.push(...fn(i/nu,j/nv));
  for(let i=0;i<nu;i++) for(let j=0;j<nv;j++){const a=i*(nv+1)+j;indices.push(a,a+1,a+nv+1,a+1,a+nv+2,a+nv+1);}
  const g = new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(indices);g.computeVertexNormals();
  const mesh=new T.Mesh(g,material);parent.add(mesh);return mesh;
}
const interp = (z: number, values: number[][], column: number) => {
  let i = 0; while(i<values.length-2 && z>values[i+1][0])i++;
  const t=T.MathUtils.clamp((z-values[i][0])/(values[i+1][0]-values[i][0]),0,1);
  const previous=values[Math.max(0,i-1)], next=values[Math.min(values.length-1,i+2)];
  const a=values[i][column], b=values[i+1][column], span=values[i+1][0]-values[i][0];
  const ma=(b-previous[column])/(values[i+1][0]-previous[0])*span;
  const mb=(next[column]-a)/(next[0]-values[i][0])*span;
  return (2*t*t*t-3*t*t+1)*a+(t*t*t-2*t*t+t)*ma+(-2*t*t*t+3*t*t)*b+(t*t*t-t*t)*mb;
};

export function createCar() {
  const root = new T.Group(); root.name='2026 Roadster reference reconstruction';
  const body = new T.Group(); root.add(body);
  const paint = new T.MeshPhysicalMaterial({color:finishes[0].color,metalness:.78,roughness:.21,clearcoat:1,clearcoatRoughness:.085,iridescence:1,iridescenceIOR:1.32,iridescenceThicknessRange:[240,380],envMapIntensity:.9,side:T.DoubleSide});
  const black = new T.MeshStandardMaterial({color:0x080a10,metalness:.55,roughness:.3,side:T.DoubleSide});
  const rubber = new T.MeshStandardMaterial({color:0x090a0d,roughness:.82});
  const metal = new T.MeshStandardMaterial({color:0x7f8995,metalness:.94,roughness:.24,side:T.DoubleSide});
  const polished = new T.MeshStandardMaterial({color:0x535c68,metalness:1,roughness:.16,side:T.DoubleSide});
  const glass = new T.MeshPhysicalMaterial({color:0x101822,metalness:.35,roughness:.105,clearcoat:1,envMapIntensity:1.8,side:T.DoubleSide});
  const white = new T.MeshStandardMaterial({color:0xd8f2ff,emissive:0xd8f2ff,emissiveIntensity:4});
  const red = new T.MeshStandardMaterial({color:0xff1640,emissive:0xff1030,emissiveIntensity:3});
  const amber = new T.MeshStandardMaterial({color:0xffa13c,emissive:0xff7800,emissiveIntensity:1.6});
  // Cross sections preserve the new car's long shoulder crease and sharply tapered nose.
  const sections = [ [-2.08,.84,.49,.49],[-1.8,.94,.65,.61],[-1.35,.984,.79,.74],[-.75,.965,.84,.81],[0,.94,.86,.84],[.8,.97,.90,.86],[1.35,.99,.89,.85],[1.8,.94,.86,.83],[2.06,.89,.82,.80] ];
  const width=(z:number)=>interp(z,sections,1), shoulder=(z:number)=>interp(z,sections,2), deck=(z:number)=>interp(z,sections,3);
  surface(body,(u,v)=>{const z=-2.08+u*4.14,x=(v*2-1)*width(z);const f=Math.abs(v*2-1);return [x,T.MathUtils.lerp(deck(z),shoulder(z),Math.pow(f,3)),z];},120,28,paint);
  for(const side of [-1,1]) {
    surface(body,(u,v)=>{const z=-2.08+u*4.14;let low=.20;for(const wz of [-1.28,1.3]) {const d=Math.abs(z-wz);if(d<.371)low=Math.max(low,.347+Math.sqrt(.371*.371-d*d));}const h=T.MathUtils.lerp(shoulder(z),low,v);return [side*(width(z)-.065*v+.018*Math.sin(v*Math.PI)),h,z];},240,5,paint);
    for(const wz of [-1.28,1.3]) {
      const arc: V[]=[];
      for(let j=0;j<=42;j++){const a=j/42*Math.PI;arc.push([side*(width(wz)+.002),.347+Math.sin(a)*.371,wz+Math.cos(a)*.371]);}
      pipe(body,arc,.009,black);
    }
    box(body,[.055,.085,1.82],[side*.921,.19,.01],black,.018);
    pipe(body,[[side*.925,.225,-.88],[side*.93,.22,.65],[side*.975,.27,.93]],.008,polished);
    // Butterfly-door shut lines, flush handle, camera repeater and intake.
    pipe(body,[[side*.963,.828,-.72],[side*.949,.64,-.59],[side*.926,.25,-.48],[side*.936,.25,.55],[side*.958,.86,.76]],.004,black);
    box(body,[.014,.025,.12],[side*.958,.849,.63],polished,.005);
    panel(body,[[side*.982,.69,-.90],[side*.972,.72,-.61],[side*.97,.665,-.61],[side*.977,.646,-.83]],black);
    box(body,[.012,.014,.075],[side*.986,.691,-.83],amber,.004);
    const lens=new T.Mesh(new T.SphereGeometry(.019,12,8),glass);lens.position.set(side*.98,.684,-.67);body.add(lens);
  }
  // Shallow sculpted hood, triangular lamp apertures and full-width daytime light.
  for(const side of [-1,1]) {
    pipe(body,[[side*.63,.496,-2.08],[side*.69,.65,-1.70],[side*.70,.812,-.77]],.0035,black);
    panel(body,[[side*.64,.51,-2.055],[side*.86,.649,-1.79],[side*.75,.658,-1.73]],glass);
    pipe(body,[[side*.716,.614,-1.865],[side*.852,.66,-1.783]],.008,white);
    for(let j=0;j<4;j++) {const m=box(body,[.018,.009,.024],[side*(.75+j*.022),.628+j*.008,-1.842+j*.014],white,.003);m.rotation.y=side*.5;}
  }
  box(body,[1.65,.105,.025],[0,.425,-2.078],glass,.018);
  pipe(body,[[-.833,.494,-2.09],[0,.49,-2.101],[.833,.494,-2.09]],.008,white);
  panel(body,[[-.83,.36,-2.08],[.83,.36,-2.08],[.79,.16,-2.10],[-.79,.16,-2.10]],black);
  for(let i=-6;i<=6;i++)box(body,[.015,.12,.1],[i*.11,.25,-2.07],black);
  const splitter=box(body,[1.83,.045,.31],[0,.145,-1.97],black,.022);
  splitter.rotation.x=-.035;
  // Continuous curved windscreen and roof; separate side glazing and slender painted pillars.
  const canopy=[[-.79,.813,.713],[-.58,.93,.694],[-.25,1.10,.663],[.10,1.205,.632],[.44,1.232,.631],[.78,1.193,.65],[1.12,1.055,.69],[1.48,.866,.75]];
  surface(body,(u,v)=>{const z=-.79+u*2.27;const f=v*2-1;return [f*interp(z,canopy,2),interp(z,canopy,1)-.027*f*f,z];},80,32,glass);
  for(const side of [-1,1]) {
    const pts:V[]=[ [side*.714,.804,-.78],[side*.64,1.183,.11],[side*.65,1.171,.77],[side*.80,.903,1.27],[side*.91,.866,.79] ];
    panel(body,pts,glass);
    pipe(body,[[side*.714,.815,-.79],[side*.68,1.02,-.42],[side*.64,1.2,.1],[side*.647,1.184,.78],[side*.77,.952,1.26],[side*.86,.887,1.46]],.016,paint,true);
    pipe(body,[[side*.716,.81,-.78],[side*.77,.824,-.35],[side*.86,.854,.32],[side*.916,.868,.78],[side*.80,.905,1.27]],.009,paint);
    pipe(body,[[side*.757,.831,-.35],[side*.655,1.157,-.06]],.006,black);
    pipe(body,[[side*.913,.87,.77],[side*.65,1.181,.72]],.005,black);
  }
  pipe(body,[[-.702,.82,-.77],[0,.84,-.76],[.702,.82,-.77]],.007,black);
  pipe(body,[[-.6,1.207,.2],[0,1.234,.2],[.6,1.207,.2]],.003,black);
  // Rear deck and active wing, continuous red lamp, diffuser and four machined cold-gas nozzles.
  const wing=new T.Group();wing.position.set(0,.826,1.84);body.add(wing);
  box(wing,[1.75,.035,.32],[0,0,0],paint,.015);
  for(const s of [-1,1])box(wing,[.035,.20,.10],[s*.61,-.11,0],black,.008);
  pipe(body,[[-.884,.795,2.069],[0,.795,2.084],[.884,.795,2.069]],.014,red);
  box(body,[1.78,.37,.08],[0,.53,2.04],black,.025);
  box(body,[1.76,.08,.36],[0,.21,1.96],black,.02);
  for(let i=-4;i<=4;i++)box(body,[.016,.18,.38],[i*.19,.23,1.97],black);
  for(let i=0;i<19;i++)box(body,[1.43,.008,.011],[0,.49+i*.009,2.09],polished);
  const plateCanvas=document.createElement('canvas');plateCanvas.width=512;plateCanvas.height=128;
  const pc=plateCanvas.getContext('2d')!;pc.fillStyle='#0b1017';pc.fillRect(0,0,512,128);pc.strokeStyle='#6d7987';pc.lineWidth=4;pc.strokeRect(4,4,504,120);pc.fillStyle='#d9e4ed';pc.font='54px sans-serif';pc.textAlign='center';pc.fillText('R D S T R',256,84);
  const plateTexture=new T.CanvasTexture(plateCanvas);plateTexture.colorSpace=T.SRGBColorSpace;
  box(body,[.36,.095,.014],[0,.651,2.094],new T.MeshStandardMaterial({map:plateTexture,roughness:.4}));
  const jets: { group:T.Group; kind:'rear'|'lift'|'side'; cone:T.Mesh; halo:T.Mesh }[]=[];
  function nozzle(position:V, direction:V, kind:'rear'|'lift'|'side', radius:number) {
    const g=new T.Group();g.position.set(...position);g.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),vec(direction));body.add(g);
    const shell=new T.Mesh(new T.CylinderGeometry(radius,radius*.65,.13,32,1,true),metal);g.add(shell);
    const inner=new T.Mesh(new T.CylinderGeometry(radius*.78,radius*.48,.125,32,1,true),black);g.add(inner);
    const lip=new T.Mesh(new T.TorusGeometry(radius*.91,.008,8,40),polished);lip.rotation.x=Math.PI/2;lip.position.y=.067;g.add(lip);
    const cavity=new T.Mesh(new T.CircleGeometry(radius*.65,24),black);cavity.rotation.x=-Math.PI/2;cavity.position.y=-.05;g.add(cavity);
    const plumeMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,
      vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:'varying vec2 vUv;void main(){float fade=pow(vUv.y,2.)*.12;gl_FragColor=vec4(.65,.82,1.,fade);}' });
    const cone=new T.Mesh(new T.ConeGeometry(radius*2.3,1.3,20,1,true),plumeMaterial);cone.rotation.z=Math.PI;cone.position.y=.7;cone.visible=false;g.add(cone);
    const halo=new T.Mesh(new T.ConeGeometry(radius*.7,.7,16,1,true),new T.MeshBasicMaterial({color:0xe2f9ff,transparent:true,opacity:.12,depthWrite:false,blending:T.AdditiveBlending}));halo.rotation.z=Math.PI;halo.position.y=.36;halo.visible=false;g.add(halo);
    jets.push({group:g,kind,cone,halo});
  }
  for(const x of [-.66,-.23,.23,.66])nozzle([x,.365,2.13],[0,0,1],'rear',.069);
  for(const x of [-.70,.70])for(const z of [-1.18,1.21])nozzle([x,.15,z],[0,-1,0],'lift',.055);
  for(const s of [-1,1])nozzle([s*.952,.4,.65],[s,0,0],'side',.044);
  // Four independent wheels: rounded tire shoulders, polished rim lips, aero spokes,
  // cross-drilled rotors, five lug bolts and stationary crimson brake calipers.
  const wheels:T.Group[]=[],steering:T.Group[]=[];
  for(const side of [-1,1])for(const z of [-1.28,1.3]) {
    const pivot=new T.Group();pivot.position.set(side*.883,.343,z);body.add(pivot);if(z<0)steering.push(pivot);
    const wheel=new T.Group();pivot.add(wheel);wheels.push(wheel);
    const profile=[new T.Vector2(.258,-.12),new T.Vector2(.315,-.12),new T.Vector2(.342,-.09),new T.Vector2(.349,-.06),new T.Vector2(.349,.06),new T.Vector2(.342,.09),new T.Vector2(.315,.12),new T.Vector2(.258,.12)];
    const tire=new T.Mesh(new T.LatheGeometry(profile,64),rubber);tire.rotation.z=Math.PI/2;wheel.add(tire);
    const outer=side*.126;
    const disc=new T.Mesh(new T.CylinderGeometry(.242,.242,.012,48),metal);disc.rotation.z=Math.PI/2;disc.position.x=side*.06;wheel.add(disc);
    for(const r of [.276,.291,.325]){const ring=new T.Mesh(new T.TorusGeometry(r,r>.3?.0025:.006,8,64),r>.3?rubber:polished);ring.rotation.y=Math.PI/2;ring.position.x=outer;wheel.add(ring);}
    const disk=new T.Mesh(new T.CylinderGeometry(.275,.275,.012,64),black);disk.rotation.z=Math.PI/2;disk.position.x=side*.089;wheel.add(disk);
    for(let k=0;k<5;k++) {
      const a=k*Math.PI*2/5;
      const points:V[]=[];
      for(const [r,offset] of [[.07,-.09],[.27,.09],[.27,.46],[.10,.51]])points.push([outer,Math.cos(a+offset)*r,Math.sin(a+offset)*r]);
      panel(wheel,points,polished);
      for(const off of [-.08,.12]) {
        const spoke=box(wheel,[.026,.028,.217],[outer+side*.003,0,0],black,.006);spoke.rotation.x=a+off;spoke.position.y=-Math.sin(a+off)*.164;spoke.position.z=Math.cos(a+off)*.164;
      }
      const bolt=new T.Mesh(new T.CylinderGeometry(.009,.009,.012,8),metal);bolt.rotation.z=Math.PI/2;bolt.position.set(outer+side*.014,Math.cos(a)*.039,Math.sin(a)*.039);wheel.add(bolt);
    }
    const hub=new T.Mesh(new T.CylinderGeometry(.031,.031,.018,24),polished);hub.rotation.z=Math.PI/2;hub.position.x=outer+side*.008;wheel.add(hub);
    const holes:T.BufferGeometry[]=[];
    for(let j=0;j<40;j++){const a=j/40*Math.PI*2;const h=new T.CircleGeometry(.004,5);h.rotateY(side*Math.PI/2);h.translate(side*.069,Math.cos(a)*(.19+(j%2)*.027),Math.sin(a)*(.19+(j%2)*.027));holes.push(h);}
    wheel.add(new T.Mesh(mergeGeometries(holes),black));
    box(pivot,[.05,.14,.07],[side*.075,.05,.19],new T.MeshStandardMaterial({color:0xc4284b,metalness:.4,roughness:.4}),.02);
    // Fine circumferential tread grooves remain visible at showroom distance.
    for(const offset of [-.055,0,.055]) {const tread=new T.Mesh(new T.TorusGeometry(.349,.0018,4,64),black);tread.rotation.y=Math.PI/2;tread.position.x=offset;wheel.add(tread);}
  }
  // Flat carbon undertray and suction fan hardware are visible during a kickflip.
  box(body,[1.5,.045,3.28],[0,.168,.02],black,.03);
  for(const z of [-.55,.55]) {
    const fan=new T.Mesh(new T.CylinderGeometry(.27,.27,.025,48),polished);fan.position.set(0,.133,z);body.add(fan);
    const grille=new T.Mesh(new T.TorusGeometry(.245,.008,6,48),black);grille.rotation.x=Math.PI/2;grille.position.set(0,.113,z);body.add(grille);
    for(let i=0;i<8;i++){const blade=box(body,[.4,.01,.035],[0,.112,z],black,.008);blade.rotation.y=i*Math.PI/8;}
  }
  root.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true;}});
  return {root,body,paint,wheels,steering,wing,jets,red,setFinish(index:number){Object.assign(paint,{iridescence:finishes[index].iridescence,metalness:finishes[index].metalness,roughness:finishes[index].roughness});paint.color.set(finishes[index].color);}};
}
