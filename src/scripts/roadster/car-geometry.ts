import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export type P = [number, number, number];
export const V = (p: P) => new T.Vector3(...p);
export const mix = T.MathUtils.lerp;
export const clamp = T.MathUtils.clamp;

export function box(parent: T.Object3D, size: P, position: P, material: T.Material, bevel = 0) {
  const mesh = new T.Mesh(bevel ? new RoundedBoxGeometry(...size, 3, bevel) : new T.BoxGeometry(...size), material);
  mesh.position.set(...position); parent.add(mesh); return mesh;
}

export function panel(parent: T.Object3D, points: P[], material: T.Material) {
  const vertices: number[] = [];
  for (let i = 1; i < points.length - 1; i++) vertices.push(...points[0], ...points[i], ...points[i + 1]);
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  const mesh = new T.Mesh(geometry, material); parent.add(mesh); return mesh;
}

export function patch(parent: T.Object3D, fn: (u: number, v: number) => P, material: T.Material, nu = 48, nv = 20) {
  const positions: number[] = [], uv: number[] = [], indices: number[] = [];
  for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) {
    positions.push(...fn(i / nu, j / nv)); uv.push(i / nu, j / nv);
  }
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const a = i * (nv + 1) + j;
    indices.push(a, a + 1, a + nv + 1, a + 1, a + nv + 2, a + nv + 1);
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  const mesh = new T.Mesh(geometry, material); parent.add(mesh); return mesh;
}

export function curve(points: P[], tension = .5) {
  return new T.CatmullRomCurve3(points.map(V), false, 'catmullrom', tension);
}
export function line(parent: T.Object3D, points: P[], radius: number, material: T.Material, smooth = true) {
  const path = smooth ? curve(points) : new T.CurvePath<T.Vector3>();
  if (!smooth) for (let i = 1; i < points.length; i++) (path as T.CurvePath<T.Vector3>).add(new T.LineCurve3(V(points[i - 1]), V(points[i])));
  const mesh = new T.Mesh(new T.TubeGeometry(path, Math.max(24, points.length * 12), radius, 6, false), material);
  parent.add(mesh); return mesh;
}
export function points(fn: (t: number) => P, steps = 60): P[] {
  return Array.from({ length: steps + 1 }, (_, i) => fn(i / steps));
}
export function loft(parent: T.Object3D, a: P[], b: P[], material: T.Material, nu = 64, nv = 12) {
  const ca = curve(a), cb = curve(b);
  return patch(parent, (u, v) => ca.getPoint(u).lerp(cb.getPoint(u), v).toArray() as P, material, nu, nv);
}
export function lathe(parent: T.Object3D, profile: [number, number][], material: T.Material, segments = 72) {
  const mesh = new T.Mesh(new T.LatheGeometry(profile.map(p => new T.Vector2(...p)), segments), material);
  parent.add(mesh); return mesh;
}
export function torus(parent: T.Object3D, r: number, tube: number, material: T.Material, position: P, axis: 'x' | 'y' | 'z' = 'x') {
  const mesh = new T.Mesh(new T.TorusGeometry(r, tube, 8, 96), material);
  if (axis === 'x') mesh.rotation.y = Math.PI / 2;
  if (axis === 'y') mesh.rotation.x = Math.PI / 2;
  mesh.position.set(...position); parent.add(mesh); return mesh;
}
export function cylinder(parent: T.Object3D, r: number, depth: number, position: P, material: T.Material, axis: 'x' | 'y' | 'z' = 'x', segments = 64) {
  const mesh = new T.Mesh(new T.CylinderGeometry(r, r, depth, segments), material);
  if (axis === 'x') mesh.rotation.z = Math.PI / 2;
  if (axis === 'z') mesh.rotation.x = Math.PI / 2;
  mesh.position.set(...position); parent.add(mesh); return mesh;
}
export function sample(z: number, rows: number[][], column = 1) {
  let i = 0; while (i < rows.length - 2 && z > rows[i + 1][0]) i++;
  const a = rows[i], b = rows[i + 1], previous = rows[Math.max(0, i - 1)], next = rows[Math.min(rows.length - 1, i + 2)];
  const t = clamp((z - a[0]) / (b[0] - a[0]), 0, 1), span = b[0] - a[0];
  const ma = (b[column] - previous[column]) / (b[0] - previous[0]) * span;
  const mb = (next[column] - a[column]) / (next[0] - a[0]) * span;
  return (2 * t ** 3 - 3 * t ** 2 + 1) * a[column] + (t ** 3 - 2 * t ** 2 + t) * ma + (-2 * t ** 3 + 3 * t ** 2) * b[column] + (t ** 3 - t ** 2) * mb;
}

