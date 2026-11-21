// Rendering uses one interpolated pose for the car, camera, lights and shadow.
// Physics still runs at 120 Hz; display refresh rates need not divide that rate.
export interface MotionPose {
  x:number; z:number; height:number; heading:number; speed:number; steer:number; flip:number;
}
interface Point {x:number;y:number;z:number}
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
export const damp=(value:number,target:number,rate:number,dt:number)=>mix(value,target,1-Math.exp(-rate*dt));
const angleDelta=(a:number,b:number)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
function copy(target:MotionPose,source:MotionPose){
  target.x=source.x;target.z=source.z;target.height=source.height;target.heading=source.heading;
  target.speed=source.speed;target.steer=source.steer;target.flip=source.flip;
}
export class PoseInterpolator {
  private previous:MotionPose;
  readonly value:MotionPose;
  constructor(pose:MotionPose){
    this.previous={x:0,z:0,height:0,heading:0,speed:0,steer:0,flip:0};this.value={...this.previous};this.snap(pose);
  }
  capture(pose:MotionPose){copy(this.previous,pose);}
  snap(pose:MotionPose){copy(this.previous,pose);copy(this.value,pose);}
  sample(pose:MotionPose,alpha:number){
    const a=Math.max(0,Math.min(1,alpha)),p=this.previous,v=this.value;
    v.x=mix(p.x,pose.x,a);v.z=mix(p.z,pose.z,a);v.height=mix(p.height,pose.height,a);
    v.heading=p.heading+angleDelta(p.heading,pose.heading)*a;
    v.speed=mix(p.speed,pose.speed,a);v.steer=mix(p.steer,pose.steer,a);
    // Finishing a full revolution returns to the same orientation, not halfway back.
    v.flip=p.flip>0&&pose.flip>0?mix(p.flip,pose.flip,a):pose.flip;
    return v;
  }
}

// Damp the mount relative to the car, never the car's world translation. The old
// world-space follower plus speed/rate prediction made frame-time variation look
// like the car was surging forward/backward, especially at 156 m/s and on braking.
export class ChaseCamera {
  readonly position:Point={x:0,y:0,z:0};
  readonly target:Point={x:0,y:0,z:0};
  private offset:Point={x:0,y:1.55,z:4.8};
  private heading=0;
  private elevation=1.55;
  private ahead=7;
  private lateral=0;
  enter(position:Point,pose:MotionPose){
    this.offset.x=position.x-pose.x;this.offset.y=position.y-pose.height;this.offset.z=position.z-pose.z;
    this.heading=pose.heading;
    this.elevation=1.55+Math.min(Math.abs(pose.speed)*.003,.3);this.ahead=7+Math.abs(pose.speed)*.045;this.lateral=-pose.steer*.35;
  }
  snap(pose:MotionPose){
    const v=Math.abs(pose.speed),distance=4.8,lateral=-pose.steer*.35;
    this.enter({x:pose.x+Math.sin(pose.heading)*distance+Math.cos(pose.heading)*lateral,y:pose.height+1.55+Math.min(v*.003,.3),z:pose.z+Math.cos(pose.heading)*distance-Math.sin(pose.heading)*lateral},pose);
    this.update(pose,0);
  }
  update(pose:MotionPose,dt:number){
    const v=Math.abs(pose.speed);
    this.heading+=angleDelta(this.heading,pose.heading)*(1-Math.exp(-dt*14));
    this.elevation=damp(this.elevation,1.55+Math.min(v*.003,.3),6,dt);
    this.ahead=damp(this.ahead,7+v*.045,6,dt);this.lateral=damp(this.lateral,-pose.steer*.35,8,dt);
    const sin=Math.sin(this.heading),cos=Math.cos(this.heading);
    this.offset.x=damp(this.offset.x,sin*4.8+cos*this.lateral,22,dt);
    this.offset.y=damp(this.offset.y,this.elevation,22,dt);
    this.offset.z=damp(this.offset.z,cos*4.8-sin*this.lateral,22,dt);
    this.position.x=pose.x+this.offset.x;this.position.y=pose.height+this.offset.y;this.position.z=pose.z+this.offset.z;
    this.target.x=pose.x-sin*this.ahead;this.target.y=pose.height+.75;this.target.z=pose.z-cos*this.ahead;
  }
}
