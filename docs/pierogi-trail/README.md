# The Pierogi Trail

Standalone route: `/pierogi-trail/`. An original pixel-art, modern Texas western, inspired by the approachable side-scrolling rhythm of early platform games. One continuous level, approximately three minutes long. Unlinked from the portfolio and marked `noindex, nofollow`; the published page is still public.

## The ride

The woman from the supplied reference is interpreted as an original small pixel sprite: long golden-blonde hair with darker roots and light streaks, a dark green jacket, a smiling profile, dark trousers, and riding boots. She always remains seated on a chestnut horse with a cream blaze, leather bridle, reins, stirrups, and a stitched green saddle blanket. The source photo is not uploaded or included in the site.

The horse automatically gallops at 155 world pixels per second along a 26,700-pixel trail. Arrow Up, Space, W, tapping the scene, or the large Jump button launches a jump. Gravity is 1,000 px/s² and takeoff velocity is 500 px/s: roughly a one-second arc with a 123-pixel apex. Jump requests in the final 180 ms before landing are buffered. There is no midair double jump. P / Escape or the toolbar pauses and resumes. Hiding the tab pauses the ride; returning requires an explicit resume. The route guide pauses an active ride while open and restores it when closed.

Pierogi appear in easy ground trails and five-piece arcs over obstacles. The pickup region is intentionally generous. There is no target score and no requirement to collect every pierogi. Logs, shallow creeks, hay bales, limestone rocks, and native prickly pear are spaced more than four seconds apart. There are no enemies, weapons, damage, lives, bottomless pits, or fail states. Hitting an obstacle causes a gentle automatic step-over and 0.65 seconds at 52% speed. Food is never removed and progress never resets. The first two stumbles explain this behavior. A brief jump prompt helps with the first few jumps.

Each cave is part of the same scrolling world. Riding through its interior automatically stamps the passport, plays a short optional chime, and shows one line about the cave. No scene loading, manual entry, or dismounting. The final cave leads to a finish card with pierogi total, all seven stamps, elapsed riding time, successful jumps over obstacles, and a replay button. Replay resets the entire run.

## Route and interpretation

The seven classic show caves are ordered by approximate **straight-line distance from downtown Houston**, not driving distance, nor distance between consecutive caves:

| Stop | Cave | Area | Approx. miles from Houston | Visual signature |
| --- | --- | --- | --- | --- |
| 1 | Inner Space Cavern | Georgetown | 150 | Mint limestone columns |
| 2 | Wonder World Cave | San Marcos | 155 | Jagged Balcones Fault passage |
| 3 | Natural Bridge Caverns | New Braunfels area | 179 | Broad limestone bridge |
| 4 | Longhorn Cavern | Burnet | 189 | Smooth water-carved hall and river bands |
| 5 | Cave Without a Name | Boerne | 195 | Tall, lavender-lit cathedral columns |
| 6 | Cascade Caverns | Boerne | 198 | Animated teal waterfall and pool |
| 7 | Caverns of Sonora | Sonora | 330 | Pink and ivory crystal formations |

The scenery compresses Texas freely: Webster and the Johnson Space Center neighborhood; Houston's skyline; bluebonnet ranches and live oaks; limestone Hill Country; then a warm western desert sunset approaching Sonora. Sonora is a transition between Hill Country and desert; the exaggerated mesas are an intentional game fantasy. Cave passages are invented accessible horseback tunnels, not representations of real visitor access.

Sources, checked November 15, 2026:

