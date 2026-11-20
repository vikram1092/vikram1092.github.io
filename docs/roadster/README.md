# Roadster / Night Run

Standalone desktop WebGL2 game at `/roadster/`. The visible page contains only the rendered world and a small mph readout. No menu, instruction overlay, loading copy, buttons, or other panels.

The camera starts in an automatic orbit. Up immediately engages thrust and moves the camera behind the car. Mouse dragging and the scroll wheel also control the parked orbit view.

## Keys

- Arrow Up: accelerate; Arrow Down: brake, then reverse.
- Left / Right: steer.
- Space: rocket jump; hold to continue climbing, tap again in flight for another impulse.
- F or E: right kickflip; Q: left kickflip; X: forward flip.
- Shift + Up: sustained rocket boost.
- 1–6: iridescent violet, arctic pearl, liquid silver, crimson, ion blue, obsidian.
- C: stop and orbit. R: recover to the nearest road center, facing along the circuit.
- M: mute / unmute. Losing focus or hiding the tab pauses the simulation and clears held keys.

## Model and performance references

Original procedural geometry reconstructed from the October 2026 exterior images, including the wedge nose, full-width running lights, glass canopy, shoulder line, wheels, active rear wing, four rear cold-gas thrusters, four downward nozzles, and two lateral nozzles. No third-party model or Tesla asset is shipped. This is a visual reconstruction, not factory CAD or a claim of dimensional / mechanical accuracy. Hidden underbody details are interpretive.

- [Tesla Roadster](https://www.tesla.com/roadster?redirect=no): current exterior and Rocket / Thrust configuration descriptions.
- [Reference image archive](https://www.emon100.com/lab/roadster/materials.html): Tesla front, rear and side images used for visual inspection only.
- [Top Gear, October 16, 2026](https://www.topgear.com/car-news/electric/tesla-roadster-has-finally-landed-thrusters-0-60mph-059s-and-flight): reported Rocket claim of under 0.59 seconds to 60 mph.

The simulation uses SI units and a 120 Hz physics step. The initial acceleration is 26.8224 m/s divided by 0.58 seconds. At fixed-step resolution the measured crossing is 0.58333 seconds. This models an advertised target, not independently verified production performance. High-speed acceleration, road grip, infinite propellant, stunts and assisted landings are game tuning. Regular acceleration asymptotically approaches 108 m/s; sustained boost approaches 156 m/s. No real vehicle top-speed claim is implied.

## Rendering and verification

Three.js is bundled locally. There are no external model, shader, texture or CDN runtime dependencies. Geometry is batched by material; road reflections are rendered at 1024×768, and device pixel ratio is capped at 1.5. A bounded particle pool keeps repeated rocket use from creating unbounded scene objects. Web Audio starts on a driving gesture.

Run `npm run build` and `npx playwright test tests/roadster-physics.spec.ts`. The physics checks cover launch time, braking, five minutes of sustained thrust and coasting to rest. Browser QA covers the initial orbit, immediate camera transition, measured acceleration, steering, braking, paint keys, rocket jump / kickflip / landing, and the speed-only production page. Runtime QA telemetry is available on the canvas's `data-telemetry` attribute; it is not rendered as UI.
