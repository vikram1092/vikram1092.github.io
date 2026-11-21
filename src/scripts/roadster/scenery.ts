import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Spatial batches keep the larger city cheap to draw: blocks behind the camera
// can be culled independently, and hundreds of palms don't become draw calls.
export class Scenery {
  readonly chunks:T.Mesh[]=[];
  private textMaterials=new Map<string,T.MeshBasicMaterial>();
  private batches=new Map<T.Material,Map<string,T.BufferGeometry[]>>();
  constructor(private scene:T.Scene){}
  add(g:T.BufferGeometry,material:T.Material,x:number,z:number) {
    if(!g.index)g.setIndex(Array.from({length:g.getAttribute('position').count},(_,i)=>i));
    if(!this.batches.has(material))this.batches.set(material,new Map());
    const cells=this.batches.get(material)!,key=`${Math.floor(x/650)},${Math.floor(z/650)}`;
    const list=cells.get(key)||[];list.push(g);cells.set(key,list);
  }
  box(material:T.Material,size:number[],position:number[],yaw=0) {
    const g=new T.BoxGeometry(size[0],size[1],size[2]);g.rotateY(yaw);g.translate(...position as [number,number,number]);
    this.add(g,material,position[0],position[2]);
  }
  cylinder(material:T.Material,top:number,bottom:number,height:number,position:number[],segments=10) {
    const g=new T.CylinderGeometry(top,bottom,height,segments);g.translate(...position as [number,number,number]);this.add(g,material,position[0],position[2]);
  }
  beam(material:T.Material,a:T.Vector3,b:T.Vector3,width:number) {
    const g=new T.BoxGeometry(width,a.distanceTo(b),width),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),b.clone().sub(a).normalize());
    g.applyQuaternion(q);const mid=a.clone().add(b).multiplyScalar(.5);g.translate(mid.x,mid.y,mid.z);this.add(g,material,mid.x,mid.z);
  }
  text(text:string,position:number[],width:number,height:number,yaw=0,color='#bafbf3',background='#063d32',fontSize=54) {
    const key=[text,color,background,fontSize].join('|');
    let material=this.textMaterials.get(key);
    if(!material){
    const cv=document.createElement('canvas');cv.width=1024;cv.height=256;const c=cv.getContext('2d')!;
    c.fillStyle=background;c.fillRect(0,0,1024,256);c.strokeStyle=color;c.lineWidth=5;c.strokeRect(12,12,1000,232);
    c.fillStyle=color;c.textAlign='center';c.textBaseline='middle';c.font=`500 ${fontSize}px Arial, sans-serif`;
    const lines=text.split('\n');lines.forEach((line,i)=>c.fillText(line,512,128+(i-(lines.length-1)/2)*82,954));
    const texture=new T.CanvasTexture(cv);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
    material=new T.MeshBasicMaterial({map:texture,side:T.DoubleSide});this.textMaterials.set(key,material);
    }
    const geometry=new T.PlaneGeometry(width,height);geometry.rotateY(yaw);geometry.translate(...position as [number,number,number]);this.add(geometry,material,position[0],position[2]);
  }
  finish(){for(const [material,cells] of this.batches)for(const geometries of cells.values()){
    const g=mergeGeometries(geometries);g.computeBoundingSphere();g.computeBoundingBox();const mesh=new T.Mesh(g,material);mesh.userData.range=g.boundingBox!.max.y>45?6500:1800;mesh.receiveShadow=true;this.scene.add(mesh);this.chunks.push(mesh);for(const item of geometries)item.dispose();
  }this.batches.clear();}
}

export function makePalmGeometry() {
  const vertices:number[]=[],uvs:number[]=[];
  for(let leaf=0;leaf<9;leaf++) {
    const angle=leaf*Math.PI*2/9,ca=Math.cos(angle),sa=Math.sin(angle);
    const p=(t:number,side:number)=>{
      const radius=t*4.8,width=Math.sin(Math.PI*t)*.055*side;
      return [ca*radius-sa*width,9+Math.sin(t*Math.PI)*1.4-t*t*2.0,sa*radius+ca*width];
    };
    for(let j=0;j<7;j++){
      const a=j/7,b=(j+1)/7;
      for(const [t,s] of [[a,-1],[b,-1],[a,1],[b,-1],[b,1],[a,1]]){vertices.push(...p(t,s));uvs.push(t,(s+1)/2);}
    }
    // Narrow drooping leaflets, rather than one solid umbrella-shaped blade.
    for(let j=1;j<11;j++)for(const side of [-1,1]){
      const t=j/12,base=p(t,side),end=p(t+.09,0),reach=Math.sin(Math.PI*t)*.82;
      const tip=[base[0]-sa*reach*side+ca*.28,base[1]-.28-t*.2,base[2]+ca*reach*side+sa*.28];
      vertices.push(...base,...tip,...end);uvs.push(0,0,1,1,0,1);
    }
  }
  const leaves=new T.BufferGeometry();leaves.setAttribute('position',new T.Float32BufferAttribute(vertices,3));leaves.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));leaves.computeVertexNormals();
  const trunk=new T.CylinderGeometry(.16,.32,9,7,5);trunk.translate(0,4.5,0);
  const positions=trunk.getAttribute('position');for(let i=0;i<positions.count;i++)positions.setX(i,positions.getX(i)+.7*(positions.getY(i)/9)**2);trunk.computeVertexNormals();
  return {leaves,trunk};
}

export function windowTexture(seed:number,warm=false) {
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=512;const ctx=canvas.getContext('2d')!;
  let n=seed;const random=()=>{n=(1664525*n+1013904223)>>>0;return n/4294967296;};
  ctx.fillStyle=warm?'#12242b':'#0a1622';ctx.fillRect(0,0,256,512);
  for(let y=8;y<512;y+=20)for(let x=5;x<256;x+=16){const r=random();ctx.fillStyle=r>.83?'#ffe2ac':r>.59?'#77b4c4':r>.27?'#243947':'#0c1b28';ctx.fillRect(x,y,9,12);}
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;return texture;
}
