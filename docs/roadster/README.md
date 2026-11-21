# Roadster / Miami Nights

Standalone desktop WebGL2 game at `/roadster/`. The visible page contains the rendered world, a small mph readout, and six unlabeled paint swatches at the lower left. No menu, instruction overlay, loading copy, popups, or panels.

The car starts in pearl white. Click a swatch to change paint; the selected swatch has a thin ring. The camera starts in an automatic orbit. Up immediately engages thrust and moves the camera behind the car. Mouse dragging and the scroll wheel also control the parked orbit view.


## Miami bay circuit

The current world is a stylized, driving-scale interpretation of Miami and Miami Beach around Biscayne Bay. Its connected loop follows the idea of Alton Road / Miami Beach → Venetian Causeway → Biscayne Boulevard / Downtown → MacArthur Causeway → South Beach. Geography, street widths and landmark placement are adapted for play; this is not a street-accurate reconstruction. The Art Deco hotel frontage is brought alongside the bay route so it can be experienced while driving.

- **15.2 km circuit**, including two uninterrupted 3.2 km causeway straights and two 1.6 km city straights (the starting line splits one of these).
- **36 m driving surface**, six lanes, broad shoulders, sidewalks, bridge parapets, road markings, reflective chevrons and overhead direction signs. All driving lanes are clear; the previous ramp/block pairs are removed. Rocket jumps and flips remain available anywhere.
- **About 731 m minimum turn radius**, with 252 m eased entries/exits. Corner curvature is within the steering envelope at the game's 156 m/s boost ceiling, with more than 20% yaw reserve. This is arcade tuning, not a road-safety or real-vehicle performance claim.
- Smoother, speed-sensitive steering; glancing barrier contacts reduce speed and align the car along the road instead of reversing it. Landing in the bay recovers to the nearest road. R continues to recover manually.
- Animated bay water, Venetian islands and villas, palms with individual leaflets, marinas and tapered yacht hulls, pastel Art Deco hotels with neon fins, window canopies and sidewalk cafes, beachfront, a dense downtown skyline, a Freedom Tower-inspired silhouette, a Bayside observation wheel, and PortMiami cranes, containers and a cruise ship.
- In-world place names provide orientation. The visible interface remains the car, speed and paint swatches. There are no external asset requests.

Scenery is batched by material and spatial cell, with distant street detail culled separately from skyline towers. Water uses a procedural shader; the road retains its actual planar reflection. Development-only `?driveAt=9900` places the car on the MacArthur straight; `?driveAt=2500` reviews Venetian Causeway. Values are circuit distance in meters. These parameters have no effect in production.

