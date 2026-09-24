import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const dir = 'public/bastrop37/assets/sprites';
const groups = {
  bike: ['neutral','steer-left','steer-right','slide-left','slide-right','blades','turbo','jump-anticipation','jump-rise','jump-apex','jump-fall','landing'],
  drone: ['hover','flank-left','flank-right','attack-warning','lunge','fragment-left','fragment-right','core'],
  traffic: ['sedan','sedan-left','sedan-right','hauler','coupe','hauler-left'],
  effects: ['cyan-trail','yellow-turbo','hover-thrust','blades','cut-sparks','impact-sparks','landing-ring','debris'],
};
const manifest = {version:1, format:'RGBA PNG, straight alpha', frames:{}};
for (const [group, names] of Object.entries(groups)) {
  const cols = group === 'traffic' ? 3 : 4;
  const rows = group === 'bike' ? 3 : 2;
  for (let i=0;i<names.length;i++) {
    let x=Math.round(i%cols*1536/cols), y=Math.round(Math.floor(i/cols)*1024/rows);
    let right=Math.round((i%cols+1)*1536/cols), bottom=Math.round((Math.floor(i/cols)+1)*1024/rows);
    // Bounds follow the generated silhouettes, rather than clipping at nominal grid lines.
    if (group==='bike' && i===5) {x=375;right=824;}
    if (group==='bike' && i===6) x=824;
    if (group==='bike' && i>=8) y=646;
    if (group==='bike' && i>=4 && i<8) bottom=646;
    if (group==='drone') {
      const edges=i<4?[0,413,792,1138,1536]:[0,449,797,1144,1536];
      x=edges[i%4];right=edges[i%4+1];
    }
    if (group==='effects') { if(i<4) bottom=585; else y=585; }
    const name=`${group}-${names[i]}`;
    const file=`${name}.png`;
    // Lossless crop/pad only: retain the generated colors and soft alpha.
    execFileSync('convert',[`${dir}/${group}-sheet.png`,'-crop',`${right-x}x${bottom-y}+${x}+${y}`,'+repage','-background','none','-gravity','center','-extent','640x640',`${dir}/${file}`]);
    manifest.frames[name]={file,source:`${group}-sheet.png`,rect:{x,y,w:right-x,h:bottom-y},size:{w:640,h:640},pivot:{x:0.5,y:0.5},blend:group==='effects'?'lighter':'source-over'};
  }
}
// Matching five-angle normal/blades/jump matrix supersedes the initial bike poses.
const [width,height]=execFileSync('identify',['-format','%w %h',`${dir}/bike-angles-sheet.png`],{encoding:'utf8'}).trim().split(' ').map(Number);
const angles=['straight','left-15','right-15','right-35','left-35'];
for (const [row,state] of ['normal','blades','jump'].entries()) {
  for (let col=0;col<5;col++) {
    const rowEdges=[0,330,625,height];
    const x=Math.round(col*width/5),y=rowEdges[row];
    const w=Math.round((col+1)*width/5)-x,h=rowEdges[row+1]-y;
    const name=`bike-${state}-${angles[col]}`,file=`${name}.png`;
    execFileSync('convert',[`${dir}/bike-angles-sheet.png`,'-crop',`${w}x${h}+${x}+${y}`,'+repage','-background','none','-gravity','center','-extent','640x640',`${dir}/${file}`]);
    manifest.frames[name]={file,source:'bike-angles-sheet.png',rect:{x,y,w,h},size:{w:640,h:640},pivot:{x:0.5,y:0.5},blend:'source-over',state,angle:angles[col]};
  }
}
writeFileSync(`${dir}/manifest.json`,JSON.stringify(manifest,null,2)+'\n');
