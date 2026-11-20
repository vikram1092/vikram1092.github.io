import * as T from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { box, panel, patch, line, points, loft, mix, clamp, width, shoulder, deck, sideX, sill, wheelStations, roof, sail, type P } from './car-geometry';
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
const hoodWidth = (z: number) => mix(.645, .536, clamp((z + 2.065) / .985, 0, 1));
const fenderY = (x: number, z: number) => {
  const v = clamp((Math.abs(x) - hoodWidth(z)) / (width(z) - hoodWidth(z)), 0, 1);
  return mix(deck(z), shoulder(z), v) + .007 * Math.sin(v * Math.PI);
};

export function createBody(body: T.Group, m: Materials) {
  const shell = new T.Group(); shell.name = '01 · continuous body surfacing'; body.add(shell);
  for (const side of [-1, 1]) {
    const outline: T.Vector2[] = [];
    for (let j = 0; j <= 100; j++) { const z = mix(-2.065, 2.065, j / 100); outline.push(new T.Vector2(z, shoulder(z))); }
    outline.push(new T.Vector2(2.065, .638));
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
    const doorStations=[[-.715,.775],[-.66,.63],[-.59,.205],[-.05,.20],[.40,.215],[.565,.817]];
    const door:P[]=[];for(let k=1;k<doorStations.length;k++){const a=doorStations[k-1],b=doorStations[k];for(let j=0;j<25;j++){const z=mix(a[0],b[0],j/24),y=mix(a[1],b[1],j/24);door.push([side*(sideX(z,y)+.0018),y,z]);}}
    line(shell, door, .0018, m.seam, false);
    // Flush latch, side camera and amber repeater are recessed into the front fender.
    const handle = patch(shell, (u, v) => { const z = mix(.49, .54, u), y = mix(.810, .824, v); return [side * (sideX(z, y) + .001), y, z]; }, m.graphite, 8, 4); handle.name = 'Flush butterfly-door latch';
    const vent: P[] = [[side * .931, .670, -1.00], [side * .918, .695, -.71], [side * .913, .653, -.71], [side * .926, .632, -.96]];
    panel(shell, vent, m.black);
    line(shell, [[side * .933, .665, -.98], [side * .927, .671, -.89]], .0045, m.amber, false);
    const camera = new T.Mesh(new T.SphereGeometry(.010, 20, 12), m.lens); camera.scale.set(.28, .65, 1); camera.position.set(side * .922, .670, -.79); shell.add(camera);
    loft(shell, [[side*.915,.46,1.765],[side*.886,.545,1.91],[side*.866,.638,2.065]], [[side*.86,.185,1.765],[side*.85,.144,1.94],[side*.794,.105,2.11]], m.carbon,40,16);
    // Rear quarter-panel and bumper shut lines.
    line(shell, [[side * sideX(1.74, .826), .826, 1.74], [side * sideX(1.88, .66), .66, 1.88], [side * sideX(1.96, .50), .50, 1.96]], .0016, m.seam, false);
  }

  const front = new T.Group(); front.name = '02 · trapezoidal nose, recessed lamps and intake'; body.add(front);
  patch(front, (u, v) => { const z = mix(-2.065, -1.12, u), f = v * 2 - 1; return [f * (hoodWidth(z) - .0015), deck(z) + .006 * (1 - f * f), z]; }, m.paint, 72, 40);
  for (const side of [-1, 1]) {
    const outline: T.Vector2[] = [];
    for (let j = 0; j <= 50; j++) { const z = mix(-2.065, -1.12, j / 50); outline.push(new T.Vector2(hoodWidth(z) + .0015, z)); }
    for (let j = 50; j >= 0; j--) { const z = mix(-2.065, -1.12, j / 50); outline.push(new T.Vector2(width(z), z)); }
    const lamp = [new T.Vector2(.653, -2.022), new T.Vector2(.624, -1.785), new T.Vector2(.791, -1.782)];
    shapedSurface(front, outline, [lamp], (x, z) => [side * x, fenderY(x, z), z], m.paint, 4);
    panel(front, lamp.map(p => [side * p.x, fenderY(p.x, p.y) - .014, p.y]), m.lens);
    // A shallow lamp pocket with a crisp bezel; only the upper segment illuminates.
    for (let i = 0; i < 3; i++) { const a = lamp[i], b = lamp[(i + 1) % 3]; panel(front, [[side * a.x, fenderY(a.x, a.y), a.y], [side * b.x, fenderY(b.x, b.y), b.y], [side * b.x, fenderY(b.x, b.y) - .014, b.y], [side * a.x, fenderY(a.x, a.y) - .014, a.y]], m.graphite); }
    line(front, points(t => { const x = mix(.631, .781, t), z = -1.791; return [side * x, fenderY(x, z) - .003, z]; }, 24), .0038, m.white);
    for (let j = 0; j < 9; j++) { const x = .637 + j * .015, z = -1.803; const led = box(front, [.008, .005, .020], [side * x, fenderY(x, z) - .009, z], m.white, .001); led.rotation.x = -.25; }
    line(front, points(t => { const z = mix(-2.065, -1.12, t), x = hoodWidth(z); return [side * x, deck(z) + .0005, z]; }), .0013, m.seam);
    // Outer painted cheeks slope inward below the light bar.
    patch(front, (u, v) => { const x = mix(.647 + .037 * v, .840, u), y = mix(.462, .185, v), z = -2.065 + u * .001 + v * .002; return [side * x, y, z]; }, m.paint, 28, 16);
    loft(front, [[side * .684, .187, -2.063], [side * .84, .187, -2.063], [side * .879, .210, -1.92]], [[side * .712, .128, -2.08], [side * .851, .129, -2.075], [side * .895, .155, -1.92]], m.carbon, 40, 10);
  }
  patch(front, (u, v) => { const f = u * 2 - 1; return [f * mix(.645, .674, v), mix(.456, .345, v) + .003 * (1 - f * f), -2.065 + .017 * v + .007 * f * f]; }, m.lens, 64, 12);
  line(front, points(t => { const x = mix(-.642, .642, t); return [x, .465 + .002 * (1 - (x / .642) ** 2), -2.070]; }), .0036, m.white);
  const mouth: P[] = [[-.676, .341, -2.045], [.676, .341, -2.045], [.714, .191, -2.064], [.36, .173, -2.081], [-.36, .173, -2.081], [-.714, .191, -2.064]];
  panel(front, mouth, m.black);
  for (let i = 0; i < mouth.length; i++) { const a = mouth[i], b = mouth[(i + 1) % mouth.length]; panel(front, [a, b, [b[0] * .95, b[1], -1.94], [a[0] * .95, a[1], -1.94]], m.carbon); }
  // Fine intake mesh and a central forward camera, kept dark like the real fascia.
  for (let i = -32; i <= 32; i++) { const slat = box(front, [.003, .103, .003], [i * .020, .270, -2.034], m.graphite); slat.rotation.z = .36; }
  box(front, [.13, .027, .016], [0, .339, -2.05], m.black, .004);
  const sensor = new T.Mesh(new T.SphereGeometry(.012, 20, 12), m.lens); sensor.scale.set(1, .55, .3); sensor.position.set(0, .337, -2.061); front.add(sensor);
  loft(front, [[-.90, .14, -1.94], [-.78, .133, -2.07], [-.43, .152, -2.105], [0, .155, -2.11], [.43, .152, -2.105], [.78, .133, -2.07], [.90, .14, -1.94]], [[-.90, .118, -1.91], [-.78, .110, -2.09], [-.43, .125, -2.125], [0, .127, -2.13], [.43, .125, -2.125], [.78, .110, -2.09], [.90, .118, -1.91]], m.carbon, 100, 6);
  line(front, points(t => { const f = t * 2 - 1; return [f * .535, .758 + .006 * (1 - f * f), -1.081]; }), .0014, m.seam);

  const cabin = new T.Group(); cabin.name = '03 · continuous canopy and flush side glazing'; body.add(cabin);
  // Painted shoulders bridge the narrower canopy to the flared wheel arches.
  for (const side of [-1, 1]) {
    patch(cabin, (u, v) => sail(mix(-1.12, 1.36, u), v, side), m.paint, 120, 28);
    const glassPoint = (u: number, v: number): P => {
      const z = mix(-1.055,1.12,u);
      return sail(z, mix(.048, .90-.57*u**4, v), side, .003);
    };
    patch(cabin, glassPoint, m.glass, 72, 24);
    const boundary = [...points(t => glassPoint(t, 0)), ...points(t => glassPoint(1, t)), ...points(t => glassPoint(1 - t, 1)), ...points(t => glassPoint(0, 1 - t))];
    line(cabin, boundary, .002, m.seam, false);
    line(cabin, points(t => glassPoint(mix(.42, .29, t), t), 32), .0024, m.seam);
    line(cabin, points(t => glassPoint(mix(.74, .65, t), t), 32), .0021, m.seam);
    // Slim painted A-pillars are surfaced ribbons instead of oversized round tubes.
    patch(cabin, (u, v) => { const z = mix(-1.12, .05, u); return sail(z, .014 + v * .036, side, .0008); }, m.paint, 68, 5);
  }
  // Windshield and roof are one continuous surface with proper curvature at the crown.
  patch(cabin, (u, v) => roof(mix(-1.12, 1.36, u), mix(-.994, .994, v)), m.glass, 140, 56);
  line(cabin, points(t => { const p = roof(-1.119, mix(-.995, .995, t)); p[1] += .001; return p; }), .0025, m.seam);
  line(cabin, points(t => { const p = roof(.02, mix(-1, 1, t)); p[1] += .0015; return p; }), .0015, m.seam);
  // The fine centre roof joint and recessed single wiper are visible at close range.
  line(cabin, points(t => { const p = roof(mix(.02, .67, t), 0); p[1] += .0008; return p; }), .0009, m.seam);
  line(cabin, [[-.46, .778, -1.074], [-.1, .779, -1.084], [.28, .777, -1.088]], .004, m.black);
  line(cabin, [[-.43, .779, -1.07], [-.28, .787, -1.045], [-.11, .783, -1.07]], .0025, m.graphite);

  const rearDeck = new T.Group(); rearDeck.name = '04 · rear haunches and deck shut lines'; body.add(rearDeck);
  patch(rearDeck, (u, v) => { const z = mix(1.36, 1.79, u), f = v * 2 - 1; return [f * width(z), mix(deck(z)+Math.max(0,1-(z-1.36)/.28)*.028, shoulder(z), Math.abs(f) ** 5) + .006 * (1 - f * f), z]; }, m.paint, 48, 48);
  line(rearDeck, points(t => { const x = mix(-width(1.79), width(1.79), t); return [x, mix(deck(1.79), shoulder(1.79), (Math.abs(x) / width(1.79)) ** 5), 1.79]; }), .0017, m.seam);
  return { shell, front, cabin, rearDeck };
}
