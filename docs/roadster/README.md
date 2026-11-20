# Roadster / Night Run

Standalone desktop WebGL2 game at `/roadster/`. The visible page contains the rendered world, a small mph readout, and six unlabeled paint swatches at the lower left. No menu, instruction overlay, loading copy, popups, or panels.

The car starts in pearl white. Click a swatch to change paint; the selected swatch has a thin ring. The camera starts in an automatic orbit. Up immediately engages thrust and moves the camera behind the car. Mouse dragging and the scroll wheel also control the parked orbit view.

## Keys

- Arrow Up: accelerate; Arrow Down: brake, then reverse.
- Left / Right: steer.
- Space: rocket jump; hold to continue climbing, tap again in flight for another impulse.
- F or E: right kickflip; Q: left kickflip; X: forward flip.
- Shift + Up: sustained rocket boost.
- 1–6: iridescent violet, pearl white, liquid silver, crimson, ion blue, obsidian.
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

Run `npm run build` and `npx playwright test tests/roadster-physics.spec.ts tests/roadster-presentation.spec.ts`. The physics checks cover launch time, braking, five minutes of sustained thrust and coasting to rest. Browser QA covers the initial orbit, immediate camera transition, measured acceleration, steering, braking, paint keys, rocket jump / kickflip / landing, and the minimal production page. Runtime QA telemetry is available on the canvas's `data-telemetry` attribute; it is not rendered as UI.

## Section-by-section fidelity revision

The initial generic shell has been replaced by independently surfaced sections. The dimensions below are modeling coordinates fitted to photographic proportions; they are not published factory measurements.

| Section | Revision |
| --- | --- |
| Silhouette | 4.13 m modeling length, 2.725 m wheelbase, 1.105 m roof crown; lower canopy, longer wheelbase, staggered tire diameters, and rising rear bumper edge. |
| Front | Separate trapezoidal hood and fenders; real triangular lamp apertures with recessed lenses and LED elements; central light bar reduced to 1.284 m; deeper intake, camera, and swept carbon splitter. |
| Canopy | Continuous curved windshield / roof, separately surfaced side glazing, slim A-pillars, window divisions, roof joints, and recessed wiper. The previous overlapping polygon windows were removed. |
| Side body | Full circular wheel openings and returned lips, continuous skin normals, contour-following door gaps, flush latches, camera repeaters, and shaped carbon sills. |
| Wheels | Five aluminium aero petals over split graphite spokes, machined lips, center caps and bolts, drilled rotors, fixed calipers, molded sidewall graphics, shoulder tread and grooves. Each tire uses its own rolling radius. |
| Rear | Flush curved active airfoil with mounting struts and a closed recessed deck underneath; thin curved tail lamp, smooth painted fascia, recessed plate and camera, four short barrel nozzles, four recessed nine-blade fans, enclosed carbon diffuser bays. The invented horizontal metal grille is gone. |
| Cockpit / floor | Carbon seat shell and cushion, yoke, dashboard, passenger-side pressure vessel, carbon floor, gas lines, fasteners, lift nozzles and lateral nozzles. Unseen mechanical details remain interpretive. |
| Materials / rendering | Original carbon weave and tire textures, restrained paint microtexture, revised iridescent clearcoat and glazing, narrower reflection lights, multisampled rendering, and smaller cold-gas particles. |

### Visual review

Development builds accept `?inspect=front`, `side`, `rear`, `detail`, `hero`, `back`, `reference`, or `profile`, optionally with zero-based `&paint=0`. These freeze the camera and use neutral lighting to reveal silhouette and surfacing errors. Inspection is enabled only in development; it adds no visible controls. The saved views are renders of our model, not Tesla photographs:

- [Front quarter](review/front-quarter.png)
- [Side profile](review/side.png)
- [Rear quarter](review/rear.png)

Reference comparison used the archived `Roadster-02-Pilot-Desktop`, `Roadster-03-Carousel-Slide-1-Desktop`, `Roadster-03-Carousel-Slide-2-Desktop`, `Roadster-07-Augments-Desktop`, and `Roadster-08-End-Desktop` images. Source photos and third-party meshes are not included in the repository.

Revision validation: production build and type checks pass; all four physics tests pass. Desktop browser review at 1280×720 showed 60 fps, a 0.58333 s launch crossing, functioning steering / braking, paint selection, active aero deployment, rocket lift, kickflip completion and landing. The deployed-wing review caught and fixed an open deck beneath the lifted airfoil. The current production DOM contains the game canvas, paint swatches and mph readout. Performance is a measurement on the review machine, not a guarantee for all hardware.


## Lighting, brake and body refinement

