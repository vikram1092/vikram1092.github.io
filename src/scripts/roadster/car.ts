import * as T from 'three';
import { createBody } from './car-body';
import { createMaterials, finishes } from './car-materials';
import { createWheels } from './car-wheels';
import { createRear } from './car-rear';
import { box, cylinder, lathe, line, patch } from './car-geometry';
export { box,panel } from './car-geometry';
export { finishes } from './car-materials';

export function createCar(){
  const root=new T.Group();root.name='Roadster — section-based photographic reconstruction';
  const body=new T.Group();root.add(body);const m=createMaterials();
  const sections=createBody(body,m),wheelAssembly=createWheels(body,m),rear=createRear(body,m);
  const interior=new T.Group();interior.name='08 Cockpit and pressure vessel';body.add(interior);
  const upholstery=new T.MeshStandardMaterial({color:0xbfc3c7,roughness:.82});
  box(interior,[1.28,.035,1.9],[0,.27,.13],m.black,.03);
  box(interior,[1.40,.10,.24],[0,.735,-.76],m.graphite,.025);
  // Single sculpted driver seat, including the exposed carbon shell and separate cushion.
  patch(interior,(u,v)=>{const f=u*2-1;return [-.34+f*.208,.36+v*.49+.042*f*f,.37+v*.25-.055*f*f];},m.carbon,36,28);
  patch(interior,(u,v)=>{const f=u*2-1;return [-.34+f*.173,.38+v*.437+.032*f*f,.353+v*.25-.048*f*f];},upholstery,36,28);
  box(interior,[.34,.063,.43],[-.34,.348,.11],upholstery,.045);
  box(interior,[.19,.136,.082],[-.34,.838,.603],upholstery,.031);
  const yoke=new T.Group();yoke.position.set(-.34,.704,-.57);yoke.rotation.x=-.32;interior.add(yoke);
  line(yoke,[[-.13,-.02,0],[-.13,.043,0],[-.09,.056,0],[-.055,.013,0],[.055,.013,0],[.09,.056,0],[.13,.043,0],[.13,-.02,0],[.10,-.046,0],[-.10,-.046,0],[-.13,-.02,0]],.012,m.black);
  box(yoke,[.085,.045,.030],[0,.003,0],m.graphite,.008);
  const display=box(interior,[.21,.10,.012],[.05,.727,-.64],m.black,.005);display.rotation.x=-.35;
  // Rocket trim's carbon pressure vessel occupies the passenger side.
  const tank=lathe(interior,[[0,-.50],[.09,-.48],[.16,-.40],[.18,-.30],[.18,.30],[.16,.40],[.09,.48],[0,.50]],m.carbon,64);tank.rotation.x=Math.PI/2;tank.position.set(.34,.50,.05);
  for(const z of [-.28,.38]){const belt=box(interior,[.37,.025,.045],[.34,.67,z],m.graphite,.008);belt.rotation.z=.02;}
  cylinder(interior,.037,.06,[.34,.50,-.47],m.titanium,'z');
  const staticGroups=[...Object.values(sections),...wheelAssembly.staticGroups,...rear.staticGroups,interior,yoke];
  root.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=o.material!==m.glass;o.receiveShadow=o.material!==m.glass;}});
  function setFinish(index:number){const f=finishes[index];m.paint.color.set(f.color);m.paint.iridescence=f.iridescence;m.paint.metalness=f.metalness;m.paint.roughness=f.roughness;m.paint.envMapIntensity=index===1?.8:1.4;m.paint.clearcoat=index===1?.75:1;m.paint.clearcoatRoughness=index===1?.23:.17;}
  return {root,body,paint:m.paint,glass:m.glass,wheels:wheelAssembly.wheels,steering:wheelAssembly.steering,wing:rear.wing,wingStruts:rear.wingStruts,tailSpill:rear.tailSpill,wingRestHeight:rear.wingRestHeight,jets:rear.jets,red:m.red,staticGroups,setFinish};
}
