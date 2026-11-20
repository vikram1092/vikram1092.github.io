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

Original procedural geometry reconstructed from the October 2026 exterior images, including the wedge nose, central running light, recessed triangular lamps, glass canopy, shoulder line, aero wheels, active rear wing, four rear cold-gas thrusters, four rear fan bays, four downward nozzles, and two lateral nozzles. No third-party model or Tesla asset is shipped. This is a visual reconstruction, not factory CAD or a claim of dimensional / mechanical accuracy. Hidden underbody details are interpretive.

- [Tesla Roadster](https://www.tesla.com/roadster?redirect=no): current exterior and Rocket / Thrust configuration descriptions.
- [Reference image archive](https://www.emon100.com/lab/roadster/materials.html): Tesla front, rear and side images used for visual inspection only.
- [Top Gear, October 16, 2026](https://www.topgear.com/car-news/electric/tesla-roadster-has-finally-landed-thrusters-0-60mph-059s-and-flight): reported Rocket claim of under 0.59 seconds to 60 mph.

The simulation uses SI units and a 120 Hz physics step. The initial acceleration is 26.8224 m/s divided by 0.58 seconds. At fixed-step resolution the measured crossing is 0.58333 seconds. This models an advertised target, not independently verified production performance. High-speed acceleration, road grip, infinite propellant, stunts and assisted landings are game tuning. Regular acceleration asymptotically approaches 108 m/s; sustained boost approaches 156 m/s. No real vehicle top-speed claim is implied.

## Rendering and verification

Three.js is bundled locally. There are no external model, shader, texture or CDN runtime dependencies. Geometry is batched by material; road reflections are rendered at 1024×768, and device pixel ratio is capped at 1.5. A bounded particle pool keeps repeated rocket use from creating unbounded scene objects. Web Audio starts on a driving gesture.

Run `npm run build` and `npx playwright test tests/roadster-physics.spec.ts tests/roadster-presentation.spec.ts`. The physics checks cover launch time, braking, five minutes of sustained thrust and coasting to rest. Browser QA covers the initial orbit, immediate camera transition, measured acceleration, steering, braking, paint keys, rocket jump / kickflip / landing, and the speed-only production page. Runtime QA telemetry is available on the canvas's `data-telemetry` attribute; it is not rendered as UI.

## Section-by-section fidelity revision

The initial generic shell has been replaced by independently surfaced sections. The dimensions below are modeling coordinates fitted to photographic proportions; they are not published factory measurements.

| Section | Revision |
| --- | --- |
| Silhouette | 4.13 m modeling length, 2.725 m wheelbase, 1.105 m roof crown; lower canopy, longer wheelbase, staggered tire diameters, and rising rear bumper edge. |
| Front | Separate trapezoidal hood and fenders; real triangular lamp apertures with recessed lenses and LED elements; central light bar reduced to 1.284 m; deeper intake, camera, and swept carbon splitter. |
| Canopy | Continuous curved windshield / roof, separately surfaced side glazing, slim A-pillars, window divisions, roof joints, and recessed wiper. The previous overlapping polygon windows were removed. |
| Side body | Full circular wheel openings and returned lips, continuous skin normals, contour-following door gaps, flush latches, camera repeaters, and shaped carbon sills. |
| Wheels | Five aluminium aero petals over split graphite spokes, machined lips, center caps and bolts, drilled rotors, fixed calipers, molded sidewall graphics, shoulder tread and grooves. Each tire uses its own rolling radius. |
| Rear | Flush curved active airfoil with mounting struts and a closed recessed deck underneath; thin curved tail lamp, smooth painted fascia, recessed plate and camera, four small bell nozzles, four nine-blade fans, enclosed carbon diffuser bays. The invented horizontal metal grille is gone. |
| Cockpit / floor | Carbon seat shell and cushion, yoke, dashboard, passenger-side pressure vessel, carbon floor, gas lines, fasteners, lift nozzles and lateral nozzles. Unseen mechanical details remain interpretive. |
| Materials / rendering | Original carbon weave and tire textures, restrained paint microtexture, revised iridescent clearcoat and glazing, narrower reflection lights, multisampled rendering, and smaller cold-gas particles. |

### Visual review

Development builds accept `?inspect=front`, `side`, `rear`, `hero`, `back`, `reference`, or `profile`, optionally with zero-based `&paint=0`. These freeze the camera and use neutral lighting to reveal silhouette and surfacing errors. Inspection is enabled only in development; it adds no visible controls. The saved views are renders of our model, not Tesla photographs:

- [Front quarter](review/front-quarter.png)
- [Side profile](review/side.png)
- [Rear quarter](review/rear.png)

Reference comparison used the archived `Roadster-02-Pilot-Desktop`, `Roadster-03-Carousel-Slide-1-Desktop`, `Roadster-03-Carousel-Slide-2-Desktop`, `Roadster-07-Augments-Desktop`, and `Roadster-08-End-Desktop` images. Source photos and third-party meshes are not included in the repository.

Revision validation: production build and type checks pass; all four physics tests pass. Desktop browser review at 1280×720 showed 60 fps, a 0.58333 s launch crossing, functioning steering / braking, paint selection, active aero deployment, rocket lift, kickflip completion and landing. The deployed-wing review caught and fixed an open deck beneath the lifted airfoil. The production DOM still contains only the game canvas and mph readout. Performance is a measurement on the review machine, not a guarantee for all hardware.


## Lighting, brake and body refinement

A second photographic comparison used longer-lens front and side review cameras, so perspective distortion would not be mistaken for body-shape differences.

- Swept the outer nose corners rearward, narrowed the rear of the hood, joined the hood/fenders to the curved windshield base, and added reflective headlamp interiors.
- Lowered the shoulder crease behind the front wheel while keeping the side-glass belt line independent; adjusted the door gaps, straight window divisions, latch, side camera and repeater positions.
- Rebuilt the rear deck to meet the flush airfoil, removed the excess airfoil crown, and swept the diffuser's lower edge forward. The wing's supports articulate from fixed bases and retract below the deck at rest.
- Raised the violet paint's base brightness, slightly increased exposure and fill, and replaced small point sources with broad area lights for more readable contours.
- Replaced the thin tail-light wire with an 18 mm lens. Running emission is 3.2; forward braking raises it to 12 and adds a stronger red pool behind the car. These are renderer values, not physical photometry.
- Separated forward braking from reversing. Down only tilts the airfoil while slowing forward motion, and low-speed braking cannot push a stowed wing through the deck. Reverse keeps normal running illumination and the wing stowed. Lift/tilt thresholds are game tuning; Tesla's actual control logic is not documented here.

Development-only `&brake=1&speed=30` (speed in m/s) provides a fixed view of the braking state. [Braking review](review/braking.jpg). It does not appear in the production UI.

Validation: production build/type checks and all six physics/presentation tests pass. Browser checks verified reverse at -10 m/s with zero wing lift/tilt and running emission 3.2, deployed braking emission 12, smooth wing retraction, the brighter night finish, and the speed-only production page. The reconstruction remains fitted to exterior photographs rather than factory CAD; unseen mechanical details are interpretive.
