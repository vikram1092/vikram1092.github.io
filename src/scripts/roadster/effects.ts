import {damp} from './motion';

const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const smooth=(a:number,b:number,v:number)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
export interface EffectInput {
  driving:boolean; speed:number; throttle:boolean; boost:boolean; braking:boolean; shock:number;
}

// A presentation layer only: never feed these offsets back into the chase mount
// or physics. Angles are rebuilt from the clean camera orientation every frame.
export class DrivingEffects {
  readonly value={speed:0,launch:0,boost:0,brake:0,impact:0,roll:0,pitch:0,yaw:0,fov:0,blur:0};
  private time=0;
  reset(){for(const key of Object.keys(this.value) as (keyof typeof this.value)[])this.value[key]=0;this.time=0;}
  update(input:EffectInput,dt:number){
    if(!input.driving){this.reset();return this.value;}
    const v=this.value,speed=Math.max(0,input.speed);
    this.time+=dt;
    v.speed=damp(v.speed,smooth(28,150,speed),4,dt);
    v.launch=damp(v.launch,input.throttle&&!input.braking?smooth(0,4,speed)*(1-smooth(20,40,speed)):0,12,dt);
    v.boost=damp(v.boost,input.boost&&!input.braking?smooth(0,30,speed):0,7,dt);
    v.brake=damp(v.brake,input.braking?smooth(4,28,speed):0,8,dt);
    v.impact=damp(v.impact,clamp(input.shock),18,dt);
    // Restore the old rocket/road rumble as a visible camera effect. Faster pitch
    // and yaw carry the vibration; slower roll adds weight. All frequencies stay
    // below 11 Hz, and every offset is absolute rather than accumulated.
    const amplitude=(Math.sqrt(v.speed)*.008+Math.max(v.launch,v.boost)*.010)*(1-v.brake*.65);
    const phase=this.time*Math.PI*2;
    v.roll=amplitude*.5*(Math.sin(phase*2.2)*.65+Math.sin(phase*3.7)*.35);
    v.pitch=amplitude*.8*(Math.sin(phase*7.1)*.7+Math.sin(phase*10.3)*.3)-v.brake*.003+v.impact*.012;
    v.yaw=amplitude*.55*(Math.sin(phase*6.3)*.75+Math.sin(phase*8.9)*.25);
    v.fov=v.boost*4-v.brake*1.2;
    v.blur=v.speed*(.012+v.boost*.016)*(1-v.brake*.35);
    return v;
  }
}

// The car and central sightline stay sharp. Only peripheral scenery stretches;
// boost adds a faint optical fringe to existing lights, not synthetic speed lines.
export const speedFragmentShader=`
uniform sampler2D tDiffuse;
uniform float amount;
uniform float boost;
uniform float aspect;
uniform vec2 carUv;
varying vec2 vUv;
void main(){
  vec2 p=vUv-vec2(.5,.55);
  float edge=smoothstep(.16,.66,length(p))*(1.-smoothstep(.52,.68,vUv.y));
  float outsideCar=smoothstep(.8,1.2,length((vUv-carUv)/vec2(.28/aspect,.24)));
  vec2 d=p*amount*edge*outsideCar;
  vec4 c=texture2D(tDiffuse,vUv)*.40;
  c+=texture2D(tDiffuse,vUv-d*.5)*.24;
  c+=texture2D(tDiffuse,vUv-d)*.18;
  c+=texture2D(tDiffuse,vUv-d*1.5)*.12;
  c+=texture2D(tDiffuse,vUv-d*2.)*.06;
  vec2 fringe=d*.10*boost;
  c.r=mix(c.r,texture2D(tDiffuse,vUv+fringe).r,boost*.18*edge*outsideCar);
  c.b=mix(c.b,texture2D(tDiffuse,vUv-fringe).b,boost*.18*edge*outsideCar);
  c.rgb*=1.-smoothstep(.28,.76,length(p))*(.16+boost*.07);
  gl_FragColor=c;
}`;
