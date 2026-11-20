import * as T from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { box, panel, patch, line, points, loft, mix, clamp, width, shoulder, deck, sideX, sill, wheelStations, roof, skinX, sideGlassBase, sideGlassBounds, backlightHalfWidth, cowlSweep, CANOPY_FRONT, CANOPY_REAR, rearPaintBottom, rearFascia, rearValance, rearCorner, SIDE_GLASS_START, SIDE_GLASS_END, type P } from './car-geometry';
import type { Materials } from './car-materials';

// Triangulate actual apertures, then subdivide the surface before deformation.
// This keeps wheel wells and lamps open instead of painting black shapes over a shell.
function shapedSurface(parent: T.Object3D, outline: T.Vector2[], holes: T.Vector2[][], map: (x: number, y: number) => P, material: T.Material, divisions = 5) {
  const shape = new T.Shape(outline);
  for (const hole of holes) shape.holes.push(new T.Path(hole));
  const base = new T.ShapeGeometry(shape), attr = base.attributes.position, index = base.index;
  const positions: number[] = [], uvs: number[] = [];
  for (let k = 0; k < (index?.count ?? attr.count); k += 3) {
    const ids = [0, 1, 2].map(j => index ? index.getX(k + j) : k + j);
    const a = new T.Vector2(attr.getX(ids[0]), attr.getY(ids[0])), b = new T.Vector2(attr.getX(ids[1]), attr.getY(ids[1])), c = new T.Vector2(attr.getX(ids[2]), attr.getY(ids[2]));
    const emit = (i: number, j: number) => { const x = a.x + (b.x - a.x) * i / divisions + (c.x - a.x) * j / divisions, y = a.y + (b.y - a.y) * i / divisions + (c.y - a.y) * j / divisions; positions.push(...map(x, y)); uvs.push(x, y); };
    for (let i = 0; i < divisions; i++) for (let j = 0; j < divisions - i; j++) {
      emit(i, j); emit(i + 1, j); emit(i, j + 1);
      if (j < divisions - i - 1) { emit(i + 1, j); emit(i + 1, j + 1); emit(i, j + 1); }
    }
  }
  const raw = new T.BufferGeometry(); raw.setAttribute('position', new T.Float32BufferAttribute(positions, 3)); raw.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
  const geometry = mergeVertices(raw, .00001);
  // Analytic skin normals avoid highlights breaking at triangulation seams.
  const uv=geometry.attributes.uv,normals:number[]=[];
  for(let i=0;i<uv.count;i++){const x=uv.getX(i),y=uv.getY(i),e=.0001;const a=new T.Vector3(...map(x+e,y)).sub(new T.Vector3(...map(x-e,y)));const b=new T.Vector3(...map(x,y+e)).sub(new T.Vector3(...map(x,y-e)));normals.push(...a.cross(b).normalize().toArray());}
  geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));
  const mesh = new T.Mesh(geometry, material); parent.add(mesh); base.dispose(); raw.dispose(); return mesh;
}
const hoodWidth = (z: number) => mix(.642, .490, clamp((z + 2.065) / .985, 0, 1));
// Share the windscreen's straight centre and swept corner returns with the hood.
const nosePoint=(x:number,y:number,z:number):P=>[x,y,z+cowlSweep(x/roof(CANOPY_FRONT,1)[0])*T.MathUtils.smoothstep(z,-1.40,CANOPY_FRONT)];
function outwardGlass(mesh:T.Mesh,reverse:boolean) {
  if(reverse){const index=mesh.geometry.index!;for(let i=0;i<index.count;i+=3){const b=index.getX(i+1);index.setX(i+1,index.getX(i+2));index.setX(i+2,b);}mesh.geometry.computeVertexNormals();}
  mesh.castShadow=false;mesh.receiveShadow=false;
}
const fenderY = (x: number, z: number) => {
  const v = clamp((Math.abs(x) - hoodWidth(z)) / Math.max(.003,(width(z) - hoodWidth(z))), 0, 1);
  const base=mix(deck(z),shoulder(z),v)+.003*Math.sin(v*Math.PI);
  const cowlBlend=T.MathUtils.smoothstep(z,-1.40,CANOPY_FRONT);if(cowlBlend===0)return base;
  const edge=roof(CANOPY_FRONT,1),ax=Math.abs(x);
  const span=width(z)-edge[0];
  let cowlV=clamp((ax-edge[0])/Math.max(.001,span),0,1);
  for(let i=0;i<3;i++)cowlV=clamp(cowlV-(edge[0]+span*cowlV+.007*Math.sin(Math.PI*cowlV)-ax)/(span+.007*Math.PI*Math.cos(Math.PI*cowlV)),0,1);
  const cowl=ax<=edge[0]?roof(CANOPY_FRONT,ax/edge[0])[1]:mix(edge[1],shoulder(z),cowlV);
  return mix(base,cowl,cowlBlend);
};