// Longitudinal landmarks measured as ratios from the official side photograph.
// Columns: z, maximum body half-width, shoulder height, centre deck height.
export const BODY = [
  [-2.065, .648, .462, .462], [-1.99, .741, .502, .485],
  [-1.90, .839, .555, .513], [-1.78, .905, .628, .550],
  [-1.67, .928, .695, .585], [-1.32, .937, .761, .693],
  [-1.10, .926, .742, .752], [-.78, .914, .663, .767],
  [-.20, .899, .709, .777], [.50, .914, .771, .811],
  [1.05, .939, .821, .826], [1.405, .943, .844, .829],
  [1.78, .919, .827, .817], [2.065, .885, .812, .803],
];
export const width = (z: number) => sample(z, BODY, 1);
export const shoulder = (z: number) => sample(z, BODY, 2);
export const deck = (z: number) => sample(z, BODY, 3);
export const wheelStations = [{ z: -1.32, y: .337, radius: .337, width: .246, x: .805 }, { z: 1.405, y: .350, radius: .350, width: .280, x: .803 }];
export function sill(z: number) { return .185 + .026 * clamp((z + .8) / 2.2, 0, 1) + .05*(1-T.MathUtils.smoothstep(z,-2.065,-1.65)); }
export function lowerEdge(z: number) {
  let y = sill(z);
  for (const w of wheelStations) {
    const radius = w.radius + .025, d = Math.abs(z - w.z);
    if (d < radius) y = Math.max(y, w.y + Math.sqrt(radius ** 2 - d ** 2));
  }
  return y;
}
export function sideX(z: number, y: number) {
  const v = clamp((shoulder(z) - y) / (shoulder(z) - sill(z)), 0, 1);
  const taper=T.MathUtils.smoothstep(z,-2.065,-1.72);
  return width(z) + .039*v*(1-taper) - .067*v*taper + .018*Math.sin(v*Math.PI)*taper;
}
// Head-on photography constrains the crown to about two thirds of the cowl
// width. The side photograph alone cannot establish this transverse lean.
export const CANOPY = [
  [-1.20, .746, .756], [-.96, .823, .700], [-.65, .934, .625],
  [-.37, 1.034, .553], [-.10, 1.108, .505], [.16, 1.122, .500],
  [.48, 1.111, .504], [.76, 1.078, .489], [1.04, 1.012, .468],
  [1.30, .926, .445], [1.48, .866, .426], [1.60, .836, .415],
];
export const CANOPY_FRONT = -1.20;
export const CANOPY_REAR = 1.60;
// A broad, nearly straight windscreen base with short diagonal corner returns.
// Round only the transition into each return, rather than bowing the full edge.
export function cowlCorner(f:number) {
  const a=Math.min(1,Math.abs(f)),start=.61,round=.08,t=a-start;
  const ramp=t<=0?0:t<round?t*t/(2*round):t-round/2;
  return ramp/(1-start-round/2);
}
export const cowlSweep=(f:number)=>.10*(1-cowlCorner(f));
export function roof(z: number, f: number): P {
  const front=clamp((z-CANOPY_FRONT)/1.10,0,1),rear=T.MathUtils.smoothstep(z,.65,1.48);
  const sweep=cowlSweep(f)*(1-T.MathUtils.smoothstep(z,CANOPY_FRONT,-.50));
  const corner=mix(cowlCorner(f),f**2,T.MathUtils.smoothstep(z,CANOPY_FRONT,-.55));
  return [sample(z, CANOPY, 2) * f, sample(z, CANOPY, 1) + .055*(1-front)*corner-.018*front*(1-rear)*f**2+.030*rear*f**2, z+sweep];
}

// The backlight is a tapered inset between painted buttresses. Its width is
// independent of the roof/quarter envelope: the former widening glass footprint
// erased the characteristic rear shoulders visible in Tesla's overhead photos.
export function backlightHalfWidth(z: number) {
  if(z<=.48)return sample(z,CANOPY,2);
  return sample(z, [[.48,.504],[.72,.491],[.94,.467],[1.13,.407],[1.38,.329],[1.60,.270]]);
}
export function upperBody(z: number, x: number): P {
  const edge=roof(z,1),f=Math.abs(x)/edge[0];
  if(f<=1)return roof(z,x/edge[0]);
  let low=shoulder(z),high=edge[1];
  for(let i=0;i<24;i++){const mid=(low+high)/2;if(skinX(z,mid)>Math.abs(x))low=mid;else high=mid;}
  return [x,(low+high)/2,z];
}
export function sail(z: number, v: number, side: number, offset = 0): P {
  const upper = roof(z, 1), y = mix(upper[1], shoulder(z), v);
  return [side * (skinX(z,y) + offset), y + offset * .4, z];
}

