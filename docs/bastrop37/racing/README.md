# Road redesign

The campaign retains its dialogue, mission milestones, and save format. Five authored road courses precede the main encounter in each chapter. The opening inspection in Betrayal still happens before its escape course.

| Chapter | Course | Distance | Base driving time at 300 km/h |
| --- | --- | --- | --- |
| Delivery | Intake Express | 7.0 km | 84 s |
| Betrayal | Recovery Run | 7.7 km | 92 s |
| Public Access | Relay Crossing | 7.7 km | 92 s |
| Lockdown | Reservoir Run | 7.7 km | 93 s |
| Release | Civic Descent | 7.9 km | 95 s |

These times exclude dialogue and mission encounters. Braking, drafting, and boost affect actual times. World travel uses the existing simulation convention of speed × seconds; displayed kilometres divide world units by 3600.

## Driving

- Phone input: press and hold the road to accelerate, release to coast, drag horizontally to steer, swipe up to jump, and swipe down to deploy spikes. Swipes work during the same held gesture. The turbo readout is tappable. Portrait and landscape use this layout; keyboard controls remain available on desktop.
- Six named sectors per course, with eased left and right bends, switchbacks, freight traffic, and passing straights.
- Road texture, vehicles, collision sprites, and roadside chevrons share the same projected centerline.
- Higher speed reduces steering authority and increases outward drift. Braking before a bend or holding slide while steering into it helps hold the line.
- Close passes, traffic slipstreams, and slides into bends replenish boost. Straight-line weaving no longer earns extra slide energy during a course.
- Traffic arrives ahead of the rider in spaced groups. Each group leaves two adjacent lanes clear. It never spawns inside an immediate collision window.
- The HUD shows current sector, route progress, distance remaining, elapsed time, overtakes, and advance turn advice.
- Retry returns to the current sector with a clear approach. Sector retries are session-only; reloading restores the existing campaign checkpoint at the start of that road course.
- Mission actors and interaction zones are introduced after the course traffic has cleared. Story acknowledgments and campaign flags remain owned by the existing mission models.

## Road combat

- Rival motorcycles approach, pull alongside, and telegraph a side strike for 0.95 seconds. The strike commits to the rider's position at the warning, so steering away or a timed jump evades it. Traffic can block a rival's attack path.
- Spikes extend for 0.7 seconds with a 1.1-second cooldown. A grounded side hit stuns a rival; two hits knock the rider out. Counters earn energy. Rivals have a visible two-part health bar and retreat on defeat or at the route exit.
- Barricades and broken road sections arrive ahead with a warning. Steer around them or time a jump; clean jumps earn energy.
- The bike takes three hits on a road course, with 1.4 seconds of protection after contact. Hits cost speed and energy. Retry restores the bike at the current sector with clear road ahead.

## Verification

`tests/race-model.spec.ts` checks every course for duration, bend continuity, traffic gaps, and finish drainage. `tests/road-combat-model.spec.ts` checks gesture ownership, swipe latching, telegraphed attacks, dodging, jumping, counters, and rival exits. `tests/racing.spec.ts` drives the actual first course and defeats a rival using keyboard inputs, tests pause/retry and real touch gestures, checks portrait/landscape controls, and verifies saved entry into the other four roads.

The earlier story/encounter browser regressions use localhost-only `?fixture=encounters` to isolate their original interactions from the long driving legs. Normal `/bastrop37/` always includes the new courses; production hosts ignore the fixture parameter. Existing standalone mechanics fixtures remain available.

This iteration keeps the existing story, controller, relay, and escort encounters. Human playtesting should guide traffic density, rival pressure, steering feel, and route duration.

## Existing mission-turn limitation

The new road courses precede the original mission encounters; they do not redesign their required exits. Delivery's service gate still tests lateral position in `SERVICE_CORRIDOR` at a crossing plane. Lockdown's civic ramp still tests `RAMP_MIN_X` through `RAMP_MAX_X` at its route marker. Neither is a player-selected junction with its own continuous branch geometry. Keeping dialogue and mission flags intact should not be described as validating the story's playable route design.

The encounter-only regressions deliberately bypass the new courses. The current integrated tests cover the first course's encounter handoff and saved entry into the other courses, not a complete five-chapter run through every required exit with the new phone controls.
