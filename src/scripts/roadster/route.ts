import * as T from 'three';

// A driving-scale interpretation of the Miami / Miami Beach bay loop. Turns use
// eased curvature (252 m transitions), so straight-to-corner joins have no yaw snap.
export const ROAD_HALF_WIDTH = 18;
export const SHOULDER_EDGE = 13.5;
export const ROUTE_STEP = 4;
export const TURN_LENGTH = 1400;
const TURN_EASE = .18;
const turnCurvature = (u:number) => {
  const ramp = (t:number) => .5 - .5 * Math.cos(Math.PI * t);
  return Math.PI / (2 * TURN_LENGTH * (1 - TURN_EASE)) *
    (u < TURN_EASE ? ramp(u / TURN_EASE) : u > 1 - TURN_EASE ? ramp((1-u) / TURN_EASE) : 1);
};
export const ROUTE_SECTIONS = [
  {length:800,turn:false,name:'Miami Beach'},
  {length:1400,turn:true,name:'Belle Isle'},
  {length:3200,turn:false,name:'Venetian Causeway'},
  {length:1400,turn:true,name:'Biscayne Boulevard'},
  {length:1600,turn:false,name:'Downtown Miami'},
  {length:1400,turn:true,name:'Watson Island'},
  {length:3200,turn:false,name:'MacArthur Causeway'},
  {length:1400,turn:true,name:'South Beach'},
  {length:800,turn:false,name:'Miami Beach'},
];

export function createRoute() {
  const points:T.Vector3[]=[], headings:number[]=[], curvatures:number[]=[];
  let x=2200,z=0,heading=0;
  for(const section of ROUTE_SECTIONS) {
    for(let s=0;s<section.length;s+=ROUTE_STEP) {
      const curvature=section.turn?turnCurvature((s+ROUTE_STEP/2)/section.length):0;
      points.push(new T.Vector3(x,0,z));headings.push(heading);curvatures.push(curvature);
      const mid=heading+curvature*ROUTE_STEP/2;
      x-=Math.sin(mid)*ROUTE_STEP;z-=Math.cos(mid)*ROUTE_STEP;
      heading+=curvature*ROUTE_STEP;
    }
  }
  const length=points.length*ROUTE_STEP;
  const wrap=(t:number)=>((t%1)+1)%1;
  class BayCircuit extends T.Curve<T.Vector3> {
    constructor(){super();}
    getPoint(t:number,target=new T.Vector3()) {
      const f=wrap(t)*points.length,i=Math.floor(f);
      return target.copy(points[i]).lerp(points[(i+1)%points.length],f-i);
    }
    getPointAt(t:number,target=new T.Vector3()){return this.getPoint(t,target);}
    getTangent(t:number,target=new T.Vector3()) {
      const f=wrap(t)*points.length,i=Math.floor(f),a=headings[i];
      let b=headings[(i+1)%points.length];if(b<a)b+=Math.PI*2;
      const h=T.MathUtils.lerp(a,b,f-i);return target.set(-Math.sin(h),0,-Math.cos(h));
    }
    getTangentAt(t:number,target=new T.Vector3()){return this.getTangent(t,target);}
    getLength(){return length;}
  }
  const route=new BayCircuit();
  const grid=new Map<string,number[]>(),cell=128;
  points.forEach((p,i)=>{const key=`${Math.floor(p.x/cell)},${Math.floor(p.z/cell)}`;const list=grid.get(key)||[];list.push(i);grid.set(key,list);});
  const nearest=(px:number,pz:number)=>{
    let best=Infinity,index=0,fraction=0;
    const cx=Math.floor(px/cell),cz=Math.floor(pz/cell),candidates:number[]=[];
    for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)candidates.push(...(grid.get(`${cx+dx},${cz+dz}`)||[]));
    // A rocket flight or recovery can leave the road's spatial grid.
    for(const i of candidates.length?candidates:points.keys()) {
      const a=points[i],b=points[(i+1)%points.length],dx=b.x-a.x,dz=b.z-a.z;
      const f=T.MathUtils.clamp(((px-a.x)*dx+(pz-a.z)*dz)/(dx*dx+dz*dz),0,1);
      const d=(px-a.x-dx*f)**2+(pz-a.z-dz*f)**2;
      if(d<best){best=d;index=i;fraction=f;}
    }
    const progress=(index+fraction)/points.length,point=route.getPointAt(progress),tangent=route.getTangentAt(progress);
    return {index,point,tangent,distance:Math.sqrt(best),side:(px-point.x)*(-tangent.z)+(pz-point.z)*tangent.x,progress};
  };
  const district=(progress:number)=>{
    let distance=wrap(progress)*length;
    for(const section of ROUTE_SECTIONS){if(distance<section.length)return section.name;distance-=section.length;}
    return ROUTE_SECTIONS[0].name;
  };
  return {route,samples:points,tangents:headings.map(h=>new T.Vector3(-Math.sin(h),0,-Math.cos(h))),length,nearest,district,curvatures};
}