Place/architecture references: [Miami-Dade causeway transit map](https://www.miamidade.gov/resources/transportation_publicworks/existing-area-map-miami-beach.pdf), [City of Miami Beach Art Deco architecture](https://www.miamibeachfl.gov/architecture/art-deco/), and [Greater Miami's Art Deco guide](https://www.miamiandbeaches.com/things-to-do/history-and-heritage/art-deco-historic-district). These informed the setting; no reference images or third-party city models are shipped.

Validation: `npm run build` and the four `tests/roadster-{route,physics,presentation,geometry}.spec.ts` suites. Route regression checks cover loop closure, full-boost runway, curvature transitions, steering reserve, centerline/edge projection and fine steering corrections. Browser review checks the city and causeways, sustained boost, steering, barrier scraping, recovery, braking, reverse, paint, kickflip and landing. A 19-second causeway boost reached 155.94 m/s (about 349 mph), on the centerline with no crashes, at 60 fps on the review machine. Performance varies with hardware. [Production Miami Beach review](review/miami-beach.jpg).

## High-speed and braking stability

The car, chase camera, lights and contact shadow now share a pose interpolated between the 120 Hz physics steps. The chase mount follows that position directly and smooths only its relative orientation/height, with a fixed 4.8 m stand-off. This removes the world-space camera lag and speed-based prediction that made the car appear to surge under uneven frame timing. The previous follower varied its spacing by about 1.21 m at 156 m/s in a repeatable mixed-refresh simulation.

The old camera displacement is removed. Body pitch and roll ease into and out of throttle, brake and steering inputs. Braking takes visual priority when Up and Down are held together. Recovery synchronizes the interpolated pose and camera immediately, and returning from a hidden tab resets the frame clock.

Validation adds `tests/roadster-motion.spec.ts`: 30, 60, 90 and 144 Hz plus uneven refresh timing, full-speed continuity, fixed camera spacing during hard braking, recovery, angle wrapping and flip completion. All 24 Roadster tests and the production build pass. Browser checks cover full boost followed by hard braking, steering, reverse, orbit transitions, reset and kickflip landing. The read-only `cameraGapRange` telemetry reports the last two-second variation in horizontal camera spacing (steering and the initial orbit transition can intentionally change it).

## Driving effects

Speed feedback is a separate presentation layer on top of the stable chase mount. Gentle 2.2–3.7 Hz angular buffeting replaces the old high-frequency position shake. Full-boost roll stays below 0.115 degrees and pitch below 0.035 degrees; the car's projected centre moves less than half a pixel at 1440×900 in the regression check. Offsets are rebuilt from the clean camera orientation every frame and never change its position or feed into physics.

Peripheral scenery stretches progressively with speed, increasing during boost with a subtle optical colour fringe and eased four-degree field-of-view expansion. A mask follows the projected car to keep its silhouette sharp, while the central road and sky stay clear. Braking suppresses turbulence, eases away the boost blur, and adds one small, smoothly settling camera pitch/FOV response. Landing and collision feedback use a bounded pitch impulse. Recovery and orbit clear the effect state; reverse cannot trigger boost/brake presentation.

`tests/roadster-effects.spec.ts` checks refresh-rate independence, gradual boost/brake transitions, subpixel buffeting with unchanged chase spacing, and effect resets. All 28 Roadster tests pass. A full-speed causeway run followed by hard braking reported zero camera spacing variation and 53–54 fps on the review machine; hardware and scenery affect performance. The read-only `effects` telemetry exposes the presentation envelopes and offsets without adding interface controls.

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

## Glass material and lower window borders

Studied Tesla's full-resolution side, front-quarter and open-door windshield photographs again. The official page's **Gold Glazed** description identifies a copper-inspired window tint. The open-door view makes the windshield's straight central base and short diagonal corner returns particularly clear; the side and front-quarter views distinguish the lower window rail from reflections within the pane.

- Decoupled the side glass's transverse lean from the changing fender shoulder. The glazing now uses a shallow, almost ruled surface, with the painted shoulder meeting its lower rail. This removes the excessive rear flare and the associated distortion of the lower edge and reflections.
- Straightened the long rising lower side-window rail and simplified the short rear return, removing the extra control points that produced an S-shaped bend.
- Replaced the windshield's continuously bowed base with a broad straight centre and gently rounded diagonal corners. Hood, fenders, glass and the dark ceramic bond at the windshield foot follow the same boundary.
- Replaced opaque glass with thin copper-tinted dielectric transmission, sharper reflections and angle-dependent reflectivity. Corrected outward mesh winding and prevented the glazing from casting an opaque shadow over the interior. Static mesh batching preserves those shadow settings.
- Kept transmission sampling at half resolution and capture the wet-road reflection only once per frame. That faint secondary reflection uses the glass's outer reflective surface, avoiding nested transmission captures while preserving the primary glass rendering.

Detailed primary references: [Gold Glazed / open-door windshield](https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Roadster-03-Carousel-Slide-3-Desktop.jpg), [side glazing](https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Roadster-02-Pilot-Desktop.jpg), [front-quarter reflections and lower borders](https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Roadster-08-End-Desktop.jpg). These are photographic constraints, not factory CAD or measured optical specifications.

Model review renders: [window close-up](review/glass-detail-close.jpg), [front quarter](review/glass-detail-front.jpg), [side profile](review/glass-detail-side.jpg), [rear quarter](review/glass-detail-rear.jpg). Development-only `?inspect=glass&paint=1` provides the close-up camera.

Validation: production build/type check passes; all twelve geometry, physics and presentation tests pass, including new checks for bounded pane lean, minimal transverse bulging, continuous glass/paint joins, and the connected symmetric windshield base. Browser review covered the close-up, front, side and rear, with production acceleration, paint selection and night-scene reflections checked separately. The isolated production page measured approximately 56 fps on the review machine, retained the 0.58333 s launch crossing, and produced no browser console errors.

## Front glass corners, fender crest and spoiler end sections

Revisited the official front-quarter, side and open-door images, and added the [World deployed-spoiler view](https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Roadster-04-World-Desktop.jpg) and [Gravity rear view](https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Roadster-06-Gravity-Desktop.jpg) to the comparison. Close crops make the triangular front side pane and the spoiler's folded-down ends easier to distinguish from reflections.

- Corrected the cowl's plan direction: its broad centre leads the outer corners, which sweep rearward into the pillars. This supersedes the earlier description and implementation of a rearward-swept centre. Refit the windshield, adjoining hood/fenders and wiper to this shared boundary, and straightened the forward glass generators.
- Removed the transition from fender-derived curvature inside the front side-glass aperture. Its mirror-area triangle now has a consistent transverse lean without a crown or curl. The painted shoulder meets the same lower rail.
- Lowered and flattened the front fender crest, removed its extra transverse crown, and retained clearance above the wheel opening. The body no longer rises into a pronounced second hump at the pillar foot.
- Built substantial downward spoiler end sections with slanted leading edges, rising lower edges, carbon inner faces and closed edges. They nest into matching rear-quarter cutouts at rest. The exposed recess has closed inner walls, and the panel seams follow their moving or fixed surfaces.
- Revised deployment to extend 290 mm rearward with 125 mm of lift, and reduced maximum braking pitch to 0.20 radians. These are photographic model/game estimates, not claimed Tesla measurements or control logic. Articulated supports follow all three motions; reverse leaves the spoiler stowed.

Review renders: [front quarter](review/corner-spoiler-front.jpg), [glass corner and fender](review/corner-spoiler-close.jpg), [stowed spoiler](review/corner-spoiler-stowed.jpg), [deployed spoiler](review/corner-spoiler-deployed.jpg).

Validation: production build/type check passes; all sixteen Roadster geometry, physics and presentation tests pass. Added regression coverage for the formerly skipped front glass corner, cowl direction, straight forward glazing, fender clearance, flush spoiler-end fit and predominantly rearward deployment. Browser review checks stowed/deployed geometry, paint selection, driving and retraction in the production build. Reference images remain outside the repository; this is a reconstruction from photographs rather than factory CAD.
