// SI units. The launch targets the advertised Rocket figure (<0.59 s to 60 mph),
// not a measured production result. Higher-speed behavior is arcade tuning.
export const SIXTY_MPH = 26.8224;
export const LAUNCH_SECONDS = .58;
export const LAUNCH_ACCELERATION = SIXTY_MPH / LAUNCH_SECONDS;
export const FIXED_STEP = 1 / 120;
export function acceleration(speed: number, boost: boolean) {
  if(speed < SIXTY_MPH) return LAUNCH_ACCELERATION;
  return (boost ? 36 : 23) * Math.max(0, 1 - Math.pow(speed / (boost ? 156 : 108), 2));
}
export function integrateSpeed(speed:number, throttle:boolean, brake:boolean, boost:boolean, dt:number) {
  if(brake) return Math.max(-10,speed-(speed>0?38:7)*dt);
  if(throttle) return Math.max(0,speed+acceleration(Math.max(0,speed),boost)*dt);
  return Math.sign(speed)*Math.max(0,Math.abs(speed)-(2.4+Math.abs(speed)*.016)*dt);
}