A second photographic comparison used longer-lens front and side review cameras, so perspective distortion would not be mistaken for body-shape differences.

- Swept the outer nose corners rearward, narrowed the rear of the hood, joined the hood/fenders to the curved windshield base, and added reflective headlamp interiors.
- Lowered the shoulder crease behind the front wheel while keeping the side-glass belt line independent; adjusted the door gaps, straight window divisions, latch, side camera and repeater positions.
- Rebuilt the rear deck to meet the flush airfoil, removed the excess airfoil crown, and swept the diffuser's lower edge forward. The wing's supports articulate from fixed bases and retract below the deck at rest.
- Raised the violet paint's base brightness, slightly increased exposure and fill, and replaced small point sources with broad area lights for more readable contours.
- Replaced the thin tail-light wire with an 18 mm lens. Running emission is 3.2; forward braking raises it to 12 and adds a stronger red pool behind the car. These are renderer values, not physical photometry.
- Separated forward braking from reversing. Down only tilts the airfoil while slowing forward motion, and low-speed braking cannot push a stowed wing through the deck. Reverse keeps normal running illumination and the wing stowed. Lift/tilt thresholds are game tuning; Tesla's actual control logic is not documented here.

Development-only `&brake=1&speed=30` (speed in m/s) provides a fixed view of the braking state. [Braking review](review/braking.jpg). It does not appear in the production UI.

Validation: production build/type checks and all six physics/presentation tests pass. Browser checks verified reverse at -10 m/s with zero wing lift/tilt and running emission 3.2, deployed braking emission 12, smooth wing retraction, the brighter night finish, and the minimal production page. The reconstruction remains fitted to exterior photographs rather than factory CAD; unseen mechanical details are interpretive.


## Rear hardware and visible paint selection

Compared the rear-quarter and deployed-airfoil source photographs again, concentrating on the light surround, nozzle mouths, fan hubs and the spaces between them.

- Recessed the 18 mm red lens into a curved 46 mm black cassette. Its 1.682 m luminous span now has 38 mm black end caps inside the 1.758 m housing, plus black upper/lower margins and a shallow recess. The stronger brake state remains intact.
- Replaced bright flared thrusters with short graphite barrels, thin machined lips, tapered metallic inner walls, recessed dark throats, mounting collars and small fasteners. The rear mouths are 104 mm across in model coordinates.
- Increased the fan sweep from 218 mm to 254 mm and the hub base diameter from 52 mm to 112 mm. Broader swept blades, deep ducts and conical hubs better follow the visible reference proportions. These are photographic modeling estimates, not published engineering dimensions; blade construction and hidden hardware remain interpretive.
- Added six clickable, keyboard-accessible swatches without visible labels or a surrounding panel. Clicks and number keys share one selection state. Space/Enter activate a focused swatch without firing rockets; selecting a color returns focus to the game.
- Made pearl white the starting finish and removed its iridescence. Reduced violet's color shift and softened the white clearcoat, glass reflections and bloom so bright rear-quarter highlights do not obscure the body or lamp surround. Purple, silver, red, blue and black remain available.

[Rear hardware close-up](review/rear-hardware.jpg), [rear quarter](review/rear.png), [braking state](review/braking.jpg).

Validation: production build/type checks and all six physics/presentation tests pass. Browser QA checked all six swatches, number-key synchronization, Space activation without jumping, immediate acceleration after selection, 0.58333 s to 60 mph, braking and kickflip. White running/braking views were inspected against the source images. Desktop review measured 60 fps. Production exposes only the requested swatches and speed, with no instructions or panels.

## Glazing, rear silhouette and hardware proportion correction

