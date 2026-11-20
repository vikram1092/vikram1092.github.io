// Visual vehicle states are separate from the shared brake/reverse key.
// Deployment thresholds are game tuning, not a claim about Tesla's control software.
export const RUNNING_LAMP_INTENSITY = 3.2;
export const BRAKE_LAMP_INTENSITY = 12;
const smooth = (a:number,b:number,x:number) => {const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};
export function vehiclePresentation(speed:number,down:boolean) {
  const braking=down&&speed>.15;
  const airBrake=braking?smooth(6,22,speed):0;
  const deployment=Math.max(smooth(22,38,speed),airBrake);
  return {
    braking,
    wingLift:.125*deployment,
    wingRearward:.29*deployment,
    wingAngle:airBrake>0?-.20*airBrake:0,
    lampIntensity:braking?BRAKE_LAMP_INTENSITY:RUNNING_LAMP_INTENSITY,
    lampSpill:braking?5:.65,
  };
}