export function createBody(body: T.Group, m: Materials) {
  const shell = new T.Group(); shell.name = '01 · continuous body surfacing'; body.add(shell);
  for (const side of [-1, 1]) {
    const outline: T.Vector2[] = [];
    for (let j = 0; j <= 100; j++) { const z = mix(-2.065, 2.065, j / 100); outline.push(new T.Vector2(z, shoulder(z))); }
    outline.push(new T.Vector2(2.065, rearPaintBottom(1)));
    outline.push(new T.Vector2(1.765, .452));
    for (const w of [...wheelStations].reverse()) {
      const radius = w.radius + .025, a0 = Math.asin((sill(w.z) - w.y) / radius);
      for (let j = 0; j <= 70; j++) { const a = mix(w.z>0?.29:a0, Math.PI - a0, j / 70); outline.push(new T.Vector2(w.z + radius * Math.cos(a), w.y + radius * Math.sin(a))); }
    }
    outline.push(new T.Vector2(-2.065, sill(-2.065)));
    shapedSurface(shell, outline, [], (z, y) => [side * sideX(z, y), y, z], m.paint, 5);
    // Thin returned wheel-arch edge, wheelhouse liners and a 3 mm painted lip.
    for (const w of wheelStations) {
      const radius = w.radius + .025, a0 = Math.asin((sill(w.z) - w.y) / radius);
      patch(shell, (u, v) => { const a = mix(w.z>0?.29:a0, Math.PI - a0, u), z = w.z + radius * Math.cos(a), y = w.y + radius * Math.sin(a); return [side * (sideX(z, y) - v * .032), y - .003 * Math.sin(a) * v, z - .003 * Math.cos(a) * v]; }, m.paint, 110, 4);
      patch(shell, (u, v) => { const a = mix(w.z>0?.29:a0, Math.PI - a0, u), z = w.z + (radius - .006) * Math.cos(a), y = w.y + (radius - .006) * Math.sin(a); return [side * mix(w.x - .13, sideX(z, y) - .028, v), y, z]; }, m.rubber, 100, 6);
      line(shell, points(t => { const a = mix(w.z>0?.29:a0, Math.PI - a0, t), z = w.z + (radius + .001) * Math.cos(a), y = w.y + (radius + .001) * Math.sin(a); return [side * (sideX(z, y) + .0004), y, z]; }), .0018, m.paint);
    }
    // A separate shaped carbon sill with the rising rear kick and folded edge.
    loft(shell, [[side * .889, .19, -.95], [side * .876, .18, -.25], [side * .888, .205, .60], [side * .931, .255, 1.00]], [[side * .88, .105, -.96], [side * .86, .105, -.25], [side * .876, .125, .61], [side * .927, .18, 1.01]], m.carbon);
    line(shell, [[side * .892, .197, -.94], [side * .880, .19, -.30], [side * .896, .215, .63], [side * .93, .26, 1.01]], .0024, m.graphite);
    // Door gaps follow the actual skin rather than floating straight segments.
    const doorStations=[[-.66,sideGlassBase(-.66)],[-.735,.667],[-.59,.205],[-.05,.20],[.28,.215],[.43,.765],[.36,sideGlassBase(.36)]];
    const door:P[]=[];for(let k=1;k<doorStations.length;k++){const a=doorStations[k-1],b=doorStations[k];for(let j=0;j<25;j++){const z=mix(a[0],b[0],j/24),y=mix(a[1],b[1],j/24);door.push([side*(skinX(z,y)+.0018),y,z]);}}
    line(shell, door, .0011, m.seam, false);
    // Flush latch, side camera and amber repeater are recessed into the front fender.
    const handle = patch(shell, (u, v) => { const z = mix(.365, .412, u), y = mix(.791, .806, v); return [side * (skinX(z, y) + .001), y, z]; }, m.graphite, 8, 4); handle.name = 'Flush butterfly-door latch';
    const vent:P[]=[[-1.0,.610],[-.735,.632],[-.735,.594],[-.96,.582]].map(([z,y])=>[side*(skinX(z,y)+.0018),y,z]);
    panel(shell,vent,m.black);
    line(shell,points(t=>{const z=mix(-.975,-.89,t),y=mix(.602,.610,t);return [side*(skinX(z,y)+.003),y,z];},12),.003,m.amber);
    const camera=new T.Mesh(new T.SphereGeometry(.009,20,12),m.lens);camera.scale.set(.28,.65,1);camera.position.set(side*(skinX(-.79,.611)+.004),.611,-.79);shell.add(camera);
    // Tucked outer bumper, rising behind the tire instead of hanging fins.
    patch(shell,(u,v)=>rearCorner(u,v,side),m.carbon,48,20);
    // Close the return from the lateral body skin onto the rear-facing fascia.
    patch(shell,(u,v)=>{
      const p=rearFascia((side+1)/2,u),q:P=[side*sideX(2.065,p[1]),p[1],2.065];
      return [mix(q[0],p[0],v),p[1],mix(q[2],p[2],v)];
    },m.paint,28,8);
    patch(shell,(u,v)=>{
      const p=rearCorner(1,u,side),q=rearValance((side+1)/2,u);
      return [mix(p[0],q[0],v),mix(p[1],q[1],v),mix(p[2],q[2],v)];
    },m.carbon,28,8);
    // Rear quarter-panel and bumper shut lines.
    line(shell, [[side * sideX(1.74, .826), .826, 1.74], [side * sideX(1.88, .66), .66, 1.88], [side * sideX(1.96, .606), .606, 1.96]], .0016, m.seam, false);
  }

  const front = new T.Group(); front.name = '02 · trapezoidal nose, recessed lamps and intake'; body.add(front);
  patch(front, (u, v) => { const z=mix(-2.065,CANOPY_FRONT,u),f=v*2-1,x=f*(hoodWidth(z)-.0015);const y=mix(deck(z)+.006*(1-f*f),roof(CANOPY_FRONT,x/roof(CANOPY_FRONT,1)[0])[1],T.MathUtils.smoothstep(z,-1.40,CANOPY_FRONT));return nosePoint(x,y,z); }, m.paint, 72, 40);
  for (const side of [-1, 1]) {
    const outline: T.Vector2[] = [];
    for (let j = 0; j <= 50; j++) { const z = mix(-2.065, CANOPY_FRONT, j / 50); outline.push(new T.Vector2(hoodWidth(z) + .0015, z)); }
    for (let j = 50; j >= 0; j--) { const z = mix(-2.065, CANOPY_FRONT, j / 50); outline.push(new T.Vector2(width(z), z)); }
    const lamp = [new T.Vector2(.651, -2.045), new T.Vector2(.624, -1.785), new T.Vector2(.791, -1.782)];
    shapedSurface(front, outline, [lamp], (x, z) => nosePoint(side*x,fenderY(x,z),z), m.paint, 6);
    panel(front, lamp.map(p => [side * p.x, fenderY(p.x, p.y) - .014, p.y]), m.headlight);
    // A shallow lamp pocket with a crisp bezel; only the upper segment illuminates.
    for (let i = 0; i < 3; i++) { const a = lamp[i], b = lamp[(i + 1) % 3]; panel(front, [[side * a.x, fenderY(a.x, a.y), a.y], [side * b.x, fenderY(b.x, b.y), b.y], [side * b.x, fenderY(b.x, b.y) - .014, b.y], [side * a.x, fenderY(a.x, a.y) - .014, a.y]], m.graphite); }
    line(front, points(t => { const x = mix(.631, .781, t), z = -1.791; return [side * x, fenderY(x, z) - .003, z]; }, 24), .0038, m.white);
    // The diffused upper optic reads as a concealed lamp, without exposed
    // oversized LED blocks drawing an extra outline around the nose.
    line(front, points(t => { const z = mix(-2.065, CANOPY_FRONT, t), x = hoodWidth(z); return nosePoint(side*x,fenderY(x,z)+.0003,z); }), .0008, m.seam);
    // Swept carbon chin follows the recessed outer nose corners.
    loft(front, [[side*.690,.235,-2.065],[side*.845,.225,-1.90],[side*.906,.19,-1.68]], [[side*.701,.130,-2.08],[side*.859,.135,-1.91],[side*.920,.14,-1.67]], m.carbon,48,10);
  }
  patch(front, (u, v) => { const f = u * 2 - 1; return [f * mix(.645, .674, v), mix(.456, .345, v) + .003 * (1 - f * f), -2.065 + .017 * v + .007 * f * f]; }, m.lens, 64, 12);
  line(front, points(t => { const x = mix(-.642, .642, t); return [x, .465 + .002 * (1 - (x / .642) ** 2), -2.070]; }), .0036, m.white);
  const mouth: P[] = [[-.671, .341, -2.045], [.671, .341, -2.045], [.700, .191, -2.064], [.36, .173, -2.081], [-.36, .173, -2.081], [-.700, .191, -2.064]];
  patch(front,(u,v)=>{const f=u*2-1;return [f*mix(.671,.700,v),mix(.341,.173+.018*Math.abs(f)**3,v),mix(-2.045,-2.081+.017*Math.abs(f)**3,v)];},m.black,72,16);
  for (let i = 0; i < mouth.length; i++) { const a = mouth[i], b = mouth[(i + 1) % mouth.length]; panel(front, [a, b, [b[0] * .95, b[1], -1.94], [a[0] * .95, a[1], -1.94]], m.carbon); }
  // Fine intake mesh and a central forward camera, kept dark like the real fascia.
  for (let i = -32; i <= 32; i++) { const slat = box(front, [.003, .103, .003], [i * .020, .270, -2.034], m.graphite); slat.rotation.z = .36; }
  box(front, [.13, .027, .016], [0, .339, -2.05], m.black, .004);
  const sensor = new T.Mesh(new T.SphereGeometry(.012, 20, 12), m.lens); sensor.scale.set(1, .55, .3); sensor.position.set(0, .337, -2.061); front.add(sensor);
  loft(front, [[-.920, .14, -1.67], [-.859, .135, -1.91], [-.74, .133, -2.07], [-.43, .152, -2.105], [0, .155, -2.11], [.43, .152, -2.105], [.74, .133, -2.07], [.859, .135, -1.91], [.920, .14, -1.67]], [[-.918, .118, -1.65], [-.858, .115, -1.90], [-.74, .110, -2.09], [-.43, .125, -2.125], [0, .127, -2.13], [.43, .125, -2.125], [.74, .110, -2.09], [.858, .115, -1.90], [.918, .118, -1.65]], m.carbon, 100, 6);
  line(front, points(t => { const f=t*2-1,z=-1.30;const x=f*hoodWidth(z),y=mix(deck(z)+.006*(1-f*f),roof(CANOPY_FRONT,x/roof(CANOPY_FRONT,1)[0])[1],T.MathUtils.smoothstep(z,-1.40,CANOPY_FRONT));return nosePoint(x,y+.0005,z); }),.0008,m.seam);

  const cabin = new T.Group(); cabin.name = '03 · continuous canopy and flush side glazing'; body.add(cabin);
  // Cut the side glass out of the body surface. Shared vertices and curvature
  // replace glass laid over paint, which caused noisy corners and dark doubled
  // outlines. The aperture has its own upper/lower rails and rounded returns.
  for (const side of [-1, 1]) {
    const aperture:T.Vector2[]=[];
    // Cosine spacing resolves the small end radii without faceted glass corners.
    const glassZ=(t:number)=>mix(SIDE_GLASS_START,SIDE_GLASS_END,(1-Math.cos(t*Math.PI))/2);
    for(let j=0;j<=160;j++){const z=glassZ(j/160);aperture.push(new T.Vector2(z,sideGlassBounds(z)[0]));}
    for(let j=159;j>0;j--){const z=glassZ(j/160);aperture.push(new T.Vector2(z,sideGlassBounds(z)[1]));}
    const surface=(z:number,y:number):P=>[side*skinX(z,y),y,z];
    // Parameterize the surrounding skin in strips with exactly the same rails.
    // A large triangulated polygon here made long triangles cut across the
    // curved A-pillar and rear quarter, leaving false dents in reflections.
    for(const edge of [0,1])patch(cabin,(u,v)=>{
      const z=glassZ(u),bounds=sideGlassBounds(z);
      return surface(z,edge===0?mix(roof(z,1)[1],bounds[0],v):mix(bounds[1],shoulder(z),v));
    },m.paint,160,20);
    for(const [start,end] of [[CANOPY_FRONT,SIDE_GLASS_START],[SIDE_GLASS_END,CANOPY_REAR]])patch(cabin,(u,v)=>{
      const z=mix(start,end,u);return surface(z,mix(roof(z,1)[1],shoulder(z),v));
    },m.paint,60,28);
    const glassPoint=(u:number,v:number):P=>{const z=glassZ(u),bounds=sideGlassBounds(z);return surface(z,mix(bounds[0],bounds[1],v));};
    const sidePane=patch(cabin,glassPoint,m.glass,160,28);
    outwardGlass(sidePane,side===1);
    const boundary=aperture.map(p=>surface(p.x,p.y));boundary.push(boundary[0]);
    line(cabin,boundary,.0009,m.seam,false);
    // Thin paired seals at the quarter-light and door divisions. They lie on the
    // glazing and do not add raised rods to the car's silhouette.
    for(const [topZ,bottomZ] of [[-.25,-.65],[.60,.35]]){
      const topY=sideGlassBounds(topZ)[0],bottomY=sideGlassBounds(bottomZ)[1];
      for(const shift of [-.007,.007])line(cabin,points(t=>{
        const z=mix(topZ,bottomZ,t)+shift*Math.sin(Math.PI*t),y=mix(topY,bottomY,t);
        return [side*(skinX(z,y)+.0007),y,z];
      },44),.00085,m.seam);
    }
  }
  const frontReturn=(f:number)=>CANOPY_FRONT+.016*T.MathUtils.smoothstep(Math.abs(f),.95,1);
  const rearReturn=(f:number)=>CANOPY_REAR-.012*T.MathUtils.smoothstep(Math.abs(f),.95,1);
  const canopyPane=patch(cabin,(u,v)=>{const f=v*2-1,z=mix(frontReturn(f),rearReturn(f),u);return roof(z,f*backlightHalfWidth(z)/roof(z,1)[0]);},m.glass,180,100);
  outwardGlass(canopyPane,true);
  // The real windscreen has a dark ceramic bond at its foot. Place it just
  // inside the transparent pane, following the same chamfered cowl boundary.
  patch(cabin,(u,v)=>{const f=v*2-1,z=frontReturn(f)+u*.038,p=roof(z,f);p[1]-=.0015;return p;},m.glassFrit,8,100);
  for(const end of [0,1])patch(cabin,(u,v)=>{
    const f=v*2-1,z=end===0?mix(CANOPY_FRONT,frontReturn(f),u):mix(rearReturn(f),CANOPY_REAR,u);
    return roof(z,f*backlightHalfWidth(z)/roof(z,1)[0]);
  },m.paint,8,80);
  // Painted rear buttresses meet the inset backlight and the side apertures.
  // No broad rectangular rear window, transverse cut-off or floating overlay.
  for(const side of [-1,1]){
    patch(cabin,(u,v)=>{const z=mix(.48,CANOPY_REAR,u),outer=roof(z,1)[0],x=mix(backlightHalfWidth(z),outer,v);return roof(z,side*x/outer);},m.paint,96,28);
    line(cabin,points(t=>{const z=mix(.48,rearReturn(side),t),p=roof(z,side*backlightHalfWidth(z)/roof(z,1)[0]);p[1]+=.0004;return p;}),.0008,m.seam);
  }
  line(cabin, points(t => { const f=mix(-1,1,t),p=roof(frontReturn(f),f);p[1]+=.0005;return p; }), .0012, m.seam);
  line(cabin, points(t => { const p = roof(-.08, mix(-1, 1, t)); p[1] += .0005; return p; }), .0007, m.seam);
  // A pair of roof door joints, matching the split butterfly-door glazing.
  for(const side of [-1,1])line(cabin,points(t=>{const z=mix(-.08,.70,t),x=side*mix(.12,.19,t),p=roof(z,x/roof(z,1)[0]);p[1]+=.0005;return p;}),.00065,m.seam);
  const wiperPoint=(x:number,z:number):P=>{const p=roof(z,x/roof(z,1)[0]);p[1]+=.003;return p;};
  line(cabin,[wiperPoint(-.46,-1.154),wiperPoint(-.1,-1.164),wiperPoint(.28,-1.168)],.003,m.black);
  line(cabin,[wiperPoint(-.43,-1.15),wiperPoint(-.28,-1.125),wiperPoint(-.11,-1.15)],.002,m.graphite);

  return { shell, front, cabin };
}