Re-inspected the live [official Roadster page](https://www.tesla.com/roadster?redirect=no) and its full-resolution Tesla-hosted images on November 20, 2026. This revision supersedes the earlier canopy and rear-hardware dimensions above. The side photograph establishes the roof and window rails; the whole-car rear hero establishes hardware scale and spacing; the overhead rear detail establishes the tapered backlight and airfoil shut line. The cropped Augments image is used for construction detail, not whole-car scale.

- Straightened the windshield/A-pillar rise, retained a shallow roof crown, and swept the lower windshield boundary rearward at its centre. Hood and fender surfaces share that bowed cowl. Added small front and rear glass corner returns.
- Replaced side glass overlaid on a painted shell with an actual aperture bounded by shared, finely sampled surface strips. Revised the lower window rise, rear quarter-light termination, narrow paired divisions and frame thickness. Removed long triangles that produced false dents at the front pillar and rear quarter.
- Separated the rear glass footprint from the roof envelope. Both now narrow toward the tail: the backlight terminates at a 704 mm modeling width between painted buttresses, directly at the airfoil's leading shut line. The previous broad window, abrupt cutoff and intervening shelf are gone.
- Extended the flush airfoil to the new glass/deck junction, carried the buttress profile into its leading edge, and closed the recessed bed and front bulkhead. Reviewed it both stowed and lifted/tilted; the existing braking test now checks its longer chord.
- Reduced rear nozzle mouths from 104 to 84 mm and centre spacing from 320 to 236 mm. Reduced fan blade sweep from 254 to approximately 208 mm and centre spacing from 393 to 296 mm. Narrowed the central enclosure from 1,590 to 1,220 mm and recessed the fans. These are model coordinates fitted to images, not Tesla engineering specifications.
- Reshaped the painted rear fascia into a shallow upper band above recessed carbon surfaces. Reduced the plate width and corrected its aspect ratio. Softened nose and door seams, removed exposed LED blocks, smoothed the intake surface and used a subdued warm glass tint.

Primary photographs: [rear hero](https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Roadster-01-Hero-Desktop.jpg), [side](https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Roadster-02-Pilot-Desktop.jpg), [front](https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Roadster-03-Carousel-Slide-1-Desktop.jpg), [rear deck](https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Roadster-03-Carousel-Slide-2-Desktop.jpg), [glass/cowl](https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Roadster-03-Carousel-Slide-3-Desktop.jpg), [rear hardware](https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Roadster-07-Augments-Desktop.jpg), [front quarter](https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Roadster-08-End-Desktop.jpg). Reference photos remain outside the repository and are not served by the game.

Current model renders: [front quarter](review/glazing-front.jpg), [side profile](review/glazing-side.jpg), [rear quarter](review/glazing-rear.jpg), [deployed airfoil](review/glazing-braking.jpg). Development-only `?inspect=aft` and `?inspect=top` add elevated rear and overhead checks to the existing inspection views.

Validation: `npm run build` passes with no type diagnostics; all nine tests in `roadster-geometry`, `roadster-physics` and `roadster-presentation` pass. Geometry checks cover closed side-window returns, aperture containment, rear-glass taper/symmetry and the deck/quarter join. Browser review covered front, side, rear, overhead and braking views, plus the production orbit, paint selection, acceleration, steering, reverse and kickflip. The production build measured 60 fps and a 0.58333 s 0–60 crossing on the review machine, with no console errors. This remains a photographic reconstruction; unseen geometry and exact dimensions cannot be verified without factory data.


## Window angles and lower rear profile refinement

A second pass compares the same official Tesla photographs across front, side and rear views. In particular, the head-on image constrains the roof-to-cowl width ratio; a side photograph by itself cannot determine the inward lean of the glass. These changes supersede the canopy dimensions in the preceding section.

- Narrowed the crown from about 1.29 m to 1.00 m while retaining a 1.51 m windshield base. Raised the shallow crown by 10 mm and advanced the cowl and side-glass start by 80 mm. The hood, fenders, front glass return and wiper placement follow the revised boundary together.
- Rebalanced the side-window lower rail, upper frame and front division angle. The rear quarter-light now ends against its upper rail with a short angled lower return, instead of a rounded teardrop. Paint and glass continue to use the same surface and aperture boundary.
- Narrowed the backlight termination to 540 mm and the surrounding buttress crests to 830 mm, with a clearer raised crease carried into the flush airfoil. These are photographic modeling estimates, not published vehicle dimensions.
- Rebuilt the lower rear perimeter around the compact central fan tray. The outer bumper now rises behind each tire and tucks inward; the former low, full-width carbon curtain and hanging outer triangles are gone. Raised the outer painted corners, retained the deeper central painted chin, closed the side-to-rear returns, and gave the two inboard cassette fins rounded feet. Extended the recessed fan backing into the floor return. Fan and nozzle scale and spacing retain the accepted previous-pass values.
- Added development-only `?inspect=rearref` for a longer-lens elevated rear comparison. Production camera controls and presentation are unchanged.

Review renders: [head-on](review/proportions-front.jpg), [front quarter](review/proportions-front-quarter.jpg), [side](review/proportions-side.jpg), [rear quarter](review/proportions-rear.jpg), [elevated rear](review/proportions-rear-profile.jpg), [braking](review/proportions-braking.jpg).

Validation: production build and type check pass; all ten Roadster geometry, physics and presentation tests pass. The new rear-boundary check covers fascia continuity, the side skin join, inward tuck and the raised outer bumper. Browser review checked front, side, elevated/low rear and deployed-airfoil views. The production build also passed paint selection and acceleration checks with no browser console errors. The model remains a reconstruction from photographs, with no factory CAD dimensions available.