// Glass has its own almost ruled transverse surface. Tying its rake to the
// undulating fender shoulder twisted the pane and scalloped its lower edge.
// The painted door shoulder meets the pane at the same lower rail.
export function skinX(z:number,y:number) {
  if(y<=shoulder(z))return sideX(z,y);
  const top=roof(z,1),v=clamp((top[1]-y)/Math.max(.001,top[1]-shoulder(z)),0,1);
  const original=mix(top[0],width(z),v)+.007*Math.sin(v*Math.PI);
  const blend=T.MathUtils.smoothstep(z,CANOPY_FRONT,-.92)*(1-T.MathUtils.smoothstep(z,SIDE_GLASS_END,1.38));
  if(blend===0)return original;
  const base=clamp(sideGlassBase(z),shoulder(z)+.001,top[1]-.001);
  const lean=1.10+.10*T.MathUtils.smoothstep(z,.35,1.08);
  const pane=(height:number)=>top[0]+lean*(top[1]-height)+.002*Math.sin(clamp((top[1]-height)/(top[1]-base),0,1)*Math.PI);
  const x=y>=base?pane(y):mix(pane(base),width(z),(base-y)/(base-shoulder(z)));
  return mix(original,x,blend);
}
export function sideGlassBase(z:number) {
  // One shallow forward dip, a long rising rail, then a short diagonal return.
  // Extra rear control points previously bent the return into an S-curve.
  return sample(z,[[-1.17,.795],[-.94,.778],[-.65,.769],[-.25,.783],[.15,.8264],[.52,.8666],[.80,.897],[.96,.956],[1.065,roof(1.065,1)[1]-.020]]);
}

export const SIDE_GLASS_START=-1.17, SIDE_GLASS_END=1.065;
export function sideGlassBounds(z:number):[number,number] {
  const top=roof(z,1)[1]-(.010+.010*T.MathUtils.smoothstep(z,-.90,-.10));
  const base=Math.min(top-.002,sideGlassBase(z));
  // The forward return is soft; the quarter-light ends at its upper rail with
  // a short angled lower return and only an 8 mm corner radius.
  const cap=z<SIDE_GLASS_START+.035
    ? Math.sqrt(Math.max(0,1-((z-SIDE_GLASS_START-.035)/.035)**2))
    : z>SIDE_GLASS_END-.008
      ? Math.sqrt(Math.max(0,1-((z-SIDE_GLASS_END+.008)/.008)**2)):1;
  const middle=(top+base)/2,half=(top-base)*cap/2;
  return [middle+half,middle-half];
}

// Shared rear boundaries: the painted central chin drops below the outer
// shoulders, while the carbon corners tuck upward around a compact fan tray.
// Keeping the side returns on these same rails prevents cracks at the bumper.
export function rearPaintBottom(f:number) {
  const a=Math.abs(f);
  return .605+.095*T.MathUtils.smoothstep(a,.35,.68)-.012*T.MathUtils.smoothstep(a,.90,1);
}
export function rearFascia(u:number,v:number):P {
  const f=u*2-1;
  return [f*(.879-.011*v),mix(.773,rearPaintBottom(f),v),2.062+.015*(1-f*f)-.026*v*v];
}
export function rearValance(u:number,v:number):P {
  const f=u*2-1,a=Math.abs(f);
  const bottom=.350+.060*T.MathUtils.smoothstep(a,.68,1);
  return [f*mix(.868,.825,v),mix(rearPaintBottom(f),bottom,v),mix(2.036,1.987,v)+.015*(1-f*f)];
}
export function rearCorner(u:number,v:number,side:number):P {
  const topZ=mix(1.765,2.065,u),topY=mix(.452,rearPaintBottom(1),u);
  const bottom:P=[mix(.875,.825,u),mix(.235,.410,u),mix(1.765,1.987,u)];
  return [side*mix(sideX(topZ,topY),bottom[0],v),mix(topY,bottom[1],v),mix(topZ,bottom[2],v)];
}