- [Texas Speleological Survey show cave directory](https://www.texasspeleologicalsurvey.org/showcaves/index.php): seven-cave selection, regional locations, and geology. The individual cave pages substantiate the short descriptions.
- [The Cave Guide: caves near Houston](https://thecaveguide.com/caves-near/houston-tx): first six approximate straight-line distances and their ordering.
- [Caverns of Sonora contact page](https://www.cavernsofsonora.com/contact): published GPS coordinates 30°33.297′ N, 100°48.733′ W. Haversine distance from downtown Houston (29.7604, −95.3698) is approximately 329.7 miles.

The in-page field guide links the sources and each cave's official website. It explicitly explains the distance convention and compressed scenery.

## Sprites and scenery

All visuals are original and drawn locally in Canvas 2D. There are no downloaded art packs, generated sprite sheets, external image requests, or copied game sprites.

- **Horse and rider:** layered pixel shapes; four independently phased legs; dark hooves; tail swing; head, mane, ears, white blaze and eye; body bob; airborne tucked-leg pose; rider hair highlights, face, jacket, sleeve, hand, boot, reins, saddle, woven blanket, and stirrup. Rider and horse are one attached visual hierarchy.
- **Collectible:** a crescent-shaped golden pierogi with a dark toasted edge, pale dough highlight, and crimped seam. A lightweight matching SVG is the favicon and HUD icon.
- **Obstacles:** bark-striped log with exposed rings and branch; rippling shallow creek; bound hay bale; layered limestone boulder; flowering prickly pear pads. Their rendered heights agree with collision bounds.
- **Webster / NASA:** neighborhood houses, water tower labeled Webster, NASA Road 1 sign, a simplified Johnson Space Center building, Saturn V-inspired rocket garden.
- **Houston:** parallax skyscrapers with stepped crowns, sloping roofs, window patterns, and a Houston roadside sign.
- **Hill Country:** layered hills, live oak canopies, rail fences, scattered bluebonnets and grass, textured soil, cave signs and lamps.
- **West Texas:** a gradual warm-sky transition, setting sun, mesas, turning ranch windmills, prickly pear, and dusty golden terrain. No saguaro cactus.
- **Caves:** rocky outer facade, dark interior, layered limestone, stalactites and stalagmites, lamps, sparkles, plus the distinct signature in the table above.
- **Starship:** silver horizontal body, pointed nose, darker underside, forward and aft flaps, and warm exhaust. Flies overhead for 12 seconds of each 32-second cycle. It is decorative and never collides with the rider; it does not imply a real flight path over the caves.
- **Feedback:** collection sparkles, landing dust, gentle stumble particles, cave celebrations, compact notifications, and passport checkmarks.

The canvas uses a responsive logical resolution with pixelated scaling. Portrait mode preserves a readable horse and about two seconds of obstacle visibility; landscape and desktop show farther ahead. The mobile intro leaves the rider visible. Supported browsers can expand the game into fullscreen. Pause, sound, and jump controls remain reachable.

## Sound and accessibility

Sound starts off. Enabling it creates a Web Audio context from the user gesture. All audio is synthesized locally: a quiet original pentatonic trail melody, hoofbeats, jump tones, pierogi plinks, and a cave/finish arpeggio. Pause and mute silence the master gain. No audio files or third-party music.

Native keyboard-accessible buttons, visible focus, labeled canvas controls, semantic route list, modal field guide, polite checkpoint announcements, and focus management for start/pause/finish. Space on an ordinary button retains native activation. Reduced motion freezes the attract-screen animation and removes decorative particles/trails; essential gameplay motion remains. Canvas-unavailable and JavaScript-disabled messages are supplied. Progress is session-only; there are no cookies, analytics, saves, accounts, remote APIs, or additional runtime dependencies.

## Files and verification

- `src/pages/pierogi-trail/index.astro`: standalone markup, passport, guide, metadata.
- `src/styles/pierogi-trail.css`: cream-and-forest-green page, game controls, responsive layouts.
- `src/scripts/pierogi-trail/model.ts`: deterministic physics, obstacles, collectibles, cave order, and win condition.
- `src/scripts/pierogi-trail/art.ts`: pixel renderer, sprites, environments, cave features, Starship.
- `src/scripts/pierogi-trail/game.ts`: fixed-step loop, input, UI, sound, pause, particles, and lifecycle.
- `public/pierogi-trail/pierogi.svg`: original favicon / HUD collectible.
- `tests/pierogi-trail.spec.ts`: full no-input completion, all-obstacle jumpability, pause and input buffering, desktop controls and cave stamping, mobile taps and layout, full browser completion and clean replay.

Validate with `npm run build` and `npx playwright test tests/pierogi-trail.spec.ts`. Publish using a normal commit and push to `master`, then verify the GitHub Pages workflow and the live route.
