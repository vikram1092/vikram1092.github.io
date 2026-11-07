import type { HudView } from './contracts';

const sentence = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

/** One decision at a time. Statistics and chapter metadata belong in pause. */
export function ridingGuidance(view: HudView): { text: string; arrow: string; progress?: number } {
  // Route exceptions outrank a still-active controller or an out-of-range link.
  if (/RETURN ROAD/.test(view.routeCue)) return { text: 'Follow the return road', arrow: '↑' };
  if (/SERVICE LOOP|SCAN LOOP/.test(view.routeCue)) return { text: /RIGHT/.test(view.routeCue) ? 'Take the right service loop' : 'Follow the service loop', arrow: /RIGHT/.test(view.routeCue) ? '↱' : '↑' };
  if (/DRONE INTERCEPTION|INTERCEPTION · CLEAR|DEFENDER AHEAD/.test(view.routeCue)) return { text: 'Clear the drone', arrow: '↑' };
  if (/DRONE ON JO/.test(view.routeCue)) return { text: 'Evade or counter', arrow: '↔' };
  const escort = view.escort;
  if (escort && !escort.busSafe) {
    const intercept = escort.attackPhase === 'telegraph' && escort.intercept;
    return {
      text: !escort.inRange ? 'Return to the bus' : intercept ? `Draw fire · ${intercept}` : 'Stay with the bus',
      arrow: intercept === 'left' ? '↰' : intercept === 'right' ? '↱' : '↑',
    };
  }
  if (view.connection) {
    const c = view.connection;
    const name = c.kind === 'upload' ? 'Upload' : 'Relay';
    return { text: c.state === 'linked' ? `${name} ${c.relay} linked` : c.state === 'out-of-range' ? `Return to ${name.toLowerCase()} ${c.relay}` : c.state === 'in-range' ? 'Land inside the corridor' : `Hold line · ${name.toLowerCase()} ${c.relay}`,
      arrow: '↑', progress: c.progress };
  }
  if (view.controller && view.controller.state !== 'open') return { text: view.controller.state === 'active' ? 'Cut the marked controller' : 'Barrier opening', arrow: '↑', progress: view.controller.progress };
  if (view.missionMeter?.label === 'RECOVERY LOCK') return { text: 'Steer outside the lock', arrow: '↔', progress: view.missionMeter.value };
  if (view.missionMeter?.label === 'PUBLIC UPLOAD') return { text: sentence(view.missionMeter.detail), arrow: '↑', progress: view.missionMeter.value };
  const turn = view.routeCue.match(/^(NEXT · )?(LEFT|RIGHT|STRAIGHT)(?: · (\d+) KM\/H)?/);
  if (turn) return { text: turn[2] === 'STRAIGHT' && !turn[1] ? '' : `${sentence(turn[2])}${turn[1] ? ' ahead' : ''}${turn[3] ? ` · ${turn[3]} km/h` : ''}`, arrow: turn[2] === 'LEFT' ? '↰' : turn[2] === 'RIGHT' ? '↱' : '↑' };
  return { text: sentence(view.routeCue), arrow: /RIGHT/.test(view.routeCue) ? '↱' : /LEFT/.test(view.routeCue) ? '↰' : '↑' };
}

/** Only an immediate threat or missed maneuver can interrupt navigation. */
export function urgentFeedback(message = ''): string {
  if (/RIDER ON (LEFT|RIGHT)/.test(message)) return `Rider ${message.includes('LEFT') ? 'left' : 'right'} · spikes or swerve`;
  if (message.startsWith('BARRICADE')) return 'Barricade · jump or go around';
  if (message.startsWith('BROKEN ROAD')) return 'Broken road · jump or change line';
  if (/DRONE ON BUS/.test(message)) return 'Protect the bus · intercept right';
  if (/DRONE ON JO|ATTACK SIGNAL|LUNGE \/ ACT NOW/.test(message)) return 'Evade or counter now';
  if (/DRONE INBOUND|MUNICIPAL DRONE|CIVIC DEFENDER|MUNICIPAL INTERCEPT/.test(message)) return 'Drone · evade or counter';
  if (/DRONE APPROACH/.test(message)) return 'Drone approaching';
  if (/EXIT MISSED/.test(message)) return 'Exit missed · follow the return road';
  if (/CONTROLLER MISSED/.test(message)) return 'Controller missed · take the service loop';
  if (/LINK INCOMPLETE|UPLOAD INCOMPLETE|SCAN MISSED/.test(message)) return 'Follow the service loop';
  if (/BUS HIT/.test(message)) return 'Bus hit · stay close';
  if (/CONTACT|BIKE [12] \/ 3|DRONE STRIKE/.test(message)) return sentence(message.split(' · ')[0]);
  return '';
}
